# ISO/IEC 27001:2022 — Information Security Management

**Standard:** ISO/IEC 27001:2022 — Information security, cybersecurity and privacy protection — ISMS requirements  
**Tier:** 1 — Foundational  
**Framework role:** Primary **ISMS and Annex A** mapping for the seven security pillars

---

## Overview

ISO/IEC 27001 defines requirements for establishing, implementing, maintaining, and continually improving an ISMS. The ICT Governance Framework maps operational controls through **seven pillars** with contract-tested services.

---

## ISMS clauses ↔ framework

| Clause | Topic | Framework mapping | Status |
|--------|-------|-------------------|--------|
| 4 | Context | Tenant manifests, organisational profile | Partial |
| 5 | Leadership | Governance council, CISO dashboard | Documented |
| 6 | Planning | FAIR risk engine, requirements | Partial–live |
| 7 | Support | Policies, training, ADPA | Documented |
| 8 | Operation | Seven pillars, automation scripts | Partial–live |
| 9 | Evaluation | Contract tests, compliance validation | Partial |
| 10 | Improvement | Remediation orchestrator, focus areas | Partial |

---

## Annex A themes ↔ pillars

| Annex A (2022) | Pillar(s) | Key services |
|----------------|-----------|--------------|
| A.5 Organisational | All | Policy framework, compliance escalation |
| A.6 People | Identity | JIT, break-glass, RBAC |
| A.7 Physical | Devices | Device compliance check |
| A.8 Technological | All pillars | Pillar-specific services and contract tests |

→ [Seven-Pillar Crosswalk](../crosswalks/ISO-27001-Seven-Pillar-Crosswalk.md)

---

## Implementation evidence

| Capability | Location |
|------------|----------|
| Pillar contract tests | `ict-governance-framework/tests/contracts/*.contract.test.js` |
| Regression registry | `ict-governance-framework/tests/regression-registry.js` |
| Compliance lineage (ISO 27001 control IDs) | `adpa/coe/compliance-lineage-bridge.json` |
| Tenant escalations with A.x controls | `adpa/tenants/*/compliance-escalations/` |
| Asset register (A.8) | `ict-governance-framework/services/asset-discovery-sync.js` |
| Incident management (A.5.24–A.5.28) | `governance-incident-ingest.js`, `governance-incident-lifecycle.js` |
| IaC blueprint | `blueprint-templates/compliance-blueprints/iso27001-compliance.bicep` |

---

## A034 mappings

High-priority mappings in [A034](../../A034-Compliance-Requirements-System-Features-Mapping.md) § 2.2 — **reconciliation in progress** (Gate A).

---

## Posture (June 2026)

**~70–78%** — implementation stronger than January 2025 documentation; ISMS certification elements (SoA, internal audit, management review) remain documentary.

---

## Gaps

1. `iso27001-compliance.bicep` references 27001:2013 — update to 2022 Annex A  
2. No published **Statement of Applicability (SoA)** template in ISO library  
3. Full incident response workflow API (G-B4)  
4. A034 mappings not reconciled to code

---

## Related

- [ISO/IEC 27002 Security Controls](ISO-IEC-27002-Security-Controls.md)
- [ICT Governance Framework ISO Alignment](../ICT-Governance-Framework-ISO-Alignment.md)
- [Seven-Pillar Implementation Plan](../../../implementation/guides/Enterprise-Security-Seven-Pillar-Implementation-Plan.md)
