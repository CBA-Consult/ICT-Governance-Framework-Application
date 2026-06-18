// Gate A: Live compliance posture & Sentinel/SIEM incident ingestion API
const express = require('express');
const { Pool } = require('pg');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const {
  AUTOMATION_METRIC,
  handleDrillStateTransition,
  getMetricSnapshot
} = require('../services/drill-state-metrics');
const { enforceJitContext } = require('../middleware/auth-jit-enforcer');
const { enrichIncidentWithSla } = require('../services/governance-sla');
const { ingestGovernanceIncident } = require('../services/governance-incident-ingest');
const { patchIncidentStatus } = require('../services/governance-incident-lifecycle');
const { getIncidentTimeline } = require('../services/governance-incident-timeline');
const { listMitreFairMappings } = require('../services/mitre-enrichment');
const { getExecutiveMetrics } = require('../services/governance-executive-metrics');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function authorizeIncidentIngestion(req, res, next) {
  const webhookSecret = process.env.GOVERNANCE_WEBHOOK_SECRET;
  const headerSecret = req.headers['x-governance-webhook-secret'];

  if (webhookSecret && headerSecret === webhookSecret) {
    req.trustedSystemActor = true;
    return next();
  }

  authenticateToken(req, res, () => {
    requirePermissions(['compliance.manage'])(req, res, next);
  });
}

/**
 * GET /api/governance/posture
 * Live framework implementation status (Focus Area 1 — Actions 1.1 / 1.2)
 */
