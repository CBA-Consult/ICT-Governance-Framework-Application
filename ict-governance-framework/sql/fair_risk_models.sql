-- FR-GOV-005: Live FAIR risk engine (GV.RM / ID.RA quantitative exposure)
-- Telemetry-driven ALE from asset register, incidents, and JIT/Break Glass ledger

BEGIN;

CREATE TABLE IF NOT EXISTS fair_risk_scenarios (
  scenario_id VARCHAR(50) PRIMARY KEY,
  description TEXT NOT NULL,
  threat_event_frequency NUMERIC(8, 4) NOT NULL,
  vulnerability_percentage NUMERIC(5, 2) NOT NULL,
  min_loss_usd NUMERIC(14, 2) NOT NULL,
  max_loss_usd NUMERIC(14, 2) NOT NULL,
  current_ale_usd NUMERIC(14, 2) DEFAULT 0.00,
  last_computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO fair_risk_scenarios (
  scenario_id, description, threat_event_frequency, vulnerability_percentage, min_loss_usd, max_loss_usd
)
VALUES
  (
    'RSK-SHADOW-IT-LEAK',
    'Data exfiltration via unverified CASB Shadow IT assets',
    12.5, 65.0, 10000.00, 500000.00
  ),
  (
    'RSK-DR-FAILURE',
    'Business interruption due to failed Git-to-Cloud DR hydration',
    2.0, 15.0, 50000.00, 2500000.00
  ),
  (
    'RSK-ADMIN-COMPROMISE',
    'Privilege escalation outside of JIT/Break Glass controls',
    5.0, 25.0, 25000.00, 1000000.00
  )
ON CONFLICT (scenario_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS asset_risk_exposures (
  id SERIAL PRIMARY KEY,
  asset_id VARCHAR(255) NOT NULL,
  scenario_id VARCHAR(50) NOT NULL REFERENCES fair_risk_scenarios(scenario_id) ON DELETE CASCADE,
  dynamic_multiplier NUMERIC(8, 4) DEFAULT 1.0,
  calculated_exposure_usd NUMERIC(14, 2) NOT NULL,
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (asset_id, scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_risk_asset ON asset_risk_exposures(asset_id);
CREATE INDEX IF NOT EXISTS idx_risk_scenario ON asset_risk_exposures(scenario_id);

-- Audit trace: telemetry driver → multiplier (reproducibility for Phase 3)
CREATE TABLE IF NOT EXISTS fair_risk_telemetry_log (
  id SERIAL PRIMARY KEY,
  scenario_id VARCHAR(50),
  driver VARCHAR(100) NOT NULL,
  raw_value NUMERIC(14, 4),
  multiplier_applied NUMERIC(8, 4),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fair_telemetry_scenario ON fair_risk_telemetry_log(scenario_id);
CREATE INDEX IF NOT EXISTS idx_fair_telemetry_recorded ON fair_risk_telemetry_log(recorded_at DESC);

-- Enterprise ALE history for 24h delta KPI
CREATE TABLE IF NOT EXISTS fair_risk_enterprise_history (
  id SERIAL PRIMARY KEY,
  total_ale_usd NUMERIC(14, 2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fair_history_recorded ON fair_risk_enterprise_history(recorded_at DESC);

INSERT INTO governance_metric_snapshots (metric_code, current_value, target_value, last_context)
VALUES (
  'KPI-GOV-TOTAL-RISK-EXPOSURE',
  0,
  0,
  'Initialized FAIR enterprise ALE index (see /api/governance/risk/exposure for USD detail)'
)
ON CONFLICT (metric_code) DO NOTHING;

INSERT INTO governance_metric_snapshots (metric_code, current_value, target_value, last_context)
VALUES (
  'KPI-GOV-RISK-DELTA-24H',
  0,
  0,
  '24-hour change in enterprise ALE (USD millions); positive = exposure increased'
)
ON CONFLICT (metric_code) DO NOTHING;

INSERT INTO compliance_controls (control_id, framework, category, name, implementation_status, code_evidence_url, notes)
VALUES (
  'GV.RM.01',
  'NIST_CSF_2.0',
  'GOVERN',
  'Quantitative FAIR Risk Engine (FR-GOV-005)',
  'Partial',
  'https://github.com/CBA-Consult/ICT-Governance-Framework-Application/tree/main/ict-governance-framework/services/fair-risk-engine.js',
  'Telemetry-driven ALE from asset register, governance incidents, and JIT ledger. Live sweep via POST /api/governance/risk/recalculate.'
)
ON CONFLICT (control_id) DO UPDATE SET
  implementation_status = EXCLUDED.implementation_status,
  code_evidence_url = EXCLUDED.code_evidence_url,
  notes = EXCLUDED.notes,
  last_evaluated = CURRENT_TIMESTAMP;

COMMIT;
