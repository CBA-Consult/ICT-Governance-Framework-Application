# Multi-Cloud Multi-Tenant Testing Documentation

## Overview

This document describes the test suite for the Multi-Cloud Multi-Tenant ICT Governance Framework implementation.

## Test Structure

### 1. API Integration Tests (`tests/multi-tenant-management.spec.ts`)

Playwright-based integration tests for the Multi-Tenant Management API.

#### Test Coverage

- **Tenant CRUD Operations**
  - List all tenants with pagination
  - Create new tenant with validation
  - Get tenant details
  - Update tenant configuration
  - Delete/offboard tenant

- **Tenant Lifecycle Management**
  - Suspend tenant operations
  - Activate suspended tenant
  - Initiate offboarding workflow

- **Resource Management**
  - Get tenant resources by cloud provider
  - Filter resources by type
  - Track resource allocation

- **Cost Management**
  - Get tenant costs
  - Filter by date range
  - Budget tracking

- **Audit and Compliance**
  - Retrieve audit logs
  - Filter by action type
  - Compliance requirement tracking

- **Data Validation**
  - Validate required fields
  - Test tenant classifications (enterprise, government, healthcare, financial, standard)
  - Test isolation models (silo, pool, hybrid)
  - Test service tiers (premium, standard, basic)

- **Error Handling**
  - 404 for non-existent tenants
  - 400 for invalid requests
  - 500 for server errors

#### Running API Tests

```bash
# Run all multi-tenant tests
npm run test:multi-tenant

# Run with browser visible
npm run test:multi-tenant:headed

# Run specific test
npx playwright test tests/multi-tenant-management.spec.ts --grep "should create a new tenant"
```

#### Prerequisites

- API server running on `http://localhost:3000` (or set `API_BASE_URL` environment variable)
- PostgreSQL database with multi-tenant schema loaded
- Valid database connection configuration

### 2. Unit Tests (`tests/multi-cloud-orchestrator.test.js`)

Jest-based unit tests for the Multi-Cloud Orchestrator service.

#### Test Coverage

- **Initialization**
  - Initialize with multiple cloud providers
  - Initialize with only enabled providers
  - Validate provider configurations

- **Provisioning Plan Generation**
  - Generate plans for different isolation models (silo, pool, hybrid)
  - Generate plans for different service tiers (premium, standard, basic)
  - Generate plans with compliance requirements
  - Resource type inclusion based on requirements

- **Configuration Generation**
  - Network configurations for different isolation models
  - Compute configurations for different service tiers
  - Storage configurations with compliance encryption
  - Database configurations with isolation
  - Security configurations based on compliance
  - Identity management configurations
  - Monitoring configurations

- **Resource Provisioning**
  - Provision Azure resources
  - Provision AWS resources
  - Provision GCP resources
  - Event emission during provisioning
  - Error handling for invalid configurations

- **Resource Deprovisioning**
  - Deprovision tenant infrastructure
  - Event emission during deprovisioning
  - Cleanup validation

- **Resource Monitoring**
  - Get tenant resource status
  - Monitor resource metrics (CPU, memory, storage, network)
  - Track costs across cloud providers

- **Resource Optimization**
  - Cost optimization recommendations
  - Performance optimization recommendations
  - Security optimization recommendations

- **Health Checks**
  - Health check for all providers
  - Individual provider status
  - Overall system health

#### Running Unit Tests

```bash
# Run orchestrator unit tests
npm run test:orchestrator

# Run with coverage
npx jest tests/multi-cloud-orchestrator.test.js --coverage

# Run specific test suite
npx jest tests/multi-cloud-orchestrator.test.js --testNamePattern "Initialization"
```

#### Prerequisites

- Node.js environment
- Jest installed (`npm install --save-dev jest` if not present)

## Test Data

### Sample Tenant Configuration

```json
{
  "tenantName": "Test Enterprise Tenant",
  "tenantClassification": "enterprise",
  "isolationModel": "silo",
  "serviceTier": "premium",
  "primaryCloudProvider": "azure",
  "tenantAdminEmail": "admin@example.com",
  "tenantCostCenter": "IT-12345",
  "complianceRequirements": ["ISO27001", "GDPR"],
  "dataResidency": "US",
  "enableAdvancedMonitoring": true,
  "enableBackupDR": true
}
```

### Test Tenant Classifications

