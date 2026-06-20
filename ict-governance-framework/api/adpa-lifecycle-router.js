'use strict';

const express = require('express');
const path = require('path');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const lifecycle = require('../services/adpa-lifecycle-service');

const router = express.Router();

router.get(
  '/overview',
  authenticateToken,
  requirePermissions(['governance.read']),
  (req, res) => {
    try {
      res.json({ success: true, data: lifecycle.getOverview() });
    } catch (err) {
      console.error('[Lifecycle] overview failed:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get(
  '/lifecycle-stages',
  authenticateToken,
  requirePermissions(['governance.read']),
  (req, res) => {
    try {
      res.json({ success: true, data: lifecycle.listLifecycleStages() });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get(
  '/templates',
  authenticateToken,
  requirePermissions(['governance.read']),
  (req, res) => {
    try {
      const { kind } = req.query;
      let templates = lifecycle.listAllTemplates();
      if (kind === 'document') templates = lifecycle.listDocumentTemplates();
      if (kind === 'artifact') templates = lifecycle.listArtifactTemplates();
      res.json({ success: true, data: templates });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get(
  '/providers',
  authenticateToken,
  requirePermissions(['governance.read']),
  (req, res) => {
    try {
      res.json({ success: true, data: lifecycle.listAiProviders() });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get(
  '/tenants',
  authenticateToken,
  requirePermissions(['governance.read']),
  (req, res) => {
    try {
      res.json({ success: true, data: lifecycle.listTenants() });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get(
  '/tenants/:tenantId/artifacts',
  authenticateToken,
  requirePermissions(['governance.read']),
  (req, res) => {
    try {
      const data = lifecycle.getTenantArtifacts(req.params.tenantId);
      if (!data) {
        return res.status(404).json({ success: false, error: 'Tenant not found' });
      }
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get(
  '/tenants/:tenantId/documents',
  authenticateToken,
  requirePermissions(['governance.read']),
  (req, res) => {
    try {
      const versions = lifecycle.getTenantDocumentVersions(req.params.tenantId);
      res.json({ success: true, data: versions });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get(
  '/documents',
  authenticateToken,
  requirePermissions(['governance.read']),
  (req, res) => {
    try {
      const { tenantId } = req.query;
      res.json({ success: true, data: lifecycle.listDocumentLibrary(tenantId || null) });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.post(
  '/tenants/:tenantId/documents/generate',
  authenticateToken,
  requirePermissions(['governance.read']),
  async (req, res) => {
    try {
      const result = await lifecycle.generateTenantDocument(req.params.tenantId);
      res.json({
        success: true,
        data: {
          markdownPath: path.relative(lifecycle.REPO_ROOT, result.mdPath),
          docxPath: result.docxPath
            ? path.relative(lifecycle.REPO_ROOT, result.docxPath)
            : null,
          record: result.record
        }
      });
    } catch (err) {
      console.error('[Lifecycle] document generation failed:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
