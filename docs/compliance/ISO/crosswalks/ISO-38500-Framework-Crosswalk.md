# ISO/IEC 38500 — Framework Crosswalk

**Document ID:** ISO-XW-38500-001  
**Date:** June 2026  
**Maps:** ISO/IEC 38500 principles and EDM cycle → ICT Governance Framework sections and ADPA artefacts

---

## Six principles crosswalk

| ISO 38500 principle | Framework section | Policies / docs | ADPA artefact | Code / service evidence |
|---------------------|-------------------|-----------------|---------------|------------------------|
| **Responsibility** | Governance Structure, RACI Matrix | [Roles & Responsibilities](../../../policies/governance/ICT-Governance-Roles-Responsibilities.md) | `raci-authority` | RBAC, service responsibility boundary service |
| **Strategy** | Purpose, Target alignment | [Strategic-Tactical Overview](../../governance-framework/core-framework/Strategic-Tactical-IT-Governance-Overview.md) | `framework-charter`, `target-state` | Executive metrics API |
| **Acquisition** | Technology lifecycle, procurement | Technology selection policy | `policy-alignment` | `vendor-registry-service.js`, marketplace |
| **Performance** | Success Metrics, FAIR, KPIs | [Governance Metrics](../../governance-framework/metrics/ICT-Governance-Metrics.md) | `kpi-catalog` | `governance-executive-metrics.js`, FAIR engine |
| **Conformance** | Compliance and Regulatory Alignment | [ISO library](../README.md), A033/A034 | `compliance-as-code-map` | Compliance lineage, escalations, contract tests |
| **Human behaviour** | Employee lifecycle, training | `docs/training/` | `operating-model` | Onboarding services, timebound onboarding |

---

## Evaluate – Direct – Monitor crosswalk

| EDM phase | ISO 38500 intent | Framework activities | Evidence type |
|-----------|------------------|---------------------|---------------|
| **Evaluate** | Assess current and future IT use; external factors | Gap analysis (A023), maturity assessment, benchmarking, FAIR evaluation | Assessment reports, risk telemetry |
| **Direct** | Policies, plans, programmes, performance targets | Council decisions, policy approval, ADPA generation, procurement governance | Signed policies, ADPA deployed artefacts |
| **Monitor** | Performance vs policies and plans; compliance | Dashboards, SLA monitoring, compliance escalations, regression registry | API metrics, escalation JSON, test results |

### ADPA template placeholder

The tenant crosswalk template (`adpa/templates/ict-governance/iso38500-crosswalk.template.md`) includes `{{edmCycleEvidence}}` for per-tenant EDM evidence injection at generation time.

---

## Governance roles crosswalk

| 38500 accountability | Framework role | ISO 27001 parallel |
|---------------------|----------------|---------------------|
| Governing body | ICT Governance Council | A.5.1 policies (approval) |
| Executive management | Strategic Governance Council / SGC | A.5.4 management responsibilities |
| IT leadership | CISO, Domain Owners | A.5.2 information security roles |
| Business ownership | Tenant Domain Owners | A.5.3 segregation of duties |

---

## KPI alignment (Performance principle)

| 38500 performance question | Framework KPI area | Metric examples |
|---------------------------|-------------------|-----------------|
| Is IT fit for purpose? | Service tiers, SLA compliance | Obligation-SLA binding status |
| Is IT delivering value? | Business value quantification | FAIR ALE, cost optimisation |
| Is IT reliable? | Resilience, uptime | DR posture, incident MTTR |
| Is IT sustainable? | Sustainability scope | ESG metrics (emerging) |

---

## Gaps

| Gap | Remediation |
|-----|-------------|
| 38500 not in `compliance-lineage-bridge.json` | Add principle-level or EDM-phase control IDs |
| EDM evidence not auto-collected | Wire executive metrics + test results to ADPA crosswalk generation |
| Board-level attestation manual | Quarterly governance pack via ADPA |

---

## Related

- [ISO/IEC 38500 library entry](../standards/ISO-IEC-38500-IT-Governance.md)
- [Authoritative 38500 guide](../regulatory/ISO-IEC-38500-Governance-Standards.md)
- [ICT Governance Framework ISO Alignment](../ICT-Governance-Framework-ISO-Alignment.md)
