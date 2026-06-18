#!/usr/bin/env node
/**
 * Apply Gate A governance schema (compliance_controls, governance_incidents, tenants)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schemaPath = path.join(__dirname, '..', 'sql', 'governance.sql');

async function main() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    const controls = await client.query('SELECT COUNT(*)::int AS c FROM compliance_controls');
    const tenants = await client.query('SELECT COUNT(*)::int AS c FROM tenants');
    console.log(`Governance schema applied. Controls: ${controls.rows[0].c}, Tenants: ${tenants.rows[0].c}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Governance schema setup failed:', err.message);
  process.exit(1);
});
