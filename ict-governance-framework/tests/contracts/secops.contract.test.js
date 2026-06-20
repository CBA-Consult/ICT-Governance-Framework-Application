/**
 * @contract pillar:secops
 * @contract readiness:enforced
 * Incident ingest, audit log, and lifecycle contracts.
 */
const crypto = require('crypto');
const { createPool, applySqlFiles, ensureTenant } = require('./_helpers/db');
const { ingestGovernanceIncident } = require('../../services/governance-incident-ingest');
const { patchIncidentStatus, VALID_TRANSITIONS } = require('../../services/governance-incident-lifecycle');
const { SLA_TARGETS_MS } = require('../../services/governance-sla');

describe('SecOps pillar contracts', () => {
  let pool;

  beforeAll(async () => {
    pool = createPool();
    await applySqlFiles(pool, [
      'governance.sql',
      'fair_risk_models.sql',
      'incident_secops_controls.sql',
      'incident_lifecycle.sql',
      'mitre_enrichment.sql',
      'mitre_to_fair_mapping.sql'
    ]);
    await ensureTenant(pool);
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('defines CRITICAL SLA targets for detect-to-ticket and MTTR', () => {
    const critical = SLA_TARGETS_MS.CRITICAL;
    expect(critical.detectToTicketMs).toBeGreaterThan(0);
    expect(critical.mttrMs).toBeGreaterThan(critical.detectToTicketMs);
  });

  it('ingests incident with correlation_id and ingest log row', async () => {
    const correlationId = crypto.randomUUID();
    const result = await ingestGovernanceIncident(pool, {
      body: {
        tenantId: 'tenant-01',
        driftType: 'security',
        severity: 'CRITICAL',
        description: 'Contract test — privilege escalation',
        externalTicketId: `CONTRACT-${Date.now()}`
      },
      correlationId
    });

    expect(result.incident.incident_id).toBeTruthy();
    expect(result.incident.correlation_id).toBe(correlationId);

    const log = await pool.query(
      `SELECT correlation_id FROM governance_incident_ingest_log WHERE correlation_id = $1`,
      [correlationId]
    );
    expect(log.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('enforces valid lifecycle transitions', () => {
    expect(VALID_TRANSITIONS.Detected).toContain('Acknowledged');
    expect(VALID_TRANSITIONS.Resolved).toEqual([]);
  });

  it('patches Detected → Acknowledged with actor', async () => {
    const correlationId = crypto.randomUUID();
    const ingested = await ingestGovernanceIncident(pool, {
      body: {
        tenantId: 'tenant-01',
        driftType: 'security',
        severity: 'HIGH',
        description: 'Lifecycle contract test',
        externalTicketId: `CONTRACT-LC-${Date.now()}`
      },
      correlationId
    });

    const patched = await patchIncidentStatus(pool, {
      incidentId: ingested.incident.incident_id,
      status: 'Acknowledged',
      actor: 'contract-test'
    });

    expect(patched.new_status).toBe('Acknowledged');
  });
});
