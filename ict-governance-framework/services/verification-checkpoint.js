/**
 * Signed verification checkpoints (VB-CP) — capture known-good DB state before
 * regression runs, roll back tagged synthetic rows after, append attestations to
 * an immutable ledger (ingest logs are never deleted).
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SQL_PATH = path.join(__dirname, '..', 'sql', 'verification_checkpoint.sql');

const TEST_ASSET_SUFFIXES = ['vm-app-recovered-01'];

const VERIFICATION_INCIDENT_PATTERN_SQL = `
  external_ticket_id LIKE 'CONTRACT-%'
  OR external_ticket_id LIKE 'CONTRACT-LC-%'
  OR external_ticket_id LIKE 'TEST-%'
  OR external_ticket_id LIKE 'DR-TEST-RUN-%'
  OR external_ticket_id LIKE 'DEV-COMP-%'
  OR external_ticket_id = 'INC-2026-99831'
  OR description ILIKE '%contract test%'
  OR description ILIKE '%calibration seed incident%'
  OR description ILIKE '%secops test%'
  OR description ILIKE '%automated git-to-cloud recovery%'
  OR description ILIKE '%ransomware footprint signature detected via endpoint analytics%'
  OR description ILIKE '%vm-app-recovered-01%'
`;

async function collectVerificationIncidents(pool, { verificationRunId = null, sinceIso = null } = {}) {
  let sql;
  let queryParams = [];

  if (verificationRunId && sinceIso) {
    sql = `
      SELECT incident_id, correlation_id
      FROM governance_incidents
      WHERE verification_run_id = $1::uuid
         OR ((${VERIFICATION_INCIDENT_PATTERN_SQL}) AND detected_at >= $2::timestamptz)
    `;
    queryParams = [verificationRunId, sinceIso];
  } else if (verificationRunId) {
    sql = `
      SELECT incident_id, correlation_id
      FROM governance_incidents
      WHERE verification_run_id = $1::uuid
         OR (${VERIFICATION_INCIDENT_PATTERN_SQL})
    `;
    queryParams = [verificationRunId];
  } else {
    sql = `
      SELECT incident_id, correlation_id
      FROM governance_incidents
      WHERE ${VERIFICATION_INCIDENT_PATTERN_SQL}
    `;
  }

  const { rows } = await pool.query(sql, queryParams);
  return rows;
}

async function removeIncidentsByIds(pool, incidentRows) {
  const summary = {
    incidents_removed: 0,
    workflow_events_removed: 0,
    fair_calc_logs_removed: 0,
    ingest_logs_marked: 0
  };

  const incidentIds = incidentRows.map((row) => row.incident_id);
  const correlationIds = incidentRows.map((row) => row.correlation_id).filter(Boolean);

  if (!incidentIds.length) {
    return summary;
  }

  const wf = await pool.query(
    `DELETE FROM incident_workflow_events WHERE incident_id = ANY($1::int[])`,
    [incidentIds]
  );
  summary.workflow_events_removed = wf.rowCount || 0;

  const fair = await pool.query(
    `
    DELETE FROM fair_risk_calculation_log
    WHERE incident_id = ANY($1::int[])
       OR correlation_id = ANY($2::uuid[])
    `,
    [incidentIds, correlationIds]
  );
  summary.fair_calc_logs_removed = fair.rowCount || 0;

  const removed = await pool.query(
    `DELETE FROM governance_incidents WHERE incident_id = ANY($1::int[])`,
    [incidentIds]
  );
  summary.incidents_removed = removed.rowCount || 0;

  if (correlationIds.length) {
    try {
      const ingestMark = await pool.query(
        `
        UPDATE governance_incident_ingest_log
        SET rolled_back_at = COALESCE(rolled_back_at, CURRENT_TIMESTAMP)
        WHERE correlation_id = ANY($1::uuid[])
        `,
        [correlationIds]
      );
      summary.ingest_logs_marked = ingestMark.rowCount || 0;
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }
  }

  return summary;
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function hashManifest(manifest) {
  return crypto.createHash('sha256').update(stableStringify(manifest)).digest('hex');
}

function createCheckpointId() {
  return `VCP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

async function ensureSchema(pool) {
  if (!fs.existsSync(SQL_PATH)) {
    throw new Error('Missing sql/verification_checkpoint.sql');
  }
  await pool.query(fs.readFileSync(SQL_PATH, 'utf8'));
}

async function getLatestLedgerHash(pool) {
  const { rows } = await pool.query(
    `
    SELECT manifest_hash
    FROM verification_checkpoint_ledger
    ORDER BY ledger_id DESC
    LIMIT 1
    `
  );
  return rows[0]?.manifest_hash || null;
}

async function captureOperationalState(pool) {
  const incidents = await pool.query(
    `
    SELECT COUNT(*)::int AS count, COALESCE(MAX(incident_id), 0)::int AS max_id
    FROM governance_incidents
    `
  );

  let managedDevices = { count: 0 };
  try {
    const deviceRows = await pool.query(`SELECT COUNT(*)::int AS count FROM managed_devices`);
    managedDevices = deviceRows.rows[0];
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  let metricSnapshots = [];
  try {
    const metricRows = await pool.query(
      `
      SELECT metric_code, current_value::text AS current_value, target_value::text AS target_value, last_context
      FROM governance_metric_snapshots
      ORDER BY metric_code
      `
    );
    metricSnapshots = metricRows.rows;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  let fairEnterpriseAle = null;
  try {
    const fairRows = await pool.query(
      `
      SELECT total_ale_usd::text AS total_ale_usd
      FROM fair_risk_enterprise_history
      ORDER BY recorded_at DESC
      LIMIT 1
      `
    );
    fairEnterpriseAle = fairRows.rows[0]?.total_ale_usd ?? null;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  let assetRegister = { count: 0 };
  try {
    const assetRows = await pool.query(`SELECT COUNT(*)::int AS count FROM asset_register`);
    assetRegister = assetRows.rows[0];
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  return {
    governance_incidents: incidents.rows[0],
    managed_devices: managedDevices,
    asset_register: assetRegister,
    metric_snapshots: metricSnapshots,
    fair_enterprise_ale: fairEnterpriseAle
  };
}

/**
 * @param {import('pg').Pool} pool
 * @param {{ verificationRunId: string, trigger?: string }} options
 */
