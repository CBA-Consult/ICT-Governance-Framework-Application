'use strict';

const express = require('express');
const { Pool } = require('pg');
const { authenticateToken, requirePermissions, requireAnyPermissions } = require('../middleware/auth');
const traceability = require('../services/traceability-service');
const complianceLineage = require('../services/compliance-lineage-service');
const clientEscalation = require('../services/compliance-client-escalation-service');
const procurementSla = require('../services/compliance-procurement-sla-service');
const responsibilityBoundary = require('../services/service-responsibility-boundary-service');

const router = express.Router();
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

function actorEmail(req) {
  return req.user?.email || req.user?.username || 'unknown';
}

function getPool() {
  return pool;
}

router.get('/compliance-review', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const tenantId = req.query.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'tenantId query parameter required' });
    }
    const review = await complianceLineage.buildComplianceLineageReview(tenantId, getPool());
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/compliance-review/entities/:assetId', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const tenantId = req.query.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'tenantId query parameter required' });
    }
    const drillDown = await complianceLineage.getEntityComplianceDrillDown(
      tenantId,
      decodeURIComponent(req.params.assetId),
      getPool()
    );
    if (!drillDown) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }
    res.json({ success: true, data: drillDown });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/compliance-lineage-bridge', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    res.json({ success: true, data: complianceLineage.loadBridge() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tenants/:tenantId/compliance-escalations', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const escalations = clientEscalation.listClientEscalations(req.params.tenantId, {
      status: req.query.status
    });
    res.json({ success: true, data: { escalations } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tenants/:tenantId/compliance-escalations/:escalationId', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const record = clientEscalation.getClientEscalation(req.params.tenantId, req.params.escalationId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Client escalation not found' });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tenants/:tenantId/compliance-escalations/:escalationId/acknowledge', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const updated = clientEscalation.acknowledgeClientEscalation(
      req.params.tenantId,
      req.params.escalationId,
      { decidedBy: actorEmail(req), notes: req.body?.notes }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Client escalation not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/tenants/:tenantId/compliance-escalations/:escalationId/liability-routing', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const updated = clientEscalation.recordLiabilityRouting(
      req.params.tenantId,
      req.params.escalationId,
      {
        assessedBy: actorEmail(req),
        internalMitigationSufficient: req.body?.internalMitigationSufficient,
        routingDecision: req.body?.routingDecision,
        vendorId: req.body?.vendorId,
        vendorName: req.body?.vendorName,
        linkedRuleIds: req.body?.linkedRuleIds,
        rationale: req.body?.rationale
      }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Client escalation not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

