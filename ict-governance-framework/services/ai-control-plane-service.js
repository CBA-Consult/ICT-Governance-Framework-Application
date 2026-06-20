'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const adpaLifecycle = require('./adpa-lifecycle-service');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BRIDGE_PATH = path.join(REPO_ROOT, 'adpa/coe/ai-control-plane-bridge.json');
const REGISTRY_PATH = path.join(REPO_ROOT, 'adpa/coe/ai-control-plane-registry.json');
const PROCESSOR_CONFIG_PATH = path.join(REPO_ROOT, 'adpa/config/processor-config.json');

function loadBridge() {
  return JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf8'));
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return { version: '1.0.0', providers: {}, assignments: [], auditTrail: [] };
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

function hashState(state) {
  return crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex');
}

function appendAudit(registry, event) {
  registry.auditTrail = registry.auditTrail || [];
  registry.auditTrail.unshift({
    auditId: crypto.randomUUID(),
    recordedAt: new Date().toISOString(),
    checksum: hashState(event),
    ...event
  });
  if (registry.auditTrail.length > 500) {
    registry.auditTrail = registry.auditTrail.slice(0, 500);
  }
}

function maskEndpoint(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}/...`;
  } catch {
    return 'configured';
  }
}

function processorToProvider(processorId, processor, activeProcessor) {
  const cfg = processor.config || {};
  const providerId = `processor-${processorId}`;
  return {
    providerId,
    processorRef: processorId,
    displayName: `${processor.type} — ${processorId}`,
    type: processor.type,
    endpoint: cfg.endpoint ? maskEndpoint(cfg.endpoint) : null,
    apiVersion: cfg.apiVersion || null,
    useEntraId: cfg.useEntraId || false,
    isActiveProcessor: processorId === activeProcessor,
    lifecyclePhase: processorId === activeProcessor ? 'active' : 'onboarding',
    status: 'registered',
    models: [
      {
        modelId: cfg.model || 'unknown',
        displayName: cfg.model || 'unknown',
        currentVersion: 1,
        lifecyclePhase: 'active',
        status: 'active',
        capabilities: ['chat', 'json-mode'],
        versions: [
          {
            version: 1,
            modelId: cfg.model || 'unknown',
            registeredAt: new Date().toISOString(),
            changeSummary: 'Imported from processor-config.json'
          }
        ]
      }
    ],
    metadata: { source: 'processor-config' },
    updatedAt: new Date().toISOString()
  };
}

function inferOutputTypesForTemplate(template) {
  const types = new Set();
  if (template.kind === 'document') {
    types.add(template.outputFormat === 'docx' ? 'document-docx' : 'document-md');
    return [...types];
  }

  types.add('json');
  if (template.artifactType === 'compliance-policy') {
    types.add('compliance-policy');
  }

  const artifactFile = template.file
    ? path.join(REPO_ROOT, 'adpa/templates/governance-artifacts', template.file.replace(/^adpa\/templates\/governance-artifacts\//, ''))
    : null;
  if (!artifactFile || !fs.existsSync(artifactFile)) {
    return [...types];
  }

  try {
    const body = JSON.parse(fs.readFileSync(artifactFile, 'utf8'));
    Object.entries(body.iacTargets || {}).forEach(([cloud, target]) => {
      if (target.format === 'bicep') types.add('bicep');
      if (target.format === 'terraform') types.add('terraform');
    });
    Object.entries(body.complianceTargets || {}).forEach(([key, target]) => {
      if (key === 'azurePolicy' || target.format === 'azure-policy') types.add('azure-policy');
      if (key === 'awsConfig' || target.format === 'aws-config-rule') types.add('aws-config');
    });
  } catch {
    // ignore parse errors
  }

  return [...types];
}

function cloudForOutputType(outputType) {
  const bridge = loadBridge();
  const def = bridge.outputTypes.find((t) => t.id === outputType);
  if (def?.cloudProvider) return def.cloudProvider;
  return null;
}

function buildDefaultAssignments(registry) {
  const activeProvider = Object.values(registry.providers).find((p) => p.isActiveProcessor)
    || Object.values(registry.providers)[0];
  if (!activeProvider) return [];

  const primaryModel = activeProvider.models?.[0];
  if (!primaryModel) return [];

  const templates = adpaLifecycle.listAllTemplates();
  const assignments = [];
  let counter = 0;

  templates.forEach((template) => {
    inferOutputTypesForTemplate(template).forEach((outputType) => {
      counter += 1;
      assignments.push({
        assignmentId: `${template.id}-${outputType}`,
        templateId: template.id,
        templateKind: template.kind,
        outputType,
        cloudProvider: cloudForOutputType(outputType),
        providerId: activeProvider.providerId,
        modelId: primaryModel.modelId,
        processorRef: activeProvider.processorRef,
        lifecyclePhase: 'active',
        version: 1,
        priority: outputType === 'json' || outputType === 'document-md' ? 10 : 20,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  });

  return assignments;
}

function syncFromProcessorConfig(actorEmail) {
  const registry = loadRegistry();
  const config = JSON.parse(fs.readFileSync(PROCESSOR_CONFIG_PATH, 'utf8'));
  let providersAdded = 0;
  let providersUpdated = 0;

  Object.entries(config.processors || {}).forEach(([processorId, processor]) => {
    const provider = processorToProvider(processorId, processor, config.activeProcessor);
    const existing = registry.providers[provider.providerId];
    if (!existing) {
      registry.providers[provider.providerId] = provider;
      providersAdded += 1;
    } else {
      registry.providers[provider.providerId] = {
        ...existing,
        ...provider,
        models: existing.models?.length ? existing.models : provider.models,
        lifecyclePhase: existing.lifecyclePhase || provider.lifecyclePhase
      };
      providersUpdated += 1;
    }
  });

  appendAudit(registry, {
    eventType: 'sync',
    eventAction: 'processor_config_import',
    actorEmail,
    newState: { providersAdded, providersUpdated, activeProcessor: config.activeProcessor }
  });

  saveRegistry(registry);
  return { providersAdded, providersUpdated, providerCount: Object.keys(registry.providers).length };
}

function seedAssignments(actorEmail, replace = false) {
  const registry = loadRegistry();
  if (!Object.keys(registry.providers).length) {
    syncFromProcessorConfig(actorEmail || 'system');
  }
  const reg = loadRegistry();
  const generated = buildDefaultAssignments(reg);

  if (replace || !reg.assignments.length) {
    reg.assignments = generated;
  } else {
    const existingIds = new Set(reg.assignments.map((a) => a.assignmentId));
    generated.forEach((a) => {
      if (!existingIds.has(a.assignmentId)) reg.assignments.push(a);
    });
  }

  appendAudit(reg, {
    eventType: 'assignments',
    eventAction: 'seed_from_templates',
    actorEmail,
    newState: { assignmentCount: reg.assignments.length }
  });

  saveRegistry(reg);
  return { assignmentCount: reg.assignments.length, assignmentsAdded: generated.length };
}

function getOverview() {
  const bridge = loadBridge();
  const registry = loadRegistry();
  const providers = listProviders();
  const assignments = listAssignments();
  const templates = adpaLifecycle.listAllTemplates();

  return {
    bridge: {
      outputTypes: bridge.outputTypes,
      providerTypes: bridge.providerTypes,
      lifecyclePhases: bridge.lifecyclePhases,
      assignmentRules: bridge.assignmentRules
    },
    stats: {
      providerCount: providers.length,
      activeProviders: providers.filter((p) => p.lifecyclePhase === 'active').length,
      modelCount: providers.reduce((n, p) => n + (p.models?.length || 0), 0),
      assignmentCount: assignments.length,
      enabledAssignments: assignments.filter((a) => a.enabled).length,
      templateCount: templates.length,
      templatesWithAssignment: new Set(assignments.map((a) => a.templateId)).size
    },
    activeProcessor: providers.find((p) => p.isActiveProcessor)?.processorRef || null
  };
}

function listProviders() {
  const registry = loadRegistry();
  return Object.values(registry.providers).sort((a, b) => {
    if (a.isActiveProcessor) return -1;
    if (b.isActiveProcessor) return 1;
    return a.displayName.localeCompare(b.displayName);
  });
}

function getProvider(providerId) {
  const registry = loadRegistry();
  const provider = registry.providers[providerId];
  if (!provider) return null;

  const assignments = registry.assignments.filter((a) => a.providerId === providerId);
  return { provider, assignments, auditTrail: registry.auditTrail.filter((e) => e.newState?.providerId === providerId || e.previousState?.providerId === providerId).slice(0, 50) };
}

function registerProvider(payload, actorEmail) {
  const registry = loadRegistry();
  const providerId = payload.providerId || `provider-${Date.now()}`;
  const existing = registry.providers[providerId];
  if (existing && !payload.allowUpdate) {
    throw new Error(`Provider already exists: ${providerId}`);
  }

  const provider = {
    ...(existing || {}),
    providerId,
    processorRef: payload.processorRef ?? existing?.processorRef ?? null,
    displayName: payload.displayName || existing?.displayName || providerId,
    type: payload.type || existing?.type || 'azure',
    endpoint: payload.endpoint ? maskEndpoint(payload.endpoint) : (existing?.endpoint ?? null),
    apiVersion: payload.apiVersion ?? existing?.apiVersion ?? null,
    useEntraId: payload.useEntraId ?? existing?.useEntraId ?? false,
    isActiveProcessor: existing?.isActiveProcessor ?? false,
    lifecyclePhase: payload.lifecyclePhase || existing?.lifecyclePhase || 'initiation',
    status: payload.status || existing?.status || 'registered',
    models: payload.models || existing?.models || [],
    metadata: { ...(existing?.metadata || {}), ...(payload.metadata || {}) },
    updatedAt: new Date().toISOString()
  };

  registry.providers[providerId] = provider;
  appendAudit(registry, {
    eventType: 'provider',
    eventAction: existing ? 'updated' : 'registered',
    actorEmail,
    newState: { providerId, displayName: provider.displayName }
  });
  saveRegistry(registry);
  return provider;
}

function registerModel(providerId, payload, actorEmail) {
  const registry = loadRegistry();
  const provider = registry.providers[providerId];
  if (!provider) throw new Error('Provider not found');

  const modelId = payload.modelId;
  if (!modelId) throw new Error('modelId required');

  const existing = (provider.models || []).find((m) => m.modelId === modelId);
  const newVersion = existing ? (existing.currentVersion || 1) + 1 : 1;

  const model = {
    modelId,
    displayName: payload.displayName || modelId,
    currentVersion: newVersion,
    lifecyclePhase: payload.lifecyclePhase || 'onboarding',
    status: payload.status || 'registered',
    capabilities: payload.capabilities || ['chat'],
    deploymentName: payload.deploymentName || null,
    foundryProjectId: payload.foundryProjectId || null,
    versions: [
      ...(existing?.versions || []),
      {
        version: newVersion,
        modelId,
        deploymentName: payload.deploymentName || null,
        registeredAt: new Date().toISOString(),
        changeSummary: payload.changeSummary || 'Model version registered',
        registeredBy: actorEmail
      }
    ]
  };

  provider.models = (provider.models || []).filter((m) => m.modelId !== modelId);
  provider.models.push(model);
  provider.updatedAt = new Date().toISOString();

  appendAudit(registry, {
    eventType: 'model',
    eventAction: `model_v${newVersion}`,
    actorEmail,
    newState: { providerId, modelId, version: newVersion }
  });
  saveRegistry(registry);
  return model;
}

function listModels(providerId) {
  if (providerId) {
    const detail = getProvider(providerId);
    return detail?.provider?.models || [];
  }
  return listProviders().flatMap((p) => (p.models || []).map((m) => ({ ...m, providerId: p.providerId, providerName: p.displayName })));
}

function listAssignments(filters = {}) {
  const registry = loadRegistry();
  let items = registry.assignments || [];
  if (filters.templateId) items = items.filter((a) => a.templateId === filters.templateId);
  if (filters.providerId) items = items.filter((a) => a.providerId === filters.providerId);
  if (filters.outputType) items = items.filter((a) => a.outputType === filters.outputType);
  if (filters.enabled !== undefined) items = items.filter((a) => a.enabled === filters.enabled);
  return items.sort((a, b) => a.priority - b.priority || a.templateId.localeCompare(b.templateId));
}

function createAssignment(payload, actorEmail) {
  const registry = loadRegistry();
  const bridge = loadBridge();

  if (!bridge.outputTypes.find((t) => t.id === payload.outputType)) {
    throw new Error(`Unknown output type: ${payload.outputType}`);
  }
  if (!registry.providers[payload.providerId]) {
    throw new Error('Provider not found');
  }

  const assignmentId = payload.assignmentId
    || `${payload.templateId}-${payload.outputType}${payload.cloudProvider ? `-${payload.cloudProvider}` : ''}`;

  const assignment = {
    assignmentId,
    templateId: payload.templateId,
    templateKind: payload.templateKind || null,
    outputType: payload.outputType,
    cloudProvider: payload.cloudProvider || cloudForOutputType(payload.outputType),
    providerId: payload.providerId,
    modelId: payload.modelId,
    processorRef: payload.processorRef || registry.providers[payload.providerId].processorRef,
    lifecyclePhase: payload.lifecyclePhase || 'initiation',
    version: payload.version || 1,
    priority: payload.priority ?? 100,
    enabled: payload.enabled !== false,
    temperature: payload.temperature,
    maxTokens: payload.maxTokens,
    notes: payload.notes || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  registry.assignments = (registry.assignments || []).filter((a) => a.assignmentId !== assignmentId);
  registry.assignments.push(assignment);

  appendAudit(registry, {
    eventType: 'assignment',
    eventAction: 'created',
    actorEmail,
    newState: assignment
  });
  saveRegistry(registry);
  return assignment;
}

function updateAssignment(assignmentId, payload, actorEmail) {
  const registry = loadRegistry();
  const idx = registry.assignments.findIndex((a) => a.assignmentId === assignmentId);
  if (idx < 0) throw new Error('Assignment not found');

  const previous = { ...registry.assignments[idx] };
  registry.assignments[idx] = {
    ...registry.assignments[idx],
    ...payload,
    assignmentId,
    version: (previous.version || 1) + 1,
    updatedAt: new Date().toISOString()
  };

  appendAudit(registry, {
    eventType: 'assignment',
    eventAction: 'updated',
    actorEmail,
    previousState: previous,
    newState: registry.assignments[idx]
  });
  saveRegistry(registry);
  return registry.assignments[idx];
}

function getTemplateFromAdpa(templateId) {
  return adpaLifecycle.listAllTemplates().find((t) => t.id === templateId) || null;
}

function loadTemplateBody(templateId) {
  const template = getTemplateFromAdpa(templateId);
  if (!template) return null;

  if (template.kind === 'governance-artifact') {
    const rel = template.file.replace(/^adpa\/templates\/governance-artifacts\//, '');
    const filePath = path.join(REPO_ROOT, 'adpa/templates/governance-artifacts', rel);
    if (fs.existsSync(filePath)) {
      return { template, body: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
    }
  }

  if (template.kind === 'document' && template.file) {
    const filePath = path.join(REPO_ROOT, 'adpa/templates', template.file);
    if (fs.existsSync(filePath)) {
      return { template, body: fs.readFileSync(filePath, 'utf8') };
    }
  }

  return { template, body: null };
}

function resolveGenerationRoute({ templateId, outputType, cloudProvider, tenantId }) {
  const bridge = loadBridge();
  const registry = loadRegistry();
  const outputDef = bridge.outputTypes.find((t) => t.id === outputType);
  if (!outputDef) {
    throw new Error(`Unknown output type: ${outputType}`);
  }

  const candidates = listAssignments({ templateId, outputType, enabled: true })
    .filter((a) => a.lifecyclePhase === 'active')
    .filter((a) => !cloudProvider || !a.cloudProvider || a.cloudProvider === cloudProvider);

  if (!candidates.length) {
    throw new Error(`No active assignment for template ${templateId} → ${outputType}`);
  }

  const assignment = candidates.sort((a, b) => a.priority - b.priority)[0];
  const provider = registry.providers[assignment.providerId];
  if (!provider) throw new Error('Assigned provider not found');

  const model = (provider.models || []).find((m) => m.modelId === assignment.modelId);
  if (!model) throw new Error('Assigned model not found on provider');

  if (bridge.assignmentRules.requireActiveProviderForGeneration && provider.lifecyclePhase !== 'active') {
    throw new Error(`Provider ${provider.providerId} is not active`);
  }
  if (bridge.assignmentRules.requireActiveModelForGeneration && model.lifecyclePhase !== 'active') {
    throw new Error(`Model ${model.modelId} is not active`);
  }

  const loaded = loadTemplateBody(templateId);
  const translator = loaded?.body?.iacTargets?.[cloudProvider || assignment.cloudProvider]
    || loaded?.body?.complianceTargets?.[assignment.outputType === 'azure-policy' ? 'azurePolicy' : null];

  return {
    assignment,
    provider: {
      providerId: provider.providerId,
      type: provider.type,
      processorRef: assignment.processorRef,
      endpoint: provider.endpoint,
      useEntraId: provider.useEntraId
    },
    model: {
      modelId: model.modelId,
      version: model.currentVersion,
      capabilities: model.capabilities,
      deploymentName: model.deploymentName
    },
    output: {
      outputType,
      label: outputDef.label,
      artifactLayer: outputDef.artifactLayer,
      mimeType: outputDef.mimeType,
      cloudProvider: cloudProvider || assignment.cloudProvider
    },
    template: loaded?.template || null,
    llm: loaded?.body?.llmProcessing || null,
    translator: translator || null,
    outputPathPattern: translator?.outputPathPattern?.replace('{{tenantId}}', tenantId || '{{tenantId}}') || null,
    generationReady: true
  };
}

function getAuditTrail(limit = 100) {
  return loadRegistry().auditTrail.slice(0, limit);
}

module.exports = {
  loadBridge,
  getOverview,
  syncFromProcessorConfig,
  seedAssignments,
  listProviders,
  getProvider,
  registerProvider,
  registerModel,
  listModels,
  listAssignments,
  createAssignment,
  updateAssignment,
  resolveGenerationRoute,
  getAuditTrail,
  inferOutputTypesForTemplate
};
