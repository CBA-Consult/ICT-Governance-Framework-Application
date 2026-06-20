'use strict';

function resolveTimeboundOnboarding(requirement) {
  const config = requirement?.deploymentExpectations?.timeboundOnboarding;
  if (!config?.enabled) return null;

  const windowDays = config.windowDays
    ?? requirement?.parameters?.onboardingGracePeriodDays
    ?? null;

  return {
    ...config,
    windowDays,
    accountStatesInWindow: config.accountStatesInWindow
      || requirement?.parameters?.excludeAccountStatesFromRisk
      || []
  };
}

function isAccountInOnboardingWindow(accountState, config) {
  if (!config?.enabled) return false;
  return (config.accountStatesInWindow || []).includes(accountState);
}

function assessOnboardingWindowStatus({ config, enrollmentBreakdown, accountCreatedAt, now = Date.now() }) {
  if (!config?.enabled) return null;

  const daysRemaining = enrollmentBreakdown?.onboardingDaysRemaining ?? null;
  const windowExpired = enrollmentBreakdown?.windowExpired === true
    || (daysRemaining != null && daysRemaining <= 0);

  let status = 'in-window';
  if (windowExpired && !enrollmentBreakdown?.mfaRegistered) {
    status = config.escalateWhenWindowExpiresWithoutMfa ? 'window-expired-non-compliant' : 'window-expired';
  } else if (enrollmentBreakdown?.mfaRegistered) {
    status = 'completed';
  }

  return {
    windowDays: config.windowDays,
    windowStartsAt: config.windowStartsAt,
    windowEndsAt: config.windowEndsAt,
    accessDuringWindow: config.accessDuringWindow,
    riskTreatment: config.riskTreatment,
    status,
    daysRemaining,
    windowExpired,
    summary: config.summary
  };
}

module.exports = {
  resolveTimeboundOnboarding,
  isAccountInOnboardingWindow,
  assessOnboardingWindowStatus
};
