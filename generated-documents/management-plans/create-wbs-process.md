# Create WBS Process

Version: 0.2 (Draft)
Status: Draft
Date: 2025-08-08
Owner: PMO

## Summary / Purpose
Define the structured approach to decompose the ICT Governance Platform into manageable deliverables and work packages, resulting in a baselined Work Breakdown Structure (WBS) and an updated WBS Dictionary.

## Scope
- In scope: WBS decomposition, dictionary entries, baseline update, integration with schedule and cost planning.
- Out of scope: Detailed task scheduling and resource assignments (handled by Schedule Management).

## Assumptions & Constraints
- Scope baseline and major deliverables are defined in the Project Charter.
- Decomposition follows deliverable-oriented hierarchy; avoid overly granular tasks (< 1 day) unless necessary.

## Dependencies
- Project Charter, Requirements Documentation, Scope Management Plan.

## Roles & RACI
| Role                 | R | A | C | I |
|----------------------|---|---|---|---|
| Project Manager      | R | A | C | I |
| Product Owner        | R |   | C | I |
| Architecture Lead    | R |   | C | I |
| PMO                  |   |   | C | I |
| Workstream Leads     | R |   | C | I |

## Inputs / Preconditions
- Approved high-level scope, epics/features list, major milestones.

## Process
1. Identify major deliverables and outcomes (from Charter and Requirements).
2. Decompose deliverables into sub-deliverables/features, then into work packages.
3. Define acceptance criteria for each work package.
4. Create/update WBS Dictionary entries (id, description, owner, acceptance criteria, dependencies).
5. Review with stakeholders; iterate and baseline the WBS.
6. Publish the baselined WBS and synchronize with scheduling and cost tools.

## Outputs / Deliverables
- Baselined WBS (hierarchical structure)
- Updated WBS Dictionary entries
- Change requests if scope adjustments are required

## Acceptance Criteria / Success Criteria
- 100% of scope covered by the WBS with no orphan deliverables
- Each work package has clear acceptance criteria and an owner
- WBS approved by PMO and key stakeholders

## Risks & Mitigations
- Over/under decomposition → use decomposition guidelines and peer review
- Scope gaps → trace to requirements; conduct completeness checks

## Compliance & Standards
- Aligns with PMBOK and organizational WBS standards.

## References
- planning-artifacts/wbs-dictionary.md
- project-charter/project-charter.md
- management-plans/scope-management-plan.md

## Change Log
| Version | Date       | Author/Owner | Summary            |
|---------|------------|--------------|--------------------|
| 0.2     | 2025-08-08 | PMO          | Restructured per Style Guide |
| 0.1     | 2025-08-08 | PMO          | Initial draft      |
