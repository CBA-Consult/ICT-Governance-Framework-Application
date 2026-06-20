---
name: pillar-resilience
description: >-
  Resilience engine — Git-to-cloud DR, RTO/RPO measurement. Use before recovery
  orchestrator or DR field changes. Write resilience.contract.test.js first.
---

# Pillar 7 — Resilience (operational engine)

**NIST:** RC.RP, RC.IM  
**Status:** Partial — script + DR fields on assets

## Module boundaries

| Area | Paths |
|------|--------|
| DR fields | `scripts/setup-asset-dr-fields.js`, asset register |
| Recovery verify | `scripts/verify-gb3-recovery.js` |
| Automation | `azure-automation/`, `implementation-automation/` |

## Contract file

`ict-governance-framework/tests/contracts/resilience.contract.test.js`

## Contracts must prove

- Asset DR fields (RTO/RPO targets) persist and validate ranges
- Recovery verification script reports pass/fail with measurable timestamps
- (Future) orchestrator run records evidence artifact path

## Legacy verification

```bash
npm run verify:gb3
```

## Next features (contract before code)

- [ ] Pipeline step records RTO measurement vs target
- [ ] Link recovery events to governance incidents

## Review checklist

- [ ] G-B3 gate evidence not PDF-only
- [ ] Backups to Azure Blob in same region (West Europe)
