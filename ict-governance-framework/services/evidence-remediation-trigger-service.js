'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BRIDGE_PATH = path.join(__dirname, '..', '..', 'adpa/coe/compliance-lineage-bridge.json');

function loadBridge() {
  return JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf8'));
}

function getRemediationPolicy() {
  const bridge = loadBridge();
  return bridge.evidenceDivergenceRemediationPolicy || {
    triggerWhen: { resolution: 'divergent', confidence: 'low', minSources: 2 },
    safeguards: {
      requireMultiSourceConflict: true,
      blockOnPartialOnly: true,
      requireApprovalForDestructive: true
    },
    actionPipeline: []
  };
}

function collectDivergentChains(escalation) {
  const chains = escalation?.evidenceChains
    || (escalation?.serviceResponsibilityBoundary?.obligations || [])
      .map((o) => o.evidenceChain)
      .filter(Boolean);

  const policy = getRemediationPolicy();
  const triggerWhen = policy.triggerWhen || {};

  return (chains || []).filter((chain) =>
    chain.resolution === (triggerWhen.resolution || 'divergent')
    && chain.confidence === (triggerWhen.confidence || 'low')
    && (chain.sources?.length || 0) >= (triggerWhen.minSources || 2)
  );
}

function evaluateRemediationSafeguards(escalation, divergentChains) {
  const policy = getRemediationPolicy();
  const safeguards = policy.safeguards || {};
  const checks = [];

  if (!divergentChains.length) {
    return { passed: false, checks, blockReason: 'no-divergent-evidence-chain' };
  }

  checks.push({ id: 'divergent-detected', passed: true });

  if (safeguards.blockOnPartialOnly) {
    const partialOnly = (escalation.evidenceChains || []).every(
      (c) => c.resolution === 'partial' || c.resolution === 'consistent'
    );
    checks.push({ id: 'not-partial-only', passed: !partialOnly });
    if (partialOnly) {
      return { passed: false, checks, blockReason: 'partial-only-not-actionable' };
    }
  }

  if (safeguards.requireMultiSourceConflict) {
    const hasMultiSource = divergentChains.some((c) => (c.sources?.length || 0) >= 2);
    checks.push({ id: 'multi-source-conflict', passed: hasMultiSource });
    if (!hasMultiSource) {
      return { passed: false, checks, blockReason: 'insufficient-source-count' };
    }
  }

  const attestationOnly = divergentChains.every((chain) =>
    (chain.sources || []).every((s) =>
      ['manual-attestation', 'client-attestation', 'attestation'].includes(s.type)
    )
  );
  if (attestationOnly) {
    checks.push({ id: 'not-attestation-only', passed: false });
    return { passed: false, checks, blockReason: 'attestation-only-not-automatable' };
  }
  checks.push({ id: 'not-attestation-only', passed: true });

  return { passed: true, checks, blockReason: null };
}

function buildRemediationTrigger(escalation) {
  if (!escalation) return null;

  const policy = getRemediationPolicy();
  const divergentChains = collectDivergentChains(escalation);
  if (!divergentChains.length) return null;

  const safeguards = evaluateRemediationSafeguards(escalation, divergentChains);
  const destructiveActions = (policy.actionPipeline || []).filter(
    (a) => a.phase === 'contain' || a.phase === 'restore'
  );
  const requiresApproval = policy.safeguards?.requireApprovalForDestructive !== false
    && destructiveActions.length > 0;

  const status = !safeguards.passed
    ? 'blocked'
    : requiresApproval
      ? 'awaiting-approval'
      : 'queued';

  return {
    triggerId: `ert-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    triggerClass: policy.escalationClassOnTrigger || 'evidence-conflict',
    status,
    priority: policy.priorityOnTrigger || 'Critical',
    divergentChainCount: divergentChains.length,
    divergentChains: divergentChains.map((c) => ({
      resolution: c.resolution,
      confidence: c.confidence,
      explanation: c.explanation,
      sourceTypes: (c.sources || []).map((s) => s.type)
    })),
    safeguardsApplied: safeguards.checks,
    blockReason: safeguards.blockReason,
    requiresApproval,
    revalidationRequired: true,
    actionPipeline: (policy.actionPipeline || []).map((action) => ({
      ...action,
      status: status === 'blocked' ? 'skipped' : (action.automated ? 'queued' : 'awaiting-approval')
    })),
    summary: status === 'blocked'
      ? `Remediation blocked: ${safeguards.blockReason}`
      : 'Trust breakdown detected — remediation pipeline queued pending safeguards.',
    computedAt: new Date().toISOString()
  };
}

function enrichEscalationWithRemediationTrigger(escalation) {
  if (!escalation) return null;

  const remediationTrigger = buildRemediationTrigger(escalation);
  if (!remediationTrigger) return escalation;

  return {
    ...escalation,
    remediationTrigger,
    priority: remediationTrigger.status !== 'blocked'
      ? remediationTrigger.priority
      : escalation.priority,
    evidenceRemediationRequired: remediationTrigger.status !== 'blocked'
  };
}

module.exports = {
  loadBridge,
  getRemediationPolicy,
  collectDivergentChains,
  evaluateRemediationSafeguards,
  buildRemediationTrigger,
  enrichEscalationWithRemediationTrigger
};
