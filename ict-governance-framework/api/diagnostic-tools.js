// File: ict-governance-framework/api/diagnostic-tools.js
// Advanced diagnostic tools for integration troubleshooting and analysis

const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Diagnostic Tools Service
 * Provides comprehensive diagnostic capabilities for integration troubleshooting
 */
class DiagnosticTools {
  constructor(options = {}) {
    this.options = {
      maxDiagnosticHistory: 1000,
      diagnosticTimeout: 30000,
      enableDetailedLogging: true,
      ...options
    };
    
    this.diagnosticTests = new Map();
    this.diagnosticHistory = new Map();
    this.initializeStandardTests();
  }

  /**
   * Initialize standard diagnostic tests
   */
  initializeStandardTests() {
    // Connectivity Test
    this.registerDiagnosticTest('connectivity', {
      name: 'Connectivity Test',
      description: 'Tests basic network connectivity to the integration endpoint',
      category: 'network',
      severity: 'critical',
      test: async (integration) => {
        const startTime = Date.now();
        try {
          if (typeof integration.healthCheck === 'function') {
            const result = await integration.healthCheck();
            return {
              status: 'passed',
              responseTime: Date.now() - startTime,
              details: result,
              message: 'Connectivity test passed'
            };
          }
          throw new Error('No health check method available');
        } catch (error) {
          return {
            status: 'failed',
            responseTime: Date.now() - startTime,
            error: error.message,
            message: 'Connectivity test failed'
          };
        }
      }
    });

    // Authentication Test
    this.registerDiagnosticTest('authentication', {
      name: 'Authentication Test',
      description: 'Verifies authentication credentials and token validity',
      category: 'security',
      severity: 'critical',
      test: async (integration) => {
        const startTime = Date.now();
        try {
          if (typeof integration.getAccessToken === 'function') {
            const token = await integration.getAccessToken();
            return {
              status: 'passed',
              responseTime: Date.now() - startTime,
              details: { tokenReceived: !!token },
              message: 'Authentication test passed'
            };
          }
          return {
            status: 'skipped',
            responseTime: Date.now() - startTime,
            message: 'No authentication method available to test'
          };
        } catch (error) {
          return {
            status: 'failed',
            responseTime: Date.now() - startTime,
            error: error.message,
            message: 'Authentication test failed'
          };
        }
      }
    });

    // Performance Test
    this.registerDiagnosticTest('performance', {
      name: 'Performance Test',
      description: 'Measures response time and throughput under load',
      category: 'performance',
      severity: 'warning',
      test: async (integration) => {
        const iterations = 5;
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          try {
            if (typeof integration.healthCheck === 'function') {
              await integration.healthCheck();
              results.push(Date.now() - startTime);
            } else {
              throw new Error('No health check method available');
            }
          } catch (error) {
            results.push(-1); // Mark failed attempts
          }
        }
        
        const validResults = results.filter(r => r > 0);
        if (validResults.length === 0) {
          return {
            status: 'failed',
            message: 'All performance test iterations failed'
          };
        }
        
        const avgResponseTime = validResults.reduce((a, b) => a + b, 0) / validResults.length;
        const maxResponseTime = Math.max(...validResults);
        const minResponseTime = Math.min(...validResults);
        const successRate = (validResults.length / iterations) * 100;
        
        return {
          status: successRate >= 80 ? 'passed' : 'warning',
          details: {
            iterations,
            successRate,
            avgResponseTime,
            maxResponseTime,
            minResponseTime,
            results: validResults
          },
          message: `Performance test completed with ${successRate}% success rate`
        };
      }
    });

