// File: ict-governance-framework/api/insights-generator.js
// Automated Insights Generation and Natural Language Processing for ICT Governance Framework

const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, query } = require('express-validator');
const { authenticateToken, requirePermission, logActivity } = require('./auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Automated Insights Generator
 * Provides natural language insights, recommendations, and risk assessments
 */
class InsightsGenerator {
  
  /**
   * Generate comprehensive automated insights
   */
  static async generateComprehensiveInsights(metricName, timeRange, options = {}) {
    const {
      includeNaturalLanguage = true,
      includeRecommendations = true,
      includeRiskAssessment = true,
      includeOptimization = true,
      confidenceThreshold = 0.8
    } = options;

    try {
      // Gather all necessary data
      const [
        historicalData,
        trendData,
        anomalies,
        benchmarks,
        correlations
      ] = await Promise.all([
        this.fetchHistoricalMetrics(metricName, timeRange),
        this.analyzeTrendPatterns(metricName, timeRange),
        this.detectAnomalousPatterns(metricName, timeRange),
        this.getBenchmarkComparisons(metricName, timeRange),
        this.findCorrelatedMetrics(metricName, timeRange)
      ]);

      const insights = {
        metric_name: metricName,
        analysis_period: timeRange,
        summary: {},
        detailed_insights: {},
        recommendations: [],
        risk_assessment: {},
        optimization_opportunities: [],
        natural_language_summary: '',
        confidence_score: 0,
        generated_at: new Date().toISOString()
      };

      // Generate summary statistics
      insights.summary = this.generateSummaryStatistics(historicalData);

      // Performance insights
      insights.detailed_insights.performance = this.generatePerformanceInsights(
        historicalData,
        trendData,
        benchmarks
      );

      // Trend insights
      insights.detailed_insights.trends = this.generateTrendInsights(trendData);

      // Anomaly insights
      insights.detailed_insights.anomalies = this.generateAnomalyInsights(anomalies);

      // Correlation insights
      insights.detailed_insights.correlations = this.generateCorrelationInsights(correlations);

      // Risk assessment
      if (includeRiskAssessment) {
        insights.risk_assessment = this.generateRiskAssessment(
          trendData,
          anomalies,
          historicalData
        );
      }

      // Recommendations
      if (includeRecommendations) {
        insights.recommendations = this.generateActionableRecommendations(
          insights.detailed_insights,
          insights.risk_assessment
        );
      }

      // Optimization opportunities
      if (includeOptimization) {
        insights.optimization_opportunities = this.identifyOptimizationOpportunities(
          trendData,
          benchmarks,
          correlations
        );
      }

      // Natural language summary
      if (includeNaturalLanguage) {
        insights.natural_language_summary = this.generateNaturalLanguageSummary(insights);
      }

      // Calculate overall confidence
      insights.confidence_score = this.calculateOverallConfidence(insights);

      return {
        success: true,
        insights: insights
      };

    } catch (error) {
      console.error('Comprehensive insights generation error:', error);
      throw new Error(`Insights generation failed: ${error.message}`);
    }
  }

  /**
   * Generate natural language summary
   */
  static generateNaturalLanguageSummary(insights) {
    const { metric_name, summary, detailed_insights, risk_assessment } = insights;
    
    let narrative = `Analysis of ${metric_name} reveals the following key findings:\n\n`;

    // Performance summary
    if (summary.current_value !== undefined) {
      narrative += `Current Performance: The metric currently stands at ${summary.current_value.toFixed(2)}, `;
      
      if (summary.change_from_previous > 0) {
        narrative += `representing a ${(summary.change_from_previous * 100).toFixed(1)}% increase from the previous period. `;
      } else if (summary.change_from_previous < 0) {
        narrative += `representing a ${Math.abs(summary.change_from_previous * 100).toFixed(1)}% decrease from the previous period. `;
      } else {
        narrative += `showing no significant change from the previous period. `;
      }
    }

    // Trend analysis
    if (detailed_insights.trends) {
      const trend = detailed_insights.trends;
      narrative += `\nTrend Analysis: `;
      
      switch (trend.overall_direction) {
        case 'increasing':
          narrative += `The metric shows a positive upward trend with ${(trend.strength * 100).toFixed(1)}% confidence. `;
          break;
        case 'decreasing':
          narrative += `The metric shows a concerning downward trend with ${(trend.strength * 100).toFixed(1)}% confidence. `;
          break;
        case 'stable':
          narrative += `The metric remains relatively stable with minimal variation. `;
          break;
        default:
          narrative += `The trend pattern is unclear and requires further investigation. `;
      }
    }

    // Risk assessment
    if (risk_assessment && risk_assessment.overall_risk_level) {
      narrative += `\nRisk Assessment: `;
      
      switch (risk_assessment.overall_risk_level) {
        case 'high':
          narrative += `HIGH RISK - Immediate attention required. `;
          break;
        case 'medium':
          narrative += `MEDIUM RISK - Monitor closely and consider preventive actions. `;
          break;
        case 'low':
          narrative += `LOW RISK - Continue current monitoring practices. `;
          break;
      }
    }

    // Anomalies
    if (detailed_insights.anomalies && detailed_insights.anomalies.recent_anomalies > 0) {
      narrative += `\nAnomalies Detected: ${detailed_insights.anomalies.recent_anomalies} anomalous data points were identified in the recent period, suggesting potential issues that warrant investigation. `;
    }

    // Key recommendations
    if (insights.recommendations && insights.recommendations.length > 0) {
      narrative += `\nKey Recommendations:\n`;
      insights.recommendations.slice(0, 3).forEach((rec, index) => {
        narrative += `${index + 1}. ${rec.action} - ${rec.rationale}\n`;
      });
    }

    return narrative;
  }

  /**
   * Generate actionable recommendations
   */
  static generateActionableRecommendations(detailedInsights, riskAssessment) {
    const recommendations = [];

    // Performance-based recommendations
    if (detailedInsights.performance) {
      const perf = detailedInsights.performance;
      
      if (perf.performance_status === 'declining') {
        recommendations.push({
          category: 'performance',
          priority: 'high',
          action: 'Implement immediate performance improvement measures',
          rationale: 'Metric performance is declining and requires urgent attention',
          estimated_impact: 'high',
          timeframe: 'immediate',
          resources_required: ['technical_team', 'management_approval']
        });
      }
      
      if (perf.benchmark_comparison && perf.benchmark_comparison.status === 'below_benchmark') {
        recommendations.push({
          category: 'benchmarking',
          priority: 'medium',
          action: 'Analyze best practices from benchmark leaders',
          rationale: 'Performance is below industry benchmarks',
          estimated_impact: 'medium',
          timeframe: '1-3 months',
          resources_required: ['research_team', 'external_consultants']
        });
      }
    }

    // Trend-based recommendations
    if (detailedInsights.trends) {
      const trends = detailedInsights.trends;
      
      if (trends.overall_direction === 'decreasing' && trends.strength > 0.7) {
        recommendations.push({
          category: 'trend_reversal',
          priority: 'high',
          action: 'Develop trend reversal strategy',
          rationale: 'Strong negative trend detected that could impact long-term objectives',
          estimated_impact: 'high',
          timeframe: '2-4 weeks',
          resources_required: ['strategy_team', 'operational_team']
        });
      }
      
      if (trends.volatility && trends.volatility.level === 'high') {
        recommendations.push({
          category: 'stability',
          priority: 'medium',
          action: 'Implement variance reduction measures',
          rationale: 'High volatility indicates process instability',
          estimated_impact: 'medium',
          timeframe: '1-2 months',
          resources_required: ['process_improvement_team']
        });
      }
    }

    // Risk-based recommendations
    if (riskAssessment) {
      if (riskAssessment.overall_risk_level === 'high') {
        recommendations.push({
          category: 'risk_mitigation',
          priority: 'critical',
          action: 'Activate risk mitigation protocols',
          rationale: 'High risk level detected requiring immediate intervention',
          estimated_impact: 'critical',
          timeframe: 'immediate',
          resources_required: ['risk_management_team', 'executive_approval']
        });
      }
      
      if (riskAssessment.predictive_risks && riskAssessment.predictive_risks.length > 0) {
        recommendations.push({
          category: 'preventive_action',
          priority: 'medium',
          action: 'Implement preventive measures for identified future risks',
          rationale: 'Predictive analysis indicates potential future risks',
          estimated_impact: 'medium',
          timeframe: '2-6 weeks',
          resources_required: ['planning_team', 'operational_team']
        });
      }
    }

    // Anomaly-based recommendations
    if (detailedInsights.anomalies && detailedInsights.anomalies.recent_anomalies > 0) {
      recommendations.push({
        category: 'investigation',
        priority: 'medium',
        action: 'Investigate root causes of detected anomalies',
        rationale: 'Anomalous patterns may indicate underlying issues',
        estimated_impact: 'medium',
        timeframe: '1-2 weeks',
        resources_required: ['data_analysis_team', 'subject_matter_experts']
      });
    }

    // Sort by priority
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return recommendations;
  }

  /**
   * Generate risk assessment
   */
  static generateRiskAssessment(trendData, anomalies, historicalData) {
    const riskFactors = [];
    let overallRiskScore = 0;

    // Trend-based risks
    if (trendData.overall_direction === 'decreasing' && trendData.strength > 0.6) {
      riskFactors.push({
        type: 'trend_risk',
        severity: 'high',
        description: 'Strong negative trend indicates potential system degradation',
        impact: 0.8,
        likelihood: 0.7
      });
      overallRiskScore += 0.8 * 0.7;
    }

    // Volatility risks
    if (trendData.volatility && trendData.volatility.level === 'high') {
      riskFactors.push({
        type: 'volatility_risk',
        severity: 'medium',
        description: 'High volatility indicates process instability',
        impact: 0.6,
        likelihood: 0.8
      });
      overallRiskScore += 0.6 * 0.8;
    }

    // Anomaly risks
    if (anomalies.recent_anomalies > 0) {
      const anomalyRisk = Math.min(anomalies.recent_anomalies / 10, 1); // Normalize to 0-1
      riskFactors.push({
        type: 'anomaly_risk',
        severity: anomalyRisk > 0.7 ? 'high' : anomalyRisk > 0.4 ? 'medium' : 'low',
        description: `${anomalies.recent_anomalies} anomalies detected in recent period`,
        impact: anomalyRisk,
        likelihood: 0.9
      });
      overallRiskScore += anomalyRisk * 0.9;
    }

    // Data quality risks
    const dataQuality = this.assessDataQuality(historicalData);
    if (dataQuality.score < 0.8) {
      riskFactors.push({
        type: 'data_quality_risk',
        severity: 'medium',
        description: 'Poor data quality may affect analysis reliability',
        impact: 0.5,
        likelihood: 0.6
      });
      overallRiskScore += 0.5 * 0.6;
    }

    // Normalize overall risk score
    overallRiskScore = Math.min(overallRiskScore / riskFactors.length, 1);

    let riskLevel;
    if (overallRiskScore > 0.7) {
      riskLevel = 'high';
    } else if (overallRiskScore > 0.4) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      overall_risk_level: riskLevel,
      overall_risk_score: overallRiskScore,
      risk_factors: riskFactors,
      mitigation_urgency: riskLevel === 'high' ? 'immediate' : riskLevel === 'medium' ? 'short_term' : 'long_term',
      assessment_confidence: this.calculateRiskAssessmentConfidence(riskFactors)
    };
  }

  /**
   * Identify optimization opportunities
   */
  static identifyOptimizationOpportunities(trendData, benchmarks, correlations) {
    const opportunities = [];

    // Benchmark-based opportunities
    if (benchmarks && benchmarks.performance_gap) {
      const gap = benchmarks.performance_gap;
      if (gap > 0.1) { // 10% gap
        opportunities.push({
          type: 'benchmark_improvement',
          potential_gain: gap,
          description: `Performance is ${(gap * 100).toFixed(1)}% below benchmark`,
          effort_required: 'medium',
          timeframe: '3-6 months',
          success_probability: 0.7
        });
      }
    }

    // Trend-based opportunities
    if (trendData.overall_direction === 'stable' && trendData.volatility?.level === 'low') {
      opportunities.push({
        type: 'efficiency_optimization',
        potential_gain: 0.15,
        description: 'Stable performance allows for efficiency improvements',
        effort_required: 'low',
        timeframe: '1-3 months',
        success_probability: 0.8
      });
    }

    // Correlation-based opportunities
    if (correlations && correlations.strong_correlations) {
      correlations.strong_correlations.forEach(corr => {
        if (corr.strength > 0.7) {
          opportunities.push({
            type: 'correlation_leverage',
            potential_gain: 0.2,
            description: `Strong correlation with ${corr.metric} can be leveraged for improvement`,
            effort_required: 'medium',
            timeframe: '2-4 months',
            success_probability: 0.6
          });
        }
      });
    }

    // Sort by potential gain
    opportunities.sort((a, b) => b.potential_gain - a.potential_gain);

    return opportunities;
  }

  // Helper methods
  static async fetchHistoricalMetrics(metricName, timeRange) {
    const query = `
      SELECT 
        metric_value,
        collected_at,
        metadata
      FROM collected_metrics 
      WHERE metric_name = $1 
        AND collected_at BETWEEN $2 AND $3
      ORDER BY collected_at ASC
    `;
    
    const result = await pool.query(query, [
      metricName,
      timeRange.start_date,
      timeRange.end_date
    ]);
    
    return result.rows.map(row => ({
      value: parseFloat(row.metric_value),
      timestamp: new Date(row.collected_at),
      metadata: row.metadata
    }));
  }

  static generateSummaryStatistics(data) {
    if (data.length === 0) return {};

    const values = data.map(d => d.value);
    const sortedValues = [...values].sort((a, b) => a - b);
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      current_value: values[values.length - 1],
      previous_value: values.length > 1 ? values[values.length - 2] : null,
      change_from_previous: values.length > 1 ? 
        (values[values.length - 1] - values[values.length - 2]) / values[values.length - 2] : 0,
      mean: mean,
      median: sortedValues[Math.floor(sortedValues.length / 2)],
      std_deviation: stdDev,
      min_value: Math.min(...values),
      max_value: Math.max(...values),
      data_points: values.length,
      coefficient_of_variation: Math.abs(mean) > 0 ? stdDev / Math.abs(mean) : 0
    };
  }

  static assessDataQuality(data) {
    let qualityScore = 1.0;
    const issues = [];

    // Check for missing values
    const missingCount = data.filter(d => d.value === null || d.value === undefined || isNaN(d.value)).length;
    const missingRate = missingCount / data.length;
    
    if (missingRate > 0.1) {
      qualityScore -= 0.3;
      issues.push(`${(missingRate * 100).toFixed(1)}% missing values`);
    }

    // Check for outliers
    const values = data.map(d => d.value).filter(v => !isNaN(v));
    if (values.length > 0) {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
      const outliers = values.filter(v => Math.abs(v - mean) > 3 * stdDev);
      const outlierRate = outliers.length / values.length;
      
      if (outlierRate > 0.05) {
        qualityScore -= 0.2;
        issues.push(`${(outlierRate * 100).toFixed(1)}% outliers detected`);
      }
    }

    // Check data consistency (gaps in time series)
    if (data.length > 1) {
      const timestamps = data.map(d => d.timestamp.getTime()).sort();
      const intervals = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i-1]);
      }
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const inconsistentIntervals = intervals.filter(interval => 
        Math.abs(interval - avgInterval) > avgInterval * 0.5
      ).length;
      
      if (inconsistentIntervals / intervals.length > 0.1) {
        qualityScore -= 0.2;
        issues.push('Inconsistent data collection intervals');
      }
    }

    return {
      score: Math.max(qualityScore, 0),
      issues: issues
    };
  }

  static calculateOverallConfidence(insights) {
    let confidenceFactors = [];

    // Data quality confidence
    if (insights.summary && insights.summary.data_points) {
      const dataPointsConfidence = Math.min(insights.summary.data_points / 100, 1);
      confidenceFactors.push(dataPointsConfidence);
    }

    // Trend confidence
    if (insights.detailed_insights.trends && insights.detailed_insights.trends.strength) {
      confidenceFactors.push(insights.detailed_insights.trends.strength);
    }

    // Risk assessment confidence
    if (insights.risk_assessment && insights.risk_assessment.assessment_confidence) {
      confidenceFactors.push(insights.risk_assessment.assessment_confidence);
    }

    // Default confidence if no factors
    if (confidenceFactors.length === 0) {
      return 0.5;
    }

    // Calculate weighted average
    return confidenceFactors.reduce((sum, conf) => sum + conf, 0) / confidenceFactors.length;
  }

  static calculateRiskAssessmentConfidence(riskFactors) {
    if (riskFactors.length === 0) return 0.5;
    
    // Higher confidence with more risk factors identified
    const factorConfidence = Math.min(riskFactors.length / 5, 1);
    
    // Average likelihood of identified risks
    const avgLikelihood = riskFactors.reduce((sum, factor) => sum + factor.likelihood, 0) / riskFactors.length;
    
    return (factorConfidence + avgLikelihood) / 2;
  }

  // Additional helper methods for comprehensive insights
  static async analyzeTrendPatterns(metricName, timeRange) {
    // This would integrate with the PredictiveAnalyticsEngine
    const { PredictiveAnalyticsEngine } = require('./predictive-analytics-engine');
    return await PredictiveAnalyticsEngine.comprehensiveTrendAnalysis(metricName, timeRange);
  }

  static async detectAnomalousPatterns(metricName, timeRange) {
    // This would integrate with existing anomaly detection
    const query = `
      SELECT COUNT(*) as anomaly_count
      FROM collected_metrics 
      WHERE metric_name = $1 
        AND collected_at BETWEEN $2 AND $3
        AND metadata->>'anomaly_score' IS NOT NULL
        AND CAST(metadata->>'anomaly_score' AS FLOAT) > 2.0
    `;
    
    const result = await pool.query(query, [
      metricName,
      timeRange.start_date,
      timeRange.end_date
    ]);
    
    return {
      recent_anomalies: parseInt(result.rows[0].anomaly_count) || 0,
      anomaly_rate: 0.05 // Placeholder
    };
  }

  static async getBenchmarkComparisons(metricName, timeRange) {
    // This would integrate with existing benchmark analysis
    return {
      performance_gap: 0.1, // 10% gap
      status: 'below_benchmark',
      benchmark_value: 100,
      current_value: 90
    };
  }

  static async findCorrelatedMetrics(metricName, timeRange) {
    // This would find metrics that correlate with the target metric
    const query = `
      SELECT DISTINCT metric_name
      FROM collected_metrics 
      WHERE metric_name != $1 
        AND collected_at BETWEEN $2 AND $3
      LIMIT 5
    `;
    
    const result = await pool.query(query, [
      metricName,
      timeRange.start_date,
      timeRange.end_date
    ]);
    
    return {
      strong_correlations: result.rows.map(row => ({
        metric: row.metric_name,
        strength: 0.7 + Math.random() * 0.3, // Placeholder correlation
        direction: Math.random() > 0.5 ? 'positive' : 'negative'
      }))
    };
  }

  static generatePerformanceInsights(historicalData, trendData, benchmarks) {
    const currentValue = historicalData.length > 0 ? historicalData[historicalData.length - 1].value : 0;
    const previousValue = historicalData.length > 1 ? historicalData[historicalData.length - 2].value : currentValue;
    
    return {
      current_performance: currentValue,
      performance_change: currentValue - previousValue,
      performance_change_percentage: previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0,
      trend_direction: trendData.overall_direction || 'stable',
      benchmark_comparison: benchmarks,
      performance_status: this.determinePerformanceStatus(currentValue, previousValue, benchmarks)
    };
  }

  static determinePerformanceStatus(current, previous, benchmarks) {
    if (benchmarks && benchmarks.status === 'below_benchmark') {
      return 'below_expectations';
    }
    
    if (current > previous) {
      return 'improving';
    } else if (current < previous) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  static generateAnomalyInsights(anomalies) {
    return {
      recent_anomalies: anomalies.recent_anomalies || 0,
      anomaly_rate: anomalies.anomaly_rate || 0,
      risk_level: anomalies.recent_anomalies > 3 ? 'high' : anomalies.recent_anomalies > 1 ? 'medium' : 'low',
      investigation_required: anomalies.recent_anomalies > 0
    };
  }

  static generateCorrelationInsights(correlations) {
    const strongCorrelations = correlations.strong_correlations?.filter(c => c.strength > 0.7) || [];
    
    return {
      strong_correlations_count: strongCorrelations.length,
      strongest_correlation: strongCorrelations.length > 0 ? strongCorrelations[0] : null,
      correlation_opportunities: strongCorrelations.map(corr => ({
        metric: corr.metric,
        opportunity: `Leverage ${corr.direction} correlation with ${corr.metric} for optimization`,
        strength: corr.strength
      }))
    };
  }
}

