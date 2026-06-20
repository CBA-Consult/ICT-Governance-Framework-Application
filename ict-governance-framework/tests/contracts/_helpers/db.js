const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for contract tests');
  }
  return process.env.DATABASE_URL;
}

function createPool() {
  return new Pool({ connectionString: requireDatabaseUrl() });
}

async function applySqlFiles(pool, relativePaths) {
  const sqlDir = path.join(__dirname, '..', '..', '..', 'sql');
  for (const file of relativePaths) {
    const fullPath = path.join(sqlDir, file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing SQL fixture: ${file}`);
    }
    await pool.query(fs.readFileSync(fullPath, 'utf8'));
  }
}

async function ensureTenant(pool, tenantId = 'tenant-01', name = 'Contoso Health') {
  await pool.query(
    `
    INSERT INTO tenants (tenant_id, name, classification)
    VALUES ($1, $2, 'Healthcare')
    ON CONFLICT (tenant_id) DO NOTHING
    `,
    [tenantId, name]
  );
}

module.exports = {
  requireDatabaseUrl,
  createPool,
  applySqlFiles,
  ensureTenant
};
