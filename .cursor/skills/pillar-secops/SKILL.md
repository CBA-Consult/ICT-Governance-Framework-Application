---
name: pillar-secops
description: >-
  SecOps engine — Sentinel ingest, incident lifecycle, FAIR trigger, SecOps UI.
  Use before incident API, SLA, or CISO dashboard changes. Write
  secops.contract.test.js first.
---

# Pillar 6 — SecOps (operational engine)

**NIST:** DE.CM, DE.AE, RS.MA, RS.AN  
**Status:** Partial — ingest API delivered; correlation IR expanding

## Module boundaries

| Area | Paths |
|------|--------|
| Ingest | `services/governance-incident-ingest.js`, `api/governance-router.js` |
| Lifecycle | `services/governance-incident-lifecycle.js`, `sql/incident_lifecycle.sql` |
| SLA | `services/governance-sla.js` |
| FAIR on ingest | `services/fair-risk-engine.js` |
| MITRE | `services/mitre-enrichment.js` |
| UI | `app/secops-console/`, `app/components/dashboards/CISOExecutiveDashboard.js` |

## Contract file

`ict-governance-framework/tests/contracts/secops.contract.test.js`

## Contracts must prove

- Ingest writes `governance_incidents` + `governance_incident_ingest_log` with `correlation_id`
- FAIR calculation log entry on critical ingest
- Lifecycle PATCH respects `VALID_TRANSITIONS`
- Timeline includes detect + risk_updated events when applicable

## Legacy verification

```bash
npm run verify:secops
npm run verify:calibration
```

## Next features (contract before code)

- [ ] Sprint B — assign / escalate API contracts
- [ ] Sentinel-shaped payload → asset correlation contract
- [ ] p95 ingest latency assertion in contract harness

## Review checklist

- [ ] Webhook secret on all ingest paths
- [ ] DE.AE / RS.MA evidence in Phase 3 pack
