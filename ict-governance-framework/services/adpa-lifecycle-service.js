'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function getAdpaRoot() {
  return path.join(REPO_ROOT, 'adpa');
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function safeLoadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return loadJson(filePath);
}

function fileStat(relativePath) {
  const full = path.join(REPO_ROOT, relativePath);
  if (!fs.existsSync(full)) return null;
  const stat = fs.statSync(full);
  return {
    path: relativePath.replace(/\\/g, '/'),
    size: stat.size,
    modifiedAt: stat.mtime.toISOString()
  };
}

function listDocumentTemplates() {
  const manifest = loadJson(path.join(getAdpaRoot(), 'templates', 'manifest.json'));
  return manifest.templates.map((t) => ({
    id: t.id,
    kind: 'document',
    file: t.file,
    frameworkSource: t.frameworkSource,
    outputCategory: t.outputCategory,
    outputFormat: t.outputFormat || 'markdown',
    pmbokDomain: t.pmbokDomain,
    lifecycleStage: mapTemplateLifecycleStage(t),
    status: fs.existsSync(path.join(getAdpaRoot(), 'templates', t.file)) ? 'active' : 'missing'
  }));
}

function listArtifactTemplates() {
  const manifestPath = path.join(getAdpaRoot(), 'templates', 'governance-artifacts', 'manifest.json');
  if (!fs.existsSync(manifestPath)) return [];
  const manifest = loadJson(manifestPath);
  return manifest.templates.map((t) => ({
    id: t.id,
    kind: 'governance-artifact',
    pillar: t.pillar,
    artifactType: t.artifactType,
    nistCategories: t.nistCategories,
    file: `adpa/templates/governance-artifacts/${t.file}`,
    lifecycleStage: 'execution',
    status: fs.existsSync(path.join(REPO_ROOT, 'adpa/templates/governance-artifacts', t.file))
      ? 'active'
      : 'missing'
  }));
}

function mapTemplateLifecycleStage(template) {
  if (template.outputFormat === 'docx') return 'execution';
  if (template.outputCategory === 'compliance') return 'csr-baseline';
  if (template.outputCategory === 'implementation-guides') return 'rtm-seed';
  if (template.outputCategory === 'management-plans') return 'approval';
  return 'ideation';
}

function listAllTemplates() {
  return [...listDocumentTemplates(), ...listArtifactTemplates()];
}

function listAiProviders() {
  const configPath = path.join(getAdpaRoot(), 'config', 'processor-config.json');
  const config = loadJson(configPath);
  const active = config.activeProcessor || 'default';

  return Object.entries(config.processors || {}).map(([id, processor]) => ({
    id,
    type: processor.type,
    model: processor.config?.model || 'unknown',
    endpoint: processor.config?.endpoint ? maskEndpoint(processor.config.endpoint) : null,
    apiVersion: processor.config?.apiVersion || null,
    useEntraId: processor.config?.useEntraId || false,
    isActive: id === active,
    status: id === active ? 'active' : 'standby'
  }));
}

