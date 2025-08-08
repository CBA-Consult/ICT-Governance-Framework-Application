# Error Handling Guidelines

Version: 0.1 (Draft)
Date: 2025-08-08
Owner: Platform Engineering

## Goals
Provide consistent, user-friendly, and secure error handling across services, APIs, and UIs.

## Principles
- Fail fast on invalid input; do not hide data loss/corruption.
- Never leak secrets or stack traces to clients; log with correlation IDs.
- Prefer idempotent operations; safe retries with backoff.

## API Errors
- Use RFC 7807 Problem Details with fields: type, title, status, detail, instance, traceId, code.
- Map exceptions to stable codes (e.g., validation_failed, not_found, conflict, rate_limited, internal_error).
- Return 429 for rate limit; include Retry-After.

## Domain Errors
- Validation errors aggregated with field paths; localized messages where needed.
- Concurrency conflicts return 409; clients should retry with latest ETag.

## Logging & Observability
- Log errors at appropriate levels; attach traceId and user/tenant context.
- Capture p95/p99 error rates; alert on burn-rate; include sample payload hashes only.

## UI/UX
- Friendly, actionable messages; avoid technical jargon; preserve user input.
- Error boundaries in SPA; offline/retry banners for transient issues.

## Messaging & Async
- Poison message handling with DLQ; quarantine queues; retries with exponential backoff and jitter.
- Idempotency keys for at-least-once delivery semantics.

## Security
- PII scrubbing in logs; redaction of secrets; use allow-lists for headers/fields.

## Testing
- Unit tests for mappers; integration tests for API error contracts; chaos tests for dependency failures.

## References
- See: technical-design/api-documentation-index.md, quality-assurance/test-plan.md
