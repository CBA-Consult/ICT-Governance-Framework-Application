/**
 * Unit tests for governance state helpers (Aegis Control identity system).
 * Run: node tests/governance-state.test.js
 */
const assert = require('assert');

const {
  resolveGovernanceState,
  resolveRemediationLifecycleState,
  resolveEscalationEvidenceState,
  normalizeGovernanceState,
  getGovernanceStateConfig
} = require('../lib/governanceState');

function run() {
  assert.strictEqual(resolveGovernanceState({ resolution: 'divergent' }), 'divergent');
  assert.strictEqual(resolveGovernanceState({ resolution: 'partial' }), 'partial');
  assert.strictEqual(resolveGovernanceState({ resolution: 'consistent' }), 'consistent');
  assert.strictEqual(resolveGovernanceState(null), 'pending');

  assert.strictEqual(resolveRemediationLifecycleState('verified'), 'verified');
  assert.strictEqual(resolveRemediationLifecycleState('running'), 'running');
  assert.strictEqual(resolveRemediationLifecycleState('failed'), 'failed');
  assert.strictEqual(normalizeGovernanceState('remediating'), 'running');

  assert.strictEqual(
    resolveEscalationEvidenceState({
      evidenceChains: [{ resolution: 'consistent' }, { resolution: 'divergent' }]
    }),
    'divergent'
  );

  assert.strictEqual(getGovernanceStateConfig('verified').label, 'Verified');
  assert.strictEqual(getGovernanceStateConfig('unknown-state').label, 'Pending');

  console.log('governance-state.test.js: all assertions passed');
}

run();
