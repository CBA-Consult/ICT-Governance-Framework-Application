#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sqlDir = path.join(__dirname, '..', 'sql');

async function main() {
  const client = await pool.connect();
  try {
    for (const file of ['fair_model_calibration.sql', 'fair_calibration_governance.sql']) {
      await client.query(fs.readFileSync(path.join(sqlDir, file), 'utf8'));
    }
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'fair_risk_scenarios' AND column_name IN ('calibration_locked', 'tef_calibration_factor')
    `);
    const approvals = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_name = 'fair_calibration_approvals'
    `);
    console.log(`FAIR calibration + governance schema applied. scenario cols: ${cols.rows.length}, approvals table: ${approvals.rows.length > 0}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('FAIR calibration setup failed:', err.message);
  process.exit(1);
});
