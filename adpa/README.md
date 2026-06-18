# ADPA — Architecture Decision and Policy Alignment

ADPA is the **in-repository** policy-to-code bridge for the ICT Governance Framework. All ADPA systematics live in this single product repo alongside RPAS governance, framework documentation, Compliance as Code templates, and the ICT governance web application.

## Integration mode

| Property | Value |
|----------|-------|
| Mode | `in-repo` (single product repository) |
| Project ID | `ADPA-ICT-GOV` |
| RPAS binding | `governance/rpas/project.binding.json` |
| CSR baseline | CSR-42 v2.3.0 |

## Layout

```text
adpa/
├── project.manifest.json       Product manifest and path registry
├── config/
│   └── processor-config.json   AI processor routing (PMBOK + ICT templates)
├── systematics/
│   ├── tiers.json              Intelligence / orchestration / experience / data
│   └── lifecycle.json          Proposal → Decision → Execution stages
├── templates/
│   ├── manifest.json           ICT Governance Framework template registry
│   └── ict-governance/         Ten canonical ADPA templates
├── schemas/
│   ├── telemetry-entity.schema.json
│   └── generation-request.schema.json
├── entities/                   Telemetry-hydrated entity catalog
├── bridge/
│   └── ict-governance-framework.json
├── runtime/                    Future Aspire orchestrator (see README)
└── scripts/
    ├── generate.js             Document generation CLI
    ├── prioritize-from-telemetry.js
    └── validate-project.js
```

## Commands

From repository root:

```bash
npm run adpa:validate          # Validate ADPA project structure
npm run adpa:list              # List ICT framework templates
npm run adpa:generate -- policy-alignment --var entityId=tenant-01
npm run adpa:prioritize        # Demo telemetry → template queue
npm run governance:validate    # RPAS / AEV baseline validation
```

## ICT Governance Framework templates

| Template ID | Framework source |
|-------------|------------------|
| `framework-charter` | ICT Governance Framework |
| `multi-tenant-governance` | Multi-Cloud Multi-Tenant Framework |
| `operating-model` | Strategic & Tactical Overview |
| `target-state` | Target Governance Framework |
| `policy-alignment` | ICT Governance Policies |
| `raci-authority` | Roles & Responsibilities |
| `kpi-catalog` | ICT Governance Metrics |
| `compliance-as-code-map` | IaC Integration guide |
| `iso38500-crosswalk` | ISO/IEC 38500 Standards |
| `zero-trust-assessment` | Zero Trust Maturity Model |

Outputs are written to `generated-documents/` with generation metadata in `.adpa-generation.json`.

## Telemetry-guided generation

1. Ingest signals via `ict-governance-framework` enterprise connectors (Sentinel, CASB).
2. Update or create entity files in `adpa/entities/`.
3. Run `npm run adpa:prioritize` with a telemetry event JSON.
4. Generate highest-ranked templates with `npm run adpa:generate`.
5. Certify changes through RPAS (`npm run governance:validate`, AMD rituals).

## Related documentation

- [ADPA integration guide](../docs/implementation/guides/ADPA-ICT-Governance-Integration-Guide.md)
- [RPAS governance integration](../docs/implementation/guides/RPAS-Governance-Integration-Guide.md)
- [README ADPA bridge section](../README.md#adpa-as-the-governance-bridge)
