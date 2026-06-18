#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schemaPath = path.join(__dirname, '..', 'sql', 'casb_shadow_fields.sql');

async function main() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    const col = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'asset_register' AND column_name = 'asset_origin'
    `);
    console.log(`CASB shadow fields applied. asset_origin column present: ${col.rows.length > 0}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('CASB shadow schema setup failed:', err.message);
  process.exit(1);
});
