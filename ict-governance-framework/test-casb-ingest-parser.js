/**
 * Unit tests for CASB ingest parser (Focus Area 5)
 */
const {
  normalizeCasbPayload,
  isNoiseDiscovery,
  toAssetRecord
} = require('./services/casb-ingest-parser');

let passed = 0;
let failed = 0;

function assert(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed += 1;
    console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const defenderPayload = {
  tenantId: 'tenant-01',
  source: 'Microsoft Defender for Cloud Apps',
  discoveries: [
    {
      externalId: 'disc-001',
      name: 'Unknown File Sync',
      serviceUrl: 'https://shadow-sync.example.com',
      riskScore: 75
    }
  ]
};

const normalized = normalizeCasbPayload(defenderPayload);
assert('normalize tenant', normalized.tenantId === 'tenant-01');
assert('normalize discovery count', normalized.discoveries.length === 1);
assert('normalize discovery name', normalized.discoveries[0].name === 'Unknown File Sync');

const noise = isNoiseDiscovery({
  name: 'Microsoft Office 365',
  serviceUrl: 'https://office.com',
  riskScore: 10
});
assert('filters office.com noise', noise.skip === true, noise.reason);

const record = toAssetRecord(normalized.discoveries[0], normalized.source);
assert('shadow asset origin tag', record.tags.environment === 'shadow-it');
assert('validation posture unverified', record.validationPosture === 'Unverified');
assert('asset origin shadow_it', record.assetOrigin === 'Shadow_IT');
assert('asset id tenant scoped', record.assetId.includes('/tenants/tenant-01/casb/shadow/'));

console.log(`\nCASB parser unit tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
