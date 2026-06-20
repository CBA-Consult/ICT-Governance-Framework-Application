'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BRIDGE_PATH = path.join(REPO_ROOT, 'adpa/coe/compliance-lineage-bridge.json');

function loadBridge() {
  return JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf8'));
}
const { updateClientEscalation, getClientEscalationRaw } = require('./compliance-client-escalation-service');

function procurementSlasDir(tenantId) {
  return path.join(REPO_ROOT, 'adpa/tenants', tenantId, 'procurement-slas');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function loadJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function defaultSlaTerms(priority) {
  const bridge = loadBridge();
  const defaults = bridge.complianceEscalationSla?.[priority]
    || bridge.complianceEscalationSla?.High;
  return {
    priority,
    acknowledgeMs: defaults.acknowledgeMs,
    checkValidationMs: defaults.checkValidationMs,
    resolutionMs: defaults.resolutionMs,
    labels: defaults.labels || {}
  };
}

function sumCostItems(costItems) {
  return (costItems || []).reduce((sum, item) => sum + (Number(item.estimatedUsd) || 0), 0);
}

function buildControlObligationsFromEscalation(escalation) {
  const actions = escalation?.mitigationPlan?.clientActions || [];
  return actions.map((action, idx) => ({
    obligationId: action.actionId || `obl-${idx + 1}`,
    description: action.title || action.description,
    linkedRuleId: action.linkedRuleId || null,
    linkedActionId: action.actionId || null,
    linkedAssetId: escalation.assetId || null,
    controlType: 'compensating-control',
    accountableParty: 'vendor',
    effectiveWhen: 'non-compliance-triggered'
  }));
}

function normalizeControlObligations(obligations, fallbackIdx = 0) {
  return (obligations || []).map((item, idx) => ({
    obligationId: item.obligationId || `obl-${fallbackIdx + idx + 1}`,
    description: item.description,
    linkedRuleId: item.linkedRuleId || null,
    linkedActionId: item.linkedActionId || null,
    linkedAssetId: item.linkedAssetId || null,
    controlType: item.controlType || 'compensating-control',
    accountableParty: item.accountableParty || 'vendor',
    effectiveWhen: item.effectiveWhen || 'non-compliance-triggered'
  }));
}

function normalizeMitigationCoverage({
  mitigationControlCostCoverage,
  linkedEscalationId,
  tenantId,
  linkedRuleIds
}) {
  const bridge = loadBridge();
  const policy = bridge.procurementSlaPolicy || {};

  if (!mitigationControlCostCoverage?.coversAdditionalControls) {
    const error = new Error(
      'Procurement SLA must cover initiation of additional controls that mitigate exposed risks from non-compliant assets.'
    );
    error.statusCode = 400;
    throw error;
  }

  let controlObligations = normalizeControlObligations(mitigationControlCostCoverage.controlObligations);
  if (controlObligations.length === 0 && linkedEscalationId) {
    const escalation = getClientEscalationRaw(tenantId, linkedEscalationId);
    if (escalation) {
      controlObligations = buildControlObligationsFromEscalation(escalation);
    }
  }

  if (policy.requireControlObligations !== false && controlObligations.length === 0) {
    const error = new Error(
      'Procurement SLA requires control obligations tied to mitigation plan actions — control placement is not line-item priced.'
    );
    error.statusCode = 400;
    throw error;
  }

  const costItems = (mitigationControlCostCoverage.costItems || []).map((item, idx) => ({
    itemId: item.itemId || `cost-${idx + 1}`,
    description: item.description,
    estimatedUsd: item.estimatedUsd != null ? Number(item.estimatedUsd) : null,
    controlPurpose: item.controlPurpose || null,
    linkedRuleId: item.linkedRuleId || null,
    linkedAssetId: item.linkedAssetId || null
  }));
  const totalEstimatedCoverageUsd = sumCostItems(costItems.filter((i) => i.estimatedUsd != null));

  const coverageModel = mitigationControlCostCoverage.coverageModel
    || policy.coverageModelDefault
    || 'vendor-accountability';
  const pricingApproach = mitigationControlCostCoverage.pricingApproach
    || policy.pricingApproachDefault
    || 'not-line-item-priced';

  return {
    coversAdditionalControls: true,
    coverageBasis: mitigationControlCostCoverage.coverageBasis || policy.coverageBasisDefault || 'non-compliant-asset-exposed-risk',
    coverageModel,
    pricingApproach,
    vendorAccountability: mitigationControlCostCoverage.vendorAccountability || {
      accountableParty: 'vendor',
      obligation: 'Vendor remains accountable for contracted compliance requirements and must initiate controls per the linked mitigation plan when non-compliance is triggered.',
      complianceRequirementsCovered: linkedRuleIds || []
    },
    controlObligations,
    financialExposure: {
      reportingBoundary: policy.financialReportingBoundary || 'fair-ale-tco-only',
      estimatedUsd: mitigationControlCostCoverage.financialExposure?.estimatedUsd ?? null,
      estimateBand: mitigationControlCostCoverage.financialExposure?.estimateBand || 'unknown',
      note: mitigationControlCostCoverage.financialExposure?.note
        || 'Control placement is not line-item priced. Executive reporting uses FAIR/ALE/TCO exposure within the governance framework boundary.'
    },
    budgetCeilingUsd: mitigationControlCostCoverage.budgetCeilingUsd ?? (totalEstimatedCoverageUsd || null),
    currency: mitigationControlCostCoverage.currency || 'USD',
    coveredControlTypes: mitigationControlCostCoverage.coveredControlTypes || policy.coveredControlTypesDefault || [
      'compensating-control',
      'monitoring-enhancement'
    ],
    costItems,
    totalEstimatedCoverageUsd: totalEstimatedCoverageUsd || null,
    notes: mitigationControlCostCoverage.notes || null
  };
}

function draftProcurementComplianceSla({
  tenantId,
  draftedBy,
  title,
  priority,
  linkedEscalationId,
  linkedRequirementId,
  linkedAssetIds,
  linkedRuleIds,
  slaTerms,
  mitigationControlCostCoverage
}) {
  const slaId = `proc-sla-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const priorityLevel = priority || slaTerms?.priority || 'High';
  const mitigationCoverage = normalizeMitigationCoverage({
    mitigationControlCostCoverage,
    linkedEscalationId,
    tenantId,
    linkedRuleIds
  });

  const sla = {
    slaId,
    tenantId,
    status: 'draft',
    title: title || `Compliance mitigation SLA — ${linkedRequirementId || linkedEscalationId || slaId}`,
    draftedBy: draftedBy || null,
    linkedEscalationId: linkedEscalationId || null,
    linkedRequirementId: linkedRequirementId || null,
    linkedAssetIds: linkedAssetIds || [],
    linkedRuleIds: linkedRuleIds || [],
    slaTerms: { ...defaultSlaTerms(priorityLevel), ...(slaTerms || {}), priority: priorityLevel },
    mitigationControlCostCoverage: mitigationCoverage,
    internalControlDiscountPolicyRef: 'internalControlDiscountPolicy',
    draftedAt: new Date().toISOString()
  };

  saveJson(path.join(procurementSlasDir(tenantId), `${slaId}.json`), sla);
  return sla;
}

function listProcurementComplianceSlas(tenantId, { status } = {}) {
  const dir = procurementSlasDir(tenantId);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => loadJsonSafe(path.join(dir, f)))
    .filter(Boolean)
    .filter((s) => !status || s.status === status)
    .sort((a, b) => new Date(b.draftedAt) - new Date(a.draftedAt));
}

function getProcurementComplianceSla(tenantId, slaId) {
  return loadJsonSafe(path.join(procurementSlasDir(tenantId), `${slaId}.json`));
}

function approveProcurementComplianceSla(tenantId, slaId, { approvedBy } = {}) {
  const filePath = path.join(procurementSlasDir(tenantId), `${slaId}.json`);
  const sla = loadJsonSafe(filePath);
  if (!sla) return null;
  const updated = {
    ...sla,
    status: 'approved',
    approvedBy: approvedBy || null,
    approvedAt: new Date().toISOString()
  };
  saveJson(filePath, updated);
  return updated;
}

function activateProcurementComplianceSla(tenantId, slaId, escalationId, { activatedBy } = {}) {
  const sla = getProcurementComplianceSla(tenantId, slaId);
  if (!sla) return null;
  if (sla.status !== 'approved' && sla.status !== 'draft') {
    const error = new Error('Only draft or approved procurement SLAs can be activated.');
    error.statusCode = 400;
    throw error;
  }

  const targetEscalationId = escalationId || sla.linkedEscalationId;
  if (!targetEscalationId) {
    const error = new Error('escalationId required to activate procurement SLA.');
    error.statusCode = 400;
    throw error;
  }

  const escalation = getClientEscalationRaw(tenantId, targetEscalationId);
  if (!escalation) {
    const error = new Error(`Escalation not found: ${targetEscalationId}`);
    error.statusCode = 404;
    throw error;
  }

  const filePath = path.join(procurementSlasDir(tenantId), `${slaId}.json`);
  const activatedSla = {
    ...sla,
    status: 'active',
    linkedEscalationId: targetEscalationId,
    activatedAt: new Date().toISOString(),
    activatedBy: activatedBy || sla.approvedBy || sla.draftedBy
  };
  saveJson(filePath, activatedSla);

  updateClientEscalation(tenantId, targetEscalationId, {
    procurementSlaId: slaId,
    procurementMitigationCostCoverage: activatedSla.mitigationControlCostCoverage
  });

  return { sla: activatedSla, escalationId: targetEscalationId };
}

module.exports = {
  procurementSlasDir,
  draftProcurementComplianceSla,
  listProcurementComplianceSlas,
  getProcurementComplianceSla,
  approveProcurementComplianceSla,
  activateProcurementComplianceSla,
  defaultSlaTerms,
  sumCostItems,
  buildControlObligationsFromEscalation,
  normalizeMitigationCoverage
};
