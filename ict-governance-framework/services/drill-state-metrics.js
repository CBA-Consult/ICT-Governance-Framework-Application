/**
 * Patches executive measurement-plan KPI snapshots when DR drill state transitions occur.
 * Gate B Asset Register UI — Step 3 (A004 measurement plan integration)
 */

const AUTOMATION_METRIC = 'KPI-GOV-AUTOMATION-TARGET';
const MAX_SCORE = 100;

async function handleDrillStateTransition(pool, assetId, newState, context = '') {
  if (newState !== 'DR_Hydrated') {
    return { patched: false, reason: 'No metric patch required for this state' };
  }

  const incrementValue = 1.2;
  const patchContext = context || `Asset state change automated sync for asset reference: ${assetId}`;

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO governance_metric_snapshots (metric_code, current_value, target_value, last_context)
      VALUES ($1, LEAST($2, $3), $3, $4)
      ON CONFLICT (metric_code) DO UPDATE SET
        current_value = LEAST(governance_metric_snapshots.current_value + $2, $3),
        last_updated = CURRENT_TIMESTAMP,
        last_context = $4
      RETURNING metric_code, current_value, target_value, last_updated
      `,
      [AUTOMATION_METRIC, incrementValue, MAX_SCORE, patchContext]
    );

    return {
      patched: true,
      metric: rows[0],
      incrementValue
    };
  } catch (err) {
    if (err.code === '42P01') {
      console.warn('[measurement-plan] governance_metric_snapshots table not found; skipping KPI patch');
      return { patched: false, reason: 'metric table unavailable' };
    }
    throw err;
  }
}

async function getMetricSnapshot(pool, metricCode = AUTOMATION_METRIC) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM governance_metric_snapshots WHERE metric_code = $1',
      [metricCode]
    );
    return rows[0] || null;
  } catch (err) {
    if (err.code === '42P01') return null;
    throw err;
  }
}

module.exports = {
  AUTOMATION_METRIC,
  handleDrillStateTransition,
  getMetricSnapshot
};
