/**
 * FAIR model calibration tests — observed frequency → TEF / MITRE weight tuning
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const {
  runCalibration,
  getCalibrationStatus,
  approveCalibration,
  rollbackCalibration,
  setScenarioCalibrationLock,
  classifyGovernanceTier,
  computeAdjustmentFactor,
  annualizeCount
} = require('../services/fair-risk-calibration');
const { ingestGovernanceIncident } = require('../services/governance-incident-ingest');

(async () => {
  let passed = 0;
  let failed = 0;

  const assert = (name, condition) => {
    if (condition) {
      passed += 1;
      console.log(`PASS: ${name}`);
    } else {
      failed += 1;
      console.error(`FAIL: ${name}`);
    }
  };

  if (!process.env.DATABASE_URL) {
    console.error('FAIL: DATABASE_URL required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sqlDir = path.join(__dirname, '..', 'sql');

  for (const file of [
    'governance.sql',
    'fair_risk_models.sql',
    'incident_secops_controls.sql',
    'incident_lifecycle.sql',
    'mitre_enrichment.sql',
    'mitre_to_fair_mapping.sql',
    'fair_model_calibration.sql',
    'fair_calibration_governance.sql'
  ]) {
    await pool.query(fs.readFileSync(path.join(sqlDir, file), 'utf8'));
  }

  await pool.query(`
    INSERT INTO tenants (tenant_id, name, classification)
    VALUES ('tenant-cal', 'Calibration Test', 'Healthcare')
    ON CONFLICT (tenant_id) DO NOTHING
  `);

  assert('adjustment factor dampens high ratio', computeAdjustmentFactor(20, 5) <= 1.35);
  assert('adjustment factor dampens low ratio', computeAdjustmentFactor(1, 5) >= 0.75);
  assert('annualize 30d count', annualizeCount(10, 30) > 100);
  assert('governance tier auto within 5%', classifyGovernanceTier(1, 1.04) === 'auto');
  assert('governance tier pending above threshold', classifyGovernanceTier(1, 1.12) === 'pending_approval');

  await pool.query(`
    UPDATE fair_risk_scenarios SET tef_calibration_factor = 1.0, calibration_locked = false
    WHERE scenario_id = 'RSK-ADMIN-COMPROMISE'
  `);

  for (let i = 0; i < 8; i += 1) {
    await ingestGovernanceIncident(pool, {
      body: {
        tenantId: 'tenant-cal',
        severity: 'CRITICAL',
        description: `Calibration seed incident ${i}`,
        mitreTechnique: 'T1003',
        mitreTactic: 'Credential Access'
      },
      correlationId: crypto.randomUUID()
    });
  }

  const dryRun = await runCalibration({ windowDays: 30, dryRun: true, includeMitre: false });
  assert('dry-run returns scenario adjustments', dryRun.scenario_adjustments.length >= 3);
  assert('dry-run does not persist', dryRun.applied_count === 0);

  const before = await pool.query(
    `SELECT tef_calibration_factor FROM fair_risk_scenarios WHERE scenario_id = 'RSK-ADMIN-COMPROMISE'`
  );
  const beforeFactor = parseFloat(before.rows[0].tef_calibration_factor);

  const applied = await runCalibration({
    windowDays: 30,
    dryRun: false,
    includeMitre: true,
    appliedBy: 'verify:calibration'
  });
  assert('calibration applies adjustments', applied.applied_count >= 1);

  const after = await pool.query(
    `SELECT tef_calibration_factor FROM fair_risk_scenarios WHERE scenario_id = 'RSK-ADMIN-COMPROMISE'`
  );
  const afterFactor = parseFloat(after.rows[0].tef_calibration_factor);
  assert('ADMIN-COMPROMISE TEF factor increased after high frequency', afterFactor >= beforeFactor);

  const log = await pool.query(
    `SELECT * FROM fair_model_calibration_log WHERE scenario_id = 'RSK-ADMIN-COMPROMISE' ORDER BY applied_at DESC LIMIT 1`
  );
  assert('calibration log records scenario_tef', log.rows.length >= 1);
  assert('calibration log has observed frequency', parseFloat(log.rows[0].observed_frequency) > 0);

  const status = await getCalibrationStatus({ limit: 5 });
  assert('calibration status returns scenarios', status.scenarios.length >= 3);
  assert('calibration status includes recent adjustments', status.recent_adjustments.length >= 1);
  assert('calibration summary has model stability', status.summary?.model_stability?.label != null);
  assert('calibration scenario drift populated', status.scenario_drift.length >= 3);
  assert('calibration summary includes mapping confidence', status.mapping_confidence?.mapping_count >= 1);

  const savedThreshold = process.env.FAIR_CALIBRATION_APPROVAL_THRESHOLD_PCT;
  const savedAuto = process.env.FAIR_CALIBRATION_AUTO_APPROVE_PCT;
  process.env.FAIR_CALIBRATION_APPROVAL_THRESHOLD_PCT = '5';
  process.env.FAIR_CALIBRATION_AUTO_APPROVE_PCT = '2';

  await pool.query(`UPDATE fair_risk_scenarios SET tef_calibration_factor = 1.0 WHERE scenario_id = 'RSK-ADMIN-COMPROMISE'`);
  const governedRun = await runCalibration({
    windowDays: 30,
    dryRun: false,
    includeMitre: false,
    appliedBy: 'verify:governance'
  });
  const pendingAdj = governedRun.scenario_adjustments.find((a) => a.pending_approval);
  assert('large adjustment creates pending approval', Boolean(pendingAdj));

  if (pendingAdj?.approval_id) {
    const approved = await approveCalibration({
      approvalId: pendingAdj.approval_id,
      reviewedBy: 'verify:governance',
      notes: 'Test approval'
    });
    assert('approve applies calibration', approved.status === 'approved');

    const logId = approved.calibration_log_id;
    const rolled = await rollbackCalibration({ logId, appliedBy: 'verify:governance' });
    assert('rollback restores previous factor', rolled.reverted_to === parseFloat(pendingAdj.previous_value));
  }

  await setScenarioCalibrationLock({ scenarioId: 'RSK-DR-FAILURE', locked: true });
  const lockedRun = await runCalibration({ windowDays: 30, dryRun: false, includeMitre: false });
  const skipped = lockedRun.scenario_adjustments.find((a) => a.scenario_id === 'RSK-DR-FAILURE');
  assert('locked scenario skipped', skipped?.skipped && skipped.reason === 'calibration_locked');
  await setScenarioCalibrationLock({ scenarioId: 'RSK-DR-FAILURE', locked: false });

  process.env.FAIR_CALIBRATION_APPROVAL_THRESHOLD_PCT = savedThreshold;
  process.env.FAIR_CALIBRATION_AUTO_APPROVE_PCT = savedAuto;

  assert('calibration status exposes governance thresholds', status.governance?.approval_threshold_pct != null);

  await pool.end();
  console.log(`\nFAIR calibration tests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
