# ISO Standards Reassessment — ICT Governance Framework

**Document ID:** ISO-REASSESS-2026  
**Date:** June 2026 (post–`v1.0-adaptive-governance`)  
**Classification:** Internal — alignment assessment  
**Sources:** A033, A007, A034, ISO library, improvement gates, live codebase (ADPA, contract tests, FAIR engine, seven-pillar services)

> **This is an alignment reassessment, not a certification claim.** No ISO standard is formally certified by this repository.

---

## Executive summary

The framework’s **strongest ISO alignment remains ISO/IEC 38500** — it is the stated foundation of the governance model (six principles + Evaluate–Direct–Monitor). **ISO/IEC 27001** is the primary security-management mapping target, with growing **operational evidence** after the `v1.0-adaptive-governance` release.

Since the January 2025 compliance documents (A033/A034), the repo has materially improved **implementable** ISO-relevant capability:

| Area | What changed |
|------|----------------|
| **Conformance evidence** | ADPA production-attested artifacts, compliance lineage bridge, control-level escalations (e.g. ISO 27001 `A.9.2.1` in tenant demos) |
| **Security operations** | 19 pillar contract tests, evidence validation/provenance, compliance escalation SLAs |
| **Risk (ISO 31000 family)** | Live FAIR risk engine consuming assets, incidents, JIT/break-glass telemetry |
| **Assets (27001 A.8)** | Asset register API, schema, UI, tests |
| **Identity (27001 A.9)** | JIT ledger, break-glass, privileged-action logging |
| **Governance (38500)** | ADPA `iso38500-crosswalk` template; generated tenant governance packs |

The main residual risk is **integrity of compliance claims**: A033 percentage scores and A034 “100% mapped” language predate much of this code and still overstate delivery. [Improvement Focus Areas](../ICT-Governance-Framework-Improvement-Focus-Areas.md) Gate A (A034 reconciliation) remains open.

---

## Tier 1 — Core ISO standards

### ISO/IEC 38500:2015 — Corporate governance of IT

**Role:** Foundational governance standard for the entire framework.

| Dimension | Assessment |
|-----------|------------|
| **Documentation** | Strong — [ISO 38500 guide](../regulatory/ISO-IEC-38500-Governance-Standards.md), woven into [ICT Governance Framework](../../governance-framework/core-framework/ICT-Governance-Framework.md) and [Target Framework](../../governance-framework/target-framework/Target-Governance-Framework.md) |
| **Structure** | Six principles mapped to roles, policies, KPIs via ADPA templates |
| **EDM cycle** | Evaluate–Direct–Monitor described in policy; executive metrics API exists; **automated EDM attestation is partial** |
| **Reassessed posture** | **High structural alignment (~80–85%)**; **moderate operational attestation (~60–70%)** |

**Gaps:** ISO 38500 is not registered in `adpa/coe/compliance-lineage-bridge.json` alongside ISO 27001/NIST. Board-level governance evidence is documentary, not continuously measured.

→ [Library entry](standards/ISO-IEC-38500-IT-Governance.md) · [38500 crosswalk](crosswalks/ISO-38500-Framework-Crosswalk.md)

---

### ISO/IEC 27001:2022 — Information security management

**Role:** Primary ISMS / Annex A control mapping for the seven security pillars.

| Annex A theme | Framework pillar / feature | June 2026 evidence |
|---------------|---------------------------|-------------------|
| A.5 Policies | Policy library, FR-GOV-001 | Documented |
| A.6 Organization | RBAC, service responsibility boundaries | Contract tests + services |
| A.8 Assets | Asset register (FR-GOV-004) | API, SQL, UI, contract tests |
| A.9 Access | JIT, break-glass, MFA enforcement rules | Ledger + contract tests |
| A.12 Operations | Compliance monitoring, remediation orchestrator | Partial — incident stub remains |
| A.16 Incidents | Governance incident ingest/lifecycle | Partial — ingest live, full IR workflow gap (G-B4) |
| A.18 Compliance | Compliance dashboards, lineage, escalations | Substantial — control-level client notifications |

**Reassessed posture:** **~70–78% alignment**. Implementation is **meaningfully stronger** than A034 implied at authoring time; **ISMS management-system elements** (internal audit programme, management review, living SoA) remain mostly documentary.

**Blueprint note:** `iso27001-compliance.bicep` still references ISO 27001:2013 — update to 2022 Annex A numbering.

→ [Library entry](standards/ISO-IEC-27001-Information-Security.md) · [Seven-pillar crosswalk](crosswalks/ISO-27001-Seven-Pillar-Crosswalk.md)

---

### ISO 31000:2018 — Risk management

| Dimension | Assessment |
|-----------|------------|
| **A007 baseline** | Level 3 (65%) |
| **Current** | `fair-risk-engine.js`, calibration tables, telemetry drivers |
| **Reassessed posture** | **~72–80%** — largest improvement among ISO risk standards |

**Gaps:** Risk treatment workflows and formal risk appetite statements not fully wired to executive reporting; Zero Trust scores still placeholder (G-A6).

→ [Library entry](standards/ISO-31000-Risk-Management.md)

---

### ISO 22301:2019 — Business continuity

