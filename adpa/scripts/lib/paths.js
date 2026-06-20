const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

function getRepoRoot() {
  return REPO_ROOT;
}

function getAdpaRoot() {
  return path.join(REPO_ROOT, 'adpa');
}

function getPaths() {
  return {
    repoRoot: REPO_ROOT,
    adpaRoot: getAdpaRoot(),
    projectManifest: path.join(getAdpaRoot(), 'project.manifest.json'),
    templateManifest: path.join(getAdpaRoot(), 'templates', 'manifest.json'),
    governanceArtifactManifest: path.join(
      getAdpaRoot(),
      'templates',
      'governance-artifacts',
      'manifest.json'
    ),
    processorConfig: path.join(getAdpaRoot(), 'config', 'processor-config.json'),
    generatedOutput: path.join(REPO_ROOT, 'generated-documents'),
    entitiesDir: path.join(getAdpaRoot(), 'entities'),
    tenantsDir: path.join(getAdpaRoot(), 'tenants'),
    tenantRegistry: path.join(getAdpaRoot(), 'tenants', 'registry.json'),
    translatorsDir: path.join(getAdpaRoot(), 'translators'),
    governanceRoot: path.join(REPO_ROOT, 'governance', 'rpas')
  };
}

module.exports = { getRepoRoot, getAdpaRoot, getPaths };
