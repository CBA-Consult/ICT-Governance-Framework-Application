# ✅ **RPAS‑CM‑ESC‑001 v1.0.0 (CSR‑42)**

### *Ambiguity Escalation Protocol — Deterministic handling of uncertainty in governed agent execution.*

***

## Purpose

Agents operating under RPAS‑CM governance encounter ambiguous situations:
unclear scope, multi‑intent requests, unfamiliar architecture, or conflicting
constraints. Without an explicit protocol, agents resolve ambiguity through
**self‑interpretation** — guessing, inferring, or "helpfully" expanding scope.

This is the single largest source of governance violations in AI‑assisted development.

This artifact eliminates self‑interpretation by defining the **exact behavior**
an agent must follow when any form of ambiguity is detected.

***

## Core Principle

> **Ambiguity is not permission.**
> When an agent is uncertain, the only governed response is to **stop and ask**.
> Self‑interpretation is a governance violation equivalent to unauthorized execution.

***

## Ambiguity Classes

| Class | ID | Trigger | Required Action |
|---|---|---|---|
| **Scope Ambiguity** | `ESC-SCOPE` | Request implies multiple files or changes but does not enumerate them | Stop. Ask operator to declare explicit scope. |
| **Intent Ambiguity** | `ESC-INTENT` | Request could mean different things ("clean up the backend") | Stop. Ask operator to clarify the specific intent. |
| **Classification Ambiguity** | `ESC-CLASS` | Task does not map to any class in `RPAS‑CM‑TCL‑001` | Stop. Ask operator to define the task class. |
| **Authority Ambiguity** | `ESC-AUTH` | Unclear whether the change requires human approval or is pre‑approved | Stop. Default to **requires approval**. Ask. |
| **Architecture Ambiguity** | `ESC-ARCH` | Agent does not understand the component, tier boundary, or data flow | Stop. Research first. If still unclear, ask. |
| **Conflict Ambiguity** | `ESC-CONF` | Two governance rules appear to conflict for this specific task | Stop. Present both rules. Ask operator to arbitrate. |
| **Multi‑Scope Ambiguity** | `ESC-MULTI` | Request contains multiple logical changes bundled together | Stop. Request decomposition into atomic tasks. |

***

## Escalation Procedure

When any ambiguity class is detected, the agent **must** follow this procedure:

### Step 1 — Identify the Ambiguity

State clearly what is ambiguous and which class it falls into.

**Format**:
```
⚠️ Ambiguity Detected: ESC-SCOPE
The request "clean up Aspire files" could affect:
  - .gitignore (add exclusion rules)
  - orchestrator/*/bin/ (delete build artifacts)
  - orchestrator/*/obj/ (delete build artifacts)
  - docker-compose.yml (update volume mounts)

I cannot determine the intended scope without explicit declaration.
```

### Step 2 — Present Options (if applicable)

If the agent can enumerate the plausible interpretations, present them
as a numbered list:

```
Possible interpretations:
  1. Update .gitignore only (TCL-HYG, single file)
  2. Update .gitignore AND delete bin/obj directories (TCL-HYG, multi-file)
  3. Update .gitignore AND restructure orchestrator layout (TCL-REFAC, multi-scope — must split)
```

### Step 3 — Halt and Await Clarification

The agent **must not**:
- ❌ Pick the "most likely" interpretation
- ❌ Pick the "safest" interpretation
- ❌ Proceed with a partial scope
- ❌ Say "I'll do the obvious part and ask about the rest"
- ❌ Apply any change while asking

The agent **must**:
- ✅ Wait for the operator's explicit selection
- ✅ Re‑enter the Preflight Ritual (`RPAS‑CM‑PRE‑001`) at Step 3 once clarified

***

## Prohibited Self‑Interpretation Patterns

The following agent behaviors are **explicit governance violations**:

| Pattern | Why It Violates Governance |
|---|---|
| "This is obviously what you meant" | Violates G1 — agent is assuming decision authority |
| "I'll fix this small thing while I'm at it" | Violates AEV atomicity — undeclared scope expansion |
| "This is a trivial change, no need to ask" | Violates PRE‑001 — skips human authorization step |
| "I'll apply the safe part now and ask about the rest" | Violates AEV — partial execution creates dirty state |
| "No one would object to this improvement" | Violates G1 — agent is predicting human decisions |
| "The previous agent left this mess, I'll clean it up" | Violates TCL‑001 — undeclared task, no classification |
| "Based on the codebase patterns, I'll assume..." | Violates ESC‑001 — self‑interpretation of ambiguity |

***

## Special Case: "Helpful" Self‑Augmentation

A common failure mode is the agent noticing something it considers broken,
outdated, or suboptimal **during** an unrelated task, and deciding to "fix"
it proactively.

**This is explicitly forbidden.**

If an agent discovers an issue during execution of a classified task:

1. **Complete the current task** within its declared scope.
2. **Report the discovered issue** as a separate advisory finding.
3. **Do not modify** anything outside the declared scope.
4. **Do not propose** a combined fix.

The operator will decide whether to create a new task for the discovered issue.

***

## Escalation Output Format

When escalating, the agent should produce a structured block:

```
┌─────────────────────────────────────────────────┐
│  RPAS AMBIGUITY ESCALATION                      │
├─────────────────────────────────────────────────┤
│  Class:       ESC-SCOPE                         │
│  Trigger:     "clean up Aspire files"           │
│  Ambiguity:   Scope not enumerated              │
│  Options:     (1) .gitignore only               │
│               (2) .gitignore + delete bin/obj    │
│               (3) Full restructure (must split)  │
│  Status:      HALTED — awaiting clarification   │
└─────────────────────────────────────────────────┘
```

***

## Integration with Preflight Ritual

The Ambiguity Escalation Protocol is invoked from `RPAS‑CM‑PRE‑001` at **Step 3**
(Task Classification) whenever the agent encounters uncertainty. After
clarification, the agent resumes the Preflight Ritual from the step where
escalation was triggered.

```
PRE Step 3: Classify task
  └─ Cannot classify → Invoke ESC-001
      └─ Present ambiguity
      └─ Halt
      └─ Receive clarification
      └─ Resume PRE Step 3 with clarified scope
```

***

## Governance Lineage

| Field | Value |
|---|---|
| Artifact ID | `RPAS‑CM‑ESC‑001` |
| Version | `v1.0.0` |
| Maturity | ADPA Baseline |
| Parent | `RPAS‑CM‑GRA‑001 v2.0.0 (CSR‑42)` |
| Related | `RPAS‑CM‑TCL‑001`, `RPAS‑CM‑PRE‑001`, `RPAS‑CM‑AEV‑001` |
| Author | Agent (advisory) — awaiting human decision |
| CSR Epoch | Pending attestation |
