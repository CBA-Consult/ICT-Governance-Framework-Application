'use strict';

/**
 * Best-effort release of a TCP listen port before starting the dev API.
 * Usage: node scripts/free-port.js 4000
 */
const { execSync } = require('child_process');

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port <= 0) {
  console.error('Usage: node scripts/free-port.js <port>');
  process.exit(1);
}

function freePortOnWindows(targetPort) {
  try {
    const out = execSync(`netstat -ano | findstr :${targetPort}`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split('\n')) {
      if (!/LISTENING/i.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[free-port] Stopped PID ${pid} on port ${targetPort}`);
      } catch {
        // ignore individual kill failures
      }
    }
  } catch {
    // port already free or netstat found nothing
  }
}

function freePortOnUnix(targetPort) {
  try {
    execSync(`lsof -ti tcp:${targetPort} | xargs -r kill -9`, { stdio: 'ignore', shell: true });
    console.log(`[free-port] Cleared port ${targetPort}`);
  } catch {
    // port already free
  }
}

if (process.platform === 'win32') {
  freePortOnWindows(port);
} else {
  freePortOnUnix(port);
}
