# ISO Standards Library

**Purpose:** Central library for ISO standard alignment, crosswalks, and evidence mapping across the **ICT Governance Framework**.  
**Status:** Active — June 2026  
**Maintainer:** Compliance + Architecture

> **This library supports alignment and audit preparation. It is not a certification claim.**  
> For remediation gates before external assessment, see [Improvement Focus Areas](../ICT-Governance-Framework-Improvement-Focus-Areas.md).

---

## Library structure

```
docs/compliance/ISO/
├── README.md                                    ← You are here
├── ISO-Standards-Reassessment-2026.md           ← Latest posture review (June 2026)
├── ICT-Governance-Framework-ISO-Alignment.md    ← Master map: entire framework ↔ ISO
├── ISO-Standards-Inventory.md                   ← Catalog of applicable ISO standards
├── standards/                                   ← Per-standard library entries
│   ├── ISO-IEC-38500-IT-Governance.md
│   ├── ISO-IEC-27001-Information-Security.md
│   ├── ISO-IEC-27002-Security-Controls.md
│   ├── ISO-31000-Risk-Management.md
│   ├── ISO-22301-Business-Continuity.md
│   ├── ISO-IEC-20000-Service-Management.md
│   ├── ISO-IEC-27017-Cloud-Security.md
│   ├── ISO-IEC-27018-Cloud-Privacy.md
│   ├── ISO-IEC-27701-Privacy-Management.md
│   └── ISO-IEC-42001-AI-Management.md
└── crosswalks/
    ├── ISO-38500-Framework-Crosswalk.md         ← Six principles + EDM cycle
    ├── ISO-27001-Seven-Pillar-Crosswalk.md      ← Annex A ↔ seven pillars
    └── ISO-Standards-Implementation-Roadmap.md  ← Prioritised remediation
```

---

## Quick start by role

| Role | Start here |
|------|------------|
| **Governance / board** | [ISO/IEC 38500 library entry](standards/ISO-IEC-38500-IT-Governance.md) · [38500 crosswalk](crosswalks/ISO-38500-Framework-Crosswalk.md) |
| **CISO / security** | [ISO/IEC 27001 library entry](standards/ISO-IEC-27001-Information-Security.md) · [Seven-pillar crosswalk](crosswalks/ISO-27001-Seven-Pillar-Crosswalk.md) |
| **Risk** | [ISO 31000 library entry](standards/ISO-31000-Risk-Management.md) |
| **BC / resilience** | [ISO 22301 library entry](standards/ISO-22301-Business-Continuity.md) |
| **Compliance officer** | [Reassessment 2026](ISO-Standards-Reassessment-2026.md) · [Implementation roadmap](crosswalks/ISO-Standards-Implementation-Roadmap.md) |
| **Tenant / MSP delivery** | [Framework ISO alignment](ICT-Governance-Framework-ISO-Alignment.md) · ADPA [`iso38500-crosswalk`](../../../adpa/templates/ict-governance/iso38500-crosswalk.template.md) template |

---

## Relationship to other compliance docs

| Document | Relationship |
|----------|--------------|
| [ICT Governance Framework](../../governance-framework/core-framework/ICT-Governance-Framework.md) | Primary framework — ISO 38500 is foundational |
| [ISO/IEC 38500 Governance Standards (regulatory)](../regulatory/ISO-IEC-38500-Governance-Standards.md) | Authoritative deep-dive for 38500 (retained in `regulatory/`) |
| [A033 Applicable Regulatory Frameworks](../A033-Applicable-Regulatory-Frameworks.md) | Broader regulatory inventory (48 frameworks) |
| [A034 Compliance ↔ Features Mapping](../A034-Compliance-Requirements-System-Features-Mapping.md) | Feature-level mappings — **reconciliation in progress** (Gate A) |
| [NIST CSF 2.0 Compliance Review](../NIST-CSF-2.0-Compliance-Review.md) | Parallel cybersecurity framework assessment |
| [Improvement Focus Areas](../ICT-Governance-Framework-Improvement-Focus-Areas.md) | Remediation gates before attestation |

---

## Tier summary (June 2026 reassessment)

| Tier | Standards | Framework role |
|------|-----------|----------------|
| **Tier 1 — Foundational** | ISO/IEC 38500, ISO/IEC 27001, ISO 31000, ISO 22301, ISO/IEC 20000-1 | Core governance, security, risk, continuity, service management |
| **Tier 2 — Supporting** | ISO/IEC 27002, 27017, 27018, 27701, ISO 9001 | Control detail, cloud, privacy extension, quality |
| **Tier 3 — Emerging** | ISO/IEC 42001, 23053, 30141, ISO 14001 | AI, IoT, sustainability |

See [ISO Standards Inventory](ISO-Standards-Inventory.md) for the full catalog and [Reassessment 2026](ISO-Standards-Reassessment-2026.md) for evidence-based posture.

---

## ADPA and tenant artefacts

Generated tenant governance packs can include ISO crosswalks via ADPA:

- Template: [`adpa/templates/ict-governance/iso38500-crosswalk.template.md`](../../../adpa/templates/ict-governance/iso38500-crosswalk.template.md)
- Compliance lineage: [`adpa/coe/compliance-lineage-bridge.json`](../../../adpa/coe/compliance-lineage-bridge.json) (ISO 27001 control IDs)
- Example tenant: [`adpa/tenants/tenant-contoso-health/`](../../../adpa/tenants/tenant-contoso-health/)

---

## Maintenance

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Reassess posture after major releases | Per release tag | Compliance |
| Update crosswalks when pillars or Annex A mappings change | Per sprint | Architecture |
| Reconcile A034 implementation tags | Until Gate A closed | Compliance + Dev |
| Add new ISO standards to inventory | As scoped | Compliance |

**Last updated:** June 2026 (`v1.0-adaptive-governance`)
