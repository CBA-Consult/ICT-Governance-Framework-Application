# ISO/IEC 38500:2015 — IT Governance

**Standard:** ISO/IEC 38500:2015 — Information technology — Governance of IT for the organization  
**Tier:** 1 — Foundational  
**Framework role:** **Primary governance foundation** for the ICT Governance Framework

---

## Overview

ISO/IEC 38500 provides principles and a model for governing IT so that it supports organisational strategy and delivers value. The ICT Governance Framework explicitly implements this standard as its core governance model.

---

## Six principles

| Principle | Framework implementation | Evidence |
|-----------|-------------------------|----------|
| **Responsibility** | Three-tier governance, RACI matrix, domain owners | [ICT Governance Framework § Governance Structure](../../governance-framework/core-framework/ICT-Governance-Framework.md) |
| **Strategy** | Strategic/tactical overview, target framework, charter | [Strategic-Tactical Overview](../../governance-framework/core-framework/Strategic-Tactical-IT-Governance-Overview.md) |
| **Acquisition** | Procurement policy, vendor registry, marketplace | `vendor-registry-service.js`, ADPA acquisition templates |
| **Performance** | KPI catalog, FAIR metrics, executive dashboard | [Governance Metrics](../../governance-framework/metrics/ICT-Governance-Metrics.md) |
| **Conformance** | Compliance library, ADPA lineage, escalations | [ISO library](../README.md), `compliance-lineage-bridge.json` |
| **Human behaviour** | Training materials, operating model | `docs/training/`, ADPA operating-model template |

---

## Evaluate – Direct – Monitor

| Phase | Framework activities |
|-------|---------------------|
| **Evaluate** | Maturity assessment, gap analysis, benchmarking, FAIR risk evaluation |
| **Direct** | Council decisions, policy approval, resource allocation, ADPA charter |
| **Monitor** | Compliance dashboards, SLA monitoring, contract tests, executive metrics API |

→ [38500 Framework Crosswalk](../crosswalks/ISO-38500-Framework-Crosswalk.md)

---

## Authoritative documentation

The detailed implementation guide is maintained in:

**[ISO/IEC 38500 Governance Standards](../regulatory/ISO-IEC-38500-Governance-Standards.md)**

This library entry indexes that document and links framework components. Do not duplicate the full standard narrative here.

---

## ADPA artefacts

| Template | Purpose |
|----------|---------|
| `framework-charter` | Strategy, governance scope |
| `raci-authority` | Responsibility |
| `kpi-catalog` | Performance |
| `policy-alignment` | Acquisition, conformance |
| `compliance-as-code-map` | Conformance |
| `operating-model` | Human behaviour |
| `iso38500-crosswalk` | Per-tenant principle mapping |

Path: `adpa/templates/ict-governance/`

---

## Posture (June 2026)

| Dimension | Estimate |
|-----------|----------|
| Structural alignment | 80–85% |
| Operational attestation | 60–70% |

**Gaps:** ISO 38500 not yet in `compliance-lineage-bridge.json`; EDM cycle not fully automated as audit evidence.

---

## Related

- [ICT Governance Framework ISO Alignment](../ICT-Governance-Framework-ISO-Alignment.md)
- [Reassessment 2026](../ISO-Standards-Reassessment-2026.md)
- [Implementation Roadmap](../crosswalks/ISO-Standards-Implementation-Roadmap.md)
