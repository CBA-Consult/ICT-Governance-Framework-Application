/**
 * Governance incident ingestion — SecOps loop entry point with audit lineage + FAIR trigger
 */
const crypto = require('crypto');
const { computeFairExposure } = require('./fair-risk-engine');
const {
  logIncidentDetectedEvent,
  logRiskUpdatedEvent
} = require('./governance-incident-timeline');
const {
  extractMitreFromPayload,
  resolveMitreFairMapping,
  buildMitreResponse
} = require('./mitre-enrichment');

const VALID_DRIFT_TYPES = [
  'governance', 'architectural', 'process', 'documentation', 'observability', 'security'
];

const VALID_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const SENTINEL_SEVERITY_MAP = {
  High: 'HIGH',
  Medium: 'MEDIUM',
  Low: 'LOW',
  Informational: 'LOW'
};

function mapSentinelSeverity(value) {
  if (!value) return 'HIGH';
  const upper = String(value).toUpperCase();
  if (VALID_SEVERITIES.includes(upper)) return upper;
  return SENTINEL_SEVERITY_MAP[value] || 'HIGH';
}

function extractIncidentFields(body) {
  if (body.tenantId && body.driftType && body.severity && body.description) {
    return {
      tenantId: body.tenantId,
      driftType: body.driftType,
      severity: body.severity,
      description: body.description,
      externalTicketId: body.externalTicketId,
      assetId: body.assetId
    };
  }

  const properties = body.properties || body.Properties || {};
  const entities = body.entities || body.Entities || properties.entities || [];
  const resourceEntity = Array.isArray(entities)
    ? entities.find((e) => e.resourceId || e.ResourceId || e.id)
    : null;

  const resourceId = body.assetId
    || properties.resourceId
    || properties.ResourceId
    || resourceEntity?.resourceId
    || resourceEntity?.ResourceId
    || resourceEntity?.id;

  return {
    tenantId: body.tenantId || body.tenant_id || process.env.DEFAULT_TENANT_ID || 'tenant-01',
    driftType: body.driftType || 'security',
    severity: mapSentinelSeverity(properties.severity || properties.Severity || body.severity),
    description: properties.description || properties.title || properties.Description || body.description || 'Sentinel adverse event',
    externalTicketId: body.externalTicketId || properties.incidentNumber || properties.IncidentNumber || 'SENTINEL_AUTO_OPEN',
    assetId: resourceId
  };
}

async function correlateAsset(pool, assetId) {
  if (!assetId) {
    return { verifiedAssetId: null, extendedDescription: '' };
  }

  const assetCheck = await pool.query(
    'SELECT name, provider, compliance_state FROM asset_register WHERE asset_id = $1',
    [assetId]
  );

  if (assetCheck.rows.length === 0) {
    console.warn(`[Sentinel Webhook Warning] Incident reported against unrecognized Asset ID: ${assetId}`);
    return { verifiedAssetId: null, extendedDescription: '' };
  }

  const asset = assetCheck.rows[0];
  let extendedDescription = ` [Correlated Asset: ${asset.name} on ${asset.provider} | State: ${asset.compliance_state}]`;

  if (asset.compliance_state === 'NonCompliant') {
    extendedDescription += ' WARNING: Target asset was already in a degraded compliance state.';
  }

  return { verifiedAssetId: assetId, extendedDescription, asset };
}

async function getCurrentEnterpriseAle(pool) {
  try {
    const { rows } = await pool.query(
      'SELECT COALESCE(SUM(current_ale_usd), 0) AS total FROM fair_risk_scenarios'
    );
    return parseFloat(rows[0]?.total || 0);
  } catch (err) {
    if (err.code === '42P01') return null;
    throw err;
  }
}

async function logIncidentIngest(pool, { correlationId, incidentId, rawPayload, processedFields }) {
  try {
    await pool.query(
      `
      INSERT INTO governance_incident_ingest_log (correlation_id, incident_id, raw_payload, processed_fields)
      VALUES ($1, $2, $3, $4)
      `,
      [correlationId, incidentId, rawPayload, processedFields]
    );
  } catch (err) {
    if (err.code !== '42P01') throw err;
    console.warn('[SecOps] governance_incident_ingest_log unavailable — run setup-incident-secops-controls');
  }
}

async function triggerFairRecalculation(pool, { correlationId, incidentId, severity }) {
  const aleBeforeUsd = await getCurrentEnterpriseAle(pool);
  if (aleBeforeUsd == null) return null;

  try {
    const result = await computeFairExposure({
      correlationId,
      triggerSource: 'incident',
      incidentId,
      aleBeforeUsd
    });
    console.log(
      `[FAIR Event] Incident ${incidentId} (${severity}) triggered recalc. ` +
      `ALE: $${aleBeforeUsd.toLocaleString()} → $${result.total_enterprise_ale_usd.toLocaleString()} ` +
      `[correlation_id=${correlationId}]`
    );
    return result;
  } catch (err) {
    console.error(`[FAIR Event] Recalculation failed for incident ${incidentId}:`, err.message);
    return null;
  }
}

