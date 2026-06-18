/**
 * Live FAIR (Factor Analysis of Information Risk) engine — FR-GOV-005 / GV.RM.
 * Consumes asset register, governance incidents, and JIT/Break Glass telemetry.
 */
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const TOTAL_RISK_METRIC = 'KPI-GOV-TOTAL-RISK-EXPOSURE';
const DELTA_RISK_METRIC = 'KPI-GOV-RISK-DELTA-24H';

const SHADOW_IT_PER_ASSET_LEF_BOOST = Number(process.env.FAIR_SHADOW_LEF_BOOST_PER_ASSET) || 0.15;
const DR_AT_RISK_LEF_BOOST = Number(process.env.FAIR_DR_AT_RISK_LEF_BOOST) || 0.25;
const CRITICAL_INCIDENT_LEF_BOOST = Number(process.env.FAIR_CRITICAL_INCIDENT_LEF_BOOST) || 0.10;
const ACTIVE_BREAK_GLASS_LEF_BOOST = Number(process.env.FAIR_BREAK_GLASS_LEF_BOOST) || 0.50;
const MAX_MULTIPLIER = Number(process.env.FAIR_MAX_MULTIPLIER) || 5.0;

function capMultiplier(value) {
  return Math.min(Math.max(value, 0.1), MAX_MULTIPLIER);
}

function computeScenarioAle(scenario, activeMultiplier) {
  const tefBase = parseFloat(scenario.threat_event_frequency);
  const tefCal = parseFloat(scenario.tef_calibration_factor) || 1;
  const tef = tefBase * tefCal;
  const vulnBase = parseFloat(scenario.vulnerability_percentage) / 100;
  const vulnCal = parseFloat(scenario.vulnerability_calibration_factor) || 1;
  const vuln = Math.min(vulnBase * vulnCal, 1);
  const mult = capMultiplier(activeMultiplier);
  const lef = tef * vuln * mult;
  const plmAvg = (parseFloat(scenario.min_loss_usd) + parseFloat(scenario.max_loss_usd)) / 2;
  return {
    lef,
    plmAvg,
    ale: lef * plmAvg,
    activeMultiplier: mult,
    tef_effective: tef,
    vulnerability_effective: vuln
  };
}

