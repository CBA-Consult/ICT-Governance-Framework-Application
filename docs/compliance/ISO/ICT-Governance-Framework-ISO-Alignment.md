# ICT Governance Framework — ISO Alignment

**Document ID:** ISO-GF-ALIGN-001  
**Date:** June 2026  
**Scope:** Entire [ICT Governance Framework](../../governance-framework/core-framework/ICT-Governance-Framework.md) mapped to applicable ISO standards  
**Parent:** [ISO Standards Library](README.md)

> This document maps **framework sections and capabilities** to ISO standards. It does not assert certification. See [Reassessment 2026](ISO-Standards-Reassessment-2026.md) for evidence-based posture.

---

## 1. Framework foundation

The ICT Governance Framework declares **ISO/IEC 38500** as its foundational governance model, supplemented by **ISO/IEC 27001** for information security, **ISO 31000** for risk, **ISO 22301** for continuity, and **ISO/IEC 20000** for service management.

| Framework element | Primary ISO standard | Alignment mechanism |
|-------------------|---------------------|---------------------|
| Purpose and scope | ISO/IEC 38500 | Six principles + EDM cycle |
| Unified Governance Platform | ISO/IEC 38500, 27001 | Centralized oversight, RBAC, audit logging |
| Three-tier / multi-tier governance structure | ISO/IEC 38500 § Responsibility | Council → Domain Owners → Stewards |
| Seven security pillars | ISO/IEC 27001 Annex A | Pillar contract tests + services |
| Compliance and regulatory alignment section | 27001, 38500, 27701 (via GDPR) | Policy library + ADPA lineage |
| Monitoring and continuous improvement | 38500 Monitor, 9001, 20000 | KPIs, executive metrics, SLA services |
| Multi-cloud multi-tenant scope | 27017, 27018 | Shared responsibility, tenant isolation |

---

## 2. Governance structure ↔ ISO/IEC 38500

| Framework component | 38500 principle | EDM phase | Framework reference |
|---------------------|-----------------|-----------|---------------------|
| ICT Governance Council | Responsibility, Strategy | Direct | Strategic decisions, policy approval |
| Domain Owners (Identity, Data, Network, etc.) | Responsibility, Performance | Direct, Monitor | Domain accountability |
| Technology Stewards | Responsibility, Conformance | Monitor | Operational compliance |
| Policy library | Conformance, Strategy | Direct | `docs/policies/` |
| KPI catalog / governance metrics | Performance | Evaluate, Monitor | [ICT Governance Metrics](../../governance-framework/metrics/ICT-Governance-Metrics.md) |
| Procurement / vendor governance | Acquisition | Direct | Vendor registry, marketplace services |
| Training and human behaviour | Human behaviour | Direct | `docs/training/` |
| ADPA governance artifacts | All six principles | Evaluate–Direct–Monitor | [ADPA module](../../../adpa/README.md) |

→ Detailed mapping: [ISO 38500 Framework Crosswalk](crosswalks/ISO-38500-Framework-Crosswalk.md)

---

## 3. Seven pillars ↔ ISO/IEC 27001

| Pillar | Framework scope | ISO 27001:2022 themes | Implementation evidence |
|--------|-----------------|----------------------|-------------------------|
| **Identity** | MFA, JIT, break-glass, privileged access | A.5.15–A.5.18, A.8.2, A.8.5 | `jit-ledger`, `identity.contract.test.js` |
| **Devices** | Managed devices, compliance checks | A.8.1, A.8.3, A.7.9 | `device-compliance-check.js`, `devices.contract.test.js` |
| **Software** | CASB, shadow IT, supply chain | A.8.1, A.8.19, A.5.19–A.5.23 | `software-casb-ingest.js`, `software.contract.test.js` |
| **Network** | Segmentation, Zero Trust | A.8.20–A.8.22 | Network policies, `network.contract.test.js` |
| **Data** | Classification, protection, privacy | A.5.12–A.5.14, A.8.10–A.8.12 | Data pillar templates, `data.contract.test.js` |
| **SecOps** | Incidents, monitoring, remediation | A.5.24–A.5.28, A.6.8 | Incident ingest, `secops.contract.test.js` |
| **Resilience** | Backup, DR, recovery | A.5.29–A.5.30, A.8.13–A.8.14 | DR fields, `resilience.contract.test.js` |

