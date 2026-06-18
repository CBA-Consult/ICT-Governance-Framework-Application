/**
 * Read-only JIT / Break Glass ledger queries for privileged-access consoles.
 */
const { pool } = require('./jit-elevation');

async function listLedgerTickets({ category = 'all', limit = 50 } = {}) {
  const values = [Math.min(Math.max(limit, 1), 100)];
  let categoryClause = '';

  if (category === 'break_glass') {
    categoryClause = `WHERE (ticket_id LIKE 'BG-%' OR status = 'Break_Glass_Active')`;
  } else if (category === 'jit') {
    categoryClause = `WHERE ticket_id LIKE 'JIT-%' AND status != 'Break_Glass_Active'`;
  }

  const { rows } = await pool.query(
    `
    SELECT
      ticket_id,
      requestor_id,
      requested_role,
      justification,
      scope_tenant,
      approval_timestamp,
      valid_from,
      valid_until,
      status,
      revoked_at,
      revoked_reason
    FROM jit_elevation_ledger
    ${categoryClause}
    ORDER BY valid_from DESC
    LIMIT $1
    `,
    values
  );

  return rows;
}

async function getTicketPrivilegedActions(ticketId) {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      actor_id,
      endpoint,
      http_method,
      action,
      target_resource_id,
      timestamp,
      is_break_glass,
      payload_hash
    FROM privileged_action_logs
    WHERE jit_ticket_id = $1
    ORDER BY timestamp ASC
    `,
    [ticketId]
  );
  return rows;
}

module.exports = {
  listLedgerTickets,
  getTicketPrivilegedActions
};
