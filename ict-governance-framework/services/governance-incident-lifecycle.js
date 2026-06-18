/**
 * Governance incident lifecycle — state-driven transitions (Sprint A)
 */
const crypto = require('crypto');
const { computeFairExposure } = require('./fair-risk-engine');
const { enrichIncidentWithSla } = require('./governance-sla');
const { logWorkflowEvent, logRiskUpdatedEvent } = require('./governance-incident-timeline');

const VALID_STATUSES = ['Detected', 'Acknowledged', 'Remediating', 'Resolved'];

const VALID_TRANSITIONS = {
  Detected: ['Acknowledged'],
  Acknowledged: ['Remediating'],
  Remediating: ['Resolved'],
  Resolved: []
};

async function getCurrentEnterpriseAle(pool) {
  try {
    const { rows } = await pool.query(
      'SELECT COALESCE(SUM(current_ale_usd), 0) AS total FROM fair_risk_scenarios'
    );
    return parseFloat(rows[0]?.total || 0);
  } catch (err) {
    if (err.code === '42P01') return null;
    throw err;
  }
}

async function triggerFairOnResolve(pool, { correlationId, incidentId }) {
  const aleBeforeUsd = await getCurrentEnterpriseAle(pool);
  if (aleBeforeUsd == null) return null;

  try {
    const result = await computeFairExposure({
      correlationId,
      triggerSource: 'incident_resolved',
      incidentId,
      aleBeforeUsd
    });
    console.log(
      `[FAIR Event] Incident ${incidentId} resolved — ALE: $${aleBeforeUsd.toLocaleString()} → ` +
      `$${result.total_enterprise_ale_usd.toLocaleString()} [correlation_id=${correlationId}]`
    );
    return {
      ale_before_usd: aleBeforeUsd,
      ale_after_usd: result.total_enterprise_ale_usd,
      risk_delta_usd: result.total_enterprise_ale_usd - aleBeforeUsd
    };
  } catch (err) {
    console.error(`[FAIR Event] Resolve recalc failed for incident ${incidentId}:`, err.message);
    return null;
  }
}

function buildSlaUpdate(incident) {
  const enriched = enrichIncidentWithSla(incident);
  return {
    sla_ack_breached: enriched.sla_ack_breached === true,
    sla_resolution_breached: enriched.sla_mttr_breached === true,
    sla_breached: enriched.sla_breached === true,
    time_to_acknowledge_ms: enriched.time_to_acknowledge_ms,
    time_to_resolve_ms: enriched.time_to_resolve_ms
  };
}

async function patchIncidentStatus(pool, {
  incidentId,
  status: newStatus,
  resolutionNotes,
  actor = 'system',
  correlationId: incomingCorrelationId
}) {
  if (!VALID_STATUSES.includes(newStatus)) {
    const error = new Error(`Invalid status. Use one of: ${VALID_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const id = parseInt(incidentId, 10);
  if (Number.isNaN(id)) {
    const error = new Error('Invalid incident ID');
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT * FROM governance_incidents WHERE incident_id = $1 FOR UPDATE',
      [id]
    );
    if (existing.rows.length === 0) {
      const error = new Error('Incident not found');
      error.statusCode = 404;
      throw error;
    }

    const incident = existing.rows[0];
    const currentStatus = incident.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      const error = new Error(
        `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`
      );
      error.statusCode = 409;
      throw error;
    }

    const correlationId = incomingCorrelationId || incident.correlation_id || crypto.randomUUID();
    const updates = ['status = $2', 'correlation_id = COALESCE(correlation_id, $3)'];
    const params = [id, newStatus, correlationId];
    let paramIdx = 4;

    if (newStatus === 'Acknowledged') {
      updates.push(`acknowledged_at = COALESCE(acknowledged_at, CURRENT_TIMESTAMP)`);
    }
    if (newStatus === 'Remediating') {
      updates.push(`remediated_at = COALESCE(remediated_at, CURRENT_TIMESTAMP)`);
    }
    if (newStatus === 'Resolved') {
      updates.push(`resolved_at = COALESCE(resolved_at, CURRENT_TIMESTAMP)`);
      if (resolutionNotes) {
        updates.push(`resolution_notes = $${paramIdx}`);
        params.push(resolutionNotes);
        paramIdx += 1;
      }
    }

    const updateSql = `
      UPDATE governance_incidents
      SET ${updates.join(', ')}
      WHERE incident_id = $1
      RETURNING *
    `;
    const { rows } = await client.query(updateSql, params);
    let updated = rows[0];

    const sla = buildSlaUpdate(updated);
    const slaPersist = await client.query(
      `
      UPDATE governance_incidents
      SET sla_ack_breached = $2,
          sla_resolution_breached = $3,
          sla_breached = $4
      WHERE incident_id = $1
      RETURNING *
      `,
      [id, sla.sla_ack_breached, sla.sla_resolution_breached, sla.sla_breached]
    );
    updated = slaPersist.rows[0];

    await logWorkflowEvent(client, {
      incidentId: id,
      eventType: 'status_change',
      previousStatus: currentStatus,
      newStatus,
      actor,
      correlationId,
      metadata: {
        resolution_notes: resolutionNotes || null,
        time_to_acknowledge_ms: sla.time_to_acknowledge_ms,
        time_to_resolve_ms: sla.time_to_resolve_ms
      }
    });

    await client.query('COMMIT');

    let fairRecalculation = null;
    if (newStatus === 'Resolved') {
      fairRecalculation = await triggerFairOnResolve(pool, { correlationId, incidentId: id });
      if (fairRecalculation) {
        await logRiskUpdatedEvent(pool, {
          incidentId: id,
          correlationId,
          triggerSource: 'incident_resolved',
          aleBeforeUsd: fairRecalculation.ale_before_usd,
          aleAfterUsd: fairRecalculation.ale_after_usd
        });
      }
    }

    const enriched = enrichIncidentWithSla(updated);

    return {
      status: 'UPDATED',
      incident_id: id,
      previous_status: currentStatus,
      new_status: newStatus,
      correlation_id: correlationId,
      incident: enriched,
      timestamps: {
        detected_at: updated.detected_at,
        acknowledged_at: updated.acknowledged_at,
        remediated_at: updated.remediated_at,
        resolved_at: updated.resolved_at
      },
      sla: {
        ack_breached: enriched.sla_ack_breached,
        resolution_breached: enriched.sla_mttr_breached,
        breached: enriched.sla_breached,
        time_to_acknowledge_ms: enriched.time_to_acknowledge_ms,
        time_to_resolve_ms: enriched.time_to_resolve_ms
      },
      fair_recalculation: fairRecalculation
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  VALID_STATUSES,
  VALID_TRANSITIONS,
  patchIncidentStatus,
  buildSlaUpdate
};
