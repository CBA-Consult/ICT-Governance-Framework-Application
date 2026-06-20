#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { getPaths } = require('./lib/paths');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

const REQUIRED_TEMPLATE_KEYS = [
  'templateId',
  'version',
  'artifactType',
  'pillar',
  'governanceRequirement',
  'llmProcessing',
  'outputSchema',
  'iacTargets',
  'complianceTargets'
];

function validateGovernanceArtifactTemplates() {
  const paths = getPaths();
  const errors = [];
  const warnings = [];

  const manifestPath = paths.governanceArtifactManifest;
  if (!fileExists(manifestPath)) {
    errors.push(`Missing governance artifact manifest: ${manifestPath}`);
    return { valid: false, errors, warnings };
  }

  const manifest = loadJson(manifestPath);
  const systemInstructions = path.join(
    paths.adpaRoot,
    'templates',
    'governance-artifacts',
    'llm-prompts',
    'system-instructions.json'
  );

  if (!fileExists(systemInstructions)) {
    errors.push(`Missing LLM system instructions: ${systemInstructions}`);
  }

  manifest.templates.forEach((entry) => {
    const templatePath = path.join(
      paths.adpaRoot,
      'templates',
      'governance-artifacts',
      entry.file
    );

    if (!fileExists(templatePath)) {
      errors.push(`Template registered but file missing: ${entry.file}`);
      return;
    }

    const template = loadJson(templatePath);

    REQUIRED_TEMPLATE_KEYS.forEach((key) => {
      if (!(key in template)) {
        errors.push(`Template ${entry.id} missing required key: ${key}`);
      }
    });

    if (template.templateId && template.templateId !== entry.id) {
      errors.push(
        `Template ID mismatch: manifest '${entry.id}' vs file '${template.templateId}'`
      );
    }

    if (template.pillar && entry.pillar && template.pillar !== entry.pillar) {
      warnings.push(
        `Pillar mismatch for ${entry.id}: manifest '${entry.pillar}' vs file '${template.pillar}'`
      );
    }

    if (template.governanceRequirement?.examplePath) {
      const examplePath = path.join(paths.repoRoot, template.governanceRequirement.examplePath);
      if (!fileExists(examplePath)) {
        warnings.push(`Example requirement not found: ${template.governanceRequirement.examplePath}`);
      }
    }

    Object.values(template.iacTargets || {}).forEach((target) => {
      if (target.translatorModule) {
        const translatorPath = path.join(paths.repoRoot, target.translatorModule);
        if (!fileExists(translatorPath)) {
          warnings.push(
            `Translator not yet implemented: ${target.translatorModule} (referenced by ${entry.id})`
          );
        }
      }
    });
  });

  return { valid: errors.length === 0, errors, warnings, templateCount: manifest.templates.length };
}

function validateTenantStores() {
  const paths = getPaths();
  const errors = [];
  const warnings = [];

  const registryPath = paths.tenantRegistry;
  if (!fileExists(registryPath)) {
    warnings.push(`Tenant registry not found: ${registryPath}`);
    return { valid: true, errors, warnings };
  }

  const registry = loadJson(registryPath);

  registry.tenants.forEach((tenant) => {
    const manifestPath = path.join(paths.repoRoot, tenant.manifestPath);
    if (!fileExists(manifestPath)) {
      errors.push(`Tenant manifest missing: ${tenant.manifestPath}`);
      return;
    }

    const manifest = loadJson(manifestPath);

    if (manifest.tenantId !== tenant.tenantId) {
      errors.push(
        `Tenant ID mismatch: registry '${tenant.tenantId}' vs manifest '${manifest.tenantId}'`
      );
    }

    manifest.requirements.forEach((req) => {
      const reqPath = path.join(paths.repoRoot, req.path);
      if (!fileExists(reqPath)) {
        errors.push(`Requirement file missing for ${tenant.tenantId}: ${req.path}`);
        return;
      }

      const requirement = loadJson(reqPath);
      if (requirement.templateId !== req.templateId) {
        errors.push(
          `Requirement template mismatch (${req.requirementId}): manifest '${req.templateId}' vs file '${requirement.templateId}'`
        );
      }
    });

    if (tenant.entityRef) {
      const entityPath = path.join(paths.repoRoot, tenant.entityRef);
      if (!fileExists(entityPath)) {
        warnings.push(`Entity ref not found for ${tenant.tenantId}: ${tenant.entityRef}`);
      }
    }
  });

  return { valid: errors.length === 0, errors, warnings, tenantCount: registry.tenants.length };
}

function main() {
  const templateResult = validateGovernanceArtifactTemplates();
  const tenantResult = validateTenantStores();

  const allWarnings = [...templateResult.warnings, ...tenantResult.warnings];
  const allErrors = [...templateResult.errors, ...tenantResult.errors];

  allWarnings.forEach((w) => console.warn(`WARN: ${w}`));

  if (!templateResult.valid || !tenantResult.valid) {
    allErrors.forEach((e) => console.error(`ERROR: ${e}`));
    process.exit(1);
  }

  console.log(
    `Governance artifact template validation passed (${templateResult.templateCount} templates, ${tenantResult.tenantCount || 0} tenants).`
  );
}

if (require.main === module) {
  main();
}

module.exports = { validateGovernanceArtifactTemplates, validateTenantStores };
