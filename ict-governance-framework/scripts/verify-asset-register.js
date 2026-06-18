require('dotenv').config();
const axios = require('axios');

const PAYLOAD = {
  assetId: '/subscriptions/0000-1111/resourceGroups/rg-contoso-healthcare/providers/Microsoft.Compute/virtualMachines/vm-app-prod-01',
  tenantId: 'tenant-01',
  provider: 'Azure',
  resourceType: 'Microsoft.Compute/virtualMachines',
  name: 'vm-app-prod-01',
  location: 'westeurope',
  tags: { environment: 'production', criticality: 'high', 'adpa-scope': 'true' },
  complianceState: 'Compliant'
};

(async () => {
  const login = await axios.post('http://localhost:4000/api/auth/login', {
    username: 'superadmin',
    password: 'Admin123!'
  });
  const headers = { Authorization: `Bearer ${login.data.tokens.accessToken}` };

  const sync = await axios.post('http://localhost:4000/api/assets/sync', PAYLOAD, { headers });
  console.log('SYNC OK:', sync.data.asset.name);

  const list = await axios.get('http://localhost:4000/api/assets?tenantId=tenant-01', { headers });
  console.log('LIST count:', list.data.count);

  const summary = await axios.get('http://localhost:4000/api/assets/summary', { headers });
  console.log('SUMMARY total:', summary.data.total);
})().catch((e) => {
  console.error('FAILED:', e.response?.status, e.response?.data || e.message);
  process.exit(1);
});
