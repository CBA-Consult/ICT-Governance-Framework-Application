---
name: pillar-identity
description: >-
  Identity pillar (JIT elevation, Break Glass, RBAC). Use before changing auth,
  privileged access, or break-glass flows. Write identity.contract.test.js first.
---

# Pillar 1 — Identity

**NIST:** PR.AA, GV.RR  
**Status:** Delivered (June 2026) — contract maintenance and Phase 3 validation

## Module boundaries

| Area | Paths |
|------|--------|
| JIT elevation | `services/jit-elevation.js`, `api/jit-router.js`, `app/jit-elevation/` |
| Break Glass | `api/break-glass-router.js`, `app/break-glass/`, `services/break-glass-*` |
| Auth / RBAC | `middleware/auth.js`, `middleware/auth-jit-enforcer.js` |

## Contract file

`ict-governance-framework/tests/contracts/identity.contract.test.js`

## Contracts must prove

- JIT ticket required for enforced privileged mutations when `JIT_ENFORCEMENT_ENABLED=true`
- Break Glass activation requires out-of-band secret; not exposed in UI
- Emergency ledger tickets auditable; reconciliation closes ticket
- Intervention requests queue to feedback/escalation without activating break glass

## Legacy verification

```bash
npm run verify:jit
npm run verify:break-glass
npm run verify:analytics
```

## Next features (contract before code)

- [ ] Break glass intervention → escalation visibility in audit UI
- [ ] Volume baseline warnings tied to KPI snapshot

## Review checklist

- [ ] No standing global admin; time-bounded elevation
- [ ] Privileged actions logged with payload hash
- [ ] Admin-only break glass entry (not daily nav)
