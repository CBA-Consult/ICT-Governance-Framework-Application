# API Documentation Index

## Overview

This document provides comprehensive API documentation for the ICT Governance Framework Enterprise API. The API provides unified access to enterprise systems, workflow orchestration, and governance capabilities.

**Base URL:** `https://api.company.com/api/v2/enterprise`  
**Version:** 2.0.0  
**Authentication:** JWT Bearer Token

---

## Quick Start

### 1. Authentication

```bash
# Get access token
curl -X POST "https://api.company.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password"
  }'
```

### 2. Make API Request

```bash
# Example: Get Azure AD users
curl -X GET "https://api.company.com/api/v2/enterprise/integrations/azure-ad/users" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json"
```

---

## API Categories

### 1. Enterprise Integrations
- **Azure Active Directory:** User and group management
- **Microsoft Defender:** Security alerts and discovered apps
- **ServiceNow:** Incident and change management
- **Power BI:** Reports and datasets
- **Multi-Cloud:** AWS and GCP resource management
- **Legacy Systems:** File transfer and mainframe integration

### 2. Workflow Orchestration
- **Workflow Execution:** Execute complex integration workflows
- **Execution Monitoring:** Track workflow execution status
- **Workflow Management:** Register and manage workflows

### 3. API Management
- **API Registry:** Manage API lifecycle
- **Metrics and Analytics:** API usage and performance metrics
- **Health Monitoring:** System health and integration status

---

## Authentication and Authorization

### JWT Bearer Token

All API requests require a valid JWT bearer token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

### Rate Limiting

The API implements tiered rate limiting:

| Tier | Requests per 15 minutes | Description |
|------|------------------------|-------------|
| Standard | 1,000 | Default tier for most endpoints |
| Premium | 5,000 | Enhanced tier for premium users |
| Integration | 10,000 | High-volume tier for system integrations |

### Permissions

The API uses role-based access control (RBAC) with the following permissions:

- `api:read` - Read access to API endpoints
- `api:write` - Write access to API endpoints
- `workflow:execute` - Execute workflows
- `workflow:manage` - Manage workflow definitions
- `system:admin` - Administrative access
- `integration:manage` - Manage integrations

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2025-01-20T12:00:00Z",
    "version": "2.0.0",
    "source": "azure-ad"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20,
    "hasNext": true,
    "hasPrev": false
  },
  "metadata": {
    "timestamp": "2025-01-20T12:00:00Z",
    "version": "2.0.0"
  }
}
```

### Error Response

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

---

## Enterprise Integration Endpoints

### Azure Active Directory

#### Get Users
```
GET /integrations/azure-ad/users
```

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 50, max: 100)
- `search` (string, optional): Search term for filtering users
- `status` (string, optional): Filter by status (active, inactive)

**Example Request:**
```bash
curl -X GET "https://api.company.com/api/v2/enterprise/integrations/azure-ad/users?page=1&limit=50&search=john" \
  -H "Authorization: Bearer <token>"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "value": [
      {
        "id": "user-id-123",
        "displayName": "John Doe",
        "userPrincipalName": "john.doe@company.com",
        "mail": "john.doe@company.com",
        "jobTitle": "Software Engineer",
        "department": "Engineering"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "metadata": {
    "timestamp": "2025-01-20T12:00:00Z",
    "version": "2.0.0",
    "source": "azure-ad",
    "cached": false
  }
}
```

#### Get Groups
```
GET /integrations/azure-ad/groups
```

**Query Parameters:**
- `page` (integer, optional): Page number
- `limit` (integer, optional): Items per page
- `search` (string, optional): Search term

### Microsoft Defender for Cloud Apps

#### Get Discovered Apps
```
GET /integrations/defender/discovered-apps
```

**Query Parameters:**
- `page` (integer, optional): Page number
- `limit` (integer, optional): Items per page
- `startDate` (string, optional): Start date (ISO 8601)
- `endDate` (string, optional): End date (ISO 8601)
- `riskScore` (string, optional): Filter by risk score (low, medium, high)

**Example Request:**
```bash
curl -X GET "https://api.company.com/api/v2/enterprise/integrations/defender/discovered-apps?riskScore=high" \
  -H "Authorization: Bearer <token>"
```

#### Get Alerts
```
GET /integrations/defender/alerts
```

**Query Parameters:**
- `page` (integer, optional): Page number
- `limit` (integer, optional): Items per page
- `severity` (string, optional): Filter by severity (low, medium, high, critical)
- `status` (string, optional): Filter by status (open, resolved, dismissed)

### ServiceNow ITSM

#### Get Incidents
```
GET /integrations/servicenow/incidents
```

**Query Parameters:**
- `page` (integer, optional): Page number
- `limit` (integer, optional): Items per page
- `state` (string, optional): Filter by state
- `priority` (string, optional): Filter by priority (1-5)
- `category` (string, optional): Filter by category

#### Create Incident
```
POST /integrations/servicenow/incidents
```

**Request Body:**
```json
{
  "short_description": "API Integration Issue",
  "description": "Detailed description of the issue",
  "priority": "2",
  "category": "Software",
  "caller_id": "user@company.com",
  "assignment_group": "IT Support"
}
```

**Example Request:**
```bash
curl -X POST "https://api.company.com/api/v2/enterprise/integrations/servicenow/incidents" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "short_description": "API Integration Issue",
    "description": "Issue with enterprise API integration",
    "priority": "2",
    "category": "Software"
  }'
