# ✅ **RPAS‑CM‑HIL‑001 v1.0.0 (CSR‑42)**

### *Human‑in‑the‑Loop Protocol — Operator guide for governed agent collaboration.*

***

## Purpose

The RPAS governance framework defines strict behavioral constraints for AI
agents (TCL, PRE, ESC, AEV). However, governance is a **two‑party ritual**.
The agent cannot complete its work without the human operator fulfilling
specific decision responsibilities at specific moments.

This artifact defines the **human operator's role**: what you will be asked,
when you will be asked, what constitutes a valid response, and what happens
if you do not respond.

***

## Core Principle

> **The agent proposes. You decide. The system executes.**
>
> You are the authority. The agent cannot proceed without your explicit
> authorization. Your silence is always interpreted as "do not proceed" —
> never as consent.

***

## Your Decision Points

During a governed task, the agent will pause and request your input at
exactly these moments — in this order:

### Decision Point 1 — Task Confirmation

**When**: After the agent classifies the task (PRE‑001 Step 3).

**What the agent presents**:
```
Task Classification: TCL-FIX (Bugfix)
Description: Fix ledger query returning stale CSR version.
Minimum Gates: Gate 1–4
```

**What you are deciding**: Is this the correct classification and description
of what you want done?

**Valid responses**:
| Response | Meaning |
|---|---|
| "Correct" / "Yes" / "That's right" | Classification confirmed. Agent proceeds to scope declaration. |
| "No, this is a refactor, not a bugfix" | Reclassify. Agent restarts at PRE Step 3. |
| "I'm not sure what this should be" | Agent invokes ESC‑001 and helps you clarify. |

---

### Decision Point 2 — Scope Approval

**When**: After the agent declares the AEV scope (PRE‑001 Step 4).

**What the agent presents**:
```
AEV Scope Declaration:
  File(s):   lib/ledger-service.ts
  Type:      Modify
  Rationale: CSR version query must filter by active epoch only.
```

**What you are deciding**: Should the agent touch exactly these files, for
exactly this reason?

**Valid responses**:
| Response | Meaning |
|---|---|
| "Approved" / "Looks right" / "Go ahead" | Scope locked. Agent proceeds to produce the advisory diff. |
| "Also include lib/ledger-types.ts" | Scope adjusted. Agent re-declares with the additional file. |
| "That's too broad — only touch the query function" | Scope narrowed. Agent re-declares. |
| "I need to think about this" | Agent holds. No timeout. Waits indefinitely. |

---

### Decision Point 3 — Diff / Patch Approval

**When**: After the agent produces the advisory output (PRE‑001 Step 5).

**What the agent presents**: A unified diff, structured description, or
advisory JSON showing the exact proposed change.

**What you are deciding**: Should this exact change be applied to the codebase?

**Valid responses**:
| Response | Meaning |
|---|---|
| "Apply it" / "Proceed" / "Commit" | Agent applies the change and runs AEV validation gates. |
| "Change X to Y, then apply" | Agent modifies the diff, re-presents it, and waits again. |
| "Don't apply — I'll do it myself" | Agent discards the diff. No changes made. |
| "Reject" / "No" / "Cancel" | Agent discards the diff. No changes made. |

---

### Decision Point 4 — Ambiguity Resolution

**When**: Any time the agent encounters uncertainty (ESC‑001).

**What the agent presents**: A structured escalation block identifying what
is ambiguous and presenting numbered options (if possible).

**What you are deciding**: Which interpretation is correct, or providing
the missing information.

**Valid responses**:
| Response | Meaning |
|---|---|
| "Option 2" | Agent proceeds with interpretation #2. |
| "None of those — here's what I mean: ..." | Agent reclassifies based on your clarification. |
| "I don't know — let me check and get back to you" | Agent holds indefinitely. No timeout. |

---

### Decision Point 5 — Gate Failure Response

**When**: An AEV validation gate fails after the change has been applied.

**What the agent presents**: The gate failure details and recommends rollback.

