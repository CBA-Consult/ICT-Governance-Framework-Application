'use strict';

const fs = require('fs');
const path = require('path');
const { buildObligationEvidenceChain } = require('./evidence-validation-engine');
const { enrichEscalationWithRemediationTrigger } = require('./evidence-remediation-trigger-service');

const BRIDGE_PATH = path.join(__dirname, '..', '..', 'adpa/coe/compliance-lineage-bridge.json');

const WEAK_SOURCES_FOR_DETERMINISTIC = new Set(['manual-attestation', 'attestation']);

function loadBridge() {
  return JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf8'));
}

function getEvidencePolicy() {
  const bridge = loadBridge();
  return bridge.evidenceProvenancePolicy || {};
}

function primarySourceType(evidence) {
  if (!evidence) return null;
  if (evidence.primarySource) return evidence.primarySource;
  if (evidence.source) return evidence.source;
  return evidence.sources?.[0]?.type || null;
}

function validateObligationEvidence(obligation) {
  const errors = [];
  const evidence = obligation?.evidence;
  const responsibilityType = obligation.responsibilityType
    || (obligation.accountableParty === 'client' ? 'client' : 'service');
  const monitorabilityType = obligation.monitorability?.type;

  if (!evidence) {
    errors.push('evidence is required on obligations');
    return { valid: false, errors };
  }

  const primary = primarySourceType(evidence);
  if (!primary && !(evidence.sources || []).length) {
    errors.push('evidence must declare source, primarySource, or sources[]');
  }

  if (
    responsibilityType === 'service'
    && monitorabilityType === 'deterministic'
    && WEAK_SOURCES_FOR_DETERMINISTIC.has(primary)
  ) {
    errors.push('deterministic service obligations cannot use manual-attestation as primary evidence');
  }

  if (
    responsibilityType === 'client'
    && monitorabilityType === 'non-monitorable'
    && primary
    && !['manual-attestation', 'attestation', 'client-attestation'].includes(primary)
    && !(evidence.sources || []).some((s) => ['manual-attestation', 'attestation', 'client-attestation'].includes(s.type))
  ) {
    errors.push('non-monitorable client obligations should use attestation evidence');
  }

  return { valid: errors.length === 0, errors };
}

function validateBoundaryEvidence(boundary) {
  const obligations = [
    ...(boundary?.serviceObligations || []),
    ...(boundary?.sharedObligations || []),
    ...(boundary?.clientPremisesObligations || [])
  ];

  const results = obligations.map((obl) => ({
    obligationId: obl.obligationId,
    ...validateObligationEvidence(obl)
  }));

  return {
    valid: results.every((r) => r.valid),
    results
  };
}

function resolveEvidenceConfidence(evidence) {
  if (!evidence) return 'low';
  if (evidence.sources?.length) {
    const confidences = evidence.sources.map((s) => s.confidence).filter(Boolean);
    if (confidences.includes('high')) return 'high';
    if (confidences.includes('medium')) return 'medium';
  }
  if (evidence.evidenceType === 'telemetry') return 'high';
  if (evidence.evidenceType === 'configuration') return 'high';
  if (evidence.evidenceType === 'attestation') return 'medium';
  return 'medium';
}

function buildObligationEvidenceRuntime(obligation, escalation = null) {
  const evidence = obligation?.evidence;
  if (!evidence) return null;

  const primary = primarySourceType(evidence);
  const lastObservedAt = escalation?.issuedAt
    || evidence.lastObservedAt
    || new Date().toISOString();

  const validation = validateObligationEvidence(obligation);
  const evidenceChain = buildObligationEvidenceChain(obligation, escalation);

  return {
    obligationId: obligation.obligationId,
    primarySource: primary,
    sources: evidence.sources || (primary ? [{ type: primary, confidence: resolveEvidenceConfidence(evidence) }] : []),
    ownership: evidence.ownership || obligation.responsibilityType || 'service',
    auditFrequency: evidence.auditFrequency || null,
    evidenceType: evidence.evidenceType || null,
    externalStore: evidence.externalStore || 'adpa-artifact',
    lastObservedAt,
    confidence: evidenceChain?.confidence || resolveEvidenceConfidence(evidence),
    auditReady: validation.valid && !!primary,
    validationErrors: validation.valid ? [] : validation.errors,
    evidenceChain,
    evidenceAlert: evidenceChain?.resolution === 'divergent'
  };
}

