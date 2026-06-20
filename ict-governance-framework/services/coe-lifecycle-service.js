'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const adpaLifecycle = require('./adpa-lifecycle-service');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const VALID_TRANSITIONS = {
  initiation: ['onboarding', 'retired'],
  onboarding: ['active', 'initiation', 'retired'],
  active: ['build_update', 'retiring'],
  build_update: ['active', 'retiring'],
  retiring: ['retired', 'active'],
  retired: []
};

function loadCentersConfig() {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'adpa/coe/centers.json'), 'utf8'));
}

function loadProgramConfig() {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'adpa/coe/coe-program.json'), 'utf8'));
}

function getProgram() {
  const program = loadProgramConfig();
  const adpaOverview = adpaLifecycle.getOverview();
  return {
    ...program,
    adoptionSnapshot: {
      templates: adpaOverview.templates,
      aiProviders: adpaOverview.aiProviders,
      tenants: adpaOverview.tenants,
      documents: adpaOverview.documents,
      lifecycleModel: adpaOverview.lifecycleModel
    }
  };
}

async function getAdoptionMetrics() {
  const adpaOverview = adpaLifecycle.getOverview();
  let coeItems = { total: 0, byPhase: {}, byCenter: {} };
  try {
    const result = await pool.query(
      `SELECT center_type, lifecycle_phase, COUNT(*)::int AS c
       FROM coe_items GROUP BY center_type, lifecycle_phase`
    );
    coeItems.total = result.rows.reduce((s, r) => s + r.c, 0);
    result.rows.forEach((r) => {
      coeItems.byPhase[r.lifecycle_phase] = (coeItems.byPhase[r.lifecycle_phase] || 0) + r.c;
      coeItems.byCenter[r.center_type] = (coeItems.byCenter[r.center_type] || 0) + r.c;
    });
  } catch {
    coeItems.note = 'Run npm run setup:coe-lifecycle to enable CoE database metrics';
  }

  return {
    inventory: adpaOverview,
    coeRegistry: coeItems,
    centers: listCenters()
  };
}

function getAllTrainingModules() {
  return listCenters().flatMap((c) =>
    (c.trainingModules || []).map((m) => ({ ...m, centerId: c.id, centerName: c.name }))
  );
}

function getCenter(centerId) {
  const config = loadCentersConfig();
  const center = config.centers.find((c) => c.id === centerId);
  if (!center) return null;
  return { ...center, lifecyclePhases: config.lifecyclePhases };
}

function listCenters() {
  return loadCentersConfig().centers;
}

function hashState(state) {
  return crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex');
}

