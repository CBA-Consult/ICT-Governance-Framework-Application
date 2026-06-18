#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schemaPath = path.join(__dirname, '..', 'sql', 'incident_asset_binding.sql');

async function main() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    const col = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'governance_incidents' AND column_name = 'asset_id'
    `);
    console.log(`G-B2 schema applied. asset_id column present: ${col.rows.length > 0}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('G-B2 schema setup failed:', err.message);
  process.exit(1);
});
