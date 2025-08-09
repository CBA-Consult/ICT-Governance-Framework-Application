# CI/CD Pipeline Guide

Version: 0.1 (Draft)
Date: 2025-08-08
Owner: DevOps

## CI
- Build, lint, test; SAST/SCA; generate SBOM; sign artifacts; cache deps.

## CD
- Multi-stage deploy: Dev → Test → Staging → Prod; policy gates; approvals.
- Deploy to AKS/Functions; infra via Bicep/Terraform; track with change tickets.

## Observability
- Publish test results, coverage; deployment dashboards; DORA metrics.

## Security
- Secrets via Key Vault; OIDC federated credentials; least privilege.

## References
- See: implementation-guides/deployment-guide.md
