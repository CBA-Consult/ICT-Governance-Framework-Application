# Deployment Architecture

Version: 1.0  
Date: 2025-08-08  
Owner: Platform Engineering

## Environments
- Dev, Test, Pre-Prod, Prod; isolation by subscriptions and RGs

## Topology
- AKS (zonal); API Gateway/APIM; Service Bus; SQL/Cosmos; Storage; App Insights/Log Analytics; Key Vault; Private Links

## Networking
- Hub-spoke; private DNS; WAF; NSGs; Micro-segmentation; egress control

## Scaling & Resilience
- HPA; PDBs; multi-AZ; RTO<4h, RPO<1h; backup/restore runbooks

## Release Strategy
- Blue/green, canary; feature flags; rollback automation

## Compliance & Policy
- Policy assignments at Mgmt Group/Subscription; diagnostics-on-by-default; tag policies

## Observability
- Golden signals; SLO dashboards; alert routing; synthetic checks

## References
- generated-documents/core-analysis/system-architecture.md
