# ✅ Atomic Execution & Validation (AEV) Workflow

**ADPA Codebase – Mandatory Change Protocol**

## 0. Authority Model (Non‑Negotiable)

*   The **agent is a proposer and executor**, not an authority.
*   The **codebase is the authority**.
*   A change exists **only** if it passes validation gates.

No agent assertion of correctness is sufficient on its own.

***

## 1. Atomicity Contract

Each agent action **MUST** satisfy all of the following:

### ✅ One Logical Change Only

An atomic change is limited to **exactly one** of:

*   One new entity
*   One state transition
*   One event consumer or publisher
*   One UI component
*   One refactor with no semantic change

If more than one applies → **reject and split**.

***

### ✅ Fully Specified Scope

Every change must explicitly declare:

*   Files touched (exact paths)
*   Type of change (add / modify / delete)
*   Rationale (one sentence, factual)

If scope cannot be enumerated → **change is invalid**.

***

## 2. Execution Rules for the Agent

### ❌ Forbidden Behaviors

The agent may **never**:

*   Ask for “manual edits”
*   Say “apply this conceptually”
*   Assume file placement
*   Modify files outside declared scope
*   Change infrastructure and business logic together

Violation = immediate rollback.

***

### ✅ Required Output Format

The agent must produce **one** of:

*   Unified diff (`git diff` format)
*   Explicit file replacement with full contents
*   Atomic commit (if tool supports it)

No prose‑only instructions are acceptable.

***

## 3. Validation Gates (Mandatory, Ordered)

### 🟢 Gate 1 — Mechanical Integrity

Immediately after application:

```bash
git status
git diff --stat
```

✅ Expected:

*   Only declared files changed
*   No untracked artifacts
*   No unexpected deletions

Failure → rollback.

***

### 🟢 Gate 2 — Build Integrity

```bash
dotnet build
```

✅ Expected:

*   All projects compile
*   No new warnings at error level
*   No DI or namespace breaks

Failure → rollback.

***

### 🟢 Gate 3 — Orchestration Integrity

```bash
dotnet run --project Adpa.AppHost
```

✅ Expected:

*   Aspire resolves all services
*   No startup exceptions
*   No missing dependencies

Failure → rollback **without debugging**.

***

### 🟢 Gate 4 — Governance Invariants (Critical)

The following **must still be true**:

*   Ledger writes are **append‑only**
*   Amendments are **immutable**
*   Phase transitions remain **explicit**
*   Human approval still gates execution
*   Events are **idempotent**
*   Hash chains are **unbroken**

If any invariant is unclear → rollback.

***

### 🟢 Gate 5 — Proof‑of‑Life Scenario

Run **one** happy path only.

Example (Phase‑relevant):

*   Create Phase 0 entry
*   Approve Phase 1
*   Verify:
    *   Ledger record exists
    *   Amendment recorded (if applicable)
    *   Event emitted once
    *   Consumer is idempotent

Failure → rollback.

***

## 4. Commit Certification

Only after all gates pass:

```bash
git commit -m "SAFE: <atomic change description>"
```

Rules:

*   “SAFE” prefix is mandatory
*   Commit message must match declared scope
*   No squashing of failed attempts

***

## 5. Rollback Rule (Absolute)

If **any** gate fails:

*   Revert to last SAFE commit
*   Do **not** debug in a dirty state
*   Do **not** layer fixes
*   Restart from baseline

Rollback is not failure — it is compliance.

***

## 6. Agent Compliance Statement (Implicit)

By operating under this workflow, the agent implicitly agrees:

*   It is **not trusted by default**
*   Correctness is proven, not claimed
*   Silence is preferred over unsafe action
*   Partial success is failure

***

## 7. Why This Works (Important)

This workflow:

*   Eliminates silent regressions
*   Makes rollback trivial and safe
*   Scales with complexity
*   Is compatible with AI, CLI, IDE, or human edits
*   Matches ADPA’s governance philosophy exactly

You are not slowing development —  
you are **preventing irreversible damage**.
