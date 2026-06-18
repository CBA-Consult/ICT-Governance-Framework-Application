/**
 * FAIR model calibration — observed incident frequency → TEF / MITRE weight tuning (GV.RM)
 */
const crypto = require('crypto');
const { Pool } = require('pg');
const { capMultiplier } = require('./fair-risk-engine');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const LEARNING_RATE = Number(process.env.FAIR_CALIBRATION_LEARNING_RATE) || 0.15;
const MIN_FACTOR = Number(process.env.FAIR_CALIBRATION_MIN_FACTOR) || 0.75;
const MAX_FACTOR = Number(process.env.FAIR_CALIBRATION_MAX_FACTOR) || 1.35;
const MAX_DELTA_PER_RUN = Number(process.env.FAIR_CALIBRATION_MAX_DELTA) || 0.1;
const AUTO_APPROVE_PCT = Number(process.env.FAIR_CALIBRATION_AUTO_APPROVE_PCT) || 5;
const APPROVAL_THRESHOLD_PCT = Number(process.env.FAIR_CALIBRATION_APPROVAL_THRESHOLD_PCT) || 10;
const MIN_WEIGHT = 0.1;
const MAX_WEIGHT = 5.0;

function adjustmentDeltaPct(previous, proposed) {
  const prev = parseFloat(previous) || 1;
  const next = parseFloat(proposed) || 1;
  if (prev === 0) return 0;
  return ((next - prev) / prev) * 100;
}

function classifyGovernanceTier(previous, proposed) {
  const deltaPct = Math.abs(adjustmentDeltaPct(previous, proposed));
  if (deltaPct <= AUTO_APPROVE_PCT) return 'auto';
  if (deltaPct <= APPROVAL_THRESHOLD_PCT) return 'flagged';
  return 'pending_approval';
}

function annualizeCount(count, windowDays) {
  if (!windowDays || windowDays <= 0) return 0;
  return (count / windowDays) * 365;
}

function computeAdjustmentFactor(observedAnnual, expectedAnnual) {
  if (!expectedAnnual || expectedAnnual <= 0) return 1.0;
  const ratio = observedAnnual / expectedAnnual;
  const clampedRatio = Math.min(Math.max(ratio, 0.25), 4);
  const dampened = 1 + (clampedRatio - 1) * LEARNING_RATE;
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, dampened));
}

function applyCappedDelta(previous, target) {
  const delta = target - previous;
  if (Math.abs(delta) <= MAX_DELTA_PER_RUN) return target;
  return previous + Math.sign(delta) * MAX_DELTA_PER_RUN;
}

async function observeScenarioFrequency(client, scenarioId, windowDays) {
  try {
    const { rows } = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM governance_incidents
      WHERE fair_scenario_id = $1
        AND detected_at >= NOW() - ($2 || ' days')::interval
      `,
      [scenarioId, windowDays]
    );
    return rows[0]?.count || 0;
  } catch (err) {
    if (err.code === '42703' || err.code === '42P01') return 0;
    throw err;
  }
}

async function observeTechniqueFrequency(client, technique, windowDays) {
  try {
    const { rows } = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM governance_incidents
      WHERE mitre_technique = $1
        AND detected_at >= NOW() - ($2 || ' days')::interval
      `,
      [technique, windowDays]
    );
    return rows[0]?.count || 0;
  } catch (err) {
    if (err.code === '42703' || err.code === '42P01') return 0;
    throw err;
  }
}

async function insertCalibrationLog(client, entry) {
  await client.query(
    `
    INSERT INTO fair_model_calibration_log (
      calibration_target, scenario_id, technique,
      observed_frequency, expected_frequency, frequency_ratio,
      adjustment_factor, previous_value, new_value,
      window_days, applied_by, correlation_id, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `,
    [
      entry.calibration_target,
      entry.scenario_id || null,
      entry.technique || null,
      entry.observed_frequency,
      entry.expected_frequency,
      entry.frequency_ratio,
      entry.adjustment_factor,
      entry.previous_value,
      entry.new_value,
      entry.window_days,
      entry.applied_by || 'system',
      entry.correlation_id || null,
      entry.notes || null
    ]
  );
}

