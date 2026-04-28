# 📘 **RPAS‑CM‑OPM‑001 v1.0.0 (CSR‑42)**

### *Operator Manual / Playbook — Your complete guide to working with governed AI agents.*

***

# 1. Introduction

## What Is This?

This is your guide to working with AI agents inside the ADPA framework.
ADPA uses a governance system called **RPAS** (Regulated Process Assurance
System) that controls how AI agents behave when they help you write code,
fix bugs, update configuration, or perform any other task.

The governance system exists for one reason:

> **To make sure AI never does anything you didn't explicitly ask for,
> approve, and understand.**

## Why Does Governance Exist?

AI agents are powerful but unpredictable. Without rules, they will:

- Guess what you meant instead of asking
- Fix things you didn't ask them to fix
- Modify files you didn't know about
- Make changes that look correct but break something else
- Act on their own interpretation of "helpful"

Governance prevents all of this. It ensures that every change is:

- **Proposed** by the agent
- **Approved** by you
- **Validated** by automated checks
- **Committed** only after everything passes

## The Three Parties

Every interaction involves three parties:

| Party | Role | Analogy |
|---|---|---|
| **You** (the Human Operator) | The decision‑maker. You approve, reject, or adjust everything. | The captain of the ship. |
| **The Agent** (AI) | The advisor and worker. It proposes changes and executes what you approve. | The first officer who recommends a course. |
| **The Orchestrator** (System) | The execution engine. It enforces the rules and applies the final changes. | The ship's systems that carry out orders. |

The fundamental promise:

> **AI may help, but AI may not decide, change things silently, or assume
> what you want.**

***

# 2. Glossary

These terms appear throughout the governance system. You don't need to
memorize them — refer back here whenever you encounter one.

| Term | Plain Language Meaning |
|---|---|
| **Task** | Any piece of work: fixing a bug, updating a file, adding a feature, cleaning up the repository. |
| **Scope** | The exact list of files the agent is allowed to touch for a given task. Nothing outside this list may be modified. |
| **Advisory** | The agent's recommendation. It is never an action — it is always a suggestion that requires your approval. |
| **Atomic** | A single, indivisible change. One task = one change = one commit. No bundling. |
| **Gate** | An automated checkpoint that verifies the change didn't break anything. There are four gates, run in order. |
| **CSR** | Certified Stable Release — a version stamp that proves a change passed all gates and was approved. |
| **Ritual** | A governed step in the process. The word sounds formal, and it's meant to — these steps are non‑negotiable. |
| **Commit** | Saving the change permanently to the codebase, with a message starting with `SAFE (RPAS):`. |
| **Rollback** | Undoing a change completely. This is normal and expected — it means the system is working correctly. |
| **Preflight** | The agent's startup checklist. It loads the rules, identifies the task, and prepares its proposal before doing anything. |
| **Escalation** | When the agent encounters something unclear, it stops and asks you instead of guessing. |
| **Classification** | Labeling the task type (bugfix, cleanup, feature, etc.) so the correct validation rules apply. |
| **Traceability** | The ability to verify the origin, owner, decision, and system path for any artifact or execution. |
| **Collision** | When two actions, agents, or tiers attempt to modify the same scope or conflict semantically. |
| **TAR-COL** | Traceability, Authority, Responsibility & Collision-Prevention. The protocol for multi-agent coordination. |
| **Diff** | A side-by-side view of what the agent proposes to change — showing the old code and the new code. |
| **Decision Point** | A specific moment where the agent pauses and waits for your explicit instruction. There are five of these. |

***

# 3. Your Role as the Human Operator

## What You Do

You are the authority in this system. The agent cannot proceed without your
say‑so. Here is everything the system will ask you to do:

✅ **Confirm the task type** — "Is this a bugfix, a cleanup, a feature?"

✅ **Approve the scope** — "Yes, touch these files. No others."

✅ **Review and approve the proposed change** — "This diff looks correct. Apply it."

✅ **Resolve ambiguity** — "What I meant was..."

✅ **Respond to failures** — "Roll it back" or "Let me investigate."

That's it. Five types of decisions. The system guides you through each one.

## What You Do NOT Need to Do

❌ **Write code yourself** — unless you want to. The agent does the implementation.

❌ **Understand every line of code** — but you should understand *what* is
changing and *why*. If you don't, ask the agent to explain.

❌ **Respond immediately** — the agent will wait for you. There is no timeout,
no auto‑approval, no "assumed consent."

❌ **Know the governance rules by heart** — the agent knows them and will
follow them. Your job is just to make decisions when asked.

