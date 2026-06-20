#!/usr/bin/env node
/**
 * Run the regression registry — post-feature gate against silent cross-pillar breakage.
 *
 * Usage:
 *   node scripts/run-regression-registry.js              # active suites (default)
 *   node scripts/run-regression-registry.js --contracts  # Jest contracts only
 *   node scripts/run-regression-registry.js --pillar devices
 *   node scripts/run-regression-registry.js --skip-api   # skip suites needing live API
 *   node scripts/run-regression-registry.js --no-checkpoint
 *   node scripts/run-regression-registry.js --list       # print registry, no run
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const path = require('path');
const { Pool } = require('pg');
const { REGRESSION_SUITES } = require('../tests/regression-registry');
const {
  createVerificationCheckpoint,
  rollbackVerificationCheckpoint
} = require('../services/verification-checkpoint');

const ROOT = path.join(__dirname, '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

function parseArgs(argv) {
  const opts = {
    contractsOnly: false,
    pillar: null,
    skipApi: false,
    includePending: false,
    list: false,
    noCheckpoint: false,
    ids: []
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--contracts' || arg === '--contracts-only') {
      opts.contractsOnly = true;
    } else if (arg === '--skip-api') {
      opts.skipApi = true;
    } else if (arg === '--include-pending') {
      opts.includePending = true;
    } else if (arg === '--no-checkpoint') {
      opts.noCheckpoint = true;
    } else if (arg === '--list') {
      opts.list = true;
    } else if (arg === '--pillar' && argv[i + 1]) {
      opts.pillar = argv[++i].toLowerCase();
    } else if (arg === '--id' && argv[i + 1]) {
      opts.ids.push(argv[++i]);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return opts;
}

function printHelp() {
  console.log(`
Regression registry runner

  npm run verify:post-feature          Validate registry + checkpointed regression run
  npm run verify:registry:contracts    Jest contracts only (fast, no live API)
  npm run validate:registry            Ensure every contract file is registered
  npm run cleanup:verification-runs    Remove legacy untagged test artifacts

Flags (pass after --):
  --contracts          Jest contract suites only
  --pillar <name>      Filter to one pillar (+ cross-cutting when not filtering by pillar)
  --skip-api           Skip suites that require API on :4000
  --include-pending    Run pending (not yet implemented) suites too
  --no-checkpoint      Skip signed checkpoint / rollback (not recommended)
  --id <suite-id>      Run specific suite(s), repeatable
  --list               Print registry table and exit
`);
}

function filterSuites(opts) {
  return REGRESSION_SUITES.filter((suite) => {
    if (opts.ids.length && !opts.ids.includes(suite.id)) return false;
    if (opts.contractsOnly && suite.kind !== 'jest-contract') return false;
    if (opts.pillar && suite.pillar !== opts.pillar && suite.scope !== 'cross-cutting') return false;
    if (opts.skipApi && suite.requires?.api) return false;
    if (suite.status === 'skipped') return false;
    if (suite.status === 'pending' && !opts.includePending) return false;
    return suite.status === 'active' || (suite.status === 'pending' && opts.includePending);
  });
}

function runNpmScript(scriptName, env) {
  const result = spawnSync(npmCmd, ['run', scriptName], {
    cwd: ROOT,
    stdio: 'inherit',
    env,
    shell: isWin
  });
  return result.status === 0;
}

function printRegistryTable(suites) {
  console.log('\nRegression registry\n');
  console.log(
    ['ID'.padEnd(24), 'STATUS'.padEnd(8), 'KIND'.padEnd(14), 'PILLAR'.padEnd(12), 'LABEL'].join(' ')
  );
  console.log('-'.repeat(90));
  for (const suite of suites) {
    console.log(
      [
        suite.id.padEnd(24),
        suite.status.padEnd(8),
        suite.kind.padEnd(14),
        (suite.pillar || '-').padEnd(12),
        suite.label
      ].join(' ')
    );
  }
  console.log('');
}

function ensureDatabaseUrl(suites) {
  const needsDb = suites.some((s) => s.requires?.database);
  if (needsDb && !process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required for the selected regression suites.');
    process.exit(1);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const suites = filterSuites(opts);

  if (opts.list) {
    printRegistryTable(REGRESSION_SUITES);
    return;
  }

  if (suites.length === 0) {
    console.error('No regression suites matched the current filters.');
    process.exit(1);
  }

  ensureDatabaseUrl(suites);

  const verificationRunId = crypto.randomUUID();
  const childEnv = {
    ...process.env,
    VERIFICATION_RUN_ID: verificationRunId
  };

  let pool;
  let checkpoint = null;
  const useCheckpoint = !opts.noCheckpoint && !!process.env.DATABASE_URL;

  if (useCheckpoint) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    checkpoint = await createVerificationCheckpoint(pool, {
      verificationRunId,
      trigger: opts.contractsOnly ? 'verify:registry:contracts' : 'verify:post-feature'
    });
    console.log(
      `\n[VB-CP] Checkpoint ${checkpoint.checkpointId} (run ${verificationRunId})`
    );
    console.log(`[VB-CP] Manifest hash: ${checkpoint.manifestHash}\n`);
  }

  console.log(`Regression registry — running ${suites.length} suite(s)\n`);

  const results = [];
  let suitesFailed = false;

  try {
    for (const suite of suites) {
      const started = Date.now();
      console.log(`\n▶ ${suite.id} — ${suite.label}`);

      if (suite.setup?.length) {
        let setupFailed = false;
        for (const setupScript of suite.setup) {
          console.log(`  setup: ${setupScript}`);
          const setupOk = runNpmScript(setupScript, childEnv);
          if (!setupOk) {
            setupFailed = true;
            break;
          }
        }
        if (setupFailed) {
          results.push({
            id: suite.id,
            label: suite.label,
            ok: false,
            ms: Date.now() - started,
            error: 'setup script failed'
          });
          suitesFailed = true;
          continue;
        }
      }

      if (suite.requires?.api) {
        console.log('  note: requires API server on port 4000 (npm run server)');
      }

      const ok = runNpmScript(suite.npmScript, childEnv);
      if (!ok) suitesFailed = true;
      results.push({
        id: suite.id,
        label: suite.label,
        ok,
        ms: Date.now() - started,
        error: ok ? null : `npm run ${suite.npmScript} failed`
      });
    }
  } finally {
    if (useCheckpoint && checkpoint && pool) {
      try {
        const rollback = await rollbackVerificationCheckpoint(pool, {
          checkpointId: checkpoint.checkpointId,
          verificationRunId: checkpoint.verificationRunId,
          manifest: checkpoint.manifest,
          manifestHash: checkpoint.manifestHash,
          trigger: opts.contractsOnly ? 'verify:registry:contracts' : 'verify:post-feature'
        });
        console.log('\n[VB-CP] Rollback attestation:', rollback.rollbackHash);
        console.log('[VB-CP] Operational summary:', rollback.summary);
      } catch (rollbackErr) {
        console.error('[VB-CP] Rollback failed:', rollbackErr.message);
        suitesFailed = true;
      } finally {
        await pool.end();
      }
    }
  }

  console.log('\n' + '='.repeat(72));
  console.log('Regression summary\n');
  for (const r of results) {
    const mark = r.ok ? 'PASS' : 'FAIL';
    console.log(`  [${mark}] ${r.id} (${(r.ms / 1000).toFixed(1)}s)${r.error ? ` — ${r.error}` : ''}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed\n`);

  if (failed.length || suitesFailed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Regression registry runner failed:', err.message);
  process.exit(1);
});