async function createVerificationCheckpoint(pool, { verificationRunId, trigger = 'verify:registry' }) {
  await ensureSchema(pool);

  const checkpointId = createCheckpointId();
  const capturedAt = new Date().toISOString();
  const state = await captureOperationalState(pool);
  const manifest = {
    checkpointId,
    verificationRunId,
    trigger,
    capturedAt,
    algorithm: 'SHA256',
    state
  };
  const manifestHash = hashManifest(manifest);
  const previousManifestHash = await getLatestLedgerHash(pool);

  await pool.query(
    `
    INSERT INTO verification_checkpoint_ledger (
      checkpoint_id, verification_run_id, event_type, trigger_source,
      manifest, manifest_hash, previous_manifest_hash
    ) VALUES ($1, $2, 'checkpoint', $3, $4, $5, $6)
    `,
    [
      checkpointId,
      verificationRunId,
      trigger,
      manifest,
      manifestHash,
      previousManifestHash
    ]
  );

  return { checkpointId, verificationRunId, manifest, manifestHash, previousManifestHash };
}

function resolveVerificationRunId(explicit) {
  return explicit || process.env.VERIFICATION_RUN_ID || null;
}

/**
 * Roll back operational rows tagged with verification_run_id; preserve ingest audit log.
 * @param {import('pg').Pool} pool
 * @param {{ checkpointId: string, verificationRunId: string, manifest: object, manifestHash: string, trigger?: string }} options
 */
