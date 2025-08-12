require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Fetch data enrichment (subnet) from Defender for Cloud Apps
async function fetchDefenderDataEnrichment() {
  const url = (process.env.DEFENDER_CLOUDAPPS_API_URL.endsWith('/api')
    ? `${process.env.DEFENDER_CLOUDAPPS_API_URL}/subnet/`
    : `${process.env.DEFENDER_CLOUDAPPS_API_URL}/api/subnet/`);
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

// POST /api/defender-dataenrichment/sync - fetch data enrichment and upsert into DB
router.post('/sync', async (req, res) => {
  const client = await pool.connect();
  try {
    const subnets = await fetchDefenderDataEnrichment();
    let upserted = 0;
    for (const subnet of subnets) {
      const subnetId = subnet._id || subnet.id;
      if (!subnetId) continue;
      await client.query(
        `INSERT INTO defender_dataenrichment (_id, name, description, ip_range, created_time, raw_json)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (_id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           ip_range = EXCLUDED.ip_range,
           created_time = EXCLUDED.created_time,
           raw_json = EXCLUDED.raw_json;`,
        [
          subnetId,
          subnet.name || null,
          subnet.description || null,
          subnet.ipRange || null,
          subnet.createdTime ? new Date(subnet.createdTime) : null,
          JSON.stringify(subnet),
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
    console.error('Defender API data enrichment sync error:', errorDetails);
    res.status(500).json({ error: 'Data enrichment sync failed', details: errorDetails });
  } finally {
    client.release();
  }
});

module.exports = router;
