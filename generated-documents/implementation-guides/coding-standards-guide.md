# Coding Standards Guide

Version: 0.1 (Draft)
Date: 2025-08-08
Owner: Engineering

## Purpose
Defines language-specific coding standards and conventions to ensure readability, maintainability, security, and performance.

## General
- Use meaningful names; prefer explicitness.
- Write small, pure functions; avoid side effects; document invariants.
- Enforce linters/formatters in CI; no warnings ignored.

## C#/.NET
- .NET 8; nullable enabled; async/await; DI via Minimal APIs/ASP.NET Core.
- Naming: PascalCase for public members; _camelCase for privates.
- Use records for immutable DTOs; IOptions<T> for config; HttpClientFactory.

## TypeScript/Node
- ES2022; strict TS; eslint + prettier; prefer const/readonly; async/await.
- Use zod/io-ts for runtime validation; never any; narrow types.

## Security
- No secrets in code; parameterize SQL; validate all input; output encode.
- Use parameterized queries/ORM; avoid dynamic SQL.

## Testing
- Unit tests for business logic; integration tests for APIs; fast CI.

## Performance
- Avoid allocations in hot paths; cache results; measure before optimizing.

## References
- See: implementation-guides/development-workflow-guide.md
