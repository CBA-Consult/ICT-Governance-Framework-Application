# Tenant artifact store

Per-tenant governance requirements, LLM-generated artifact specifications, and deployed IaC/CaC outputs.

## Layout

```text
tenants/
├── registry.json                    Index of all tenants
└── <tenant-id>/
    ├── tenant.manifest.json         Requirements index and cloud profile
    ├── requirements/                Approved governance requirements (JSON input)
    ├── generated/                   LLM output specifications (JSON intermediate)
    ├── validations/                 Post-deploy validation records
    ├── compliance-monitors/         Required asset compliance monitoring definitions
    └── deployed/                    Translated IaC and compliance policies
        ├── azure/
        ├── aws/
        └── gcp/
```

## Relationship to entity catalog

Each tenant links to an ADPA entity file in `adpa/entities/` via `entityRef`. Telemetry from Sentinel, CASB, or Azure Policy can recommend templates and seed new requirements.

## File conventions

| Type | Naming | Schema |
|------|--------|--------|
| Requirement | `<pillar>-<topic>-requirement.json` | `governance-requirement.schema.json` |
| Generated artifact | `<requirement-id>-<timestamp>.artifact.json` | `generated-artifact.schema.json` |
| Tenant manifest | `tenant.manifest.json` | `tenant-artifact-store.schema.json` |

## Workflow

1. Register tenant in `registry.json` and create folder structure.
2. Author requirements in `requirements/` using a standard template from `adpa/templates/governance-artifacts/`.
3. Run LLM generation (future: `npm run adpa:generate:artifact`) to produce JSON in `generated/`.
4. Translate to cloud IaC/CaC (future: `npm run adpa:translate:artifact`) into `deployed/`.
5. Certify through RPAS (`npm run governance:validate`).
6. Validate deployed health state → `POST /api/traceability/validate-and-loopback` updates assets and creates compliance monitors.

Do not commit secrets, live credentials, or PII in tenant files.

## Demo tenant

`tenant-contoso-health` includes an approved identity MFA requirement and a draft network segmentation requirement aligned with the seven-pillar templates.
