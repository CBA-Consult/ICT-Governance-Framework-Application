// File: ict-governance-framework/api/defender-activities.js
// Sample Express.js API route for fetching Defender for Cloud Apps activities and storing in PostgreSQL


require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // Ensure .env is loaded from project root
const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');

const router = express.Router();


// Ensure correct Defender Activities API URL and fail fast if missing
if (!process.env.DEFENDER_CLOUDAPPS_API_URL) {
  throw new Error('Missing DEFENDER_CLOUDAPPS_API_URL in environment variables');
}
const DEFENDER_ACTIVITIES_API_URL = process.env.DEFENDER_CLOUDAPPS_API_URL.endsWith('/api')
  ? `${process.env.DEFENDER_CLOUDAPPS_API_URL}/v1/activities/`
  : `${process.env.DEFENDER_CLOUDAPPS_API_URL}/api/v1/activities/`;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // or use PGHOST, PGUSER, etc.
});

// Fetch activities from Defender for Cloud Apps
async function fetchDefenderActivities() {
  // Use the constructed API URL
  const token = process.env.DEFENDER_CLOUDAPPS_API_TOKEN;
  const url = DEFENDER_ACTIVITIES_API_URL;
  const headers = {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json',
  };
  // Log the URL and headers for diagnosis
  console.log('Defender API request URL:', url);
  console.log('Defender API request headers:', headers);
  const response = await axios.get(url, { headers });
  // Defender API may return data as an array or object; handle both
  if (Array.isArray(response.data)) {
    return response.data;
  } else if (response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  } else {
    return [];
  }
}

// Store activities in PostgreSQL (upsert by _id)
async function storeActivities(activities) {
  const client = await pool.connect();
  try {
    for (const activity of activities) {
      const params = [
        activity._id,
        activity.timestamp,
        activity.eventTypeValue || activity.eventTypeName,
        activity.user?.userName || null,
        activity.appName || null,
        activity.description || null,
        JSON.stringify(activity),
      ];
      // Log the query and params for debugging
      console.log('Inserting activity:', {
        _id: activity._id,
        timestamp: activity.timestamp,
        event_type: activity.eventTypeValue || activity.eventTypeName,
        user_name: activity.user?.userName || null,
        app_name: activity.appName || null,
        description: activity.description || null
      });
      try {
        await client.query(
          `INSERT INTO defender_activities (_id, timestamp, event_type, user_name, app_name, description, raw_json)
           VALUES ($1, to_timestamp(($2::bigint) / 1000), $3, $4, $5, $6, $7)
           ON CONFLICT (_id) DO UPDATE SET
             timestamp = EXCLUDED.timestamp,
             event_type = EXCLUDED.event_type,
             user_name = EXCLUDED.user_name,
             app_name = EXCLUDED.app_name,
             description = EXCLUDED.description,
             raw_json = EXCLUDED.raw_json;`,
          params
        );
      } catch (err) {
        console.error('Error inserting activity:', { _id: activity._id, timestamp: activity.timestamp }, err.message);
        throw err;
      }
    }
  } finally {
    client.release();
  }
}

// GET /api/defender-activities - fetch from DB
router.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM defender_activities ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } finally {
    client.release();
  }
});

// POST /api/defender-activities/sync - fetch from Defender API and store in DB
router.post('/sync', async (req, res) => {
  try {
    const activities = await fetchDefenderActivities();
    await storeActivities(activities);
    res.json({ success: true, count: activities.length });
  } catch (err) {
    // Log and return detailed error info for diagnosis
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
    console.error('Defender API sync error:', errorDetails);
    res.status(500).json({ error: 'Sync failed', details: errorDetails });
  }
});

module.exports = router;

/*
PostgreSQL table schema:
CREATE TABLE defender_activities (
  _id TEXT PRIMARY KEY,
  timestamp TIMESTAMP,
  event_type TEXT,
  user_name TEXT,
  app_name TEXT,
  description TEXT,
  raw_json JSONB
);
*/
