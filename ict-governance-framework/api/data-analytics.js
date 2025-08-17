// File: ict-governance-framework/api/data-analytics.js
// Advanced Data Analytics API for Governance Metrics

const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, query } = require('express-validator');
const { authenticateToken, requirePermission, logActivity } = require('./auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Advanced analytics class
class AdvancedAnalytics {
  // Predictive analytics for governance metrics
  static async predictiveAnalysis(metricName, timeRange, predictionPeriod = 30) {
    const query = `
      SELECT 
        collection_timestamp,
        value,
        target_value
      FROM metric_data
      WHERE metric_name = $1
        AND collection_timestamp >= $2
        AND collection_timestamp <= $3
      ORDER BY collection_timestamp ASC
    `;

    const result = await pool.query(query, [
      metricName,
      timeRange.start_date,
      timeRange.end_date
    ]);

    const data = result.rows;
    if (data.length < 5) {
      return {
        prediction: null,
        confidence: 0,
        message: 'Insufficient data for prediction'
      };
    }

    // Simple linear regression for trend prediction
    const n = data.length;
    const xValues = data.map((_, index) => index);
    const yValues = data.map(row => parseFloat(row.value));

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = yValues.reduce((sum, y, i) => {
      const predicted = slope * xValues[i] + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    // Predict future values
    const predictions = [];
    for (let i = 1; i <= predictionPeriod; i++) {
      const futureX = n + i - 1;
      const predictedValue = slope * futureX + intercept;
      const futureDate = new Date(data[data.length - 1].collection_timestamp);
      futureDate.setDate(futureDate.getDate() + i);
      
      predictions.push({
        date: futureDate.toISOString(),
        predicted_value: Math.max(0, predictedValue), // Ensure non-negative
        confidence: rSquared
      });
    }

    return {
      predictions,
      trend_slope: slope,
      confidence: rSquared,
      model_type: 'linear_regression',
      data_points_used: n
    };
  }

  // Anomaly detection for governance metrics
  static async anomalyDetection(metricName, timeRange, sensitivityLevel = 2) {
    const query = `
      SELECT 
        collection_timestamp,
        value,
        target_value
      FROM metric_data
      WHERE metric_name = $1
        AND collection_timestamp >= $2
        AND collection_timestamp <= $3
      ORDER BY collection_timestamp ASC
    `;

    const result = await pool.query(query, [
      metricName,
      timeRange.start_date,
      timeRange.end_date
    ]);

    const data = result.rows;
    if (data.length < 10) {
      return {
        anomalies: [],
        message: 'Insufficient data for anomaly detection'
      };
    }

    const values = data.map(row => parseFloat(row.value));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const threshold = sensitivityLevel * stdDev;
    const anomalies = [];

    data.forEach((row, index) => {
      const value = parseFloat(row.value);
      const deviation = Math.abs(value - mean);
      
      if (deviation > threshold) {
        const severity = deviation > (threshold * 2) ? 'high' : 'medium';
        anomalies.push({
          timestamp: row.collection_timestamp,
          value: value,
          expected_range: {
            min: mean - threshold,
            max: mean + threshold
          },
          deviation: deviation,
          severity: severity,
          z_score: (value - mean) / stdDev
        });
      }
    });

    return {
      anomalies,
      statistics: {
        mean,
        standard_deviation: stdDev,
        threshold_used: threshold,
        total_data_points: data.length,
        anomaly_count: anomalies.length,
        anomaly_percentage: (anomalies.length / data.length) * 100
      }
    };
  }

  // Correlation analysis between metrics
  static async correlationAnalysis(metric1, metric2, timeRange) {
    const query = `
      SELECT 
        m1.collection_timestamp,
        m1.value as value1,
        m2.value as value2
      FROM metric_data m1
      INNER JOIN metric_data m2 ON DATE_TRUNC('day', m1.collection_timestamp) = DATE_TRUNC('day', m2.collection_timestamp)
      WHERE m1.metric_name = $1
        AND m2.metric_name = $2
        AND m1.collection_timestamp >= $3
        AND m1.collection_timestamp <= $4
      ORDER BY m1.collection_timestamp ASC
    `;

    const result = await pool.query(query, [
      metric1,
      metric2,
      timeRange.start_date,
      timeRange.end_date
    ]);

    const data = result.rows;
    if (data.length < 5) {
      return {
        correlation: null,
        message: 'Insufficient paired data for correlation analysis'
      };
    }

    const values1 = data.map(row => parseFloat(row.value1));
    const values2 = data.map(row => parseFloat(row.value2));

    const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

    const numerator = values1.reduce((sum, val1, i) => {
      return sum + (val1 - mean1) * (values2[i] - mean2);
    }, 0);

    const denominator1 = Math.sqrt(values1.reduce((sum, val1) => sum + Math.pow(val1 - mean1, 2), 0));
    const denominator2 = Math.sqrt(values2.reduce((sum, val2) => sum + Math.pow(val2 - mean2, 2), 0));

    const correlation = numerator / (denominator1 * denominator2);

    let strength = 'none';
    let direction = correlation > 0 ? 'positive' : 'negative';
    const absCorr = Math.abs(correlation);

    if (absCorr >= 0.8) strength = 'very_strong';
    else if (absCorr >= 0.6) strength = 'strong';
    else if (absCorr >= 0.4) strength = 'moderate';
    else if (absCorr >= 0.2) strength = 'weak';

    return {
      correlation_coefficient: correlation,
      strength,
      direction,
      data_points: data.length,
      metrics: {
        metric1: { name: metric1, mean: mean1 },
        metric2: { name: metric2, mean: mean2 }
      }
    };
  }

  // Performance benchmarking analysis
  static async benchmarkAnalysis(metricName, timeRange, benchmarkType = 'historical') {
    let benchmarkQuery;
    let benchmarkParams;

    if (benchmarkType === 'historical') {
      // Compare with historical data from same period last year
      const lastYearStart = new Date(timeRange.start_date);
      const lastYearEnd = new Date(timeRange.end_date);
      lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
      lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);

      benchmarkQuery = `
        SELECT 
          'current' as period,
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          COUNT(*) as data_points
        FROM metric_data
        WHERE metric_name = $1
          AND collection_timestamp >= $2
          AND collection_timestamp <= $3
        UNION ALL
        SELECT 
          'benchmark' as period,
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          COUNT(*) as data_points
        FROM metric_data
        WHERE metric_name = $1
          AND collection_timestamp >= $4
          AND collection_timestamp <= $5
      `;

      benchmarkParams = [
        metricName,
        timeRange.start_date,
        timeRange.end_date,
        lastYearStart.toISOString(),
        lastYearEnd.toISOString()
      ];
    } else {
      // Compare with target values
      benchmarkQuery = `
        SELECT 
          'current' as period,
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          AVG(target_value) as target_value,
          COUNT(*) as data_points
        FROM metric_data
        WHERE metric_name = $1
          AND collection_timestamp >= $2
          AND collection_timestamp <= $3
      `;

      benchmarkParams = [metricName, timeRange.start_date, timeRange.end_date];
    }

    const result = await pool.query(benchmarkQuery, benchmarkParams);
    const data = result.rows;

    if (benchmarkType === 'historical' && data.length === 2) {
      const current = data.find(row => row.period === 'current');
      const benchmark = data.find(row => row.period === 'benchmark');

      if (!current || !benchmark) {
        return { message: 'Insufficient data for historical benchmark' };
      }

      const improvement = ((current.avg_value - benchmark.avg_value) / benchmark.avg_value) * 100;

      return {
        benchmark_type: 'historical',
        current_period: {
          average: parseFloat(current.avg_value),
          minimum: parseFloat(current.min_value),
          maximum: parseFloat(current.max_value),
          data_points: parseInt(current.data_points)
        },
        benchmark_period: {
          average: parseFloat(benchmark.avg_value),
          minimum: parseFloat(benchmark.min_value),
          maximum: parseFloat(benchmark.max_value),
          data_points: parseInt(benchmark.data_points)
        },
        improvement_percentage: improvement,
        performance_status: improvement > 0 ? 'improved' : improvement < 0 ? 'declined' : 'stable'
      };
    } else if (benchmarkType === 'target' && data.length === 1) {
      const current = data[0];
      const targetValue = parseFloat(current.target_value);

      if (!targetValue) {
        return { message: 'No target value available for benchmark' };
      }

      const achievement = (current.avg_value / targetValue) * 100;

      return {
        benchmark_type: 'target',
        current_performance: {
          average: parseFloat(current.avg_value),
          minimum: parseFloat(current.min_value),
          maximum: parseFloat(current.max_value),
          data_points: parseInt(current.data_points)
        },
        target_value: targetValue,
        achievement_percentage: achievement,
        performance_status: achievement >= 100 ? 'exceeds_target' : achievement >= 90 ? 'meets_target' : 'below_target'
      };
    }

    return { message: 'Unable to perform benchmark analysis' };
  }

  // Multi-dimensional analysis
  static async multidimensionalAnalysis(metrics, timeRange, dimensions = []) {
    const metricQueries = metrics.map(metric => `
      SELECT 
        '${metric}' as metric_name,
        collection_timestamp,
        value,
        target_value,
        metadata
      FROM metric_data
      WHERE metric_name = '${metric}'
        AND collection_timestamp >= $1
        AND collection_timestamp <= $2
    `).join(' UNION ALL ');

    const query = `
      WITH combined_metrics AS (
        ${metricQueries}
      )
      SELECT * FROM combined_metrics
      ORDER BY collection_timestamp ASC
    `;

    const result = await pool.query(query, [timeRange.start_date, timeRange.end_date]);
    const data = result.rows;

    // Group data by metric
    const metricData = {};
    data.forEach(row => {
      if (!metricData[row.metric_name]) {
        metricData[row.metric_name] = [];
      }
      metricData[row.metric_name].push(row);
    });

    // Calculate correlations between all metric pairs
    const correlations = {};
    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const metric1 = metrics[i];
        const metric2 = metrics[j];
        
        try {
          const correlation = await this.correlationAnalysis(metric1, metric2, timeRange);
          correlations[`${metric1}_${metric2}`] = correlation;
        } catch (error) {
          console.warn(`Correlation analysis failed for ${metric1} and ${metric2}:`, error.message);
        }
      }
    }

    // Calculate summary statistics for each metric
    const summaryStats = {};
    Object.entries(metricData).forEach(([metricName, values]) => {
      const numericValues = values.map(v => parseFloat(v.value));
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;
      
      summaryStats[metricName] = {
        count: numericValues.length,
        mean: mean,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        std_dev: Math.sqrt(variance),
        latest_value: numericValues[numericValues.length - 1]
      };
    });

    return {
      metrics_analyzed: metrics,
      time_range: timeRange,
      summary_statistics: summaryStats,
      correlations: correlations,
      total_data_points: data.length,
      analysis_timestamp: new Date().toISOString()
    };
  }
}

