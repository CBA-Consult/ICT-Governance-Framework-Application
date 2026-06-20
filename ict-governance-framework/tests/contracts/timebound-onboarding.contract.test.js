/**
 * @contract pillar:identity
 * Timebound onboarding window — user-account-created excluded from FAIR/ALE risk.
 */
const path = require('path');
const {
  resolveTimeboundOnboarding,
  isAccountInOnboardingWindow,
  assessOnboardingWindowStatus
} = require('../../services/timebound-onboarding-service');
const { assessComplianceEscalationExposure } = require('../../services/compliance-escalation-exposure-service');
const { getClientEscalation } = require('../../services/compliance-client-escalation-service');

const requirementFixture = require(path.join(
  __dirname,
  '../../../adpa/tenants/tenant-contoso-health/requirements/identity-mfa-requirement.json'
));

describe('Timebound onboarding contracts', () => {
  it('resolves timebound onboarding from requirement deploymentExpectations', () => {
    const config = resolveTimeboundOnboarding(requirementFixture);

    expect(config).not.toBeNull();
    expect(config.enabled).toBe(true);
    expect(config.windowDays).toBe(30);
    expect(config.windowStartsAt).toBe('account-created');
    expect(config.accessDuringWindow).toBe('blocked-until-mfa-registered');
    expect(config.accountStatesInWindow).toContain('user-account-created');
  });

  it('treats user-account-created as in onboarding window', () => {
    const config = resolveTimeboundOnboarding(requirementFixture);
    expect(isAccountInOnboardingWindow('user-account-created', config)).toBe(true);
    expect(isAccountInOnboardingWindow('active', config)).toBe(false);
  });

  it('assesses in-window status when active-eligible meets target', () => {
    const config = resolveTimeboundOnboarding(requirementFixture);
    const status = assessOnboardingWindowStatus({
      config,
      enrollmentBreakdown: {
        activeEligibleMeetsTarget: true,
        mfaRegistered: false,
        onboardingDaysRemaining: 12
      }
    });

    expect(status.status).toBe('in-window');
    expect(status.daysRemaining).toBe(12);
    expect(status.windowExpired).toBe(false);
  });

  it('escalates when window expires without MFA', () => {
    const config = resolveTimeboundOnboarding(requirementFixture);
    const status = assessOnboardingWindowStatus({
      config,
      enrollmentBreakdown: {
        mfaRegistered: false,
        onboardingDaysRemaining: 0,
        windowExpired: true
      }
    });

    expect(status.status).toBe('window-expired-non-compliant');
    expect(status.windowExpired).toBe(true);
  });

  it('includes timebound onboarding on framework exposure assessment', () => {
    const exposure = assessComplianceEscalationExposure({
      frameworkImpacts: [{
        triggeredBy: [{
          ruleId: 'identity-mfa-enrollment',
          enrollmentBreakdown: {
            activeEligibleMeetsTarget: true,
            failureDueToExcludedAccountsOnly: true,
            excludedAccountCount: 28
          }
        }]
      }]
    }, requirementFixture);

    expect(exposure.timeboundOnboarding).toMatchObject({
      enabled: true,
      windowDays: 30,
      windowStatus: 'in-window'
    });
  });

  it('enriches stored Contoso escalation with timebound onboarding', () => {
    const enriched = getClientEscalation('tenant-contoso-health', 'ces-1781953894979-8db7422d');
    if (!enriched) return;

    expect(enriched.timeboundOnboarding?.enabled).toBe(true);
    expect(enriched.timeboundOnboarding?.windowDays).toBe(30);
  });
});
