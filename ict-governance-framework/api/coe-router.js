'use strict';

const express = require('express');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const coe = require('../services/coe-lifecycle-service');
const adpaLifecycle = require('../services/adpa-lifecycle-service');

const router = express.Router();

function actorEmail(req) {
  return req.user?.email || req.user?.username || 'unknown';
}

router.get('/program', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    res.json({ success: true, data: coe.getProgram() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/scope', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    res.json({ success: true, data: adpaLifecycle.getFullScopeSummary() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tenants/:tenantId/governed-assets', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    res.json({ success: true, data: adpaLifecycle.getTenantGovernedAssets(req.params.tenantId) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/metrics', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const data = await coe.getAdoptionMetrics();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/training', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    res.json({ success: true, data: coe.getAllTrainingModules() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/centers', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const centers = coe.listCenters().map((c) => ({
      ...c,
      lifecyclePhases: coe.loadCentersConfig().lifecyclePhases
    }));
    res.json({ success: true, data: centers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/centers/:centerId', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  const center = coe.getCenter(req.params.centerId);
  if (!center) return res.status(404).json({ success: false, error: 'Center not found' });
  res.json({ success: true, data: center });
});

router.get('/centers/:centerId/inventory', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const { centerId } = req.params;
    let inventory = [];
    if (centerId === 'templates') inventory = adpaLifecycle.listAllTemplates();
    else if (centerId === 'ai-providers') inventory = adpaLifecycle.listAiProviders();
    else if (centerId === 'artifacts') inventory = adpaLifecycle.listTenants();
    else if (centerId === 'documents') inventory = adpaLifecycle.listDocumentLibrary();
    res.json({ success: true, data: inventory });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/centers/:centerId/items', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const items = await coe.listCenterItems(req.params.centerId);
    if (items === null) return res.status(404).json({ success: false, error: 'Center not found' });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/centers/:centerId/items', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const result = await coe.initiateItem(req.params.centerId, req.body, actorEmail(req));
    res.status(result.existing ? 200 : 201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/centers/:centerId/items/:itemId', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const detail = await coe.getItemDetail(req.params.centerId, req.params.itemId);
    if (!detail) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: detail });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/centers/:centerId/items/:itemId/lifecycle', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const { targetPhase, reason } = req.body;
    const result = await coe.transitionLifecycle(req.params.centerId, req.params.itemId, targetPhase, actorEmail(req), reason);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/centers/:centerId/items/:itemId/owners', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    await coe.assignOwner(req.params.centerId, req.params.itemId, req.body, actorEmail(req));
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/centers/:centerId/items/:itemId/justification', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    await coe.submitJustification(req.params.centerId, req.params.itemId, req.body, actorEmail(req));
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/centers/:centerId/items/:itemId/onboarding', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const { checklistItemId, notes } = req.body;
    await coe.completeOnboardingStep(req.params.centerId, req.params.itemId, checklistItemId, actorEmail(req), notes);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/centers/:centerId/items/:itemId/training', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const { moduleId, score } = req.body;
    await coe.recordTraining(req.params.centerId, req.params.itemId, moduleId, actorEmail(req), score);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/centers/:centerId/items/:itemId/audit', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const trail = await coe.getAuditTrail(req.params.centerId, req.params.itemId);
    res.json({ success: true, data: trail });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/centers/:centerId/items/:itemId/rollback', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const { targetVersion, reason } = req.body;
    const result = await coe.rollbackItem(req.params.centerId, req.params.itemId, targetVersion, actorEmail(req), reason);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/sync', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const synced = await coe.syncInventoryFromAdpa(actorEmail(req));
    res.json({ success: true, data: synced });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
