'use strict';

const fs = require('fs');
const path = require('path');

const BRIDGE_PATH = path.join(__dirname, '..', '..', 'adpa/coe/compliance-lineage-bridge.json');

function loadBridge() {
  return JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf8'));
}

function getObligationControlSlas() {
  const bridge = loadBridge();
  return bridge.obligationControlSlas || {};
}

function resolveObligationSlaDefinition(slaId) {
  if (!slaId) return null;
  const slas = getObligationControlSlas();
  return slas[slaId] || null;
}

function hydrateSlaBinding(obligation) {
  if (!obligation?.slaBinding?.slaId) {
    return obligation.slaBinding ? { ...obligation, slaDefinition: null } : obligation;
  }

  const slaDefinition = resolveObligationSlaDefinition(obligation.slaBinding.slaId);
  return {
    ...obligation,
    slaBinding: {
      ...obligation.slaBinding,
      slaId: obligation.slaBinding.slaId,
      ...(slaDefinition ? {
        title: slaDefinition.title,
        enforcedByRules: slaDefinition.enforcedByRules,
        targets: slaDefinition.targets,
        contractClauseRef: slaDefinition.contractClauseRef,
        enrollmentDenominator: slaDefinition.enrollmentDenominator || null
      } : {})
    },
    slaDefinition
  };
}

function collectFailedTriggers(escalation) {
  const triggers = [];
  (escalation?.frameworkImpacts || []).forEach((impact) => {
    (impact.triggeredBy || []).forEach((trigger) => {
      if (trigger.ruleId) triggers.push(trigger);
    });
  });
  return triggers;
}

function assessControlMetricBreach(trigger, slaDefinition) {
  const breakdown = trigger.enrollmentBreakdown;
  const denominator = slaDefinition.enrollmentDenominator || 'all-users';

  if (breakdown && denominator === 'active-eligible-users') {
    if (breakdown.activeEligibleMeetsTarget === true) {
      return {
        breached: false,
        rationale: 'Active-eligible users meet SLA threshold — aggregate shortfall due to excluded onboarding accounts.'
      };
    }
    if (breakdown.activeEligibleEnrolledPercent != null) {
      return {
        breached: true,
        rationale: `Active-eligible enrollment ${breakdown.activeEligibleEnrolledPercent}% below SLA threshold ${slaDefinition.targets?.threshold || '100%'}.`
      };
    }
  }

  return {
    breached: true,
    rationale: trigger.observed
      ? `Control observed state "${trigger.observed}" breaches SLA target ${slaDefinition.targets?.threshold || '100%'}.`
      : 'Failed monitoring rule breaches SLA control target.'
  };
}

function assessObligationSlaStatus(obligation, escalation, failedTriggers = []) {
  const hydrated = hydrateSlaBinding(obligation);
  const slaId = hydrated.slaBinding?.slaId;
  const slaDefinition = hydrated.slaDefinition;

  if (!slaId || !slaDefinition) {
    return null;
  }

  const relevantTriggers = failedTriggers.filter((t) =>
    (slaDefinition.enforcedByRules || []).includes(t.ruleId)
  );

  if (relevantTriggers.length === 0) {
    return {
      slaId,
      obligationId: obligation.obligationId,
      contractClauseRef: slaDefinition.contractClauseRef || null,
      applicable: false,
      breached: false,
      targets: slaDefinition.targets,
      rationale: 'No failed rules linked to this obligation SLA on this escalation.'
    };
  }

  const metric = assessControlMetricBreach(relevantTriggers[0], slaDefinition);

  return {
    slaId,
    obligationId: obligation.obligationId,
    contractClauseRef: slaDefinition.contractClauseRef || null,
    applicable: true,
    breached: metric.breached,
    breachSince: metric.breached ? (escalation?.issuedAt || new Date().toISOString()) : null,
    enforcedByRules: slaDefinition.enforcedByRules,
    targets: slaDefinition.targets,
    remediationTimeLabel: slaDefinition.targets?.remediationTimeLabel || null,
    rationale: metric.rationale,
    linkedRuleIds: relevantTriggers.map((t) => t.ruleId)
  };
}

