# Governance Artifact Template Repository

JSON templates that define how an LLM ingests a **governance requirement** and produces an intermediate **generated artifact** specification. That JSON is then translated to cloud-specific **Infrastructure as Code** (Bicep, Terraform) and **Compliance-as-Code** (Azure Policy, AWS Config, GCP Org Policy).

## Pipeline

```text
Governance Requirement (JSON)
        │
        ▼
  Artifact Template (JSON)  ──►  LLM processing  ──►  Generated Artifact (JSON)
        │                                                    │
        │                                                    ├──► Azure Bicep / ARM
        │                                                    ├──► AWS Terraform / CloudFormation
        │                                                    ├──► GCP Terraform
        │                                                    └──► Compliance policies
        ▼
  Tenant artifact store (per-tenant requirements + outputs)
```

## Layout

```text
governance-artifacts/
├── manifest.json              Template registry (seven pillars)
├── llm-prompts/
│   └── system-instructions.json   Shared LLM role and output envelope
└── standard/                  One template per security pillar
    ├── identity-access-control.template.json
    ├── device-compliance.template.json
    ├── software-supply-chain.template.json
    ├── network-segmentation.template.json
    ├── data-protection.template.json
    ├── security-monitoring.template.json
    └── resilience-backup.template.json
```

## Template structure

Each `*.template.json` file conforms to `adpa/schemas/governance-artifact-template.schema.json` and defines:

| Section | Purpose |
|---------|---------|
| `governanceRequirement` | Required input fields from tenant requirement JSON |
| `llmProcessing` | System instructions ref, user prompt template, validation rules |
| `outputSchema` | Target schema for LLM JSON output |
| `iacTargets` | Per-cloud translator module and output path pattern |
| `complianceTargets` | Policy translator modules per cloud |
| `rpasBinding` | CSR baseline and drift classification |

## Related paths

| Path | Role |
|------|------|
| `adpa/schemas/` | JSON schemas for templates, requirements, artifacts, tenant store |
| `adpa/tenants/` | Per-tenant requirements, generated artifacts, deployed IaC |
| `blueprint-templates/` | Reference Bicep blueprints linked from templates |
| `adpa/translators/` | Future cloud-specific JSON → IaC/CaC translators |

## Commands

```bash
npm run adpa:validate:templates    # Validate template repository structure
npm run adpa:list:artifacts        # List governance artifact templates
```

## Adding a template

1. Add `standard/<template-id>.template.json` conforming to the schema.
2. Register in `manifest.json`.
3. Run `npm run adpa:validate:templates`.
4. Add a sample tenant requirement under `adpa/tenants/<tenant-id>/requirements/`.

Translator modules under `adpa/translators/` are placeholders for a future implementation phase.
