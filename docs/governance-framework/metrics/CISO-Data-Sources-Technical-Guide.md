# CISO Dashboard Data Sources - Technical Implementation Guide

## Overview

This technical guide provides detailed implementation specifications for all data sources feeding the CISO Executive Dashboard. It includes API endpoints, database schemas, data transformation logic, and integration patterns.

## Table of Contents

1. [Microsoft Graph API Integration](#microsoft-graph-api-integration)
2. [Defender for Cloud Apps Integration](#defender-for-cloud-apps-integration)
3. [Internal Database Schema](#internal-database-schema)
4. [Data Transformation Pipeline](#data-transformation-pipeline)
5. [Real-Time Data Processing](#real-time-data-processing)
6. [Data Quality and Validation](#data-quality-and-validation)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring and Alerting](#monitoring-and-alerting)

## Microsoft Graph API Integration

### Authentication Configuration
```javascript
// OAuth 2.0 Configuration
const graphConfig = {
  clientId: process.env.GRAPH_CLIENT_ID,
  clientSecret: process.env.GRAPH_CLIENT_SECRET,
  tenantId: process.env.GRAPH_TENANT_ID,
  scope: [
    'https://graph.microsoft.com/SecurityEvents.Read.All',
    'https://graph.microsoft.com/SecurityActions.Read.All',
    'https://graph.microsoft.com/SecurityThreatIntelligence.Read.All'
  ]
};
```

### Secure Score Data Retrieval
```javascript
// API Endpoint: /api/secure-scores/sync
async function fetchSecureScores() {
  const endpoint = `${GRAPH_API_BASE_URL}/v1.0/security/secureScores`;
  const response = await axios.get(endpoint, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    params: {
      '$top': 50,
      '$orderby': 'createdDateTime desc'
    }
  });
  
  return response.data.value;
}
```

### Data Mapping Schema
```sql
-- Secure Scores Table Structure
CREATE TABLE secure_scores (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(128) NOT NULL,
    created_date TIMESTAMP NOT NULL,
    current_score NUMERIC,
    max_score NUMERIC,
    active_user_count INTEGER,
    licensed_user_count INTEGER,
    raw_json JSONB,
    UNIQUE (tenant_id, created_date)
);

-- Control Scores Table Structure
CREATE TABLE secure_score_controls (
    id SERIAL PRIMARY KEY,
    secure_score_id INTEGER REFERENCES secure_scores(id),
    control_category VARCHAR(64),
    control_name VARCHAR(128),
    description TEXT,
    score NUMERIC,
    score_in_percentage NUMERIC,
    implementation_status TEXT,
    last_synced TIMESTAMP,
    extra_json JSONB
);
```

### Sync Schedule and Error Handling
```javascript
// Scheduled sync every hour
const syncSchedule = {
  frequency: '0 * * * *', // Every hour
  retryAttempts: 3,
  retryDelay: 300000, // 5 minutes
  timeout: 30000 // 30 seconds
};

async function scheduledSync() {
  try {
    const scores = await fetchSecureScores();
    await processAndStoreScores(scores);
    await updateDashboardCache();
  } catch (error) {
    await logSyncError(error);
    await notifyAdministrators(error);
  }
}
```

## Defender for Cloud Apps Integration

### API Configuration
```javascript
// Defender Cloud Apps API Setup
const defenderConfig = {
  baseUrl: process.env.DEFENDER_CLOUDAPPS_API_URL,
  token: process.env.DEFENDER_CLOUDAPPS_API_TOKEN,
  endpoints: {
    alerts: '/api/v1/alerts/',
    activities: '/api/v1/activities/',
    files: '/api/v1/files/'
  }
};
```

### Alert Data Processing
```javascript
// API Endpoint: /api/defender-alerts/sync
async function fetchDefenderAlerts() {
  const url = `${defenderConfig.baseUrl}${defenderConfig.endpoints.alerts}`;
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Token ${defenderConfig.token}`,
      'Content-Type': 'application/json'
    },
    params: {
      'limit': 100,
      'skip': 0,
      'filters': {
        'severity': ['High', 'Medium'],
        'status': ['Open', 'In Progress']
      }
    }
  });
  
  return Array.isArray(response.data) ? response.data : response.data.data || [];
}
```

### Database Schema for Alerts
```sql
-- Defender Alerts Table
CREATE TABLE defender_alerts (
    id SERIAL PRIMARY KEY,
    _id TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    severity TEXT,
    status TEXT,
    created_time TIMESTAMP,
    updated_time TIMESTAMP,
    raw_json JSONB,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- App Alert Metrics Table
CREATE TABLE app_alert_metrics (
    id SERIAL PRIMARY KEY,
    app_id TEXT UNIQUE NOT NULL,
    metrics JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Internal Database Schema

### Core Tables for CISO Metrics
```sql
-- Alerts Management
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    severity VARCHAR(20) CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    status VARCHAR(20) DEFAULT 'Open',
    category VARCHAR(50),
    source_system VARCHAR(100),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    assigned_to VARCHAR(255),
    escalation_level INTEGER DEFAULT 0,
    metadata JSONB
);

-- Risk Assessments
CREATE TABLE risk_assessments (
    id SERIAL PRIMARY KEY,
    assessment_id VARCHAR(50) UNIQUE NOT NULL,
    risk_category VARCHAR(100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('Critical', 'High', 'Medium', 'Low')),
    likelihood INTEGER CHECK (likelihood BETWEEN 1 AND 5),
    impact INTEGER CHECK (impact BETWEEN 1 AND 5),
    risk_score NUMERIC,
    mitigation_status VARCHAR(50),
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_review_date TIMESTAMP,
    owner VARCHAR(255),
    description TEXT,
    mitigation_plan TEXT
);

-- Compliance Frameworks
CREATE TABLE compliance_frameworks (
    id SERIAL PRIMARY KEY,
    framework_name VARCHAR(100) UNIQUE NOT NULL,
    version VARCHAR(20),
    description TEXT,
    total_controls INTEGER,
    implemented_controls INTEGER,
    compliance_percentage NUMERIC,
    last_assessment TIMESTAMP,
    next_assessment TIMESTAMP,
    status VARCHAR(50),
    certification_date TIMESTAMP,
    expiry_date TIMESTAMP
);

-- SLA Monitoring
CREATE TABLE sla_monitoring (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(50) NOT NULL,
    sla_type VARCHAR(50) CHECK (sla_type IN ('Acknowledgment', 'Response', 'Resolution')),
    threshold_minutes INTEGER NOT NULL,
    actual_minutes INTEGER,
    sla_met BOOLEAN,
    breach_date TIMESTAMP,
    monitored_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes for Performance
```sql
-- Performance Indexes
CREATE INDEX idx_alerts_severity_status ON alerts(severity, status);
CREATE INDEX idx_alerts_triggered_at ON alerts(triggered_at);
CREATE INDEX idx_secure_scores_created_date ON secure_scores(created_date);
CREATE INDEX idx_risk_assessments_level ON risk_assessments(risk_level);
CREATE INDEX idx_compliance_frameworks_percentage ON compliance_frameworks(compliance_percentage);
CREATE INDEX idx_sla_monitoring_sla_met ON sla_monitoring(sla_met);
```

## Data Transformation Pipeline

### Executive Summary Data Processing
```javascript
// API Endpoint: /api/secure-scores/executive-summary
async function generateExecutiveSummary(timeRange) {
  const currentScore = await getLatestSecureScore();
  const historicalData = await getHistoricalSecureScores(timeRange);
  const controlScores = await getControlScoresForScore(currentScore.id);
  const alertsData = await getAlertsStatistics(timeRange);
  const riskData = await getRiskLandscape(timeRange);
  const complianceData = await getComplianceOverview();
  
  return {
    securityPosture: calculateSecurityPosture(currentScore, historicalData),
    controlsStatus: calculateControlsStatus(controlScores),
    complianceOverview: calculateComplianceOverview(complianceData),
    riskLandscape: calculateRiskLandscape(riskData, alertsData),
    priorityActions: generatePriorityActions(controlScores),
    trends: calculateTrends(historicalData),
    executiveAlerts: generateExecutiveAlerts(currentScore, alertsData, riskData)
  };
}
```

### Metric Calculation Functions
```javascript
// Security Posture Calculation
function calculateSecurityPosture(currentScore, historicalData) {
  const percentage = Math.round((currentScore.current_score / currentScore.max_score) * 100);
  const previousScore = historicalData.length > 1 ? historicalData[1] : null;
  const scoreDelta = previousScore ? currentScore.current_score - previousScore.current_score : 0;
  const percentageDelta = previousScore ? 
    ((currentScore.current_score / currentScore.max_score) * 100) - 
    ((previousScore.current_score / previousScore.max_score) * 100) : 0;
  
  const trend = scoreDelta > 0 ? 'improving' : scoreDelta < 0 ? 'declining' : 'stable';
  
  // Calculate projected score based on top 5 recommendations
  const projectedImprovement = calculateProjectedImprovement(currentScore);
  
  return {
    currentScore: currentScore.current_score,
    maxScore: currentScore.max_score,
    percentage,
    scoreDelta,
    percentageDelta,
    trend,
    projectedScore: currentScore.current_score + projectedImprovement,
    projectedPercentage: Math.round(((currentScore.current_score + projectedImprovement) / currentScore.max_score) * 100)
  };
}

// Risk Landscape Calculation
function calculateRiskLandscape(riskData, alertsData) {
  const highRiskAreas = riskData.filter(risk => risk.risk_level === 'High' || risk.risk_level === 'Critical').length;
  const mediumRiskAreas = riskData.filter(risk => risk.risk_level === 'Medium').length;
  const criticalAlerts = alertsData.filter(alert => alert.severity === 'Critical' && alert.status === 'Open').length;
  
  // Calculate risk trend
  const riskTrend = calculateRiskTrend(riskData);
  
  return {
    totalRiskAreas: riskData.length,
    highRiskAreas,
    mediumRiskAreas,
    riskTrend,
    criticalAlerts
  };
}
```

## Real-Time Data Processing

### WebSocket Implementation for Live Updates
```javascript
// WebSocket server for real-time updates
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Broadcast updates to connected clients
function broadcastUpdate(updateType, data) {
  const message = JSON.stringify({
    type: updateType,
    data: data,
    timestamp: new Date().toISOString()
  });
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Alert processing with real-time updates
async function processNewAlert(alertData) {
  const alert = await createAlert(alertData);
  
  // Check if this is a critical alert requiring immediate attention
  if (alert.severity === 'Critical') {
    await triggerExecutiveNotification(alert);
    broadcastUpdate('critical_alert', alert);
  }
  
  // Update dashboard metrics
  const updatedMetrics = await recalculateMetrics();
  broadcastUpdate('metrics_update', updatedMetrics);
}
```

### Event-Driven Architecture
```javascript
// Event emitter for data pipeline
const EventEmitter = require('events');
const dataEmitter = new EventEmitter();

// Event handlers
dataEmitter.on('secure_score_updated', async (scoreData) => {
  await updateDashboardCache();
  await checkScoreThresholds(scoreData);
});

dataEmitter.on('alert_created', async (alertData) => {
  await processNewAlert(alertData);
  await updateSLAMonitoring(alertData);
});

dataEmitter.on('compliance_assessment_completed', async (complianceData) => {
  await updateComplianceMetrics(complianceData);
  await checkComplianceThresholds(complianceData);
});
```

## Data Quality and Validation

### Validation Rules
```javascript
// Data validation schemas
const secureScoreSchema = {
  tenant_id: { type: 'string', required: true },
  current_score: { type: 'number', min: 0 },
  max_score: { type: 'number', min: 1 },
  created_date: { type: 'date', required: true }
};

const alertSchema = {
  title: { type: 'string', required: true, maxLength: 200 },
  severity: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
  status: { type: 'string', enum: ['Open', 'In Progress', 'Resolved', 'Closed'] },
  triggered_at: { type: 'date', required: true }
};

// Validation function
function validateData(data, schema) {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (value !== undefined && value !== null) {
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
      }
      
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }
      
      if (rules.min && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must not exceed ${rules.maxLength} characters`);
      }
    }
  }
  
  return errors;
}
```

### Data Anomaly Detection
```javascript
// Statistical anomaly detection
function detectAnomalies(metricName, currentValue, historicalData) {
  const values = historicalData.map(d => d[metricName]).filter(v => v !== null);
  
  if (values.length < 10) return { isAnomaly: false, reason: 'Insufficient data' };
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  const zScore = Math.abs((currentValue - mean) / stdDev);
  const threshold = 2.5; // 2.5 standard deviations
  
  return {
    isAnomaly: zScore > threshold,
    zScore,
    mean,
    stdDev,
    reason: zScore > threshold ? `Value ${currentValue} is ${zScore.toFixed(2)} standard deviations from mean ${mean.toFixed(2)}` : null
  };
}
```

## Performance Optimization

### Caching Strategy
```javascript
// Redis caching for dashboard data
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache executive summary with 5-minute TTL
async function getCachedExecutiveSummary(timeRange) {
  const cacheKey = `executive_summary:${timeRange}`;
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const summary = await generateExecutiveSummary(timeRange);
  await client.setex(cacheKey, 300, JSON.stringify(summary)); // 5 minutes
  
  return summary;
}

// Cache invalidation on data updates
async function invalidateCache(pattern) {
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(keys);
  }
}
```

### Database Query Optimization
```sql
-- Optimized query for executive summary
WITH latest_score AS (
  SELECT * FROM secure_scores 
  WHERE tenant_id = $1 
  ORDER BY created_date DESC 
  LIMIT 1
),
historical_scores AS (
  SELECT * FROM secure_scores 
  WHERE tenant_id = $1 
    AND created_date >= NOW() - INTERVAL '%s days'
  ORDER BY created_date DESC
),
alert_stats AS (
  SELECT 
    severity,
    status,
    COUNT(*) as count
  FROM alerts 
  WHERE triggered_at >= NOW() - INTERVAL '%s days'
  GROUP BY severity, status
)
SELECT 
  ls.*,
  hs.scores as historical_data,
  ast.alert_statistics
FROM latest_score ls
CROSS JOIN (
  SELECT json_agg(historical_scores.*) as scores 
  FROM historical_scores
) hs
CROSS JOIN (
  SELECT json_agg(alert_stats.*) as alert_statistics 
  FROM alert_stats
) ast;
```

### Connection Pooling
```javascript
// PostgreSQL connection pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections
  min: 5,  // Minimum number of connections
  idle: 10000, // Close connections after 10 seconds of inactivity
  acquire: 60000, // Maximum time to wait for connection
  evict: 1000, // Check for idle connections every second
  handleDisconnects: true
};

const pool = new Pool(poolConfig);
```

## Monitoring and Alerting

### Health Check Endpoints
```javascript
// API health check endpoint
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {}
  };
  
  try {
    // Database connectivity
    await pool.query('SELECT 1');
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }
  
  try {
    // Microsoft Graph API connectivity
    await testGraphAPIConnection();
    health.services.graph_api = 'healthy';
  } catch (error) {
    health.services.graph_api = 'unhealthy';
    health.status = 'degraded';
  }
  
  try {
    // Defender API connectivity
    await testDefenderAPIConnection();
    health.services.defender_api = 'healthy';
  } catch (error) {
    health.services.defender_api = 'unhealthy';
    health.status = 'degraded';
  }
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

### Performance Monitoring
```javascript
// Performance metrics collection
const performanceMetrics = {
  apiResponseTimes: new Map(),
  databaseQueryTimes: new Map(),
  cacheHitRates: new Map(),
  errorRates: new Map()
};

// Middleware to track API performance
function trackPerformance(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    
    if (!performanceMetrics.apiResponseTimes.has(endpoint)) {
      performanceMetrics.apiResponseTimes.set(endpoint, []);
    }
    
    performanceMetrics.apiResponseTimes.get(endpoint).push(duration);
    
    // Keep only last 100 measurements
    const times = performanceMetrics.apiResponseTimes.get(endpoint);
    if (times.length > 100) {
      times.splice(0, times.length - 100);
    }
  });
  
  next();
}
```

### Error Tracking and Alerting
```javascript
// Error tracking and notification
async function handleError(error, context) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context,
    severity: determineSeverity(error)
  };
  
  // Log to database
  await pool.query(
    'INSERT INTO error_logs (timestamp, error_message, stack_trace, context, severity) VALUES ($1, $2, $3, $4, $5)',
    [errorLog.timestamp, errorLog.error, errorLog.stack, JSON.stringify(errorLog.context), errorLog.severity]
  );
  
  // Send alert for critical errors
  if (errorLog.severity === 'critical') {
    await sendCriticalErrorAlert(errorLog);
  }
}

function determineSeverity(error) {
  if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
    return 'critical';
  }
  if (error.message.includes('validation') || error.message.includes('invalid')) {
    return 'warning';
  }
  return 'info';
}
```

## Deployment and Configuration

### Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/governance_db

# Microsoft Graph API
GRAPH_CLIENT_ID=your_client_id
GRAPH_CLIENT_SECRET=your_client_secret
GRAPH_TENANT_ID=your_tenant_id
GRAPH_API_BASE_URL=https://graph.microsoft.com

# Defender for Cloud Apps
DEFENDER_CLOUDAPPS_API_URL=https://your-tenant.portal.cloudappsecurity.com
DEFENDER_CLOUDAPPS_API_TOKEN=your_api_token

# Redis Cache
REDIS_URL=redis://localhost:6379

# Monitoring
HEALTH_CHECK_INTERVAL=300000
PERFORMANCE_MONITORING_ENABLED=true
ERROR_NOTIFICATION_WEBHOOK=https://your-webhook-url
```

### Docker Configuration
```dockerfile
# Dockerfile for CISO Dashboard API
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
```

---

**Technical Guide Version:** 1.0  
**Last Updated:** January 2025  
**Compatibility:** Node.js 18+, PostgreSQL 13+, Redis 6+  
**Maintainer:** ICT Governance Framework Team