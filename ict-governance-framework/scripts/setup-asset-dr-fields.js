#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schemaPath = path.join(__dirname, '..', 'sql', 'asset_dr_fields.sql');

async function main() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    const col = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'asset_register' AND column_name = 'dr_status'
    `);
    console.log(`Asset DR fields applied. dr_status column present: ${col.rows.length > 0}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Asset DR schema setup failed:', err.message);
  process.exit(1);
});
