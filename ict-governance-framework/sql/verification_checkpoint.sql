-- Signed verification checkpoints — operational rollback with immutable audit lineage (RPAS VB-CP)

CREATE TABLE IF NOT EXISTS verification_checkpoint_ledger (
  ledger_id SERIAL PRIMARY KEY,
  checkpoint_id VARCHAR(64) NOT NULL,
  verification_run_id UUID NOT NULL,
  event_type VARCHAR(20) NOT NULL
    CHECK (event_type IN ('checkpoint', 'rollback')),
  trigger_source VARCHAR(100) NOT NULL,
  manifest JSONB NOT NULL,
  manifest_hash CHAR(64) NOT NULL,
  previous_manifest_hash CHAR(64),
  rollback_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vcl_run ON verification_checkpoint_ledger(verification_run_id);
CREATE INDEX IF NOT EXISTS idx_vcl_checkpoint ON verification_checkpoint_ledger(checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_vcl_event_type ON verification_checkpoint_ledger(event_type);

ALTER TABLE governance_incidents
  ADD COLUMN IF NOT EXISTS verification_run_id UUID;

CREATE INDEX IF NOT EXISTS idx_governance_incidents_verification_run
  ON governance_incidents(verification_run_id)
  WHERE verification_run_id IS NOT NULL;

ALTER TABLE governance_incident_ingest_log
  ADD COLUMN IF NOT EXISTS verification_run_id UUID,
  ADD COLUMN IF NOT EXISTS rolled_back_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_incident_ingest_verification_run
  ON governance_incident_ingest_log(verification_run_id)
  WHERE verification_run_id IS NOT NULL;

ALTER TABLE managed_devices
  ADD COLUMN IF NOT EXISTS verification_run_id UUID;

CREATE INDEX IF NOT EXISTS idx_managed_devices_verification_run
  ON managed_devices(verification_run_id)
  WHERE verification_run_id IS NOT NULL;

ALTER TABLE asset_register
  ADD COLUMN IF NOT EXISTS verification_run_id UUID;

CREATE INDEX IF NOT EXISTS idx_asset_register_verification_run
  ON asset_register(verification_run_id)
  WHERE verification_run_id IS NOT NULL;
