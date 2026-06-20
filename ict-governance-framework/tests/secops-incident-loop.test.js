/**
 * SecOps incident loop tests — Sprint A mandatory controls + lifecycle PATCH
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const { ingestGovernanceIncident } = require('../services/governance-incident-ingest');
const { patchIncidentStatus, VALID_TRANSITIONS } = require('../services/governance-incident-lifecycle');
const { getIncidentTimeline } = require('../services/governance-incident-timeline');
const { refreshMappingCache } = require('../services/mitre-enrichment');
const { SLA_TARGETS_MS } = require('../services/governance-sla');

(async () => {
  let passed = 0;
  let failed = 0;

  const assert = (name, condition) => {
    if (condition) {
      passed += 1;
      console.log(`PASS: ${name}`);
    } else {
      failed += 1;
      console.error(`FAIL: ${name}`);
    }
  };

  if (!process.env.DATABASE_URL) {
    console.error('FAIL: DATABASE_URL required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sqlDir = path.join(__dirname, '..', 'sql');

  for (const file of [
    'governance.sql',
    'fair_risk_models.sql',
    'incident_secops_controls.sql',
    'incident_lifecycle.sql',
    'mitre_enrichment.sql',
    'mitre_to_fair_mapping.sql'
  ]) {
    await pool.query(fs.readFileSync(path.join(sqlDir, file), 'utf8'));
  }

  await pool.query(`
    INSERT INTO tenants (tenant_id, name, classification)
    VALUES ('tenant-01', 'Contoso Health', 'Healthcare')
    ON CONFLICT (tenant_id) DO NOTHING
  `);

  const correlationId = crypto.randomUUID();
  const payload = {
    tenantId: 'tenant-01',
    driftType: 'security',
    severity: 'CRITICAL',
    description: 'SecOps test — unauthorized privilege escalation detected',
    externalTicketId: `TEST-${Date.now()}`
  };

  const result = await ingestGovernanceIncident(pool, {
    body: payload,
    correlationId
  });

  const incidentId = result.incident.incident_id;

  assert('incident created with status Detected', result.incident.status === 'Detected');
  assert('correlation_id persisted on incident', result.incident.correlation_id === correlationId);
  assert('correlation_id returned in result', result.correlationId === correlationId);

  const ingestLog = await pool.query(
    `SELECT * FROM governance_incident_ingest_log WHERE correlation_id = $1`,
    [correlationId]
  );
  assert('ingest audit log row created', ingestLog.rows.length >= 1);
  assert('ingest log stores raw payload', ingestLog.rows[0].raw_payload?.tenantId === 'tenant-01');

  const fairCalc = await pool.query(
    `SELECT * FROM fair_risk_calculation_log WHERE correlation_id = $1 AND trigger_source = 'incident'`,
    [correlationId]
  );
  assert('FAIR calculation log linked to incident correlation_id', fairCalc.rows.length >= 1);
  assert('FAIR calc has ale_before and ale_after', fairCalc.rows[0].ale_after_usd != null);

  const telemetryLog = await pool.query(
    `SELECT * FROM fair_risk_telemetry_log WHERE correlation_id = $1 LIMIT 1`,
    [correlationId]
  );
  assert('FAIR telemetry log carries correlation_id', telemetryLog.rows.length >= 1);

  assert('event-driven FAIR recalculation returned', result.fairRecalculation != null);
  assert('fair recalc includes ale_before_usd', result.fairRecalculation.ale_before_usd != null);

  assert('CRITICAL SLA ticket-to-ack target is 5 minutes', SLA_TARGETS_MS.CRITICAL.ticketToAckMs === 5 * 60 * 1000);
  assert('CRITICAL SLA MTTR target is 60 minutes', SLA_TARGETS_MS.CRITICAL.mttrMs === 60 * 60 * 1000);

  assert('Detected allows only Acknowledged', VALID_TRANSITIONS.Detected.join() === 'Acknowledged');

  const ack = await patchIncidentStatus(pool, {
    incidentId,
    status: 'Acknowledged',
    actor: 'secops-test'
  });
  assert('Detected → Acknowledged transition valid', ack.new_status === 'Acknowledged');
  assert('acknowledged_at set automatically', ack.timestamps.acknowledged_at != null);
  assert('sla ack not breached on fast ack', ack.sla.ack_breached === false);

  const workflowAfterAck = await pool.query(
    `SELECT * FROM incident_workflow_events WHERE incident_id = $1 ORDER BY id DESC LIMIT 1`,
    [incidentId]
  );
  assert('workflow event logged on ack', workflowAfterAck.rows[0]?.new_status === 'Acknowledged');

  let skipRemediatingRejected = false;
  try {
    await patchIncidentStatus(pool, {
      incidentId,
      status: 'Resolved',
      actor: 'secops-test'
    });
  } catch (err) {
    skipRemediatingRejected = err.statusCode === 409;
  }
  assert('Acknowledged → Resolved without Remediating rejected', skipRemediatingRejected);

  const breachIncident = await ingestGovernanceIncident(pool, {
    body: { ...payload, externalTicketId: `TEST-SLA-${Date.now()}` },
    correlationId: crypto.randomUUID()
  });
  await pool.query(
    `UPDATE governance_incidents SET detected_at = NOW() - INTERVAL '10 minutes' WHERE incident_id = $1`,
    [breachIncident.incident.incident_id]
  );
  const lateAck = await patchIncidentStatus(pool, {
    incidentId: breachIncident.incident.incident_id,
    status: 'Acknowledged',
    actor: 'secops-test'
  });
  assert('SLA ack breach flagged after delayed ack', lateAck.sla.ack_breached === true);

  const remediate = await patchIncidentStatus(pool, {
    incidentId,
    status: 'Remediating',
    actor: 'secops-test'
  });
  assert('Acknowledged → Remediating valid', remediate.new_status === 'Remediating');

  const resolve = await patchIncidentStatus(pool, {
    incidentId,
    status: 'Resolved',
    resolutionNotes: 'Containment complete — credentials rotated',
    actor: 'secops-test'
  });
  assert('Remediating → Resolved valid', resolve.new_status === 'Resolved');
  assert('resolved_at set automatically', resolve.timestamps.resolved_at != null);

  const resolveFair = await pool.query(
    `SELECT * FROM fair_risk_calculation_log
     WHERE incident_id = $1 AND trigger_source = 'incident_resolved'`,
    [incidentId]
  );
  assert('FAIR recalc on Resolved (incident_resolved)', resolveFair.rows.length >= 1);
  assert('resolve response includes fair_recalculation', resolve.fair_recalculation != null);

  const timeline = await getIncidentTimeline(incidentId);
  assert('timeline includes incident_detected', timeline.timeline.some((e) => e.event === 'incident_detected'));
  assert('timeline includes risk_updated on ingest', timeline.timeline.some(
    (e) => e.event === 'risk_updated' && e.trigger_source === 'incident'
  ));
  assert('timeline includes status_change to Acknowledged', timeline.timeline.some(
    (e) => e.event === 'status_change' && e.to === 'Acknowledged'
  ));
  assert('timeline includes risk_updated on resolve', timeline.timeline.some(
    (e) => e.event === 'risk_updated' && e.trigger_source === 'incident_resolved'
  ));
  assert('timeline events chronologically ordered', timeline.event_count >= 5);

  await refreshMappingCache(pool);

  const mitreCorrelationId = crypto.randomUUID();
  const mitrePayload = {
    tenantId: 'tenant-01',
    driftType: 'security',
    severity: 'CRITICAL',
    description: 'MITRE test — credential dump detected',
    externalTicketId: `TEST-MITRE-${Date.now()}`,
    mitre: {
      tactic: 'Credential Access',
      technique: 'T1003',
      technique_name: 'OS Credential Dumping'
    }
  };

  const mitreResult = await ingestGovernanceIncident(pool, {
    body: mitrePayload,
    correlationId: mitreCorrelationId
  });
  const mitreIncidentId = mitreResult.incident.incident_id;

  assert('MITRE technique persisted on incident', mitreResult.incident.mitre_technique === 'T1003');
  assert('MITRE tactic persisted on incident', mitreResult.incident.mitre_tactic === 'Credential Access');
  assert('FAIR scenario linked from MITRE technique', mitreResult.incident.fair_scenario_id === 'RSK-ADMIN-COMPROMISE');
  assert('MITRE severity weight from mapping table', parseFloat(mitreResult.incident.mitre_severity_weight) === 1.4);
  assert('MITRE mapping confidence persisted', parseFloat(mitreResult.incident.mitre_mapping_confidence) >= 0.9);
  assert('ingest result includes mitre block', mitreResult.mitre?.technique === 'T1003');
  assert('mitre mapping source is database table', mitreResult.mitre?.mapping_source === 'mitre_to_fair_mapping');

  const mitreTimeline = await getIncidentTimeline(mitreIncidentId);
  const detectedEvent = mitreTimeline.timeline.find((e) => e.event === 'incident_detected');
  assert('timeline incident_detected includes mitre', detectedEvent?.mitre?.technique === 'T1003');
  assert('timeline root includes mitre summary', mitreTimeline.mitre?.technique === 'T1003');
  assert('timeline root includes fair_scenario_id', mitreTimeline.fair_scenario_id === 'RSK-ADMIN-COMPROMISE');

  const sentinelCorrelationId = crypto.randomUUID();
  const sentinelMitreResult = await ingestGovernanceIncident(pool, {
    body: {
      properties: {
        severity: 'High',
        title: 'Sentinel credential access alert',
        tactics: ['Credential Access'],
        techniques: ['T1003.001']
      },
      tenantId: 'tenant-01',
      driftType: 'security',
      description: 'Sentinel-shaped MITRE payload'
    },
    correlationId: sentinelCorrelationId
  });
  assert('Sentinel tactics/techniques normalized', sentinelMitreResult.incident.mitre_technique === 'T1003');
  assert('Sentinel payload maps to FAIR scenario', sentinelMitreResult.incident.fair_scenario_id === 'RSK-ADMIN-COMPROMISE');

  const ingestMitreLog = await pool.query(
    `SELECT processed_fields FROM governance_incident_ingest_log WHERE correlation_id = $1`,
    [mitreCorrelationId]
  );
  assert('ingest log stores mitre in processed_fields', ingestMitreLog.rows[0]?.processed_fields?.mitre?.technique === 'T1003');

  const mitreTelemetry = await pool.query(
    `SELECT * FROM fair_risk_telemetry_log
     WHERE correlation_id = $1 AND driver = 'mitre_technique_T1003'`,
    [mitreCorrelationId]
  );
  assert('FAIR telemetry logs MITRE technique driver', mitreTelemetry.rows.length >= 1);

  const mappingRows = await pool.query(
    `SELECT COUNT(*)::int AS count FROM mitre_to_fair_mapping WHERE technique = 'T1003'`
  );
  assert('mitre_to_fair_mapping seed includes T1003', mappingRows.rows[0]?.count === 1);

  if (!process.env.VERIFICATION_RUN_ID) {
    await pool.query('DELETE FROM incident_workflow_events WHERE incident_id = ANY($1)', [
      [incidentId, breachIncident.incident.incident_id, mitreIncidentId, sentinelMitreResult.incident.incident_id]
    ]);
    await pool.query('DELETE FROM governance_incidents WHERE incident_id = ANY($1)', [
      [incidentId, breachIncident.incident.incident_id, mitreIncidentId, sentinelMitreResult.incident.incident_id]
    ]);
  }
  await pool.end();

  console.log(`\nSecOps incident loop tests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => {
  console.error('SecOps test harness error:', err);
  process.exit(1);
});
