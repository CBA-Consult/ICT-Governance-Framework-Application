// File: ict-governance-framework/server.js
// Express server for the ICT Governance Framework with user management

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Import existing API routes
const defenderActivitiesRoute = require('./api/defender-activities');
const defenderEntitiesRouter = require('./api/defender-entities');
const defenderAlertsRouter = require('./api/defender-alerts');
const defenderFilesRouter = require('./api/defender-files');
const defenderDataEnrichmentRouter = require('./api/defender-dataenrichment');
const feedbackRouter = require('./api/feedback');
const escalationsRouter = require('./api/escalations');

// Import notification and communication API routes
const notificationsRouter = require('./api/notifications');
const alertsRouter = require('./api/alerts');
const communicationRouter = require('./api/communication');
const realtimeNotificationsRouter = require('./api/realtime-notifications');
const escalationManagementRouter = require('./api/escalation-management');

// Import new user management API routes
const authRouter = require('./api/auth');
const usersRouter = require('./api/users');
const rolesRouter = require('./api/roles');

// Import dashboard access management API routes
const dashboardAccessRouter = require('./api/dashboard-access');

// Import document management API routes
const documentsRouter = require('./api/documents');
const documentWorkflowsRouter = require('./api/document-workflows');

// Import data collection and processing API routes
const dataCollectionRouter = require('./api/data-collection');
const dataProcessingRouter = require('./api/data-processing');
const reportingRouter = require('./api/reporting');
const dataAnalyticsRouter = require('./api/data-analytics');

// Import data management API routes
const dataSynchronizationRouter = require('./api/data-synchronization');
const dataTransformationRouter = require('./api/data-transformation');
const masterDataManagementRouter = require('./api/master-data-management');

// Import enhanced predictive analytics and insights API routes
const { router: predictiveAnalyticsRouter } = require('./api/predictive-analytics-engine');
const { router: insightsGeneratorRouter } = require('./api/insights-generator');

// Import monitoring and diagnostic API routes
const { router: monitoringRouter } = require('./api/monitoring');
const { router: diagnosticRouter } = require('./api/diagnostic-tools');

// Import Enterprise API Framework
const EnterpriseAPI = require('./api/enterprise-api');

// Import monitoring initialization
const { initializeMonitoring } = require('./api/initialize-monitoring');

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Mount the API routes
// Authentication and user management routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);

// Dashboard access management routes
app.use('/api/dashboard-access', dashboardAccessRouter);

// Document management routes
app.use('/api/documents', documentsRouter);
app.use('/api/document-workflows', documentWorkflowsRouter);

// Existing application routes
app.use('/api/defender-activities', defenderActivitiesRoute);
app.use('/api/defender-entities', defenderEntitiesRouter);
app.use('/api/defender-alerts', defenderAlertsRouter);
app.use('/api/defender-files', defenderFilesRouter);
app.use('/api/defender-dataenrichment', defenderDataEnrichmentRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/escalations', escalationsRouter);

// Notification and communication routes
app.use('/api/notifications', notificationsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/communication', communicationRouter);
app.use('/api/realtime', realtimeNotificationsRouter);
app.use('/api/escalation-management', escalationManagementRouter);

// Data collection and processing routes
app.use('/api/data-collection', dataCollectionRouter);
app.use('/api/data-processing', dataProcessingRouter);
app.use('/api/reporting', reportingRouter);
app.use('/api/data-analytics', dataAnalyticsRouter);

// Data management routes
app.use('/api/data-synchronization', dataSynchronizationRouter);
app.use('/api/data-transformation', dataTransformationRouter);
app.use('/api/master-data-management', masterDataManagementRouter);

// Enhanced predictive analytics and insights routes
app.use('/api/predictive-analytics', predictiveAnalyticsRouter);
app.use('/api/insights', insightsGeneratorRouter);

// Monitoring and diagnostic routes
app.use('/api/monitoring', monitoringRouter);
app.use('/api/diagnostics', diagnosticRouter);

// Initialize and mount Enterprise API Framework
const enterpriseAPI = new EnterpriseAPI({
  version: '2.0.0',
  enableMetrics: true,
  enableCaching: true,
  enableWorkflows: true
});
app.use('/api/v2/enterprise', enterpriseAPI.getRouter());

// Health check
app.get('/api/health', (req, res) => res.json({ 
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  services: {
    database: 'connected',
    authentication: 'enabled',
    userManagement: 'enabled',
    dashboardAccess: 'enabled',
    documentManagement: 'enabled',
    workflowEngine: 'enabled',
    notifications: 'enabled',
    alerts: 'enabled',
    communication: 'enabled',
    realtimeNotifications: 'enabled',
    escalationManagement: 'enabled',
    dataCollection: 'enabled',
    dataProcessing: 'enabled',
    reporting: 'enabled',
    dataAnalytics: 'enabled',
    dataSynchronization: 'enabled',
    dataTransformation: 'enabled',
    masterDataManagement: 'enabled',
    predictiveAnalytics: 'enabled',
    insightsGenerator: 'enabled',
    enterpriseIntegration: 'enabled',
    apiManagement: 'enabled',
    workflowOrchestrator: 'enabled',
    monitoring: 'enabled',
    healthChecks: 'enabled',
    diagnostics: 'enabled',
    alerting: 'enabled'
  }
}));

app.listen(PORT, async () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  
  // Initialize monitoring and health checks
  try {
    await initializeMonitoring();
    console.log('✓ Monitoring and health check capabilities initialized');
  } catch (error) {
    console.error('✗ Failed to initialize monitoring:', error.message);
  }
});
