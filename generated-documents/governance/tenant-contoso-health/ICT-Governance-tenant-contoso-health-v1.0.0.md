# ADPA template: Tenant Governance Documentation

---
adpa:
  templateId: tenant-governance-documentation
  version: 1.0.0
  projectId: ADPA-ICT-GOV
  frameworkSource: docs/implementation/guides/Enterprise-Security-Seven-Pillar-Implementation-Plan.md
  outputFormat: docx
  tarCol:
    artifactId: RPAS-CM-ADPA-003
    origin: Generated
    csrVersion: v2.3.0+CSR-42
---

# ICT Governance Documentation

## ICT Governance Documentation — Contoso Health (demo)

| Field | Value |
|-------|-------|
| Tenant | Contoso Health (demo) (tenant-contoso-health) |
| Document version | 1.0.0 |
| Generated | 2026-06-20 |
| CSR baseline | CSR-42 v2.3.0 |
| Primary cloud | azure |
| Classification | Internal — Governance |

---

## 1. Executive summary

This document defines the **governance requirements**, **approved ICT infrastructure**, and **seven-pillar compliance posture** for **Contoso Health (demo)**. It serves as the authoritative reference for auditors, domain owners, and infrastructure teams implementing and maintaining Compliance-as-Code and Infrastructure-as-Code artifacts.

Contoso Health (demo) operates on **azure** with enabled providers: azure, aws. This baseline includes **1** approved governance requirement(s) and **7** approved infrastructure component(s) across the seven security pillars. Current telemetry risk score: **7.5/10** (source: sentinel).

---

## 2. Governance requirements

The following requirements are registered for this tenant. Each requirement maps to a security pillar and drives IaC/CaC artifact generation.

### 2.1 Mandatory MFA for all privileged and standard users

| Attribute | Value |
|-----------|-------|
| Requirement ID | identity-mfa-requirement |
| Pillar | identity |
| Priority | critical |
| Status | **approved** |
| Control objective | Enforce strong authentication and least-privilege access across all cloud subscriptions. |

**Statement:** All users accessing corporate workloads must authenticate with multi-factor authentication. Privileged roles require JIT elevation with time-bound access. Guest access is restricted to approved collaboration scenarios.

**Rationale:** Aligns with Zero Trust maturity target and NIST CSF PR.AA controls. Reduces credential theft risk identified in Sentinel telemetry.

**Acceptance criteria:**

- 100% of users enrolled in MFA within 30 days
- Privileged roles use JIT elevation with maximum 4-hour sessions
- Guest users blocked from administrative roles
- Conditional access policies enforce compliant device state

**Framework mappings:**

- NIST-CSF-2.0 PR.AA-01: Identities and credentials are managed
- ISO-27001 A.9.2.1: User registration and de-registration

**Scope:** {"subscriptions":["sub-contoso-prod-001","sub-contoso-dev-002"],"workloads":["microsoft-365","azure-platform"],"cloudProviders":["azure"]}

### 2.2 Hub-spoke network segmentation with default deny

| Attribute | Value |
|-----------|-------|
| Requirement ID | network-segmentation-requirement |
| Pillar | network |
| Priority | high |
| Status | **draft** |
| Control objective | Isolate workloads by sensitivity tier and enforce zero-trust network access. |

**Statement:** Production workloads must be deployed in a hub-spoke topology with default-deny ingress. Private endpoints required for PaaS services handling PHI data.


**Acceptance criteria:**

- All production subnets use default-deny NSG rules
- Hub-spoke peering configured with no transitive routing to internet
- Private endpoints enforced for storage and database services

**Framework mappings:**

- NIST-CSF-2.0 PR.PS-01: Network infrastructure is managed

**Scope:** {"subscriptions":["sub-contoso-prod-001"],"resourceGroups":["rg-contoso-prod-network"],"cloudProviders":["azure"]}


---

## 3. Approved ICT infrastructure

The components below constitute the **approved ICT infrastructure baseline** for this tenant. Only configurations derived from these approved blueprints may be deployed to production without a governance amendment.

### 3.1 Azure AD / Entra ID Identity Platform

| Attribute | Value |
|-----------|-------|
| Component ID | azure-identity-platform |
| Pillar | identity |
| Status | **approved** |
| Cloud | azure |
| Blueprint | `blueprint-templates/security-blueprints/identity-access-management.bicep` |

Central identity provider with conditional access, MFA, and JIT privileged access for all corporate workloads.

**Services:**

- Microsoft Entra ID
- Conditional Access
- Privileged Identity Management
- Break Glass accounts

**Compliance controls:** PR.AA-01, PR.AA-03, GV.RR-02

### 3.2 Endpoint Management & Device Compliance

| Attribute | Value |
|-----------|-------|
| Component ID | endpoint-management |
| Pillar | devices |
| Status | **approved** |
| Cloud | azure |
| Blueprint | `blueprint-templates/infrastructure-blueprints/multi-tenant-infrastructure.bicep` |

Intune-managed endpoints with compliance baselines, encryption, and minimum OS enforcement.

**Services:**

- Microsoft Intune
- Defender for Endpoint
- Device compliance policies

**Compliance controls:** ID.AM-01, PR.PS-02

### 3.3 Approved Software & SaaS Catalog

| Attribute | Value |
|-----------|-------|
| Component ID | approved-software-catalog |
| Pillar | software |
| Status | **approved** |
| Cloud | azure |
| Blueprint | `blueprint-templates/policy-templates/technology-selection-policy.md` |

Governed application catalog with CASB shadow-IT detection and vulnerability gating for third-party SaaS.

**Services:**

- Defender for Cloud Apps
- Software catalog API
- SBOM registry

