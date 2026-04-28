# Skill: Multi-Tenant Infrastructure as Code (IaC)

## When to use
Use this skill when modifying deployment blueprints, creating new Bicep/ARM templates, or handling Azure infrastructure for the framework.

## Context
- Multi-tenant and multi-cloud compatibility are core tenets of the framework.
- All templates must be parameterized, reusable, and support unlimited tenant growth.
- Infrastructure as Code (IaC) must ensure strict tenant isolation boundaries.

## Directory Structure
- Templates belong in `blueprint-templates/infrastructure-blueprints/` (e.g., `multi-tenant-infrastructure.bicep`).
- Automation scripts belong in `implementation-automation/` or `azure-automation/`.

## Procedure
1. Use **Bicep** as the preferred IaC language for Azure infrastructure.
2. Ensure parameters allow for dynamic injection of:
   - Tenant ID
   - Environment Service Tier (Premium, Standard, Basic)
   - Location/Region
3. Ensure clear descriptive naming conventions and include comprehensive comments explaining the compliance or governance rule associated with the resource.
4. Follow cloud-agnostic terminology where possible to respect the multi-cloud methodology.
5. Remind the user to run automated validation (template linting, policy checks) before opening a Pull Request.