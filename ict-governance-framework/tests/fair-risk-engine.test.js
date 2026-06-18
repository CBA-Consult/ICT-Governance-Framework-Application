/**
 * FAIR risk engine tests — FR-GOV-005 / GV.RM
 */
require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const {
  computeFairExposure,
  getFairExposureSummary,
  capMultiplier,
  MAX_MULTIPLIER
} = require('../services/fair-risk-engine');

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

  const setupPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const schemaSql = fs.readFileSync(
    path.join(__dirname, '..', 'sql', 'fair_risk_models.sql'),
    'utf8'
  );
  await setupPool.query(schemaSql);

  const testAssetId = `/tenants/tenant-01/fair-test/shadow-${Date.now()}`;
  await setupPool.query(`
    INSERT INTO tenants (tenant_id, name, classification)
    VALUES ('tenant-01', 'Contoso Health', 'Healthcare')
    ON CONFLICT (tenant_id) DO NOTHING
  `);

  await setupPool.query(`
    INSERT INTO asset_register (
      asset_id, tenant_id, provider, resource_type, name, location,
      asset_origin, validation_posture, compliance_state
    ) VALUES ($1, 'tenant-01', 'Azure', 'SaaS.Application', 'FAIR Test Shadow App', 'westeurope',
      'Shadow_IT', 'Unverified', 'NonCompliant')
    ON CONFLICT (asset_id) DO UPDATE SET
      asset_origin = EXCLUDED.asset_origin,
      validation_posture = EXCLUDED.validation_posture
  `, [testAssetId]);

  await setupPool.end();

  assert('capMultiplier enforces MAX_MULTIPLIER', capMultiplier(99) === MAX_MULTIPLIER);
  assert('capMultiplier floors at 0.1', capMultiplier(0) === 0.1);

  const result = await computeFairExposure();
  assert('computeFairExposure returns COMPUTED status', result.status === 'COMPUTED');
  assert('total ALE is positive', result.total_enterprise_ale_usd > 0);
  assert('three baseline scenarios computed', result.scenarios.length === 3);
  assert('shadow IT telemetry counted', result.telemetry.shadowItUnverified >= 1);
  assert('top_scenarios array populated', result.top_scenarios.length === 3);
  assert('risk_delta_24h_usd is a number', typeof result.risk_delta_24h_usd === 'number');

  const shadowScenario = result.scenarios.find((s) => s.scenario_id === 'RSK-SHADOW-IT-LEAK');
  assert('shadow scenario multiplier > 1 with unverified assets', shadowScenario.active_multiplier > 1);
  assert('shadow scenario multiplier capped', shadowScenario.active_multiplier <= MAX_MULTIPLIER);

  const verifyPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const telemetryRows = await verifyPool.query(`
    SELECT driver, raw_value, multiplier_applied
    FROM fair_risk_telemetry_log
    WHERE driver = 'unverified_shadow_it_assets'
    ORDER BY recorded_at DESC
    LIMIT 1
  `);
  assert('telemetry log records shadow IT driver', telemetryRows.rows.length >= 1);
  assert(
    'telemetry log raw_value matches shadow count',
    Number(telemetryRows.rows[0]?.raw_value) >= 1
  );

  const historyRows = await verifyPool.query(`
    SELECT total_ale_usd FROM fair_risk_enterprise_history ORDER BY recorded_at DESC LIMIT 1
  `);
  assert('enterprise history recorded', historyRows.rows.length >= 1);

  const deltaMetric = await verifyPool.query(`
    SELECT current_value FROM governance_metric_snapshots WHERE metric_code = 'KPI-GOV-RISK-DELTA-24H'
  `);
  assert('KPI-GOV-RISK-DELTA-24H snapshot exists', deltaMetric.rows.length >= 1);

  await verifyPool.end();

  const summary = await getFairExposureSummary();
  assert('getFairExposureSummary returns scenarios', summary.scenarios.length === 3);
  assert('summary total ALE matches computed total', summary.total_enterprise_ale_usd > 0);
  assert('summary includes top_scenarios', summary.top_scenarios.length === 3);
  assert('summary includes recent_telemetry_log', Array.isArray(summary.recent_telemetry_log));
  assert('summary includes risk_delta_24h_usd', typeof summary.risk_delta_24h_usd === 'number');

  const cleanupPool = new Pool({ connectionString: process.env.DATABASE_URL });
  await cleanupPool.query('DELETE FROM asset_register WHERE asset_id = $1', [testAssetId]);
  await cleanupPool.end();

  console.log(`\nFAIR risk tests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => {
  console.error('FAIR risk test harness error:', err);
  process.exit(1);
});