async function logTelemetryDriver(client, scenarioId, driver, rawValue, multiplierApplied, correlationId = null) {
  try {
    await client.query(
      `
      INSERT INTO fair_risk_telemetry_log (scenario_id, driver, raw_value, multiplier_applied, correlation_id)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [scenarioId, driver, rawValue, multiplierApplied, correlationId]
    );
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }
}

async function gatherTelemetry(client) {
  const telemetry = {
    shadowItUnverified: 0,
    drAtRiskAssets: 0,
    openCriticalIncidents: 0,
    activeBreakGlassTickets: 0
  };

  try {
    const shadow = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM asset_register
      WHERE asset_origin IN ('Shadow_IT', 'CASB_Discovery')
        AND validation_posture = 'Unverified'
    `);
    telemetry.shadowItUnverified = shadow.rows[0]?.count || 0;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  try {
    const dr = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM asset_register
      WHERE dr_status IN ('Stale_Drill', 'Failed_Validation')
         OR rpo_flag_triggered = true
    `);
    telemetry.drAtRiskAssets = dr.rows[0]?.count || 0;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  try {
    const incidents = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM governance_incidents
      WHERE severity = 'CRITICAL'
        AND status IN ('Detected', 'Acknowledged', 'Remediating')
    `);
    telemetry.openCriticalIncidents = incidents.rows[0]?.count || 0;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  try {
    const bg = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM jit_elevation_ledger
      WHERE status = 'Break_Glass_Active'
    `);
    telemetry.activeBreakGlassTickets = bg.rows[0]?.count || 0;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  return telemetry;
}

function multipliersFromTelemetry(telemetry) {
  const shadowMultiplier = capMultiplier(
    1 + telemetry.shadowItUnverified * SHADOW_IT_PER_ASSET_LEF_BOOST
  );
  const drMultiplier = capMultiplier(
    1 + telemetry.drAtRiskAssets * DR_AT_RISK_LEF_BOOST
  );
  const adminMultiplier = capMultiplier(
    1
    + telemetry.openCriticalIncidents * CRITICAL_INCIDENT_LEF_BOOST
    + telemetry.activeBreakGlassTickets * ACTIVE_BREAK_GLASS_LEF_BOOST
  );

  return {
    'RSK-SHADOW-IT-LEAK': shadowMultiplier,
    'RSK-DR-FAILURE': drMultiplier,
    'RSK-ADMIN-COMPROMISE': adminMultiplier
  };
}

async function applyIncidentMitreWeight(client, scenarioMultipliers, incidentId, correlationId) {
  if (!incidentId) return;

  let row;
  try {
    const result = await client.query(
      `
      SELECT fair_scenario_id, mitre_technique, mitre_tactic, mitre_severity_weight
      FROM governance_incidents WHERE incident_id = $1
      `,
      [incidentId]
    );
    row = result.rows[0];
  } catch (err) {
    if (err.code === '42703' || err.code === '42P01') return;
    throw err;
  }

  if (!row?.fair_scenario_id) return;

  const weight = parseFloat(row.mitre_severity_weight) || 1.0;
  if (weight <= 1.0) return;

  const scenarioId = row.fair_scenario_id;
  const boosted = capMultiplier((scenarioMultipliers[scenarioId] || 1) * weight);
  scenarioMultipliers[scenarioId] = boosted;

  const driver = row.mitre_technique
    ? `mitre_technique_${row.mitre_technique}`
    : `mitre_tactic_${String(row.mitre_tactic || 'unknown').replace(/\s+/g, '_').toLowerCase()}`;

  await logTelemetryDriver(client, scenarioId, driver, weight, boosted, correlationId);
}

async function recordTelemetryAuditTrail(client, telemetry, scenarioMultipliers, correlationId = null) {
  await logTelemetryDriver(
    client,
    'RSK-SHADOW-IT-LEAK',
    'unverified_shadow_it_assets',
    telemetry.shadowItUnverified,
    scenarioMultipliers['RSK-SHADOW-IT-LEAK'],
    correlationId
  );
  await logTelemetryDriver(
    client,
    'RSK-DR-FAILURE',
    'dr_at_risk_assets',
    telemetry.drAtRiskAssets,
    scenarioMultipliers['RSK-DR-FAILURE'],
    correlationId
  );
  await logTelemetryDriver(
    client,
    'RSK-ADMIN-COMPROMISE',
    'open_critical_incidents',
    telemetry.openCriticalIncidents,
    scenarioMultipliers['RSK-ADMIN-COMPROMISE'],
    correlationId
  );
  await logTelemetryDriver(
    client,
    'RSK-ADMIN-COMPROMISE',
    'active_break_glass_tickets',
    telemetry.activeBreakGlassTickets,
    scenarioMultipliers['RSK-ADMIN-COMPROMISE'],
    correlationId
  );
}

async function upsertAssetExposures(client, scenarioId, rows) {
  await client.query('DELETE FROM asset_risk_exposures WHERE scenario_id = $1', [scenarioId]);

  for (const row of rows) {
    await client.query(
      `
      INSERT INTO asset_risk_exposures (asset_id, scenario_id, dynamic_multiplier, calculated_exposure_usd)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (asset_id, scenario_id) DO UPDATE SET
        dynamic_multiplier = EXCLUDED.dynamic_multiplier,
        calculated_exposure_usd = EXCLUDED.calculated_exposure_usd,
        evaluated_at = CURRENT_TIMESTAMP
      `,
      [row.asset_id, scenarioId, row.multiplier, row.exposureUsd]
    );
  }
}

async function getAleBaseline24hAgo(client) {
  try {
    const { rows } = await client.query(`
      SELECT total_ale_usd
      FROM fair_risk_enterprise_history
      WHERE recorded_at <= NOW() - INTERVAL '24 hours'
      ORDER BY recorded_at DESC
      LIMIT 1
    `);
    return rows[0] ? parseFloat(rows[0].total_ale_usd) : null;
  } catch (err) {
    if (err.code === '42P01') return null;
    throw err;
  }
}

function deriveRiskTrend(deltaUsd, baselineAle) {
  if (baselineAle == null || baselineAle === 0) return 'stable';
  const pct = (deltaUsd / baselineAle) * 100;
  if (pct > 2) return 'increasing';
  if (pct < -2) return 'decreasing';
  return 'stable';
}

async function patchRiskMetrics(client, totalEnterpriseAle, deltaUsd) {
  const aleMillions = totalEnterpriseAle / 1_000_000;
  const deltaMillions = deltaUsd / 1_000_000;
  const totalContext = `Enterprise ALE: $${totalEnterpriseAle.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD`;
  const deltaContext = `24h ALE delta: ${deltaUsd >= 0 ? '+' : ''}$${deltaUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD`;

  try {
    await client.query(
      `
      INSERT INTO governance_metric_snapshots (metric_code, current_value, target_value, last_context)
      VALUES ($1, $2, 0, $3)
      ON CONFLICT (metric_code) DO UPDATE SET
        current_value = EXCLUDED.current_value,
        last_updated = CURRENT_TIMESTAMP,
        last_context = EXCLUDED.last_context
      `,
      [TOTAL_RISK_METRIC, aleMillions, totalContext]
    );

    await client.query(
      `
      INSERT INTO governance_metric_snapshots (metric_code, current_value, target_value, last_context)
      VALUES ($1, $2, 0, $3)
      ON CONFLICT (metric_code) DO UPDATE SET
        current_value = EXCLUDED.current_value,
        last_updated = CURRENT_TIMESTAMP,
        last_context = EXCLUDED.last_context
      `,
      [DELTA_RISK_METRIC, deltaMillions, deltaContext]
    );
  } catch (err) {
    if (err.code !== '42P01') throw err;
    console.warn('[FAIR Engine] governance_metric_snapshots unavailable; skipping KPI patch');
  }
}

async function recordEnterpriseHistory(client, totalEnterpriseAle, correlationId = null, triggerSource = 'scheduled') {
  try {
    await client.query(
      `
      INSERT INTO fair_risk_enterprise_history (total_ale_usd, correlation_id, trigger_source)
      VALUES ($1, $2, $3)
      `,
      [totalEnterpriseAle, correlationId, triggerSource]
    );
  } catch (err) {
    if (err.code === '42703') {
      await client.query(
        `INSERT INTO fair_risk_enterprise_history (total_ale_usd) VALUES ($1)`,
        [totalEnterpriseAle]
      );
      return;
    }
    if (err.code !== '42P01') throw err;
  }
}

async function recordFairCalculationLog(client, {
  correlationId,
  triggerSource,
  incidentId,
  aleBeforeUsd,
  aleAfterUsd
}) {
  try {
    await client.query(
      `
      INSERT INTO fair_risk_calculation_log (
        correlation_id, trigger_source, incident_id, ale_before_usd, ale_after_usd
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [correlationId, triggerSource || 'scheduled', incidentId || null, aleBeforeUsd, aleAfterUsd]
    );
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }
}

async function computeFairExposure(options = {}) {
  const externalClient = options.client;
  const client = externalClient || await pool.connect();
  const ownsClient = !externalClient;
  const correlationId = options.correlationId || null;
  const triggerSource = options.triggerSource || 'scheduled';
  const incidentId = options.incidentId || null;

  let aleBeforeUsd = options.aleBeforeUsd;
  if (aleBeforeUsd == null) {
    const beforeRows = await client.query(
      'SELECT COALESCE(SUM(current_ale_usd), 0) AS total FROM fair_risk_scenarios'
    );
    aleBeforeUsd = parseFloat(beforeRows.rows[0]?.total || 0);
  }

  console.log(
    `[FAIR Engine] Initiating risk quantification sweep (trigger=${triggerSource}` +
    `${correlationId ? `, correlation_id=${correlationId}` : ''})...`
  );

  try {
    if (ownsClient) await client.query('BEGIN');

    const baselineAle = await getAleBaseline24hAgo(client);
    const telemetry = await gatherTelemetry(client);
    const scenarioMultipliers = multipliersFromTelemetry(telemetry);
    await applyIncidentMitreWeight(client, scenarioMultipliers, incidentId, correlationId);
    await recordTelemetryAuditTrail(client, telemetry, scenarioMultipliers, correlationId);

    const scenariosResult = await client.query('SELECT * FROM fair_risk_scenarios ORDER BY scenario_id');
    const scenarioResults = [];
    let totalEnterpriseAle = 0;

    for (const scenario of scenariosResult.rows) {
      const rawMultiplier = scenarioMultipliers[scenario.scenario_id] || 1.0;
      const { ale, activeMultiplier } = computeScenarioAle(scenario, rawMultiplier);
      totalEnterpriseAle += ale;

      await client.query(
        `
        UPDATE fair_risk_scenarios
        SET current_ale_usd = $1, last_computed_at = NOW()
        WHERE scenario_id = $2
        `,
        [ale, scenario.scenario_id]
      );

      scenarioResults.push({
        scenario_id: scenario.scenario_id,
        description: scenario.description,
        active_multiplier: activeMultiplier,
        current_ale_usd: ale,
        last_computed_at: new Date().toISOString()
      });
    }

    if (telemetry.shadowItUnverified > 0) {
      const shadowAssets = await client.query(`
        SELECT asset_id FROM asset_register
        WHERE asset_origin IN ('Shadow_IT', 'CASB_Discovery')
          AND validation_posture = 'Unverified'
        LIMIT 500
      `);
      const shadowMult = scenarioMultipliers['RSK-SHADOW-IT-LEAK'];
      const shadowScenario = scenariosResult.rows.find((s) => s.scenario_id === 'RSK-SHADOW-IT-LEAK');
      if (shadowScenario && shadowAssets.rows.length > 0) {
        const perAssetAle = computeScenarioAle(shadowScenario, shadowMult).ale
          / Math.max(shadowAssets.rows.length, 1);
        await upsertAssetExposures(
          client,
          'RSK-SHADOW-IT-LEAK',
          shadowAssets.rows.map((r) => ({
            asset_id: r.asset_id,
            multiplier: shadowMult,
            exposureUsd: perAssetAle
          }))
        );
      }
    }

    const deltaUsd = baselineAle != null ? totalEnterpriseAle - baselineAle : 0;
    const riskTrend = deriveRiskTrend(deltaUsd, baselineAle);

    await patchRiskMetrics(client, totalEnterpriseAle, deltaUsd);
    await recordEnterpriseHistory(client, totalEnterpriseAle, correlationId, triggerSource);
    await recordFairCalculationLog(client, {
      correlationId,
      triggerSource,
      incidentId,
      aleBeforeUsd,
      aleAfterUsd: totalEnterpriseAle
    });

    if (ownsClient) await client.query('COMMIT');

    console.log(`[FAIR Engine] Sweep complete. Enterprise ALE: $${totalEnterpriseAle.toLocaleString('en-US')}`);

    return {
      status: 'COMPUTED',
      correlation_id: correlationId,
      trigger_source: triggerSource,
      incident_id: incidentId,
      ale_before_usd: aleBeforeUsd,
      total_enterprise_ale_usd: totalEnterpriseAle,
      total_enterprise_ale_millions_usd: totalEnterpriseAle / 1_000_000,
      risk_delta_24h_usd: deltaUsd,
      risk_trend: riskTrend,
      telemetry,
      scenario_multipliers: scenarioMultipliers,
      scenarios: scenarioResults,
      top_scenarios: [...scenarioResults].sort((a, b) => b.current_ale_usd - a.current_ale_usd).slice(0, 3),
      computed_at: new Date().toISOString()
    };
  } catch (error) {
    if (ownsClient) await client.query('ROLLBACK');
    console.error('[FAIR Engine Exception]:', error.message);
    throw error;
  } finally {
    if (ownsClient) client.release();
  }
}

async function getFairExposureSummary() {
  const scenarios = await pool.query(`
    SELECT scenario_id, description, current_ale_usd, last_computed_at,
           threat_event_frequency, vulnerability_percentage, min_loss_usd, max_loss_usd,
           tef_calibration_factor, vulnerability_calibration_factor
    FROM fair_risk_scenarios
    ORDER BY current_ale_usd DESC
  `);

  const exposures = await pool.query(`
    SELECT are.asset_id, are.scenario_id, are.dynamic_multiplier,
           are.calculated_exposure_usd, are.evaluated_at,
           ar.name AS asset_name, ar.asset_origin, ar.validation_posture
    FROM asset_risk_exposures are
    LEFT JOIN asset_register ar ON ar.asset_id = are.asset_id
    ORDER BY are.calculated_exposure_usd DESC
    LIMIT 100
  `);

  let totalMetric = null;
  let deltaMetric = null;
  try {
    const metricRows = await pool.query(
      `SELECT * FROM governance_metric_snapshots WHERE metric_code = ANY($1)`,
      [[TOTAL_RISK_METRIC, DELTA_RISK_METRIC]]
    );
    totalMetric = metricRows.rows.find((r) => r.metric_code === TOTAL_RISK_METRIC) || null;
    deltaMetric = metricRows.rows.find((r) => r.metric_code === DELTA_RISK_METRIC) || null;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  let recentTelemetry = [];
  try {
    const logRows = await pool.query(`
      SELECT scenario_id, driver, raw_value, multiplier_applied, recorded_at
      FROM fair_risk_telemetry_log
      ORDER BY recorded_at DESC
      LIMIT 20
    `);
    recentTelemetry = logRows.rows;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  const totalAle = scenarios.rows.reduce(
    (sum, row) => sum + parseFloat(row.current_ale_usd || 0),
    0
  );

  const topScenarios = scenarios.rows.slice(0, 3);
  const lastComputed = scenarios.rows.reduce((latest, row) => {
    if (!row.last_computed_at) return latest;
    const ts = new Date(row.last_computed_at).getTime();
    return ts > latest ? ts : latest;
  }, 0);

  const riskDelta24hUsd = deltaMetric
    ? parseFloat(deltaMetric.current_value) * 1_000_000
    : 0;

  let riskTrend = 'stable';
  if (riskDelta24hUsd > 0) riskTrend = 'increasing';
  else if (riskDelta24hUsd < 0) riskTrend = 'decreasing';

  return {
    total_enterprise_ale_usd: totalAle,
    risk_delta_24h_usd: riskDelta24hUsd,
    risk_trend: riskTrend,
    last_computed_at: lastComputed ? new Date(lastComputed).toISOString() : null,
    metric_snapshot: totalMetric,
    delta_metric_snapshot: deltaMetric,
    scenarios: scenarios.rows,
    top_scenarios: topScenarios,
    top_asset_exposures: exposures.rows,
    recent_telemetry_log: recentTelemetry,
    attestation_timestamp: new Date().toISOString()
  };
}

module.exports = {
  pool,
  computeFairExposure,
  getFairExposureSummary,
  capMultiplier,
  TOTAL_RISK_METRIC,
  DELTA_RISK_METRIC,
  MAX_MULTIPLIER
};