function enrichObligationsWithSla(obligations, escalation = null) {
  const failedTriggers = escalation ? collectFailedTriggers(escalation) : [];

  return (obligations || []).map((obl) => {
    const hydrated = hydrateSlaBinding(obl);
    const slaStatus = escalation
      ? assessObligationSlaStatus(obl, escalation, failedTriggers)
      : null;

    return {
      ...hydrated,
      ...(slaStatus ? { slaStatus } : {})
    };
  });
}

function enrichBoundaryWithObligationSlas(boundary, escalation = null) {
  if (!boundary) return null;

  const obligations = enrichObligationsWithSla(boundary.obligations, escalation);
  const obligationSlaStatuses = obligations
    .map((o) => o.slaStatus)
    .filter(Boolean);

  return {
    ...boundary,
    obligations,
    serviceObligations: enrichObligationsWithSla(boundary.serviceObligations, escalation),
    sharedObligations: enrichObligationsWithSla(boundary.sharedObligations, escalation),
    clientPremisesObligations: enrichObligationsWithSla(boundary.clientPremisesObligations, escalation),
    obligationSlaStatuses
  };
}

function enrichFrameworkImpactsWithObligationSlas(frameworkImpacts, boundary, escalation) {
  const failedTriggers = collectFailedTriggers(escalation);
  const obligations = boundary?.obligations || [];

  return (frameworkImpacts || []).map((impact) => ({
    ...impact,
    triggeredBy: (impact.triggeredBy || []).map((trigger) => {
      const matchingObligations = obligations.filter((o) =>
        o.slaBinding?.slaId
        && (o.slaDefinition?.enforcedByRules || []).includes(trigger.ruleId)
      );

      const slaStatuses = matchingObligations
        .map((o) => assessObligationSlaStatus(o, escalation, failedTriggers))
        .filter(Boolean);

      return {
        ...trigger,
        obligationSlaStatuses: slaStatuses,
        slaBreached: slaStatuses.some((s) => s.applicable && s.breached)
      };
    })
  }));
}

function enrichEscalationWithObligationSlas(escalation, requirement) {
  if (!escalation) return null;

  const boundary = escalation.serviceResponsibilityBoundary
    || (requirement
      ? require('./service-responsibility-boundary-service').buildServiceResponsibilityBoundary(requirement)
      : null);
  if (!boundary) return escalation;

  const enrichedBoundary = enrichBoundaryWithObligationSlas(boundary, escalation);
  if (!enrichedBoundary) return escalation;
  const breachedSlas = (enrichedBoundary.obligationSlaStatuses || []).filter((s) => s.applicable && s.breached);

  const existingImpacts = escalation.frameworkImpacts || [];
  const slaEnrichedImpacts = enrichFrameworkImpactsWithObligationSlas(
    existingImpacts,
    enrichedBoundary,
    escalation
  );

  const frameworkImpacts = existingImpacts.map((impact, idx) => ({
    ...impact,
    triggeredBy: (impact.triggeredBy || []).map((trigger, tIdx) => ({
      ...trigger,
      ...(slaEnrichedImpacts[idx]?.triggeredBy?.[tIdx] || {})
    }))
  }));

  return {
    ...escalation,
    serviceResponsibilityBoundary: enrichedBoundary,
    obligationSlaStatuses: enrichedBoundary.obligationSlaStatuses,
    controlSlaBreached: breachedSlas.length > 0,
    contractClauseRefs: [...new Set(breachedSlas.map((s) => s.contractClauseRef).filter(Boolean))],
    frameworkImpacts
  };
}

module.exports = {
  loadBridge,
  getObligationControlSlas,
  resolveObligationSlaDefinition,
  hydrateSlaBinding,
  assessObligationSlaStatus,
  enrichObligationsWithSla,
  enrichBoundaryWithObligationSlas,
  enrichEscalationWithObligationSlas,
  collectFailedTriggers
};
