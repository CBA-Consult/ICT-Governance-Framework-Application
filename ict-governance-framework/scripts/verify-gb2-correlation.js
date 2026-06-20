require('dotenv').config();
const axios = require('axios');

const ASSET_ID = '/subscriptions/0000-1111/resourceGroups/rg-contoso-healthcare/providers/Microsoft.Compute/virtualMachines/vm-app-prod-01';

const INCIDENT_PAYLOAD = {
  tenantId: 'tenant-01',
  driftType: 'security',
  severity: 'CRITICAL',
  externalTicketId: 'INC-2026-99831',
  assetId: ASSET_ID,
  description: 'Ransomware footprint signature detected via endpoint analytics attempting credential harvesting.'
};

(async () => {
  const verificationRunId = process.env.VERIFICATION_RUN_ID || null;
  const login = await axios.post('http://localhost:4000/api/auth/login', {
    username: 'superadmin',
    password: 'Admin123!'
  });
  const headers = {
    Authorization: `Bearer ${login.data.tokens.accessToken}`,
    ...(verificationRunId ? { 'x-verification-run-id': verificationRunId } : {})
  };

  const assetList = await axios.get('http://localhost:4000/api/assets?tenantId=tenant-01', { headers });
  if (!assetList.data.count) {
    console.log('No assets found — seeding G-B1 VM via sync...');
    await axios.post('http://localhost:4000/api/assets/sync', {
      assetId: ASSET_ID,
      tenantId: 'tenant-01',
      provider: 'Azure',
      resourceType: 'Microsoft.Compute/virtualMachines',
      name: 'vm-app-prod-01',
      location: 'westeurope',
      tags: { environment: 'production', criticality: 'high' },
      complianceState: 'Compliant',
      ...(verificationRunId ? { verificationRunId } : {})
    }, { headers });
  }

  const ingest = await axios.post(
    'http://localhost:4000/api/governance/incidents',
    {
      ...INCIDENT_PAYLOAD,
      ...(verificationRunId ? { verificationRunId } : {})
    },
    { headers }
  );
  console.log('INGEST correlated:', ingest.data.correlated);
  console.log('INCIDENT asset_id:', ingest.data.incident?.asset_id || 'none');

  if (!ingest.data.correlated) {
    console.error('FAILED: expected correlated=true');
    process.exit(1);
  }

  const list = await axios.get('http://localhost:4000/api/governance/incidents?limit=5', { headers });
  const latest = list.data.incidents?.[0];
  console.log('LIST latest asset_name:', latest?.asset_name || 'none');
  console.log('G-B2 verification PASSED');
})().catch((e) => {
  console.error('FAILED:', e.response?.status, e.response?.data || e.message);
  process.exit(1);
});
