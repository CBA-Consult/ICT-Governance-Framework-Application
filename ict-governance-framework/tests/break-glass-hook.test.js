/**
 * Break Glass emergency protocol tests
 */
process.env.BREAK_GLASS_ALLOWED = 'true';
process.env.BREAK_GLASS_SYSTEM_SECRET = 'test-break-glass-secret-for-ci';
process.env.BREAK_GLASS_MAX_DURATION_MINUTES = '60';
process.env.JIT_ENFORCEMENT_ENABLED = 'true';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config({ override: false });

process.env.BREAK_GLASS_ALLOWED = 'true';
process.env.BREAK_GLASS_SYSTEM_SECRET = 'test-break-glass-secret-for-ci';

const express = require('express');
const request = require('supertest');
const breakGlassRouter = require('../api/break-glass-router');
const {
  pool,
  createBreakGlassTicket,
  mintBreakGlassContextToken
} = require('../services/jit-elevation');
const { runEmergencyReconciliationSweep } = require('../services/break-glass-reconciler');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth/jit', breakGlassRouter);
  return app;
}

const VALID_JUSTIFICATION = 'Identity platform is totally degraded across this tenant branch.';

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

  const app = buildApp();

  const invalidSecretRes = await request(app)
    .post('/api/auth/jit/emergency/activate')
    .send({
      requestorId: 'operator-01',
      breakGlassKey: 'WRONG_CRITICAL_SECRET_STRING',
      justification: VALID_JUSTIFICATION,
      scopeTenant: 'tenant-beta'
    });

  assert('rejects invalid out-of-band secret', invalidSecretRes.statusCode === 401);

  const shortJustificationRes = await request(app)
    .post('/api/auth/jit/emergency/activate')
    .send({
      requestorId: 'operator-01',
      breakGlassKey: process.env.BREAK_GLASS_SYSTEM_SECRET,
      justification: 'too short',
      scopeTenant: 'tenant-beta'
    });

  assert('rejects short justification', shortJustificationRes.statusCode === 400);

  const prevAllowed = process.env.BREAK_GLASS_ALLOWED;
  process.env.BREAK_GLASS_ALLOWED = 'false';
  const disabledRes = await request(app)
    .post('/api/auth/jit/emergency/activate')
    .send({
      requestorId: 'operator-01',
      breakGlassKey: 'test-break-glass-secret-for-ci',
      justification: VALID_JUSTIFICATION,
      scopeTenant: 'tenant-beta'
    });
  process.env.BREAK_GLASS_ALLOWED = prevAllowed;

  assert('rejects when Break Glass disabled in config', disabledRes.statusCode === 403);

  const activateRes = await request(app)
    .post('/api/auth/jit/emergency/activate')
    .send({
      requestorId: 'operator-01',
      breakGlassKey: process.env.BREAK_GLASS_SYSTEM_SECRET,
      justification: VALID_JUSTIFICATION,
      scopeTenant: 'tenant-beta'
    });

  assert(
    'approves valid emergency activation',
    activateRes.statusCode === 200 &&
      activateRes.body.success === true &&
      activateRes.body.ticketId?.startsWith('BG-') &&
      Boolean(activateRes.body.emergencyToken)
  );

  const ledgerRow = await pool.query(
    'SELECT status FROM jit_elevation_ledger WHERE ticket_id = $1',
    [activateRes.body.ticketId]
  );
  assert('writes Break_Glass_Active ledger entry', ledgerRow.rows[0]?.status === 'Break_Glass_Active');

  const activationLog = await pool.query(
    `SELECT COUNT(*)::int AS count FROM privileged_action_logs
     WHERE jit_ticket_id = $1 AND is_break_glass = true`,
    [activateRes.body.ticketId]
  );
  assert('logs activation to privileged_action_logs', activationLog.rows[0].count >= 1);

  const expiredTicket = await createBreakGlassTicket({
    requestorId: 'reconciler-test',
    justification: 'BREAK GLASS test ticket for automated reconciliation sweep validation run',
    scopeTenant: 'tenant-01',
    ttlMinutes: -120
  });

  await pool.query(
    `UPDATE jit_elevation_ledger SET valid_until = NOW() - INTERVAL '2 hours' WHERE ticket_id = $1`,
    [expiredTicket.ticketId]
  );

  const sweep = await runEmergencyReconciliationSweep();
  assert('reconciliation sweep processes expired tickets', sweep.reconciled >= 1);

  const reconciledRow = await pool.query(
    'SELECT status, revoked_reason FROM jit_elevation_ledger WHERE ticket_id = $1',
    [expiredTicket.ticketId]
  );
  assert(
    'marks expired emergency ticket as Expired with reason',
    reconciledRow.rows[0]?.status === 'Expired' &&
      reconciledRow.rows[0]?.revoked_reason?.includes('Automated system timeout')
  );

  const revokeRes = await request(app)
    .post('/api/auth/jit/emergency/revoke')
    .send({
      breakGlassKey: process.env.BREAK_GLASS_SYSTEM_SECRET,
      ticketId: activateRes.body.ticketId,
      reason: 'Post-incident manual closure during verification test'
    });

  assert('revokes active emergency ticket with valid secret', revokeRes.statusCode === 200);

  console.log(`\nBreak Glass tests: ${passed} passed, ${failed} failed`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
})().catch(async (err) => {
  console.error('Break Glass test harness failed:', err);
  await pool.end();
  process.exit(1);
});
