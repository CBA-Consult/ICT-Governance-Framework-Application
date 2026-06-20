// Gate B G-B1: Multi-Cloud Asset Register API (FR-GOV-004)
const express = require('express');
const { Pool } = require('pg');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const {
  syncAzureResources,
  upsertAsset,
  isAzureConfigured
} = require('../services/asset-discovery-sync');
const {
  ingestCasbDiscoveries,
  promoteValidationPosture
} = require('../services/casb-ingest-parser');
const { fetchAndIngestCasbDiscoveries } = require('../services/casb-polling-worker');
const { enforceJitContext } = require('../middleware/auth-jit-enforcer');
const { ingestGovernanceIncident } = require('../services/governance-incident-ingest');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function authorizeAssetSync(req, res, next) {
  const webhookSecret = process.env.ASSET_SYNC_WEBHOOK_SECRET || process.env.GOVERNANCE_WEBHOOK_SECRET;
  const headerSecret = req.headers['x-asset-sync-secret'] || req.headers['x-governance-webhook-secret'];

  if (webhookSecret && headerSecret === webhookSecret) {
    req.trustedSystemActor = true;
    return next();
  }

  authenticateToken(req, res, () => {
    requirePermissions(['governance.manage'])(req, res, next);
  });
}

function authorizeCasbIngest(req, res, next) {
  const webhookSecret = process.env.CASB_INGEST_WEBHOOK_SECRET
    || process.env.ASSET_SYNC_WEBHOOK_SECRET
    || process.env.GOVERNANCE_WEBHOOK_SECRET;
  const headerSecret = req.headers['x-casb-ingest-secret']
    || req.headers['x-asset-sync-secret']
    || req.headers['x-governance-webhook-secret'];

  if (webhookSecret && headerSecret === webhookSecret) {
    req.trustedSystemActor = true;
    return next();
  }

  authenticateToken(req, res, () => {
    requirePermissions(['governance.manage'])(req, res, next);
  });
}

/**
 * GET /api/assets
 * Retrieve governed multi-cloud assets with optional tenant/provider filtering
 */
router.get('/', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  const { tenantId, provider, drStatus, assetOrigin, validationPosture } = req.query;
  let queryText = `
    SELECT ar.*, t.name AS tenant_name
    FROM asset_register ar
    LEFT JOIN tenants t ON ar.tenant_id = t.tenant_id
  `;
  const values = [];
  const conditions = [];

  if (tenantId) {
    values.push(tenantId);
    conditions.push(`ar.tenant_id = $${values.length}`);
  }
  if (provider) {
    values.push(provider);
    conditions.push(`ar.provider = $${values.length}`);
  }
  if (drStatus) {
    values.push(drStatus);
    conditions.push(`ar.dr_status = $${values.length}`);
  }
  if (assetOrigin) {
    values.push(assetOrigin);
    conditions.push(`ar.asset_origin = $${values.length}`);
  }
  if (validationPosture) {
    values.push(validationPosture);
    conditions.push(`ar.validation_posture = $${values.length}`);
  }

  if (conditions.length) {
    queryText += ` WHERE ${conditions.join(' AND ')}`;
  }

  queryText += ' ORDER BY ar.last_discovered DESC';

  try {
    const { rows } = await pool.query(queryText, values);
    res.status(200).json({
      count: rows.length,
      assets: rows,
      attestation_timestamp: new Date().toISOString(),
      demo_mode: false
    });
  } catch (err) {
    console.error('Error fetching from asset register:', err);
    res.status(500).json({ error: 'Asset engine database query failure', details: err.message });
  }
});

/**
 * GET /api/assets/summary
 * Aggregate counts by provider and compliance state
 */
