# ✅ **RPAS‑CM‑ENV‑001 v2.3.0 (CSR‑42)**
## **ADPA Framework Agent Envelope**

***

## ✅ **RPAS‑CM Naming Convention & Versioning System**

### **1. Artifact Identity Prefix**

| Prefix | Meaning                       | Examples                     |
| ------ | ----------------------------- | ---------------------------- |
| `GRA`  | Governance Rule Artifact      | RPAS‑CM‑GRA‑001 (Guardrails) |
| `ENV`  | Agent Envelope Artifact       | RPAS‑CM‑ENV‑001 (GEMINI.md)  |
| `AEV`  | Atomic Execution & Validation | RPAS‑CM‑AEV‑001              |
| `CSR`  | Certified Stable Release      | CSR‑36, CSR‑42               |
| `AMD`  | Amendment Record              | AMD‑2026‑04‑09‑0007          |

***

### **2. Version Maturity Levels**

All governance artifacts adhere to the same progression:

| Version | Meaning                                    |
| ------- | ------------------------------------------ |
| `v0.x`  | Exploration (not governed)                 |
| `v1.x`  | ADPA Baseline                              |
| `v2.x`  | RPAS‑Aligned Governance                    |
| `v3.x`  | DRACO‑Supervised & Lineage Bound           |
| `v4.x`  | Fully deterministic AI‑assisted governance |

***

### **3. Amendment Naming & Change Types**

Each amendment uses the canonical form:
`AMD‑YYYY‑MM‑DD‑#### (Semantic Description)`

**Change Types**:
- `EXP` — Expansion
- `REP` — Replacement
- `FIX` — Hotfix
- `DEL` — Deprecation
- `INT` — Integration
- `NEW` — New governance artifact

***

## Project Overview (RPAS-CM Certified)

ADPA is a **governed execution platform** built on the **RPAS-CM (Regulated Process Assurance System - Cloud Master)** methodology. It is organized into four logical tiers with strictly enforced operational boundaries:

-   **Intelligence Tier (Advisory‑Only)**: Python FastAPI services (located in `AI-Foundry-Projects/services/intelligence`) handle advanced AI processing and PMBOK‑aligned reasoning. **Constraint**: Advisory JSON only; no state mutation.
-   **Orchestration Tier (Authority)**: A **.NET 10** backend orchestrated by **.NET Aspire 13.2.2**.
    -   `Adpa.AppHost`: The central orchestrator project that manages service discovery, secrets, and telemetry for the entire stack.
    -   `Adpa.Orchestrator` (apiservice): The sole execution authority for governance rituals.
-   **Experience Tier (Read‑Only/Decision)**: Multi-platform management interfaces.
    -   `Adpa.Web`: The **Governor Portal** (Blazor) for high-integrity decisions and execution.
    -   Next.js Frontend: The **Researcher Dashboard** for read‑only exploration and AI‑assisted drafting.
-   **Data Tier (Append‑Only)**: PostgreSQL (Governance Ledger), RabbitMQ, and Redis.

### Core Technologies

- **Languages**: C# (.NET 10), Python (3.12+), TypeScript, SQL.
- **Frameworks**: .NET Aspire 13.2.2, FastAPI, Next.js, Blazor.
-   **Messaging/Storage**: MassTransit (RabbitMQ), Drizzle ORM (PostgreSQL), Entity Framework Core.
-   **AI Integration**: OpenAI, Google AI (Gemini), Ollama, and Langfuse for tracing.

## Agent Skills System

The project utilizes a specialized "Skills" system to provide domain-specific knowledge and procedural guidance to AI agents (like Gemini CLI or Cursor). This system is critical for ensuring that agent-driven changes are consistent with the project's architecture and best practices.

-   **Location**: Skills are defined in the `skills/` directory and the root directory. Each skill consists of a `SKILL.md` file that contains the core documentation and procedural logic.
-   **Purpose**: Each skill gives the agent instructions on how to handle specific tasks, such as deploying to Railway, implementing a digital twin feature, or adding a new document template. They define when the skill should be triggered, the steps to take, and important context.
-   **Loading**: These skill files are actively loaded at runtime by the AI agent. When you make a request, the agent matches your request to the "When to use" triggers defined in the skill files to apply the correct procedure.
-   **Convention**: When adding or modifying a significant feature, you should also create or update the corresponding `SKILL.md` file. This ensures the project's architectural knowledge is captured and can be used by the agent for future tasks.

