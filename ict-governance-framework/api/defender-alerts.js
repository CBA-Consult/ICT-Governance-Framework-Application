require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Fetch alerts from Defender for Cloud Apps
async function fetchDefenderAlerts() {
  const url = (process.env.DEFENDER_CLOUDAPPS_API_URL.endsWith('/api')
    ? `${process.env.DEFENDER_CLOUDAPPS_API_URL}/v1/alerts/`
    : `${process.env.DEFENDER_CLOUDAPPS_API_URL}/api/v1/alerts/`);
  const token = process.env.DEFENDER_CLOUDAPPS_API_TOKEN;
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (Array.isArray(response.data)) {
    return response.data;
  } else if (response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  } else {
    return [];
  }
}

// POST /api/defender-alerts/sync - fetch alerts and upsert into DB
router.post('/sync', async (req, res) => {
  const client = await pool.connect();
  try {
    const alerts = await fetchDefenderAlerts();
    let upserted = 0;
    for (const alert of alerts) {
      const alertId = alert._id || alert.id;
      if (!alertId) continue;
      await client.query(
        `INSERT INTO defender_alerts (_id, title, description, severity, status, created_time, updated_time, raw_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (_id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           severity = EXCLUDED.severity,
           status = EXCLUDED.status,
           created_time = EXCLUDED.created_time,
           updated_time = EXCLUDED.updated_time,
           raw_json = EXCLUDED.raw_json;`,
        [
          alertId,
          alert.title || null,
          alert.description || null,
          alert.severity || null,
          alert.status || null,
          alert.createdTime ? new Date(alert.createdTime) : null,
          alert.updatedTime ? new Date(alert.updatedTime) : null,
          JSON.stringify(alert),
        ]
      );
      upserted++;
    }
    res.json({ success: true, upserted });
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
    console.error('Defender API alerts sync error:', errorDetails);
    res.status(500).json({ error: 'Alerts sync failed', details: errorDetails });
  } finally {
    client.release();
  }
});

module.exports = router;
