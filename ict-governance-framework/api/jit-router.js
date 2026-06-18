/**
 * JIT elevation API — mint time-bounded GlobalAdministrator context tokens.
 */
const express = require('express');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const {
  createElevationTicket,
  mintJitContextToken,
  getLedgerTicket,
  DEFAULT_TTL_MINUTES
} = require('../services/jit-elevation');
const { listLedgerTickets, getTicketPrivilegedActions } = require('../services/jit-ledger-query');

const router = express.Router();

/**
 * POST /api/auth/jit/elevate
 * Create ledger ticket and return ephemeral JIT context JWT (send via X-JIT-Context header).
 */
router.post('/elevate', authenticateToken, requirePermissions(['governance.manage']), async (req, res) => {
  const {
    justification,
    scopeTenant = 'tenant-01',
    requestedRole = 'GlobalAdministrator',
    ttlMinutes = DEFAULT_TTL_MINUTES,
    breakGlass = false
  } = req.body;

  if (!justification || justification.trim().length < 10) {
    return res.status(400).json({
      error: 'A justification of at least 10 characters is required for JIT elevation.'
    });
  }

  try {
    const ticket = await createElevationTicket({
      requestorId: req.user.user_id,
      requestedRole,
      justification: justification.trim(),
      scopeTenant,
      approvedBy: [req.user.user_id],
      ttlMinutes,
      breakGlass: breakGlass === true
    });

    const { token, exp } = mintJitContextToken({
      userId: req.user.user_id,
      ticketId: ticket.ticketId,
      role: requestedRole,
      expiresInMinutes: ttlMinutes
    });

    res.status(201).json({
      success: true,
      ticketId: ticket.ticketId,
      jitContextToken: token,
      expiresAt: new Date(exp * 1000).toISOString(),
      scopeTenant: ticket.scopeTenant,
      usage: 'Pass jitContextToken in the X-JIT-Context: Bearer <token> header on privileged routes.'
    });
  } catch (err) {
    console.error('JIT elevation failed:', err);
    res.status(500).json({ error: 'Failed to create JIT elevation ticket', details: err.message });
  }
});

/**
 * GET /api/auth/jit/ledger
 * List elevation tickets for JIT or Break Glass consoles (not asset register).
 */
router.get('/ledger', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const category = req.query.category || 'all';
    const tickets = await listLedgerTickets({
      category,
      limit: parseInt(req.query.limit, 10) || 50
    });
    res.json({ success: true, count: tickets.length, tickets });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list JIT ledger tickets', details: err.message });
  }
});

/**
 * GET /api/auth/jit/ledger/:ticketId/actions
 */
router.get('/ledger/:ticketId/actions', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const ticket = await getLedgerTicket(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'JIT ticket not found' });
    }
    const actions = await getTicketPrivilegedActions(req.params.ticketId);
    res.json({ success: true, ticket, actions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ticket actions', details: err.message });
  }
});

/**
 * GET /api/auth/jit/tickets/:ticketId
 */
router.get('/tickets/:ticketId', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const ticket = await getLedgerTicket(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'JIT ticket not found' });
    }
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch JIT ticket', details: err.message });
  }
});

module.exports = router;
