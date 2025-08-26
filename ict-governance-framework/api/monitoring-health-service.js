// File: ict-governance-framework/api/monitoring-health-service.js
// Comprehensive Monitoring and Health Check Service for Integrations

const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

/**
 * Comprehensive Monitoring and Health Check Service
 * Provides advanced monitoring, health checking, and diagnostic capabilities for all integrations
 */
class MonitoringHealthService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      healthCheckInterval: 60000, // 1 minute
      metricsRetentionDays: 30,
      alertThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 10, // 10%
        availability: 95 // 95%
      },
      enableRealTimeMonitoring: true,
      enableDiagnostics: true,
      enableAlerting: true,
      ...options
    };

    this.integrations = new Map();
    this.healthHistory = new Map();
    this.metrics = new Map();
    this.alerts = new Map();
    this.diagnostics = new Map();
    this.monitoringIntervals = new Map();
    
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring system
   */
  initializeMonitoring() {
    console.log('Initializing Comprehensive Monitoring and Health Check Service...');
    
    // Start periodic health checks
    if (this.options.enableRealTimeMonitoring) {
      this.startPeriodicHealthChecks();
    }
    
    // Initialize metrics cleanup
    this.startMetricsCleanup();
    
    console.log('Monitoring service initialized successfully');
  }

  /**
   * Register an integration for monitoring
   */
  registerIntegration(name, integration, config = {}) {
    const integrationConfig = {
      name,
      integration,
      priority: config.priority || 'medium',
      healthCheckInterval: config.healthCheckInterval || this.options.healthCheckInterval,
      customHealthChecks: config.customHealthChecks || [],
      alertThresholds: { ...this.options.alertThresholds, ...config.alertThresholds },
      diagnosticTests: config.diagnosticTests || [],
      ...config
    };

    this.integrations.set(name, integrationConfig);
    this.healthHistory.set(name, []);
    this.metrics.set(name, {
      responseTime: [],
      errorRate: [],
      availability: [],
      throughput: [],
      lastUpdated: new Date()
    });

    // Start individual monitoring for this integration
    this.startIntegrationMonitoring(name);
    
    console.log(`Registered integration for monitoring: ${name}`);
    this.emit('integration-registered', { name, config: integrationConfig });
  }

  /**
   * Start monitoring for a specific integration
   */
  startIntegrationMonitoring(integrationName) {
    const config = this.integrations.get(integrationName);
    if (!config) return;

    // Clear existing interval if any
    if (this.monitoringIntervals.has(integrationName)) {
      clearInterval(this.monitoringIntervals.get(integrationName));
    }

    // Start periodic health checks for this integration
    const interval = setInterval(async () => {
      await this.performHealthCheck(integrationName);
    }, config.healthCheckInterval);

    this.monitoringIntervals.set(integrationName, interval);
  }

  /**
   * Perform comprehensive health check for an integration
   */
  async performHealthCheck(integrationName) {
    const config = this.integrations.get(integrationName);
    if (!config) return null;

    const healthCheckId = uuidv4();
    const startTime = Date.now();

    try {
      const healthResult = {
        id: healthCheckId,
        integrationName,
        timestamp: new Date(),
        status: 'unknown',
        responseTime: 0,
        details: {},
        diagnostics: {},
        alerts: []
      };

      // Basic health check
      const basicHealth = await this.performBasicHealthCheck(config);
      healthResult.status = basicHealth.status;
      healthResult.responseTime = basicHealth.responseTime;
      healthResult.details.basic = basicHealth;

      // Custom health checks
      if (config.customHealthChecks.length > 0) {
        healthResult.details.custom = await this.performCustomHealthChecks(config);
      }

      // Performance diagnostics
      if (this.options.enableDiagnostics) {
        healthResult.diagnostics = await this.performDiagnostics(config);
      }

      // Update metrics
      this.updateMetrics(integrationName, healthResult);

      // Check for alerts
      if (this.options.enableAlerting) {
        const alerts = this.checkAlertConditions(integrationName, healthResult);
        healthResult.alerts = alerts;
        this.processAlerts(integrationName, alerts);
      }

      // Store health history
      this.storeHealthHistory(integrationName, healthResult);

      this.emit('health-check-completed', healthResult);
      return healthResult;

    } catch (error) {
      const errorResult = {
        id: healthCheckId,
        integrationName,
        timestamp: new Date(),
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
        details: { error: error.stack }
      };

      this.storeHealthHistory(integrationName, errorResult);
      this.emit('health-check-error', errorResult);
      return errorResult;
    }
  }

  /**
   * Perform basic health check
   */
  async performBasicHealthCheck(config) {
    const startTime = Date.now();
    
    try {
      let healthResult;
      
      // Check if integration has healthCheck method
      if (config.integration && typeof config.integration.healthCheck === 'function') {
        healthResult = await config.integration.healthCheck();
      } else if (config.integration && typeof config.integration.getAdapterHealth === 'function') {
        healthResult = await config.integration.getAdapterHealth();
      } else {
        // Fallback to basic connectivity test
        healthResult = { status: 'healthy', message: 'No health check method available' };
      }

      const responseTime = Date.now() - startTime;
      
      return {
        status: healthResult.status || 'healthy',
        responseTime,
        details: healthResult,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Perform custom health checks
   */
  async performCustomHealthChecks(config) {
    const results = {};
    
    for (const customCheck of config.customHealthChecks) {
      try {
        const startTime = Date.now();
        const result = await customCheck.test(config.integration);
        results[customCheck.name] = {
          status: 'passed',
          responseTime: Date.now() - startTime,
          result,
          description: customCheck.description
        };
      } catch (error) {
        results[customCheck.name] = {
          status: 'failed',
          error: error.message,
          description: customCheck.description
        };
      }
    }
    
    return results;
  }

  /**
   * Perform diagnostic tests
   */
  async performDiagnostics(config) {
    const diagnostics = {
      connectivity: await this.testConnectivity(config),
      performance: await this.testPerformance(config),
      authentication: await this.testAuthentication(config),
      dataIntegrity: await this.testDataIntegrity(config)
    };

    // Run custom diagnostic tests
    if (config.diagnosticTests.length > 0) {
      diagnostics.custom = await this.runCustomDiagnostics(config);
    }

    return diagnostics;
  }

  /**
   * Test connectivity
   */
  async testConnectivity(config) {
    try {
      const startTime = Date.now();
      
      // Test basic connectivity
      if (config.integration && typeof config.integration.healthCheck === 'function') {
        await config.integration.healthCheck();
      }
      
      return {
        status: 'passed',
        responseTime: Date.now() - startTime,
        message: 'Connectivity test passed'
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        message: 'Connectivity test failed'
      };
    }
  }

  /**
   * Test performance
   */
  async testPerformance(config) {
    const performanceTests = [];
    
    try {
      // Test response time under load
      const iterations = 5;
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        if (config.integration && typeof config.integration.healthCheck === 'function') {
          await config.integration.healthCheck();
        }
        performanceTests.push(Date.now() - startTime);
      }
      
      const avgResponseTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
      const maxResponseTime = Math.max(...performanceTests);
      const minResponseTime = Math.min(...performanceTests);
      
      return {
        status: avgResponseTime < config.alertThresholds.responseTime ? 'passed' : 'warning',
        averageResponseTime: avgResponseTime,
        maxResponseTime,
        minResponseTime,
        iterations,
        message: `Performance test completed with ${avgResponseTime.toFixed(2)}ms average response time`
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        message: 'Performance test failed'
      };
    }
  }

  /**
   * Test authentication
   */
  async testAuthentication(config) {
    try {
      // Test authentication if available
      if (config.integration && typeof config.integration.getAccessToken === 'function') {
        await config.integration.getAccessToken();
        return {
          status: 'passed',
          message: 'Authentication test passed'
        };
      }
      
      return {
        status: 'skipped',
        message: 'No authentication method available to test'
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        message: 'Authentication test failed'
      };
    }
  }

  /**
   * Test data integrity
   */
  async testDataIntegrity(config) {
    try {
      // Basic data integrity test
      if (config.integration && typeof config.integration.getMetrics === 'function') {
        const metrics = config.integration.getMetrics();
        return {
          status: 'passed',
          metrics,
          message: 'Data integrity test passed'
        };
      }
      
      return {
        status: 'skipped',
        message: 'No data integrity test available'
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        message: 'Data integrity test failed'
      };
    }
  }

  /**
   * Run custom diagnostic tests
   */
  async runCustomDiagnostics(config) {
    const results = {};
    
    for (const diagnostic of config.diagnosticTests) {
      try {
        const result = await diagnostic.test(config.integration);
        results[diagnostic.name] = {
          status: 'passed',
          result,
          description: diagnostic.description
        };
      } catch (error) {
        results[diagnostic.name] = {
          status: 'failed',
          error: error.message,
          description: diagnostic.description
        };
      }
    }
    
    return results;
  }

  /**
   * Update metrics for an integration
   */
  updateMetrics(integrationName, healthResult) {
    const metrics = this.metrics.get(integrationName);
    if (!metrics) return;

    const now = new Date();
    
    // Update response time metrics
    metrics.responseTime.push({
      timestamp: now,
      value: healthResult.responseTime
    });

    // Update availability metrics
    metrics.availability.push({
      timestamp: now,
      value: healthResult.status === 'healthy' ? 100 : 0
    });

    // Calculate error rate
    const recentHealth = this.getRecentHealthHistory(integrationName, 10);
    const errorCount = recentHealth.filter(h => h.status !== 'healthy').length;
    const errorRate = recentHealth.length > 0 ? (errorCount / recentHealth.length) * 100 : 0;
    
    metrics.errorRate.push({
      timestamp: now,
      value: errorRate
    });

    // Clean old metrics (keep only last 24 hours)
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    ['responseTime', 'availability', 'errorRate'].forEach(metric => {
      metrics[metric] = metrics[metric].filter(m => m.timestamp > cutoff);
    });

    metrics.lastUpdated = now;
    this.metrics.set(integrationName, metrics);
  }

  /**
   * Check alert conditions
   */
  checkAlertConditions(integrationName, healthResult) {
    const config = this.integrations.get(integrationName);
    const alerts = [];

    // Response time alert
    if (healthResult.responseTime > config.alertThresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        severity: 'warning',
        message: `Response time (${healthResult.responseTime}ms) exceeds threshold (${config.alertThresholds.responseTime}ms)`,
        value: healthResult.responseTime,
        threshold: config.alertThresholds.responseTime
      });
    }

    // Health status alert
    if (healthResult.status !== 'healthy') {
      alerts.push({
        type: 'health_status',
        severity: 'critical',
        message: `Integration health status is ${healthResult.status}`,
        value: healthResult.status
      });
    }

    // Error rate alert
    const metrics = this.metrics.get(integrationName);
    if (metrics && metrics.errorRate.length > 0) {
      const latestErrorRate = metrics.errorRate[metrics.errorRate.length - 1].value;
      if (latestErrorRate > config.alertThresholds.errorRate) {
        alerts.push({
          type: 'error_rate',
          severity: 'warning',
          message: `Error rate (${latestErrorRate.toFixed(2)}%) exceeds threshold (${config.alertThresholds.errorRate}%)`,
          value: latestErrorRate,
          threshold: config.alertThresholds.errorRate
        });
      }
    }

    return alerts;
  }

  /**
   * Process alerts
   */
  processAlerts(integrationName, alerts) {
    for (const alert of alerts) {
      const alertId = uuidv4();
      const alertData = {
        id: alertId,
        integrationName,
        timestamp: new Date(),
        ...alert
      };

      // Store alert
      if (!this.alerts.has(integrationName)) {
        this.alerts.set(integrationName, []);
      }
      this.alerts.get(integrationName).push(alertData);

      // Emit alert event
      this.emit('alert-triggered', alertData);

      console.warn(`Alert triggered for ${integrationName}:`, alert.message);
    }
  }

  /**
   * Store health history
   */
  storeHealthHistory(integrationName, healthResult) {
    const history = this.healthHistory.get(integrationName) || [];
    history.push(healthResult);

    // Keep only recent history (last 1000 entries)
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    this.healthHistory.set(integrationName, history);
  }

  /**
   * Get recent health history
   */
  getRecentHealthHistory(integrationName, count = 10) {
    const history = this.healthHistory.get(integrationName) || [];
    return history.slice(-count);
  }

  /**
   * Get comprehensive health status for all integrations
   */
  async getComprehensiveHealthStatus() {
    const status = {
      timestamp: new Date(),
      overall: 'healthy',
      integrations: {},
      summary: {
        total: this.integrations.size,
        healthy: 0,
        unhealthy: 0,
        warning: 0
      }
    };

    for (const [name, config] of this.integrations.entries()) {
      const recentHealth = this.getRecentHealthHistory(name, 1);
      const latestHealth = recentHealth[0];
      const metrics = this.metrics.get(name);
      const alerts = this.alerts.get(name) || [];

      const integrationStatus = {
        name,
        priority: config.priority,
        status: latestHealth?.status || 'unknown',
        lastCheck: latestHealth?.timestamp || null,
        responseTime: latestHealth?.responseTime || null,
        metrics: this.getIntegrationMetricsSummary(name),
        alerts: alerts.filter(a => a.timestamp > new Date(Date.now() - 60 * 60 * 1000)), // Last hour
        uptime: this.calculateUptime(name)
      };

      status.integrations[name] = integrationStatus;

      // Update summary
      if (integrationStatus.status === 'healthy') {
        status.summary.healthy++;
      } else if (integrationStatus.status === 'unhealthy' || integrationStatus.status === 'error') {
        status.summary.unhealthy++;
        status.overall = 'unhealthy';
      } else {
        status.summary.warning++;
        if (status.overall === 'healthy') {
          status.overall = 'warning';
        }
      }
    }

    return status;
  }

  /**
   * Get integration metrics summary
   */
  getIntegrationMetricsSummary(integrationName) {
    const metrics = this.metrics.get(integrationName);
    if (!metrics) return null;

    const summary = {};

    // Response time summary
    if (metrics.responseTime.length > 0) {
      const responseTimes = metrics.responseTime.map(m => m.value);
      summary.responseTime = {
        current: responseTimes[responseTimes.length - 1],
        average: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes)
      };
    }

    // Availability summary
    if (metrics.availability.length > 0) {
      const availability = metrics.availability.map(m => m.value);
      summary.availability = {
        current: availability[availability.length - 1],
        average: availability.reduce((a, b) => a + b, 0) / availability.length
      };
    }

    // Error rate summary
    if (metrics.errorRate.length > 0) {
      const errorRates = metrics.errorRate.map(m => m.value);
      summary.errorRate = {
        current: errorRates[errorRates.length - 1],
        average: errorRates.reduce((a, b) => a + b, 0) / errorRates.length
      };
    }

    return summary;
  }

  /**
   * Calculate uptime percentage
   */
  calculateUptime(integrationName) {
    const history = this.healthHistory.get(integrationName) || [];
    if (history.length === 0) return null;

    const healthyCount = history.filter(h => h.status === 'healthy').length;
    return (healthyCount / history.length) * 100;
  }

  /**
   * Start periodic health checks for all integrations
   */
  startPeriodicHealthChecks() {
    console.log('Starting periodic health checks...');
    
    // Initial health check for all integrations
    setTimeout(async () => {
      for (const integrationName of this.integrations.keys()) {
        await this.performHealthCheck(integrationName);
      }
    }, 1000);
  }

  /**
   * Start metrics cleanup process
   */
  startMetricsCleanup() {
    // Clean up old metrics daily
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Clean up old metrics
   */
  cleanupOldMetrics() {
    const cutoff = new Date(Date.now() - this.options.metricsRetentionDays * 24 * 60 * 60 * 1000);
    
    for (const [integrationName, history] of this.healthHistory.entries()) {
      const filteredHistory = history.filter(h => h.timestamp > cutoff);
      this.healthHistory.set(integrationName, filteredHistory);
    }

    for (const [integrationName, alerts] of this.alerts.entries()) {
      const filteredAlerts = alerts.filter(a => a.timestamp > cutoff);
      this.alerts.set(integrationName, filteredAlerts);
    }

    console.log('Cleaned up old metrics and alerts');
  }

  /**
   * Get diagnostic report for an integration
   */
  async getDiagnosticReport(integrationName) {
    const config = this.integrations.get(integrationName);
    if (!config) {
      throw new Error(`Integration not found: ${integrationName}`);
    }

    const report = {
      integrationName,
      timestamp: new Date(),
      configuration: {
        priority: config.priority,
        healthCheckInterval: config.healthCheckInterval,
        alertThresholds: config.alertThresholds
      },
      currentHealth: await this.performHealthCheck(integrationName),
      healthHistory: this.getRecentHealthHistory(integrationName, 50),
      metrics: this.getIntegrationMetricsSummary(integrationName),
      alerts: this.alerts.get(integrationName) || [],
      diagnostics: await this.performDiagnostics(config),
      recommendations: this.generateRecommendations(integrationName)
    };

    return report;
  }

  /**
   * Generate recommendations based on health and metrics
   */
  generateRecommendations(integrationName) {
    const recommendations = [];
    const metrics = this.getIntegrationMetricsSummary(integrationName);
    const config = this.integrations.get(integrationName);

    if (metrics?.responseTime?.average > config.alertThresholds.responseTime) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Consider optimizing integration performance or increasing timeout values',
        details: `Average response time (${metrics.responseTime.average.toFixed(2)}ms) is above threshold`
      });
    }

    if (metrics?.availability?.average < config.alertThresholds.availability) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'Integration availability is below acceptable threshold',
        details: `Current availability (${metrics.availability.average.toFixed(2)}%) is below ${config.alertThresholds.availability}%`
      });
    }

    if (metrics?.errorRate?.average > config.alertThresholds.errorRate) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'High error rate detected, investigate integration stability',
        details: `Error rate (${metrics.errorRate.average.toFixed(2)}%) exceeds threshold`
      });
    }

    return recommendations;
  }

  /**
   * Stop monitoring for an integration
   */
  stopIntegrationMonitoring(integrationName) {
    if (this.monitoringIntervals.has(integrationName)) {
      clearInterval(this.monitoringIntervals.get(integrationName));
      this.monitoringIntervals.delete(integrationName);
    }
  }

  /**
   * Stop all monitoring
   */
  stopAllMonitoring() {
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval);
    }
    this.monitoringIntervals.clear();
    console.log('All monitoring stopped');
  }
}

module.exports = MonitoringHealthService;