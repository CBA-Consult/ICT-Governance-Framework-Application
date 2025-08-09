# Code Review Checklist

Version: 0.1 (Draft)
Date: 2025-08-08
Owner: Engineering

## Checklist
- Correctness: requirements met; business logic matches specs.
- Tests: unit/integration updated; coverage adequate; negative paths.
- Security: input validation; authZ checks; secrets not hardcoded; least privilege.
- Performance: avoid N+1; efficient queries; caching where applicable.
- Reliability: retries/circuit breakers; idempotency; timeouts.
- Observability: structured logs with traceId; metrics; meaningful errors.
- UX: accessible; clear error messages; i18n where applicable.
- Docs: code comments; README/ADR updated; API contracts updated.
- Style: linter passes; consistent patterns; small, focused changes.

## References
- See: quality-assurance/test-strategy.md, error-handling-guidelines.md
