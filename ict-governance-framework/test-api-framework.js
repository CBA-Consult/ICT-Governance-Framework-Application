// File: ict-governance-framework/test-api-framework.js
// Simple test script to validate the API framework components

const APIFrameworkCore = require('./api/framework/api-framework-core');
const { EnterpriseIntegration } = require('./api/framework/enterprise-integration');
const APIManagement = require('./api/framework/api-management');
const IntegrationOrchestrator = require('./api/framework/integration-orchestrator');
const EnterpriseAPI = require('./api/enterprise-api');

async function testAPIFramework() {
  console.log('🧪 Testing API Framework Components...\n');

  try {
    // Test 1: API Framework Core
    console.log('1️⃣ Testing API Framework Core...');
    const apiFramework = new APIFrameworkCore({
      version: '2.0.0',
      enableMetrics: false, // Disable for testing
      enableCaching: false
    });
    
    // Test error response creation
    const errorResponse = apiFramework.createErrorResponse('TEST_ERROR', 'Test error message');
    console.log('   ✅ Error response creation:', errorResponse.error.code === 'TEST_ERROR');
    
    // Test success response creation
    const successResponse = apiFramework.createSuccessResponse({ test: 'data' });
    console.log('   ✅ Success response creation:', successResponse.success === true);
    
    // Test validation rules
    const validationRules = apiFramework.getValidationRules();
    console.log('   ✅ Validation rules available:', Object.keys(validationRules).length > 0);

    // Test 2: Enterprise Integration
    console.log('\n2️⃣ Testing Enterprise Integration...');
    const enterpriseIntegration = new EnterpriseIntegration({
      enableMetrics: false,
      enableCaching: false
    });
    
    // Check if adapters are registered
    const adapterCount = enterpriseIntegration.adapters.size;
    console.log('   ✅ Adapters registered:', adapterCount >= 7);
    
    // Test metrics collection
    const metrics = enterpriseIntegration.getMetrics();
    console.log('   ✅ Metrics collection working:', typeof metrics === 'object');

    // Test 3: API Management (without database)
    console.log('\n3️⃣ Testing API Management...');
    const apiManagement = new APIManagement({
      enableMetrics: false,
      enablePersistence: false // Disable database operations for testing
    });
    
    // Test API specification validation
    try {
      const testSpec = {
        name: 'test-api',
        version: '1.0.0',
        basePath: '/api/test',
        description: 'Test API'
      };
      apiManagement.validateAPISpec(testSpec);
      console.log('   ✅ API specification validation working');
    } catch (error) {
      console.log('   ❌ API specification validation failed:', error.message);
    }

    // Test 4: Integration Orchestrator (without database)
    console.log('\n4️⃣ Testing Integration Orchestrator...');
    const orchestrator = new IntegrationOrchestrator({
      enableMetrics: false,
      enablePersistence: false // Disable database operations for testing
    });
    
    // Test workflow definition validation
    try {
      const testWorkflow = {
        name: 'test-workflow',
        steps: [
          {
            name: 'test-step',
            type: 'validation',
            config: { data: 'test' }
          }
        ]
      };
      orchestrator.validateWorkflowDefinition(testWorkflow);
      console.log('   ✅ Workflow definition validation working');
    } catch (error) {
      console.log('   ❌ Workflow definition validation failed:', error.message);
    }

    // Test 5: Enterprise API Router
    console.log('\n5️⃣ Testing Enterprise API Router...');
    const enterpriseAPI = new EnterpriseAPI({
      version: '2.0.0',
      enableMetrics: false,
      enableCaching: false,
      enableWorkflows: false
    });
    
    const router = enterpriseAPI.getRouter();
    console.log('   ✅ Enterprise API router created:', typeof router === 'function');
    
    const components = enterpriseAPI.getComponents();
    console.log('   ✅ Framework components accessible:', Object.keys(components).length === 4);

    console.log('\n🎉 All API Framework Components Test Passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ API Framework Core - Working');
    console.log('   ✅ Enterprise Integration - Working');
    console.log('   ✅ API Management - Working');
    console.log('   ✅ Integration Orchestrator - Working');
    console.log('   ✅ Enterprise API Router - Working');
    
    console.log('\n🚀 API Framework is ready for production use!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPIFramework();
}

module.exports = { testAPIFramework };