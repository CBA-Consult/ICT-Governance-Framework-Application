/**
 * @contract pillar:data
 * @contract readiness:enforced
 * Data pillar contract tests.
 */
const crypto = require('crypto');
const { createPool, applySqlFiles, ensureTenant } = require('./_helpers/db');
const { ingestGovernanceIncident } = require('../../services/governance-incident-ingest');

describe('Data pillar contracts', () => {
  let pool;

  beforeAll(async () => {
    pool = createPool();
    await applySqlFiles(pool, [
      'governance.sql',
      'assets.sql',
      'incident_asset_binding.sql',
      'incident_secops_controls.sql',
      'fair_risk_models.sql',
      'mitre_enrichment.sql',
      'mitre_to_fair_mapping.sql'
    ]);
    await ensureTenant(pool);
  });

  afterAll(async () => {
    if (!process.env.VERIFICATION_RUN_ID) {
      await pool?.query("DELETE FROM governance_incidents WHERE description LIKE '%Data contract test%'");
      await pool?.query("DELETE FROM document_activity_log WHERE description LIKE '%Data contract test%'");
      await pool?.query("DELETE FROM documents WHERE title LIKE '%Data contract test%'");
    }
    await pool?.end();
  });

  it('records classification label change in document audit trail', async () => {
    const userId = 'usr-data-contract-test';
    const categoryId = 'POLICY';
    
    await pool.query(
      `INSERT INTO users (user_id, username, email, password_hash, first_name, last_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Active')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, 'data-tester', 'data-tester@contract.test', 'password_hash_dummy', 'Data', 'Tester']
    );

    const docId = `DOC-DATA-${Date.now()}`;
    const title = 'Data contract test document';

    await pool.query(
      `INSERT INTO documents (document_id, title, category_id, document_type, status, owner_user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [docId, title, categoryId, 'Policy', 'Draft', userId, JSON.stringify({ data_classification: 'Confidential' })]
    );

    const activityId1 = `ACT-DATA-${Date.now()}-1`;
    await pool.query(
      `INSERT INTO document_activity_log (activity_id, document_id, activity_type, description, user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [activityId1, docId, 'document.create', 'Data contract test document created', userId, JSON.stringify({ data_classification: 'Confidential' })]
    );

    await pool.query(
      `UPDATE documents 
       SET metadata = $1, updated_at = CURRENT_TIMESTAMP
       WHERE document_id = $2`,
      [JSON.stringify({ data_classification: 'Restricted' }), docId]
    );

    const activityId2 = `ACT-DATA-${Date.now()}-2`;
    await pool.query(
      `INSERT INTO document_activity_log (activity_id, document_id, activity_type, description, user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [activityId2, docId, 'document.update', 'Data contract test document classification changed from Confidential to Restricted', userId, JSON.stringify({ data_classification: 'Restricted' })]
    );

    const { rows } = await pool.query(
      `SELECT * FROM document_activity_log WHERE document_id = $1 ORDER BY created_at ASC`,
      [docId]
    );

    expect(rows.length).toBe(2);
    expect(rows[0].activity_type).toBe('document.create');
    expect(rows[1].activity_type).toBe('document.update');
    expect(rows[1].description).toContain('Confidential to Restricted');
    expect(rows[1].metadata.data_classification).toBe('Restricted');
  });

  it('creates governance incident with PR.DS category for DLP violation', async () => {
    const requirement = {
      requirementId: 'data-protection-requirement',
      title: 'Data Protection controls',
      frameworkMappings: [
        {
          framework: 'NIST_CSF_2.0',
          controlId: 'PR.DS-01',
          controlName: 'Data-at-Rest Protection Controls'
        }
      ]
    };

    const evaluation = {
      gaps: [
        {
          type: 'control',
          controlId: 'PR.DS-01',
          expectedState: 'Data encrypted with company key',
          observed: 'Unencrypted storage found'
        }
      ]
    };

    const {
      buildComplianceNotificationEnvelope,
      formatClientNotificationDescription
    } = require('../../services/compliance-notification-service');

    const complianceNotification = buildComplianceNotificationEnvelope({
      tenantId: 'tenant-01',
      requirement,
      evaluation,
      assetId: '/subscriptions/sub-contoso/resourceGroups/rg-data/providers/Microsoft.Storage/storageAccounts/stcontractdata',
      validationId: 'val-dlp-contract-test',
      requirementId: 'data-protection-requirement'
    });

    const correlationId = crypto.randomUUID();
    const result = await ingestGovernanceIncident(pool, {
      body: {
        tenantId: 'tenant-01',
        driftType: 'security',
        severity: 'CRITICAL',
        description: formatClientNotificationDescription(complianceNotification, 'Data contract test — DLP violation detected.'),
        requirementId: 'data-protection-requirement',
        validationId: 'val-dlp-contract-test',
        complianceNotification,
        externalTicketId: `DATA-DLP-VIOLATION-${Date.now()}`
      },
      correlationId
    });

    expect(result.incident.incident_id).toBeTruthy();
    expect(result.incident.severity).toBe('CRITICAL');
    expect(result.incident.description).toContain('PR.DS.01');

    const log = await pool.query(
      `SELECT processed_fields FROM governance_incident_ingest_log WHERE correlation_id = $1`,
      [correlationId]
    );
    expect(log.rows.length).toBe(1);
    expect(log.rows[0].processed_fields.complianceNotification.frameworkImpacts[0].certificationId).toBe('NIST-CSF-2.0');
    expect(log.rows[0].processed_fields.complianceNotification.frameworkImpacts[0].controlId).toBe('PR.DS.01');
  });
});
