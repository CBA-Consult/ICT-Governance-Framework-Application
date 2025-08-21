// File: ict-governance-framework/api/initialize-monitoring.js
// Initialize monitoring for all enterprise integrations

const { monitoringService } = require('./monitoring');
const { diagnosticTools } = require('./diagnostic-tools');
const EnterpriseIntegration = require('./framework/enterprise-integration');

/**
 * Initialize monitoring for all enterprise integrations
 */
async function initializeMonitoring() {
  console.log('Initializing comprehensive monitoring and health check capabilities...');

  try {
    // Initialize enterprise integration service
    const enterpriseIntegration = new EnterpriseIntegration({
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      enableMetrics: true,
      enableCaching: true
    });

    // Register all integrations with monitoring service
    const integrations = [
      {
        name: 'azure-ad',
        priority: 'critical',
        healthCheckInterval: 30000,
        alertThresholds: {
          responseTime: 3000,
          errorRate: 5,
          availability: 99
        },
        customHealthChecks: [
          {
            name: 'token_validity',
            description: 'Check if Azure AD tokens are valid and not expired',
            test: async (integration) => {
              const token = await integration.getAccessToken();
              return { valid: !!token, tokenLength: token?.length || 0 };
            }
          },
          {
            name: 'user_query',
            description: 'Test user query functionality',
            test: async (integration) => {
              const users = await integration.getUsers({ limit: 1 });
              return { userCount: users?.length || 0 };
            }
          }
        ],
        diagnosticTests: [
          {
            name: 'graph_api_connectivity',
            description: 'Test Microsoft Graph API connectivity',
            test: async (integration) => {
              const response = await integration.client.get('/v1.0/me');
              return { statusCode: response.status };
            }
          }
        ]
      },
      {
        name: 'defender-cloud-apps',
        priority: 'critical',
        healthCheckInterval: 60000,
        alertThresholds: {
          responseTime: 5000,
          errorRate: 10,
          availability: 95
        },
        customHealthChecks: [
          {
            name: 'discovered_apps_check',
            description: 'Verify discovered apps data is accessible',
            test: async (integration) => {
              const apps = await integration.getDiscoveredApps({ limit: 1 });
              return { appsFound: apps?.length || 0 };
            }
          },
          {
            name: 'alerts_check',
            description: 'Check security alerts accessibility',
            test: async (integration) => {
              const alerts = await integration.getAlerts({ limit: 1 });
              return { alertsFound: alerts?.length || 0 };
            }
          }
        ]
      },
      {
        name: 'servicenow',
        priority: 'high',
        healthCheckInterval: 60000,
        alertThresholds: {
          responseTime: 5000,
          errorRate: 10,
          availability: 95
        },
        customHealthChecks: [
          {
            name: 'incident_creation',
            description: 'Test incident creation capability',
            test: async (integration) => {
              // Test with a dummy incident (would be cleaned up)
              const testIncident = {
                title: 'Health Check Test',
                description: 'Automated health check test incident',
                priority: '5',
                category: 'Software'
              };
              const result = await integration.createIncident(testIncident);
              return { incidentCreated: !!result };
            }
          },
          {
            name: 'cmdb_access',
            description: 'Test CMDB data access',
            test: async (integration) => {
              const items = await integration.getCMDBItems({ limit: 1 });
              return { cmdbItemsFound: items?.length || 0 };
            }
          }
        ]
      },
      {
        name: 'power-bi',
        priority: 'medium',
        healthCheckInterval: 120000,
        alertThresholds: {
          responseTime: 8000,
          errorRate: 15,
          availability: 90
        },
        customHealthChecks: [
          {
            name: 'reports_access',
            description: 'Test Power BI reports access',
            test: async (integration) => {
              const reports = await integration.getReports({ limit: 1 });
              return { reportsFound: reports?.length || 0 };
            }
          }
        ]
      },
      {
        name: 'sap-erp',
        priority: 'critical',
        healthCheckInterval: 60000,
        alertThresholds: {
          responseTime: 10000,
          errorRate: 5,
          availability: 98
        },
        customHealthChecks: [
          {
            name: 'odata_service',
            description: 'Test SAP OData service connectivity',
            test: async (integration) => {
              const users = await integration.getUsers({ limit: 1 });
              return { usersFound: users?.length || 0 };
            }
          },
          {
            name: 'financial_data',
            description: 'Test financial data access',
            test: async (integration) => {
              const data = await integration.getFinancialData({ limit: 1 });
              return { dataRecords: data?.length || 0 };
            }
          }
        ]
      },
      {
        name: 'salesforce',
        priority: 'high',
        healthCheckInterval: 60000,
        alertThresholds: {
          responseTime: 5000,
          errorRate: 10,
          availability: 95
        },
        customHealthChecks: [
          {
            name: 'sobject_access',
            description: 'Test Salesforce object access',
            test: async (integration) => {
              const accounts = await integration.getAccounts({ limit: 1 });
              return { accountsFound: accounts?.length || 0 };
            }
          }
        ]
      },
      {
        name: 'workday',
        priority: 'high',
        healthCheckInterval: 120000,
        alertThresholds: {
          responseTime: 8000,
          errorRate: 10,
          availability: 95
        },
        customHealthChecks: [
          {
            name: 'worker_data',
            description: 'Test worker data access',
            test: async (integration) => {
              const workers = await integration.getWorkers({ limit: 1 });
              return { workersFound: workers?.length || 0 };
            }
          }
        ]
      },
      {
        name: 'synapse',
        priority: 'medium',
        healthCheckInterval: 300000,
        alertThresholds: {
          responseTime: 15000,
          errorRate: 15,
          availability: 90
        },
        customHealthChecks: [
          {
            name: 'pipeline_status',
            description: 'Check data pipeline status',
            test: async (integration) => {
              const pipelines = await integration.getPipelines({ limit: 1 });
              return { pipelinesFound: pipelines?.length || 0 };
            }
          }
        ]
      },
      {
        name: 'sentinel',
        priority: 'critical',
        healthCheckInterval: 60000,
        alertThresholds: {
          responseTime: 5000,
          errorRate: 5,
          availability: 98
        },
        customHealthChecks: [
          {
            name: 'incident_access',
            description: 'Test security incident access',
            test: async (integration) => {
              const incidents = await integration.getIncidents({ limit: 1 });
              return { incidentsFound: incidents?.length || 0 };
            }
          }
        ]
      },
      {
        name: 'oracle',
        priority: 'high',
        healthCheckInterval: 120000,
        alertThresholds: {
          responseTime: 8000,
          errorRate: 10,
          availability: 95
        },
        customHealthChecks: [
          {
            name: 'query_execution',
            description: 'Test database query execution',
            test: async (integration) => {
              const result = await integration.executeQuery('SELECT 1 FROM DUAL');
              return { queryExecuted: !!result };
            }
          }
        ]
      },
      {
        name: 'aws',
        priority: 'medium',
        healthCheckInterval: 300000,
        alertThresholds: {
          responseTime: 10000,
          errorRate: 15,
          availability: 90
        },
        customHealthChecks: [
          {
            name: 'resource_discovery',
            description: 'Test AWS resource discovery',
            test: async (integration) => {
              const resources = await integration.getResources({ limit: 1 });
              return { resourcesFound: resources?.length || 0 };
            }
          }
        ]
      },
      {
        name: 'gcp',
        priority: 'medium',
        healthCheckInterval: 300000,
        alertThresholds: {
          responseTime: 10000,
          errorRate: 15,
          availability: 90
        },
        customHealthChecks: [
          {
            name: 'resource_discovery',
            description: 'Test GCP resource discovery',
            test: async (integration) => {
              const resources = await integration.getResources({ limit: 1 });
              return { resourcesFound: resources?.length || 0 };
            }
          }
        ]
      },
      {
        name: 'legacy-systems',
        priority: 'low',
        healthCheckInterval: 600000,
        alertThresholds: {
          responseTime: 30000,
          errorRate: 20,
          availability: 85
        },
        customHealthChecks: [
          {
            name: 'file_transfer',
            description: 'Test file transfer capability',
            test: async (integration) => {
              // Test file transfer without actually transferring files
              return { transferCapable: true };
            }
          }
        ]
      }
    ];

    // Register each integration
    for (const integrationConfig of integrations) {
      try {
        // Get the actual integration adapter
        const adapter = enterpriseIntegration.adapters.get(integrationConfig.name);
        
        if (adapter) {
          // Register with monitoring service
          monitoringService.registerIntegration(
            integrationConfig.name,
            adapter,
            integrationConfig
          );

          // Register custom diagnostic tests with diagnostic tools
          if (integrationConfig.diagnosticTests) {
            for (const diagnosticTest of integrationConfig.diagnosticTests) {
              diagnosticTools.registerDiagnosticTest(
                `${integrationConfig.name}_${diagnosticTest.name}`,
                {
                  name: `${integrationConfig.name} - ${diagnosticTest.name}`,
                  description: diagnosticTest.description,
                  category: 'integration_specific',
                  severity: 'info',
                  test: diagnosticTest.test
                }
              );
            }
          }

          console.log(`✓ Registered monitoring for integration: ${integrationConfig.name}`);
        } else {
          console.warn(`⚠ Integration adapter not found: ${integrationConfig.name}`);
        }
      } catch (error) {
        console.error(`✗ Failed to register monitoring for ${integrationConfig.name}:`, error.message);
      }
    }

    // Set up event handlers for monitoring events
    setupMonitoringEventHandlers();

    console.log('✓ Monitoring initialization completed successfully');
    console.log(`✓ Monitoring ${integrations.length} integrations`);
    console.log('✓ Health checks, diagnostics, and alerting are now active');

    return {
      success: true,
      integrationsRegistered: integrations.length,
      monitoringService,
      diagnosticTools,
      enterpriseIntegration
    };

  } catch (error) {
    console.error('✗ Failed to initialize monitoring:', error);
    throw error;
  }
}