→ Detailed mapping: [ISO 27001 Seven-Pillar Crosswalk](crosswalks/ISO-27001-Seven-Pillar-Crosswalk.md)

---

## 4. Framework domains ↔ ISO standards

### 4.1 Infrastructure and multi-cloud

| Framework scope item | ISO standards | Framework assets |
|---------------------|---------------|------------------|
| Networks, servers, cloud | 27001 A.8, 27017 | Blueprint templates, Azure/AWS/GCP governance |
| Endpoint devices | 27001 A.8, A.7 | Device registration, compliance check |
| Tenant isolation | 27001 A.5.23, 27017 | Multi-tenant framework, Bicep blueprints |

### 4.2 Security

| Framework scope item | ISO standards | Framework assets |
|---------------------|---------------|------------------|
| Identity and access | 27001 A.5, A.8 | JIT, break-glass, RBAC |
| Threat protection | 27001 A.8, A.5.7 | SecOps services, MITRE enrichment |
| Zero Trust | 27001, NIST (paired) | Zero Trust Maturity Model |
| Shadow IT detection | 27001 A.8.1, A.5.19 | CASB ingest, asset register |

### 4.3 Applications and software

| Framework scope item | ISO standards | Framework assets |
|---------------------|---------------|------------------|
| Enterprise / SaaS apps | 27001 A.8.19 | Software pillar, governed app store |
| Supply chain | 27001 A.5.19–A.5.23 | Vendor registry, procurement SLA |
| Power Platform / low-code | 27001 A.8.32 | ADPA power-platform template |

### 4.4 Data and privacy

| Framework scope item | ISO standards | Framework assets |
|---------------------|---------------|------------------|
| Data classification | 27001 A.5.12, 27002 | Data pillar, Purview integration (planned) |
| Privacy / PII | 27701, 27018 | Data privacy policy templates, GDPR mappings |
| Records of processing | 27701, GDPR | A034 GDPR mappings |

### 4.5 Risk management

| Framework scope item | ISO standards | Framework assets |
|---------------------|---------------|------------------|
| Enterprise risk | 31000 | FAIR risk engine, calibration |
| Risk assessment | 31000, 27001 Clause 6 | `fair-risk-engine.js`, governance incidents |
| FAIR quantification | 31000 (quantitative intent) | `fair_model_calibration.sql`, scheduler |

### 4.6 Business continuity and resilience

| Framework scope item | ISO standards | Framework assets |
|---------------------|---------------|------------------|
| Backup and recovery | 22301, 27001 A.8.13 | RPAS, Git-to-cloud recovery design |
| DR posture | 22301 | Asset register DR fields |
| Incident-driven recovery | 22301, 27001 A.5.29 | Governance incident lifecycle |

### 4.7 Service management

| Framework scope item | ISO standards | Framework assets |
|---------------------|---------------|------------------|
| SLAs and obligations | 20000 | Obligation-SLA binding, compliance escalation SLA |
| Change management | 20000, 27001 A.8.32 | Policy templates, RPAS change controls |
| Continual improvement | 20000, 9001 | Improvement focus areas, benchmarking framework |

### 4.8 Emerging technology

| Framework scope item | ISO standards | Framework assets |
|---------------------|---------------|------------------|
| IoT | 30141 | IoT Governance Framework |
| AI / ML | 42001, 23053 | AI control plane service, EU AI Act alignment |
| Blockchain | ISO/TC 307 | Blockchain governance policies |
| Sustainability | 14001 | Sustainability scope in framework |

---

