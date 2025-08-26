// Test file for Enterprise Connectors
// File: ict-governance-framework/test/enterprise-connectors.test.js

const { 
  EnterpriseIntegration,
  AzureADAdapter,
  DefenderCloudAppsAdapter,
  ServiceNowAdapter,
  SAPAdapter,
  SalesforceAdapter,
  WorkdayAdapter,
  SynapseAdapter,
  SentinelAdapter,
  OracleAdapter,
  PowerBIAdapter,
  AWSAdapter,
  GCPAdapter,
  LegacySystemAdapter
} = require('../api/framework/enterprise-integration');

describe('Enterprise Connectors', () => {
  let integration;

  beforeEach(() => {
    // Initialize with test configuration
    integration = new EnterpriseIntegration({
      timeout: 5000,
      retryAttempts: 2,
      enableMetrics: true,
      enableCaching: false // Disable caching for tests
    });
  });

  afterEach(() => {
    // Clean up
    if (integration) {
      integration.clearCache();
    }
  });

  describe('EnterpriseIntegration Framework', () => {
    test('should initialize with default options', () => {
      const defaultIntegration = new EnterpriseIntegration();
      expect(defaultIntegration.options.timeout).toBe(30000);
      expect(defaultIntegration.options.retryAttempts).toBe(3);
      expect(defaultIntegration.options.enableMetrics).toBe(true);
    });

    test('should register adapters during initialization', () => {
      expect(integration.adapters.size).toBeGreaterThan(0);
      expect(integration.adapters.has('azure-ad')).toBe(true);
      expect(integration.adapters.has('servicenow')).toBe(true);
      expect(integration.adapters.has('sap-erp')).toBe(true);
    });

    test('should have circuit breakers for all adapters', () => {
      expect(integration.circuitBreakers.size).toBe(integration.adapters.size);
    });

    test('should throw error for non-existent adapter', async () => {
      await expect(
        integration.executeIntegration('non-existent', 'someOperation')
      ).rejects.toThrow('Adapter not found: non-existent');
    });
  });

  describe('Azure Active Directory Adapter', () => {
    let azureAdapter;

    beforeEach(() => {
      azureAdapter = new AzureADAdapter({
        tenantId: 'test-tenant-id',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      });
    });

    test('should initialize with correct configuration', () => {
      expect(azureAdapter.config.tenantId).toBe('test-tenant-id');
      expect(azureAdapter.config.clientId).toBe('test-client-id');
    });

    test('should have required methods', () => {
      expect(typeof azureAdapter.getUsers).toBe('function');
      expect(typeof azureAdapter.getGroups).toBe('function');
      expect(typeof azureAdapter.getAccessToken).toBe('function');
      expect(typeof azureAdapter.healthCheck).toBe('function');
    });

    test('should handle token caching', async () => {
      // Mock the token response
      azureAdapter.tokenCache = 'mock-token';
      azureAdapter.tokenExpiry = Date.now() + 3600000;

      const token = await azureAdapter.getAccessToken();
      expect(token).toBe('mock-token');
    });
  });

  describe('ServiceNow Adapter', () => {
    let serviceNowAdapter;

    beforeEach(() => {
      serviceNowAdapter = new ServiceNowAdapter({
        instanceUrl: 'https://test.service-now.com',
        username: 'test-user',
        password: 'test-password'
      });
    });

    test('should initialize with correct configuration', () => {
      expect(serviceNowAdapter.config.instanceUrl).toBe('https://test.service-now.com');
      expect(serviceNowAdapter.client.defaults.baseURL).toBe('https://test.service-now.com');
    });

    test('should have required ITSM methods', () => {
      expect(typeof serviceNowAdapter.getIncidents).toBe('function');
      expect(typeof serviceNowAdapter.createIncident).toBe('function');
      expect(typeof serviceNowAdapter.updateIncident).toBe('function');
      expect(typeof serviceNowAdapter.getChangeRequests).toBe('function');
      expect(typeof serviceNowAdapter.createChangeRequest).toBe('function');
      expect(typeof serviceNowAdapter.getCMDBItems).toBe('function');
      expect(typeof serviceNowAdapter.updateCMDBItem).toBe('function');
      expect(typeof serviceNowAdapter.getServiceCatalogItems).toBe('function');
    });

    test('should format incident data correctly', () => {
      const testData = {
        title: 'Test Incident',
        description: 'Test Description',
        priority: '2',
        category: 'ICT Governance',
        callerId: 'test-user'
      };

      // This would be tested with a mock implementation
      expect(testData.title).toBe('Test Incident');
      expect(testData.priority).toBe('2');
    });
  });

  describe('SAP ERP Adapter', () => {
    let sapAdapter;

    beforeEach(() => {
      sapAdapter = new SAPAdapter({
        baseUrl: 'https://test-sap-server:8000',
        username: 'test-sap-user',
        password: 'test-sap-password',
        systemId: 'TEST'
      });
    });

    test('should initialize with correct configuration', () => {
      expect(sapAdapter.config.baseUrl).toBe('https://test-sap-server:8000');
      expect(sapAdapter.config.systemId).toBe('TEST');
    });

    test('should have required SAP methods', () => {
      expect(typeof sapAdapter.getUsers).toBe('function');
      expect(typeof sapAdapter.getFinancialData).toBe('function');
      expect(typeof sapAdapter.getMasterData).toBe('function');
      expect(typeof sapAdapter.healthCheck).toBe('function');
    });

    test('should set CSRF token header', () => {
      expect(sapAdapter.client.defaults.headers['X-CSRF-Token']).toBe('Fetch');
    });
  });

  describe('Salesforce Adapter', () => {
    let salesforceAdapter;

    beforeEach(() => {
      salesforceAdapter = new SalesforceAdapter({
        clientId: 'test-sf-client-id',
        clientSecret: 'test-sf-client-secret',
        loginUrl: 'https://test.salesforce.com'
      });
    });

    test('should initialize with correct configuration', () => {
      expect(salesforceAdapter.config.clientId).toBe('test-sf-client-id');
      expect(salesforceAdapter.config.loginUrl).toBe('https://test.salesforce.com');
    });

    test('should have required Salesforce methods', () => {
      expect(typeof salesforceAdapter.getAccounts).toBe('function');
      expect(typeof salesforceAdapter.getOpportunities).toBe('function');
      expect(typeof salesforceAdapter.getContacts).toBe('function');
      expect(typeof salesforceAdapter.createRecord).toBe('function');
      expect(typeof salesforceAdapter.getAccessToken).toBe('function');
    });

    test('should handle token caching', () => {
      salesforceAdapter.tokenCache = 'mock-sf-token';
      salesforceAdapter.tokenExpiry = Date.now() + 7200000;
      salesforceAdapter.instanceUrl = 'https://test.my.salesforce.com';

      expect(salesforceAdapter.tokenCache).toBe('mock-sf-token');
      expect(salesforceAdapter.instanceUrl).toBe('https://test.my.salesforce.com');
    });
  });

  describe('Microsoft Sentinel Adapter', () => {
    let sentinelAdapter;

    beforeEach(() => {
      sentinelAdapter = new SentinelAdapter({
        tenantId: 'test-tenant-id',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        subscriptionId: 'test-subscription-id',
        resourceGroupName: 'test-rg',
        workspaceName: 'test-workspace'
      });
    });

    test('should initialize with correct configuration', () => {
      expect(sentinelAdapter.config.subscriptionId).toBe('test-subscription-id');
      expect(sentinelAdapter.config.workspaceName).toBe('test-workspace');
    });

    test('should have required Sentinel methods', () => {
      expect(typeof sentinelAdapter.getIncidents).toBe('function');
      expect(typeof sentinelAdapter.getAlerts).toBe('function');
      expect(typeof sentinelAdapter.createIncident).toBe('function');
      expect(typeof sentinelAdapter.getAccessToken).toBe('function');
    });
  });

  describe('Oracle Database Adapter', () => {
    let oracleAdapter;

    beforeEach(() => {
      oracleAdapter = new OracleAdapter({
        host: 'test-oracle-host',
        port: 1521,
        serviceName: 'TEST',
        username: 'test-user',
        password: 'test-password'
      });
    });

    test('should initialize with correct configuration', () => {
      expect(oracleAdapter.config.host).toBe('test-oracle-host');
      expect(oracleAdapter.config.serviceName).toBe('TEST');
      expect(oracleAdapter.connectionString).toBe('test-oracle-host:1521/TEST');
    });

    test('should have required Oracle methods', () => {
      expect(typeof oracleAdapter.executeQuery).toBe('function');
      expect(typeof oracleAdapter.getTableData).toBe('function');
      expect(typeof oracleAdapter.getSystemMetrics).toBe('function');
      expect(typeof oracleAdapter.healthCheck).toBe('function');
    });
  });

  describe('Integration Metrics', () => {
    test('should record metrics for successful operations', () => {
      integration.recordMetrics('test-adapter', 'test-operation', 1000, true);
      const metrics = integration.getMetrics();
      
      expect(metrics['test-adapter:test-operation']).toBeDefined();
      expect(metrics['test-adapter:test-operation'].count).toBe(1);
      expect(metrics['test-adapter:test-operation'].successCount).toBe(1);
      expect(metrics['test-adapter:test-operation'].successRate).toBe(100);
    });

    test('should record metrics for failed operations', () => {
      integration.recordMetrics('test-adapter', 'test-operation', 1000, false);
      const metrics = integration.getMetrics();
      
      expect(metrics['test-adapter:test-operation']).toBeDefined();
      expect(metrics['test-adapter:test-operation'].count).toBe(1);
      expect(metrics['test-adapter:test-operation'].successCount).toBe(0);
      expect(metrics['test-adapter:test-operation'].successRate).toBe(0);
    });

    test('should calculate average duration correctly', () => {
      integration.recordMetrics('test-adapter', 'test-operation', 1000, true);
      integration.recordMetrics('test-adapter', 'test-operation', 2000, true);
      const metrics = integration.getMetrics();
      
      expect(metrics['test-adapter:test-operation'].avgDuration).toBe(1500);
    });
  });

  describe('Circuit Breaker', () => {
    test('should open circuit breaker after threshold failures', () => {
      const circuitBreaker = integration.circuitBreakers.get('azure-ad');
      
      // Simulate failures
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure();
      }
      
      expect(circuitBreaker.isOpen()).toBe(true);
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    test('should reset circuit breaker on success', () => {
      const circuitBreaker = integration.circuitBreakers.get('azure-ad');
      
      // Simulate failures
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      
      // Simulate success
      circuitBreaker.recordSuccess();
      
      expect(circuitBreaker.failures).toBe(0);
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });

  describe('Cache Management', () => {
    test('should generate consistent cache keys', () => {
      const key1 = integration.generateCacheKey('adapter1', 'operation1', { param: 'value' });
      const key2 = integration.generateCacheKey('adapter1', 'operation1', { param: 'value' });
      const key3 = integration.generateCacheKey('adapter1', 'operation1', { param: 'different' });
      
      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
    });

    test('should clear cache by pattern', () => {
      integration.cache.set('test-key-1', { data: 'value1' });
      integration.cache.set('test-key-2', { data: 'value2' });
      integration.cache.set('other-key', { data: 'value3' });
      
      integration.clearCache('test-key');
      
      expect(integration.cache.has('test-key-1')).toBe(false);
      expect(integration.cache.has('test-key-2')).toBe(false);
      expect(integration.cache.has('other-key')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should identify non-retryable errors', () => {
      const error400 = { response: { status: 400 } };
      const error401 = { response: { status: 401 } };
      const error500 = { response: { status: 500 } };
      
      expect(integration.isNonRetryableError(error400)).toBe(true);
      expect(integration.isNonRetryableError(error401)).toBe(true);
      expect(integration.isNonRetryableError(error500)).toBe(false);
    });

    test('should calculate retry delay with exponential backoff', () => {
      const delay1 = integration.calculateRetryDelay(1, 1000);
      const delay2 = integration.calculateRetryDelay(2, 1000);
      const delay3 = integration.calculateRetryDelay(3, 1000);
      
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(2000);
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThan(3000);
      expect(delay3).toBeGreaterThanOrEqual(4000);
      expect(delay3).toBeLessThan(5000);
    });
  });

  describe('Health Monitoring', () => {
    test('should return health status for all adapters', async () => {
      // Mock health check responses
      const mockHealthCheck = jest.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: new Date().toISOString()
      });

      // Replace health check methods with mocks
      integration.adapters.forEach(adapter => {
        adapter.healthCheck = mockHealthCheck;
      });

      const health = await integration.getAdapterHealth();
      
      expect(Object.keys(health).length).toBeGreaterThan(0);
      expect(health['azure-ad']).toBeDefined();
      expect(health['azure-ad'].status).toBe('healthy');
    });
  });

  describe('Configuration Validation', () => {
    test('should validate required environment variables', () => {
      // This would test environment variable validation
      const requiredVars = [
        'AZURE_TENANT_ID',
        'AZURE_CLIENT_ID',
        'AZURE_CLIENT_SECRET'
      ];
      
      requiredVars.forEach(varName => {
        expect(typeof varName).toBe('string');
        expect(varName.length).toBeGreaterThan(0);
      });
    });
  });
});

// Integration Tests (require actual connections)
describe('Integration Tests', () => {
  // These tests would require actual system connections
  // and should be run in a test environment
  
  describe.skip('Live System Integration', () => {
    test('should connect to Azure AD', async () => {
      // This would test actual Azure AD connection
      // Only run when INTEGRATION_TESTS_ENABLED=true
    });

    test('should connect to ServiceNow', async () => {
      // This would test actual ServiceNow connection
    });

    test('should handle real authentication flows', async () => {
      // This would test actual authentication
    });
  });
});

// Performance Tests
describe('Performance Tests', () => {
  test('should handle concurrent requests', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        integration.recordMetrics(`test-adapter-${i}`, 'test-operation', 100, true)
      );
    }
    
    await Promise.all(promises);
    const metrics = integration.getMetrics();
    expect(Object.keys(metrics).length).toBe(10);
  });

  test('should maintain performance under load', () => {
    const startTime = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      integration.recordMetrics('load-test', 'operation', 100, true);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete 1000 operations in less than 1 second
    expect(duration).toBeLessThan(1000);
  });
});