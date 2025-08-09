# Acceptance Criteria Template (Technical)

Version: 1.0  
Date: 2025-08-08  
Owner: Product/QA

## Pattern
- Given <precondition>
- When <action>
- Then <observable outcome>

## Example: Policy Validation Gate
- Given a PR with a Bicep template
- When CI runs the policy validation stage
- Then critical violations fail the build and results are posted to the PR

## Definition of Done (DoD)
- Tests green; security scans pass; docs updated; operational runbooks updated; evidence attached

## Non-Functional Acceptance
- Meets SLOs; traces/metrics/logs in place; alerts configured; access controls validated

References:  
- generated-documents/core-analysis/requirements-specification.md
