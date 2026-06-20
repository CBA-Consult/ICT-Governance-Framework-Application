/**
 * @contract pillar:identity
 * Service responsibility boundary — governance service ensures vs client-premises obligations per standard.
 */
const path = require('path');
const {
  buildServiceResponsibilityBoundary,
  getRequirementResponsibilityBoundary,
  classifyRuleFailure,
  classifyFailure,
  evaluateContextSignals,
  enrichEscalationWithResponsibilityBoundary
} = require('../../services/service-responsibility-boundary-service');
const {
  buildComplianceNotificationEnvelope
} = require('../../services/compliance-notification-service');
const { createClientEscalation } = require('../../services/compliance-client-escalation-service');

const requirementFixture = require(path.join(
  __dirname,
  '../../../adpa/tenants/tenant-contoso-health/requirements/identity-mfa-requirement.json'
));

describe('Service responsibility boundary contracts', () => {
  const tenantId = 'tenant-contoso-health';

  it('defines distinct service and client-premises obligations for MFA requirement', () => {
    const boundary = buildServiceResponsibilityBoundary(requirementFixture);

    expect(boundary.serviceObligations.some((o) => o.obligationId === 'svc-mfa-approval-enforcement')).toBe(true);
    expect(boundary.clientPremisesObligations.some((o) => o.obligationId === 'client-no-password-sharing')).toBe(true);
    expect(boundary.clientPremisesObligations.some((o) => o.obligationId === 'client-new-user-onboarding-mfa')).toBe(true);
    expect(boundary.serviceObligations.some((o) => o.obligationId === 'svc-mfa-login-registration-gate')).toBe(true);
    expect(boundary.clientPremisesObligations.every((o) => o.monitoredBySystem === false)).toBe(true);
  });

  it('maps ISO-27001 and NIST controls to service vs client responsibility', () => {
    const { boundary } = getRequirementResponsibilityBoundary(tenantId, 'identity-mfa-requirement');
    const iso = boundary.frameworkResponsibilityMaps.find((m) => m.certificationId === 'ISO-27001');
    const nist = boundary.frameworkResponsibilityMaps.find((m) => m.certificationId === 'NIST-CSF-2.0');

    expect(iso.serviceEnsures).toContain('svc-mfa-approval-enforcement');
    expect(iso.clientResponsibleFor).toContain('client-no-password-sharing');
    expect(nist.clientResponsibleFor).toContain('client-delegation-on-behalf');
  });

  it('classifies monitored rule failure as governance-service accountability', () => {
    const boundary = buildServiceResponsibilityBoundary(requirementFixture);
    const classification = classifyRuleFailure(boundary, 'identity-mfa-enrollment');

    expect(classification.accountableParty).toBe('governance-service');
    expect(classification.obligation.obligationId).toBe('svc-mfa-approval-enforcement');
  });

  it('enriches escalation framework impacts with per-rule responsibility', () => {
    const evaluation = {
      meetsExpectations: false,
      gaps: [{
        type: 'control',
        ruleId: 'identity-mfa-enrollment',
        controlId: 'identity-mfa-enforcement',
        expectedState: '100% of users enrolled in MFA',
        observed: '72% enrolled'
      }]
    };
    const notification = buildComplianceNotificationEnvelope({
      tenantId,
      requirement: requirementFixture,
      evaluation,
      assetId: '/subscriptions/sub-contoso/policyAssignments/identity-mfa-enforcement',
      validationId: 'val-boundary-test',
      requirementId: 'identity-mfa-requirement'
    });
    const escalation = createClientEscalation({
      complianceNotification: notification,
      requirement: requirementFixture,
      evaluation
    });
    const enriched = enrichEscalationWithResponsibilityBoundary(escalation, requirementFixture);

    expect(enriched.serviceResponsibilityBoundary).toBeDefined();
    const trigger = enriched.frameworkImpacts[0].triggeredBy[0];
    expect(trigger.responsibility.accountableParty).toBe('governance-service');
    expect(enriched.frameworkImpacts[0].responsibilityBoundary.clientResponsibleFor).toContain('client-no-password-sharing');
  });

  it('supports shared responsibility obligations with monitorability on boundary API shape', () => {
    const response = getRequirementResponsibilityBoundary(tenantId, 'identity-mfa-requirement');

    expect(response.obligations).toBeDefined();
    const shared = response.obligations.find((o) => o.responsibilityType === 'shared');

    expect(shared).toBeDefined();
    expect(shared.obligationId).toBe('ca-policy-control');
    expect(shared.sharedResponsibilityModel).toBeDefined();
    expect(shared.sharedResponsibilityModel.failureAttributionLogic).toBe('context-based');
    expect(shared.monitorability.type).toBe('inferred');
    expect(shared.monitorability.confidenceLevel).toBe('medium');
  });

  it('attributes shared CA failure to client when break-glass exclusion is misconfigured', () => {
    const boundary = buildServiceResponsibilityBoundary(requirementFixture);
    const classification = classifyFailure(boundary, 'identity-compliant-device', {
      ruleId: 'identity-compliant-device',
      contextSignals: { breakGlassExclusionMisconfigured: true }
    });

    expect(classification.accountableParty).toBe('client');
    expect(classification.classification).toBe('shared-context-client');
    expect(classification.obligation.obligationId).toBe('ca-policy-control');
  });

  it('attributes shared CA failure to service when CA policy is not deployed', () => {
    const boundary = buildServiceResponsibilityBoundary(requirementFixture);
    const classification = evaluateContextSignals(
      boundary.sharedObligations[0],
      { contextSignals: { caPolicyNotDeployed: true } }
    );

    expect(classification.accountableParty).toBe('governance-service');
    expect(classification.classification).toBe('shared-context-service');
  });

  it('classifies service MFA enrollment as deterministic high monitorability', () => {
    const { obligations } = getRequirementResponsibilityBoundary(tenantId, 'identity-mfa-requirement');
    const enrollment = obligations.find((o) => o.obligationId === 'svc-mfa-approval-enforcement');

    expect(enrollment.responsibilityType).toBe('service');
    expect(enrollment.monitorability).toEqual({ type: 'deterministic', confidenceLevel: 'high' });
  });

  it('classifies password sharing as non-monitorable client obligation', () => {
    const { obligations } = getRequirementResponsibilityBoundary(tenantId, 'identity-mfa-requirement');
    const passwordSharing = obligations.find((o) => o.obligationId === 'client-no-password-sharing');

    expect(passwordSharing.responsibilityType).toBe('client');
    expect(passwordSharing.monitorability.type).toBe('non-monitorable');
  });
});
