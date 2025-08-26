// File: ict-governance-framework/api/reporting.js
// Reporting API for Governance Metrics and Analytics

const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, query } = require('express-validator');
const { requirePermissions, authenticateToken, logActivity } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper function to generate report IDs
function generateReportId() {
  return `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Report template definitions
const REPORT_TEMPLATES = {
  governance_status: {
    name: 'Governance Status Report',
    description: 'Comprehensive overview of governance status, issues, and improvements',
    frequency: 'quarterly',
    sections: ['executive_summary', 'kpi_overview', 'compliance_status', 'risk_assessment', 'recommendations']
  },
  compliance_report: {
    name: 'Compliance Report',
    description: 'Detailed compliance status against policies and regulations',
    frequency: 'monthly',
    sections: ['compliance_overview', 'policy_adherence', 'exceptions', 'remediation_status']
  },
  risk_management: {
    name: 'Risk Management Report',
    description: 'Status of technology risks and mitigation activities',
    frequency: 'monthly',
    sections: ['risk_overview', 'top_risks', 'mitigation_progress', 'emerging_risks']
  },
  performance_dashboard: {
    name: 'Performance Dashboard Report',
    description: 'Analysis of governance process efficiency and effectiveness',
    frequency: 'quarterly',
    sections: ['performance_metrics', 'process_efficiency', 'automation_progress', 'stakeholder_feedback']
  },
  executive_summary: {
    name: 'Executive Summary Report',
    description: 'High-level governance metrics for executive leadership',
    frequency: 'monthly',
    sections: ['key_metrics', 'strategic_alignment', 'major_issues', 'investment_roi']
  }
};

// Report generation class
class ReportGenerator {
  static async generateExecutiveSummary(timeRange, options = {}) {
    const report = {
      report_type: 'executive_summary',
      generated_at: new Date().toISOString(),
      time_range: timeRange,
      sections: {}
    };

    // Key Metrics Section
    const keyMetrics = await this.getKeyMetrics(timeRange);
    report.sections.key_metrics = {
      governance_maturity: keyMetrics.governance_maturity_level,
      policy_compliance: keyMetrics.policy_compliance_rate,
      risk_score: keyMetrics.overall_risk_score,
      stakeholder_satisfaction: keyMetrics.stakeholder_satisfaction,
      business_value: keyMetrics.business_value_realization
    };

    // Strategic Alignment Section
    const strategicAlignment = await this.getStrategicAlignment(timeRange);
    report.sections.strategic_alignment = strategicAlignment;

    // Major Issues Section
    const majorIssues = await this.getMajorIssues(timeRange);
    report.sections.major_issues = majorIssues;

    // Investment ROI Section
    const investmentROI = await this.getInvestmentROI(timeRange);
    report.sections.investment_roi = investmentROI;

    return report;
  }

  static async generateComplianceReport(timeRange, options = {}) {
    const report = {
      report_type: 'compliance_report',
      generated_at: new Date().toISOString(),
      time_range: timeRange,
      sections: {}
    };

    // Compliance Overview
    const complianceOverview = await this.getComplianceOverview(timeRange);
    report.sections.compliance_overview = complianceOverview;

    // Policy Adherence
    const policyAdherence = await this.getPolicyAdherence(timeRange);
    report.sections.policy_adherence = policyAdherence;

    // Exceptions
    const exceptions = await this.getComplianceExceptions(timeRange);
    report.sections.exceptions = exceptions;

    // Remediation Status
    const remediationStatus = await this.getRemediationStatus(timeRange);
    report.sections.remediation_status = remediationStatus;

    return report;
  }

  static async generateRiskReport(timeRange, options = {}) {
    const report = {
      report_type: 'risk_management',
      generated_at: new Date().toISOString(),
      time_range: timeRange,
      sections: {}
    };

    // Risk Overview
    const riskOverview = await this.getRiskOverview(timeRange);
    report.sections.risk_overview = riskOverview;

    // Top Risks
    const topRisks = await this.getTopRisks(timeRange);
    report.sections.top_risks = topRisks;

    // Mitigation Progress
    const mitigationProgress = await this.getMitigationProgress(timeRange);
    report.sections.mitigation_progress = mitigationProgress;

    // Emerging Risks
    const emergingRisks = await this.getEmergingRisks(timeRange);
    report.sections.emerging_risks = emergingRisks;

    return report;
  }

  // Helper methods for data retrieval
  static async getKeyMetrics(timeRange) {
    const query = `
      SELECT 
        metric_name,
        AVG(value) as avg_value,
        MAX(value) as max_value,
        MIN(value) as min_value,
        COUNT(*) as data_points
      FROM metric_data
      WHERE collection_timestamp >= $1 
        AND collection_timestamp <= $2
        AND metric_category IN ('kpi', 'governance')
      GROUP BY metric_name
    `;

    const result = await pool.query(query, [timeRange.start_date, timeRange.end_date]);
    
    const metrics = {};
    result.rows.forEach(row => {
      metrics[row.metric_name] = {
        average: parseFloat(row.avg_value),
        maximum: parseFloat(row.max_value),
        minimum: parseFloat(row.min_value),
        data_points: parseInt(row.data_points)
      };
    });

    return metrics;
  }

  static async getComplianceOverview(timeRange) {
    const query = `
      SELECT 
        metric_name,
        value,
        target_value,
        collection_timestamp
      FROM metric_data
      WHERE collection_timestamp >= $1 
        AND collection_timestamp <= $2
        AND metric_category = 'compliance'
      ORDER BY collection_timestamp DESC
    `;

    const result = await pool.query(query, [timeRange.start_date, timeRange.end_date]);
    
    const complianceMetrics = {};
    result.rows.forEach(row => {
      if (!complianceMetrics[row.metric_name] || 
          new Date(row.collection_timestamp) > new Date(complianceMetrics[row.metric_name].timestamp)) {
        complianceMetrics[row.metric_name] = {
          current_value: parseFloat(row.value),
          target_value: parseFloat(row.target_value),
          compliance_percentage: row.target_value ? (parseFloat(row.value) / parseFloat(row.target_value)) * 100 : 0,
          timestamp: row.collection_timestamp
        };
      }
    });

    const totalCompliance = Object.values(complianceMetrics).reduce((sum, metric) => 
      sum + metric.compliance_percentage, 0) / Object.keys(complianceMetrics).length;

    return {
      overall_compliance_percentage: totalCompliance,
      metrics: complianceMetrics,
      total_metrics: Object.keys(complianceMetrics).length
    };
  }

  static async getRiskOverview(timeRange) {
    const query = `
      SELECT 
        metric_name,
        value,
        target_value,
        collection_timestamp,
        metadata
      FROM metric_data
      WHERE collection_timestamp >= $1 
        AND collection_timestamp <= $2
        AND metric_category = 'risk'
      ORDER BY collection_timestamp DESC
    `;

    const result = await pool.query(query, [timeRange.start_date, timeRange.end_date]);
    
    const riskMetrics = {};
    let totalRiskScore = 0;
    let highRiskCount = 0;

    result.rows.forEach(row => {
      if (!riskMetrics[row.metric_name] || 
          new Date(row.collection_timestamp) > new Date(riskMetrics[row.metric_name].timestamp)) {
        const riskValue = parseFloat(row.value);
        riskMetrics[row.metric_name] = {
          current_value: riskValue,
          target_value: parseFloat(row.target_value),
          timestamp: row.collection_timestamp,
          metadata: row.metadata
        };

        totalRiskScore += riskValue;
        if (riskValue > 7) highRiskCount++; // Assuming 1-10 risk scale
      }
    });

    const averageRiskScore = Object.keys(riskMetrics).length > 0 ? 
      totalRiskScore / Object.keys(riskMetrics).length : 0;

    return {
      average_risk_score: averageRiskScore,
      high_risk_count: highRiskCount,
      total_risks: Object.keys(riskMetrics).length,
      metrics: riskMetrics
    };
  }

  static async getStrategicAlignment(timeRange) {
    // This would typically integrate with strategic planning systems
    // For now, return a placeholder structure
    return {
      alignment_score: 85,
      strategic_initiatives_on_track: 12,
      strategic_initiatives_at_risk: 3,
      strategic_initiatives_total: 15,
      key_alignments: [
        'Digital transformation initiatives',
        'Risk management improvements',
        'Compliance automation'
      ]
    };
  }

  static async getMajorIssues(timeRange) {
    const query = `
      SELECT 
        metric_name,
        value,
        target_value,
        collection_timestamp
      FROM metric_data
      WHERE collection_timestamp >= $1 
        AND collection_timestamp <= $2
        AND (
          (target_value IS NOT NULL AND value < target_value * 0.8) OR
          (metric_category = 'risk' AND value > 7)
        )
      ORDER BY collection_timestamp DESC
      LIMIT 10
    `;

    const result = await pool.query(query, [timeRange.start_date, timeRange.end_date]);
    
    return result.rows.map(row => ({
      metric_name: row.metric_name,
      current_value: parseFloat(row.value),
      target_value: parseFloat(row.target_value),
      severity: this.calculateIssueSeverity(row.value, row.target_value),
      timestamp: row.collection_timestamp
    }));
  }

  static async getInvestmentROI(timeRange) {
    const query = `
      SELECT 
        SUM(CASE WHEN metric_name = 'governance_investment' THEN value ELSE 0 END) as total_investment,
        SUM(CASE WHEN metric_name = 'business_value_realization' THEN value ELSE 0 END) as total_value,
        SUM(CASE WHEN metric_name = 'cost_savings' THEN value ELSE 0 END) as total_savings
      FROM metric_data
      WHERE collection_timestamp >= $1 
        AND collection_timestamp <= $2
        AND metric_category = 'financial'
    `;

    const result = await pool.query(query, [timeRange.start_date, timeRange.end_date]);
    const row = result.rows[0];

    const investment = parseFloat(row.total_investment) || 0;
    const value = parseFloat(row.total_value) || 0;
    const savings = parseFloat(row.total_savings) || 0;
    const totalReturn = value + savings;
    const roi = investment > 0 ? ((totalReturn - investment) / investment) * 100 : 0;

    return {
      total_investment: investment,
      total_value_realized: value,
      total_cost_savings: savings,
      total_return: totalReturn,
      roi_percentage: roi
    };
  }

  static async getPolicyAdherence(timeRange) {
    const query = `
      SELECT 
        metric_name,
        AVG(value) as avg_adherence,
        COUNT(*) as measurements
      FROM metric_data
      WHERE collection_timestamp >= $1 
        AND collection_timestamp <= $2
        AND metric_name LIKE '%_policy_compliance'
      GROUP BY metric_name
      ORDER BY avg_adherence ASC
    `;

    const result = await pool.query(query, [timeRange.start_date, timeRange.end_date]);
    
    return result.rows.map(row => ({
      policy_name: row.metric_name.replace('_policy_compliance', ''),
      adherence_percentage: parseFloat(row.avg_adherence),
      measurements: parseInt(row.measurements)
    }));
  }

  static async getComplianceExceptions(timeRange) {
    // This would typically query an exceptions tracking system
    // For now, return a placeholder structure
    return {
      total_exceptions: 15,
      approved_exceptions: 12,
      pending_exceptions: 3,
      expired_exceptions: 2,
      exceptions_by_category: {
        security: 8,
        privacy: 4,
        operational: 3
      }
    };
  }

  static async getRemediationStatus(timeRange) {
    const query = `
      SELECT 
        metric_name,
        value,
        collection_timestamp
      FROM metric_data
      WHERE collection_timestamp >= $1 
        AND collection_timestamp <= $2
        AND metric_name LIKE '%_remediation_rate'
      ORDER BY collection_timestamp DESC
    `;

    const result = await pool.query(query, [timeRange.start_date, timeRange.end_date]);
    
    const remediationMetrics = {};
    result.rows.forEach(row => {
      const category = row.metric_name.replace('_remediation_rate', '');
      if (!remediationMetrics[category] || 
          new Date(row.collection_timestamp) > new Date(remediationMetrics[category].timestamp)) {
        remediationMetrics[category] = {
          rate: parseFloat(row.value),
          timestamp: row.collection_timestamp
        };
      }
    });

    return remediationMetrics;
  }

  static async getTopRisks(timeRange) {
    const query = `
      SELECT 
        metric_name,
        value as risk_score,
        metadata,
        collection_timestamp
      FROM metric_data
      WHERE collection_timestamp >= $1 
        AND collection_timestamp <= $2
        AND metric_category = 'risk'
      ORDER BY value DESC
      LIMIT 10
    `;

    const result = await pool.query(query, [timeRange.start_date, timeRange.end_date]);
    
    return result.rows.map(row => ({
      risk_name: row.metric_name,
      risk_score: parseFloat(row.risk_score),
      severity: this.calculateRiskSeverity(row.risk_score),
      metadata: row.metadata,
      timestamp: row.collection_timestamp
    }));
  }

  static async getMitigationProgress(timeRange) {
    // This would typically integrate with risk management systems
    return {
      total_mitigations: 25,
      completed_mitigations: 18,
      in_progress_mitigations: 5,
      overdue_mitigations: 2,
      average_completion_time: 14 // days
    };
  }

  static async getEmergingRisks(timeRange) {
    // This would typically use trend analysis to identify emerging risks
    return [
      {
        risk_name: 'Cloud Security Misconfiguration',
        trend: 'increasing',
        confidence: 0.8,
        potential_impact: 'high'
      },
      {
        risk_name: 'Third-party Vendor Risk',
        trend: 'increasing',
        confidence: 0.7,
        potential_impact: 'medium'
      }
    ];
  }

  static calculateIssueSeverity(currentValue, targetValue) {
    if (!targetValue) return 'unknown';
    const ratio = currentValue / targetValue;
    if (ratio < 0.5) return 'critical';
    if (ratio < 0.7) return 'high';
    if (ratio < 0.9) return 'medium';
    return 'low';
  }

  static calculateRiskSeverity(riskScore) {
    if (riskScore >= 8) return 'critical';
    if (riskScore >= 6) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  }
}

// API Endpoints

// GET /api/reporting/templates - List available report templates
router.get('/templates',
  authenticateToken,
  requirePermissions('reporting.read'),
  async (req, res) => {
    try {
      await logActivity(
        req.user.user_id,
        'report_templates_listed',
        'Report templates listed',
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: {
          templates: REPORT_TEMPLATES
        }
      });

    } catch (error) {
      console.error('Error listing report templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list report templates',
        error: error.message
      });
    }
  }
);

// POST /api/reporting/generate - Generate a report
router.post('/generate',
  authenticateToken,
  requirePermissions('reporting.write'),
  [
    body('report_type').isIn(Object.keys(REPORT_TEMPLATES)).withMessage('Invalid report type'),
    body('time_range.start_date').isISO8601().withMessage('Invalid start date'),
    body('time_range.end_date').isISO8601().withMessage('Invalid end date')
  ],
  async (req, res) => {
    const client = await pool.connect();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { report_type, time_range, options = {} } = req.body;

      await client.query('BEGIN');

      // Generate the report based on type
      let reportData;
      switch (report_type) {
        case 'executive_summary':
          reportData = await ReportGenerator.generateExecutiveSummary(time_range, options);
          break;
        case 'compliance_report':
          reportData = await ReportGenerator.generateComplianceReport(time_range, options);
          break;
        case 'risk_management':
          reportData = await ReportGenerator.generateRiskReport(time_range, options);
          break;
        default:
          throw new Error(`Report generation not implemented for type: ${report_type}`);
      }

      // Save report to database
      const reportId = generateReportId();
      const insertQuery = `
        INSERT INTO generated_reports (
          report_id, report_type, report_data, time_range_start, time_range_end,
          generated_by, generation_options, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        reportId,
        report_type,
        JSON.stringify(reportData),
        time_range.start_date,
        time_range.end_date,
        req.user.user_id,
        JSON.stringify(options),
        'completed'
      ];

      const result = await client.query(insertQuery, values);
      const savedReport = result.rows[0];

      await client.query('COMMIT');

      await logActivity(
        req.user.user_id,
        'report_generated',
        `Report generated: ${report_type}`,
        req.ip,
        req.get('User-Agent'),
        { report_id: reportId, report_type, time_range }
      );

      res.status(201).json({
        success: true,
        message: 'Report generated successfully',
        data: {
          report_id: reportId,
          report_type,
          report_data: reportData,
          generated_at: savedReport.created_at
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error.message
      });
    } finally {
      client.release();
    }
  }
);

