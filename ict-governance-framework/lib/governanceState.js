/**
 * Aegis Control — governance state semantics (identity system enforcement).
 * @see docs/design/Aegis-Control-Identity.md
 */

const GOVERNANCE_STATE_CONFIG = Object.freeze({
  verified: {
    label: 'Verified',
    bgClass: 'bg-emerald-500 dark:bg-emerald-600',
    textClass: 'text-white',
    borderClass: 'border-emerald-600 dark:border-emerald-500'
  },
  consistent: {
    label: 'Consistent',
    bgClass: 'bg-emerald-500 dark:bg-emerald-600',
    textClass: 'text-white',
    borderClass: 'border-emerald-600 dark:border-emerald-500'
  },
  closed: {
    label: 'Closed',
    bgClass: 'bg-emerald-600 dark:bg-emerald-700',
    textClass: 'text-white',
    borderClass: 'border-emerald-700 dark:border-emerald-600'
  },
  divergent: {
    label: 'Divergent',
    bgClass: 'bg-rose-500 dark:bg-rose-600',
    textClass: 'text-white',
    borderClass: 'border-rose-600 dark:border-rose-500'
  },
  failed: {
    label: 'Failed',
    bgClass: 'bg-rose-600 dark:bg-rose-700',
    textClass: 'text-white',
    borderClass: 'border-rose-700 dark:border-rose-600'
  },
  partial: {
    label: 'Partial',
    bgClass: 'bg-amber-400 dark:bg-amber-500',
    textClass: 'text-amber-950 dark:text-amber-950',
    borderClass: 'border-amber-500 dark:border-amber-400'
  },
  running: {
    label: 'Remediating',
    bgClass: 'bg-blue-500 dark:bg-blue-600',
    textClass: 'text-white',
    borderClass: 'border-blue-600 dark:border-blue-500'
  },
  completed: {
    label: 'Completed',
    bgClass: 'bg-blue-500 dark:bg-blue-600',
    textClass: 'text-white',
    borderClass: 'border-blue-600 dark:border-blue-500'
  },
  pending: {
    label: 'Pending',
    bgClass: 'bg-slate-500 dark:bg-slate-600',
    textClass: 'text-white',
    borderClass: 'border-slate-600 dark:border-slate-500'
  },
  'awaiting-approval': {
    label: 'Awaiting approval',
    bgClass: 'bg-slate-500 dark:bg-slate-600',
    textClass: 'text-white',
    borderClass: 'border-slate-600 dark:border-slate-500'
  },
  onboarding: {
    label: 'Onboarding',
    bgClass: 'bg-amber-400 dark:bg-amber-500',
    textClass: 'text-amber-950 dark:text-amber-950',
    borderClass: 'border-amber-500 dark:border-amber-400'
  },
  active: {
    label: 'Active',
    bgClass: 'bg-emerald-600 dark:bg-emerald-700',
    textClass: 'text-white',
    borderClass: 'border-emerald-700 dark:border-emerald-600'
  },
  suspended: {
    label: 'Suspended',
    bgClass: 'bg-rose-600 dark:bg-rose-700',
    textClass: 'text-white',
    borderClass: 'border-rose-700 dark:border-rose-600'
  }
});

const STATE_ALIASES = Object.freeze({
  remediating: 'running',
  unknown: 'pending',
  'non-compliant': 'divergent',
  compliant: 'consistent',
  enabled: 'active',
  disabled: 'suspended'
});

function normalizeGovernanceState(state) {
  if (!state || typeof state !== 'string') return 'pending';
  const key = state.trim().toLowerCase();
  return STATE_ALIASES[key] || key;
}

function resolveGovernanceState(evidenceChain) {
  if (!evidenceChain?.resolution) return 'pending';
  const resolution = normalizeGovernanceState(evidenceChain.resolution);
  if (resolution === 'consistent') return 'consistent';
  if (resolution === 'divergent') return 'divergent';
  if (resolution === 'partial') return 'partial';
  return 'pending';
}

function resolveRemediationLifecycleState(status) {
  const normalized = normalizeGovernanceState(status);
  if (GOVERNANCE_STATE_CONFIG[normalized]) return normalized;
  return 'pending';
}

function getGovernanceStateConfig(state) {
  const key = resolveRemediationLifecycleState(state);
  return GOVERNANCE_STATE_CONFIG[key] || GOVERNANCE_STATE_CONFIG.pending;
}

function resolveEscalationEvidenceState(escalation) {
  const chains = escalation?.evidenceChains || [];
  if (chains.some((c) => c.resolution === 'divergent')) return 'divergent';
  if (chains.some((c) => c.resolution === 'partial')) return 'partial';
  if (chains.some((c) => c.resolution === 'consistent')) return 'consistent';
  return 'pending';
}

module.exports = {
  GOVERNANCE_STATE_CONFIG,
  normalizeGovernanceState,
  resolveGovernanceState,
  resolveRemediationLifecycleState,
  getGovernanceStateConfig,
  resolveEscalationEvidenceState
};
