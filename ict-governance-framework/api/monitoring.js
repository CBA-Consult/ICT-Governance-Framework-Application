// File: ict-governance-framework/api/monitoring.js
// API endpoints for monitoring and health check capabilities

const express = require('express');
const { Pool } = require('pg');
const MonitoringHealthService = require('./monitoring-health-service');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize monitoring service
const monitoringService = new MonitoringHealthService({
  healthCheckInterval: 60000, // 1 minute
  metricsRetentionDays: 30,
  alertThresholds: {
    responseTime: 5000, // 5 seconds
    errorRate: 10, // 10%
    availability: 95 // 95%
  },
  enableRealTimeMonitoring: true,
  enableDiagnostics: true,
  enableAlerting: true
});

// Event handlers for monitoring service
monitoringService.on('health-check-completed', async (result) => {
  // Store health check result in database
  try {
    await pool.query(
      `INSERT INTO integration_health_checks 
       (integration_name, check_id, status, response_time, details, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        result.integrationName,
        result.id,
        result.status,
        result.responseTime,
        JSON.stringify(result),
        result.timestamp
      ]
    );
  } catch (error) {
    console.error('Failed to store health check result:', error);
  }
});

monitoringService.on('alert-triggered', async (alert) => {
  // Store alert in database
  try {
    await pool.query(
      `INSERT INTO integration_alerts 
       (integration_name, alert_id, type, severity, message, details, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        alert.integrationName,
        alert.id,
        alert.type,
        alert.severity,
        alert.message,
        JSON.stringify(alert),
        alert.timestamp
      ]
    );
  } catch (error) {
    console.error('Failed to store alert:', error);
  }
});

/**
 * @route GET /api/monitoring/health
 * @desc Get comprehensive health status for all integrations
 * @access Private
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await monitoringService.getComprehensiveHealthStatus();
    
    res.json({
      success: true,
      data: healthStatus,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      }
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Failed to retrieve health status',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /api/monitoring/health/:integrationName
 * @desc Get health status for a specific integration
 * @access Private
 */
