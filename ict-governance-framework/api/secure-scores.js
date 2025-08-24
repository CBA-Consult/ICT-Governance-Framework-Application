// File: ict-governance-framework/api/secure-scores.js
// Microsoft Graph API Secure Score Integration

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const axios = require('axios');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// Microsoft Graph API configuration
const GRAPH_API_BASE_URL = process.env.GRAPH_API_BASE_URL || 'https://graph.microsoft.com';
const GRAPH_API_VERSION = 'v1.0';

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
      current: secureScores[0] || null,
      history: secureScores,
      controlScores,
      historicalData,
      summary: generateSecureScoreSummary(secureScores),
      recommendations: await generateRecommendations(secureScores[0])
    };

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching secure scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch secure scores',
      details: error.message
    });
  }
});

/**
 * GET /api/secure-scores/control-profiles
 * Get secure score control profiles
 */
router.get('/control-profiles', authenticateToken, requirePermission('view_security_metrics'), async (req, res) => {
  try {
    const accessToken = await getGraphAccessToken();
    const controlProfiles = await getSecureScoreControlProfiles(accessToken);

    res.json({
      success: true,
      data: controlProfiles,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching control profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch control profiles',
      details: error.message
    });
  }
});

/**
 * GET /api/secure-scores/dashboard
 * Get dashboard data for secure scores
 */
router.get('/dashboard', authenticateToken, requirePermission('view_security_metrics'), async (req, res) => {
  try {
    const { timeRange = '30' } = req.query;
    
    // Get current secure score data
    const accessToken = await getGraphAccessToken();
    const currentScores = await getCurrentSecureScores(accessToken);
    
    // Get historical trends
    const historicalData = await getHistoricalSecureScores(parseInt(timeRange));
    
    // Get control profiles for detailed analysis
    const controlProfiles = await getSecureScoreControlProfiles(accessToken);
    
    // Generate dashboard metrics
    const dashboardData = {
      overview: {
        currentScore: currentScores[0]?.currentScore || 0,
        maxScore: currentScores[0]?.maxScore || 0,
        percentage: currentScores[0] ? Math.round((currentScores[0].currentScore / currentScores[0].maxScore) * 100) : 0,
        trend: calculateTrend(historicalData),
        lastUpdated: currentScores[0]?.createdDateTime || new Date().toISOString()
      },
      trends: processTrendData(historicalData),
      controlCategories: processControlCategories(controlProfiles),
      topRecommendations: await getTopRecommendations(controlProfiles),
      riskAreas: identifyRiskAreas(controlProfiles),
      complianceImpact: calculateComplianceImpact(currentScores[0], controlProfiles)
    };

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard data',
      details: error.message
    });
  }
});

/**
 * POST /api/secure-scores/sync
 * Manually trigger sync with Microsoft Graph API
 */
