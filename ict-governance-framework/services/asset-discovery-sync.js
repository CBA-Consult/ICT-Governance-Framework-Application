/**
 * Multi-cloud asset discovery sync (Azure Resource Graph)
 * Gate B G-B1 — FR-GOV-004
 */
const axios = require('axios');

const VALID_PROVIDERS = ['Azure', 'AWS', 'GCP', 'Hybrid'];
const VALID_COMPLIANCE = ['Compliant', 'NonCompliant', 'Unevaluated'];
const VALID_DR_STATUS = ['Stable', 'DR_Hydrated', 'Stale_Drill', 'Failed_Validation'];

const { handleDrillStateTransition } = require('./drill-state-metrics');
const { resolveVerificationRunId } = require('./verification-checkpoint');

function isAzureConfigured() {
  return !!(process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET);
}

async function getAzureManagementToken() {
  const tokenEndpoint = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', process.env.AZURE_CLIENT_ID);
  params.append('client_secret', process.env.AZURE_CLIENT_SECRET);
  params.append('scope', 'https://management.azure.com/.default');
  params.append('grant_type', 'client_credentials');

  const response = await axios.post(tokenEndpoint, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data.access_token;
}

/**
 * Query Azure Resource Graph and upsert into asset_register
 */
async function syncAzureResources(pool, tenantId, options = {}) {
  if (!isAzureConfigured()) {
    const error = new Error('Azure management API is not configured');
    error.code = 'AZURE_NOT_CONFIGURED';
    throw error;
  }

  const token = await getAzureManagementToken();
  const subscriptionId = options.subscriptionId || process.env.AZURE_SUBSCRIPTION_ID;
  const query = options.query || (
    subscriptionId
      ? `Resources | where subscriptionId == '${subscriptionId}' | project id, name, type, location, tags | limit 500`
      : 'Resources | project id, name, type, location, tags, subscriptionId | limit 500'
  );

  const response = await axios.post(
    'https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2021-03-01',
    { query },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  const resources = response.data?.data || [];
  const upserted = [];

  for (const resource of resources) {
    if (!resource.id || !resource.name) continue;

    const { rows } = await pool.query(
      `
      INSERT INTO asset_register (
        asset_id, tenant_id, provider, resource_type, name, location, tags, compliance_state, last_discovered
      ) VALUES ($1, $2, 'Azure', $3, $4, $5, $6, 'Unevaluated', CURRENT_TIMESTAMP)
      ON CONFLICT (asset_id) DO UPDATE SET
        name = EXCLUDED.name,
        resource_type = EXCLUDED.resource_type,
        location = EXCLUDED.location,
        tags = EXCLUDED.tags,
        last_discovered = CURRENT_TIMESTAMP
      RETURNING asset_id
      `,
      [
        resource.id,
        tenantId,
        resource.type || 'unknown',
        resource.name,
        resource.location || 'unknown',
        JSON.stringify(resource.tags || {})
      ]
    );
    upserted.push(rows[0].asset_id);
  }

  return { provider: 'Azure', discovered: resources.length, upserted: upserted.length };
}

async function upsertAsset(pool, payload) {
  const {
    assetId,
    tenantId,
    provider,
    resourceType,
    name,
    location,
    tags,
    complianceState,
    drStatus,
    drAuditLedgerReference,
    rtoSeconds,
    rpoFlagTriggered,
    lastDrDrillTimestamp,
    verificationRunId: payloadVerificationRunId
  } = payload;

  const verificationRunId = resolveVerificationRunId(payloadVerificationRunId);

  if (!assetId || !tenantId || !provider || !name) {
    throw new Error('Missing mandatory identification tracking parameters.');
  }
  if (!VALID_PROVIDERS.includes(provider)) {
    throw new Error(`Invalid provider. Use: ${VALID_PROVIDERS.join(', ')}`);
  }
  if (complianceState && !VALID_COMPLIANCE.includes(complianceState)) {
    throw new Error(`Invalid complianceState. Use: ${VALID_COMPLIANCE.join(', ')}`);
  }
  if (drStatus && !VALID_DR_STATUS.includes(drStatus)) {
    throw new Error(`Invalid drStatus. Use: ${VALID_DR_STATUS.join(', ')}`);
  }

  const tenantCheck = await pool.query('SELECT 1 FROM tenants WHERE tenant_id = $1', [tenantId]);
  if (tenantCheck.rows.length === 0) {
    throw new Error(`Unknown tenant_id: ${tenantId}`);
  }

  const { rows } = await pool.query(
    `
    INSERT INTO asset_register (
      asset_id, tenant_id, provider, resource_type, name, location, tags, compliance_state,
      dr_status, dr_audit_ledger_reference, rto_seconds, rpo_flag_triggered, last_dr_drill_timestamp,
      last_discovered, verification_run_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, $14)
    ON CONFLICT (asset_id) DO UPDATE SET
      name = EXCLUDED.name,
      resource_type = EXCLUDED.resource_type,
      location = EXCLUDED.location,
      tags = EXCLUDED.tags,
      compliance_state = EXCLUDED.compliance_state,
      dr_status = COALESCE(EXCLUDED.dr_status, asset_register.dr_status),
      dr_audit_ledger_reference = COALESCE(EXCLUDED.dr_audit_ledger_reference, asset_register.dr_audit_ledger_reference),
      rto_seconds = COALESCE(EXCLUDED.rto_seconds, asset_register.rto_seconds),
      rpo_flag_triggered = COALESCE(EXCLUDED.rpo_flag_triggered, asset_register.rpo_flag_triggered),
      last_dr_drill_timestamp = COALESCE(EXCLUDED.last_dr_drill_timestamp, asset_register.last_dr_drill_timestamp),
      last_discovered = CURRENT_TIMESTAMP,
      verification_run_id = COALESCE(EXCLUDED.verification_run_id, asset_register.verification_run_id)
    RETURNING *
    `,
    [
      assetId,
      tenantId,
      provider,
      resourceType || 'unknown',
      name,
      location || 'unknown',
      JSON.stringify(tags || {}),
      complianceState || 'Unevaluated',
      drStatus || 'Stable',
      drAuditLedgerReference || null,
      rtoSeconds ?? null,
      rpoFlagTriggered ?? false,
      lastDrDrillTimestamp || (drStatus === 'DR_Hydrated' ? new Date().toISOString() : null),
      verificationRunId
    ]
  );

  const asset = rows[0];
  let metricPatch = null;
  if (drStatus === 'DR_Hydrated') {
    metricPatch = await handleDrillStateTransition(pool, assetId, drStatus);
  }

  return { ...asset, metricPatch };
}

module.exports = {
  VALID_PROVIDERS,
  VALID_COMPLIANCE,
  VALID_DR_STATUS,
  isAzureConfigured,
  syncAzureResources,
  upsertAsset
};
