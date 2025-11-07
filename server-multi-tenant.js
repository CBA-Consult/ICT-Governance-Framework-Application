#!/usr/bin/env node

/**
 * Multi-Tenant API Server
 * Multi-Cloud Multi-Tenant ICT Governance Framework
 * 
 * Standalone server for multi-tenant management
 */

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const multiTenantAPI = require('./ict-governance-framework/api/multi-tenant-management');
const { MultiCloudOrchestrator } = require('./ict-governance-framework/services/multi-cloud-orchestrator');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ict_governance',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Please check your database configuration in .env file');
    process.exit(1);
  } else {
    console.log('✅ Database connected successfully');
  }
});

app.set('pool', pool);

// Initialize Multi-Cloud Orchestrator
const orchestratorConfig = {
  azure: {
    enabled: process.env.AZURE_ENABLED === 'true',
    credentials: {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET
    },
    defaultRegion: process.env.AZURE_DEFAULT_REGION || 'eastus'
  },
  aws: {
    enabled: process.env.AWS_ENABLED === 'true',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    defaultRegion: process.env.AWS_DEFAULT_REGION || 'us-east-1'
  },
  gcp: {
    enabled: process.env.GCP_ENABLED === 'true',
    credentials: {
      projectId: process.env.GCP_PROJECT_ID,
      keyFile: process.env.GCP_KEY_FILE
    },
    defaultRegion: process.env.GCP_DEFAULT_REGION || 'us-central1'
  }
};

const orchestrator = new MultiCloudOrchestrator(orchestratorConfig);

// Log orchestrator events
orchestrator.on('tenant-provisioned', (data) => {
  console.log(`✅ Tenant provisioned: ${data.tenantId}`);
});

orchestrator.on('tenant-deprovisioned', (data) => {
  console.log(`✅ Tenant deprovisioned: ${data.tenantId}`);
});

orchestrator.on('resource-provisioned', (data) => {
  console.log(`  ➕ Resource provisioned: ${data.resourceType} - ${data.resourceId}`);
});

orchestrator.on('provisioning-error', (data) => {
  console.error(`❌ Provisioning error for tenant ${data.tenantId}: ${data.error}`);
});

app.set('orchestrator', orchestrator);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Multi-Cloud Multi-Tenant ICT Governance Framework',
    version: '1.0.0',
    description: 'API for managing multi-tenant environments across cloud providers',
    endpoints: {
      health: '/health',
      tenants: '/api/tenants',
      documentation: '/docs'
    }
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database
    await pool.query('SELECT 1');
    
    // Check orchestrator
    const orchestratorHealth = await orchestrator.healthCheck();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      orchestrator: orchestratorHealth.status,
      cloudProviders: orchestratorHealth.providers
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use('/api/tenants', multiTenantAPI);

// Documentation endpoint
app.get('/docs', (req, res) => {
  res.json({
    title: 'Multi-Tenant Management API Documentation',
    version: '1.0.0',
    baseUrl: `http://localhost:${PORT}/api/tenants`,
    endpoints: [
      {
        method: 'GET',
        path: '/api/tenants',
        description: 'List all tenants',
        parameters: [
          'classification (optional): Filter by tenant classification',
          'state (optional): Filter by tenant state',
          'page (optional): Page number for pagination',
          'limit (optional): Results per page'
        ]
      },
      {
        method: 'POST',
        path: '/api/tenants',
        description: 'Create a new tenant',
        body: {
          tenantName: 'string (required)',
          tenantClassification: 'string (optional)',
          isolationModel: 'string (optional)',
          serviceTier: 'string (optional)',
          primaryCloudProvider: 'string (required)',
          tenantAdminEmail: 'string (required)',
          tenantCostCenter: 'string (required)',
          complianceRequirements: 'array (optional)'
        }
      },
      {
        method: 'GET',
        path: '/api/tenants/:tenantId',
        description: 'Get tenant details'
      },
      {
        method: 'PUT',
        path: '/api/tenants/:tenantId',
        description: 'Update tenant configuration'
      },
      {
        method: 'DELETE',
        path: '/api/tenants/:tenantId',
        description: 'Offboard tenant'
      },
      {
        method: 'POST',
        path: '/api/tenants/:tenantId/suspend',
        description: 'Suspend tenant operations'
      },
      {
        method: 'POST',
        path: '/api/tenants/:tenantId/activate',
        description: 'Activate suspended tenant'
      },
      {
        method: 'GET',
        path: '/api/tenants/:tenantId/resources',
        description: 'Get tenant resources'
      },
      {
        method: 'GET',
        path: '/api/tenants/:tenantId/costs',
        description: 'Get tenant costs'
      },
      {
        method: 'GET',
        path: '/api/tenants/:tenantId/audit-log',
        description: 'Get tenant audit log'
      }
    ],
    references: {
      documentation: 'docs/implementation/multi-cloud-multi-tenant-implementation.md',
      quickStart: 'docs/implementation/QUICK-START.md',
      testing: 'docs/implementation/multi-tenant-testing.md'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: {
      root: '/',
      health: '/health',
      tenants: '/api/tenants',
      documentation: '/docs'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Start server
const PORT = parseInt(process.env.PORT) || 3000;
const server = app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Multi-Cloud Multi-Tenant ICT Governance Framework');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Server running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('  Endpoints:`);
  console.log(`    Health:        http://localhost:${PORT}/health`);
  console.log(`    API:           http://localhost:${PORT}/api/tenants`);
  console.log(`    Documentation: http://localhost:${PORT}/docs`);
  console.log('');
  console.log('  Cloud Providers:');
  console.log(`    Azure:  ${orchestratorConfig.azure.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`    AWS:    ${orchestratorConfig.aws.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`    GCP:    ${orchestratorConfig.gcp.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log('');
  console.log('  Press Ctrl+C to stop the server');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

module.exports = app;
