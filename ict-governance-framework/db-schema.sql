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

-- ============================================================================
-- GOVERNANCE WORKFLOW ENGINE TABLES
-- ============================================================================

-- Workflow definitions table - stores reusable workflow templates
CREATE TABLE IF NOT EXISTS workflow_definitions (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Draft', 'Deprecated')),
    workflow_schema JSONB NOT NULL, -- Complete workflow definition including steps, conditions, approvals
    approval_matrix JSONB, -- Default approval matrix for this workflow type
    automation_rules JSONB, -- Automation triggers and actions
    sla_config JSONB, -- SLA thresholds and escalation rules
    notification_config JSONB, -- Notification templates and rules
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_template BOOLEAN DEFAULT TRUE,
    tags TEXT[]
);

-- Workflow instances table - tracks active workflow executions
CREATE TABLE IF NOT EXISTS workflow_instances (
    id SERIAL PRIMARY KEY,
    instance_id VARCHAR(50) UNIQUE NOT NULL,
    workflow_id VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'Initiated' CHECK (status IN ('Initiated', 'In Progress', 'Pending Approval', 'Approved', 'Rejected', 'Completed', 'Cancelled', 'Failed', 'On Hold')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    current_step VARCHAR(100),
    current_step_index INTEGER DEFAULT 0,
    initiated_by VARCHAR(255) NOT NULL,
    assigned_to VARCHAR(255),
    business_context JSONB, -- Business data and context for this instance
    workflow_data JSONB, -- Runtime data and variables
    approval_chain JSONB, -- Current approval chain and status
    automation_status JSONB, -- Status of automated actions
    sla_deadlines JSONB, -- SLA deadlines for current and upcoming steps
    escalation_level INTEGER DEFAULT 0,
    parent_instance_id VARCHAR(50), -- For sub-workflows
    related_entities JSONB, -- Links to related feedback, escalations, etc.
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    due_date TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflow_definitions(workflow_id),
    FOREIGN KEY (parent_instance_id) REFERENCES workflow_instances(instance_id)
);

-- Workflow tasks table - individual tasks within workflow instances
CREATE TABLE IF NOT EXISTS workflow_tasks (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) UNIQUE NOT NULL,
    instance_id VARCHAR(50) NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_index INTEGER NOT NULL,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('Manual', 'Approval', 'Automated', 'Review', 'Decision', 'Notification', 'Integration')),
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Skipped', 'Failed', 'Cancelled', 'Waiting')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    assigned_to VARCHAR(255),
    assigned_role VARCHAR(100),
    task_data JSONB, -- Task-specific data and configuration
    input_data JSONB, -- Input data for the task
    output_data JSONB, -- Output/result data from the task
    approval_required BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(20) CHECK (approval_status IN ('Pending', 'Approved', 'Rejected', 'Not Required')),
    approved_by VARCHAR(255),
    approval_comments TEXT,
    automation_config JSONB, -- Configuration for automated tasks
    sla_deadline TIMESTAMP,
    escalation_level INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_details JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_id) REFERENCES workflow_instances(instance_id)
);

-- Workflow history table - audit trail of all workflow activities
CREATE TABLE IF NOT EXISTS workflow_history (
    id SERIAL PRIMARY KEY,
    instance_id VARCHAR(50) NOT NULL,
    task_id VARCHAR(50),
    activity_type VARCHAR(50) NOT NULL,
    activity_description TEXT NOT NULL,
    actor VARCHAR(255) NOT NULL,
    actor_role VARCHAR(100),
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    activity_data JSONB,
    system_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_id) REFERENCES workflow_instances(instance_id),
    FOREIGN KEY (task_id) REFERENCES workflow_tasks(task_id)
);

-- Workflow approvals table - detailed approval tracking
CREATE TABLE IF NOT EXISTS workflow_approvals (
    id SERIAL PRIMARY KEY,
    approval_id VARCHAR(50) UNIQUE NOT NULL,
    instance_id VARCHAR(50) NOT NULL,
    task_id VARCHAR(50),
    approval_step VARCHAR(100) NOT NULL,
    approval_level INTEGER NOT NULL,
    approver_role VARCHAR(100) NOT NULL,
    required_approver VARCHAR(255),
    actual_approver VARCHAR(255),
    approval_status VARCHAR(20) DEFAULT 'Pending' CHECK (approval_status IN ('Pending', 'Approved', 'Rejected', 'Delegated', 'Expired')),
    approval_decision TEXT,
    approval_comments TEXT,
    approval_conditions JSONB, -- Conditional approvals
    delegation_to VARCHAR(255),
    delegation_reason TEXT,
    sla_deadline TIMESTAMP,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_id) REFERENCES workflow_instances(instance_id),
    FOREIGN KEY (task_id) REFERENCES workflow_tasks(task_id)
);

-- Workflow automation log table - tracks automated actions
CREATE TABLE IF NOT EXISTS workflow_automation_log (
    id SERIAL PRIMARY KEY,
    log_id VARCHAR(50) UNIQUE NOT NULL,
    instance_id VARCHAR(50) NOT NULL,
    task_id VARCHAR(50),
    automation_type VARCHAR(50) NOT NULL,
    automation_name VARCHAR(100) NOT NULL,
    trigger_event VARCHAR(100) NOT NULL,
    trigger_data JSONB,
    action_taken VARCHAR(200) NOT NULL,
    action_result VARCHAR(50) NOT NULL CHECK (action_result IN ('Success', 'Failed', 'Partial', 'Skipped')),
    action_details JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_id) REFERENCES workflow_instances(instance_id),
    FOREIGN KEY (task_id) REFERENCES workflow_tasks(task_id)
);

-- Workflow metrics table - performance and analytics data
CREATE TABLE IF NOT EXISTS workflow_metrics (
    id SERIAL PRIMARY KEY,
    metric_id VARCHAR(50) UNIQUE NOT NULL,
    workflow_id VARCHAR(50) NOT NULL,
    instance_id VARCHAR(50),
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    metric_unit VARCHAR(20),
    measurement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    additional_data JSONB,
    FOREIGN KEY (workflow_id) REFERENCES workflow_definitions(workflow_id),
    FOREIGN KEY (instance_id) REFERENCES workflow_instances(instance_id)
);

-- Create indexes for workflow engine performance
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_priority ON workflow_instances(priority);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_assigned_to ON workflow_instances(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_workflow_id ON workflow_instances(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_started_at ON workflow_instances(started_at);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_due_date ON workflow_instances(due_date);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned_to ON workflow_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_instance_id ON workflow_tasks(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_task_type ON workflow_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_sla_deadline ON workflow_tasks(sla_deadline);

CREATE INDEX IF NOT EXISTS idx_workflow_history_instance_id ON workflow_history(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_activity_type ON workflow_history(activity_type);
CREATE INDEX IF NOT EXISTS idx_workflow_history_created_at ON workflow_history(created_at);

CREATE INDEX IF NOT EXISTS idx_workflow_approvals_status ON workflow_approvals(approval_status);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_approver ON workflow_approvals(required_approver);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_instance_id ON workflow_approvals(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_sla_deadline ON workflow_approvals(sla_deadline);

CREATE INDEX IF NOT EXISTS idx_workflow_automation_log_instance_id ON workflow_automation_log(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_automation_log_automation_type ON workflow_automation_log(automation_type);
CREATE INDEX IF NOT EXISTS idx_workflow_automation_log_executed_at ON workflow_automation_log(executed_at);

CREATE INDEX IF NOT EXISTS idx_workflow_metrics_workflow_id ON workflow_metrics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_metric_type ON workflow_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_measurement_date ON workflow_metrics(measurement_date);
