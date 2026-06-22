# ISO 22301:2019 — Business Continuity Management

**Standard:** ISO 22301:2019 — Security and resilience — Business continuity management systems  
**Tier:** 1 — Foundational  
**Framework role:** **Resilience pillar** and MSP business continuity service offers

---

## Overview

ISO 22301 specifies requirements for a BCMS. The ICT Governance Framework addresses continuity through the **Resilience pillar**, RPAS recovery design, and asset register DR posture fields.

---

## BCMS elements ↔ framework

| 22301 element | Framework implementation | Status |
|---------------|-------------------------|--------|
| Context and leadership | BC service tiers in README, governance council | Documented |
| Business impact analysis | FAIR loss magnitude, asset criticality | Partial |
| BC strategies | Git-to-cloud recovery, RPAS | Designed |
| BC plans | RPAS rollback/recovery guides | Documented |
| Exercising and testing | — | **Gap (G-B3)** |
| Performance evaluation | DR fields in asset register | Partial |
| Continual improvement | Improvement focus area 6 | In progress |

---

## Implementation evidence

| Component | Location |
|-----------|----------|
| Resilience pillar contracts | `tests/contracts/resilience.contract.test.js` |
| DR fields on assets | `sql/asset_dr_fields.sql`, migrations |
| RPAS recovery | `docs/implementation/guides/RPAS-Rollback-Recovery-Ransomware-Example.md` |
| Business continuity services | [README § BC](../../../README.md) |
| Verification scripts | `verify-gb3-recovery.js` |

---

## A007 baseline

| Domain | Maturity |
|--------|----------|
| Business Continuity (ISO 22301, NIST SP 800-34) | Level 3 (62%) |

---

## Posture (June 2026)

**~55–65%** — strong design; **attestation weak** until end-to-end DR test with RTO/RPO.

---

## Gaps

1. **G-B3** — Execute documented DR exercise  
2. BC claims blocked for client-facing MSP tiers until G-B3 complete  
3. BIA not formalised as ISO 22301 artefact per tenant

---

## Related

- [Resilience pillar — Seven-Pillar Plan](../../../implementation/guides/Enterprise-Security-Seven-Pillar-Implementation-Plan.md)
- [Improvement Focus Areas § Focus 6](../../ICT-Governance-Framework-Improvement-Focus-Areas.md)
