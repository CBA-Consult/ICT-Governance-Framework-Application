/**
 * Microsoft Defender for Cloud Apps live polling worker (Action 5.1 / GV.SC.01)
 * Fetches unsanctioned discoveries and pipes them into casb-ingest-parser.
 */
const axios = require('axios');
const { Pool } = require('pg');
const { CASB_CONFIG } = require('../config/casb-config');
const { ingestCasbDiscoveries } = require('./casb-ingest-parser');

let pollingIntervalInstance = null;
let poolInstance = null;
let isRunningCycle = false;

function getPool() {
  if (!poolInstance) {
    poolInstance = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return poolInstance;
}

function mapPortalDiscovery(app, tenantId) {
  const name = app.appName || app.name || app.displayName;
  if (!name) return null;

  const riskScore = Number(app.score ?? app.riskScore ?? app.risk_score ?? 50);

  return {
    externalId: String(app.id || app.appId || `casb-${name.toLowerCase().replace(/\s+/g, '-')}`),
    name,
    serviceUrl: app.domain || app.url || app.serviceUrl || null,
    resourceType: 'SaaS.Application',
    provider: 'Hybrid',
    category: app.category || app.appCategory || 'Cloud Application',
    riskScore,
    users: Number(app.usersCount ?? app.users ?? app.activeUsers ?? 0),
    trafficBytes: Number(app.trafficBytes ?? app.bytes ?? 0),
    sanctioned: app.sanctioned === true || app.status === 'Sanctioned',
    discoveredAt: app.lastSeen || app.discoveredAt || new Date().toISOString(),
    tenantId
  };
}

function mapGraphDiscovery(app, tenantId) {
  const name = app.displayName || app.name;
  if (!name) return null;

  return {
    externalId: String(app.id || `graph-casb-${name.toLowerCase().replace(/\s+/g, '-')}`),
    name,
    serviceUrl: app.hostName || app.url || null,
    resourceType: 'SaaS.Application',
    provider: 'Hybrid',
    category: app.category || 'Cloud Application',
    riskScore: Number(app.riskScore ?? 60),
    users: Number(app.userCount ?? 0),
    sanctioned: false,
    discoveredAt: app.lastModifiedDateTime || new Date().toISOString(),
    tenantId
  };
}

function filterByRiskThreshold(discoveries) {
  return discoveries.filter((d) => d.riskScore >= CASB_CONFIG.minRiskScoreThreshold);
}

async function getAzureGraphToken() {
  const tokenEndpoint = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', process.env.AZURE_CLIENT_ID);
  params.append('client_secret', process.env.AZURE_CLIENT_SECRET);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('grant_type', 'client_credentials');

  const response = await axios.post(tokenEndpoint, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data.access_token;
}

async function fetchPortalDiscoveries() {
  const url = `${CASB_CONFIG.apiBaseUrl}${CASB_CONFIG.discoveryPath}`;
  const response = await axios.get(url, {
    headers: {
      Authorization: `Token ${CASB_CONFIG.apiToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    params: {
      status: 'Unsanctioned',
      limit: CASB_CONFIG.pollingBatchLimit
    },
    timeout: 30000
  });

  const rows = response.data?.data || response.data?.records || response.data?.value || [];
  return rows
    .map((row) => mapPortalDiscovery(row, CASB_CONFIG.defaultTenantId))
    .filter(Boolean);
}

async function fetchGraphDiscoveries() {
  const token = await getAzureGraphToken();
  const response = await axios.get('https://graph.microsoft.com/v1.0/security/cloudAppSecurityProfiles', {
    headers: { Authorization: `Bearer ${token}` },
    params: { $top: CASB_CONFIG.pollingBatchLimit },
    timeout: 30000
  });

  const rows = response.data?.value || [];
  return rows
    .map((row) => mapGraphDiscovery(row, CASB_CONFIG.defaultTenantId))
    .filter(Boolean);
}

function getDemoDiscoveries() {
  const stamp = Date.now();
  return [
    {
      externalId: `casb-demo-dropbox-${stamp}`,
      name: 'Dropbox Personal Shadow',
      serviceUrl: 'https://dropbox.com',
      resourceType: 'SaaS.Application',
      provider: 'Hybrid',
      category: 'Cloud Storage',
      riskScore: 76,
      users: 8,
      trafficBytes: 2400000,
      sanctioned: false,
      discoveredAt: new Date().toISOString(),
      tenantId: CASB_CONFIG.defaultTenantId
    }
  ];
}

async function fetchExternalDiscoveries() {
  if (CASB_CONFIG.demoPollingEnabled && !CASB_CONFIG.isPortalApiConfigured && !CASB_CONFIG.isAzureGraphConfigured) {
    console.log('[CASB Worker] Demo polling mode — using simulated Defender discoveries');
    return getDemoDiscoveries();
  }

  if (CASB_CONFIG.isPortalApiConfigured) {
    return fetchPortalDiscoveries();
  }

  if (CASB_CONFIG.isAzureGraphConfigured) {
    return fetchGraphDiscoveries();
  }

  return [];
}

/**
 * Poll Defender / Graph discovery streams and ingest into asset_register.
 */
async function fetchAndIngestCasbDiscoveries(options = {}) {
  if (!CASB_CONFIG.isPollingEnabled) {
    console.warn('[CASB Worker] Skipped polling loop: Defender CASB credentials are not configured.');
    return { skipped: true, reason: 'not_configured' };
  }

  if (isRunningCycle && !options.force) {
    return { skipped: true, reason: 'cycle_in_progress' };
  }

  isRunningCycle = true;

  try {
    console.log('[CASB Worker] Polling Microsoft Defender for Cloud Apps discovery streams...');

    const discoveries = filterByRiskThreshold(await fetchExternalDiscoveries());
    if (!discoveries.length) {
      console.log('[CASB Worker] No new unsanctioned discoveries above risk threshold.');
      return { ingested: 0, skipped: 0, received: 0 };
    }

    const payload = {
      tenantId: CASB_CONFIG.defaultTenantId,
      source: CASB_CONFIG.isPortalApiConfigured
        ? 'Microsoft Defender for Cloud Apps (Automated Polling)'
        : 'Microsoft Graph CASB Discovery (Automated Polling)',
      discoveries,
      createIncident: options.createIncident !== false
    };

    const pool = options.pool || getPool();
    const result = await ingestCasbDiscoveries(pool, payload);

    console.log(
      `[CASB Worker] Processed ${result.received} discoveries — ingested ${result.ingested}, skipped ${result.skipped} (ingest ${result.ingestId})`
    );

    return result;
  } catch (error) {
    const detail = error.response?.data || error.message;
    console.error('[CASB Worker] Exception in background polling loop:', detail);
    throw error;
  } finally {
    isRunningCycle = false;
  }
}

function startCasbPolling() {
  if (pollingIntervalInstance) {
    return { started: false, reason: 'already_running' };
  }

  if (!CASB_CONFIG.isPollingEnabled) {
    console.log('[CASB Worker] Polling not started — configure DEFENDER_CASB_API_TOKEN or AZURE_* credentials, or set CASB_POLLING_DEMO=true.');
    return { started: false, reason: 'not_configured' };
  }

  fetchAndIngestCasbDiscoveries().catch((err) => {
    console.error('[CASB Worker] Initial poll failed:', err.message);
  });

  pollingIntervalInstance = setInterval(() => {
    fetchAndIngestCasbDiscoveries().catch((err) => {
      console.error('[CASB Worker] Scheduled poll failed:', err.message);
    });
  }, CASB_CONFIG.pollingIntervalMs);

  console.log(`[CASB Worker] Shadow IT scanner initialized (cadence ${CASB_CONFIG.pollingIntervalMs}ms).`);
  return { started: true, intervalMs: CASB_CONFIG.pollingIntervalMs };
}

function stopCasbPolling() {
  if (!pollingIntervalInstance) {
    return { stopped: false };
  }

  clearInterval(pollingIntervalInstance);
  pollingIntervalInstance = null;
  console.log('[CASB Worker] Background polling deactivated.');
  return { stopped: true };
}

module.exports = {
  mapPortalDiscovery,
  mapGraphDiscovery,
  fetchAndIngestCasbDiscoveries,
  startCasbPolling,
  stopCasbPolling,
  getPool
};