router.get('/posture', authenticateToken, requirePermissions(['compliance.read']), async (req, res) => {
  try {
    const summaryResult = await pool.query(`
      SELECT
        implementation_status,
        COUNT(*)::int AS count,
        ROUND((COUNT(*)::numeric / NULLIF(SUM(COUNT(*)) OVER (), 0)) * 100, 1) AS percentage
      FROM compliance_controls
      GROUP BY implementation_status
      ORDER BY implementation_status
    `);

    const controlsResult = await pool.query(`
      SELECT * FROM compliance_controls ORDER BY category, control_id ASC
    `);

    res.status(200).json({
      summary: summaryResult.rows,
      controls: controlsResult.rows,
      demo_mode: false,
      attestation_timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching real-time compliance posture data:', err);
    res.status(500).json({ error: 'Database query execution failure', details: err.message });
  }
});

/**
 * GET /api/governance/incidents
 * Recent governance drift / Sentinel incidents (Focus Area 2)
 */
router.get('/incidents', authenticateToken, requirePermissions(['compliance.read']), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const { rows } = await pool.query(`
      SELECT
        gi.*,
        t.name AS tenant_name,
        ar.name AS asset_name,
        ar.provider AS asset_provider,
        ar.compliance_state AS asset_compliance_state,
        ar.location AS asset_location
      FROM governance_incidents gi
      LEFT JOIN tenants t ON gi.tenant_id = t.tenant_id
      LEFT JOIN asset_register ar ON gi.asset_id = ar.asset_id
      ORDER BY gi.detected_at DESC
      LIMIT $1
    `, [limit]);

    res.status(200).json({
      incidents: rows.map(enrichIncidentWithSla),
      count: rows.length,
      attestation_timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching governance incidents:', err);
    res.status(500).json({ error: 'Failed to fetch incidents', details: err.message });
  }
});

/**
 * POST /api/governance/incidents
 * Ingest and correlate Sentinel/SIEM alerts — triggers event-driven FAIR recalculation
 */
router.post('/incidents', authorizeIncidentIngestion, enforceJitContext({
  actionDescription: 'Governance drift / Sentinel incident ingestion',
  requireTenantScopeMatch: true
}), async (req, res) => {
  try {
    const result = await ingestGovernanceIncident(pool, {
      body: req.body,
      headers: req.headers
    });

    if (!result.incident.external_ticket_id || result.incident.external_ticket_id === 'SENTINEL_AUTO_OPEN') {
      console.log(`[Gate A Automation Trigger] Dispatching Incident ID ${result.incident.incident_id} to external ITSM REST API.`);
    }

    res.status(201).json({
      success: true,
      correlated: result.correlated,
      correlation_id: result.correlationId,
      incident: result.incident,
      mitre: result.mitre,
      fair_scenario_id: result.incident.fair_scenario_id || result.mitre?.fair_scenario_id || null,
      fair_recalculation: result.fairRecalculation
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Failed to parse incoming adverse event correlation:', err);
    res.status(500).json({ error: 'Internal pipeline logging failure', details: err.message });
  }
});

/**
 * GET /api/governance/executive/metrics
 * G-A2 — live CISO metrics: incidents, FAIR ALE, telemetry drivers, compliance posture
 */
router.get('/executive/metrics', authenticateToken, requirePermissions(['compliance.read']), async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const metrics = await getExecutiveMetrics({ days });
    res.status(200).json(metrics);
  } catch (err) {
    console.error('Failed to fetch executive governance metrics:', err);
    res.status(500).json({ error: 'Failed to fetch executive metrics', details: err.message });
  }
});

/**
 * GET /api/governance/mitre/mappings
 * Audit-facing MITRE → FAIR mapping table (Step 3.2)
 */
router.get('/mitre/mappings', authenticateToken, requirePermissions(['compliance.read']), async (req, res) => {
  try {
    const mappings = await listMitreFairMappings(pool);
    res.status(200).json({
      mappings,
      count: mappings.length,
      selection_logic: 'technique-first, then tactic fallback; highest severity_weight wins in FAIR sweep',
      attestation_timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to fetch MITRE → FAIR mappings:', err);
    res.status(500).json({ error: 'Failed to fetch MITRE mappings', details: err.message });
  }
});

/**
 * GET /api/governance/incidents/:incidentId/timeline
 * Unified IR timeline — incident_detected, status_change, risk_updated (Sprint B)
 */
router.get('/incidents/:incidentId/timeline', authenticateToken, requirePermissions(['compliance.read']), async (req, res) => {
  try {
    const timeline = await getIncidentTimeline(req.params.incidentId);
    res.status(200).json(timeline);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Failed to fetch incident timeline:', err);
    res.status(500).json({ error: 'Failed to fetch incident timeline', details: err.message });
  }
});

/**
 * PATCH /api/governance/incidents/:incidentId
 * State-driven lifecycle: Detected → Acknowledged → Remediating → Resolved
 */
router.patch('/incidents/:incidentId', authenticateToken, requirePermissions(['compliance.manage']), enforceJitContext({
  actionDescription: 'Governance incident lifecycle status transition'
}), async (req, res) => {
  const { status, resolutionNotes, correlationId } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Missing required field: status' });
  }

  try {
    const result = await patchIncidentStatus(pool, {
      incidentId: req.params.incidentId,
      status,
      resolutionNotes,
      correlationId,
      actor: req.user?.username || String(req.user?.user_id || 'unknown')
    });

    res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Incident lifecycle patch failed:', err);
    res.status(500).json({ error: 'Failed to update incident status', details: err.message });
  }
});

/**
 * GET /api/governance/measurement-plan/:metricCode
 * Executive KPI snapshot for A004 measurement plan tracking
 */
router.get('/measurement-plan/:metricCode', authenticateToken, requirePermissions(['compliance.read']), async (req, res) => {
  try {
    const metric = await getMetricSnapshot(pool, req.params.metricCode);
    if (!metric) {
      return res.status(404).json({ error: 'Metric snapshot not found' });
    }
    res.status(200).json({ metric, attestation_timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Error fetching measurement plan metric:', err);
    res.status(500).json({ error: 'Failed to fetch metric snapshot', details: err.message });
  }
});

/**
 * POST /api/governance/measurement-plan/patch
 * Patch automation baseline verification weight (DR_Hydrated transitions)
 */
router.post('/measurement-plan/patch', authenticateToken, requirePermissions(['compliance.manage']), enforceJitContext({
  actionDescription: 'Executive measurement plan KPI mutation'
}), async (req, res) => {
  const { metricCode, incrementValue, context, assetId, newState } = req.body;

  if (newState && newState !== 'DR_Hydrated') {
    return res.status(200).json({ success: true, patched: false, reason: 'No patch for this state' });
  }

  try {
    if (assetId) {
      const result = await handleDrillStateTransition(pool, assetId, newState || 'DR_Hydrated', context);
      return res.status(200).json({ success: true, ...result });
    }

    const code = metricCode || AUTOMATION_METRIC;
    const increment = Number(incrementValue) || 1.2;
    const patchContext = context || `Manual measurement-plan patch for ${code}`;
    const { rows } = await pool.query(
      `
      INSERT INTO governance_metric_snapshots (metric_code, current_value, target_value, last_context)
      VALUES ($1, LEAST($2, 100), 85, $3)
      ON CONFLICT (metric_code) DO UPDATE SET
        current_value = LEAST(governance_metric_snapshots.current_value + $2, 100),
        last_updated = CURRENT_TIMESTAMP,
        last_context = $3
      RETURNING *
      `,
      [code, increment, patchContext]
    );

    res.status(200).json({ success: true, patched: true, metric: rows[0] });
  } catch (err) {
    console.error('Error patching measurement plan metric:', err);
    res.status(500).json({ error: 'Failed to patch metric snapshot', details: err.message });
  }
});

module.exports = router;
