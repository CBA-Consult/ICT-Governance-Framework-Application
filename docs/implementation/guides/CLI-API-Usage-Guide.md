# ICT Governance Framework - CLI/API Usage Guide

**Document Type:** Implementation Guide  
**Version:** 1.0  
**Date:** 2025-01-15  
**Prepared by:** Technical Team  

---

## Executive Summary

This guide provides comprehensive instructions for end-users to execute ICT Governance Framework operations through Command Line Interface (CLI) and Application Programming Interface (API) methods. It includes practical examples, step-by-step procedures, and troubleshooting guidance to ensure successful implementation and operation.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [CLI Operations](#cli-operations)
3. [API Operations](#api-operations)
4. [Automation Scripts](#automation-scripts)
5. [Integration Examples](#integration-examples)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Getting Started

### Prerequisites

Before using the CLI/API tools, ensure you have:

1. **Node.js** (v16 or higher)
2. **PostgreSQL** (v12 or higher)
3. **Azure CLI** (for Azure integrations)
4. **PowerShell** (v7.0 or higher for automation scripts)
5. **Valid credentials** for target systems (JIRA, Confluence, Azure)

### Environment Setup

#### 1. Clone and Setup Repository
```bash
# Clone the repository
git clone <repository-url>
cd ict-governance-framework

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration
```

#### 2. Configure Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ict_governance_framework

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# API Configuration
PORT=4000
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Azure Configuration
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# JIRA Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_PROJECT_KEY=ICT
EMAIL=your-email@domain.com
API_TOKEN=your-jira-api-token

# Confluence Configuration
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
SPACE_KEY=ICT
PARENT_PAGE_ID=123456789
```

#### 3. Initialize Database
```bash
# Create database
createdb ict_governance_framework

# Run schema
psql -d ict_governance_framework -f db-schema.sql
```

---

## CLI Operations

### Framework Management

#### Start the Framework
```bash
# Start backend API
node server.js

# Start frontend (in separate terminal)
npm run dev
```

#### Framework Status Check
```bash
# Check system health
curl -X GET http://localhost:4000/api/health

# Check authentication status
curl -X GET http://localhost:4000/api/auth/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### User Management

#### Create Admin User
```bash
# Register new user via API
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "AdminPass123!",
    "firstName": "System",
    "lastName": "Administrator",
    "department": "IT",
    "jobTitle": "System Administrator"
  }'
```

#### Assign Roles
```bash
# Get user ID
curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Assign super_admin role
curl -X POST http://localhost:4000/api/users/USER_ID/roles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "ROLE_SUPER_ADMIN",
    "assignmentReason": "Initial admin setup"
  }'
```

### Governance Operations

#### Policy Management
```bash
# Create new policy
curl -X POST http://localhost:4000/api/policies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Data Classification Policy",
    "description": "Policy for data classification and handling",
    "category": "Data Governance",
    "status": "Draft",
    "content": "Policy content here..."
  }'

# Get all policies
curl -X GET http://localhost:4000/api/policies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Compliance Monitoring
```bash
# Get compliance status
curl -X GET http://localhost:4000/api/compliance/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Generate compliance report
curl -X POST http://localhost:4000/api/compliance/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "monthly",
    "scope": "all",
    "format": "pdf"
  }'
```

---

## API Operations

### Authentication

#### Login and Get Token
```bash
# Login to get JWT token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123!"
  }'

# Response will include access_token and refresh_token
```

#### Refresh Token
```bash
# Refresh expired token
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### Governance API Endpoints

#### Risk Management
```bash
# Create risk assessment
curl -X POST http://localhost:4000/api/risks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cloud Security Risk",
    "description": "Risk of data breach in cloud environment",
    "category": "Security",
    "probability": 0.3,
    "impact": 0.8,
    "owner": "security-team@example.com"
  }'

# Get risk register
curl -X GET http://localhost:4000/api/risks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Application Governance
```bash
# Register new application
curl -X POST http://localhost:4000/api/applications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Portal",
    "description": "External customer portal application",
    "owner": "business-team@example.com",
    "criticality": "High",
    "dataClassification": "Confidential"
  }'

# Get application inventory
curl -X GET http://localhost:4000/api/applications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Automation Scripts

### Azure Governance Automation

#### Deploy Governance Policies
```powershell
# Navigate to automation directory
cd azure-automation

# Initialize governance framework
.\ICT-Governance-Framework.ps1 -Action Initialize

# Deploy Azure policies
.\ICT-Governance-Framework.ps1 -Action DeployPolicies -SubscriptionId "your-subscription-id"

# Generate compliance report
.\ICT-Governance-Framework.ps1 -Action GenerateReport -OutputPath ".\reports\"
```

#### Monitor Compliance
```powershell
# Check policy compliance
.\ICT-Governance-Framework.ps1 -Action CheckCompliance

# Get non-compliant resources
.\ICT-Governance-Framework.ps1 -Action GetNonCompliantResources -PolicyName "require-tags"
```

### JIRA Integration

#### Create Project Tasks
```powershell
# Create JIRA tasks from activity list
.\create-jira-tasks.ps1

# Create specific task
.\create-jira-tasks.ps1 -ActivityId "ACT-001" -Summary "Setup Governance Council"
```

### Confluence Documentation

#### Publish Documentation
```powershell
# Publish single document
.\publish-to-confluence.ps1 -MarkdownFile "docs/governance-framework/README.md" -PageTitle "Governance Framework Overview"

# Batch publish all documents
.\publish-to-confluence.ps1 -BatchMode
```

---

## Integration Examples

### Workflow Automation Example

#### Complete Governance Setup Workflow
```bash
#!/bin/bash
# Complete governance framework setup

echo "Starting ICT Governance Framework Setup..."

# 1. Start services
echo "Starting backend services..."
node server.js &
BACKEND_PID=$!

echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

# Wait for services to start
sleep 10

# 2. Create admin user
echo "Creating admin user..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "AdminPass123!",
    "firstName": "System",
    "lastName": "Administrator",
    "department": "IT",
    "jobTitle": "System Administrator"
  }')

USER_ID=$(echo $ADMIN_RESPONSE | jq -r '.user.id')

# 3. Login and get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

# 4. Assign admin role
echo "Assigning admin role..."
curl -s -X POST http://localhost:4000/api/users/$USER_ID/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "ROLE_SUPER_ADMIN",
    "assignmentReason": "Initial admin setup"
  }'

# 5. Create initial policies
echo "Creating initial policies..."
curl -s -X POST http://localhost:4000/api/policies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "IT Governance Policy",
    "description": "Master policy for IT governance",
    "category": "Governance",
    "status": "Active"
  }'

echo "Setup complete! Access the framework at http://localhost:3000"
```

### PowerShell Integration Example

```powershell
# PowerShell script for complete governance deployment
param(
    [string]$Environment = "development",
    [string]$SubscriptionId,
    [switch]$DeployPolicies,
    [switch]$CreateDocumentation,
    [switch]$SetupMonitoring
)

# Load configuration
$config = Get-Content "config.json" | ConvertFrom-Json

Write-Host "Deploying ICT Governance Framework to $Environment environment..." -ForegroundColor Green

# 1. Deploy Azure policies if requested
if ($DeployPolicies) {
    Write-Host "Deploying Azure governance policies..." -ForegroundColor Yellow
    .\azure-automation\ICT-Governance-Framework.ps1 -Action DeployPolicies -SubscriptionId $SubscriptionId
}

# 2. Create documentation if requested
if ($CreateDocumentation) {
    Write-Host "Publishing documentation to Confluence..." -ForegroundColor Yellow
    .\publish-to-confluence.ps1 -BatchMode
}

# 3. Setup monitoring if requested
if ($SetupMonitoring) {
    Write-Host "Setting up compliance monitoring..." -ForegroundColor Yellow
    .\azure-automation\ICT-Governance-Framework.ps1 -Action SetupMonitoring
}

Write-Host "Deployment complete!" -ForegroundColor Green
```

---

## Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Check database status
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -p 5432 -U username -d ict_governance_framework -c "SELECT 1;"

# Reset database if needed
dropdb ict_governance_framework
createdb ict_governance_framework
psql -d ict_governance_framework -f db-schema.sql
```

#### Authentication Problems
```bash
# Check JWT token validity
curl -X GET http://localhost:4000/api/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Reset user password
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

#### API Connection Issues
```bash
# Check API health
curl -X GET http://localhost:4000/api/health

# Check specific endpoint
curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v
```

#### Azure Integration Issues
```powershell
# Check Azure CLI login
az account show

# Test Azure connection
az policy definition list --query "[0].name"

# Re-authenticate if needed
az login --tenant YOUR_TENANT_ID
```

### Error Codes and Solutions

| Error Code | Description | Solution |
|------------|-------------|----------|
| **AUTH001** | Invalid JWT token | Refresh token or re-authenticate |
| **DB001** | Database connection failed | Check database status and credentials |
| **API001** | API endpoint not found | Verify endpoint URL and method |
| **AZ001** | Azure authentication failed | Re-authenticate with Azure CLI |
| **JIRA001** | JIRA API authentication failed | Check JIRA credentials and permissions |
| **CONF001** | Confluence publishing failed | Verify Confluence credentials and space permissions |

---

## Best Practices

### Security Best Practices

1. **Token Management**
   - Store JWT tokens securely
   - Implement token refresh logic
   - Use environment variables for secrets

2. **API Security**
   - Always use HTTPS in production
   - Implement rate limiting
   - Validate all input parameters

3. **Database Security**
   - Use connection pooling
   - Implement proper access controls
   - Regular security updates

### Performance Best Practices

1. **API Usage**
   - Implement caching where appropriate
   - Use pagination for large datasets
   - Batch operations when possible

2. **Database Operations**
   - Use prepared statements
   - Implement connection pooling
   - Monitor query performance

3. **Automation Scripts**
   - Implement error handling
   - Use logging for troubleshooting
   - Test scripts in development first

### Operational Best Practices

1. **Monitoring**
   - Implement health checks
   - Monitor API response times
   - Set up alerting for failures

2. **Documentation**
   - Keep API documentation updated
   - Document configuration changes
   - Maintain troubleshooting guides

3. **Change Management**
   - Test changes in development
   - Use version control for scripts
   - Implement rollback procedures

---

## Support and Resources

### Getting Help

- **Technical Issues**: Create issue in project repository
- **Documentation**: Refer to docs/ directory
- **API Reference**: Available at http://localhost:4000/api/docs (when running)

### Additional Resources

- [Project Documentation](../README.md)
- [Architecture Guide](../../architecture/README.md)
- [Security Guidelines](../../policies/governance/ICT-Governance-Policies.md)
- [Troubleshooting Guide](../troubleshooting-guide.md)

---

**Document Control:**
- **Version:** 1.0
- **Last Updated:** 2025-01-15
- **Next Review:** 2025-04-15
- **Owner:** Technical Team