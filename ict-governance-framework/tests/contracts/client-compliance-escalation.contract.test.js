/**
 * @contract pillar:secops
 * Client infrastructure compliance escalations — structured control detail + mitigation actions.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  buildComplianceNotificationEnvelope
} = require('../../services/compliance-notification-service');
const {
  createClientEscalation,
  listClientEscalations,
  getClientEscalation,
  acknowledgeClientEscalation,
  resolveClientEscalation,
  recordClientCheckValidation,
  recordDownstreamLiabilityEscalation,
  recordLiabilityRouting
} = require('../../services/compliance-client-escalation-service');

const requirementFixture = require(path.join(
  __dirname,
  '../../../adpa/tenants/tenant-contoso-health/requirements/identity-mfa-requirement.json'
));

describe('Client compliance escalation contracts', () => {
  const tenantId = 'tenant-contract-escalation-test';
  let testDir;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ces-test-'));
    jest.spyOn(require('../../services/compliance-client-escalation-service'), 'escalationsDir')
      .mockReturnValue(testDir);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(testDir, { recursive: true, force: true });
  });

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

  it('creates client escalation with explicit ISO-27001 control and mitigation actions', () => {
    const notification = buildComplianceNotificationEnvelope({
      tenantId,
      requirement: requirementFixture,
      evaluation,
      assetId: '/subscriptions/sub-contoso/policyAssignments/identity-mfa-enforcement',
      validationId: 'val-test',
      requirementId: 'identity-mfa-requirement',
      remediationTemplateId: 'identity-access-control'
    });

    const escalation = createClientEscalation({
      complianceNotification: notification,
      requirement: requirementFixture,
      evaluation,
      remediationTemplateId: 'identity-access-control'
    });

    expect(escalation.escalationClass).toBe('client-infrastructure-compliance');
    expect(escalation.frameworkImpacts.some((i) => i.certificationId === 'ISO-27001')).toBe(true);
    expect(escalation.mitigationPlan.clientActions.length).toBeGreaterThanOrEqual(1);
    expect(escalation.mitigationPlan.clientActions[0].linkedRuleId).toBe('identity-mfa-enrollment');
    expect(escalation.summary).toContain('A.9.2.1');
  });

  it('lists and resolves client escalations without SecOps incident dependency', () => {
    const notification = buildComplianceNotificationEnvelope({
      tenantId,
      requirement: requirementFixture,
      evaluation,
      assetId: '/subscriptions/sub-contoso/policyAssignments/identity-mfa-enforcement',
      validationId: 'val-test-2',
      requirementId: 'identity-mfa-requirement'
    });

    const created = createClientEscalation({
      complianceNotification: notification,
      requirement: requirementFixture,
      evaluation
    });

    const listed = listClientEscalations(tenantId);
    expect(listed.some((e) => e.escalationId === created.escalationId)).toBe(true);

    const fetched = getClientEscalation(tenantId, created.escalationId);
    expect(fetched.status).toBe('Open');

    const acked = acknowledgeClientEscalation(tenantId, created.escalationId, {
      decidedBy: 'client-admin@contoso.com',
      notes: 'Mitigation started internally.'
    });
    expect(acked.status).toBe('Acknowledged');

    const resolved = resolveClientEscalation(tenantId, created.escalationId, {
      decision: 'remediate',
      decidedBy: 'client-admin@contoso.com',
      notes: 'MFA enrollment restored to 100%.'
    });
    expect(resolved.status).toBe('Resolved');
    expect(resolved.clientDisposition.decision).toBe('remediate');
  });

  it('records client check validation that prevents downstream escalation', () => {
    const notification = buildComplianceNotificationEnvelope({
      tenantId,
      requirement: requirementFixture,
      evaluation,
      assetId: '/subscriptions/sub-contoso/policyAssignments/identity-mfa-enforcement',
      validationId: 'val-check-validation',
      requirementId: 'identity-mfa-requirement'
    });

    const created = createClientEscalation({
      complianceNotification: notification,
      requirement: requirementFixture,
      evaluation
    });

    const assessed = recordClientCheckValidation(tenantId, created.escalationId, {
      assessedBy: 'client-compliance@contoso.com',
      checkValidationInPlace: true,
      checkValidationDescription: 'Daily manual MFA enrollment audit covers gap until Entra policy catches up.',
      linkedRuleIds: ['identity-mfa-enrollment'],
      preventsDownstreamEscalation: true,
      evidenceRef: 'sharepoint://contoso/mfa-audit-log-2026-06',
      reviewExpiry: '2026-07-20T00:00:00Z'
    });

    expect(assessed.status).toBe('Mitigating');
    expect(assessed.clientCheckValidation.preventsDownstreamEscalation).toBe(true);
    expect(assessed.clientDisposition.decision).toBe('compensating-control');
    expect(assessed.clientCheckValidation.linkedRuleIds).toContain('identity-mfa-enrollment');
  });

  it('records downstream liability escalation linked to failed rules', () => {
    const notification = buildComplianceNotificationEnvelope({
      tenantId,
      requirement: requirementFixture,
      evaluation,
      assetId: '/subscriptions/sub-contoso/policyAssignments/identity-mfa-enforcement',
      validationId: 'val-downstream',
      requirementId: 'identity-mfa-requirement'
    });

    const created = createClientEscalation({
      complianceNotification: notification,
      requirement: requirementFixture,
      evaluation
    });

    const escalated = recordDownstreamLiabilityEscalation(tenantId, created.escalationId, {
      escalatedBy: 'client-risk@contoso.com',
      description: 'MFA gap may propagate to clinical workstation access downstream.',
      linkedRuleIds: ['identity-mfa-enrollment'],
      impactAssessment: 'Potential unauthorized access to PHI workflows on premises.',
      liabilityScope: 'client-premises-downstream'
    });

    expect(escalated.downstreamLiabilityEscalation.status).toBe('escalated');
    expect(escalated.clientDisposition.decision).toBe('downstream-liability-escalated');
    expect(escalated.priority).toBe('Critical');
  });

  it('routes liability to vendor without immediate block when internal controls suffice', () => {
    const notification = buildComplianceNotificationEnvelope({
      tenantId,
      requirement: requirementFixture,
      evaluation,
      assetId: '/subscriptions/sub-contoso/policyAssignments/identity-mfa-enforcement',
      validationId: 'val-routing',
      requirementId: 'identity-mfa-requirement'
    });

    const created = createClientEscalation({
      complianceNotification: notification,
      requirement: requirementFixture,
      evaluation
    });

    const routed = recordLiabilityRouting(tenantId, created.escalationId, {
      assessedBy: 'client-governance@contoso.com',
      internalMitigationSufficient: true,
      routingDecision: 'remains-with-vendor',
      vendorId: 'microsoft-entra',
      vendorName: 'Microsoft Entra ID',
      linkedRuleIds: ['identity-mfa-enrollment'],
      rationale: 'Manual MFA audit compensates; vendor gap contained — no block applied.'
    });

    expect(routed.liabilityRouting.immediateVendorBlockApplied).toBe(false);
    expect(routed.liabilityRouting.routingDecision).toBe('remains-with-vendor');
    expect(routed.status).toBe('Mitigating');
  });
});
