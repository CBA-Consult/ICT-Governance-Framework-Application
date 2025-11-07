# Multi-Cloud Multi-Tenant Framework - Quick Start Guide

Get started with the Multi-Cloud Multi-Tenant ICT Governance Framework in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 13+ installed and running
- Basic understanding of cloud concepts
- Access to at least one cloud provider (Azure, AWS, or GCP)

## Step 1: Database Setup (2 minutes)

```bash
# Create database
createdb ict_governance

# Load multi-tenant schema
psql -U postgres -d ict_governance \
  -f ict-governance-framework/db-multi-tenant-schema.sql
```

## Step 2: Install Dependencies (1 minute)

```bash
# Install Node.js dependencies
npm install
```

## Step 3: Configure Environment (1 minute)

Create a `.env` file in the root directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ict_governance
DB_USER=postgres
DB_PASSWORD=your_password

# API Configuration
PORT=3000
NODE_ENV=development

# Cloud Provider Configuration (optional for testing)
AZURE_SUBSCRIPTION_ID=your_subscription_id
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
```

## Step 4: Start the API Server (30 seconds)

Create a simple server file `server-multi-tenant.js`:

```javascript
const express = require('express');
const { Pool } = require('pg');
const multiTenantAPI = require('./ict-governance-framework/api/multi-tenant-management');
const { MultiCloudOrchestrator } = require('./ict-governance-framework/services/multi-cloud-orchestrator');

const app = express();
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ict_governance',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

app.set('pool', pool);

// Initialize orchestrator
const orchestrator = new MultiCloudOrchestrator({
  azure: { enabled: true, defaultRegion: 'eastus' },
  aws: { enabled: false },
  gcp: { enabled: false }
});

app.set('orchestrator', orchestrator);

// Mount API routes
app.use('/api/tenants', multiTenantAPI);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Multi-Tenant API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api/tenants`);
});
```

Start the server:

```bash
node server-multi-tenant.js
```

## Step 5: Onboard Your First Tenant (30 seconds)

Use the sample configuration:

```bash
# Onboard a tenant
node ict-governance-framework/tenant-lifecycle-automation.js \
  onboard \
  ict-governance-framework/config/sample-tenant-config.json
```

Or use curl:

```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "My First Tenant",
    "tenantClassification": "standard",
    "isolationModel": "pool",
    "serviceTier": "standard",
    "primaryCloudProvider": "azure",
    "tenantAdminEmail": "admin@mycompany.com",
    "tenantCostCenter": "IT-001",
    "complianceRequirements": ["ISO27001"]
  }'
```

## Verify Your Setup

### 1. Check API Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-07T19:30:00.000Z"
}
```

### 2. List Tenants

```bash
curl http://localhost:3000/api/tenants
```

### 3. Get Tenant Details

```bash
# Replace {tenant-id} with actual tenant ID from previous step
curl http://localhost:3000/api/tenants/{tenant-id}
```

## Common Operations

### Create a New Tenant

```javascript
const tenantConfig = {
  tenantName: "Enterprise Client",
  tenantClassification: "enterprise",
  isolationModel: "silo",
  serviceTier: "premium",
  primaryCloudProvider: "azure",
  tenantAdminEmail: "admin@enterprise.com",
  tenantCostCenter: "ENT-001",
  complianceRequirements: ["ISO27001", "GDPR", "SOX"],
  dataResidency: "EU",
  enableAdvancedMonitoring: true,
  enableBackupDR: true
};

fetch('http://localhost:3000/api/tenants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(tenantConfig)
})
.then(res => res.json())
.then(data => console.log('Tenant created:', data));
```

### Update Tenant Configuration

```bash
curl -X PUT http://localhost:3000/api/tenants/{tenant-id} \
  -H "Content-Type: application/json" \
  -d '{
    "service_tier": "premium",
    "enable_advanced_monitoring": true
  }'
```

### Suspend Tenant

```bash
curl -X POST http://localhost:3000/api/tenants/{tenant-id}/suspend \
  -H "Content-Type: application/json" \
  -d '{"reason": "Billing issue"}'
```

### Get Tenant Resources

```bash
curl http://localhost:3000/api/tenants/{tenant-id}/resources
```

### Get Tenant Costs

```bash
curl http://localhost:3000/api/tenants/{tenant-id}/costs
```

### View Audit Log

```bash
curl http://localhost:3000/api/tenants/{tenant-id}/audit-log
```

## Next Steps

### 1. Configure Multiple Cloud Providers

Edit your orchestrator configuration:

```javascript
const orchestrator = new MultiCloudOrchestrator({
  azure: {
    enabled: true,
    credentials: {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET
    },
    defaultRegion: 'eastus'
  },
  aws: {
    enabled: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    defaultRegion: 'us-east-1'
  },
  gcp: {
    enabled: true,
    credentials: {
      projectId: process.env.GCP_PROJECT_ID,
      keyFile: process.env.GCP_KEY_FILE
    },
    defaultRegion: 'us-central1'
  }
});
```

### 2. Set Up Monitoring

Integrate with your monitoring solution:

```javascript
orchestrator.on('tenant-provisioned', (data) => {
  console.log('Tenant provisioned:', data.tenantId);
  // Send to monitoring system
});

