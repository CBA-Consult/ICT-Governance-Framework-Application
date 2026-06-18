#!/usr/bin/env node
/**
 * Apply Sprint A SecOps control schema (correlation_id, ingest log, SLA columns)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schemaPath = path.join(__dirname, '..', 'sql', 'incident_secops_controls.sql');

async function main() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    const col = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'governance_incidents' AND column_name = 'correlation_id'
    `);
    const log = await client.query(`
      SELECT to_regclass('public.governance_incident_ingest_log') AS present
    `);
    console.log(`SecOps controls applied. correlation_id column: ${col.rows.length > 0}`);
    console.log(`governance_incident_ingest_log present: ${log.rows[0].present !== null}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('SecOps controls setup failed:', err.message);
  process.exit(1);
});
