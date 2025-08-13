require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Fetch files from Defender for Cloud Apps
async function fetchDefenderFiles() {
  const url = (process.env.DEFENDER_CLOUDAPPS_API_URL.endsWith('/api')
    ? `${process.env.DEFENDER_CLOUDAPPS_API_URL}/v1/files/`
    : `${process.env.DEFENDER_CLOUDAPPS_API_URL}/api/v1/files/`);
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

// POST /api/defender-files/sync - fetch files and upsert into DB
router.post('/sync', async (req, res) => {
  const client = await pool.connect();
  try {
    const files = await fetchDefenderFiles();
    let upserted = 0;
    for (const file of files) {
      const fileId = file._id || file.id;
      if (!fileId) continue;
      await client.query(
        `INSERT INTO defender_files (_id, name, file_type, owner, created_time, last_modified_time, raw_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (_id) DO UPDATE SET
           name = EXCLUDED.name,
           file_type = EXCLUDED.file_type,
           owner = EXCLUDED.owner,
           created_time = EXCLUDED.created_time,
           last_modified_time = EXCLUDED.last_modified_time,
           raw_json = EXCLUDED.raw_json;`,
        [
          fileId,
          file.name || null,
          file.fileType || null,
          file.owner || null,
          file.createdTime ? new Date(file.createdTime) : null,
          file.lastModifiedTime ? new Date(file.lastModifiedTime) : null,
          JSON.stringify(file),
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
    console.error('Defender API files sync error:', errorDetails);
    res.status(500).json({ error: 'Files sync failed', details: errorDetails });
  } finally {
    client.release();
  }
});

module.exports = router;
