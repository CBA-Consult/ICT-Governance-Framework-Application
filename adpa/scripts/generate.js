#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { getPaths } = require('./lib/paths');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function renderTemplate(content, variables) {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return variables[key];
    }
    return `{{${key}}}`;
  });
}

function listTemplates() {
  const { templateManifest } = getPaths();
  const manifest = loadJson(templateManifest);
  return manifest.templates;
}

function resolveTemplate(templateId) {
  const entry = listTemplates().find((t) => t.id === templateId);
  if (!entry) {
    throw new Error(`Unknown template: ${templateId}`);
  }
  const templatePath = path.join(getPaths().adpaRoot, 'templates', entry.file);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file missing: ${templatePath}`);
  }
  return { entry, templatePath, content: fs.readFileSync(templatePath, 'utf8') };
}

function generateDocument(templateId, variables = {}, options = {}) {
  const paths = getPaths();
  const { entry, content } = resolveTemplate(templateId);
  const rendered = renderTemplate(content, {
    organizationName: 'Organization',
    entityId: 'entity-unknown',
    projectId: 'ADPA-ICT-GOV',
    ...variables
  });

  const outputDir = path.join(
    paths.generatedOutput,
    options.outputCategory || entry.outputCategory || 'adpa-generated'
  );
  fs.mkdirSync(outputDir, { recursive: true });

  const fileName = options.fileName || `${templateId}-${Date.now()}.md`;
  const outputPath = path.join(outputDir, fileName);
  fs.writeFileSync(outputPath, rendered, 'utf8');

  const manifestPath = path.join(outputDir, '.adpa-generation.json');
  const record = {
    templateId,
    generatedAt: new Date().toISOString(),
    frameworkSource: entry.frameworkSource,
    outputPath: path.relative(paths.repoRoot, outputPath),
    variables,
    projectId: 'ADPA-ICT-GOV'
  };

  let manifest = [];
  if (fs.existsSync(manifestPath)) {
    manifest = loadJson(manifestPath);
  }
  manifest.push(record);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  return { outputPath, record };
}

function printUsage() {
  console.log(`ADPA document generation (in-repo)

Usage:
  node adpa/scripts/generate.js list
  node adpa/scripts/generate.js generate <templateId> [--var key=value ...]
  node adpa/scripts/generate.js generate-all [--dry-run]

Templates are defined in adpa/templates/manifest.json
`);
}

function parseArgs(argv) {
  const args = { vars: {} };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--var' && argv[i + 1]) {
      const [key, ...rest] = argv[i + 1].split('=');
      args.vars[key] = rest.join('=');
      i++;
    } else if (argv[i] === '--dry-run') {
      args.dryRun = true;
    } else if (!args.command) {
      args.command = argv[i];
    } else if (!args.templateId) {
      args.templateId = argv[i];
    }
  }
  return args;
}

function main() {
  const { command, templateId, vars, dryRun } = parseArgs(process.argv.slice(2));

  if (!command || command === 'help' || command === '--help') {
    printUsage();
    process.exit(0);
  }

  if (command === 'list') {
    listTemplates().forEach((t) => {
      console.log(`${t.id}\t${t.frameworkSource}\t-> ${t.outputCategory}`);
    });
    return;
  }

  if (command === 'generate') {
    if (!templateId) {
      console.error('Template ID required.');
      process.exit(1);
    }
    if (dryRun) {
      const { entry } = resolveTemplate(templateId);
      console.log(JSON.stringify({ templateId, entry, vars }, null, 2));
      return;
    }
    const result = generateDocument(templateId, vars);
    console.log(`Generated: ${result.outputPath}`);
    return;
  }

  if (command === 'generate-all') {
    listTemplates().forEach((t) => {
      if (dryRun) {
        console.log(`Would generate: ${t.id}`);
        return;
      }
      const result = generateDocument(t.id, vars);
      console.log(`Generated: ${result.outputPath}`);
    });
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { listTemplates, generateDocument, renderTemplate };
