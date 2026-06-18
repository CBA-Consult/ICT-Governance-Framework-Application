// File: ict-governance-framework/server.js
// Express server for the ICT Governance Framework with user management

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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
const jitRouter = require('./api/jit-router');
const breakGlassRouter = require('./api/break-glass-router');
const reconciliationRouter = require('./api/reconciliation-router');
const usersRouter = require('./api/users');
const rolesRouter = require('./api/roles');
const userPermissionsRouter = require('./api/user-permissions');
const profileRouter = require('./api/profile');

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

// Import secure score API routes
const secureScoresApi = require('./api/secure-scores');

// Gate A: Live compliance posture & incident ingestion
const governanceRouter = require('./api/governance-router');
const riskRouter = require('./api/risk-router');

// Gate B G-B1: Multi-cloud asset register
const assetRouter = require('./api/asset-router');

// Break Glass / JIT analytics trend streams
const analyticsRouter = require('./api/analytics-router');

// Focus Area 5 Action 5.1: Defender CASB live polling
const { startCasbPolling, stopCasbPolling } = require('./services/casb-polling-worker');
const { CASB_CONFIG } = require('./config/casb-config');
const { startBreakGlassReconciler, stopBreakGlassReconciler } = require('./services/break-glass-reconciler');
const { startFairRiskScheduler, stopFairRiskScheduler } = require('./services/fair-risk-scheduler');

// Import Enterprise API Framework
const EnterpriseAPI = require('./api/enterprise-api');

// Import monitoring initialization
const { initializeMonitoring } = require('./api/initialize-monitoring');

// Import CASB App Catalog API
const casbAppCatalogRouter = require('./api/casb-app-catalog');

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

// Rate limiting — skip trusted automation webhooks (SecOps ingest, asset sync, CASB)
function isTrustedWebhookRequest(req) {
  const governanceSecret = process.env.GOVERNANCE_WEBHOOK_SECRET;
  if (governanceSecret) {
    const header = req.headers['x-governance-webhook-secret'];
    if (header && header === governanceSecret) return true;
  }

  const assetSecret = process.env.ASSET_SYNC_WEBHOOK_SECRET || governanceSecret;
  if (assetSecret) {
    const assetHeader = req.headers['x-asset-sync-secret'] || req.headers['x-governance-webhook-secret'];
    if (assetHeader && assetHeader === assetSecret) return true;
  }

  const casbSecret = process.env.CASB_INGEST_WEBHOOK_SECRET;
  if (casbSecret) {
    const casbHeader = req.headers['x-casb-ingest-secret'];
    if (casbHeader && casbHeader === casbSecret) return true;
  }

  return false;
}

const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'production' ? 100 : 1000),
  message: {
    error: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTrustedWebhookRequest(req)
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Mount the API routes
// Authentication and user management routes
app.use('/api/auth', authRouter);
app.use('/api/auth/jit', jitRouter);
app.use('/api/auth/jit', breakGlassRouter);
app.use('/api/auth/jit', reconciliationRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/user-permissions', userPermissionsRouter);
app.use('/api/profile', profileRouter);

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

// Secure score routes
app.use('/api/secure-scores', secureScoresApi);

// Governance compliance & incident routes (Gate A)
app.use('/api/governance', governanceRouter);
app.use('/api/governance/risk', riskRouter);

// Multi-cloud asset register (Gate B G-B1)
app.use('/api/assets', assetRouter);

// Governance analytics (Break Glass reconciliation trends)
app.use('/api/analytics', analyticsRouter);

// CASB App Catalog routes
app.use('/api/casb', casbAppCatalogRouter);

// Initialize and mount Enterprise API Framework
const enterpriseAPI = new EnterpriseAPI({
  version: '2.0.0',
  enableMetrics: true,
  enableCaching: true,
  enableWorkflows: true
});
app.use('/api/v2/enterprise', enterpriseAPI.getRouter());

// Health check
const fs = require('fs');
const connectorsPath = path.resolve(__dirname, '../config/enterprise-connectors.json');
let connectorConfig = {};
try {
  connectorConfig = JSON.parse(fs.readFileSync(connectorsPath, 'utf8'));
} catch (err) {
  console.error('Could not read enterprise-connectors.json:', err);
}

app.get('/api/health', (req, res) => {
  const services = {
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
    alerting: 'enabled',
    secureScore: 'enabled',
    casbAppCatalog: 'enabled'
  };
  // Check enabled connectors and add to health check
  Object.entries(connectorConfig).forEach(([key, value]) => {
    if (value.enabled === true) {
      services[key] = 'enabled';
      // Optionally, run health check logic for enabled connectors only
      // healthCheckConnector(key);
    } else {
      services[key] = 'skipped'; // Mark as skipped, not unhealthy
    }
  });
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services
  });
});

app.listen(PORT, async () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  // Initialize monitoring and health checks
  try {
    await initializeMonitoring();
    console.log('✓ Monitoring and health check capabilities initialized');
  } catch (error) {
    console.error('✗ Failed to initialize monitoring:', error.message);
  }
  // Run secure score sync once on server startup
  console.log('Performing initial secure score sync on server startup...');
  secureScoresApi.scheduledSync().catch(err => {
    if (err.code === 'GRAPH_NOT_CONFIGURED') {
      console.log('Skipping secure score sync: Microsoft Graph is not configured.');
      return;
    }
    console.error('Error during initial secure score sync on startup:', err);
  });

  if (CASB_CONFIG.shouldAutoStartWorker) {
    const casbPoll = startCasbPolling();
    if (casbPoll.started) {
      console.log('✓ Defender CASB shadow IT polling worker started');
    }
  } else if (CASB_CONFIG.isPollingEnabled) {
    console.log('CASB polling available — set ENABLE_BACKGROUND_WORKERS=true to auto-start, or POST /api/assets/casb-poll');
  }

  if (process.env.BREAK_GLASS_ALLOWED === 'true') {
    const reconciler = startBreakGlassReconciler();
    if (reconciler.started) {
      console.log('✓ Break Glass reconciliation worker started');
    }
  }

  if (process.env.ENABLE_FAIR_RISK_SWEEP === 'true') {
    const fairRisk = startFairRiskScheduler();
    if (fairRisk.started) {
      console.log('✓ FAIR risk quantification scheduler started');
    }
  }
});

// Scheduled Secure Score sync job
const ONE_HOUR_MS = 60 * 60 * 1000;
const secureScoresSync = require('./api/secure-scores');

async function runSecureScoreSync() {
  try {
    await secureScoresSync.scheduledSync(process.env.DATABASE_URL);
    console.log('Secure Score sync completed.');
  } catch (err) {
    if (err.code === 'GRAPH_NOT_CONFIGURED') {
      return;
    }
    console.error('Secure Score sync failed:', err);
  }
}

// Run once on server start
runSecureScoreSync();
// Repeat every hour
setInterval(runSecureScoreSync, ONE_HOUR_MS);

process.on('SIGINT', () => {
  stopCasbPolling();
  stopBreakGlassReconciler();
  stopFairRiskScheduler();
});

process.on('SIGTERM', () => {
  stopCasbPolling();
  stopBreakGlassReconciler();
  stopFairRiskScheduler();
});
