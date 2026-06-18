# NIST CSF 2.0 Organisational Profile — Current State

**Organization:** CBA Consult ICT Governance Framework Target Environment  
**Scope:** Multi-Tenant, Multi-Cloud Infrastructure (AWS, Azure, GCP) and SaaS Management  
**Version:** 1.1 (Current State Profile)  
**Date:** 18 June 2026  
**Status:** Published baseline — **Gate A remediation in progress** (not CSF 2.0 certified)

> This profile is a **Current State** crosswalk only. It does not constitute NIST CSF 2.0 certification. See [NIST CSF 2.0 Compliance Review](NIST-CSF-2.0-Compliance-Review.md).

---

## 1. Introduction & Organizational Context

This Organisational Profile provides a formal crosswalk of the current operating state of the Multi-Cloud Multi-Tenant ICT Governance Framework against the **NIST Cybersecurity Framework (CSF) 2.0 Core**. It defines our risk management posture, institutional boundaries, and technical execution across all managed tenant domains.

### Core Architecture Context

- **Tenants Supported:** Multi-tiered (Enterprise, Government, Healthcare, Financial, Standard).
- **Clouds Governed:** Microsoft Azure (Primary Automation), AWS (Partial Blueprinting), GCP (Design/Structure).
- **Assurance Envelope:** Driven deterministically by the Regulated Process Assurance System — Cloud Master (RPAS-CM v2.3.0).
- **Audit boundary principle (June 2026):** Infrastructure **posture** (assets) and human **authority events** (JIT / Break Glass elevations) are tracked on separate surfaces for NIS2-aligned evidence presentation.

---

## 2. GOVERN (GV) Function Mapping

### GV.OC: Organizational Context

> **Outcome:** The organization's mission, stakeholder expectations, and legal, regulatory, and contractual requirements are understood and inform cybersecurity risk management decisions.

- **Current Implementation:**
  - A four-tiered governance structure (Strategic Governance Council, Tenant Domain Owners, Cloud Platform Stewards, Tenant Service Managers) defines lines of communication and operational boundaries.
  - Core alignment maps to ISO/IEC 38500, ITIL 4, and COBIT 2019 are codified in `docs/governance-framework/target-framework/Target-Governance-Framework.md`.
  - This Organisational Profile (Current) satisfies the baseline GV.OC artefact requirement (Gate A / G-A5).
- **Evidence Base:** `docs/governance-framework/core-framework/Strategic-Tactical-IT-Governance-Overview.md`, this document

### GV.PO: Policy Establishment

> **Outcome:** Organizational policies for cybersecurity risk management are established, communicated, and enforced.

- **Current Implementation:**
  - Complete policy lifecycle defined across technology selection, architecture review, and tenant isolation models.
  - Strategic intent is directly linked to operational templates using the **ADPA (Architecture Decision and Policy Alignment)** bridge module (`adpa/`).
- **Evidence Base:** `governance/rpas/artifacts/ADPA.control.json` (Production-Attested `TAR-ADPA-001`, v2.3.0)

### GV.RM: Risk Management Strategy

> **Outcome:** The organization's priorities, constraints, risk tolerances, and assumptions are defined, communicated, and used to support operational risk decisions.

- **Current Implementation:**
  - Multi-tenant classification rules force varied isolation approaches (**Silo, Pool, Hybrid**) based on regulatory requirements (e.g., GDPR, HIPAA, PCI-DSS).
  - Risk scoring uses standard tiers; live FAIR-lite quantitative engine remains planned (Focus Area 4 / G-A6).
- **Gap:** Placeholder Zero Trust scores in automation scripts — not acceptable as audit evidence until G-A6 complete.
- **Evidence Base:** `docs/governance-framework/core-framework/Multi-Cloud-Multi-Tenant-ICT-Governance-Framework.md`

### GV.RR: Roles, Responsibilities, and Authorities