orchestrator.on('resource-provisioned', (data) => {
  console.log('Resource provisioned:', data.resourceId);
  // Update metrics
});
```

### 3. Customize Tenant Classifications

Modify the classification logic to match your business needs:

```javascript
const classificationRules = {
  enterprise: {
    isolationModel: 'silo',
    serviceTier: 'premium',
    compliance: ['ISO27001', 'SOX'],
    minResources: { cpu: 4, memory: 16, storage: 1000 }
  },
  healthcare: {
    isolationModel: 'silo',
    serviceTier: 'premium',
    compliance: ['HIPAA', 'ISO27001'],
    encryption: 'required',
    auditLog: 'detailed'
  }
  // Add more classifications
};
```

### 4. Implement Cost Controls

Set up budget alerts:

```javascript
app.post('/api/tenants/:tenantId/budget', async (req, res) => {
  const { tenantId } = req.params;
  const { budgetLimit, alertThreshold } = req.body;
  
  // Set budget in database
  await pool.query(`
    UPDATE tenant_costs 
    SET budget_limit = $1,
        budget_alerts = jsonb_build_array(
          jsonb_build_object(
            'threshold', $2,
            'enabled', true
          )
        )
    WHERE tenant_id = $3 AND month = DATE_TRUNC('month', CURRENT_DATE)
  `, [budgetLimit, alertThreshold, tenantId]);
  
  res.json({ success: true });
});
```

### 5. Run Tests

```bash
# Run API integration tests
npm run test:multi-tenant

# Run unit tests
npm run test:orchestrator

# Run all tests
npm test
```

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql -U postgres -d ict_governance -c "SELECT COUNT(*) FROM tenants;"
```

### API Server Not Starting

```bash
# Check if port is already in use
lsof -i :3000

# Try a different port
PORT=3001 node server-multi-tenant.js
```

### Tenant Creation Fails

1. Check database schema is loaded correctly
2. Verify all required fields are provided
3. Check server logs for detailed error messages
4. Ensure email format is valid

### No Resources Provisioned

1. Verify cloud provider credentials
2. Check orchestrator configuration
3. Review resource requirements in tenant config
4. Check orchestrator event logs

## Documentation

- **Full Implementation Guide**: [docs/implementation/multi-cloud-multi-tenant-implementation.md](./multi-cloud-multi-tenant-implementation.md)
- **Testing Guide**: [docs/implementation/multi-tenant-testing.md](./multi-tenant-testing.md)
- **API Reference**: See API endpoint documentation in implementation guide
- **Architecture Overview**: See main README.md

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the full documentation
- Check server and database logs
- Verify configuration settings

## Example: Complete Tenant Lifecycle

```bash
# 1. Create tenant
TENANT_ID=$(curl -s -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"tenantName":"Test Company","tenantAdminEmail":"test@test.com","tenantCostCenter":"TEST-001"}' \
  | jq -r '.data.tenant_id')

echo "Created tenant: $TENANT_ID"

# 2. Check tenant details
curl http://localhost:3000/api/tenants/$TENANT_ID

# 3. Update tenant
curl -X PUT http://localhost:3000/api/tenants/$TENANT_ID \
  -H "Content-Type: application/json" \
  -d '{"service_tier":"premium"}'

# 4. View resources
curl http://localhost:3000/api/tenants/$TENANT_ID/resources

# 5. Check costs
curl http://localhost:3000/api/tenants/$TENANT_ID/costs

# 6. View audit log
curl http://localhost:3000/api/tenants/$TENANT_ID/audit-log

# 7. Suspend tenant
curl -X POST http://localhost:3000/api/tenants/$TENANT_ID/suspend \
  -H "Content-Type: application/json" \
  -d '{"reason":"Testing"}'

# 8. Reactivate tenant
curl -X POST http://localhost:3000/api/tenants/$TENANT_ID/activate

# 9. Offboard tenant
curl -X DELETE http://localhost:3000/api/tenants/$TENANT_ID
```

## What's Next?

You've successfully set up the Multi-Cloud Multi-Tenant ICT Governance Framework! Next steps:

1. **Integrate with your cloud providers** - Configure actual cloud credentials
2. **Customize for your needs** - Adjust classifications, tiers, and compliance requirements
3. **Set up monitoring** - Integrate with your monitoring and alerting systems
4. **Deploy to production** - Follow security best practices for production deployment
5. **Scale up** - Add more cloud providers and tenant classifications as needed

Happy multi-cloud multi-tenant management! 🚀
