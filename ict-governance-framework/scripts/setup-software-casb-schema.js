#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sqlDir = path.join(__dirname, '..', 'sql');

async function applyFile(client, fileName) {
  const fullPath = path.join(sqlDir, fileName);
  await client.query(fs.readFileSync(fullPath, 'utf8'));
}

async function main() {
  const client = await pool.connect();
  try {
    await applyFile(client, 'assets.sql');
    await applyFile(client, 'casb_shadow_fields.sql');
    await applyFile(client, 'software_casb_events.sql');
    const check = await client.query(`
      SELECT to_regclass('public.software_casb_events') AS present
    `);
    console.log(`Software CASB schema applied. software_casb_events present: ${!!check.rows[0].present}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Software CASB schema setup failed:', err.message);
  process.exit(1);
});
