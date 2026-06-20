/**
 * @contract pillar:secops
 * Procurement SLAs bind vendor accountability for mitigation controls — not line-item pricing.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  buildComplianceNotificationEnvelope
} = require('../../services/compliance-notification-service');
const { createClientEscalation } = require('../../services/compliance-client-escalation-service');
const {
  draftProcurementComplianceSla,
  approveProcurementComplianceSla,
  activateProcurementComplianceSla,
  listProcurementComplianceSlas
} = require('../../services/compliance-procurement-sla-service');
const { enrichComplianceEscalation } = require('../../services/compliance-escalation-sla-service');

const requirementFixture = require(path.join(
  __dirname,
  '../../../adpa/tenants/tenant-contoso-health/requirements/identity-mfa-requirement.json'
));

describe('Compliance procurement SLA contracts', () => {
  const tenantId = 'tenant-contract-proc-sla-test';
  let escalationsDir;
  let procurementDir;

  beforeEach(() => {
    escalationsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ces-proc-esc-'));
    procurementDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ces-proc-sla-'));
    jest.spyOn(require('../../services/compliance-client-escalation-service'), 'escalationsDir')
      .mockReturnValue(escalationsDir);
    jest.spyOn(require('../../services/compliance-procurement-sla-service'), 'procurementSlasDir')
      .mockReturnValue(procurementDir);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(escalationsDir, { recursive: true, force: true });
    fs.rmSync(procurementDir, { recursive: true, force: true });
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

  function seedEscalation() {
    const notification = buildComplianceNotificationEnvelope({
      tenantId,
      requirement: requirementFixture,
      evaluation,
      assetId: '/subscriptions/sub-test/policyAssignments/identity-mfa-enforcement',
      validationId: 'val-proc-test',
      requirementId: 'identity-mfa-requirement',
      remediationTemplateId: 'identity-access-control'
    });
    return createClientEscalation({
      complianceNotification: notification,
      requirement: requirementFixture,
      evaluation,
      remediationTemplateId: 'identity-access-control'
    });
  }

  it('rejects procurement SLA draft without mitigation control coverage', () => {
    expect(() => draftProcurementComplianceSla({
      tenantId,
      draftedBy: 'procurement@test.com',
      mitigationControlCostCoverage: { coversAdditionalControls: false }
    })).toThrow(/must cover initiation of additional controls/);
  });

  it('derives control obligations from escalation mitigation plan without dollar amounts', () => {
    const escalation = seedEscalation();
    const sla = draftProcurementComplianceSla({
      tenantId,
      draftedBy: 'procurement@test.com',
      linkedEscalationId: escalation.escalationId,
      linkedRequirementId: escalation.requirementId,
      priority: 'Critical',
      mitigationControlCostCoverage: {
        coversAdditionalControls: true,
        coverageModel: 'vendor-accountability',
        pricingApproach: 'not-line-item-priced'
      }
    });

    expect(sla.status).toBe('draft');
    expect(sla.mitigationControlCostCoverage.pricingApproach).toBe('not-line-item-priced');
    expect(sla.mitigationControlCostCoverage.controlObligations.length).toBeGreaterThanOrEqual(1);
    expect(sla.mitigationControlCostCoverage.controlObligations[0].linkedRuleId).toBe('identity-mfa-enrollment');
    expect(sla.mitigationControlCostCoverage.totalEstimatedCoverageUsd).toBeNull();
    expect(sla.mitigationControlCostCoverage.financialExposure.reportingBoundary).toBe('fair-ale-tco-only');
  });

  it('accepts optional TCO cost items when provided but does not require them', () => {
    const escalation = seedEscalation();
    const sla = draftProcurementComplianceSla({
      tenantId,
      draftedBy: 'procurement@test.com',
      linkedEscalationId: escalation.escalationId,
      mitigationControlCostCoverage: {
        coversAdditionalControls: true,
        costItems: [{ description: 'Optional TCO band estimate', estimatedUsd: 4800 }]
      }
    });

    expect(sla.mitigationControlCostCoverage.costItems).toHaveLength(1);
    expect(sla.mitigationControlCostCoverage.totalEstimatedCoverageUsd).toBe(4800);
    expect(sla.mitigationControlCostCoverage.controlObligations.length).toBeGreaterThanOrEqual(1);
  });

  it('activates approved SLA and links vendor accountability coverage to escalation', () => {
    const escalation = seedEscalation();
    const drafted = draftProcurementComplianceSla({
      tenantId,
      draftedBy: 'procurement@test.com',
      linkedEscalationId: escalation.escalationId,
      priority: 'High',
      mitigationControlCostCoverage: {
        coversAdditionalControls: true,
        coverageModel: 'vendor-accountability'
      }
    });
    approveProcurementComplianceSla(tenantId, drafted.slaId, { approvedBy: 'lead@test.com' });

    const { sla, escalationId } = activateProcurementComplianceSla(
      tenantId,
      drafted.slaId,
      escalation.escalationId,
      { activatedBy: 'procurement@test.com' }
    );

    expect(sla.status).toBe('active');
    expect(escalationId).toBe(escalation.escalationId);

    const enriched = enrichComplianceEscalation(
      require('../../services/compliance-client-escalation-service').getClientEscalationRaw(tenantId, escalation.escalationId)
    );
    expect(enriched.procurementSlaId).toBe(drafted.slaId);
    expect(enriched.mitigationCostCoverage.controlObligations.length).toBeGreaterThanOrEqual(1);
    expect(enriched.mitigationCostCoverage.coverageModel).toBe('vendor-accountability');
    expect(enriched.slaStatus.targets.priority).toBe('High');

    const listed = listProcurementComplianceSlas(tenantId, { status: 'active' });
    expect(listed.some((s) => s.slaId === drafted.slaId)).toBe(true);
  });
});
