'use strict';

const express = require('express');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const templateLifecycle = require('../services/template-lifecycle-service');

const router = express.Router();

function actorEmail(req) {
  return req.user?.email || req.user?.username || 'unknown';
}

router.get('/bridge', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    res.json({ success: true, data: templateLifecycle.loadBridge() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/catalog', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const catalog = await templateLifecycle.getTemplateCatalog();
    const dbAvailable = await templateLifecycle.isDbAvailable();
    res.json({ success: true, data: { templates: catalog, dbAvailable } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/sync', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const result = await templateLifecycle.syncAllTemplates(actorEmail(req));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/draft', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const result = await templateLifecycle.createTemplateDraft(req.body, actorEmail(req));
    res.status(result.existing ? 200 : 201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/:templateId', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const detail = await templateLifecycle.resolveTemplateState(req.params.templateId);
    if (!detail) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, data: detail });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:templateId/register', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const result = await templateLifecycle.registerTemplate(req.params.templateId, actorEmail(req), req.body);
    res.status(result.existing ? 200 : 201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.patch('/:templateId/lifecycle', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const { targetPhase, reason } = req.body;
    const result = await templateLifecycle.transitionTemplate(
      req.params.templateId,
      targetPhase,
      actorEmail(req),
      reason
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
      code: err.code,
      gateFailures: err.gateFailures
    });
  }
});

router.post('/:templateId/qc-gates/:gateId/run', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const detail = await templateLifecycle.resolveTemplateState(req.params.templateId);
    const phase = detail?.item?.lifecycle_phase || 'initiation';
    const result = await templateLifecycle.runQCGate(
      req.params.templateId,
      req.params.gateId,
      phase,
      actorEmail(req)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/:templateId/qc-gates/:gateId/approve', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const { notes } = req.body;
    const result = await templateLifecycle.approveManualGate(
      req.params.templateId,
      req.params.gateId,
      actorEmail(req),
      notes
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/:templateId/owners', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const { ownerEmail, ownerRole } = req.body;
    const result = await templateLifecycle.assignTemplateOwner(
      req.params.templateId,
      ownerEmail,
      ownerRole,
      actorEmail(req)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/:templateId/justification', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const result = await templateLifecycle.submitTemplateJustification(
      req.params.templateId,
      req.body,
      actorEmail(req)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
