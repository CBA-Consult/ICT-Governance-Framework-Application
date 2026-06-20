#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { getPaths } = require('./lib/paths');

function main() {
  const paths = getPaths();
  const manifestPath = paths.governanceArtifactManifest;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  console.log('Governance artifact templates:\n');
  manifest.templates.forEach((t) => {
    console.log(`  ${t.id}`);
    console.log(`    pillar: ${t.pillar}`);
    console.log(`    type:   ${t.artifactType}`);
    console.log(`    file:   adpa/templates/governance-artifacts/${t.file}`);
    if (t.nistCategories?.length) {
      console.log(`    nist:   ${t.nistCategories.join(', ')}`);
    }
    console.log('');
  });
  console.log(`Total: ${manifest.templates.length} templates`);
}

if (require.main === module) {
  main();
}
