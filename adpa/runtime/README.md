# ADPA runtime (orchestration platform)

The full ADPA orchestration platform (.NET Aspire AppHost, governance ledger API, Blazor governor portal) is consolidated into this single product repository over time.

**Current in-repo orchestration** uses:

| Capability | Location |
|------------|----------|
| RPAS rituals and AEV gates | `governance/rpas/scripts/` |
| Document generation | `adpa/scripts/generate.js` |
| Template prioritization | `adpa/scripts/prioritize-from-telemetry.js` |
| ICT web experience tier | `ict-governance-framework/` |

When the Aspire orchestrator is added to this repo, place projects under `adpa/runtime/` and update `adpa/systematics/tiers.json` orchestration `location` accordingly.

Planned layout:

```
adpa/runtime/
├── Adpa.AppHost/
├── Adpa.Orchestrator/
└── README.md
```

Until then, governance mutations flow through RPAS PowerShell scripts and approved PR workflows per `governance/CONTRIBUTING.md`.
