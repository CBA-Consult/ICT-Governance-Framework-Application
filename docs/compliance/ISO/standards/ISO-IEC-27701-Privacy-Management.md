# ISO/IEC 27701:2019 — Privacy Information Management

**Standard:** ISO/IEC 27701:2019 — Security techniques — Extension to ISO/IEC 27001 and 27002 for privacy information management  
**Tier:** 2 — Supporting  
**Framework role:** **PIMS extension** for privacy beyond base ISMS

---

## Overview

ISO/IEC 27701 extends 27001/27002 for organisations acting as PII controllers and/or processors. The framework addresses privacy primarily through **GDPR mappings** and data governance rather than a standalone PIMS.

---

## PIMS mapping approach

| 27701 area | Framework implementation |
|------------|-------------------------|
| PII controller controls | GDPR Article mappings in A034 |
| PII processor controls | Cloud tenant model, DPA templates |
| Privacy by design | Zero Trust architecture, data pillar |
| Records of processing | FR-RPT-003 mapping (A034) |
| DPIA | FR-GOV-005 risk assessment mapping |

---

## Framework assets

| Asset | Location |
|-------|----------|
| Regulatory doc | `docs/compliance/regulatory/Employment Contract and Data Processing Agreements.md` |
| Data privacy policy | `blueprint-templates/policy-templates/data-privacy-policy.md` |
| ADPA data protection | `adpa/templates/governance-artifacts/standard/data-protection.template.json` |
| A033 GDPR | Tier 1 critical framework |

---

## Posture (June 2026)

**~60–68%** — GDPR alignment stronger than explicit 27701 PIMS documentation.

---

## Gaps

1. No published **PIMS scope statement** or 27701 SoA  
2. Controller vs processor role not documented per tenant type  
3. Recommend creating 27701 extension crosswalk from GDPR + 27001 mappings

---

## Related

- [ISO/IEC 27018 Cloud Privacy](ISO-IEC-27018-Cloud-Privacy.md)
- [ISO/IEC 27001](ISO-IEC-27001-Information-Security.md)
