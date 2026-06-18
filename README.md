# Multi-Cloud Multi-Tenant ICT Governance Framework

[![Pester Tests](https://github.com/CBA-Consult/ICT-Governance-Framework-Application/actions/workflows/pester.yml/badge.svg)](https://github.com/CBA-Consult/ICT-Governance-Framework-Application/actions/workflows/pester.yml)
[![RPAS AEV Validation](https://github.com/CBA-Consult/ICT-Governance-Framework-Application/actions/workflows/rpas-aev-validation.yml/badge.svg)](https://github.com/CBA-Consult/ICT-Governance-Framework-Application/actions/workflows/rpas-aev-validation.yml)
[![RPAS Governance Validation](https://github.com/CBA-Consult/ICT-Governance-Framework-Application/actions/workflows/rpas-governance.yml/badge.svg)](https://github.com/CBA-Consult/ICT-Governance-Framework-Application/actions/workflows/rpas-governance.yml)

A comprehensive governance framework, documentation library, automation tooling, and web application for managing ICT governance across multi-tenant, multi-cloud environments. Built on the CBA Consult IT Management Framework, it provides policies, blueprints, validation pipelines, and operational tooling for AWS, Azure, Google Cloud Platform, and hybrid deployments.

**[Table of Contents](docs/Table-of-Contents.md)** | **[Documentation Hub](docs/README.md)** | **[Repository Guide](docs/REPOSITORY-GUIDE.md)**

## Quick Start

| Audience | Start here |
|----------|------------|
| New to the project | [Project scope and objectives](docs/project-management/A001-Project-Scope-and-Objectives.md) |
| Governance teams | [Core ICT Governance Framework](docs/governance-framework/core-framework/ICT-Governance-Framework.md) |
| Improvement priorities | [Improvement focus areas](docs/compliance/ICT-Governance-Framework-Improvement-Focus-Areas.md) |
| RPAS / agent governance | [RPAS Governance](#rpas-governance) and [Integration Guide](docs/implementation/guides/RPAS-Governance-Integration-Guide.md) |
| Client / service providers | [Business Continuity Services](#business-continuity-services) |
| Implementers | [Implementation summary](docs/implementation/summaries/IMPLEMENTATION-SUMMARY.md) |
| Developers | [Web application README](ict-governance-framework/README.md) and [Developer guide](DEVELOPER.md) |
| Contributors | [Contributing guidelines](CONTRIBUTING.md) |

## Overview

The framework addresses governance across complex tenant communities with varying security, compliance, and service requirements. It combines structured documentation, Infrastructure as Code templates, PowerShell automation, RPAS governance validation, and an interactive web portal.

**Core capabilities:**

- **Multi-tenant architecture governance** — tenant isolation, classification, and resource segregation
- **Cross-cloud management** — unified policies with platform-specific implementation guidance
- **Automated lifecycle management** — tenant onboarding, operations, and secure offboarding
- **Compliance automation** — tenant-specific regulatory monitoring and reporting
- **Cost optimization** — multi-tenant cost allocation, budgets, and chargeback
- **Drift detection** — compare deployed infrastructure against approved governance baselines
- **ADPA integration** — ADPA bridges the ICT Governance Framework to Compliance as Code and governance automation (see [ADPA as the governance bridge](#adpa-as-the-governance-bridge))
- **Business continuity** — staged path from content backup to full ICT recovery from Git across multi-cloud (see [Business Continuity Services](#business-continuity-services))

## Repository Structure

```
ICT-Governance-Framework-Application/
├── docs/                          # Primary documentation (policies, architecture, implementation)
├── governance/                    # RPAS-CM governance baseline and validation artifacts
├── ict-governance-framework/      # Web application, APIs, and frontend dashboard
├── azure-automation/              # PowerShell modules and Azure governance automation
├── blueprint-templates/           # Bicep/ARM templates and policy blueprints
├── Azure-IaC-Governance/          # Azure IaC governance patterns and templates
├── framework-evaluation/          # Framework assessment tools
├── generated-documents/           # Auto-generated documentation and templates
├── src/                           # Shared source modules (e.g. document generation)
├── tests/                         # Pester and Playwright test suites
├── .github/workflows/             # CI/CD, RPAS validation, and security scanning
├── README.md                      # This file
├── DEVELOPER.md                   # Local development and testing guide
└── LICENSE                        # MIT License
```

For a detailed breakdown by role and document category, see the [Repository Guide](docs/REPOSITORY-GUIDE.md).

## Framework Components

### Core framework documents

1. **[Multi-Cloud Multi-Tenant ICT Governance Framework](docs/governance-framework/core-framework/Multi-Cloud-Multi-Tenant-ICT-Governance-Framework.md)** — Multi-tenant governance structure, tenant lifecycle, and cross-cloud operations
2. **[ICT Governance Framework](docs/governance-framework/core-framework/ICT-Governance-Framework.md)** — Primary governance framework document
3. **[Strategic and Tactical IT Governance Overview](docs/governance-framework/core-framework/Strategic-Tactical-IT-Governance-Overview.md)** — Strategic vs. tactical governance tasks, roles, and escalation
4. **[Target Governance Framework](docs/governance-framework/target-framework/Target-Governance-Framework.md)** — Enhanced practices aligned with ISO/IEC 38500, ITIL 4, COBIT 2019, CMMI, and FAIR

### Infrastructure and automation

5. **[Multi-Tenant Infrastructure Blueprint](blueprint-templates/infrastructure-blueprints/multi-tenant-infrastructure.bicep)** — Bicep template for tenant-isolated infrastructure with security controls
6. **[Azure Automation](azure-automation/)** — PowerShell modules for policy compliance, dashboards, and governance reporting
7. **[Tenant Lifecycle Automation](ict-governance-framework/tenant-lifecycle-automation.js)** — Application-level tenant lifecycle management

### Integration and monitoring

8. **[IaC and Version Control Integration](docs/architecture/integration/ICT-Governance-IaC-Integration.md)** — Integrating governance with IaC and version control
9. **[Governance Metrics](docs/governance-framework/metrics/ICT-Governance-Metrics.md)** — KPIs, dashboards, and reporting mechanisms
10. **[Zero Trust Maturity Model](docs/architecture/target-state/Zero-Trust-Maturity-Model.md)** — Zero Trust assessment across six pillars

### RPAS governance baseline

11. **[RPAS-CM Core Framework](governance/RPAS.md)** — Authoritative guardrails, naming conventions, and versioning (CSR-42, v2.3.0)
12. **[RPAS Integration](governance/rpas/README.md)** — Project binding, checksum drift detection, and validation scripts
13. **[RPAS Governance Integration Guide](docs/implementation/guides/RPAS-Governance-Integration-Guide.md)** — Local registration, AEV validation, and CI enforcement

## Key Features

### Multi-tenant governance

- Four-tiered governance structure: Strategic Governance Council, Tenant Domain Owners, Cloud Platform Stewards, and Tenant Service Managers
- Tenant classifications: Enterprise, Government, Healthcare, Financial, and Standard
- Isolation models: Silo, Pool, and Hybrid
- Service tiers: Premium, Standard, and Basic with differentiated SLAs

### Cross-cloud operations

- Unified governance across AWS, Azure, GCP, and emerging platforms
- Platform-agnostic policies with cloud-specific implementation guidance
- Standardized patterns for multi-cloud tenant distribution

### Security and compliance

- Zero Trust architecture with tenant-specific security controls
- Support for GDPR, HIPAA, SOX, PCI-DSS, FedRAMP, and ISO 27001
- **NIST CSF 2.0: NOT CERTIFIED** — preliminary review complete; **remediate Gate A before full assessment** ([focus areas](docs/compliance/ICT-Governance-Framework-Improvement-Focus-Areas.md) · [review](docs/compliance/NIST-CSF-2.0-Compliance-Review.md))
- Automated remediation and proactive security monitoring

## RPAS Governance

The repository embeds the **Regulated Process Assurance System — Cloud Master (RPAS-CM)** baseline under [`governance/`](governance/README.md). RPAS-CM is a portable, project-agnostic governance envelope that ensures AI agents and automation operate with integrity, accountability, and deterministic auditability.

It combines **mechanical validation** (Atomic Execution & Validation — AEV) with **semantic governance assurance** (ADPA guardrails) into a single enforceable lifecycle: *Proposal → Decision → Execution*.

### What RPAS provides

- **Identity and standards** — Canonical naming conventions, versioning, and artifact prefixes (`TAR`, `COL`, `CSR`, `AMD`)
- **Safety protocols** — AEV gate logic and five governance guardrails (G1–G5)
- **Audit integrity** — Mandatory amendment logging, append-only lineage, and CSR-certified baselines
- **Operational boundaries** — Explicit rules for data tiers, authority boundaries, and orchestration
- **Drift detection** — Checksum-based validation of the committed governance baseline

### Core methodology documents

| Document | Purpose |
|----------|---------|
| [RPAS.md](governance/RPAS.md) | Core framework, guardrails (G1–G5), and naming conventions |
| [RPAS-TAR.md](governance/RPAS-TAR.md) | Traceability, Authority & Responsibility |
| [RPAS-COL.md](governance/RPAS-COL.md) | Collision-prevention protocol |
| [RPAS-TAR-COL.md](governance/RPAS-TAR-COL.md) | Combined TAR/COL matrix |
| [RPAS-ESC.md](governance/RPAS-ESC.md) | Escalation procedures |
| [RPAS-HIL.md](governance/RPAS-HIL.md) | Human-in-the-loop requirements |
| [RPAS-OPM.md](governance/RPAS-OPM.md) | Operational management |
| [RPAS-PRE.md](governance/RPAS-PRE.md) | Pre-execution checks |
| [RPAS-TCL.md](governance/RPAS-TCL.md) | Traceability control logic |
| [CONTRIBUTING.md](governance/CONTRIBUTING.md) | RPAS contribution and amendment rules |

Amendment records (`AMD-*.md`) and release notes (`v2.x.x-Release-Notes.md`) document state transitions and hardening history.

### Repository layout

```
governance/
├── RPAS*.md                       # Core methodology definitions
├── AMD-*.md                       # Amendment records
├── visuals/                       # Governance flow diagrams
├── security/archive/              # Remediation records
└── rpas/                          # Project integration scaffold
    ├── artifacts/                 # ADPA, ARM, and AEV control metadata
    ├── hooks/                     # Pre-commit hook templates
    ├── scripts/                   # Registration and validation tooling
    ├── manifest.json              # Baseline version and required files
    ├── project.binding.json       # Project-specific RPAS binding
    └── governance_checksum.json   # Committed checksum for drift detection
```

The current integration mode is `vendor-scaffold` — the full RPAS baseline is committed in-repo and can later be replaced with a canonical upstream source via git submodule or subtree without changing the enforcement model.

### Commands

Run from the repository root:

```bash
npm run governance:register    # Install local registration state and pre-commit hook
npm run governance:validate    # Validate required files, bindings, and checksum
npm run governance:checksum    # Refresh checksum after intentional baseline changes
```

### Enforcement

| Layer | What it checks |
|-------|----------------|
| **Local registration** | Writes `governance/rpas/.state/registration.json` and installs the pre-commit hook template |
| **AEV validation** | Required RPAS files, project binding, ADPA/ARM/AEV artifacts, and checksum integrity |
| **CI (GitHub Actions)** | [RPAS AEV Validation](.github/workflows/rpas-aev-validation.yml) and [RPAS Governance Validation](.github/workflows/rpas-governance.yml) run on every push and pull request |

If the checksum is stale after a baseline change, run `npm run governance:checksum` and commit the updated `governance_checksum.json` before validation will pass.

### The five guardrails (G1–G5)

1. **G1 — Authority Boundary** — AI proposes, humans decide, systems execute
2. **G2 — Lifecycle Integrity** — Every state transition follows the ritual sequence
3. **G3 — Evidence & Lineage** — Every artifact is fully traceable and append-only
4. **G4 — Determinism** — Execution is predictable, idempotent, and replay-safe
5. **G5 — Read vs. Act** — Experience tiers may observe and advise; only the Orchestrator may act

See [RPAS.md](governance/RPAS.md) for the full guardrail definitions and [RPAS Governance Integration Guide](docs/implementation/guides/RPAS-Governance-Integration-Guide.md) for setup and upgrade instructions.

### ADPA as the governance bridge

**ADPA** (Architecture Decision and Policy Alignment) is the translation layer between human-readable governance and machine-enforceable compliance. It connects the **ICT Governance Framework** — policies, standards, and strategic intent — to **Compliance as Code** and **governance automation** so that decisions made in the framework become traceable, testable, and continuously enforced.

```mermaid
flowchart LR
    subgraph framework [ICT Governance Framework]
        POL[Policies and Standards]
        DEC[Architecture Decisions]
        REQ[Compliance Requirements]
    end

    subgraph adpa [ADPA Bridge]
        DOC[ADPA Documents]
        TPL[Templates and Schemas]
        META[TAR-COL Traceability]
        BASE[Entity Baselines]
    end

    subgraph codified [Compliance as Code]
        IAC[IaC Templates]
        PAC[Policy-as-Code]
        CSR[CSR-Certified Baselines]
        CHECK[Automated Validation]
    end

    subgraph automation [Governance Automation]
        CI[CI/CD and AEV Gates]
        AZ[Azure Automation]
        DRIFT[Drift Detection]
        TELEM[Telemetry Compliance]
    end

    framework --> adpa
    adpa --> codified
    codified --> automation
    automation -->|feedback| adpa
    automation -->|evidence| framework
```

#### What ADPA translates

| From (ICT Governance Framework) | Through ADPA | To (Compliance as Code) | Enforced by (Governance Automation) |
|--------------------------------|--------------|-------------------------|-------------------------------------|
| Governance policies and standards | Policy alignment documents | Azure Policy, Bicep modules, M365DSC config | Pipeline validation, policy compliance scans |
| Architecture decisions | ADPA decision records with evidence metadata | Reference architectures, approved IaC patterns | Architecture validation in CI/CD |
| Regulatory and compliance requirements | Requirement traceability templates | Compliance controls in code, entity baselines | Continuous compliance monitoring, audit reports |
| Change and amendment rituals | RPAS `TAR-COL` metadata and AMD records | Version-controlled baseline updates | AEV gates, checksum validation, pre-commit hooks |
| Entity definitions (tenant, workload, subscription) | Certified golden-state baselines | Per-entity IaC and configuration state | Drift detection, telemetry comparison, remediation workflows |

Without ADPA, governance documents and automated enforcement remain disconnected. ADPA ensures every codified control traces back to an approved decision, every automation action produces auditable evidence, and every drift event can be classified against a known baseline.

#### Integration layers

| Layer | Role | Current foundation |
|-------|------|--------------------|
| **ICT Governance Framework** | Strategic and tactical policies, roles, and compliance frameworks | [`docs/governance-framework/`](docs/governance-framework/core-framework/ICT-Governance-Framework.md), [`docs/policies/`](docs/policies/governance/ICT-Governance-Policies.md) |
| **ADPA bridge** | Decision records, policy alignment, traceability, and baseline certification | [ADPA control artifact](governance/rpas/artifacts/ADPA.control.json), [ADPA-generated documents](generated-documents/), [evidence templates](governance/rpas/templates/) |
| **Compliance as Code** | Codified policies, infrastructure templates, and certified baselines | [`blueprint-templates/`](blueprint-templates/), [IaC integration guide](docs/architecture/integration/ICT-Governance-IaC-Integration.md), [CSR-42 baseline](governance/rpas/artifacts/CSR-42.json) |
| **Governance automation** | Automated validation, monitoring, drift detection, and remediation | [`azure-automation/`](azure-automation/), [RPAS validation scripts](governance/rpas/scripts/), [continuous compliance monitoring](azure-automation/Continuous-Compliance-Monitoring.ps1) |
| **Entity baseline** | Certified golden state per governed entity | [Governance checksum](governance/rpas/governance_checksum.json), IaC golden state, [Aspire manifest drift](governance/rpas/scripts/Test-RpasDependencyDrift.ps1) |
| **Telemetry compliance** | Real-time signals compared against baselines | [Real-time monitoring summary](docs/implementation/summaries/Real-Time-Monitoring-Implementation-Summary.md), [Critical violations dashboard](Real-Time-Critical-Violations-Dashboard.json) |

#### Drift taxonomy

RPAS-CM classifies deviations using a formal [drift taxonomy](governance/rpas/scripts/drift-taxonomy.md):

- **Governance drift** — cryptographic ledger / checksum mismatch against the committed baseline
- **Architectural drift** — Aspire manifest or dependency topology changes
- **Process drift** — AEV gate or ritual sequence violations
- **Documentation drift** — metadata or traceability field mismatches
- **Observability drift** — telemetry gaps or missing instrumentation
- **Security drift** — attack surface or Zero Trust posture changes

Each drift type maps to a change-request path and, where applicable, a remediation workflow.

#### Real-time compliance from telemetry

Telemetry feeds (Azure Monitor, Log Analytics, Sentinel, CASB/SIEM, endpoint inventory, and IaC validation) are being integrated to close the loop between **static baselines** and **live environment state**:

1. **Baseline establishment** — ADPA documents and templates define the approved entity state (IaC, M365 config, app catalog)
2. **Continuous scanning** — Policy compliance, resource graph queries, configuration scans, and security telemetry compare live state to baseline
3. **Drift classification** — Deviations are categorized (configuration, resource, access, security, compliance, application/Shadow IT)
4. **Real-time alerting** — Violations surface through dashboards and multi-channel alerts with defined SLAs (critical: < 2 min detection)
5. **Governed remediation** — Changes flow back through PR-based IaC updates and RPAS amendment rituals

See also: [IaC integration guide](docs/architecture/integration/ICT-Governance-IaC-Integration.md), [Microsoft365DSC integration](docs/architecture/integration/Integrating%20Microsoft365DSC.md), and [real-time compliance monitoring framework](docs/compliance/monitoring/).

#### Roadmap focus

Active integration work targets:

- Strengthening ADPA as the canonical bridge from framework policies to Compliance as Code artifacts
- Binding ADPA document generation to RPAS `TAR-COL` traceability and amendment rituals
- Extending entity baselines from repository-level checksums to per-tenant/per-workload golden states
- Closing the loop: telemetry drift → ADPA-classified change request → codified remediation → automation
- Unifying governance, compliance, and telemetry signals in the web dashboard

## Business Continuity Services

The framework delivers **Business Continuity Services** as a staged client offering — from protecting content alone, through combined infrastructure and content backup, to **rebuilding the entire ICT estate from a Git repository** across Azure, AWS, GCP, and hybrid clouds under RPAS governance.

The Git repository is the **authoritative recovery source**: governance documents, Compliance as Code templates, automation scripts, tenant configuration, and application definitions together describe not just *what to restore* but *how the full ICT infrastructure should be running*.

```mermaid
flowchart TB
    subgraph s1 [Stage 1: Content Backup]
        C1[Files, databases, M365 content]
        C2[Recovery Services Vault / cloud backup]
    end

    subgraph s2 [Stage 2: Infrastructure and Content Backup]
        I1[IaC templates in Git]
        I2[Configuration and policy snapshots]
        I3[Content plus infra state protected]
    end

    subgraph s3 [Stage 3: Git-to-Cloud ICT Recovery]
        G1[Git repository as source of truth]
        G2[Deploy to Azure / AWS / GCP]
        G3[Entire ICT stack back online]
    end

    subgraph s4 [Stage 4: RPAS-Governed Continuation]
        R1[CSR-certified baseline restored]
        R2[Drift validation and telemetry]
        R3[Content continuation with compliance]
    end

    s1 --> s2
    s2 --> s3
    s3 --> s4
    s4 -->|amendments| G1
```

### Continuity maturity stages

| Stage | Service scope | Recovery question answered | Framework support |
|-------|---------------|---------------------------|-------------------|
| **1. Content backup** | Files, databases, SaaS content | *Can we restore the data?* | [Recovery Services Vault](blueprint-templates/infrastructure-blueprints/multi-tenant-infrastructure.bicep), [tenant backup config](ict-governance-framework/config/sample-tenant-config.json) |
| **2. Infrastructure and content backup** | IaC definitions, policies, configs, plus content | *Can we restore data **and** the infrastructure that serves it?* | [`blueprint-templates/`](blueprint-templates/), [`Azure-IaC-Governance/`](Azure-IaC-Governance/), [M365DSC integration](docs/architecture/integration/Integrating%20Microsoft365DSC.md) |
| **3. Full ICT recovery from Git** | Entire ICT estate redeployed from version-controlled repo to target clouds | *Can the **whole ICT infrastructure** be back up and running from Git?* | [IaC integration guide](docs/architecture/integration/ICT-Governance-IaC-Integration.md), [`azure-automation/`](azure-automation/), [multi-tenant blueprint](blueprint-templates/infrastructure-blueprints/multi-tenant-infrastructure.bicep), CI/CD workflows |
| **4. RPAS-governed continuation** | Stateful, compliant, telemetry-validated operations post-recovery | *Does recovered infrastructure remain **governed, certified, and continuous**?* | RPAS/AEV gates, ADPA baselines, [drift detection](governance/rpas/scripts/drift-taxonomy.md), [real-time monitoring](docs/implementation/summaries/Real-Time-Monitoring-Implementation-Summary.md) |

Clients advance through these stages without disruptive replatforming — each stage extends the previous one.

### Git repository as the ICT recovery source

When infrastructure and governance live in Git, disaster recovery becomes **reproducible deployment** rather than manual rebuild. The repository holds everything needed to reconstruct the ICT estate:

```
recovery-source/  (this repository)
├── docs/                          # Governance policies and procedures
├── governance/                    # RPAS baseline, amendments, CSR certification
├── blueprint-templates/           # Bicep/ARM — Azure infrastructure
├── Azure-IaC-Governance/          # Azure governance patterns
├── azure-automation/              # PowerShell deployment and compliance scripts
├── ict-governance-framework/      # Application platform and APIs
├── generated-documents/           # ADPA-generated client and project artifacts
└── .github/workflows/             # CI/CD pipelines for validated deployment
```

**Multi-cloud recovery flow:**

1. **Checkout** — Clone the certified Git baseline (CSR-tagged release or main branch)
2. **Validate** — Run RPAS/AEV gates and Compliance as Code checks before any deployment
3. **Deploy infrastructure** — Apply Bicep/Terraform templates to Azure, AWS, or GCP targets
4. **Restore configuration** — Apply M365DSC tenant config, policies, and tenant settings from code
5. **Restore content** — Replay content backups into the newly provisioned infrastructure
6. **Verify** — Drift detection and telemetry confirm the live estate matches the governed baseline
7. **Continue** — Content continuation service keeps operations running under RPAS control

This model means recovery is not dependent on a single cloud region or vendor — the **same Git repo** can rebuild ICT infrastructure wherever the client needs it.

### Content continuation service

At the highest maturity stage, **content continuation** goes beyond backup:

- **Stateful recovery** — restored environments rejoin the RPAS-governed baseline, not an ungoverned snapshot
- **Governance-preserving failover** — amendment records, CSR lineage, and compliance evidence survive region or cloud transitions
- **Resilient multi-tenant cloud** — tenant-isolated infrastructure with backup/DR, geo-redundancy, and tiered SLAs (Premium, Standard, Basic)
- **Real-time continuity assurance** — telemetry confirms content, controls, and compliance posture during and after recovery
- **Audit-ready evidence** — every recovery action produces traceable ADPA/RPAS evidence

Target objectives: **RTO ≤ 4 hours**, **RPO ≤ 1 hour**, with compliance drift detected within 30 minutes of configuration change ([NFR backup/recovery](docs/project-management/requirements/A030-Non-Functional-Requirements-Document.md)).

### Service provider delivery path

For MSPs and cloud providers offering Business Continuity Services to clients:

1. **Protect** — Enable content backup and Recovery Services Vault per tenant
2. **Codify** — Move infrastructure, policies, and configuration into Git with ADPA traceability
3. **Automate** — CI/CD pipelines deploy and validate across cloud targets from the repository
4. **Govern** — RPAS lifecycle rituals certify baselines and control amendments
5. **Assure** — Content continuation SLAs, dashboards, and governed recovery playbooks

See [multi-tenant implementation guide](docs/implementation/multi-cloud-multi-tenant-implementation.md), [business continuity testing](azure-automation/Test-ZeroTrustDeployment.ps1), and [IaC management](docs/architecture/infrastructure/IaC%20Infrastructure%20as%20Code%20Management.md).

### Example: ransomware attack and full state recovery

The following summarises how the **RPAS Rollback & Recovery Service** responds when a client suffers a ransomware attack. The [full walkthrough](docs/implementation/guides/RPAS-Rollback-Recovery-Ransomware-Example.md) includes timelines, commands, and audit deliverables.

**Scenario:** Contoso Health (Enterprise Healthcare tenant) — phishing email triggers ransomware that encrypts synced M365 files and attempts lateral movement to Azure VMs. Last certified baseline: **CSR-42**.

| Phase | Time | Action |
|-------|------|--------|
| **Detect** | T+0–15 min | CASB ransomware policy, Sentinel correlation, and continuous compliance monitoring raise critical alerts; human team isolates VM, revokes sessions, opens AMD record |
| **Assess** | T+15–45 min | RPAS drift taxonomy classifies security, configuration, and governance drift; team selects **full state recovery** to CSR-42 rather than in-place repair |
| **RPAS rollback** | T+45–90 min | `Restore-RpasBaseline.ps1 -CsrId CSR-42` restores Git to last SAFE-certified commit; AEV gates validate checksum and artifact integrity |
| **Git-to-cloud rebuild** | T+90 min–3 h | Deploy clean infrastructure to recovery region from Bicep/M365DSC in repo; restore VM/DB from Recovery Services Vault; restore M365 content from pre-encryption backup |
| **Verify & continue** | T+3–4 h | Drift reports, policy scans, and telemetry confirm baseline match; traffic fails over; content continuation resumes under RPAS control |
| **Post-incident** | T+4 h+ | AMD closure, ADPA hardening decisions, audit-ready evidence package for client and regulators |

**Recovery outcome:** RTO ~3.5 h (target ≤ 4 h), RPO ~45 min (target ≤ 1 h) — entire ICT estate back online from Git with governed, certified, auditable state.

```powershell
# Core rollback command — restore last certified RPAS baseline
./governance/rpas/scripts/Restore-RpasBaseline.ps1 -CsrId CSR-42

# Validate before redeployment
npm run governance:validate

# Confirm no remaining drift after recovery
./governance/rpas/scripts/New-RpasDriftReport.ps1
```

## Web Application

The [`ict-governance-framework/`](ict-governance-framework/) directory contains the interactive governance dashboard — a Node.js/Express backend with a Next.js frontend providing:

- Role-based access control and user management
- Secure score and compliance dashboards
- Document management and reporting
- REST APIs for governance data and integrations

**Prerequisites:** Node.js 16+, PostgreSQL 12+

```bash
cd ict-governance-framework
npm install
cp .env.example .env   # configure database and JWT secrets
node server.js         # API on http://localhost:4000
npm run dev            # frontend on http://localhost:3000
```

See the [web application README](ict-governance-framework/README.md) for complete setup instructions.

## Getting Started

### For new users

1. Review the [documentation hub](docs/README.md)
2. Read the [project scope and objectives](docs/project-management/A001-Project-Scope-and-Objectives.md)
3. Study the [core governance framework](docs/governance-framework/core-framework/ICT-Governance-Framework.md)
4. Review [governance policies](docs/policies/governance/ICT-Governance-Policies.md)

### For implementers

1. Follow the [implementation summary](docs/implementation/summaries/IMPLEMENTATION-SUMMARY.md)
2. Review [architecture documentation](docs/architecture/)
3. Explore [Azure automation scripts](azure-automation/) and [blueprint templates](blueprint-templates/)
4. Run RPAS governance validation (see above)

### For developers

1. Read [DEVELOPER.md](DEVELOPER.md) for local testing with Pester
2. Set up the [web application](ict-governance-framework/README.md)
3. Run Playwright tests: `npm test`

### For administrators

1. Review [team management](docs/project-management/team-management/) documentation
2. Implement [governance metrics](docs/governance-framework/metrics/)
3. Set up [compliance monitoring](docs/compliance/monitoring/)
4. Deploy [training materials](docs/training/materials/)

## Implementation Approach

1. **Foundation** — Establish governance structure and core policies
2. **Integration** — Connect governance with existing processes and tools
3. **Automation** — Implement validation, compliance checking, and RPAS gates
4. **Measurement** — Set up metrics and reporting
5. **Training** — Develop awareness and operational capabilities

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md) before submitting changes.

1. Create a feature branch from `main`
2. Make changes following the established documentation structure
3. Run relevant tests (Pester, Playwright, or RPAS validation as applicable)
4. Submit a pull request with a clear description of your changes

## License and Usage

This project is released under the [MIT License](LICENSE). See also:

- [Usage Agreement](USAGE-AGREEMENT.md) — Open usage terms and conditions
- [Security Policy](SECURITY.md) — Security standards and vulnerability reporting

Organizations implementing this framework are responsible for ensuring compliance with applicable laws and regulations. The framework provides guidance but does not guarantee compliance with GDPR, HIPAA, SOX, ISO 27001, or other regulatory standards.

## Background

The framework evolved from the original CBA Consult vision of blueprint-based governance in multi-cloud environments. Key principles include:

- **Blueprint-based governance** — Define and enforce governance boundaries through IaC
- **Secure score comparison** — Compare current posture against blueprint-initiated baselines
- **Drift management** — Detect and remediate deviations from approved governance state
- **Version control** — Manage application and governance framework versions in Git
- **Infrastructure as Code** — Maintain infrastructure definitions in version-controlled repositories with PR-based approval

For process ownership and drift management best practices, see the [Governance Framework Best Practices wiki](https://github.com/CBA-Consult/ICT-Governance-Framework-Application/wiki/Governance-Framework-Best-Practices-and-process-ownership-and-drift-within-the-governance-framework).

## Mobile Application

A companion mobile application provides end-user assessment of compliance and security posture:

- [ICT Governance Framework Mobile App (Adobe XD prototype)](https://xd.adobe.com/view/0ca1c123-cf98-43de-8aab-a71dad328273-59f2)

## Related Links

- [Governance Framework Best Practices (Wiki)](https://github.com/CBA-Consult/ICT-Governance-Framework-Application/wiki/Governance-Framework-Best-Practices-and-process-ownership-and-drift-within-the-governance-framework)
- [Contract Management Integration (PwC)](https://pwc.to/3LBQCzp)
- [Information Governance Overview](InformationOverview.md)
