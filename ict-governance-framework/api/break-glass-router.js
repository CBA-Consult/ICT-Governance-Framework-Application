/**
 * Break Glass emergency activation — out-of-band fallback when cloud identity is degraded.
 */
const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const {
  isBreakGlassAllowed,
  isBreakGlassSecretValid,
  getBreakGlassMaxDurationMinutes,
  createBreakGlassTicket,
  revokeBreakGlassTicket,
  logBreakGlassActivation,
  mintBreakGlassContextToken,
  pool
} = require('../services/jit-elevation');
const { dispatchBreakGlassAlert } = require('../services/break-glass-alerts');

const router = express.Router();

const emergencyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Break Glass activation rate limit exceeded',
    code: 'BREAK_GLASS_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/auth/jit/emergency/activate
 * Out-of-band secret + verbose justification — no standing JWT required.
 */
router.post('/emergency/activate', emergencyLimiter, async (req, res) => {
  const { requestorId, breakGlassKey, justification, scopeTenant } = req.body;

  if (!isBreakGlassAllowed()) {
    return res.status(403).json({
      error: 'Break Glass protocols are explicitly deactivated by system configuration.',
      code: 'BREAK_GLASS_DISABLED'
    });
  }

  if (!isBreakGlassSecretValid(breakGlassKey)) {
    return res.status(401).json({
      error: 'Critical Failure: Invalid out-of-band Break Glass secret key submitted.',
      code: 'BREAK_GLASS_SECRET_INVALID'
    });
  }

  if (!justification || justification.trim().length < 20) {
    return res.status(400).json({
      error: 'Rejection: High-assurance changes require a verbose regulatory justification (>20 characters).',
      code: 'BREAK_GLASS_JUSTIFICATION_INVALID'
    });
  }

  try {
    const ttlMinutes = getBreakGlassMaxDurationMinutes();
    const operatorId = requestorId || 'emergency-operator';
    const tenantScope = scopeTenant || 'all-tenants';

    const ticket = await createBreakGlassTicket({
      requestorId: operatorId,
      justification: justification.trim(),
      scopeTenant: tenantScope,
      ttlMinutes
    });

    const payloadHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ requestorId: operatorId, justification, scopeTenant: tenantScope }))
      .digest('hex');

    await logBreakGlassActivation({
      actorId: operatorId,
      ticketId: ticket.ticketId,
      scopeTenant: tenantScope,
      payloadHash
    });

    const { token: emergencyToken, exp } = mintBreakGlassContextToken({
      userId: operatorId,
      ticketId: ticket.ticketId,
      expiresInMinutes: ttlMinutes
    });

    const alertResult = await dispatchBreakGlassAlert({
      ticketId: ticket.ticketId,
      requestorId: operatorId,
      scopeTenant: tenantScope,
      expiresAt: ticket.validUntil.toISOString(),
      justification: justification.trim()
    });

    return res.status(200).json({
      success: true,
      message: 'Break Glass emergency validation approved. Transient context active.',
      ticketId: ticket.ticketId,
      emergencyToken,
      jitContextToken: emergencyToken,
      expiresAt: ticket.validUntil.toISOString(),
      scopeTenant: tenantScope,
      usage: 'Pass emergencyToken in X-JIT-Context: Bearer <token> header on privileged routes.',
      alertDelivered: alertResult.delivered
    });
  } catch (error) {
    console.error('[Break Glass Execution Error]:', error.message);
    return res.status(500).json({
      error: 'Critical systemic error deploying emergency trust context.',
      code: 'BREAK_GLASS_ACTIVATION_ERROR',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/jit/emergency/revoke
 * Manual post-incident closure with out-of-band secret.
 */
router.post('/emergency/revoke', emergencyLimiter, async (req, res) => {
  const { breakGlassKey, ticketId, reason } = req.body;

  if (!isBreakGlassAllowed()) {
    return res.status(403).json({
      error: 'Break Glass protocols are explicitly deactivated by system configuration.',
      code: 'BREAK_GLASS_DISABLED'
    });
  }

  if (!isBreakGlassSecretValid(breakGlassKey)) {
    return res.status(401).json({
      error: 'Critical Failure: Invalid out-of-band Break Glass secret key submitted.',
      code: 'BREAK_GLASS_SECRET_INVALID'
    });
  }

  if (!ticketId) {
    return res.status(400).json({ error: 'ticketId is required', code: 'BREAK_GLASS_TICKET_MISSING' });
  }

  try {
    const revoked = await revokeBreakGlassTicket(
      ticketId,
      reason || 'Manual post-incident revocation via emergency endpoint'
    );

    if (!revoked) {
      return res.status(404).json({
        error: 'No active Break Glass ticket found for revocation.',
        code: 'BREAK_GLASS_TICKET_NOT_ACTIVE'
      });
    }

    const payloadHash = crypto.createHash('sha256').update(JSON.stringify({ ticketId, reason })).digest('hex');
    await pool.query(
      `
      INSERT INTO privileged_action_logs (
        actor_id, jit_ticket_id, endpoint, http_method, action, target_resource_id, is_break_glass, payload_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, true, $7)
      `,
      [
        'emergency-operator',
        ticketId,
        '/api/auth/jit/emergency/revoke',
        'POST',
        'Break Glass Emergency Protocol Revoked',
        ticketId,
        payloadHash
      ]
    );

    return res.json({
      success: true,
      message: 'Break Glass emergency context revoked.',
      ticket: revoked
    });
  } catch (error) {
    console.error('[Break Glass Revoke Error]:', error.message);
    return res.status(500).json({
      error: 'Failed to revoke Break Glass context.',
      code: 'BREAK_GLASS_REVOKE_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/auth/jit/emergency/active
 * Operational visibility — active emergency tickets (no secret required).
 */
router.get('/emergency/active', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT ticket_id, requestor_id, scope_tenant, valid_from, valid_until, status
      FROM jit_elevation_ledger
      WHERE status = 'Break_Glass_Active' AND valid_until >= CURRENT_TIMESTAMP
      ORDER BY valid_from DESC
      `
    );

    res.json({
      success: true,
      count: rows.length,
      tickets: rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list active Break Glass tickets', details: error.message });
  }
});

module.exports = router;
