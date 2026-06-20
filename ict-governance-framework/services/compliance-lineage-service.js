'use strict';

const fs = require('fs');
const path = require('path');
const traceability = require('./traceability-service');

const REPO_ROOT = traceability.REPO_ROOT;
const BRIDGE_PATH = path.join(REPO_ROOT, 'adpa/coe/compliance-lineage-bridge.json');

function loadBridge() {
  return JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf8'));
}

function loadJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listValidationRecords(tenantId) {
  const dir = path.join(REPO_ROOT, 'adpa/tenants', tenantId, 'validations');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => loadJsonSafe(path.join(dir, f)))
    .filter(Boolean);
}

function normalizeControlId(frameworkControlRef, frameworkMappings) {
  const bridge = loadBridge();
  const ref = frameworkControlRef
    || frameworkMappings?.[0]?.controlId
    || null;
  if (!ref) return null;

  const rule = bridge.controlIdNormalization.rules.find((r) => ref.includes(r.pattern));
  if (rule) return rule.controlId;

  return ref.replace(/-/g, '.').replace(/\.(\d+)$/, (_, n) => `.${n.padStart(2, '0')}`);
}

function resolveCertifications(frameworkMappings) {
  const bridge = loadBridge();
  if (!frameworkMappings?.length) return [];

  const certs = new Set();
  frameworkMappings.forEach((m) => {
    bridge.certificationFrameworks.forEach((cert) => {
      if (cert.frameworkKeys.some((k) => m.framework?.includes(k) || m.framework === k)) {
        certs.add(cert.certificationId);
      }
    });
  });
  return [...certs];
}

function buildLineageChain(monitor, validation, requirement) {
  return {
    source: {
      telemetryEventIds: validation?.lineage?.upstream?.telemetryEventIds
        || requirement?.deploymentExpectations ? [] : [],
      entityIds: validation?.lineage?.upstream?.entityIds || [monitor.tenantId]
    },
    requirement: requirement ? {
      requirementId: requirement.requirementId,
      title: requirement.title,
      pillar: requirement.pillar,
      status: requirement.status,
      path: `adpa/tenants/${requirement.tenantId}/requirements/${requirement.requirementId}.json`
    } : null,
    deploymentExpectations: requirement?.deploymentExpectations || monitor.deploymentExpectationsRef || null,
    validation: validation ? {
      validationId: validation.validationId,
      healthState: validation.healthState,
      gaps: validation.deploymentExpectationsEvaluation?.gaps || [],
      path: `adpa/tenants/${monitor.tenantId}/validations/${validation.validationId}.json`
    } : null,
    layer2: monitor.governanceLinks?.layer2OutputPath || validation?.layer2Ref?.outputPath || null,
    monitor: {
      monitorId: monitor.monitorId,
      complianceState: monitor.complianceState,
      healthState: monitor.healthState,
      path: `adpa/tenants/${monitor.tenantId}/compliance-monitors/${monitor.monitorId}.json`
    },
    asset: {
      assetId: monitor.assetId,
      complianceState: monitor.complianceState
    }
  };
}

function extractNonComplianceDetails(monitor, validation, requirement) {
  const details = [];
  const bridge = loadBridge();

  if (bridge.nonComplianceStates.monitorCompliance.includes(monitor.complianceState)) {
    details.push({
      type: 'monitor-compliance',
      severity: monitor.complianceState === 'NonCompliant' ? 'critical' : 'high',
      message: `Asset monitor reports ${monitor.complianceState}`,
      observed: monitor.complianceState,
      expected: requirement?.deploymentExpectations?.expectedComplianceState || 'Compliant'
    });
  }

  if (bridge.nonComplianceStates.healthState.includes(monitor.healthState)) {
    details.push({
      type: 'health-state',
      severity: monitor.healthState === 'failed' ? 'critical' : 'high',
      message: `Health state is ${monitor.healthState}`,
      observed: monitor.healthState,
      expected: requirement?.deploymentExpectations?.expectedHealthState || 'healthy'
    });
  }

  (validation?.deploymentExpectationsEvaluation?.gaps || []).forEach((gap) => {
    details.push({
      type: 'expectation-gap',
      severity: 'high',
      message: `${gap.type}: expected ${gap.expected}, observed ${gap.observed}`,
      ...gap
    });
  });

  (monitor.monitoringRules || []).forEach((rule) => {
    if (rule.lastStatus === 'fail') {
      details.push({
        type: 'monitoring-rule-failure',
        severity: rule.severityOnFail || 'high',
        ruleId: rule.ruleId,
        controlId: rule.controlId,
        message: `Monitoring rule failed: ${rule.expectedState}`,
        expectedState: rule.expectedState,
        observedState: rule.lastObservedState,
        mapsToAcceptanceCriteria: rule.mapsToAcceptanceCriteria
      });
    }
  });

  (validation?.controlResults || []).filter((c) => c.status === 'fail').forEach((ctrl) => {
    details.push({
      type: 'control-validation-failure',
      severity: 'high',
      controlId: ctrl.controlId,
      message: ctrl.expected ? `Expected: ${ctrl.expected}` : 'Control validation failed',
      expected: ctrl.expected,
      observed: ctrl.observed,
      evidenceRef: ctrl.evidenceRef
    });
  });

  return details;
}