// GET /api/reporting/reports - List generated reports
router.get('/reports',
  authenticateToken,
  requirePermissions('reporting.read'),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, report_type, status } = req.query;
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (report_type) {
        paramCount++;
        whereConditions.push(`report_type = $${paramCount}`);
        queryParams.push(report_type);
      }

      if (status) {
        paramCount++;
        whereConditions.push(`status = $${paramCount}`);
        queryParams.push(status);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const reportsQuery = `
        SELECT 
          report_id,
          report_type,
          time_range_start,
          time_range_end,
          status,
          created_at,
          u.username as generated_by_username
        FROM generated_reports gr
        LEFT JOIN users u ON gr.generated_by = u.user_id
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      queryParams.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM generated_reports gr
        ${whereClause}
      `;

      const [reportsResult, countResult] = await Promise.all([
        pool.query(reportsQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2))
      ]);

      const reports = reportsResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: total,
            items_per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error listing reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list reports',
        error: error.message
      });
    }
  }
);

// GET /api/reporting/reports/:id - Get specific report
router.get('/reports/:id',
  authenticateToken,
  requirePermissions('reporting.read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          gr.*,
          u.username as generated_by_username
        FROM generated_reports gr
        LEFT JOIN users u ON gr.generated_by = u.user_id
        WHERE report_id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      const report = result.rows[0];

      await logActivity(
        req.user.user_id,
        'report_accessed',
        `Report accessed: ${id}`,
        req.ip,
        req.get('User-Agent'),
        { report_id: id, report_type: report.report_type }
      );

      res.json({
        success: true,
        data: { report }
      });

    } catch (error) {
      console.error('Error retrieving report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve report',
        error: error.message
      });
    }
  }
);

