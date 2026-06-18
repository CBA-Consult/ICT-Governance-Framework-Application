-- JIT elevation ledger (mirrors migrations/003_create_jit_ledger_tables.sql)

DO $$ BEGIN
  CREATE TYPE jit_ticket_status AS ENUM ('Active', 'Expired', 'Revoked', 'Break_Glass_Active');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS jit_elevation_ledger (
  ticket_id VARCHAR(50) PRIMARY KEY,
  requestor_id VARCHAR(100) NOT NULL,
  requested_role VARCHAR(100) NOT NULL,
  justification TEXT NOT NULL,
  scope_tenant VARCHAR(100) NOT NULL,
  approved_by VARCHAR(100)[] NOT NULL,
  approval_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  status jit_ticket_status DEFAULT 'Active',
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason TEXT
);

CREATE TABLE IF NOT EXISTS privileged_action_logs (
  id SERIAL PRIMARY KEY,
  actor_id VARCHAR(100) NOT NULL,
  jit_ticket_id VARCHAR(50) REFERENCES jit_elevation_ledger(ticket_id),
  endpoint VARCHAR(255) NOT NULL,
  http_method VARCHAR(10) NOT NULL,
  action TEXT NOT NULL,
  target_resource_id VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_break_glass BOOLEAN DEFAULT FALSE,
  payload_hash CHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jit_ledger_validity ON jit_elevation_ledger (valid_until, status);
CREATE INDEX IF NOT EXISTS idx_privileged_logs_ticket ON privileged_action_logs (jit_ticket_id);

INSERT INTO governance_metric_snapshots (metric_code, current_value, target_value, last_context)
VALUES (
  'KPI-GOV-BREAK-GLASS-AUDIT',
  0,
  100,
  'Initialized for Break Glass reconciliation audit integrity tracking'
)
ON CONFLICT (metric_code) DO NOTHING;