```

### Power BI

#### Get Reports
```
GET /integrations/powerbi/reports
```

#### Get Datasets
```
GET /integrations/powerbi/datasets
```

### Multi-Cloud Integration

#### AWS Resources
```
GET /integrations/aws/resources
```

#### GCP Resources
```
GET /integrations/gcp/resources
```

### Legacy Systems

#### File Transfer
```
POST /integrations/legacy/file-transfer
```

**Request Body:**
```json
{
  "operation": "upload",
  "files": [
    {
      "name": "data.csv",
      "path": "/uploads/data.csv",
      "size": 1024
    }
  ],
  "destination": "mainframe"
}
```

---

## Workflow Orchestration Endpoints

### Execute Workflow
```
POST /workflows/execute/{workflowName}
```

**Path Parameters:**
- `workflowName` (string, required): Name of the workflow to execute

**Request Body:**
```json
{
  "inputData": {
    "user": {
      "username": "jane.smith",
      "email": "jane.smith@company.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "displayName": "Jane Smith"
    }
  },
  "context": {
    "department": "Engineering",
    "requestedBy": "manager@company.com"
  }
}
```

**Example Request:**
```bash
curl -X POST "https://api.company.com/api/v2/enterprise/workflows/execute/user-provisioning" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "user": {
        "username": "jane.smith",
        "email": "jane.smith@company.com",
        "firstName": "Jane",
        "lastName": "Smith",
        "displayName": "Jane Smith"
      }
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "exec-123-456-789",
    "correlationId": "corr-987-654-321",
    "status": "running",
    "startedAt": "2025-01-20T12:00:00Z"
  },
  "metadata": {
    "message": "Workflow execution started",
    "timestamp": "2025-01-20T12:00:00Z",
    "version": "2.0.0"
  }
}
```

### Get Execution Status
```
GET /workflows/executions/{executionId}
```

**Path Parameters:**
- `executionId` (string, required): UUID of the workflow execution

**Example Request:**
```bash
curl -X GET "https://api.company.com/api/v2/enterprise/workflows/executions/exec-123-456-789" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "execution_id": "exec-123-456-789",
    "workflow_name": "user-provisioning",
    "status": "completed",
    "started_at": "2025-01-20T12:00:00Z",
    "completed_at": "2025-01-20T12:02:30Z",
    "correlation_id": "corr-987-654-321",
    "triggered_by": "jane.doe",
    "input_data": {
      "user": {
        "username": "jane.smith",
        "email": "jane.smith@company.com"
      }
    },
    "output_data": {
      "azure_ad_user_id": "user-456-789",
      "servicenow_user_id": "usr-789-012"
    },
    "steps": [
      {
        "step_name": "validate-user-data",
        "status": "completed",
        "started_at": "2025-01-20T12:00:00Z",
        "completed_at": "2025-01-20T12:00:05Z",
        "retry_count": 0
      },
      {
        "step_name": "create-azure-ad-user",
        "status": "completed",
        "started_at": "2025-01-20T12:00:05Z",
        "completed_at": "2025-01-20T12:01:30Z",
        "retry_count": 0
      }
    ]
  },
  "metadata": {
    "timestamp": "2025-01-20T12:05:00Z",
    "version": "2.0.0"
  }
}
```

### List Executions
```
GET /workflows/executions
```

**Query Parameters:**
- `page` (integer, optional): Page number
- `limit` (integer, optional): Items per page
- `status` (string, optional): Filter by status (pending, running, completed, failed, timeout)
- `workflowName` (string, optional): Filter by workflow name

### Register Workflow
```
POST /workflows/register
```

**Required Permission:** `workflow:manage`

**Request Body:**
```json
{
  "name": "custom-workflow",
  "description": "Custom integration workflow",
  "version": "1.0.0",
  "steps": [
    {
      "name": "step-1",
      "type": "integration",
      "config": {
        "adapter": "azure-ad",
        "operation": "getUsers",
        "parameters": {}
      }
    }
  ]
}
```

---

## API Management Endpoints

### List APIs
```
GET /management/apis
```

### Register API
```
POST /management/apis
```

**Required Permission:** `integration:manage`

### Deprecate API Version
```
POST /management/apis/{apiName}/{version}/deprecate
```

**Required Permission:** `integration:manage`

### System Metrics
```
GET /management/metrics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "api": {
      "GET:/integrations/azure-ad/users": {
        "count": 1500,
        "successCount": 1485,
        "totalTime": 375000,
        "cacheHits": 450,
        "avgResponseTime": 250,
        "errorRate": 1.0,
        "cacheHitRate": 30.0
      }
    },
    "integration": {
      "azure-ad:getUsers": {
        "count": 1200,
        "successCount": 1188,
        "totalDuration": 300000,
        "cacheHits": 360,
        "successRate": 99.0,
        "avgDuration": 250,
        "cacheHitRate": 30.0
      }
    },
    "orchestrator": {
      "user-provisioning": {
        "executions": 50,
        "successes": 48,
        "totalDuration": 125000,
        "successRate": 96.0,
        "avgDuration": 2500
      }
    }
  },
  "metadata": {
    "timestamp": "2025-01-20T12:00:00Z",
    "version": "2.0.0"
  }
}
```

### Clear Cache
```
POST /management/cache/clear
```

**Required Permission:** `system:admin`

**Request Body:**
```json
{
  "pattern": "azure-ad"
}
```

---

## Health and Monitoring

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T12:00:00Z",
  "version": "2.0.0",
  "uptime": 86400,
  "database": {
    "status": "connected",
    "pool": {
      "total": 10,
      "idle": 8,
      "waiting": 0
    }
  },
  "integrations": {
    "azure-ad": {
      "status": "healthy",
      "circuitBreaker": {
        "state": "CLOSED",
        "failures": 0,
        "lastFailure": null
      },
      "metrics": {
        "getUsers": {
          "count": 1200,
          "successRate": 99.0,
          "avgDuration": 250
        }
      }
    },
    "defender-cloud-apps": {
      "status": "healthy",
      "circuitBreaker": {
        "state": "CLOSED",
        "failures": 0
      }
    }
  },
  "metrics": {
    "totalRequests": 15000,
    "totalErrors": 150,
    "avgResponseTime": 275
  }
}
```