// ============================================================================
// CUSTOM REPORT TEMPLATES MANAGEMENT
// ============================================================================

// GET /api/reporting/custom-templates - List custom report templates
router.get('/custom-templates',
  authenticateToken,
  requirePermissions('reporting.read'),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, category, is_public, created_by } = req.query;
      const offset = (page - 1) * limit;

      let whereConditions = ['is_active = true'];
      let queryParams = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        whereConditions.push(`category = $${paramCount}`);
        queryParams.push(category);
      }

      if (is_public !== undefined) {
        paramCount++;
        whereConditions.push(`is_public = $${paramCount}`);
        queryParams.push(is_public === 'true');
      }

      if (created_by) {
        paramCount++;
        whereConditions.push(`created_by = $${paramCount}`);
        queryParams.push(created_by);
      }

      // If not public, only show user's own templates or public ones
      if (is_public !== 'true') {
        paramCount++;
        whereConditions.push(`(is_public = true OR created_by = $${paramCount})`);
        queryParams.push(req.user.user_id);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      const templatesQuery = `
        SELECT 
          template_id,
          template_name,
          description,
          category,
          tags,
          is_public,
          created_at,
          last_used_at,
          usage_count,
          u.username as created_by_username
        FROM custom_report_templates crt
        LEFT JOIN users u ON crt.created_by = u.user_id
        ${whereClause}
        ORDER BY usage_count DESC, created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      queryParams.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM custom_report_templates crt
        ${whereClause}
      `;

      const [templatesResult, countResult] = await Promise.all([
        pool.query(templatesQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2))
      ]);

      const templates = templatesResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          templates,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: total,
            items_per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error listing custom templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list custom templates',
        error: error.message
      });
    }
  }
);

