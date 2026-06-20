---
name: verify-post-feature
description: >-
  Run and unblock npm run verify:post-feature for the ICT Governance Framework —
  pre-flight checks, API/DB prerequisites, VB-CP rollback expectations, and
  troubleshooting. Use before commit, after pillar work, when regression fails,
  or when the user asks to run the post-feature quality gate.
---

# Post-feature verification gate (`verify:post-feature`)

Quality gate **QG-VB-CP**: validates active contract suites + legacy verify scripts, then rolls back synthetic operational data while preserving immutable ingest audit rows.

## When to use

- Before **commit** or **PR** after governance/pillar changes
- After implementing a feature listed in `tests/regression-registry.js`
- When user reports SecOps queue pollution, flaky verify scripts, or registry failures

## Agent workflow (required order)

1. **Read** `.cursor/skills/contract-first-governance/SKILL.md` if the change touched contracts.
2. **Pre-flight** (from `ict-governance-framework/`):

```bash
npm run preflight:post-feature
```

3. **Start API** if pre-flight warns port 4000 is down (separate terminal):

```bash
npm run server
```

   Only **one** instance on port 4000. Restart after API route/service changes.

4. **Run full gate**:

```bash
npm run verify:post-feature
```

5. **Confirm success** — all of:
   - `12/12 passed` (or current active suite count) in regression summary
   - `[VB-CP] Rollback attestation:` printed with `incidents_removed` > 0 when suites create synthetic data
   - User confirms SecOps Incident Queue has **no new** synthetic rows (optional UI check)

6. **On failure** — fix root cause; do **not** weaken contracts. Re-run from step 2.

## Faster paths

| Command | Use when |
|---------|----------|
| `npm run verify:registry:contracts` | Jest contracts only (~3 suites, still checkpointed) |
| `npm run report:contract-coverage` | Pillar enforcement KPI (active vs pending) |
| `npm run cleanup:verification-runs` | Legacy test incidents left in console |
| `npm run verify:registry -- --skip-api` | DB-only pass (skips G-B2/G-B3/assets smokes) |
| `npm run verify:registry -- --list` | Show suite table |

## Prerequisites checklist

| Requirement | Why |
|-------------|-----|
| `DATABASE_URL` in `.env` | All active suites hit Postgres |
| Local Postgres running | Connection refused → immediate fail |
| `npm install` in `ict-governance-framework` | Jest + supertest |
| `npm run server` on **:4000** | `verify:assets`, `verify:gb2`, `verify:gb3` |
| Superadmin login works | Default `superadmin` / `Admin123!` for API smokes |
| PowerShell on Windows | `verify:gb3` runs `Test-GitToCloudRecovery.ps1` |
| Schema scripts idempotent | Gate runs `setup:*` inside suites — missing tables fail loudly |

### One-time / after pull

```bash
npm run setup:verification-checkpoint
npm run setup:managed-devices
```

## What the gate runs

**Auto-discovered Jest contracts** (active when file has real `it()` tests, not only todos):

- identity, devices, secops — **active** today
- software, network, data, resilience — **pending** until todos are implemented

**Legacy verify** (manual list in `LEGACY_SUITES`): jit, break-glass, secops loop, calibration, assets, gb2, gb3, fair-risk, analytics, **verify:casb-ingest** (bulk path), **cross-pillar invariants (QG-601)**

New contract files are picked up automatically — no manual registry row for Jest pillars.

### Cross-pillar invariants (last suite, before VB-CP rollback)

`verify:cross-pillar` asserts consistency across Identity, Devices, Software, and SecOps for the current `VERIFICATION_RUN_ID`:

- QG-601-1: high-risk CASB → SecOps incident
- QG-601-2: software `deviceId` → managed device exists
- QG-601-3: non-compliant device + high-risk software → HIGH+ severity
- QG-601-4: `DEV-COMP-*` incidents → device exists
- QG-601-5: no orphan high-risk CASB without incident or rollback audit

## VB-CP rollback (expected behavior)

- `VERIFICATION_RUN_ID` tags synthetic rows during the run
- Operational tables restored; `governance_incident_ingest_log` kept with `rolled_back_at`
- Signed ledger: `verification_checkpoint_ledger`

If incidents remain in SecOps console after a **green** run:

```bash
npm run cleanup:verification-runs
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `DATABASE_URL is required` | Set `.env`; run from `ict-governance-framework/` |
| `EADDRINUSE` :4000 | Kill stale `node server.js`; start one API |
| G-B3 Phase 1 **401** | API needs JWT-first auth in `Test-GitToCloudRecovery.ps1` (not webhook-only) |
| G-B3 Phase 3 **500** DR KPI | Restart API after `drill-state-metrics.js` changes; run `setup:asset-dr-fields` |
| `column ... does not exist` | Run relevant `npm run setup:*` (e.g. `setup:managed-devices`) |
| Jest `uuid` ESM error | `jest.config.js` `moduleNameMapper` → `tests/contracts/_helpers/uuid-cjs-shim.js` |
| Incidents in queue after green gate | `npm run cleanup:verification-runs`; ensure API passes `verificationRunId` on ingest |
| Registry validation fail | Add `test:contracts:<pillar>` to package.json; ensure `@contract pillar:<name>` header |
| `forceExit` Jest warning | Expected — open pg pools in routers; harmless |

## Adding a new suite to the gate

**Jest contracts (automatic):**

1. Create `tests/contracts/<pillar>.contract.test.js` with `@contract pillar:<pillar>`
2. Add `test:contracts:<pillar>` to `package.json`
3. Write real `it()` tests (not only `it.todo`) — suite becomes **active** in `verify:post-feature`
4. `npm run validate:registry`

**Legacy verify scripts (manual):** add an entry to `LEGACY_SUITES` in `tests/regression-registry.js`.

## Key paths

| Area | Path |
|------|------|
| Registry | `ict-governance-framework/tests/regression-registry.js` |
| Runner | `ict-governance-framework/scripts/run-regression-registry.js` |
| VB-CP service | `ict-governance-framework/services/verification-checkpoint.js` |
| Pre-flight | `ict-governance-framework/scripts/preflight-verify-post-feature.js` |

## Success criteria (agent)

Do not claim the gate is green without:

- Exit code 0 from `npm run verify:post-feature`
- Regression summary shows all active suites PASS
- VB-CP rollback summary printed (unless `--no-checkpoint`)
