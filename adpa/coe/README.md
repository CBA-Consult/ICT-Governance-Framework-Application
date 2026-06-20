# Centers of Excellence (CoE)

Structured like the Power Platform CoE Starter Kit with four program sections:

| Section | Purpose | Phases |
|---------|---------|--------|
| **Overview** | Goals, outcomes, get started | Overview · Download |
| **Admin** | Adoption insights | Set up · Use · Deep dive |
| **Govern** | Audit & compliance | Set up · Use · Deep dive |
| **Nurture** | Community & L&D | Set up · Use |

## UI routes

| Path | Section |
|------|---------|
| `/coe/overview` | Overview & Download |
| `/coe/admin` | Admin (sync, dashboards, lifecycle centers) |
| `/coe/govern` | Govern (onboarding, registry, audit/rollback) |
| `/coe/nurture` | Nurture (training catalog, community) |
| `/coe/{centerId}` | Deep-dive lifecycle center (templates, ai-providers, artifacts, documents) |

## Four lifecycle centers (Admin → Deep dive)

| Center ID | Name | Inventory source |
|-----------|------|------------------|
| `templates` | Template CoE | `adpa/templates/` |
| `ai-providers` | AI Provider CoE | `adpa/config/processor-config.json` |
| `artifacts` | Stored Artifacts CoE | `adpa/tenants/` |
| `documents` | Document Lifecycle CoE | `generated-documents/governance/` |

## Shared lifecycle phases

1. **Initiation** — register item, business justification, propose owner
2. **Onboarding** — checklist, training, CoE approval
3. **Active** — approved for production use
4. **Build & Update** — versioned changes
5. **Retiring** — deprecation and migration
6. **Retired** — removed from active use; audit preserved

## CoE capabilities (every center)

- Onboarding checklists (per center in `centers.json`)
- Owner assignment
- Business justification
- Learning & development training modules
- Immutable audit trail (`coe_audit_log` — INSERT only)
- Version snapshots and rollback

## UI

- Hub: `/coe`
- Center: `/coe/{centerId}`
- Item detail: `/coe/{centerId}/items/{itemId}`

## Setup

```bash
cd ict-governance-framework
npm run setup:coe-lifecycle
```

Then sync inventory from the web UI or `POST /api/coe/sync`.

## Configuration

Center definitions: `adpa/coe/centers.json`  
Program structure: `adpa/coe/coe-program.json`  
Full scope model: `adpa/coe/governance-scope-model.json`  
PostgreSQL schema: `ict-governance-framework/sql/coe_lifecycle.sql`

## Full governance scope (not just in-repo)

| Scope layer | What is governed |
|-------------|------------------|
| **Governance platform** | ADPA, CoE, web app, PostgreSQL, blueprint-templates |
| **Power Platform** | Each Power App / flow = one `software-power-platform-app` artifact |
| **Azure / AWS / GCP** | Infrastructure per pillar with provider-specific IaC |
| **Cross-cloud** | Asset register, orchestrator, tenant baselines |

API: `GET /api/coe/scope` · Tenant assets: `adpa/tenants/{id}/governed-assets.json`
