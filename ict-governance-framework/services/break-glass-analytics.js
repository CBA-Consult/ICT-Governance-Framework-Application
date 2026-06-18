/**
 * Break Glass / JIT privileged action trend aggregation for executive dashboards.
 */
const { pool } = require('./jit-elevation');

const BREAK_GLASS_METRIC = 'KPI-GOV-BREAK-GLASS-AUDIT';
const DEFAULT_DAYS = 30;

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

  return {
    trend,
    currentKpiScore,
    metricCode: BREAK_GLASS_METRIC,
    emergencyTotal,
    standardJitTotal,
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
  getBreakGlassTrend,
  getBreakGlassKpiSnapshot,
  computeAuditIntegrityScore,
  getBreakGlassAnalytics
};
