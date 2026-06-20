/**
 * @contract pillar:secops
 * Compliance notification envelope — explicit framework control detail required for client alerts.
 */
const path = require('path');
const {
  buildComplianceNotificationEnvelope,
  validateComplianceNotification,
  formatClientNotificationDescription,
  resolveFrameworkImpacts
} = require('../../services/compliance-notification-service');

const requirementFixture = require(path.join(
  __dirname,
  '../../../adpa/tenants/tenant-contoso-health/requirements/identity-mfa-requirement.json'
));

describe('Compliance notification contracts', () => {
  const evaluation = {
    meetsExpectations: false,
    gaps: [{
      type: 'control',
      ruleId: 'identity-mfa-enrollment',
      controlId: 'identity-mfa-enforcement',
      expectedState: '100% of users enrolled in MFA',
      observed: '72% enrolled',
      mapsToAcceptanceCriteria: 0
    }],
    expectationSummary: {
      vendorDeliverableProfile: requirementFixture.deploymentExpectations.vendorDeliverableProfile
    }
  };

  it('resolves explicit ISO-27001 control impact for a failed monitoring rule', () => {
    const impacts = resolveFrameworkImpacts({
      requirement: requirementFixture,
      evaluation,
      monitoringRules: requirementFixture.deploymentExpectations.monitoringRules,
      assetId: '/subscriptions/sub-contoso/policyAssignments/identity-mfa-enforcement'
    });

    const isoImpact = impacts.find((i) => i.certificationId === 'ISO-27001');
    expect(isoImpact).toBeTruthy();
    expect(isoImpact.controlId).toBe('A.9.2.1');
    expect(isoImpact.controlName).toContain('registration');
    expect(isoImpact.triggeredBy[0].ruleId).toBe('identity-mfa-enrollment');
    expect(isoImpact.triggeredBy[0].observed).toBe('72% enrolled');
  });

  it('builds a notification envelope with frameworkImpacts and mitigation plan', () => {
    const envelope = buildComplianceNotificationEnvelope({
      tenantId: 'tenant-contoso-health',
      requirement: requirementFixture,
      evaluation,
      assetId: '/subscriptions/sub-contoso/policyAssignments/identity-mfa-enforcement',
      validationId: 'val-identity-mfa-demo',
      requirementId: 'identity-mfa-requirement',
      remediationTemplateId: 'identity-access-control'
    });

    expect(envelope.notificationClass).toBe('compliance-non-conformance');
    expect(envelope.frameworkImpacts.length).toBeGreaterThanOrEqual(1);
    expect(envelope.mitigationPlan.remediationTemplateId).toBe('identity-access-control');
    expect(() => validateComplianceNotification(envelope)).not.toThrow();
  });

  it('formats client description with explicit ISO-27001 control lines', () => {
    const envelope = buildComplianceNotificationEnvelope({
      tenantId: 'tenant-contoso-health',
      requirement: requirementFixture,
      evaluation,
      assetId: '/subscriptions/sub-contoso/policyAssignments/identity-mfa-enforcement',
      validationId: 'val-identity-mfa-demo',
      requirementId: 'identity-mfa-requirement'
    });

    const text = formatClientNotificationDescription(envelope, 'Validation failed.');
    expect(text).toContain('ISO/IEC 27001');
    expect(text).toContain('A.9.2.1');
    expect(text).toContain('identity-mfa-enrollment');
    expect(text).not.toMatch(/ISO.?27001 is not compliant$/i);
  });

  it('rejects notifications without frameworkImpacts', () => {
    expect(() => validateComplianceNotification({
      notificationClass: 'compliance-non-conformance',
      tenantId: 'tenant-contoso-health',
      frameworkImpacts: []
    })).toThrow(/explicit framework control impacts/i);
  });
});
