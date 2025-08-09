# Integration Design

Version: 0.1 (Draft)
Date: 2025-08-08
Owner: Platform Integration Team

## Purpose
Defines integration patterns, connectors, and data contracts for first- and third-party systems (ITSM, CMDB, Identity, Cost Management, Security, Compliance) to ensure reliable, secure, and observable interoperability.

## Principles
- API-first, contract-driven (OpenAPI/JSON Schema); avoid tight coupling.
- Event-driven where feasible (Azure Service Bus); idempotent, retry-safe operations.
- Least-privilege credentials in Key Vault; secrets rotated; short-lived tokens.
- Observability: correlation IDs, metrics, and audit logs for each integration call.

## Target Systems
- ITSM: ServiceNow/Jira Service Management (incidents, changes, CMDB CIs)
- Identity: Entra ID (users, groups, roles), SCIM for provisioning
- Cost: Azure Cost Management/Exports (cost records, budgets)
- Cloud Governance: Azure Policy, Azure Resource Graph, ARM (deployments)
- Security: Microsoft Defender, Sentinel (alerts, incidents)
- Collaboration: Microsoft 365 (Teams, SharePoint for evidence review workflows)

## Patterns
- Pull via REST with ETags and delta tokens; backoff on 429/5xx; paging with cursors.
- Push via webhooks with HMAC signature and replay protection; dead-letter retries.
- Async batch sync for high-volume (nightly) with resumable checkpoints.

## Data Contracts (Examples)
- IncidentLink: { system: "servicenow", externalId, url, type, status, priority }
- CMDB CI: { ciId, name, type, owner, env, tags, lastSeenUtc }
- PolicyPosture: { policyId, requirementId, status, evidenceRef, evaluatedAtUtc }

## Error Handling
- Standardize error envelope with mapped codes; retry policy matrix (idempotent vs non-idempotent).
- Circuit breaker for failing connectors; quarantine bad messages for manual review.

## Security
- Outbound IP allow lists; mTLS where supported; OAuth2 client creds with scoped permissions.
- PII scrubbing in logs; store only necessary fields; encrypt sensitive payloads.

## Observability
- Metrics: success rate, latency p95, retries, DLQ depth, sync lag.
- Tracing: W3C traceparent propagated; per-call correlation IDs; audit trails of changes.

## Testing
- Mock connectors; contract tests against OpenAPI/JSON Schema; sandbox tenants.
- Replay tests from recorded traffic (redacted) to validate idempotency.

## Deployment & Versioning
- Feature flags per connector; blue/green rollouts; config via App Config/Key Vault.
- Semantic versioning for connectors; deprecation windows; migration guides.

## References
- See: technical-design/api-documentation-index.md, core-analysis/requirements-specification.md
