# ADPA — ICT Governance Framework Integration (Single Product Repository)

ADPA (Architecture Decision and Policy Alignment) is built **inside** this repository. There is no external ADPA submodule required for core functionality.

## Architecture

| Module | Path | Role |
|--------|------|------|
| ADPA product | `adpa/` | Templates, entities, generation, telemetry prioritization |
| RPAS governance | `governance/rpas/` | AEV gates, checksums, CSR baseline, control artifacts |
| ICT framework docs | `docs/governance-framework/`, `docs/policies/` | Canonical policy and framework source |
| Compliance as Code | `blueprint-templates/` | IaC and policy templates |
| Web application | `ict-governance-framework/` | Dashboards, Sentinel/CASB connectors |
| Generated output | `generated-documents/` | ADPA document outputs |

Bridge configuration: `adpa/bridge/ict-governance-framework.json`

## Quick start

```bash
npm install
npm run adpa:validate
npm run governance:register
npm run governance:validate
npm run adpa:list
npm run adpa:generate -- policy-alignment --var entityId=tenant-contoso-health
```

## Integration modes (historical)

| Mode | Status |
|------|--------|
| `vendor-scaffold` | Superseded — RPAS copied without ADPA module |
| `git submodule` | Not required — ADPA is in-repo |
| **`in-repo`** | **Current** — single product repository |

## Telemetry → template → certify loop

1. **Ingest** — Sentinel / CASB via `ict-governance-framework` enterprise connectors.
2. **Entity** — Persist or update `adpa/entities/{type}-{id}.json`.
3. **Prioritize** — `npm run adpa:prioritize -- path/to/event.json`
4. **Generate** — `npm run adpa:generate -- <templateId> --var key=value`
5. **Certify** — `npm run governance:validate`; material changes via AMD + CSR update.

Example telemetry event:

```json
{
  "entityId": "tenant-contoso-health",
  "signalType": "policy-violation",
  "severity": 8,
  "eventId": "sentinel-001",
  "discoverySource": "sentinel"
}
```

## Control artifacts

| Artifact | Path | sourceOfTruth |
|----------|------|---------------|
| ADPA | `governance/rpas/artifacts/ADPA.control.json` | `adpa/` |
| ARM | `governance/rpas/artifacts/ARM.control.json` | `adpa/` |
| AEV | `governance/rpas/artifacts/AEV.control.json` | `adpa/` |
| CSR-42 | `governance/rpas/artifacts/CSR-42.json` | Certified baseline |

## PMBOK document generation

Historical PMBOK outputs use the npm package `adpa-enterprise-framework-automation`. Processor routing is in `adpa/config/processor-config.json`.

ICT Governance Framework templates are in `adpa/templates/ict-governance/` and registered in `adpa/templates/manifest.json`.

## Future: Aspire orchestrator

The .NET Aspire orchestration stack can be added under `adpa/runtime/` without changing the enforcement model. Until then, RPAS PowerShell scripts and PR-based workflows provide orchestration.

## Related guides

- [RPAS Governance Integration Guide](RPAS-Governance-Integration-Guide.md)
- [adpa/README.md](../../adpa/README.md)
- [README ADPA bridge](../../README.md#adpa-as-the-governance-bridge)
