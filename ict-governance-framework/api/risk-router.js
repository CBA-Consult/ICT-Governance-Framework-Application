/**
 * FR-GOV-005: Live FAIR quantitative risk API (GV.RM)
 */
const express = require('express');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const { enforceJitContext } = require('../middleware/auth-jit-enforcer');
const { computeFairExposure, getFairExposureSummary, pool } = require('../services/fair-risk-engine');
const {
  runCalibration,
  getCalibrationStatus,
  getCalibrationLog,
  getPendingApprovals,
  approveCalibration,
  rejectCalibration,
  rollbackCalibration,
  setScenarioCalibrationLock
} = require('../services/fair-risk-calibration');
const { refreshMappingCache } = require('../services/mitre-enrichment');

const router = express.Router();

/**
 * GET /api/governance/risk/exposure
 * FAIR scenario ALE ledger for executive / compliance dashboards
 */
router.get('/exposure', authenticateToken, requirePermissions(['compliance.read']), async (req, res) => {
  try {
    const summary = await getFairExposureSummary();
    res.status(200).json(summary);
  } catch (err) {
    console.error('[FAIR API] Failed to read exposure summary:', err);
    res.status(500).json({ error: 'Failed to fetch FAIR risk exposure', details: err.message });
  }
});

/**
 * POST /api/governance/risk/recalculate
 * Force telemetry-driven FAIR sweep (privileged — JIT when enforcement enabled)
 */
router.post(
  '/recalculate',
  authenticateToken,
  requirePermissions(['compliance.manage']),
  enforceJitContext({ actionDescription: 'Forced FAIR quantitative risk recalculation' }),
  async (req, res) => {
    try {
      const result = await computeFairExposure();
      res.status(200).json({
        ...result,
        message: 'FAIR algorithmic pass completed successfully based on live telemetry.'
      });
    } catch (err) {
      console.error('[FAIR API] Recalculation failed:', err);
      res.status(500).json({ error: 'Failed to process algorithmic risk pass.', details: err.message });
    }
  }
);

/**
 * GET /api/governance/risk/telemetry-log
 * Audit trace — telemetry drivers that produced multiplier adjustments
 */
router.get('/telemetry-log', authenticateToken, requirePermissions(['compliance.read']), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const correlationId = req.query.correlation_id || null;
    const params = [limit];
    let where = '';
    if (correlationId) {
      where = 'WHERE correlation_id = $2';
      params.push(correlationId);
    }
    const { rows } = await pool.query(
      `
      SELECT id, scenario_id, driver, raw_value, multiplier_applied, correlation_id, recorded_at
      FROM fair_risk_telemetry_log
      ${where}
      ORDER BY recorded_at DESC
      LIMIT $1
      `,
      params
    );
    res.status(200).json({
      entries: rows,
      count: rows.length,
      attestation_timestamp: new Date().toISOString()
    });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(200).json({ entries: [], count: 0, note: 'Telemetry log not initialized — run npm run setup:fair-risk' });
    }
    console.error('[FAIR API] Failed to read telemetry log:', err);
    res.status(500).json({ error: 'Failed to fetch FAIR telemetry audit log', details: err.message });
  }
});

/**
 * GET /api/governance/risk/calibration
 * Current calibration factors + recent adjustment audit trail
 */
router.get('/calibration', authenticateToken, requirePermissions(['compliance.read']), async (req, res) => {
  try {
    const status = await getCalibrationStatus({
      limit: Math.min(parseInt(req.query.limit, 10) || 20, 100)
    });
    res.status(200).json(status);
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(200).json({
        scenarios: [],
        recent_adjustments: [],
        note: 'Calibration schema not initialized — run npm run setup:fair-calibration'
      });
    }
    console.error('[FAIR API] Failed to read calibration status:', err);
    res.status(500).json({ error: 'Failed to fetch calibration status', details: err.message });
  }
});

/**
 * GET /api/governance/risk/calibration/log
 * Full calibration audit log (GV.RM evidence)
 */
