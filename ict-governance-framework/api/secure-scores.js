// File: ict-governance-framework/api/secure-scores.js
// Microsoft Graph API Secure Score Integration

// ALL IMPORTS AND INITIALIZATIONS MUST BE AT THE TOP
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const axios = require('axios');
// Initialize the router
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Microsoft Graph API configuration
const GRAPH_API_BASE_URL = process.env.GRAPH_API_BASE_URL || 'https://graph.microsoft.com';
const GRAPH_API_VERSION = 'v1.0';

// Dashboard endpoint for frontend
router.get('/dashboard', authenticateToken, requirePermission('view_security_metrics'), async (req, res) => {
  try {
    const { timeRange = '30' } = req.query;
    const accessToken = await getGraphAccessToken();
    const currentScores = await getCurrentSecureScores(accessToken);
    const controlProfiles = await getSecureScoreControlProfiles(accessToken);
    const historicalData = await getHistoricalSecureScores(parseInt(timeRange));

    const currentScore = currentScores[0];
    const previousScore = historicalData.length > 1 ? historicalData[1] : null;
    const scoreDelta = previousScore ? currentScore.currentScore - previousScore.current_score : 0;
    const percentageDelta = previousScore ? ((currentScore.currentScore / currentScore.maxScore) * 100) - previousScore.percentage : 0;
    const topRecommendations = await getTopRecommendations(controlProfiles);
    const projectedScoreIncrease = topRecommendations.slice(0, 5).reduce((sum, rec) => sum + (rec.impactScore * 0.1), 0);
    const projectedScore = currentScore.currentScore + projectedScoreIncrease;
    const implementedControls = controlProfiles.filter(profile => {
      if (profile.controlStateUpdates && profile.controlStateUpdates.length > 0) {
        const latestState = profile.controlStateUpdates[profile.controlStateUpdates.length - 1];
        return latestState.state === 'On' || latestState.state === 'Reviewed';
      }
      return false;
    }).length;
    const controlsImplementationRate = Math.round((implementedControls / controlProfiles.length) * 100);
    const trend = calculateTrend(historicalData);
    const trendData = processTrendData(historicalData.slice(0, 30));
    const riskAreas = identifyRiskAreas(controlProfiles);
    const complianceFrameworks = calculateComplianceImpact(currentScore, controlProfiles);

    // Format response for frontend
    res.json({
      data: {
        overview: {
          currentScore: currentScore?.currentScore || 0,
          maxScore: currentScore?.maxScore || 0,
          percentage: currentScore ? Math.round((currentScore.currentScore / currentScore.maxScore) * 100) : 0,
          trend: { direction: trend.direction, change: trend.change },
          lastUpdated: currentScore?.createdDateTime || new Date().toISOString()
        },
        trends: trendData,
        controlCategories: controlProfiles.map(profile => ({
          name: profile.displayName || profile.name,
          implemented: (profile.controlStateUpdates && profile.controlStateUpdates.length > 0 && ['On', 'Reviewed'].includes(profile.controlStateUpdates[profile.controlStateUpdates.length - 1].state)) ? 1 : 0,
          total: 1
        })),
        topRecommendations: topRecommendations.map(rec => ({
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          impactScore: rec.impactScore,
          implementationCost: rec.implementationCost,
          userImpact: rec.userImpact,
          complianceFrameworks: rec.complianceFrameworks,
          action: rec.action
        })),
        riskAreas: riskAreas.map(area => ({
          area: area.area,
          recommendation: area.recommendation,
          riskLevel: area.riskLevel,
          implementationRate: area.implementationRate
        })),
        complianceImpact: complianceFrameworks.map(fw => ({
          name: fw.name,
          implementedControls: fw.implementedControls,
          totalControls: fw.totalControls,
          score: fw.score
        }))
      }
    });
  } catch (error) {
    console.error('Error in /dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * Get Microsoft Graph API access token
 */
async function getGraphAccessToken() {
  try {
    const tokenEndpoint = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams();
    params.append('client_id', process.env.AZURE_CLIENT_ID);
    params.append('client_secret', process.env.AZURE_CLIENT_SECRET);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('grant_type', 'client_credentials');

    const response = await axios.post(tokenEndpoint, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Graph API access token:', error);
    throw new Error('Failed to authenticate with Microsoft Graph API');
  }
}


// Other functions and router definitions...

// End of the file
// End of the file
module.exports = router;

/**
 * GET /api/secure-scores
 * Retrieve current secure scores from Microsoft Graph API
 */
router.get('/', authenticateToken, requirePermission('view_security_metrics'), async (req, res) => {
  try {
    const { 
      timeRange = '30',
      includeHistory = 'false',
      includeControlScores = 'false'
    } = req.query;

    const accessToken = await getGraphAccessToken();
    
    // Fetch current secure score
    const secureScoreUrl = `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/security/secureScores`;
    const params = new URLSearchParams();
    
    if (timeRange !== 'all') {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      params.append('$filter', `createdDateTime ge ${startDate.toISOString()}`);
    }
    
    params.append('$top', '50');
    params.append('$orderby', 'createdDateTime desc');

    const response = await axios.get(`${secureScoreUrl}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const secureScores = response.data.value;
    
    // Store in database for historical tracking
    await storeSecureScoreData(secureScores);

    // Get control scores if requested
    let controlScores = null;
    if (includeControlScores === 'true' && secureScores.length > 0) {
      controlScores = await getSecureScoreControlProfiles(accessToken);
    }

    // Get historical data from database if requested
    let historicalData = null;
    if (includeHistory === 'true') {
      historicalData = await getHistoricalSecureScores(parseInt(timeRange));
    }

    const result = {
      // You may want to populate this object or remove it if unused
    };
  } catch (error) {
    console.error('Error fetching secure scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch secure scores',
      details: error.message
    });
  }
});

function calculateComplianceImpact(currentScore, controlProfiles) {
  const complianceFrameworks = {};
  
  for (const profile of controlProfiles) {
    if (profile.complianceInformation) {
      for (const compliance of profile.complianceInformation) {
        const framework = compliance.certificationName;
        if (!complianceFrameworks[framework]) {
          complianceFrameworks[framework] = {
            name: framework,
            totalControls: 0,
            implementedControls: 0,
            score: 0
          };
        }
        
        complianceFrameworks[framework].totalControls++;
        if (profile.controlStateUpdates && profile.controlStateUpdates.length > 0) {
          const latestState = profile.controlStateUpdates[profile.controlStateUpdates.length - 1];
          if (latestState.state === 'On' || latestState.state === 'Reviewed') {
            complianceFrameworks[framework].implementedControls++;
          }
        }
      }
    }
  }
  
  // Calculate compliance scores
  Object.values(complianceFrameworks).forEach(framework => {
    framework.score = Math.round((framework.implementedControls / framework.totalControls) * 100);
  });
  
  return Object.values(complianceFrameworks);
}

async function checkForSecureScoreAlerts(currentScore) {
  if (!currentScore) return;
  
  const percentage = (currentScore.currentScore / currentScore.maxScore) * 100;
  
  // Check for significant drops
  const previousScores = await getHistoricalSecureScores(7);
  if (previousScores.length > 1) {
    const previousPercentage = previousScores[1].percentage;
    const drop = previousPercentage - percentage;
    
    if (drop > 5) {
      // Create alert for significant drop
      await createSecureScoreAlert({
        type: 'score_drop',
        severity: drop > 10 ? 'high' : 'medium',
        message: `Secure score dropped by ${drop.toFixed(1)}% in the last update`,
        currentScore: percentage,
        previousScore: previousPercentage
      });
    }
  }
  
  // Check for low score thresholds
  if (percentage < 60) {
    await createSecureScoreAlert({
      type: 'low_score',
      severity: 'high',
      message: `Secure score is critically low at ${percentage.toFixed(1)}%`,
      currentScore: percentage,
      threshold: 60
    });
  }
}

async function createSecureScoreAlert(alertData) {
  const client = await pool.connect();
  try {
    const alertId = `SECURE-SCORE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    await client.query(`
      INSERT INTO alerts (
        id, title, description, severity, status, category, 
        source_system, triggered_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      alertId,
      'Secure Score Alert',
      alertData.message,
      alertData.severity,
      'open',
      'security',
      'secure_score_monitor',
      new Date(),
      JSON.stringify(alertData)
    ]);
  } finally {
    client.release();
  }
}

function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
}

/**
 * GET /api/secure-scores/executive-summary
 * Get CISO executive overview dashboard data
 */
router.get('/executive-summary', authenticateToken, requirePermission('view_security_metrics'), async (req, res) => {
  try {
    const { timeRange = '30' } = req.query;
    
    // Get current secure score data
    const accessToken = await getGraphAccessToken();
    const currentScores = await getCurrentSecureScores(accessToken);
    const controlProfiles = await getSecureScoreControlProfiles(accessToken);
    const historicalData = await getHistoricalSecureScores(parseInt(timeRange));
    
    // Calculate executive metrics
    const currentScore = currentScores[0];
    const previousScore = historicalData.length > 1 ? historicalData[1] : null;
    
    // Calculate score delta
    const scoreDelta = previousScore ? 
      currentScore.currentScore - previousScore.current_score : 0;
    const percentageDelta = previousScore ? 
      ((currentScore.currentScore / currentScore.maxScore) * 100) - previousScore.percentage : 0;
    
    // Calculate projected score with top recommendations
    const topRecommendations = await getTopRecommendations(controlProfiles);
    const projectedScoreIncrease = topRecommendations.slice(0, 5)
      .reduce((sum, rec) => sum + (rec.impactScore * 0.1), 0);
    const projectedScore = currentScore.currentScore + projectedScoreIncrease;
    
    // Calculate controls implementation percentage
    const implementedControls = controlProfiles.filter(profile => {
      if (profile.controlStateUpdates && profile.controlStateUpdates.length > 0) {
        const latestState = profile.controlStateUpdates[profile.controlStateUpdates.length - 1];
        return latestState.state === 'On' || latestState.state === 'Reviewed';
      }
      return false;
    }).length;
    const controlsImplementationRate = Math.round((implementedControls / controlProfiles.length) * 100);
    
    // Generate trend analysis
    const trend = calculateTrend(historicalData);
    const trendData = processTrendData(historicalData.slice(0, 30)); // Last 30 days
    
    // Identify critical areas needing attention
    const riskAreas = identifyRiskAreas(controlProfiles);
    const criticalAlerts = riskAreas.filter(area => area.riskLevel === 'high').length;
    
    // Calculate compliance impact
    const complianceFrameworks = calculateComplianceImpact(currentScore, controlProfiles);
    const avgComplianceScore = complianceFrameworks.length > 0 ? 
      Math.round(complianceFrameworks.reduce((sum, fw) => sum + fw.score, 0) / complianceFrameworks.length) : 0;
    
    // Executive summary data structure
    const executiveSummary = {
      // Key Performance Indicators
      securityPosture: {
        currentScore: currentScore?.currentScore || 0,
        maxScore: currentScore?.maxScore || 0,
        percentage: currentScore ? Math.round((currentScore.currentScore / currentScore.maxScore) * 100) : 0,
        scoreDelta: Math.round(scoreDelta),
        percentageDelta: Math.round(percentageDelta * 10) / 10,
        trend: trend.direction,
        lastUpdated: currentScore?.createdDateTime || new Date().toISOString(),
        projectedScore: Math.round(projectedScore),
        projectedPercentage: currentScore ? Math.round((projectedScore / currentScore.maxScore) * 100) : 0
      },
      
      // Controls Implementation Status
      controlsStatus: {
        totalControls: controlProfiles.length,
        implementedControls: implementedControls,
        implementationRate: controlsImplementationRate,
        pendingImplementation: controlProfiles.length - implementedControls,
        criticalGaps: riskAreas.filter(area => area.riskLevel === 'high').length
      },
      
      // Compliance Overview
      complianceOverview: {
        averageScore: avgComplianceScore,
        frameworks: complianceFrameworks.map(fw => ({
          name: fw.name,
          score: fw.score,
          status: fw.score >= 95 ? 'excellent' : fw.score >= 85 ? 'good' : fw.score >= 70 ? 'needs_improvement' : 'critical'
        })),
        criticalFrameworks: complianceFrameworks.filter(fw => fw.score < 70).length
      },
      
      // Risk and Threat Landscape
      riskLandscape: {
        totalRiskAreas: riskAreas.length,
        highRiskAreas: riskAreas.filter(area => area.riskLevel === 'high').length,
        mediumRiskAreas: riskAreas.filter(area => area.riskLevel === 'medium').length,
        riskTrend: trend.direction === 'improving' ? 'decreasing' : trend.direction === 'declining' ? 'increasing' : 'stable',
        criticalAlerts: criticalAlerts
      },
      
      // Top Priority Actions
      priorityActions: topRecommendations.slice(0, 5).map(rec => ({
        id: rec.id,
        title: rec.title,
        category: rec.category,
        priority: rec.priority,
        impactScore: rec.impactScore,
        estimatedImprovement: Math.round(rec.impactScore * 0.1) + ' points'
      })),
      
      // Historical Trends (for charts)
      trends: {
        scoreHistory: trendData.slice(-30), // Last 30 days
        complianceTrends: complianceFrameworks.map(fw => ({
          framework: fw.name,
          currentScore: fw.score,
          trend: 'stable' // Would need historical compliance data for real trends
        }))
      },
      
      // Executive Alerts
      executiveAlerts: [
        ...(scoreDelta < -5 ? [{
          type: 'score_decline',
          severity: 'high',
          message: `Security score declined by ${Math.abs(scoreDelta)} points`,
          action: 'Review recent security changes and implement top recommendations'
        }] : []),
        ...(criticalAlerts > 0 ? [{
          type: 'critical_risks',
          severity: 'high',
          message: `${criticalAlerts} critical risk areas identified`,
          action: 'Immediate attention required for high-risk security controls'
        }] : []),
        ...(controlsImplementationRate < 70 ? [{
          type: 'low_implementation',
          severity: 'medium',
          message: `Only ${controlsImplementationRate}% of security controls implemented`,
          action: 'Accelerate security controls implementation program'
        }] : [])
      ]
    };

    res.json({
      success: true,
      data: executiveSummary,
      timestamp: new Date().toISOString(),
      metadata: {
        timeRange: timeRange,
        dataFreshness: 'real-time',
        nextUpdate: new Date(Date.now() + 3600000).toISOString() // Next hour
      }
    });

  } catch (error) {
    console.error('Error generating CISO executive summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate executive summary',
      details: error.message
    });
  }
});

module.exports = router;
