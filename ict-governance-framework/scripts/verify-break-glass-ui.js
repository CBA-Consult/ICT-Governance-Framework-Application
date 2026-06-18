/**
 * Verifies Break Glass → asset register UI enrichment pipeline.
 * Requires API server on :4000 with BREAK_GLASS_ALLOWED=true and JIT_ENFORCEMENT_ENABLED=true.
 */
require('dotenv').config();
const axios = require('axios');

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const BG_SECRET = process.env.BREAK_GLASS_SYSTEM_SECRET || 'test-break-glass-secret-for-ci';

(async () => {
  const login = await axios.post(`${API}/auth/login`, {
    username: 'superadmin',
    password: 'Admin123!'
  });
  const token = login.data.accessToken;
  const headers = { Authorization: `Bearer ${token}` };

  const activate = await axios.post(`${API}/auth/jit/emergency/activate`, {
    requestorId: 'USR-SUPERADMIN-001',
    breakGlassKey: BG_SECRET,
    justification: 'UI verification run — identity platform degraded for enrichment trace test.',
    scopeTenant: 'tenant-01'
  });

  const emergencyToken = activate.data.emergencyToken;
  const testAssetId = `/tenants/tenant-01/break-glass/ui-verify-${Date.now()}`;

  await axios.post(
    `${API}/assets/sync`,
    {
      assetId: testAssetId,
      tenantId: 'tenant-01',
      provider: 'Azure',
      resourceType: 'microsoft.compute/virtualmachines',
      name: 'bg-ui-verify-vm',
      location: 'westeurope',
      complianceState: 'Unevaluated',
      tags: { environment: 'production' }
    },
    {
      headers: {
        ...headers,
        'X-JIT-Context': `Bearer ${emergencyToken}`
      }
    }
  );

  const assetsRes = await axios.get(`${API}/assets`, { headers });
  const asset = assetsRes.data.assets.find((a) => a.asset_id === testAssetId);

  if (!asset?.is_emergency) {
    console.error('FAIL: asset missing is_emergency flag after break glass sync');
    process.exit(1);
  }

  console.log('PASS: asset enriched with break glass emergency context');
  console.log(JSON.stringify({
    asset_id: asset.asset_id,
    is_emergency: asset.is_emergency,
    emergency_ticket_id: asset.emergency_ticket_id,
    emergency_ticket_active: asset.emergency_ticket_active
  }, null, 2));
})().catch((err) => {
  console.error('verify-break-glass-ui failed:', err.response?.data || err.message);
  process.exit(1);
});