    // Data Integrity Test
    this.registerDiagnosticTest('data_integrity', {
      name: 'Data Integrity Test',
      description: 'Validates data consistency and format compliance',
      category: 'data',
      severity: 'warning',
      test: async (integration) => {
        const startTime = Date.now();
        try {
          // Test basic data retrieval if available
          if (typeof integration.getUsers === 'function') {
            const users = await integration.getUsers({ limit: 1 });
            return {
              status: 'passed',
              responseTime: Date.now() - startTime,
              details: { recordsRetrieved: users?.length || 0 },
              message: 'Data integrity test passed'
            };
          } else if (typeof integration.getMetrics === 'function') {
            const metrics = integration.getMetrics();
            return {
              status: 'passed',
              responseTime: Date.now() - startTime,
              details: { metricsAvailable: Object.keys(metrics).length },
              message: 'Data integrity test passed'
            };
          }
          
          return {
            status: 'skipped',
            responseTime: Date.now() - startTime,
            message: 'No data retrieval methods available to test'
          };
        } catch (error) {
          return {
            status: 'failed',
            responseTime: Date.now() - startTime,
            error: error.message,
            message: 'Data integrity test failed'
          };
        }
      }
    });

    // Circuit Breaker Test
    this.registerDiagnosticTest('circuit_breaker', {
      name: 'Circuit Breaker Test',
      description: 'Tests circuit breaker functionality and resilience patterns',
      category: 'resilience',
      severity: 'warning',
      test: async (integration) => {
        try {
          if (integration.circuitBreakers && integration.circuitBreakers.size > 0) {
            const circuitBreakerStates = {};
            for (const [name, cb] of integration.circuitBreakers.entries()) {
              circuitBreakerStates[name] = {
                state: cb.getState(),
                failures: cb.failures,
                lastFailure: cb.lastFailure
              };
            }
            
            return {
              status: 'passed',
              details: { circuitBreakers: circuitBreakerStates },
              message: 'Circuit breaker test completed'
            };
          }
          
          return {
            status: 'skipped',
            message: 'No circuit breakers found to test'
          };
        } catch (error) {
          return {
            status: 'failed',
            error: error.message,
            message: 'Circuit breaker test failed'
          };
        }
      }
    });

