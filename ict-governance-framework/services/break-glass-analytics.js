/**
 * Break Glass / JIT privileged action trend aggregation for executive dashboards.
 */
const { pool } = require('./jit-elevation');

const BREAK_GLASS_METRIC = 'KPI-GOV-BREAK-GLASS-AUDIT';
const DEFAULT_DAYS = 30;
/** Production expectation: GA lockout is rare — more than one emergency per 30 days warrants audit review. */
const EMERGENCY_BASELINE_PER_30_DAYS = 1;
const ELEVATED_EMERGENCY_THRESHOLD = 2;

function assessVolume(emergencyTotal, standardJitTotal, windowDays = DEFAULT_DAYS) {
  const scale = windowDays / 30;
  const emergencyBaseline = Math.ceil(EMERGENCY_BASELINE_PER_30_DAYS * scale);

  let level = 'within_baseline';
  const messages = [];

  if (emergencyTotal > ELEVATED_EMERGENCY_THRESHOLD * scale) {
    level = 'elevated';
    messages.push(
      `${emergencyTotal} emergency activations in ${windowDays} days exceeds the production baseline (≤${emergencyBaseline}). ` +
        'This volume is atypical for Global Administrator lockout — audit review is required.'
    );
  } else if (emergencyTotal > emergencyBaseline) {
    level = 'review_recommended';
    messages.push(
      `Emergency count (${emergencyTotal}) is above the expected ≤${emergencyBaseline} per ${windowDays} days. Confirm events are genuine production incidents.`
    );
  }

  if (emergencyTotal >= 5 || standardJitTotal >= 15) {
    if (level === 'within_baseline') level = 'development_noise';
    messages.push(
      'High privileged-action volume often reflects SecOps verification runs (npm run verify:secops) or calibration tests — not repeated GA lockouts.'
    );
  }

  return {
    level,
    messages,
    emergencyBaselinePerWindow: emergencyBaseline,
    expectedEmergencyPer30Days: EMERGENCY_BASELINE_PER_30_DAYS
  };
}

async function getBreakGlassTrend(days = DEFAULT_DAYS) {
  const { rows } = await pool.query(
    `
    SELECT
      TO_CHAR(timestamp, 'YYYY-MM-DD') AS date_bucket,
      COUNT(*) FILTER (WHERE is_break_glass = true)::int AS emergency_count,
      COUNT(*) FILTER (WHERE is_break_glass = false AND jit_ticket_id IS NOT NULL)::int AS standard_jit_count
    FROM privileged_action_logs
    WHERE timestamp >= NOW() - ($1::int * INTERVAL '1 day')
    GROUP BY TO_CHAR(timestamp, 'YYYY-MM-DD')
    ORDER BY date_bucket ASC
    `,
    [days]
  );

  return rows;
}

async function getBreakGlassKpiSnapshot() {
  try {
    const { rows } = await pool.query(
      `
      SELECT metric_code, current_value, target_value, last_updated, last_context
      FROM governance_metric_snapshots
      WHERE metric_code = $1
      `,
      [BREAK_GLASS_METRIC]
    );
    return rows[0] || null;
  } catch (err) {
    if (err.code === '42P01') return null;
    throw err;
  }
}

function computeAuditIntegrityScore(snapshot, trendRows) {
  const emergencyTotal = trendRows.reduce(
    (sum, row) => sum + Number(row.emergency_count || 0),
    0
  );

  if (snapshot) {
    const exposure = Number(snapshot.current_value || 0);
    return Math.max(0, Math.min(100, 100 - exposure));
  }

  const penalty = Math.min(emergencyTotal * 5, 100);
  return Math.max(0, 100 - penalty);
}

async function getBreakGlassAnalytics(days = DEFAULT_DAYS) {
  const trend = await getBreakGlassTrend(days);
  const snapshot = await getBreakGlassKpiSnapshot();
  const currentKpiScore = computeAuditIntegrityScore(snapshot, trend);

  const emergencyTotal = trend.reduce((s, r) => s + Number(r.emergency_count || 0), 0);
  const standardJitTotal = trend.reduce((s, r) => s + Number(r.standard_jit_count || 0), 0);
  const volumeAssessment = assessVolume(emergencyTotal, standardJitTotal, days);

  return {
    trend,
    currentKpiScore,
    metricCode: BREAK_GLASS_METRIC,
    emergencyTotal,
    standardJitTotal,
    volumeAssessment,
    snapshot: snapshot
      ? {
          currentValue: Number(snapshot.current_value),
          targetValue: Number(snapshot.target_value),
          lastUpdated: snapshot.last_updated,
          lastContext: snapshot.last_context
        }
      : null,
    windowDays: days
  };
}

module.exports = {
  BREAK_GLASS_METRIC,
  EMERGENCY_BASELINE_PER_30_DAYS,
  assessVolume,
  getBreakGlassTrend,
  getBreakGlassKpiSnapshot,
  computeAuditIntegrityScore,
  getBreakGlassAnalytics
};
