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

-- Feedback and Escalation Management Tables

-- Feedback submissions table
CREATE TABLE IF NOT EXISTS feedback_submissions (
    id SERIAL PRIMARY KEY,
    feedback_id VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    contact_info VARCHAR(255),
    anonymous BOOLEAN DEFAULT FALSE,
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledgment_sent BOOLEAN DEFAULT FALSE,
    first_response_date TIMESTAMP,
    resolution_date TIMESTAMP,
    assigned_to VARCHAR(255),
    escalation_level INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback activity log table
CREATE TABLE IF NOT EXISTS feedback_activity_log (
    id SERIAL PRIMARY KEY,
    feedback_id VARCHAR(50) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedback_submissions(feedback_id)
);

-- Escalations table
CREATE TABLE IF NOT EXISTS escalations (
    id SERIAL PRIMARY KEY,
    escalation_id VARCHAR(50) UNIQUE NOT NULL,
    feedback_id VARCHAR(50) NOT NULL,
    escalation_level INTEGER NOT NULL,
    escalated_to VARCHAR(255) NOT NULL,
    escalated_to_role VARCHAR(100),
    escalation_reason TEXT NOT NULL,
    escalation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed', 'Escalated')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    category VARCHAR(50),
    resolution_date TIMESTAMP,
    resolved_by VARCHAR(255),
    resolution_notes TEXT,
    escalated_to_escalation_id VARCHAR(50),
    parent_escalation_id VARCHAR(50),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedback_submissions(feedback_id),
    FOREIGN KEY (parent_escalation_id) REFERENCES escalations(escalation_id)
);

-- Escalation activity log table
CREATE TABLE IF NOT EXISTS escalation_activity_log (
    id SERIAL PRIMARY KEY,
    escalation_id VARCHAR(50) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (escalation_id) REFERENCES escalations(escalation_id)
);

-- SLA monitoring table
CREATE TABLE IF NOT EXISTS sla_monitoring (
    id SERIAL PRIMARY KEY,
    feedback_id VARCHAR(50) NOT NULL,
    sla_type VARCHAR(50) NOT NULL CHECK (sla_type IN ('Acknowledgment', 'Response', 'Resolution')),
    threshold_minutes INTEGER NOT NULL,
    actual_minutes INTEGER,
    sla_met BOOLEAN,
    breach_date TIMESTAMP,
    monitored_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedback_submissions(feedback_id)
);

-- Feedback categories configuration table
CREATE TABLE IF NOT EXISTS feedback_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    default_assignee VARCHAR(255),
    escalation_path JSONB,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default feedback categories
INSERT INTO feedback_categories (category_name, description, default_assignee) VALUES
('Policy', 'Policy and governance related feedback', 'policy-custodian@company.com'),
('Process', 'Process and procedures related feedback', 'process-custodian@company.com'),
('Technology', 'Technology and systems related feedback', 'tech-custodian@company.com'),
('Service', 'Service delivery related feedback', 'service-custodian@company.com'),
('Compliance', 'Compliance and risk related feedback', 'compliance-custodian@company.com'),
('Training', 'Training and support related feedback', 'training-custodian@company.com'),
('Other', 'Other feedback not covered by specific categories', 'custodian@company.com')
ON CONFLICT (category_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback_submissions(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback_submissions(category);
CREATE INDEX IF NOT EXISTS idx_feedback_submitted_date ON feedback_submissions(submitted_date);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_priority ON escalations(priority);
CREATE INDEX IF NOT EXISTS idx_escalations_level ON escalations(escalation_level);
CREATE INDEX IF NOT EXISTS idx_escalations_date ON escalations(escalation_date);

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
