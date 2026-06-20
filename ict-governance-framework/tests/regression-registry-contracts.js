/**
 * Auto-discover Jest contract suites from tests/contracts/*.contract.test.js.
 *
 * Activation rules (prevents accidental single-placeholder promotion):
 * - `pending` — no real it()/test() cases, or only one without readiness marker
 * - `active` — >= MIN_REAL_TESTS_FOR_ACTIVE real cases, OR @contract readiness:enforced with >= 1
 *
 * Add a new pillar contract file + `test:contracts:<pillar>` in package.json;
 * no manual row in regression-registry.js required.
 */
const fs = require('fs');
const path = require('path');

const CONTRACTS_DIR = path.join(__dirname, 'contracts');
const PILLAR_FROM_FILENAME = /^([a-z0-9-]+)\.contract\.test\.js$/i;
const MIN_REAL_TESTS_FOR_ACTIVE = 2;

function listContractFiles() {
  if (!fs.existsSync(CONTRACTS_DIR)) return [];
  return fs
    .readdirSync(CONTRACTS_DIR)
    .filter((name) => name.endsWith('.contract.test.js'))
    .map((name) => ({
      fileName: name,
      contractFile: `tests/contracts/${name}`.replace(/\\/g, '/'),
      fullPath: path.join(CONTRACTS_DIR, name)
    }))
    .sort((a, b) => a.fileName.localeCompare(b.fileName));
}

function parseContractHeader(content) {
  const meta = { pillar: null, setup: [], readinessEnforced: false };
  const header = content.slice(0, 1200);

  const pillarMatch = header.match(/@contract\s+pillar:([a-z0-9-]+)/i);
  if (pillarMatch) {
    meta.pillar = pillarMatch[1].toLowerCase();
  }

  const setupMatch = header.match(/@contract\s+setup:([^\n*]+)/i);
  if (setupMatch) {
    meta.setup = setupMatch[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((script) => (script.startsWith('setup:') ? script : `setup:${script}`));
  }

  meta.readinessEnforced = /@contract\s+readiness:enforced/i.test(header);

  return meta;
}

function pillarFromFileName(fileName) {
  const match = fileName.match(PILLAR_FROM_FILENAME);
  return match ? match[1].toLowerCase() : null;
}

/** Stable slug from `client-compliance-escalation.contract.test.js` → `client-compliance-escalation`. */
function contractSlugFromFileName(fileName) {
  return fileName.replace(/\.contract\.test\.js$/i, '').toLowerCase();
}

function stripBlockComments(content) {
  return content.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Count non-todo it() / test() cases in a contract file. */
function countRunnableTests(content) {
  const lines = stripBlockComments(content).split('\n');
  let count = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^it\.todo\s*\(/.test(trimmed) || /^test\.todo\s*\(/.test(trimmed)) continue;
    if (/\bit\s*\(\s*['"`]/.test(line) || /\btest\s*\(\s*['"`]/.test(line)) {
      count += 1;
    }
  }
  return count;
}

function countTodoTests(content) {
  const lines = stripBlockComments(content).split('\n');
  let count = 0;
  for (const line of lines) {
    if (/^\s*it\.todo\s*\(/.test(line) || /^\s*test\.todo\s*\(/.test(line)) {
      count += 1;
    }
  }
  return count;
}

/** @deprecated use countRunnableTests > 0 */
function hasRunnableTests(content) {
  return countRunnableTests(content) > 0;
}

/**
 * @param {{ readinessEnforced?: boolean }} headerMeta
 * @param {number} realTestCount
 * @returns {{ status: 'active' | 'pending', activationReason: string }}
 */
function resolveContractActivation(headerMeta, realTestCount) {
  if (realTestCount === 0) {
    return { status: 'pending', activationReason: 'todo-only' };
  }
  if (headerMeta.readinessEnforced) {
    return { status: 'active', activationReason: 'readiness:enforced' };
  }
  if (realTestCount >= MIN_REAL_TESTS_FOR_ACTIVE) {
    return { status: 'active', activationReason: 'threshold' };
  }
  return {
    status: 'pending',
    activationReason: `under-threshold (${realTestCount}/${MIN_REAL_TESTS_FOR_ACTIVE} tests; add more or @contract readiness:enforced)`
  };
}

function analyzeContractFile({ fileName, contractFile, fullPath }) {
  const content = fs.readFileSync(fullPath, 'utf8');
  const header = parseContractHeader(content);
  const pillar = header.pillar || pillarFromFileName(fileName);

  if (!pillar) {
    throw new Error(
      `Cannot infer pillar for ${contractFile}. Add "@contract pillar:<name>" to the file header.`
    );
  }

  const realTestCount = countRunnableTests(content);
  const todoTestCount = countTodoTests(content);
  const { status, activationReason } = resolveContractActivation(header, realTestCount);
  const contractSlug = contractSlugFromFileName(fileName);

  return {
    id: `contracts-${contractSlug}`,
    contractSlug,
    pillar,
    contractFile,
    realTestCount,
    todoTestCount,
    status,
    activationReason,
    readinessEnforced: header.readinessEnforced,
    setup: header.setup
  };
}

function discoverContractSuites() {
  return listContractFiles().map((file) => {
    const analysis = analyzeContractFile(file);
    const pillar = analysis.pillar;

    return {
      id: analysis.id,
      label: `${pillar.charAt(0).toUpperCase()}${pillar.slice(1)} — ${analysis.contractSlug}`,
      pillar,
      kind: 'jest-contract',
      npmScript: 'test:contracts',
      setup: analysis.setup.length ? analysis.setup : undefined,
      contractFile: analysis.contractFile,
      contractSlug: analysis.contractSlug,
      status: analysis.status,
      scope: 'pillar',
      requires: { database: true },
      _autoDiscovered: true,
      _activationReason: analysis.activationReason,
      _realTestCount: analysis.realTestCount,
      _todoTestCount: analysis.todoTestCount
    };
  });
}

function buildContractCoverageReport() {
  const pillars = listContractFiles().map(analyzeContractFile);
  const active = pillars.filter((p) => p.status === 'active');
  const pending = pillars.filter((p) => p.status === 'pending');
  const totalRealTests = pillars.reduce((sum, p) => sum + p.realTestCount, 0);
  const totalTodoTests = pillars.reduce((sum, p) => sum + p.todoTestCount, 0);

  return {
    pillars,
    activeCount: active.length,
    pendingCount: pending.length,
    totalPillars: pillars.length,
    coveragePct: pillars.length ? (active.length / pillars.length) * 100 : 0,
    totalRealTests,
    totalTodoTests,
    minRealTestsForActive: MIN_REAL_TESTS_FOR_ACTIVE
  };
}

module.exports = {
  MIN_REAL_TESTS_FOR_ACTIVE,
  discoverContractSuites,
  hasRunnableTests,
  countRunnableTests,
  countTodoTests,
  resolveContractActivation,
  analyzeContractFile,
  buildContractCoverageReport,
  listContractFiles,
  parseContractHeader,
  contractSlugFromFileName
};
