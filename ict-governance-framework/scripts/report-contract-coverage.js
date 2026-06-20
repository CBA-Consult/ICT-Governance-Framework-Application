#!/usr/bin/env node
/**
 * Contract coverage KPI — observable governance posture across seven pillars.
 *
 * Usage:
 *   npm run report:contract-coverage
 *   npm run report:contract-coverage -- --json
 */
const { buildContractCoverageReport } = require('../tests/regression-registry-contracts');

function statusIcon(status) {
  return status === 'active' ? '✅' : '⏳';
}

function formatPillarLabel(pillar) {
  return pillar.charAt(0).toUpperCase() + pillar.slice(1);
}

function printReport(report) {
  console.log('\nContract Coverage Report');
  console.log('------------------------');

  const nameWidth = Math.max(...report.pillars.map((p) => p.pillar.length), 6);

  for (const row of report.pillars) {
    const name = formatPillarLabel(row.pillar).padEnd(nameWidth);
    const slug = row.contractSlug ? ` (${row.contractSlug})` : '';
    const tests =
      row.realTestCount === 0
        ? '0 tests'
        : `${row.realTestCount} test${row.realTestCount === 1 ? '' : 's'}`;
    const todos = row.todoTestCount > 0 ? `, ${row.todoTestCount} todo` : '';
    const state = row.status === 'active' ? 'active' : 'pending';
    console.log(
      `${name}${slug}  ${statusIcon(row.status)} ${state.padEnd(7)} (${tests}${todos})`
    );
    if (row.status === 'pending' && row.realTestCount > 0) {
      console.log(`         ↳ ${row.activationReason}`);
    }
  }

  console.log('');
  console.log(
    `Coverage: ${report.activeCount} / ${report.totalPillars} pillars (${report.coveragePct.toFixed(1)}%)`
  );
  console.log(
    `Tests:    ${report.totalRealTests} enforced, ${report.totalTodoTests} planned (todo)`
  );
  console.log(
    `Gate:     active when >= ${report.minRealTestsForActive} real tests or @contract readiness:enforced`
  );
  console.log('');
}

function main() {
  const json = process.argv.includes('--json');
  const report = buildContractCoverageReport();

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printReport(report);
}

main();
