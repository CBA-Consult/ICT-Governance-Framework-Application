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

// Import document management API routes
const documentsRouter = require('./api/documents');
const documentWorkflowsRouter = require('./api/document-workflows');

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
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Mount the API routes
// Authentication and user management routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);

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

// Health check
app.get('/api/health', (req, res) => res.json({ 
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  services: {
    database: 'connected',
    authentication: 'enabled',
    userManagement: 'enabled',
    documentManagement: 'enabled',
    workflowEngine: 'enabled',
    notifications: 'enabled',
    alerts: 'enabled',
    communication: 'enabled',
    realtimeNotifications: 'enabled',
    escalationManagement: 'enabled'
  }
}));

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
