#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { getPaths } = require('./lib/paths');
const { renderTemplate } = require('./generate');

const PILLARS = [
  { id: 'identity', label: 'Identity', nist: 'PR.AA, GV.RR' },
  { id: 'devices', label: 'Devices', nist: 'ID.AM, PR.PS' },
  { id: 'software', label: 'Software', nist: 'GV.SC, ID.RA' },
  { id: 'network', label: 'Network', nist: 'PR.PS, DE.CM' },
  { id: 'data', label: 'Data', nist: 'PR.DS, GV.PO' },
  { id: 'secops', label: 'SecOps', nist: 'DE.AE, DE.CM, RS.AN' },
  { id: 'resilience', label: 'Resilience', nist: 'RC.RP, RC.CO' }
];

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadTenant(tenantId) {
  const paths = getPaths();
  const registry = loadJson(paths.tenantRegistry);
  const entry = registry.tenants.find((t) => t.tenantId === tenantId);
  if (!entry) {
    throw new Error(`Unknown tenant: ${tenantId}`);
  }

  const manifestPath = path.join(paths.repoRoot, entry.manifestPath);
  const manifest = loadJson(manifestPath);

  const requirements = manifest.requirements.map((req) => {
    const reqPath = path.join(paths.repoRoot, req.path);
    return { ...req, data: loadJson(reqPath) };
  });

  let entity = null;
  if (entry.entityRef) {
    const entityPath = path.join(paths.repoRoot, entry.entityRef);
    if (fs.existsSync(entityPath)) {
      entity = loadJson(entityPath);
    }
  }

  const infraPath = path.join(
    paths.tenantsDir,
    tenantId,
    'approved-infrastructure.json'
  );
  const infrastructure = fs.existsSync(infraPath) ? loadJson(infraPath) : null;

  const artifactManifest = loadJson(paths.governanceArtifactManifest);

  return { entry, manifest, requirements, entity, infrastructure, artifactManifest };
}

function complianceStatusForPillar(pillarId, requirements, infrastructure) {
  const reqs = requirements.filter((r) => r.data.pillar === pillarId);
  const comps = (infrastructure?.components || []).filter((c) => c.pillar === pillarId);

  if (reqs.length === 0 && comps.length === 0) {
    return { status: 'Gap', detail: 'No requirements or approved infrastructure defined' };
  }

  const approvedReqs = reqs.filter((r) => r.status === 'approved' || r.data.status === 'approved');
  const draftReqs = reqs.filter((r) => r.status === 'draft' || r.data.status === 'draft');

  if (approvedReqs.length > 0 && draftReqs.length === 0 && comps.length > 0) {
    return { status: 'Compliant', detail: `${approvedReqs.length} approved requirement(s), ${comps.length} approved component(s)` };
  }
  if (approvedReqs.length > 0 || comps.length > 0) {
    return {
      status: 'Partial',
      detail: `${approvedReqs.length} approved, ${draftReqs.length} draft requirement(s); ${comps.length} component(s)`
    };
  }
  return { status: 'Planned', detail: 'Infrastructure approved; requirements pending' };
}

function buildExecutiveSummary(tenant) {
  const { manifest, requirements, infrastructure, entity } = tenant;
  const approvedCount = requirements.filter(
    (r) => r.status === 'approved' || r.data.status === 'approved'
  ).length;
  const componentCount = infrastructure?.components?.length || 0;
  const providers = (manifest.cloudProfile?.enabledProviders || []).join(', ');

  return [
    `${manifest.displayName} operates on **${manifest.cloudProfile?.primaryProvider || 'multi-cloud'}**`,
    `with enabled providers: ${providers || 'not specified'}.`,
    `This baseline includes **${approvedCount}** approved governance requirement(s)`,
    `and **${componentCount}** approved infrastructure component(s) across the seven security pillars.`,
    entity
      ? `Current telemetry risk score: **${entity.riskScore}/10** (source: ${entity.discoverySource}).`
      : ''
  ]
    .filter(Boolean)
    .join(' ');
}

