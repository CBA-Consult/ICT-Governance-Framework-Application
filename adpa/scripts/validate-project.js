#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { getPaths } = require('./lib/paths');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validateAdpaProject() {
  const paths = getPaths();
  const errors = [];
  const warnings = [];

  const required = [
    paths.projectManifest,
    paths.templateManifest,
    paths.processorConfig,
    path.join(paths.adpaRoot, 'systematics', 'tiers.json'),
    path.join(paths.adpaRoot, 'systematics', 'lifecycle.json')
  ];

  required.forEach((file) => {
    if (!fs.existsSync(file)) {
      errors.push(`Missing required file: ${file}`);
    }
  });

  if (errors.length) {
    return { valid: false, errors, warnings };
  }

  const project = loadJson(paths.projectManifest);
  const templates = loadJson(paths.templateManifest);

  if (project.integrationMode !== 'in-repo') {
    warnings.push(`integrationMode is '${project.integrationMode}', expected 'in-repo'.`);
  }

  templates.templates.forEach((t) => {
    const file = path.join(paths.adpaRoot, 'templates', t.file);
    if (!fs.existsSync(file)) {
      errors.push(`Template registered but file missing: ${t.file}`);
    }
  });

  const adpaControl = path.join(paths.governanceRoot, 'artifacts', 'ADPA.control.json');
  if (fs.existsSync(adpaControl)) {
    const control = loadJson(adpaControl);
    const sourceOfTruth = control.sourceOfTruth
      || control.artifactMetadata?.sourceOfTruth
      || '';
    const integrationMode = control.systematics?.integrationMode
      || control.integrationMode;

    if (!sourceOfTruth.includes('adpa')) {
      warnings.push(`ADPA.control.json sourceOfTruth does not reference adpa/: '${sourceOfTruth}'.`);
    }
    if (integrationMode && integrationMode !== 'in-repo') {
      warnings.push(`ADPA.control.json integration mode is '${integrationMode}', expected 'in-repo'.`);
    }
    if (control.artifactMetadata?.status === 'Production-Attested') {
      console.log(`ADPA control attested: ${control.artifactMetadata.artifactId} v${control.artifactMetadata.version}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function main() {
  const result = validateAdpaProject();
  if (result.warnings.length) {
    result.warnings.forEach((w) => console.warn(`WARN: ${w}`));
  }
  if (!result.valid) {
    result.errors.forEach((e) => console.error(`ERROR: ${e}`));
    process.exit(1);
  }
  console.log('ADPA in-repo project validation passed.');
}

if (require.main === module) {
  main();
}

module.exports = { validateAdpaProject };