**Compliance controls:** GV.SC-01, ID.RA-01

### 3.4 Hub-Spoke Network Architecture

| Attribute | Value |
|-----------|-------|
| Component ID | hub-spoke-network |
| Pillar | network |
| Status | **approved** |
| Cloud | azure |
| Blueprint | `blueprint-templates/security-blueprints/zero-trust-architecture.bicep` |

Zero-trust hub-spoke topology with default-deny NSGs, private endpoints for PaaS, and Azure Firewall.

**Services:**

- Virtual WAN Hub
- Azure Firewall
- Private Endpoints
- NSG default-deny rules

**Compliance controls:** PR.PS-01, DE.CM-01

### 3.5 Data Classification & Protection

| Attribute | Value |
|-----------|-------|
| Component ID | data-protection-platform |
| Pillar | data |
| Status | **approved** |
| Cloud | azure |
| Blueprint | `blueprint-templates/compliance-blueprints/gdpr-compliance.bicep` |

Sensitivity labels, encryption at rest and in transit, DLP policies for PHI and confidential data.

**Services:**

- Microsoft Purview
- Azure Key Vault
- Storage encryption
- DLP policies

**Compliance controls:** PR.DS-01, PR.DS-02, GV.PO-01

### 3.6 Security Operations & SIEM

| Attribute | Value |
|-----------|-------|
| Component ID | security-operations |
| Pillar | secops |
| Status | **approved** |
| Cloud | azure |
| Blueprint | `blueprint-templates/policy-templates/incident-response-policy.md` |

Sentinel SIEM with automated incident ingest, FAIR risk scoring, and SLA-tracked response workflows.

**Services:**

- Microsoft Sentinel
- Defender XDR
- Governance incident API
- FAIR risk engine

**Compliance controls:** DE.AE-01, DE.CM-03, RS.AN-01

### 3.7 Backup & Disaster Recovery

| Attribute | Value |
|-----------|-------|
| Component ID | backup-disaster-recovery |
| Pillar | resilience |
| Status | **approved** |
| Cloud | azure |
| Blueprint | `blueprint-templates/infrastructure-blueprints/multi-cloud-infrastructure.bicep` |

Geo-redundant backup vaults, cross-region replication, and tested recovery runbooks aligned to RPO/RTO targets.

**Services:**

- Azure Backup
- Site Recovery
- Recovery Services Vault
- Git-to-cloud recovery

**Compliance controls:** RC.RP-01, RC.CO-02


---

## 4. Seven-pillar compliance matrix

The enterprise security map defines five Zero Trust protection pillars plus two operational engines. This section maps tenant requirements and approved infrastructure to each pillar.

| Pillar | NIST CSF | Compliance status | Evidence |
|--------|----------|-------------------|----------|
| **Identity** | PR.AA, GV.RR | **Compliant** | 1 approved requirement(s), 1 approved component(s) |
| **Devices** | ID.AM, PR.PS | **Partial** | 0 approved, 0 draft requirement(s); 1 component(s) |
| **Software** | GV.SC, ID.RA | **Partial** | 0 approved, 0 draft requirement(s); 1 component(s) |
| **Network** | PR.PS, DE.CM | **Partial** | 0 approved, 1 draft requirement(s); 1 component(s) |
| **Data** | PR.DS, GV.PO | **Partial** | 0 approved, 0 draft requirement(s); 1 component(s) |
| **SecOps** | DE.AE, DE.CM, RS.AN | **Partial** | 0 approved, 0 draft requirement(s); 1 component(s) |
| **Resilience** | RC.RP, RC.CO | **Partial** | 0 approved, 0 draft requirement(s); 1 component(s) |

---

## 5. Requirement-to-infrastructure traceability

| Requirement | Pillar | Approved component | IaC blueprint | Compliance status |
|-------------|--------|--------------------|---------------|-------------------|
| Mandatory MFA for all privileged and standard users | identity | Azure AD / Entra ID Identity Platform | `blueprint-templates/security-blueprints/identity-access-management.bicep` | Compliant |
| Hub-spoke network segmentation with default deny | network | Hub-Spoke Network Architecture | `blueprint-templates/security-blueprints/zero-trust-architecture.bicep` | Partial |

---

## 6. Compliance-as-Code and IaC references

| Pillar | Governance artifact template | Azure (Bicep) | Compliance policy |
|--------|------------------------------|---------------|-------------------|
| identity | `identity-access-control` | Bicep / Terraform | Azure Policy / AWS Config |
| devices | `device-compliance` | Bicep / Terraform | Azure Policy / AWS Config |
| software | `software-supply-chain` | Bicep / Terraform | Azure Policy / AWS Config |
| network | `network-segmentation` | Bicep / Terraform | Azure Policy / AWS Config |
| data | `data-protection` | Bicep / Terraform | Azure Policy / AWS Config |
| secops | `security-monitoring` | Bicep / Terraform | Azure Policy / AWS Config |
| resilience | `resilience-backup` | Bicep / Terraform | Azure Policy / AWS Config |

---

## 7. Roles and approval

| Role | Responsibility | Name / contact |
|------|----------------|----------------|
| Tenant owner | Accountable for governance baseline | Contoso Health (demo) |
| CISO / Security lead | Security pillar compliance | |
| Infrastructure lead | Approved IaC deployment | |
| Compliance officer | Audit evidence and attestation | |

**Approved by:** ICT Governance Council  
**Approval date:** 2026-06-18

---

## 8. Document control

| Version | Date | Author | Change summary |
|---------|------|--------|----------------|
| 1.0.0 | 2026-06-20 | ADPA Generator | Initial governance documentation |

*Generated by ADPA ICT Governance Framework — template `tenant-governance-documentation`*
