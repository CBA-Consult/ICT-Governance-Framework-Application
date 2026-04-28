# ✅ **RPAS‑CM Gate 5 Control‑Flow (DRACO)**

The following diagram illustrates the **Semantic Integrity** validation flow during the RPAS lifecycle. It highlights the transition from **Advisory** (Phases 1-2) to **Blocking** (Phase 3) enforcement.

```mermaid
graph TD
    Start([Initiate RPAS Validation]) --> GetContext[Load Context: git diff + attestation]
    GetContext --> PhaseCheck{Ritual Phase?}
    
    PhaseCheck -- "1 (Propose) or 2 (Decide)" --> SetAdvisory[Set Mode: ADVISORY]
    PhaseCheck -- "3 (Orchestrate)" --> SetBlocking[Set Mode: BLOCKING]
    
    SetAdvisory --> DRACO
    SetBlocking --> DRACO
    
    subgraph DRACO Board ["DRACO Review Board (Gate 5)"]
        direction TB
        EV[Evidence Validator: grounding check]
        GE[Governance Evaluator: policy check]
        CC[Counterfactual Challenger: Mythos check]
    end
    
    DRACO --> EV
    DRACO --> GE
    DRACO --> CC
    
    EV & GE & CC --> Consolidate[Consolidate Board Verdict]
    
    Consolidate --> GateCheck{Verdict: Pass?}
    
    GateCheck -- Yes --> PassGate[✅ Gate 5 Passed]
    GateCheck -- No --> ModeCheck{Enforcement Mode?}
    
    ModeCheck -- Advisory --> Warn[⚠️ Warning: Semantic Risks Detected]
    Warn --> PassGate
    
    ModeCheck -- Blocking --> FailGate[❌ Gate 5 Failed: Critical Semantic Risk]
    
    PassGate --> Continue[Continue AEV Pipeline]
    FailGate --> Halt[🛑 HALT Execution: Revert Mutations]

    style SetBlocking fill:#f96,stroke:#333,stroke-width:2px
    style FailGate fill:#ff9999,stroke:#c00,stroke-width:2px
    style DRACO Board fill:#f0f7ff,stroke:#005bb7
```

---

## **Key Governance Invariants**

1.  **Authority Sovereignty**: AI cannot block human decisions (Gate 5 = Advisory during Phase 2).
2.  **Execution Immunity**: AI cannot execute ambiguous or unauthorized logic (Gate 5 = Blocking during Phase 3).
3.  **Mythos Prevention**: The Counterfactual Challenger specifically audits for "Shadow Initiative" that was NOT requested in the attestation.

---
**Baseline**: RPAS-CM v2.3.0
**Owner**: DRACO AI Review Board
