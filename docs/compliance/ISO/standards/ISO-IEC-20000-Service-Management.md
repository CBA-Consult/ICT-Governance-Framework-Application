# ISO/IEC 20000-1:2018 — IT Service Management

**Standard:** ISO/IEC 20000-1:2018 — IT service management  
**Tier:** 1 — Foundational  
**Framework role:** Service delivery, SLAs, and continual improvement (pairs with ITIL 4)

---

## Overview

ISO/IEC 20000-1 specifies requirements for an SMS. The framework implements service management patterns through **governance SLAs**, escalation services, and tenant service tiers rather than a standalone SMS certification programme.

---

## SMS themes ↔ framework

| Theme | Framework implementation |
|-------|-------------------------|
| Service planning | Tenant tiers (Premium/Standard/Basic), SLA definitions |
| Service delivery | Obligation-SLA binding, compliance escalation SLA |
| Relationship processes | Client compliance escalation, procurement SLA |
| Resolution processes | Remediation orchestrator, incident lifecycle |
| Control processes | Compliance monitoring, contract tests |
| Continual improvement | Improvement focus areas, benchmarking |

---

## Implementation evidence

| Service | Location |
|---------|----------|
| Governance SLA | `governance-sla.js` |
| Compliance escalation SLA | `compliance-escalation-sla-service.js` |
| Procurement SLA | `compliance-procurement-sla-service.js` |
| Obligation binding | `obligation-sla-binding-service.js` |
| Escalation exposure | `compliance-escalation-exposure-service.js` |
| Contract tests | `compliance-escalation-sla.contract.test.js`, etc. |

---

## A033 baseline

**77% claimed** (January 2025)

---

## Posture (June 2026)

**~70–75%** — SLA automation improved; full service catalogue and capacity management not demonstrated as integrated SMS.

---

## Gaps

1. No formal service catalogue artefact per ISO 20000  
2. Change/release management not unified across all pillars  
3. ITIL 4 alignment documented but not separately attested

---

## Related

- [ISO/IEC 38500](ISO-IEC-38500-IT-Governance.md) (Performance)
- [ICT Governance Framework ISO Alignment](../ICT-Governance-Framework-ISO-Alignment.md)
