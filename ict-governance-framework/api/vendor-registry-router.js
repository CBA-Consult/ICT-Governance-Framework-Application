'use strict';

const express = require('express');
const { authenticateToken, requirePermissions, requireAnyPermissions } = require('../middleware/auth');
const vendorRegistry = require('../services/vendor-registry-service');

const router = express.Router();

function actorEmail(req) {
  return req.user?.email || req.user?.username || 'unknown';
}

router.get('/', authenticateToken, requireAnyPermissions(['governance.read', 'app.procurement']), (req, res) => {
  try {
    const vendors = vendorRegistry.listVendors({ status: req.query.status });
    res.json({ success: true, data: { vendors } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', authenticateToken, requirePermissions(['app.procurement']), (req, res) => {
  try {
    const vendor = vendorRegistry.createVendor(req.body || {}, { actor: actorEmail(req) });
    res.status(201).json({ success: true, data: vendor });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

router.get('/:vendorId', authenticateToken, requireAnyPermissions(['governance.read', 'app.procurement']), (req, res) => {
  try {
    const vendor = vendorRegistry.getVendor(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    res.json({ success: true, data: vendor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:vendorId', authenticateToken, requirePermissions(['app.procurement']), (req, res) => {
  try {
    const vendor = vendorRegistry.updateVendor(req.params.vendorId, req.body || {}, { actor: actorEmail(req) });
    res.json({ success: true, data: vendor });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

router.post('/:vendorId/onboarding/complete', authenticateToken, requirePermissions(['app.procurement']), (req, res) => {
  try {
    const { stepId } = req.body || {};
    if (!stepId) {
      return res.status(400).json({ success: false, error: 'stepId is required' });
    }
    const vendor = vendorRegistry.completeVendorOnboardingStep(req.params.vendorId, stepId, { actor: actorEmail(req) });
    res.json({ success: true, data: vendor });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

module.exports = router;

