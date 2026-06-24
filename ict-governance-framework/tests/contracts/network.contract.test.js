/**
 * @contract pillar:network
 * @contract readiness:enforced
 * Network pillar contract tests.
 */
const crypto = require('crypto');
const { createPool, applySqlFiles, ensureTenant } = require('./_helpers/db');
const { ingestGovernanceIncident } = require('../../services/governance-incident-ingest');

describe('Network pillar contracts', () => {
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
      await pool?.query("DELETE FROM governance_incidents WHERE description LIKE '%Network contract test%'");
      await pool?.query("DELETE FROM asset_register WHERE asset_id LIKE '%network-contract-test%'");
    }
    await pool?.end();
  });

  it('ingests port exposure finding as governance incident with resource correlation', async () => {
    const assetId = '/subscriptions/sub-contoso/resourceGroups/rg-network/providers/Microsoft.Network/networkSecurityGroups/nsg-network-contract-test';
    
    // Register the asset first
    await pool.query(
      `INSERT INTO asset_register (asset_id, name, provider, resource_type, location, compliance_state, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (asset_id) DO NOTHING`,
      [assetId, 'contract-test-nsg', 'Azure', 'NetworkSecurityGroup', 'westeurope', 'Compliant', 'tenant-01']
    );

    const correlationId = crypto.randomUUID();
    const result = await ingestGovernanceIncident(pool, {
      body: {
        tenantId: 'tenant-01',
        driftType: 'security',
        severity: 'HIGH',
        description: 'Network contract test — exposed port finding on public NSG',
        externalTicketId: `NET-PORT-EXPOSURE-${Date.now()}`,
        assetId: assetId
      },
      correlationId
    });

    expect(result.incident.incident_id).toBeTruthy();
    expect(result.incident.correlation_id).toBe(correlationId);
    expect(result.incident.asset_id).toBe(assetId);
    expect(result.correlated).toBe(true);

    const log = await pool.query(
      `SELECT correlation_id FROM governance_incident_ingest_log WHERE correlation_id = $1`,
      [correlationId]
    );
    expect(log.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('maps network segmentation policy violation to governance incident taxonomy', async () => {
    const correlationId = crypto.randomUUID();
    const result = await ingestGovernanceIncident(pool, {
      body: {
        tenantId: 'tenant-01',
        driftType: 'security',
        severity: 'CRITICAL',
        description: 'Network contract test — segmentation policy violation (unauthorized cross-segment traffic)',
        externalTicketId: `NET-SEG-VIOLATION-${Date.now()}`
      },
      correlationId
    });

    expect(result.incident.incident_id).toBeTruthy();
    expect(result.incident.drift_type).toBe('security');
    expect(result.incident.severity).toBe('CRITICAL');
    expect(result.incident.status).toBe('Detected');
  });
});
