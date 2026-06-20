/**
 * @contract pillar:secops
 * Obligation SLA binding — control-level SLAs hydrated from bridge, assessed per escalation.
 */
const path = require('path');
const {
  hydrateSlaBinding,
  assessObligationSlaStatus,
  enrichEscalationWithObligationSlas,
  resolveObligationSlaDefinition
} = require('../../services/obligation-sla-binding-service');
const { getRequirementResponsibilityBoundary } = require('../../services/service-responsibility-boundary-service');
const { getClientEscalation } = require('../../services/compliance-client-escalation-service');

const requirementFixture = require(path.join(
  __dirname,
  '../../../adpa/tenants/tenant-contoso-health/requirements/identity-mfa-requirement.json'
));

describe('Obligation SLA binding contracts', () => {
  const tenantId = 'tenant-contoso-health';

  it('hydrates SLA definition from bridge without duplicating on requirement', () => {
    const enrollmentObl = requirementFixture.deploymentExpectations.serviceResponsibilityBoundary
      .serviceObligations.find((o) => o.obligationId === 'svc-mfa-approval-enforcement');

    const hydrated = hydrateSlaBinding(enrollmentObl);

    expect(hydrated.slaBinding.slaId).toBe('identity-mfa-enrollment-sla');
    expect(hydrated.slaDefinition.contractClauseRef).toBe('SLA-4.2');
    expect(hydrated.slaDefinition.enforcedByRules).toContain('identity-mfa-enrollment');
    expect(hydrated.slaDefinition.targets.threshold).toBe('100%');
  });

  it('does not breach enrollment SLA when active-eligible users meet target', () => {
    const enrollmentObl = requirementFixture.deploymentExpectations.serviceResponsibilityBoundary
      .serviceObligations.find((o) => o.obligationId === 'svc-mfa-approval-enforcement');

    const status = assessObligationSlaStatus(
      enrollmentObl,
      { issuedAt: '2026-06-20T12:00:00Z' },
      [{
        ruleId: 'identity-mfa-enrollment',
        enrollmentBreakdown: {
          activeEligibleMeetsTarget: true,
          activeEligibleEnrolledPercent: 100,
          aggregateEnrolledPercent: 72
        }
      }]
    );

    expect(status.applicable).toBe(true);
    expect(status.breached).toBe(false);
    expect(status.slaId).toBe('identity-mfa-enrollment-sla');
  });

  it('breaches enrollment SLA when active-eligible users fall below threshold', () => {
    const enrollmentObl = requirementFixture.deploymentExpectations.serviceResponsibilityBoundary
      .serviceObligations.find((o) => o.obligationId === 'svc-mfa-approval-enforcement');

    const status = assessObligationSlaStatus(
      enrollmentObl,
      { issuedAt: '2026-06-20T12:00:00Z' },
      [{
        ruleId: 'identity-mfa-enrollment',
        observed: '85% active-eligible enrolled',
        enrollmentBreakdown: {
          activeEligibleMeetsTarget: false,
          activeEligibleEnrolledPercent: 85
        }
      }]
    );

    expect(status.breached).toBe(true);
    expect(status.breachSince).toBe('2026-06-20T12:00:00Z');
    expect(status.contractClauseRef).toBe('SLA-4.2');
  });

  it('exposes hydrated SLA bindings on responsibility boundary API shape', () => {
    const response = getRequirementResponsibilityBoundary(tenantId, 'identity-mfa-requirement');
    const enrollment = response.obligations.find((o) => o.obligationId === 'svc-mfa-approval-enforcement');

    expect(enrollment.slaBinding.title).toBe('MFA enrollment — 100% active-eligible within 30 days');
    expect(enrollment.slaDefinition).toBeDefined();
  });

  it('enriches Contoso escalation with obligation SLA statuses on failed rules', () => {
    const enriched = getClientEscalation(tenantId, 'ces-1781953894979-8db7422d');
    if (!enriched) return;

    const enrollmentSla = (enriched.obligationSlaStatuses || []).find(
      (s) => s.slaId === 'identity-mfa-enrollment-sla'
    );

    expect(enrollmentSla).toBeDefined();
    expect(enrollmentSla.breached).toBe(false);
    expect(enriched.controlSlaBreached).toBe(false);

    const trigger = enriched.frameworkImpacts[0].triggeredBy[0];
    expect(trigger.obligationSlaStatuses).toBeDefined();
    expect(trigger.slaBreached).toBe(false);
  });

  it('resolves all Contoso MFA control SLAs from bridge store', () => {
    expect(resolveObligationSlaDefinition('identity-mfa-enrollment-sla')).toBeTruthy();
    expect(resolveObligationSlaDefinition('identity-mfa-login-gate-sla')).toBeTruthy();
    expect(resolveObligationSlaDefinition('identity-ca-policy-sla')).toBeTruthy();
  });
});