> **Outcome:** Cybersecurity roles, responsibilities, and authorities are established and communicated.

- **Current Implementation:**
  - JWT-based RBAC with granular permissions across governance, compliance, and security routes.
  - **JIT elevation** enforces time-bounded privileged authority for standard mutations (`POST /api/auth/jit/elevate`, `X-JIT-Context` middleware).
  - **Break Glass** provides out-of-band emergency authority when identity infrastructure is degraded, with immutable ledger logging.
- **Evidence Base:** `middleware/auth-jit-enforcer.js`, `api/jit-router.js`, `api/break-glass-router.js`, `tests/jit-enforcement.test.js`

### GV.OV: Oversight

> **Outcome:** Results of organization-wide cybersecurity risk management activities are used to inform, improve, and adjust the risk management strategy.

- **Current Implementation:**
  - RPAS drift detection, CI validation, and governance checksum enforcement.
  - Dedicated **JIT Elevation** and **Break Glass** consoles under Security navigation for oversight of privileged authority events.
  - Break Glass trend analytics feed integrity KPI (`KPI-GOV-BREAK-GLASS-AUDIT`).
  - Compliance posture API (`GET /api/governance/posture`) supports live dashboard when telemetry is populated.
- **Evidence Base:** `app/jit-elevation/`, `app/break-glass/`, `api/analytics-router.js`, `npm run verify:analytics`

---

## 3. IDENTIFY (ID) Function Mapping

### ID.AM: Asset Management

> **Outcome:** Physical and software assets are inventory-tracked and managed to support security posture objectives.

- **Current Implementation:**
  - **RPAS Asset Register (FR-GOV-004)** — PostgreSQL-backed inventory with REST API and web UI at `/asset-register`.
  - Tracks tenant, asset origin (Managed / Shadow_IT / CASB_Discovery), validation posture, Gate B DR status, CASB risk scores, and drill timestamps.
  - CASB shadow-IT ingest via webhook (`POST /api/assets/casb-ingest`) and optional Defender for Cloud Apps polling worker.
  - Azure Resource Graph enumeration remains available via PowerShell automation for sync operations.
- **Gap:** Full multi-cloud CMDB depth and automated Azure→register sync for all resource types — Gate B sign-off pending.
- **Evidence Base:** `api/asset-router.js`, `app/asset-register/`, `npm run verify:assets`, `sql/assets.sql`

---

## 4. PROTECT (PR) Function Mapping

### PR.AA: Identity Management, Authentication, and Access Control

> **Outcome:** Access to physical and logical assets is limited to authorized users, services, and hardware.

- **Current Implementation:**
  - JWT authentication, bcrypt password hashing, TOTP MFA support, session management, and RBAC.
  - **JIT enforcement** on privileged routes when `JIT_ENFORCEMENT_ENABLED=true` — requires valid elevation ticket in `X-JIT-Context` header.
  - **Break Glass** emergency tokens minted via out-of-band system secret; rate-limited activation; optional Slack webhook alerting.
  - All privileged mutations logged to `privileged_action_logs` with payload hash for cryptographic reconciliation.
- **Evidence Base:** `middleware/auth-jit-enforcer.js`, `sql/jit_ledger.sql`, `npm run verify:jit`, `npm run verify:break-glass`

---

## 5. DETECT (DE) & RESPOND (RS) Function Mapping

### DE.CM: Continuous Monitoring

> **Outcome:** Security and posture baselines are monitored continuously to uncover anomalies and drift.

- **Current Implementation:**
  - Automated drift tracking uses `Continuous-Compliance-Monitoring.ps1` to identify unauthorized infrastructure alterations.
  - Violations route through `Invoke-GovernanceIncidentApi` → `POST /api/governance/incidents` (webhook-authenticated) with `correlation_id`, ingest audit log, event-driven FAIR recalculation, and MITRE ATT&CK enrichment on timeline.
  - Compliance dashboard reads from live PostgreSQL schema (`compliance_controls`) when populated; displays explicit **DEMO / MOCK DATA MODE** banner when telemetry is absent.
  - Break Glass exposure trend chart for executive oversight of emergency window frequency.