// API Endpoints

// POST /api/data-analytics/predictive-analysis - Perform predictive analysis
router.post('/predictive-analysis',
  authenticateToken,
  requirePermission('data_analytics_read'),
  [
    body('metric_name').notEmpty().withMessage('Metric name is required'),
    body('time_range.start_date').isISO8601().withMessage('Invalid start date'),
    body('time_range.end_date').isISO8601().withMessage('Invalid end date'),
    body('prediction_period').optional().isInt({ min: 1, max: 365 }).withMessage('Prediction period must be between 1 and 365 days')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { metric_name, time_range, prediction_period = 30 } = req.body;

      const result = await AdvancedAnalytics.predictiveAnalysis(
        metric_name,
        time_range,
        prediction_period
      );

      await logActivity(
        req.user.user_id,
        'predictive_analysis_performed',
        `Predictive analysis performed for ${metric_name}`,
        req.ip,
        req.get('User-Agent'),
        { metric_name, prediction_period }
      );

      res.json({
        success: true,
        data: {
          metric_name,
          time_range,
          prediction_period,
          analysis_result: result
        }
      });

    } catch (error) {
      console.error('Error performing predictive analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform predictive analysis',
        error: error.message
      });
    }
  }
);

// POST /api/data-analytics/anomaly-detection - Detect anomalies in metrics
router.post('/anomaly-detection',
  authenticateToken,
  requirePermission('data_analytics_read'),
  [
    body('metric_name').notEmpty().withMessage('Metric name is required'),
    body('time_range.start_date').isISO8601().withMessage('Invalid start date'),
    body('time_range.end_date').isISO8601().withMessage('Invalid end date'),
    body('sensitivity_level').optional().isFloat({ min: 1, max: 5 }).withMessage('Sensitivity level must be between 1 and 5')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { metric_name, time_range, sensitivity_level = 2 } = req.body;

      const result = await AdvancedAnalytics.anomalyDetection(
        metric_name,
        time_range,
        sensitivity_level
      );

      await logActivity(
        req.user.user_id,
        'anomaly_detection_performed',
        `Anomaly detection performed for ${metric_name}`,
        req.ip,
        req.get('User-Agent'),
        { metric_name, sensitivity_level, anomalies_found: result.anomalies?.length || 0 }
      );

      res.json({
        success: true,
        data: {
          metric_name,
          time_range,
          sensitivity_level,
          analysis_result: result
        }
      });

    } catch (error) {
      console.error('Error performing anomaly detection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform anomaly detection',
        error: error.message
      });
    }
  }
);

