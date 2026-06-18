-- Gate B G-B2: Bind governance incidents to multi-cloud asset register

ALTER TABLE governance_incidents
  ADD COLUMN IF NOT EXISTS asset_id VARCHAR(255) REFERENCES asset_register(asset_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_incidents_asset ON governance_incidents(asset_id);

INSERT INTO compliance_controls (control_id, framework, category, name, implementation_status, code_evidence_url, notes)
VALUES (
  'RS.MA.01',
  'NIST_CSF_2.0',
  'RESPOND',
  'Incident Management Playbook Execution',
  'Partial',
  'https://github.com/CBA-Consult/ICT-Governance-Framework-Application/tree/main/ict-governance-framework/api/governance-router.js',
  'Sentinel/SIEM incidents correlated to asset_register via G-B2 asset_id binding.'
)
ON CONFLICT (control_id) DO UPDATE SET
  implementation_status = EXCLUDED.implementation_status,
  code_evidence_url = EXCLUDED.code_evidence_url,
  notes = EXCLUDED.notes,
  last_evaluated = CURRENT_TIMESTAMP;