## 5. Platform capabilities ↔ ISO clauses

### ISO/IEC 27001 ISMS clauses (high level)

| 27001 clause | Framework capability | Status |
|--------------|---------------------|--------|
| 4 Context | Organisational profile (NIST), tenant manifests | Partial |
| 5 Leadership | Governance council, roles doc | Documented |
| 6 Planning | Risk engine, requirements | Partial–live |
| 7 Support | Training, ADPA templates | Documented |
| 8 Operation | Seven pillars, automation | Partial–live |
| 9 Performance evaluation | Contract tests, executive metrics | Partial |
| 10 Improvement | Improvement focus areas, remediation orchestrator | Partial |

### ISO/IEC 38500 Evaluate–Direct–Monitor

| Phase | Framework capability | Status |
|-------|---------------------|--------|
| **Evaluate** | Gap analysis, maturity assessment, FAIR, benchmarking | Partial–live |
| **Direct** | Policies, ADPA charter, procurement governance | Strong (documented) |
| **Monitor** | Compliance dashboards, lineage, escalations, KPIs | Substantial |

---

## 6. Related framework documents

| Document | ISO relevance |
|----------|---------------|
| [Multi-Cloud Multi-Tenant ICT Governance Framework](../../governance-framework/core-framework/Multi-Cloud-Multi-Tenant-ICT-Governance-Framework.md) | 27017, 27018, 38500 |
| [Target Governance Framework](../../governance-framework/target-framework/Target-Governance-Framework.md) | 38500, 31000, FAIR |
| [Strategic and Tactical IT Governance Overview](../../governance-framework/core-framework/Strategic-Tactical-IT-Governance-Overview.md) | 38500 Responsibility, Strategy |
| [Governance Success Measurement](../../governance-framework/core-framework/Governance-Success-Measurement-Reporting-Framework.md) | 38500 Performance |
| [Annual Benchmarking Framework](../../governance-framework/core-framework/ICT-Governance-Annual-Benchmarking-Framework.md) | 38500 Evaluate |
| [Enterprise Security Seven-Pillar Plan](../../implementation/guides/Enterprise-Security-Seven-Pillar-Implementation-Plan.md) | 27001 Annex A |
| [ADPA Integration Guide](../../implementation/guides/ADPA-ICT-Governance-Integration-Guide.md) | 38500, 27001 evidence |

---

## 7. Tenant and MSP delivery

Tenants consuming the framework receive ISO-aligned artefacts through ADPA:

1. **Governance charter** — 38500 Strategy, Responsibility  
2. **RACI / operating model** — 38500 Responsibility, Human behaviour  
3. **KPI catalog** — 38500 Performance  
4. **Compliance-as-code map** — 38500 Conformance, 27001  
5. **ISO 38500 crosswalk** — per-tenant EDM evidence  
6. **Control-level escalations** — 27001 Annex A with certification impact detail  

Example: [`adpa/tenants/tenant-contoso-health/documents/`](../../../adpa/tenants/tenant-contoso-health/documents/)

---

## 8. Gaps and remediation

| Gap | ISO impact | Remediation |
|-----|------------|-------------|
| A034 not reconciled | All ISO mappings | G-A1 — [Roadmap](crosswalks/ISO-Standards-Implementation-Roadmap.md) |
| 38500 not in lineage bridge | 38500 attestation | P1 roadmap item |
| No living SoA template | 27001 | P2 roadmap item |
| BC not exercised | 22301 | G-B3 |
| 27001 blueprint 2013 refs | 27001 | Update Bicep template |
| ISO 42001 not inventoried | AI governance | P3 roadmap item |

---

## Related documents

- [ISO Standards Library](README.md)
- [ISO Standards Reassessment 2026](ISO-Standards-Reassessment-2026.md)
- [ISO Standards Inventory](ISO-Standards-Inventory.md)
- [ICT Governance Framework](../../governance-framework/core-framework/ICT-Governance-Framework.md)