async function rollbackVerificationCheckpoint(pool, {
  checkpointId,
  verificationRunId,
  manifest,
  manifestHash,
  trigger = 'verify:registry'
}) {
  await ensureSchema(pool);

  const summary = {
    incidents_removed: 0,
    workflow_events_removed: 0,
    fair_calc_logs_removed: 0,
    devices_removed: 0,
    assets_removed: 0,
    ingest_logs_marked: 0,
    metrics_restored: 0
  };

  const incidentRows = await collectVerificationIncidents(pool, {
    verificationRunId,
    sinceIso: manifest.capturedAt
  });

  const incidentRemoval = await removeIncidentsByIds(pool, incidentRows);
  Object.assign(summary, incidentRemoval);

  try {
    const ingestMark = await pool.query(
      `
      UPDATE governance_incident_ingest_log
      SET rolled_back_at = CURRENT_TIMESTAMP
      WHERE verification_run_id = $1
        AND rolled_back_at IS NULL
      `,
      [verificationRunId]
    );
    summary.ingest_logs_marked += ingestMark.rowCount || 0;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  try {
    const devices = await pool.query(
      `DELETE FROM managed_devices WHERE verification_run_id = $1`,
      [verificationRunId]
    );
    summary.devices_removed = devices.rowCount || 0;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  try {
    const softwareEvents = await pool.query(
      `
      DELETE FROM software_casb_events
      WHERE verification_run_id = $1
      RETURNING asset_id
      `,
      [verificationRunId]
    );
    summary.software_events_removed = softwareEvents.rowCount || 0;
    const assetIds = softwareEvents.rows.map((r) => r.asset_id).filter(Boolean);
    if (assetIds.length) {
      const assetsFromSoftware = await pool.query(
        `DELETE FROM asset_register WHERE asset_id = ANY($1::text[])`,
        [assetIds]
      );
      summary.assets_removed += assetsFromSoftware.rowCount || 0;
    }
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  try {
    const assets = await pool.query(
      `
      DELETE FROM asset_register
      WHERE verification_run_id = $1
         OR asset_id LIKE '%vm-app-recovered-01'
      `,
      [verificationRunId]
    );
    summary.assets_removed += assets.rowCount || 0;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  try {
    const audit = await pool.query(
      `DELETE FROM casb_ingest_audit WHERE verification_run_id = $1`,
      [verificationRunId]
    );
    summary.casb_ingest_audit_removed = audit.rowCount || 0;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  for (const snap of manifest.state?.metric_snapshots || []) {
    try {
      await pool.query(
        `
        UPDATE governance_metric_snapshots
        SET current_value = $2::numeric,
            target_value = COALESCE($3::numeric, target_value),
            last_context = $4,
            last_updated = CURRENT_TIMESTAMP
        WHERE metric_code = $1
        `,
        [snap.metric_code, snap.current_value, snap.target_value, snap.last_context]
      );
      summary.metrics_restored += 1;
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }
  }

  const rollbackManifest = {
    checkpointId,
    verificationRunId,
    trigger,
    rolledBackAt: new Date().toISOString(),
    checkpointManifestHash: manifestHash,
    summary
  };
  const rollbackHash = hashManifest(rollbackManifest);

  await pool.query(
    `
    INSERT INTO verification_checkpoint_ledger (
      checkpoint_id, verification_run_id, event_type, trigger_source,
      manifest, manifest_hash, previous_manifest_hash, rollback_summary
    ) VALUES ($1, $2, 'rollback', $3, $4, $5, $6, $7)
    `,
    [
      checkpointId,
      verificationRunId,
      trigger,
      rollbackManifest,
      rollbackHash,
      manifestHash,
      summary
    ]
  );

  return { rollbackHash, summary };
}

/**
 * Remove legacy untagged verification/test rows (pre-VB-CP runs).
 * @param {import('pg').Pool} pool
 */
async function cleanupLegacyVerificationArtifacts(pool) {
  await ensureSchema(pool);

  const summary = {
    incidents_removed: 0,
    workflow_events_removed: 0,
    fair_calc_logs_removed: 0,
    devices_removed: 0,
    assets_removed: 0,
    ingest_logs_marked: 0
  };

  const incidentRows = await collectVerificationIncidents(pool);
  const incidentRemoval = await removeIncidentsByIds(pool, incidentRows);
  Object.assign(summary, incidentRemoval);

  try {
    const devices = await pool.query(
      `DELETE FROM managed_devices WHERE hostname LIKE 'contract-%'`
    );
    summary.devices_removed = devices.rowCount || 0;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  try {
    for (const suffix of TEST_ASSET_SUFFIXES) {
      await pool.query(`DELETE FROM asset_register WHERE asset_id LIKE $1`, [`%${suffix}`]);
    }
    summary.assets_removed = TEST_ASSET_SUFFIXES.length;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  return summary;
}

module.exports = {
  hashManifest,
  ensureSchema,
  captureOperationalState,
  createVerificationCheckpoint,
  rollbackVerificationCheckpoint,
  cleanupLegacyVerificationArtifacts,
  resolveVerificationRunId
};
