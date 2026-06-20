#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const frameworkRoot = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(frameworkRoot, '.env') });

const repoRoot = path.resolve(frameworkRoot, '..');
const runner = path.join(repoRoot, 'governance', 'rpas', 'scripts', 'run-powershell.js');
const script = path.join(repoRoot, 'governance', 'rpas', 'scripts', 'Test-GitToCloudRecovery.ps1');
const apiUrl = process.env.GOVERNANCE_API_URL || 'http://localhost:4000';

const childEnv = {
  ...process.env,
  GOVERNANCE_API_USERNAME: process.env.GOVERNANCE_API_USERNAME || 'superadmin',
  GOVERNANCE_API_PASSWORD: process.env.GOVERNANCE_API_PASSWORD || 'Admin123!'
};

const result = spawnSync(
  process.execPath,
  [runner, script, '-ApiUrl', apiUrl],
  { stdio: 'inherit', cwd: repoRoot, env: childEnv }
);

if (result.error) {
  console.error('G-B3 verification failed to launch:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
