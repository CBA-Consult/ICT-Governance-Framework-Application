#!/usr/bin/env node
/**
 * Pre-flight checks before npm run verify:post-feature
 */
const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ROOT = path.join(__dirname, '..');
const errors = [];
const warnings = [];

function check(name, ok, message) {
  if (ok) {
    console.log(`  OK  ${name}`);
  } else if (message.startsWith('WARN:')) {
    warnings.push(`${name}: ${message.replace(/^WARN:\s*/, '')}`);
    console.log(`  WARN ${name} — ${message.replace(/^WARN:\s*/, '')}`);
  } else {
    errors.push(`${name}: ${message}`);
    console.log(`  FAIL ${name} — ${message}`);
  }
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(1500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('\nPre-flight: verify:post-feature\n');

  check(
    'Working directory',
    fs.existsSync(path.join(ROOT, 'package.json')),
    'Run from ict-governance-framework (npm run verify:post-feature)'
  );

  check(
    'Dependencies',
    fs.existsSync(path.join(ROOT, 'node_modules', 'jest')),
    'Run npm install in ict-governance-framework'
  );

  check(
    'DATABASE_URL',
    !!process.env.DATABASE_URL,
    'Set DATABASE_URL in .env (local Postgres required)'
  );

  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      await pool.query('SELECT 1');
      await pool.end();
      check('Database connectivity', true, '');
    } catch (err) {
      check('Database connectivity', false, err.message);
    }
  }

  const apiUp = await portOpen(4000);
  check(
    'API on :4000',
    apiUp,
    'WARN: npm run server not detected — verify:assets, verify:gb2, verify:gb3 will fail'
  );

  const isWin = process.platform === 'win32';
  if (isWin) {
    const pwsh = spawnSync('pwsh', ['-NoProfile', '-Command', '$null'], { stdio: 'ignore' });
    const ps = spawnSync('powershell', ['-NoProfile', '-Command', '$null'], { stdio: 'ignore' });
    check(
      'PowerShell (G-B3)',
      pwsh.status === 0 || ps.status === 0,
      'Install pwsh or Windows PowerShell for verify:gb3'
    );
  }

  const registry = spawnSync(process.execPath, ['scripts/validate-regression-registry.js'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  check(
    'Regression registry',
    registry.status === 0,
    (registry.stderr || registry.stdout || 'validate:registry failed').trim()
  );

  console.log('');
  if (warnings.length) {
    console.log(`Warnings (${warnings.length}): API suites need npm run server on :4000`);
  }
  if (errors.length) {
    console.error(`Pre-flight FAILED (${errors.length} blocking issue(s)). Fix before verify:post-feature.\n`);
    process.exit(1);
  }

  console.log('Pre-flight passed. Run: npm run verify:post-feature\n');
}

main().catch((err) => {
  console.error('Pre-flight error:', err.message);
  process.exit(1);
});