async function appendAudit(client, {
  itemId, centerType, eventType, eventAction, actorEmail, previousState, newState
}) {
  const checksum = hashState({ eventType, eventAction, previousState, newState, recordedAt: new Date().toISOString() });
  await client.query(
    `INSERT INTO coe_audit_log
     (item_id, center_type, event_type, event_action, actor_email, previous_state, new_state, checksum)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [itemId, centerType, eventType, eventAction, actorEmail, previousState, newState, checksum]
  );
}

async function saveVersion(client, itemId, versionNumber, snapshot, changeSummary, actorEmail) {
  await client.query(
    `INSERT INTO coe_item_versions (item_id, version_number, snapshot, change_summary, created_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (item_id, version_number) DO NOTHING`,
    [itemId, versionNumber, JSON.stringify(snapshot), changeSummary, actorEmail]
  );
}

async function getItemSnapshot(client, itemId) {
  const item = await client.query('SELECT * FROM coe_items WHERE item_id = $1', [itemId]);
  if (!item.rows.length) return null;

  const [owners, justification, onboarding, training, versions] = await Promise.all([
    client.query('SELECT * FROM coe_item_owners WHERE item_id = $1 AND is_active = true', [itemId]),
    client.query('SELECT * FROM coe_business_justifications WHERE item_id = $1 ORDER BY submitted_at DESC LIMIT 1', [itemId]),
    client.query('SELECT * FROM coe_onboarding_progress WHERE item_id = $1', [itemId]),
    client.query('SELECT * FROM coe_training_completions WHERE item_id = $1', [itemId]),
    client.query('SELECT version_number, change_summary, created_at FROM coe_item_versions WHERE item_id = $1 ORDER BY version_number DESC', [itemId])
  ]);

  return {
    item: item.rows[0],
    owners: owners.rows,
    justification: justification.rows[0] || null,
    onboarding: onboarding.rows,
    training: training.rows,
    versions: versions.rows
  };
}

async function listCenterItems(centerId) {
  const center = getCenter(centerId);
  if (!center) return null;

  const result = await pool.query(
    `SELECT i.*,
            (SELECT COUNT(*)::int FROM coe_item_owners o WHERE o.item_id = i.item_id AND o.is_active) AS owner_count,
            (SELECT COUNT(*)::int FROM coe_onboarding_progress p WHERE p.item_id = i.item_id AND p.completed) AS onboarding_completed,
            (SELECT COUNT(*)::int FROM coe_training_completions t WHERE t.item_id = i.item_id) AS training_completed
     FROM coe_items i
     WHERE i.center_type = $1
     ORDER BY i.updated_at DESC`,
    [centerId]
  );

  const checklistTotal = center.onboardingChecklist.length;
  return result.rows.map((row) => ({
    ...row,
    onboardingTotal: checklistTotal,
    onboardingPercent: checklistTotal
      ? Math.round((row.onboarding_completed / checklistTotal) * 100)
      : 0
  }));
}

async function getItemDetail(centerId, itemId) {
  const client = await pool.connect();
  try {
    const snapshot = await getItemSnapshot(client, itemId);
    if (!snapshot || snapshot.item.center_type !== centerId) return null;

    const audit = await client.query(
      'SELECT * FROM coe_audit_log WHERE item_id = $1 ORDER BY recorded_at DESC LIMIT 100',
      [itemId]
    );

    const center = getCenter(centerId);
    return {
      ...snapshot,
      center,
      auditTrail: audit.rows
    };
  } finally {
    client.release();
  }
}

async function initiateItem(centerId, payload, actorEmail) {
  const center = getCenter(centerId);
  if (!center) throw new Error('Unknown center');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT item_id FROM coe_items
       WHERE center_type = $1 AND external_ref = $2 AND COALESCE(tenant_id, '') = COALESCE($3, '')`,
      [centerId, payload.externalRef, payload.tenantId || null]
    );

    if (existing.rows.length) {
      await client.query('ROLLBACK');
      return { itemId: existing.rows[0].item_id, existing: true };
    }

    const insert = await client.query(
      `INSERT INTO coe_items (center_type, external_ref, display_name, description, lifecycle_phase, tenant_id, metadata, created_by)
       VALUES ($1, $2, $3, $4, 'initiation', $5, $6, $7)
       RETURNING *`,
      [
        centerId,
        payload.externalRef,
        payload.displayName,
        payload.description || null,
        payload.tenantId || null,
        JSON.stringify(payload.metadata || {}),
        actorEmail
      ]
    );

    const item = insert.rows[0];

    for (const step of center.onboardingChecklist) {
      await client.query(
        `INSERT INTO coe_onboarding_progress (item_id, checklist_item_id, completed)
         VALUES ($1, $2, false)`,
        [item.item_id, step.id]
      );
    }

    await appendAudit(client, {
      itemId: item.item_id,
      centerType: centerId,
      eventType: 'lifecycle',
      eventAction: 'initiated',
      actorEmail,
      previousState: null,
      newState: { lifecycle_phase: 'initiation', external_ref: payload.externalRef }
    });

    await saveVersion(client, item.item_id, 1, { lifecycle_phase: 'initiation' }, 'Initial registration', actorEmail);
    await client.query('COMMIT');
    return { itemId: item.item_id, existing: false };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function transitionLifecycle(centerId, itemId, targetPhase, actorEmail, reason) {
  if (!Object.keys(VALID_TRANSITIONS).includes(targetPhase)) {
    throw new Error(`Invalid phase: ${targetPhase}`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const itemRes = await client.query('SELECT * FROM coe_items WHERE item_id = $1 AND center_type = $2', [itemId, centerId]);
    if (!itemRes.rows.length) throw new Error('Item not found');

    const item = itemRes.rows[0];
    const allowed = VALID_TRANSITIONS[item.lifecycle_phase] || [];
    if (!allowed.includes(targetPhase)) {
      throw new Error(`Cannot transition from ${item.lifecycle_phase} to ${targetPhase}`);
    }

    if (targetPhase === 'active') {
      const onboarding = await client.query(
        'SELECT COUNT(*)::int AS total, SUM(CASE WHEN completed THEN 1 ELSE 0 END)::int AS done FROM coe_onboarding_progress WHERE item_id = $1',
        [itemId]
      );
      const center = getCenter(centerId);
      const required = center.onboardingChecklist.filter((s) => s.required);
      const requiredDone = await client.query(
        `SELECT COUNT(*)::int AS c FROM coe_onboarding_progress p
         JOIN (SELECT unnest($2::text[]) AS id) r ON p.checklist_item_id = r.id
         WHERE p.item_id = $1 AND p.completed = true`,
        [itemId, required.map((s) => s.id)]
      );
      if (requiredDone.rows[0].c < required.length) {
        throw new Error('Required onboarding checklist items not complete');
      }
    }

    const previousPhase = item.lifecycle_phase;
    const newVersion = item.current_version + 1;

    await client.query(
      `UPDATE coe_items SET lifecycle_phase = $1, current_version = $2, updated_at = CURRENT_TIMESTAMP WHERE item_id = $3`,
      [targetPhase, newVersion, itemId]
    );

    await saveVersion(client, itemId, newVersion, { lifecycle_phase: targetPhase, reason }, reason || `Transition to ${targetPhase}`, actorEmail);
    await appendAudit(client, {
      itemId,
      centerType: centerId,
      eventType: 'lifecycle',
      eventAction: `transition_${targetPhase}`,
      actorEmail,
      previousState: { lifecycle_phase: previousPhase },
      newState: { lifecycle_phase: targetPhase, reason }
    });

    await client.query('COMMIT');
    return { itemId, previousPhase, newPhase: targetPhase, version: newVersion };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function assignOwner(centerId, itemId, payload, actorEmail) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO coe_item_owners (item_id, owner_email, owner_role, assigned_by)
       VALUES ($1, $2, $3, $4)`,
      [itemId, payload.ownerEmail, payload.ownerRole || 'domain_owner', actorEmail]
    );
    await appendAudit(client, {
      itemId, centerType: centerId, eventType: 'ownership', eventAction: 'owner_assigned',
      actorEmail, previousState: null, newState: payload
    });
    await client.query(
      `UPDATE coe_onboarding_progress SET completed = true, completed_by = $2, completed_at = CURRENT_TIMESTAMP
       WHERE item_id = $1 AND checklist_item_id = 'owner-assigned'`,
      [itemId, actorEmail]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function submitJustification(centerId, itemId, payload, actorEmail) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO coe_business_justifications (item_id, summary, value_proposition, cost_of_inaction, risk_assessment, submitted_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [itemId, payload.summary, payload.valueProposition, payload.costOfInaction, payload.riskAssessment, actorEmail]
    );
    await appendAudit(client, {
      itemId, centerType: centerId, eventType: 'justification', eventAction: 'submitted',
      actorEmail, previousState: null, newState: payload
    });
    await client.query(
      `UPDATE coe_onboarding_progress SET completed = true, completed_by = $2, completed_at = CURRENT_TIMESTAMP
       WHERE item_id = $1 AND checklist_item_id = 'business-case'`,
      [itemId, actorEmail]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function completeOnboardingStep(centerId, itemId, checklistItemId, actorEmail, notes) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE coe_onboarding_progress
       SET completed = true, completed_by = $3, completed_at = CURRENT_TIMESTAMP, notes = $4
       WHERE item_id = $1 AND checklist_item_id = $2`,
      [itemId, checklistItemId, actorEmail, notes || null]
    );
    await appendAudit(client, {
      itemId, centerType: centerId, eventType: 'onboarding', eventAction: `completed_${checklistItemId}`,
      actorEmail, previousState: { completed: false }, newState: { completed: true, notes }
    });
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function recordTraining(centerId, itemId, moduleId, actorEmail, score) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO coe_training_completions (item_id, module_id, completed_by, score)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (item_id, module_id, completed_by) DO UPDATE SET completed_at = CURRENT_TIMESTAMP, score = $4`,
      [itemId, moduleId, actorEmail, score || null]
    );
    await appendAudit(client, {
      itemId, centerType: centerId, eventType: 'training', eventAction: `completed_${moduleId}`,
      actorEmail, previousState: null, newState: { moduleId, score }
    });

    const center = getCenter(centerId);
    const modulesDone = await client.query(
      'SELECT COUNT(DISTINCT module_id)::int AS c FROM coe_training_completions WHERE item_id = $1',
      [itemId]
    );
    if (modulesDone.rows[0].c >= center.trainingModules.length) {
      await client.query(
        `UPDATE coe_onboarding_progress SET completed = true, completed_by = $2, completed_at = CURRENT_TIMESTAMP
         WHERE item_id = $1 AND checklist_item_id = 'training-complete'`,
        [itemId, actorEmail]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function rollbackItem(centerId, itemId, targetVersion, actorEmail, reason) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const versionRes = await client.query(
      'SELECT * FROM coe_item_versions WHERE item_id = $1 AND version_number = $2',
      [itemId, targetVersion]
    );
    if (!versionRes.rows.length) throw new Error('Version not found');

    const snapshot = versionRes.rows[0].snapshot;
    const phase = snapshot.lifecycle_phase || 'active';

    const itemRes = await client.query('SELECT * FROM coe_items WHERE item_id = $1', [itemId]);
    const previousPhase = itemRes.rows[0].lifecycle_phase;
    const newVersion = itemRes.rows[0].current_version + 1;

    await client.query(
      `UPDATE coe_items SET lifecycle_phase = $1, current_version = $2, updated_at = CURRENT_TIMESTAMP WHERE item_id = $3`,
      [phase, newVersion, itemId]
    );

    await saveVersion(client, itemId, newVersion, snapshot, `Rollback to v${targetVersion}: ${reason}`, actorEmail);
    await appendAudit(client, {
      itemId, centerType: centerId, eventType: 'rollback', eventAction: `rollback_to_v${targetVersion}`,
      actorEmail,
      previousState: { lifecycle_phase: previousPhase, version: itemRes.rows[0].current_version },
      newState: { lifecycle_phase: phase, version: newVersion, rolledBackFrom: itemRes.rows[0].current_version, reason }
    });

    await client.query('COMMIT');
    return { itemId, rolledBackTo: targetVersion, newPhase: phase, newVersion };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getAuditTrail(centerId, itemId) {
  const result = await pool.query(
    'SELECT * FROM coe_audit_log WHERE item_id = $1 ORDER BY recorded_at DESC',
    [itemId]
  );
  return result.rows;
}

async function syncInventoryFromAdpa(actorEmail) {
  const synced = { templates: 0, 'ai-providers': 0, artifacts: 0, documents: 0 };

  const templates = adpaLifecycle.listAllTemplates();
  for (const t of templates) {
    const r = await initiateItem('templates', {
      externalRef: t.id,
      displayName: t.id,
      description: `${t.kind} template — ${t.pillar || t.outputCategory || ''}`,
      metadata: t
    }, actorEmail || 'system-sync');
    if (!r.existing) synced.templates++;
  }

  const providers = adpaLifecycle.listAiProviders();
  for (const p of providers) {
    const r = await initiateItem('ai-providers', {
      externalRef: p.id,
      displayName: `${p.type} — ${p.model}`,
      description: p.isActive ? 'Active AI provider' : 'Standby provider',
      metadata: p
    }, actorEmail || 'system-sync');
    if (!r.existing) synced['ai-providers']++;
  }

  const tenants = adpaLifecycle.listTenants();
  for (const tenant of tenants) {
    const r = await initiateItem('artifacts', {
      externalRef: tenant.tenantId,
      displayName: tenant.displayName,
      description: `Tenant artifact store — ${tenant.requirementCount} requirements`,
      tenantId: tenant.tenantId,
      metadata: tenant
    }, actorEmail || 'system-sync');
    if (!r.existing) synced.artifacts++;

    const docs = adpaLifecycle.getTenantDocumentVersions(tenant.tenantId);
    for (const doc of docs) {
      const ref = `${tenant.tenantId}-v${doc.documentVersion}`;
      const dr = await initiateItem('documents', {
        externalRef: ref,
        displayName: `Governance doc v${doc.documentVersion}`,
        description: doc.templateId,
        tenantId: tenant.tenantId,
        metadata: doc
      }, actorEmail || 'system-sync');
      if (!dr.existing) synced.documents++;
    }
  }

  return synced;
}

module.exports = {
  loadCentersConfig,
  loadProgramConfig,
  getProgram,
  getAdoptionMetrics,
  getAllTrainingModules,
  listCenters,
  getCenter,
  listCenterItems,
  getItemDetail,
  initiateItem,
  transitionLifecycle,
  assignOwner,
  submitJustification,
  completeOnboardingStep,
  recordTraining,
  rollbackItem,
  getAuditTrail,
  syncInventoryFromAdpa,
  VALID_TRANSITIONS
};
