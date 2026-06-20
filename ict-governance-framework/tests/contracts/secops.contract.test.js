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

  it('rejects compliance validation incidents without explicit frameworkImpacts', async () => {
    await expect(ingestGovernanceIncident(pool, {
      body: {
        tenantId: 'tenant-01',
        driftType: 'governance',
        severity: 'CRITICAL',
        description: 'Generic non-compliance — must not reach client',
        requirementId: 'identity-mfa-requirement',
        validationId: 'val-test'
      }
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('ingests compliance notification with explicit ISO-27001 control detail', async () => {
    const {
      buildComplianceNotificationEnvelope,
      formatClientNotificationDescription
    } = require('../../services/compliance-notification-service');
    const requirement = require('../../../adpa/tenants/tenant-contoso-health/requirements/identity-mfa-requirement.json');
    const evaluation = {
      meetsExpectations: false,
      gaps: [{
        type: 'control',
        ruleId: 'identity-mfa-enrollment',
        controlId: 'identity-mfa-enforcement',
        expectedState: '100% of users enrolled in MFA',
        observed: '72% enrolled'
      }]
    };
    const complianceNotification = buildComplianceNotificationEnvelope({
      tenantId: 'tenant-01',
      requirement,
      evaluation,
      assetId: '/subscriptions/sub-contoso/policyAssignments/identity-mfa-enforcement',
      validationId: 'val-contract-test',
      requirementId: 'identity-mfa-requirement'
    });
    const correlationId = crypto.randomUUID();
    const result = await ingestGovernanceIncident(pool, {
      body: {
        tenantId: 'tenant-01',
        driftType: 'governance',
        severity: 'CRITICAL',
        description: formatClientNotificationDescription(complianceNotification, 'Validation failed.'),
        requirementId: 'identity-mfa-requirement',
        validationId: 'val-contract-test',
        complianceNotification,
        externalTicketId: `CONTRACT-NC-${Date.now()}`
      },
      correlationId
    });

    expect(result.complianceNotification.frameworkImpacts.some((i) => i.certificationId === 'ISO-27001')).toBe(true);
    expect(result.incident.description).toContain('A.9.2.1');

    const log = await pool.query(
      `SELECT processed_fields FROM governance_incident_ingest_log WHERE correlation_id = $1`,
      [correlationId]
    );
    expect(log.rows[0].processed_fields.complianceNotification.frameworkImpacts.length).toBeGreaterThan(0);
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
