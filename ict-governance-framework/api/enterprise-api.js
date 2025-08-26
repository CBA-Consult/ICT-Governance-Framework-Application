// File: ict-governance-framework/api/enterprise-api.js
// Main Enterprise API Router - Unified API for all enterprise integrations

const express = require('express');
const { body, param, query } = require('express-validator');
const APIFrameworkCore = require('./framework/api-framework-core');
const { EnterpriseIntegration } = require('./framework/enterprise-integration');
const APIManagement = require('./framework/api-management');
const IntegrationOrchestrator = require('./framework/integration-orchestrator');

/**
 * Enterprise API Router
 * Provides unified access to all enterprise integration capabilities
 */
class EnterpriseAPI {
  constructor(options = {}) {
    this.options = {
      version: '2.0.0',
      basePath: '/api/v2/enterprise',
      enableMetrics: true,
      enableCaching: true,
      enableWorkflows: true,
      ...options
    };

    // Initialize framework components
    this.apiFramework = new APIFrameworkCore(this.options);
    this.enterpriseIntegration = new EnterpriseIntegration(this.options);
    this.apiManagement = new APIManagement(this.options);
    this.orchestrator = new IntegrationOrchestrator(this.options);

    // Create main router
    this.router = this.createMainRouter();
    
    this.initializeAPI();
  }

  /**
   * Initialize API and register workflows
   */
  async initializeAPI() {
    try {
      await this.registerDefaultWorkflows();
      await this.registerAPISpecifications();
      console.log('Enterprise API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Enterprise API:', error);
    }
  }

  /**
   * Create main API router
   */
  createMainRouter() {
    const router = this.apiFramework.createRouter({
      rateLimitTier: 'integration',
      requireAuth: true,
      enableCaching: true
    });

    // Mount sub-routers
    router.use('/integrations', this.createIntegrationsRouter());
    router.use('/workflows', this.createWorkflowsRouter());
    router.use('/management', this.createManagementRouter());
    router.use('/health', this.createHealthRouter());

    // API documentation
    router.use('/docs', this.apiManagement.createDocumentationEndpoint());

    return router;
  }

