# Database Schema Design

Version: 0.1 (Draft)
Date: 2025-08-08
Owner: Architecture & Data Team

## Purpose
Defines the logical and physical data model for the ICT Governance Platform, covering core entities, relationships, naming conventions, indexing/partitioning, and data governance controls for security, privacy, and compliance.

## Design Principles
- Fit-for-purpose stores: OLTP on Azure SQL for transactional consistency; analytical/telemetry on Azure Data Explorer/Synapse; document payloads and large JSON in Azure Cosmos DB where flexible schema helps.
- Privacy by design: data minimization, PII tagging, field-level encryption where needed, clear retention policies.
- Observability and auditability: tamper-evident audit log, data lineage, metadata catalog.
- Multi-cloud friendly, Azure-first: tooling uses Azure SQL/Cosmos DB primitives but abstracts via DAL.
- Versioned, evolvable schema: additive changes preferred; destructive changes behind migrations with backfill.

## Conceptual Model (Core Domains)
- Governance Catalog: Policy, Standard, Control, ControlObjective, Procedure, Evidence, Exception, Waiver.
- Assurance & Risk: Assessment, Finding, Risk, RiskTreatment, Test, ControlTestResult.
- Compliance & Posture: Framework, Requirement, ControlMapping, PostureSnapshot.
- Operations & ITSM: Incident, Change, Problem, Service, CI/Asset, TicketLink.
- Assets & Inventory: Asset, Application, Environment, DataClassification, Owner.
- Identity & Access: User, Group, Role, Permission, Entitlement.
- Workflow: Task, Stage, Approval, Assignment, SLA.
- Integration: Connector, Endpoint, SyncJob, Webhook, ApiCredential.
- Telemetry & Analytics: Event, Metric, Usage, CostRecord, Budget.
- Audit & Metadata: AuditLog, Note, Tag, Attachment, MetadataProperty.

## Logical Entities (Selected)
- Policy (PolicyId, Name, Version, Status, OwnerId, ScopeJson, EffectiveDate, ReviewDate, Tags)
- Control (ControlId, Name, Description, Type, Maturity, PolicyId?, OwnerId, Tags)
- Evidence (EvidenceId, ControlId, Source, CollectedAt, CollectedBy, Hash, StorageUrl, MetadataJson)
- Assessment (AssessmentId, Scope, FrameworkId, ScheduledAt, CompletedAt, Status, OwnerId)
- Finding (FindingId, AssessmentId, Severity, Title, Description, Status, DueDate, OwnerId)
- Risk (RiskId, Title, Description, Impact, Likelihood, InherentScore, ResidualScore, Status, OwnerId)
- Asset (AssetId, Name, Type, Environment, CMDBId?, OwnerId, Criticality, DataClassification)
- User (UserId, UPN, DisplayName, Dept, ManagerId?, RolesJson)
- Workflow Task (TaskId, RefType, RefId, Stage, AssigneeId, DueDate, Status, SLAId)
- AuditLog (AuditId, RefType, RefId, ActorId, Action, At, TamperHash, PrevHash, DetailsJson)
- ApiCredential (ApiCredId, ConnectorId, KeyVaultRef, Scopes, RotatesAt, LastUsedAt)

## Physical Design (Azure SQL)
- Conventions: snake_case table/column names; singular table names; surrogate PKs (INT/BIGINT identity) or GUIDs where distributed creation needed; natural keys enforced with unique indexes.
- Referential integrity: foreign keys with ON UPDATE RESTRICT, ON DELETE NO ACTION; soft-deletes via IsDeleted, DeletedAt; filtered indexes exclude deleted rows.
- Indexing: composite indexes for common predicates (e.g., (policy_id, status), (owner_id, status, due_date)); include columns to cover queries.
- Partitioning: by date for large append-only tables (audit_log by month), by environment/project for evidence where appropriate.
- Row-level security: predicate functions by tenant/org where multi-tenancy applies; security policies to filter.
- Encryption: TDE enabled; Always Encrypted/CMK for high-sensitivity fields (e.g., PII tokens); secrets in Key Vault.

## Physical Design (Cosmos DB)
- Containers: evidence_payloads, posture_snapshots, integration_webhooks, usage_events.
- Partition keys: evidence_payloads by controlId; posture_snapshots by frameworkId; webhooks by connectorId; usage_events by orgId or date.
- Throughput: autoscale; TTL for transient data; analytical store for Synapse link where needed.

## Data Retention & Archival
- Evidence: 18–36 months per policy; hash retained indefinitely for non-repudiation.
- Audit logs: 7 years (regulatory) with WORM storage options.
- Telemetry: 90 days at high fidelity; downsampled aggregates retained 13 months.

## Naming & Standards
- Tables: domain_entity (e.g., governance_policy), PK: entity_id, FK: entity_id referencing parent.
- Columns: use utc suffix for timestamps, json suffix for JSON fields, hash for digests.
- Constraints: CK for enumerations, data ranges; DF for defaults (status, timestamps).

## Example DDL (Excerpt)
```
CREATE TABLE governance_policy (
  policy_id BIGINT IDENTITY PRIMARY KEY,
  name NVARCHAR(200) NOT NULL,
  version NVARCHAR(20) NOT NULL,
  status NVARCHAR(40) NOT NULL,
  owner_id BIGINT NOT NULL,
  scope_json NVARCHAR(MAX) NULL,
  effective_date DATE NULL,
  review_date DATE NULL,
  tags NVARCHAR(400) NULL,
  created_utc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_utc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  is_deleted BIT NOT NULL DEFAULT 0,
  deleted_utc DATETIME2 NULL
);
CREATE UNIQUE INDEX ux_policy_name_version ON governance_policy(name, version);

CREATE TABLE audit_audit_log (
  audit_id BIGINT IDENTITY PRIMARY KEY,
  ref_type NVARCHAR(60) NOT NULL,
  ref_id BIGINT NOT NULL,
  actor_id BIGINT NOT NULL,
  action NVARCHAR(60) NOT NULL,
  at_utc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  details_json NVARCHAR(MAX) NULL,
  prev_hash VARBINARY(64) NULL,
  tamper_hash AS HASHBYTES('SHA2_256', CONCAT(ref_type, ':', ref_id, ':', actor_id, ':', action, ':', CONVERT(nvarchar(30), at_utc, 126), ':', ISNULL(CONVERT(nvarchar(max), details_json), ''), ':', ISNULL(CONVERT(nvarchar(128), prev_hash, 1), ''))) PERSISTED
);
```

## Data Governance & Quality
- Data dictionary: publish in central catalog; include sensitivity labels and owners.
- Lineage: track ETL/ELT jobs in Synapse/ADF with run IDs linking to source/destination.
- Quality controls: nullability rules, duplicate detection, referential checks in nightly validation jobs.

## Migration & Versioning
- Use incremental SQL migration scripts tracked in repo; semantic versioned releases.
- Backfill jobs for new required fields; dual-write or shadow tables for breaking changes during transition.

## Security & Compliance
- RLS, column masking where appropriate; privileged access separated; break-glass procedures.
- Tamper-evident logging as above; regular key rotation via Key Vault.

## Performance Considerations
- Avoid page splits by sizing clustered indexes; monitor IO and adjust fill factor.
- Batch writes; use TVPs for bulk operations; tune parameter sniffing with recompile hints sparingly.

## References
- See: technical-design/system-design-specification.md, security-design-document.md, performance-requirements.md
