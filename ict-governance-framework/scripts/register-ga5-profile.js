#!/usr/bin/env node
/**
 * Register G-A5 NIST CSF 2.0 Organisational Profile in compliance_controls
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PROFILE_CONTROL = {
  control_id: 'GV.OC.01',
  framework: 'NIST_CSF_2.0',
  category: 'GOVERN',
  name: 'Organizational Profile Establishment',
  implementation_status: 'Implemented',
  code_evidence_url:
    'https://github.com/CBA-Consult/ICT-Governance-Framework-Application/tree/main/docs/compliance/NIST-CSF-2.0-Organisational-Profile.md',
  notes:
    'Formal organizational profile published and mapped to current state framework capabilities (Gate A G-A5).'
};

async function main() {
  const { rows } = await pool.query(
    `
    INSERT INTO compliance_controls (
      control_id, framework, category, name, implementation_status, code_evidence_url, notes, last_evaluated
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    ON CONFLICT (control_id) DO UPDATE SET
      framework = EXCLUDED.framework,
      category = EXCLUDED.category,
      name = EXCLUDED.name,
      implementation_status = EXCLUDED.implementation_status,
      code_evidence_url = EXCLUDED.code_evidence_url,
      notes = EXCLUDED.notes,
      last_evaluated = CURRENT_TIMESTAMP
    RETURNING control_id, implementation_status
    `,
    [
      PROFILE_CONTROL.control_id,
      PROFILE_CONTROL.framework,
      PROFILE_CONTROL.category,
      PROFILE_CONTROL.name,
      PROFILE_CONTROL.implementation_status,
      PROFILE_CONTROL.code_evidence_url,
      PROFILE_CONTROL.notes
    ]
  );

  console.log(`G-A5 registered: ${rows[0].control_id} → ${rows[0].implementation_status}`);
  await pool.end();
}

main().catch((err) => {
  console.error('G-A5 registration failed:', err.message);
  process.exit(1);
});