// POST /api/reporting/custom-templates - Create custom report template
router.post('/custom-templates',
  authenticateToken,
  requirePermissions('reporting.custom'),
  [
    body('template_name').isLength({ min: 1, max: 255 }).withMessage('Template name is required'),
    body('template_config').isObject().withMessage('Template configuration is required'),
    body('data_sources').isArray().withMessage('Data sources must be an array')
  ],
  async (req, res) => {
    const client = await pool.connect();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        template_name,
        description,
        template_config,
        data_sources,
        visualization_config = {},
        filters_config = {},
        parameters_config = {},
        output_format = 'json',
        category,
        tags = [],
        is_public = false
      } = req.body;

      await client.query('BEGIN');

      const templateId = `TPL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const insertQuery = `
        INSERT INTO custom_report_templates (
          template_id, template_name, description, created_by, is_public,
          template_config, data_sources, visualization_config, filters_config,
          parameters_config, output_format, category, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        templateId,
        template_name,
        description,
        req.user.user_id,
        is_public,
        JSON.stringify(template_config),
        data_sources,
        JSON.stringify(visualization_config),
        JSON.stringify(filters_config),
        JSON.stringify(parameters_config),
        output_format,
        category,
        tags
      ];

      const result = await client.query(insertQuery, values);
      const savedTemplate = result.rows[0];

      await client.query('COMMIT');

      await logActivity(
        req.user.user_id,
        'custom_template_created',
        `Custom report template created: ${template_name}`,
        req.ip,
        req.get('User-Agent'),
        { template_id: templateId, template_name }
      );

      res.status(201).json({
        success: true,
        message: 'Custom report template created successfully',
        data: { template: savedTemplate }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating custom template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create custom template',
        error: error.message
      });
    } finally {
      client.release();
    }
  }
);