function buildRequirementsSection(requirements) {
  if (requirements.length === 0) {
    return '_No governance requirements registered._';
  }

  return requirements
    .map((req, index) => {
      const d = req.data;
      const criteria = (d.acceptanceCriteria || [])
        .map((c) => `- ${c}`)
        .join('\n');
      const mappings = (d.frameworkMappings || [])
        .map((m) => `- ${m.framework} ${m.controlId}: ${m.controlName}`)
        .join('\n');

      return `### 2.${index + 1} ${d.title}

| Attribute | Value |
|-----------|-------|
| Requirement ID | ${d.requirementId} |
| Pillar | ${d.pillar} |
| Priority | ${d.priority || 'medium'} |
| Status | **${d.status}** |
| Control objective | ${d.controlObjective || '—'} |

**Statement:** ${d.statement}

${d.rationale ? `**Rationale:** ${d.rationale}\n` : ''}
**Acceptance criteria:**

${criteria || '_None defined._'}

**Framework mappings:**

${mappings || '_None defined._'}

**Scope:** ${JSON.stringify(d.scope || {})}
`;
    })
    .join('\n');
}

function buildInfrastructureSection(infrastructure) {
  if (!infrastructure?.components?.length) {
    return '_No approved infrastructure baseline defined. Add `approved-infrastructure.json` to the tenant folder._';
  }

  return infrastructure.components
    .map((comp, index) => {
      const services = (comp.services || []).map((s) => `- ${s}`).join('\n');
      const controls = (comp.complianceControls || []).join(', ');

      return `### 3.${index + 1} ${comp.name}

| Attribute | Value |
|-----------|-------|
| Component ID | ${comp.componentId} |
| Pillar | ${comp.pillar} |
| Status | **${comp.status}** |
| Cloud | ${comp.cloudProvider} |
| Blueprint | \`${comp.blueprintRef}\` |

${comp.description}

**Services:**

${services || '_None listed._'}

**Compliance controls:** ${controls || '—'}
`;
    })
    .join('\n');
}

function buildPillarComplianceSection(requirements, infrastructure) {
  const header =
    '| Pillar | NIST CSF | Compliance status | Evidence |\n|--------|----------|-------------------|----------|\n';
  const rows = PILLARS.map((pillar) => {
    const { status, detail } = complianceStatusForPillar(
      pillar.id,
      requirements,
      infrastructure
    );
    return `| **${pillar.label}** | ${pillar.nist} | **${status}** | ${detail} |`;
  }).join('\n');

  return header + rows;
}

function buildTraceabilityRows(requirements, infrastructure) {
  const rows = [];
  requirements.forEach((req) => {
    const d = req.data;
    const comp = (infrastructure?.components || []).find((c) => c.pillar === d.pillar);
    const template = req.templateId;
    const status =
      d.status === 'approved' && comp ? 'Compliant' : d.status === 'draft' ? 'Partial' : 'Planned';
    rows.push(
      `| ${d.title} | ${d.pillar} | ${comp?.name || '—'} | \`${comp?.blueprintRef || template}\` | ${status} |`
    );
  });

  if (rows.length === 0) {
    return '| — | — | — | — | — |';
  }
  return rows.join('\n');
}

function buildArtifactTemplateRows(artifactManifest) {
  return artifactManifest.templates
    .map(
      (t) =>
        `| ${t.pillar} | \`${t.id}\` | Bicep / Terraform | Azure Policy / AWS Config |`
    )
    .join('\n');
}

