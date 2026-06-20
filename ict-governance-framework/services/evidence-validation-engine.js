'use strict';

const fs = require('fs');
const path = require('path');

const BRIDGE_PATH = path.join(__dirname, '..', '..', 'adpa/coe/compliance-lineage-bridge.json');

const PASS_STATUSES = new Set(['pass', 'compliant', 'enforced', 'healthy', 'no bypass', 'no bypass detected', 'no login bypass detected']);
const FAIL_STATUSES = new Set(['fail', 'non-compliant', 'non-conformant', 'bypassed', 'bypass', 'mfa bypass detected', 'critical']);
const PARTIAL_STATUSES = new Set(['partial', 'observed-failure', 'degraded']);

function loadBridge() {
  return JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf8'));
}

function normalizeSourceObservation(source, context = {}) {
  const statusLower = (source.status || '').toLowerCase();
  const raw = `${source.status || ''} ${source.observedValue || ''}`.toLowerCase().trim();

  if (source.type === 'sentinel-query') {
    if (raw.includes('no bypass') || statusLower === 'enforced') {
      return 'ENFORCED';
    }
    if (raw.includes('bypass detected') || raw.includes('mfa bypass')) {
      return 'FAIL';
    }
  }

  if (FAIL_STATUSES.has(statusLower) || (raw.includes('bypass detected') && !raw.includes('no bypass'))) {
    return 'FAIL';
  }

  if (PARTIAL_STATUSES.has(statusLower)) {
    if (context.activeEligibleMeetsTarget && source.type === 'azure-policy-scan') {
      return 'PASS';
    }
    return 'PARTIAL';
  }

  if (PASS_STATUSES.has(statusLower) || raw.includes('100% active-eligible')) {
    return 'PASS';
  }

  if (context.activeEligibleMeetsTarget && source.type === 'graph-api') {
    return 'PASS';
  }

  return 'PARTIAL';
}

function allAgree(normalized) {
  const unique = new Set(normalized);
  return unique.size === 1;
}

function hasCriticalConflict(normalized) {
  const hasFail = normalized.some((n) => n === 'FAIL' || n === 'BYPASSED');
  const hasPass = normalized.some((n) => n === 'PASS' || n === 'ENFORCED');
  return hasFail && hasPass;
}

function resolveEvidenceChain(sources, context = {}) {
  if (!sources?.length) {
    return {
      sources: [],
      resolution: 'partial',
      confidence: 'low',
      requiresEscalation: false,
      explanation: 'No evidence sources available for cross-validation.',
      computedAt: new Date().toISOString()
    };
  }

  const chainSources = sources.map((source) => ({
    type: source.type,
    status: source.status || null,
    observedValue: source.observedValue || null,
    normalized: normalizeSourceObservation(source, context)
  }));

  const normalized = chainSources.map((s) => s.normalized);

  if (hasCriticalConflict(normalized)) {
    return {
      sources: chainSources,
      resolution: 'divergent',
      confidence: 'low',
      requiresEscalation: true,
      explanation: context.explanation
        || 'Independent evidence sources disagree — trust breakdown between provider telemetry and enforcement signals.',
      computedAt: new Date().toISOString()
    };
  }

  const passLike = normalized.every((n) => n === 'PASS' || n === 'ENFORCED');

  if (passLike) {
    return {
      sources: chainSources,
      resolution: 'consistent',
      confidence: 'high',
      requiresEscalation: false,
      explanation: context.explanation
        || (context.activeEligibleMeetsTarget
          ? 'Aggregate vs active-eligible difference resolved; enforcement confirmed at login gate.'
          : 'All independent evidence sources agree.'),
      computedAt: new Date().toISOString()
    };
  }

  if (
    context.activeEligibleMeetsTarget
    && normalized.includes('PARTIAL')
    && !normalized.includes('FAIL')
  ) {
    return {
      sources: chainSources,
      resolution: 'consistent',
      confidence: 'high',
      requiresEscalation: false,
      explanation: context.explanation
        || 'Aggregate vs active-eligible difference resolved; enforcement confirmed at login gate.',
      computedAt: new Date().toISOString()
    };
  }

  if (allAgree(normalized)) {
    const passLike = normalized.every((n) => n === 'PASS' || n === 'ENFORCED');
    return {
      sources: chainSources,
      resolution: 'consistent',
      confidence: passLike ? 'high' : 'medium',
      requiresEscalation: !passLike,
      explanation: context.explanation || 'All independent evidence sources agree.',
      computedAt: new Date().toISOString()
    };
  }

  if (normalized.includes('PARTIAL') && !normalized.includes('FAIL')) {
    return {
      sources: chainSources,
      resolution: 'partial',
      confidence: 'medium',
      requiresEscalation: false,
      explanation: context.explanation || 'Sources partially align — review aggregate vs active-eligible scope.',
      computedAt: new Date().toISOString()
    };
  }

  return {
    sources: chainSources,
    resolution: 'partial',
    confidence: 'medium',
    requiresEscalation: false,
    explanation: context.explanation || 'Evidence sources require manual review.',
    computedAt: new Date().toISOString()
  };
}

