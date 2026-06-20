'use strict';

const fs = require('fs');
const path = require('path');
const { enrichBoundaryWithObligationSlas } = require('./obligation-sla-binding-service');
const { enrichBoundaryWithEvidence } = require('./evidence-provenance-service');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BRIDGE_PATH = path.join(REPO_ROOT, 'adpa/coe/compliance-lineage-bridge.json');

const CLIENT_CONTEXT_SIGNALS = [
  'breakGlassExclusionMisconfigured',
  'exclusionReviewOverdue',
  'clientCaMisconfiguration'
];

const SERVICE_CONTEXT_SIGNALS = [
  'caPolicyNotDeployed',
  'caEnforcementDisabled',
  'serviceCaMisconfiguration'
];

function loadBridge() {
  return JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf8'));
}

function loadRequirement(tenantId, requirementId) {
  const filePath = path.join(REPO_ROOT, 'adpa/tenants', tenantId, 'requirements', `${requirementId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveCertificationId(framework) {
  const bridge = loadBridge();
  const cert = bridge.certificationFrameworks.find((c) =>
    c.frameworkKeys.some((k) => framework?.includes(k) || framework === k)
  );
  return cert?.certificationId || framework;
}

function defaultMonitorability(obligation, responsibilityType) {
  if (obligation.monitorability) return obligation.monitorability;

  if (responsibilityType === 'client' || obligation.monitoredBySystem === false) {
    return { type: 'non-monitorable', confidenceLevel: 'high' };
  }
  if (responsibilityType === 'shared') {
    return { type: 'inferred', confidenceLevel: 'medium' };
  }
  if (obligation.obligationClass === 'automated-control' || obligation.monitoredBySystem) {
    return { type: 'deterministic', confidenceLevel: 'high' };
  }
  return { type: 'inferred', confidenceLevel: 'medium' };
}

function normalizeObligation(obligation, responsibilityType) {
  const type = obligation.responsibilityType || responsibilityType;
  return {
    ...obligation,
    responsibilityType: type,
    monitorability: defaultMonitorability(obligation, type)
  };
}

function flattenObligations(boundary) {
  if (!boundary) return [];
  return [
    ...(boundary.serviceObligations || []).map((o) => normalizeObligation(o, 'service')),
    ...(boundary.sharedObligations || []).map((o) => normalizeObligation(o, 'shared')),
    ...(boundary.clientPremisesObligations || []).map((o) => normalizeObligation(o, 'client'))
  ];
}

function deriveServiceObligationsFromRules(requirement) {
  const rules = requirement?.deploymentExpectations?.monitoringRules || [];
  const acceptanceCriteria = requirement?.acceptanceCriteria || [];

  return rules
    .filter((rule) => (rule.responsibleParty || 'governance-service') === 'governance-service')
    .map((rule) => {
      const criteriaIdx = rule.mapsToAcceptanceCriteria;
      return normalizeObligation({
        obligationId: `svc-${rule.ruleId}`,
        title: criteriaIdx != null ? acceptanceCriteria[criteriaIdx] : rule.expectedState,
        description: `Governance service deploys, monitors, and escalates rule "${rule.ruleId}" — expected: ${rule.expectedState}.`,
        accountableParty: 'governance-service',
        obligationClass: 'monitoring-rule',
        linkedRuleIds: [rule.ruleId],
        linkedAcceptanceCriteriaIndex: criteriaIdx ?? null,
        monitoredBySystem: true
      }, 'service');
    });
}

function buildFrameworkResponsibilityMaps(requirement, serviceObligations, clientPremisesObligations, sharedObligations = []) {
  const mappings = requirement?.frameworkMappings || [];
  const serviceIds = serviceObligations.map((o) => o.obligationId);
  const clientIds = clientPremisesObligations.map((o) => o.obligationId);
  const sharedIds = sharedObligations.map((o) => o.obligationId);

  return mappings.map((m) => ({
    certificationId: resolveCertificationId(m.framework),
    framework: m.framework,
    controlId: m.controlId,
    controlName: m.controlName || null,
    serviceEnsures: serviceIds,
    clientResponsibleFor: clientIds,
    sharedControls: sharedIds
  }));
}

function buildServiceResponsibilityBoundary(requirement) {
  if (!requirement) return null;

  const explicit = requirement.deploymentExpectations?.serviceResponsibilityBoundary;
  if (explicit?.serviceObligations?.length || explicit?.clientPremisesObligations?.length || explicit?.sharedObligations?.length) {
    const serviceObligations = (explicit.serviceObligations || []).map((o) => normalizeObligation(o, 'service'));
    const clientPremisesObligations = (explicit.clientPremisesObligations || []).map((o) => normalizeObligation(o, 'client'));
    const sharedObligations = (explicit.sharedObligations || []).map((o) => normalizeObligation(o, 'shared'));
    const frameworkResponsibilityMaps = explicit.frameworkResponsibilityMaps
      || buildFrameworkResponsibilityMaps(requirement, serviceObligations, clientPremisesObligations, sharedObligations);

    return {
      summary: explicit.summary || null,
      serviceObligations,
      clientPremisesObligations,
      sharedObligations,
      frameworkResponsibilityMaps,
      obligations: flattenObligations({
        serviceObligations,
        clientPremisesObligations,
        sharedObligations
      })
    };
  }

  const serviceObligations = deriveServiceObligationsFromRules(requirement);
  return {
    summary: 'Governance service obligations derived from monitored rules; add clientPremisesObligations for on-premises specifications.',
    serviceObligations,
    clientPremisesObligations: [],
    sharedObligations: [],
    frameworkResponsibilityMaps: buildFrameworkResponsibilityMaps(requirement, serviceObligations, [], []),
    obligations: flattenObligations({ serviceObligations, clientPremisesObligations: [], sharedObligations: [] })
  };
}

function getRequirementResponsibilityBoundary(tenantId, requirementId) {
  const requirement = loadRequirement(tenantId, requirementId);
  if (!requirement) return null;

  const boundary = enrichBoundaryWithEvidence(
    enrichBoundaryWithObligationSlas(
      buildServiceResponsibilityBoundary(requirement),
      null
    ),
    null
  );

  return {
    tenantId,
    requirementId,
    requirementTitle: requirement.title,
    pillar: requirement.pillar,
    frameworkMappings: requirement.frameworkMappings || [],
    boundary,
    obligations: boundary.obligations
  };
}

function evaluateRuleOwnership(boundary, ruleId) {
  const serviceObl = (boundary.serviceObligations || []).find((o) =>
    (o.linkedRuleIds || []).includes(ruleId)
  );
  if (serviceObl) {
    return {
      accountableParty: 'governance-service',
      classification: 'shared-rule-service',
      obligation: serviceObl
    };
  }

  const clientObl = (boundary.clientPremisesObligations || []).find((o) =>
    (o.linkedRuleIds || []).includes(ruleId)
  );
  if (clientObl) {
    return {
      accountableParty: 'client',
      classification: 'shared-rule-client',
      obligation: clientObl
    };
  }

  return {
    accountableParty: 'governance-service',
    classification: 'shared-rule-default-service',
    obligation: null
  };
}

function evaluateContextSignals(sharedObl, trigger = {}) {
  const signals = trigger.contextSignals || {};

  if (CLIENT_CONTEXT_SIGNALS.some((key) => signals[key] === true)) {
    return {
      accountableParty: 'client',
      classification: 'shared-context-client',
      obligation: sharedObl
    };
  }

  if (SERVICE_CONTEXT_SIGNALS.some((key) => signals[key] === true)) {
    return {
      accountableParty: 'governance-service',
      classification: 'shared-context-service',
      obligation: sharedObl
    };
  }

  return {
    accountableParty: 'governance-service',
    classification: 'shared-context-default-service',
    obligation: sharedObl
  };
}

function classifySharedFailure(boundary, sharedObl, ruleId, trigger = {}) {
  const model = sharedObl.sharedResponsibilityModel || {};

  if (model.failureAttributionLogic === 'rule-based') {
    return evaluateRuleOwnership(boundary, ruleId);
  }

  return evaluateContextSignals(sharedObl, trigger);
}

function classifyFailure(boundary, ruleId, trigger = {}) {
  if (!boundary || !ruleId) {
    return { accountableParty: 'governance-service', classification: 'service-monitored-rule' };
  }

  const sharedObl = (boundary.sharedObligations || []).find((o) =>
    (o.linkedRuleIds || []).includes(ruleId)
  );
  if (sharedObl) {
    return classifySharedFailure(boundary, sharedObl, ruleId, trigger);
  }

  const clientObl = (boundary.clientPremisesObligations || []).find((o) =>
    (o.linkedRuleIds || []).includes(ruleId)
  );
  if (clientObl) {
    return {
      accountableParty: 'client',
      classification: 'client-premises-obligation',
      obligation: clientObl
    };
  }

  const serviceObl = (boundary.serviceObligations || []).find((o) =>
    (o.linkedRuleIds || []).includes(ruleId)
  );
  if (serviceObl) {
    return {
      accountableParty: 'governance-service',
      classification: 'service-ensures',
      obligation: serviceObl
    };
  }

  return { accountableParty: 'governance-service', classification: 'service-monitored-rule' };
}

function classifyRuleFailure(boundary, ruleId, trigger = {}) {
  return classifyFailure(boundary, ruleId, trigger);
}

function enrichFrameworkImpactsWithResponsibility(frameworkImpacts, boundary) {
  return (frameworkImpacts || []).map((impact) => {
    const triggeredBy = (impact.triggeredBy || []).map((trigger) => {
      const classification = classifyFailure(boundary, trigger.ruleId, trigger);
      return {
        ...trigger,
        responsibility: {
          accountableParty: classification.accountableParty,
          classification: classification.classification,
          obligationId: classification.obligation?.obligationId || null,
          responsibilityType: classification.obligation?.responsibilityType || null,
          monitorability: classification.obligation?.monitorability || null
        }
      };
    });

    const map = (boundary?.frameworkResponsibilityMaps || []).find((m) =>
      m.certificationId === impact.certificationId && m.controlId === impact.controlId
    );

    return {
      ...impact,
      triggeredBy,
      responsibilityBoundary: map ? {
        serviceEnsures: map.serviceEnsures,
        clientResponsibleFor: map.clientResponsibleFor,
        sharedControls: map.sharedControls || []
      } : null
    };
  });
}

function enrichEscalationWithResponsibilityBoundary(escalation, requirement) {
  if (!escalation) return null;
  const boundary = buildServiceResponsibilityBoundary(requirement);
  if (!boundary) return escalation;

  return {
    ...escalation,
    serviceResponsibilityBoundary: boundary,
    frameworkImpacts: enrichFrameworkImpactsWithResponsibility(escalation.frameworkImpacts, boundary)
  };
}

module.exports = {
  loadBridge,
  loadRequirement,
  buildServiceResponsibilityBoundary,
  getRequirementResponsibilityBoundary,
  flattenObligations,
  classifyFailure,
  classifyRuleFailure,
  classifySharedFailure,
  evaluateContextSignals,
  enrichFrameworkImpactsWithResponsibility,
  enrichEscalationWithResponsibilityBoundary
};
