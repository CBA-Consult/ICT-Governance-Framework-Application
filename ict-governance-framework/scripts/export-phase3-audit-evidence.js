#!/usr/bin/env node
/**
 * Phase 3 Audit Evidence Pack — automated export and pass/fail checks
 * v1.1 — includes FAIR model calibration governance evidence (P4-D1)
 */
require('dotenv').config();
const { Pool } = require('pg');
const { ingestGovernanceIncident } = require('../services/governance-incident-ingest');
const { getCalibrationStatus, getCalibrationLog, getPendingApprovals } = require('../services/fair-risk-calibration');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function pass(name, ok, detail = '') {
  return { control: name, pass: ok, detail };
}

async function loadCalibrationEvidence() {
  try {
    const [status, log] = await Promise.all([
      getCalibrationStatus({ limit: 20 }),
      getCalibrationLog({ limit: 50 })
    ]);

    const recentAdjustments = (log.entries || []).slice(0, 20).map((row) => ({
      id: row.id,
      calibration_target: row.calibration_target,
      scenario_id: row.scenario_id,
      technique: row.technique,
      observed_frequency: row.observed_frequency != null ? Number(row.observed_frequency) : null,
      expected_frequency: row.expected_frequency != null ? Number(row.expected_frequency) : null,
      frequency_ratio: row.frequency_ratio != null ? Number(row.frequency_ratio) : null,
      adjustment_factor: row.adjustment_factor != null ? Number(row.adjustment_factor) : null,
      previous_value: row.previous_value != null ? Number(row.previous_value) : null,
      new_value: row.new_value != null ? Number(row.new_value) : null,
      window_days: row.window_days,
      applied_at: row.applied_at,
      applied_by: row.applied_by,
      correlation_id: row.correlation_id
    }));

    return {
      last_run: status.summary?.last_calibration_run || null,
      summary: {
        avg_adjustment_pct: status.summary?.avg_adjustment_pct ?? null,
        model_stability: status.summary?.model_stability?.label || null,
        model_stability_band: status.summary?.model_stability?.band || null,
        max_drift_pct: status.summary?.model_stability?.max_drift_pct ?? null,
        avg_mapping_confidence: status.summary?.avg_mapping_confidence ?? null,
        most_adjusted_scenario: status.summary?.most_adjusted_scenario || null,
        last_run_by: status.summary?.last_run_by || null,
        total_adjustments_logged: status.summary?.total_adjustments_logged ?? 0
      },
      parameters: status.parameters || null,
      mapping_confidence: status.mapping_confidence || null,
      scenarios: (status.scenario_drift || []).map((row) => ({
        scenario_id: row.scenario_id,
        baseline_tef: row.baseline_tef,
        adjusted_tef: row.adjusted_tef,
        tef_calibration_factor: row.tef_calibration_factor,
        drift_pct: row.drift_pct
      })),
      recent_adjustments: recentAdjustments,
      pending_approvals: await getPendingApprovals({ limit: 10 }).catch(() => [])
    };
  } catch (err) {
    if (err.code === '42P01' || err.code === '42703') {
      return { schema_missing: true, error: err.message };
    }
    throw err;
  }
}

function evaluateCalibrationChecks(calibration) {
  const results = [];

  if (calibration?.schema_missing) {
    results.push(pass('SEC-A8 calibration schema', false, 'run npm run setup:fair-calibration'));
    results.push(pass('SEC-A8 scenario drift export', false, 'skipped'));
    results.push(pass('SEC-A8 factor bounds 0.5–2.0', false, 'skipped'));
    results.push(pass('SEC-A8 adjustment audit trail', false, 'skipped'));
    return results;
  }

  results.push(pass('SEC-A8 calibration schema', true, 'fair_model_calibration_log + TEF factors'));

  const driftOk = (calibration.scenarios || []).length >= 3;
  results.push(pass('SEC-A8 scenario drift export', driftOk,
    `${(calibration.scenarios || []).length}/3 scenarios`));

  const factorsOk = (calibration.scenarios || []).every((s) => {
    const f = Number(s.tef_calibration_factor);
    return f >= 0.5 && f <= 2.0;
  });
  results.push(pass('SEC-A8 factor bounds 0.5–2.0', factorsOk || calibration.scenarios.length === 0));

  const adjustments = calibration.recent_adjustments || [];
  const trailOk = adjustments.length === 0 || adjustments.every((a) =>
    a.previous_value != null && a.new_value != null && a.adjustment_factor != null
  );
  results.push(pass('SEC-A8 adjustment audit trail', trailOk,
    adjustments.length ? `${adjustments.length} logged adjustments` : 'no adjustments yet (schema ready)'));

  return results;
}

