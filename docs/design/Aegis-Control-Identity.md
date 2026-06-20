# Aegis Control — Identity & Visual System

## Purpose

This document defines the visual identity for **Aegis Control**, the Digital Governance Control System (DGCS) built on the ICT Governance Framework and powered by the ADPA Governance Engine.

The identity must reflect:

- **Authority** — governance, control
- **Verification** — truth, evidence
- **Action** — remediation, correction
- **Continuity** — closed feedback loop

---

## Brand Positioning

> **Aegis Control verifies, enforces, and restores governed state.**

This is not a monitoring tool or dashboard. This is a **control system for digital infrastructure governance**.

**Related:** [Aegis Control — Product Copy & Positioning](./Aegis-Control-Product-Copy.md)

---

## Logo Direction

### Core Concept

The logo should combine:

1. **Shield (Aegis)** — protection, authority
2. **Control loop / feedback cycle** — continuous governance
3. **State correction / convergence** — divergence → consistent truth

### Primary Mark Concepts

Production SVG assets: [`assets/`](./assets/README.md)

- **Primary** — `aegis-control-logo-primary.svg` (shield + control loop)
- **Convergence** — `aegis-control-logo-convergence.svg` (remediation recovery)
- **Multi-source** — `aegis-control-logo-multisource.svg` (evidence chain)

#### 1. Shield + Control Loop (recommended — primary logo)

- Outer form: shield outline (protection, authority)
- Inner form: circular loop or orbit (feedback system)
- Center: node or checkmark (verified state)

```
[ Shield ]
   ⟳   ← feedback loop
   ●   ← verified state
```

#### 2. Converging Nodes (state correction)

- Multiple points moving toward a center
- Represents divergence → correction → convergence

#### 3. Layered Rings (multi-source validation)

- Concentric rings: Policy · Graph · Sentinel
- Unified at center → **consistent truth**

---

## Wordmark

### Primary

**Aegis Control**

- Font: modern sans-serif (e.g. Inter, IBM Plex Sans, Source Sans 3)
- Weight: semi-bold for "Aegis", regular for "Control"

### Usage

| Context | Use |
|---------|-----|
| Marketing / executive | **Aegis** |
| Product UI / technical | **Aegis Control** |

### Supporting Line

```
ICT Governance Framework · ADPA Engine Powered
```

---

## Color System

### Core Philosophy

Colors represent **state**, not decoration. The same semantic color must mean the same thing in badges, charts, escalation panels, and remediation lifecycle views.

### Primary Palette

| Color | Meaning | Use |
|-------|---------|-----|
| Deep Blue / Indigo (`#312E81` – `#4338CA`) | Authority, governance | Base UI, navigation, primary actions |
| Dark Gray (`#111827` – `#1F2937`) | Neutral system state | Backgrounds, chrome |
| White / Slate 50 | Clarity, structure | Surfaces, cards |

### State Colors (Critical)

These define the control system states:

| Semantic | Hex | Meaning |
|----------|-----|---------|
| **Verified** | `#22C55E` | Evidence consistent, high confidence |
| **Drift / Partial** | `#F59E0B` | Incomplete or uncertain state |
| **Divergent / Critical** | `#EF4444` | Cross-source conflict |
| **Remediating** | `#3B82F6` | Active correction |
| **Pending / Unknown** | `#6B7280` | Not yet evaluated |

Tailwind mapping (recommended for the web app):

| Semantic | Tailwind |
|----------|----------|
| Verified | `emerald-500` / `emerald-600` |
| Partial | `amber-500` / `amber-600` |
| Divergent / Failed | `rose-500` / `rose-600` |
| Remediating / Running | `blue-500` / `blue-600` |
| Pending | `slate-500` / `gray-500` |

---

## State Mapping (UI Contract)

These must align with system states across evidence chains, remediation runs, and escalations:

| System State | UI Color | Label |
|--------------|----------|-------|
| `pending` | Gray | Pending |
| `running` | Blue | Remediating |
| `completed` | Blue | Completed |
| `verified` | Green | Verified |
| `closed` | Green | Closed |
| `failed` | Red | Failed |
| `divergent` | Red | Divergent |
| `partial` | Amber | Partial |
| `consistent` | Green | Consistent |

**Rule:** Never use red for informational alerts; reserve red for **divergent** or **failed** governance states.

---

## Icon System

| Concept | Icon direction |
|---------|----------------|
| Governance | Shield |
| Evidence | Layers / nodes |
| Validation | Checkmark in circle |
| Divergence | Split arrows |
| Remediation | Circular arrows |
| Lineage | Link chain |

Prefer outline icons (Heroicons-style) for consistency with the existing app shell.

---

## Core Visual Motif

### Control Loop Pattern

This should appear across UI and branding:

```
SET → OBSERVE → COMPARE → ACT → VERIFY
```

Visualized as:

- Circular loop
- Rotating states during active remediation
- Feedback arrows returning to verification

Maps to architecture:

| Stage | System artifact |
|-------|-----------------|
| SET | Requirement, Layer 2 baseline |
| OBSERVE | Evidence sources |
| COMPARE | `evidenceChain` resolution |
| ACT | Remediation orchestration |
| VERIFY | `verified` lifecycle state |

---

## UI Design Principles

### 1. State-first UI

Every screen must answer: **"Is the system in the intended state?"**

Lead with state badge + confidence, not raw metrics.

### 2. Evidence visibility

Each control shows:

- Source(s)
- Consistency (`consistent` | `divergent` | `partial`)
- Confidence (`high` | `medium` | `low`)

### 3. Action clarity

When not verified:

- Show remediation path
- Show current lifecycle state (`statusHistory`)
- Show required action (manual L4 vs gated L5)

### 4. No decorative visuals

All visuals must represent state, control, verification, or action.

---

## Motion Guidelines

Subtle, meaningful motion only:

| Motion | Meaning |
|--------|---------|
| Rotating loop | Active remediation (`running`) |
| Pulse | State transition |
| Fade-in check | Verification succeeded (`verified`) |

Avoid decorative animations on dashboards.

---

## Brand Voice

### Tone

- Precise
- Confident
- Evidence-based
- Non-promotional

### Example Language

✅ "Evidence is consistent across sources."  
✅ "Control is verified with high confidence."  
✅ "Remediation restored governed state."

❌ "Everything looks good"  
❌ "System healthy"  
❌ "All systems operational"

Use the [proof clause](./Aegis-Control-Product-Copy.md#proof-clause-canonical) in closure and remediation contexts.

---

## Application Targets (Next Implementation)

Apply this identity consistently in:

| Component | Apply | Status |
|-----------|-------|--------|
| `GovernanceStateBadge` | Shared state → color mapping | ✅ Implemented |
| `lib/governanceState.js` | State resolution helpers | ✅ Implemented |
| `ComplianceEscalationsConsole` | Evidence chain, remediation lifecycle | ✅ Implemented |
| `ResponsibilityBoundaryPanel` | Obligation evidence chain badges | ✅ Implemented |
| Header / app chrome | Wordmark, tagline, primary logo | ✅ Done |

---

## Summary

The Aegis Control identity must reflect:

- **Authority** — governance is enforced, not suggested
- **Verification** — truth is proven, not assumed
- **Correction** — systems are restored, not just observed
- **Continuity** — governance is a continuous loop

---

## One-Line Definition

> Aegis Control is a visual and functional representation of a Digital Governance Control System — continuously validating and restoring the intended state of enterprise systems.
