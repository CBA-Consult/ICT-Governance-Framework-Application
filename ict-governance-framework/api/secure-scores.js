

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
// --- New database-centric helper functions ---
async function getLatestSecureScore() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM secure_score ORDER BY created_datetime DESC LIMIT 1;
    `);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

async function getHistoricalSecureScores(timeRangeInDays) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM secure_score
      WHERE created_datetime >= NOW() - INTERVAL '${timeRangeInDays} days'
      ORDER BY created_datetime DESC;
    `);
    return result.rows;
  } finally {
    client.release();
  }
}

async function getControlScoresForScore(secureScoreId) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM control_score WHERE secure_score_id = $1;
    `, [secureScoreId]);
    return result.rows;
  } finally {
    client.release();
  }
}

// --- Refactored /dashboard endpoint ---
router.get('/dashboard', authenticateToken, requirePermission('view_security_metrics'), async (req, res) => {
  try {
    const { timeRange = '30' } = req.query;
    const currentScore = await getLatestSecureScore();
    if (!currentScore) {
      return res.status(404).json({ error: 'No secure score data available' });
    }
    const historicalData = await getHistoricalSecureScores(parseInt(timeRange));
    const controlScores = await getControlScoresForScore(currentScore.id);

    // Example: implemented controls logic (customize as needed)
    const implementedControls = controlScores.filter(ctrl => ctrl.implementation_status === 'Implemented').length;
    const controlsImplementationRate = controlScores.length > 0 ? Math.round((implementedControls / controlScores.length) * 100) : 0;

    // Example: trend calculation (customize as needed)
    const previousScore = historicalData.length > 1 ? historicalData[1] : null;
    const scoreDelta = previousScore ? currentScore.current_score - previousScore.current_score : 0;
    const percentageDelta = previousScore ? ((currentScore.current_score / currentScore.max_score) * 100) - ((previousScore.current_score / previousScore.max_score) * 100) : 0;

    // Example: trend direction
    const trend = {
      direction: scoreDelta > 0 ? 'up' : scoreDelta < 0 ? 'down' : 'stable',
      change: scoreDelta
    };

    // Example: trend data for chart (last 30 days)
    const trendData = historicalData.slice(0, 30).map(row => ({
      date: row.created_datetime,
      score: row.current_score
    }));

    // Example: compliance impact (customize as needed)
    // You can use your existing calculateComplianceImpact logic here, passing controlScores

    // Format response for frontend
    res.json({
      data: {
        overview: {
          currentScore: currentScore.current_score || 0,
          maxScore: currentScore.max_score || 0,
          percentage: currentScore.max_score ? Math.round((currentScore.current_score / currentScore.max_score) * 100) : 0,
          trend: { direction: trend.direction, change: trend.change },
          lastUpdated: currentScore.created_datetime || new Date().toISOString()
        },
        trends: trendData,
        controlCategories: controlScores.map(ctrl => ({
          name: ctrl.control_name,
          implemented: ctrl.implementation_status === 'Implemented' ? 1 : 0,
          total: 1
        })),
        topRecommendations: [],
        riskAreas: [],
        complianceImpact: [],
        controlsImplementationRate
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
/**
 * Scheduled job to sync secure scores from Microsoft Graph to the approved normalized PostgreSQL schema.
 */
async function scheduledSync() {
  const client = await pool.connect();
  try {
    console.log('Starting Scheduled Secure Score sync...');
    const accessToken = await getGraphAccessToken();
    // Fetch current secure scores from Microsoft Graph API
    const secureScoreUrl = `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/security/secureScores`;
    const response = await axios.get(secureScoreUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const secureScores = response.data.value || [];

    if (secureScores.length === 0) {
      console.log('Secure Score sync: No scores found to process.');
      return;
    }

    // Process each score within its own transaction for data integrity
    for (const score of secureScores) {
      try {
        await client.query('BEGIN');

        // Upsert vendor_information
        const vi = score.vendorInformation || {};
        const vendorRes = await client.query(
          `INSERT INTO vendor_information (vendor, provider, sub_provider)
           VALUES ($1, $2, $3)
           ON CONFLICT (vendor, provider, sub_provider) DO UPDATE SET vendor = EXCLUDED.vendor
           RETURNING id`,
          [vi.vendor || 'Unknown', vi.provider || 'Unknown', vi.subProvider || null]
        );
        const vendorInformationId = vendorRes.rows[0]?.id;

        // Upsert the main secure_score record
        await client.query(
          `INSERT INTO secure_score (
            id, tenant_id, azure_tenant_id, active_user_count, licensed_user_count, 
            created_datetime, current_score, max_score, vendor_information_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            tenant_id = EXCLUDED.tenant_id,
            active_user_count = EXCLUDED.active_user_count,
            licensed_user_count = EXCLUDED.licensed_user_count,
            created_datetime = EXCLUDED.created_datetime,
            current_score = EXCLUDED.current_score,
            max_score = EXCLUDED.max_score,
            vendor_information_id = EXCLUDED.vendor_information_id;`,
          [
            score.id, score.azureTenantId, score.azureTenantId, score.activeUserCount, 
            score.licensedUserCount, score.createdDateTime, score.currentScore, 
            score.maxScore, vendorInformationId
          ]
        );

        // Clear and insert child records for relational integrity
        await client.query('DELETE FROM average_comparative_score WHERE secure_score_id = $1;', [score.id]);
        await client.query('DELETE FROM control_score WHERE secure_score_id = $1;', [score.id]);

        // Insert average_comparative_score records
        if (Array.isArray(score.averageComparativeScores)) {
          for (const compScore of score.averageComparativeScores) {
            await client.query(
              `INSERT INTO average_comparative_score (secure_score_id, basis, average_score)
               VALUES ($1, $2, $3);`,
              [score.id, compScore.basis, compScore.averageScore]
            );
          }
        }

        // Insert control_score records
        if (Array.isArray(score.controlScores)) {
          for (const ctrlScore of score.controlScores) {
            await client.query(
              `INSERT INTO control_score (
                secure_score_id, control_category, control_name, description, 
                score, score_in_percentage, implementation_status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
              [
                score.id, ctrlScore.controlCategory, ctrlScore.controlName, ctrlScore.description, 
                ctrlScore.score, ctrlScore.scoreInPercentage, ctrlScore.implementationStatus
              ]
            );
          }
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Failed to sync score ID ${score.id}. Rolled back transaction. Error:`, err);
      }
    }
    console.log(`Secure Score sync completed. Processed ${secureScores.length} records into normalized tables.`);
  } catch (err) {
    console.error('Scheduled Secure Score sync failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Attach the sync function to the router object
router.scheduledSync = scheduledSync;

// Export the router (now with scheduledSync attached)
module.exports = router;

/**
 * GET /api/secure-scores
 * Retrieve current secure scores from Microsoft Graph API
 */
router.get('/', authenticateToken, requirePermission('view_security_metrics'), async (req, res) => {
  try {
    const { timeRange = '30' } = req.query;
    // Use the existing helper function to get historical data from the database
    const historicalData = await getHistoricalSecureScores(parseInt(timeRange));

    res.json({
      success: true,
      data: historicalData,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'database',
        timeRange: `${timeRange} days`
      }
    });
  } catch (error) {
    console.error('Error fetching secure scores from database:', error);
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
    // Get current secure score and historical data from database
    const currentScore = await getLatestSecureScore();
    const historicalData = await getHistoricalSecureScores(parseInt(timeRange));
    const controlScores = currentScore ? await getControlScoresForScore(currentScore.id) : [];

    // Executive metrics
    const previousScore = historicalData.length > 1 ? historicalData[1] : null;
    const scoreDelta = previousScore ? currentScore.current_score - previousScore.current_score : 0;
    const percentageDelta = previousScore ? ((currentScore.current_score / currentScore.max_score) * 100) - ((previousScore.current_score / previousScore.max_score) * 100) : 0;

    // Controls implementation
    const implementedControls = controlScores.filter(ctrl => ctrl.implementation_status === 'Implemented').length;
    const controlsImplementationRate = controlScores.length > 0 ? Math.round((implementedControls / controlScores.length) * 100) : 0;
    const pendingImplementation = controlScores.length - implementedControls;

    // Trend analysis
    const trendDirection = scoreDelta > 0 ? 'improving' : scoreDelta < 0 ? 'declining' : 'stable';
    const trendData = historicalData.slice(0, 30).map(row => ({
      date: row.created_datetime,
      score: row.current_score
    }));

    // Compliance impact (reuse calculateComplianceImpact if possible)
    // For now, stub with empty array or implement logic if compliance data is in controlScores
    let complianceFrameworks = [];
    if (typeof calculateComplianceImpact === 'function') {
      complianceFrameworks = calculateComplianceImpact(currentScore, controlScores);
    }
    const avgComplianceScore = complianceFrameworks.length > 0 ? Math.round(complianceFrameworks.reduce((sum, fw) => sum + fw.score, 0) / complianceFrameworks.length) : 0;

    // Risk areas (stub, as risk logic may need more data)
    const riskAreas = [];
    const criticalAlerts = riskAreas.filter(area => area.riskLevel === 'high').length;

    // Executive summary data structure
    const executiveSummary = {
      securityPosture: {
        currentScore: currentScore?.current_score || 0,
        maxScore: currentScore?.max_score || 0,
        percentage: currentScore?.max_score ? Math.round((currentScore.current_score / currentScore.max_score) * 100) : 0,
        scoreDelta: Math.round(scoreDelta),
        percentageDelta: Math.round(percentageDelta * 10) / 10,
        trend: trendDirection,
        lastUpdated: currentScore?.created_datetime || new Date().toISOString(),
        projectedScore: currentScore?.current_score || 0, // No projection logic yet
        projectedPercentage: currentScore?.max_score ? Math.round((currentScore.current_score / currentScore.max_score) * 100) : 0
      },
      controlsStatus: {
        totalControls: controlScores.length,
        implementedControls,
        implementationRate: controlsImplementationRate,
        pendingImplementation,
        criticalGaps: 0 // No risk logic yet
      },
      complianceOverview: {
        averageScore: avgComplianceScore,
        frameworks: complianceFrameworks.map(fw => ({
          name: fw.name,
          score: fw.score,
          status: fw.score >= 95 ? 'excellent' : fw.score >= 85 ? 'good' : fw.score >= 70 ? 'needs_improvement' : 'critical'
        })),
        criticalFrameworks: complianceFrameworks.filter(fw => fw.score < 70).length
      },
      riskLandscape: {
        totalRiskAreas: riskAreas.length,
        highRiskAreas: riskAreas.filter(area => area.riskLevel === 'high').length,
        mediumRiskAreas: riskAreas.filter(area => area.riskLevel === 'medium').length,
        riskTrend: trendDirection,
        criticalAlerts: criticalAlerts
      },
      priorityActions: [], // No recommendations logic yet
      trends: {
        scoreHistory: trendData.slice(-30),
        complianceTrends: complianceFrameworks.map(fw => ({
          framework: fw.name,
          currentScore: fw.score,
          trend: 'stable'
        }))
      },
      executiveAlerts: [
        ...(scoreDelta < -5 ? [{
          type: 'score_decline',
          severity: 'high',
          message: `Security score declined by ${Math.abs(scoreDelta)} points`,
          action: 'Review recent security changes and implement top recommendations'
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
        dataFreshness: 'local-db',
        nextUpdate: new Date(Date.now() + 3600000).toISOString()
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