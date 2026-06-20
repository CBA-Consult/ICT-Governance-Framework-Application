/**
 * @contract pillar:secops
 * Compliance escalation SLA breaches and internal control discount.
 */
const {
  enrichComplianceEscalation,
  assessSlaBreaches,
  computeInternalControlDiscount
} = require('../../services/compliance-escalation-sla-service');

describe('Compliance escalation SLA contracts', () => {
  const baseEscalation = {
    escalationId: 'ces-test',
    tenantId: 'tenant-test',
    priority: 'High',
    status: 'Open',
    issuedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  };

  it('flags SLA breach when acknowledge and check-validation targets exceeded', () => {
    const sla = assessSlaBreaches(baseEscalation);
    expect(sla.acknowledgeBreached).toBe(true);
    expect(sla.checkValidationBreached).toBe(true);
    expect(sla.slaBreached).toBe(true);
    expect(sla.breaches).toContain('acknowledge');
  });

  it('awards internal control discount when check validation and vendor containment in place', () => {
    const escalation = enrichComplianceEscalation({
      ...baseEscalation,
      acknowledgedAt: new Date().toISOString(),
      clientCheckValidation: {
        assessedAt: new Date().toISOString(),
        checkValidationInPlace: true,
        preventsDownstreamEscalation: true,
        linkedRuleIds: ['identity-mfa-enrollment']
      },
      liabilityRouting: {
        assessedAt: new Date().toISOString(),
        internalMitigationSufficient: true,
        routingDecision: 'remains-with-vendor',
        linkedRuleIds: ['identity-mfa-enrollment'],
        immediateVendorBlockApplied: false
      }
    });

    expect(escalation.internalControlDiscount.nominalDiscountPercent).toBeGreaterThanOrEqual(10);
    expect(escalation.internalControlDiscount.effectiveDiscountPercent).toBeGreaterThan(0);
  });

  it('voids discount when SLA is breached', () => {
    const sla = assessSlaBreaches(baseEscalation);
    const discount = computeInternalControlDiscount({
      ...baseEscalation,
      clientCheckValidation: {
        checkValidationInPlace: true,
        preventsDownstreamEscalation: true
      },
      liabilityRouting: {
        internalMitigationSufficient: true,
        routingDecision: 'remains-with-vendor'
      }
    }, sla);

    expect(discount.nominalDiscountPercent).toBeGreaterThan(0);
    expect(discount.effectiveDiscountPercent).toBe(0);
    expect(discount.voidedDueToSlaBreach).toBe(true);
  });
});