## Building and Running

The project uses `pnpm` as its package manager. The `README.md` and `package.json` provide the necessary commands to run the application.

### Key Commands

-   **Install Dependencies**:
    ```bash
    pnpm install
    ```
    *Note: The `README.md` also mentions running `npm install` inside a `server` directory, suggesting the backend has its own `package.json`.*

-   **Run Development Servers**:
    The frontend and backend run as separate processes.

    *   **Frontend (Next.js)**:
        ```bash
        pnpm dev
        ```
        This starts the Next.js development server on `http://localhost:3005`.

    *   **Backend (Express.js)**:
        Based on the `README.md`, the command is:
        ```bash
        # From the root directory
        cd server && npm run dev
        ```
        This likely starts the Express server on `http://localhost:5000`.

-   **Build for Production**:
    ```bash
    pnpm build
    ```

-   **Run Production Server**:
    ```bash
    pnpm start
    ```

-   **Linting**:
    ```bash
    pnpm lint
    ```

### Full Orchestration (Aspire)

The entire polyglot stack is orchestrated using .NET Aspire. This is the recommended way to run the project locally.

-   **Run Full Stack**:
    ```bash
    dotnet run --project orchestrator/Adpa.AppHost
    ```
    This starts the interactive Dashboard on `http://localhost:18888`, providing real-time logs, metrics, and traces for all services (Intelligence, Orchestrator, Web).

### Database Migrations

Drizzle Kit is used for managing database schemas and migrations.

-   **Apply Migrations**:
    ```bash
    pnpm migrate
    ```

-   **Reset and Seed Database (for development)**:
    ```bash
    pnpm migrate:dev
    ```

## Development Conventions

-   **Tech Stack**: Strictly use TypeScript for all new code. Adhere to the established stack (Next.js, Drizzle, tRPC, etc.).
-   **Styling**: Use Tailwind CSS for styling, following the configuration in `tailwind.config.ts`.
-   **Components**: Reusable UI components are located in the `components/` directory.
-   **API Routes**:
    -   Next.js API routes under `app/api/morphic/` handle client-side calls that are processed by the Next.js server itself.
    -   Most API calls (to `/api/*`) are proxied to the external Express backend.
-   **Database Schema**: All database schema changes must be managed through Drizzle ORM and migrations. The schema is located at `lib/morphic/db/schema.ts`.
-   **Environment Variables**: Use the `.env.local.example` file as a template for local development. Do not commit `.env.local` files to version control.
-   **Mandatory Change Protocol**: All agent-driven edits must follow the **Atomic Execution & Validation (AEV)** workflow. See [CONTRIBUTING.md](file:///f:/Source/Repos/adpa/governance/CONTRIBUTING.md) for the full specification and validation gates.

## DRACO AI Governance

The framework incorporates **DRACO** (Document Reasoning and Assessment Compliance Orchestra), an automated AI Review Board for enterprise-grade quality control.

-   **Architecture**: Multi-agent orchestration using specialized roles (Evidence Validator, Governance Evaluator, Counterfactual Challenger).
-   **Modes**:
    -   **Advisory**: High-integrity feedback without blocking workflow.
    -   **Blocking**: Mandatory quality gates for high-risk templates.
-   **Human Accountability**: Blocked documents require a formal human override with justification, which is logged for security auditing.
-   **Observability**: Real-time progress streaming with per-member elapsed timers and "high-convergence" detection to surface shared model blind spots.
-   **Documentation**: See [ADR-004](file:///f:/Source/Repos/adpa/docs/07-architecture/ADR-004-DRACO-AI-GOVERNANCE.md) and the [Governance Lifecycle Diagram](file:///f:/Source/Repos/adpa/governance/visuals/RPAS-TAR-COL-Matrix.md).
