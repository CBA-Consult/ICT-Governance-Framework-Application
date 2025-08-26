// File: ict-governance-framework/api/framework/api-management.js
// API Management and Versioning Framework

const express = require('express');
const { Pool } = require('pg');
const semver = require('semver');
const { v4: uuidv4 } = require('uuid');
const yaml = require('js-yaml');
const fs = require('fs').promises;
const path = require('path');

/**
 * API Management Framework
 * Provides comprehensive API lifecycle management, versioning, and governance
 */
class APIManagement {
  constructor(options = {}) {
    this.options = {
      basePath: '/api',
      defaultVersion: '2.0.0',
      supportedVersions: ['1.0.0', '2.0.0'],
      deprecationNoticeMonths: 12,
      enableDocumentation: true,
      enableMetrics: true,
      enableValidation: true,
      ...options
    };
    
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.apis = new Map();
    this.schemas = new Map();
    this.metrics = new Map();
    this.deprecationNotices = new Map();
    
    this.initializeAPIRegistry();
  }

  /**
   * Initialize API registry and load existing APIs
   */
  async initializeAPIRegistry() {
    try {
      await this.createAPIRegistryTables();
      await this.loadRegisteredAPIs();
      console.log('API Management framework initialized');
    } catch (error) {
      console.error('Failed to initialize API Management:', error);
    }
  }

