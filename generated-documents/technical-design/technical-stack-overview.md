# Technical Stack Overview

Version: 0.1 (Draft)
Date: 2025-08-08
Owner: Architecture Team

## Application Platform
- Runtime: .NET 8 services (C#) and Node.js (TypeScript) for specific adapters
- Containers: Docker; Orchestrator: Azure Kubernetes Service (AKS)
- API Gateway: Azure API Management; Ingress: NGINX/AGIC

## Data & Storage
- Primary OLTP: Azure SQL Database (Business Critical)
- NoSQL/Docs: Azure Cosmos DB
- Analytics: Azure Synapse/ADLS Gen2; Azure Data Explorer for telemetry
- Caching: Azure Cache for Redis
- Messaging/Eventing: Azure Service Bus; Event Grid for external events

## Identity & Security
- Entra ID (Azure AD) for authN; RBAC for authZ; managed identities
- Secrets: Azure Key Vault; certificates; CMK for Always Encrypted columns
- Monitoring & SIEM: Azure Monitor, App Insights, Log Analytics; Microsoft Sentinel

## DevOps & Tooling
- Azure DevOps (Repos, Pipelines, Boards); GitHub Actions optional for OSS
- Container registry: Azure Container Registry (ACR)
- IaC: Bicep/Terraform; DSC for M365; Policy-as-Code via Azure Policy
- Artifact signing & provenance: SLSA, Sigstore/Cosign

## UI & Reporting
- Web UI: React (TypeScript); internal admin tools via Azure Static Web Apps
- BI: Power BI dashboards; embedded analytics; Grafana for SRE views

## Cross-Cutting
- Serialization: System.Text.Json; JSON schema validation
- Observability: OpenTelemetry tracing/metrics/logs; W3C tracecontext
- Resilience: Polly-based retry/circuit breaker; outbox/inbox patterns

## Environments
- Dev, Test, Staging, Prod with isolated subscriptions; policy gates per stage

## References
- See: technical-design/deployment-architecture.md, system-design-specification.md
