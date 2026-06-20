'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const adpaLifecycle = require('./adpa-lifecycle-service');
const coeLifecycle = require('./coe-lifecycle-service');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BRIDGE_PATH = path.join(REPO_ROOT, 'adpa/coe/template-lifecycle-bridge.json');
const REGISTRY_PATH = path.join(REPO_ROOT, 'adpa/coe/template-registry.json');

let pool;
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

function loadBridge() {
  return JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf8'));
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return { version: '1.0.0', items: {} };
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

function hashState(state) {
  return crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex');
}

async function isDbAvailable() {
  const p = getPool();
  if (!p) return false;
  try {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('db timeout')), 2000);
    });
    await Promise.race([p.query('SELECT 1'), timeout]);
    return true;
  } catch {
    return false;
  }
}

function getAdpaTemplate(templateId) {
  return adpaLifecycle.listAllTemplates().find((t) => t.id === templateId) || null;
}

function validateDocumentTemplate(templateId) {
  const errors = [];
  const warnings = [];
  const template = getAdpaTemplate(templateId);
  if (!template) {
    errors.push(`Template not found in ADPA inventory: ${templateId}`);
    return { valid: false, errors, warnings };
  }

  if (template.kind === 'governance-artifact') {
    const { validateGovernanceArtifactTemplates } = require(path.join(
      REPO_ROOT,
      'adpa/scripts/validate-templates.js'
    ));
    const result = validateGovernanceArtifactTemplates();
    const entryErrors = result.errors.filter((e) => e.includes(templateId));
    const entryWarnings = result.warnings.filter((w) => w.includes(templateId));
    return {
      valid: entryErrors.length === 0 && template.status === 'active',
      errors: entryErrors.length ? entryErrors : (template.status !== 'active' ? [`Template file missing or inactive: ${templateId}`] : []),
      warnings: entryWarnings
    };
  }

  const filePath = path.join(REPO_ROOT, 'adpa/templates', template.file);
  if (!fs.existsSync(filePath)) {
    errors.push(`Document template file missing: ${template.file}`);
  } else {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('adpa:') && !content.includes('templateId')) {
      warnings.push('Template may be missing ADPA frontmatter metadata');
    }
  }

  if (template.frameworkSource) {
    const fwPath = path.join(REPO_ROOT, template.frameworkSource);
    if (!fs.existsSync(fwPath)) {
      warnings.push(`Framework source not found: ${template.frameworkSource}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function runFrameworkAlignmentCheck(templateId) {
  const template = getAdpaTemplate(templateId);
  const warnings = [];
  const errors = [];
  if (!template) {
    errors.push('Template not in inventory');
    return { passed: false, errors, warnings };
  }

  if (template.frameworkSource) {
    const fwPath = path.join(REPO_ROOT, template.frameworkSource);
    if (!fs.existsSync(fwPath)) {
      errors.push(`Framework source missing: ${template.frameworkSource}`);
    }
  }

  if (template.kind === 'governance-artifact' && !template.pillar) {
    warnings.push('Governance artifact template has no pillar mapping');
  }

  return { passed: errors.length === 0, errors, warnings };
}

function runDracoSimulated(templateId, phase) {
  const bridge = loadBridge();
  const gate = bridge.qcGates.find((g) => g.id === 'draco-review');
  const blocking = (gate?.blockingInPhases || []).includes(phase);
  const template = getAdpaTemplate(templateId);
  const findings = [];

  if (!template) {
    return { passed: false, mode: blocking ? 'blocking' : 'advisory', findings: [{ severity: 'critical', message: 'Template not found' }] };
  }

  if (template.status === 'missing') {
    findings.push({ severity: 'critical', message: 'Template file is missing from repository' });
  }
  if (template.kind === 'governance-artifact' && !template.nistCategories?.length) {
    findings.push({ severity: 'medium', message: 'No NIST CSF categories mapped' });
  }

  const hasCritical = findings.some((f) => f.severity === 'critical');
  const passed = blocking ? findings.length === 0 : !hasCritical;

  return {
    passed,
    mode: blocking ? 'blocking' : 'advisory',
    findings,
    board: ['Evidence Validator', 'Governance Evaluator', 'Counterfactual Challenger']
  };
}

function runAevCheck(templateId) {
  const template = getAdpaTemplate(templateId);
  if (!template) return { passed: false, message: 'Template not found' };
  const validation = validateDocumentTemplate(templateId);
  return {
    passed: validation.valid,
    message: validation.valid ? 'AEV pre-check passed — template structure valid' : 'AEV pre-check failed',
    errors: validation.errors
  };
}

async function runQCGate(templateId, gateId, phase, actorEmail) {
  const bridge = loadBridge();
  const gateDef = bridge.qcGates.find((g) => g.id === gateId);
  if (!gateDef) throw new Error(`Unknown QC gate: ${gateId}`);

  let result;
  const now = new Date().toISOString();

  switch (gateDef.runner) {
    case 'adpa-validate-template':
      result = validateDocumentTemplate(templateId);
      result = {
        passed: result.valid,
        errors: result.errors,
        warnings: result.warnings,
        summary: result.valid ? 'Schema validation passed' : 'Schema validation failed'
      };
      break;
    case 'framework-alignment-check':
      result = runFrameworkAlignmentCheck(templateId);
      result.summary = result.passed ? 'Framework alignment verified' : 'Framework alignment issues detected';
      break;
    case 'draco-simulated':
      result = runDracoSimulated(templateId, phase);
      result.summary = result.passed
        ? `DRACO review passed (${result.mode})`
        : `DRACO review flagged issues (${result.mode})`;
      break;
    case 'aev-check':
      result = runAevCheck(templateId);
      break;
    case 'owner-check': {
      const detail = await resolveTemplateState(templateId);
      const ownerCount = detail?.owners?.length || detail?.fileState?.owners?.length || 0;
      result = { passed: ownerCount > 0, summary: ownerCount > 0 ? `${ownerCount} owner(s) assigned` : 'No owner assigned' };
      break;
    }
    case 'manual':
      result = { passed: false, pending: true, summary: 'Requires manual governor approval' };
      break;
    default:
      result = { passed: false, summary: 'Unknown gate runner' };
  }

  const gateRecord = {
    gateId,
    name: gateDef.name,
    mode: gateDef.blockingInPhases?.includes(phase) ? 'blocking' : gateDef.mode,
    status: result.pending ? 'pending' : (result.passed ? 'passed' : 'failed'),
    lastRunAt: now,
    lastRunBy: actorEmail,
    result
  };

  await persistQCGate(templateId, gateRecord, actorEmail);
  return gateRecord;
}

async function persistQCGate(templateId, gateRecord, actorEmail) {
  const dbOk = await isDbAvailable();
  if (dbOk) {
    try {
      const items = await coeLifecycle.listCenterItems('templates');
      let item = items?.find((i) => i.external_ref === templateId);
      if (!item) {
        const init = await coeLifecycle.initiateItem('templates', {
          externalRef: templateId,
          displayName: templateId,
          description: getAdpaTemplate(templateId)?.kind || 'template',
          metadata: getAdpaTemplate(templateId) || {}
        }, actorEmail);
        const detail = await coeLifecycle.getItemDetail('templates', init.itemId);
        item = detail?.item;
      }
      if (item) {
        const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {});
        metadata.qcGates = metadata.qcGates || {};
        metadata.qcGates[gateRecord.gateId] = gateRecord;
        const p = getPool();
        await p.query(
          'UPDATE coe_items SET metadata = $1, updated_at = CURRENT_TIMESTAMP WHERE item_id = $2',
          [JSON.stringify(metadata), item.item_id]
        );
        return;
      }
    } catch {
      /* fall through to file registry */
    }
  }

  const registry = loadRegistry();
  if (!registry.items[templateId]) {
    registry.items[templateId] = createFileRegistryEntry(templateId);
  }
  registry.items[templateId].qcGates = registry.items[templateId].qcGates || {};
  registry.items[templateId].qcGates[gateRecord.gateId] = gateRecord;
  appendFileAudit(registry.items[templateId], {
    eventType: 'qc_gate',
    eventAction: `${gateRecord.gateId}_${gateRecord.status}`,
    actorEmail,
    newState: gateRecord
  });
  saveRegistry(registry);
}

function createFileRegistryEntry(templateId) {
  const adpa = getAdpaTemplate(templateId);
  return {
    externalRef: templateId,
    displayName: templateId,
    lifecyclePhase: 'initiation',
    currentVersion: 1,
    metadata: adpa || {},
    qcGates: {},
    owners: [],
    justification: null,
    onboarding: {},
    auditTrail: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function appendFileAudit(entry, { eventType, eventAction, actorEmail, previousState, newState }) {
  entry.auditTrail = entry.auditTrail || [];
  entry.auditTrail.unshift({
    auditId: crypto.randomUUID(),
    eventType,
    eventAction,
    actorEmail,
    previousState,
    newState,
    checksum: hashState({ eventType, eventAction, newState, recordedAt: new Date().toISOString() }),
    recordedAt: new Date().toISOString()
  });
  entry.updatedAt = new Date().toISOString();
}

async function resolveTemplateState(templateId) {
  const adpa = getAdpaTemplate(templateId);
  const bridge = loadBridge();
  const dbOk = await isDbAvailable();

  if (dbOk) {
    try {
      const items = await coeLifecycle.listCenterItems('templates');
      const item = items?.find((i) => i.external_ref === templateId);
      if (item) {
        const detail = await coeLifecycle.getItemDetail('templates', item.item_id);
        const metadata = typeof detail.item.metadata === 'string'
          ? JSON.parse(detail.item.metadata)
          : (detail.item.metadata || {});
        const phase = detail.item.lifecycle_phase;
        return buildTemplateDetail(templateId, adpa, detail, metadata.qcGates || {}, bridge, phase, 'database');
      }
    } catch {
      /* fall through */
    }
  }

  const registry = loadRegistry();
  let fileEntry = registry.items[templateId];
  if (!fileEntry && adpa) {
    fileEntry = createFileRegistryEntry(templateId);
    registry.items[templateId] = fileEntry;
    saveRegistry(registry);
  }

  if (!fileEntry && !adpa) return null;

  const phase = fileEntry?.lifecyclePhase || 'initiation';
  return buildTemplateDetail(templateId, adpa, {
    item: {
      item_id: fileEntry?.externalRef || templateId,
      external_ref: templateId,
      display_name: fileEntry?.displayName || templateId,
      lifecycle_phase: phase,
      current_version: fileEntry?.currentVersion || 1,
      metadata: fileEntry?.metadata || adpa || {}
    },
    owners: (fileEntry?.owners || []).map((o, i) => ({ owner_id: i, owner_email: o.email, owner_role: o.role })),
    justification: fileEntry?.justification,
    onboarding: Object.entries(fileEntry?.onboarding || {}).map(([id, v]) => ({
      checklist_item_id: id,
      completed: v.completed,
      completed_by: v.completedBy,
      completed_at: v.completedAt
    })),
    training: [],
    versions: fileEntry?.versions || [],
    auditTrail: fileEntry?.auditTrail || [],
    center: coeLifecycle.getCenter('templates')
  }, fileEntry?.qcGates || {}, bridge, phase, 'file');
}

function buildTemplateDetail(templateId, adpa, detail, qcGatesRaw, bridge, phase, storageMode) {
  const qcGates = qcGatesRaw || {};

  const phaseConfig = bridge.phases[phase] || {};
  const applicableGates = bridge.qcGates.filter((g) => g.appliesToPhases.includes(phase));

  const transitionKey = Object.keys(bridge.transitionGateRequirements).find((k) => k.startsWith(`${phase}:`));
  const nextPhases = phaseConfig.nextPhases || [];
  const pendingTransitions = nextPhases.map((target) => {
    const reqKey = `${phase}:${target}`;
    const requiredGates = bridge.transitionGateRequirements[reqKey] || [];
    const gateStatus = requiredGates.map((gid) => {
      const recorded = qcGates[gid];
      return {
        gateId: gid,
        status: recorded?.status || 'not_run',
        blocking: bridge.qcGates.find((g) => g.id === gid)?.mode === 'blocking'
      };
    });
    const blocked = gateStatus.some((g) => g.blocking && g.status !== 'passed');
    return { targetPhase: target, requiredGates: gateStatus, canTransition: !blocked };
  });

  return {
    templateId,
    adpa,
    storageMode,
    ...detail,
    phaseGuidance: phaseConfig,
    adpaStage: phaseConfig.adpaStage,
    applicableGates,
    qcGates,
    pendingTransitions,
    bridge: {
      adpaStages: bridge.adpaStages,
      phases: bridge.phases
    }
  };
}

async function getTemplateCatalog() {
  const templates = adpaLifecycle.listAllTemplates();
  const bridge = loadBridge();
  const dbOk = await isDbAvailable();
  let coeItems = [];

  if (dbOk) {
    try {
      coeItems = await coeLifecycle.listCenterItems('templates') || [];
    } catch {
      coeItems = [];
    }
  }

  const registry = loadRegistry();

  return templates.map((t) => {
    const coeItem = coeItems.find((i) => i.external_ref === t.id);
    const fileItem = registry.items[t.id];
    const phase = coeItem?.lifecycle_phase || fileItem?.lifecyclePhase || 'unregistered';
    const phaseConfig = bridge.phases[phase] || null;

    return {
      ...t,
      lifecyclePhase: phase,
      phaseLabel: phaseConfig?.label || (phase === 'unregistered' ? 'Not registered' : phase),
      phaseIntent: phaseConfig?.intent || null,
      coeItemId: coeItem?.item_id || null,
      currentVersion: coeItem?.current_version || fileItem?.currentVersion || 0,
      onboardingPercent: coeItem?.onboardingPercent || 0,
      registered: phase !== 'unregistered'
    };
  });
}

async function registerTemplate(templateId, actorEmail, payload = {}) {
  const adpa = getAdpaTemplate(templateId);
  if (!adpa && !payload.allowDraft) {
    throw new Error(`Template ${templateId} not found in ADPA inventory`);
  }

  const dbOk = await isDbAvailable();
  if (dbOk) {
    try {
      const result = await coeLifecycle.initiateItem('templates', {
        externalRef: templateId,
        displayName: payload.displayName || templateId,
        description: payload.description || `${adpa?.kind || 'draft'} template`,
        metadata: { ...adpa, ...payload.metadata, registeredAt: new Date().toISOString() }
      }, actorEmail);
      return { templateId, itemId: result.itemId, existing: result.existing, storageMode: 'database' };
    } catch (err) {
      if (!err.message?.includes('connect')) throw err;
    }
  }

  const registry = loadRegistry();
  if (registry.items[templateId]) {
    return { templateId, itemId: templateId, existing: true, storageMode: 'file' };
  }

  const entry = createFileRegistryEntry(templateId);
  entry.displayName = payload.displayName || templateId;
  entry.description = payload.description;
  appendFileAudit(entry, {
    eventType: 'lifecycle',
    eventAction: 'initiated',
    actorEmail,
    newState: { lifecyclePhase: 'initiation' }
  });
  registry.items[templateId] = entry;
  saveRegistry(registry);
  return { templateId, itemId: templateId, existing: false, storageMode: 'file' };
}

async function createTemplateDraft(payload, actorEmail) {
  const templateId = payload.templateId || payload.id;
  if (!templateId || !/^[a-z0-9-]+$/.test(templateId)) {
    throw new Error('templateId required (lowercase alphanumeric and hyphens only)');
  }

  const existing = getAdpaTemplate(templateId);
  if (existing) {
    return registerTemplate(templateId, actorEmail, payload);
  }

  return registerTemplate(templateId, actorEmail, {
    ...payload,
    allowDraft: true,
    metadata: {
      kind: payload.kind || 'document',
      status: 'draft',
      draft: true,
      pillar: payload.pillar,
      frameworkSource: payload.frameworkSource
    }
  });
}

function checkTransitionGates(bridge, fromPhase, toPhase, qcGates) {
  const reqKey = `${fromPhase}:${toPhase}`;
  const required = bridge.transitionGateRequirements[reqKey] || [];
  const failures = [];

  required.forEach((gateId) => {
    const gateDef = bridge.qcGates.find((g) => g.id === gateId);
    const recorded = qcGates[gateId];
    if (!recorded || recorded.status !== 'passed') {
      failures.push({
        gateId,
        name: gateDef?.name || gateId,
        status: recorded?.status || 'not_run',
        message: `Required gate "${gateDef?.name || gateId}" must pass before transition to ${toPhase}`
      });
    }
  });

  return failures;
}

async function transitionTemplate(templateId, targetPhase, actorEmail, reason) {
  const bridge = loadBridge();
  if (!bridge.phases[targetPhase]) throw new Error(`Invalid phase: ${targetPhase}`);

  const detail = await resolveTemplateState(templateId);
  if (!detail) throw new Error('Template not registered — initiate lifecycle first');

  const currentPhase = detail.item.lifecycle_phase;
  const allowed = bridge.phases[currentPhase]?.nextPhases || [];
  if (!allowed.includes(targetPhase)) {
    throw new Error(`Cannot transition from ${currentPhase} to ${targetPhase}`);
  }

  const qcGates = detail.qcGates || {};
  const gateFailures = checkTransitionGates(bridge, currentPhase, targetPhase, qcGates);
  if (gateFailures.length) {
    const err = new Error('Quality control gates not satisfied');
    err.code = 'QC_GATE_BLOCKED';
    err.gateFailures = gateFailures;
    throw err;
  }

  const dbOk = await isDbAvailable();
  if (dbOk && detail.storageMode === 'database') {
    try {
      const result = await coeLifecycle.transitionLifecycle(
        'templates',
        detail.item.item_id,
        targetPhase,
        actorEmail,
        reason
      );
      return { ...result, templateId, storageMode: 'database' };
    } catch (err) {
      if (!err.message?.includes('connect')) throw err;
    }
  }

  const registry = loadRegistry();
  const entry = registry.items[templateId];
  if (!entry) throw new Error('Template registry entry missing');

  const previousPhase = entry.lifecyclePhase;
  entry.lifecyclePhase = targetPhase;
  entry.currentVersion = (entry.currentVersion || 1) + 1;
  entry.versions = entry.versions || [];
  entry.versions.unshift({
    version_number: entry.currentVersion,
    change_summary: reason || `Transition to ${targetPhase}`,
    created_at: new Date().toISOString(),
    created_by: actorEmail,
    snapshot: { lifecycle_phase: targetPhase }
  });

  appendFileAudit(entry, {
    eventType: 'lifecycle',
    eventAction: `transition_${targetPhase}`,
    actorEmail,
    previousState: { lifecycle_phase: previousPhase },
    newState: { lifecycle_phase: targetPhase, reason }
  });

  saveRegistry(registry);
  return {
    templateId,
    previousPhase,
    newPhase: targetPhase,
    version: entry.currentVersion,
    storageMode: 'file'
  };
}

async function approveManualGate(templateId, gateId, actorEmail, notes) {
  const bridge = loadBridge();
  const gateDef = bridge.qcGates.find((g) => g.id === gateId);
  if (!gateDef || gateDef.runner !== 'manual') {
    throw new Error('Gate is not a manual approval gate');
  }

  const gateRecord = {
    gateId,
    name: gateDef.name,
    mode: 'blocking',
    status: 'passed',
    lastRunAt: new Date().toISOString(),
    lastRunBy: actorEmail,
    result: { passed: true, summary: notes || 'Manual governor approval recorded', approvedBy: actorEmail }
  };

  await persistQCGate(templateId, gateRecord, actorEmail);

  if (gateId === 'human-approval') {
    const dbOk = await isDbAvailable();
    if (dbOk) {
      try {
        const items = await coeLifecycle.listCenterItems('templates');
        const item = items?.find((i) => i.external_ref === templateId);
        if (item) {
          await coeLifecycle.completeOnboardingStep('templates', item.item_id, 'coe-approval', actorEmail, notes);
        }
      } catch {
        /* file fallback below */
      }
    }
    const registry = loadRegistry();
    if (registry.items[templateId]) {
      registry.items[templateId].onboarding = registry.items[templateId].onboarding || {};
      registry.items[templateId].onboarding['coe-approval'] = {
        completed: true,
        completedBy: actorEmail,
        completedAt: new Date().toISOString()
      };
      saveRegistry(registry);
    }
  }

  return gateRecord;
}

async function assignTemplateOwner(templateId, ownerEmail, ownerRole, actorEmail) {
  const dbOk = await isDbAvailable();
  if (dbOk) {
    try {
      let items = await coeLifecycle.listCenterItems('templates');
      let item = items?.find((i) => i.external_ref === templateId);
      if (!item) {
        await registerTemplate(templateId, actorEmail);
        items = await coeLifecycle.listCenterItems('templates');
        item = items?.find((i) => i.external_ref === templateId);
      }
      if (item) {
        await coeLifecycle.assignOwner('templates', item.item_id, { ownerEmail, ownerRole }, actorEmail);
        await runQCGate(templateId, 'owner-assigned', item.lifecycle_phase, actorEmail);
        return { storageMode: 'database' };
      }
    } catch {
      /* fall through */
    }
  }

  const registry = loadRegistry();
  if (!registry.items[templateId]) {
    await registerTemplate(templateId, actorEmail);
  }
  const entry = registry.items[templateId];
  entry.owners = entry.owners || [];
  entry.owners.push({ email: ownerEmail, role: ownerRole || 'domain_owner', assignedAt: new Date().toISOString() });
  appendFileAudit(entry, {
    eventType: 'ownership',
    eventAction: 'owner_assigned',
    actorEmail,
    newState: { ownerEmail, ownerRole }
  });
  saveRegistry(registry);
  await runQCGate(templateId, 'owner-assigned', entry.lifecyclePhase, actorEmail);
  return { storageMode: 'file' };
}

async function submitTemplateJustification(templateId, payload, actorEmail) {
  const dbOk = await isDbAvailable();
  if (dbOk) {
    try {
      const items = await coeLifecycle.listCenterItems('templates');
      const item = items?.find((i) => i.external_ref === templateId);
      if (item) {
        await coeLifecycle.submitJustification('templates', item.item_id, payload, actorEmail);
        return { storageMode: 'database' };
      }
    } catch {
      /* fall through */
    }
  }

  const registry = loadRegistry();
  if (!registry.items[templateId]) await registerTemplate(templateId, actorEmail);
  registry.items[templateId].justification = { ...payload, submittedBy: actorEmail, submittedAt: new Date().toISOString() };
  registry.items[templateId].onboarding = registry.items[templateId].onboarding || {};
  registry.items[templateId].onboarding['business-case'] = { completed: true, completedBy: actorEmail, completedAt: new Date().toISOString() };
  appendFileAudit(registry.items[templateId], {
    eventType: 'justification',
    eventAction: 'submitted',
    actorEmail,
    newState: payload
  });
  saveRegistry(registry);
  return { storageMode: 'file' };
}

async function syncAllTemplates(actorEmail) {
  const templates = adpaLifecycle.listAllTemplates();
  const results = { registered: 0, existing: 0, errors: [] };

  for (const t of templates) {
    try {
      const r = await registerTemplate(t.id, actorEmail);
      if (r.existing) results.existing++;
      else results.registered++;
    } catch (err) {
      results.errors.push({ templateId: t.id, error: err.message });
    }
  }

  return results;
}

module.exports = {
  loadBridge,
  getTemplateCatalog,
  resolveTemplateState,
  registerTemplate,
  createTemplateDraft,
  transitionTemplate,
  runQCGate,
  approveManualGate,
  assignTemplateOwner,
  submitTemplateJustification,
  syncAllTemplates,
  validateDocumentTemplate,
  isDbAvailable
};
