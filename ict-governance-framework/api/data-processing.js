// File: ict-governance-framework/api/data-processing.js
// Data Processing API for Governance Metrics Analysis and Transformation

const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, query } = require('express-validator');
const { authenticateToken, logActivity } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper function to generate processing job IDs
function generateJobId() {
  return `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Data aggregation and calculation functions
class DataProcessor {
  static async calculateKPI(metricName, aggregationType, timeRange, filters = {}) {
    let whereConditions = ['metric_name = $1'];
    let queryParams = [metricName];
    let paramCount = 1;

    // Add time range filter
    if (timeRange.start_date) {
      paramCount++;
      whereConditions.push(`collection_timestamp >= $${paramCount}`);
      queryParams.push(timeRange.start_date);
    }

    if (timeRange.end_date) {
      paramCount++;
      whereConditions.push(`collection_timestamp <= $${paramCount}`);
      queryParams.push(timeRange.end_date);
    }

    // Add additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        paramCount++;
        whereConditions.push(`${key} = $${paramCount}`);
        queryParams.push(value);
      }
    });

    const whereClause = whereConditions.join(' AND ');

    let aggregationFunction;
    switch (aggregationType.toLowerCase()) {
      case 'avg':
      case 'average':
        aggregationFunction = 'AVG(value)';
        break;
      case 'sum':
        aggregationFunction = 'SUM(value)';
        break;
      case 'max':
        aggregationFunction = 'MAX(value)';
        break;
      case 'min':
        aggregationFunction = 'MIN(value)';
        break;
      case 'count':
        aggregationFunction = 'COUNT(*)';
        break;
      case 'latest':
        aggregationFunction = 'value';
        break;
      default:
        throw new Error(`Unsupported aggregation type: ${aggregationType}`);
    }

    let query;
    if (aggregationType.toLowerCase() === 'latest') {
      query = `
        SELECT value, collection_timestamp, unit, target_value
        FROM metric_data
        WHERE ${whereClause}
        ORDER BY collection_timestamp DESC
        LIMIT 1
      `;
    } else {
      query = `
        SELECT 
          ${aggregationFunction} as calculated_value,
          COUNT(*) as data_points,
          MIN(collection_timestamp) as period_start,
          MAX(collection_timestamp) as period_end,
          AVG(target_value) as avg_target_value
        FROM metric_data
        WHERE ${whereClause}
      `;
    }

    const result = await pool.query(query, queryParams);
    return result.rows[0];
  }

  static async calculateTrend(metricName, timeRange, intervalType = 'daily') {
    const intervals = {
      'hourly': 'hour',
      'daily': 'day',
      'weekly': 'week',
      'monthly': 'month',
      'quarterly': 'quarter',
      'yearly': 'year'
    };

    const interval = intervals[intervalType] || 'day';

    const query = `
      SELECT 
        DATE_TRUNC('${interval}', collection_timestamp) as time_period,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as data_points,
        STDDEV(value) as std_deviation
      FROM metric_data
      WHERE metric_name = $1
        AND collection_timestamp >= $2
        AND collection_timestamp <= $3
      GROUP BY DATE_TRUNC('${interval}', collection_timestamp)
      ORDER BY time_period ASC
    `;

    const result = await pool.query(query, [
      metricName,
      timeRange.start_date,
      timeRange.end_date
    ]);

    // Calculate trend direction and rate
    const data = result.rows;
    if (data.length < 2) {
      return { trend_data: data, trend_direction: 'insufficient_data', trend_rate: 0 };
    }

    const firstValue = parseFloat(data[0].avg_value);
    const lastValue = parseFloat(data[data.length - 1].avg_value);
    const trendRate = ((lastValue - firstValue) / firstValue) * 100;

    let trendDirection;
    if (Math.abs(trendRate) < 1) {
      trendDirection = 'stable';
    } else if (trendRate > 0) {
      trendDirection = 'increasing';
    } else {
      trendDirection = 'decreasing';
    }

    return {
      trend_data: data,
      trend_direction: trendDirection,
      trend_rate: trendRate,
      period_start: data[0].time_period,
      period_end: data[data.length - 1].time_period
    };
  }

  static async calculateCompliance(complianceMetrics, timeRange) {
    const results = {};

    for (const metric of complianceMetrics) {
      const kpiResult = await this.calculateKPI(
        metric.metric_name,
        metric.aggregation_type || 'latest',
        timeRange,
        { metric_category: 'compliance' }
      );

      const complianceStatus = this.determineComplianceStatus(
        kpiResult.calculated_value || kpiResult.value,
        metric.target_value,
        metric.compliance_threshold
      );

      results[metric.metric_name] = {
        current_value: kpiResult.calculated_value || kpiResult.value,
        target_value: metric.target_value,
        compliance_status: complianceStatus,
        compliance_percentage: this.calculateCompliancePercentage(
          kpiResult.calculated_value || kpiResult.value,
          metric.target_value
        ),
        data_points: kpiResult.data_points || 1,
        last_updated: kpiResult.collection_timestamp || kpiResult.period_end
      };
    }

    return results;
  }

  static determineComplianceStatus(currentValue, targetValue, threshold = 0.95) {
    if (!targetValue || !currentValue) return 'unknown';
    
    const ratio = currentValue / targetValue;
    
    if (ratio >= 1) return 'compliant';
    if (ratio >= threshold) return 'near_compliant';
    return 'non_compliant';
  }

  static calculateCompliancePercentage(currentValue, targetValue) {
    if (!targetValue || !currentValue) return 0;
    return Math.min((currentValue / targetValue) * 100, 100);
  }

  static async generateInsights(metricName, timeRange) {
    const trendData = await this.calculateTrend(metricName, timeRange, 'daily');
    const kpiData = await this.calculateKPI(metricName, 'latest', timeRange);
    
    const insights = [];

    // Trend insights
    if (trendData.trend_direction === 'increasing' && trendData.trend_rate > 10) {
      insights.push({
        type: 'positive_trend',
        message: `${metricName} shows strong positive trend with ${trendData.trend_rate.toFixed(1)}% improvement`,
        severity: 'info',
        confidence: 0.8
      });
    } else if (trendData.trend_direction === 'decreasing' && trendData.trend_rate < -10) {
      insights.push({
        type: 'negative_trend',
        message: `${metricName} shows concerning downward trend with ${Math.abs(trendData.trend_rate).toFixed(1)}% decline`,
        severity: 'warning',
        confidence: 0.8
      });
    }

    // Target comparison insights
    if (kpiData.target_value && kpiData.value) {
      const targetRatio = kpiData.value / kpiData.target_value;
      if (targetRatio < 0.9) {
        insights.push({
          type: 'target_miss',
          message: `${metricName} is ${((1 - targetRatio) * 100).toFixed(1)}% below target`,
          severity: 'warning',
          confidence: 0.9
        });
      } else if (targetRatio > 1.1) {
        insights.push({
          type: 'target_exceed',
          message: `${metricName} exceeds target by ${((targetRatio - 1) * 100).toFixed(1)}%`,
          severity: 'info',
          confidence: 0.9
        });
      }
    }

    return insights;
  }
}

// API Endpoints

// POST /api/data-processing/calculate-kpi - Calculate KPI values
router.post('/calculate-kpi',
  authenticateToken,
  requirePermission('data_processing_read'),
  [
    body('metric_name').notEmpty().withMessage('Metric name is required'),
    body('aggregation_type').isIn(['avg', 'sum', 'max', 'min', 'count', 'latest']).withMessage('Invalid aggregation type'),
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

      const { metric_name, aggregation_type, time_range, filters = {} } = req.body;

      const result = await DataProcessor.calculateKPI(
        metric_name,
        aggregation_type,
        time_range,
        filters
      );

      await logActivity(
        req.user.user_id,
        'kpi_calculated',
        `KPI calculated for ${metric_name}`,
        req.ip,
        req.get('User-Agent'),
        { metric_name, aggregation_type, time_range }
      );

      res.json({
        success: true,
        data: {
          metric_name,
          aggregation_type,
          time_range,
          result
        }
      });

    } catch (error) {
      console.error('Error calculating KPI:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate KPI',
        error: error.message
      });
    }
  }
);

// POST /api/data-processing/calculate-trend - Calculate trend analysis
router.post('/calculate-trend',
  authenticateToken,
  requirePermission('data_processing_read'),
  [
    body('metric_name').notEmpty().withMessage('Metric name is required'),
    body('time_range.start_date').isISO8601().withMessage('Invalid start date'),
    body('time_range.end_date').isISO8601().withMessage('Invalid end date'),
    body('interval_type').optional().isIn(['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']).withMessage('Invalid interval type')
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

      const { metric_name, time_range, interval_type = 'daily' } = req.body;

      const result = await DataProcessor.calculateTrend(
        metric_name,
        time_range,
        interval_type
      );

      await logActivity(
        req.user.user_id,
        'trend_calculated',
        `Trend analysis calculated for ${metric_name}`,
        req.ip,
        req.get('User-Agent'),
        { metric_name, interval_type, time_range }
      );

      res.json({
        success: true,
        data: {
          metric_name,
          interval_type,
          time_range,
          result
        }
      });

    } catch (error) {
      console.error('Error calculating trend:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate trend',
        error: error.message
      });
    }
  }
);

// POST /api/data-processing/compliance-analysis - Calculate compliance metrics
router.post('/compliance-analysis',
  authenticateToken,
  requirePermission('data_processing_read'),
  [
    body('compliance_metrics').isArray().withMessage('Compliance metrics must be an array'),
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

      const { compliance_metrics, time_range } = req.body;

      const result = await DataProcessor.calculateCompliance(
        compliance_metrics,
        time_range
      );

      // Calculate overall compliance score
      const complianceValues = Object.values(result);
      const overallCompliance = complianceValues.reduce((sum, metric) => 
        sum + metric.compliance_percentage, 0) / complianceValues.length;

      await logActivity(
        req.user.user_id,
        'compliance_analysis_calculated',
        `Compliance analysis calculated for ${compliance_metrics.length} metrics`,
        req.ip,
        req.get('User-Agent'),
        { metrics_count: compliance_metrics.length, overall_compliance: overallCompliance }
      );

      res.json({
        success: true,
        data: {
          compliance_metrics: result,
          overall_compliance_percentage: overallCompliance,
          time_range,
          analysis_timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error calculating compliance analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate compliance analysis',
        error: error.message
      });
    }
  }
);

// POST /api/data-processing/generate-insights - Generate automated insights
router.post('/generate-insights',
  authenticateToken,
  requirePermission('data_processing_read'),
  [
    body('metric_name').notEmpty().withMessage('Metric name is required'),
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

      const { metric_name, time_range } = req.body;

      const insights = await DataProcessor.generateInsights(metric_name, time_range);

      await logActivity(
        req.user.user_id,
        'insights_generated',
        `Insights generated for ${metric_name}`,
        req.ip,
        req.get('User-Agent'),
        { metric_name, insights_count: insights.length }
      );

      res.json({
        success: true,
        data: {
          metric_name,
          time_range,
          insights,
          generated_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generating insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate insights',
        error: error.message
      });
    }
  }
);

// GET /api/data-processing/dashboard-data - Get processed dashboard data
router.get('/dashboard-data',
  authenticateToken,
  requirePermission('data_processing_read'),
  async (req, res) => {
    try {
      const { dashboard_type = 'executive', time_range_days = 30 } = req.query;
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(time_range_days));

      const timeRange = {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      };

      // Define dashboard-specific metrics
      const dashboardMetrics = {
        executive: [
          'governance_maturity_level',
          'policy_compliance_rate',
          'risk_remediation_rate',
          'stakeholder_satisfaction',
          'business_value_realization'
        ],
        operational: [
          'process_automation_rate',
          'incident_rate',
          'mean_time_to_resolve',
          'architecture_compliance',
          'technology_standardization'
        ],
        compliance: [
          'policy_compliance_rate',
          'security_control_effectiveness',
          'audit_findings_resolved',
          'regulatory_compliance_score'
        ],
        risk: [
          'risk_identification_rate',
          'high_risk_exceptions',
          'security_incidents',
          'vulnerability_remediation_rate'
        ]
      };

      const metrics = dashboardMetrics[dashboard_type] || dashboardMetrics.executive;
      const dashboardData = {};

      // Calculate KPIs for each metric
      for (const metricName of metrics) {
        try {
          const kpiResult = await DataProcessor.calculateKPI(
            metricName,
            'latest',
            timeRange
          );

          const trendResult = await DataProcessor.calculateTrend(
            metricName,
            timeRange,
            'daily'
          );

          dashboardData[metricName] = {
            current_value: kpiResult.calculated_value || kpiResult.value,
            target_value: kpiResult.avg_target_value || kpiResult.target_value,
            trend: {
              direction: trendResult.trend_direction,
              rate: trendResult.trend_rate
            },
            last_updated: kpiResult.collection_timestamp || kpiResult.period_end
          };
        } catch (metricError) {
          console.warn(`Error processing metric ${metricName}:`, metricError.message);
          dashboardData[metricName] = {
            current_value: null,
            target_value: null,
            trend: { direction: 'unknown', rate: 0 },
            last_updated: null,
            error: 'Data not available'
          };
        }
      }

      await logActivity(
        req.user.user_id,
        'dashboard_data_retrieved',
        `Dashboard data retrieved for ${dashboard_type}`,
        req.ip,
        req.get('User-Agent'),
        { dashboard_type, metrics_count: metrics.length }
      );

      res.json({
        success: true,
        data: {
          dashboard_type,
          time_range,
          metrics: dashboardData,
          generated_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error retrieving dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard data',
        error: error.message
      });
    }
  }
);

module.exports = router;