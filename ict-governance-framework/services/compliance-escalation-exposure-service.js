'use strict';

const { loadBridge, buildServiceResponsibilityBoundary } = require('./service-responsibility-boundary-service');
const {
  resolveTimeboundOnboarding,
  assessOnboardingWindowStatus
} = require('./timebound-onboarding-service');

const LOGIN_GATE_RULE = 'identity-mfa-login-registration-gate';
const LOGIN_GATE_OBLIGATION = 'svc-mfa-login-registration-gate';
const ENROLLMENT_RULE = 'identity-mfa-enrollment';

function collectFailedRuleIds(escalation) {
  const ids = new Set();
  (escalation?.frameworkImpacts || []).forEach((impact) => {
    (impact.triggeredBy || []).forEach((trigger) => {
      if (trigger.ruleId) ids.add(trigger.ruleId);
    });
  });
  return [...ids];
}

function collectEnrollmentTriggers(escalation) {
  const triggers = [];
  (escalation?.frameworkImpacts || []).forEach((impact) => {
    (impact.triggeredBy || []).forEach((trigger) => {
      if (trigger.ruleId === ENROLLMENT_RULE) triggers.push(trigger);
    });
  });
  return triggers;
}

function getEnrollmentRule(requirement) {
  return (requirement?.deploymentExpectations?.monitoringRules || [])
    .find((rule) => rule.ruleId === ENROLLMENT_RULE) || null;
}

function loginGateConfigured(requirement, boundary) {
  const rulePresent = (requirement?.deploymentExpectations?.monitoringRules || [])
    .some((rule) => rule.ruleId === LOGIN_GATE_RULE);
  const obligationPresent = (boundary?.serviceObligations || [])
    .some((obl) => obl.obligationId === LOGIN_GATE_OBLIGATION);
  return rulePresent || obligationPresent;
}

function resolveEnrollmentRiskScope(requirement, enrollmentTriggers) {
  const rule = getEnrollmentRule(requirement);
  const excludedAccountStates = rule?.excludeAccountStatesFromRisk
    || requirement?.parameters?.excludeAccountStatesFromRisk
    || [];
  const enrollmentDenominator = rule?.enrollmentDenominator
    || requirement?.parameters?.enrollmentDenominator
    || 'all-users';
  const onboardingGracePeriodDays = rule?.onboardingGracePeriodDays
    ?? requirement?.deploymentExpectations?.timeboundOnboarding?.windowDays
    ?? requirement?.parameters?.onboardingGracePeriodDays
    ?? null;

  const breakdown = enrollmentTriggers.find((t) => t.enrollmentBreakdown)?.enrollmentBreakdown || null;
  const activeEligibleMeetsTarget = breakdown?.activeEligibleMeetsTarget === true;
  const failureDueToExcludedAccountsOnly = breakdown?.failureDueToExcludedAccountsOnly === true
    || (breakdown?.excludedAccountCount > 0 && activeEligibleMeetsTarget);

  return {
    enrollmentDenominator,
    onboardingGracePeriodDays,
    excludedAccountStates,
    activeEligibleMeetsTarget,
    failureDueToExcludedAccountsOnly,
    breakdown
  };
}

