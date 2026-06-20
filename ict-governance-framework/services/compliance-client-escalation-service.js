'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  validateComplianceNotification,
  formatFrameworkImpactLine
} = require('./compliance-notification-service');
const {
  enrichComplianceEscalation,
  enrichComplianceEscalations
} = require('./compliance-escalation-sla-service');
const {
  loadRequirement,
  enrichEscalationWithResponsibilityBoundary
} = require('./service-responsibility-boundary-service');
const { assessComplianceEscalationExposure } = require('./compliance-escalation-exposure-service');
const { resolveTimeboundOnboarding } = require('./timebound-onboarding-service');
const { enrichBoundaryWithObligationSlas, enrichEscalationWithObligationSlas } = require('./obligation-sla-binding-service');
const { enrichBoundaryWithEvidence, enrichEscalationWithEvidence } = require('./evidence-provenance-service');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function escalationsDir(tenantId) {
  return path.join(REPO_ROOT, 'adpa/tenants', tenantId, 'compliance-escalations');
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

function mapSeverityToPriority(severity) {
  const map = { CRITICAL: 'Critical', critical: 'Critical', HIGH: 'High', high: 'High', MEDIUM: 'Medium', LOW: 'Low' };
  return map[severity] || 'High';
}

function buildClientActions({ requirement, evaluation, frameworkImpacts, remediationTemplateId }) {
  const actions = [];
  const evidenceTypes = requirement?.deploymentExpectations?.vendorDeliverableProfile?.evidenceTypes || [];
  const controlGaps = (evaluation?.gaps || []).filter((g) => g.type === 'control');
  const monitoringRules = requirement?.deploymentExpectations?.monitoringRules || [];

  controlGaps.forEach((gap) => {
    const rule = monitoringRules.find((r) => r.ruleId === gap.ruleId || r.controlId === gap.controlId);
    const criteriaIdx = gap.mapsToAcceptanceCriteria ?? rule?.mapsToAcceptanceCriteria;
    const criteriaText = criteriaIdx != null
      ? requirement?.acceptanceCriteria?.[criteriaIdx]
      : null;
    const relatedCerts = frameworkImpacts
      .filter((impact) => impact.triggeredBy?.some((t) => t.ruleId === gap.ruleId))
      .map((impact) => ({
        certificationId: impact.certificationId,
        controlId: impact.controlId
      }));

    actions.push({
      actionId: `act-${gap.ruleId || gap.controlId}`,
      title: criteriaText || rule?.expectedState || `Remediate ${gap.controlId}`,
      description: [
        `Restore compliance for monitoring rule "${gap.ruleId || gap.controlId}".`,
        gap.expectedState ? `Target state: ${gap.expectedState}.` : null,
        gap.observed ? `Current observed state: ${gap.observed}.` : null,
        remediationTemplateId ? `Apply remediation template: ${remediationTemplateId}.` : null
      ].filter(Boolean).join(' '),
      priority: mapSeverityToPriority(rule?.severityOnFail || 'high'),
      linkedRuleId: gap.ruleId || rule?.ruleId || null,
      linkedControlId: gap.controlId || rule?.controlId || null,
      linkedCertificationId: relatedCerts[0]?.certificationId || null,
      linkedFrameworkControlId: relatedCerts[0]?.controlId || null,
      acceptanceCriteriaIndex: criteriaIdx ?? null,
      evidenceRequired: evidenceTypes,
      status: 'pending'
    });
  });

  if (!actions.length && frameworkImpacts.length) {
    frameworkImpacts.forEach((impact) => {
      actions.push({
        actionId: `act-${impact.certificationId}-${impact.controlId}`.replace(/[^a-zA-Z0-9-]/g, '-'),
        title: `Restore ${impact.certificationLabel} control ${impact.controlId}`,
        description: formatFrameworkImpactLine(impact),
        priority: 'High',
        linkedCertificationId: impact.certificationId,
        linkedFrameworkControlId: impact.controlId,
        evidenceRequired: evidenceTypes,
        status: 'pending'
      });
    });
  }

  return actions;
}

function enrichMitigationPlan({ requirement, evaluation, frameworkImpacts, remediationTemplateId }) {
  const base = evaluation?.expectationSummary?.vendorDeliverableProfile
    ? { vendorDeliverableProfile: evaluation.expectationSummary.vendorDeliverableProfile }
    : { vendorDeliverableProfile: requirement?.deploymentExpectations?.vendorDeliverableProfile || null };

  return {
    remediationTemplateId: remediationTemplateId || requirement?.deploymentExpectations?.onFailure?.remediationTemplateId || requirement?.templateId || null,
    requirementId: requirement?.requirementId || null,
    requirementTitle: requirement?.title || null,
    acceptanceCriteria: requirement?.acceptanceCriteria || [],
    vendorDeliverableProfile: base.vendorDeliverableProfile,
    clientActions: buildClientActions({
      requirement,
      evaluation,
      frameworkImpacts,
      remediationTemplateId
    })
  };
}

function buildEscalationSummary(complianceNotification) {
  const impactSummaries = complianceNotification.frameworkImpacts
    .map((impact) => formatFrameworkImpactLine(impact));
  return [
    'Infrastructure compliance escalation — explicit control failure detail for client remediation.',
    ...impactSummaries
  ].join('\n');
}

function createClientEscalation({
  complianceNotification,
  requirement,
  evaluation,
  remediationTemplateId,
  priority,
  monitorId,
  secOpsIncidentId
}) {
  validateComplianceNotification(complianceNotification);

  const mitigationPlan = enrichMitigationPlan({
    requirement,
    evaluation: evaluation || { gaps: complianceNotification.gaps },
    frameworkImpacts: complianceNotification.frameworkImpacts,
    remediationTemplateId
  });

  if (!mitigationPlan.clientActions.length) {
    const error = new Error('Client escalation requires at least one executable mitigation action.');
    error.statusCode = 400;
    throw error;
  }

  const escalationId = `ces-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  let escalation = {
    escalationId,
    tenantId: complianceNotification.tenantId,
    escalationClass: 'client-infrastructure-compliance',
    status: 'Open',
    priority: priority || mapSeverityToPriority(requirement?.deploymentExpectations?.onFailure?.severity || 'HIGH'),
    assetId: complianceNotification.assetId,
    requirementId: complianceNotification.requirementId,
    validationId: complianceNotification.validationId,
    monitorId: monitorId || null,
    lineageId: complianceNotification.lineage?.lineageId || null,
    summary: buildEscalationSummary(complianceNotification),
    frameworkImpacts: complianceNotification.frameworkImpacts,
    mitigationPlan,
    complianceNotification,
    secOpsIncidentId: secOpsIncidentId || null,
    issuedAt: new Date().toISOString()
  };

  escalation = enrichEscalationWithResponsibilityBoundary(escalation, requirement);

  saveJson(
    path.join(escalationsDir(complianceNotification.tenantId), `${escalationId}.json`),
    escalation
  );

  return escalation;
}

function listClientEscalations(tenantId, { status } = {}) {
  const dir = escalationsDir(tenantId);
  if (!fs.existsSync(dir)) return [];
  const items = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => loadJsonSafe(path.join(dir, f)))
    .filter(Boolean)
    .filter((e) => !status || e.status === status)
    .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
  return items.map((item) => enrichEscalationRecord(item));
}

function getClientEscalationRaw(tenantId, escalationId) {
  return loadJsonSafe(path.join(escalationsDir(tenantId), `${escalationId}.json`));
}

function getClientEscalation(tenantId, escalationId) {
  return enrichEscalationRecord(getClientEscalationRaw(tenantId, escalationId));
}

function enrichEscalationRecord(escalation) {
  if (!escalation) return null;
  let record = escalation;
  let requirement = null;
  if (escalation.requirementId) {
    requirement = loadRequirement(escalation.tenantId, escalation.requirementId);
    record = enrichEscalationWithResponsibilityBoundary(escalation, requirement);
    record = enrichEscalationWithObligationSlas(record, requirement);
    record = enrichEscalationWithEvidence(record);
  }
  const frameworkExposure = assessComplianceEscalationExposure(record, requirement);
  const timeboundOnboarding = requirement ? resolveTimeboundOnboarding(requirement) : null;
  return enrichComplianceEscalation({ ...record, frameworkExposure, timeboundOnboarding });
}

function updateClientEscalation(tenantId, escalationId, patch) {
  const filePath = path.join(escalationsDir(tenantId), `${escalationId}.json`);
  const escalation = loadJsonSafe(filePath);
  if (!escalation) return null;

  const updated = { ...escalation, ...patch };
  if (patch.status === 'Acknowledged' && !updated.acknowledgedAt) {
    updated.acknowledgedAt = new Date().toISOString();
  }
  if (['Resolved', 'Closed'].includes(patch.status) && !updated.resolvedAt) {
    updated.resolvedAt = new Date().toISOString();
  }
  saveJson(filePath, updated);
  return enrichEscalationRecord(updated);
}

function acknowledgeClientEscalation(tenantId, escalationId, { decidedBy, notes } = {}) {
  return updateClientEscalation(tenantId, escalationId, {
    status: 'Acknowledged',
    clientDisposition: {
      decision: 'remediate',
      notes: notes || 'Client acknowledged — mitigation in progress.',
      decidedBy: decidedBy || null,
      decidedAt: new Date().toISOString()
    }
  });
}

function resolveClientEscalation(tenantId, escalationId, { decision, notes, decidedBy } = {}) {
  return updateClientEscalation(tenantId, escalationId, {
    status: 'Resolved',
    clientDisposition: {
      decision: decision || 'remediate',
      notes: notes || null,
      decidedBy: decidedBy || null,
      decidedAt: new Date().toISOString()
    }
  });
}

function recordClientCheckValidation(tenantId, escalationId, {
  assessedBy,
  checkValidationInPlace,
  checkValidationDescription,
  linkedRuleIds,
  preventsDownstreamEscalation,
  evidenceRef,
  reviewExpiry
} = {}) {
  const escalation = getClientEscalation(tenantId, escalationId);
  if (!escalation) return null;

  if (!Array.isArray(linkedRuleIds) || linkedRuleIds.length === 0) {
    const error = new Error('Client check validation must reference at least one linkedRuleId from the escalation.');
    error.statusCode = 400;
    throw error;
  }

  const clientCheckValidation = {
    assessedAt: new Date().toISOString(),
    assessedBy: assessedBy || null,
    checkValidationInPlace: Boolean(checkValidationInPlace),
    checkValidationDescription: checkValidationDescription || null,
    linkedRuleIds,
    preventsDownstreamEscalation: Boolean(preventsDownstreamEscalation),
    evidenceRef: evidenceRef || null,
    reviewExpiry: reviewExpiry || null
  };

  const patch = { clientCheckValidation };

  if (checkValidationInPlace && preventsDownstreamEscalation) {
    patch.status = 'Mitigating';
    patch.clientDisposition = {
      decision: 'compensating-control',
      notes: checkValidationDescription
        || 'Client confirmed internal check/validation prevents downstream escalation.',
      decidedBy: assessedBy || null,
      decidedAt: new Date().toISOString()
    };
  } else if (!checkValidationInPlace) {
    patch.status = 'Open';
    patch.clientDisposition = {
      decision: 'remediate',
      notes: 'No compensating check/validation in place — client must remediate framework non-compliance.',
      decidedBy: assessedBy || null,
      decidedAt: new Date().toISOString()
    };
  }

  return updateClientEscalation(tenantId, escalationId, patch);
}

function recordDownstreamLiabilityEscalation(tenantId, escalationId, {
  escalatedBy,
  description,
  linkedRuleIds,
  impactAssessment,
  mitigationDeadline,
  liabilityScope
} = {}) {
  const escalation = getClientEscalation(tenantId, escalationId);
  if (!escalation) return null;

  if (!description?.trim()) {
    const error = new Error('Downstream liability escalation requires a description of the downstream impact.');
    error.statusCode = 400;
    throw error;
  }
  if (!Array.isArray(linkedRuleIds) || linkedRuleIds.length === 0) {
    const error = new Error('Downstream liability escalation must reference linkedRuleIds from the framework failure.');
    error.statusCode = 400;
    throw error;
  }

  const downstreamLiabilityEscalation = {
    escalatedAt: new Date().toISOString(),
    escalatedBy: escalatedBy || null,
    liabilityScope: liabilityScope || 'client-premises-downstream',
    description: description.trim(),
    linkedRuleIds,
    impactAssessment: impactAssessment || null,
    mitigationDeadline: mitigationDeadline || null,
    status: 'escalated'
  };

  return updateClientEscalation(tenantId, escalationId, {
    downstreamLiabilityEscalation,
    priority: 'Critical',
    status: 'Open',
    clientDisposition: {
      decision: 'downstream-liability-escalated',
      notes: description.trim(),
      decidedBy: escalatedBy || null,
      decidedAt: new Date().toISOString()
    }
  });
}

function recordLiabilityRouting(tenantId, escalationId, {
  assessedBy,
  internalMitigationSufficient,
  routingDecision,
  vendorId,
  vendorName,
  linkedRuleIds,
  rationale
} = {}) {
  const escalation = getClientEscalation(tenantId, escalationId);
  if (!escalation) return null;

  const validRoutes = ['remains-with-vendor', 'escalates-to-governance-products-services'];
  if (!validRoutes.includes(routingDecision)) {
    const error = new Error(
      'routingDecision must be remains-with-vendor or escalates-to-governance-products-services.'
    );
    error.statusCode = 400;
    throw error;
  }
  if (!Array.isArray(linkedRuleIds) || linkedRuleIds.length === 0) {
    const error = new Error('Liability routing must reference linkedRuleIds from the failed compliance rules.');
    error.statusCode = 400;
    throw error;
  }

  const liabilityRouting = {
    assessedAt: new Date().toISOString(),
    assessedBy: assessedBy || null,
    internalMitigationSufficient: Boolean(internalMitigationSufficient),
    routingDecision,
    vendorId: vendorId || null,
    vendorName: vendorName || null,
    linkedRuleIds,
    rationale: rationale || null,
    immediateVendorBlockApplied: false
  };

  const patch = { liabilityRouting };

  if (internalMitigationSufficient && routingDecision === 'remains-with-vendor') {
    patch.status = 'Mitigating';
    patch.clientDisposition = {
      decision: 'compensating-control',
      notes: rationale || 'Internal controls mitigate vendor non-compliance — liability remains with vendor.',
      decidedBy: assessedBy || null,
      decidedAt: new Date().toISOString()
    };
  } else if (routingDecision === 'escalates-to-governance-products-services') {
    patch.status = 'Open';
    patch.priority = 'Critical';
    patch.clientDisposition = {
      decision: 'unable-to-mitigate',
      notes: rationale || 'Non-compliance escalates into governance products and services.',
      decidedBy: assessedBy || null,
      decidedAt: new Date().toISOString()
    };
  }

  return updateClientEscalation(tenantId, escalationId, patch);
}

module.exports = {
  escalationsDir,
  buildClientActions,
  enrichMitigationPlan,
  createClientEscalation,
  listClientEscalations,
  getClientEscalation,
  getClientEscalationRaw,
  updateClientEscalation,
  acknowledgeClientEscalation,
  resolveClientEscalation,
  recordClientCheckValidation,
  recordDownstreamLiabilityEscalation,
  recordLiabilityRouting
};
