---
name: pillar-devices
description: >-
  Devices pillar — multi-cloud asset register, DR posture, incident binding.
  Use before asset sync, CASB correlation, or register UI changes. Write
  devices.contract.test.js first.
---

# Pillar 2 — Devices

**NIST:** ID.AM  
**Status:** Substantial (G-B1)

## Module boundaries

| Area | Paths |
|------|--------|
| Asset register (cloud) | `services/asset-discovery-sync.js`, `api/asset-router.js`, `app/asset-register/` |
| **Endpoint devices** | `services/device-registration.js`, `api/devices-router.js`, `sql/managed_devices.sql` |
| Incident binding | `services/governance-incident-ingest.js`, `sql/incident_asset_binding.sql` |
| DR fields | `scripts/setup-asset-dr-fields.js` |

## Contract file

`ict-governance-framework/tests/contracts/devices.contract.test.js`

## Contracts must prove

- ✅ `POST /api/devices/register` — owner required, controlled device type taxonomy, default `pending` compliance
- ✅ `POST /api/devices/:id/compliance-check` — derived posture, SecOps incident on non_compliant
- ✅ `GET /api/devices/:id` — authoritative persisted state, 404 when missing
- Asset ingest upserts by stable `asset_id` per tenant (cloud register)
- Incident ingest correlates resource URI to register row when present

## Legacy verification

```bash
npm run setup:managed-devices
npm run test:contracts:devices
npm run verify:post-feature
npm run verify:assets
npm run verify:gb2
```

## Next features (contract before code)

- [x] `GET /api/devices/:id`
- [x] `POST /api/devices/:id/compliance-check`
- [ ] `POST /api/devices/:id/decommission`
- [ ] Multi-cloud sync depth (Azure + AWS identifiers)

## Review checklist

- [ ] Tenant isolation on register queries
- [ ] Webhook auth on asset sync paths
