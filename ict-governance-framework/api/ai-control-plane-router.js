'use strict';

const express = require('express');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const aiControlPlane = require('../services/ai-control-plane-service');

const router = express.Router();

function actorEmail(req) {
  return req.user?.email || req.user?.username || 'unknown';
}

router.get('/overview', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    res.json({ success: true, data: aiControlPlane.getOverview() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/bridge', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    res.json({ success: true, data: aiControlPlane.loadBridge() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/sync', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const processorSync = aiControlPlane.syncFromProcessorConfig(actorEmail(req));
    const assignmentSeed = aiControlPlane.seedAssignments(actorEmail(req), req.body.replaceAssignments === true);
    res.json({ success: true, data: { processorSync, assignmentSeed } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/providers', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    res.json({ success: true, data: { providers: aiControlPlane.listProviders() } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/providers', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const provider = aiControlPlane.registerProvider(req.body, actorEmail(req));
    res.status(201).json({ success: true, data: provider });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/providers/:providerId', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const detail = aiControlPlane.getProvider(req.params.providerId);
    if (!detail) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    res.json({ success: true, data: detail });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/providers/:providerId/models', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const model = aiControlPlane.registerModel(req.params.providerId, req.body, actorEmail(req));
    res.status(201).json({ success: true, data: model });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/models', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const models = aiControlPlane.listModels(req.query.providerId);
    res.json({ success: true, data: { models } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/assignments', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const filters = {
      templateId: req.query.templateId,
      providerId: req.query.providerId,
      outputType: req.query.outputType
    };
    if (req.query.enabled !== undefined) {
      filters.enabled = req.query.enabled === 'true';
    }
    res.json({ success: true, data: { assignments: aiControlPlane.listAssignments(filters) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/assignments', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const assignment = aiControlPlane.createAssignment(req.body, actorEmail(req));
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.patch('/assignments/:assignmentId', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const assignment = aiControlPlane.updateAssignment(req.params.assignmentId, req.body, actorEmail(req));
    res.json({ success: true, data: assignment });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/resolve-route', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const route = aiControlPlane.resolveGenerationRoute(req.body);
    res.json({ success: true, data: route });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/generate', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const { templateId, outputType, cloudProvider, tenantId } = req.body;
    const route = aiControlPlane.resolveGenerationRoute({ templateId, outputType, cloudProvider, tenantId });
    res.json({
      success: true,
      data: {
        status: 'routed',
        message: 'Generation route resolved. Wire processor execution in a follow-up integration.',
        route
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/audit', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    res.json({ success: true, data: { auditTrail: aiControlPlane.getAuditTrail(limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
