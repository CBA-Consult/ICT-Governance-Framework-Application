-- DR verification fields on asset_register (mirrors migrations/001_add_dr_fields_to_asset_register.sql)

DO $$ BEGIN
  CREATE TYPE dr_validation_state AS ENUM ('Stable', 'DR_Hydrated', 'Stale_Drill', 'Failed_Validation');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE asset_register
  ADD COLUMN IF NOT EXISTS dr_status dr_validation_state DEFAULT 'Stable',
  ADD COLUMN IF NOT EXISTS last_dr_drill_timestamp TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS dr_audit_ledger_reference VARCHAR(255),
  ADD COLUMN IF NOT EXISTS rto_seconds INT,
  ADD COLUMN IF NOT EXISTS rpo_flag_triggered BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS governance_metric_snapshots (
  metric_code VARCHAR(100) PRIMARY KEY,
  current_value DECIMAL(10, 4) NOT NULL DEFAULT 0,
  target_value DECIMAL(10, 4) NOT NULL DEFAULT 85,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_context TEXT
);

INSERT INTO governance_metric_snapshots (metric_code, current_value, target_value, last_context)
VALUES (
  'KPI-GOV-AUTOMATION-TARGET',
  0,
  85,
  'Initialized for Gate B DR hydration metric tracking'
)
ON CONFLICT (metric_code) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_asset_register_dr_status ON asset_register(dr_status);
