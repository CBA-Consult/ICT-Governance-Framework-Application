#!/usr/bin/env node
/**
 * Apply G-B1 asset register schema (FR-GOV-004)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schemaPath = path.join(__dirname, '..', 'sql', 'assets.sql');

async function main() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    const count = await client.query('SELECT COUNT(*)::int AS c FROM asset_register');
    console.log(`Asset register schema applied. Current assets: ${count.rows[0].c}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Asset schema setup failed:', err.message);
  process.exit(1);
});
