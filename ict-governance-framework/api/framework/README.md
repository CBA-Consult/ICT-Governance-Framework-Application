# Enterprise API Framework

## Overview

The Enterprise API Framework provides a comprehensive, enterprise-grade API infrastructure for the ICT Governance Framework. It includes standardized patterns for authentication, authorization, integration, workflow orchestration, and API lifecycle management.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Enterprise API Framework                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ API Framework   │  │ Enterprise      │  │ API         │  │
│  │ Core            │  │ Integration     │  │ Management  │  │
│  │                 │  │                 │  │             │  │
│  │ • Middleware    │  │ • Adapters      │  │ • Registry  │  │
│  │ • Auth/AuthZ    │  │ • Circuit       │  │ • Versioning│  │
│  │ • Validation    │  │   Breakers      │  │ • Metrics   │  │
│  │ • Caching       │  │ • Retry Logic   │  │ • Docs      │  │
│  │ • Metrics       │  │ • Health Checks │  │             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Integration     │  │ Enterprise API  │                  │
│  │ Orchestrator    │  │ Router          │                  │
│  │                 │  │                 │                  │
│  │ • Workflows     │  │ • Unified       │                  │
│  │ • Step Types    │  │   Interface     │                  │
│  │ • Persistence   │  │ • Route         │                  │
│  │ • Error         │  │   Organization  │                  │
│  │   Recovery      │  │ • Component     │                  │
│  │                 │  │   Integration   │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. API Framework Core (`api-framework-core.js`)

**Purpose:** Provides standardized patterns and utilities for all APIs.

**Key Features:**
- **Middleware Stack:** Rate limiting, correlation, validation, response handling
- **Authentication:** JWT token validation with RBAC
- **Database Helpers:** Query execution with metrics and transaction support
- **Caching:** Response caching with TTL management
- **Error Handling:** Standardized error responses and logging
- **Metrics:** Request and performance metrics collection

**Usage:**
```javascript
const APIFrameworkCore = require('./api-framework-core');

const apiFramework = new APIFrameworkCore({
  version: '2.0.0',
  enableMetrics: true,
  enableCaching: true
});

// Create a router with standard middleware
const router = apiFramework.createRouter({
  rateLimitTier: 'standard',
  requireAuth: true
});

// Use validation middleware
router.get('/users', 
  apiFramework.middlewares.validation([
    ...apiFramework.getValidationRules().pagination
  ]),
  async (req, res, next) => {
    // Handler logic
  }
);
```

### 2. Enterprise Integration (`enterprise-integration.js`)

**Purpose:** Manages connections with enterprise systems using the adapter pattern.

**Supported Systems:**
- Azure Active Directory
- Microsoft Defender for Cloud Apps
- ServiceNow ITSM
- Power BI
- AWS Services
- GCP Services
- Legacy Systems (SFTP/Mainframe)

**Key Features:**
- **Circuit Breaker Pattern:** Prevents cascade failures
- **Retry Logic:** Exponential backoff with configurable attempts
- **Health Monitoring:** Real-time adapter health checks
- **Caching:** Performance optimization with TTL support
- **Metrics:** Integration performance tracking

**Usage:**
```javascript
const { EnterpriseIntegration } = require('./enterprise-integration');

const integration = new EnterpriseIntegration({
  timeout: 30000,
  retryAttempts: 3,
  enableMetrics: true
});

// Execute integration with automatic retry and circuit breaker
const result = await integration.executeIntegration(
  'azure-ad',
  'getUsers',
  { page: 1, limit: 50 },
  { useCache: true, cacheTTL: 300 }
);
```

### 3. API Management (`api-management.js`)

**Purpose:** Provides comprehensive API lifecycle management and versioning.

**Key Features:**
- **API Registry:** Database-backed API registration and metadata
- **Semantic Versioning:** Backward compatibility management
- **Deprecation Management:** Controlled API sunset with notifications
- **Usage Analytics:** Comprehensive metrics and reporting
- **OpenAPI Generation:** Automatic specification generation
- **Documentation:** Self-documenting API catalog

