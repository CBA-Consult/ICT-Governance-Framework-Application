#!/usr/bin/env node
/**
 * Remove legacy untagged verification/test artifacts from operational tables.
 * Ingest audit logs are marked rolled_back_at, not deleted.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const { cleanupLegacyVerificationArtifacts } = require('../services/verification-checkpoint');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const summary = await cleanupLegacyVerificationArtifacts(pool);
    console.log('Legacy verification cleanup complete:', summary);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Legacy verification cleanup failed:', err.message);
  process.exit(1);
});