**What you are deciding**: Whether to roll back (standard) or investigate.

**Valid responses**:
| Response | Meaning |
|---|---|
| "Roll back" | Agent executes `git reset --hard HEAD`. Clean state restored. |
| "Let me investigate first" | Agent holds. You examine the failure. |
| "Try a different approach" | Agent rolls back, then restarts from PRE Step 3. |

> **⚠️ Important**: Under AEV rules, the agent will **always recommend rollback**.
> Debugging in a dirty state is a governance violation. If you choose to
> investigate, you accept responsibility for the working directory state.

***

## What You Are NOT Expected to Do

The governance framework does **not** require you to:

- Write code yourself (unless you choose to)
- Understand the internal implementation of every change
- Know the AEV gate numbers or RPAS artifact IDs
- Type specific ritual phrases (like "RPAS-OK") — those are for the
  automated validation pipeline, not for interactive agent sessions
- Respond immediately — the agent will wait as long as needed

***

## What You ARE Expected to Do

| Responsibility | Why |
|---|---|
| **Read the scope declaration** | You are authorizing which files are touched. If you don't read it, you've ceded authority (G1 violation). |
| **Review the proposed diff** | You are the decision authority. The agent's proposal may be wrong. |
| **Respond explicitly** | "Yes", "No", "Adjust X". Ambiguous responses trigger ESC‑001. |
| **Don't approve what you don't understand** | Ask the agent to explain. It will. This is not a delay — it's governance. |
| **Report unexpected behavior** | If the agent modifies files you didn't approve, that is a governance violation. Report it. |

***

## Timing — Just‑In‑Time Decision Model

The RPAS governance model uses a **JIT (Just‑In‑Time) decision model**:

- You are **not** asked to approve everything upfront.
- You are asked to decide at **each transition point**, right when the
  decision is needed.
- Each decision point is **self‑contained** — you have all the context
  you need when you're asked.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Agent       │     │  YOU         │     │  Agent       │
│  classifies  │────▶│  confirm?    │────▶│  declares    │
│  the task    │     │  (DP1)       │     │  scope       │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌──────────────┐              │
                     │  YOU         │◀─────────────┘
                     │  approve     │
                     │  scope?      │
                     │  (DP2)       │
                     └──────┬───────┘
                            │
               ┌────────────▼───────────┐
               │  Agent produces diff   │
               └────────────┬───────────┘
                            │
                     ┌──────▼───────┐
                     │  YOU         │
                     │  apply?      │
                     │  (DP3)       │
                     └──────┬───────┘
                            │
               ┌────────────▼───────────┐
               │  Agent applies +       │
               │  runs AEV gates        │
               └────────────┬───────────┘
                            │
                    ┌───────▼────────┐
                    │  Gates pass?   │
                    │  ✅ → Commit   │
                    │  ❌ → DP5      │
                    └────────────────┘
```

***

## Quick Reference Card

For operators who are already familiar with the framework:

| Moment | Agent Says | You Say |
|---|---|---|
| Classification | "Task Classification: TCL-..." | "Correct" or reclassify |
| Scope | "AEV Scope: files, type, rationale" | "Approved" or adjust |
| Diff | Shows proposed change | "Apply" or "Reject" or adjust |
| Ambiguity | "ESC-...: I'm unsure about X" | Clarify or say "hold" |
| Gate failure | "Gate N failed. Recommend rollback." | "Roll back" or "Let me look" |

***

## Governance Lineage

| Field | Value |
|---|---|
| Artifact ID | `RPAS‑CM‑HIL‑001` |
| Version | `v1.0.0` |
| Maturity | ADPA Baseline |
| Parent | `RPAS‑CM‑GRA‑001 v2.0.0 (CSR‑42)` |
| Related | `RPAS‑CM‑PRE‑001`, `RPAS‑CM‑ESC‑001`, `RPAS‑CM‑TCL‑001`, `RPAS‑CM‑AEV‑001` |
| Author | Agent (advisory) — awaiting human decision |
| CSR Epoch | Pending attestation |
