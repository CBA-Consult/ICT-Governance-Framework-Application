/**
 * Manual ledger verification — compliance-owner cryptographic reconciliation sweeps.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const { enforceJitContext } = require('../middleware/auth-jit-enforcer');
const { runManualLedgerReconciliation } = require('../services/manual-ledger-reconciliation');

const router = express.Router();

const reconcileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Manual reconciliation rate limit exceeded',
    code: 'RECONCILIATION_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/auth/jit/emergency/reconcile
 * Force cryptographic verification and formal closeout of a break-glass ticket.
 */
router.post(
  '/emergency/reconcile',
  reconcileLimiter,
  authenticateToken,
  requirePermissions(['compliance.manage']),
  enforceJitContext({ actionDescription: 'Manual cryptographic reconciliation sweep' }),
  async (req, res) => {
    const { ticketId } = req.body;

    if (!ticketId || typeof ticketId !== 'string') {
      return res.status(400).json({
        error: 'Missing mandatory target ticketId parameter.',
        code: 'TICKET_ID_REQUIRED'
      });
    }

    try {
      const result = await runManualLedgerReconciliation({
        ticketId: ticketId.trim(),
        actorId: req.user.user_id,
        reconcilerTicketId: req.jitContext?.ticketId || null
      });

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      if (error.code === 'TICKET_NOT_FOUND') {
        return res.status(404).json({ error: error.message, code: error.code });
      }

      if (error.code === 'RECONCILIATION_ANOMALIES') {
        return res.status(422).json({
          error: error.message,
          code: error.code,
          anomaliesDetected: true,
          auditReportLog: error.details?.auditReportLog || []
        });
      }

      console.error('[Manual Reconciliation Sweep Error]:', error.message);
      return res.status(500).json({
        error: 'Systemic exception processing verification tool block.',
        code: 'RECONCILIATION_ERROR',
        details: error.message
      });
    }
  }
);

module.exports = router;