1. **Enterprise**: Large organizations with complex requirements
2. **Government**: Government entities with FedRAMP/FISMA compliance
3. **Healthcare**: Healthcare providers with HIPAA compliance
4. **Financial**: Financial institutions with SOX/PCI-DSS compliance
5. **Standard**: General business tenants

### Test Isolation Models

1. **Silo**: Complete tenant isolation with dedicated resources
2. **Pool**: Shared resources with logical isolation
3. **Hybrid**: Mix of dedicated and shared resources

### Test Service Tiers

1. **Premium**: High-performance with 99.99% SLA
2. **Standard**: Standard performance with 99.9% SLA
3. **Basic**: Cost-optimized with 99.5% SLA

## Environment Configuration

### Required Environment Variables

```bash
# API Configuration
export API_BASE_URL="http://localhost:3000"
export API_KEY="your-api-key-here"

# Database Configuration
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="ict_governance"
export DB_USER="postgres"
export DB_PASSWORD="your-password"

# Cloud Provider Configuration (for integration tests)
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"

export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"

export GCP_PROJECT_ID="your-project-id"
export GCP_CREDENTIALS="path/to/credentials.json"

# Test Configuration
export VERBOSE="true"
export TEST_TIMEOUT="30000"
```

### Test Environment Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up test database
createdb ict_governance_test
psql -U postgres -d ict_governance_test -f ict-governance-framework/db-multi-tenant-schema.sql

# 3. Configure environment variables
cp .env.example .env.test
# Edit .env.test with your configuration

# 4. Validate test environment
npm run test:validate-env
```

## Continuous Integration

### GitHub Actions Workflow

The tests can be integrated into CI/CD pipelines:

```yaml
name: Multi-Tenant Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ict_governance_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Load database schema
        run: |
          PGPASSWORD=postgres psql -h localhost -U postgres -d ict_governance_test \
            -f ict-governance-framework/db-multi-tenant-schema.sql
      
      - name: Run unit tests
        run: npm run test:orchestrator
      
      - name: Start API server
        run: |
          npm run start &
          sleep 10
      
      - name: Run integration tests
        run: npm run test:multi-tenant
```

## Test Results and Reporting

### Playwright Test Reports

```bash
# Generate HTML report
npm run test:report

# View report in browser
npx playwright show-report
```

### Jest Coverage Reports

```bash
# Generate coverage report
npx jest --coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## Known Issues and Limitations

### Current Limitations

1. **Mock Cloud Providers**: The orchestrator tests use mock implementations of cloud provider APIs. Full integration tests require actual cloud credentials.

2. **Database State**: API tests may fail if the database is not properly initialized or if previous test data exists. Use a separate test database.

3. **Async Operations**: Some tenant operations (provisioning, deprovisioning) are asynchronous. Tests use timeouts and may need adjustment based on system performance.

4. **Cost Tracking**: Cost tracking tests use simulated data. Real cost data requires integration with cloud provider billing APIs.

### Workarounds

1. **Database Cleanup**: Add a cleanup step before tests:
   ```bash
   psql -U postgres -d ict_governance_test -c "TRUNCATE tenants CASCADE"
   ```

2. **Timeout Adjustments**: Increase test timeouts in slow environments:
   ```javascript
   test.setTimeout(60000); // 60 seconds
   ```

3. **Skip Integration Tests**: Skip tests requiring cloud credentials:
   ```bash
   npx playwright test --grep-invert "integration"
   ```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data after tests complete
3. **Mocking**: Use mocks for external dependencies in unit tests
4. **Descriptive Names**: Use clear, descriptive test names
5. **Assertions**: Include multiple assertions to validate different aspects
6. **Error Cases**: Test both success and failure scenarios
7. **Documentation**: Document complex test scenarios and setup requirements

## Future Enhancements

1. **End-to-End Tests**: Full workflow tests from tenant onboarding to offboarding
2. **Performance Tests**: Load testing for high tenant volumes
3. **Security Tests**: Penetration testing and vulnerability scanning
4. **Compliance Tests**: Automated compliance validation
5. **Multi-Region Tests**: Test cross-region deployments
6. **Disaster Recovery Tests**: Test backup and recovery procedures

## Support

For test-related issues:
- Check test logs for detailed error messages
- Verify environment configuration
- Review database schema and data
- Check API server logs
- Consult the implementation documentation

## References

- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Multi-Tenant Implementation Guide](./multi-cloud-multi-tenant-implementation.md)
- [API Documentation](../api/README.md)