async function main() {
  const results = [];
  const bundle = {
    attestation_timestamp: new Date().toISOString(),
    pack_version: '1.1',
    certification_status: 'NOT CERTIFIED — implementation evidence only',
    checks: [],
    sample_correlation_id: null,
    trace: {},
    calibration: null
  };

  if (!process.env.DATABASE_URL) {
    console.error(JSON.stringify({ error: 'DATABASE_URL required' }, null, 2));
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    let incidents = await client.query(`
      SELECT incident_id, correlation_id, severity, status, detected_at, acknowledged_at, resolved_at
      FROM governance_incidents
      WHERE correlation_id IS NOT NULL
      ORDER BY detected_at DESC
      LIMIT 5
    `);

    if (incidents.rows.length === 0) {
      const synthetic = await ingestGovernanceIncident(pool, {
        body: {
          tenantId: 'tenant-01',
          driftType: 'security',
          severity: 'CRITICAL',
          description: 'Phase 3 audit evidence — synthetic CRITICAL incident for trace export',
          externalTicketId: `AUDIT-EVIDENCE-${Date.now()}`
        }
      });
      incidents = { rows: [synthetic.incident] };
      bundle.synthetic_incident_created = true;
    }

    const hasCorrelation = incidents.rows.some((r) => r.correlation_id);
    results.push(pass('SEC-A1 correlation_id on incidents', hasCorrelation,
      `${incidents.rows.length} recent incidents with correlation_id`));

    const sampleId = incidents.rows.find((r) => r.correlation_id)?.correlation_id;
    bundle.sample_correlation_id = sampleId;

    if (sampleId) {
      const ingest = await client.query(
        `SELECT id, incident_id, raw_payload, processed_fields, created_at
         FROM governance_incident_ingest_log WHERE correlation_id = $1`,
        [sampleId]
      );
      const ingestOk = ingest.rows.length > 0
        && ingest.rows[0].raw_payload != null
        && ingest.rows[0].processed_fields != null;
      results.push(pass('SEC-A1 ingest audit log', ingestOk,
        ingest.rows.length ? 'raw_payload + processed_fields present' : 'no ingest row'));
      bundle.trace.ingest = ingest.rows[0] || null;

      const calc = await client.query(
        `SELECT trigger_source, incident_id, ale_before_usd, ale_after_usd, recorded_at
         FROM fair_risk_calculation_log WHERE correlation_id = $1`,
        [sampleId]
      );
      const calcRow = calc.rows[0];
      const calcOk = calc.rows.length > 0
        && calcRow.trigger_source === 'incident'
        && calcRow.ale_before_usd != null
        && calcRow.ale_after_usd != null;
      results.push(pass('SEC-A2 FAIR incident trigger', calcOk,
        calcRow ? `delta=${Number(calcRow.ale_after_usd) - Number(calcRow.ale_before_usd)}` : 'missing'));
      bundle.trace.fair_calculation = calcRow || null;

      const telemetry = await client.query(
        `SELECT scenario_id, driver, raw_value, multiplier_applied
         FROM fair_risk_telemetry_log WHERE correlation_id = $1`,
        [sampleId]
      );
      const telOk = telemetry.rows.length >= 1;
      results.push(pass('SEC-A4 telemetry lineage', telOk,
        `${telemetry.rows.length} driver rows`));
      bundle.trace.telemetry = telemetry.rows;

      const multipliersOk = telemetry.rows.every((r) => {
        const m = Number(r.multiplier_applied);
        return m >= 0.1 && m <= 5.0;
      });
      results.push(pass('SEC-A4 multiplier cap 0.1–5.0', multipliersOk || telemetry.rows.length === 0));
    } else {
      results.push(pass('SEC-A1 ingest audit log', false, 'no sample correlation_id'));
      results.push(pass('SEC-A2 FAIR incident trigger', false, 'skipped'));
      results.push(pass('SEC-A4 telemetry lineage', false, 'skipped'));
    }

    const kpis = await client.query(`
      SELECT metric_code, current_value, last_updated
      FROM governance_metric_snapshots
      WHERE metric_code IN ('KPI-GOV-TOTAL-RISK-EXPOSURE', 'KPI-GOV-RISK-DELTA-24H')
    `);
    const kpiOk = kpis.rows.length === 2;
    results.push(pass('SEC-A5 KPI snapshots', kpiOk, `${kpis.rows.length}/2 metrics`));
    bundle.trace.kpis = kpis.rows;

    const scenarios = await client.query(`
      SELECT COUNT(*)::int AS c FROM fair_risk_scenarios WHERE current_ale_usd > 0
    `);
    results.push(pass('SEC-A3 positive scenario ALE', scenarios.rows[0].c === 3,
      `${scenarios.rows[0].c}/3 scenarios`));

    bundle.calibration = await loadCalibrationEvidence();
    results.push(...evaluateCalibrationChecks(bundle.calibration));

    bundle.checks = results;
    const failed = results.filter((r) => !r.pass).length;
    bundle.summary = {
      passed: results.filter((r) => r.pass).length,
      failed,
      total: results.length,
      overall_pass: failed === 0
    };

    console.log(JSON.stringify(bundle, null, 2));
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }, null, 2));
  process.exit(1);
});
