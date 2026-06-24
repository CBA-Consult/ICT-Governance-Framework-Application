# ISO Standards Inventory

**Document ID:** ISO-INVENTORY-001  
**Date:** June 2026  
**Scope:** ISO and ISO/IEC standards applicable to the ICT Governance Framework  
**Parent:** [ISO Standards Library](README.md)

---

## Classification

| Tier | Criteria | Action |
|------|----------|--------|
| **Tier 1** | Foundational to framework design and seven-pillar operations | Maintain library entry + crosswalk; track evidence |
| **Tier 2** | Supporting controls, cloud, privacy, quality | Library entry; map to pillars where relevant |
| **Tier 3** | Emerging, conditional, or low business impact | Monitor; add when product scope expands |

---

## Tier 1 — Foundational

| Standard | Title | Library entry | A033 status (Jan 2025) | Reassessed (Jun 2026) | Framework role |
|----------|-------|---------------|--------------------------|----------------------|----------------|
| **ISO/IEC 38500:2015** | Governance of IT for the organization | [standards/ISO-IEC-38500-IT-Governance.md](standards/ISO-IEC-38500-IT-Governance.md) | 85% | 80–85% structural | **Foundational** — EDM cycle, six principles |
| **ISO/IEC 27001:2022** | Information security management systems | [standards/ISO-IEC-27001-Information-Security.md](standards/ISO-IEC-27001-Information-Security.md) | 82% | 70–78% | ISMS + Annex A for seven pillars |
| **ISO 31000:2018** | Risk management — Guidelines | [standards/ISO-31000-Risk-Management.md](standards/ISO-31000-Risk-Management.md) | 74% | 72–80% | Enterprise risk; FAIR quantification |
| **ISO 22301:2019** | Security and resilience — BCMS | [standards/ISO-22301-Business-Continuity.md](standards/ISO-22301-Business-Continuity.md) | 62% (A007) | 55–65% | Resilience pillar, MSP BC offers |
| **ISO/IEC 20000-1:2018** | IT service management | [standards/ISO-IEC-20000-Service-Management.md](standards/ISO-IEC-20000-Service-Management.md) | 77% | 70–75% | SLAs, escalation, service governance |

---

## Tier 2 — Supporting

| Standard | Title | Library entry | Reassessed (Jun 2026) | Notes |
|----------|-------|---------------|----------------------|-------|
| **ISO/IEC 27002:2022** | Information security controls | [standards/ISO-IEC-27002-Security-Controls.md](standards/ISO-IEC-27002-Security-Controls.md) | ~75% | Implementation guide for 27001 |
| **ISO/IEC 27017:2015** | Cloud security controls | [standards/ISO-IEC-27017-Cloud-Security.md](standards/ISO-IEC-27017-Cloud-Security.md) | 65–72% | Multi-cloud shared responsibility |
| **ISO/IEC 27018:2019** | Cloud privacy | [standards/ISO-IEC-27018-Cloud-Privacy.md](standards/ISO-IEC-27018-Cloud-Privacy.md) | 65–70% | PII in public cloud |
| **ISO/IEC 27701:2019** | Privacy information management | [standards/ISO-IEC-27701-Privacy-Management.md](standards/ISO-IEC-27701-Privacy-Management.md) | 60–68% | Extension to 27001 for privacy |
| **ISO 9001:2015** | Quality management systems | — (indirect via A033) | 75–80% | Process documentation; no dedicated entry yet |

---

## Tier 3 — Emerging and conditional

| Standard | Title | A033 / source | Reassessed | Condition |
|----------|-------|---------------|------------|-----------|
| **ISO/IEC 42001:2023** | AI management system | Not in A033 | 35–45% | [Library entry](standards/ISO-IEC-42001-AI-Management.md) |
| **ISO/IEC 23053:2022** | Framework for AI risk management | A033 Tier 3 | 30–40% | AI risk; links to AI control plane |
| **ISO/IEC 30141:2018** | IoT reference architecture | A033 Tier 3 | 40–50% | [IoT Governance Framework](../../governance-framework/core-framework/IoT-Governance-Framework.md) |
| **ISO/TC 307** | Blockchain standards | A033 Tier 3 | ~20% | Conditional on blockchain use |
| **ISO 14001:2015** | Environmental management | A033 Tier 3 | ~45% | Sustainability pillar; low priority |
| **ISO/IEC 4922** | Quantum key distribution | A033 Tier 3 | Emerging | Future crypto governance |

---

## Non-ISO standards frequently paired (reference only)

| Standard | Relationship to ISO library |
|----------|----------------------------|
| COBIT 2019 | IT governance controls; complements 38500 |
| ITIL 4 | Service management; pairs with 20000 |
| FAIR | Quantitative risk; implements 31000 intent |
| NIST CSF 2.0 | Cybersecurity functions; parallel assessment track |
| BIO (NL) | Government baseline; maps to 27001 controls |

---

## Code and artefact index

| Artefact | ISO relevance |
|----------|---------------|
| `adpa/coe/compliance-lineage-bridge.json` | ISO 27001 control ID normalization |
| `adpa/templates/ict-governance/iso38500-crosswalk.template.md` | ISO 38500 tenant crosswalk |
| `blueprint-templates/compliance-blueprints/iso27001-compliance.bicep` | 27001 IaC pattern (update to 2022) |
| `ict-governance-framework/tests/contracts/*.contract.test.js` | Pillar evidence for 27001 |
| `ict-governance-framework/services/fair-risk-engine.js` | 31000 quantitative risk |
| `docs/compliance/regulatory/ISO-IEC-38500-Governance-Standards.md` | Authoritative 38500 deep-dive |

---

## Maintenance log

| Date | Change |
|------|--------|
| June 2026 | Initial inventory and library created (`v1.0-adaptive-governance`) |