router.get('/health/:integrationName', async (req, res) => {
  try {
    const { integrationName } = req.params;
    const healthResult = await monitoringService.performHealthCheck(integrationName);
    
    if (!healthResult) {
      return res.status(404).json({
        error: {
          code: 'INTEGRATION_NOT_FOUND',
          message: `Integration not found: ${integrationName}`
        }
      });
    }

    res.json({
      success: true,
      data: healthResult,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      }
    });
  } catch (error) {
    console.error('Error getting integration health:', error);
    res.status(500).json({
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Failed to retrieve integration health',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /api/monitoring/metrics
 * @desc Get metrics for all integrations
 * @access Private
 */
router.get('/metrics', async (req, res) => {
  try {
    const { timeRange = '24h', integrationName } = req.query;
    
    let query = `
      SELECT 
        integration_name,
        status,
        response_time,
        timestamp,
        details
      FROM integration_health_checks 
      WHERE timestamp > NOW() - INTERVAL '${timeRange === '24h' ? '24 hours' : timeRange}'
    `;
    
    const params = [];
    if (integrationName) {
      query += ' AND integration_name = $1';
      params.push(integrationName);
    }
    
    query += ' ORDER BY timestamp DESC';
    
    const result = await pool.query(query, params);
    
    // Process metrics data
    const metrics = processMetricsData(result.rows);
    
    res.json({
      success: true,
      data: metrics,
      metadata: {
        timestamp: new Date().toISOString(),
        timeRange,
        totalRecords: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      error: {
        code: 'METRICS_ERROR',
        message: 'Failed to retrieve metrics',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /api/monitoring/alerts
 * @desc Get alerts for integrations
 * @access Private
 */
router.get('/alerts', async (req, res) => {
  try {
    const { 
      severity, 
      integrationName, 
      status = 'active',
      limit = 100,
      offset = 0 
    } = req.query;
    
    let query = `
      SELECT 
        integration_name,
        alert_id,
        type,
        severity,
        message,
        details,
        timestamp,
        acknowledged_at,
        resolved_at
      FROM integration_alerts 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (severity) {
      paramCount++;
      query += ` AND severity = $${paramCount}`;
      params.push(severity);
    }
    
    if (integrationName) {
      paramCount++;
      query += ` AND integration_name = $${paramCount}`;
      params.push(integrationName);
    }
    
    if (status === 'active') {
      query += ' AND resolved_at IS NULL';
    } else if (status === 'resolved') {
      query += ' AND resolved_at IS NOT NULL';
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      metadata: {
        timestamp: new Date().toISOString(),
        totalRecords: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      error: {
        code: 'ALERTS_ERROR',
        message: 'Failed to retrieve alerts',
        details: error.message
      }
    });
  }
});

/**
 * @route POST /api/monitoring/alerts/:alertId/acknowledge
 * @desc Acknowledge an alert
 * @access Private
 */
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { acknowledgedBy, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE integration_alerts 
       SET acknowledged_at = NOW(), acknowledged_by = $1, acknowledgment_notes = $2
       WHERE alert_id = $3
       RETURNING *`,
      [acknowledgedBy, notes, alertId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'ALERT_NOT_FOUND',
          message: `Alert not found: ${alertId}`
        }
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      error: {
        code: 'ACKNOWLEDGE_ERROR',
        message: 'Failed to acknowledge alert',
        details: error.message
      }
    });
  }
});

/**
 * @route POST /api/monitoring/alerts/:alertId/resolve
 * @desc Resolve an alert
 * @access Private
 */
router.post('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolvedBy, resolution, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE integration_alerts 
       SET resolved_at = NOW(), resolved_by = $1, resolution = $2, resolution_notes = $3
       WHERE alert_id = $4
       RETURNING *`,
      [resolvedBy, resolution, notes, alertId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'ALERT_NOT_FOUND',
          message: `Alert not found: ${alertId}`
        }
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Alert resolved successfully'
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      error: {
        code: 'RESOLVE_ERROR',
        message: 'Failed to resolve alert',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /api/monitoring/diagnostics/:integrationName
 * @desc Get diagnostic report for an integration
 * @access Private
 */
router.get('/diagnostics/:integrationName', async (req, res) => {
  try {
    const { integrationName } = req.params;
    const diagnosticReport = await monitoringService.getDiagnosticReport(integrationName);
    
    res.json({
      success: true,
      data: diagnosticReport,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      }
    });
  } catch (error) {
    console.error('Error getting diagnostic report:', error);
    res.status(500).json({
      error: {
        code: 'DIAGNOSTIC_ERROR',
        message: 'Failed to generate diagnostic report',
        details: error.message
      }
    });
  }
});

/**
 * @route POST /api/monitoring/diagnostics/:integrationName/run
 * @desc Run diagnostic tests for an integration
 * @access Private
 */
router.post('/diagnostics/:integrationName/run', async (req, res) => {
  try {
    const { integrationName } = req.params;
    const { tests = ['all'] } = req.body;
    
    const config = monitoringService.integrations.get(integrationName);
    if (!config) {
      return res.status(404).json({
        error: {
          code: 'INTEGRATION_NOT_FOUND',
          message: `Integration not found: ${integrationName}`
        }
      });
    }
    
    const diagnostics = await monitoringService.performDiagnostics(config);
    
    res.json({
      success: true,
      data: {
        integrationName,
        timestamp: new Date(),
        diagnostics
      },
      metadata: {
        timestamp: new Date().toISOString(),
        testsRequested: tests
      }
    });
  } catch (error) {
    console.error('Error running diagnostics:', error);
    res.status(500).json({
      error: {
        code: 'DIAGNOSTIC_RUN_ERROR',
        message: 'Failed to run diagnostic tests',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /api/monitoring/dashboard
 * @desc Get monitoring dashboard data
 * @access Private
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Get comprehensive health status
    const healthStatus = await monitoringService.getComprehensiveHealthStatus();
    
    // Get recent alerts
    const alertsResult = await pool.query(
      `SELECT integration_name, type, severity, COUNT(*) as count
       FROM integration_alerts 
       WHERE timestamp > NOW() - INTERVAL '${timeRange === '24h' ? '24 hours' : timeRange}'
       AND resolved_at IS NULL
       GROUP BY integration_name, type, severity
       ORDER BY severity DESC, count DESC`
    );
    
    // Get performance trends
    const trendsResult = await pool.query(
      `SELECT 
         integration_name,
         DATE_TRUNC('hour', timestamp) as hour,
         AVG(response_time) as avg_response_time,
         COUNT(CASE WHEN status = 'healthy' THEN 1 END) * 100.0 / COUNT(*) as availability
       FROM integration_health_checks 
       WHERE timestamp > NOW() - INTERVAL '${timeRange === '24h' ? '24 hours' : timeRange}'
       GROUP BY integration_name, hour
       ORDER BY hour DESC`
    );
    
    const dashboard = {
      overview: healthStatus,
      alerts: {
        summary: alertsResult.rows,
        total: alertsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
      },
      trends: processTrendsData(trendsResult.rows),
      timestamp: new Date()
    };
    
    res.json({
      success: true,
      data: dashboard,
      metadata: {
        timestamp: new Date().toISOString(),
        timeRange
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      error: {
        code: 'DASHBOARD_ERROR',
        message: 'Failed to retrieve dashboard data',
        details: error.message
      }
    });
  }
});

/**
 * @route POST /api/monitoring/integrations/:integrationName/register
 * @desc Register an integration for monitoring
 * @access Private
 */
router.post('/integrations/:integrationName/register', async (req, res) => {
  try {
    const { integrationName } = req.params;
    const { 
      integration, 
      priority = 'medium',
      healthCheckInterval = 60000,
      alertThresholds = {},
      customHealthChecks = [],
      diagnosticTests = []
    } = req.body;
    
    // Register integration with monitoring service
    monitoringService.registerIntegration(integrationName, integration, {
      priority,
      healthCheckInterval,
      alertThresholds,
      customHealthChecks,
      diagnosticTests
    });
    
    res.json({
      success: true,
      message: `Integration ${integrationName} registered for monitoring`,
      data: {
        integrationName,
        priority,
        healthCheckInterval,
        alertThresholds
      }
    });
  } catch (error) {
    console.error('Error registering integration:', error);
    res.status(500).json({
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Failed to register integration for monitoring',
        details: error.message
      }
    });
  }
});

/**
 * Process metrics data for response
 */
function processMetricsData(rows) {
  const metrics = {};
  
  rows.forEach(row => {
    if (!metrics[row.integration_name]) {
      metrics[row.integration_name] = {
        responseTime: [],
        availability: [],
        errorRate: []
      };
    }
    
    metrics[row.integration_name].responseTime.push({
      timestamp: row.timestamp,
      value: row.response_time
    });
    
    metrics[row.integration_name].availability.push({
      timestamp: row.timestamp,
      value: row.status === 'healthy' ? 100 : 0
    });
  });
  
  // Calculate error rates
  Object.keys(metrics).forEach(integrationName => {
    const data = metrics[integrationName];
    const totalChecks = data.availability.length;
    const healthyChecks = data.availability.filter(a => a.value === 100).length;
    const errorRate = totalChecks > 0 ? ((totalChecks - healthyChecks) / totalChecks) * 100 : 0;
    
    data.errorRate = [{
      timestamp: new Date(),
      value: errorRate
    }];
  });
  
  return metrics;
}

/**
 * Process trends data for dashboard
 */
function processTrendsData(rows) {
  const trends = {};
  
  rows.forEach(row => {
    if (!trends[row.integration_name]) {
      trends[row.integration_name] = {
        responseTime: [],
        availability: []
      };
    }
    
    trends[row.integration_name].responseTime.push({
      timestamp: row.hour,
      value: parseFloat(row.avg_response_time)
    });
    
    trends[row.integration_name].availability.push({
      timestamp: row.hour,
      value: parseFloat(row.availability)
    });
  });
  
  return trends;
}

module.exports = { router, monitoringService };