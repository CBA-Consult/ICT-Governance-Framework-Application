-- Gate A: Live Compliance & Incident Schema (Focus Areas 1 & 2)
-- Actions 1.1 / 1.2 / 2.1 — authoritative PostgreSQL data layer

DO $$ BEGIN
  CREATE TYPE drift_category AS ENUM (
    'governance', 'architectural', 'process', 'documentation', 'observability', 'security'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tenant_classification AS ENUM (
    'Enterprise', 'Government', 'Healthcare', 'Financial', 'Standard'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tenants (
  tenant_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  classification tenant_classification DEFAULT 'Standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compliance_controls (
  control_id VARCHAR(50) PRIMARY KEY,
  framework VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  implementation_status VARCHAR(20) CHECK (implementation_status IN ('Implemented', 'Partial', 'Planned', 'Gap')),
  last_evaluated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  code_evidence_url TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS governance_incidents (
  incident_id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(50) REFERENCES tenants(tenant_id),
  external_ticket_id VARCHAR(100),
  drift_type drift_category NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  description TEXT NOT NULL,
  status VARCHAR(20) CHECK (status IN ('Detected', 'Acknowledged', 'Remediating', 'Resolved')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_compliance_controls_framework ON compliance_controls(framework);
CREATE INDEX IF NOT EXISTS idx_compliance_controls_status ON compliance_controls(implementation_status);
CREATE INDEX IF NOT EXISTS idx_governance_incidents_tenant ON governance_incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_governance_incidents_status ON governance_incidents(status);
CREATE INDEX IF NOT EXISTS idx_governance_incidents_detected ON governance_incidents(detected_at DESC);

INSERT INTO tenants (tenant_id, name, classification)
VALUES ('tenant-01', 'Contoso Health', 'Healthcare')
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO compliance_controls (control_id, framework, category, name, implementation_status, code_evidence_url, notes) VALUES
('GV.PO.01', 'NIST_CSF_2.0', 'GOVERN', 'Organizational Policy Establishment', 'Partial', 'https://github.com/CBA-Consult/ICT-Governance-Framework-Application/tree/main/docs/policies/', NULL),
('DE.CM.01', 'NIST_CSF_2.0', 'DETECT', 'Continuous Monitoring Integration', 'Partial', 'https://github.com/CBA-Consult/ICT-Governance-Framework-Application/tree/main/ict-governance-framework/app/ciso-dashboard', 'Closed loop + SecOps console + CISO/Executive dashboards live via GET /api/governance/executive/metrics. Strategic Initiatives widget demo-only.'),
('RS.MA.01', 'NIST_CSF_2.0', 'RESPOND', 'Incident Management Playbook Execution', 'Partial', 'https://github.com/CBA-Consult/ICT-Governance-Framework-Application/tree/main/governance/rpas/', NULL),
('PR.DS.01', 'NIST_CSF_2.0', 'PROTECT', 'Data-at-Rest Protection Controls', 'Implemented', 'https://github.com/CBA-Consult/ICT-Governance-Framework-Application/tree/main/ict-governance-framework/middleware/auth.js', NULL),
('ID.AM.01', 'NIST_CSF_2.0', 'IDENTIFY', 'Asset Inventory Baseline', 'Planned', 'https://github.com/CBA-Consult/ICT-Governance-Framework-Application/tree/main/ict-governance-framework/api/data-collection.js', NULL)
ON CONFLICT (control_id) DO UPDATE SET
  implementation_status = EXCLUDED.implementation_status,
  code_evidence_url = EXCLUDED.code_evidence_url,
  notes = EXCLUDED.notes,
  last_evaluated = CURRENT_TIMESTAMP;
