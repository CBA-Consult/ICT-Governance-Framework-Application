// File: ict-governance-framework/api/defender-entities.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');

const router = express.Router();

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Fetch entities (users) from Defender for Cloud Apps
async function fetchDefenderEntities() {
  const url = (process.env.DEFENDER_CLOUDAPPS_API_URL.endsWith('/api')
    ? `${process.env.DEFENDER_CLOUDAPPS_API_URL}/v1/entities/`
    : `${process.env.DEFENDER_CLOUDAPPS_API_URL}/api/v1/entities/`);
  const token = process.env.DEFENDER_CLOUDAPPS_API_TOKEN;
  // GET all entities (optionally, you can use POST with filters)
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

// POST /api/defender-entities/sync - fetch entities from Defender API and upsert into DB
router.post('/sync', async (req, res) => {
  const client = await pool.connect();
  try {
    const entities = await fetchDefenderEntities();
    let upserted = 0;
    for (const entity of entities) {
      const entityId = entity._id || entity.id || entity.email;
      if (!entityId) continue;
      await client.query(
        `INSERT INTO defender_entities (_id, user_name, email, user_type, is_external, risk_level, last_activity, raw_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (_id) DO UPDATE SET
           user_name = EXCLUDED.user_name,
           email = EXCLUDED.email,
           user_type = EXCLUDED.user_type,
           is_external = EXCLUDED.is_external,
           risk_level = EXCLUDED.risk_level,
           last_activity = EXCLUDED.last_activity,
           raw_json = EXCLUDED.raw_json;`,
        [
          entityId,
          entity.userName || entity.displayName || null,
          entity.email || entity.mail || null,
          entity.userType || entity.type || null,
          entity.isExternal || entity.external || false,
          entity.riskLevel || null,
          entity.lastActivity ? new Date(entity.lastActivity) : null,
          JSON.stringify(entity),
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
    console.error('Defender API entities sync error:', errorDetails);
    res.status(500).json({ error: 'Entities sync failed', details: errorDetails });
  } finally {
    client.release();
  }
});

module.exports = router;
