# API Documentation Index

Version: 0.1 (Draft)
Date: 2025-08-08
Owner: Platform Engineering

## Purpose
Entry point for all API contracts for the ICT Governance Platform. Organizes REST/GraphQL endpoints, webhooks, and integration flows with versioning, auth, rate limits, and deprecation policy.

## API Overview
- API Styles: REST (primary), GraphQL (read aggregation), Async webhooks and Azure Service Bus events.
- Base URL: https://api.example.org/governance/v1 (placeholder)
- AuthN/Z: OAuth 2.0 client credentials via Azure Entra ID, scopes per domain; fine-grained permissions via roles/claims.
- Content Types: application/json; utf-8. Idempotency via Idempotency-Key headers on POST/PUT.
- Versioning: URL-based (v1, v2), preview via header X-Api-Preview.
- Rate Limits: Token bucket per client; headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After.

## Domains & Resources
- Catalog: /policies, /standards, /controls, /evidence
- Assurance: /assessments, /findings, /risks, /tests
- Compliance: /frameworks, /requirements, /mappings, /posture
- Operations: /incidents, /changes, /problems, /services
- Identity: /users, /groups, /roles, /entitlements
- Assets: /assets, /applications, /environments
- Workflow: /tasks, /approvals
- Integration: /connectors, /endpoints, /sync-jobs, /webhooks
- Telemetry: /events, /metrics, /usage, /costs, /budgets
- Audit: /audit-logs

## Common Conventions
- Pagination: cursor-based ?cursor=...&limit=50; standard envelope { items, nextCursor }.
- Sorting/Filtering: sort=-createdUtc; filter via RSQL-like query param q=; server-side validation.
- Errors: RFC 7807 Problem Details with traceId; consistent error codes.
- ETags & Caching: ETag for concurrency; Cache-Control for GETs.

## Sample Endpoints (Excerpt)
- GET /policies: list policies
- POST /policies: create policy
- GET /policies/{id}: retrieve
- PATCH /policies/{id}: partial update
- POST /evidence: submit evidence (multipart with metadata)
- GET /assessments/{id}/findings: list findings
- POST /risks/{id}/treatments: create treatment action

## Webhooks & Events
- Event bus: Azure Service Bus topics per domain (policy-events, evidence-events, risk-events).
- Event format: CloudEvents 1.0; attributes include id, source, type, subject, time, data, datacontenttype.
- Webhooks: Managed endpoints with secret rotation; HMAC signature header X-Hook-Signature; replay protection via nonce + timestamp.

## SDKs & Clients
- Auto-generated clients via OpenAPI; languages: TypeScript, C#, Python.
- Publish to internal artifact feeds; semver with changelog; deprecation policy with 6-month sunset.

## Observability & SLAs
- Request/response logging with PII scrubbing.
- Apdex targets per route; SLOs documented; alerting on error rates and latency.

## Security
- Scopes: policy.read, policy.write, evidence.submit, risk.read, admin.*
- RBAC checks on resource ownership and org/tenant boundaries.
- Input validation and JSON schema for payloads; anti-DoS protections.

## Change Management
- API Change Review Board; backward-compatible changes favored; version negotiation.
- Deprecations announced via headers and status page; beta programs for new endpoints.

## References
- See: technical-design/system-design-specification.md, security-design-document.md, error-handling-guidelines.md
