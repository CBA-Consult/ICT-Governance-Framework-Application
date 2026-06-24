# ISO 31000:2018 — Risk Management

**Standard:** ISO 31000:2018 — Risk management — Guidelines  
**Tier:** 1 — Foundational  
**Framework role:** Enterprise risk principles; **quantitative implementation via FAIR**

---

## Overview

ISO 31000 provides principles and guidelines for managing risk. The ICT Governance Framework adopts ISO 31000 intent through documented risk processes and a **live FAIR (Factor Analysis of Information Risk)** engine for quantitative assessment.

---

## ISO 31000 principles ↔ framework

| Principle | Framework implementation |
|-----------|-------------------------|
| Integrated | Risk linked to assets, incidents, governance KPIs |
| Structured | FAIR scenarios, calibration tables, SQL schema |
| Customised | Tenant-specific risk models, env-tunable multipliers |
| Inclusive | CISO dashboard, executive metrics |
| Dynamic | Telemetry-driven LEF adjustments (shadow IT, break-glass, incidents) |
| Best available information | Asset register, incident ingest, JIT ledger |
| Human and cultural factors | Break-glass analytics, governance policies |
| Continual improvement | Calibration governance, focus area 4 |

---

## Implementation evidence

| Component | Location |
|-----------|----------|
| FAIR risk engine | `ict-governance-framework/services/fair-risk-engine.js` |
| Calibration | `fair-risk-calibration.js`, `fair_model_calibration.sql` |
| Scheduler | `fair-risk-scheduler.js` |
| Framework section | [ICT GF § FAIR Risk](../../governance-framework/core-framework/ICT-Governance-Framework.md) |
| Target framework | FAIR integration in [Target Governance Framework](../../governance-framework/target-framework/Target-Governance-Framework.md) |
| Tests | `fair-risk-engine.test.js`, `fair-risk-calibration.test.js` |

---

## A007 / A033 baseline

| Source | Maturity |
|--------|----------|
| A007 Risk Management domain | Level 3 (65%) |
| A033 ISO 31000 | 74% claimed |

---

## Posture (June 2026)

**~72–80%** — significant improvement from live FAIR engine and telemetry integration.

---

## Gaps

1. Formal **risk appetite** statements not wired to executive reporting  
2. Zero Trust assessment scores still placeholder (G-A6)  
3. Risk treatment workflow not fully automated end-to-end

---

## Related

- [ISO/IEC 27001](ISO-IEC-27001-Information-Security.md) (Clause 6.1 risk treatment)
- [ICT Governance Framework ISO Alignment](../ICT-Governance-Framework-ISO-Alignment.md)
