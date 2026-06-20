---
name: pillar-software
description: >-
  Software supply chain pillar — CASB catalog, shadow IT, SBOM gating. Use before
  CASB ingest or app catalog changes. Write software.contract.test.js first.
---

# Pillar 3 — Software

**NIST:** GV.SC  
**Status:** CASB ingest contracts active (shadow IT → asset_register + SecOps)

## Module boundaries

| Area | Paths |
|------|--------|
| **CASB ingest (pillar API)** | `api/software-router.js`, `services/software-casb-ingest.js` |
| Legacy CASB bulk ingest | `api/asset-router.js` (`/casb-ingest`), `services/casb-ingest-parser.js` |
| Shadow IT schema | `sql/software_casb_events.sql`, `sql/casb_shadow_fields.sql` |
| App catalog | `api/casb-app-catalog.js`, `db-casb-app-catalog-schema.sql` |

## Contract file

`ict-governance-framework/tests/contracts/software.contract.test.js`

## Contracts must prove

- ✅ `POST /api/software/ingest` — persists shadow IT event with risk level
- ✅ Rejects invalid `x-webhook-signature` (401)
- ✅ Links `deviceId` when managed device exists
- ✅ High-risk ingest raises SecOps incident (`SW-CASB-{eventId}`)

## Legacy verification

```bash
npm run setup:software-casb
npm run test:contracts:software
npm run verify:post-feature   # includes verify:casb-ingest before QG-601
npm run verify:casb-ingest
npm run verify:casb-polling
```

## Next features (contract before code)

- [ ] PostgreSQL-backed app catalog (replace in-memory paths)
- [ ] SBOM / vulnerability gate on procurement approval

## Review checklist

- [ ] GV.SC evidence: inventory from live feed, not static JSON only
- [ ] Webhook secret rotation for `SOFTWARE_INGEST_WEBHOOK_SECRET` / `CASB_INGEST_WEBHOOK_SECRET`
