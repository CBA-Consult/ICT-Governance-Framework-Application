-- Center of Excellence lifecycle schema
-- Immutable audit trail, versioning, rollback support

DO $$ BEGIN
  CREATE TYPE coe_lifecycle_phase AS ENUM (
    'initiation', 'onboarding', 'active', 'build_update', 'retiring', 'retired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE coe_center_type AS ENUM (
    'templates', 'ai-providers', 'artifacts', 'documents'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS coe_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_type coe_center_type NOT NULL,
  external_ref VARCHAR(255) NOT NULL,
  display_name VARCHAR(500) NOT NULL,
  description TEXT,
  lifecycle_phase coe_lifecycle_phase NOT NULL DEFAULT 'initiation',
  tenant_id VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  current_version INT NOT NULL DEFAULT 1,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coe_items_unique_ref
  ON coe_items (center_type, external_ref, COALESCE(tenant_id, ''));

CREATE TABLE IF NOT EXISTS coe_item_owners (
  owner_id SERIAL PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES coe_items(item_id) ON DELETE CASCADE,
  owner_email VARCHAR(255) NOT NULL,
  owner_role VARCHAR(100) NOT NULL DEFAULT 'domain_owner',
  assigned_by VARCHAR(255),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS coe_business_justifications (
  justification_id SERIAL PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES coe_items(item_id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  value_proposition TEXT,
  cost_of_inaction TEXT,
  risk_assessment TEXT,
  submitted_by VARCHAR(255),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS coe_onboarding_progress (
  progress_id SERIAL PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES coe_items(item_id) ON DELETE CASCADE,
  checklist_item_id VARCHAR(100) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_by VARCHAR(255),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE (item_id, checklist_item_id)
);

CREATE TABLE IF NOT EXISTS coe_training_completions (
  completion_id SERIAL PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES coe_items(item_id) ON DELETE CASCADE,
  module_id VARCHAR(100) NOT NULL,
  completed_by VARCHAR(255) NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  score NUMERIC(5,2),
  UNIQUE (item_id, module_id, completed_by)
);

CREATE TABLE IF NOT EXISTS coe_item_versions (
  version_id SERIAL PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES coe_items(item_id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (item_id, version_number)
);

-- Immutable audit log: INSERT-only at application layer; trigger blocks UPDATE/DELETE
CREATE TABLE IF NOT EXISTS coe_audit_log (
  audit_id BIGSERIAL PRIMARY KEY,
  item_id UUID REFERENCES coe_items(item_id) ON DELETE SET NULL,
  center_type coe_center_type,
  event_type VARCHAR(100) NOT NULL,
  event_action VARCHAR(100) NOT NULL,
  actor_email VARCHAR(255),
  previous_state JSONB,
  new_state JSONB,
  correlation_id UUID DEFAULT gen_random_uuid(),
  checksum VARCHAR(64),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION coe_audit_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'coe_audit_log is immutable — UPDATE and DELETE are not permitted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS coe_audit_log_no_mutate ON coe_audit_log;
CREATE TRIGGER coe_audit_log_no_mutate
  BEFORE UPDATE OR DELETE ON coe_audit_log
  FOR EACH ROW EXECUTE FUNCTION coe_audit_log_immutable();

CREATE INDEX IF NOT EXISTS idx_coe_items_center ON coe_items(center_type);
CREATE INDEX IF NOT EXISTS idx_coe_items_phase ON coe_items(lifecycle_phase);
CREATE INDEX IF NOT EXISTS idx_coe_items_tenant ON coe_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coe_audit_item ON coe_audit_log(item_id);
CREATE INDEX IF NOT EXISTS idx_coe_audit_recorded ON coe_audit_log(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_coe_versions_item ON coe_item_versions(item_id, version_number DESC);
