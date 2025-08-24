// File: ict-governance-framework/api/secure-scores.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

module.exports = router;
module.exports.scheduledSync = scheduledSync;
