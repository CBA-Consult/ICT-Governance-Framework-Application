/**
 * Sprint B — unified incident IR timeline (status + FAIR risk_updated events)
 */
const { Pool } = require('pg');
const { buildMitreResponse } = require('./mitre-enrichment');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function logWorkflowEvent(db, {
  incidentId,
  eventType,
  previousStatus = null,
  newStatus = null,
  actor = 'system',
  correlationId,
  metadata = {}
}) {
  const client = db.query ? db : await pool.connect();
  const ownsClient = !db.query;

  try {
    await client.query(
      `
      INSERT INTO incident_workflow_events (
        incident_id, event_type, previous_status, new_status, actor, correlation_id, event_metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [incidentId, eventType, previousStatus, newStatus, actor, correlationId, metadata]
    );
  } catch (err) {
    if (err.code !== '42P01') throw err;
    console.warn('[SecOps] incident_workflow_events unavailable — run setup:incident-lifecycle');
  } finally {
    if (ownsClient) client.release();
  }
}

async function logIncidentDetectedEvent(db, { incident, correlationId, actor = 'ingest' }) {
  await logWorkflowEvent(db, {
    incidentId: incident.incident_id,
    eventType: 'incident_detected',
    newStatus: 'Detected',
    actor,
    correlationId,
    metadata: {
      severity: incident.severity,
      drift_type: incident.drift_type,
      external_ticket_id: incident.external_ticket_id,
      asset_id: incident.asset_id,
      mitre: buildMitreResponse(incident)
    }
  });
}

async function logRiskUpdatedEvent(db, {
  incidentId,
  correlationId,
  triggerSource,
  aleBeforeUsd,
  aleAfterUsd,
  actor = 'fair-engine'
}) {
  const before = Number(aleBeforeUsd);
  const after = Number(aleAfterUsd);
  await logWorkflowEvent(db, {
    incidentId,
    eventType: 'risk_updated',
    actor,
    correlationId,
    metadata: {
      trigger_source: triggerSource,
      ale_before_usd: before,
      ale_after_usd: after,
      risk_delta_usd: after - before
    }
  });
}

function mapWorkflowRowToTimelineEntry(row) {
  const base = {
    id: row.id,
    event: row.event_type,
    recorded_at: row.recorded_at,
    correlation_id: row.correlation_id,
    actor: row.actor
  };

  if (row.event_type === 'status_change') {
    return {
      ...base,
      from: row.previous_status,
      to: row.new_status,
      ...row.event_metadata
    };
  }

  if (row.event_type === 'incident_detected') {
    const entry = {
      ...base,
      status: row.new_status || 'Detected',
      severity: row.event_metadata?.severity,
      drift_type: row.event_metadata?.drift_type,
      external_ticket_id: row.event_metadata?.external_ticket_id,
      asset_id: row.event_metadata?.asset_id
    };
    if (row.event_metadata?.mitre) {
      entry.mitre = row.event_metadata.mitre;
    }
    return entry;
  }

  if (row.event_type === 'risk_updated') {
    return {
      ...base,
      ale_before_usd: row.event_metadata?.ale_before_usd,
      ale_after_usd: row.event_metadata?.ale_after_usd,
      risk_delta_usd: row.event_metadata?.risk_delta_usd,
      trigger_source: row.event_metadata?.trigger_source
    };
  }

  return { ...base, ...row.event_metadata };
}

function mapFairCalcToTimelineEntry(row) {
  const before = parseFloat(row.ale_before_usd);
  const after = parseFloat(row.ale_after_usd);
  return {
    id: `fair-calc-${row.id}`,
    event: 'risk_updated',
    recorded_at: row.recorded_at,
    correlation_id: row.correlation_id,
    actor: 'fair-engine',
    trigger_source: row.trigger_source,
    ale_before_usd: before,
    ale_after_usd: after,
    risk_delta_usd: after - before,
    source: 'fair_risk_calculation_log'
  };
}

async function getIncidentTimeline(incidentId) {
  const id = parseInt(incidentId, 10);
  if (Number.isNaN(id)) {
    const error = new Error('Invalid incident ID');
    error.statusCode = 400;
    throw error;
  }

  const incidentResult = await pool.query(
    `SELECT * FROM governance_incidents WHERE incident_id = $1`,
    [id]
  );
  if (incidentResult.rows.length === 0) {
    const error = new Error('Incident not found');
    error.statusCode = 404;
    throw error;
  }

  const incident = incidentResult.rows[0];
  const timeline = [];

  let workflowRows = [];
  try {
    const wf = await pool.query(
      `
      SELECT * FROM incident_workflow_events
      WHERE incident_id = $1
      ORDER BY recorded_at ASC, id ASC
      `,
      [id]
    );
    workflowRows = wf.rows;
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  for (const row of workflowRows) {
    timeline.push(mapWorkflowRowToTimelineEntry(row));
  }

  const hasRiskEvents = workflowRows.some((r) => r.event_type === 'risk_updated');
  if (!hasRiskEvents) {
    try {
      const fairRows = await pool.query(
        `
        SELECT id, correlation_id, trigger_source, ale_before_usd, ale_after_usd, recorded_at
        FROM fair_risk_calculation_log
        WHERE incident_id = $1
           OR (incident_id IS NULL AND correlation_id = $2)
        ORDER BY recorded_at ASC
        `,
        [id, incident.correlation_id]
      );
      for (const row of fairRows.rows) {
        timeline.push(mapFairCalcToTimelineEntry(row));
      }
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }
  }

  const hasDetectedEvent = workflowRows.some((r) => r.event_type === 'incident_detected')
    || timeline.some((e) => e.event === 'incident_detected');

  if (!hasDetectedEvent) {
    const detected = {
      event: 'incident_detected',
      recorded_at: incident.detected_at,
      correlation_id: incident.correlation_id,
      status: incident.status,
      severity: incident.severity,
      drift_type: incident.drift_type,
      external_ticket_id: incident.external_ticket_id,
      asset_id: incident.asset_id,
      source: 'governance_incidents'
    };
    const mitre = buildMitreResponse(incident);
    if (mitre) detected.mitre = mitre;
    timeline.push(detected);
  }

  timeline.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

  const mitre = buildMitreResponse(incident);

  return {
    incident_id: id,
    correlation_id: incident.correlation_id,
    current_status: incident.status,
    severity: incident.severity,
    mitre,
    fair_scenario_id: incident.fair_scenario_id || mitre?.fair_scenario_id || null,
    timeline,
    event_count: timeline.length,
    attestation_timestamp: new Date().toISOString()
  };
}

module.exports = {
  logWorkflowEvent,
  logIncidentDetectedEvent,
  logRiskUpdatedEvent,
  getIncidentTimeline
};
