/**
 * @contract pillar:secops
 * Multi-source evidence validation — consistent vs divergent cross-source resolution.
 */
const {
  resolveEvidenceChain,
  buildObligationEvidenceChain,
  normalizeSourceObservation
} = require('../../services/evidence-validation-engine');
const { getClientEscalation } = require('../../services/compliance-client-escalation-service');
const path = require('path');

const requirementFixture = require(path.join(
  __dirname,
  '../../../adpa/tenants/tenant-contoso-health/requirements/identity-mfa-requirement.json'
));

describe('Evidence validation engine contracts', () => {
  const tenantId = 'tenant-contoso-health';

  it('detects divergence when policy and sentinel disagree', () => {
    const result = resolveEvidenceChain([
      { type: 'azure-policy-scan', status: 'compliant', observedValue: '100%' },
      { type: 'sentinel-query', status: 'mfa bypass detected', observedValue: 'MFA bypass events detected' }
    ]);

    expect(result.resolution).toBe('divergent');
    expect(result.confidence).toBe('low');
    expect(result.requiresEscalation).toBe(true);
  });

  it('resolves Contoso MFA enrollment as consistent when active-eligible meets target', () => {
    const enrollmentObl = requirementFixture.deploymentExpectations.serviceResponsibilityBoundary
      .serviceObligations.find((o) => o.obligationId === 'svc-mfa-approval-enforcement');

    const chain = buildObligationEvidenceChain(enrollmentObl, {
      frameworkImpacts: [{
        triggeredBy: [{
          ruleId: 'identity-mfa-enrollment',
          observed: '72% aggregate enrolled',
          enrollmentBreakdown: {
            aggregateEnrolledPercent: 72,
            activeEligibleEnrolledPercent: 100,
            activeEligibleMeetsTarget: true,
            failureDueToExcludedAccountsOnly: true
          }
        }]
      }]
    });

    expect(chain.resolution).toBe('consistent');
    expect(chain.confidence).toBe('high');
    expect(chain.requiresEscalation).toBe(false);
    expect(chain.sources).toHaveLength(3);
    expect(chain.explanation).toMatch(/active-eligible|enforcement/i);
  });

  it('normalizes sentinel enforcement as ENFORCED', () => {
    expect(normalizeSourceObservation({
      type: 'sentinel-query',
      status: 'enforced',
      observedValue: 'no login bypass detected'
    })).toBe('ENFORCED');
  });

  it('normalizes azure policy partial to PASS when active-eligible meets target', () => {
    expect(normalizeSourceObservation(
      { type: 'azure-policy-scan', status: 'partial', observedValue: '72% aggregate' },
      { activeEligibleMeetsTarget: true }
    )).toBe('PASS');
  });

  it('enriches Contoso escalation with consistent evidence chain on MFA enrollment', () => {
    const enriched = getClientEscalation(tenantId, 'ces-1781953894979-8db7422d');
    if (!enriched) return;

    expect(enriched.evidenceAlert).toBe(false);
    expect(enriched.evidenceConflictClass).toBeNull();

    const enrollment = (enriched.serviceResponsibilityBoundary.obligations || [])
      .find((o) => o.obligationId === 'svc-mfa-approval-enforcement');

    expect(enrollment.evidenceChain.resolution).toBe('consistent');
    expect(enrollment.obligationEvidence.evidenceChain.resolution).toBe('consistent');
  });
});