router.get('/calibration/log', authenticateToken, requirePermissions(['compliance.read']), async (req, res) => {
  try {
    const log = await getCalibrationLog({
      limit: parseInt(req.query.limit, 10) || 50,
      scenarioId: req.query.scenario_id || null
    });
    res.status(200).json({
      ...log,
      attestation_timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[FAIR API] Failed to read calibration log:', err);
    res.status(500).json({ error: 'Failed to fetch calibration log', details: err.message });
  }
});

/**
 * POST /api/governance/risk/calibrate
 * Run observed-frequency calibration pass (TEF factors + optional MITRE weights)
 */
router.post(
  '/calibrate',
  authenticateToken,
  requirePermissions(['compliance.manage']),
  enforceJitContext({ actionDescription: 'FAIR model calibration pass' }),
  async (req, res) => {
    try {
      const dryRun = req.body?.dry_run === true || req.query.dry_run === 'true';
      const windowDays = parseInt(req.body?.window_days || req.query.days, 10) || 30;
      const includeMitre = req.body?.include_mitre !== false;

      const result = await runCalibration({
        windowDays,
        dryRun,
        includeMitre,
        appliedBy: req.user?.username || req.user?.user_id || 'api'
      });

      if (!dryRun && result.mitre_adjustments.some((a) => a.applied)) {
        await refreshMappingCache(pool);
      }

      if (!dryRun && result.applied_count > 0) {
        await computeFairExposure({ triggerSource: 'calibration' });
      }

      res.status(200).json({
        ...result,
        message: dryRun
          ? 'Calibration dry-run complete — no parameters persisted'
          : `Calibration applied (${result.applied_count} adjustments); FAIR sweep triggered when changes applied`
      });
    } catch (err) {
      console.error('[FAIR API] Calibration failed:', err);
      res.status(500).json({ error: 'Failed to run FAIR calibration', details: err.message });
    }
  }
);

/**
 * GET /api/governance/risk/calibration/approvals
 */
router.get('/calibration/approvals', authenticateToken, requirePermissions(['compliance.read']), async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const approvals = status === 'pending'
      ? await getPendingApprovals({ limit: parseInt(req.query.limit, 10) || 20 })
      : [];
    res.status(200).json({ approvals, count: approvals.length, status_filter: status });
  } catch (err) {
    console.error('[FAIR API] Failed to list calibration approvals:', err);
    res.status(500).json({ error: 'Failed to fetch calibration approvals', details: err.message });
  }
});

/**
 * POST /api/governance/risk/calibration/approve
 */
router.post(
  '/calibration/approve',
  authenticateToken,
  requirePermissions(['compliance.manage']),
  enforceJitContext({ actionDescription: 'Approve FAIR calibration adjustment' }),
  async (req, res) => {
    try {
      const approvalId = parseInt(req.body?.approval_id, 10);
      if (!approvalId) return res.status(400).json({ error: 'approval_id required' });

      const result = await approveCalibration({
        approvalId,
        reviewedBy: req.user?.username || req.user?.user_id || 'api',
        notes: req.body?.notes
      });

      if (result.calibration_target === 'scenario_tef' || result.technique) {
        await refreshMappingCache(pool);
      }
      await computeFairExposure({ triggerSource: 'calibration_approved' });

      res.status(200).json({ approval: result, message: 'Calibration adjustment approved and applied' });
    } catch (err) {
      const code = err.statusCode || 500;
      if (code >= 500) console.error('[FAIR API] Approve calibration failed:', err);
      res.status(code).json({ error: err.message });
    }
  }
);

/**
 * POST /api/governance/risk/calibration/reject
 */
router.post(
  '/calibration/reject',
  authenticateToken,
  requirePermissions(['compliance.manage']),
  enforceJitContext({ actionDescription: 'Reject FAIR calibration adjustment' }),
  async (req, res) => {
    try {
      const approvalId = parseInt(req.body?.approval_id, 10);
      if (!approvalId) return res.status(400).json({ error: 'approval_id required' });

      const result = await rejectCalibration({
        approvalId,
        reviewedBy: req.user?.username || req.user?.user_id || 'api',
        notes: req.body?.notes
      });
      res.status(200).json({ approval: result, message: 'Calibration adjustment rejected' });
    } catch (err) {
      const code = err.statusCode || 500;
      res.status(code).json({ error: err.message });
    }
  }
);

/**
 * POST /api/governance/risk/calibration/rollback
 */
router.post(
  '/calibration/rollback',
  authenticateToken,
  requirePermissions(['compliance.manage']),
  enforceJitContext({ actionDescription: 'Rollback FAIR calibration factor' }),
  async (req, res) => {
    try {
      const logId = parseInt(req.body?.log_id, 10);
      if (!logId) return res.status(400).json({ error: 'log_id required' });

      const result = await rollbackCalibration({
        logId,
        appliedBy: req.user?.username || req.user?.user_id || 'api',
        notes: req.body?.notes
      });
      await refreshMappingCache(pool);
      await computeFairExposure({ triggerSource: 'calibration_rollback' });
      res.status(200).json({ ...result, message: 'Calibration rolled back successfully' });
    } catch (err) {
      const code = err.statusCode || 500;
      if (code >= 500) console.error('[FAIR API] Rollback failed:', err);
      res.status(code).json({ error: err.message });
    }
  }
);

/**
 * PATCH /api/governance/risk/calibration/scenarios/:scenarioId/lock
 */
router.patch(
  '/calibration/scenarios/:scenarioId/lock',
  authenticateToken,
  requirePermissions(['compliance.manage']),
  async (req, res) => {
    try {
      const locked = req.body?.locked !== false;
      const result = await setScenarioCalibrationLock({
        scenarioId: req.params.scenarioId,
        locked
      });
      res.status(200).json({ scenario: result });
    } catch (err) {
      const code = err.statusCode || 500;
      res.status(code).json({ error: err.message });
    }
  }
);

module.exports = router;
