-- Sprint A mandatory controls: correlation ID, ingest audit log, SLA columns
-- Cross-system lineage: input → transformation → output

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE governance_incidents
  ADD COLUMN IF NOT EXISTS correlation_id UUID,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS remediated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_incidents_correlation ON governance_incidents(correlation_id);

CREATE TABLE IF NOT EXISTS governance_incident_ingest_log (
  id SERIAL PRIMARY KEY,
  correlation_id UUID NOT NULL,
  incident_id INT REFERENCES governance_incidents(incident_id) ON DELETE SET NULL,
  raw_payload JSONB NOT NULL,
  processed_fields JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incident_ingest_correlation ON governance_incident_ingest_log(correlation_id);
CREATE INDEX IF NOT EXISTS idx_incident_ingest_incident ON governance_incident_ingest_log(incident_id);

-- FAIR calculation audit trail (incident → ALE delta)
CREATE TABLE IF NOT EXISTS fair_risk_calculation_log (
  id SERIAL PRIMARY KEY,
  correlation_id UUID,
  trigger_source VARCHAR(50) NOT NULL,
  incident_id INT,
  ale_before_usd NUMERIC(14, 2),
  ale_after_usd NUMERIC(14, 2),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fair_calc_correlation ON fair_risk_calculation_log(correlation_id);
CREATE INDEX IF NOT EXISTS idx_fair_calc_incident ON fair_risk_calculation_log(incident_id);

-- Extend FAIR telemetry tables for cross-domain correlation
ALTER TABLE fair_risk_telemetry_log
  ADD COLUMN IF NOT EXISTS correlation_id UUID;

ALTER TABLE fair_risk_enterprise_history
  ADD COLUMN IF NOT EXISTS correlation_id UUID,
  ADD COLUMN IF NOT EXISTS trigger_source VARCHAR(50);
