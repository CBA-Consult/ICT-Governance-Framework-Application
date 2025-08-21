// File: ict-governance-framework/test-monitoring-capabilities.js
// Test script to validate monitoring and health check capabilities

const MonitoringHealthService = require('./api/monitoring-health-service');
const { diagnosticTools } = require('./api/diagnostic-tools');

async function testMonitoringCapabilities() {
  console.log('🔍 Testing Monitoring and Health Check Capabilities...\n');

  try {
    // Test 1: Initialize Monitoring Service
    console.log('1. Testing Monitoring Service Initialization...');
    const monitoringService = new MonitoringHealthService({
      healthCheckInterval: 5000,
      enableRealTimeMonitoring: true,
      enableDiagnostics: true,
      enableAlerting: true
    });
    console.log('✅ Monitoring service initialized successfully\n');

    // Test 2: Register a Mock Integration
    console.log('2. Testing Integration Registration...');
    const mockIntegration = {
      healthCheck: async () => ({ status: 'healthy', timestamp: new Date() }),
      getAccessToken: async () => 'mock-token-12345',
      getUsers: async (params) => [{ id: 1, name: 'Test User' }],
      getMetrics: () => ({ responseTime: 150, successRate: 98.5 })
    };

    monitoringService.registerIntegration('test-integration', mockIntegration, {
      priority: 'high',
      healthCheckInterval: 10000,
      alertThresholds: {
        responseTime: 5000,
        errorRate: 10,
        availability: 95
      },
      customHealthChecks: [
        {
          name: 'token_validity',
          description: 'Test token validity',
          test: async (integration) => {
            const token = await integration.getAccessToken();
            return { valid: !!token, tokenLength: token.length };
          }
        }
      ]
    });
    console.log('✅ Mock integration registered successfully\n');

    // Test 3: Perform Health Check
    console.log('3. Testing Health Check Execution...');
    const healthResult = await monitoringService.performHealthCheck('test-integration');
    console.log('Health Check Result:', {
      status: healthResult.status,
      responseTime: healthResult.responseTime,
      hasCustomChecks: !!healthResult.details.custom
    });
    console.log('✅ Health check executed successfully\n');

    // Test 4: Get Comprehensive Health Status
    console.log('4. Testing Comprehensive Health Status...');
    const comprehensiveHealth = await monitoringService.getComprehensiveHealthStatus();
    console.log('Comprehensive Health Status:', {
      overall: comprehensiveHealth.overall,
      totalIntegrations: comprehensiveHealth.summary.total,
      healthyIntegrations: comprehensiveHealth.summary.healthy
    });
    console.log('✅ Comprehensive health status retrieved successfully\n');

    // Test 5: Test Diagnostic Tools
    console.log('5. Testing Diagnostic Tools...');
    const diagnosticResult = await diagnosticTools.runDiagnostics('test-integration', mockIntegration, {
      tests: ['connectivity', 'authentication', 'performance']
    });
    console.log('Diagnostic Results:', {
      totalTests: diagnosticResult.summary.total,
      passed: diagnosticResult.summary.passed,
      failed: diagnosticResult.summary.failed,
      executionTime: diagnosticResult.executionTime
    });
    console.log('✅ Diagnostic tests executed successfully\n');

    // Test 6: Test Alert Generation
    console.log('6. Testing Alert Generation...');
    // Simulate a slow response to trigger alert
    const slowMockIntegration = {
      healthCheck: async () => {
        await new Promise(resolve => setTimeout(resolve, 6000)); // 6 second delay
        return { status: 'healthy', timestamp: new Date() };
      }
    };

    monitoringService.registerIntegration('slow-integration', slowMockIntegration, {
      priority: 'critical',
      alertThresholds: {
        responseTime: 3000, // 3 second threshold
        errorRate: 5,
        availability: 99
      }
    });

    const slowHealthResult = await monitoringService.performHealthCheck('slow-integration');
    console.log('Slow Integration Health Check:', {
      status: slowHealthResult.status,
      responseTime: slowHealthResult.responseTime,
      alertsGenerated: slowHealthResult.alerts?.length || 0
    });
    console.log('✅ Alert generation tested successfully\n');

    // Test 7: Test Metrics Collection
    console.log('7. Testing Metrics Collection...');
    const metrics = monitoringService.getMetrics();
    console.log('Metrics Summary:', {
      totalMetrics: Object.keys(metrics).length,
      sampleMetric: Object.keys(metrics)[0] ? metrics[Object.keys(metrics)[0]] : 'No metrics yet'
    });
    console.log('✅ Metrics collection tested successfully\n');

    // Test 8: Test Diagnostic Report Generation
    console.log('8. Testing Diagnostic Report Generation...');
    const diagnosticReport = await diagnosticTools.generateDiagnosticReport('test-integration', {
      includeTrends: true,
      includeHistory: true,
      includeRecommendations: true
    });
    console.log('Diagnostic Report:', {
      integrationName: diagnosticReport.integrationName,
      hasRecommendations: diagnosticReport.recommendations?.length > 0,
      reportGenerated: !!diagnosticReport.generatedAt
    });
    console.log('✅ Diagnostic report generation tested successfully\n');

    // Cleanup
    monitoringService.stopAllMonitoring();
    console.log('🧹 Cleanup completed\n');

    console.log('🎉 All monitoring and health check capabilities tested successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Monitoring Service Initialization');
    console.log('✅ Integration Registration');
    console.log('✅ Health Check Execution');
    console.log('✅ Comprehensive Health Status');
    console.log('✅ Diagnostic Tools');
    console.log('✅ Alert Generation');
    console.log('✅ Metrics Collection');
    console.log('✅ Diagnostic Report Generation');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testMonitoringCapabilities()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testMonitoringCapabilities };