- **Gap:** Strategic Initiatives widget on executive dashboard remains demo-only (no PMO API).
- **Evidence Base:** `azure-automation/Continuous-Compliance-Monitoring.ps1`, `ict-governance-framework/app/secops-console`, `npm run verify:secops`, `npm run verify:governance-automation`

### DE.AE: Adverse Event Analysis

> **Outcome:** Anomalies, indicators of compromise, and other potentially adverse events are analyzed.

- **Current Implementation:**
  - Governance incident ingest pipeline accepts Sentinel/SIEM webhooks with drift taxonomy classification, MITRE ATT&CK enrichment, and forensic-grade IR timeline (`GET /incidents/:id/timeline`).
  - PowerShell continuous monitoring calls live REST ingest via `Invoke-GovernanceIncidentApi` (stub removed).
- **Gap:** Full Sentinel webhook samples in docs; SecOps console UI for SOC queue — Sprint B Step 3.
- **Evidence Base:** `POST /api/governance/incidents`, `services/mitre-enrichment.js`, `npm run verify:secops`

### RS.MA: Incident Management

> **Outcome:** Incidents are logged, categorized, and integrated with external response workflows.

- **Current Implementation:**
  - Ingestion pipeline features automated parsing of incoming telemetry hooks from Microsoft Sentinel and SIEM controllers.
  - Alerts are ingested via a secure REST API route that enforces strict input validation against the framework's official **drift taxonomy** and JIT context on mutations.
  - Privileged actions under emergency tickets are reviewable in the Break Glass console with manual cryptographic reconciliation.
- **Gap:** ServiceNow / automated ticket creation from PowerShell monitoring script remains stubbed.
- **Evidence Base:** `ict-governance-framework/api/governance-router.js`, `api/reconciliation-router.js`

---

## 6. RECOVER (RC) Function Mapping

### RC.RP: Recovery Planning

> **Outcome:** Recovery objectives are established and plans are maintained.

- **Current Implementation:**
  - Asset register tracks DR status (`Stable`, `DR_Hydrated`, `Stale_Drill`, `Failed_Validation`), last drill timestamps, RTO seconds, and RPO flags.
  - RPAS baseline restore, Bicep DR patterns, and ransomware recovery guide remain primary recovery artefacts.
- **Gap:** End-to-end DR test with documented RTO/RPO — G-B3 open.
- **Evidence Base:** `sql/asset_dr_fields.sql`, `RPAS-Rollback-Recovery-Ransomware-Example.md`

---

## 7. Summary of Profile Targets & Next Steps

| Priority | Target | Gate | Status |
|----------|--------|------|--------|
| Close executive dashboard mock data | G-A2 | Substantial — live metrics API; Strategic Initiatives demo-only |
| Reconcile A034 mapping integrity | G-A1 | Open |
| Persist production CASB catalog | G-A3 | Partial |
| Complete PowerShell incident automation | G-A4 | Partial |
| Live risk / Zero Trust assessment | G-A6 | Open |
| Gate A Compliance Officer sign-off | Gate A | Pending |
| Multi-cloud asset sync depth | G-B1 | Substantial |
| End-to-end DR validation | G-B3 | Open |
| Phase 3 CSF 2.0 control validation | Phase 3 | Blocked — Gate A |

This profile establishes our **current-state baseline**. Moving to a certified **Target State Profile** requires Gate A sign-off, Gate B completion, and Phase 3 validation per the [Compliance Review remediation roadmap](NIST-CSF-2.0-Compliance-Review.md#remediation-roadmap-preliminary).

**Related:** [Improvement Focus Areas](ICT-Governance-Framework-Improvement-Focus-Areas.md) | [Project README](../../README.md#web-application)
