

// File: ict-governance-framework/api/secure-scores.js
// Microsoft Graph API Secure Score Integration

// ALL IMPORTS AND INITIALIZATIONS MUST BE AT THE TOP
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const axios = require('axios');


// Initialize the router
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Microsoft Graph API configuration
const GRAPH_API_BASE_URL = process.env.GRAPH_API_BASE_URL || 'https://graph.microsoft.com';
const GRAPH_API_VERSION = 'v1.0';

// --- Database helpers (aligned with db-schema.sql secure_scores tables) ---
async function getLatestSecureScore() {
  const result = await pool.query(`
    SELECT * FROM secure_scores ORDER BY created_date_time DESC LIMIT 1
  `);
  return result.rows[0] || null;
}

async function getHistoricalSecureScores(timeRangeInDays) {
  const result = await pool.query(`
    SELECT * FROM secure_scores
    WHERE created_date_time >= NOW() - ($1 || ' days')::interval
    ORDER BY created_date_time DESC
  `, [String(timeRangeInDays)]);
  return result.rows;
}

async function getControlProfiles() {
  const result = await pool.query(`
    SELECT * FROM secure_score_control_profiles
    WHERE deprecated = false OR deprecated IS NULL
    ORDER BY category, control_name
  `);
  return result.rows;
}

async function getTopRecommendations(limit = 5) {
  const result = await pool.query(`
    SELECT title, description, category, priority, impact_score, status
    FROM secure_score_recommendations
    WHERE status IN ('open', 'in_progress')
    ORDER BY
      CASE priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
      END,
      impact_score DESC NULLS LAST
    LIMIT $1
  `, [limit]);
  return result.rows;
}

function isGraphConfigured() {
  return !!(process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET);
}

function scorePercentage(row) {
  if (!row) return 0;
  if (row.percentage != null) return Number(row.percentage);
  if (!row.max_score) return 0;
  return Math.round((row.current_score / row.max_score) * 100);
}

function buildControlCategories(controlProfiles) {
  const categories = {};

  for (const profile of controlProfiles) {
    const name = profile.category || 'Other';
    if (!categories[name]) {
      categories[name] = { name, implemented: 0, total: 0 };
    }
    categories[name].total += 1;
    const pct = profile.percentage ?? (
      profile.max_score ? Math.round((profile.current_score / profile.max_score) * 100) : 0
    );
    if (pct >= 80) {
      categories[name].implemented += 1;
    }
  }

  return Object.values(categories);
}

function buildRiskAreas(controlProfiles) {
  return controlProfiles
    .map((profile) => {
      const pct = profile.percentage ?? (
        profile.max_score ? Math.round((profile.current_score / profile.max_score) * 100) : 0
      );
      return {
        name: profile.title || profile.control_name,
        category: profile.category || 'Other',
        score: pct,
        riskLevel: pct < 50 ? 'high' : pct < 75 ? 'medium' : 'low'
      };
    })
    .filter((area) => area.riskLevel !== 'low')
    .sort((a, b) => a.score - b.score)
    .slice(0, 8);
}

