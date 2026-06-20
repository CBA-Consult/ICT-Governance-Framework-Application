#!/usr/bin/env node
/**
 * Fail if contract discovery breaks or registry entries point at missing files/scripts.
 * Contract suites are auto-discovered — add *.contract.test.js + test:contracts:<pillar>.
 */
const fs = require('fs');
const path = require('path');
const {
  discoverContractSuites,
  listContractFiles
} = require('../tests/regression-registry-contracts');
const { REGRESSION_SUITES } = require('../tests/regression-registry');
const packageJson = require('../package.json');

const ROOT = path.join(__dirname, '..');

function main() {
  const errors = [];
  const warnings = [];
  const contractFiles = listContractFiles().map((f) => f.contractFile);
  const discovered = discoverContractSuites();
  const discoveredByFile = new Map(discovered.map((s) => [s.contractFile, s]));

  for (const file of contractFiles) {
    if (!discoveredByFile.has(file)) {
      errors.push(`Contract file not discovered: ${file}`);
    }
  }

  const seenIds = new Set();
  for (const suite of REGRESSION_SUITES) {
    if (seenIds.has(suite.id)) {
      errors.push(`Duplicate registry id: ${suite.id}`);
    }
    seenIds.add(suite.id);

    if (!packageJson.scripts[suite.npmScript]) {
      errors.push(`Suite "${suite.id}" references missing npm script: ${suite.npmScript}`);
    }

    if (suite.setup) {
      for (const setup of suite.setup) {
        if (!packageJson.scripts[setup]) {
          errors.push(`Suite "${suite.id}" references missing setup script: ${setup}`);
        }
      }
    }

    if (suite.contractFile) {
      const fullPath = path.join(ROOT, suite.contractFile);
      if (!fs.existsSync(fullPath)) {
        errors.push(`Suite "${suite.id}" contractFile not found: ${suite.contractFile}`);
      }
    }
  }

  const activeContracts = discovered.filter((s) => s.status === 'active');
  const pendingContracts = discovered.filter((s) => s.status === 'pending');

  for (const suite of pendingContracts) {
    if (suite._realTestCount > 0) {
      warnings.push(
        `${suite.contractFile} has ${suite._realTestCount} test(s) but is pending: ${suite._activationReason}`
      );
    }
  }

  if (errors.length) {
    console.error('Regression registry validation FAILED:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error('\nFix package.json scripts or @contract headers in tests/contracts/.');
    process.exit(1);
  }

  console.log('Regression registry OK\n');
  console.log(`  Contract files:     ${contractFiles.length} (${activeContracts.length} active, ${pendingContracts.length} pending)`);
  console.log(`  Legacy suites:      ${REGRESSION_SUITES.length - discovered.length}`);
  console.log(`  verify:post-feature: ${REGRESSION_SUITES.filter((s) => s.status === 'active').length} active suite(s)\n`);

  if (pendingContracts.length) {
    const todoOnly = pendingContracts.filter((s) => !s._realTestCount);
    const underThreshold = pendingContracts.filter((s) => s._realTestCount > 0);
    if (todoOnly.length) {
      console.log('Pending contract suites (todo-only — not in verify:post-feature):');
      for (const suite of todoOnly) {
        console.log(`  - ${suite.contractFile}`);
      }
      console.log('');
    }
    if (underThreshold.length) {
      console.log('Pending contract suites (under activation threshold):');
      for (const suite of underThreshold) {
        console.log(`  - ${suite.contractFile} — ${suite._activationReason}`);
      }
      console.log('');
    }
  }

  console.log('Run npm run report:contract-coverage for full pillar KPI.\n');

  if (warnings.length) {
    for (const w of warnings) console.warn(`  WARN ${w}`);
  }
}

main();
