/**
 * Unit tests for Defender CASB polling mapper (Action 5.1)
 */
const { mapPortalDiscovery, mapGraphDiscovery } = require('./services/casb-polling-worker');
const { CASB_CONFIG } = require('./config/casb-config');

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

const portal = mapPortalDiscovery({
  id: 'mcas-991',
  appName: 'WeTransfer Shadow Instance',
  domain: 'wetransfer.com',
  score: 82,
  usersCount: 14
}, 'tenant-01');

assert('portal maps name', portal.name === 'WeTransfer Shadow Instance');
assert('portal maps risk', portal.riskScore === 82);
assert('portal maps users', portal.users === 14);

const graph = mapGraphDiscovery({
  id: 'graph-22',
  displayName: 'Unknown SaaS',
  hostName: 'shadow.example.com',
  riskScore: 71
}, 'tenant-01');

assert('graph maps displayName', graph.name === 'Unknown SaaS');
assert('graph external id', graph.externalId === 'graph-22');

assert('config default interval', CASB_CONFIG.pollingIntervalMs === 300000 || CASB_CONFIG.pollingIntervalMs > 0);

console.log(`\nCASB polling unit tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
