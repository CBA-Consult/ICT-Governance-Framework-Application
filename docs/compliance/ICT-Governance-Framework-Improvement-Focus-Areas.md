# ICT Governance Framework — Improvement Focus Areas

**Purpose:** Identify where the framework must improve so effort and investment are directed to the highest-impact areas.  
**Status:** Active planning document (June 2026)  
**Sources:** [A023 Gap Analysis](../governance-framework/assessment/A023-Governance-Gaps-and-Improvement-Opportunities.md), [NIST CSF 2.0 Preliminary Review](NIST-CSF-2.0-Compliance-Review.md), codebase assessment, [Implementation Summary](../implementation/summaries/IMPLEMENTATION-SUMMARY.md)

> **This is a prioritisation guide, not a certification or completion claim.**  
> Use it to allocate teams, budget, and sprint focus — not as evidence of compliance.

> ## ⛔ Remediation gate — required before full NIST CSF 2.0 assessment
>
> The items in this document **must be remediated** and **should be resolved before**:
>
> 1. **Full formal assessment** of NIST CSF 2.0 requirements (Phase 3 validation and Phase 4 attestation)  
> 2. **Client-facing or audit presentation** of ICT Governance Framework solutions as production-ready  
> 3. **MSP / Business Continuity service launches** that depend on live compliance and recovery evidence  
>
> Conducting a full NIST CSF 2.0 assessment or marketing framework capabilities **while P1 remediation items remain open** would produce invalid results and create misrepresentation risk. See [Remediation prerequisites](#remediation-prerequisites-gate-checklist).

**Status:** Active planning document — **remediation in progress** (June 2026)

The ICT Governance Framework has a **strong documentation and policy foundation**, **working RBAC/authentication**, **RPAS governance scaffold**, and **deployable IaC patterns**. The largest gaps are where **documentation and UI overstate live capability** — mock dashboards, unimplemented mapped features, and bootstrap governance artifacts.

**Place emphasis on these six focus areas:**

| Rank | Focus area | Why it matters | Horizon |
|------|------------|----------------|---------|
| **1** | **Compliance integrity** | Mock data and A034 overclaims create audit and client trust risk | 0–90 days |
| **2** | **Live detect & respond** | Monitoring exists but incidents, SIEM correlation, and remediation are incomplete | 0–90 days |
| **3** | **GOVERN & ADPA production** | CSF 2.0 elevates GOVERN; ADPA bridge and RPAS must move from bootstrap to attested baseline | 0–180 days |
| **4** | **Asset & risk intelligence** | No authoritative asset register or live risk engine — blocks IDENTIFY and GV.RM | 90–180 days |
| **5** | **Supply chain & application governance** | Shadow IT / CASB / procurement policy strong on paper; implementation is mock | 0–180 days |
| **6** | **Validated business continuity** | Git-to-cloud recovery designed but not end-to-end tested | 90–180 days |

---

## Remediation prerequisites (gate checklist)

The following **must be complete** before proceeding to [full NIST CSF 2.0 assessment](NIST-CSF-2.0-Compliance-Review.md#phase-25--remediation-gate-required) or presenting ICT Governance Framework solutions as assessed and production-ready.

### Gate A — Required before full NIST CSF 2.0 assessment (P1)

| ID | Remediation | Focus area | Blocks assessment of |
|----|-------------|------------|------------------------|
| G-A1 | A034 reconciled — every mapping tagged Implemented / Partial / Planned / Gap with code evidence | 1 | All CSF functions — integrity of evidence base |
| G-A2 | Mock compliance and executive dashboards removed or explicitly demo-only; production paths use live data | 1 | GV.OV, DE.CM, DETECT evidence |
| G-A3 | Production CASB/vendor inventory (no in-memory mock catalog) | 5 | GV.SC |
| G-A4 | Incident ticket creation wired (ServiceNow and/or Sentinel) — stub removed | 2 | DE.CM, RS.MA |
| G-A5 | CSF 2.0 Organisational Profile (Current) published | 3 | GV.OC, entire GOVERN function |
| G-A6 | Placeholder Zero Trust scores replaced with live assessment or removed from reporting | 4 | ID.RA, GV.RM |
| G-A7 | ADPA/RPAS artifacts — `SET_ME` resolved; bootstrap status upgraded or formally scoped as pre-production | 3 | GV.PO, GV.OV |

**Gate A sign-off:** Compliance Officer + CISO — required to open NIST CSF 2.0 Phase 3 validation.

### Gate B — Required before solution / service claims (P1 + selected P2)

Complete **Gate A** plus:

| ID | Remediation | Focus area | Blocks |
|----|-------------|------------|--------|
| G-B1 | Asset register service implemented (FR-GOV-004) | 4 | ID.AM, client asset governance claims |
| G-B2 | Live Sentinel adverse-event correlation operational | 2 | DE.AE, detect/respond service SLAs |
| G-B3 | End-to-end DR test executed with documented RTO/RPO | 6 | Business Continuity / content continuation offers |
| G-B4 | IR analysis workflow API — not documentation-only | 2 | Incident response solution claims |
| G-B5 | Client and MSP materials reviewed — no capability claims beyond Gate B evidence | 1 | All client-facing solution proposals |

**Gate B sign-off:** Compliance Officer + Service Delivery Lead — required for MSP tier launches and formal solution proposals.

### Gate C — Required before NIST CSF 2.0 attestation (P2 completion)

Complete **Gate B** plus P2 remediations (HR-06 through HR-12) and Phase 3 validation evidence pack. See [NIST CSF 2.0 Compliance Review — Phase 4](NIST-CSF-2.0-Compliance-Review.md).

### What must not proceed until gates are met

| Activity | Minimum gate |
|----------|--------------|
| NIST CSF 2.0 Phase 3 validation (live control testing) | **Gate A** |
| NIST CSF 2.0 Phase 4 attestation / certification claim | **Gate C** |
| Client audit pack citing CSF 2.0 | **Gate C** |
| ICT Governance Framework solution proposal (production) | **Gate B** |
| Business Continuity / content continuation service (Premium tier) | **Gate B** (G-B3 mandatory) |
| Benchmarking report percentage updates for NIST CSF 2.0 | **Gate C** |

---

## Executive summary — where to focus first

Impact vs implementation effort — **prioritise upper-right (high impact, feasible effort) first**.

```
Impact
  ▲
  │  [1 Compliance integrity]     [2 Detect & respond]
  │  [5 Supply chain]               [3 GOVERN & ADPA]
  │
  │  [6 BC validation]              [4 Asset & risk]
  │
  │  [7 Multi-cloud depth]          [8 AI/ML governance]
  │  [9 Training/LMS]               [10 DLP/Purview]
  └──────────────────────────────────────────────────► Effort
         Low                              High
```

---

## Focus Area 1 — Compliance integrity (documentation = code)

**Priority:** CRITICAL | **Horizon:** 0–90 days | **NIST refs:** HR-03, HR-04 | **A023 alignment:** Real-time monitoring credibility

### Current state

- A034 maps 156 requirements with "100% coverage" including features **not implemented in code** (FAIR, asset register, incident workflows).
- Compliance and executive dashboards use **mock data**.
- Client-facing materials and README describe capabilities beyond production evidence.

### Gap

Auditors and clients cannot distinguish **designed** from **delivered**. This undermines every other governance investment.

### Actions

| # | Action | Owner domain |
|---|--------|--------------|
| 1.1 | Reconcile A034 — mark each mapping: **Implemented / Partial / Planned / Gap** with code links | Compliance + Architecture |
| 1.2 | Replace mock dashboard data with live API feeds **or** clearly label UI as **Demo Mode** | Development |
| 1.3 | Add `IMPLEMENTATION-STATUS.md` registry for major features (single source of truth) | Project management |
| 1.4 | Review client/MSP materials — remove claims not backed by implemented controls | Compliance |

### Success criteria

- Zero mock data on production compliance paths without explicit demo labelling
- A034 accuracy attested by Compliance Officer
- No "100% coverage" claims without implementation evidence

### Evidence today

- `ict-governance-framework/app/compliance-dashboard/page.js` — mock data
- `A034-Compliance-Requirements-System-Features-Mapping.md` — overstated mappings

---

## Focus Area 2 — Live detect, respond, and remediate

**Priority:** CRITICAL | **Horizon:** 0–90 days | **NIST refs:** HR-07, HR-08, HR-09 | **A023 alignment:** Real-time monitoring, automated remediation

### Current state

- `Continuous-Compliance-Monitoring.ps1` runs monitoring loops and playbooks.
- `Create-IncidentTicket` is a **stub** — no ServiceNow/Sentinel ticket creation.
- Sentinel/ServiceNow adapters exist but require live configuration.
- Remediation framework has **partial resource-type coverage**.

### Gap

Detection without **closed-loop response** fails CSF 2.0 DETECT and RESPOND expectations and the framework's own real-time monitoring narrative.

### Actions

| # | Action | Owner domain |
|---|--------|--------------|
| 2.1 | Wire incident creation to ServiceNow and/or Sentinel incidents | Azure automation |
| 2.2 | Complete `Automated-Remediation-Framework.ps1` coverage for top 10 resource types | Azure automation |
| 2.3 | Implement live Sentinel correlation for adverse events (DE.AE) | Security operations |
| 2.4 | Build incident analysis workflow API (RS.AN) — link AMD records to IR tickets | Development |
| 2.5 | Validate ransomware scenario end-to-end in test tenant (detect → contain → ticket) | Security + BC |

### Success criteria

- Critical violation → automated ticket within SLA (< 5 min per NFR)
- At least one live SIEM correlation rule feeding governance dashboard
- Remediation playbooks execute without stub paths for production resource types

### Evidence today

- `azure-automation/Continuous-Compliance-Monitoring.ps1` L599–617 — stub
- `docs/implementation/summaries/Real-Time-Monitoring-Implementation-Summary.md` — design vs live gap

---

## Focus Area 3 — GOVERN function & ADPA production bridge

**Priority:** CRITICAL | **Horizon:** 0–180 days | **NIST refs:** HR-01, HR-05, HR-11 | **Strategic:** ADPA → Compliance as Code

### Current state

- Extensive policy library and RPAS methodology (CSR-42, guardrails G1–G5).
- RPAS integration is **vendor-scaffold**; ADPA/ARM/AEV artifacts at **`0.1.0-bootstrap`**, `sourceOfTruth: "SET_ME"`.
- ADPA bridge documented in README but **Compliance as Code not fully wired**.

### Gap

CSF 2.0 makes **GOVERN** foundational. The framework's differentiator (RPAS + ADPA) is not yet **production-attested** — it cannot be sold or audited as operational governance.

### Actions

| # | Action | Owner domain |
|---|--------|--------------|
| 3.1 | Publish NIST CSF 2.0 Organisational Profile (Current + Target) | Compliance |
| 3.2 | Complete ADPA artifact binding — remove `SET_ME`; certify source of truth | Governance / RPAS |
| 3.3 | Implement GOVERN oversight dashboard (metrics from live data, not mock) | Development |
| 3.4 | Wire ADPA document generation to `TAR-COL` metadata schema | Governance automation |
| 3.5 | Promote RPAS from vendor-scaffold to canonical or fully attested in-repo baseline | Governance |

### Success criteria

- ADPA controls at production version with validated `sourceOfTruth`
- Organisational Profile published and maintained
- Governance dashboard shows RPAS drift, AMD lineage, and CSR status from live sources

### Evidence today

- `governance/rpas/artifacts/ADPA.control.json` — bootstrap
- `README.md` — ADPA bridge section (design)

---

## Focus Area 4 — Asset & risk intelligence

**Priority:** HIGH | **Horizon:** 90–180 days | **NIST refs:** HR-05, HR-06 | **A023 alignment:** Predictive analytics, risk quantification

### Current state

- Azure resource enumeration via PowerShell module (`Get-AzResource`).
- A034 maps FR-GOV-004 (asset register) and FR-GOV-005 (FAIR risk) — **neither implemented in application code**.
- Zero Trust maturity assessment uses **hardcoded placeholder scores**.

### Gap

Without authoritative asset inventory and live risk assessment, IDENTIFY function fails and prioritisation of remediation is manual and inconsistent.

### Actions

| # | Action | Owner domain |
|---|--------|--------------|
| 4.1 | Implement asset register API and schema (FR-GOV-004) — multi-cloud asset IDs | Development |
| 4.2 | Integrate asset register with Azure Resource Graph, M365, CASB catalog | Integration |
| 4.3 | Replace placeholder ZT scores with live telemetry-driven assessment | Azure automation |
| 4.4 | Introduce risk register (FAIR-lite minimum) linked to assets and tenants | Governance |
| 4.5 | Feed risk scores into CISO dashboard and compliance heatmap | Development |

### Success criteria

- Single query returns governed asset inventory per tenant
- Risk register updated from live scans, not static placeholders
- CISO dashboard risk widgets sourced from register

---

## Focus Area 5 — Supply chain & application governance

**Priority:** HIGH | **Horizon:** 0–180 days | **NIST refs:** HR-02 | **A023 alignment:** Multi-cloud + Shadow IT

### Current state

- Strong procurement policy documentation.
- CASB app catalog: **in-memory storage** with sample data.
- Compliance validation service: **mock implementation**.
- Application procurement UI uses mock requests.

### Gap

Shadow IT, SaaS sprawl, and vendor risk are core client concerns — especially for Business Continuity and content continuation services. Policy without inventory is not governable.

### Actions

| # | Action | Owner domain |
|---|--------|--------------|
| 5.1 | Persist CASB catalog to PostgreSQL; integrate Defender for Cloud Apps API | Development |
| 5.2 | Replace mock compliance validation with live API calls | Development |
| 5.3 | Build vendor/SaaS inventory aligned to GV.SC — link to procurement workflow | Compliance |
| 5.4 | Unify Shadow IT detection with drift taxonomy (application drift category) | Security operations |
| 5.5 | Report supply chain posture on compliance dashboard (live) | Development |

### Success criteria

- Production CASB catalog with audit trail
- Unauthorized app detection feeds drift classification
- Vendor inventory complete for pilot tenant

### Evidence today

- `ict-governance-framework/api/casb-app-catalog.js`
- `ict-governance-framework/services/compliance-validation-service.js`
- `docs/compliance/monitoring/Shadow-IT-as-Infrastructure-Drift.md`

---

## Focus Area 6 — Validated business continuity

**Priority:** HIGH | **Horizon:** 90–180 days | **NIST refs:** HR-12 | **Service:** Content continuation, Git-to-cloud recovery

### Current state

- Business Continuity Services narrative, Bicep DR patterns, RPAS rollback script, ransomware recovery guide.
- Recovery Services Vault in multi-tenant blueprint.
- **No automated end-to-end DR test** in CI/CD or scheduled runbook execution.

### Gap

Clients buying continuity services need **proven RTO/RPO**, not documented intent. Recovery guides are scenario documentation until tested.

### Actions

| # | Action | Owner domain |
|---|--------|--------------|
| 6.1 | Execute ransomware recovery scenario in isolated test tenant; record RTO/RPO | BC / Security |
| 6.2 | Add DR validation to CI or quarterly scheduled workflow | DevOps |
| 6.3 | Complete backup remediation logic in automation framework | Azure automation |
| 6.4 | Package recovery attestation template for client delivery post-test | Compliance |
| 6.5 | Extend Git-to-cloud recovery script chain (validate → deploy → restore → verify) | DevOps |

### Success criteria

- Documented DR test results with measured RTO/RPO within NFR targets
- Recovery attestation template used in at least one pilot
- `Restore-RpasBaseline.ps1` + IaC deploy tested as single pipeline

### Evidence today

- `docs/implementation/guides/RPAS-Rollback-Recovery-Ransomware-Example.md`
- `governance/rpas/scripts/Restore-RpasBaseline.ps1`

---

## Focus Area 7 — Multi-cloud operational depth

**Priority:** MEDIUM | **Horizon:** 180–365 days | **A023:** Critical gap (maturity 2.1 → 4.0)

### Current state

- Strong Azure automation and Bicep templates.
- AWS/GCP referenced in docs and tenant config; **less automation depth** than Azure.

### Gap

Multi-cloud governance is a stated differentiator but operational tooling is Azure-weighted.

### Actions

- Extend blueprint library with AWS/GCP equivalent modules
- Multi-cloud policy validation in CI
- Per-cloud tenant lifecycle automation parity
- Cross-cloud cost allocation in governance metrics

---

## Focus Area 8 — Security awareness & data protection depth

**Priority:** MEDIUM | **Horizon:** 180–365 days | **NIST refs:** HR-10, HR-13

### Current state

- Training materials in `docs/training/` — documentation only.
- Data protection via IaC encryption; no app-layer DLP.

### Actions

- Training completion tracking module (PR.AT)
- Microsoft Purview / DLP integration for classified data (PR.DS)
- Link training completion to RBAC role eligibility

---

## Effort allocation recommendation

Suggested **team effort split** for the next two quarters:

| Focus area | Q1 emphasis | Q2 emphasis |
|------------|-------------|-------------|
| 1 Compliance integrity | **40%** | 10% |
| 2 Detect & respond | **30%** | 20% |
| 3 GOVERN & ADPA | 15% | **25%** |
| 4 Asset & risk | 5% | **20%** |
| 5 Supply chain | 10% | **15%** |
| 6 BC validation | — | **10%** |
| 7–8 Multi-cloud, training, DLP | — | — (backlog) |

---

## Cross-reference index

| Topic | Document |
|-------|----------|
| NIST CSF 2.0 high-risk register (HR-01–HR-15) | [NIST-CSF-2.0-Compliance-Review.md](NIST-CSF-2.0-Compliance-Review.md) |
| Historical gap analysis (A023) | [A023-Governance-Gaps-and-Improvement-Opportunities.md](../governance-framework/assessment/A023-Governance-Gaps-and-Improvement-Opportunities.md) |
| CSF 1.1 feature mappings | [A034-Compliance-Requirements-System-Features-Mapping.md](A034-Compliance-Requirements-System-Features-Mapping.md) |
| ADPA bridge & Compliance as Code | [README.md](../../README.md#adpa-as-the-governance-bridge) |
| Business Continuity Services | [README.md](../../README.md#business-continuity-services) |
| Ransomware recovery scenario | [RPAS-Rollback-Recovery-Ransomware-Example.md](../implementation/guides/RPAS-Rollback-Recovery-Ransomware-Example.md) |
| RPAS integration | [RPAS-Governance-Integration-Guide.md](../implementation/guides/RPAS-Governance-Integration-Guide.md) |

---

## Review cadence

| Review | Frequency | Owner |
|--------|-----------|-------|
| Remediation gate progress (G-A1–G-A7) | Bi-weekly | Project Manager |
| Gate A sign-off readiness | Monthly | Compliance Officer |
| Gate B sign-off readiness | Monthly | Service Delivery Lead |
| Focus area progress | Monthly | Project Manager |
| Priority re-ranking | Quarterly | Compliance Officer + CISO |
| NIST CSF 2.0 Phase 3 validation | **Only after Gate A** | Compliance Officer |
| NIST CSF 2.0 Phase 4 attestation | **Only after Gate C** | Compliance Officer |
| Client/MSP readiness | **Only after Gate B** | Service delivery lead |

---

**Document version:** 1.0  
**Next review:** September 2026  
**Maintained by:** ICT Governance Framework Team
