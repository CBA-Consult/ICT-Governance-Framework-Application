require('dotenv').config();
const { Pool } = require('pg');
const { ingestCasbDiscoveries, promoteValidationPosture } = require('../services/casb-ingest-parser');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PAYLOAD = {
  tenantId: 'tenant-01',
  source: 'Microsoft Defender for Cloud Apps',
  discoveries: [
    {
      externalId: 'casb-shadow-we-transfer-2026',
      name: 'WeTransfer Shadow Instance',
      serviceUrl: 'https://wetransfer.com',
      riskScore: 82,
      users: 14
    },
    {
      externalId: 'casb-noise-office',
      name: 'Microsoft Office 365',
      serviceUrl: 'https://office.com',
      riskScore: 10
    }
  ]
};

(async () => {
  const result = await ingestCasbDiscoveries(pool, PAYLOAD);
  console.log('INGEST', { ingested: result.ingested, skipped: result.skipped });

  if (result.ingested < 1 || result.skipped < 1) {
    throw new Error('Expected 1 ingested and 1 skipped');
  }

  const asset = await promoteValidationPosture(
    pool,
    result.assets[0].asset_id,
    'Verified',
    { onboardingTemplate: 'blueprint-templates/saas-onboarding.bicep' }
  );

  if (asset.validation_posture !== 'Verified' || asset.asset_origin !== 'Managed') {
    throw new Error('Promotion to Managed/Verified failed');
  }

  console.log('Focus Area 5 CASB direct verification PASSED');
  await pool.end();
})().catch(async (err) => {
  console.error('FAILED:', err.message);
  await pool.end();
  process.exit(1);
});