### Integration Health
```
GET /integrations/health
```

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | Authentication token required | 401 |
| `AUTHENTICATION_FAILED` | Invalid or expired token | 401 |
| `AUTHORIZATION_REQUIRED` | User permissions not available | 403 |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions for operation | 403 |
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded | 429 |
| `INTEGRATION_ERROR` | External integration failed | 502 |
| `WORKFLOW_NOT_FOUND` | Workflow not found | 404 |
| `EXECUTION_NOT_FOUND` | Workflow execution not found | 404 |
| `CIRCUIT_BREAKER_OPEN` | Circuit breaker is open | 503 |
| `INTERNAL_ERROR` | Internal server error | 500 |

---

## SDKs and Client Libraries

### JavaScript/Node.js

```javascript
const { EnterpriseAPIClient } = require('@company/governance-api-client');

const client = new EnterpriseAPIClient({
  baseURL: 'https://api.company.com/api/v2/enterprise',
  token: 'your-jwt-token'
});

// Get Azure AD users
const users = await client.integrations.azureAD.getUsers({
  page: 1,
  limit: 50
});

// Execute workflow
const execution = await client.workflows.execute('user-provisioning', {
  user: {
    username: 'jane.smith',
    email: 'jane.smith@company.com'
  }
});
```

### Python

```python
from governance_api_client import EnterpriseAPIClient

client = EnterpriseAPIClient(
    base_url='https://api.company.com/api/v2/enterprise',
    token='your-jwt-token'
)

# Get Azure AD users
users = client.integrations.azure_ad.get_users(page=1, limit=50)

# Execute workflow
execution = client.workflows.execute('user-provisioning', {
    'user': {
        'username': 'jane.smith',
        'email': 'jane.smith@company.com'
    }
})
```

### C#

```csharp
using Company.Governance.ApiClient;

var client = new EnterpriseApiClient(
    baseUrl: "https://api.company.com/api/v2/enterprise",
    token: "your-jwt-token"
);

// Get Azure AD users
var users = await client.Integrations.AzureAD.GetUsersAsync(page: 1, limit: 50);

// Execute workflow
var execution = await client.Workflows.ExecuteAsync("user-provisioning", new {
    user = new {
        username = "jane.smith",
        email = "jane.smith@company.com"
    }
});
```

---

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:

```
GET /docs/{apiName}/{version}/openapi.json
```

Example:
```bash
curl -X GET "https://api.company.com/api/v2/enterprise/docs/enterprise-integration/2.0.0/openapi.json"
```

---

## Support and Resources

### Documentation
- **API Guide:** [Implementation Guide](../implementation/guides/A069-API-Integration-Framework-Guide.md)
- **Integration Patterns:** [Integration Requirements](../architecture/integration/A027-Integration-Requirements-and-Constraints.md)
- **Workflow Documentation:** [Workflow Orchestration Guide](#workflow-orchestration)

### Support Channels
- **Email:** api-support@company.com
- **Slack:** #api-support
- **Documentation:** https://docs.company.com/api

### Rate Limits and Quotas
- **Standard Tier:** 1,000 requests per 15 minutes
- **Premium Tier:** 5,000 requests per 15 minutes
- **Integration Tier:** 10,000 requests per 15 minutes

### SLA
- **Availability:** 99.9% uptime
- **Response Time:** < 200ms for 95% of requests
- **Support Response:** < 4 hours for critical issues

---

*This API documentation is automatically generated and updated. Last updated: January 20, 2025*