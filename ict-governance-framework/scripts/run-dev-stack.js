'use strict';

/**
 * Starts Express API (4000) then Next.js dev (3000).
 * Use: npm run dev
 */
const { spawn, execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const isWin = process.platform === 'win32';

const children = [];

function freePort4000() {
  try {
    execSync('node scripts/free-port.js 4000', { cwd: root, stdio: 'inherit' });
  } catch {
    console.warn('[dev-stack] Could not verify port 4000 is free — continuing');
  }
}

function spawnProc(label, command, args, delayMs = 0) {
  setTimeout(() => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      shell: isWin,
      env: process.env
    });
    child.on('exit', (code) => {
      console.error(`[${label}] exited with code ${code ?? 1}`);
      children.forEach((c) => {
        if (!c.killed) c.kill();
      });
      process.exit(code ?? 1);
    });
    children.push(child);
    console.log(`[${label}] started (${command} ${args.join(' ')})`);
  }, delayMs);
}

function shutdown() {
  children.forEach((c) => {
    if (!c.killed) c.kill();
  });
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

freePort4000();
spawnProc('api', 'node', ['server.js'], 0);
spawnProc('next', 'npx', ['next', 'dev'], 2500);
