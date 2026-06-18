// Seed missing default role_permissions from db-schema.sql
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ROLE_PERMISSIONS = {
  ROLE_SUPER_ADMIN: [
    'PERM_USER_CREATE', 'PERM_USER_READ', 'PERM_USER_UPDATE', 'PERM_USER_DELETE', 'PERM_USER_MANAGE_ROLES',
    'PERM_ROLE_CREATE', 'PERM_ROLE_READ', 'PERM_ROLE_UPDATE', 'PERM_ROLE_DELETE', 'PERM_ROLE_MANAGE_PERMISSIONS',
    'PERM_SYSTEM_ADMIN', 'PERM_SYSTEM_CONFIG', 'PERM_SYSTEM_AUDIT',
    'PERM_GOVERNANCE_READ', 'PERM_GOVERNANCE_MANAGE', 'PERM_COMPLIANCE_READ', 'PERM_COMPLIANCE_MANAGE',
    'PERM_FEEDBACK_CREATE', 'PERM_FEEDBACK_READ', 'PERM_FEEDBACK_MANAGE',
    'PERM_WORKFLOW_CREATE', 'PERM_WORKFLOW_READ', 'PERM_WORKFLOW_MANAGE',
    'PERM_APP_PROCUREMENT', 'PERM_APP_MANAGE',
    'PERM_DASHBOARD_EXECUTIVE', 'PERM_DASHBOARD_OPERATIONAL', 'PERM_DASHBOARD_COMPLIANCE',
    'PERM_DASHBOARD_ANALYTICS', 'PERM_DASHBOARD_EXPORT', 'PERM_DASHBOARD_ADMIN',
    'PERM_VIEW_SECURITY_METRICS', 'PERM_MANAGE_SECURITY_METRICS', 'PERM_SECURE_SCORE_SYNC', 'PERM_SECURE_SCORE_RECOMMENDATIONS'
  ],
  ROLE_ADMIN: [
    'PERM_USER_READ', 'PERM_USER_UPDATE', 'PERM_ROLE_READ', 'PERM_SYSTEM_CONFIG', 'PERM_SYSTEM_AUDIT',
    'PERM_GOVERNANCE_READ', 'PERM_GOVERNANCE_MANAGE', 'PERM_COMPLIANCE_READ', 'PERM_COMPLIANCE_MANAGE',
    'PERM_FEEDBACK_CREATE', 'PERM_FEEDBACK_READ', 'PERM_FEEDBACK_MANAGE',
    'PERM_WORKFLOW_CREATE', 'PERM_WORKFLOW_READ', 'PERM_WORKFLOW_MANAGE',
    'PERM_APP_PROCUREMENT', 'PERM_APP_MANAGE',
    'PERM_DASHBOARD_EXECUTIVE', 'PERM_DASHBOARD_OPERATIONAL', 'PERM_DASHBOARD_COMPLIANCE',
    'PERM_DASHBOARD_ANALYTICS', 'PERM_DASHBOARD_EXPORT',
    'PERM_VIEW_SECURITY_METRICS', 'PERM_MANAGE_SECURITY_METRICS', 'PERM_SECURE_SCORE_SYNC'
  ],
  ROLE_GOVERNANCE_MANAGER: [
    'PERM_USER_READ', 'PERM_GOVERNANCE_READ', 'PERM_GOVERNANCE_MANAGE', 'PERM_COMPLIANCE_READ',
    'PERM_FEEDBACK_READ', 'PERM_WORKFLOW_READ', 'PERM_WORKFLOW_MANAGE',
    'PERM_DASHBOARD_EXECUTIVE', 'PERM_DASHBOARD_OPERATIONAL', 'PERM_DASHBOARD_COMPLIANCE',
    'PERM_DASHBOARD_ANALYTICS', 'PERM_DASHBOARD_EXPORT', 'PERM_VIEW_SECURITY_METRICS'
  ],
  ROLE_COMPLIANCE_OFFICER: [
    'PERM_COMPLIANCE_READ', 'PERM_COMPLIANCE_MANAGE', 'PERM_GOVERNANCE_READ', 'PERM_FEEDBACK_READ',
    'PERM_DASHBOARD_OPERATIONAL', 'PERM_DASHBOARD_COMPLIANCE', 'PERM_DASHBOARD_ANALYTICS', 'PERM_DASHBOARD_EXPORT'
  ],
  ROLE_IT_MANAGER: [
    'PERM_GOVERNANCE_READ', 'PERM_WORKFLOW_READ', 'PERM_APP_PROCUREMENT', 'PERM_APP_MANAGE',
    'PERM_DASHBOARD_OPERATIONAL', 'PERM_DASHBOARD_ANALYTICS', 'PERM_DASHBOARD_EXPORT',
    'PERM_VIEW_SECURITY_METRICS', 'PERM_MANAGE_SECURITY_METRICS'
  ],
  ROLE_SECURITY_ANALYST: [
    'PERM_COMPLIANCE_READ', 'PERM_GOVERNANCE_READ',
    'PERM_DASHBOARD_OPERATIONAL', 'PERM_DASHBOARD_COMPLIANCE', 'PERM_DASHBOARD_ANALYTICS',
    'PERM_VIEW_SECURITY_METRICS', 'PERM_MANAGE_SECURITY_METRICS', 'PERM_SECURE_SCORE_SYNC'
  ],
  ROLE_AUDITOR: [
    'PERM_COMPLIANCE_READ', 'PERM_GOVERNANCE_READ', 'PERM_SYSTEM_AUDIT',
    'PERM_DASHBOARD_COMPLIANCE', 'PERM_DASHBOARD_ANALYTICS', 'PERM_VIEW_SECURITY_METRICS'
  ]
};

async function seedRolePermissions() {
  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;

  try {
    await client.query('BEGIN');

    for (const [roleId, permissionIds] of Object.entries(ROLE_PERMISSIONS)) {
      const roleExists = await client.query('SELECT 1 FROM roles WHERE role_id = $1', [roleId]);
      if (roleExists.rows.length === 0) {
        console.log(`Skipping ${roleId}: role not found`);
        continue;
      }

      for (const permissionId of permissionIds) {
        const permExists = await client.query('SELECT 1 FROM permissions WHERE permission_id = $1', [permissionId]);
        if (permExists.rows.length === 0) {
          console.log(`  Skipping missing permission: ${permissionId}`);
          skipped++;
          continue;
        }

        const result = await client.query(
          `INSERT INTO role_permissions (role_id, permission_id, is_active)
           VALUES ($1, $2, true)
           ON CONFLICT (role_id, permission_id) DO NOTHING
           RETURNING role_id`,
          [roleId, permissionId]
        );

        if (result.rows.length > 0) {
          inserted++;
        } else {
          skipped++;
        }
      }
    }

    await client.query('COMMIT');
    console.log(`Done. Inserted ${inserted} role_permissions, skipped ${skipped} existing/missing.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedRolePermissions().catch((error) => {
  console.error('Failed to seed role permissions:', error);
  process.exit(1);
});