router.get('/summary', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const byProvider = await pool.query(`
      SELECT provider, COUNT(*)::int AS count
      FROM asset_register
      GROUP BY provider
      ORDER BY provider
    `);
    const byCompliance = await pool.query(`
      SELECT compliance_state, COUNT(*)::int AS count
      FROM asset_register
      GROUP BY compliance_state
      ORDER BY compliance_state
    `);
    const byDrStatus = await pool.query(`
      SELECT dr_status, COUNT(*)::int AS count
      FROM asset_register
      GROUP BY dr_status
      ORDER BY dr_status
    `);
    const byOrigin = await pool.query(`
      SELECT asset_origin, COUNT(*)::int AS count
      FROM asset_register
      GROUP BY asset_origin
      ORDER BY asset_origin
    `);
    const byValidation = await pool.query(`
      SELECT validation_posture, COUNT(*)::int AS count
      FROM asset_register
      GROUP BY validation_posture
      ORDER BY validation_posture
    `);
    const shadowIt = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM asset_register
      WHERE asset_origin = 'Shadow_IT' AND validation_posture = 'Unverified'
    `);
    const total = await pool.query('SELECT COUNT(*)::int AS count FROM asset_register');

    res.status(200).json({
      total: total.rows[0].count,
      byProvider: byProvider.rows,
      byCompliance: byCompliance.rows,
      byDrStatus: byDrStatus.rows,
      byOrigin: byOrigin.rows,
      byValidationPosture: byValidation.rows,
      unverifiedShadowIt: shadowIt.rows[0].count,
      attestation_timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching asset summary:', err);
    res.status(500).json({ error: 'Asset summary query failure', details: err.message });
  }
});

/**
 * POST /api/assets/casb-poll
 * On-demand Defender CASB discovery poll (Action 5.1)
 */
router.post('/casb-poll', authorizeCasbIngest, enforceJitContext({
  actionDescription: 'Defender CASB on-demand discovery poll'
}), async (req, res) => {
  try {
    const result = await fetchAndIngestCasbDiscoveries({
      pool,
      force: true,
      createIncident: req.body.createIncident !== false
    });

    if (result.skipped && result.reason === 'not_configured') {
      return res.status(503).json({
        error: 'Defender CASB polling is not configured',
        message: 'Set DEFENDER_CASB_API_TOKEN, Azure credentials, or CASB_POLLING_DEMO=true'
      });
    }

    res.status(200).json({
      success: true,
      ...result,
      attestation_timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Manual CASB poll failed:', err);
    res.status(500).json({ error: 'CASB polling failed', details: err.message });
  }
});

/**
 * POST /api/assets/casb-ingest
 * Ingest unmanaged CASB / API Protection shadow IT discoveries (Focus Area 5)
 */
router.post('/casb-ingest', authorizeCasbIngest, enforceJitContext({
  actionDescription: 'CASB shadow IT bulk ingest mutation',
  requireTenantScopeMatch: true
}), async (req, res) => {
  try {
    const body = {
      ...req.body,
      verificationRunId: req.body.verificationRunId || req.headers['x-verification-run-id']
    };
    const result = await ingestCasbDiscoveries(pool, body);

    if (req.body.createIncident === true && result.ingested > 0) {
      await ingestGovernanceIncident(pool, {
        body: {
          tenantId: result.tenantId,
          driftType: 'governance',
          severity: 'MEDIUM',
          externalTicketId: `CASB-INGEST-${result.ingestId}`,
          description: `CASB ingest registered ${result.ingested} shadow IT asset(s); ${result.skipped} skipped as noise.`,
          correlationId: result.ingestId,
          verificationRunId: body.verificationRunId
        }
      });
    }

    console.log(`[Focus Area 5] CASB ingest ${result.ingestId}: ${result.ingested} ingested, ${result.skipped} skipped`);

    res.status(201).json({
      success: true,
      ...result,
      attestation_timestamp: new Date().toISOString()
    });
  } catch (err) {
    if (err.message.includes('Missing tenantId') || err.message.includes('Unknown tenant')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('CASB ingest parser failure:', err);
    res.status(500).json({ error: 'CASB ingest pipeline failure', details: err.message });
  }
});

/**
 * POST /api/assets/validation/promote
 * Promote shadow IT asset from Unverified to Verified/Remediated after onboarding
 */
router.post('/validation/promote',
  authenticateToken,
  requirePermissions(['governance.manage']),
  enforceJitContext({
    actionDescription: 'CASB discovered Shadow IT infrastructure promotion to Managed track'
  }),
  async (req, res) => {
  const { assetId, validationPosture, onboardingTemplate, complianceState } = req.body;

  if (!assetId || !validationPosture) {
    return res.status(400).json({ error: 'Missing required fields: assetId, validationPosture' });
  }

  try {
    const asset = await promoteValidationPosture(pool, assetId, validationPosture, {
      onboardingTemplate,
      complianceState
    });

    res.status(200).json({
      success: true,
      promoted: true,
      asset,
      attestation_timestamp: new Date().toISOString()
    });
  } catch (err) {
    if (err.message.includes('Invalid validation') || err.message.includes('not found')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Validation promotion failure:', err);
    res.status(500).json({ error: 'Failed to promote asset validation posture', details: err.message });
  }
});

/**
 * POST /api/assets/sync
 * Upsert a single discovered asset from telemetry/discovery daemons
 */
router.post('/sync', authorizeAssetSync, enforceJitContext({
  actionDescription: 'Multi-cloud asset register telemetry sync',
  requireTenantScopeMatch: true
}), async (req, res) => {
  try {
    const result = await upsertAsset(pool, {
      assetId: req.body.assetId,
      tenantId: req.body.tenantId,
      provider: req.body.provider,
      resourceType: req.body.resourceType,
      name: req.body.name,
      location: req.body.location,
      tags: req.body.tags,
      complianceState: req.body.complianceState,
      drStatus: req.body.drStatus,
      drAuditLedgerReference: req.body.drAuditLedgerReference,
      rtoSeconds: req.body.rtoSeconds,
      rpoFlagTriggered: req.body.rpoFlagTriggered,
      lastDrDrillTimestamp: req.body.lastDrDrillTimestamp,
      verificationRunId: req.body.verificationRunId || req.headers['x-verification-run-id']
    });
    const { metricPatch, ...asset } = result;
    res.status(200).json({ success: true, asset, metricPatch });
  } catch (err) {
    if (err.message.includes('Missing mandatory') || err.message.includes('Invalid') || err.message.includes('Unknown tenant')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Failed to sync asset baseline record:', err);
    res.status(500).json({ error: 'Database write failure during asset sync execution', details: err.message });
  }
});

/**
 * POST /api/assets/sync/azure
 * Pull live resources from Azure Resource Graph into asset_register
 */
router.post('/sync/azure', authorizeAssetSync, enforceJitContext({
  actionDescription: 'Azure Resource Graph asset discovery sync',
  requireTenantScopeMatch: true
}), async (req, res) => {
  const { tenantId = 'tenant-01', subscriptionId } = req.body;

  if (!isAzureConfigured()) {
    return res.status(503).json({
      error: 'Azure management API is not configured',
      message: 'Set AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET (and optionally AZURE_SUBSCRIPTION_ID).'
    });
  }

  try {
    const result = await syncAzureResources(pool, tenantId, { subscriptionId });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('Azure asset discovery sync failed:', err);
    res.status(500).json({ error: 'Azure discovery sync failed', details: err.message });
  }
});

module.exports = router;
