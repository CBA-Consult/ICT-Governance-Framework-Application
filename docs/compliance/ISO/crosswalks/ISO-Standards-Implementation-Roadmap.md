# ISO Standards — Implementation Roadmap

**Document ID:** ISO-ROADMAP-001  
**Date:** June 2026  
**Purpose:** Prioritised actions to strengthen ISO alignment across the ICT Governance Framework  
**Sources:** [Reassessment 2026](../ISO-Standards-Reassessment-2026.md), [Improvement Focus Areas](../../ICT-Governance-Framework-Improvement-Focus-Areas.md)

---

## Roadmap phases

| Phase | Horizon | Gate | ISO standards primarily affected |
|-------|---------|------|-------------------------------|
| **Phase 1** | 0–90 days | Gate A | 27001, 38500 (evidence integrity) |
| **Phase 2** | 90–180 days | Gate B | 22301, 27001 (operations), 31000 |
| **Phase 3** | 180+ days | Gate C | 42001, 27701, full attestation |

---

## Phase 1 — Evidence integrity (P1)

| ID | Action | Owner | ISO impact | Gate |
|----|--------|-------|------------|------|
| R-ISO-01 | Reconcile A034 — tag each mapping: Implemented / Partial / Planned / Gap with code links | Compliance + Architecture | 27001, 27701, all mapped standards | G-A1 |
| R-ISO-02 | Add **ISO 38500** to `compliance-lineage-bridge.json` (principle or EDM-phase IDs) | Architecture | 38500 | — |
| R-ISO-03 | Generate per-tenant **ISO 38500 crosswalk** via ADPA for all pilot tenants | Compliance | 38500 | G-A7 |
| R-ISO-04 | Normalise control IDs in lineage bridge to **27001:2022 Annex A** | Architecture | 27001 | — |
| R-ISO-05 | Label or remove mock data on compliance/CISO paths | Development | 27001 Clause 9 | G-A2 |

---

## Phase 2 — Operational attestation (P2)

| ID | Action | Owner | ISO impact | Gate |
|----|--------|-------|------------|------|
| R-ISO-06 | Publish **Statement of Applicability (SoA)** template from seven-pillar crosswalk | Compliance | 27001 | — |
| R-ISO-07 | Update `iso27001-compliance.bicep` to **27001:2022** references | IaC | 27001 | — |
| R-ISO-08 | Execute end-to-end **DR exercise** with documented RTO/RPO | BC + Security | 22301 | G-B3 |
| R-ISO-09 | Complete incident analysis workflow API | Development | 27001 A.5.24–A.5.27 | G-B4 |
| R-ISO-10 | Wire risk appetite statements to executive metrics | Risk + Architecture | 31000 | G-A6 |
| R-ISO-11 | Retain contract test results as audit evidence pack | DevOps | 27001 Clause 9 | — |

---

## Phase 3 — Extension and certification readiness (P3)

| ID | Action | Owner | ISO impact |
|----|--------|-------|------------|
| R-ISO-12 | Elevate **ISO 42001** to Tier 2; map AI control plane registry | AI governance | 42001 |
| R-ISO-13 | Create **27701 PIMS** crosswalk from GDPR + 27001 mappings | Compliance | 27701 |
| R-ISO-14 | Publish per-cloud **27017** control matrix (AWS/Azure/GCP) | Cloud architecture | 27017 |
| R-ISO-15 | Define tenant **certification path** guide (how clients use framework outputs for ISO audits) | Compliance | All Tier 1 |
| R-ISO-16 | Annual ISO posture reassessment doc (update reassessment template) | Compliance | All |

---

## Dependencies on improvement gates

| Gate | ISO-related blockers |
|------|---------------------|
| **Gate A** | A034 integrity, mock dashboards, ADPA attestation — blocks credible 27001/38500 evidence |
| **Gate B** | Asset register substantiation, DR test, IR workflow — blocks 22301 and 27001 ops claims |
| **Gate C** | Full validation evidence — blocks external attestation language |

---

## Success criteria

| Standard | Phase 1 done | Phase 2 done | Phase 3 done |
|----------|-------------|-------------|-------------|
| **38500** | Lineage + ADPA crosswalks live | EDM evidence auto-collected | Board pack template |
| **27001** | A034 reconciled; IDs normalised | SoA template; IR complete | Tenant certification guide |
| **31000** | FAIR telemetry stable | Risk appetite in exec metrics | Treatment workflow automated |
| **22301** | DR fields validated | E2E DR test documented | BC service launch eligible |
| **20000** | SLA contracts green | Service catalogue artefact | SMS alignment doc |
| **42001** | Inventoried | AI registry mapped | AIMS scope per tenant |

---

## Tracking

Update this roadmap when:

- Improvement gate items close (reference G-A*, G-B* IDs)  
- New pillar contract tests are added  
- ADPA generates new tenant ISO artefacts  
- Annual reassessment is published  

**Last reviewed:** June 2026

---

## Related

- [ISO Standards Library](../README.md)
- [Improvement Focus Areas](../../ICT-Governance-Framework-Improvement-Focus-Areas.md)
- [Reassessment 2026](../ISO-Standards-Reassessment-2026.md)
