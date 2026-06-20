---
name: pillar-data
description: >-
  Data pillar — classification, DLP ingest (backlog). Use when adding Purview/
  Macie-style signals or app-layer DLP. Write data.contract.test.js first.
---

# Pillar 5 — Data

**NIST:** PR.DS  
**Status:** Backlog — IaC encryption only

## Module boundaries

| Area | Paths |
|------|--------|
| IaC encryption | `blueprint-templates/`, `docs/compliance/` |
| Future DLP ingest | TBD — `services/data-classification-ingest.js` |

## Contract file

`ict-governance-framework/tests/contracts/data.contract.test.js`

## Contracts must prove (when started)

- Classification label on document/asset row updates audit trail
- DLP violation creates governance incident with PR.DS category

## Legacy verification

None yet — define `npm run verify:data` when ingest API exists.

## Next features (contract before code)

- [ ] Sprint E — DLP webhook contract stub
- [ ] Link document management to classification metadata

## Review checklist

- [ ] Data residency (EU) documented for stored labels
