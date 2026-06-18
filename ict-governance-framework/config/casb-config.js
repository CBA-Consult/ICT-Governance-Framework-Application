/**
 * Microsoft Defender for Cloud Apps polling configuration (Focus Area 5 / Action 5.1)
 * Zero-Trust: outbound loops only run when credentials are explicitly configured.
 */
const CASB_CONFIG = {
  get apiBaseUrl() {
    return (
      process.env.DEFENDER_CASB_API_URL
      || process.env.DEFENDER_CLOUDAPPS_API_URL
      || 'https://api.portal.cloudappsecurity.com'
    ).replace(/\/$/, '');
  },

  get apiToken() {
    return process.env.DEFENDER_CASB_API_TOKEN || process.env.DEFENDER_CLOUDAPPS_API_TOKEN || null;
  },

  get discoveryPath() {
    return process.env.DEFENDER_CASB_DISCOVERY_PATH || '/api/v1/discovery/discovered_apps/';
  },

  get defaultTenantId() {
    return process.env.DEFAULT_TENANT_ID || process.env.CASB_TENANT_ID || 'tenant-01';
  },

  get pollingIntervalMs() {
    return parseInt(process.env.CASB_POLLING_INTERVAL_MS, 10) || 300000;
  },

  get minRiskScoreThreshold() {
    const fromEnv = parseInt(process.env.CASB_MIN_RISK_SCORE, 10);
    if (!Number.isNaN(fromEnv)) return fromEnv;
    return 70;
  },

  get pollingBatchLimit() {
    return parseInt(process.env.CASB_POLLING_BATCH_LIMIT, 10) || 50;
  },

  get demoPollingEnabled() {
    return process.env.CASB_POLLING_DEMO === 'true';
  },

  get isPortalApiConfigured() {
    return Boolean(this.apiToken);
  },

  get isAzureGraphConfigured() {
    return Boolean(
      process.env.AZURE_TENANT_ID
      && process.env.AZURE_CLIENT_ID
      && process.env.AZURE_CLIENT_SECRET
    );
  },

  get isPollingEnabled() {
    return (
      this.isPortalApiConfigured
      || this.isAzureGraphConfigured
      || this.demoPollingEnabled
    );
  },

  get shouldAutoStartWorker() {
    return (
      process.env.NODE_ENV === 'production'
      || process.env.ENABLE_BACKGROUND_WORKERS === 'true'
    ) && this.isPollingEnabled;
  }
};

module.exports = { CASB_CONFIG };
