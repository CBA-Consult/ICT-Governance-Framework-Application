'use strict';

const fs = require('fs');
const path = require('path');

const BRIDGE_PATH = path.join(__dirname, '..', '..', 'adpa/coe/compliance-lineage-bridge.json');

function loadBridge() {
  return JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf8'));
}

function getSlaTargets(priority, escalation) {
  if (escalation?.procurementSlaId && escalation?.slaTermsOverride) {
    return escalation.slaTermsOverride;
  }
  if (escalation?.procurementSlaId) {
    const { getProcurementComplianceSla } = require('./compliance-procurement-sla-service');
    const procSla = getProcurementComplianceSla(escalation.tenantId, escalation.procurementSlaId);
    if (procSla?.slaTerms) return procSla.slaTerms;
  }
  const bridge = loadBridge();
  const sla = bridge.complianceEscalationSla || {};
  return sla[priority] || sla.High || {
    acknowledgeMs: 48 * 60 * 60 * 1000,
    checkValidationMs: 5 * 24 * 60 * 60 * 1000,
    resolutionMs: 14 * 24 * 60 * 60 * 1000
  };
}

function msSince(isoDate) {
  if (!isoDate) return null;
  return Date.now() - new Date(isoDate).getTime();
}

function assessSlaBreaches(escalation) {
  const targets = getSlaTargets(escalation.priority || 'High', escalation);
  const issuedAt = escalation.issuedAt;
  const now = Date.now();
  const elapsed = issuedAt ? now - new Date(issuedAt).getTime() : 0;

  const acknowledgedAt = escalation.acknowledgedAt || escalation.clientDisposition?.decidedAt;
  const checkValidationAt = escalation.clientCheckValidation?.assessedAt;
  const resolvedAt = escalation.resolvedAt;
  const downstreamEscalated = escalation.downstreamLiabilityEscalation?.status === 'escalated';
  const productEscalated = escalation.liabilityRouting?.routingDecision
    === 'escalates-to-governance-products-services';

  const acknowledgeBreached = !acknowledgedAt && elapsed > targets.acknowledgeMs;
  const checkValidationBreached = !checkValidationAt
    && !resolvedAt
    && elapsed > targets.checkValidationMs;
  const resolutionBreached = !resolvedAt
    && escalation.status !== 'Closed'
    && elapsed > targets.resolutionMs;

  const breaches = [];
  if (acknowledgeBreached) breaches.push('acknowledge');
  if (checkValidationBreached) breaches.push('check-validation');
  if (resolutionBreached) breaches.push('resolution');
  if (downstreamEscalated && !escalation.clientCheckValidation?.preventsDownstreamEscalation) {
    breaches.push('downstream-liability-unmitigated');
  }
  if (productEscalated && !escalation.clientCheckValidation?.checkValidationInPlace) {
    breaches.push('governance-products-escalation-unmitigated');
  }

  return {
    priority: escalation.priority || 'High',
    targets,
    elapsedMs: elapsed,
    acknowledgeBreached,
    checkValidationBreached,
    resolutionBreached,
    downstreamEscalationTriggered: downstreamEscalated,
    governanceProductsEscalationTriggered: productEscalated,
    breachCount: breaches.length,
    breaches,
    slaBreached: breaches.length > 0,
    breachedAt: breaches.length ? new Date().toISOString() : null
  };
}

function computeInternalControlDiscount(escalation, slaStatus) {
  const bridge = loadBridge();
  const policy = bridge.internalControlDiscountPolicy || {
    slaBreachVoidsDiscount: true,
    tiers: []
  };

  const check = escalation.clientCheckValidation;
  const routing = escalation.liabilityRouting;
  const downstream = escalation.downstreamLiabilityEscalation;

  const tierResults = [];
  let discountPercent = 0;

  if (check?.checkValidationInPlace && check?.preventsDownstreamEscalation) {
    tierResults.push({ tierId: 'check-validation', discountPercent: 5, label: 'Internal check validation prevents downstream escalation' });
    discountPercent += 5;
  }

  if (routing?.internalMitigationSufficient && routing?.routingDecision === 'remains-with-vendor') {
    tierResults.push({ tierId: 'vendor-contained', discountPercent: 5, label: 'Liability contained at vendor — no governance products escalation' });
    discountPercent += 5;
  }

  if (!downstream?.status && !slaStatus.governanceProductsEscalationTriggered) {
    if (check?.preventsDownstreamEscalation || routing?.routingDecision === 'remains-with-vendor') {
      tierResults.push({ tierId: 'no-downstream-escalation', discountPercent: 5, label: 'Avoided downstream liability and product/service escalation' });
      discountPercent += 5;
    }
  }

  const maxDiscount = policy.maxDiscountPercent || 15;
  discountPercent = Math.min(discountPercent, maxDiscount);

  const voidedDueToSlaBreach = policy.slaBreachVoidsDiscount !== false && slaStatus.slaBreached;
  const effectiveDiscountPercent = voidedDueToSlaBreach ? 0 : discountPercent;

  return {
    eligible: tierResults.length > 0,
    tierResults,
    nominalDiscountPercent: discountPercent,
    effectiveDiscountPercent,
    voidedDueToSlaBreach,
    voidReason: voidedDueToSlaBreach
      ? `SLA breach (${slaStatus.breaches.join(', ')}) — internal control discount voided`
      : null,
    discountBasis: 'internal-controls-prevent-product-and-downstream-escalation',
    computedAt: new Date().toISOString(),
    note: 'Discount applies to framework TCO / service exposure — incentive for clients to maintain internal controls that avoid product and downstream liability escalation.'
  };
}

function enrichComplianceEscalation(escalation) {
  if (!escalation) return null;
  const slaStatus = assessSlaBreaches(escalation);
  const internalControlDiscount = computeInternalControlDiscount(escalation, slaStatus);

  let procurementSla = null;
  if (escalation.procurementSlaId) {
    const { getProcurementComplianceSla } = require('./compliance-procurement-sla-service');
    procurementSla = getProcurementComplianceSla(escalation.tenantId, escalation.procurementSlaId);
  }

  const mitigationCostCoverage = escalation.procurementMitigationCostCoverage
    || procurementSla?.mitigationControlCostCoverage
    || null;

  return {
    ...escalation,
    slaStatus,
    internalControlDiscount,
    procurementSla,
    mitigationCostCoverage
  };
}

function enrichComplianceEscalations(escalations) {
  return (escalations || []).map(enrichComplianceEscalation);
}

module.exports = {
  loadBridge,
  getSlaTargets,
  assessSlaBreaches,
  computeInternalControlDiscount,
  enrichComplianceEscalation,
  enrichComplianceEscalations
};
