'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BRIDGE_PATH = path.join(REPO_ROOT, 'adpa/coe/compliance-lineage-bridge.json');

function loadBridge() {
  return JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf8'));
}

function resolveCertificationId(framework) {
  const bridge = loadBridge();
  const match = bridge.certificationFrameworks.find((cert) =>
    cert.frameworkKeys.some((k) => framework?.includes(k) || framework === k)
  );
  return match?.certificationId || framework;
}

function resolveCertificationLabel(certificationId) {
  const bridge = loadBridge();
  return bridge.certificationFrameworks.find((c) => c.certificationId === certificationId)?.label
    || certificationId;
}

function normalizeControlId(controlId) {
  if (!controlId) return null;
  const bridge = loadBridge();
  const rule = bridge.controlIdNormalization.rules.find((r) => controlId.includes(r.pattern));
  if (rule) return rule.controlId;
  return controlId.replace(/-/g, '.').replace(/\.(\d+)$/, (_, n) => `.${n.padStart(2, '0')}`);
}

function findRuleForGap(gap, monitoringRules) {
  if (gap.ruleId) {
    return monitoringRules.find((r) => r.ruleId === gap.ruleId);
  }
  if (gap.controlId) {
    return monitoringRules.find((r) => r.controlId === gap.controlId);
  }
  return null;
}

function buildTriggeredByEntry(gap, rule, assetId) {
  return {
    triggerType: gap.type,
    ruleId: gap.ruleId || rule?.ruleId || null,
    controlId: gap.controlId || rule?.controlId || null,
    expected: gap.expectedState || gap.expected || rule?.expectedState || null,
    observed: gap.observed || null,
    assetId: assetId || null,
    mapsToAcceptanceCriteria: gap.mapsToAcceptanceCriteria ?? rule?.mapsToAcceptanceCriteria ?? null
  };
}

/**
 * Resolves explicit framework / certification control impacts for each validation gap.
 * Every impact names the certification, framework, controlId, and controlName.
 */
function resolveFrameworkImpacts({ requirement, evaluation, monitoringRules, assetId }) {
  const frameworkMappings = requirement?.frameworkMappings || [];
  const rules = monitoringRules || requirement?.deploymentExpectations?.monitoringRules || [];
  const gaps = evaluation?.gaps || [];
  const impactMap = new Map();

  const ensureImpact = (mapping, triggeredBy) => {
    const certificationId = resolveCertificationId(mapping.framework);
    const controlId = normalizeControlId(mapping.controlId);
    const key = `${certificationId}::${controlId}`;
    if (!impactMap.has(key)) {
      impactMap.set(key, {
        certificationId,
        certificationLabel: resolveCertificationLabel(certificationId),
        framework: mapping.framework,
        controlId,
        controlName: mapping.controlName || mapping.controlId,
        complianceStatus: 'non-conformant',
        triggeredBy: []
      });
    }
    impactMap.get(key).triggeredBy.push(triggeredBy);
  };

  gaps.forEach((gap) => {
    const rule = findRuleForGap(gap, rules);
    const triggeredBy = buildTriggeredByEntry(gap, rule, assetId);
    if (rule?.frameworkControlRef) {
      triggeredBy.frameworkControlRef = rule.frameworkControlRef;
    }

    if (frameworkMappings.length) {
      frameworkMappings.forEach((m) => ensureImpact(m, triggeredBy));
    }
  });

  return [...impactMap.values()];
}

function buildMitigationPlan({ requirement, evaluation, remediationTemplateId }) {
  const templateId = remediationTemplateId
    || requirement?.deploymentExpectations?.onFailure?.remediationTemplateId
    || requirement?.templateId;

  return {
    remediationTemplateId: templateId || null,
    requirementId: requirement?.requirementId || null,
    requirementTitle: requirement?.title || null,
    acceptanceCriteria: requirement?.acceptanceCriteria || [],
    vendorDeliverableProfile: evaluation?.expectationSummary?.vendorDeliverableProfile
      || requirement?.deploymentExpectations?.vendorDeliverableProfile
      || null,
    failedRules: (evaluation?.gaps || [])
      .filter((g) => g.type === 'control')
      .map((g) => ({
        ruleId: g.ruleId,
        controlId: g.controlId,
        expectedState: g.expectedState,
        observed: g.observed
      }))
  };
}

