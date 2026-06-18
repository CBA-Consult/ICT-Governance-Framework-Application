#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schemaPath = path.join(__dirname, '..', 'sql', 'incident_lifecycle.sql');

async function main() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    const wf = await client.query(`SELECT to_regclass('public.incident_workflow_events') AS present`);
    console.log(`Incident lifecycle schema applied. workflow_events: ${wf.rows[0].present !== null}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Incident lifecycle setup failed:', err.message);
  process.exit(1);
});