async function insertCalibrationApproval(client, entry) {
  const { rows } = await client.query(
    `
    INSERT INTO fair_calibration_approvals (
      calibration_target, scenario_id, technique,
      previous_value, proposed_value, proposed_adjustment_pct,
      governance_tier, status, window_days, correlation_id,
      observed_frequency, expected_frequency, requested_by, review_notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11, $12, $13)
    RETURNING *
    `,
    [
      entry.calibration_target,
      entry.scenario_id || null,
      entry.technique || null,
      entry.previous_value,
      entry.proposed_value,
      entry.proposed_adjustment_pct,
      entry.governance_tier || 'pending_approval',
      entry.window_days,
      entry.correlation_id || null,
      entry.observed_frequency,
      entry.expected_frequency,
      entry.requested_by || 'system',
      entry.review_notes || null
    ]
  );
  return rows[0];
}

async function calibrateScenarioTef(client, scenario, windowDays, options) {
  if (scenario.calibration_locked) {
    return {
      calibration_target: 'scenario_tef',
      scenario_id: scenario.scenario_id,
      skipped: true,
      reason: 'calibration_locked',
      dry_run: options.dryRun,
      applied: false
    };
  }

  const observedCount = await observeScenarioFrequency(client, scenario.scenario_id, windowDays);
  const observedAnnual = annualizeCount(observedCount, windowDays);
  const expectedAnnual = parseFloat(scenario.threat_event_frequency) || 0;
  const adjustment = computeAdjustmentFactor(observedAnnual, expectedAnnual);
  const previousFactor = parseFloat(scenario.tef_calibration_factor) || 1.0;
  const targetFactor = capMultiplier(previousFactor * adjustment);
  const newFactor = applyCappedDelta(previousFactor, targetFactor);
  const ratio = expectedAnnual > 0 ? observedAnnual / expectedAnnual : null;
  const deltaPct = adjustmentDeltaPct(previousFactor, newFactor);
  const governanceTier = classifyGovernanceTier(previousFactor, newFactor);

  const logEntry = {
    calibration_target: 'scenario_tef',
    scenario_id: scenario.scenario_id,
    observed_frequency: observedAnnual,
    expected_frequency: expectedAnnual,
    frequency_ratio: ratio,
    adjustment_factor: adjustment,
    previous_value: previousFactor,
    new_value: newFactor,
    window_days: windowDays,
    applied_by: options.appliedBy,
    correlation_id: options.correlationId,
    notes: `${observedCount} incidents in ${windowDays}d window · governance=${governanceTier}`,
    governance_tier: governanceTier,
    proposed_adjustment_pct: deltaPct
  };

  if (Math.abs(newFactor - previousFactor) < 0.0001) {
    return { ...logEntry, dry_run: options.dryRun, applied: false, governance_tier: 'none' };
  }

  if (options.dryRun) {
    return {
      ...logEntry,
      dry_run: true,
      applied: false,
      would_require_approval: governanceTier === 'pending_approval'
    };
  }

  if (governanceTier === 'pending_approval') {
    const approval = await insertCalibrationApproval(client, {
      ...logEntry,
      proposed_value: newFactor,
      requested_by: options.appliedBy,
      review_notes: `Adjustment ${deltaPct.toFixed(1)}% exceeds ${APPROVAL_THRESHOLD_PCT}% threshold`
    });
    return {
      ...logEntry,
      applied: false,
      pending_approval: true,
      approval_id: approval.approval_id,
      governance_tier: governanceTier
    };
  }

  await client.query(
    `
    UPDATE fair_risk_scenarios
    SET tef_calibration_factor = $1, last_computed_at = last_computed_at
    WHERE scenario_id = $2
    `,
    [newFactor, scenario.scenario_id]
  );
  await insertCalibrationLog(client, logEntry);

  return {
    ...logEntry,
    dry_run: false,
    applied: true,
    governance_tier: governanceTier
  };
}

