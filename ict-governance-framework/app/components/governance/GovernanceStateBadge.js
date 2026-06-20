'use client';

import {
  getGovernanceStateConfig,
  normalizeGovernanceState,
  resolveRemediationLifecycleState
} from '../../../lib/governanceState';

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm'
};

/**
 * Renders a governance state badge aligned to Aegis Control identity semantics.
 * @param {{ state: string, size?: 'sm' | 'md', confidence?: string, className?: string, label?: string }} props
 */
export default function GovernanceStateBadge({
  state,
  size = 'sm',
  confidence,
  className = '',
  label
}) {
  const key = resolveRemediationLifecycleState(normalizeGovernanceState(state));
  const config = getGovernanceStateConfig(key);
  const displayLabel = label || config.label;

  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-md border capitalize',
        SIZE_CLASSES[size] || SIZE_CLASSES.sm,
        config.bgClass,
        config.textClass,
        config.borderClass,
        className
      ].join(' ')}
      title={`Governance state: ${displayLabel}${confidence ? ` · ${confidence}` : ''}`}
    >
      {displayLabel}
      {confidence && (
        <span className="opacity-90 ml-1 normal-case font-normal">· {confidence}</span>
      )}
    </span>
  );
}
