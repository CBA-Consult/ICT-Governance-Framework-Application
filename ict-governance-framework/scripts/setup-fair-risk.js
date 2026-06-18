#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schemaPath = path.join(__dirname, '..', 'sql', 'fair_risk_models.sql');

async function main() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    const table = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name = 'fair_risk_scenarios'
    `);
    console.log(`FAIR risk schema applied. fair_risk_scenarios present: ${table.rows.length > 0}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('FAIR risk schema setup failed:', err.message);
  process.exit(1);
});
