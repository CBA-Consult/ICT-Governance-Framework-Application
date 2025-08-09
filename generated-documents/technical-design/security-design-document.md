# Security Design Document

Version: 1.0  
Date: 2025-08-08  
Owner: Security Architecture

## 1. Security Model
- Zero-trust; assume breach; verify explicitly; least privilege
- Identities: Users, services, workloads; Entra ID + Managed Identity

## 2. Authentication & Authorization
- MFA required; Conditional Access; RBAC + ABAC policies
- JIT elevation for privileged ops; PIM integration

## 3. Secrets & Keys
- Azure Key Vault; CMK; rotation policies; DKE for sensitive data

## 4. Data Protection
- TLS 1.3; AES-256 at rest; field-level encryption where needed
- Data classification, masking in non-prod; DLP for exports

## 5. Threat Modeling
- STRIDE per service; top-10 abuse cases; mitigations and controls

## 6. Logging & Audit
- Centralized, tamper-evident audit logs; retention by policy
- Forensics: immutable storage tier + KQL playbooks

## 7. Secure SDLC
- SAST/DAST/Dep scans; IaC policy validation in CI
- Supply chain: signed artifacts, provenance (SLSA)

## 8. Incident Response
- Runbooks, severity matrix, RACI; tabletop cadence; post-incident reviews

## 9. Compliance Mapping
- ISO 27001, SOC2, GDPR, COBIT control alignment

References:  
- generated-documents/core-analysis/requirements-specification.md
