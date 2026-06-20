/**
 * Endpoint device registration — governance-first inventory (Devices pillar).
 */
const { Pool } = require('pg');
const { resolveVerificationRunId } = require('./verification-checkpoint');

const VALID_DEVICE_TYPES = ['laptop', 'desktop', 'server', 'mobile'];
const VALID_COMPLIANCE_STATUSES = ['pending', 'compliant', 'non_compliant'];
const DEFAULT_TENANT = 'tenant-01';

function createDeviceId() {
  return `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function mapDeviceRow(row) {
  if (!row) return null;
  return {
    id: row.device_id,
    hostname: row.hostname,
    ownerId: row.owner_id,
    deviceType: row.device_type,
    os: row.os,
    complianceStatus: row.compliance_status,
    tenantId: row.tenant_id,
    createdAt: row.registered_at,
    lastCheckedAt: row.last_compliance_check_at || null
  };
}

async function ownerExists(pool, ownerId) {
  const { rows } = await pool.query(
    `SELECT user_id FROM users WHERE user_id = $1 AND status = 'Active'`,
    [ownerId]
  );
  return rows.length > 0;
}

async function tenantExists(pool, tenantId) {
  const { rows } = await pool.query(
    `SELECT tenant_id FROM tenants WHERE tenant_id = $1`,
    [tenantId]
  );
  return rows.length > 0;
}

/**
 * Register a managed device with governance metadata.
 * @returns {{ status: number, body: object }}
 */
async function registerDevice(pool, payload, actorUserId = null) {
  const {
    hostname,
    ownerId,
    deviceType,
    os,
    complianceStatus,
    tenantId = DEFAULT_TENANT,
    verificationRunId: payloadVerificationRunId
  } = payload || {};

  if (!hostname?.trim() || !ownerId?.trim() || !deviceType?.trim()) {
    return { status: 400, body: { error: 'Missing required fields: hostname, ownerId, deviceType' } };
  }

  if (!VALID_DEVICE_TYPES.includes(deviceType)) {
    return { status: 400, body: { error: 'Invalid device type' } };
  }

  const normalizedCompliance = (complianceStatus || 'pending').toLowerCase();
  if (!VALID_COMPLIANCE_STATUSES.includes(normalizedCompliance)) {
    return { status: 400, body: { error: 'Invalid compliance status' } };
  }

  if (!(await tenantExists(pool, tenantId))) {
    return { status: 400, body: { error: 'Unknown tenant' } };
  }

  if (!(await ownerExists(pool, ownerId))) {
    return { status: 400, body: { error: 'Invalid or inactive device owner' } };
  }

  const deviceId = createDeviceId();
  const verificationRunId = resolveVerificationRunId(payloadVerificationRunId);

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO managed_devices (
        device_id, tenant_id, hostname, owner_id, device_type, os,
        compliance_status, registered_by, verification_run_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        deviceId,
        tenantId,
        hostname.trim(),
        ownerId.trim(),
        deviceType,
        os || null,
        normalizedCompliance,
        actorUserId,
        verificationRunId
      ]
    );

    return { status: 201, body: mapDeviceRow(rows[0]) };
  } catch (err) {
    if (err.code === '23505') {
      return { status: 409, body: { error: 'Device hostname already registered for this tenant' } };
    }
    throw err;
  }
}

/**
 * Retrieve a managed device by id — authoritative persisted state (not recomputed).
 * @returns {{ status: number, body: object }}
 */
async function getDeviceById(pool, deviceId) {
  if (!deviceId?.trim()) {
    return { status: 400, body: { error: 'Device id is required' } };
  }

  const { rows } = await pool.query(`SELECT * FROM managed_devices WHERE device_id = $1`, [
    deviceId.trim()
  ]);

  if (!rows.length) {
    return { status: 404, body: { error: 'Device not found' } };
  }

  return { status: 200, body: mapDeviceRow(rows[0]) };
}

module.exports = {
  VALID_DEVICE_TYPES,
  VALID_COMPLIANCE_STATUSES,
  registerDevice,
  getDeviceById,
  mapDeviceRow
};
