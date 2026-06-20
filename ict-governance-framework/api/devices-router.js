/**
 * Devices pillar API — endpoint inventory (distinct from cloud asset_register).
 */
const express = require('express');
const { Pool } = require('pg');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const { registerDevice, getDeviceById } = require('../services/device-registration');
const { runDeviceComplianceCheck } = require('../services/device-compliance-check');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * POST /api/devices/register
 * Register a managed device with identity-linked governance metadata.
 */
router.post(
  '/register',
  authenticateToken,
  requirePermissions(['governance.manage']),
  async (req, res) => {
    try {
      const result = await registerDevice(pool, req.body, req.user?.user_id || null);
      return res.status(result.status).json(result.body);
    } catch (err) {
      console.error('Device registration failed:', err);
      return res.status(500).json({
        error: 'Failed to register device',
        details: err.message
      });
    }
  }
);

/**
 * GET /api/devices/:id
 * Return persisted device state for governance inspection and cross-pillar correlation.
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermissions(['governance.manage']),
  async (req, res) => {
    try {
      const result = await getDeviceById(pool, req.params.id);
      return res.status(result.status).json(result.body);
    } catch (err) {
      console.error('Device lookup failed:', err);
      return res.status(500).json({
        error: 'Failed to retrieve device',
        details: err.message
      });
    }
  }
);

/**
 * POST /api/devices/:id/compliance-check
 * Evaluate posture checks and update compliance state; raises SecOps incident when non-compliant.
 */
router.post(
  '/:id/compliance-check',
  authenticateToken,
  requirePermissions(['governance.manage']),
  async (req, res) => {
    try {
      const result = await runDeviceComplianceCheck(
        pool,
        req.params.id,
        req.body,
        req.user?.user_id || null
      );
      return res.status(result.status).json(result.body);
    } catch (err) {
      console.error('Device compliance check failed:', err);
      return res.status(500).json({
        error: 'Failed to evaluate device compliance',
        details: err.message
      });
    }
  }
);

module.exports = router;