// API Endpoints
router.post('/comprehensive-insights', [
  authenticateToken,
  requirePermission('analytics_read'),
  body('metric_name').notEmpty().withMessage('Metric name is required'),
  body('time_range.start_date').isISO8601().withMessage('Valid start date is required'),
  body('time_range.end_date').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { metric_name, time_range, options = {} } = req.body;

    const result = await InsightsGenerator.generateComprehensiveInsights(
      metric_name,
      time_range,
      options
    );

    await logActivity(req.user.user_id, 'comprehensive_insights', 'Comprehensive insights generated', {
      metric_name,
      insight_types: options.insightTypes || ['performance', 'risk', 'optimization', 'prediction']
    });

    res.json({
      success: true,
      message: 'Comprehensive insights generated successfully',
      data: result
    });

  } catch (error) {
    console.error('Comprehensive insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Comprehensive insights generation failed',
      error: error.message
    });
  }
});

router.post('/natural-language-summary', [
  authenticateToken,
  requirePermission('analytics_read'),
  body('metric_name').notEmpty().withMessage('Metric name is required'),
  body('time_range.start_date').isISO8601().withMessage('Valid start date is required'),
  body('time_range.end_date').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { metric_name, time_range, options = {} } = req.body;

    // Generate comprehensive insights first
    const insightsResult = await InsightsGenerator.generateComprehensiveInsights(
      metric_name,
      time_range,
      { ...options, includeNaturalLanguage: true }
    );

    await logActivity(req.user.user_id, 'natural_language_summary', 'Natural language summary generated', {
      metric_name
    });

    res.json({
      success: true,
      message: 'Natural language summary generated successfully',
      data: {
        metric_name,
        summary: insightsResult.insights.natural_language_summary,
        confidence_score: insightsResult.insights.confidence_score,
        generated_at: insightsResult.insights.generated_at
      }
    });

  } catch (error) {
    console.error('Natural language summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Natural language summary generation failed',
      error: error.message
    });
  }
});

