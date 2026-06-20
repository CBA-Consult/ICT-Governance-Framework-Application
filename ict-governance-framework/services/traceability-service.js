'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BRIDGE_PATH = path.join(REPO_ROOT, 'adpa/coe/traceability-bridge.json');
const REGISTRY_PATH = path.join(REPO_ROOT, 'adpa/coe/traceability-registry.json');
const ARTIFACT_TEMPLATES_DIR = path.join(REPO_ROOT, 'adpa/templates/governance-artifacts/standard');

const COMPLIANCE_MAP = {
  healthy: 'Compliant',
  degraded: 'Partial',
  'non-compliant': 'NonCompliant',
  failed: 'NonCompliant',
  unknown: 'Unevaluated'
};

function loadBridge() {
  return JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf8'));
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return { version: '1.0.0', entries: [] };
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

function hashContent(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

function tenantDir(tenantId) {
  return path.join(REPO_ROOT, 'adpa/tenants', tenantId);
}

function monitorsDir(tenantId) {
  return path.join(tenantDir(tenantId), 'compliance-monitors');
}

function validationsDir(tenantId) {
  return path.join(tenantDir(tenantId), 'validations');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function appendAudit(event) {
  const registry = loadRegistry();
  registry.entries.unshift({
    auditId: crypto.randomUUID(),
    recordedAt: new Date().toISOString(),
    checksum: hashContent(event),
    ...event
  });
  const max = loadBridge().auditStore?.maxEntries || 1000;
  if (registry.entries.length > max) {
    registry.entries = registry.entries.slice(0, max);
  }
  saveRegistry(registry);
}

function buildLineageEnvelope(payload) {
  return {
    lineageId: payload.lineageId || crypto.randomUUID(),
    artifactLayer: payload.artifactLayer || 'validation',
    outputType: payload.outputType || null,
    cloudProvider: payload.cloudProvider || null,
    pillar: payload.pillar || null,
    upstream: payload.upstream || {},
    downstream: payload.downstream || {},
    tarCol: payload.tarCol || {},
    actors: payload.actors || {},
    integrity: {
      contentChecksum: payload.contentChecksum || null,
      supersedes: payload.supersedes || null,
      supersededBy: null
    },
    recordedAt: new Date().toISOString()
  };
}

function mapHealthToCompliance(overall) {
  return COMPLIANCE_MAP[overall] || 'Unevaluated';
}

function requirementsDir(tenantId) {
  return path.join(tenantDir(tenantId), 'requirements');
}

function loadRequirement(tenantId, requirementId) {
  const direct = path.join(requirementsDir(tenantId), `${requirementId}.json`);
  if (fs.existsSync(direct)) {
    return loadJsonSafe(direct);
  }
  const dir = requirementsDir(tenantId);
  if (!fs.existsSync(dir)) return null;
  const match = fs.readdirSync(dir).find((f) => f.includes(requirementId));
  return match ? loadJsonSafe(path.join(dir, match)) : null;
}

function loadArtifactTemplate(templateId) {
  const filePath = path.join(ARTIFACT_TEMPLATES_DIR, `${templateId}.template.json`);
  return loadJsonSafe(filePath);
}

function resolveCloudProvider(requirement, validationRecord) {
  return validationRecord?.layer2Ref?.cloudProvider
    || validationRecord?.deployedRef?.cloudProvider
    || requirement?.scope?.cloudProviders?.[0]
    || 'azure';
}

function mergeDeploymentExpectations(requirement, template, cloudProvider) {
  const defaults = template?.deploymentExpectationsDefaults || {};
  const tenant = requirement?.deploymentExpectations || {};
  const merged = {
    ...defaults,
    ...tenant,
    onFailure: { ...(defaults.onFailure || {}), ...(tenant.onFailure || {}) },
    vendorDeliverableProfile: {
      ...(defaults.vendorDeliverableProfile || {}),
      ...(tenant.vendorDeliverableProfile || {})
    },
    cloudProfiles: { ...(defaults.cloudProfiles || {}), ...(tenant.cloudProfiles || {}) },
    monitoringRules: tenant.monitoringRules?.length
      ? tenant.monitoringRules
      : (defaults.monitoringRules || [])
  };

  const profile = merged.cloudProfiles?.[cloudProvider];
  if (profile?.checkType && merged.monitoringRules?.length) {
    merged.monitoringRules = merged.monitoringRules.map((rule) => ({
      ...rule,
      checkType: rule.checkType || profile.checkType
    }));
  }

  return merged;
}

function getDeploymentExpectations(tenantId, requirementId, cloudProvider, validationRecord) {
  const requirement = loadRequirement(tenantId, requirementId);
  if (!requirement) {
    return { requirement: null, expectations: null, cloudProvider };
  }
  const template = loadArtifactTemplate(requirement.templateId || validationRecord?.templateId);
  const cloud = cloudProvider || resolveCloudProvider(requirement, validationRecord);
  const expectations = mergeDeploymentExpectations(requirement, template, cloud);
  return { requirement, template, expectations, cloudProvider: cloud };
}

function evaluateAgainstExpectations(validationRecord, expectations) {
  if (!expectations) {
    return { meetsExpectations: null, gaps: [], expectationSummary: null };
  }

  const gaps = [];
  const expectedHealth = expectations.expectedHealthState;
  const expectedCompliance = expectations.expectedComplianceState;
  const observedHealth = validationRecord.healthState?.overall;
  const observedCompliance = mapHealthToCompliance(observedHealth);

  if (expectedHealth && observedHealth !== expectedHealth) {
    gaps.push({
      type: 'healthState',
      expected: expectedHealth,
      observed: observedHealth
    });
  }
  if (expectedCompliance && observedCompliance !== expectedCompliance) {
    gaps.push({
      type: 'complianceState',
      expected: expectedCompliance,
      observed: observedCompliance
    });
  }

  const controlResults = validationRecord.controlResults || [];
  (expectations.monitoringRules || []).forEach((rule) => {
    const result = controlResults.find((c) => c.controlId === rule.controlId);
    if (result && result.status === 'fail') {
      gaps.push({
        type: 'control',
        ruleId: rule.ruleId,
        controlId: rule.controlId,
        expectedState: rule.expectedState,
        observed: result.observed,
        mapsToAcceptanceCriteria: rule.mapsToAcceptanceCriteria
      });
    }
  });

  return {
    meetsExpectations: gaps.length === 0,
    gaps,
    expectationSummary: {
      expectedHealthState: expectedHealth,
      expectedComplianceState: expectedCompliance,
      vendorDeliverableProfile: expectations.vendorDeliverableProfile || null
    }
  };
}

function buildMonitoringRulesFromExpectations(expectations, validationRecord, cloudProvider) {
  const checkType = expectations.cloudProfiles?.[cloudProvider]?.checkType
    || inferCheckType(cloudProvider);
  const controlResults = validationRecord.controlResults || [];

  return (expectations.monitoringRules || []).map((rule) => {
    const observed = controlResults.find((c) => c.controlId === rule.controlId);
    return {
      ruleId: rule.ruleId,
      controlId: rule.controlId,
      mapsToAcceptanceCriteria: rule.mapsToAcceptanceCriteria,
      checkType: rule.checkType || checkType,
      frequency: rule.frequency || 'daily',
      expectedState: rule.expectedState,
      frameworkControlRef: rule.frameworkControlRef || null,
      severityOnFail: rule.severityOnFail || 'high',
      remediationTemplateId: rule.remediationTemplateId || validationRecord.templateId,
      lastObservedState: observed?.observed || null,
      lastStatus: observed?.status || 'pending'
    };
  });
}

function buildComplianceMonitor(validationRecord, assetId, expectationsContext) {
  const ctx = expectationsContext
    || getDeploymentExpectations(
      validationRecord.tenantId,
      validationRecord.requirementId,
      null,
      validationRecord
    );
  const { requirement, expectations, cloudProvider } = ctx;

  const monitorId = `monitor-${assetId.replace(/[^a-zA-Z0-9-]/g, '-').slice(-80)}-${Date.now()}`;
  const complianceState = expectations
    ? (evaluateAgainstExpectations(validationRecord, expectations).meetsExpectations
      ? mapHealthToCompliance(expectations.expectedHealthState)
      : mapHealthToCompliance(validationRecord.healthState.overall))
    : mapHealthToCompliance(validationRecord.healthState.overall);

  const monitoringRules = expectations
    ? buildMonitoringRulesFromExpectations(expectations, validationRecord, cloudProvider)
    : (validationRecord.controlResults || []).map((ctrl) => ({
      ruleId: `rule-${ctrl.controlId}`,
      controlId: ctrl.controlId,
      checkType: inferCheckType(cloudProvider || 'azure'),
      frequency: 'daily',
      expectedState: ctrl.expected || 'compliant',
      frameworkControlRef: ctrl.frameworkMapping || null,
      severityOnFail: ctrl.status === 'fail' ? 'high' : 'medium',
      remediationTemplateId: validationRecord.templateId
    }));

  const monitor = {
    monitorId,
    tenantId: validationRecord.tenantId,
    assetId,
    displayName: requirement
      ? `Compliance monitor — ${requirement.title}`
      : `Compliance monitor for ${assetId}`,
    pillar: requirement?.pillar || validationRecord.lineage?.pillar || 'governance',
    cloudProvider: cloudProvider || 'azure',
    assetClass: requirement?.pillar === 'identity' ? 'infrastructure-identity' : 'infrastructure-security',
    governanceLinks: {
      entityId: validationRecord.tenantId,
      requirementId: validationRecord.requirementId,
      artifactId: validationRecord.artifactId,
      templateId: validationRecord.templateId || requirement?.templateId,
      validationId: validationRecord.validationId,
      layer2OutputPath: validationRecord.layer2Ref?.outputPath,
      controlIds: monitoringRules.map((r) => r.controlId).filter(Boolean),
      vendorDeliverableProfile: expectations?.vendorDeliverableProfile || null
    },
    monitoringRules,
    complianceState,
    healthState: validationRecord.healthState.overall,
    lastEvaluatedAt: validationRecord.validatedAt,
    lastValidationId: validationRecord.validationId,
    status: 'active',
    deploymentExpectationsRef: expectations
      ? {
          expectedHealthState: expectations.expectedHealthState,
          expectedComplianceState: expectations.expectedComplianceState
        }
      : null,
    lineage: {
      ...validationRecord.lineage,
      artifactLayer: 'asset-monitor',
      pillar: requirement?.pillar || validationRecord.lineage?.pillar,
      downstream: {
        ...(validationRecord.lineage?.downstream || {}),
        complianceMonitorIds: [monitorId],
        assetIds: [assetId]
      }
    },
    evaluationHistory: [
      {
        evaluatedAt: validationRecord.validatedAt,
        validationId: validationRecord.validationId,
        complianceState,
        healthState: validationRecord.healthState.overall,
        checksum: hashContent(validationRecord)
      }
    ]
  };

  if (!monitor.monitoringRules.length) {
    monitor.monitoringRules.push({
      ruleId: 'rule-default-posture',
      controlId: 'post-deploy-health',
      checkType: inferCheckType(monitor.cloudProvider),
      frequency: 'daily',
      expectedState: expectations?.expectedHealthState || 'healthy',
      severityOnFail: 'high',
      remediationTemplateId: validationRecord.templateId
    });
  }

  return monitor;
}

function inferCheckType(cloudProvider) {
  const map = {
    azure: 'azure-policy-scan',
    aws: 'aws-config-eval',
    gcp: 'gcp-org-policy'
  };
  return map[cloudProvider] || 'custom-health-probe';
}

function saveJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function loadJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function createValidationRecord(payload, actorEmail) {
  const validationId = payload.validationId || `val-${Date.now()}`;
  const lineage = buildLineageEnvelope({
    artifactLayer: 'validation',
    outputType: payload.layer2Ref?.outputType,
    cloudProvider: payload.layer2Ref?.cloudProvider || payload.deployedRef?.cloudProvider,
    pillar: payload.pillar,
    upstream: {
      entityIds: payload.entityIds || [],
      telemetryEventIds: payload.telemetryEventIds || [],
      requirementId: payload.requirementId,
      artifactId: payload.artifactId,
      templateId: payload.templateId,
      templateVersion: payload.templateVersion,
      definitionRefs: payload.definitionRefs || [],
      layer2OutputPath: payload.layer2Ref?.outputPath
    },
    tarCol: payload.tarCol || {},
    actors: {
      proposer: actorEmail,
      executor: 'traceability-service',
      systemId: 'ict-governance-framework-api'
    },
    contentChecksum: hashContent(payload)
  });

  const record = {
    validationId,
    tenantId: payload.tenantId,
    artifactId: payload.artifactId,
    requirementId: payload.requirementId,
    templateId: payload.templateId,
    layer2Ref: payload.layer2Ref,
    deployedRef: payload.deployedRef,
    healthState: payload.healthState,
    controlResults: payload.controlResults || [],
    validatedAt: new Date().toISOString(),
    validatedBy: actorEmail || 'system',
    lineage,
    rpasEvidence: payload.rpasEvidence || {}
  };

  const expectationsCtx = getDeploymentExpectations(
    payload.tenantId,
    payload.requirementId,
    resolveCloudProvider(null, record),
    record
  );
  record.deploymentExpectationsEvaluation = evaluateAgainstExpectations(
    record,
    expectationsCtx.expectations
  );
  record.deploymentExpectations = expectationsCtx.expectations
    ? {
        expectedHealthState: expectationsCtx.expectations.expectedHealthState,
        expectedComplianceState: expectationsCtx.expectations.expectedComplianceState,
        vendorDeliverableProfile: expectationsCtx.expectations.vendorDeliverableProfile
      }
    : null;

  saveJson(path.join(validationsDir(payload.tenantId), `${validationId}.json`), record);
  appendAudit({ eventType: 'validation', eventAction: 'created', validationId, tenantId: payload.tenantId });
  return record;
}

function upsertComplianceMonitor(monitor) {
  const filePath = path.join(monitorsDir(monitor.tenantId), `${monitor.monitorId}.json`);
  saveJson(filePath, monitor);
  return { monitor, path: path.relative(REPO_ROOT, filePath) };
}

function buildAssetTagPatch(validationRecord, monitor) {
  return {
    adpaLineageId: validationRecord.lineage.lineageId,
    complianceMonitorId: monitor.monitorId,
    requirementId: validationRecord.requirementId,
    artifactId: validationRecord.artifactId,
    validationId: validationRecord.validationId,
    templateId: validationRecord.templateId,
    lastValidatedAt: validationRecord.validatedAt,
    healthState: validationRecord.healthState.overall
  };
}

async function applyAssetLoopBack(validationRecord, pool, actorEmail) {
  const bridge = loadBridge();
  const resourceIds = validationRecord.deployedRef?.resourceIds || [];
  if (!resourceIds.length) {
    throw new Error('deployedRef.resourceIds required for asset loop-back');
  }

  const expectationsCtx = getDeploymentExpectations(
    validationRecord.tenantId,
    validationRecord.requirementId,
    null,
    validationRecord
  );
  const evaluation = evaluateAgainstExpectations(validationRecord, expectationsCtx.expectations);
  validationRecord.deploymentExpectationsEvaluation = evaluation;

  const complianceState = evaluation.meetsExpectations && expectationsCtx.expectations
    ? expectationsCtx.expectations.expectedComplianceState
    : mapHealthToCompliance(validationRecord.healthState.overall);

  const results = {
    validationId: validationRecord.validationId,
    assetsUpdated: [],
    monitorsCreated: [],
    complianceState,
    deploymentExpectationsEvaluation: evaluation
  };

  for (const assetId of resourceIds) {
    const monitor = buildComplianceMonitor(validationRecord, assetId, expectationsCtx);
    const saved = upsertComplianceMonitor(monitor);
    results.monitorsCreated.push(saved);

    const tagPatch = {
      ...buildAssetTagPatch(validationRecord, monitor),
      expectedComplianceState: expectationsCtx.expectations?.expectedComplianceState,
      expectedHealthState: expectationsCtx.expectations?.expectedHealthState,
      vendorDeliverableSummary: expectationsCtx.expectations?.vendorDeliverableProfile?.summary
    };

    if (pool) {
      const provider = (monitor.cloudProvider || 'azure').replace(/^./, (c) => c.toUpperCase());
      const normalizedProvider = provider === 'Gcp' ? 'GCP' : provider === 'Aws' ? 'AWS' : provider === 'Azure' ? 'Azure' : 'Hybrid';

      await pool.query(
        `
        INSERT INTO asset_register (
          asset_id, tenant_id, provider, resource_type, name, location, tags, compliance_state, last_discovered
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        ON CONFLICT (asset_id) DO UPDATE SET
          compliance_state = EXCLUDED.compliance_state,
          tags = asset_register.tags || EXCLUDED.tags,
          last_discovered = CURRENT_TIMESTAMP
        RETURNING asset_id, compliance_state
        `,
        [
          assetId,
          validationRecord.tenantId,
          normalizedProvider,
          'governance-deployed',
          assetId.split('/').pop() || assetId,
          'governed',
          JSON.stringify(tagPatch),
          complianceState
        ]
      );
    }

    results.assetsUpdated.push({
      assetId,
      complianceState,
      complianceMonitorId: monitor.monitorId,
      lineageId: validationRecord.lineage.lineageId
    });
  }

  validationRecord.assetLoopBack = {
    assetIds: resourceIds,
    complianceMonitorIds: results.monitorsCreated.map((m) => m.monitor.monitorId),
    complianceStateApplied: complianceState,
    appliedAt: new Date().toISOString()
  };

  saveJson(
    path.join(validationsDir(validationRecord.tenantId), `${validationRecord.validationId}.json`),
    validationRecord
  );

  appendAudit({
    eventType: 'asset-loop-back',
    eventAction: 'applied',
    validationId: validationRecord.validationId,
    tenantId: validationRecord.tenantId,
    assetCount: resourceIds.length,
    actorEmail
  });

  if ((bridge.assetLoopBack?.rules?.blockCsrBaselineOnNonCompliant
    || expectationsCtx.expectations?.onFailure?.blockCsrBaseline)
    && ['NonCompliant', 'Partial'].includes(complianceState)) {
    results.csrBaselineBlocked = true;
    results.reEnterTelemetryLoop = true;
  }

  const shouldEmitClientEscalation = !evaluation.meetsExpectations
    && expectationsCtx.expectations?.onFailure?.emitClientEscalation !== false;

  const shouldEmitIncident = !evaluation.meetsExpectations
    && expectationsCtx.expectations?.onFailure?.emitSecOpsIncident === true
    && pool;

  if (shouldEmitClientEscalation || shouldEmitIncident) {
    try {
      const {
        buildComplianceNotificationEnvelope,
        formatClientNotificationDescription
      } = require('./compliance-notification-service');
      const { createClientEscalation } = require('./compliance-client-escalation-service');
      const onFailure = expectationsCtx.expectations.onFailure;
      const assetId = resourceIds[0];
      const complianceNotification = buildComplianceNotificationEnvelope({
        tenantId: validationRecord.tenantId,
        requirement: expectationsCtx.requirement,
        evaluation,
        assetId,
        validationId: validationRecord.validationId,
        requirementId: validationRecord.requirementId,
        lineage: validationRecord.lineage,
        remediationTemplateId: onFailure?.remediationTemplateId
      });

      let clientEscalation = null;
      if (shouldEmitClientEscalation) {
        clientEscalation = createClientEscalation({
          complianceNotification,
          requirement: expectationsCtx.requirement,
          evaluation,
          remediationTemplateId: onFailure?.remediationTemplateId,
          monitorId: results.monitorsCreated?.[0]?.monitor?.monitorId || null
        });
        results.clientEscalation = {
          escalationId: clientEscalation.escalationId,
          emitted: true,
          clientActions: clientEscalation.mitigationPlan.clientActions.length
        };
      }

      if (shouldEmitIncident) {
        const { ingestGovernanceIncident } = require('./governance-incident-ingest');
        const { updateClientEscalation } = require('./compliance-client-escalation-service');
        const gapSummary = evaluation.gaps
          .map((g) => `${g.type}: expected ${g.expected || g.expectedState}, observed ${g.observed}`)
          .join('; ');
        const baseDescription = `Post-deploy validation failed for requirement ${validationRecord.requirementId}. ${gapSummary}`;
        const description = formatClientNotificationDescription(complianceNotification, baseDescription);
        const incident = await ingestGovernanceIncident(pool, {
          body: {
            tenantId: validationRecord.tenantId,
            driftType: onFailure.driftType || 'governance',
            severity: onFailure.severity || 'HIGH',
            description,
            assetId,
            validationId: validationRecord.validationId,
            requirementId: validationRecord.requirementId,
            complianceNotification
          }
        });
        results.secOpsIncident = {
          incidentId: incident?.incident?.incident_id,
          emitted: true
        };
        if (clientEscalation) {
          updateClientEscalation(
            validationRecord.tenantId,
            clientEscalation.escalationId,
            { secOpsIncidentId: incident?.incident?.incident_id || null }
          );
        }
      }
    } catch (err) {
      if (shouldEmitClientEscalation) {
        results.clientEscalation = { emitted: false, error: err.message };
      }
      if (shouldEmitIncident) {
        results.secOpsIncident = { emitted: false, error: err.message };
      }
    }
  }

  return results;
}

function listComplianceMonitors(tenantId) {
  const dir = monitorsDir(tenantId);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => loadJsonSafe(path.join(dir, f)))
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastEvaluatedAt || 0) - new Date(a.lastEvaluatedAt || 0));
}

function getComplianceMonitor(tenantId, monitorId) {
  return loadJsonSafe(path.join(monitorsDir(tenantId), `${monitorId}.json`));
}

function getValidationRecord(tenantId, validationId) {
  return loadJsonSafe(path.join(validationsDir(tenantId), `${validationId}.json`));
}

function getAuditTrail(limit = 100) {
  return loadRegistry().entries.slice(0, limit);
}

module.exports = {
  loadBridge,
  loadRequirement,
  loadArtifactTemplate,
  getDeploymentExpectations,
  evaluateAgainstExpectations,
  buildLineageEnvelope,
  createValidationRecord,
  applyAssetLoopBack,
  listComplianceMonitors,
  getComplianceMonitor,
  getValidationRecord,
  getAuditTrail,
  mapHealthToCompliance,
  REPO_ROOT
};
