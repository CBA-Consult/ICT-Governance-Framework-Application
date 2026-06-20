/**
 * @contract pillar:secops
 * Framework exposure null when login gate blocks access for non-enrolled users.
 */
const path = require('path');
const {
  buildComplianceNotificationEnvelope
} = require('../../services/compliance-notification-service');
const { createClientEscalation } = require('../../services/compliance-client-escalation-service');
const { assessComplianceEscalationExposure } = require('../../services/compliance-escalation-exposure-service');
const { getClientEscalation } = require('../../services/compliance-client-escalation-service');

const requirementFixture = require(path.join(
  __dirname,
  '../../../adpa/tenants/tenant-contoso-health/requirements/identity-mfa-requirement.json'
));

describe('Compliance escalation framework exposure contracts', () => {
  const tenantId = 'tenant-contoso-health';

  const evaluation = {
    meetsExpectations: false,
    gaps: [{
      type: 'control',
      ruleId: 'identity-mfa-enrollment',
      controlId: 'identity-mfa-enforcement',
      expectedState: '100% of users enrolled in MFA',
      observed: '72% enrolled',
      mapsToAcceptanceCriteria: 0
    }]
  };

  it('excludes user-account-created states from risk when active-eligible users meet MFA target', () => {
    const exposure = assessComplianceEscalationExposure({
      frameworkImpacts: [{
        triggeredBy: [{
          ruleId: 'identity-mfa-enrollment',
          expected: '100% active-eligible enrolled',
          observed: '72% aggregate (28% user-account-created excluded)',
          enrollmentBreakdown: {
            aggregateEnrolledPercent: 72,
            activeEligibleEnrolledPercent: 100,
            activeEligibleMeetsTarget: true,
            failureDueToExcludedAccountsOnly: true,
            excludedAccountCount: 28,
            excludedAccountStates: ['user-account-created', 'pending-onboarding']
          }
        }]
      }]
    }, requirementFixture);

    expect(exposure.exposureUsd).toBeNull();
    expect(exposure.exposureStatus).toBe('excluded-onboarding-accounts');
    expect(exposure.enrollmentDenominator).toBe('active-eligible-users');
    expect(exposure.excludedAccountStates).toContain('user-account-created');
    expect(exposure.timeboundOnboarding?.windowDays).toBe(30);
  });

  it('keeps exposure null when enrollment fails but login registration gate remains enforced', () => {
    const exposure = assessComplianceEscalationExposure({
      frameworkImpacts: [{
        triggeredBy: [{ ruleId: 'identity-mfa-enrollment', expected: '100%', observed: '72%' }]
      }]
    }, requirementFixture);

    expect(exposure.exposureUsd).toBeNull();
    expect(exposure.exposureStatus).toBe('contained-at-access-gate');
    expect(exposure.accessGrantedToNonCompliantUsers).toBe(false);
    expect(exposure.containedByRuleIds).toContain('identity-mfa-login-registration-gate');
  });

  it('requires FAIR assessment when login gate itself fails', () => {
    const exposure = assessComplianceEscalationExposure({
      frameworkImpacts: [{
        triggeredBy: [{ ruleId: 'identity-mfa-login-registration-gate' }]
      }]
    }, requirementFixture);

    expect(exposure.exposureUsd).toBeNull();
    expect(exposure.exposureStatus).toBe('requires-fair-assessment');
    expect(exposure.accessGrantedToNonCompliantUsers).toBe(true);
  });

  it('enriches client escalation with framework exposure on read', () => {
    const notification = buildComplianceNotificationEnvelope({
      tenantId,
      requirement: requirementFixture,
      evaluation,
      assetId: '/subscriptions/sub-contoso/policyAssignments/identity-mfa-enforcement',
      validationId: 'val-exposure-test',
      requirementId: 'identity-mfa-requirement'
    });
    const created = createClientEscalation({
      complianceNotification: notification,
      requirement: requirementFixture,
      evaluation
    });
    const enriched = getClientEscalation(tenantId, created.escalationId);

    expect(enriched.frameworkExposure.exposureUsd).toBeNull();
    expect(enriched.frameworkExposure.exposureStatus).toBe('contained-at-access-gate');
  });
});
