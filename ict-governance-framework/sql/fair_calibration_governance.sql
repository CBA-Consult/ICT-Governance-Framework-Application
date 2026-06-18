-- Phase 4.2: Calibration governance — approvals, scenario locks, rollback support

BEGIN;

ALTER TABLE fair_risk_scenarios
  ADD COLUMN IF NOT EXISTS calibration_locked BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS fair_calibration_approvals (
  approval_id SERIAL PRIMARY KEY,
  calibration_target VARCHAR(50) NOT NULL DEFAULT 'scenario_tef',
  scenario_id VARCHAR(50),
  technique VARCHAR(20),
  previous_value NUMERIC(10, 4) NOT NULL,
  proposed_value NUMERIC(10, 4) NOT NULL,
  proposed_adjustment_pct NUMERIC(8, 4),
  governance_tier VARCHAR(30) NOT NULL DEFAULT 'pending_approval',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  window_days INT,
  correlation_id UUID,
  calibration_log_id INT,
  observed_frequency NUMERIC(10, 4),
  expected_frequency NUMERIC(10, 4),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  requested_by VARCHAR(100) DEFAULT 'system',
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  CONSTRAINT chk_calibration_approval_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_calibration_approvals_status ON fair_calibration_approvals (status);
CREATE INDEX IF NOT EXISTS idx_calibration_approvals_scenario ON fair_calibration_approvals (scenario_id);

COMMIT;