function collectTriggerForRules(escalation, ruleIds = []) {
  if (!escalation?.frameworkImpacts?.length) return null;

  for (const impact of escalation.frameworkImpacts) {
    for (const trigger of impact.triggeredBy || []) {
      if (!ruleIds.length || ruleIds.includes(trigger.ruleId)) {
        return trigger;
      }
    }
  }
  return null;
}

function buildChainObservationsFromTrigger(evidence, trigger) {
  const breakdown = trigger?.enrollmentBreakdown;
  const configured = evidence?.sources || [];

  if (!configured.length) {
    return [];
  }

  return configured.map((src) => {
    switch (src.type) {
      case 'azure-policy-scan':
        return {
          type: src.type,
          status: breakdown?.failureDueToExcludedAccountsOnly ? 'partial' : (trigger ? 'non-compliant' : 'compliant'),
          observedValue: breakdown?.aggregateEnrolledPercent != null
            ? `${breakdown.aggregateEnrolledPercent}% aggregate enrolled`
            : trigger?.observed
        };
      case 'graph-api':
        return {
          type: src.type,
          status: breakdown?.activeEligibleMeetsTarget ? 'compliant' : 'non-compliant',
          observedValue: breakdown?.activeEligibleEnrolledPercent != null
            ? `${breakdown.activeEligibleEnrolledPercent}% active-eligible enrolled`
            : trigger?.observed
        };
      case 'sentinel-query':
        return {
          type: src.type,
          status: trigger?.contextSignals?.mfaBypassDetected ? 'mfa bypass detected' : 'enforced',
          observedValue: trigger?.contextSignals?.mfaBypassDetected
            ? 'MFA bypass events detected'
            : 'no login bypass detected'
        };
      case 'conditional-access-policy':
        return {
          type: src.type,
          status: trigger?.contextSignals?.caPolicyNotDeployed ? 'non-compliant' : 'compliant',
          observedValue: trigger?.observed || 'conditional access policy enforced at login'
        };
      default:
        return {
          type: src.type,
          status: trigger ? 'observed-failure' : 'compliant',
          observedValue: trigger?.observed || null
        };
    }
  });
}

function buildObligationEvidenceChain(obligation, escalation = null) {
  const evidence = obligation?.evidence;
  if (!evidence?.sources?.length && !evidence?.source) {
    return null;
  }

  const trigger = collectTriggerForRules(escalation, obligation.linkedRuleIds || []);
  const observations = buildChainObservationsFromTrigger(evidence, trigger);

  if (!observations.length) {
    return null;
  }

  const context = {
    activeEligibleMeetsTarget: trigger?.enrollmentBreakdown?.activeEligibleMeetsTarget === true,
    failureDueToExcludedAccountsOnly: trigger?.enrollmentBreakdown?.failureDueToExcludedAccountsOnly === true
  };

  return resolveEvidenceChain(observations, context);
}

module.exports = {
  loadBridge,
  normalizeSourceObservation,
  resolveEvidenceChain,
  buildChainObservationsFromTrigger,
  buildObligationEvidenceChain,
  collectTriggerForRules,
  allAgree,
  hasCriticalConflict
};
