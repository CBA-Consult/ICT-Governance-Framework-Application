# 📊 **RPAS‑TAR‑COL Collision Matrix**

## **Collision Matrix Overview**

This matrix maps the **Collision‑Prevention (CP)** measures of the **TAR‑COL‑001** protocol against the primary failure modes in multi‑agent and multi‑tier environments.

| Scenario | Mode | Source | TAR Rule | CP Measure |
| :--- | :--- | :--- | :--- | :--- |
| **COL‑OVERWRITE** | Physical | Concurrent file edits | T3 (Authority) | CP2 (Execution Lock) |
| **COL‑DEPENDENCY** | Mechanical | Missing prerequisites | T5 (Ritual) | CP5 (Topology Check) |
| **COL‑SCOPE** | Logical | Ambiguous scope | T4 (Responsibility) | COL-G1 (Task Allocation) |
| **COL‑RACE** | Runtime | Shared resource contention | T3 (Authority) | COL-G3 (Pessimistic Lock) |
| **COL‑INTENT** | Semantic | Divergent interpretations | T1 (Traceability) | CP4 (DRACO Validation) |
| **COL‑AUTHORITY** | Governance | Tier boundary breach | T4 (Responsibility) | CP1 (Tier Prevention) |

***

## **Authority Boundary Diagram (Mermaid)**

```mermaid
graph TD
    subgraph "Intelligence Tier (Python)"
        A["RTM Advisor / LLM"] -->|Propose Advisory JSON| B["Research Dashboard"]
    end

    subgraph "Experience Tier (Next.js / Blazor)"
        B -->|Draft Proposal| C["Governor Portal"]
        C -->|Decision Ritual| D["Orchestrator"]
    end

    subgraph "Orchestration Tier (.NET 10)"
        D -->|Execution Ritual| E["Data Ledger"]
        D -->|AEV Gate 4 Attestation| F["CSR Stamping"]
    end

    subgraph "Data Tier (PostgreSQL)"
        E -->|Append-Only| G[("Governance History")]
    end

    style D fill:#f96,stroke:#333,stroke-width:4px
    style G fill:#bbf,stroke:#333,stroke-width:2px
```

***

## **Collision Prevention Flow (Multi-Agent)**

```mermaid
sequenceDiagram
    participant A1 as Agent 1
    participant TAR as RPAS-TAR Registry
    participant A2 as Agent 2
    participant H as Human Governor

    Note over A1, A2: Multi-Agent Parallel Scoping
    A1->>TAR: PRE-001 Check (Task ID: 101)
    TAR-->>A1: Scope Clear
    A1->>TAR: COL-G3 Claim Scope (Path: /server/...)
    Note right of TAR: Path Locked for Agent 1
    
    A2->>TAR: PRE-001 Check (Task ID: 102)
    A2->>TAR: COL-G3 Request Overlap Scope
    TAR-->>A2: [REJECT] Collision Detected (COL-OVERWRITE)
    
    A2->>H: ESC-MULTI (Escalation)
    H->>A2: Re-assign Scope or Wait
```

***

## **Enforcement Guarantees**

1.  **Zero-Mutation Outside Rituals**: No component can modify the ledger without a valid `DecisionID` and `AmendmentID`.
2.  **Explicit Authority**: The Experience Tier is physically prohibited from executing state changes.
3.  **Auditability**: Every change in the matrix is attributable to a specific CSR epoch and actor.
