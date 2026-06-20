'use strict';

const express = require('express');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const orchestrator = require('../services/remediation-orchestrator-service');

const router = express.Router();

function actorEmail(req) {
  return req.user?.email || req.user?.username || 'unknown';
}

router.get('/plans', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const plans = orchestrator.listRemediationPlans();
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/plans/:planId', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const plan = orchestrator.loadRemediationPlan(req.params.planId);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Remediation plan not found' });
    }
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/execute', authenticateToken, requirePermissions(['governance.read']), async (req, res) => {
  try {
    const { tenantId, requirementId, planId, escalationId } = req.body || {};

    if (!tenantId || !planId) {
      return res.status(400).json({
        success: false,
        error: 'tenantId and planId are required'
      });
    }

    const plan = orchestrator.loadRemediationPlan(planId);
    if (!plan) {
      return res.status(404).json({ success: false, error: `Unknown plan: ${planId}` });
    }

    if (requirementId && plan.requirementId && plan.requirementId !== requirementId) {
      return res.status(400).json({
        success: false,
        error: 'planId does not match requirementId'
      });
    }

    const run = await orchestrator.executeRemediation(plan, {
      tenantId,
      requirementId: requirementId || plan.requirementId,
      planId,
      escalationId: escalationId || null,
      executedBy: actorEmail(req)
    });

    res.json({
      success: run.status === 'verified' || run.status === 'completed',
      data: {
        status: run.status,
        remediationRunId: run.remediationRunId,
        lineageId: run.lineageId,
        statusHistory: run.statusHistory,
        results: run.executedSteps,
        finalValidation: run.finalValidation,
        failedStep: run.failedStep || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/runs', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'tenantId query parameter required' });
    }
    res.json({ success: true, data: orchestrator.listRemediationRuns(tenantId) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/runs/:runId', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'tenantId query parameter required' });
    }
    const run = orchestrator.getRemediationRun(tenantId, req.params.runId);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Remediation run not found' });
    }
    res.json({ success: true, data: run });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/runs/:runId/close', authenticateToken, requirePermissions(['governance.read']), (req, res) => {
  try {
    const { tenantId, reason } = req.body || {};
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'tenantId is required' });
    }

    const run = orchestrator.closeRemediationRun(tenantId, req.params.runId, {
      by: actorEmail(req),
      reason: reason || 'escalation-resolved'
    });

    res.json({
      success: true,
      data: {
        status: run.status,
        remediationRunId: run.remediationRunId,
        statusHistory: run.statusHistory,
        closedAt: run.closedAt,
        closedBy: run.closedBy
      }
    });
  } catch (err) {
    const status = /not found/i.test(err.message) ? 404 : 400;
    res.status(status).json({ success: false, error: err.message });
  }
});

module.exports = router;