router.post('/sync', authenticateToken, requirePermission('manage_security_metrics'), async (req, res) => {
  try {
    const accessToken = await getGraphAccessToken();
    
    // Fetch latest secure scores
    const secureScores = await getCurrentSecureScores(accessToken);
    
    // Fetch control profiles
    const controlProfiles = await getSecureScoreControlProfiles(accessToken);
    
    // Store in database
    await storeSecureScoreData(secureScores);
    await storeControlProfileData(controlProfiles);
    
    // Generate alerts for significant changes
    await checkForSecureScoreAlerts(secureScores[0]);

    res.json({
      success: true,
      message: 'Secure score data synchronized successfully',
      data: {
        scoresUpdated: secureScores.length,
        controlProfilesUpdated: controlProfiles.length,
        lastSync: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error syncing secure scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync secure scores',
      details: error.message
    });
  }
});

/**
 * GET /api/secure-scores/recommendations
 * Get actionable recommendations based on secure score
 */
router.get('/recommendations', authenticateToken, requirePermission('view_security_metrics'), async (req, res) => {
  try {
    const { priority = 'all', category = 'all' } = req.query;
    
    const accessToken = await getGraphAccessToken();
    const controlProfiles = await getSecureScoreControlProfiles(accessToken);
    
    let recommendations = await generateDetailedRecommendations(controlProfiles);
    
    // Filter by priority
    if (priority !== 'all') {
      recommendations = recommendations.filter(rec => rec.priority === priority);
    }
    
    // Filter by category
    if (category !== 'all') {
      recommendations = recommendations.filter(rec => rec.category === category);
    }
    
    // Sort by impact score
    recommendations.sort((a, b) => b.impactScore - a.impactScore);

    res.json({
      success: true,
      data: {
        recommendations,
        summary: {
          total: recommendations.length,
          byPriority: groupBy(recommendations, 'priority'),
          byCategory: groupBy(recommendations, 'category'),
          estimatedImpact: recommendations.reduce((sum, rec) => sum + rec.impactScore, 0)
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations',
      details: error.message
    });
  }
});

// Helper functions

async function getCurrentSecureScores(accessToken) {
  const secureScoreUrl = `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/security/secureScores`;
  const response = await axios.get(`${secureScoreUrl}?$top=10&$orderby=createdDateTime desc`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data.value;
}

async function getSecureScoreControlProfiles(accessToken) {
  const controlProfilesUrl = `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/security/secureScoreControlProfiles`;
  const response = await axios.get(`${controlProfilesUrl}?$top=100`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data.value;
}

async function storeSecureScoreData(secureScores) {
  const client = await pool.connect();
  try {
    for (const score of secureScores) {
      await client.query(`
        INSERT INTO secure_scores (
          id, current_score, max_score, percentage, created_date_time, 
          active_user_count, enabled_services, licensed_user_count, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          current_score = EXCLUDED.current_score,
          max_score = EXCLUDED.max_score,
          percentage = EXCLUDED.percentage,
          updated_at = CURRENT_TIMESTAMP,
          raw_data = EXCLUDED.raw_data
      `, [
        score.id,
        score.currentScore,
        score.maxScore,
        Math.round((score.currentScore / score.maxScore) * 100),
        score.createdDateTime,
        score.activeUserCount,
        score.enabledServices?.length || 0,
        score.licensedUserCount,
        JSON.stringify(score)
      ]);
    }

// POST /api/secure-scores/sync - Save Secure Score JSON to Neon
router.post('/sync', async (req, res) => {
  const client = await pool.connect();
  try {
    const body = req.body;
    if (!body || !Array.isArray(body.value)) {
      return res.status(400).json({ error: 'Invalid payload: missing value array' });
    }
    let inserted = 0;
    for (const score of body.value) {
      // Insert secure_scores
      const result = await client.query(
        `INSERT INTO secure_scores (tenant_id, created_date, current_score, max_score, active_user_count, licensed_user_count, raw_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tenant_id, created_date) DO UPDATE SET
           current_score = EXCLUDED.current_score,
           max_score = EXCLUDED.max_score,
           active_user_count = EXCLUDED.active_user_count,
           licensed_user_count = EXCLUDED.licensed_user_count,
           raw_json = EXCLUDED.raw_json
         RETURNING id`,
        [
          score.azureTenantId || score.tenantId || null,
          score.createdDateTime ? new Date(score.createdDateTime) : null,
          score.currentScore || null,
          score.maxScore || null,
          score.activeUserCount || null,
          score.licensedUserCount || null,
          JSON.stringify(score)
        ]
      );
      const secureScoreId = result.rows[0].id;
      // Remove old controls for this snapshot
      await client.query('DELETE FROM secure_score_controls WHERE secure_score_id = $1', [secureScoreId]);
      // Insert control scores
      if (Array.isArray(score.controlScores)) {
        for (const control of score.controlScores) {
          await client.query(
            `INSERT INTO secure_score_controls
              (secure_score_id, control_category, control_name, description, score, score_in_percentage, implementation_status, last_synced, extra_json)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              secureScoreId,
              control.controlCategory || null,
              control.controlName || null,
              control.description || null,
              control.score || null,
              control.scoreInPercentage || null,
              control.implementationStatus || null,
              control.lastSynced ? new Date(control.lastSynced) : null,
              JSON.stringify(control)
            ]
          );
        }
      }
      inserted++;
    }
    res.json({ success: true, inserted });
  } catch (err) {
    console.error('Secure Score sync error:', err);
    res.status(500).json({ error: 'Secure Score sync failed', details: err.message });
  } finally {
    client.release();
  }
});

// Helper: Get OAuth2 token from Azure AD
async function getGraphAccessToken() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'client_credentials');
  const response = await axios.post(url, params);
  return response.data.access_token;
}

// Helper: Fetch Secure Score from Graph beta API
async function fetchSecureScoreFromGraph() {
  const token = await getGraphAccessToken();
  const url = 'https://graph.microsoft.com/beta/security/secureScores';
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

// Scheduled sync job: fetch from Graph, save to Neon
async function scheduledSync(databaseUrl) {
  const client = await pool.connect();
  try {
    const graphData = await fetchSecureScoreFromGraph();
    if (!graphData || !Array.isArray(graphData.value)) {
      throw new Error('No Secure Score data from Graph API');
    }
    let inserted = 0;
    for (const score of graphData.value) {
      // Insert secure_scores
      const result = await client.query(
        `INSERT INTO secure_scores (tenant_id, created_date, current_score, max_score, active_user_count, licensed_user_count, raw_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tenant_id, created_date) DO UPDATE SET
           current_score = EXCLUDED.current_score,
           max_score = EXCLUDED.max_score,
           active_user_count = EXCLUDED.active_user_count,
           licensed_user_count = EXCLUDED.licensed_user_count,
           raw_json = EXCLUDED.raw_json
         RETURNING id`,
        [
          score.azureTenantId || score.tenantId || null,
          score.createdDateTime ? new Date(score.createdDateTime) : null,
          score.currentScore || null,
          score.maxScore || null,
          score.activeUserCount || null,
          score.licensedUserCount || null,
          JSON.stringify(score)
        ]
      );
      const secureScoreId = result.rows[0].id;
      // Remove old controls for this snapshot
      await client.query('DELETE FROM secure_score_controls WHERE secure_score_id = $1', [secureScoreId]);
      // Insert control scores
      if (Array.isArray(score.controlScores)) {
        for (const control of score.controlScores) {
          await client.query(
            `INSERT INTO secure_score_controls
              (secure_score_id, control_category, control_name, description, score, score_in_percentage, implementation_status, last_synced, extra_json)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              secureScoreId,
              control.controlCategory || null,
              control.controlName || null,
              control.description || null,
              control.score || null,
              control.scoreInPercentage || null,
              control.implementationStatus || null,
              control.lastSynced ? new Date(control.lastSynced) : null,
              JSON.stringify(control)
            ]
          );
        }
      }
      inserted++;
    }
    console.log(`Secure Score sync: ${inserted} records inserted/updated.`);
    return { success: true, inserted };
  } catch (err) {
    console.error('Secure Score sync error:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function storeControlProfileData(controlProfiles) {
  const client = await pool.connect();
  try {
    for (const profile of controlProfiles) {
      await client.query(`
        INSERT INTO secure_score_control_profiles (
          id, control_name, title, category, implementation_cost, 
          user_impact, compliance_information, control_state_updates, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          control_name = EXCLUDED.control_name,
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          implementation_cost = EXCLUDED.implementation_cost,
          user_impact = EXCLUDED.user_impact,
          compliance_information = EXCLUDED.compliance_information,
          control_state_updates = EXCLUDED.control_state_updates,
          updated_at = CURRENT_TIMESTAMP,
          raw_data = EXCLUDED.raw_data
      `, [
        profile.id,
        profile.controlName,
        profile.title,
        profile.controlCategory,
        profile.implementationCost,
        profile.userImpact,
        JSON.stringify(profile.complianceInformation || []),
        JSON.stringify(profile.controlStateUpdates || []),
        JSON.stringify(profile)
      ]);
    }
  } finally {
    client.release();
  }
}

async function getHistoricalSecureScores(days) {
  const result = await pool.query(`
    SELECT * FROM secure_scores 
    WHERE created_date_time >= NOW() - INTERVAL '${days} days'
    ORDER BY created_date_time DESC
  `);
  return result.rows;
}

function generateSecureScoreSummary(secureScores) {
  if (!secureScores || secureScores.length === 0) {
    return null;
  }

  const current = secureScores[0];
  const previous = secureScores[1];
  
  return {
    currentScore: current.currentScore,
    maxScore: current.maxScore,
    percentage: Math.round((current.currentScore / current.maxScore) * 100),
    change: previous ? current.currentScore - previous.currentScore : 0,
    trend: previous ? (current.currentScore > previous.currentScore ? 'improving' : 
                     current.currentScore < previous.currentScore ? 'declining' : 'stable') : 'stable'
  };
}

async function generateRecommendations(secureScore) {
  if (!secureScore) return [];
  
  const recommendations = [];
  const percentage = (secureScore.currentScore / secureScore.maxScore) * 100;
  
  if (percentage < 70) {
    recommendations.push({
      priority: 'high',
      title: 'Critical Security Improvements Needed',
      description: 'Your secure score is below 70%. Immediate action is required.',
      action: 'Review and implement high-impact security controls'
    });
  } else if (percentage < 85) {
    recommendations.push({
      priority: 'medium',
      title: 'Security Posture Enhancement',
      description: 'Good progress, but there\'s room for improvement.',
      action: 'Focus on medium-impact controls with low user impact'
    });
  }
  
  return recommendations;
}

async function generateDetailedRecommendations(controlProfiles) {
  const recommendations = [];
  
  for (const profile of controlProfiles) {
    if (profile.controlStateUpdates && profile.controlStateUpdates.length > 0) {
      const latestUpdate = profile.controlStateUpdates[profile.controlStateUpdates.length - 1];
      
      if (latestUpdate.state === 'Default' || latestUpdate.state === 'Ignored') {
        recommendations.push({
          id: profile.id,
          title: profile.title,
          category: profile.controlCategory,
          priority: mapImplementationCostToPriority(profile.implementationCost),
          description: profile.description,
          impactScore: calculateImpactScore(profile),
          implementationCost: profile.implementationCost,
          userImpact: profile.userImpact,
          complianceFrameworks: profile.complianceInformation?.map(c => c.certificationName) || [],
          action: `Implement ${profile.controlName} to improve security posture`
        });
      }
    }
  }
  
  return recommendations;
}

function mapImplementationCostToPriority(cost) {
  switch (cost) {
    case 'Low': return 'high';
    case 'Moderate': return 'medium';
    case 'High': return 'low';
    default: return 'medium';
  }
}

function calculateImpactScore(profile) {
  let score = 0;
  
  // Base score from max score
  if (profile.maxScore) {
    score += profile.maxScore * 0.4;
  }
  
  // Implementation cost factor (lower cost = higher priority)
  switch (profile.implementationCost) {
    case 'Low': score += 30; break;
    case 'Moderate': score += 20; break;
    case 'High': score += 10; break;
  }
  
  // User impact factor (lower impact = higher priority)
  switch (profile.userImpact) {
    case 'Low': score += 25; break;
    case 'Moderate': score += 15; break;
    case 'High': score += 5; break;
  }
  
  return Math.round(score);
}

function calculateTrend(historicalData) {
  if (!historicalData || historicalData.length < 2) {
    return { direction: 'stable', change: 0 };
  }
  
  const recent = historicalData[0];
  const previous = historicalData[1];
  const change = recent.percentage - previous.percentage;
  
  return {
    direction: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable',
    change: Math.round(change * 10) / 10
  };
}

function processTrendData(historicalData) {
  return historicalData.map(item => ({
    date: item.created_date_time,
    score: item.current_score,
    maxScore: item.max_score,
    percentage: item.percentage
  })).reverse(); // Oldest first for chart display
}

function processControlCategories(controlProfiles) {
  const categories = {};
  
  for (const profile of controlProfiles) {
    const category = profile.controlCategory || 'Other';
    if (!categories[category]) {
      categories[category] = {
        name: category,
        totalControls: 0,
        implementedControls: 0,
        averageScore: 0,
        totalScore: 0
      };
    }
    
    categories[category].totalControls++;
    if (profile.controlStateUpdates && profile.controlStateUpdates.length > 0) {
      const latestState = profile.controlStateUpdates[profile.controlStateUpdates.length - 1];
      if (latestState.state === 'On' || latestState.state === 'Reviewed') {
        categories[category].implementedControls++;
      }
    }
    
    if (profile.maxScore) {
      categories[category].totalScore += profile.maxScore;
    }
  }
  
  // Calculate averages
  Object.values(categories).forEach(category => {
    category.implementationRate = Math.round((category.implementedControls / category.totalControls) * 100);
    category.averageScore = category.totalControls > 0 ? Math.round(category.totalScore / category.totalControls) : 0;
  });
  
  return Object.values(categories);
}

async function getTopRecommendations(controlProfiles) {
  const recommendations = await generateDetailedRecommendations(controlProfiles);
  return recommendations
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 5);
}

function identifyRiskAreas(controlProfiles) {
  const riskAreas = [];
  const categoryStats = processControlCategories(controlProfiles);
  
  for (const category of categoryStats) {
    if (category.implementationRate < 50) {
      riskAreas.push({
        area: category.name,
        riskLevel: category.implementationRate < 25 ? 'high' : 'medium',
        implementationRate: category.implementationRate,
        recommendation: `Improve ${category.name} controls implementation`
      });
    }
  }
  
  return riskAreas;
}

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

module.exports = router;
module.exports.scheduledSync = scheduledSync;
