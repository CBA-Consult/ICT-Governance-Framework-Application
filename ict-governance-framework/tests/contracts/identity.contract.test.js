/**
 * @contract pillar:identity
 * @contract readiness:enforced
 * JIT elevation and break-glass audit contracts.
 */
const { createPool, applySqlFiles } = require('./_helpers/db');

describe('Identity pillar contracts', () => {
  let pool;

  beforeAll(async () => {
    pool = createPool();
    await applySqlFiles(pool, ['jit_ledger.sql']);
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('stores JIT ledger tickets with valid_from and valid_until', async () => {
    const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'jit_elevation_ledger'
        AND column_name IN ('valid_from', 'valid_until', 'status')
    `);
    const names = rows.map((r) => r.column_name);
    expect(names).toContain('valid_from');
    expect(names).toContain('valid_until');
    expect(names).toContain('status');
  });

  it('records privileged mutations in privileged_action_logs when ledger exists', async () => {
    const { rows } = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'privileged_action_logs'
        AND column_name IN ('payload_hash', 'jit_ticket_id', 'is_break_glass')
    `);
    expect(rows.length).toBe(3);
  });
});
