-- Phase 4: FAIR model calibration — observed frequency → tunable parameters (GV.RM)
-- Audit trail for TEF / vulnerability / MITRE weight adjustments

BEGIN;

ALTER TABLE fair_risk_scenarios
  ADD COLUMN IF NOT EXISTS tef_calibration_factor NUMERIC(6, 4) NOT NULL DEFAULT 1.0000,
  ADD COLUMN IF NOT EXISTS vulnerability_calibration_factor NUMERIC(6, 4) NOT NULL DEFAULT 1.0000;

DO $$ BEGIN
  ALTER TABLE fair_risk_scenarios
    ADD CONSTRAINT chk_tef_calibration_factor
    CHECK (tef_calibration_factor >= 0.5 AND tef_calibration_factor <= 2.0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE fair_risk_scenarios
    ADD CONSTRAINT chk_vuln_calibration_factor
    CHECK (vulnerability_calibration_factor >= 0.5 AND vulnerability_calibration_factor <= 2.0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS fair_model_calibration_log (
  id SERIAL PRIMARY KEY,
  calibration_target VARCHAR(50) NOT NULL,
  scenario_id VARCHAR(50),
  technique VARCHAR(20),
  observed_frequency NUMERIC(10, 4),
  expected_frequency NUMERIC(10, 4),
  frequency_ratio NUMERIC(8, 4),
  adjustment_factor NUMERIC(6, 4) NOT NULL,
  previous_value NUMERIC(10, 4),
  new_value NUMERIC(10, 4),
  window_days INT NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR(100) DEFAULT 'system',
  correlation_id UUID,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_fair_calibration_scenario ON fair_model_calibration_log (scenario_id);
CREATE INDEX IF NOT EXISTS idx_fair_calibration_technique ON fair_model_calibration_log (technique);
CREATE INDEX IF NOT EXISTS idx_fair_calibration_applied ON fair_model_calibration_log (applied_at DESC);

COMMIT;
