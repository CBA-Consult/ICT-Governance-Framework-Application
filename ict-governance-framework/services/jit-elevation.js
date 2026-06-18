/**
 * JIT elevation ticket lifecycle and ephemeral context token minting.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JIT_SECRET = process.env.JIT_ELEVATION_SECRET || process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const DEFAULT_TTL_MINUTES = parseInt(process.env.JIT_ELEVATION_TTL_MINUTES, 10) || 60;

function isJitEnforcementEnabled() {
  if (process.env.JIT_ENFORCEMENT_ENABLED === 'true') return true;
  if (process.env.JIT_ENFORCEMENT_ENABLED === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

function buildTicketId() {
  return `JIT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function buildBreakGlassTicketId() {
  return `BG-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${new Date().getFullYear()}`;
}

function isBreakGlassAllowed() {
  return process.env.BREAK_GLASS_ALLOWED === 'true';
}

function getBreakGlassMaxDurationMinutes() {
  return parseInt(process.env.BREAK_GLASS_MAX_DURATION_MINUTES, 10) || 60;
}

function isBreakGlassSecretValid(providedKey) {
  const secret = process.env.BREAK_GLASS_SYSTEM_SECRET;
  if (!secret || !providedKey) return false;
  try {
    const a = Buffer.from(providedKey, 'utf8');
    const b = Buffer.from(secret, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function createBreakGlassTicket({
  requestorId,
  justification,
  scopeTenant = 'all-tenants',
  ttlMinutes = getBreakGlassMaxDurationMinutes()
}) {
  const ticketId = buildBreakGlassTicketId();
  const validFrom = new Date();
  const validUntil = new Date(validFrom.getTime() + ttlMinutes * 60 * 1000);
  const prefixedJustification = justification.startsWith('BREAK GLASS')
    ? justification
    : `BREAK GLASS EMERGENCY PROTOCOL REASON: ${justification}`;

  await pool.query(
    `
    INSERT INTO jit_elevation_ledger (
      ticket_id, requestor_id, requested_role, justification, scope_tenant,
      approved_by, approval_timestamp, valid_from, valid_until, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      ticketId,
      requestorId || 'emergency-operator',
      'GlobalAdministrator',
      prefixedJustification,
      scopeTenant,
      ['SYSTEM_AUTOMATED_BREAK_GLASS_OVERRIDE'],
      validFrom.toISOString(),
      validFrom.toISOString(),
      validUntil.toISOString(),
      'Break_Glass_Active'
    ]
  );

  return { ticketId, validFrom, validUntil, status: 'Break_Glass_Active', scopeTenant };
}

async function revokeBreakGlassTicket(ticketId, reason = 'Manual emergency revocation') {
  const { rows } = await pool.query(
    `
    UPDATE jit_elevation_ledger
    SET status = 'Revoked', revoked_at = CURRENT_TIMESTAMP, revoked_reason = $2
    WHERE ticket_id = $1 AND status = 'Break_Glass_Active'
    RETURNING ticket_id, status, revoked_at
    `,
    [ticketId, reason]
  );
  return rows[0] || null;
}

async function logBreakGlassActivation({ actorId, ticketId, scopeTenant, payloadHash }) {
  await pool.query(
    `
    INSERT INTO privileged_action_logs (
      actor_id, jit_ticket_id, endpoint, http_method, action, target_resource_id, is_break_glass, payload_hash
    ) VALUES ($1, $2, $3, $4, $5, $6, true, $7)
    `,
    [
      actorId || 'emergency-operator',
      ticketId,
      '/api/auth/jit/emergency/activate',
      'POST',
      'Break Glass Emergency Protocol Activated',
      scopeTenant,
      payloadHash
    ]
  );
}

async function createElevationTicket({
  requestorId,
  requestedRole = 'GlobalAdministrator',
  justification,
  scopeTenant,
  approvedBy = ['SYSTEM_AUTO_APPROVER'],
  ttlMinutes = DEFAULT_TTL_MINUTES,
  breakGlass = false
}) {
  const ticketId = buildTicketId();
  const validFrom = new Date();
  const validUntil = new Date(validFrom.getTime() + ttlMinutes * 60 * 1000);
  const status = breakGlass ? 'Break_Glass_Active' : 'Active';

  await pool.query(
    `
    INSERT INTO jit_elevation_ledger (
      ticket_id, requestor_id, requested_role, justification, scope_tenant,
      approved_by, approval_timestamp, valid_from, valid_until, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      ticketId,
      requestorId,
      requestedRole,
      justification,
      scopeTenant,
      approvedBy,
      validFrom.toISOString(),
      validFrom.toISOString(),
      validUntil.toISOString(),
      status
    ]
  );

  return {
    ticketId,
    validFrom,
    validUntil,
    status,
    scopeTenant
  };
}

function mintJitContextToken({
  userId,
  ticketId,
  role = 'GlobalAdministrator',
  expiresInMinutes = DEFAULT_TTL_MINUTES,
  isEmergency = false
}) {
  const token = jwt.sign(
    {
      sub: userId,
      role,
      jit_ticket_id: ticketId,
      type: 'jit_context',
      ...(isEmergency ? { is_emergency: true } : {})
    },
    JIT_SECRET,
    { expiresIn: `${expiresInMinutes}m` }
  );

  const decoded = jwt.decode(token);
  return { token, exp: decoded.exp };
}

function mintBreakGlassContextToken({ userId, ticketId, expiresInMinutes }) {
  return mintJitContextToken({
    userId,
    ticketId,
    expiresInMinutes: expiresInMinutes || getBreakGlassMaxDurationMinutes(),
    isEmergency: true
  });
}

function verifyJitContextToken(token) {
  return jwt.verify(token, JIT_SECRET);
}

async function getLedgerTicket(ticketId) {
  const { rows } = await pool.query(
    'SELECT * FROM jit_elevation_ledger WHERE ticket_id = $1',
    [ticketId]
  );
  return rows[0] || null;
}

async function expireStaleTickets() {
  await pool.query(`
    UPDATE jit_elevation_ledger
    SET status = 'Expired'
    WHERE status = 'Active' AND valid_until < CURRENT_TIMESTAMP
  `);
}

module.exports = {
  pool,
  isJitEnforcementEnabled,
  isBreakGlassAllowed,
  isBreakGlassSecretValid,
  getBreakGlassMaxDurationMinutes,
  createElevationTicket,
  createBreakGlassTicket,
  revokeBreakGlassTicket,
  logBreakGlassActivation,
  mintJitContextToken,
  mintBreakGlassContextToken,
  verifyJitContextToken,
  getLedgerTicket,
  expireStaleTickets,
  DEFAULT_TTL_MINUTES
};
