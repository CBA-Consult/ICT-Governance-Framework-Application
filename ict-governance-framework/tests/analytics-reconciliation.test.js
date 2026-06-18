/**
 * Break Glass analytics / dashboard chart aggregation tests
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const { getBreakGlassAnalytics, computeAuditIntegrityScore } = require('../services/break-glass-analytics');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const TEST_USER = 'USR-SUPERADMIN-001';

function buildApp() {
  const analyticsRouter = require('../api/analytics-router');
  const app = express();
  app.use(express.json());
  app.use('/api/analytics', analyticsRouter);
  return app;
}

function standingToken() {
  return jwt.sign(
    { userId: TEST_USER, sessionId: 'test-analytics-session', type: 'access' },
    JWT_ACCESS_SECRET,
    { expiresIn: '5m' }
  );
}

(async () => {
  let passed = 0;
  let failed = 0;

  const assert = (name, condition) => {
    if (condition) {
      passed += 1;
      console.log(`PASS: ${name}`);
    } else {
      failed += 1;
      console.error(`FAIL: ${name}`);
    }
  };

  const setupPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const refreshToken = `refresh-analytics-test-${Date.now()}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await setupPool.query(`DELETE FROM user_sessions WHERE session_id = 'test-analytics-session'`);
  await setupPool.query(
    `INSERT INTO user_sessions (session_id, user_id, refresh_token, expires_at, is_active)
     VALUES ('test-analytics-session', $1, $2, $3, true)`,
    [TEST_USER, refreshToken, expiresAt]
  );
  await setupPool.end();

  const integrity = computeAuditIntegrityScore({ current_value: 12, target_value: 100 }, [
    { emergency_count: 2, standard_jit_count: 1 }
  ]);
  assert('computes audit integrity score from snapshot exposure', integrity === 88);

  const analytics = await getBreakGlassAnalytics(30);
  assert('returns trend array from analytics service', Array.isArray(analytics.trend));
  assert('returns numeric KPI integrity score', typeof analytics.currentKpiScore === 'number');

  const app = buildApp();
  const response = await request(app)
    .get('/api/analytics/break-glass/trend')
    .set('Authorization', `Bearer ${standingToken()}`);

  assert('analytics endpoint returns 200 with auth', response.statusCode === 200);
  assert('response includes trend property', Object.prototype.hasOwnProperty.call(response.body, 'trend'));
  assert('response includes currentKpiScore property', Object.prototype.hasOwnProperty.call(response.body, 'currentKpiScore'));
  assert('trend payload is array', Array.isArray(response.body.trend));

  if (response.body.trend.length > 0) {
    const bucket = response.body.trend[0];
    assert('trend buckets include emergency_count', Object.prototype.hasOwnProperty.call(bucket, 'emergency_count'));
    assert('trend buckets include standard_jit_count', Object.prototype.hasOwnProperty.call(bucket, 'standard_jit_count'));
    assert('trend buckets include date_bucket', Object.prototype.hasOwnProperty.call(bucket, 'date_bucket'));
  }

  const unauth = await request(app).get('/api/analytics/break-glass/trend');
  assert('rejects unauthenticated analytics request', unauth.statusCode === 401);

  console.log(`\nAnalytics reconciliation tests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => {
  console.error('Analytics test harness failed:', err);
  process.exit(1);
});