function buildDocumentVariables(tenantId) {
  const tenant = loadTenant(tenantId);
  const { manifest, requirements, infrastructure, entity, artifactManifest } = tenant;
  const now = new Date().toISOString();

  return {
    documentTitle: `ICT Governance Documentation — ${manifest.displayName}`,
    tenantId,
    tenantDisplayName: manifest.displayName,
    documentVersion: manifest.version || '1.0.0',
    generatedAt: now.split('T')[0],
    csrBaseline: infrastructure?.csrBaseline || 'CSR-42 v2.3.0',
    primaryProvider: manifest.cloudProfile?.primaryProvider || 'multi-cloud',
    executiveSummary: buildExecutiveSummary(tenant),
    requirementsSection: buildRequirementsSection(requirements),
    infrastructureSection: buildInfrastructureSection(infrastructure),
    pillarComplianceSection: buildPillarComplianceSection(requirements, infrastructure),
    traceabilityRows: buildTraceabilityRows(requirements, infrastructure),
    artifactTemplateRows: buildArtifactTemplateRows(artifactManifest),
    tenantOwner: entity?.displayName || manifest.displayName,
    approvedBy: infrastructure?.approvedBy || 'Pending approval',
    approvedAt: infrastructure?.approvedAt?.split('T')[0] || 'Pending'
  };
}

async function buildDocxBuffer(variables) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType
  } = require('docx');

  const children = [];

  function heading(text, level = HeadingLevel.HEADING_1) {
    children.push(new Paragraph({ text, heading: level, spacing: { after: 200 } }));
  }

  function para(text, opts = {}) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text, ...opts })],
        spacing: { after: 120 }
      })
    );
  }

  function metaTable(rows) {
    const tableRows = rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })]
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              children: [new Paragraph(value)]
            })
          ]
        })
    );
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows
      })
    );
    children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  }

  heading(variables.documentTitle);
  metaTable([
    ['Tenant', `${variables.tenantDisplayName} (${variables.tenantId})`],
    ['Document version', variables.documentVersion],
    ['Generated', variables.generatedAt],
    ['CSR baseline', variables.csrBaseline],
    ['Primary cloud', variables.primaryProvider],
    ['Classification', 'Internal — Governance']
  ]);

  heading('1. Executive summary', HeadingLevel.HEADING_2);
  para(variables.executiveSummary.replace(/\*\*/g, ''));

  heading('2. Governance requirements', HeadingLevel.HEADING_2);
  const tenant = loadTenant(variables.tenantId);
  tenant.requirements.forEach((req, i) => {
    const d = req.data;
    heading(`2.${i + 1} ${d.title}`, HeadingLevel.HEADING_3);
    metaTable([
      ['Requirement ID', d.requirementId],
      ['Pillar', d.pillar],
      ['Priority', d.priority || 'medium'],
      ['Status', d.status]
    ]);
    para(`Statement: ${d.statement}`);
    if (d.rationale) para(`Rationale: ${d.rationale}`);
    if (d.acceptanceCriteria?.length) {
      para('Acceptance criteria:', { bold: true });
      d.acceptanceCriteria.forEach((c) => para(`• ${c}`));
    }
  });

  heading('3. Approved ICT infrastructure', HeadingLevel.HEADING_2);
  if (tenant.infrastructure?.components?.length) {
    tenant.infrastructure.components.forEach((comp, i) => {
      heading(`3.${i + 1} ${comp.name}`, HeadingLevel.HEADING_3);
      metaTable([
        ['Component ID', comp.componentId],
        ['Pillar', comp.pillar],
        ['Status', comp.status],
        ['Cloud', comp.cloudProvider],
        ['Blueprint', comp.blueprintRef]
      ]);
      para(comp.description);
      if (comp.services?.length) {
        para('Services:', { bold: true });
        comp.services.forEach((s) => para(`• ${s}`));
      }
    });
  } else {
    para('No approved infrastructure baseline defined.');
  }

  heading('4. Seven-pillar compliance matrix', HeadingLevel.HEADING_2);
  const pillarHeader = new TableRow({
    children: ['Pillar', 'NIST CSF', 'Status', 'Evidence'].map(
      (h) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true })],
              alignment: AlignmentType.CENTER
            })
          ]
        })
    )
  });
  const pillarRows = PILLARS.map((pillar) => {
    const { status, detail } = complianceStatusForPillar(
      pillar.id,
      tenant.requirements,
      tenant.infrastructure
    );
    return new TableRow({
      children: [pillar.label, pillar.nist, status, detail].map(
        (cell) => new TableCell({ children: [new Paragraph(cell)] })
      )
    });
  });
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [pillarHeader, ...pillarRows]
    })
  );
  children.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  heading('5. Requirement-to-infrastructure traceability', HeadingLevel.HEADING_2);
  para('See Section 2 and 3 for detailed mappings. Summary status reflects approved requirements against approved components.');

  heading('6. Roles and approval', HeadingLevel.HEADING_2);
  metaTable([
    ['Approved by', variables.approvedBy],
    ['Approval date', variables.approvedAt]
  ]);

  heading('7. Document control', HeadingLevel.HEADING_2);
  para(`Version ${variables.documentVersion} — Generated ${variables.generatedAt} by ADPA Generator.`);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  return Packer.toBuffer(doc);
}

