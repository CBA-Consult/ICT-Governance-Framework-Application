/**
 * Central regression registry — run after feature work to catch silent cross-pillar breakage.
 *
 * Jest contract suites are **auto-discovered** from tests/contracts/*.contract.test.js
 * (see regression-registry-contracts.js). Legacy verify:* scripts are listed below.
 *
 * Validate completeness: npm run validate:registry
 * Full post-feature gate: npm run verify:post-feature
 */

const { discoverContractSuites } = require('./regression-registry-contracts');

/** @typedef {'jest-contract' | 'legacy-verify'} SuiteKind */
/** @typedef {'active' | 'pending' | 'skipped'} SuiteStatus */
/** @typedef {'pillar' | 'cross-cutting'} SuiteScope */

/**
 * @typedef {object} RegressionSuite
 * @property {string} id
 * @property {string} label
 * @property {string|null} pillar identity|devices|software|network|data|secops|resilience|null
 * @property {SuiteKind} kind
 * @property {string} npmScript package.json script name (without "npm run")
 * @property {string[]} [setup] optional setup:* scripts before the suite
 * @property {string} [contractFile] path relative to ict-governance-framework/
 * @property {SuiteStatus} status
 * @property {SuiteScope} scope
 * @property {{ database?: boolean, api?: boolean }} requires
 */

/** @type {RegressionSuite[]} */
const LEGACY_SUITES = [
  {
    id: 'verify-jit',
    label: 'JIT elevation enforcement',
    pillar: 'identity',
    kind: 'legacy-verify',
    npmScript: 'verify:jit',
    status: 'active',
    scope: 'cross-cutting',
    requires: { database: true }
  },
  {
    id: 'verify-break-glass',
    label: 'Break-glass privileged action hook',
    pillar: 'identity',
    kind: 'legacy-verify',
    npmScript: 'verify:break-glass',
    status: 'active',
    scope: 'cross-cutting',
    requires: { database: true }
  },
  {
    id: 'verify-secops',
    label: 'SecOps incident ingest lifecycle',
    pillar: 'secops',
    kind: 'legacy-verify',
    npmScript: 'verify:secops',
    status: 'active',
    scope: 'pillar',
    requires: { database: true }
  },
  {
    id: 'verify-calibration',
    label: 'FAIR risk calibration governance',
    pillar: 'secops',
    kind: 'legacy-verify',
    npmScript: 'verify:calibration',
    status: 'active',
    scope: 'pillar',
    requires: { database: true }
  },
  {
    id: 'verify-assets',
    label: 'Cloud asset register sync smoke',
    pillar: 'devices',
    kind: 'legacy-verify',
    npmScript: 'verify:assets',
    setup: ['setup:assets'],
    status: 'active',
    scope: 'cross-cutting',
    requires: { database: true, api: true }
  },
  {
    id: 'verify-gb2',
    label: 'G-B2 incident ↔ asset correlation',
    pillar: 'devices',
    kind: 'legacy-verify',
    npmScript: 'verify:gb2',
    status: 'active',
    scope: 'cross-cutting',
    requires: { database: true, api: true }
  },
  {
    id: 'verify-gb3',
    label: 'G-B3 DR recovery posture',
    pillar: 'resilience',
    kind: 'legacy-verify',
    npmScript: 'verify:gb3',
    status: 'active',
    scope: 'pillar',
    requires: { database: true, api: true }
  },
  {
    id: 'verify-fair-risk',
    label: 'FAIR risk engine',
    pillar: 'secops',
    kind: 'legacy-verify',
    npmScript: 'verify:fair-risk',
    status: 'active',
    scope: 'cross-cutting',
    requires: { database: true }
  },
  {
    id: 'verify-analytics',
    label: 'Analytics reconciliation',
    pillar: 'data',
    kind: 'legacy-verify',
    npmScript: 'verify:analytics',
    status: 'active',
    scope: 'cross-cutting',
    requires: { database: true }
  },
  {
    id: 'verify-casb-ingest',
    label: 'CASB bulk shadow IT ingest smoke',
    pillar: 'software',
    kind: 'legacy-verify',
    npmScript: 'verify:casb-ingest',
    setup: ['setup:software-casb'],
    status: 'active',
    scope: 'cross-cutting',
    requires: { database: true, api: true }
  },
  {
    id: 'verify-cross-pillar',
    label: 'Cross-pillar governance invariants (QG-601)',
    pillar: null,
    kind: 'legacy-verify',
    npmScript: 'verify:cross-pillar',
    setup: ['setup:software-casb', 'setup:managed-devices'],
    status: 'active',
    scope: 'cross-cutting',
    requires: { database: true }
  }
];

function buildRegressionSuites() {
  const contractSuites = discoverContractSuites();
  const ids = new Set();
  for (const suite of [...contractSuites, ...LEGACY_SUITES]) {
    if (ids.has(suite.id)) {
      throw new Error(`Duplicate regression suite id: ${suite.id}`);
    }
    ids.add(suite.id);
  }
  return [...contractSuites, ...LEGACY_SUITES];
}

const REGRESSION_SUITES = buildRegressionSuites();

module.exports = { REGRESSION_SUITES, LEGACY_SUITES, discoverContractSuites };