| Dimension | Assessment |
|-----------|------------|
| **A007 baseline** | Level 3 (62%) |
| **Current** | DR fields in asset register, resilience contract tests, RPAS recovery design |
| **Reassessed posture** | **~55–65%** — design strong, **attestation weak** |

**Blocker:** Gate B G-B3 — no documented end-to-end DR test with measured RTO/RPO.

→ [Library entry](standards/ISO-22301-Business-Continuity.md)

---

### ISO/IEC 20000-1:2018 — IT service management

| Dimension | Assessment |
|-----------|------------|
| **A033 baseline** | 77% |
| **Current** | Compliance/procurement SLA services, obligation-SLA binding, escalation exposure |
| **Reassessed posture** | **~70–75%** |

→ [Library entry](standards/ISO-IEC-20000-Service-Management.md)

---

## Tier 2 — Supporting ISO standards

| Standard | Reassessed posture | Notes |
|----------|-------------------|-------|
| **ISO/IEC 27002:2022** | ~75% indirect | Control guide; no standalone crosswalk yet |
| **ISO/IEC 27017:2015** | ~65–72% | Multi-cloud docs + IaC; live evidence partial |
| **ISO/IEC 27018:2019** | ~65–70% | Privacy templates; Purview/DLP planned |
| **ISO/IEC 27701:2019** | ~60–68% | Via GDPR mappings; no dedicated PIMS artefact |
| **ISO 9001:2015** | ~75–80% | Strong process documentation |
| **ISO/IEC 42001:2023** | ~35–45% | **Add to formal inventory** — AI control plane exists |
| **ISO/IEC 23053:2022** | ~30–40% | Emerging AI risk |
| **ISO/IEC 30141:2018** | ~40–50% | IoT governance doc |
| **ISO 14001:2015** | ~45% | Low priority |

See [ISO Standards Inventory](ISO-Standards-Inventory.md) for the full catalog.

---

## Seven-pillar → ISO control family map

| Pillar | Primary ISO families |
|--------|---------------------|
| Identity | 27001 A.9, 38500 Responsibility |
| Devices | 27001 A.8, A.12 |
| Software | 27001 A.8, supply-chain controls |
| Network | 27001 A.12, 27017 |
| Data | 27001 A.8, 27018, 27701 |
| SecOps | 27001 A.16, 31000 |
| Resilience | 22301, 27001 A.17 |

Contract tests (`ict-governance-framework/tests/contracts/*.contract.test.js`) and the regression registry support ISO 27001 Clause 9 (monitoring) when results are retained as audit evidence.

---

## Critical gaps affecting ISO credibility

1. **A034 integrity (G-A1)** — mappings not reconciled to implementation status
2. **No ISO certification path defined** — tenants certify themselves using framework outputs
3. **ISO 38500 absent from compliance lineage bridge**
4. **BC not validated (22301)** — resilience design without exercised recovery
5. **27001 blueprint version drift** — 2013 vs 2022 Annex A
6. **ISO 42001 not formally scoped**

---

## Recommended priorities

| Priority | Action | ISO impact |
|----------|--------|------------|
| **P1** | Reconcile A034 with implementation status + code links (G-A1) | Auditable mappings |
| **P1** | Add ISO 38500 to ADPA compliance lineage | 38500 conformance evidence |
| **P2** | Publish living SoA template (Annex A 2022 + seven pillars) | Core 27001 tenant deliverable |
| **P2** | Update `iso27001-compliance.bicep` to 2022 | Version consistency |
| **P2** | Execute and document DR exercise (G-B3) | Unblocks 22301 claims |
| **P3** | Add ISO/IEC 42001 to inventory with AI control plane mapping | AI governance clients |
| **P3** | Generate ISO 38500 crosswalk per tenant via ADPA | Tenant-ready packs |

→ [Implementation roadmap](crosswalks/ISO-Standards-Implementation-Roadmap.md)

---

## Posture summary

| Standard | Jan 2025 (docs) | June 2026 (reassessed) | Trend |
|----------|-----------------|------------------------|-------|
| **ISO 38500** | 85% (claimed) | **80–85% structural / 60–70% attested** | Stable |
| **ISO 27001** | 82% (claimed) | **70–78% with growing code evidence** | ↑ implementation |
| **ISO 31000** | 74% (claimed) | **72–80%** | ↑ (FAIR live) |
| **ISO 22301** | 62% (A007) | **55–65%** | ↑ design, attestation pending |
| **ISO 20000** | 77% (claimed) | **70–75%** | Stable |
| **ISO 42001** | Not scoped | **35–45%** | New gap |

The framework is **well-positioned as an ISO 38500-aligned governance platform** with **strengthening ISO 27001 operational evidence**. External ISO certification claims require Gate A/B remediations and A034 reconciliation.

---

## Related documents

- [ISO Standards Library](README.md)
- [ICT Governance Framework ISO Alignment](ICT-Governance-Framework-ISO-Alignment.md)
- [Improvement Focus Areas](../ICT-Governance-Framework-Improvement-Focus-Areas.md)
- [A033 Applicable Regulatory Frameworks](../A033-Applicable-Regulatory-Frameworks.md)
