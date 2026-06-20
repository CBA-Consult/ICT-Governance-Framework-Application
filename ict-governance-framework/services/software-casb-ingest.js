/**
 * Software pillar CASB ingest — external SaaS discovery with device linkage and SecOps bridge.
 */
const { randomUUID } = require('crypto');
const { ingestCasbDiscoveries } = require('./casb-ingest-parser');
const { ingestGovernanceIncident } = require('./governance-incident-ingest');
const { resolveVerificationRunId } = require('./verification-checkpoint');

const RISK_LEVEL_TO_SCORE = {
  low: 25,
  medium: 55,
  high: 85,
  critical: 95
};

const HIGH_RISK_LEVELS = new Set(['high', 'critical']);
const DEFAULT_TENANT = 'tenant-01';

function resolveWebhookSecret() {
  return (
    process.env.SOFTWARE_INGEST_WEBHOOK_SECRET ||
    process.env.CASB_INGEST_WEBHOOK_SECRET ||
    process.env.GOVERNANCE_WEBHOOK_SECRET ||
    null
  );
}

function validateWebhookSignature(headerSecret) {
  const expected = resolveWebhookSecret();
  if (!expected) {
    return { ok: false, reason: 'not_configured' };
  }
  if (headerSecret === expected) {
    return { ok: true };
  }
  return { ok: false, reason: 'invalid' };
}

function normalizeRiskLevel(raw) {
  const level = String(raw || 'medium').toLowerCase();
  if (!RISK_LEVEL_TO_SCORE[level]) {
    return { ok: false, error: 'Invalid risk level' };
  }
  return { ok: true, level, score: RISK_LEVEL_TO_SCORE[level] };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/**
 * @returns {{ status: number, body: object }}
 */
async function ingestSoftwareCasbEvent(pool, payload = {}, options = {}) {
  const appName = payload.appName?.trim();
  const userId = payload.userId?.trim();
  const deviceId = payload.deviceId?.trim() || null;
  const tenantId = payload.tenantId?.trim() || DEFAULT_TENANT;

  if (!appName) {
    return { status: 400, body: { error: 'Missing required field: appName' } };
  }
  if (!userId) {
    return { status: 400, body: { error: 'Missing required field: userId' } };
  }

  const risk = normalizeRiskLevel(payload.riskLevel);
  if (!risk.ok) {
    return { status: 400, body: { error: risk.error } };
  }

  const tenantCheck = await pool.query('SELECT 1 FROM tenants WHERE tenant_id = $1', [tenantId]);
  if (!tenantCheck.rows.length) {
    return { status: 400, body: { error: 'Unknown tenant' } };
  }

  if (deviceId) {
    const deviceCheck = await pool.query(
      'SELECT device_id FROM managed_devices WHERE device_id = $1',
      [deviceId]
    );
    if (!deviceCheck.rows.length) {
      return { status: 404, body: { error: 'Device not found' } };
    }
  }

  const eventId = `SW-${randomUUID()}`;
  const externalId = `software-${slugify(appName)}-${Date.now()}`;
  const verificationRunId = resolveVerificationRunId(payload.verificationRunId);

  const casbResult = await ingestCasbDiscoveries(pool, {
    tenantId,
    source: 'Software Pillar CASB',
    discoveries: [
      {
        externalId,
        name: appName,
        appName,
        riskScore: risk.score,
        users: 1,
        sanctioned: false,
        category: 'SaaS.Application',
        serviceUrl: payload.serviceUrl || `https://${slugify(appName)}.example`
      }
    ]
  });

  const asset = casbResult.assets[0] || null;

  await pool.query(
    `
    INSERT INTO software_casb_events (
      event_id, tenant_id, app_name, user_id, device_id,
      risk_level, risk_score, asset_id, ingest_id, verification_run_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      eventId,
      tenantId,
      appName,
      userId,
      deviceId,
      risk.level,
      risk.score,
      asset?.asset_id || null,
      casbResult.ingestId,
      verificationRunId
    ]
  );

  let incident = null;
  if (HIGH_RISK_LEVELS.has(risk.level)) {
    const ingested = await ingestGovernanceIncident(pool, {
      body: {
        tenantId,
        driftType: 'security',
        severity: risk.level === 'critical' ? 'CRITICAL' : 'HIGH',
        description:
          `High-risk shadow software detected: ${appName} used by ${userId}` +
          (deviceId ? ` on device ${deviceId}` : ''),
        externalTicketId: `SW-CASB-${eventId}`,
        assetId: asset?.asset_id || null,
        verificationRunId
      },
      headers: options.headers || {}
    });
    incident = {
      incidentId: ingested.incident.incident_id,
      externalTicketId: `SW-CASB-${eventId}`,
      severity: risk.level === 'critical' ? 'CRITICAL' : 'HIGH'
    };
  }

  return {
    status: 201,
    body: {
      id: eventId,
      appName,
      userId,
      deviceId,
      riskLevel: risk.level,
      riskScore: risk.score,
      assetId: asset?.asset_id || null,
      ingestId: casbResult.ingestId,
      incident
    }
  };
}

module.exports = {
  RISK_LEVEL_TO_SCORE,
  HIGH_RISK_LEVELS,
  resolveWebhookSecret,
  validateWebhookSignature,
  ingestSoftwareCasbEvent
};
