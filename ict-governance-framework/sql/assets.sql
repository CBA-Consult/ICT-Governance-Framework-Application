-- Gate B G-B1: Multi-Cloud Asset Register (FR-GOV-004) — ID.AM

DO $$ BEGIN
  CREATE TYPE cloud_provider AS ENUM ('Azure', 'AWS', 'GCP', 'Hybrid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS asset_register (
  asset_id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  provider cloud_provider NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(50) NOT NULL,
  tags JSONB DEFAULT '{}'::jsonb,
  compliance_state VARCHAR(20) DEFAULT 'Unevaluated'
    CHECK (compliance_state IN ('Compliant', 'NonCompliant', 'Unevaluated')),
  last_discovered TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_tenant ON asset_register(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_provider ON asset_register(provider);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON asset_register USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_assets_last_discovered ON asset_register(last_discovered DESC);

INSERT INTO compliance_controls (control_id, framework, category, name, implementation_status, code_evidence_url, notes)
VALUES (
  'ID.AM.01',
  'NIST_CSF_2.0',
  'IDENTIFY',
  'Asset Inventory Baseline',
  'Partial',
  'https://github.com/CBA-Consult/ICT-Governance-Framework-Application/tree/main/ict-governance-framework/api/asset-router.js',
  'Live multi-cloud asset register API (G-B1 / FR-GOV-004). Azure discovery sync when Graph credentials configured.'
)
ON CONFLICT (control_id) DO UPDATE SET
  implementation_status = EXCLUDED.implementation_status,
  code_evidence_url = EXCLUDED.code_evidence_url,
  notes = EXCLUDED.notes,
  last_evaluated = CURRENT_TIMESTAMP;