function resolveTemplateContent() {
  const templatePath = path.join(
    getPaths().adpaRoot,
    'templates',
    'ict-governance',
    'tenant-governance-documentation.template.md'
  );
  return fs.readFileSync(templatePath, 'utf8');
}

function stripFrontmatter(content) {
  if (content.startsWith('---')) {
    const end = content.indexOf('---', 3);
    if (end !== -1) {
      return content.slice(end + 3).trimStart();
    }
  }
  return content;
}

async function generateGovernanceDocumentation(tenantId, options = {}) {
  const paths = getPaths();
  const variables = buildDocumentVariables(tenantId);
  const markdown = stripFrontmatter(renderTemplate(resolveTemplateContent(), variables));

  const outputDir = path.join(
    paths.generatedOutput,
    'governance',
    tenantId
  );
  const tenantDocDir = path.join(paths.tenantsDir, tenantId, 'documents');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(tenantDocDir, { recursive: true });

  const baseName = `ICT-Governance-${tenantId}-v${variables.documentVersion}`;
  const mdPath = path.join(outputDir, `${baseName}.md`);
  const docxPath = path.join(outputDir, `${baseName}.docx`);

  fs.writeFileSync(mdPath, markdown, 'utf8');

  let docxWritten = false;
  if (!options.markdownOnly) {
    try {
      const buffer = await buildDocxBuffer(variables);
      fs.writeFileSync(docxPath, buffer);
      fs.copyFileSync(docxPath, path.join(tenantDocDir, `${baseName}.docx`));
      fs.copyFileSync(mdPath, path.join(tenantDocDir, `${baseName}.md`));
      docxWritten = true;
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        console.warn('WARN: docx package not installed — Markdown only. Run: npm install docx');
      } else {
        throw err;
      }
    }
  }

  const manifestPath = path.join(outputDir, '.adpa-generation.json');
  const record = {
    templateId: 'tenant-governance-documentation',
    tenantId,
    generatedAt: new Date().toISOString(),
    markdownPath: path.relative(paths.repoRoot, mdPath),
    docxPath: docxWritten ? path.relative(paths.repoRoot, docxPath) : null,
    documentVersion: variables.documentVersion
  };

  let manifest = [];
  if (fs.existsSync(manifestPath)) {
    manifest = loadJson(manifestPath);
  }
  manifest.push(record);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  return { mdPath, docxPath: docxWritten ? docxPath : null, record };
}

function printUsage() {
  console.log(`Generate tenant governance documentation (Markdown + DOCX)

Usage:
  node adpa/scripts/generate-governance-doc.js <tenantId>
  node adpa/scripts/generate-governance-doc.js list

Example:
  npm run adpa:generate:governance-doc -- tenant-contoso-health
`);
}

async function main() {
  const arg = process.argv[2];

  if (!arg || arg === 'help' || arg === '--help') {
    printUsage();
    process.exit(0);
  }

  if (arg === 'list') {
    const registry = loadJson(getPaths().tenantRegistry);
    registry.tenants.forEach((t) => console.log(t.tenantId, '-', t.displayName));
    return;
  }

  const result = await generateGovernanceDocumentation(arg);
  console.log(`Generated Markdown: ${result.mdPath}`);
  if (result.docxPath) {
    console.log(`Generated DOCX:     ${result.docxPath}`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { generateGovernanceDocumentation, buildDocumentVariables, loadTenant };
