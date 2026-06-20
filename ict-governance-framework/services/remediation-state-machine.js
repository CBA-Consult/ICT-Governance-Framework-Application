'use strict';

const REMEDIATION_STATES = Object.freeze([
  'pending',
  'running',
  'failed',
  'completed',
  'verified',
  'closed'
]);

const ALLOWED_TRANSITIONS = Object.freeze({
  pending: ['running'],
  running: ['failed', 'completed'],
  completed: ['verified'],
  verified: ['closed'],
  failed: [],
  closed: []
});

function canTransition(fromStatus, toStatus) {
  if (!REMEDIATION_STATES.includes(toStatus)) {
    return false;
  }
  if (!fromStatus) {
    return toStatus === 'pending';
  }
  if (!REMEDIATION_STATES.includes(fromStatus)) {
    return false;
  }
  return (ALLOWED_TRANSITIONS[fromStatus] || []).includes(toStatus);
}

function appendStatusTransition(run, toStatus, meta = {}) {
  const fromStatus = run.status;
  if (fromStatus && !canTransition(fromStatus, toStatus)) {
    throw new Error(`Invalid remediation status transition: ${fromStatus} → ${toStatus}`);
  }

  const entry = {
    status: toStatus,
    at: new Date().toISOString(),
    by: meta.by || run.executedBy || 'system',
    reason: meta.reason || null
  };

  run.status = toStatus;
  run.statusHistory = [...(run.statusHistory || []), entry];

  if (toStatus === 'closed') {
    run.closedAt = entry.at;
    run.closedBy = entry.by;
    run.closureReason = meta.reason || 'escalation-resolved';
  }

  return run;
}

function isVerifiedEvidenceChain(finalValidation) {
  const chain = finalValidation?.evidenceChain;
  return chain?.resolution === 'consistent' && chain?.confidence === 'high';
}

function applyPostExecutionTransitions(run, { by, finalValidation } = {}) {
  appendStatusTransition(run, 'completed', { by, reason: 'all-steps-succeeded' });

  if (isVerifiedEvidenceChain(finalValidation)) {
    appendStatusTransition(run, 'verified', {
      by,
      reason: 'evidence-chain-consistent-high-confidence'
    });
  }

  return run;
}

function applyFailureTransition(run, { by, reason, failedStep } = {}) {
  if (failedStep) run.failedStep = failedStep;
  appendStatusTransition(run, 'failed', { by, reason: reason || 'step-failed' });
  return run;
}

function closeRemediationRun(run, meta = {}) {
  if (run.status !== 'verified') {
    throw new Error(`Remediation run must be verified before close (current: ${run.status})`);
  }
  return appendStatusTransition(run, 'closed', {
    by: meta.by,
    reason: meta.reason || 'escalation-resolved'
  });
}

module.exports = {
  REMEDIATION_STATES,
  ALLOWED_TRANSITIONS,
  canTransition,
  appendStatusTransition,
  isVerifiedEvidenceChain,
  applyPostExecutionTransitions,
  applyFailureTransition,
  closeRemediationRun
};