**Usage:**
```javascript
const APIManagement = require('./api-management');

const apiManagement = new APIManagement({
  basePath: '/api',
  defaultVersion: '2.0.0',
  enableDocumentation: true
});

// Register a new API
await apiManagement.registerAPI({
  name: 'user-management',
  version: '2.0.0',
  basePath: '/api/v2/users',
  description: 'User management API',
  endpoints: [
    {
      method: 'GET',
      path: '/users',
      description: 'Get users with pagination'
    }
  ]
});

// Create versioned router
const router = apiManagement.createVersionedRouter('user-management');
```

### 4. Integration Orchestrator (`integration-orchestrator.js`)

**Purpose:** Manages complex integration workflows with multiple steps and error recovery.

**Step Types:**
- **Integration:** Execute external system integrations
- **Transformation:** Data mapping and transformation
- **Validation:** Data validation against rules
- **Notification:** Send notifications (email, webhook, events)
- **Condition:** Conditional execution logic
- **Parallel:** Concurrent step execution
- **Delay:** Timed delays in workflow

**Key Features:**
- **Workflow Persistence:** Database-backed state management
- **Error Recovery:** Automatic retry with exponential backoff
- **Parallel Execution:** Concurrent step processing
- **Metrics:** Workflow performance tracking
- **Resume Capability:** Resume interrupted workflows

**Usage:**
```javascript
const IntegrationOrchestrator = require('./integration-orchestrator');

const orchestrator = new IntegrationOrchestrator({
  maxConcurrentWorkflows: 10,
  workflowTimeout: 300000
});

// Register a workflow
await orchestrator.registerWorkflow({
  name: 'user-provisioning',
  description: 'Automated user provisioning',
  steps: [
    {
      name: 'validate-user',
      type: 'validation',
      config: {
        data: '${inputData.user}',
        rules: [
          { type: 'required', field: 'email' }
        ]
      }
    },
    {
      name: 'create-azure-user',
      type: 'integration',
      config: {
        adapter: 'azure-ad',
        operation: 'createUser',
        parameters: {
          email: '${inputData.user.email}'
        }
      }
    }
  ]
});

// Execute workflow
const execution = await orchestrator.executeWorkflow(
  'user-provisioning',
  { user: { email: 'user@company.com' } }
);
```

### 5. Enterprise API Router (`enterprise-api.js`)

**Purpose:** Provides unified access to all enterprise integration capabilities.

**Key Features:**
- **Unified Interface:** Single entry point for all integrations
- **Component Integration:** Seamless integration of all framework components
- **Default Workflows:** Pre-configured common workflows
- **API Specifications:** Registered API metadata for management

**Usage:**
```javascript
const EnterpriseAPI = require('./enterprise-api');

const enterpriseAPI = new EnterpriseAPI({
  version: '2.0.0',
  enableMetrics: true,
  enableCaching: true,
  enableWorkflows: true
});

// Mount in Express app
app.use('/api/v2/enterprise', enterpriseAPI.getRouter());

// Access framework components
const { apiFramework, enterpriseIntegration } = enterpriseAPI.getComponents();
```

## Database Schema

The framework creates the following database tables:

### API Management Tables
- `api_registry` - API definitions and metadata
- `api_endpoints` - Endpoint specifications
- `api_metrics` - Usage metrics aggregation
- `api_consumers` - API consumer management
- `api_usage_logs` - Detailed usage logging
- `api_cache` - Response caching storage

### Workflow Management Tables
- `integration_workflows` - Workflow definitions
- `workflow_executions` - Execution instances
- `workflow_steps` - Step execution details
- `integration_mappings` - Data mapping configurations

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/governance_db

# Azure Integration
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# ServiceNow Integration
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password

# AWS Integration
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# GCP Integration
GCP_PROJECT_ID=your-project-id
GCP_KEY_FILE=path/to/service-account.json

