// File: ict-governance-framework/api/framework/enterprise-integration.js
// Enterprise Integration Framework for connecting with enterprise systems

const axios = require('axios');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Enterprise Integration Framework
 * Provides standardized patterns for integrating with enterprise systems
 */
class EnterpriseIntegration extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      enableMetrics: true,
      enableCaching: true,
      ...options
    };
    
    this.adapters = new Map();
    this.circuitBreakers = new Map();
    this.metrics = new Map();
    this.cache = new Map();
    
    this.initializeAdapters();
  }

  /**
   * Initialize enterprise system adapters
   */
  initializeAdapters() {
    // Azure Active Directory Adapter
    this.registerAdapter('azure-ad', new AzureADAdapter({
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
      ...this.options
    }));

    // Microsoft Defender for Cloud Apps Adapter
    this.registerAdapter('defender-cloud-apps', new DefenderCloudAppsAdapter({
      tenantId: process.env.AZURE_TENANT_ID,
      apiUrl: process.env.DEFENDER_API_URL,
      ...this.options
    }));

    // ServiceNow ITSM Adapter
    this.registerAdapter('servicenow', new ServiceNowAdapter({
      instanceUrl: process.env.SERVICENOW_INSTANCE_URL,
      username: process.env.SERVICENOW_USERNAME,
      password: process.env.SERVICENOW_PASSWORD,
      ...this.options
    }));

    // Power BI Adapter
    this.registerAdapter('power-bi', new PowerBIAdapter({
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.POWERBI_CLIENT_ID,
      clientSecret: process.env.POWERBI_CLIENT_SECRET,
      ...this.options
    }));

    // Legacy System Adapter
    this.registerAdapter('legacy-systems', new LegacySystemAdapter({
      sftpHost: process.env.LEGACY_SFTP_HOST,
      sftpUsername: process.env.LEGACY_SFTP_USERNAME,
      sftpPassword: process.env.LEGACY_SFTP_PASSWORD,
      ...this.options
    }));

    // Multi-Cloud Adapters
    this.registerAdapter('aws', new AWSAdapter({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      ...this.options
    }));

    this.registerAdapter('gcp', new GCPAdapter({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE,
      ...this.options
    }));
  }

  /**
   * Register an integration adapter
   */
  registerAdapter(name, adapter) {
    this.adapters.set(name, adapter);
    this.circuitBreakers.set(name, new CircuitBreaker(name, this.options));
    
    // Set up event forwarding
    adapter.on('error', (error) => this.emit('adapter-error', { adapter: name, error }));
    adapter.on('success', (data) => this.emit('adapter-success', { adapter: name, data }));
    
    console.log(`Registered enterprise adapter: ${name}`);
  }

  /**
   * Execute integration with circuit breaker and retry logic
   */
  async executeIntegration(adapterName, operation, params = {}, options = {}) {
    const adapter = this.adapters.get(adapterName);
    if (!adapter) {
      throw new Error(`Adapter not found: ${adapterName}`);
    }

    const circuitBreaker = this.circuitBreakers.get(adapterName);
    const operationId = uuidv4();
    const startTime = Date.now();

    try {
      // Check circuit breaker
      if (circuitBreaker.isOpen()) {
        throw new Error(`Circuit breaker is open for adapter: ${adapterName}`);
      }

      // Check cache if enabled
      const cacheKey = this.generateCacheKey(adapterName, operation, params);
      if (options.useCache !== false && this.options.enableCaching) {
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult && cachedResult.expires > Date.now()) {
          this.recordMetrics(adapterName, operation, Date.now() - startTime, true, 'cache-hit');
          return cachedResult.data;
        }
      }

      // Execute with retry logic
      const result = await this.executeWithRetry(adapter, operation, params, options);
      
      // Cache result if applicable
      if (options.cacheTTL && this.options.enableCaching) {
        this.cache.set(cacheKey, {
          data: result,
          expires: Date.now() + (options.cacheTTL * 1000)
        });
      }

      // Record success metrics
      circuitBreaker.recordSuccess();
      this.recordMetrics(adapterName, operation, Date.now() - startTime, true);
      
      this.emit('integration-success', {
        operationId,
        adapter: adapterName,
        operation,
        duration: Date.now() - startTime,
        result
      });

      return result;

    } catch (error) {
      // Record failure metrics
      circuitBreaker.recordFailure();
      this.recordMetrics(adapterName, operation, Date.now() - startTime, false);
      
      this.emit('integration-error', {
        operationId,
        adapter: adapterName,
        operation,
        duration: Date.now() - startTime,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry(adapter, operation, params, options) {
    let lastError;
    const maxAttempts = options.retryAttempts || this.options.retryAttempts;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await adapter[operation](params);
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain error types
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        if (attempt < maxAttempts) {
          const delay = this.calculateRetryDelay(attempt, options.retryDelay || this.options.retryDelay);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Check if error should not be retried
   */
  isNonRetryableError(error) {
    const nonRetryableCodes = [400, 401, 403, 404, 422];
    return error.response && nonRetryableCodes.includes(error.response.status);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt, baseDelay) {
    return baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
  }

  /**
   * Generate cache key for operation
   */
  generateCacheKey(adapter, operation, params) {
    const hash = crypto.createHash('md5');
    hash.update(`${adapter}:${operation}:${JSON.stringify(params)}`);
    return hash.digest('hex');
  }

  /**
   * Record integration metrics
   */
  recordMetrics(adapter, operation, duration, success, source = 'direct') {
    const key = `${adapter}:${operation}`;
    const existing = this.metrics.get(key) || {
      count: 0,
      successCount: 0,
      totalDuration: 0,
      cacheHits: 0
    };

    existing.count++;
    existing.totalDuration += duration;
    if (success) existing.successCount++;
    if (source === 'cache-hit') existing.cacheHits++;

    this.metrics.set(key, existing);
  }

  /**
   * Get integration metrics
   */
  getMetrics() {
    const metrics = {};
    for (const [key, value] of this.metrics.entries()) {
      metrics[key] = {
        ...value,
        successRate: (value.successCount / value.count) * 100,
        avgDuration: value.totalDuration / value.count,
        cacheHitRate: (value.cacheHits / value.count) * 100
      };
    }
    return metrics;
  }

  /**
   * Get adapter health status
   */
  async getAdapterHealth() {
    const health = {};
    
    for (const [name, adapter] of this.adapters.entries()) {
      try {
        const circuitBreaker = this.circuitBreakers.get(name);
        const adapterHealth = await adapter.healthCheck();
        
        health[name] = {
          status: adapterHealth.status,
          circuitBreaker: {
            state: circuitBreaker.getState(),
            failures: circuitBreaker.failures,
            lastFailure: circuitBreaker.lastFailure
          },
          metrics: this.getAdapterMetrics(name),
          ...adapterHealth
        };
      } catch (error) {
        health[name] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
    
    return health;
  }

  /**
   * Get metrics for specific adapter
   */
  getAdapterMetrics(adapterName) {
    const adapterMetrics = {};
    for (const [key, value] of this.metrics.entries()) {
      if (key.startsWith(`${adapterName}:`)) {
        const operation = key.split(':')[1];
        adapterMetrics[operation] = {
          ...value,
          successRate: (value.successCount / value.count) * 100,
          avgDuration: value.totalDuration / value.count
        };
      }
    }
    return adapterMetrics;
  }

  /**
   * Clear cache
   */
  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.threshold = options.circuitBreakerThreshold || 5;
    this.timeout = options.circuitBreakerTimeout || 60000;
    this.failures = 0;
    this.lastFailure = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  recordSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  isOpen() {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  getState() {
    return this.state;
  }
}

/**
 * Base Integration Adapter
 */
class BaseAdapter extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.client = this.createClient();
  }

  createClient() {
    return axios.create({
      timeout: this.config.timeout || 30000,
      headers: {
        'User-Agent': 'ICT-Governance-Framework/2.0.0',
        'Content-Type': 'application/json'
      }
    });
  }

  async healthCheck() {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  }
}

/**
 * Azure Active Directory Adapter
 */
class AzureADAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.tokenCache = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.tokenCache && this.tokenExpiry > Date.now()) {
      return this.tokenCache;
    }

    const response = await this.client.post(
      `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    this.tokenCache = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

    return this.tokenCache;
  }

  async getUsers(params = {}) {
    const token = await this.getAccessToken();
    const response = await this.client.get('https://graph.microsoft.com/v1.0/users', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  }

  async getGroups(params = {}) {
    const token = await this.getAccessToken();
    const response = await this.client.get('https://graph.microsoft.com/v1.0/groups', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  }

  async healthCheck() {
    try {
      await this.getAccessToken();
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}

/**
 * Microsoft Defender for Cloud Apps Adapter
 */
class DefenderCloudAppsAdapter extends BaseAdapter {
  async getDiscoveredApps(params = {}) {
    // Implementation for Defender Cloud Apps API
    const response = await this.client.get(`${this.config.apiUrl}/api/v1/discovery/discovered_apps/`, {
      headers: { Authorization: `Token ${this.config.apiToken}` },
      params
    });
    return response.data;
  }

  async getAlerts(params = {}) {
    const response = await this.client.get(`${this.config.apiUrl}/api/v1/alerts/`, {
      headers: { Authorization: `Token ${this.config.apiToken}` },
      params
    });
    return response.data;
  }
}

/**
 * ServiceNow ITSM Adapter
 */
class ServiceNowAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.client.defaults.auth = {
      username: config.username,
      password: config.password
    };
    this.client.defaults.baseURL = config.instanceUrl;
  }

  async getIncidents(params = {}) {
    const response = await this.client.get('/api/now/table/incident', { params });
    return response.data;
  }

  async createIncident(data) {
    const response = await this.client.post('/api/now/table/incident', data);
    return response.data;
  }

  async getChangeRequests(params = {}) {
    const response = await this.client.get('/api/now/table/change_request', { params });
    return response.data;
  }
}

/**
 * Power BI Adapter
 */
class PowerBIAdapter extends BaseAdapter {
  async getReports(params = {}) {
    const token = await this.getAccessToken();
    const response = await this.client.get('https://api.powerbi.com/v1.0/myorg/reports', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  }

  async getDatasets(params = {}) {
    const token = await this.getAccessToken();
    const response = await this.client.get('https://api.powerbi.com/v1.0/myorg/datasets', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  }

  async getAccessToken() {
    // Similar to Azure AD token acquisition
    const response = await this.client.post(
      `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'https://analysis.windows.net/powerbi/api/.default',
        grant_type: 'client_credentials'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data.access_token;
  }
}

/**
 * Legacy System Adapter
 */
class LegacySystemAdapter extends BaseAdapter {
  async processFileTransfer(params = {}) {
    // Implementation for SFTP file processing
    // This would integrate with an SFTP library like ssh2-sftp-client
    return { status: 'processed', files: params.files || [] };
  }

  async getMainframeData(params = {}) {
    // Implementation for mainframe data extraction
    return { status: 'extracted', records: params.records || [] };
  }
}

/**
 * AWS Adapter
 */
class AWSAdapter extends BaseAdapter {
  async getResources(params = {}) {
    // Implementation for AWS resource discovery
    return { resources: [] };
  }

  async getPolicies(params = {}) {
    // Implementation for AWS policy management
    return { policies: [] };
  }
}

/**
 * GCP Adapter
 */
class GCPAdapter extends BaseAdapter {
  async getResources(params = {}) {
    // Implementation for GCP resource discovery
    return { resources: [] };
  }

  async getPolicies(params = {}) {
    // Implementation for GCP policy management
    return { policies: [] };
  }
}

module.exports = {
  EnterpriseIntegration,
  BaseAdapter,
  AzureADAdapter,
  DefenderCloudAppsAdapter,
  ServiceNowAdapter,
  PowerBIAdapter,
  LegacySystemAdapter,
  AWSAdapter,
  GCPAdapter
};