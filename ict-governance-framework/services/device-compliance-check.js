/**
 * Device compliance evaluation — derived posture with SecOps bridge on failure.
 */
const crypto = require('crypto');
const { mapDeviceRow } = require('./device-registration');
const { resolveVerificationRunId } = require('./verification-checkpoint');
const { ingestGovernanceIncident } = require('./governance-incident-ingest');

function validateChecks(checks) {
  if (!checks || typeof checks !== 'object' || Array.isArray(checks)) {
    return { ok: false, error: 'Missing compliance checks object' };
  }
  const entries = Object.entries(checks);
  if (!entries.length) {
    return { ok: false, error: 'At least one compliance check is required' };
  }
  for (const [name, value] of entries) {
    if (typeof value !== 'boolean') {
      return { ok: false, error: `Invalid check value for ${name}` };
    }
  }
  return { ok: true };
}

/**
 * Evaluate device compliance checks and update governed posture.
 * Non-compliant devices raise a SecOps governance incident.
 * @returns {{ status: number, body: object }}
 */
async function runDeviceComplianceCheck(pool, deviceId, payload = {}, actorUserId = null) {
  const validation = validateChecks(payload.checks);
  if (!validation.ok) {
    return { status: 400, body: { error: validation.error } };
  }

  const { rows: existing } = await pool.query(
    `SELECT * FROM managed_devices WHERE device_id = $1`,
    [deviceId]
  );
  if (!existing.length) {
    return { status: 404, body: { error: 'Device not found' } };
  }

  const device = existing[0];
  const checks = payload.checks;
  const isCompliant = Object.values(checks).every(Boolean);
  const complianceStatus = isCompliant ? 'compliant' : 'non_compliant';
  const lastCheckedAt = new Date().toISOString();
  const correlationId = crypto.randomUUID();

  const { rows } = await pool.query(
    `
    UPDATE managed_devices
    SET compliance_status = $2,
        last_compliance_check_at = $3,
        last_compliance_checks = $4
    WHERE device_id = $1
    RETURNING *
    `,
    [deviceId, complianceStatus, lastCheckedAt, checks]
  );

  let incident = null;
  if (!isCompliant) {
    const failedChecks = Object.entries(checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => name)
      .join(', ');

    const ingested = await ingestGovernanceIncident(pool, {
      body: {
        tenantId: device.tenant_id,
        driftType: 'security',
        severity: 'HIGH',
        description:
          `Managed device ${device.hostname} (${deviceId}) failed compliance evaluation. ` +
          `Failed checks: ${failedChecks}`,
        externalTicketId: `DEV-COMP-${deviceId}`,
        verificationRunId: resolveVerificationRunId(payload.verificationRunId)
      },
      correlationId
    });
    incident = {
      incidentId: ingested.incident.incident_id,
      correlationId: ingested.correlationId
    };
  }

  return {
    status: 200,
    body: {
      ...mapDeviceRow(rows[0]),
      lastCheckedAt,
      checks,
      evaluatedBy: actorUserId,
      incident: incident || null
    }
  };
}

module.exports = {
  validateChecks,
  runDeviceComplianceCheck
};
