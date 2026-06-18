-- Sprint A lifecycle: workflow events + persisted SLA breach flags

ALTER TABLE governance_incidents
  ADD COLUMN IF NOT EXISTS sla_ack_breached BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sla_resolution_breached BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

CREATE TABLE IF NOT EXISTS incident_workflow_events (
  id SERIAL PRIMARY KEY,
  incident_id INT NOT NULL REFERENCES governance_incidents(incident_id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  actor VARCHAR(255),
  correlation_id UUID,
  event_metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incident_workflow_incident ON incident_workflow_events(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_workflow_correlation ON incident_workflow_events(correlation_id);
