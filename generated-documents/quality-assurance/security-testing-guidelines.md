# Security Testing Guidelines

Version: 0.1 (Draft)
Date: 2025-08-08
Owner: Security Engineering

## Scope
Security testing activities across SDLC: SAST, DAST, SCA, secrets scanning, IaC scans, penetration testing, threat modeling, and validation of zero-trust controls.

## Controls & Activities
- SAST: run per PR and nightly; block on high severity.
- DAST: authenticated scans against staging; OWASP Top 10 coverage.
- SCA: dependency checks with allow-list and license policy.
- IaC: Bicep/Terraform scans; Azure Policy compliance gates; drift detection.
- Secrets: pre-commit and CI scanners; automatic revoke/rotate playbooks.
- Pen Test: at major releases; scoped to critical services and APIs.
- Threat Modeling: STRIDE; review at epic level; update mitigations.

## Reporting & Remediation
- Findings triaged in JIRA; SLAs by severity; automated retest on fix.

## References
- See: technical-design/security-design-document.md, quality-assurance/test-plan.md
