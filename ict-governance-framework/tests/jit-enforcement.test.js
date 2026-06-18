/**
 * JIT enforcement tests — run with JIT_ENFORCEMENT_ENABLED=true
 */
process.env.JIT_ENFORCEMENT_ENABLED = 'true';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const { enforceJitContext } = require('../middleware/auth-jit-enforcer');
const {
  createElevationTicket,
  mintJitContextToken,
  pool
} = require('../services/jit-elevation');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const TEST_USER = 'USR-SUPERADMIN-001';

function buildApp() {
  const app = express();
  app.use(express.json());

  app.post(
    '/api/assets/validation/promote',
    authenticateToken,
    requirePermissions(['governance.manage']),
    enforceJitContext({ actionDescription: 'Test promotion' }),
    (req, res) => res.status(200).json({ success: true, jit: req.jitContext })
  );

  return app;
}

function standingToken() {
  return jwt.sign({ userId: TEST_USER, sessionId: 'test-session', type: 'access' }, JWT_ACCESS_SECRET, { expiresIn: '5m' });
}

function expiredJitToken(ticketId) {
  return jwt.sign(
    { sub: TEST_USER, role: 'GlobalAdministrator', jit_ticket_id: ticketId, type: 'jit_context' },
    process.env.JIT_ELEVATION_SECRET || JWT_ACCESS_SECRET,
    { expiresIn: '-1s' }
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
  const refreshToken = `refresh-jit-test-${Date.now()}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await setupPool.query(`DELETE FROM user_sessions WHERE session_id = 'test-session'`);
  await setupPool.query(`
    INSERT INTO user_sessions (session_id, user_id, refresh_token, expires_at, is_active)
    VALUES ('test-session', $1, $2, $3, true)
  `, [TEST_USER, refreshToken, expiresAt]);
  await setupPool.end();

  const app = buildApp();
  const assetId = '/tenants/tenant-01/casb/shadow/test-jit';

  const standingRes = await request(app)
    .post('/api/assets/validation/promote')
    .set('Authorization', `Bearer ${standingToken()}`)
    .send({ assetId });

  assert('rejects standing token without JIT context', standingRes.statusCode === 403);

  const ticket = await createElevationTicket({
    requestorId: TEST_USER,
    justification: 'Verification test for JIT enforcement middleware layer',
    scopeTenant: 'tenant-01'
  });

  const expiredRes = await request(app)
    .post('/api/assets/validation/promote')
    .set('Authorization', `Bearer ${standingToken()}`)
    .set('X-JIT-Context', `Bearer ${expiredJitToken(ticket.ticketId)}`)
    .send({ assetId });

  assert('rejects expired JIT context token', expiredRes.statusCode === 401);

  const { token: jitToken } = mintJitContextToken({
    userId: TEST_USER,
    ticketId: ticket.ticketId
  });

  const validRes = await request(app)
    .post('/api/assets/validation/promote')
    .set('Authorization', `Bearer ${standingToken()}`)
    .set('X-JIT-Context', `Bearer ${jitToken}`)
    .send({ assetId });

  assert('allows valid JIT elevated mutation', validRes.statusCode === 200 && validRes.body.success === true);

  const logCheck = await pool.query(
    'SELECT COUNT(*)::int AS count FROM privileged_action_logs WHERE jit_ticket_id = $1',
    [ticket.ticketId]
  );
  assert('writes privileged action audit log', logCheck.rows[0].count >= 1);

  console.log(`\nJIT enforcement tests: ${passed} passed, ${failed} failed`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
})().catch(async (err) => {
  console.error('JIT test harness failed:', err);
  await pool.end();
  process.exit(1);
});
