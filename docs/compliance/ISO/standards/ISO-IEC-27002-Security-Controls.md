# ISO/IEC 27002:2022 — Information Security Controls

**Standard:** ISO/IEC 27002:2022 — Information security controls  
**Tier:** 2 — Supporting  
**Framework role:** **Control implementation guide** for ISO/IEC 27001 Annex A

---

## Overview

ISO/IEC 27002 provides a reference set of information security controls. The ICT Governance Framework implements controls through policies, seven-pillar services, and IaC blueprints rather than maintaining a standalone 27002 crosswalk document.

---

## Relationship to 27001

| 27002 role | Framework approach |
|------------|-------------------|
| Control detail for Annex A | Mapped via [Seven-Pillar Crosswalk](../crosswalks/ISO-27001-Seven-Pillar-Crosswalk.md) |
| Control selection | Tenant SoA (planned) + ADPA requirement templates |
| Implementation guidance | Policy library, implementation guides, blueprints |

---

## Framework references

| Reference | Content |
|-----------|---------|
| `iso27001-compliance.bicep` metadata | Lists ISO 27002:2022 alongside 27001 |
| CISO requirements (A041) | ISO 27002 security controls implementation |
| Cloud App Security attestation | ISO 27002 compliance boolean in vendor assessments |
| Blueprint selection guide | 27002 listed as compliance target |

---

## Control themes covered

| 27002 theme | Framework coverage |
|-------------|-------------------|
| Organisational controls (5) | Governance policies, vendor management |
| People controls (6) | Identity pillar, training |
| Physical controls (7) | Devices pillar |
| Technological controls (8) | All seven pillars |

---

## Posture (June 2026)

**~75% indirect** — controls addressed through 27001 pillar mapping; dedicated 27002 control register not maintained separately.

---

## Recommended actions

1. Derive **SoA template** from 27002 control list + seven-pillar crosswalk  
2. Tag ADPA requirement JSON files with 27002 control references where applicable

---

## Related

- [ISO/IEC 27001](ISO-IEC-27001-Information-Security.md)
- [Seven-Pillar Crosswalk](../crosswalks/ISO-27001-Seven-Pillar-Crosswalk.md)
