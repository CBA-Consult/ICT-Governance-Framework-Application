/**
 * Multi-Cloud Orchestrator Unit Tests
 * Tests for multi-cloud orchestration service
 */

const { MultiCloudOrchestrator, CLOUD_PROVIDERS, RESOURCE_TYPES } = require('../ict-governance-framework/services/multi-cloud-orchestrator');

describe('MultiCloudOrchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new MultiCloudOrchestrator({
      azure: {
        enabled: true,
        credentials: { test: 'credentials' },
        defaultRegion: 'eastus'
      },
      aws: {
        enabled: true,
        credentials: { test: 'credentials' },
        defaultRegion: 'us-east-1'
      },
      gcp: {
        enabled: true,
        credentials: { test: 'credentials' },
        defaultRegion: 'us-central1'
      }
    });
  });

  describe('Initialization', () => {
    test('should initialize with configured cloud providers', () => {
      expect(orchestrator.providers.size).toBe(3);
      expect(orchestrator.providers.has(CLOUD_PROVIDERS.AZURE)).toBe(true);
      expect(orchestrator.providers.has(CLOUD_PROVIDERS.AWS)).toBe(true);
      expect(orchestrator.providers.has(CLOUD_PROVIDERS.GCP)).toBe(true);
    });

    test('should initialize with only enabled providers', () => {
      const singleProviderOrchestrator = new MultiCloudOrchestrator({
        azure: {
          enabled: true,
          credentials: { test: 'credentials' },
          defaultRegion: 'eastus'
        }
      });

      expect(singleProviderOrchestrator.providers.size).toBe(1);
      expect(singleProviderOrchestrator.providers.has(CLOUD_PROVIDERS.AZURE)).toBe(true);
    });
  });

  describe('Provisioning Plan Generation', () => {
    test('should generate provisioning plan for silo isolation', () => {
      const tenantConfig = {
        tenantId: 'tenant-001',
        tenantName: 'Test Tenant',
        cloudProvider: 'azure',
        region: 'eastus',
        isolationModel: 'silo',
        serviceTier: 'premium',
        complianceRequirements: ['ISO27001', 'GDPR'],
        resourceRequirements: {
          compute: true,
          storage: true,
          database: true
        }
      };

      const plan = orchestrator.generateProvisioningPlan(tenantConfig);

      expect(plan).toHaveProperty('tenantId', 'tenant-001');
      expect(plan).toHaveProperty('cloudProvider', 'azure');
      expect(plan).toHaveProperty('resources');
      expect(plan.resources.length).toBeGreaterThan(0);

      // Check for required resource types
      const resourceTypes = plan.resources.map(r => r.type);
      expect(resourceTypes).toContain(RESOURCE_TYPES.NETWORK);
      expect(resourceTypes).toContain(RESOURCE_TYPES.COMPUTE);
      expect(resourceTypes).toContain(RESOURCE_TYPES.STORAGE);
      expect(resourceTypes).toContain(RESOURCE_TYPES.DATABASE);
      expect(resourceTypes).toContain(RESOURCE_TYPES.IDENTITY);
      expect(resourceTypes).toContain(RESOURCE_TYPES.SECURITY);
      expect(resourceTypes).toContain(RESOURCE_TYPES.MONITORING);
    });

    test('should generate provisioning plan for pool isolation', () => {
      const tenantConfig = {
        tenantId: 'tenant-002',
        tenantName: 'Pool Tenant',
        cloudProvider: 'azure',
        region: 'eastus',
        isolationModel: 'pool',
        serviceTier: 'standard',
        complianceRequirements: ['ISO27001'],
        resourceRequirements: {}
      };

      const plan = orchestrator.generateProvisioningPlan(tenantConfig);
      const networkResource = plan.resources.find(r => r.type === RESOURCE_TYPES.NETWORK);

      expect(networkResource.config.isolated).toBe(false);
      expect(networkResource.config.dedicatedVNet).toBe(false);
    });

    test('should generate different configurations for different service tiers', () => {
      const premiumConfig = {
        tenantId: 'tenant-premium',
        tenantName: 'Premium Tenant',
        cloudProvider: 'azure',
        region: 'eastus',
        isolationModel: 'silo',
        serviceTier: 'premium',
        resourceRequirements: { compute: true }
      };

      const basicConfig = {
        tenantId: 'tenant-basic',
        tenantName: 'Basic Tenant',
        cloudProvider: 'azure',
        region: 'eastus',
        isolationModel: 'pool',
        serviceTier: 'basic',
        resourceRequirements: { compute: true }
      };

      const premiumPlan = orchestrator.generateProvisioningPlan(premiumConfig);
      const basicPlan = orchestrator.generateProvisioningPlan(basicConfig);

      const premiumCompute = premiumPlan.resources.find(r => r.type === RESOURCE_TYPES.COMPUTE);
      const basicCompute = basicPlan.resources.find(r => r.type === RESOURCE_TYPES.COMPUTE);

      expect(premiumCompute.config.instanceCount).toBeGreaterThan(basicCompute.config.instanceCount);
      expect(premiumCompute.config.autoScaling).toBe(true);
      expect(basicCompute.config.autoScaling).toBe(false);
    });
  });

  describe('Configuration Generation', () => {
    test('should generate network config with silo isolation', () => {
      const config = orchestrator.getNetworkConfig('silo', 'azure', 'eastus');

      expect(config.isolated).toBe(true);
      expect(config.dedicatedVNet).toBe(true);
      expect(config.subnets).toContain('web');
      expect(config.subnets).toContain('app');
      expect(config.subnets).toContain('data');
      expect(config.networkSecurityGroups).toBe(true);
    });

    test('should generate compute config based on service tier', () => {
      const premiumConfig = orchestrator.getComputeConfig('premium', 'azure', 'eastus');
      const standardConfig = orchestrator.getComputeConfig('standard', 'azure', 'eastus');
      const basicConfig = orchestrator.getComputeConfig('basic', 'azure', 'eastus');

      expect(premiumConfig.instanceCount).toBeGreaterThan(standardConfig.instanceCount);
      expect(standardConfig.instanceCount).toBeGreaterThan(basicConfig.instanceCount);
      expect(premiumConfig.availabilityZones).toBeGreaterThan(basicConfig.availabilityZones);
    });

    test('should generate storage config with compliance encryption', () => {
      const hipaaConfig = orchestrator.getStorageConfig('premium', 'azure', 'eastus', ['HIPAA']);
      const basicConfig = orchestrator.getStorageConfig('basic', 'azure', 'eastus', []);

      expect(hipaaConfig.encryption).toBe('AES256');
      expect(basicConfig.encryption).toBe('default');
    });

    test('should generate database config with isolation', () => {
      const siloConfig = orchestrator.getDatabaseConfig('premium', 'azure', 'eastus', 'silo');
      const poolConfig = orchestrator.getDatabaseConfig('standard', 'azure', 'eastus', 'pool');

      expect(siloConfig.isolated).toBe(true);
      expect(poolConfig.isolated).toBe(false);
      expect(siloConfig.highAvailability).toBe(true);
      expect(siloConfig.readReplicas).toBeGreaterThan(poolConfig.readReplicas);
    });

    test('should generate security config based on compliance', () => {
      const config = orchestrator.getSecurityConfig(['ISO27001', 'GDPR'], 'azure', 'silo');

      expect(config.encryption.atRest).toBe(true);
      expect(config.encryption.inTransit).toBe(true);
      expect(config.encryption.keyManagement).toBe('dedicated');
      expect(config.compliance).toContain('ISO27001');
      expect(config.compliance).toContain('GDPR');
      expect(config.threatProtection).toBe(true);
    });
  });

  describe('Resource Provisioning', () => {
    test('should provision Azure resources', async () => {
      const plan = {
        tenantId: 'tenant-azure-001',
        tenantName: 'Azure Test Tenant',
        cloudProvider: 'azure',
        region: 'eastus',
        resources: [
          { type: RESOURCE_TYPES.NETWORK, name: 'test-network', config: {} },
          { type: RESOURCE_TYPES.COMPUTE, name: 'test-compute', config: {} }
        ]
      };

      const result = await orchestrator.provisionAzureResources(plan);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      result.forEach(resource => {
        expect(resource).toHaveProperty('resourceId');
        expect(resource).toHaveProperty('cloudProvider', CLOUD_PROVIDERS.AZURE);
        expect(resource).toHaveProperty('status', 'active');
      });
    });

    test('should provision AWS resources', async () => {
      const plan = {
        tenantId: 'tenant-aws-001',
        tenantName: 'AWS Test Tenant',
        cloudProvider: 'aws',
        region: 'us-east-1',
        resources: [
          { type: RESOURCE_TYPES.NETWORK, name: 'test-network', config: {} },
          { type: RESOURCE_TYPES.COMPUTE, name: 'test-compute', config: {} }
        ]
      };

      const result = await orchestrator.provisionAWSResources(plan);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      result.forEach(resource => {
        expect(resource).toHaveProperty('resourceId');
        expect(resource).toHaveProperty('cloudProvider', CLOUD_PROVIDERS.AWS);
        expect(resource).toHaveProperty('status', 'active');
      });
    });

    test('should provision GCP resources', async () => {
      const plan = {
        tenantId: 'tenant-gcp-001',
        tenantName: 'GCP Test Tenant',
        cloudProvider: 'gcp',
        region: 'us-central1',
        resources: [
          { type: RESOURCE_TYPES.NETWORK, name: 'test-network', config: {} },
          { type: RESOURCE_TYPES.COMPUTE, name: 'test-compute', config: {} }
        ]
      };

      const result = await orchestrator.provisionGCPResources(plan);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      result.forEach(resource => {
        expect(resource).toHaveProperty('resourceId');
        expect(resource).toHaveProperty('cloudProvider', CLOUD_PROVIDERS.GCP);
        expect(resource).toHaveProperty('status', 'active');
      });
    });

    test('should emit events during provisioning', async () => {
      const events = [];
      orchestrator.on('resource-provisioned', (data) => {
        events.push(data);
      });

      const tenantConfig = {
        tenantId: 'tenant-events-001',
        tenantName: 'Events Test Tenant',
        cloudProvider: 'azure',
        region: 'eastus',
        isolationModel: 'silo',
        serviceTier: 'standard',
        resourceRequirements: {
          compute: true,
          storage: true
        }
      };

      await orchestrator.provisionTenantInfrastructure(tenantConfig);

      expect(events.length).toBeGreaterThan(0);
      events.forEach(event => {
        expect(event).toHaveProperty('resourceId');
        expect(event).toHaveProperty('status', 'active');
      });
    });

    test('should handle provisioning errors', async () => {
      const invalidConfig = {
        tenantId: 'tenant-invalid-001',
        tenantName: 'Invalid Tenant',
        cloudProvider: 'invalid-provider',
        region: 'invalid-region',
        isolationModel: 'silo',
        serviceTier: 'standard',
        resourceRequirements: {}
      };

      await expect(
        orchestrator.provisionTenantInfrastructure(invalidConfig)
      ).rejects.toThrow();
    });
  });

  describe('Resource Deprovisioning', () => {
    test('should deprovision tenant infrastructure', async () => {
      const result = await orchestrator.deprovisionTenantInfrastructure('tenant-001', 'azure');

      expect(result).toHaveProperty('tenantId', 'tenant-001');
      expect(result).toHaveProperty('cloudProvider', 'azure');
      expect(result).toHaveProperty('status', 'completed');
      expect(result).toHaveProperty('deprovisionedResources');
    });

    test('should emit deprovisioning events', async () => {
      const events = [];
      orchestrator.on('tenant-deprovisioned', (data) => {
        events.push(data);
      });

      await orchestrator.deprovisionTenantInfrastructure('tenant-002', 'azure');

      expect(events.length).toBe(1);
      expect(events[0]).toHaveProperty('tenantId', 'tenant-002');
      expect(events[0]).toHaveProperty('status', 'completed');
    });
  });

  describe('Resource Monitoring', () => {
    test('should get tenant resource status', async () => {
      const status = await orchestrator.getTenantResourceStatus('tenant-001');

      expect(status).toHaveProperty('tenantId', 'tenant-001');
      expect(status).toHaveProperty('providers');
      expect(Object.keys(status.providers).length).toBeGreaterThan(0);
    });

    test('should monitor tenant resources', async () => {
      const metrics = await orchestrator.monitorTenantResources('tenant-001');

      expect(metrics).toHaveProperty('tenantId', 'tenant-001');
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('providers');
      
      Object.values(metrics.providers).forEach(providerMetrics => {
        expect(providerMetrics).toHaveProperty('compute');
        expect(providerMetrics).toHaveProperty('storage');
        expect(providerMetrics).toHaveProperty('network');
        expect(providerMetrics).toHaveProperty('cost');
      });
    });
  });

  describe('Resource Optimization', () => {
    test('should provide cost optimization recommendations', async () => {
      const recommendations = await orchestrator.optimizeTenantResources('tenant-001', {
        cost: true
      });

      expect(recommendations).toHaveProperty('tenantId', 'tenant-001');
      expect(recommendations).toHaveProperty('recommendations');
      expect(recommendations).toHaveProperty('potentialSavings');
      expect(recommendations.recommendations.length).toBeGreaterThan(0);
    });

    test('should provide performance optimization recommendations', async () => {
      const recommendations = await orchestrator.optimizeTenantResources('tenant-001', {
        performance: true
      });

      expect(recommendations).toHaveProperty('recommendations');
      const perfRecs = recommendations.recommendations.filter(r => r.type === 'performance');
      expect(perfRecs.length).toBeGreaterThan(0);
    });

    test('should provide security optimization recommendations', async () => {
      const recommendations = await orchestrator.optimizeTenantResources('tenant-001', {
        security: true
      });

      expect(recommendations).toHaveProperty('recommendations');
      const secRecs = recommendations.recommendations.filter(r => r.type === 'security');
      expect(secRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    test('should perform health check on all providers', async () => {
      const health = await orchestrator.healthCheck();

      expect(health).toHaveProperty('status', 'healthy');
      expect(health).toHaveProperty('providers');
      expect(health).toHaveProperty('timestamp');
      expect(Object.keys(health.providers).length).toBe(3);
    });

    test('should return provider status', () => {
      const azureStatus = orchestrator.getProviderStatus('azure');

      expect(azureStatus).toHaveProperty('name', 'Azure');
      expect(azureStatus).toHaveProperty('enabled', true);
      expect(azureStatus).toHaveProperty('status', 'connected');
    });

    test('should return all providers status', () => {
      const status = orchestrator.getProviderStatus();

      expect(Object.keys(status).length).toBe(3);
      expect(status).toHaveProperty('azure');
      expect(status).toHaveProperty('aws');
      expect(status).toHaveProperty('gcp');
    });
  });
});
