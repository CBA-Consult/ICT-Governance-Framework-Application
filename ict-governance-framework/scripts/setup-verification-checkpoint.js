#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schemaPath = path.join(__dirname, '..', 'sql', 'verification_checkpoint.sql');

async function main() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    const count = await client.query('SELECT COUNT(*)::int AS c FROM verification_checkpoint_ledger');
    console.log(`Verification checkpoint schema applied. Ledger entries: ${count.rows[0].c}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Verification checkpoint schema setup failed:', err.message);
  process.exit(1);
});