async function fetchDbAssets(pool, tenantId) {
  if (!pool) return [];
  const { rows } = await pool.query(
    `
    SELECT asset_id, tenant_id, provider, resource_type, name, location,
           tags, compliance_state, last_discovered
    FROM asset_register
    WHERE tenant_id = $1
      AND compliance_state IN ('NonCompliant', 'Partial')
    ORDER BY last_discovered DESC
    `,
    [tenantId]
  );
  return rows;
}

async function fetchComplianceControls(pool, controlIds) {
  if (!pool || !controlIds.length) return [];
  const { rows } = await pool.query(
    `SELECT * FROM compliance_controls WHERE control_id = ANY($1::varchar[])`,
    [controlIds]
  );
  return rows;
}

async function buildComplianceLineageReview(tenantId, pool) {
  const bridge = loadBridge();
  const monitors = traceability.listComplianceMonitors(tenantId);
  const validations = listValidationRecords(tenantId);
  const dbAssets = await fetchDbAssets(pool, tenantId);

  const nonCompliantMonitors = monitors.filter((m) =>
    bridge.nonComplianceStates.monitorCompliance.includes(m.complianceState)
    || bridge.nonComplianceStates.healthState.includes(m.healthState)
  );

  const flaggedControlIds = new Set();
  const flaggedCertIds = new Set();
  const entities = [];

  nonCompliantMonitors.forEach((monitor) => {
    const requirementId = monitor.governanceLinks?.requirementId;
    const requirement = requirementId
      ? traceability.loadRequirement(tenantId, requirementId)
      : null;
    const validation = monitor.lastValidationId
      ? traceability.getValidationRecord(tenantId, monitor.lastValidationId)
      : validations.find((v) => v.requirementId === requirementId);

    const frameworkMappings = requirement?.frameworkMappings || [];
    const nonComplianceDetails = extractNonComplianceDetails(monitor, validation, requirement);

    const relatedControls = (monitor.monitoringRules || []).map((rule) => {
      const controlId = normalizeControlId(rule.frameworkControlRef, frameworkMappings);
      if (controlId) flaggedControlIds.add(controlId);
      return {
        controlId,
        frameworkControlRef: rule.frameworkControlRef,
        ruleId: rule.ruleId,
        status: rule.lastStatus || 'unknown',
        expectedState: rule.expectedState
      };
    });

    resolveCertifications(frameworkMappings).forEach((c) => flaggedCertIds.add(c));

    entities.push({
      entityType: 'governed-asset',
      assetId: monitor.assetId,
      tenantId,
      pillar: monitor.pillar,
      cloudProvider: monitor.cloudProvider,
      complianceState: monitor.complianceState,
      healthState: monitor.healthState,
      lineage: buildLineageChain(monitor, validation, requirement),
      nonComplianceDetails,
      relatedControls,
      relatedCertifications: resolveCertifications(frameworkMappings),
      requirement: requirement ? {
        requirementId: requirement.requirementId,
        title: requirement.title,
        acceptanceCriteria: requirement.acceptanceCriteria
      } : null,
      vendorDeliverableProfile: monitor.governanceLinks?.vendorDeliverableProfile
        || requirement?.deploymentExpectations?.vendorDeliverableProfile
    });
  });

  dbAssets.forEach((asset) => {
    if (entities.some((e) => e.assetId === asset.asset_id)) return;

    const tags = typeof asset.tags === 'string' ? JSON.parse(asset.tags) : (asset.tags || {});
    const requirement = tags.requirementId
      ? traceability.loadRequirement(tenantId, tags.requirementId)
      : null;

    entities.push({
      entityType: 'asset-register',
      assetId: asset.asset_id,
      tenantId,
      complianceState: asset.compliance_state,
      provider: asset.provider,
      resourceType: asset.resource_type,
      name: asset.name,
      tags,
      lineage: {
        requirement: requirement ? { requirementId: requirement.requirementId, title: requirement.title } : null,
        validation: tags.validationId ? { validationId: tags.validationId } : null,
        monitor: tags.complianceMonitorId ? { monitorId: tags.complianceMonitorId } : null,
        lineageId: tags.adpaLineageId
      },
      nonComplianceDetails: [{
        type: 'asset-register',
        severity: asset.compliance_state === 'NonCompliant' ? 'critical' : 'high',
        message: `Asset register compliance_state: ${asset.compliance_state}`,
        observed: asset.compliance_state,
        expected: tags.expectedComplianceState || 'Compliant'
      }],
      relatedControls: [],
      relatedCertifications: requirement ? resolveCertifications(requirement.frameworkMappings) : []
    });

    if (requirement?.frameworkMappings) {
      requirement.frameworkMappings.forEach((m) => {
        const cid = normalizeControlId(m.controlId, [m]);
        if (cid) flaggedControlIds.add(cid);
      });
      resolveCertifications(requirement.frameworkMappings).forEach((c) => flaggedCertIds.add(c));
    }
  });

  const flaggedControls = await fetchComplianceControls(pool, [...flaggedControlIds]);
  const flaggedCertifications = bridge.certificationFrameworks
    .filter((c) => flaggedCertIds.has(c.certificationId))
    .map((c) => ({
      ...c,
      impactedEntityCount: entities.filter((e) => e.relatedCertifications?.includes(c.certificationId)).length,
      status: 'at-risk'
    }));

  const metrics = {
    nonCompliantAssets: entities.length,
    failedMonitoringRules: entities.reduce(
      (n, e) => n + e.nonComplianceDetails.filter((d) => d.type === 'monitoring-rule-failure').length,
      0
    ),
    validationGaps: entities.reduce(
      (n, e) => n + e.nonComplianceDetails.filter((d) => d.type === 'expectation-gap').length,
      0
    ),
    flaggedControls: flaggedControls.length,
    flaggedCertifications: flaggedCertifications.length,
    openIncidentsHint: 'Query GET /api/governance/incidents for correlated SecOps incidents'
  };

  return {
    tenantId,
    reviewedAt: new Date().toISOString(),
    metrics,
    flaggedControls: flaggedControls.map((c) => ({
      ...c,
      flagged: true,
      impactedEntities: entities.filter((e) =>
        e.relatedControls?.some((rc) => rc.controlId === c.control_id)
      ).map((e) => e.assetId)
    })),
    flaggedCertifications,
    nonCompliantEntities: entities
  };
}

async function getEntityComplianceDrillDown(tenantId, assetId, pool) {
  const review = await buildComplianceLineageReview(tenantId, pool);
  const entity = review.nonCompliantEntities.find((e) => e.assetId === assetId);

  if (!entity) {
    const monitor = traceability.listComplianceMonitors(tenantId)
      .find((m) => m.assetId === assetId);
    if (!monitor) return null;

    return {
      assetId,
      tenantId,
      complianceState: monitor.complianceState,
      note: 'Entity is monitored but currently compliant',
      lineage: buildLineageChain(
        monitor,
        traceability.getValidationRecord(tenantId, monitor.lastValidationId),
        traceability.loadRequirement(tenantId, monitor.governanceLinks?.requirementId)
      )
    };
  }

  return {
    ...entity,
    flaggedControls: review.flaggedControls.filter((c) =>
      entity.relatedControls?.some((rc) => rc.controlId === c.control_id)
    ),
    flaggedCertifications: review.flaggedCertifications.filter((c) =>
      entity.relatedCertifications?.includes(c.certificationId)
    )
  };
}

module.exports = {
  loadBridge,
  buildComplianceLineageReview,
  getEntityComplianceDrillDown,
  normalizeControlId,
  resolveCertifications
};