router.post('/tenants/:tenantId/compliance-escalations/:escalationId/downstream-liability', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const updated = clientEscalation.recordDownstreamLiabilityEscalation(
      req.params.tenantId,
      req.params.escalationId,
      {
        escalatedBy: actorEmail(req),
        description: req.body?.description,
        linkedRuleIds: req.body?.linkedRuleIds,
        impactAssessment: req.body?.impactAssessment,
        mitigationDeadline: req.body?.mitigationDeadline,
        liabilityScope: req.body?.liabilityScope
      }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Client escalation not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

router.post('/tenants/:tenantId/compliance-escalations/:escalationId/check-validation', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const updated = clientEscalation.recordClientCheckValidation(
      req.params.tenantId,
      req.params.escalationId,
      {
        assessedBy: actorEmail(req),
        checkValidationInPlace: req.body?.checkValidationInPlace,
        checkValidationDescription: req.body?.checkValidationDescription,
        linkedRuleIds: req.body?.linkedRuleIds,
        preventsDownstreamEscalation: req.body?.preventsDownstreamEscalation,
        evidenceRef: req.body?.evidenceRef,
        reviewExpiry: req.body?.reviewExpiry
      }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Client escalation not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

router.post('/tenants/:tenantId/compliance-escalations/:escalationId/resolve', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const updated = clientEscalation.resolveClientEscalation(
      req.params.tenantId,
      req.params.escalationId,
      {
        decision: req.body?.decision,
        notes: req.body?.notes,
        decidedBy: actorEmail(req)
      }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Client escalation not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/tenants/:tenantId/procurement-slas', authenticateToken, requireAnyPermissions(['governance.read', 'app.procurement']), (req, res) => {
  try {
    const slas = procurementSla.listProcurementComplianceSlas(req.params.tenantId, {
      status: req.query.status
    });
    res.json({ success: true, data: { slas } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tenants/:tenantId/procurement-slas/:slaId', authenticateToken, requireAnyPermissions(['governance.read', 'app.procurement']), (req, res) => {
  try {
    const record = procurementSla.getProcurementComplianceSla(req.params.tenantId, req.params.slaId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Procurement SLA not found' });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tenants/:tenantId/procurement-slas/draft', authenticateToken, requirePermissions(['app.procurement']), (req, res) => {
  try {
    const sla = procurementSla.draftProcurementComplianceSla({
      tenantId: req.params.tenantId,
      draftedBy: actorEmail(req),
      title: req.body?.title,
      priority: req.body?.priority,
      linkedEscalationId: req.body?.linkedEscalationId,
      linkedRequirementId: req.body?.linkedRequirementId,
      linkedAssetIds: req.body?.linkedAssetIds,
      linkedRuleIds: req.body?.linkedRuleIds,
      slaTerms: req.body?.slaTerms,
      mitigationControlCostCoverage: req.body?.mitigationControlCostCoverage
    });
    res.status(201).json({ success: true, data: sla });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

router.post('/tenants/:tenantId/procurement-slas/:slaId/approve', authenticateToken, requirePermissions(['app.procurement']), (req, res) => {
  try {
    const updated = procurementSla.approveProcurementComplianceSla(
      req.params.tenantId,
      req.params.slaId,
      { approvedBy: actorEmail(req) }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Procurement SLA not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

router.post('/tenants/:tenantId/procurement-slas/:slaId/activate', authenticateToken, requirePermissions(['app.procurement']), (req, res) => {
  try {
    const result = procurementSla.activateProcurementComplianceSla(
      req.params.tenantId,
      req.params.slaId,
      req.body?.escalationId,
      { activatedBy: actorEmail(req) }
    );
    if (!result) {
      return res.status(404).json({ success: false, error: 'Procurement SLA not found' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

router.get('/tenants/:tenantId/requirements/:requirementId/responsibility-boundary', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const data = responsibilityBoundary.getRequirementResponsibilityBoundary(
      req.params.tenantId,
      req.params.requirementId
    );
    if (!data) {
      return res.status(404).json({ success: false, error: 'Requirement not found' });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tenants/:tenantId/requirements/:requirementId/expectations', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const cloudProvider = req.query.cloudProvider;
    const data = traceability.getDeploymentExpectations(
      req.params.tenantId,
      req.params.requirementId,
      cloudProvider
    );
    if (!data.requirement) {
      return res.status(404).json({ success: false, error: 'Requirement not found' });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/bridge', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    res.json({ success: true, data: traceability.loadBridge() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/audit', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    res.json({ success: true, data: { auditTrail: traceability.getAuditTrail(limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tenants/:tenantId/monitors', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    res.json({
      success: true,
      data: { monitors: traceability.listComplianceMonitors(req.params.tenantId) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tenants/:tenantId/monitors/:monitorId', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const monitor = traceability.getComplianceMonitor(req.params.tenantId, req.params.monitorId);
    if (!monitor) {
      return res.status(404).json({ success: false, error: 'Monitor not found' });
    }
    res.json({ success: true, data: monitor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tenants/:tenantId/validations/:validationId', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const record = traceability.getValidationRecord(req.params.tenantId, req.params.validationId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Validation record not found' });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/validate', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const record = traceability.createValidationRecord(req.body, actorEmail(req));
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/validate/:validationId/apply-asset-loopback', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const { tenantId } = req.body;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'tenantId required in body' });
    }

    const record = traceability.getValidationRecord(tenantId, req.params.validationId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Validation record not found' });
    }

    const result = await traceability.applyAssetLoopBack(record, getPool(), actorEmail(req));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/validate-and-loopback', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const record = traceability.createValidationRecord(req.body, actorEmail(req));
    const loopBack = await traceability.applyAssetLoopBack(record, getPool(), actorEmail(req));
    res.status(201).json({ success: true, data: { validation: record, assetLoopBack: loopBack } });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