# API Configuration
JWT_SECRET=your-jwt-secret
API_BASE_URL=https://api.company.com
```

### Framework Options

```javascript
const options = {
  version: '2.0.0',
  basePath: '/api/v2',
  enableMetrics: true,
  enableCaching: true,
  enableWorkflows: true,
  defaultTimeout: 30000,
  maxRetries: 3,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000
};
```

## Security

### Authentication & Authorization
- **JWT Bearer Tokens:** Secure token-based authentication
- **Role-Based Access Control:** Granular permission system
- **Rate Limiting:** Tiered rate limiting (1K-10K requests/15min)
- **Input Validation:** Comprehensive request validation
- **Audit Logging:** Complete audit trail

### Data Protection
- **Encryption:** TLS 1.3 for all communications
- **Input Sanitization:** Protection against injection attacks
- **Security Headers:** Standard security headers implementation
- **Error Sanitization:** Secure error responses

## Monitoring & Metrics

### Performance Metrics
- **Request Metrics:** Count, response time, error rates
- **Integration Metrics:** Adapter performance, circuit breaker status
- **Workflow Metrics:** Execution success rates, duration
- **Cache Metrics:** Hit rates, performance optimization

### Health Monitoring
- **Health Endpoints:** `/health` for system status
- **Integration Health:** Individual adapter monitoring
- **Database Health:** Connection pool status
- **Circuit Breaker Status:** Real-time resilience monitoring

## Error Handling

### Standardized Error Responses
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "timestamp": "2025-01-20T12:00:00Z",
    "errorId": "err-123-456-789",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Invalid email format"
        }
      ]
    }
  }
}
```

### Error Codes
- `AUTHENTICATION_REQUIRED` (401)
- `AUTHENTICATION_FAILED` (401)
- `INSUFFICIENT_PERMISSIONS` (403)
- `VALIDATION_ERROR` (400)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTEGRATION_ERROR` (502)
- `CIRCUIT_BREAKER_OPEN` (503)
- `INTERNAL_ERROR` (500)

## Testing

### Unit Testing
```bash
# Run framework component tests
node test-api-framework.js
```

### Integration Testing
```bash
# Test specific adapters
npm run test:adapter azure-ad

# Test workflows
npm run test:workflow user-provisioning
```

## Best Practices

### API Design
1. **RESTful Principles:** Use standard HTTP methods and status codes
2. **Consistent Naming:** Follow naming conventions
3. **Versioning:** Use semantic versioning
4. **Documentation:** Maintain comprehensive documentation

### Integration Patterns
1. **Circuit Breakers:** Implement for all external integrations
2. **Retry Logic:** Use exponential backoff
3. **Timeouts:** Set appropriate timeouts
4. **Caching:** Cache frequently accessed data

### Security
1. **Authentication:** Always validate tokens
2. **Authorization:** Check permissions for each operation
3. **Input Validation:** Validate all inputs
4. **Audit Logging:** Log all operations

### Performance
1. **Caching:** Use caching for expensive operations
2. **Pagination:** Implement pagination for large datasets
3. **Connection Pooling:** Use database connection pooling
4. **Monitoring:** Monitor performance metrics

## Troubleshooting

### Common Issues

#### Authentication Failures
- Check JWT token validity
- Verify user permissions
- Check token expiration

#### Integration Failures
- Check circuit breaker status
- Verify external service availability
- Check network connectivity

#### Performance Issues
- Monitor response times
- Check cache hit rates
- Analyze database query performance

### Debug Tools
- Health check endpoints
- Metrics endpoints
- Correlation ID tracing
- Structured logging

## Support

For support and questions:
- **Documentation:** [Implementation Guide](../../docs/implementation/guides/A069-API-Integration-Framework-Guide.md)
- **API Reference:** [API Documentation](../../technical-design/api-documentation-index.md)
- **Email:** api-support@company.com

---

*This framework provides enterprise-grade API capabilities with comprehensive integration, security, and monitoring features.*