// POST /api/data-analytics/correlation-analysis - Analyze correlation between metrics
router.post('/correlation-analysis',
  authenticateToken,
  requirePermission('data_analytics_read'),
  [
    body('metric1').notEmpty().withMessage('First metric name is required'),
    body('metric2').notEmpty().withMessage('Second metric name is required'),
    body('time_range.start_date').isISO8601().withMessage('Invalid start date'),
    body('time_range.end_date').isISO8601().withMessage('Invalid end date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { metric1, metric2, time_range } = req.body;

      const result = await AdvancedAnalytics.correlationAnalysis(
        metric1,
        metric2,
        time_range
      );

      await logActivity(
        req.user.user_id,
        'correlation_analysis_performed',
        `Correlation analysis performed between ${metric1} and ${metric2}`,
        req.ip,
        req.get('User-Agent'),
        { metric1, metric2, correlation: result.correlation_coefficient }
      );

      res.json({
        success: true,
        data: {
          metric1,
          metric2,
          time_range,
          analysis_result: result
        }
      });

    } catch (error) {
      console.error('Error performing correlation analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform correlation analysis',
        error: error.message
      });
    }
  }
);

// POST /api/data-analytics/benchmark-analysis - Perform benchmark analysis
router.post('/benchmark-analysis',
  authenticateToken,
  requirePermission('data_analytics_read'),
  [
    body('metric_name').notEmpty().withMessage('Metric name is required'),
    body('time_range.start_date').isISO8601().withMessage('Invalid start date'),
    body('time_range.end_date').isISO8601().withMessage('Invalid end date'),
    body('benchmark_type').optional().isIn(['historical', 'target']).withMessage('Invalid benchmark type')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { metric_name, time_range, benchmark_type = 'historical' } = req.body;

      const result = await AdvancedAnalytics.benchmarkAnalysis(
        metric_name,
        time_range,
        benchmark_type
      );

      await logActivity(
        req.user.user_id,
        'benchmark_analysis_performed',
        `Benchmark analysis performed for ${metric_name}`,
        req.ip,
        req.get('User-Agent'),
        { metric_name, benchmark_type }
      );

      res.json({
        success: true,
        data: {
          metric_name,
          time_range,
          benchmark_type,
          analysis_result: result
        }
      });

    } catch (error) {
      console.error('Error performing benchmark analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform benchmark analysis',
        error: error.message
      });
    }
  }
);

// POST /api/data-analytics/multidimensional-analysis - Perform multidimensional analysis
router.post('/multidimensional-analysis',
  authenticateToken,
  requirePermission('data_analytics_read'),
  [
    body('metrics').isArray({ min: 2 }).withMessage('At least 2 metrics are required'),
    body('time_range.start_date').isISO8601().withMessage('Invalid start date'),
    body('time_range.end_date').isISO8601().withMessage('Invalid end date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { metrics, time_range, dimensions = [] } = req.body;

      const result = await AdvancedAnalytics.multidimensionalAnalysis(
        metrics,
        time_range,
        dimensions
      );

      await logActivity(
        req.user.user_id,
        'multidimensional_analysis_performed',
        `Multidimensional analysis performed for ${metrics.length} metrics`,
        req.ip,
        req.get('User-Agent'),
        { metrics_count: metrics.length, metrics }
      );

      res.json({
        success: true,
        data: {
          metrics,
          time_range,
          analysis_result: result
        }
      });

    } catch (error) {
      console.error('Error performing multidimensional analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform multidimensional analysis',
        error: error.message
      });
    }
  }
);

module.exports = router;