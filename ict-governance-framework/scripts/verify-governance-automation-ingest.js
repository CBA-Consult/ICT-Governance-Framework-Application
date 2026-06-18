#!/usr/bin/env node
/**
 * Smoke test: governance incident ingest via webhook secret (mirrors PowerShell path)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const crypto = require('crypto');

const API_URL = (process.env.GOVERNANCE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const SECRET = process.env.GOVERNANCE_WEBHOOK_SECRET;

if (!SECRET) {
  console.error('FAIL: GOVERNANCE_WEBHOOK_SECRET required in .env');
  process.exit(1);
}

(async () => {
  const correlationId = crypto.randomUUID();
  const payload = {
    tenantId: process.env.DEFAULT_TENANT_ID || 'tenant-01',
    driftType: 'security',
    severity: 'CRITICAL',
    description: 'PowerShell automation path smoke test — configuration drift detected',
    externalTicketId: `CCM-SMOKE-${Date.now()}`,
    correlationId
  };

  const start = Date.now();
  const res = await fetch(`${API_URL}/api/governance/incidents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-governance-webhook-secret': SECRET
    },
    body: JSON.stringify(payload)
  });

  const body = await res.json();
  const latencyMs = Date.now() - start;

  if (!res.ok) {
    if (res.status === 429) {
      console.error('FAIL: 429 rate limited — restart `npm run server` to reset counters and load webhook bypass');
    }
    console.error('FAIL:', res.status, body);
    process.exit(1);
  }

  console.log('PASS: governance incident ingest (automation path)');
  console.log(`  incident_id: ${body.incident?.incident_id}`);
  console.log(`  correlation_id: ${body.correlation_id}`);
  console.log(`  round_trip_ms: ${latencyMs}`);
  if (body.fair_recalculation) {
    console.log(`  fair_delta_usd: ${body.fair_recalculation.risk_delta_usd}`);
  }
})().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
