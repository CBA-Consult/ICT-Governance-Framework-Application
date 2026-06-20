'use strict';

const express = require('express');
const { authenticateToken, requirePermissions, requireAnyPermissions } = require('../middleware/auth');
const offerings = require('../services/marketplace-offering-service');

const router = express.Router();

function actorEmail(req) {
  return req.user?.email || req.user?.username || 'unknown';
}

router.get('/offerings', authenticateToken, requireAnyPermissions(['governance.read', 'app.procurement']), (req, res) => {
  try {
    const status = req.query.status || 'published';
    const list = offerings.listOfferings({
      status,
      vendorId: req.query.vendorId,
      category: req.query.category
    });
    res.json({ success: true, data: { offerings: list } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/offerings', authenticateToken, requirePermissions(['app.procurement']), (req, res) => {
  try {
    const created = offerings.createOffering(req.body || {}, { actor: actorEmail(req) });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

router.patch('/offerings/:offeringId', authenticateToken, requirePermissions(['app.procurement']), (req, res) => {
  try {
    const updated = offerings.updateOffering(req.params.offeringId, req.body || {}, { actor: actorEmail(req) });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

router.post('/offerings/:offeringId/publish', authenticateToken, requirePermissions(['app.procurement']), (req, res) => {
  try {
    const updated = offerings.publishOffering(req.params.offeringId, { actor: actorEmail(req) });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

module.exports = router;

