/**
 * CASB / API Protection shadow IT discovery parser (Focus Area 5)
 * Normalizes high-velocity multi-tenant CASB payloads into asset_register rows.
 */
const { randomUUID } = require('crypto');
const { resolveVerificationRunId } = require('./verification-checkpoint');

const NOISE_BLOCKLIST = new Set([
  'microsoft.com',
  'office.com',
  'windows.net',
  'azure.com',
  'login.microsoftonline.com'
]);

const MIN_RISK_SCORE = Number(process.env.CASB_MIN_RISK_SCORE || 0);

function sanitizeString(value, maxLen = 255) {
  if (value == null) return null;
  return String(value).trim().slice(0, maxLen);
}

function extractHostname(url) {
  if (!url) return null;
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.toLowerCase();
  } catch {
    return sanitizeString(url, 120)?.toLowerCase() || null;
  }
}

function isNoiseDiscovery(discovery) {
  const name = sanitizeString(discovery.name, 500)?.toLowerCase();
  if (!name) return { skip: true, reason: 'missing_name' };

  const host = extractHostname(discovery.serviceUrl || discovery.appUrl || discovery.url);
  if (host && NOISE_BLOCKLIST.has(host)) {
    return { skip: true, reason: 'platform_noise' };
  }

  if (discovery.sanctioned === true || discovery.isSanctioned === true) {
    return { skip: true, reason: 'sanctioned_app' };
  }

  const risk = Number(discovery.riskScore ?? discovery.risk_score ?? discovery.score ?? 0);
  if (risk < MIN_RISK_SCORE) {
    return { skip: true, reason: 'below_risk_threshold' };
  }

  return { skip: false };
}

function mapProvider(discovery) {
  const raw = sanitizeString(discovery.provider || discovery.cloudProvider || discovery.platform, 50);
  const allowed = ['Azure', 'AWS', 'GCP', 'Hybrid'];
  if (raw && allowed.includes(raw)) return raw;
  return 'Hybrid';
}

function buildAssetId(tenantId, externalId) {
  const safeExternal = sanitizeString(externalId, 180).replace(/[^a-zA-Z0-9._-]/g, '-');
  return `/tenants/${tenantId}/casb/shadow/${safeExternal}`;
}

function normalizeDiscovery(raw, tenantId) {
  const externalId = sanitizeString(
    raw.externalId || raw.id || raw.appId || raw.discoveryId || raw.name,
    180
  );
  const name = sanitizeString(raw.name || raw.appName || raw.serviceName, 255);
  const serviceUrl = sanitizeString(raw.serviceUrl || raw.appUrl || raw.url, 500);

  return {
    externalId,
    name,
    serviceUrl,
    resourceType: sanitizeString(raw.resourceType || raw.type || 'SaaS.Application', 100),
    provider: mapProvider(raw),
    riskScore: Number(raw.riskScore ?? raw.risk_score ?? raw.score ?? 50),
    category: sanitizeString(raw.category || raw.appCategory, 100),
    userCount: Number(raw.users ?? raw.userCount ?? raw.activeUsers ?? 0),
    trafficBytes: Number(raw.trafficBytes ?? raw.bytes ?? 0),
    sanctioned: raw.sanctioned === true || raw.isSanctioned === true,
    discoveredAt: raw.discoveredAt || raw.discovered_at || raw.timestamp || new Date().toISOString(),
    tenantId: sanitizeString(raw.tenantId, 50) || tenantId
  };
}

function extractDiscoveries(body) {
  if (Array.isArray(body.discoveries)) return body.discoveries;
  if (Array.isArray(body.events)) return body.events;
  if (Array.isArray(body.records)) return body.records;
  if (Array.isArray(body.data)) return body.data;
  if (body.discovery) return [body.discovery];
  return [];
}

function normalizeCasbPayload(body) {
  const tenantId = sanitizeString(body.tenantId || body.tenant_id, 50);
  const source = sanitizeString(body.source || body.sourcePlatform || body.platform, 100)
    || 'CASB';

  return {
    tenantId,
    source,
    discoveries: extractDiscoveries(body).map((item) => normalizeDiscovery(item, tenantId)),
    createIncident: body.createIncident === true,
    verificationRunId: resolveVerificationRunId(body.verificationRunId)
  };
}

function toAssetRecord(discovery, sourcePlatform) {
  const assetId = buildAssetId(discovery.tenantId, discovery.externalId);

  return {
    assetId,
    tenantId: discovery.tenantId,
    provider: discovery.provider,
    resourceType: discovery.resourceType,
    name: discovery.name,
    location: 'global',
    tags: {
      environment: 'shadow-it',
      'casb-category': discovery.category || 'unknown',
      'casb-source': sourcePlatform,
      'user-count': discovery.userCount,
      'traffic-bytes': discovery.trafficBytes,
      ...(discovery.serviceUrl ? { 'service-url': discovery.serviceUrl } : {})
    },
    complianceState: 'Unevaluated',
    assetOrigin: 'Shadow_IT',
    validationPosture: 'Unverified',
    casbSourceId: discovery.externalId,
    casbDiscoveredAt: discovery.discoveredAt,
    casbRiskScore: discovery.riskScore
  };
}

