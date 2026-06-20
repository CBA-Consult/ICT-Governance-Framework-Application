-- Pillar 2 — Managed endpoint devices (identity-linked inventory)

CREATE TABLE IF NOT EXISTS managed_devices (
  device_id VARCHAR(50) PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  hostname VARCHAR(255) NOT NULL,
  owner_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
  device_type VARCHAR(20) NOT NULL
    CHECK (device_type IN ('laptop', 'desktop', 'server', 'mobile')),
  os VARCHAR(100),
  compliance_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (compliance_status IN ('pending', 'compliant', 'non_compliant')),
  last_compliance_check_at TIMESTAMP WITH TIME ZONE,
  last_compliance_checks JSONB,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  registered_by VARCHAR(50),
  UNIQUE (tenant_id, hostname)
);

CREATE INDEX IF NOT EXISTS idx_managed_devices_owner ON managed_devices(owner_id);
CREATE INDEX IF NOT EXISTS idx_managed_devices_tenant ON managed_devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_managed_devices_compliance ON managed_devices(compliance_status);

ALTER TABLE managed_devices
  ADD COLUMN IF NOT EXISTS last_compliance_check_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_compliance_checks JSONB;
