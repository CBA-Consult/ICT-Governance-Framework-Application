const { spawnSync } = require('node:child_process');
const path = require('node:path');

const [scriptPath, ...scriptArgs] = process.argv.slice(2);

if (!scriptPath) {
  console.error('Usage: node governance/rpas/scripts/run-powershell.js <script> [args...]');
  process.exit(1);
}

const resolvedScriptPath = path.resolve(scriptPath);
const engines = process.platform === 'win32'
  ? ['pwsh', 'powershell']
  : ['pwsh', 'powershell'];

for (const engine of engines) {
  const engineArgs = engine === 'powershell'
    ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', resolvedScriptPath, ...scriptArgs]
    : ['-NoProfile', '-File', resolvedScriptPath, ...scriptArgs];

  const result = spawnSync(engine, engineArgs, { stdio: 'inherit' });

  if (result.error && result.error.code === 'ENOENT') {
    continue;
  }

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

console.error('No PowerShell runtime was found. Install pwsh or powershell.');
process.exit(1);
