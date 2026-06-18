#!/usr/bin/env node
/**
 * Apply optional enterprise schemas (data management, notifications/alerts).
 * Required for MDM, data transformation, and escalation monitoring — not for Gate A governance.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const root = path.join(__dirname, '..');

const SCHEMA_FILES = [
  'db-data-management-schema.sql',
  'db-notifications-schema.sql'
];

const PATCH_SQL = `
ALTER TABLE workflow_approvals
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS escalation_reason TEXT;
`;

async function applyFile(client, filename) {
  const filePath = path.join(root, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip missing file: ${filename}`);
    return;
  }
  const sql = fs.readFileSync(filePath, 'utf8');
  await client.query(sql);
  console.log(`Applied: ${filename}`);
}

async function main() {
  const client = await pool.connect();
  try {
    for (const file of SCHEMA_FILES) {
      await applyFile(client, file);
    }
    await client.query(PATCH_SQL);
    console.log('Applied: workflow_approvals escalation columns');

    const checks = await client.query(`
      SELECT
        to_regclass('public.master_data_entities') IS NOT NULL AS mdm,
        to_regclass('public.data_transformation_rules') IS NOT NULL AS transform,
        to_regclass('public.alerts') IS NOT NULL AS alerts
    `);
    const row = checks.rows[0];
    console.log(`Enterprise schema status — MDM: ${row.mdm}, transform: ${row.transform}, alerts: ${row.alerts}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Enterprise schema setup failed:', err.message);
  process.exit(1);
});