function maskEndpoint(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}/...`;
  } catch {
    return 'configured';
  }
}

function listLifecycleStages() {
  const lifecycle = loadJson(path.join(getAdpaRoot(), 'systematics', 'lifecycle.json'));
  return lifecycle.stages;
}

function listTenants() {
  const registryPath = path.join(getAdpaRoot(), 'tenants', 'registry.json');
  if (!fs.existsSync(registryPath)) return [];
  const registry = loadJson(registryPath);
  return registry.tenants.map((t) => {
    const manifest = safeLoadJson(path.join(REPO_ROOT, t.manifestPath));
    const docVersions = getTenantDocumentVersions(t.tenantId);
    return {
      tenantId: t.tenantId,
      displayName: t.displayName,
      manifestPath: t.manifestPath,
      entityRef: t.entityRef,
      version: manifest?.version || '1.0.0',
      cloudProfile: manifest?.cloudProfile || null,
      requirementCount: manifest?.requirements?.length || 0,
      documentVersions: docVersions.length,
      latestDocumentVersion: docVersions[0]?.documentVersion || null,
      lastUpdatedAt: manifest?.lastUpdatedAt || null
    };
  });
}

function getTenantManifest(tenantId) {
  const registry = loadJson(path.join(getAdpaRoot(), 'tenants', 'registry.json'));
  const entry = registry.tenants.find((t) => t.tenantId === tenantId);
  if (!entry) return null;
  return safeLoadJson(path.join(REPO_ROOT, entry.manifestPath));
}

function getTenantArtifacts(tenantId) {
  const manifest = getTenantManifest(tenantId);
  if (!manifest) return null;

  const requirements = (manifest.requirements || []).map((req) => {
    const data = safeLoadJson(path.join(REPO_ROOT, req.path));
    return {
      requirementId: req.requirementId,
      templateId: req.templateId,
      status: req.status,
      path: req.path,
      pillar: data?.pillar,
      priority: data?.priority,
      title: data?.title,
      artifactIds: req.artifactIds || []
    };
  });

  const infraPath = path.join(getAdpaRoot(), 'tenants', tenantId, 'approved-infrastructure.json');
  const infrastructure = safeLoadJson(infraPath);

  const generatedDir = path.join(getAdpaRoot(), 'tenants', tenantId, 'generated');
  const generated = [];
  if (fs.existsSync(generatedDir)) {
    fs.readdirSync(generatedDir)
      .filter((f) => f.endsWith('.json'))
      .forEach((f) => {
        const data = safeLoadJson(path.join(generatedDir, f));
        generated.push({
          file: `adpa/tenants/${tenantId}/generated/${f}`,
          artifactId: data?.artifactId,
          generationStatus: data?.generationStatus,
          templateId: data?.templateId
        });
      });
  }

  let entity = null;
  const registry = loadJson(path.join(getAdpaRoot(), 'tenants', 'registry.json'));
  const entry = registry.tenants.find((t) => t.tenantId === tenantId);
  if (entry?.entityRef) {
    entity = safeLoadJson(path.join(REPO_ROOT, entry.entityRef));
  }

  return {
    tenantId,
    displayName: manifest.displayName,
    version: manifest.version,
    cloudProfile: manifest.cloudProfile,
    requirements,
    infrastructure: infrastructure?.components || [],
    infrastructureMeta: infrastructure
      ? {
          approvedBy: infrastructure.approvedBy,
          approvedAt: infrastructure.approvedAt,
          csrBaseline: infrastructure.csrBaseline
        }
      : null,
    generated,
    entity: entity
      ? {
          entityId: entity.entityId,
          riskScore: entity.riskScore,
          driftCategory: entity.driftCategory,
          lastObservedAt: entity.lastObservedAt
        }
      : null
  };
}

function getTenantDocumentVersions(tenantId) {
  const versions = [];
  const seen = new Set();

  const manifestPaths = [
    path.join(REPO_ROOT, 'generated-documents', 'governance', tenantId, '.adpa-generation.json'),
    path.join(getAdpaRoot(), 'tenants', tenantId, 'documents', '.adpa-generation.json')
  ];

  manifestPaths.forEach((manifestPath) => {
    const records = safeLoadJson(manifestPath);
    if (!Array.isArray(records)) return;
    records.forEach((record) => {
      const key = `${record.generatedAt}-${record.documentVersion}`;
      if (seen.has(key)) return;
      seen.add(key);
      versions.push({
        templateId: record.templateId,
        tenantId: record.tenantId,
        documentVersion: record.documentVersion,
        generatedAt: record.generatedAt,
        markdownPath: record.markdownPath,
        docxPath: record.docxPath,
        lifecycleStatus: inferDocumentLifecycleStatus(record)
      });
    });
  });

  const tenantDocDir = path.join(getAdpaRoot(), 'tenants', tenantId, 'documents');
  if (fs.existsSync(tenantDocDir)) {
    fs.readdirSync(tenantDocDir).forEach((file) => {
      if (!file.endsWith('.docx') && !file.endsWith('.md')) return;
      const stat = fs.statSync(path.join(tenantDocDir, file));
      const versionMatch = file.match(/v(\d+\.\d+\.\d+)/);
      const version = versionMatch ? versionMatch[1] : 'unknown';
      const key = `file-${file}-${stat.mtime.toISOString()}`;
      if (seen.has(key)) return;
      seen.add(key);
      versions.push({
        templateId: 'tenant-governance-documentation',
        tenantId,
        documentVersion: version,
        generatedAt: stat.mtime.toISOString(),
        markdownPath: file.endsWith('.md') ? `adpa/tenants/${tenantId}/documents/${file}` : null,
        docxPath: file.endsWith('.docx') ? `adpa/tenants/${tenantId}/documents/${file}` : null,
        lifecycleStatus: 'published',
        fileName: file
      });
    });
  }

  return versions.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
}

function inferDocumentLifecycleStatus(record) {
  if (record.docxPath) return 'published';
  if (record.markdownPath) return 'draft';
  return 'generated';
}

function listDocumentLibrary(tenantId = null) {
  const tenants = tenantId ? [{ tenantId }] : listTenants().map((t) => ({ tenantId: t.tenantId }));
  const library = [];

  tenants.forEach(({ tenantId: tid }) => {
    const tenant = listTenants().find((t) => t.tenantId === tid);
    getTenantDocumentVersions(tid).forEach((doc) => {
      library.push({
        ...doc,
        displayName: tenant?.displayName || tid
      });
    });
  });

  return library.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
}

function getOverview() {
  const templates = listAllTemplates();
  const providers = listAiProviders();
  const tenants = listTenants();
  const documents = listDocumentLibrary();

  return {
    templates: {
      total: templates.length,
      document: templates.filter((t) => t.kind === 'document').length,
      governanceArtifact: templates.filter((t) => t.kind === 'governance-artifact').length,
      active: templates.filter((t) => t.status === 'active').length
    },
    aiProviders: {
      total: providers.length,
      active: providers.find((p) => p.isActive)?.id || null
    },
    tenants: {
      total: tenants.length,
      totalRequirements: tenants.reduce((sum, t) => sum + t.requirementCount, 0)
    },
    documents: {
      total: documents.length,
      published: documents.filter((d) => d.lifecycleStatus === 'published').length
    },
    lifecycleModel: loadJson(path.join(getAdpaRoot(), 'systematics', 'lifecycle.json')).model
  };
}

async function generateTenantDocument(tenantId) {
  const generatePath = path.join(REPO_ROOT, 'adpa', 'scripts', 'generate-governance-doc.js');
  const { generateGovernanceDocumentation } = require(generatePath);
  return generateGovernanceDocumentation(tenantId);
}

function loadGovernanceScopeModel() {
  const scopePath = path.join(getAdpaRoot(), 'coe', 'governance-scope-model.json');
  return loadJson(scopePath);
}

function getTenantGovernedAssets(tenantId) {
  const assetsPath = path.join(getAdpaRoot(), 'tenants', tenantId, 'governed-assets.json');
  if (!fs.existsSync(assetsPath)) return { tenantId, assets: [] };
  return loadJson(assetsPath);
}

function getFullScopeSummary() {
  const scope = loadGovernanceScopeModel();
  const tenants = listTenants();
  let totalAssets = 0;
  const assetsByLayer = {};
  const assetsByProvider = {};

  tenants.forEach((t) => {
    const governed = getTenantGovernedAssets(t.tenantId);
    governed.assets.forEach((a) => {
      totalAssets++;
      assetsByLayer[a.scopeLayer] = (assetsByLayer[a.scopeLayer] || 0) + 1;
      assetsByProvider[a.cloudProvider] = (assetsByProvider[a.cloudProvider] || 0) + 1;
    });
  });

  return {
    scopeModel: scope,
    inventory: {
      tenantCount: tenants.length,
      totalGovernedAssets: totalAssets,
      assetsByScopeLayer: assetsByLayer,
      assetsByCloudProvider: assetsByProvider,
      scopeLayerCount: scope.scopeLayers.length,
      cloudProviderCount: scope.cloudProviders.length
    }
  };
}

module.exports = {
  REPO_ROOT,
  getOverview,
  loadGovernanceScopeModel,
  getTenantGovernedAssets,
  getFullScopeSummary,
  listAllTemplates,
  listDocumentTemplates,
  listArtifactTemplates,
  listAiProviders,
  listLifecycleStages,
  listTenants,
  getTenantArtifacts,
  getTenantDocumentVersions,
  listDocumentLibrary,
  generateTenantDocument
};
