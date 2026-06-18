/**
 * Non-bypassable JIT context enforcement for privileged mutation endpoints.
 */
const crypto = require('crypto');
const {
  isJitEnforcementEnabled,
  verifyJitContextToken,
  getLedgerTicket,
  expireStaleTickets,
  pool
} = require('../services/jit-elevation');

function extractJitToken(req) {
  const header = req.headers['x-jit-context'] || req.headers['x-jit-elevation-token'];
  if (!header) return null;
  if (header.startsWith('Bearer ')) return header.slice(7);
  return header;
}

/**
 * @param {Object} options
 * @param {string} [options.actionDescription]
 * @param {boolean} [options.requireTenantScopeMatch] - match body.tenantId to ticket scope
 */
function enforceJitContext(options = {}) {
  return async (req, res, next) => {
    if (!isJitEnforcementEnabled()) {
      return next();
    }

    if (req.trustedSystemActor) {
      return next();
    }

    if (!req.user?.user_id) {
      return res.status(401).json({
        error: 'Access Denied: Authenticated identity required before JIT elevation context.'
      });
    }

    const jitToken = extractJitToken(req);
    if (!jitToken) {
      return res.status(403).json({
        error: 'Access Denied: Structural JIT identifier missing from identity context.',
        code: 'JIT_CONTEXT_MISSING'
      });
    }

    try {
      await expireStaleTickets();

      let decoded;
      try {
        decoded = verifyJitContextToken(jitToken);
      } catch (err) {
        const code = err.name === 'TokenExpiredError' ? 401 : 403;
        return res.status(code).json({
          error: code === 401
            ? 'Access Denied: Ephemeral JIT token context has expired.'
            : 'Access Denied: Invalid JIT elevation token.',
          code: err.name === 'TokenExpiredError' ? 'JIT_TOKEN_EXPIRED' : 'JIT_TOKEN_INVALID'
        });
      }

      if (decoded.role !== 'GlobalAdministrator') {
        return res.status(403).json({
          error: 'Access Denied: Standing privilege holds insufficient rights.',
          code: 'JIT_ROLE_INSUFFICIENT'
        });
      }

      if (!decoded.jit_ticket_id) {
        return res.status(403).json({
          error: 'Access Denied: Structural JIT Identifier missing from identity context.',
          code: 'JIT_TICKET_MISSING'
        });
      }

      if (decoded.sub && decoded.sub !== req.user.user_id) {
        return res.status(403).json({
          error: 'Access Denied: JIT context subject does not match authenticated user.',
          code: 'JIT_SUBJECT_MISMATCH'
        });
      }

      const ticket = await getLedgerTicket(decoded.jit_ticket_id);
      if (!ticket) {
        return res.status(403).json({
          error: 'Access Denied: Target JIT ticket not found within system ledger.',
          code: 'JIT_TICKET_NOT_FOUND'
        });
      }

      if (ticket.status !== 'Active' && ticket.status !== 'Break_Glass_Active') {
        return res.status(403).json({
          error: `Access Denied: Selected JIT Ticket context is currently marked: ${ticket.status}`,
          code: 'JIT_TICKET_INACTIVE'
        });
      }

      if (new Date() > new Date(ticket.valid_until)) {
        return res.status(401).json({
          error: 'Access Denied: Ephemeral JIT ticket validity window has elapsed.',
          code: 'JIT_TICKET_EXPIRED'
        });
      }

      if (options.requireTenantScopeMatch) {
        const tenantId = req.body?.tenantId || req.body?.tenant_id;
        if (tenantId && tenantId !== ticket.scope_tenant) {
          return res.status(403).json({
            error: 'Access Denied: JIT ticket tenant scope does not cover this mutation.',
            code: 'JIT_SCOPE_MISMATCH'
          });
        }
      }

      const payloadString = JSON.stringify(req.body || {});
      const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');
      const targetResourceId = req.body?.assetId || req.body?.id || req.params?.assetId || null;

      await pool.query(
        `
        INSERT INTO privileged_action_logs (
          actor_id, jit_ticket_id, endpoint, http_method, action, target_resource_id, is_break_glass, payload_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          req.user.user_id,
          decoded.jit_ticket_id,
          req.originalUrl,
          req.method,
          options.actionDescription || 'Administrative Mutation Event',
          targetResourceId,
          ticket.status === 'Break_Glass_Active',
          payloadHash
        ]
      );

      req.jitContext = {
        ticketId: decoded.jit_ticket_id,
        tenantScope: ticket.scope_tenant,
        isEmergency: ticket.status === 'Break_Glass_Active',
        role: decoded.role
      };

      return next();
    } catch (error) {
      console.error('[JIT Enforcement Core Exception]:', error.message);
      return res.status(500).json({
        error: 'Internal Governance validation failure during runtime evaluation loop.',
        code: 'JIT_ENFORCEMENT_ERROR'
      });
    }
  };
}

module.exports = { enforceJitContext, extractJitToken };
