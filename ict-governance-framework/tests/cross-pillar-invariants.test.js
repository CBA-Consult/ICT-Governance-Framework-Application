/**
 * Cross-pillar governance invariants (QG-601) — consistency across Identity, Devices, Software, SecOps.
 * Run last in verify:post-feature, before VB-CP rollback.
 */
require('dotenv').config();
const { Pool } = require('pg');
const { runCrossPillarInvariants } = require('../services/cross-pillar-invariants');

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required for cross-pillar invariants');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const softwareTable = await pool.query(`SELECT to_regclass('public.software_casb_events') AS present`);
    if (!softwareTable.rows[0]?.present) {
      console.log('SKIP: software_casb_events not present — run npm run setup:software-casb');
      process.exit(0);
    }

    const { ok, verificationRunId, results } = await runCrossPillarInvariants(pool);

    console.log('\nCross-pillar invariants (QG-601)\n');
    if (verificationRunId) {
      console.log(`Scope: verification_run_id = ${verificationRunId}\n`);
    } else {
      console.log('Scope: tagged verification rows only (set VERIFICATION_RUN_ID for full gate)\n');
    }

    let passed = 0;
    let failed = 0;

    for (const result of results) {
      const mark = result.ok ? 'PASS' : 'FAIL';
      console.log(`[${mark}] ${result.id} — ${result.name}`);
      if (!result.ok) {
        failed += 1;
        for (const violation of result.violations) {
          console.error('       violation:', JSON.stringify(violation));
        }
      } else {
        passed += 1;
      }
    }

    console.log(`\nCross-pillar invariants: ${passed} passed, ${failed} failed\n`);

    if (!ok) {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
})().catch((err) => {
  console.error('Cross-pillar invariant runner failed:', err.message);
  process.exit(1);
});
