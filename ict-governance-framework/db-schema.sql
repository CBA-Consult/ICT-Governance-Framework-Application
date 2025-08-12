-- SQL script to set up the required tables for the ICT Governance Framework backend

-- Defender for Cloud Apps activities table
CREATE TABLE IF NOT EXISTS defender_activities (
  _id TEXT PRIMARY KEY,
  timestamp TIMESTAMP,
  event_type TEXT,
  user_name TEXT,
  app_name TEXT,
  description TEXT,
  raw_json JSONB
);

-- (Add more tables below as needed for your application)

-- Example: Application procurement requests (if needed)
-- CREATE TABLE IF NOT EXISTS application_procurement_requests (
--   id SERIAL PRIMARY KEY,
--   application_name TEXT NOT NULL,
--   vendor TEXT,
--   requested_by TEXT,
--   department TEXT,
--   estimated_users INTEGER,
--   estimated_cost TEXT,
--   urgency TEXT,
--   data_classification TEXT,
--   compliance_requirements TEXT[],
--   status TEXT,
--   submission_date DATE,
--   approval_workflow JSONB,
--   business_justification TEXT
-- );
