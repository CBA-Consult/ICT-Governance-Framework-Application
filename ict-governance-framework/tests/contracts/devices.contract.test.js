/**
 * @contract pillar:devices
 * @contract setup:managed-devices
 * @contract readiness:enforced
 * POST /api/devices/register — governance-first endpoint inventory.
 */
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const devicesRouter = require('../../api/devices-router');
const { createPool, applySqlFiles, ensureTenant } = require('./_helpers/db');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const REGISTRAR_USER = 'USR-DEVICE-REGISTRAR-001';
const OWNER_USER = 'user-1';
const SESSION_ID = 'devices-contract-session';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/devices', devicesRouter);
  return app;
}

function authHeader() {
  const token = jwt.sign(
    { userId: REGISTRAR_USER, sessionId: SESSION_ID, type: 'access' },
    JWT_ACCESS_SECRET,
    { expiresIn: '5m' }
  );
  return `Bearer ${token}`;
}

describe('Devices pillar contracts', () => {
  let pool;
  let app;

  beforeAll(async () => {
    pool = createPool();
    await applySqlFiles(pool, [
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
      [OWNER_USER, 'device-owner-1', 'device-owner-1@contract.test', passwordHash, 'Device', 'Owner']
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
        'device-registrar',
        'device-registrar@contract.test',
        passwordHash,
        'Device',
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
      await pool?.query('DELETE FROM governance_incidents WHERE external_ticket_id LIKE $1', ['DEV-COMP-%']);
      await pool?.query('DELETE FROM managed_devices WHERE hostname LIKE $1', ['contract-%']);
    }
    await pool?.end();
  });

  async function registerContractDevice(hostnameSuffix) {
    const hostname = `contract-${hostnameSuffix}-${Date.now()}`;
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

  describe('POST /api/devices/register', () => {
    it('registers a new device with governance metadata', async () => {
      const hostname = `contract-laptop-${Date.now()}`;
      const response = await request(app)
        .post('/api/devices/register')
        .set('Authorization', authHeader())
        .send({
          hostname,
          ownerId: OWNER_USER,
          deviceType: 'laptop',
          os: 'Windows 11',
          complianceStatus: 'pending',
          tenantId: 'tenant-01'
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        hostname,
        ownerId: OWNER_USER,
        deviceType: 'laptop',
        complianceStatus: 'pending',
        os: 'Windows 11'
      });

      const persisted = await pool.query(
        'SELECT * FROM managed_devices WHERE device_id = $1',
        [response.body.id]
      );
      expect(persisted.rows.length).toBe(1);
      expect(persisted.rows[0].owner_id).toBe(OWNER_USER);
    });

    it('rejects device without owner', async () => {
      const response = await request(app)
        .post('/api/devices/register')
        .set('Authorization', authHeader())
        .send({
          hostname: 'contract-orphan-device',
          deviceType: 'server',
          tenantId: 'tenant-01'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/owner/i);
    });

    it('rejects invalid device type', async () => {
      const response = await request(app)
        .post('/api/devices/register')
        .set('Authorization', authHeader())
        .send({
          hostname: 'contract-weird-device',
          ownerId: OWNER_USER,
          deviceType: 'alien-tech',
          tenantId: 'tenant-01'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/device type/i);
    });

    it('defaults compliance status to pending when omitted', async () => {
      const hostname = `contract-default-pending-${Date.now()}`;
      const response = await request(app)
        .post('/api/devices/register')
        .set('Authorization', authHeader())
        .send({
          hostname,
          ownerId: OWNER_USER,
          deviceType: 'desktop',
          tenantId: 'tenant-01'
        });

      expect(response.status).toBe(201);
      expect(response.body.complianceStatus).toBe('pending');
    });
  });

  describe('POST /api/devices/:id/compliance-check', () => {
    it('evaluates device compliance and updates status to compliant', async () => {
      const device = await registerContractDevice('compliance-pass');

      const response = await request(app)
        .post(`/api/devices/${device.id}/compliance-check`)
        .set('Authorization', authHeader())
        .send({
          checks: {
            osPatched: true,
            diskEncrypted: true,
            antivirusActive: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: device.id,
        complianceStatus: 'compliant',
        lastCheckedAt: expect.any(String)
      });
      expect(response.body.incident).toBeNull();

      const persisted = await pool.query(
        'SELECT compliance_status, last_compliance_check_at FROM managed_devices WHERE device_id = $1',
        [device.id]
      );
      expect(persisted.rows[0].compliance_status).toBe('compliant');
      expect(persisted.rows[0].last_compliance_check_at).toBeTruthy();
    });

    it('marks device non_compliant when any check fails', async () => {
      const device = await registerContractDevice('compliance-fail');

      const response = await request(app)
        .post(`/api/devices/${device.id}/compliance-check`)
        .set('Authorization', authHeader())
        .send({
          checks: {
            osPatched: false,
            diskEncrypted: true,
            antivirusActive: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.complianceStatus).toBe('non_compliant');
      expect(response.body.incident?.incidentId).toEqual(expect.any(Number));
    });

    it('raises a SecOps incident when device is non_compliant', async () => {
      const device = await registerContractDevice('secops-bridge');

      await request(app)
        .post(`/api/devices/${device.id}/compliance-check`)
        .set('Authorization', authHeader())
        .send({
          checks: { osPatched: false, diskEncrypted: false }
        });

      const incident = await pool.query(
        `SELECT incident_id, severity, external_ticket_id
         FROM governance_incidents
         WHERE external_ticket_id = $1`,
        [`DEV-COMP-${device.id}`]
      );
      expect(incident.rows.length).toBe(1);
      expect(incident.rows[0].severity).toBe('HIGH');
    });

    it('rejects unknown device', async () => {
      const response = await request(app)
        .post('/api/devices/DEV-DOES-NOT-EXIST/compliance-check')
        .set('Authorization', authHeader())
        .send({
          checks: { osPatched: true }
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/not found/i);
    });
  });

  describe('GET /api/devices/:id', () => {
    it('returns an existing device with full persisted state', async () => {
      const hostname = `contract-lookup-${Date.now()}`;
      const registerRes = await request(app)
        .post('/api/devices/register')
        .set('Authorization', authHeader())
        .send({
          hostname,
          ownerId: OWNER_USER,
          deviceType: 'laptop',
          tenantId: 'tenant-01'
        });

      expect(registerRes.status).toBe(201);
      const { id } = registerRes.body;

      const response = await request(app)
        .get(`/api/devices/${id}`)
        .set('Authorization', authHeader());

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id,
        hostname,
        ownerId: OWNER_USER,
        deviceType: 'laptop',
        complianceStatus: 'pending',
        tenantId: 'tenant-01'
      });
      expect(response.body.createdAt).toEqual(expect.any(String));
    });

    it('returns 404 for unknown device', async () => {
      const response = await request(app)
        .get('/api/devices/DEV-DOES-NOT-EXIST')
        .set('Authorization', authHeader());

      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/not found/i);
    });

    it('reflects compliance changes after check', async () => {
      const device = await registerContractDevice('get-after-check');

      await request(app)
        .post(`/api/devices/${device.id}/compliance-check`)
        .set('Authorization', authHeader())
        .send({
          checks: { osPatched: false, diskEncrypted: true }
        });

      const response = await request(app)
        .get(`/api/devices/${device.id}`)
        .set('Authorization', authHeader());

      expect(response.status).toBe(200);
      expect(response.body.complianceStatus).toBe('non_compliant');
      expect(response.body.lastCheckedAt).toEqual(expect.any(String));
    });
  });
});
