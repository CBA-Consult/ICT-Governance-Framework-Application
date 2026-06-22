# ISO/IEC 27018:2019 — Cloud Privacy

**Standard:** ISO/IEC 27018:2019 — Protection of PII in public clouds acting as PII processors  
**Tier:** 2 — Supporting  
**Framework role:** **Data pillar** and cloud PII processing controls

---

## Overview

ISO/IEC 27018 establishes commonly accepted control objectives for public-cloud PII processors. The framework addresses privacy through data policies, GDPR mappings, and the Data pillar.

---

## Control themes ↔ framework

| Theme | Framework implementation |
|-------|-------------------------|
| Consent | GDPR workflows in A034 (reconciliation pending) |
| Purpose limitation | Policy engine, data classification |
| Disclosure of sub-processors | Vendor registry, procurement governance |
| Data location | Multi-tenant config, cloud region policies |
| Data return/deletion | Data subject request workflows (planned/partial) |
| Transparency | Privacy notice templates, ADPA data-protection template |

---

## Framework assets

| Asset | Location |
|-------|----------|
| Data privacy policy template | `blueprint-templates/policy-templates/data-privacy-policy.md` |
| ADPA data protection template | `adpa/templates/governance-artifacts/standard/data-protection.template.json` |
| Data pillar contract tests | `tests/contracts/data.contract.test.js` |
| GDPR mappings | [A034 § 2.1](../../A034-Compliance-Requirements-System-Features-Mapping.md) |

---

## Posture (June 2026)

**~65–70%** — policy and template strength; Purview/DLP live integration still planned (Improvement Focus Area 10).

---

## Gaps

1. No dedicated 27018 crosswalk  
2. PII location controls not uniformly automated per tenant  
3. 27701 PIMS extension not formalised

---

## Related

- [ISO/IEC 27701 Privacy Management](ISO-IEC-27701-Privacy-Management.md)
- [ISO/IEC 27017 Cloud Security](ISO-IEC-27017-Cloud-Security.md)