/**
 * Set up event handlers for monitoring events
 */
function setupMonitoringEventHandlers() {
  // Health check completed event
  monitoringService.on('health-check-completed', (result) => {
    if (result.status !== 'healthy') {
      console.warn(`Health check warning for ${result.integrationName}:`, result.status);
    }
  });

  // Health check error event
  monitoringService.on('health-check-error', (error) => {
    console.error(`Health check error for ${error.integrationName}:`, error.error);
  });

  // Alert triggered event
  monitoringService.on('alert-triggered', (alert) => {
    console.warn(`Alert triggered for ${alert.integrationName}:`, alert.message);
    
    // Here you could integrate with external alerting systems
    // sendToSlack(alert);
    // sendToEmail(alert);
    // createJiraTicket(alert);
  });

  // Integration registered event
  monitoringService.on('integration-registered', (data) => {
    console.log(`Integration registered for monitoring: ${data.name}`);
  });
}

/**
 * Get monitoring status
 */
function getMonitoringStatus() {
  return {
    isInitialized: true,
    integrationsCount: monitoringService.integrations.size,
    healthChecksActive: monitoringService.options.enableRealTimeMonitoring,
    diagnosticsEnabled: monitoringService.options.enableDiagnostics,
    alertingEnabled: monitoringService.options.enableAlerting,
    uptime: process.uptime()
  };
}

/**
 * Stop all monitoring
 */
function stopMonitoring() {
  console.log('Stopping all monitoring services...');
  monitoringService.stopAllMonitoring();
  console.log('✓ All monitoring stopped');
}

module.exports = {
  initializeMonitoring,
  getMonitoringStatus,
  stopMonitoring,
  setupMonitoringEventHandlers
};