function buildComplianceNotificationEnvelope({
  tenantId,
  requirement,
  evaluation,
  assetId,
  validationId,
  requirementId,
  lineage,
  remediationTemplateId
}) {
  const monitoringRules = requirement?.deploymentExpectations?.monitoringRules || [];
  const frameworkImpacts = resolveFrameworkImpacts({
    requirement,
    evaluation,
    monitoringRules,
    assetId
  });

  return {
    notificationClass: 'compliance-non-conformance',
    tenantId,
    requirementId: requirementId || requirement?.requirementId || null,
    validationId: validationId || null,
    assetId: assetId || null,
    lineage: lineage || null,
    frameworkImpacts,
    mitigationPlan: buildMitigationPlan({ requirement, evaluation, remediationTemplateId }),
    gaps: evaluation?.gaps || [],
    issuedAt: new Date().toISOString()
  };
}

function validateComplianceNotification(envelope) {
  if (!envelope || envelope.notificationClass !== 'compliance-non-conformance') {
    const error = new Error('Compliance client notifications require notificationClass compliance-non-conformance.');
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(envelope.frameworkImpacts) || envelope.frameworkImpacts.length === 0) {
    const error = new Error(
      'Cannot notify client without explicit framework control impacts. '
      + 'Each notification must name the certification, framework, controlId, and controlName.'
    );
    error.statusCode = 400;
    throw error;
  }

  envelope.frameworkImpacts.forEach((impact, index) => {
    if (!impact.certificationId || !impact.framework || !impact.controlId) {
      const error = new Error(
        `frameworkImpacts[${index}] must include certificationId, framework, and controlId.`
      );
      error.statusCode = 400;
      throw error;
    }
    if (!impact.triggeredBy?.length) {
      const error = new Error(
        `frameworkImpacts[${index}] must include at least one triggeredBy entry linking the failure.`
      );
      error.statusCode = 400;
      throw error;
    }
  });

  return envelope;
}

function formatFrameworkImpactLine(impact) {
  const triggers = impact.triggeredBy
    .map((t) => {
      const parts = [
        t.ruleId ? `rule ${t.ruleId}` : null,
        t.expected && t.observed ? `expected "${t.expected}", observed "${t.observed}"` : null,
        t.assetId ? `entity ${t.assetId}` : null
      ].filter(Boolean);
      return parts.join('; ');
    })
    .join(' | ');

  return (
    `${impact.certificationLabel} (${impact.framework}) control ${impact.controlId}`
    + `${impact.controlName ? ` — ${impact.controlName}` : ''}: ${impact.complianceStatus}`
    + (triggers ? `. Triggered by: ${triggers}` : '')
  );
}

function formatClientNotificationDescription(envelope, baseDescription) {
  validateComplianceNotification(envelope);

  const impactLines = envelope.frameworkImpacts.map((impact) => `- ${formatFrameworkImpactLine(impact)}`);
  const mitigation = envelope.mitigationPlan?.remediationTemplateId
    ? `\nMitigation template: ${envelope.mitigationPlan.remediationTemplateId}`
    : '';

  return [
    baseDescription || 'Compliance non-conformance detected.',
    '',
    'Framework control impacts (explicit — do not treat as whole-certification failure):',
    ...impactLines,
    mitigation,
    envelope.requirementId ? `\nGoverning requirement: ${envelope.requirementId}` : '',
    envelope.validationId ? `Validation: ${envelope.validationId}` : ''
  ].filter(Boolean).join('\n');
}

module.exports = {
  loadBridge,
  resolveCertificationId,
  normalizeControlId,
  resolveFrameworkImpacts,
  buildComplianceNotificationEnvelope,
  validateComplianceNotification,
  formatClientNotificationDescription,
  formatFrameworkImpactLine
};
