/**
 * @contract pillar:secops
 * Evidence provenance on obligations — independent audit sources outside provider boundary.
 */
const path = require('path');
const {
  validateObligationEvidence,
  validateBoundaryEvidence,
  enrichBoundaryWithEvidence,
  enrichEscalationWithEvidence
} = require('../../services/evidence-provenance-service');
const { getRequirementResponsibilityBoundary } = require('../../services/service-responsibility-boundary-service');
const { getClientEscalation } = require('../../services/compliance-client-escalation-service');

const requirementFixture = require(path.join(
  __dirname,
  '../../../adpa/tenants/tenant-contoso-health/requirements/identity-mfa-requirement.json'
));

describe('Evidence provenance contracts', () => {
  const tenantId = 'tenant-contoso-health';
  const boundary = requirementFixture.deploymentExpectations.serviceResponsibilityBoundary;

  it('requires evidence on all Contoso MFA obligations', () => {
    const all = [
      ...boundary.serviceObligations,
      ...boundary.sharedObligations,
      ...boundary.clientPremisesObligations
    ];

    expect(all.length).toBeGreaterThan(0);
    expect(all.every((o) => o.evidence)).toBe(true);
  });

  it('validates deterministic service obligations reject manual-attestation primary', () => {
    const enrollment = boundary.serviceObligations.find((o) => o.obligationId === 'svc-mfa-approval-enforcement');
    expect(validateObligationEvidence(enrollment).valid).toBe(true);

    const invalid = validateObligationEvidence({
      ...enrollment,
      evidence: { ...enrollment.evidence, source: 'manual-attestation', primarySource: 'manual-attestation' }
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors[0]).toMatch(/manual-attestation/);
  });

  it('requires attestation evidence for non-monitorable client obligations', () => {
    const passwordSharing = boundary.clientPremisesObligations.find(
      (o) => o.obligationId === 'client-no-password-sharing'
    );
    expect(validateObligationEvidence(passwordSharing).valid).toBe(true);
    expect(passwordSharing.evidence.evidenceType).toBe('attestation');
    expect(passwordSharing.evidence.auditFrequency).toBe('quarterly');
  });

  it('supports multi-source evidence on shared Conditional Access control', () => {
    const ca = boundary.sharedObligations.find((o) => o.obligationId === 'ca-policy-control');

    expect(ca.evidence.sources.length).toBeGreaterThanOrEqual(2);
    expect(ca.evidence.sources.some((s) => s.role === 'service')).toBe(true);
    expect(ca.evidence.sources.some((s) => s.role === 'client')).toBe(true);
    expect(validateObligationEvidence(ca).valid).toBe(true);
  });

  it('enriches responsibility boundary API with obligationEvidence runtime fields', () => {
    const response = getRequirementResponsibilityBoundary(tenantId, 'identity-mfa-requirement');

    expect(response.boundary.evidenceValidation.valid).toBe(true);
    const enrollment = response.obligations.find((o) => o.obligationId === 'svc-mfa-approval-enforcement');

    expect(enrollment.obligationEvidence.primarySource).toBe('graph-api');
    expect(enrollment.obligationEvidence.auditReady).toBe(true);
    expect(enrollment.obligationEvidence.externalStore).toBe('postgresql');
  });

  it('enriches Contoso escalation with obligationEvidenceStatuses', () => {
    const enriched = getClientEscalation(tenantId, 'ces-1781953894979-8db7422d');
    if (!enriched) return;

    expect(enriched.obligationEvidenceStatuses?.length).toBeGreaterThan(0);
    expect(enriched.serviceResponsibilityBoundary.evidenceValidation.valid).toBe(true);

    const enrollmentEvidence = enriched.obligationEvidenceStatuses.find(
      (e) => e.obligationId === 'svc-mfa-approval-enforcement'
    );
    expect(enrollmentEvidence.auditReady).toBe(true);
    expect(enrollmentEvidence.confidence).toBe('high');
  });

  it('passes full boundary evidence validation for Contoso MFA', () => {
    const built = enrichBoundaryWithEvidence(
      {
        serviceObligations: boundary.serviceObligations,
        sharedObligations: boundary.sharedObligations,
        clientPremisesObligations: boundary.clientPremisesObligations
      },
      null
    );

    const result = validateBoundaryEvidence(built);
    expect(result.valid).toBe(true);
  });
});