function enrichObligationWithEvidence(obligation, escalation = null) {
  if (!obligation) return obligation;

  const obligationEvidence = buildObligationEvidenceRuntime(obligation, escalation);
  const evidenceChain = obligationEvidence?.evidenceChain || null;

  return {
    ...obligation,
    ...(obligationEvidence ? { obligationEvidence } : {}),
    ...(evidenceChain ? { evidenceChain } : {})
  };
}

function enrichObligationsWithEvidence(obligations, escalation = null) {
  return (obligations || []).map((obl) => enrichObligationWithEvidence(obl, escalation));
}

function enrichBoundaryWithEvidence(boundary, escalation = null) {
  if (!boundary) return null;

  const serviceObligations = enrichObligationsWithEvidence(boundary.serviceObligations, escalation);
  const sharedObligations = enrichObligationsWithEvidence(boundary.sharedObligations, escalation);
  const clientPremisesObligations = enrichObligationsWithEvidence(boundary.clientPremisesObligations, escalation);
  const obligations = boundary.obligations?.length
    ? enrichObligationsWithEvidence(boundary.obligations, escalation)
    : [
      ...serviceObligations,
      ...sharedObligations,
      ...clientPremisesObligations
    ];

  const evidenceValidation = validateBoundaryEvidence({
    serviceObligations,
    sharedObligations,
    clientPremisesObligations
  });

  const evidenceChains = obligations.map((o) => o.evidenceChain).filter(Boolean);
  const divergentChains = evidenceChains.filter((c) => c.resolution === 'divergent');

  return {
    ...boundary,
    serviceObligations,
    sharedObligations,
    clientPremisesObligations,
    obligations,
    obligationEvidenceSummary: {
      total: obligations.length,
      auditReady: obligations.filter((o) => o.obligationEvidence?.auditReady).length,
      validationPassed: evidenceValidation.valid,
      multiSourceValidated: evidenceChains.length,
      divergent: divergentChains.length
    },
    evidenceValidation
  };
}

function enrichEscalationWithEvidence(escalation) {
  if (!escalation?.serviceResponsibilityBoundary) return escalation;

  const enrichedBoundary = enrichBoundaryWithEvidence(
    escalation.serviceResponsibilityBoundary,
    escalation
  );

  const withEvidence = {
    ...escalation,
    serviceResponsibilityBoundary: enrichedBoundary,
    obligationEvidenceStatuses: (enrichedBoundary.obligations || [])
      .map((o) => o.obligationEvidence)
      .filter(Boolean),
    evidenceChains: (enrichedBoundary.obligations || [])
      .map((o) => o.evidenceChain)
      .filter(Boolean),
    evidenceAlert: (enrichedBoundary.obligations || []).some(
      (o) => o.evidenceChain?.resolution === 'divergent' || o.obligationEvidence?.evidenceAlert
    ),
    evidenceConflictClass: (enrichedBoundary.obligations || []).some(
      (o) => o.evidenceChain?.resolution === 'divergent'
    ) ? 'evidence-conflict' : null
  };

  return enrichEscalationWithRemediationTrigger(withEvidence);
}

module.exports = {
  loadBridge,
  getEvidencePolicy,
  primarySourceType,
  validateObligationEvidence,
  validateBoundaryEvidence,
  buildObligationEvidenceRuntime,
  enrichObligationWithEvidence,
  enrichBoundaryWithEvidence,
  enrichEscalationWithEvidence
};
