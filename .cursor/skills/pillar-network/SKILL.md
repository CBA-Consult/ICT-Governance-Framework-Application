---
name: pillar-network
description: >-
  Network pillar — segmentation, exposure scanning (backlog). Use when adding
  topology or port-exposure features. Write network.contract.test.js first.
---

# Pillar 4 — Network

**NIST:** PR.PS  
**Status:** Backlog — docs / IaC only today

## Module boundaries

| Area | Paths |
|------|--------|
| IaC blueprints | `blueprint-templates/infrastructure-blueprints/` |
| Future monitor | TBD — `services/network-posture.js` (not created) |

## Contract file

`ict-governance-framework/tests/contracts/network.contract.test.js`

## Contracts must prove (when started)

- Exposed port finding ingested with resource correlation
- Segmentation policy violation maps to governance incident taxonomy

## Legacy verification

None yet — define `npm run verify:network` when first service lands.

## Next features (contract before code)

- [ ] Define contract for NSG / firewall drift → `POST /api/governance/incidents`
- [ ] Topology snapshot storage schema

## Review checklist

- [ ] No scanner credentials in repo; use managed identity / Key Vault