❌ **Approve things you don't understand** — this is the single most important
rule. If something isn't clear, say "explain this" and the agent will.

***

# 4. Understanding the Agent's Behavior

Working with a governed agent feels different from working with an ungoverned
one. Here's what to expect and why.

## Why the Agent Pauses

The agent pauses at five specific points to ask for your decision. This is
not hesitation — it is governance. The agent is **required** to stop and
cannot continue without your response.

## Why the Agent Asks So Many Questions

The agent is not allowed to guess. If your request is ambiguous ("clean up
the backend"), the agent will ask you to be more specific rather than
interpreting your request on its own. This prevents the #1 cause of
AI‑generated errors: doing the wrong thing confidently.

## Why the Agent Refuses to Do Multiple Things at Once

Each task must be a single, atomic change. If you say "fix the bug and also
refactor the module," the agent will ask you to split that into two separate
tasks. This ensures each change can be independently verified and rolled
back if needed.

## Why the Agent Doesn't "Just Do the Obvious Thing"

What seems obvious to you may not be obvious to the agent, and the agent's
interpretation of "obvious" may be wrong. The governance system eliminates
this risk by requiring every change — no matter how small — to go through
the approval process.

## Why the Agent Recommends Rollback Instead of Fixing Forward

When a validation check fails, the agent will recommend undoing the change
entirely rather than trying to fix the fix. This sounds wasteful, but it
prevents a common failure mode: stacking quick patches on top of each other
until the codebase is in an unpredictable state.

Rollback is not failure. Rollback is governance working correctly.

***

# 5. The Five Decision Points

During every task, the agent will pause at these five specific moments to
ask for your decision. Not every task will hit all five — but you should
know what to expect at each one.

## DP1 — Task Classification

**When it happens**: Right at the start, after you describe what you want.

**What the agent shows you**:
> "I've classified this as a **Hygiene** task (repository cleanup).
> The minimum validation checks required are Gate 1 and Gate 2."

**What you need to decide**: Is this the right type of task?

**Example responses**:
- ✅ "That's correct."
- ✅ "No, this is a bugfix, not cleanup."
- ✅ "I'm not sure — can you explain the difference?"

---

## DP2 — Scope Approval

**When it happens**: After classification, before the agent writes any code.

**What the agent shows you**:
> "I will modify `.gitignore` to add build artifact exclusions. No other
> files will be touched."

**What you need to decide**: Should the agent touch exactly these files?

**Example responses**:
- ✅ "Approved."
- ✅ "Also include the Docker ignore file."
- ✅ "Too broad — only update the section about build outputs."

---

## DP3 — Diff / Patch Approval

**When it happens**: After the agent has drafted the exact change.

**What the agent shows you**: The precise lines being added, removed, or
modified — usually in a "diff" format showing old vs. new.

**What you need to decide**: Should this exact change be applied?

**Example responses**:
- ✅ "Apply it."
- ✅ "Change `bin/` to `**/bin/` and then apply."
- ✅ "Reject — I'll handle this myself."
- ✅ "I don't understand line 4 — explain what that does."

---

## DP4 — Ambiguity Resolution

**When it happens**: Whenever the agent encounters something unclear — this
can happen at any point.

**What the agent shows you**:
> "Your request could mean one of three things:
> 1. Update `.gitignore` only
> 2. Update `.gitignore` and delete existing build folders
> 3. Restructure the entire build layout
>
> Which did you mean?"

**What you need to decide**: Which interpretation is correct.

**Example responses**:
- ✅ "Option 1."
- ✅ "None of those — here's what I actually mean: ..."
- ✅ "I need to think about it. Hold."

---

## DP5 — Gate Failure

**When it happens**: After a change has been applied, if one of the automated
validation checks fails.

**What the agent shows you**:
> "Gate 2 (Build) failed: the project no longer compiles. I recommend
> rolling back to the previous clean state."

**What you need to decide**: Roll back or investigate?

**Example responses**:
- ✅ "Roll back."
- ✅ "Let me look at the error first."
- ✅ "Roll back and try a different approach."

> **Important**: The agent will always recommend rollback. This is normal.
> Fixing a broken change by adding more changes on top often makes things
> worse. A clean rollback lets you restart from a known‑good state.

***

# 6. The Complete Ritual — End to End

Here is the full process from start to finish, in plain language:

```
 1.  You tell the agent what you want.
         "Fix the ledger query that returns stale data."

 2.  The agent classifies the task.
         "This is a Bugfix (TCL-FIX). Gates 1–4 apply."

 3.  YOU approve the classification.              ◀── Decision Point 1
         "Correct."

 4.  The agent declares exactly what it will touch.
         "File: lib/ledger-service.ts | Type: Modify"

 5.  YOU approve the scope.                       ◀── Decision Point 2
         "Approved."

 6.  The agent drafts the change and shows it to you.
         (A diff showing old code → new code)

 7.  YOU approve, adjust, or reject the change.   ◀── Decision Point 3
         "Apply it."

 8.  The agent applies the change to your codebase.

 9.  The agent runs automated validation gates:
         Gate 1: Were only the declared files changed?
         Gate 2: Does the project still build?
         Gate 3: Does the system start up correctly?
         Gate 4: Are governance rules still intact?

10.  If all gates pass:
         The agent commits with "SAFE (RPAS): Fix ledger query"
         ✅ Done.

11.  If a gate fails:                             ◀── Decision Point 5
         The agent recommends rollback.
         You decide: roll back or investigate.
```

The entire process typically takes 5–15 minutes for a single task.

***

# 7. The Operator Golden Rules

These are the seven rules that govern your behavior as an operator. Follow
them and you will always stay in control.

### Rule 1 — Never Approve What You Don't Understand

If the agent shows you a change and you're not sure what it does, say
**"explain this"** before approving. The agent will explain. This is
not a delay — this is governance.

### Rule 2 — If in Doubt, Ask

You can always ask the agent to explain its reasoning, show alternatives,
or clarify terminology. The agent is designed to answer questions without
charging ahead.

### Rule 3 — Silence Means "Do Not Proceed"

If you stop responding, the agent waits. It will never interpret your
silence as approval. There is no timeout. There is no auto‑continue.

### Rule 4 — Every Task Is Governed

There is no such thing as a "trivial" or "obvious" change that skips the
process. A one‑line comment change goes through the same ritual as a
major feature. The process is fast for small changes, so this is not
a bottleneck.

### Rule 5 — One Task at a Time

If you want multiple things done, describe them one at a time. The agent
will ask you to split bundled requests. This sounds slow but actually
prevents errors and makes rollback painless.

### Rule 6 — Ambiguity Triggers a Question, Not a Guess

If the agent asks you to clarify, it means your request was open to
interpretation. This is a feature, not a bug. The agent asking "which
of these three things did you mean?" is vastly better than the agent
silently picking option 2 and getting it wrong.

### Rule 7 — Expect Predictable, Not Creative

A governed agent will feel methodical and structured, not spontaneous.
It will follow the same process every time. This consistency is the
entire point — you can trust the process because it never varies.

***

# 8. Troubleshooting

## "The agent keeps asking me to classify the task"

This means the agent completed its preflight checks and needs you to
confirm the task type before it can proceed. Just confirm or correct
the classification it proposed.

## "The agent refuses to do what I asked"

Most likely your request combines multiple tasks (e.g., "fix the bug
and also clean up the imports"). Split it into two requests and the
agent will handle each one.

## "The agent stopped in the middle of working"

The agent hit a decision point and is waiting for your response. Check
its last message — it's asking you a question.

## "The agent wants to roll back my change"

A validation gate failed. This is normal and expected. Roll back, review
what went wrong, and try again with a corrected approach. The agent will
guide you through this.

## "The build is failing after a change"

If the agent's change caused the failure: roll back. If the failure
existed before the agent's change: the agent will flag it during its
preflight checks and ask how to proceed.

## "The agent is repeating itself"

The agent repeats its scope declaration or classification when you
provide a response that isn't clear enough to proceed. Try giving a
more specific answer (e.g., "yes, proceed" instead of "sure").

## Known Environment Issues

| Issue | Symptom | Fix |
|---|---|---|
| Aspire file locking | "MSB3026" or "MSB3027" errors during build | Kill all `Adpa.AppHost.exe` processes, clean `bin/` and `obj/`, rebuild |
| Environment variables missing | "AI_PROVIDER not found" at startup | Ensure `AppHost/Program.cs` injects the variable; avoid static initialization |

***

# 9. Quick Reference Cards

## Card A — Task Classes

| Class | When to Use | Example |
|---|---|---|
| Feature | Adding new capability | "Add a new API endpoint" |
| Bugfix | Fixing incorrect behavior | "The query returns wrong data" |
| Refactor | Restructuring without changing behavior | "Consolidate these two services" |
| Hygiene | Repo cleanup, formatting, .gitignore | "Add build artifacts to .gitignore" |
| Documentation | Docs, guides, ADRs | "Write a deployment guide" |
| Configuration | Build config, CI/CD, environment | "Add Redis to the Aspire setup" |
| Migration | Database changes | "Add a new table for audit logs" |
| Security | Auth, secrets, vulnerabilities | "Rotate the API keys" |
| Governance | Changes to the governance rules themselves | "Add a new governance artifact" |
| Dependency | Package updates | "Update Aspire SDK to 13.2.2" |

## Card B — Decision Point Cheat Sheet

| DP | Agent Says | You Say |
|---|---|---|
| 1 | "Task classified as ..." | "Correct" or reclassify |
| 2 | "Scope: these files, this reason" | "Approved" or adjust |
| 3 | Shows the diff | "Apply" or "Reject" or adjust |
| 4 | "I'm unsure about X" | Clarify or say "Hold" |
| 5 | "Gate failed. Recommend rollback." | "Roll back" or "Let me look" |

## Card C — The Five Gates (What They Check)

| Gate | What It Verifies |
|---|---|
| 1 — Mechanical | Only the declared files were changed. No surprise modifications. |
| 2 — Build | The project compiles without errors. |
| 3 — Orchestration | All services start up correctly. |
| 4 — Governance | The change didn't break any governance rules (append-only data, authority boundaries, etc.). |

## Card D — Red Flags (Governance Violations)

If you observe any of these, the agent is not behaving correctly:

| Red Flag | What It Means |
|---|---|
| Agent modifies files without showing you first | Scope bypass — violation of G1 |
| Agent applies a change before you approve | Authorization bypass — violation of PRE‑001 |
| Agent bundles multiple changes into one commit | Atomicity violation — violation of AEV |
| Agent says "this is obviously safe" and proceeds | Self‑interpretation — violation of ESC‑001 |
| Agent fixes something you didn't ask about | Scope creep — violation of AEV + TCL‑001 |
| Agent continues after you stop responding | Silence treated as consent — violation of HIL‑001 |

***

# 10. Appendix

## All Governance Artifacts

| ID | Name | What It Does | File |
|---|---|---|---|
| `GRA‑001` | Governance Guardrails | The five rules (G1–G5) that govern all behavior | `RPAS.md` |
| `ENV‑001` | Agent Envelope | Architecture, tier roles, and technology stack | `GEMINI.md` |
| `AEV‑001` | Atomic Execution & Validation | The execution workflow and validation gates | `CONTRIBUTING.md` |
| `TCL‑001` | Task Classification Layer | Taxonomy of all valid task types | `RPAS-TCL.md` |
| `PRE‑001` | Agent Preflight Ritual | The agent's mandatory startup sequence | `RPAS-PRE.md` |
| `ESC‑001` | Ambiguity Escalation Protocol | How the agent handles uncertainty | `RPAS-ESC.md` |
| `TAR‑COL` | Traceability, Authority, Responsibility & Collision‑Prevention | Rituals for coordination and collision safety | `RPAS-TAR-COL.md` |
| `HIL‑001` | Human‑in‑the‑Loop Protocol | Your decision points and valid responses | `RPAS-HIL.md` |
| `OPM‑001` | Operator Manual (this document) | Plain‑language guide to everything above | `RPAS-OPM.md` |

## The Five Guardrails (G1–G5) in Plain Language

| # | Name | In Plain Language |
|---|---|---|
| G1 | Authority Boundary | AI suggests. You decide. The system does. |
| G2 | Lifecycle Integrity | Every change follows the same steps, in order, with no shortcuts. |
| G3 | Evidence & Lineage | Everything is recorded. Nothing is deleted. You can always trace back. |
| G4 | Determinism | The same action always produces the same result. No surprises. |
| G5 | Read vs. Act | The dashboard shows information. Only the orchestrator makes changes. |

## Operator Responsibilities Summary

| You Must | You Must Not |
|---|---|
| Read the scope before approving | Approve what you don't understand |
| Respond explicitly (yes/no/adjust) | Give ambiguous or partial responses |
| Report unexpected agent behavior | Assume the agent is always right |
| Ask for explanations when needed | Rush through approvals |
| Treat every task as governed | Consider anything "too small" for governance |

***

## Governance Lineage

| Field | Value |
|---|---|
| Artifact ID | `RPAS‑CM‑OPM‑001` |
| Version | `v1.0.0` |
| Maturity | ADPA Baseline |
| Parent | `RPAS‑CM‑GRA‑001 v2.0.0 (CSR‑42)` |
| Consolidates | `GRA‑001`, `ENV‑001`, `AEV‑001`, `TCL‑001`, `PRE‑001`, `ESC‑001`, `HIL‑001` |
| Author | Agent (advisory) — awaiting human decision |
| CSR Epoch | Pending attestation |
