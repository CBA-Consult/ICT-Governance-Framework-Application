require('dotenv').config();
const axios = require('axios');

function buildShadowPayload(runSuffix) {
  const suffix = runSuffix || 'static';
  return {
    tenantId: 'tenant-01',
    source: 'Microsoft Defender for Cloud Apps',
    createIncident: false,
    discoveries: [
      {
        externalId: `casb-shadow-we-transfer-${suffix}`,
        name: 'WeTransfer Shadow Instance',
        serviceUrl: 'https://wetransfer.com',
        resourceType: 'SaaS.Application',
        provider: 'Hybrid',
        category: 'Cloud Storage',
        riskScore: 82,
        users: 14,
        trafficBytes: 9200000,
        sanctioned: false
      },
      {
        externalId: `casb-noise-office-${suffix}`,
        name: 'Microsoft Office 365',
        serviceUrl: 'https://office.com',
        riskScore: 10,
        sanctioned: false
      }
    ]
  };
}

(async () => {
  const verificationRunId = process.env.VERIFICATION_RUN_ID || null;
  const runSuffix = verificationRunId ? verificationRunId.slice(0, 8) : 'static';

  const login = await axios.post('http://localhost:4000/api/auth/login', {
    username: 'superadmin',
    password: 'Admin123!'
  });

  const headers = { Authorization: `Bearer ${login.data.tokens.accessToken}` };
  if (verificationRunId) {
    headers['x-verification-run-id'] = verificationRunId;
  }

  const payload = {
    ...buildShadowPayload(runSuffix),
    ...(verificationRunId ? { verificationRunId } : {})
  };

  const ingest = await axios.post('http://localhost:4000/api/assets/casb-ingest', payload, { headers });
  console.log('INGEST', {
    ingestId: ingest.data.ingestId,
    ingested: ingest.data.ingested,
    skipped: ingest.data.skipped,
    verificationRunId: verificationRunId || '(none)'
  });

  if (ingest.data.ingested < 1 || ingest.data.skipped < 1) {
    console.error('FAILED: expected 1 ingested and 1 skipped (office.com noise)');
    process.exit(1);
  }

  const shadowAsset = ingest.data.assets[0];
  const promote = await axios.post(
    'http://localhost:4000/api/assets/validation/promote',
    {
      assetId: shadowAsset.asset_id,
      validationPosture: 'Verified',
      onboardingTemplate: 'blueprint-templates/saas-onboarding.bicep',
      complianceState: 'Compliant'
    },
    { headers }
  );

  console.log('PROMOTED', {
    assetOrigin: promote.data.asset.asset_origin,
    validationPosture: promote.data.asset.validation_posture
  });

  if (promote.data.asset.validation_posture !== 'Verified' || promote.data.asset.asset_origin !== 'Managed') {
    console.error('FAILED: promotion did not move asset to Managed/Verified');
    process.exit(1);
  }

  const summary = await axios.get('http://localhost:4000/api/assets/summary', { headers });
  console.log('SUMMARY unverifiedShadowIt:', summary.data.unverifiedShadowIt);
  console.log('Focus Area 5 CASB ingest verification PASSED');
})().catch((e) => {
  console.error('FAILED:', e.response?.status, e.response?.data || e.message);
  process.exit(1);
});
