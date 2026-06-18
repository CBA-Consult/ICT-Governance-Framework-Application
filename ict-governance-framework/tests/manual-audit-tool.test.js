/**
 * Manual cryptographic ledger audit sweep tests
 */
process.env.JIT_ENFORCEMENT_ENABLED = 'true';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const {
  createBreakGlassTicket,
  createElevationTicket,
  mintJitContextToken,
  pool
} = require('../services/jit-elevation');
const { runManualLedgerReconciliation } = require('../services/manual-ledger-reconciliation');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const TEST_USER = 'USR-SUPERADMIN-001';

function buildApp() {
  const reconciliationRouter = require('../api/reconciliation-router');
  const { authenticateToken, requirePermissions } = require('../middleware/auth');
  const app = express();
  app.use(express.json());
  app.use('/api/auth/jit', reconciliationRouter);
  return app;
}

function standingToken() {
  return jwt.sign(
    { userId: TEST_USER, sessionId: 'test-reconcile-session', type: 'access' },
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
  const refreshToken = `refresh-reconcile-test-${Date.now()}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await setupPool.query(`DELETE FROM user_sessions WHERE session_id = 'test-reconcile-session'`);
  await setupPool.query(
    `INSERT INTO user_sessions (session_id, user_id, refresh_token, expires_at, is_active)
     VALUES ('test-reconcile-session', $1, $2, $3, true)`,
    [TEST_USER, refreshToken, expiresAt]
  );
  await setupPool.end();

  const ticket = await createBreakGlassTicket({
    requestorId: TEST_USER,
    justification: 'BREAK GLASS manual reconciliation verification test ticket for audit sweep',
    scopeTenant: 'tenant-01',
    ttlMinutes: 60
  });

  await pool.query(
    `
    INSERT INTO privileged_action_logs (
      actor_id, jit_ticket_id, endpoint, http_method, action, target_resource_id, is_break_glass, payload_hash
    ) VALUES ($1, $2, '/api/assets/sync', 'POST', 'Test emergency mutation', '/tenants/tenant-01/test', true, $3)
    `,
    [
      TEST_USER,
      ticket.ticketId,
      'a'.repeat(64)
    ]
  );

  const serviceResult = await runManualLedgerReconciliation({
    ticketId: ticket.ticketId,
    actorId: TEST_USER
  });

  assert('service reconciles ticket with clean log chain', serviceResult.anomaliesDetected === false);
  assert('service marks verified action count', serviceResult.verifiedActionsCount >= 1);

  const ledgerRow = await pool.query(
    'SELECT status, revoked_reason FROM jit_elevation_ledger WHERE ticket_id = $1',
    [ticket.ticketId]
  );
  assert('ledger ticket closed as Expired', ledgerRow.rows[0]?.status === 'Expired');
  assert(
    'ledger records manual sweep reason',
    ledgerRow.rows[0]?.revoked_reason?.includes('Manual Audit Sweep Passed')
  );

  assert(
    'service returns idempotent response for already reconciled ticket',
    (await runManualLedgerReconciliation({ ticketId: ticket.ticketId, actorId: TEST_USER })).alreadyReconciled === true
  );

  const ticket2 = await createBreakGlassTicket({
    requestorId: TEST_USER,
    justification: 'BREAK GLASS second ticket for API reconciliation endpoint validation test',
    scopeTenant: 'tenant-01',
    ttlMinutes: 60
  });

  await pool.query(
    `
    INSERT INTO privileged_action_logs (
      actor_id, jit_ticket_id, endpoint, http_method, action, target_resource_id, is_break_glass, payload_hash
    ) VALUES ($1, $2, '/api/assets/validation/promote', 'POST', 'Promote under emergency', '/asset/test', true, $3)
    `,
    [TEST_USER, ticket2.ticketId, 'b'.repeat(64)]
  );

  const elevTicket = await createElevationTicket({
    requestorId: TEST_USER,
    justification: 'Compliance officer JIT elevation for manual reconciliation API test',
    scopeTenant: 'tenant-01'
  });
  const { token: complianceJit } = mintJitContextToken({
    userId: TEST_USER,
    ticketId: elevTicket.ticketId
  });

  const app = buildApp();
  const apiRes = await request(app)
    .post('/api/auth/jit/emergency/reconcile')
    .set('Authorization', `Bearer ${standingToken()}`)
    .set('X-JIT-Context', `Bearer ${complianceJit}`)
    .send({ ticketId: ticket2.ticketId });

  assert('api reconciles active ticket', apiRes.statusCode === 200);
  assert('api reports no anomalies', apiRes.body.anomaliesDetected === false);
  assert('api returns audit report log', Array.isArray(apiRes.body.auditReportLog));

  console.log(`\nManual audit tool tests: ${passed} passed, ${failed} failed`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
})().catch(async (err) => {
  console.error('Manual audit test harness failed:', err);
  await pool.end();
  process.exit(1);
});