async function upsertShadowAsset(pool, record) {
  const { rows } = await pool.query(
    `
    INSERT INTO asset_register (
      asset_id, tenant_id, provider, resource_type, name, location, tags, compliance_state,
      asset_origin, validation_posture, casb_source_id, casb_discovered_at, casb_risk_score,
      last_discovered, verification_run_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, $14)
    ON CONFLICT (asset_id) DO UPDATE SET
      name = EXCLUDED.name,
      resource_type = EXCLUDED.resource_type,
      tags = EXCLUDED.tags,
      casb_risk_score = EXCLUDED.casb_risk_score,
      casb_discovered_at = EXCLUDED.casb_discovered_at,
      last_discovered = CURRENT_TIMESTAMP,
      verification_run_id = COALESCE(EXCLUDED.verification_run_id, asset_register.verification_run_id),
      validation_posture = CASE
        WHEN asset_register.validation_posture IN ('Verified', 'Remediated') THEN asset_register.validation_posture
        ELSE EXCLUDED.validation_posture
      END
    RETURNING *
    `,
    [
      record.assetId,
      record.tenantId,
      record.provider,
      record.resourceType,
      record.name,
      record.location,
      JSON.stringify(record.tags),
      record.complianceState,
      record.assetOrigin,
      record.validationPosture,
      record.casbSourceId,
      record.casbDiscoveredAt,
      record.casbRiskScore,
      record.verificationRunId || null
    ]
  );
  return rows[0];
}

async function promoteValidationPosture(pool, assetId, nextPosture, options = {}) {
  const allowed = ['Unverified', 'Under_Review', 'Verified', 'Remediated', 'Rejected'];
  if (!allowed.includes(nextPosture)) {
    throw new Error(`Invalid validation posture. Use: ${allowed.join(', ')}`);
  }

  const complianceState = nextPosture === 'Verified' || nextPosture === 'Remediated'
    ? (options.complianceState || 'Compliant')
    : 'Unevaluated';

  const assetOrigin = nextPosture === 'Verified' || nextPosture === 'Remediated'
    ? 'Managed'
    : undefined;

  const { rows } = await pool.query(
    `
    UPDATE asset_register
    SET
      validation_posture = $2,
      compliance_state = $3,
      asset_origin = COALESCE($4, asset_origin),
      tags = tags || $5::jsonb,
      last_discovered = CURRENT_TIMESTAMP
    WHERE asset_id = $1
    RETURNING *
    `,
    [
      assetId,
      nextPosture,
      complianceState,
      assetOrigin || null,
      JSON.stringify({
        'onboarding-template': options.onboardingTemplate || null,
        'verified-at': (nextPosture === 'Verified' ? new Date().toISOString() : null)
      })
    ]
  );

  if (!rows.length) {
    throw new Error(`Asset not found: ${assetId}`);
  }

  return rows[0];
}

async function ingestCasbDiscoveries(pool, body) {
  const payload = normalizeCasbPayload(body);
  if (!payload.tenantId) {
    throw new Error('Missing tenantId in CASB ingest payload');
  }

  const tenantCheck = await pool.query('SELECT 1 FROM tenants WHERE tenant_id = $1', [payload.tenantId]);
  if (tenantCheck.rows.length === 0) {
    throw new Error(`Unknown tenant_id: ${payload.tenantId}`);
  }

  const ingestId = `casb-${randomUUID()}`;
  const ingested = [];
  const skipped = [];

  for (const raw of payload.discoveries) {
    const discovery = normalizeDiscovery(raw, payload.tenantId);
    const noise = isNoiseDiscovery(discovery);
    if (noise.skip) {
      skipped.push({ name: discovery.name, reason: noise.reason, externalId: discovery.externalId });
      continue;
    }

    const record = toAssetRecord(discovery, payload.source);
    record.verificationRunId = payload.verificationRunId;
    const asset = await upsertShadowAsset(pool, record);
    ingested.push(asset);
  }

  await pool.query(
    `
    INSERT INTO casb_ingest_audit (
      ingest_id, tenant_id, source_platform, received_count, ingested_count, skipped_count, ingest_payload,
      verification_run_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      ingestId,
      payload.tenantId,
      payload.source,
      payload.discoveries.length,
      ingested.length,
      skipped.length,
      JSON.stringify({ source: payload.source, sampleCount: payload.discoveries.length }),
      payload.verificationRunId
    ]
  );

  return {
    ingestId,
    tenantId: payload.tenantId,
    source: payload.source,
    received: payload.discoveries.length,
    ingested: ingested.length,
    skipped: skipped.length,
    assets: ingested,
    skippedDetails: skipped
  };
}

module.exports = {
  NOISE_BLOCKLIST,
  normalizeCasbPayload,
  normalizeDiscovery,
  isNoiseDiscovery,
  toAssetRecord,
  ingestCasbDiscoveries,
  promoteValidationPosture
};