  /**
   * Create database tables for API registry
   */
  async createAPIRegistryTables() {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS api_registry (
          api_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          version VARCHAR(20) NOT NULL,
          base_path VARCHAR(200) NOT NULL,
          description TEXT,
          status VARCHAR(20) DEFAULT 'active',
          deprecated_at TIMESTAMP,
          sunset_at TIMESTAMP,
          owner_team VARCHAR(100),
          contact_email VARCHAR(255),
          documentation_url TEXT,
          openapi_spec JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(name, version)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS api_endpoints (
          endpoint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          api_id UUID REFERENCES api_registry(api_id) ON DELETE CASCADE,
          method VARCHAR(10) NOT NULL,
          path VARCHAR(500) NOT NULL,
          description TEXT,
          parameters JSONB,
          responses JSONB,
          security_requirements JSONB,
          rate_limit_tier VARCHAR(20) DEFAULT 'standard',
          cache_ttl INTEGER DEFAULT 300,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(api_id, method, path)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS api_metrics (
          metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          api_id UUID REFERENCES api_registry(api_id) ON DELETE CASCADE,
          endpoint_id UUID REFERENCES api_endpoints(endpoint_id) ON DELETE CASCADE,
          timestamp TIMESTAMP DEFAULT NOW(),
          request_count INTEGER DEFAULT 0,
          error_count INTEGER DEFAULT 0,
          avg_response_time DECIMAL(10,2),
          status_codes JSONB,
          user_agents JSONB,
          ip_addresses JSONB
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS api_consumers (
          consumer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          api_key VARCHAR(255) UNIQUE NOT NULL,
          contact_email VARCHAR(255),
          organization VARCHAR(100),
          rate_limit_tier VARCHAR(20) DEFAULT 'standard',
          allowed_apis JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          last_used_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS api_usage_logs (
          log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          consumer_id UUID REFERENCES api_consumers(consumer_id),
          api_id UUID REFERENCES api_registry(api_id),
          endpoint_id UUID REFERENCES api_endpoints(endpoint_id),
          timestamp TIMESTAMP DEFAULT NOW(),
          method VARCHAR(10),
          path VARCHAR(500),
          status_code INTEGER,
          response_time INTEGER,
          request_size INTEGER,
          response_size INTEGER,
          user_agent TEXT,
          ip_address INET,
          correlation_id UUID
        )
      `);

      console.log('API registry tables created successfully');
    } finally {
      client.release();
    }
  }

  /**
   * Load registered APIs from database
   */
  async loadRegisteredAPIs() {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT ar.*, 
               json_agg(
                 json_build_object(
                   'endpoint_id', ae.endpoint_id,
                   'method', ae.method,
                   'path', ae.path,
                   'description', ae.description,
                   'parameters', ae.parameters,
                   'responses', ae.responses,
                   'security_requirements', ae.security_requirements,
                   'rate_limit_tier', ae.rate_limit_tier,
                   'cache_ttl', ae.cache_ttl
                 )
               ) as endpoints
        FROM api_registry ar
        LEFT JOIN api_endpoints ae ON ar.api_id = ae.api_id
        WHERE ar.status = 'active'
        GROUP BY ar.api_id
      `);

      for (const row of result.rows) {
        this.apis.set(`${row.name}:${row.version}`, {
          ...row,
          endpoints: row.endpoints.filter(e => e.endpoint_id !== null)
        });
      }

      console.log(`Loaded ${result.rows.length} APIs from registry`);
    } finally {
      client.release();
    }
  }

  /**
   * Register a new API version
   */
  async registerAPI(apiSpec) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate API specification
      this.validateAPISpec(apiSpec);

      // Insert API registry entry
      const apiResult = await client.query(`
        INSERT INTO api_registry (
          name, version, base_path, description, status, owner_team, 
          contact_email, documentation_url, openapi_spec
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING api_id
      `, [
        apiSpec.name,
        apiSpec.version,
        apiSpec.basePath,
        apiSpec.description,
        apiSpec.status || 'active',
        apiSpec.ownerTeam,
        apiSpec.contactEmail,
        apiSpec.documentationUrl,
        JSON.stringify(apiSpec.openapi || {})
      ]);

      const apiId = apiResult.rows[0].api_id;

      // Insert endpoints
      if (apiSpec.endpoints) {
        for (const endpoint of apiSpec.endpoints) {
          await client.query(`
            INSERT INTO api_endpoints (
              api_id, method, path, description, parameters, responses,
              security_requirements, rate_limit_tier, cache_ttl
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            apiId,
            endpoint.method.toUpperCase(),
            endpoint.path,
            endpoint.description,
            JSON.stringify(endpoint.parameters || {}),
            JSON.stringify(endpoint.responses || {}),
            JSON.stringify(endpoint.security || []),
            endpoint.rateLimitTier || 'standard',
            endpoint.cacheTTL || 300
          ]);
        }
      }

      await client.query('COMMIT');

      // Cache the API
      this.apis.set(`${apiSpec.name}:${apiSpec.version}`, {
        api_id: apiId,
        ...apiSpec
      });

      console.log(`Registered API: ${apiSpec.name} v${apiSpec.version}`);
      return apiId;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate API specification
   */
  validateAPISpec(apiSpec) {
    const required = ['name', 'version', 'basePath'];
    for (const field of required) {
      if (!apiSpec[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!semver.valid(apiSpec.version)) {
      throw new Error(`Invalid version format: ${apiSpec.version}`);
    }

    if (apiSpec.endpoints) {
      for (const endpoint of apiSpec.endpoints) {
        if (!endpoint.method || !endpoint.path) {
          throw new Error('Endpoints must have method and path');
        }
      }
    }
  }

  /**
   * Create versioned router with automatic routing
   */
  createVersionedRouter(apiName) {
    const router = express.Router();

    // Version detection middleware
    router.use((req, res, next) => {
      // Try to get version from header, query param, or path
      let version = req.headers['api-version'] || 
                   req.query.version || 
                   req.path.match(/^\/v(\d+\.\d+\.\d+)/)?.[1];

      if (!version) {
        // Extract from Accept header
        const acceptHeader = req.headers.accept;
        if (acceptHeader) {
          const versionMatch = acceptHeader.match(/application\/vnd\.api\+json;version=(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            version = versionMatch[1];
          }
        }
      }

      // Default to latest supported version
      if (!version) {
        version = this.getLatestVersion(apiName);
      }

      // Validate version
      if (!this.isVersionSupported(apiName, version)) {
        return res.status(400).json({
          error: {
            code: 'UNSUPPORTED_VERSION',
            message: `API version ${version} is not supported`,
            supportedVersions: this.getSupportedVersions(apiName)
          }
        });
      }

      req.apiVersion = version;
      req.apiName = apiName;
      
      // Add deprecation warning if applicable
      if (this.isVersionDeprecated(apiName, version)) {
        const deprecationInfo = this.getDeprecationInfo(apiName, version);
        res.setHeader('Deprecation', deprecationInfo.deprecatedAt);
        res.setHeader('Sunset', deprecationInfo.sunsetAt);
        res.setHeader('Link', `<${deprecationInfo.migrationGuide}>; rel="successor-version"`);
      }

      next();
    });

    // API metrics middleware
    router.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        this.recordAPIUsage({
          apiName: req.apiName,
          version: req.apiVersion,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime: Date.now() - startTime,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          correlationId: req.correlationId
        });
      });

      next();
    });

    return router;
  }

  /**
   * Get latest version for an API
   */
  getLatestVersion(apiName) {
    const versions = [];
    for (const [key, api] of this.apis.entries()) {
      if (key.startsWith(`${apiName}:`)) {
        versions.push(api.version);
      }
    }
    
    return versions.length > 0 ? semver.maxSatisfying(versions, '*') : this.options.defaultVersion;
  }

  /**
   * Check if version is supported
   */
  isVersionSupported(apiName, version) {
    return this.apis.has(`${apiName}:${version}`);
  }

  /**
   * Get supported versions for an API
   */
  getSupportedVersions(apiName) {
    const versions = [];
    for (const [key, api] of this.apis.entries()) {
      if (key.startsWith(`${apiName}:`) && api.status === 'active') {
        versions.push(api.version);
      }
    }
    return versions.sort(semver.compare);
  }

  /**
   * Check if version is deprecated
   */
  isVersionDeprecated(apiName, version) {
    const api = this.apis.get(`${apiName}:${version}`);
    return api && api.deprecated_at;
  }

  /**
   * Get deprecation information
   */
  getDeprecationInfo(apiName, version) {
    const api = this.apis.get(`${apiName}:${version}`);
    if (!api || !api.deprecated_at) return null;

    return {
      deprecatedAt: api.deprecated_at,
      sunsetAt: api.sunset_at,
      migrationGuide: `${api.documentation_url}/migration`,
      reason: api.deprecation_reason
    };
  }

  /**
   * Deprecate an API version
   */
  async deprecateVersion(apiName, version, sunsetDate, reason) {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE api_registry 
        SET status = 'deprecated', 
            deprecated_at = NOW(), 
            sunset_at = $3,
            deprecation_reason = $4,
            updated_at = NOW()
        WHERE name = $1 AND version = $2
        RETURNING api_id
      `, [apiName, version, sunsetDate, reason]);

      if (result.rows.length === 0) {
        throw new Error(`API ${apiName} v${version} not found`);
      }

      // Update cache
      const api = this.apis.get(`${apiName}:${version}`);
      if (api) {
        api.status = 'deprecated';
        api.deprecated_at = new Date().toISOString();
        api.sunset_at = sunsetDate;
        api.deprecation_reason = reason;
      }

      console.log(`Deprecated API: ${apiName} v${version}`);
      return result.rows[0].api_id;

    } finally {
      client.release();
    }
  }

  /**
   * Record API usage metrics
   */
  async recordAPIUsage(usage) {
    try {
      const client = await this.pool.connect();
      
      // Get API and endpoint IDs
      const api = this.apis.get(`${usage.apiName}:${usage.version}`);
      if (!api) return;

      const endpoint = api.endpoints?.find(e => 
        e.method === usage.method && e.path === usage.path
      );

      await client.query(`
        INSERT INTO api_usage_logs (
          api_id, endpoint_id, method, path, status_code, response_time,
          user_agent, ip_address, correlation_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        api.api_id,
        endpoint?.endpoint_id,
        usage.method,
        usage.path,
        usage.statusCode,
        usage.responseTime,
        usage.userAgent,
        usage.ipAddress,
        usage.correlationId
      ]);

      client.release();

      // Update in-memory metrics
      this.updateMetrics(usage);

    } catch (error) {
      console.error('Failed to record API usage:', error);
    }
  }

  /**
   * Update in-memory metrics
   */
  updateMetrics(usage) {
    const key = `${usage.apiName}:${usage.version}:${usage.method}:${usage.path}`;
    const existing = this.metrics.get(key) || {
      count: 0,
      errors: 0,
      totalResponseTime: 0,
      statusCodes: {}
    };

    existing.count++;
    existing.totalResponseTime += usage.responseTime;
    
    if (usage.statusCode >= 400) {
      existing.errors++;
    }

    existing.statusCodes[usage.statusCode] = (existing.statusCodes[usage.statusCode] || 0) + 1;

    this.metrics.set(key, existing);
  }

  /**
   * Get API metrics
   */
  getAPIMetrics(apiName, version = null) {
    const metrics = {};
    
    for (const [key, value] of this.metrics.entries()) {
      const [name, ver, method, path] = key.split(':');
      
      if (name === apiName && (!version || ver === version)) {
        const metricKey = version ? `${method}:${path}` : `${ver}:${method}:${path}`;
        metrics[metricKey] = {
          ...value,
          avgResponseTime: value.totalResponseTime / value.count,
          errorRate: (value.errors / value.count) * 100
        };
      }
    }
    
    return metrics;
  }

  /**
   * Generate OpenAPI specification
   */
  async generateOpenAPISpec(apiName, version) {
    const api = this.apis.get(`${apiName}:${version}`);
    if (!api) {
      throw new Error(`API ${apiName} v${version} not found`);
    }

    const spec = {
      openapi: '3.0.3',
      info: {
        title: api.name,
        version: api.version,
        description: api.description,
        contact: {
          email: api.contact_email
        }
      },
      servers: [
        {
          url: `${process.env.API_BASE_URL || 'http://localhost:4000'}${api.base_path}`,
          description: 'Production server'
        }
      ],
      paths: {},
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          }
        }
      }
    };

    // Add endpoints to paths
    if (api.endpoints) {
      for (const endpoint of api.endpoints) {
        if (!spec.paths[endpoint.path]) {
          spec.paths[endpoint.path] = {};
        }

        spec.paths[endpoint.path][endpoint.method.toLowerCase()] = {
          summary: endpoint.description,
          parameters: endpoint.parameters || [],
          responses: endpoint.responses || {
            '200': { description: 'Success' },
            '400': { description: 'Bad Request' },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Internal Server Error' }
          },
          security: endpoint.security_requirements || []
        };
      }
    }

    return spec;
  }

  /**
   * Create API documentation endpoint
   */
  createDocumentationEndpoint() {
    const router = express.Router();

    // API catalog
    router.get('/', async (req, res) => {
      try {
        const catalog = [];
        
        for (const [key, api] of this.apis.entries()) {
          catalog.push({
            name: api.name,
            version: api.version,
            description: api.description,
            status: api.status,
            basePath: api.base_path,
            documentationUrl: api.documentation_url,
            deprecated: !!api.deprecated_at,
            deprecationInfo: api.deprecated_at ? {
              deprecatedAt: api.deprecated_at,
              sunsetAt: api.sunset_at,
              reason: api.deprecation_reason
            } : null
          });
        }

        res.json({
          success: true,
          data: catalog,
          metadata: {
            totalAPIs: catalog.length,
            activeAPIs: catalog.filter(api => api.status === 'active').length,
            deprecatedAPIs: catalog.filter(api => api.deprecated).length
          }
        });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'DOCUMENTATION_ERROR',
            message: error.message
          }
        });
      }
    });

    // OpenAPI specification for specific API
    router.get('/:apiName/:version/openapi.json', async (req, res) => {
      try {
        const { apiName, version } = req.params;
        const spec = await this.generateOpenAPISpec(apiName, version);
        res.json(spec);
      } catch (error) {
        res.status(404).json({
          error: {
            code: 'API_NOT_FOUND',
            message: error.message
          }
        });
      }
    });

    // API metrics
    router.get('/:apiName/:version/metrics', async (req, res) => {
      try {
        const { apiName, version } = req.params;
        const metrics = this.getAPIMetrics(apiName, version);
        res.json({
          success: true,
          data: metrics,
          metadata: {
            apiName,
            version,
            generatedAt: new Date().toISOString()
          }
        });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'METRICS_ERROR',
            message: error.message
          }
        });
      }
    });

    return router;
  }

  /**
   * Create API management endpoints
   */
  createManagementEndpoints() {
    const router = express.Router();

    // Register new API
    router.post('/apis', async (req, res) => {
      try {
        const apiId = await this.registerAPI(req.body);
        res.status(201).json({
          success: true,
          data: { apiId },
          message: 'API registered successfully'
        });
      } catch (error) {
        res.status(400).json({
          error: {
            code: 'REGISTRATION_FAILED',
            message: error.message
          }
        });
      }
    });

    // Deprecate API version
    router.post('/apis/:apiName/:version/deprecate', async (req, res) => {
      try {
        const { apiName, version } = req.params;
        const { sunsetDate, reason } = req.body;
        
        const apiId = await this.deprecateVersion(apiName, version, sunsetDate, reason);
        res.json({
          success: true,
          data: { apiId },
          message: 'API version deprecated successfully'
        });
      } catch (error) {
        res.status(400).json({
          error: {
            code: 'DEPRECATION_FAILED',
            message: error.message
          }
        });
      }
    });

    // Get API health
    router.get('/health', async (req, res) => {
      try {
        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          apis: {
            total: this.apis.size,
            active: Array.from(this.apis.values()).filter(api => api.status === 'active').length,
            deprecated: Array.from(this.apis.values()).filter(api => api.status === 'deprecated').length
          },
          metrics: {
            totalRequests: Array.from(this.metrics.values()).reduce((sum, m) => sum + m.count, 0),
            totalErrors: Array.from(this.metrics.values()).reduce((sum, m) => sum + m.errors, 0)
          }
        };

        res.json(health);
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });

    return router;
  }
}

module.exports = APIManagement;