  /**
   * Create integrations router
   */
  createIntegrationsRouter() {
    const router = this.apiFramework.createRouter();

    // Azure Active Directory Integration
    router.get('/azure-ad/users', 
      this.apiFramework.middlewares.validation([
        ...this.apiFramework.getValidationRules().pagination,
        ...this.apiFramework.getValidationRules().filters
      ]),
      async (req, res, next) => {
        try {
          const cacheKey = `azure-ad:users:${JSON.stringify(req.query)}`;
          let result = await this.apiFramework.getCachedResponse(cacheKey);
          
          if (!result) {
            result = await this.enterpriseIntegration.executeIntegration(
              'azure-ad', 
              'getUsers', 
              req.query,
              { useCache: true, cacheTTL: 300 }
            );
            await this.apiFramework.setCachedResponse(cacheKey, result, 300);
          }

          res.json(this.apiFramework.createSuccessResponse(result, {
            source: 'azure-ad',
            cached: !!result.cached
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    router.get('/azure-ad/groups',
      this.apiFramework.middlewares.validation([
        ...this.apiFramework.getValidationRules().pagination
      ]),
      async (req, res, next) => {
        try {
          const result = await this.enterpriseIntegration.executeIntegration(
            'azure-ad',
            'getGroups',
            req.query
          );

          res.json(this.apiFramework.createSuccessResponse(result, {
            source: 'azure-ad'
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    // Microsoft Defender for Cloud Apps Integration
    router.get('/defender/discovered-apps',
      this.apiFramework.middlewares.validation([
        ...this.apiFramework.getValidationRules().pagination,
        ...this.apiFramework.getValidationRules().dateRange
      ]),
      async (req, res, next) => {
        try {
          const result = await this.enterpriseIntegration.executeIntegration(
            'defender-cloud-apps',
            'getDiscoveredApps',
            req.query
          );

          res.json(this.apiFramework.createSuccessResponse(result, {
            source: 'defender-cloud-apps'
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    router.get('/defender/alerts',
      this.apiFramework.middlewares.validation([
        ...this.apiFramework.getValidationRules().pagination,
        ...this.apiFramework.getValidationRules().dateRange
      ]),
      async (req, res, next) => {
        try {
          const result = await this.enterpriseIntegration.executeIntegration(
            'defender-cloud-apps',
            'getAlerts',
            req.query
          );

          res.json(this.apiFramework.createSuccessResponse(result, {
            source: 'defender-cloud-apps'
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    // ServiceNow ITSM Integration
    router.get('/servicenow/incidents',
      this.apiFramework.middlewares.validation([
        ...this.apiFramework.getValidationRules().pagination
      ]),
      async (req, res, next) => {
        try {
          const result = await this.enterpriseIntegration.executeIntegration(
            'servicenow',
            'getIncidents',
            req.query
          );

          res.json(this.apiFramework.createSuccessResponse(result, {
            source: 'servicenow'
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    router.post('/servicenow/incidents',
      this.apiFramework.middlewares.validation([
  body('short_description').notEmpty(),
  body('description').optional(),
  body('priority').optional().isIn(['1', '2', '3', '4', '5']),
  body('category').optional()
      ]),
      async (req, res, next) => {
        try {
          const result = await this.enterpriseIntegration.executeIntegration(
            'servicenow',
            'createIncident',
            req.body
          );

          res.status(201).json(this.apiFramework.createSuccessResponse(result, {
            source: 'servicenow',
            action: 'create'
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    // Power BI Integration
    router.get('/powerbi/reports',
      async (req, res, next) => {
        try {
          const result = await this.enterpriseIntegration.executeIntegration(
            'power-bi',
            'getReports',
            req.query
          );

          res.json(this.apiFramework.createSuccessResponse(result, {
            source: 'power-bi'
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    router.get('/powerbi/datasets',
      async (req, res, next) => {
        try {
          const result = await this.enterpriseIntegration.executeIntegration(
            'power-bi',
            'getDatasets',
            req.query
          );

          res.json(this.apiFramework.createSuccessResponse(result, {
            source: 'power-bi'
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    // Multi-Cloud Integration
    router.get('/aws/resources',
      async (req, res, next) => {
        try {
          const result = await this.enterpriseIntegration.executeIntegration(
            'aws',
            'getResources',
            req.query
          );

          res.json(this.apiFramework.createSuccessResponse(result, {
            source: 'aws'
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    router.get('/gcp/resources',
      async (req, res, next) => {
        try {
          const result = await this.enterpriseIntegration.executeIntegration(
            'gcp',
            'getResources',
            req.query
          );

          res.json(this.apiFramework.createSuccessResponse(result, {
            source: 'gcp'
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    // Legacy Systems Integration
    router.post('/legacy/file-transfer',
      this.apiFramework.middlewares.validation([
  body('files').isArray(),
  body('operation').isIn(['upload', 'download', 'process'])
      ]),
      async (req, res, next) => {
        try {
          const result = await this.enterpriseIntegration.executeIntegration(
            'legacy-systems',
            'processFileTransfer',
            req.body
          );

          res.json(this.apiFramework.createSuccessResponse(result, {
            source: 'legacy-systems'
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    // Integration health check
    router.get('/health',
      async (req, res, next) => {
        try {
          const health = await this.enterpriseIntegration.getAdapterHealth();
          res.json(this.apiFramework.createSuccessResponse(health));
        } catch (error) {
          next(error);
        }
      }
    );

    // Integration metrics
    router.get('/metrics',
      async (req, res, next) => {
        try {
          const metrics = this.enterpriseIntegration.getMetrics();
          res.json(this.apiFramework.createSuccessResponse(metrics));
        } catch (error) {
          next(error);
        }
      }
    );

    return router;
  }

  /**
   * Create workflows router
   */
  createWorkflowsRouter() {
    const router = this.apiFramework.createRouter();

    // Execute workflow
    router.post('/execute/:workflowName',
      this.apiFramework.middlewares.validation([
        param('workflowName').notEmpty(),
        body('inputData').optional().isObject(),
        body('context').optional().isObject()
      ]),
      async (req, res, next) => {
        try {
          const { workflowName } = req.params;
          const { inputData = {}, context = {} } = req.body;
          
          // Add user context
          context.triggeredBy = req.user.username;
          context.userId = req.user.user_id;
          
          const result = await this.orchestrator.executeWorkflow(
            workflowName,
            inputData,
            context
          );

          res.status(202).json(this.apiFramework.createSuccessResponse(result, {
            message: 'Workflow execution started'
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    // Get workflow execution status
    router.get('/executions/:executionId',
      this.apiFramework.middlewares.validation([
        param('executionId').isUUID()
      ]),
      async (req, res, next) => {
        try {
          const { executionId } = req.params;
          
          const result = await this.apiFramework.executeQuery(`
            SELECT we.*, iw.name as workflow_name,
                   json_agg(
                     json_build_object(
                       'step_name', ws.step_name,
                       'status', ws.status,
                       'started_at', ws.started_at,
                       'completed_at', ws.completed_at,
                       'retry_count', ws.retry_count
                     ) ORDER BY ws.step_order
                   ) as steps
            FROM workflow_executions we
            JOIN integration_workflows iw ON we.workflow_id = iw.workflow_id
            LEFT JOIN workflow_steps ws ON we.execution_id = ws.execution_id
            WHERE we.execution_id = $1
            GROUP BY we.execution_id, iw.name
          `, [executionId]);

          if (result.rows.length === 0) {
            return res.status(404).json(this.apiFramework.createErrorResponse(
              'EXECUTION_NOT_FOUND',
              'Workflow execution not found'
            ));
          }

          res.json(this.apiFramework.createSuccessResponse(result.rows[0]));
        } catch (error) {
          next(error);
        }
      }
    );

    // List workflow executions
    router.get('/executions',
      this.apiFramework.middlewares.validation([
        ...this.apiFramework.getValidationRules().pagination,
        query('status').optional().isIn(['pending', 'running', 'completed', 'failed', 'timeout']),
        query('workflowName').optional()
      ]),
      async (req, res, next) => {
        try {
          const { page = 1, limit = 50, status, workflowName } = req.query;
          const offset = (page - 1) * limit;

          let whereClause = '';
          const params = [];
          let paramCount = 0;

          if (status) {
            whereClause += ` AND we.status = $${++paramCount}`;
            params.push(status);
          }

          if (workflowName) {
            whereClause += ` AND iw.name = $${++paramCount}`;
            params.push(workflowName);
          }

          const query = `
            SELECT we.execution_id, we.status, we.started_at, we.completed_at,
                   we.correlation_id, we.triggered_by, iw.name as workflow_name
            FROM workflow_executions we
            JOIN integration_workflows iw ON we.workflow_id = iw.workflow_id
            WHERE 1=1 ${whereClause}
            ORDER BY we.started_at DESC
            LIMIT $${++paramCount} OFFSET $${++paramCount}
          `;

          const countQuery = `
            SELECT COUNT(*) as total
            FROM workflow_executions we
            JOIN integration_workflows iw ON we.workflow_id = iw.workflow_id
            WHERE 1=1 ${whereClause}
          `;

          params.push(limit, offset);
          const countParams = params.slice(0, -2);

          const [executions, count] = await Promise.all([
            this.apiFramework.executeQuery(query, params),
            this.apiFramework.executeQuery(countQuery, countParams)
          ]);

          res.json(this.apiFramework.createPaginatedResponse(
            executions.rows,
            {
              page: parseInt(page),
              limit: parseInt(limit),
              total: parseInt(count.rows[0].total)
            }
          ));
        } catch (error) {
          next(error);
        }
      }
    );

    // Register workflow
    router.post('/register',
      this.apiFramework.createAuthorizationMiddleware(['workflow:manage']),
      this.apiFramework.middlewares.validation([
  body('name').notEmpty(),
  body('description').optional(),
  body('steps').isArray(),
  body('version').optional()
      ]),
      async (req, res, next) => {
        try {
          const workflowDefinition = {
            ...req.body,
            createdBy: req.user.username
          };

          const workflowId = await this.orchestrator.registerWorkflow(workflowDefinition);

          res.status(201).json(this.apiFramework.createSuccessResponse({
            workflowId,
            name: workflowDefinition.name
          }, {
            message: 'Workflow registered successfully'
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    // Get workflow metrics
    router.get('/metrics',
      async (req, res, next) => {
        try {
          const metrics = this.orchestrator.getMetrics();
          res.json(this.apiFramework.createSuccessResponse(metrics));
        } catch (error) {
          next(error);
        }
      }
    );

    return router;
  }

  /**
   * Create management router
   */
  createManagementRouter() {
    const router = this.apiFramework.createRouter();

    // Mount API management endpoints
    router.use('/apis', this.apiManagement.createManagementEndpoints());

    // Clear integration cache
    router.post('/cache/clear',
      this.apiFramework.createAuthorizationMiddleware(['system:admin']),
      async (req, res, next) => {
        try {
          const { pattern } = req.body;
          this.enterpriseIntegration.clearCache(pattern);
          
          res.json(this.apiFramework.createSuccessResponse({
            cleared: true,
            pattern: pattern || 'all'
          }));
        } catch (error) {
          next(error);
        }
      }
    );

    // System metrics
    router.get('/metrics',
      async (req, res, next) => {
        try {
          const metrics = {
            api: this.apiFramework.getMetrics(),
            integration: this.enterpriseIntegration.getMetrics(),
            orchestrator: this.orchestrator.getMetrics()
          };

          res.json(this.apiFramework.createSuccessResponse(metrics));
        } catch (error) {
          next(error);
        }
      }
    );

    return router;
  }

  /**
   * Create health router
   */
  createHealthRouter() {
    const router = express.Router();

    router.get('/', this.apiFramework.createHealthCheck());

    return router;
  }

  /**
   * Register default workflows
   */
  async registerDefaultWorkflows() {
    const workflows = [
      {
        name: 'user-provisioning',
        description: 'Automated user provisioning across enterprise systems',
        version: '1.0.0',
        steps: [
          {
            name: 'validate-user-data',
            type: 'validation',
            config: {
              data: '${inputData.user}',
              rules: [
                { type: 'required', field: 'username' },
                { type: 'required', field: 'email' },
                { type: 'type', field: 'email', expectedType: 'string' }
              ],
              failOnValidationError: true
            }
          },
          {
            name: 'create-azure-ad-user',
            type: 'integration',
            config: {
              adapter: 'azure-ad',
              operation: 'createUser',
              parameters: {
                displayName: '${inputData.user.displayName}',
                userPrincipalName: '${inputData.user.email}',
                mailNickname: '${inputData.user.username}'
              }
            }
          },
          {
            name: 'create-servicenow-user',
            type: 'integration',
            config: {
              adapter: 'servicenow',
              operation: 'createUser',
              parameters: {
                user_name: '${inputData.user.username}',
                email: '${inputData.user.email}',
                first_name: '${inputData.user.firstName}',
                last_name: '${inputData.user.lastName}'
              }
            }
          },
          {
            name: 'send-notification',
            type: 'notification',
            config: {
              type: 'email',
              recipients: ['${inputData.user.email}', 'admin@company.com'],
              template: 'user-provisioned',
              data: {
                username: '${inputData.user.username}',
                systems: ['Azure AD', 'ServiceNow']
              }
            }
          }
        ]
      },
      {
        name: 'compliance-check',
        description: 'Automated compliance checking across enterprise systems',
        version: '1.0.0',
        steps: [
          {
            name: 'get-azure-policies',
            type: 'integration',
            config: {
              adapter: 'azure-ad',
              operation: 'getPolicies',
              parameters: {}
            }
          },
          {
            name: 'get-defender-alerts',
            type: 'integration',
            config: {
              adapter: 'defender-cloud-apps',
              operation: 'getAlerts',
              parameters: {
                severity: 'high'
              }
            }
          },
          {
            name: 'validate-compliance',
            type: 'validation',
            config: {
              data: '${stepResults}',
              rules: [
                { type: 'required', field: 'get-azure-policies.result' },
                { type: 'required', field: 'get-defender-alerts.result' }
              ]
            }
          },
          {
            name: 'generate-report',
            type: 'transformation',
            config: {
              sourceData: '${stepResults}',
              transformations: [
                { type: 'date_format', field: 'timestamp' }
              ]
            }
          }
        ]
      }
    ];

    for (const workflow of workflows) {
      try {
        await this.orchestrator.registerWorkflow(workflow);
        console.log(`Registered default workflow: ${workflow.name}`);
      } catch (error) {
        console.error(`Failed to register workflow ${workflow.name}:`, error.message);
      }
    }
  }

  /**
   * Register API specifications
   */
  async registerAPISpecifications() {
    const apiSpecs = [
      {
        name: 'enterprise-integration',
        version: '2.0.0',
        basePath: '/api/v2/enterprise',
        description: 'Enterprise Integration API for connecting with enterprise systems',
        ownerTeam: 'Platform Engineering',
        contactEmail: 'platform@company.com',
        documentationUrl: 'https://docs.company.com/api/enterprise',
        endpoints: [
          {
            method: 'GET',
            path: '/integrations/azure-ad/users',
            description: 'Get Azure AD users',
            rateLimitTier: 'standard',
            cacheTTL: 300
          },
          {
            method: 'GET',
            path: '/integrations/defender/discovered-apps',
            description: 'Get discovered applications from Defender',
            rateLimitTier: 'standard',
            cacheTTL: 600
          },
          {
            method: 'POST',
            path: '/workflows/execute/{workflowName}',
            description: 'Execute integration workflow',
            rateLimitTier: 'premium',
            cacheTTL: 0
          }
        ]
      }
    ];

    for (const spec of apiSpecs) {
      try {
        await this.apiManagement.registerAPI(spec);
        console.log(`Registered API specification: ${spec.name}`);
      } catch (error) {
        console.error(`Failed to register API spec ${spec.name}:`, error.message);
      }
    }
  }

  /**
   * Get the main router
   */
  getRouter() {
    return this.router;
  }

  /**
   * Get framework components (for testing or external access)
   */
  getComponents() {
    return {
      apiFramework: this.apiFramework,
      enterpriseIntegration: this.enterpriseIntegration,
      apiManagement: this.apiManagement,
      orchestrator: this.orchestrator
    };
  }
}

module.exports = EnterpriseAPI;