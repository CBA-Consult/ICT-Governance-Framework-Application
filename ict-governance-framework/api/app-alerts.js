require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// POST /api/app-alerts/sync - upsert app alert metrics as JSON
router.post('/sync', async (req, res) => {
  const { app_id, metrics } = req.body;
  if (!app_id || !metrics) {
    return res.status(400).json({ error: 'app_id and metrics are required' });
  }
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO app_alert_metrics (app_id, metrics, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (app_id) DO UPDATE SET metrics = EXCLUDED.metrics, updated_at = NOW();`,
      [app_id, metrics]
    );
    res.json({ success: true });
  } catch (err) {
    let errorDetails = {};
    if (err.response) {
      errorDetails.status = err.response.status;
      errorDetails.statusText = err.response.statusText;
      errorDetails.data = err.response.data;
      errorDetails.headers = err.response.headers;
    } else {
      errorDetails.message = err.message;
      errorDetails.stack = err.stack;
    }
    console.error('App alert metrics sync error:', errorDetails);
    res.status(500).json({ error: 'App alert metrics sync failed', details: errorDetails });
  } finally {
    client.release();
  }
});

module.exports = router;