async function calibrateMitreWeights(client, windowDays, options) {
  let mappings = [];
  try {
    const { rows } = await client.query(`
      SELECT mapping_id, technique, scenario_id, severity_weight
      FROM mitre_to_fair_mapping
      WHERE technique IS NOT NULL
      ORDER BY technique
    `);
    mappings = rows;
  } catch (err) {
    if (err.code === '42P01') return [];
    throw err;
  }

  const adjustments = [];
  for (const mapping of mappings) {
    const observedCount = await observeTechniqueFrequency(client, mapping.technique, windowDays);
    if (observedCount === 0) continue;

    const scenarioRow = await client.query(
      `SELECT threat_event_frequency FROM fair_risk_scenarios WHERE scenario_id = $1`,
      [mapping.scenario_id]
    );
    const scenarioTef = parseFloat(scenarioRow.rows[0]?.threat_event_frequency) || 1;
    const techniqueCountForScenario = await client.query(
      `
      SELECT COUNT(*)::int AS count FROM mitre_to_fair_mapping
      WHERE scenario_id = $1 AND technique IS NOT NULL
      `,
      [mapping.scenario_id]
    );
    const techniqueSlots = Math.max(techniqueCountForScenario.rows[0]?.count || 1, 1);
    const expectedAnnual = scenarioTef / techniqueSlots;
    const observedAnnual = annualizeCount(observedCount, windowDays);
    const adjustment = computeAdjustmentFactor(observedAnnual, expectedAnnual);
    const previousWeight = parseFloat(mapping.severity_weight) || 1.0;
    const targetWeight = capMultiplier(previousWeight * adjustment);
    const newWeight = applyCappedDelta(previousWeight, Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, targetWeight)));

    if (Math.abs(newWeight - previousWeight) < 0.0001) continue;

    const logEntry = {
      calibration_target: 'mitre_severity_weight',
      scenario_id: mapping.scenario_id,
      technique: mapping.technique,
      observed_frequency: observedAnnual,
      expected_frequency: expectedAnnual,
      frequency_ratio: expectedAnnual > 0 ? observedAnnual / expectedAnnual : null,
      adjustment_factor: adjustment,
      previous_value: previousWeight,
      new_value: newWeight,
      window_days: windowDays,
      applied_by: options.appliedBy,
      correlation_id: options.correlationId,
      notes: `${observedCount} incidents for ${mapping.technique}`
    };

    if (!options.dryRun) {
      await client.query(
        `
        UPDATE mitre_to_fair_mapping
        SET severity_weight = $1, last_updated = NOW()
        WHERE mapping_id = $2
        `,
        [newWeight, mapping.mapping_id]
      );
      await insertCalibrationLog(client, logEntry);
    }

    adjustments.push({ ...logEntry, dry_run: options.dryRun, applied: !options.dryRun });
  }

  return adjustments;
}

