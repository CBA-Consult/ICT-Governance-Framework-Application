/**
 * Software pillar API — CASB shadow IT ingestion (GV.SC).
 */
const express = require('express');
const { Pool } = require('pg');
const {
  validateWebhookSignature,
  resolveWebhookSecret,
  ingestSoftwareCasbEvent
} = require('../services/software-casb-ingest');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function authorizeSoftwareIngest(req, res, next) {
  if (!resolveWebhookSecret()) {
    return res.status(503).json({ error: 'Software ingest webhook secret not configured' });
  }

  const headerSecret =
    req.headers['x-webhook-signature'] ||
    req.headers['x-casb-ingest-secret'] ||
    req.headers['x-governance-webhook-secret'];

  const auth = validateWebhookSignature(headerSecret);
  if (!auth.ok) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  return next();
}

/**
 * POST /api/software/ingest
 * Ingest external CASB / shadow IT signal with optional device correlation.
 */
router.post('/ingest', authorizeSoftwareIngest, async (req, res) => {
  try {
    const result = await ingestSoftwareCasbEvent(pool, req.body, { headers: req.headers });
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Software CASB ingest failed:', err);
    return res.status(500).json({
      error: 'Failed to ingest software CASB event',
      details: err.message
    });
  }
});

module.exports = router;