async function ingestGovernanceIncident(pool, { body, correlationId: incomingCorrelationId, headers = {} }) {
  const fields = extractIncidentFields(body);
  const { tenantId, driftType, severity, description, externalTicketId, assetId } = fields;

  if (!tenantId || !driftType || !severity || !description) {
    const error = new Error('Missing required fields: tenantId, driftType, severity, description');
    error.statusCode = 400;
    throw error;
  }

  if (!VALID_DRIFT_TYPES.includes(driftType)) {
    const error = new Error('Provided drift type falls outside official drift taxonomy.');
    error.statusCode = 400;
    throw error;
  }

  if (!VALID_SEVERITIES.includes(severity)) {
    const error = new Error('Invalid severity. Use CRITICAL, HIGH, MEDIUM, or LOW.');
    error.statusCode = 400;
    throw error;
  }

  const tenantCheck = await pool.query('SELECT 1 FROM tenants WHERE tenant_id = $1', [tenantId]);
  if (tenantCheck.rows.length === 0) {
    const error = new Error(`Unknown tenant_id: ${tenantId}`);
    error.statusCode = 400;
    throw error;
  }

  const correlationId = incomingCorrelationId
    || body.correlationId
    || headers['x-correlation-id']
    || crypto.randomUUID();

  const { verifiedAssetId, extendedDescription } = await correlateAsset(pool, assetId);
  const fullDescription = description + (extendedDescription || '');

  const mitre = extractMitreFromPayload(body);
  const fairMapping = await resolveMitreFairMapping(pool, mitre);
  const fairScenarioId = fairMapping?.scenario_id || null;

  const { rows } = await pool.query(
    `
    INSERT INTO governance_incidents (
      tenant_id, external_ticket_id, drift_type, severity, description, asset_id, status, correlation_id,
      mitre_tactic, mitre_technique, mitre_technique_name, fair_scenario_id,
      mitre_severity_weight, mitre_mapping_confidence
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'Detected', $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
    `,
    [
      tenantId,
      externalTicketId || 'SENTINEL_AUTO_OPEN',
      driftType,
      severity,
      fullDescription,
      verifiedAssetId,
      correlationId,
      mitre?.tactic || null,
      mitre?.technique || null,
      mitre?.technique_name || fairMapping?.technique_name || null,
      fairScenarioId,
      fairMapping?.severity_weight ?? null,
      fairMapping?.confidence_score ?? null
    ]
  );

  const incident = rows[0];

  await logIncidentIngest(pool, {
    correlationId,
    incidentId: incident.incident_id,
    rawPayload: body,
    processedFields: {
      ...fields,
      verifiedAssetId,
      correlationId,
      mitre: mitre ? buildMitreResponse({ ...mitre, ...incident, fair_scenario_id: fairScenarioId }) : null,
      fair_mapping: fairMapping
    }
  });

  console.log(
    `[G-B2 Traceability] Incident ID ${incident.incident_id} bound to Asset ID: ${verifiedAssetId || 'None'} ` +
    `[correlation_id=${correlationId}]`
  );

  await logIncidentDetectedEvent(pool, { incident, correlationId, actor: 'ingest' });

  const fairResult = await triggerFairRecalculation(pool, {
    correlationId,
    incidentId: incident.incident_id,
    severity
  });

  if (fairResult) {
    await logRiskUpdatedEvent(pool, {
      incidentId: incident.incident_id,
      correlationId,
      triggerSource: 'incident',
      aleBeforeUsd: fairResult.ale_before_usd,
      aleAfterUsd: fairResult.total_enterprise_ale_usd
    });
  }

  return {
    incident,
    correlated: verifiedAssetId !== null,
    correlationId,
    mitre: buildMitreResponse(incident),
    fairRecalculation: fairResult
      ? {
          ale_before_usd: fairResult.ale_before_usd,
          ale_after_usd: fairResult.total_enterprise_ale_usd,
          risk_delta_usd: fairResult.total_enterprise_ale_usd - (fairResult.ale_before_usd || 0)
        }
      : null
  };
}

module.exports = {
  VALID_DRIFT_TYPES,
  VALID_SEVERITIES,
  extractIncidentFields,
  extractMitreFromPayload,
  correlateAsset,
  ingestGovernanceIncident,
  triggerFairRecalculation
};