async function runCalibration(options = {}) {
  const windowDays = Math.min(Math.max(parseInt(options.windowDays, 10) || 30, 7), 365);
  const dryRun = Boolean(options.dryRun);
  const appliedBy = options.appliedBy || 'system';
  const correlationId = options.correlationId || crypto.randomUUID();
  const includeMitre = options.includeMitre !== false;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let scenariosResult;
    try {
      scenariosResult = await client.query(`
        SELECT scenario_id, description, threat_event_frequency,
               tef_calibration_factor, vulnerability_calibration_factor,
               COALESCE(calibration_locked, false) AS calibration_locked
        FROM fair_risk_scenarios
        ORDER BY scenario_id
      `);
    } catch (err) {
      if (err.code !== '42703') throw err;
      scenariosResult = await client.query(`
        SELECT scenario_id, description, threat_event_frequency,
               tef_calibration_factor, vulnerability_calibration_factor,
               false AS calibration_locked
        FROM fair_risk_scenarios
        ORDER BY scenario_id
      `);
    }
    const scenarios = scenariosResult.rows;

    const scenarioAdjustments = [];
    let pendingCount = 0;
    for (const scenario of scenarios) {
      const result = await calibrateScenarioTef(client, scenario, windowDays, { dryRun, appliedBy, correlationId });
      scenarioAdjustments.push(result);
      if (result.pending_approval) pendingCount += 1;
    }

    const mitreAdjustments = includeMitre
      ? await calibrateMitreWeights(client, windowDays, { dryRun, appliedBy, correlationId })
      : [];

    if (!dryRun) await client.query('COMMIT');
    else await client.query('ROLLBACK');

    return {
      correlation_id: correlationId,
      window_days: windowDays,
      dry_run: dryRun,
      scenario_adjustments: scenarioAdjustments,
      mitre_adjustments: mitreAdjustments,
      applied_count: scenarioAdjustments.filter((a) => a.applied).length
        + mitreAdjustments.filter((a) => a.applied).length,
      pending_approval_count: pendingCount,
      attestation_timestamp: new Date().toISOString()
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function deriveModelStability(scenarios) {
  const drifts = scenarios.map((s) => Math.abs((parseFloat(s.tef_calibration_factor) || 1) - 1) * 100);
  const maxDrift = drifts.length ? Math.max(...drifts) : 0;
  if (maxDrift <= 5) return { label: 'Stable', max_drift_pct: maxDrift, band: '±5%' };
  if (maxDrift <= 10) return { label: 'Moderate', max_drift_pct: maxDrift, band: '±10%' };
  return { label: 'Adjusting', max_drift_pct: maxDrift, band: `±${maxDrift.toFixed(1)}%` };
}

function buildScenarioDrift(scenarioRows) {
  return scenarioRows.map((row) => {
    const baselineTef = parseFloat(row.threat_event_frequency) || 0;
    const factor = parseFloat(row.tef_calibration_factor) || 1;
    const adjustedTef = baselineTef * factor;
    const driftPct = baselineTef > 0 ? ((adjustedTef - baselineTef) / baselineTef) * 100 : 0;
    return {
      scenario_id: row.scenario_id,
      description: row.description,
      baseline_tef: baselineTef,
      adjusted_tef: adjustedTef,
      tef_calibration_factor: factor,
      drift_pct: driftPct
    };
  }).sort((a, b) => Math.abs(b.drift_pct) - Math.abs(a.drift_pct));
}

function buildCalibrationSummary(scenarioRows, recentLog, avgMappingConfidence) {
  const scenarioDrift = buildScenarioDrift(scenarioRows);
  const lastRun = recentLog[0] || null;
  const recentScenarioAdjustments = recentLog.filter((e) => e.calibration_target === 'scenario_tef');

  let avgAdjustmentPct = null;
  if (recentScenarioAdjustments.length > 0) {
    const deltas = recentScenarioAdjustments
      .map((e) => {
        const prev = parseFloat(e.previous_value);
        const next = parseFloat(e.new_value);
        if (!prev) return null;
        return ((next - prev) / prev) * 100;
      })
      .filter((v) => v != null);
    if (deltas.length) {
      avgAdjustmentPct = deltas.reduce((s, v) => s + v, 0) / deltas.length;
    }
  }

  const mostAdjusted = scenarioDrift[0] || null;

  return {
    last_calibration_run: lastRun?.applied_at || null,
    last_run_by: lastRun?.applied_by || null,
    last_window_days: lastRun?.window_days || null,
    avg_adjustment_pct: avgAdjustmentPct,
    most_adjusted_scenario: mostAdjusted
      ? {
          scenario_id: mostAdjusted.scenario_id,
          drift_pct: mostAdjusted.drift_pct,
          baseline_tef: mostAdjusted.baseline_tef,
          adjusted_tef: mostAdjusted.adjusted_tef
        }
      : null,
    model_stability: deriveModelStability(scenarioRows),
    avg_mapping_confidence: avgMappingConfidence,
    total_adjustments_logged: recentLog.length
  };
}

async function getAverageMappingConfidence(client) {
  try {
    const { rows } = await client.query(`
      SELECT AVG(confidence_score)::numeric(4,3) AS avg_confidence,
             COUNT(*)::int AS mapping_count
      FROM mitre_to_fair_mapping
      WHERE technique IS NOT NULL
    `);
    return {
      average: rows[0]?.avg_confidence != null ? parseFloat(rows[0].avg_confidence) : null,
      mapping_count: rows[0]?.mapping_count || 0
    };
  } catch (err) {
    if (err.code === '42P01') return { average: null, mapping_count: 0 };
    throw err;
  }
}

async function getPendingApprovals({ limit = 20 } = {}) {
  try {
    const { rows } = await pool.query(
      `
      SELECT * FROM fair_calibration_approvals
      WHERE status = 'pending'
      ORDER BY requested_at DESC
      LIMIT $1
      `,
      [Math.min(limit, 100)]
    );
    return rows;
  } catch (err) {
    if (err.code === '42P01') return [];
    throw err;
  }
}

async function approveCalibration({ approvalId, reviewedBy, notes }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT * FROM fair_calibration_approvals WHERE approval_id = $1 FOR UPDATE`,
      [approvalId]
    );
    const approval = rows[0];
    if (!approval) {
      const err = new Error('Approval not found');
      err.statusCode = 404;
      throw err;
    }
    if (approval.status !== 'pending') {
      const err = new Error(`Approval already ${approval.status}`);
      err.statusCode = 409;
      throw err;
    }

    if (approval.calibration_target === 'scenario_tef' && approval.scenario_id) {
      const locked = await client.query(
        `SELECT calibration_locked FROM fair_risk_scenarios WHERE scenario_id = $1`,
        [approval.scenario_id]
      );
      if (locked.rows[0]?.calibration_locked) {
        const err = new Error('Scenario calibration is locked');
        err.statusCode = 423;
        throw err;
      }
      await client.query(
        `UPDATE fair_risk_scenarios SET tef_calibration_factor = $1 WHERE scenario_id = $2`,
        [approval.proposed_value, approval.scenario_id]
      );
    } else if (approval.calibration_target === 'mitre_severity_weight' && approval.technique) {
      await client.query(
        `UPDATE mitre_to_fair_mapping SET severity_weight = $1, last_updated = NOW() WHERE technique = $2`,
        [approval.proposed_value, approval.technique]
      );
    }

    const logResult = await client.query(
      `
      INSERT INTO fair_model_calibration_log (
        calibration_target, scenario_id, technique,
        observed_frequency, expected_frequency, frequency_ratio,
        adjustment_factor, previous_value, new_value,
        window_days, applied_by, correlation_id, notes
      )
      VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
      `,
      [
        approval.calibration_target,
        approval.scenario_id,
        approval.technique,
        approval.observed_frequency,
        approval.expected_frequency,
        1,
        approval.previous_value,
        approval.proposed_value,
        approval.window_days,
        reviewedBy || 'approver',
        approval.correlation_id,
        `Approved by ${reviewedBy || 'approver'}${notes ? `: ${notes}` : ''}`
      ]
    );

    const updated = await client.query(
      `
      UPDATE fair_calibration_approvals
      SET status = 'approved', reviewed_by = $2, reviewed_at = NOW(),
          review_notes = $3, calibration_log_id = $4
      WHERE approval_id = $1
      RETURNING *
      `,
      [approvalId, reviewedBy || 'approver', notes || null, logResult.rows[0].id]
    );

    await client.query('COMMIT');
    return updated.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function rejectCalibration({ approvalId, reviewedBy, notes }) {
  const { rows } = await pool.query(
    `
    UPDATE fair_calibration_approvals
    SET status = 'rejected', reviewed_by = $2, reviewed_at = NOW(), review_notes = $3
    WHERE approval_id = $1 AND status = 'pending'
    RETURNING *
    `,
    [approvalId, reviewedBy || 'reviewer', notes || 'Rejected']
  );
  if (!rows.length) {
    const err = new Error('Pending approval not found');
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
}

async function rollbackCalibration({ logId, appliedBy, notes }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT * FROM fair_model_calibration_log WHERE id = $1`,
      [logId]
    );
    const entry = rows[0];
    if (!entry) {
      const err = new Error('Calibration log entry not found');
      err.statusCode = 404;
      throw err;
    }

    const revertTo = parseFloat(entry.previous_value);
    if (entry.calibration_target === 'scenario_tef' && entry.scenario_id) {
      await client.query(
        `UPDATE fair_risk_scenarios SET tef_calibration_factor = $1 WHERE scenario_id = $2`,
        [revertTo, entry.scenario_id]
      );
    } else if (entry.calibration_target === 'mitre_severity_weight' && entry.technique) {
      await client.query(
        `UPDATE mitre_to_fair_mapping SET severity_weight = $1, last_updated = NOW() WHERE technique = $2`,
        [revertTo, entry.technique]
      );
    }

    const current = parseFloat(entry.new_value);
    await insertCalibrationLog(client, {
      calibration_target: entry.calibration_target,
      scenario_id: entry.scenario_id,
      technique: entry.technique,
      observed_frequency: entry.observed_frequency,
      expected_frequency: entry.expected_frequency,
      frequency_ratio: entry.frequency_ratio,
      adjustment_factor: 1,
      previous_value: current,
      new_value: revertTo,
      window_days: entry.window_days,
      applied_by: appliedBy || 'rollback',
      correlation_id: entry.correlation_id,
      notes: notes || `Rollback of calibration log #${logId}`
    });

    await client.query('COMMIT');
    return {
      rolled_back_log_id: logId,
      scenario_id: entry.scenario_id,
      technique: entry.technique,
      reverted_to: revertTo,
      reverted_from: current
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function setScenarioCalibrationLock({ scenarioId, locked }) {
  const { rows } = await pool.query(
    `
    UPDATE fair_risk_scenarios
    SET calibration_locked = $2
    WHERE scenario_id = $1
    RETURNING scenario_id, calibration_locked
    `,
    [scenarioId, Boolean(locked)]
  );
  if (!rows.length) {
    const err = new Error('Scenario not found');
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
}

async function getCalibrationStatus({ limit = 20 } = {}) {
  const client = await pool.connect();
  try {
    let scenarios;
    try {
      scenarios = await client.query(`
        SELECT scenario_id, description, threat_event_frequency, vulnerability_percentage,
               tef_calibration_factor, vulnerability_calibration_factor, current_ale_usd,
               COALESCE(calibration_locked, false) AS calibration_locked
        FROM fair_risk_scenarios
        ORDER BY scenario_id
      `);
    } catch (err) {
      if (err.code === '42703') {
        scenarios = await client.query(`
          SELECT scenario_id, description, threat_event_frequency, vulnerability_percentage,
                 1.0 AS tef_calibration_factor, 1.0 AS vulnerability_calibration_factor,
                 current_ale_usd
          FROM fair_risk_scenarios
          ORDER BY scenario_id
        `);
      } else {
        throw err;
      }
    }

    let recentLog = [];
    try {
      const log = await client.query(
        `
        SELECT *
        FROM fair_model_calibration_log
        ORDER BY applied_at DESC
        LIMIT $1
        `,
        [limit]
      );
      recentLog = log.rows;
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }

    const mappingConfidence = await getAverageMappingConfidence(client);
    const scenarioDrift = buildScenarioDrift(scenarios.rows);
    const pendingApprovals = await getPendingApprovals({ limit: 10 });

    return {
      scenarios: scenarios.rows,
      scenario_drift: scenarioDrift,
      recent_adjustments: recentLog,
      pending_approvals: pendingApprovals,
      summary: {
        ...buildCalibrationSummary(scenarios.rows, recentLog, mappingConfidence.average),
        pending_approval_count: pendingApprovals.length
      },
      mapping_confidence: mappingConfidence,
      governance: {
        auto_approve_pct: AUTO_APPROVE_PCT,
        approval_threshold_pct: APPROVAL_THRESHOLD_PCT,
        max_delta_per_run_pct: MAX_DELTA_PER_RUN * 100
      },
      parameters: {
        learning_rate: LEARNING_RATE,
        min_factor: MIN_FACTOR,
        max_factor: MAX_FACTOR,
        max_delta_per_run: MAX_DELTA_PER_RUN
      },
      attestation_timestamp: new Date().toISOString()
    };
  } finally {
    client.release();
  }
}

async function getCalibrationLog({ limit = 50, scenarioId = null } = {}) {
  const params = [Math.min(limit, 200)];
  let where = '';
  if (scenarioId) {
    where = 'WHERE scenario_id = $2';
    params.push(scenarioId);
  }
  try {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM fair_model_calibration_log
      ${where}
      ORDER BY applied_at DESC
      LIMIT $1
      `,
      params
    );
    return { entries: rows, count: rows.length };
  } catch (err) {
    if (err.code === '42P01') return { entries: [], count: 0 };
    throw err;
  }
}

module.exports = {
  pool,
  runCalibration,
  getCalibrationStatus,
  getCalibrationLog,
  getPendingApprovals,
  approveCalibration,
  rejectCalibration,
  rollbackCalibration,
  setScenarioCalibrationLock,
  computeAdjustmentFactor,
  annualizeCount,
  observeScenarioFrequency,
  buildScenarioDrift,
  deriveModelStability,
  classifyGovernanceTier,
  adjustmentDeltaPct
};
