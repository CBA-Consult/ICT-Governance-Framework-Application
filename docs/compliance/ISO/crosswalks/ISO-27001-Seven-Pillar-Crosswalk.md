# ISO/IEC 27001 — Seven-Pillar Crosswalk

**Document ID:** ISO-XW-27001-PILLARS-001  
**Date:** June 2026  
**Maps:** ISO/IEC 27001:2022 Annex A themes → Enterprise Security Seven Pillars

> Control IDs use **2022 Annex A** numbering (A.5–A.8). Legacy 2013 references in older docs should be migrated.

---

## Pillar overview

| Pillar | Contract test | Primary services |
|--------|---------------|------------------|
| Identity | `identity.contract.test.js` | JIT elevation, break-glass, privileged action logs |
| Devices | `devices.contract.test.js` | Device registration, compliance check |
| Software | `software.contract.test.js` | CASB ingest, shadow IT, vendor registry |
| Network | `network.contract.test.js` | Segmentation, network governance |
| Data | `data.contract.test.js` | Classification, protection templates |
| SecOps | `secops.contract.test.js` | Incident ingest/lifecycle, MITRE enrichment |
| Resilience | `resilience.contract.test.js` | DR fields, recovery verification |

All paths relative to `ict-governance-framework/`.

---

## Identity pillar

| Annex A (2022) | Control theme | Framework feature | Status |
|----------------|---------------|-------------------|--------|
| A.5.15 | Access control | RBAC, policy engine | Live |
| A.5.16 | Identity management | Entra ID integration patterns | Partial |
| A.5.17 | Authentication information | MFA enforcement rules | Live (demo escalations) |
| A.5.18 | Access rights | JIT elevation, time-bounded tokens | Live |
| A.8.2 | Privileged access | Break-glass, privileged action ledger | Live |
| A.8.5 | Secure authentication | MFA, conditional access | Partial–live |

---

## Devices pillar

| Annex A (2022) | Control theme | Framework feature | Status |
|----------------|---------------|-------------------|--------|
| A.5.9 | Inventory of assets | Asset register (device subset) | Substantial |
| A.5.10 | Acceptable use | Device compliance policies | Documented |
| A.7.9 | Security of assets off-premises | Managed device schema | Partial–live |
| A.8.1 | User endpoint devices | Device registration service | Live |
| A.8.3 | Information access restriction | Device compliance check | Live |

---

## Software pillar

| Annex A (2022) | Control theme | Framework feature | Status |
|----------------|---------------|-------------------|--------|
| A.5.19 | Information security in supplier relationships | Vendor registry, procurement SLA | Partial–live |
| A.5.21 | ICT supply chain | Marketplace, governed app store | Partial |
| A.5.22 | Monitoring of supplier services | CASB polling, shadow IT | Partial |
| A.5.23 | Cloud services security | Multi-tenant software governance | Documented |
| A.8.19 | Installation of software | Software CASB events | Partial–live |
| A.8.20 | Networks security | (See Network pillar) | — |
| A.8.32 | Change management | RPAS change controls | Documented |

---

## Network pillar

| Annex A (2022) | Control theme | Framework feature | Status |
|----------------|---------------|-------------------|--------|
| A.8.20 | Networks security | Network segmentation template | Documented |
| A.8.21 | Security of network services | Zero Trust patterns | Partial |
| A.8.22 | Segregation of networks | Segmentation policies, IaC | Partial–live |

---

## Data pillar

| Annex A (2022) | Control theme | Framework feature | Status |
|----------------|---------------|-------------------|--------|
| A.5.12 | Classification of information | Data classification (Purview planned) | Partial |
| A.5.13 | Labelling of information | ADPA data-protection template | Documented |
| A.5.14 | Information transfer | DLP / integration patterns | Planned |
| A.8.10 | Information deletion | Retention workflows (A034) | Partial |
| A.8.11 | Data masking | — | Gap |
| A.8.12 | Data leakage prevention | Defender patterns | Planned |

---

## SecOps pillar

| Annex A (2022) | Control theme | Framework feature | Status |
|----------------|---------------|-------------------|--------|
| A.5.24 | Incident management planning | Incident lifecycle service | Partial–live |
| A.5.25 | Assessment of events | Governance incident ingest | Live |
| A.5.26 | Response to incidents | Remediation orchestrator | Partial |
| A.5.27 | Learning from incidents | Incident timeline, lessons learned | Partial |
| A.5.28 | Collection of evidence | Evidence provenance/validation | Live |
| A.6.8 | Information security event reporting | Compliance escalations | Live |

---

## Resilience pillar

| Annex A (2022) | Control theme | Framework feature | Status |
|----------------|---------------|-------------------|--------|
| A.5.29 | Security during disruption | Break-glass procedures | Live |
| A.5.30 | ICT readiness for BC | DR fields, RPAS recovery | Partial |
| A.8.13 | Information backup | Backup policies, Git-to-cloud | Designed |
| A.8.14 | Redundancy of facilities | Multi-cloud distribution | Documented |

---

## Cross-pillar services

| Service | Pillars affected | Annex A relevance |
|---------|------------------|-------------------|
| `fair-risk-engine.js` | All | Clause 6.1, A.5.7 threat intelligence |
| `compliance-lineage-service.js` | All | A.5.31 legal/compliance, A.5.36 compliance review |
| `evidence-validation-engine.js` | All | A.5.28 evidence collection |
| `cross-pillar-invariants.js` | All | Consistency across control domains |
| `verification-checkpoint.js` | All | Clause 9 performance evaluation |

---

## Compliance lineage control examples

From `adpa/coe/compliance-lineage-bridge.json`:

| Observed control ID | Pillar | Example rule |
|--------------------|--------|--------------|
| `A.9.2.1` (legacy ref) | Identity | MFA enrollment — maps to 2022 A.5.16/A.5.17 |
| `PR.AA.01` (NIST) | Identity | Dual-mapped with ISO 27001 in escalations |

> **Action:** Normalise all control IDs to **27001:2022 Annex A** in lineage bridge and tenant escalations.

---

## Statement of Applicability (planned)

A tenant SoA template should be derived from this crosswalk with columns:

- Control ID (2022)  
- Applicable (Y/N)  
- Pillar owner  
- Implementation status (Implemented / Partial / Planned / N/A)  
- Evidence link (contract test, service, policy)  

---

## Related

- [ISO/IEC 27001 library entry](../standards/ISO-IEC-27001-Information-Security.md)
- [Seven-Pillar Implementation Plan](../../../implementation/guides/Enterprise-Security-Seven-Pillar-Implementation-Plan.md)
- [Regression registry](../../../../ict-governance-framework/tests/regression-registry.js)
