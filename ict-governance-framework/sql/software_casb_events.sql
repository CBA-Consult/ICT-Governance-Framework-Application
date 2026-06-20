-- Software pillar — governed CASB shadow IT events (GV.SC)

CREATE TABLE IF NOT EXISTS software_casb_events (
  event_id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  app_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(100),
  device_id VARCHAR(64) REFERENCES managed_devices(device_id) ON DELETE SET NULL,
  risk_level VARCHAR(20) NOT NULL,
  risk_score INT NOT NULL,
  asset_id VARCHAR(500),
  ingest_id VARCHAR(64),
  verification_run_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_software_casb_events_tenant ON software_casb_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_software_casb_events_device ON software_casb_events(device_id);
CREATE INDEX IF NOT EXISTS idx_software_casb_events_user ON software_casb_events(user_id);
CREATE INDEX IF NOT EXISTS idx_software_casb_events_verification ON software_casb_events(verification_run_id);
