#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schemaPath = path.join(__dirname, '..', 'sql', 'mitre_enrichment.sql');
const mappingPath = path.join(__dirname, '..', 'sql', 'mitre_to_fair_mapping.sql');

async function main() {
  const client = await pool.connect();
  try {
    await client.query(fs.readFileSync(schemaPath, 'utf8'));
    await client.query(fs.readFileSync(mappingPath, 'utf8'));
    const col = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'governance_incidents' AND column_name = 'mitre_technique'
    `);
    const mapCount = await client.query(`SELECT COUNT(*)::int AS count FROM mitre_to_fair_mapping`);
    console.log(`MITRE enrichment schema applied. mitre_technique column: ${col.rows.length > 0}`);
    console.log(`MITRE → FAIR mapping rows: ${mapCount.rows[0]?.count ?? 0}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('MITRE enrichment setup failed:', err.message);
  process.exit(1);
});
