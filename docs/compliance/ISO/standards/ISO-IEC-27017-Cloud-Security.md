# ISO/IEC 27017:2015 — Cloud Security

**Standard:** ISO/IEC 27017:2015 — Code of practice for information security controls for cloud services  
**Tier:** 2 — Supporting  
**Framework role:** **Multi-cloud shared responsibility** and cloud-specific controls

---

## Overview

ISO/IEC 27017 provides cloud-specific guidance extending ISO/IEC 27002. The ICT Governance Framework is explicitly **multi-cloud multi-tenant**, making 27017 highly relevant.

---

## Cloud control themes ↔ framework

| Theme | Framework implementation |
|-------|-------------------------|
| Shared responsibility | Multi-tenant framework, tenant isolation models |
| Cloud service customer controls | Tenant configs, policy assignments |
| Virtual machine security | IaC blueprints, drift detection |
| Network security | Network pillar, segmentation templates |
| Incident management | Governance incident ingest |
| BC in cloud | DR fields, cross-cloud recovery design |

---

## Framework assets

| Asset | Location |
|-------|----------|
| Multi-cloud governance framework | `docs/governance-framework/core-framework/Multi-Cloud-Multi-Tenant-ICT-Governance-Framework.md` |
| Infrastructure blueprints | `blueprint-templates/infrastructure-blueprints/` |
| Azure IaC governance | `Azure-IaC-Governance/` |
| Tenant lifecycle | `tenant-lifecycle-automation.js` |

---

## Posture (June 2026)

**~65–72%** — strong documentation and IaC; live cloud control evidence partial across all platforms.

---

## Gaps

1. Per-cloud 27017 control matrix not published  
2. Consistent attestation across AWS/Azure/GCP uneven

---

## Related

- [ISO/IEC 27018 Cloud Privacy](ISO-IEC-27018-Cloud-Privacy.md)
- [ISO/IEC 27001](ISO-IEC-27001-Information-Security.md)
