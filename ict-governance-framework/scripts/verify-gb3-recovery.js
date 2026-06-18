#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');

require('dotenv').config();

const repoRoot = path.resolve(__dirname, '..', '..');
const runner = path.join(repoRoot, 'governance', 'rpas', 'scripts', 'run-powershell.js');
const script = path.join(repoRoot, 'governance', 'rpas', 'scripts', 'Test-GitToCloudRecovery.ps1');
const apiUrl = process.env.GOVERNANCE_API_URL || 'http://localhost:4000';

const result = spawnSync(
  process.execPath,
  [runner, script, '-ApiUrl', apiUrl],
  { stdio: 'inherit', cwd: repoRoot, env: process.env }
);

if (result.error) {
  console.error('G-B3 verification failed to launch:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
