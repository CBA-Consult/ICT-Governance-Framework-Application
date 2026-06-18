/**
 * Automated post-incident reconciliation for expired Break Glass emergency contexts.
 */
const { pool } = require('./jit-elevation');

const BREAK_GLASS_METRIC = 'KPI-GOV-BREAK-GLASS-AUDIT';

async function patchBreakGlassReconciliationMetric(ticketId, mutationCount) {
  const context = `Break Glass ticket ${ticketId} reconciled — ${mutationCount} privileged mutation(s) during emergency window`;

  try {
    await pool.query(
      `
      INSERT INTO governance_metric_snapshots (metric_code, current_value, target_value, last_context)
      VALUES ($1, LEAST($2, 100), 100, $3)
      ON CONFLICT (metric_code) DO UPDATE SET
        current_value = LEAST(governance_metric_snapshots.current_value + $2, 100),
        last_updated = CURRENT_TIMESTAMP,
        last_context = $3
      `,
      [BREAK_GLASS_METRIC, Math.max(mutationCount, 1), context]
    );
  } catch (err) {
    if (err.code === '42P01') {
      console.warn('[break-glass-reconciler] governance_metric_snapshots unavailable; skipping KPI patch');
      return;
    }
    throw err;
  }
}

async function reconcileExpiredBreakGlassTicket(ticketId) {
  const ticketRow = await pool.query(
    'SELECT scope_tenant FROM jit_elevation_ledger WHERE ticket_id = $1',
    [ticketId]
  );
  const scopeTenant = ticketRow.rows[0]?.scope_tenant || 'all-tenants';

  const mutationResult = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM privileged_action_logs
    WHERE jit_ticket_id = $1 AND is_break_glass = true
    `,
    [ticketId]
  );

  const mutationCount = mutationResult.rows[0]?.count || 0;

  await pool.query(
    `
    UPDATE jit_elevation_ledger
    SET status = 'Expired',
        revoked_at = CURRENT_TIMESTAMP,
        revoked_reason = 'Automated system timeout reconciliation'
    WHERE ticket_id = $1 AND status = 'Break_Glass_Active'
    `,
    [ticketId]
  );

  let unverifiedAssets = 0;
  try {
    const driftCheck = await pool.query(
      `
      SELECT COUNT(*)::int AS unverified_assets
      FROM asset_register ar
      WHERE ar.validation_posture = 'Unverified'
        AND ($1 = 'all-tenants' OR ar.tenant_id = $1)
      `,
      [scopeTenant]
    );
    unverifiedAssets = driftCheck.rows[0]?.unverified_assets || 0;
  } catch (err) {
    if (err.code !== '42703') throw err;
  }

  await patchBreakGlassReconciliationMetric(ticketId, mutationCount);

  console.log(
    `[Reconciliation Worker] Closed emergency ticket ${ticketId}. ` +
    `Privileged mutations: ${mutationCount}. ` +
    `Unverified asset drift signals: ${unverifiedAssets}.`
  );

  return { ticketId, mutationCount, unverifiedAssets };
}

async function runEmergencyReconciliationSweep() {
  const { rows } = await pool.query(
    `
    SELECT ticket_id, valid_until
    FROM jit_elevation_ledger
    WHERE status = 'Break_Glass_Active' AND valid_until < CURRENT_TIMESTAMP
  `
  );

  const results = [];
  for (const ticket of rows) {
    try {
      const result = await reconcileExpiredBreakGlassTicket(ticket.ticket_id);
      results.push(result);
    } catch (err) {
      console.error(`[Reconciliation Sweep] Failed for ${ticket.ticket_id}:`, err.message);
    }
  }

  return { reconciled: results.length, tickets: results };
}

let reconcilerInterval = null;

function startBreakGlassReconciler(intervalMs = 5 * 60 * 1000) {
  if (reconcilerInterval) return { started: false, reason: 'already running' };

  const tick = () => {
    runEmergencyReconciliationSweep().catch((err) => {
      console.error('[break-glass-reconciler] sweep failed:', err.message);
    });
  };

  tick();
  reconcilerInterval = setInterval(tick, intervalMs);
  return { started: true, intervalMs };
}

function stopBreakGlassReconciler() {
  if (reconcilerInterval) {
    clearInterval(reconcilerInterval);
    reconcilerInterval = null;
  }
}

module.exports = {
  BREAK_GLASS_METRIC,
  runEmergencyReconciliationSweep,
  reconcileExpiredBreakGlassTicket,
  startBreakGlassReconciler,
  stopBreakGlassReconciler
};