// GET /api/reporting/custom-templates/:id - Get specific custom template
router.get('/custom-templates/:id',
  authenticateToken,
  requirePermissions('reporting.read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          crt.*,
          u.username as created_by_username
        FROM custom_report_templates crt
        LEFT JOIN users u ON crt.created_by = u.user_id
        WHERE template_id = $1 AND is_active = true
          AND (is_public = true OR created_by = $2)
      `;

      const result = await pool.query(query, [id, req.user.user_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Custom template not found or access denied'
        });
      }

      const template = result.rows[0];

      // Update usage tracking
      await pool.query(
        'UPDATE custom_report_templates SET last_used_at = CURRENT_TIMESTAMP, usage_count = usage_count + 1 WHERE template_id = $1',
        [id]
      );

      res.json({
        success: true,
        data: { template }
      });

    } catch (error) {
      console.error('Error retrieving custom template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve custom template',
        error: error.message
      });
    }
  }
);

// PUT /api/reporting/custom-templates/:id - Update custom template
router.put('/custom-templates/:id',
  authenticateToken,
  requirePermissions('reporting.custom'),
  async (req, res) => {
    const client = await pool.connect();
    
    try {
      const { id } = req.params;
      const updateFields = req.body;

      // Check if user owns the template or has admin permissions
      const checkQuery = `
        SELECT created_by FROM custom_report_templates 
        WHERE template_id = $1 AND is_active = true
      `;
      const checkResult = await client.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      const template = checkResult.rows[0];
      if (template.created_by !== req.user.user_id && !req.user.permissions.includes('reporting.admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await client.query('BEGIN');

      // Build dynamic update query
      const allowedFields = [
        'template_name', 'description', 'template_config', 'data_sources',
        'visualization_config', 'filters_config', 'parameters_config',
        'output_format', 'category', 'tags', 'is_public'
      ];

      const updatePairs = [];
      const values = [];
      let paramCount = 0;

      Object.keys(updateFields).forEach(field => {
        if (allowedFields.includes(field)) {
          paramCount++;
          updatePairs.push(`${field} = $${paramCount}`);
          
          if (typeof updateFields[field] === 'object' && !Array.isArray(updateFields[field])) {
            values.push(JSON.stringify(updateFields[field]));
          } else {
            values.push(updateFields[field]);
          }
        }
      });

      if (updatePairs.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      updatePairs.push(`updated_at = CURRENT_TIMESTAMP`);
      updatePairs.push(`version = version + 1`);

      const updateQuery = `
        UPDATE custom_report_templates 
        SET ${updatePairs.join(', ')}
        WHERE template_id = $${paramCount + 1}
        RETURNING *
      `;

      values.push(id);

      const result = await client.query(updateQuery, values);
      const updatedTemplate = result.rows[0];

      await client.query('COMMIT');

      await logActivity(
        req.user.user_id,
        'custom_template_updated',
        `Custom report template updated: ${id}`,
        req.ip,
        req.get('User-Agent'),
        { template_id: id }
      );

      res.json({
        success: true,
        message: 'Custom template updated successfully',
        data: { template: updatedTemplate }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating custom template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update custom template',
        error: error.message
      });
    } finally {
      client.release();
    }
  }
);

// DELETE /api/reporting/custom-templates/:id - Delete custom template
router.delete('/custom-templates/:id',
  authenticateToken,
  requirePermissions('reporting.custom'),
  async (req, res) => {
    const client = await pool.connect();
    
    try {
      const { id } = req.params;

      // Check if user owns the template or has admin permissions
      const checkQuery = `
        SELECT created_by, template_name FROM custom_report_templates 
        WHERE template_id = $1 AND is_active = true
      `;
      const checkResult = await client.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      const template = checkResult.rows[0];
      if (template.created_by !== req.user.user_id && !req.user.permissions.includes('reporting.admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await client.query('BEGIN');

      // Soft delete
      await client.query(
        'UPDATE custom_report_templates SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE template_id = $1',
        [id]
      );

      await client.query('COMMIT');

      await logActivity(
        req.user.user_id,
        'custom_template_deleted',
        `Custom report template deleted: ${template.template_name}`,
        req.ip,
        req.get('User-Agent'),
        { template_id: id }
      );

      res.json({
        success: true,
        message: 'Custom template deleted successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting custom template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete custom template',
        error: error.message
      });
    } finally {
      client.release();
    }
  }
);

// ============================================================================
// REPORT EXPORT AND DOWNLOAD
// ============================================================================

// GET /api/reporting/reports/:id/export - Export report in various formats
router.get('/reports/:id/export',
  authenticateToken,
  requirePermissions('reporting.read'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { format = 'json' } = req.query;

      // Get the report
      const reportQuery = `
        SELECT * FROM generated_reports 
        WHERE report_id = $1 AND status = 'completed'
      `;
      const reportResult = await pool.query(reportQuery, [id]);

      if (reportResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Report not found or not completed'
        });
      }

      const report = reportResult.rows[0];
      const reportData = JSON.parse(report.report_data);

      // Update download count
      await pool.query(
        'UPDATE generated_reports SET download_count = download_count + 1 WHERE report_id = $1',
        [id]
      );

      await logActivity(
        req.user.user_id,
        'report_exported',
        `Report exported: ${id} (${format})`,
        req.ip,
        req.get('User-Agent'),
        { report_id: id, export_format: format }
      );

      switch (format.toLowerCase()) {
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="report-${id}.json"`);
          res.json(reportData);
          break;

        case 'csv':
          // Convert report data to CSV format
          const csvData = convertToCSV(reportData);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="report-${id}.csv"`);
          res.send(csvData);
          break;

        case 'pdf':
          // For PDF generation, you would typically use a library like puppeteer or jsPDF
          // For now, return a placeholder response
          res.status(501).json({
            success: false,
            message: 'PDF export not yet implemented'
          });
          break;

        default:
          res.status(400).json({
            success: false,
            message: 'Unsupported export format'
          });
      }

    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export report',
        error: error.message
      });
    }
  }
);

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const flattenObject = (obj, prefix = '') => {
    const flattened = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, flattenObject(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }
    return flattened;
  };

  const flattened = flattenObject(data);
  const headers = Object.keys(flattened);
  const values = Object.values(flattened);

  const csvHeaders = headers.join(',');
  const csvValues = values.map(value => 
    typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
  ).join(',');

  return `${csvHeaders}\n${csvValues}`;
}

// ============================================================================
// REPORT SHARING AND COLLABORATION
// ============================================================================

// POST /api/reporting/reports/:id/share - Share report with other users
router.post('/reports/:id/share',
  authenticateToken,
  requirePermissions('reporting.read'),
  [
    body('shared_with').isArray().withMessage('shared_with must be an array of user IDs'),
    body('share_type').isIn(['view', 'download', 'edit']).withMessage('Invalid share type')
  ],
  async (req, res) => {
    const client = await pool.connect();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { shared_with, share_type, expires_at } = req.body;

      // Check if report exists and user has access
      const reportQuery = `
        SELECT * FROM generated_reports 
        WHERE report_id = $1 AND (generated_by = $2 OR $2 = ANY(
          SELECT shared_with FROM report_sharing WHERE report_id = $1 AND share_type IN ('edit', 'download')
        ))
      `;
      const reportResult = await client.query(reportQuery, [id, req.user.user_id]);

      if (reportResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Report not found or access denied'
        });
      }

      await client.query('BEGIN');

      const sharePromises = shared_with.map(async (userId) => {
        const sharingId = `SHR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const insertQuery = `
          INSERT INTO report_sharing (
            sharing_id, report_id, shared_by, shared_with, share_type, expires_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (report_id, shared_with) 
          DO UPDATE SET 
            share_type = EXCLUDED.share_type,
            expires_at = EXCLUDED.expires_at,
            created_at = CURRENT_TIMESTAMP
          RETURNING *
        `;

        return client.query(insertQuery, [
          sharingId, id, req.user.user_id, userId, share_type, expires_at
        ]);
      });

      await Promise.all(sharePromises);
      await client.query('COMMIT');

      await logActivity(
        req.user.user_id,
        'report_shared',
        `Report shared: ${id}`,
        req.ip,
        req.get('User-Agent'),
        { report_id: id, shared_with, share_type }
      );

      res.json({
        success: true,
        message: 'Report shared successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error sharing report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to share report',
        error: error.message
      });
    } finally {
      client.release();
    }
  }
);

// GET /api/reporting/reports/:id/shares - Get report sharing information
router.get('/reports/:id/shares',
  authenticateToken,
  requirePermissions('reporting.read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user has access to the report
      const accessQuery = `
        SELECT 1 FROM generated_reports 
        WHERE report_id = $1 AND (
          generated_by = $2 OR 
          $2 = ANY(SELECT shared_with FROM report_sharing WHERE report_id = $1)
        )
      `;
      const accessResult = await pool.query(accessQuery, [id, req.user.user_id]);

      if (accessResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Report not found or access denied'
        });
      }

      const sharesQuery = `
        SELECT 
          rs.*,
          u1.username as shared_by_username,
          u2.username as shared_with_username
        FROM report_sharing rs
        LEFT JOIN users u1 ON rs.shared_by = u1.user_id
        LEFT JOIN users u2 ON rs.shared_with = u2.user_id
        WHERE rs.report_id = $1
        ORDER BY rs.created_at DESC
      `;

      const result = await pool.query(sharesQuery, [id]);

      res.json({
        success: true,
        data: { shares: result.rows }
      });

    } catch (error) {
      console.error('Error retrieving report shares:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve report shares',
        error: error.message
      });
    }
  }
);

module.exports = router;