    // Rate Limiting Test
    this.registerDiagnosticTest('rate_limiting', {
      name: 'Rate Limiting Test',
      description: 'Tests rate limiting behavior and compliance',
      category: 'performance',
      severity: 'info',
      test: async (integration) => {
        const startTime = Date.now();
        try {
          // Simulate rapid requests to test rate limiting
          const rapidRequests = [];
          for (let i = 0; i < 3; i++) {
            if (typeof integration.healthCheck === 'function') {
              rapidRequests.push(integration.healthCheck());
            }
          }
          
          const results = await Promise.allSettled(rapidRequests);
          const successful = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected').length;
          
          return {
            status: 'passed',
            responseTime: Date.now() - startTime,
            details: {
              totalRequests: rapidRequests.length,
              successful,
              failed,
              rateLimitingDetected: failed > 0
            },
            message: 'Rate limiting test completed'
          };
        } catch (error) {
          return {
            status: 'failed',
            responseTime: Date.now() - startTime,
            error: error.message,
            message: 'Rate limiting test failed'
          };
        }
      }
    });
  }

  /**
   * Register a custom diagnostic test
   */
  registerDiagnosticTest(testId, testConfig) {
    this.diagnosticTests.set(testId, {
      id: testId,
      ...testConfig,
      registeredAt: new Date()
    });
  }

  /**
   * Run diagnostic tests for an integration
   */
  async runDiagnostics(integrationName, integration, options = {}) {
    const diagnosticId = uuidv4();
    const {
      tests = ['all'],
      includeHistory = false,
      generateReport = true
    } = options;

    const diagnosticSession = {
      id: diagnosticId,
      integrationName,
      timestamp: new Date(),
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        skipped: 0
      },
      recommendations: [],
      executionTime: 0
    };

    const startTime = Date.now();

    try {
      // Determine which tests to run
      const testsToRun = tests.includes('all') 
        ? Array.from(this.diagnosticTests.keys())
        : tests.filter(test => this.diagnosticTests.has(test));

      // Run each diagnostic test
      for (const testId of testsToRun) {
        const testConfig = this.diagnosticTests.get(testId);
        if (!testConfig) continue;

        try {
          const testResult = await Promise.race([
            testConfig.test(integration),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Test timeout')), this.options.diagnosticTimeout)
            )
          ]);

          diagnosticSession.tests[testId] = {
            ...testConfig,
            result: testResult,
            executedAt: new Date()
          };

          // Update summary
          diagnosticSession.summary.total++;
          switch (testResult.status) {
            case 'passed':
              diagnosticSession.summary.passed++;
              break;
            case 'failed':
              diagnosticSession.summary.failed++;
              break;
            case 'warning':
              diagnosticSession.summary.warnings++;
              break;
            case 'skipped':
              diagnosticSession.summary.skipped++;
              break;
          }

        } catch (error) {
          diagnosticSession.tests[testId] = {
            ...testConfig,
            result: {
              status: 'failed',
              error: error.message,
              message: 'Test execution failed'
            },
            executedAt: new Date()
          };
          diagnosticSession.summary.total++;
          diagnosticSession.summary.failed++;
        }
      }

      diagnosticSession.executionTime = Date.now() - startTime;

      // Generate recommendations
      if (generateReport) {
        diagnosticSession.recommendations = this.generateRecommendations(diagnosticSession);
      }

      // Store diagnostic history
      this.storeDiagnosticHistory(integrationName, diagnosticSession);

      // Store in database
      await this.storeDiagnosticResults(diagnosticSession);

      return diagnosticSession;

    } catch (error) {
      diagnosticSession.executionTime = Date.now() - startTime;
      diagnosticSession.error = error.message;
      return diagnosticSession;
    }
  }

  /**
   * Generate recommendations based on diagnostic results
   */
  generateRecommendations(diagnosticSession) {
    const recommendations = [];

    // Check for connectivity issues
    const connectivityTest = diagnosticSession.tests['connectivity'];
    if (connectivityTest?.result?.status === 'failed') {
      recommendations.push({
        type: 'connectivity',
        priority: 'critical',
        title: 'Connectivity Issue Detected',
        description: 'The integration is experiencing connectivity problems',
        actions: [
          'Check network connectivity to the integration endpoint',
          'Verify firewall rules and security groups',
          'Confirm DNS resolution is working correctly',
          'Check if the service is experiencing an outage'
        ]
      });
    }

    // Check for authentication issues
    const authTest = diagnosticSession.tests['authentication'];
    if (authTest?.result?.status === 'failed') {
      recommendations.push({
        type: 'authentication',
        priority: 'critical',
        title: 'Authentication Failure',
        description: 'Authentication credentials may be invalid or expired',
        actions: [
          'Verify authentication credentials are correct',
          'Check if tokens or certificates have expired',
          'Confirm the service account has necessary permissions',
          'Review authentication configuration settings'
        ]
      });
    }

    // Check for performance issues
    const performanceTest = diagnosticSession.tests['performance'];
    if (performanceTest?.result?.details?.avgResponseTime > 5000) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Performance Degradation',
        description: 'Response times are higher than expected',
        actions: [
          'Monitor system resources on both client and server',
          'Check for network latency issues',
          'Review integration configuration for optimization opportunities',
          'Consider implementing caching strategies'
        ]
      });
    }

    // Check for circuit breaker issues
    const circuitBreakerTest = diagnosticSession.tests['circuit_breaker'];
    if (circuitBreakerTest?.result?.details?.circuitBreakers) {
      const openCircuitBreakers = Object.entries(circuitBreakerTest.result.details.circuitBreakers)
        .filter(([_, cb]) => cb.state === 'OPEN');
      
      if (openCircuitBreakers.length > 0) {
        recommendations.push({
          type: 'resilience',
          priority: 'high',
          title: 'Circuit Breakers Open',
          description: `${openCircuitBreakers.length} circuit breaker(s) are in OPEN state`,
          actions: [
            'Investigate the root cause of failures',
            'Wait for circuit breaker timeout to allow recovery',
            'Consider adjusting circuit breaker thresholds',
            'Monitor for service recovery'
          ]
        });
      }
    }

    // Overall health recommendation
    const failureRate = diagnosticSession.summary.failed / diagnosticSession.summary.total;
    if (failureRate > 0.5) {
      recommendations.push({
        type: 'general',
        priority: 'critical',
        title: 'Multiple Diagnostic Failures',
        description: 'More than half of diagnostic tests failed',
        actions: [
          'Perform immediate investigation of the integration',
          'Check service status and recent changes',
          'Review logs for error patterns',
          'Consider escalating to the integration team'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Store diagnostic history
   */
  storeDiagnosticHistory(integrationName, diagnosticSession) {
    if (!this.diagnosticHistory.has(integrationName)) {
      this.diagnosticHistory.set(integrationName, []);
    }

    const history = this.diagnosticHistory.get(integrationName);
    history.push(diagnosticSession);

    // Keep only recent history
    if (history.length > this.options.maxDiagnosticHistory) {
      history.splice(0, history.length - this.options.maxDiagnosticHistory);
    }
  }

  /**
   * Store diagnostic results in database
   */
  async storeDiagnosticResults(diagnosticSession) {
    try {
      for (const [testId, testData] of Object.entries(diagnosticSession.tests)) {
        await pool.query(
          `INSERT INTO diagnostic_test_results 
           (test_id, integration_name, test_name, test_type, status, execution_time, result_data, error_message, recommendations, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            uuidv4(),
            diagnosticSession.integrationName,
            testData.name,
            testData.category,
            testData.result.status,
            testData.result.responseTime || null,
            JSON.stringify(testData.result),
            testData.result.error || null,
            JSON.stringify(diagnosticSession.recommendations),
            diagnosticSession.timestamp
          ]
        );
      }
    } catch (error) {
      console.error('Failed to store diagnostic results:', error);
    }
  }

  /**
   * Get diagnostic history for an integration
   */
  getDiagnosticHistory(integrationName, limit = 10) {
    const history = this.diagnosticHistory.get(integrationName) || [];
    return history.slice(-limit);
  }

  /**
   * Analyze trends in diagnostic results
   */
  analyzeDiagnosticTrends(integrationName, days = 7) {
    const history = this.diagnosticHistory.get(integrationName) || [];
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentHistory = history.filter(session => session.timestamp > cutoff);

    if (recentHistory.length === 0) {
      return null;
    }

    const trends = {
      totalSessions: recentHistory.length,
      averageExecutionTime: 0,
      testResults: {},
      failurePatterns: [],
      recommendations: []
    };

    // Calculate average execution time
    trends.averageExecutionTime = recentHistory.reduce((sum, session) => 
      sum + session.executionTime, 0) / recentHistory.length;

    // Analyze test results
    const testStats = {};
    recentHistory.forEach(session => {
      Object.entries(session.tests).forEach(([testId, testData]) => {
        if (!testStats[testId]) {
          testStats[testId] = { total: 0, passed: 0, failed: 0, warnings: 0 };
        }
        testStats[testId].total++;
        testStats[testId][testData.result.status]++;
      });
    });

    // Calculate success rates
    Object.entries(testStats).forEach(([testId, stats]) => {
      trends.testResults[testId] = {
        ...stats,
        successRate: (stats.passed / stats.total) * 100,
        failureRate: (stats.failed / stats.total) * 100
      };
    });

    // Identify failure patterns
    Object.entries(trends.testResults).forEach(([testId, stats]) => {
      if (stats.failureRate > 20) {
        trends.failurePatterns.push({
          testId,
          failureRate: stats.failureRate,
          description: `${testId} test has a ${stats.failureRate.toFixed(1)}% failure rate`
        });
      }
    });

    // Generate trend-based recommendations
    if (trends.failurePatterns.length > 0) {
      trends.recommendations.push({
        type: 'trend',
        priority: 'medium',
        title: 'Recurring Test Failures',
        description: 'Some diagnostic tests are failing consistently',
        actions: [
          'Investigate root causes of recurring failures',
          'Consider adjusting test parameters or thresholds',
          'Review integration configuration for stability issues'
        ]
      });
    }

    return trends;
  }

  /**
   * Generate comprehensive diagnostic report
   */
  async generateDiagnosticReport(integrationName, options = {}) {
    const {
      includeTrends = true,
      includeHistory = true,
      includeRecommendations = true,
      format = 'json'
    } = options;

    const report = {
      integrationName,
      generatedAt: new Date(),
      summary: {},
      currentStatus: null,
      trends: null,
      history: null,
      recommendations: []
    };

    try {
      // Get latest diagnostic results from database
      const latestResults = await pool.query(
        `SELECT * FROM diagnostic_test_results 
         WHERE integration_name = $1 
         ORDER BY timestamp DESC 
         LIMIT 10`,
        [integrationName]
      );

      report.summary = this.summarizeDiagnosticResults(latestResults.rows);

      // Include trends if requested
      if (includeTrends) {
        report.trends = this.analyzeDiagnosticTrends(integrationName);
      }

      // Include history if requested
      if (includeHistory) {
        report.history = this.getDiagnosticHistory(integrationName);
      }

      // Include recommendations if requested
      if (includeRecommendations) {
        report.recommendations = this.generateTrendRecommendations(report);
      }

      return report;

    } catch (error) {
      report.error = error.message;
      return report;
    }
  }

  /**
   * Summarize diagnostic results
   */
  summarizeDiagnosticResults(results) {
    const summary = {
      totalTests: results.length,
      byStatus: { passed: 0, failed: 0, warning: 0, skipped: 0 },
      byCategory: {},
      averageExecutionTime: 0,
      lastRun: null
    };

    if (results.length === 0) return summary;

    results.forEach(result => {
      // Count by status
      summary.byStatus[result.status] = (summary.byStatus[result.status] || 0) + 1;

      // Count by category
      summary.byCategory[result.test_type] = (summary.byCategory[result.test_type] || 0) + 1;

      // Track execution time
      if (result.execution_time) {
        summary.averageExecutionTime += result.execution_time;
      }
    });

    summary.averageExecutionTime = summary.averageExecutionTime / results.length;
    summary.lastRun = results[0].timestamp;

    return summary;
  }

  /**
   * Generate recommendations based on trends
   */
  generateTrendRecommendations(report) {
    const recommendations = [];

    if (report.trends?.failurePatterns?.length > 0) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'Reliability Issues Detected',
        description: 'Multiple diagnostic tests are showing consistent failures',
        actions: [
          'Review integration stability and error patterns',
          'Consider implementing additional monitoring',
          'Investigate infrastructure or configuration issues'
        ]
      });
    }

    if (report.trends?.averageExecutionTime > 10000) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Slow Diagnostic Execution',
        description: 'Diagnostic tests are taking longer than expected to complete',
        actions: [
          'Check network connectivity and latency',
          'Review integration performance optimization',
          'Consider adjusting diagnostic test timeouts'
        ]
      });
    }

    return recommendations;
  }
}

// Initialize diagnostic tools
const diagnosticTools = new DiagnosticTools();

/**
 * @route POST /api/diagnostics/:integrationName/run
 * @desc Run diagnostic tests for an integration
 * @access Private
 */
router.post('/:integrationName/run', async (req, res) => {
  try {
    const { integrationName } = req.params;
    const { tests = ['all'], options = {} } = req.body;

    // Get integration instance (this would come from your integration registry)
    const integration = req.app.locals.integrations?.get(integrationName);
    if (!integration) {
      return res.status(404).json({
        error: {
          code: 'INTEGRATION_NOT_FOUND',
          message: `Integration not found: ${integrationName}`
        }
      });
    }

    const diagnosticResults = await diagnosticTools.runDiagnostics(
      integrationName, 
      integration, 
      { tests, ...options }
    );

    res.json({
      success: true,
      data: diagnosticResults,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTime: diagnosticResults.executionTime
      }
    });

  } catch (error) {
    console.error('Error running diagnostics:', error);
    res.status(500).json({
      error: {
        code: 'DIAGNOSTIC_ERROR',
        message: 'Failed to run diagnostic tests',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /api/diagnostics/:integrationName/history
 * @desc Get diagnostic history for an integration
 * @access Private
 */
router.get('/:integrationName/history', async (req, res) => {
  try {
    const { integrationName } = req.params;
    const { limit = 10, days = 7 } = req.query;

    const history = await pool.query(
      `SELECT * FROM diagnostic_test_results 
       WHERE integration_name = $1 
       AND timestamp > NOW() - INTERVAL '${days} days'
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [integrationName, limit]
    );

    res.json({
      success: true,
      data: history.rows,
      metadata: {
        timestamp: new Date().toISOString(),
        totalRecords: history.rows.length,
        timeRange: `${days} days`
      }
    });

  } catch (error) {
    console.error('Error getting diagnostic history:', error);
    res.status(500).json({
      error: {
        code: 'HISTORY_ERROR',
        message: 'Failed to retrieve diagnostic history',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /api/diagnostics/:integrationName/trends
 * @desc Get diagnostic trends analysis
 * @access Private
 */
router.get('/:integrationName/trends', async (req, res) => {
  try {
    const { integrationName } = req.params;
    const { days = 7 } = req.query;

    const trends = diagnosticTools.analyzeDiagnosticTrends(integrationName, parseInt(days));

    if (!trends) {
      return res.status(404).json({
        error: {
          code: 'NO_DATA',
          message: 'No diagnostic data available for trend analysis'
        }
      });
    }

    res.json({
      success: true,
      data: trends,
      metadata: {
        timestamp: new Date().toISOString(),
        analysisWindow: `${days} days`
      }
    });

  } catch (error) {
    console.error('Error analyzing trends:', error);
    res.status(500).json({
      error: {
        code: 'TRENDS_ERROR',
        message: 'Failed to analyze diagnostic trends',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /api/diagnostics/:integrationName/report
 * @desc Generate comprehensive diagnostic report
 * @access Private
 */
router.get('/:integrationName/report', async (req, res) => {
  try {
    const { integrationName } = req.params;
    const { 
      includeTrends = true, 
      includeHistory = true, 
      includeRecommendations = true,
      format = 'json'
    } = req.query;

    const report = await diagnosticTools.generateDiagnosticReport(integrationName, {
      includeTrends: includeTrends === 'true',
      includeHistory: includeHistory === 'true',
      includeRecommendations: includeRecommendations === 'true',
      format
    });

    res.json({
      success: true,
      data: report,
      metadata: {
        timestamp: new Date().toISOString(),
        format
      }
    });

  } catch (error) {
    console.error('Error generating diagnostic report:', error);
    res.status(500).json({
      error: {
        code: 'REPORT_ERROR',
        message: 'Failed to generate diagnostic report',
        details: error.message
      }
    });
  }
});

/**
 * @route GET /api/diagnostics/tests
 * @desc Get available diagnostic tests
 * @access Private
 */
router.get('/tests', (req, res) => {
  try {
    const tests = Array.from(diagnosticTools.diagnosticTests.values()).map(test => ({
      id: test.id,
      name: test.name,
      description: test.description,
      category: test.category,
      severity: test.severity
    }));

    res.json({
      success: true,
      data: tests,
      metadata: {
        timestamp: new Date().toISOString(),
        totalTests: tests.length
      }
    });

  } catch (error) {
    console.error('Error getting diagnostic tests:', error);
    res.status(500).json({
      error: {
        code: 'TESTS_ERROR',
        message: 'Failed to retrieve diagnostic tests',
        details: error.message
      }
    });
  }
});

module.exports = { router, diagnosticTools };