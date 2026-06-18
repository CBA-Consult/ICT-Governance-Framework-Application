#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { getPaths } = require('./lib/paths');

const SIGNAL_TEMPLATE_MAP = {
  'shadow-it': ['policy-alignment', 'zero-trust-assessment'],
  'policy-violation': ['policy-alignment', 'compliance-as-code-map', 'kpi-catalog'],
  'security-incident': ['zero-trust-assessment', 'compliance-as-code-map', 'framework-charter'],
  'compliance-drift': ['policy-alignment', 'iso38500-crosswalk', 'compliance-as-code-map'],
  'architectural-drift': ['compliance-as-code-map', 'target-state'],
  'security-drift': ['zero-trust-assessment', 'policy-alignment'],
  'observability-gap': ['kpi-catalog', 'operating-model'],
  'access-anomaly': ['raci-authority', 'zero-trust-assessment']
};

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function prioritizeFromTelemetry(event) {
  const manifest = loadJson(path.join(getPaths().adpaRoot, 'templates', 'manifest.json'));
  const signalType = event.signalType || event.driftCategory || 'policy-violation';
  const mapped = SIGNAL_TEMPLATE_MAP[signalType] || ['policy-alignment'];

  const ranked = mapped.map((templateId, index) => {
    const template = manifest.templates.find((t) => t.id === templateId);
    const valueAtRisk = (event.severity || 5) * (mapped.length - index);
    return {
      templateId,
      rank: index + 1,
      valueAtRisk,
      frameworkSource: template?.frameworkSource,
      outputCategory: template?.outputCategory,
      entityId: event.entityId,
      telemetryEventIds: event.telemetryEventIds || [event.eventId].filter(Boolean)
    };
  });

  return {
    prioritizedAt: new Date().toISOString(),
    signalType,
    entityId: event.entityId,
    queue: ranked
  };
}

function main() {
  const inputPath = process.argv[2];
  let event;

  if (inputPath && inputPath !== '-') {
    event = loadJson(path.resolve(inputPath));
  } else if (!process.stdin.isTTY) {
    const chunks = [];
    process.stdin.on('data', (c) => chunks.push(c));
    process.stdin.on('end', () => {
      event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      console.log(JSON.stringify(prioritizeFromTelemetry(event), null, 2));
    });
    return;
  } else {
    event = {
      entityId: 'tenant-demo',
      signalType: 'policy-violation',
      severity: 8,
      eventId: 'sentinel-demo-001',
      discoverySource: 'sentinel'
    };
  }

  console.log(JSON.stringify(prioritizeFromTelemetry(event), null, 2));
}

if (require.main === module) {
  main();
}

module.exports = { prioritizeFromTelemetry, SIGNAL_TEMPLATE_MAP };
