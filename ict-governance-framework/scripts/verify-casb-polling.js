require('dotenv').config();

process.env.CASB_POLLING_DEMO = 'true';
process.env.CASB_MIN_RISK_SCORE = '0';

const { fetchAndIngestCasbDiscoveries } = require('../services/casb-polling-worker');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const result = await fetchAndIngestCasbDiscoveries({ pool, force: true, createIncident: false });
  console.log('POLL RESULT', {
    received: result.received,
    ingested: result.ingested,
    skipped: result.skipped,
    ingestId: result.ingestId
  });

  if (!result.ingested || result.ingested < 1) {
    throw new Error('Expected at least one demo discovery ingested');
  }

  console.log('Action 5.1 CASB polling verification PASSED');
  await pool.end();
})().catch(async (err) => {
  console.error('FAILED:', err.message);
  await pool.end();
  process.exit(1);
});
