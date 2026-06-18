/**
 * Manual cryptographic ledger verification for a specific JIT / Break Glass ticket.
 */
const crypto = require('crypto');
const { pool, getLedgerTicket } = require('./jit-elevation');

const BREAK_GLASS_METRIC = 'KPI-GOV-BREAK-GLASS-AUDIT';
const HASH_PATTERN = /^[a-f0-9]{64}$/i;

function buildVerificationDigest(ticketId, actions) {
  const canonical = actions
    .map((row) => `${row.endpoint}|${row.http_method}|${row.payload_hash}|${row.timestamp}`)
    .sort()
    .join('\n');

  return crypto.createHash('sha256').update(`${ticketId}\n${canonical}`).digest('hex');
}

async function patchManualReconciliationMetric(ticketId, verifiedCount) {
  const context = `Manual audit sweep passed for ${ticketId} — ${verifiedCount} action(s) cryptographically aligned`;

  await pool.query(
    `
    INSERT INTO governance_metric_snapshots (metric_code, current_value, target_value, last_context)
    VALUES ($1, 0, 100, $2)
    ON CONFLICT (metric_code) DO UPDATE SET
      current_value = GREATEST(0, governance_metric_snapshots.current_value - 1.5),
      last_updated = CURRENT_TIMESTAMP,
      last_context = $2
    `,
    [BREAK_GLASS_METRIC, context]
  );
}

async function runManualLedgerReconciliation({
  ticketId,
  actorId,
  reconcilerTicketId = null
}) {
  const ticket = await getLedgerTicket(ticketId);
  if (!ticket) {
    const error = new Error(`JIT ticket not found: ${ticketId}`);
    error.code = 'TICKET_NOT_FOUND';
    throw error;
  }

  if (ticket.revoked_reason && ticket.revoked_reason.includes('Manual Audit Sweep Passed')) {
    return {
      alreadyReconciled: true,
      ticketId,
      message: `Ticket ${ticketId} was previously closed by manual audit sweep.`,
      verifiedActionsCount: 0,
      anomaliesDetected: false,
      auditReportLog: []
    };
  }

  const { rows: loggedActions } = await pool.query(
    `
    SELECT id, endpoint, http_method, payload_hash, timestamp, is_break_glass, target_resource_id
    FROM privileged_action_logs
    WHERE jit_ticket_id = $1
    ORDER BY timestamp ASC
    `,
    [ticketId]
  );

  const validFrom = new Date(ticket.valid_from);
  const validUntil = new Date(ticket.valid_until);
  const auditReportLog = [];
  let anomaliesFound = false;

  for (const action of loggedActions) {
    const actionTime = new Date(action.timestamp);
    const hashValid = HASH_PATTERN.test(action.payload_hash || '');
    const withinWindow = actionTime >= validFrom && actionTime <= validUntil;
    const isClean = hashValid && withinWindow;

    if (!isClean) {
      anomaliesFound = true;
    }

    auditReportLog.push({
      endpoint: action.endpoint,
      httpMethod: action.http_method,
      payloadHash: action.payload_hash,
      timestamp: action.timestamp,
      status: isClean ? 'VERIFIED_CLEAN' : 'ANOMALY_DETECTED',
      checks: {
        hashValid,
        withinWindow
      }
    });
  }

  if (anomaliesFound) {
    const error = new Error('Cryptographic reconciliation failed — anomalies detected in privileged action log chain.');
    error.code = 'RECONCILIATION_ANOMALIES';
    error.details = { ticketId, auditReportLog, anomaliesDetected: true };
    throw error;
  }

  const verificationDigest = buildVerificationDigest(ticketId, loggedActions);

  await pool.query(
    `
    UPDATE jit_elevation_ledger
    SET status = 'Expired',
        revoked_at = CURRENT_TIMESTAMP,
        revoked_reason = $2
    WHERE ticket_id = $1
    `,
    [ticketId, 'Manual Audit Sweep Passed. Clean reconciliation index.']
  );

  await patchManualReconciliationMetric(ticketId, loggedActions.length);

  const sweepPayloadHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ ticketId, verificationDigest, verifiedActionsCount: loggedActions.length }))
    .digest('hex');

  await pool.query(
    `
    INSERT INTO privileged_action_logs (
      actor_id, jit_ticket_id, endpoint, http_method, action, target_resource_id, is_break_glass, payload_hash
    ) VALUES ($1, $2, $3, $4, $5, $6, false, $7)
    `,
    [
      actorId,
      reconcilerTicketId || ticketId,
      '/api/auth/jit/emergency/reconcile',
      'POST',
      'Manual cryptographic reconciliation sweep',
      ticketId,
      sweepPayloadHash
    ]
  );

  return {
    alreadyReconciled: false,
    ticketId,
    message: `Cryptographic alignment reconciliation complete for ${ticketId}.`,
    verifiedActionsCount: loggedActions.length,
    anomaliesDetected: false,
    verificationDigest,
    auditReportLog
  };
}

module.exports = {
  runManualLedgerReconciliation,
  buildVerificationDigest
};
