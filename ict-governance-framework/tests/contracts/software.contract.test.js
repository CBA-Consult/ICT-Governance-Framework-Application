/**
 * @contract pillar:software
 * @contract setup:software-casb,setup:managed-devices
 * @contract readiness:enforced
 * POST /api/software/ingest — CASB shadow IT with device linkage and SecOps bridge.
 */
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const softwareRouter = require('../../api/software-router');
const devicesRouter = require('../../api/devices-router');
const { createPool, applySqlFiles, ensureTenant } = require('./_helpers/db');

const WEBHOOK_SECRET = 'valid-test-signature';
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const REGISTRAR_USER = 'USR-SOFTWARE-REGISTRAR-001';
const OWNER_USER = 'user-1';
const SESSION_ID = 'software-contract-session';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/software', softwareRouter);
  app.use('/api/devices', devicesRouter);
  return app;
}

function webhookHeader(secret = WEBHOOK_SECRET) {
  return { 'x-webhook-signature': secret };
}

function authHeader() {
  const token = jwt.sign(
    { userId: REGISTRAR_USER, sessionId: SESSION_ID, type: 'access' },
    JWT_ACCESS_SECRET,
    { expiresIn: '5m' }
  );
  return `Bearer ${token}`;
}

describe('Software pillar contracts', () => {
  let pool;
  let app;

  beforeAll(async () => {
    process.env.CASB_INGEST_WEBHOOK_SECRET = WEBHOOK_SECRET;
    pool = createPool();
    await applySqlFiles(pool, [
      'assets.sql',
      'casb_shadow_fields.sql',
      'software_casb_events.sql',
      'managed_devices.sql',
      'governance.sql',
      'incident_secops_controls.sql'
    ]);
    await ensureTenant(pool);

    const passwordHash = await bcrypt.hash('ContractTest1!', 12);
    await pool.query(
      `
      INSERT INTO users (
        user_id, username, email, password_hash, first_name, last_name, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Active')
      ON CONFLICT (user_id) DO UPDATE SET status = 'Active'
      `,
      [OWNER_USER, 'software-owner-1', 'software-owner-1@contract.test', passwordHash, 'Software', 'Owner']
    );

    await pool.query(
      `
      INSERT INTO users (
        user_id, username, email, password_hash, first_name, last_name, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Active')
      ON CONFLICT (user_id) DO UPDATE SET status = 'Active'
      `,
      [
        REGISTRAR_USER,
        'software-registrar',
        'software-registrar@contract.test',
        passwordHash,
        'Software',
        'Registrar'
      ]
    );

    await pool.query(`DELETE FROM user_roles WHERE user_id = $1`, [REGISTRAR_USER]);
    await pool.query(
      `
      INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
      SELECT $1, r.role_id, $1, CURRENT_TIMESTAMP, true
      FROM roles r
      WHERE r.role_name = 'super_admin'
      ON CONFLICT DO NOTHING
      `,
      [REGISTRAR_USER]
    );

    await pool.query(`DELETE FROM user_sessions WHERE session_id = $1`, [SESSION_ID]);
    await pool.query(
      `
      INSERT INTO user_sessions (session_id, user_id, refresh_token, expires_at, is_active)
      VALUES ($1, $2, $3, $4, true)
      `,
      [SESSION_ID, REGISTRAR_USER, `refresh-${SESSION_ID}`, new Date(Date.now() + 60 * 60 * 1000)]
    );

    app = buildApp();
  });

  afterAll(async () => {
    if (!process.env.VERIFICATION_RUN_ID) {
      await pool?.query('DELETE FROM governance_incidents WHERE external_ticket_id LIKE $1', ['SW-CASB-%']);
      await pool?.query('DELETE FROM software_casb_events WHERE app_name LIKE $1', ['contract-%']);
      await pool?.query(
        `DELETE FROM asset_register WHERE asset_id LIKE '/tenants/tenant-01/casb/shadow/software-%'`
      );
      await pool?.query('DELETE FROM managed_devices WHERE hostname LIKE $1', ['contract-sw-%']);
    }
    await pool?.end();
  });

  async function registerContractDevice() {
    const hostname = `contract-sw-device-${Date.now()}`;
    const response = await request(app)
      .post('/api/devices/register')
      .set('Authorization', authHeader())
      .send({
        hostname,
        ownerId: OWNER_USER,
        deviceType: 'laptop',
        tenantId: 'tenant-01'
      });
    expect(response.status).toBe(201);
    return response.body;
  }

  describe('POST /api/software/ingest', () => {
    it('persists CASB shadow IT event above risk threshold', async () => {
      const response = await request(app)
        .post('/api/software/ingest')
        .set(webhookHeader())
        .send({
          appName: 'contract-dropbox',
          userId: OWNER_USER,
          riskLevel: 'high',
          tenantId: 'tenant-01'
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.stringMatching(/^SW-/),
        appName: 'contract-dropbox',
        userId: OWNER_USER,
        riskLevel: 'high',
        riskScore: 85,
        assetId: expect.any(String)
      });

      const persisted = await pool.query(
        'SELECT * FROM software_casb_events WHERE event_id = $1',
        [response.body.id]
      );
      expect(persisted.rows.length).toBe(1);
      expect(persisted.rows[0].risk_level).toBe('high');
    });

    it('rejects invalid webhook signature', async () => {
      const response = await request(app)
        .post('/api/software/ingest')
        .set(webhookHeader('invalid'))
        .send({
          appName: 'contract-slack',
          userId: OWNER_USER,
          riskLevel: 'medium'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/webhook signature/i);
    });

    it('links ingestion event to device when provided', async () => {
      const device = await registerContractDevice();

      const response = await request(app)
        .post('/api/software/ingest')
        .set(webhookHeader())
        .send({
          appName: 'contract-notion',
          userId: OWNER_USER,
          deviceId: device.id,
          riskLevel: 'medium',
          tenantId: 'tenant-01'
        });

      expect(response.status).toBe(201);
      expect(response.body.deviceId).toBe(device.id);

      const persisted = await pool.query(
        'SELECT device_id FROM software_casb_events WHERE event_id = $1',
        [response.body.id]
      );
      expect(persisted.rows[0].device_id).toBe(device.id);
    });

    it('creates SecOps incident for high-risk software', async () => {
      const response = await request(app)
        .post('/api/software/ingest')
        .set(webhookHeader())
        .send({
          appName: 'contract-unknown-tool',
          userId: OWNER_USER,
          riskLevel: 'high',
          tenantId: 'tenant-01'
        });

      expect(response.status).toBe(201);
      expect(response.body.incident?.incidentId).toEqual(expect.any(Number));

      const incident = await pool.query(
        `SELECT incident_id, severity, external_ticket_id
         FROM governance_incidents
         WHERE external_ticket_id = $1`,
        [`SW-CASB-${response.body.id}`]
      );
      expect(incident.rows.length).toBe(1);
      expect(incident.rows[0].severity).toBe('HIGH');
    });
  });
});
