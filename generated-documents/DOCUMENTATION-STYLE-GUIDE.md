# Documentation Style Guide

Version: 1.0
Date: 2025-08-08
Owner: PMO & Architecture Guild

## Goals
Consistent, clear, and actionable documentation across the ICT Governance Framework. This guide defines structure, tone, and verification checks.

## Document Header (top of every doc)
- Title
- Version (semver) and Status (Draft/Review/Approved)
- Date (YYYY-MM-DD)
- Owner (role/team)

## Recommended Sections
- Summary / Purpose: 2–4 sentences
- Scope: what is in/out
- Definitions & Acronyms (if needed)
- Assumptions & Constraints
- Dependencies
- Roles & RACI (if process-oriented)
- Inputs / Preconditions
- Process / Design / Content (the core body)
- Outputs / Deliverables
- Acceptance Criteria / Success Criteria
- Risks & Mitigations
- KPIs & Metrics (if measurable)
- Security & Privacy (if applicable)
- Compliance & Standards (if applicable)
- References (relative links to repo docs)
- Change Log (table: version, date, author, summary)

## Tone & Style
- Write in active voice. Use simple, direct sentences.
- Prefer MUST/SHOULD/MAY for normative statements.
- Use lists for steps and criteria. Keep paragraphs short.
- Use consistent terminology. Define terms once.
- Link to canonical documents instead of duplicating content.

## Formatting
- Headings start at H1 for the title, then H2/H3 in order.
- Tables for matrices (RACI, RTM). Code blocks for commands/specs.
- Use ISO dates (YYYY-MM-DD). Numbers with units (ms, RPS, GiB).

## Verification Checklist
- Header present and complete
- Sections present (as applicable)
- Links resolve; no TODOs left
- Spelling/grammar pass
- Meets SECURITY/PRIVACY considerations

## Global Standards Alignment (PMBOK, BABOK, DMBOK)
All documents must be able to pass PMBOK, BABOK, and DMBOK guide global standards. Use the guidance below to ensure alignment and include a brief crosswalk where relevant.

### PMBOK (Project Management Body of Knowledge)
- Map content to applicable knowledge areas and processes (e.g., Scope, Schedule, Cost, Quality, Resource, Communications, Risk, Procurement, Stakeholder; Initiating/Planning/Executing/Monitoring & Controlling/Closing).
- Include: objectives, assumptions/constraints, roles & responsibilities, inputs/outputs, change control, metrics/reporting.
- For process docs: state entry/exit criteria, artifacts, and governance (stage gates, approvals).

### BABOK (Business Analysis Body of Knowledge)
- Demonstrate: stakeholder analysis, needs assessment, scope context, elicitation approach, requirements life cycle management, traceability, acceptance criteria, solution evaluation.
- For requirements-facing docs: unique IDs, rationale, priority, verification/validation methods, and trace links to design/test.

### DMBOK (Data Management Body of Knowledge)
- Address data governance where relevant: data ownership/stewardship, data quality controls, metadata/lineage, classification, security/privacy, lifecycle/retention, architecture and integration.
- For data-related docs: specify data domains, definitions, standards, controls, KPIs (e.g., completeness, accuracy, timeliness), and stewardship model.

### Standards Compliance Checklist (attach to each doc when applicable)
- PMBOK: knowledge area(s) covered and process alignment noted
- BABOK: stakeholder/requirements artifacts and traceability present
- DMBOK: data governance, quality, security/privacy, and metadata addressed
- Evidence links to canonical references in this repo
- Crosswalk section filled (see template)

### Crosswalk Template (embed or link)
| Standard | Area/Clause | Doc Section | Evidence/Link |
|----------|-------------|-------------|---------------|
| PMBOK    | Scope Mgmt  | Scope       | ...           |
| BABOK    | RLM         | Traceability| ...           |
| DMBOK    | Data Qual.  | KPIs        | ...           |

### References
- PMBOK Guide (latest edition)
- BABOK v3
- DAMA-DMBOK2

## Example References
- core-analysis/requirements-specification.md
- technical-design/system-design-specification.md
- quality-assurance/test-plan.md
