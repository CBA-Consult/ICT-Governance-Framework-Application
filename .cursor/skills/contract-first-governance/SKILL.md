---
name: contract-first-governance
description: >-
  Contract-first delivery for the ICT Governance Framework — write Jest contract
  tests and read the pillar SKILL.md before implementing a seven-pillar feature.
  Use when starting a new pillar module, sprint item, or NIST gate remediation.
---

# Contract-first governance development

## Workflow (every feature)

1. **Select pillar** — Identity, Devices, Software, Network, Data, SecOps, or Resilience.
2. **Read pillar skill** — `.cursor/skills/pillar-<name>/SKILL.md` (scope, paths, NIST gates).
3. **Write contracts first** — `ict-governance-framework/tests/contracts/<pillar>.contract.test.js`
   - Describe observable behaviour (API, service, audit trail).
   - Tests may fail until implementation is complete — that is expected.
4. **Run contracts** — `npm run test:contracts -- --testPathPattern=<pillar>`
5. **Implement** — services, API routes, UI (minimal scope).
6. **Green** — pillar contracts pass; run **`npm run verify:post-feature`** (see `.cursor/skills/verify-post-feature/SKILL.md`).
7. **Registry** — contract suites are **auto-discovered** from `tests/contracts/*.contract.test.js`; add `test:contracts:<pillar>` to `package.json` only. Real `it()` tests → `active` in the gate; `it.todo` only → `pending` (skipped). Run `npm run validate:registry`.
8. **Review** — NIST gate, Skills checklist, no secrets in repo.
9. **Next feature** — repeat from step 1; do not start code before contracts exist.

## Contract test rules

- File suffix: `*.contract.test.js` under `tests/contracts/`.
- Tag pillar in top comment: `@contract pillar:secops`.
- Prefer service-level contracts (fast, deterministic); add HTTP contracts when routing is the feature.
- Integration tests require `DATABASE_URL`; skip with `describe.skip` only when documented in pillar skill.
- Do not weaken contracts to make tests pass — fix implementation or split the feature.

## Pillar skills

| Pillar | Skill path | Contract file |
|--------|------------|---------------|
| Identity | `.cursor/skills/pillar-identity/SKILL.md` | `identity.contract.test.js` |
| Devices | `.cursor/skills/pillar-devices/SKILL.md` | `devices.contract.test.js` |
| Software | `.cursor/skills/pillar-software/SKILL.md` | `software.contract.test.js` |
| Network | `.cursor/skills/pillar-network/SKILL.md` | `network.contract.test.js` |
| Data | `.cursor/skills/pillar-data/SKILL.md` | `data.contract.test.js` |
| SecOps | `.cursor/skills/pillar-secops/SKILL.md` | `secops.contract.test.js` |
| Resilience | `.cursor/skills/pillar-resilience/SKILL.md` | `resilience.contract.test.js` |

## Regression registry

After implementing a feature, run the **full registry** to catch silent cross-pillar regressions:

```bash
npm run preflight:post-feature       # prerequisites before full gate
npm run verify:post-feature          # VB-CP checkpoint → suites → signed rollback
npm run verify:registry:contracts    # Jest contracts only (checkpointed)
npm run validate:registry            # contract auto-discovery + npm script checks
npm run cleanup:verification-runs    # remove legacy untagged test rows from console
npm run verify:registry -- --list    # print suite table
npm run verify:registry -- --no-checkpoint
```

**Auto-discovery:** every `tests/contracts/<pillar>.contract.test.js` with `@contract pillar:<pillar>` is registered automatically.

**Activation (gate inclusion):**
- `pending` — no real tests, or only 1 test without explicit opt-in
- `active` — **≥ 2** real `it()` / `test()` cases, **or** `@contract readiness:enforced` with ≥ 1 real test
- Optional pre-run setup: `@contract setup:managed-devices`

Run `npm run report:contract-coverage` for pillar KPI. Legacy `verify:*` scripts remain in `LEGACY_SUITES`.

Registry file: `ict-governance-framework/tests/regression-registry.js` (merges auto-discovered contracts + legacy suites)

**Verification checkpoints (VB-CP):** `verify:post-feature` captures a signed manifest (`verification_checkpoint_ledger`), tags synthetic rows with `VERIFICATION_RUN_ID`, then rolls back operational tables while **keeping** immutable `governance_incident_ingest_log` rows (marked `rolled_back_at`).

When adding a contract file:
1. Add `test:contracts:<pillar>` to `package.json` if missing.
2. Add `@contract pillar:<pillar>` (and optional `@contract setup:<script>`) to the file header.
3. Replace `it.todo` with real `it()` tests when implemented — suite becomes **active** at ≥ 2 tests (or add `@contract readiness:enforced` for early single-test promotion).
4. Run `npm run validate:registry`.

## Legacy verification

Existing `tests/*.test.js` and `npm run verify:*` remain until migrated. New work adds Jest contracts first; migrate legacy scripts when touching a pillar.

## Reference

- Seven-pillar plan: `docs/implementation/guides/Enterprise-Security-Seven-Pillar-Implementation-Plan.md`
