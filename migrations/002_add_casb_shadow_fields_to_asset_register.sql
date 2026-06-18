-- Migration 002: CASB shadow IT fields on asset_register (Focus Area 5)

BEGIN;

DO $$ BEGIN
  CREATE TYPE asset_origin AS ENUM ('Managed', 'Shadow_IT', 'CASB_Discovery');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE validation_posture AS ENUM ('Unverified', 'Under_Review', 'Verified', 'Remediated', 'Rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE asset_register
  ADD COLUMN IF NOT EXISTS asset_origin asset_origin DEFAULT 'Managed',
  ADD COLUMN IF NOT EXISTS validation_posture validation_posture DEFAULT 'Verified',
  ADD COLUMN IF NOT EXISTS casb_source_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS casb_discovered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS casb_risk_score INT;

CREATE TABLE IF NOT EXISTS casb_ingest_audit (
  ingest_id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  source_platform VARCHAR(100),
  received_count INT NOT NULL DEFAULT 0,
  ingested_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,
  ingest_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO compliance_controls (control_id, framework, category, name, implementation_status, code_evidence_url, notes)
VALUES (
  'GV.SC.01',
  'NIST_CSF_2.0',
  'GOVERN',
  'Supply Chain Shadow IT Inventory',
  'Partial',
  'https://github.com/CBA-Consult/ICT-Governance-Framework-Application/tree/main/ict-governance-framework/api/asset-router.js',
  'CASB shadow IT discoveries ingested into asset_register via /api/assets/casb-ingest (Focus Area 5).'
)
ON CONFLICT (control_id) DO UPDATE SET
  implementation_status = EXCLUDED.implementation_status,
  code_evidence_url = EXCLUDED.code_evidence_url,
  notes = EXCLUDED.notes,
  last_evaluated = CURRENT_TIMESTAMP;

COMMIT;

CREATE INDEX IF NOT EXISTS idx_asset_register_origin ON asset_register(asset_origin);
CREATE INDEX IF NOT EXISTS idx_asset_register_validation ON asset_register(validation_posture);
CREATE INDEX IF NOT EXISTS idx_asset_register_casb_source ON asset_register(casb_source_id);
