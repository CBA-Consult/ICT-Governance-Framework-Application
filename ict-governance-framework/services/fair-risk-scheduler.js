/**
 * Optional periodic FAIR risk quantification sweep.
 */
const { computeFairExposure } = require('./fair-risk-engine');

const DEFAULT_INTERVAL_MS = Number(process.env.FAIR_RISK_SWEEP_INTERVAL_MS) || 60 * 60 * 1000;

let timer = null;

function startFairRiskScheduler() {
  if (timer) return { started: false, reason: 'already_running' };

  const runSweep = async () => {
    try {
      await computeFairExposure();
    } catch (err) {
      console.error('[fair-risk-scheduler] Sweep failed:', err.message);
    }
  };

  runSweep();
  timer = setInterval(runSweep, DEFAULT_INTERVAL_MS);
  if (timer.unref) timer.unref();

  console.log(`[fair-risk-scheduler] Started (interval ${DEFAULT_INTERVAL_MS}ms)`);
  return { started: true, intervalMs: DEFAULT_INTERVAL_MS };
}

function stopFairRiskScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { startFairRiskScheduler, stopFairRiskScheduler };