router.post('/actionable-recommendations', [
  authenticateToken,
  requirePermission('analytics_read'),
  body('metric_name').notEmpty().withMessage('Metric name is required'),
  body('time_range.start_date').isISO8601().withMessage('Valid start date is required'),
  body('time_range.end_date').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { metric_name, time_range, options = {} } = req.body;

    // Generate comprehensive insights to get recommendations
    const insightsResult = await InsightsGenerator.generateComprehensiveInsights(
      metric_name,
      time_range,
      { ...options, includeRecommendations: true }
    );

    await logActivity(req.user.user_id, 'actionable_recommendations', 'Actionable recommendations generated', {
      metric_name,
      recommendations_count: insightsResult.insights.recommendations.length
    });

    res.json({
      success: true,
      message: 'Actionable recommendations generated successfully',
      data: {
        metric_name,
        recommendations: insightsResult.insights.recommendations,
        risk_alerts: insightsResult.insights.risk_alerts,
        optimization_opportunities: insightsResult.insights.optimization_opportunities,
        generated_at: insightsResult.insights.generated_at
      }
    });

  } catch (error) {
    console.error('Actionable recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Actionable recommendations generation failed',
      error: error.message
    });
  }
});

router.post('/risk-assessment', [
  authenticateToken,
  requirePermission('analytics_read'),
  body('metric_name').notEmpty().withMessage('Metric name is required'),
  body('time_range.start_date').isISO8601().withMessage('Valid start date is required'),
  body('time_range.end_date').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { metric_name, time_range, options = {} } = req.body;

    // Generate comprehensive insights to get risk assessment
    const insightsResult = await InsightsGenerator.generateComprehensiveInsights(
      metric_name,
      time_range,
      { ...options, includeRiskAssessment: true }
    );

    await logActivity(req.user.user_id, 'risk_assessment', 'Risk assessment performed', {
      metric_name,
      risk_level: insightsResult.insights.risk_assessment.overall_risk_level
    });

    res.json({
      success: true,
      message: 'Risk assessment completed successfully',
      data: {
        metric_name,
        risk_assessment: insightsResult.insights.risk_assessment,
        risk_alerts: insightsResult.insights.risk_alerts,
        generated_at: insightsResult.insights.generated_at
      }
    });

  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Risk assessment failed',
      error: error.message
    });
  }
});

