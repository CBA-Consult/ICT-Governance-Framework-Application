# ISO/IEC 42001:2023 — AI Management System

**Standard:** ISO/IEC 42001:2023 — Artificial intelligence — Management system  
**Tier:** 3 — Emerging (elevated priority)  
**Framework role:** **AI governance** for control plane, ADPA, and EU AI Act alignment

---

## Overview

ISO/IEC 42001 specifies requirements for an AI management system (AIMS). The framework includes AI governance scope (AI control plane, EU AI Act in A033) but did not previously inventory 42001 formally.

---

## AIMS elements ↔ framework

| Element | Framework implementation | Status |
|---------|-------------------------|--------|
| AI policy | AI governance policies, RPAS AI guardrails | Documented |
| Risk assessment | ISO/IEC 23053, NIST AI RMF references in A033 | Emerging |
| AI system inventory | AI control plane registry | Partial |
| Lifecycle controls | ADPA template lifecycle, AI control plane service | Partial–live |
| Monitoring | Governance metrics, compliance lineage | Partial |
| Continual improvement | Improvement focus area 8 (AI/ML governance) | Planned |

---

## Implementation evidence

| Component | Location |
|-----------|----------|
| AI control plane service | `ict-governance-framework/services/ai-control-plane-service.js` |
| AI control plane registry | `adpa/coe/ai-control-plane-registry.json` |
| AI control plane bridge | `adpa/coe/ai-control-plane-bridge.json` |
| EU AI Act (A033) | 40% claimed — conditional applicability |
| ISO/IEC 23053 (A033) | 30% claimed |

---

## Posture (June 2026)

**~35–45%** — early stage; add to formal Tier 2 when AI service offers expand.

---

## Recommended actions

1. Add 42001 to [ISO Standards Inventory](../ISO-Standards-Inventory.md) Tier 2 when scoped  
2. Map AI control plane registry entries to 42001 control objectives  
3. Cross-reference EU AI Act risk tiers with 42001 risk treatment

---

## Related

- [ICT Governance Framework § emerging tech](../../governance-framework/core-framework/ICT-Governance-Framework.md)
- [Reassessment 2026](../ISO-Standards-Reassessment-2026.md)
- [Implementation Roadmap](../crosswalks/ISO-Standards-Implementation-Roadmap.md)