async function seedDemoSecureScoreData() {
  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT 1 FROM secure_scores LIMIT 1');
    if (existing.rows.length > 0) {
      return;
    }

    await client.query('BEGIN');

    const scoreSnapshots = [
      { daysAgo: 28, current: 612, max: 890 },
      { daysAgo: 21, current: 628, max: 890 },
      { daysAgo: 14, current: 645, max: 890 },
      { daysAgo: 7, current: 658, max: 890 },
      { daysAgo: 0, current: 672, max: 890 }
    ];

    for (const snapshot of scoreSnapshots) {
      const id = `demo-score-${snapshot.daysAgo}`;
      await client.query(`
        INSERT INTO secure_scores (
          id, current_score, max_score, created_date_time,
          active_user_count, licensed_user_count, enabled_services, raw_data
        ) VALUES ($1, $2, $3, NOW() - ($4 || ' days')::interval, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        snapshot.current,
        snapshot.max,
        String(snapshot.daysAgo),
        420,
        500,
        12,
        JSON.stringify({ source: 'demo-seed' })
      ]);
    }

    const demoControls = [
      ['CTRL-001', 'mfa_registration', 'Require MFA for admins', 'Identity', 90, 100],
      ['CTRL-002', 'conditional_access', 'Enable Conditional Access policies', 'Identity', 70, 100],
      ['CTRL-003', 'dlp_policies', 'Configure DLP policies', 'Data', 55, 100],
      ['CTRL-004', 'secure_score_sync', 'Review secure score recommendations weekly', 'Device', 80, 100],
      ['CTRL-005', 'legacy_auth', 'Block legacy authentication', 'Identity', 40, 100]
    ];

    for (const [id, name, title, category, current, max] of demoControls) {
      await client.query(`
        INSERT INTO secure_score_control_profiles (
          id, control_name, title, category, current_score, max_score, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [id, name, title, category, current, max, `Demo control: ${title}`]);
    }

    const demoRecommendations = [
      ['REC-001', 'CTRL-005', 'Block legacy authentication', 'Disable basic auth to reduce credential theft risk', 'Identity', 'critical', 95],
      ['REC-002', 'CTRL-003', 'Expand DLP coverage', 'Apply DLP policies to additional sensitive data locations', 'Data', 'high', 80],
      ['REC-003', 'CTRL-002', 'Harden Conditional Access', 'Require compliant devices for privileged roles', 'Identity', 'high', 75]
    ];

    for (const [recId, controlId, title, description, category, priority, impact] of demoRecommendations) {
      await client.query(`
        INSERT INTO secure_score_recommendations (
          recommendation_id, control_profile_id, title, description, category, priority, impact_score, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
        ON CONFLICT (recommendation_id) DO NOTHING
      `, [recId, controlId, title, description, category, priority, impact]);
    }

    await client.query('COMMIT');
    console.log('Seeded demo Microsoft Secure Score data for local development');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function ensureSecureScoreData() {
  let currentScore = await getLatestSecureScore();
  if (currentScore) {
    return currentScore;
  }

  if (process.env.NODE_ENV !== 'production' || process.env.SECURE_SCORE_ALLOW_DEMO === 'true') {
    await seedDemoSecureScoreData();
    currentScore = await getLatestSecureScore();
  }

  return currentScore;
}

function buildDashboardPayload(currentScore, historicalData, controlProfiles, recommendations) {
  const previousScore = historicalData.length > 1 ? historicalData[1] : null;
  const scoreDelta = previousScore ? currentScore.current_score - previousScore.current_score : 0;
  const implementedControls = controlProfiles.filter((ctrl) => {
    const pct = ctrl.percentage ?? (ctrl.max_score ? (ctrl.current_score / ctrl.max_score) * 100 : 0);
    return pct >= 80;
  }).length;
  const controlsImplementationRate = controlProfiles.length > 0
    ? Math.round((implementedControls / controlProfiles.length) * 100)
    : 0;

  const trendData = historicalData.slice(0, 30).map((row) => ({
    date: row.created_date_time,
    score: row.current_score,
    percentage: scorePercentage(row)
  }));

  return {
    overview: {
      currentScore: currentScore.current_score || 0,
      maxScore: currentScore.max_score || 0,
      percentage: scorePercentage(currentScore),
      trend: {
        direction: scoreDelta > 0 ? 'up' : scoreDelta < 0 ? 'down' : 'stable',
        change: scoreDelta
      },
      lastUpdated: currentScore.created_date_time || new Date().toISOString()
    },
    trends: trendData,
    controlCategories: buildControlCategories(controlProfiles),
    topRecommendations: recommendations.map((rec) => ({
      title: rec.title,
      description: rec.description,
      category: rec.category,
      priority: rec.priority,
      impactScore: rec.impact_score,
      status: rec.status
    })),
    riskAreas: buildRiskAreas(controlProfiles),
    complianceImpact: [],
    controlsImplementationRate
  };
}

const secureScoreView = requirePermissions(['view_security_metrics']);

router.get('/dashboard', authenticateToken, secureScoreView, async (req, res) => {
  try {
    const { timeRange = '30' } = req.query;
    const currentScore = await ensureSecureScoreData();

    if (!currentScore) {
      return res.status(404).json({
        error: 'No secure score data available',
        message: isGraphConfigured()
          ? 'No secure score snapshots found. Run sync to import data from Microsoft Graph.'
          : 'Configure AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET in .env, then run sync.'
      });
    }

    const historicalData = await getHistoricalSecureScores(parseInt(timeRange, 10));
    const controlProfiles = await getControlProfiles();
    const recommendations = await getTopRecommendations();

    res.json({
      data: buildDashboardPayload(currentScore, historicalData, controlProfiles, recommendations)
    });
  } catch (error) {
    console.error('Error in /dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: error.message });
  }
});

router.post('/sync', authenticateToken, requirePermissions(['secure_score.sync']), async (req, res) => {
  try {
    if (!isGraphConfigured()) {
      return res.status(503).json({
        error: 'Microsoft Graph is not configured',
        message: 'Set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET in .env before syncing.'
      });
    }

    await scheduledSync();
    res.json({
      success: true,
      message: 'Secure score sync completed'
    });
  } catch (error) {
    console.error('Manual secure score sync failed:', error);
    res.status(500).json({
      error: 'Secure score sync failed',
      message: error.message
    });
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
  if (!isGraphConfigured()) {
    const error = new Error('Microsoft Graph is not configured');
    error.code = 'GRAPH_NOT_CONFIGURED';
    throw error;
  }

  const client = await pool.connect();
  try {
    console.log('Starting Scheduled Secure Score sync...');
    const accessToken = await getGraphAccessToken();
    const secureScoreUrl = `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/security/secureScores`;
    const response = await axios.get(secureScoreUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const secureScores = response.data.value || [];

    if (secureScores.length === 0) {
      console.log('Secure Score sync: No scores found to process.');
      return;
    }

    for (const score of secureScores) {
      await client.query(`
        INSERT INTO secure_scores (
          id, current_score, max_score, created_date_time,
          active_user_count, licensed_user_count, enabled_services, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          current_score = EXCLUDED.current_score,
          max_score = EXCLUDED.max_score,
          created_date_time = EXCLUDED.created_date_time,
          active_user_count = EXCLUDED.active_user_count,
          licensed_user_count = EXCLUDED.licensed_user_count,
          enabled_services = EXCLUDED.enabled_services,
          raw_data = EXCLUDED.raw_data,
          updated_at = CURRENT_TIMESTAMP
      `, [
        score.id,
        score.currentScore,
        score.maxScore,
        score.createdDateTime,
        score.activeUserCount,
        score.enabledServices,
        score.licensedUserCount,
        JSON.stringify(score)
      ]);
    }

    console.log(`Secure Score sync completed. Processed ${secureScores.length} records.`);
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
router.get('/', authenticateToken, secureScoreView, async (req, res) => {
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
router.get('/executive-summary', authenticateToken, secureScoreView, async (req, res) => {
  try {
    const { timeRange = '30' } = req.query;
    const currentScore = await ensureSecureScoreData();
    if (!currentScore) {
      return res.status(404).json({
        success: false,
        error: 'No secure score data available'
      });
    }

    const historicalData = await getHistoricalSecureScores(parseInt(timeRange, 10));
    const controlProfiles = await getControlProfiles();

    // Executive metrics
    const previousScore = historicalData.length > 1 ? historicalData[1] : null;
    const scoreDelta = previousScore ? currentScore.current_score - previousScore.current_score : 0;
    const percentageDelta = previousScore ? ((currentScore.current_score / currentScore.max_score) * 100) - ((previousScore.current_score / previousScore.max_score) * 100) : 0;

    // Controls implementation
    const implementedControls = controlProfiles.filter((ctrl) => {
      const pct = ctrl.percentage ?? (ctrl.max_score ? (ctrl.current_score / ctrl.max_score) * 100 : 0);
      return pct >= 80;
    }).length;
    const controlsImplementationRate = controlProfiles.length > 0
      ? Math.round((implementedControls / controlProfiles.length) * 100)
      : 0;
    const pendingImplementation = controlProfiles.length - implementedControls;

    const trendData = historicalData.slice(0, 30).map((row) => ({
      date: row.created_date_time,
      score: row.current_score
    }));
    const trendDirection = scoreDelta > 0 ? 'improving' : scoreDelta < 0 ? 'declining' : 'stable';

    // Compliance impact (reuse calculateComplianceImpact if possible)
    // For now, stub with empty array or implement logic if compliance data is in controlScores
    let complianceFrameworks = [];
    if (typeof calculateComplianceImpact === 'function') {
      complianceFrameworks = calculateComplianceImpact(currentScore, controlProfiles);
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
        lastUpdated: currentScore?.created_date_time || new Date().toISOString(),
        projectedScore: currentScore?.current_score || 0, // No projection logic yet
        projectedPercentage: currentScore?.max_score ? Math.round((currentScore.current_score / currentScore.max_score) * 100) : 0
      },
      controlsStatus: {
        totalControls: controlProfiles.length,
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