router.get('/insights-dashboard/:metric_name', [
  authenticateToken,
  requirePermission('analytics_read')
], async (req, res) => {
  try {
    const { metric_name } = req.params;
    const { days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    const timeRange = {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    };

    // Generate all insights for dashboard
    const [
      comprehensiveInsights,
      trendAnalysis,
      riskAssessment
    ] = await Promise.all([
      InsightsGenerator.generateComprehensiveInsights(metric_name, timeRange),
      InsightsGenerator.analyzeTrendPatterns(metric_name, timeRange),
      InsightsGenerator.generateComprehensiveInsights(metric_name, timeRange, { 
        insightTypes: ['risk'], 
        includeRiskAssessment: true 
      })
    ]);

    const dashboardData = {
      metric_name,
      time_period: `${days} days`,
      summary: comprehensiveInsights.insights.summary,
      natural_language_summary: comprehensiveInsights.insights.natural_language_summary,
      trend_analysis: trendAnalysis,
      risk_assessment: riskAssessment.insights.risk_assessment,
      recommendations: comprehensiveInsights.insights.recommendations.slice(0, 5), // Top 5
      optimization_opportunities: comprehensiveInsights.insights.optimization_opportunities.slice(0, 3), // Top 3
      confidence_score: comprehensiveInsights.insights.confidence_score,
      generated_at: new Date().toISOString()
    };

    await logActivity(req.user.user_id, 'insights_dashboard', 'Insights dashboard accessed', {
      metric_name,
      time_period: days
    });

    res.json({
      success: true,
      message: 'Insights dashboard data retrieved successfully',
      data: dashboardData
    });

  } catch (error) {
    console.error('Insights dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve insights dashboard data',
      error: error.message
    });
  }
});

module.exports = { router, InsightsGenerator };