function assessComplianceEscalationExposure(escalation, requirement) {
  const bridge = loadBridge();
  const policy = bridge.frameworkExposurePolicy || {
    reportingBoundary: 'fair-ale-tco-only',
    nullExposureWhenAccessGateContainsRisk: true
  };

  const failedRuleIds = collectFailedRuleIds(escalation);
  const enrollmentTriggers = collectEnrollmentTriggers(escalation);
  const boundary = requirement ? buildServiceResponsibilityBoundary(requirement) : null;
  const loginGateFailed = failedRuleIds.includes(LOGIN_GATE_RULE);
  const gateConfigured = loginGateConfigured(requirement, boundary);
  const enrollmentScope = resolveEnrollmentRiskScope(requirement, enrollmentTriggers);
  const enrollmentFailed = failedRuleIds.includes(ENROLLMENT_RULE);
  const timeboundOnboarding = resolveTimeboundOnboarding(requirement);
  const windowStatus = timeboundOnboarding
    ? assessOnboardingWindowStatus({
      config: timeboundOnboarding,
      enrollmentBreakdown: enrollmentScope.breakdown
    })
    : null;

  const base = {
    reportingBoundary: policy.reportingBoundary || 'fair-ale-tco-only',
    exposureUsd: null,
    failedRuleIds,
    enrollmentDenominator: enrollmentScope.enrollmentDenominator,
    excludedAccountStates: enrollmentScope.excludedAccountStates,
    onboardingGracePeriodDays: enrollmentScope.onboardingGracePeriodDays,
    timeboundOnboarding: timeboundOnboarding ? {
      enabled: timeboundOnboarding.enabled,
      windowDays: timeboundOnboarding.windowDays,
      windowStartsAt: timeboundOnboarding.windowStartsAt,
      accessDuringWindow: timeboundOnboarding.accessDuringWindow,
      riskTreatment: timeboundOnboarding.riskTreatment,
      windowStatus: windowStatus?.status || null
    } : null,
    enrollmentBreakdown: enrollmentScope.breakdown,
    computedAt: new Date().toISOString()
  };

  if (
    enrollmentFailed
    && enrollmentScope.enrollmentDenominator === 'active-eligible-users'
    && enrollmentScope.excludedAccountStates.length > 0
    && (enrollmentScope.failureDueToExcludedAccountsOnly || enrollmentScope.activeEligibleMeetsTarget)
    && !loginGateFailed
  ) {
    return {
      ...base,
      exposureStatus: 'excluded-onboarding-accounts',
      accessGrantedToNonCompliantUsers: false,
      rationale: timeboundOnboarding?.summary
        || 'Raw enrollment metrics may include user-account-created states. Active-eligible users (accounts that should be active) meet the MFA target within the timebound onboarding window — excluded onboarding accounts are not used as FAIR/ALE risk and cannot sign in until MFA registration completes.',
      containedByRuleIds: [LOGIN_GATE_RULE, ENROLLMENT_RULE],
      containedByObligationIds: [LOGIN_GATE_OBLIGATION, 'svc-mfa-approval-enforcement']
    };
  }

  if (
    policy.nullExposureWhenAccessGateContainsRisk !== false
    && gateConfigured
    && !loginGateFailed
    && failedRuleIds.length > 0
  ) {
    return {
      ...base,
      exposureStatus: policy.accessGateContainedStatus || 'contained-at-access-gate',
      accessGrantedToNonCompliantUsers: false,
      rationale: enrollmentScope.excludedAccountStates.length
        ? 'Compliance metrics may fail on aggregate enrollment, but user-account-created accounts should not be active, are excluded from the risk denominator, and cannot sign in without MFA registration — downstream FAIR/ALE exposure does not accrue.'
        : 'Compliance metrics may fail (e.g. partial MFA enrollment), but users without MFA device registration cannot sign in. No system access is granted while the login registration gate remains enforced — downstream FAIR/ALE exposure does not accrue.',
      containedByRuleIds: [LOGIN_GATE_RULE],
      containedByObligationIds: [LOGIN_GATE_OBLIGATION]
    };
  }

  if (loginGateFailed) {
    return {
      ...base,
      exposureStatus: 'requires-fair-assessment',
      accessGrantedToNonCompliantUsers: true,
      rationale: 'Login registration gate failed — users may obtain system access without MFA registration. FAIR/ALE exposure assessment is required within the governance framework boundary.'
    };
  }

  return {
    ...base,
    exposureStatus: 'pending-fair-assessment',
    accessGrantedToNonCompliantUsers: null,
    rationale: 'Exposure not yet quantified within the governance framework FAIR/ALE boundary.'
  };
}

module.exports = {
  LOGIN_GATE_RULE,
  LOGIN_GATE_OBLIGATION,
  ENROLLMENT_RULE,
  collectFailedRuleIds,
  getEnrollmentRule,
  resolveEnrollmentRiskScope,
  assessComplianceEscalationExposure
};
