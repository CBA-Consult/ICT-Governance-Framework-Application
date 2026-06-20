/**
 * Cross-pillar consistency checks — QG-601 governance graph integrity.
 * Scoped to VERIFICATION_RUN_ID when running inside verify:post-feature (VB-CP).
 */

const HIGH_RISK_LEVELS = ['high', 'critical'];
const ELEVATED_SEVERITIES = ['HIGH', 'CRITICAL'];

function scopeClause(column, verificationRunId, paramIndex = 1, recentTimestampColumn = null) {
  if (verificationRunId) {
    return {
      sql: `${column} = $${paramIndex}::uuid`,
      params: [verificationRunId]
    };
  }
  if (recentTimestampColumn) {
    return {
      sql: `${recentTimestampColumn} > NOW() - INTERVAL '2 hours'`,
      params: []
    };
  }
  return { sql: 'TRUE', params: [] };
}

/**
 * @param {import('pg').Pool} pool
 * @param {{ verificationRunId?: string|null }} [options]
 * @returns {Promise<{ ok: boolean, results: object[] }>}
 */
async function runCrossPillarInvariants(pool, options = {}) {
  const verificationRunId = options.verificationRunId || process.env.VERIFICATION_RUN_ID || null;
  const results = [];

  results.push(await checkHighRiskCasbHasIncident(pool, verificationRunId));
  results.push(await checkSoftwareDeviceLinkIntegrity(pool, verificationRunId));
  results.push(await checkNonCompliantDeviceHighRiskSeverity(pool, verificationRunId));
  results.push(await checkDeviceIncidentReferentialIntegrity(pool, verificationRunId));
  results.push(await checkNoOrphanHighRiskCasbSignals(pool, verificationRunId));

  const ok = results.every((r) => r.ok);
  return { ok, verificationRunId, results };
}

async function checkHighRiskCasbHasIncident(pool, verificationRunId) {
  const scope = scopeClause('e.verification_run_id', verificationRunId, 2, 'e.created_at');
  const { rows } = await pool.query(
    `
    SELECT e.event_id, e.risk_level
    FROM software_casb_events e
    WHERE e.risk_level = ANY($1::text[])
      AND (${scope.sql})
      AND NOT EXISTS (
        SELECT 1 FROM governance_incidents gi
        WHERE gi.external_ticket_id = 'SW-CASB-' || e.event_id
      )
    `,
    [HIGH_RISK_LEVELS, ...scope.params]
  );

  return {
    id: 'QG-601-1',
    name: 'High-risk CASB events must produce SecOps incidents',
    ok: rows.length === 0,
    violations: rows
  };
}

async function checkSoftwareDeviceLinkIntegrity(pool, verificationRunId) {
  const scope = scopeClause('e.verification_run_id', verificationRunId, 1, 'e.created_at');
  const { rows } = await pool.query(
    `
    SELECT e.event_id, e.device_id
    FROM software_casb_events e
    WHERE e.device_id IS NOT NULL
      AND (${scope.sql})
      AND NOT EXISTS (
        SELECT 1 FROM managed_devices d WHERE d.device_id = e.device_id
      )
    `,
    scope.params
  );

  return {
    id: 'QG-601-2',
    name: 'Software events with deviceId must reference managed devices',
    ok: rows.length === 0,
    violations: rows
  };
}

async function checkNonCompliantDeviceHighRiskSeverity(pool, verificationRunId) {
  const scope = scopeClause('e.verification_run_id', verificationRunId, 2, 'e.created_at');
  const { rows } = await pool.query(
    `
    SELECT e.event_id, e.device_id, d.compliance_status, gi.severity
    FROM software_casb_events e
    INNER JOIN managed_devices d ON d.device_id = e.device_id
    LEFT JOIN governance_incidents gi ON gi.external_ticket_id = 'SW-CASB-' || e.event_id
    WHERE e.risk_level = ANY($1::text[])
      AND d.compliance_status = 'non_compliant'
      AND (${scope.sql})
      AND (
        gi.incident_id IS NULL
        OR gi.severity IS NULL
        OR gi.severity NOT IN ('HIGH', 'CRITICAL')
      )
    `,
    [HIGH_RISK_LEVELS, ...scope.params]
  );

  return {
    id: 'QG-601-3',
    name: 'Non-compliant device + high-risk software requires HIGH+ incident severity',
    ok: rows.length === 0,
    violations: rows
  };
}

async function checkDeviceIncidentReferentialIntegrity(pool, verificationRunId) {
  const scope = scopeClause('gi.verification_run_id', verificationRunId, 1, 'gi.detected_at');
  const { rows } = await pool.query(
    `
    SELECT gi.incident_id, gi.external_ticket_id
    FROM governance_incidents gi
    WHERE gi.external_ticket_id LIKE 'DEV-COMP-%'
      AND (${scope.sql})
      AND NOT EXISTS (
        SELECT 1 FROM managed_devices d
        WHERE d.device_id = REPLACE(gi.external_ticket_id, 'DEV-COMP-', '')
      )
    `,
    scope.params
  );

  return {
    id: 'QG-601-4',
    name: 'Device compliance incidents must reference existing managed devices',
    ok: rows.length === 0,
    violations: rows
  };
}

async function checkNoOrphanHighRiskCasbSignals(pool, verificationRunId) {
  const scope = scopeClause('e.verification_run_id', verificationRunId, 2, 'e.created_at');
  const { rows } = await pool.query(
    `
    SELECT e.event_id, e.risk_level
    FROM software_casb_events e
    WHERE e.risk_level = ANY($1::text[])
      AND (${scope.sql})
      AND NOT EXISTS (
        SELECT 1 FROM governance_incidents gi
        WHERE gi.external_ticket_id = 'SW-CASB-' || e.event_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM governance_incident_ingest_log il
        WHERE il.rolled_back_at IS NOT NULL
          AND il.raw_payload::text LIKE '%' || e.event_id || '%'
      )
    `,
    [HIGH_RISK_LEVELS, ...scope.params]
  );

  return {
    id: 'QG-601-5',
    name: 'No orphan high-risk CASB signals without incident or rollback audit',
    ok: rows.length === 0,
    violations: rows
  };
}

module.exports = {
  runCrossPillarInvariants,
  checkHighRiskCasbHasIncident,
  checkSoftwareDeviceLinkIntegrity,
  checkNonCompliantDeviceHighRiskSeverity,
  checkDeviceIncidentReferentialIntegrity,
  checkNoOrphanHighRiskCasbSignals
};
