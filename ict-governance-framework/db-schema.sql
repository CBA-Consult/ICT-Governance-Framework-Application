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
-- REPORTING SYSTEM TABLES
-- ============================================================================

-- Generated reports table - stores completed reports
CREATE TABLE IF NOT EXISTS generated_reports (
    report_id VARCHAR(50) PRIMARY KEY,
    report_type VARCHAR(100) NOT NULL,
    report_name VARCHAR(255),
    report_data JSONB NOT NULL,
    time_range_start TIMESTAMP,
    time_range_end TIMESTAMP,
    generated_by VARCHAR(50) REFERENCES users(user_id),
    generation_options JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    file_path VARCHAR(500),
    file_size BIGINT,
    export_format VARCHAR(20) DEFAULT 'json',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    is_scheduled BOOLEAN DEFAULT FALSE,
    schedule_id VARCHAR(50),
    tags TEXT[],
    metadata JSONB DEFAULT '{}'
);

-- Custom report templates table - stores user-defined report templates
CREATE TABLE IF NOT EXISTS custom_report_templates (
    template_id VARCHAR(50) PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(50) REFERENCES users(user_id),
    is_public BOOLEAN DEFAULT FALSE,
    template_config JSONB NOT NULL,
    data_sources TEXT[] NOT NULL,
    visualization_config JSONB DEFAULT '{}',
    filters_config JSONB DEFAULT '{}',
    parameters_config JSONB DEFAULT '{}',
    output_format VARCHAR(20) DEFAULT 'json',
    category VARCHAR(100),
    tags TEXT[],
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0
);

-- Report schedules table - stores automated report generation schedules
CREATE TABLE IF NOT EXISTS report_schedules (
    schedule_id VARCHAR(50) PRIMARY KEY,
    schedule_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100),
    template_id VARCHAR(50) REFERENCES custom_report_templates(template_id),
    created_by VARCHAR(50) REFERENCES users(user_id),
    recipients TEXT[] NOT NULL,
    schedule_expression VARCHAR(100) NOT NULL, -- Cron expression
    time_range_config JSONB NOT NULL,
    generation_options JSONB DEFAULT '{}',
    output_formats TEXT[] DEFAULT ARRAY['pdf'],
    delivery_method VARCHAR(50) DEFAULT 'email',
    delivery_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    next_run_at TIMESTAMP,
    last_run_at TIMESTAMP,
    last_run_status VARCHAR(20),
    run_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Metric data table - stores all metrics for reporting
CREATE TABLE IF NOT EXISTS metric_data (
    metric_id VARCHAR(50) PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    metric_category VARCHAR(100) NOT NULL,
    value DECIMAL(15,4) NOT NULL,
    target_value DECIMAL(15,4),
    unit VARCHAR(50),
    data_source VARCHAR(100),
    collection_timestamp TIMESTAMP NOT NULL,
    collection_method VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(user_id)
);

-- Report sharing table - manages report access and sharing
CREATE TABLE IF NOT EXISTS report_sharing (
    sharing_id VARCHAR(50) PRIMARY KEY,
    report_id VARCHAR(50) REFERENCES generated_reports(report_id) ON DELETE CASCADE,
    shared_by VARCHAR(50) REFERENCES users(user_id),
    shared_with VARCHAR(50) REFERENCES users(user_id),
    share_type VARCHAR(20) DEFAULT 'view' CHECK (share_type IN ('view', 'download', 'edit')),
    expires_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report comments table - allows commenting on reports
CREATE TABLE IF NOT EXISTS report_comments (
    comment_id VARCHAR(50) PRIMARY KEY,
    report_id VARCHAR(50) REFERENCES generated_reports(report_id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(user_id),
    comment_text TEXT NOT NULL,
    parent_comment_id VARCHAR(50) REFERENCES report_comments(comment_id),
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report bookmarks table - allows users to bookmark reports
CREATE TABLE IF NOT EXISTS report_bookmarks (
    bookmark_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(user_id),
    report_id VARCHAR(50) REFERENCES generated_reports(report_id) ON DELETE CASCADE,
    bookmark_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, report_id)
);

-- Create indexes for reporting system performance
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON generated_reports(status);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_by ON generated_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON generated_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_reports_time_range ON generated_reports(time_range_start, time_range_end);
CREATE INDEX IF NOT EXISTS idx_generated_reports_tags ON generated_reports USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_custom_report_templates_created_by ON custom_report_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_report_templates_category ON custom_report_templates(category);
CREATE INDEX IF NOT EXISTS idx_custom_report_templates_is_public ON custom_report_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_report_templates_tags ON custom_report_templates USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_report_schedules_is_active ON report_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_report_schedules_created_by ON report_schedules(created_by);

CREATE INDEX IF NOT EXISTS idx_metric_data_name_category ON metric_data(metric_name, metric_category);
CREATE INDEX IF NOT EXISTS idx_metric_data_collection_timestamp ON metric_data(collection_timestamp);
CREATE INDEX IF NOT EXISTS idx_metric_data_category ON metric_data(metric_category);
CREATE INDEX IF NOT EXISTS idx_metric_data_tags ON metric_data USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_report_sharing_report_id ON report_sharing(report_id);
CREATE INDEX IF NOT EXISTS idx_report_sharing_shared_with ON report_sharing(shared_with);

-- Insert sample metric data for reporting
INSERT INTO metric_data (metric_id, metric_name, metric_category, value, target_value, unit, data_source, collection_timestamp, collection_method, metadata, tags) VALUES
-- Governance KPIs
('MET-001', 'governance_maturity_level', 'kpi', 3.5, 4.0, 'score', 'governance_assessment', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{"assessment_type": "quarterly"}', ARRAY['governance', 'maturity']),
('MET-002', 'policy_compliance_rate', 'compliance', 85.5, 95.0, 'percentage', 'compliance_monitor', CURRENT_TIMESTAMP - INTERVAL '2 days', 'automated', '{"policy_count": 25}', ARRAY['compliance', 'policy']),
('MET-003', 'overall_risk_score', 'risk', 6.2, 4.0, 'score', 'risk_assessment', CURRENT_TIMESTAMP - INTERVAL '1 day', 'manual', '{"risk_factors": 15}', ARRAY['risk', 'assessment']),
('MET-004', 'stakeholder_satisfaction', 'kpi', 78.0, 85.0, 'percentage', 'survey_system', CURRENT_TIMESTAMP - INTERVAL '3 days', 'survey', '{"response_rate": 65}', ARRAY['stakeholder', 'satisfaction']),
('MET-005', 'business_value_realization', 'financial', 1250000, 1500000, 'currency', 'financial_system', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{"currency": "USD"}', ARRAY['financial', 'value']),

-- Compliance Metrics
('MET-006', 'security_policy_compliance', 'compliance', 92.0, 98.0, 'percentage', 'security_monitor', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{"controls_checked": 45}', ARRAY['security', 'compliance']),
('MET-007', 'privacy_policy_compliance', 'compliance', 88.5, 95.0, 'percentage', 'privacy_monitor', CURRENT_TIMESTAMP - INTERVAL '2 days', 'automated', '{"data_subjects": 1250}', ARRAY['privacy', 'compliance']),
('MET-008', 'operational_policy_compliance', 'compliance', 76.0, 90.0, 'percentage', 'ops_monitor', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{"processes_checked": 32}', ARRAY['operational', 'compliance']),

-- Risk Metrics
('MET-009', 'cloud_security_risk', 'risk', 7.5, 5.0, 'score', 'cloud_monitor', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{"cloud_services": 15}', ARRAY['cloud', 'security', 'risk']),
('MET-010', 'vendor_risk', 'risk', 6.8, 4.0, 'score', 'vendor_assessment', CURRENT_TIMESTAMP - INTERVAL '2 days', 'manual', '{"vendor_count": 25}', ARRAY['vendor', 'risk']),
('MET-011', 'data_breach_risk', 'risk', 4.2, 3.0, 'score', 'security_assessment', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{"data_assets": 150}', ARRAY['data', 'security', 'risk']),

-- Financial Metrics
('MET-012', 'governance_investment', 'financial', 500000, 600000, 'currency', 'budget_system', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{"currency": "USD", "period": "quarterly"}', ARRAY['investment', 'governance']),
('MET-013', 'cost_savings', 'financial', 750000, 800000, 'currency', 'cost_tracking', CURRENT_TIMESTAMP - INTERVAL '2 days', 'automated', '{"currency": "USD", "period": "quarterly"}', ARRAY['savings', 'cost']),

-- Remediation Metrics
('MET-014', 'security_remediation_rate', 'compliance', 85.0, 95.0, 'percentage', 'security_system', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{"issues_total": 45, "issues_resolved": 38}', ARRAY['remediation', 'security']),
('MET-015', 'compliance_remediation_rate', 'compliance', 78.5, 90.0, 'percentage', 'compliance_system', CURRENT_TIMESTAMP - INTERVAL '2 days', 'automated', '{"issues_total": 28, "issues_resolved": 22}', ARRAY['remediation', 'compliance']),
('MET-016', 'risk_remediation_rate', 'risk', 72.0, 85.0, 'percentage', 'risk_system', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{"risks_total": 18, "risks_mitigated": 13}', ARRAY['remediation', 'risk'])
ON CONFLICT (metric_id) DO NOTHING;

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

-- ============================================================================
-- USER MANAGEMENT AND ACCESS CONTROL TABLES
-- ============================================================================

-- Users table - core user information
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    department VARCHAR(100),
    job_title VARCHAR(150),
    manager_id VARCHAR(50),
    phone VARCHAR(20),
    office_location VARCHAR(100),
    employee_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended', 'Pending')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    last_login TIMESTAMP,
    last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    profile_picture_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(user_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Roles table - system roles definition
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_id VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    role_type VARCHAR(30) DEFAULT 'Custom' CHECK (role_type IN ('System', 'Custom', 'Functional', 'Organizational')),
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    permissions JSONB DEFAULT '[]',
    role_hierarchy_level INTEGER DEFAULT 0,
    parent_role_id VARCHAR(50),
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_role_id) REFERENCES roles(role_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Permissions table - granular permissions definition
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    permission_id VARCHAR(50) UNIQUE NOT NULL,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    scope VARCHAR(50) DEFAULT 'Global' CHECK (scope IN ('Global', 'Department', 'Team', 'Personal')),
    is_system_permission BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles mapping table - many-to-many relationship
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    role_id VARCHAR(50) NOT NULL,
    assigned_by VARCHAR(50),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    assignment_reason TEXT,
    UNIQUE(user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(user_id)
);

-- Role permissions mapping table - many-to-many relationship
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id VARCHAR(50) NOT NULL,
    permission_id VARCHAR(50) NOT NULL,
    granted_by VARCHAR(50),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(user_id)
);

-- User sessions table - session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    refresh_token VARCHAR(500) UNIQUE NOT NULL,
    access_token_hash VARCHAR(255),
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    location_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- User activity log table - audit trail
CREATE TABLE IF NOT EXISTS user_activity_log (
    id SERIAL PRIMARY KEY,
    log_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(50),
    session_id VARCHAR(255),
    activity_type VARCHAR(50) NOT NULL,
    activity_description TEXT NOT NULL,
    resource VARCHAR(100),
    action VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    response_status INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id)
);

-- Password history table - prevent password reuse
CREATE TABLE IF NOT EXISTS password_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insert default system roles
INSERT INTO roles (role_id, role_name, display_name, description, role_type, is_system_role, role_hierarchy_level) VALUES
('ROLE_SUPER_ADMIN', 'super_admin', 'Super Administrator', 'Full system access with all permissions', 'System', TRUE, 100),
('ROLE_ADMIN', 'admin', 'Administrator', 'Administrative access to most system functions', 'System', TRUE, 90),
('ROLE_GOVERNANCE_MANAGER', 'governance_manager', 'Governance Manager', 'Manages governance policies and processes', 'Functional', TRUE, 80),
('ROLE_COMPLIANCE_OFFICER', 'compliance_officer', 'Compliance Officer', 'Oversees compliance monitoring and reporting', 'Functional', TRUE, 70),
('ROLE_IT_MANAGER', 'it_manager', 'IT Manager', 'Manages IT operations and technology decisions', 'Functional', TRUE, 70),
('ROLE_SECURITY_ANALYST', 'security_analyst', 'Security Analyst', 'Monitors security and investigates incidents', 'Functional', TRUE, 60),
('ROLE_AUDITOR', 'auditor', 'Auditor', 'Conducts audits and reviews compliance', 'Functional', TRUE, 60),
('ROLE_EMPLOYEE', 'employee', 'Employee', 'Standard employee access', 'System', TRUE, 10),
('ROLE_GUEST', 'guest', 'Guest', 'Limited read-only access', 'System', TRUE, 5)
ON CONFLICT (role_id) DO NOTHING;

-- Insert default system permissions
INSERT INTO permissions (permission_id, permission_name, display_name, description, resource, action, is_system_permission) VALUES
-- User Management
('PERM_USER_CREATE', 'user.create', 'Create Users', 'Create new user accounts', 'users', 'create', TRUE),
('PERM_USER_READ', 'user.read', 'View Users', 'View user information', 'users', 'read', TRUE),
('PERM_USER_UPDATE', 'user.update', 'Update Users', 'Update user information', 'users', 'update', TRUE),
('PERM_USER_DELETE', 'user.delete', 'Delete Users', 'Delete user accounts', 'users', 'delete', TRUE),
('PERM_USER_MANAGE_ROLES', 'user.manage_roles', 'Manage User Roles', 'Assign and remove user roles', 'users', 'manage_roles', TRUE),

-- Role Management
('PERM_ROLE_CREATE', 'role.create', 'Create Roles', 'Create new roles', 'roles', 'create', TRUE),
('PERM_ROLE_READ', 'role.read', 'View Roles', 'View role information', 'roles', 'read', TRUE),
('PERM_ROLE_UPDATE', 'role.update', 'Update Roles', 'Update role information', 'roles', 'update', TRUE),
('PERM_ROLE_DELETE', 'role.delete', 'Delete Roles', 'Delete roles', 'roles', 'delete', TRUE),
('PERM_ROLE_MANAGE_PERMISSIONS', 'role.manage_permissions', 'Manage Role Permissions', 'Assign and remove role permissions', 'roles', 'manage_permissions', TRUE),

-- System Administration
('PERM_SYSTEM_ADMIN', 'system.admin', 'System Administration', 'Full system administration access', 'system', 'admin', TRUE),
('PERM_SYSTEM_CONFIG', 'system.config', 'System Configuration', 'Configure system settings', 'system', 'config', TRUE),
('PERM_SYSTEM_AUDIT', 'system.audit', 'System Audit', 'View system audit logs', 'system', 'audit', TRUE),

-- Governance
('PERM_GOVERNANCE_READ', 'governance.read', 'View Governance', 'View governance information', 'governance', 'read', TRUE),
('PERM_GOVERNANCE_MANAGE', 'governance.manage', 'Manage Governance', 'Manage governance policies and processes', 'governance', 'manage', TRUE),

-- Compliance
('PERM_COMPLIANCE_READ', 'compliance.read', 'View Compliance', 'View compliance information', 'compliance', 'read', TRUE),
('PERM_COMPLIANCE_MANAGE', 'compliance.manage', 'Manage Compliance', 'Manage compliance monitoring and reporting', 'compliance', 'manage', TRUE),

-- Feedback and Escalations
('PERM_FEEDBACK_CREATE', 'feedback.create', 'Create Feedback', 'Submit feedback and requests', 'feedback', 'create', TRUE),
('PERM_FEEDBACK_READ', 'feedback.read', 'View Feedback', 'View feedback submissions', 'feedback', 'read', TRUE),
('PERM_FEEDBACK_MANAGE', 'feedback.manage', 'Manage Feedback', 'Manage feedback and escalations', 'feedback', 'manage', TRUE),

-- Workflows
('PERM_WORKFLOW_CREATE', 'workflow.create', 'Create Workflows', 'Create workflow instances', 'workflows', 'create', TRUE),
('PERM_WORKFLOW_READ', 'workflow.read', 'View Workflows', 'View workflow information', 'workflows', 'read', TRUE),
('PERM_WORKFLOW_MANAGE', 'workflow.manage', 'Manage Workflows', 'Manage workflow definitions and instances', 'workflows', 'manage', TRUE),

-- Applications
('PERM_APP_PROCUREMENT', 'app.procurement', 'Application Procurement', 'Request and manage application procurement', 'applications', 'procurement', TRUE),
('PERM_APP_MANAGE', 'app.manage', 'Manage Applications', 'Manage application catalog and registrations', 'applications', 'manage', TRUE),

-- Dashboard Access
('PERM_DASHBOARD_EXECUTIVE', 'dashboard.executive', 'Executive Dashboard Access', 'Access to executive-level dashboards and strategic metrics', 'dashboards', 'executive', TRUE),
('PERM_DASHBOARD_OPERATIONAL', 'dashboard.operational', 'Operational Dashboard Access', 'Access to operational dashboards and detailed metrics', 'dashboards', 'operational', TRUE),
('PERM_DASHBOARD_COMPLIANCE', 'dashboard.compliance', 'Compliance Dashboard Access', 'Access to compliance dashboards and regulatory metrics', 'dashboards', 'compliance', TRUE),
('PERM_DASHBOARD_ANALYTICS', 'dashboard.analytics', 'Analytics Dashboard Access', 'Access to advanced analytics and data visualization features', 'dashboards', 'analytics', TRUE),
('PERM_DASHBOARD_EXPORT', 'dashboard.export', 'Dashboard Export', 'Export dashboard data and reports', 'dashboards', 'export', TRUE),
('PERM_DASHBOARD_ADMIN', 'dashboard.admin', 'Dashboard Administration', 'Manage dashboard configurations and user access', 'dashboards', 'admin', TRUE),

-- Security Metrics and Secure Score
('PERM_VIEW_SECURITY_METRICS', 'view_security_metrics', 'View Security Metrics', 'View security metrics and secure score data', 'security', 'view_metrics', TRUE),
('PERM_MANAGE_SECURITY_METRICS', 'manage_security_metrics', 'Manage Security Metrics', 'Manage security metrics and secure score configurations', 'security', 'manage_metrics', TRUE),
('PERM_SECURE_SCORE_SYNC', 'secure_score.sync', 'Sync Secure Score', 'Manually trigger secure score synchronization', 'security', 'sync', TRUE),
('PERM_SECURE_SCORE_RECOMMENDATIONS', 'secure_score.recommendations', 'Manage Recommendations', 'Manage secure score recommendations and implementations', 'security', 'recommendations', TRUE)
ON CONFLICT (permission_id) DO NOTHING;

-- Assign permissions to default roles
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- Super Admin - All permissions
('ROLE_SUPER_ADMIN', 'PERM_USER_CREATE'),
('ROLE_SUPER_ADMIN', 'PERM_USER_READ'),
('ROLE_SUPER_ADMIN', 'PERM_USER_UPDATE'),
('ROLE_SUPER_ADMIN', 'PERM_USER_DELETE'),
('ROLE_SUPER_ADMIN', 'PERM_USER_MANAGE_ROLES'),
('ROLE_SUPER_ADMIN', 'PERM_ROLE_CREATE'),
('ROLE_SUPER_ADMIN', 'PERM_ROLE_READ'),
('ROLE_SUPER_ADMIN', 'PERM_ROLE_UPDATE'),
('ROLE_SUPER_ADMIN', 'PERM_ROLE_DELETE'),
('ROLE_SUPER_ADMIN', 'PERM_ROLE_MANAGE_PERMISSIONS'),
('ROLE_SUPER_ADMIN', 'PERM_SYSTEM_ADMIN'),
('ROLE_SUPER_ADMIN', 'PERM_SYSTEM_CONFIG'),
('ROLE_SUPER_ADMIN', 'PERM_SYSTEM_AUDIT'),
('ROLE_SUPER_ADMIN', 'PERM_GOVERNANCE_READ'),
('ROLE_SUPER_ADMIN', 'PERM_GOVERNANCE_MANAGE'),
('ROLE_SUPER_ADMIN', 'PERM_COMPLIANCE_READ'),
('ROLE_SUPER_ADMIN', 'PERM_COMPLIANCE_MANAGE'),
('ROLE_SUPER_ADMIN', 'PERM_FEEDBACK_CREATE'),
('ROLE_SUPER_ADMIN', 'PERM_FEEDBACK_READ'),
('ROLE_SUPER_ADMIN', 'PERM_FEEDBACK_MANAGE'),
('ROLE_SUPER_ADMIN', 'PERM_WORKFLOW_CREATE'),
('ROLE_SUPER_ADMIN', 'PERM_WORKFLOW_READ'),
('ROLE_SUPER_ADMIN', 'PERM_WORKFLOW_MANAGE'),
('ROLE_SUPER_ADMIN', 'PERM_APP_PROCUREMENT'),
('ROLE_SUPER_ADMIN', 'PERM_APP_MANAGE'),
('ROLE_SUPER_ADMIN', 'PERM_DASHBOARD_EXECUTIVE'),
('ROLE_SUPER_ADMIN', 'PERM_DASHBOARD_OPERATIONAL'),
('ROLE_SUPER_ADMIN', 'PERM_DASHBOARD_COMPLIANCE'),
('ROLE_SUPER_ADMIN', 'PERM_DASHBOARD_ANALYTICS'),
('ROLE_SUPER_ADMIN', 'PERM_DASHBOARD_EXPORT'),
('ROLE_SUPER_ADMIN', 'PERM_DASHBOARD_ADMIN'),
('ROLE_SUPER_ADMIN', 'PERM_VIEW_SECURITY_METRICS'),
('ROLE_SUPER_ADMIN', 'PERM_MANAGE_SECURITY_METRICS'),
('ROLE_SUPER_ADMIN', 'PERM_SECURE_SCORE_SYNC'),
('ROLE_SUPER_ADMIN', 'PERM_SECURE_SCORE_RECOMMENDATIONS'),

-- Admin - Most permissions except user/role management
('ROLE_ADMIN', 'PERM_USER_READ'),
('ROLE_ADMIN', 'PERM_USER_UPDATE'),
('ROLE_ADMIN', 'PERM_ROLE_READ'),
('ROLE_ADMIN', 'PERM_SYSTEM_CONFIG'),
('ROLE_ADMIN', 'PERM_SYSTEM_AUDIT'),
('ROLE_ADMIN', 'PERM_GOVERNANCE_READ'),
('ROLE_ADMIN', 'PERM_GOVERNANCE_MANAGE'),
('ROLE_ADMIN', 'PERM_COMPLIANCE_READ'),
('ROLE_ADMIN', 'PERM_COMPLIANCE_MANAGE'),
('ROLE_ADMIN', 'PERM_FEEDBACK_CREATE'),
('ROLE_ADMIN', 'PERM_FEEDBACK_READ'),
('ROLE_ADMIN', 'PERM_FEEDBACK_MANAGE'),
('ROLE_ADMIN', 'PERM_WORKFLOW_CREATE'),
('ROLE_ADMIN', 'PERM_WORKFLOW_READ'),
('ROLE_ADMIN', 'PERM_WORKFLOW_MANAGE'),
('ROLE_ADMIN', 'PERM_APP_PROCUREMENT'),
('ROLE_ADMIN', 'PERM_APP_MANAGE'),
('ROLE_ADMIN', 'PERM_DASHBOARD_EXECUTIVE'),
('ROLE_ADMIN', 'PERM_DASHBOARD_OPERATIONAL'),
('ROLE_ADMIN', 'PERM_DASHBOARD_COMPLIANCE'),
('ROLE_ADMIN', 'PERM_DASHBOARD_ANALYTICS'),
('ROLE_ADMIN', 'PERM_DASHBOARD_EXPORT'),

-- Governance Manager
('ROLE_GOVERNANCE_MANAGER', 'PERM_USER_READ'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_ROLE_READ'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_GOVERNANCE_READ'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_GOVERNANCE_MANAGE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_COMPLIANCE_READ'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_FEEDBACK_CREATE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_FEEDBACK_READ'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_FEEDBACK_MANAGE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_WORKFLOW_CREATE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_WORKFLOW_READ'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_WORKFLOW_MANAGE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_APP_PROCUREMENT'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_APP_MANAGE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_DASHBOARD_EXECUTIVE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_DASHBOARD_OPERATIONAL'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_DASHBOARD_COMPLIANCE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_DASHBOARD_ANALYTICS'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_DASHBOARD_EXPORT'),

-- Compliance Officer
('ROLE_COMPLIANCE_OFFICER', 'PERM_USER_READ'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_ROLE_READ'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_GOVERNANCE_READ'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_COMPLIANCE_READ'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_COMPLIANCE_MANAGE'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_FEEDBACK_CREATE'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_FEEDBACK_READ'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_WORKFLOW_CREATE'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_WORKFLOW_READ'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_APP_PROCUREMENT'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_DASHBOARD_OPERATIONAL'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_DASHBOARD_COMPLIANCE'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_DASHBOARD_ANALYTICS'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_DASHBOARD_EXPORT'),

-- IT Manager
('ROLE_IT_MANAGER', 'PERM_USER_READ'),
('ROLE_IT_MANAGER', 'PERM_ROLE_READ'),
('ROLE_IT_MANAGER', 'PERM_GOVERNANCE_READ'),
('ROLE_IT_MANAGER', 'PERM_COMPLIANCE_READ'),
('ROLE_IT_MANAGER', 'PERM_FEEDBACK_CREATE'),
('ROLE_IT_MANAGER', 'PERM_FEEDBACK_READ'),
('ROLE_IT_MANAGER', 'PERM_FEEDBACK_MANAGE'),
('ROLE_IT_MANAGER', 'PERM_WORKFLOW_CREATE'),
('ROLE_IT_MANAGER', 'PERM_WORKFLOW_READ'),
('ROLE_IT_MANAGER', 'PERM_WORKFLOW_MANAGE'),
('ROLE_IT_MANAGER', 'PERM_APP_PROCUREMENT'),
('ROLE_IT_MANAGER', 'PERM_APP_MANAGE'),
('ROLE_IT_MANAGER', 'PERM_DASHBOARD_OPERATIONAL'),
('ROLE_IT_MANAGER', 'PERM_DASHBOARD_ANALYTICS'),
('ROLE_IT_MANAGER', 'PERM_DASHBOARD_EXPORT'),

-- Security Analyst
('ROLE_SECURITY_ANALYST', 'PERM_USER_READ'),
('ROLE_SECURITY_ANALYST', 'PERM_ROLE_READ'),
('ROLE_SECURITY_ANALYST', 'PERM_SYSTEM_AUDIT'),
('ROLE_SECURITY_ANALYST', 'PERM_GOVERNANCE_READ'),
('ROLE_SECURITY_ANALYST', 'PERM_COMPLIANCE_READ'),
('ROLE_SECURITY_ANALYST', 'PERM_FEEDBACK_CREATE'),
('ROLE_SECURITY_ANALYST', 'PERM_FEEDBACK_READ'),
('ROLE_SECURITY_ANALYST', 'PERM_WORKFLOW_CREATE'),
('ROLE_SECURITY_ANALYST', 'PERM_WORKFLOW_READ'),
('ROLE_SECURITY_ANALYST', 'PERM_APP_PROCUREMENT'),
('ROLE_SECURITY_ANALYST', 'PERM_DASHBOARD_OPERATIONAL'),
('ROLE_SECURITY_ANALYST', 'PERM_DASHBOARD_COMPLIANCE'),
('ROLE_SECURITY_ANALYST', 'PERM_DASHBOARD_ANALYTICS'),
('ROLE_SECURITY_ANALYST', 'PERM_VIEW_SECURITY_METRICS'),
('ROLE_SECURITY_ANALYST', 'PERM_MANAGE_SECURITY_METRICS'),
('ROLE_SECURITY_ANALYST', 'PERM_SECURE_SCORE_SYNC'),
('ROLE_SECURITY_ANALYST', 'PERM_SECURE_SCORE_RECOMMENDATIONS'),

-- Auditor
('ROLE_AUDITOR', 'PERM_USER_READ'),
('ROLE_AUDITOR', 'PERM_ROLE_READ'),
('ROLE_AUDITOR', 'PERM_SYSTEM_AUDIT'),
('ROLE_AUDITOR', 'PERM_GOVERNANCE_READ'),
('ROLE_AUDITOR', 'PERM_COMPLIANCE_READ'),
('ROLE_AUDITOR', 'PERM_FEEDBACK_CREATE'),
('ROLE_AUDITOR', 'PERM_FEEDBACK_READ'),
('ROLE_AUDITOR', 'PERM_WORKFLOW_READ'),
('ROLE_AUDITOR', 'PERM_APP_PROCUREMENT'),
('ROLE_AUDITOR', 'PERM_DASHBOARD_COMPLIANCE'),
('ROLE_AUDITOR', 'PERM_DASHBOARD_ANALYTICS'),
('ROLE_AUDITOR', 'PERM_VIEW_SECURITY_METRICS'),

-- Employee
('ROLE_EMPLOYEE', 'PERM_GOVERNANCE_READ'),
('ROLE_EMPLOYEE', 'PERM_COMPLIANCE_READ'),
('ROLE_EMPLOYEE', 'PERM_FEEDBACK_CREATE'),
('ROLE_EMPLOYEE', 'PERM_FEEDBACK_READ'),
('ROLE_EMPLOYEE', 'PERM_WORKFLOW_CREATE'),
('ROLE_EMPLOYEE', 'PERM_WORKFLOW_READ'),
('ROLE_EMPLOYEE', 'PERM_APP_PROCUREMENT'),
('ROLE_EMPLOYEE', 'PERM_REPORTING_READ'),

-- Guest
('ROLE_GUEST', 'PERM_GOVERNANCE_READ'),
('ROLE_GUEST', 'PERM_COMPLIANCE_READ')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create indexes for user management performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_roles_role_name ON roles(role_name);
CREATE INDEX IF NOT EXISTS idx_roles_role_type ON roles(role_type);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_hierarchy_level ON roles(role_hierarchy_level);

CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_scope ON permissions(scope);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON user_roles(expires_at);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_is_active ON role_permissions(is_active);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_success ON user_activity_log(success);

CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON password_history(created_at);

-- Document and Policy Management System Tables

-- Document categories table
CREATE TABLE IF NOT EXISTS document_categories (
    id SERIAL PRIMARY KEY,
    category_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id VARCHAR(50),
    color VARCHAR(20) DEFAULT 'gray',
    icon VARCHAR(50) DEFAULT 'DocumentTextIcon',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES document_categories(category_id)
);

-- Documents table - main document registry
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('Policy', 'Procedure', 'Standard', 'Guideline', 'Template', 'Form', 'Manual', 'Report')),
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Under Review', 'Approved', 'Published', 'Archived', 'Deprecated')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    owner_user_id VARCHAR(50) NOT NULL,
    approver_user_id VARCHAR(50),
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    compliance_frameworks JSONB DEFAULT '[]',
    review_frequency_months INTEGER DEFAULT 12,
    next_review_date DATE,
    effective_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES document_categories(category_id),
    FOREIGN KEY (owner_user_id) REFERENCES users(user_id),
    FOREIGN KEY (approver_user_id) REFERENCES users(user_id)
);

-- Document versions table - version control
CREATE TABLE IF NOT EXISTS document_versions (
    id SERIAL PRIMARY KEY,
    version_id VARCHAR(50) UNIQUE NOT NULL,
    document_id VARCHAR(50) NOT NULL,
    version_number VARCHAR(20) NOT NULL,
    major_version INTEGER NOT NULL,
    minor_version INTEGER NOT NULL,
    patch_version INTEGER DEFAULT 0,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'markdown',
    file_path VARCHAR(500),
    file_size BIGINT,
    file_hash VARCHAR(128),
    change_summary TEXT,
    change_type VARCHAR(20) DEFAULT 'Minor' CHECK (change_type IN ('Major', 'Minor', 'Patch', 'Emergency')),
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (document_id) REFERENCES documents(document_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    UNIQUE(document_id, version_number)
);

-- Document approval workflows
CREATE TABLE IF NOT EXISTS document_approval_workflows (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(50) UNIQUE NOT NULL,
    document_id VARCHAR(50) NOT NULL,
    version_id VARCHAR(50) NOT NULL,
    workflow_type VARCHAR(50) DEFAULT 'Standard' CHECK (workflow_type IN ('Standard', 'Fast-Track', 'Emergency', 'Collaborative')),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Approved', 'Rejected', 'Cancelled')),
    initiated_by VARCHAR(50) NOT NULL,
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    due_date TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    approval_steps JSONB DEFAULT '[]',
    current_step INTEGER DEFAULT 1,
    comments TEXT,
    FOREIGN KEY (document_id) REFERENCES documents(document_id),
    FOREIGN KEY (version_id) REFERENCES document_versions(version_id),
    FOREIGN KEY (initiated_by) REFERENCES users(user_id)
);

-- Document approval steps
CREATE TABLE IF NOT EXISTS document_approval_steps (
    id SERIAL PRIMARY KEY,
    step_id VARCHAR(50) UNIQUE NOT NULL,
    workflow_id VARCHAR(50) NOT NULL,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    approver_user_id VARCHAR(50),
    approver_role VARCHAR(100),
    approval_type VARCHAR(20) DEFAULT 'Required' CHECK (approval_type IN ('Required', 'Optional', 'Informational')),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Skipped')),
    approved_at TIMESTAMP,
    comments TEXT,
    due_date TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES document_approval_workflows(workflow_id),
    FOREIGN KEY (approver_user_id) REFERENCES users(user_id)
);

-- Document access permissions
CREATE TABLE IF NOT EXISTS document_permissions (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL,
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('Read', 'Write', 'Approve', 'Admin')),
    granted_to_type VARCHAR(20) NOT NULL CHECK (granted_to_type IN ('User', 'Role', 'Department')),
    granted_to_id VARCHAR(50) NOT NULL,
    granted_by VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(document_id),
    FOREIGN KEY (granted_by) REFERENCES users(user_id),
    UNIQUE(document_id, permission_type, granted_to_type, granted_to_id)
);

-- Document activity log
CREATE TABLE IF NOT EXISTS document_activity_log (
    id SERIAL PRIMARY KEY,
    activity_id VARCHAR(50) UNIQUE NOT NULL,
    document_id VARCHAR(50) NOT NULL,
    version_id VARCHAR(50),
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    user_id VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(document_id),
    FOREIGN KEY (version_id) REFERENCES document_versions(version_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Document relationships (for linking related documents)
CREATE TABLE IF NOT EXISTS document_relationships (
    id SERIAL PRIMARY KEY,
    source_document_id VARCHAR(50) NOT NULL,
    target_document_id VARCHAR(50) NOT NULL,
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('References', 'Supersedes', 'Supplements', 'Depends On', 'Related To')),
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_document_id) REFERENCES documents(document_id),
    FOREIGN KEY (target_document_id) REFERENCES documents(document_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    UNIQUE(source_document_id, target_document_id, relationship_type)
);

-- Document comments and reviews
CREATE TABLE IF NOT EXISTS document_comments (
    id SERIAL PRIMARY KEY,
    comment_id VARCHAR(50) UNIQUE NOT NULL,
    document_id VARCHAR(50) NOT NULL,
    version_id VARCHAR(50),
    parent_comment_id VARCHAR(50),
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'General' CHECK (comment_type IN ('General', 'Review', 'Suggestion', 'Issue', 'Approval')),
    line_number INTEGER,
    section_reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Addressed', 'Resolved', 'Dismissed')),
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(document_id),
    FOREIGN KEY (version_id) REFERENCES document_versions(version_id),
    FOREIGN KEY (parent_comment_id) REFERENCES document_comments(comment_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Insert default document categories
INSERT INTO document_categories (category_id, name, description, color, icon) VALUES
('POLICY', 'Policies', 'Organizational policies and governance documents', 'blue', 'ShieldCheckIcon'),
('PROCEDURE', 'Procedures', 'Step-by-step operational procedures', 'green', 'DocumentTextIcon'),
('STANDARD', 'Standards', 'Technical and operational standards', 'purple', 'CogIcon'),
('GUIDELINE', 'Guidelines', 'Best practices and guidelines', 'yellow', 'LightBulbIcon'),
('TEMPLATE', 'Templates', 'Document and form templates', 'indigo', 'DocumentDuplicateIcon'),
('MANUAL', 'Manuals', 'User and technical manuals', 'red', 'BookOpenIcon'),
('COMPLIANCE', 'Compliance', 'Regulatory and compliance documents', 'orange', 'ScaleIcon'),
('SECURITY', 'Security', 'Security policies and procedures', 'red', 'LockClosedIcon'),
('HR', 'Human Resources', 'HR policies and procedures', 'pink', 'UserGroupIcon'),
('IT', 'Information Technology', 'IT policies and technical documentation', 'cyan', 'ComputerDesktopIcon')
ON CONFLICT (category_id) DO NOTHING;

-- Insert default document permissions for roles
INSERT INTO permissions (permission_id, name, description, category) VALUES
('document.read', 'Read Documents', 'View and read documents', 'Document Management'),
('document.create', 'Create Documents', 'Create new documents', 'Document Management'),
('document.edit', 'Edit Documents', 'Edit existing documents', 'Document Management'),
('document.delete', 'Delete Documents', 'Delete documents', 'Document Management'),
('document.approve', 'Approve Documents', 'Approve document versions', 'Document Management'),
('document.publish', 'Publish Documents', 'Publish approved documents', 'Document Management'),
('document.admin', 'Document Administration', 'Full document management administration', 'Document Management'),
('version.create', 'Create Versions', 'Create new document versions', 'Version Control'),
('version.compare', 'Compare Versions', 'Compare document versions', 'Version Control'),
('workflow.initiate', 'Initiate Workflows', 'Start approval workflows', 'Workflow Management'),
('workflow.approve', 'Approve in Workflows', 'Approve documents in workflows', 'Workflow Management'),
('workflow.admin', 'Workflow Administration', 'Manage approval workflows', 'Workflow Management')
ON CONFLICT (permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id) VALUES
-- Super Admin gets all document permissions
('ROLE_SUPER_ADMIN', 'document.read'),
('ROLE_SUPER_ADMIN', 'document.create'),
('ROLE_SUPER_ADMIN', 'document.edit'),
('ROLE_SUPER_ADMIN', 'document.delete'),
('ROLE_SUPER_ADMIN', 'document.approve'),
('ROLE_SUPER_ADMIN', 'document.publish'),
('ROLE_SUPER_ADMIN', 'document.admin'),
('ROLE_SUPER_ADMIN', 'version.create'),
('ROLE_SUPER_ADMIN', 'version.compare'),
('ROLE_SUPER_ADMIN', 'workflow.initiate'),
('ROLE_SUPER_ADMIN', 'workflow.approve'),
('ROLE_SUPER_ADMIN', 'workflow.admin'),

-- IT Manager gets most document permissions
('IT_MANAGER', 'document.read'),
('IT_MANAGER', 'document.create'),
('IT_MANAGER', 'document.edit'),
('IT_MANAGER', 'document.approve'),
('IT_MANAGER', 'document.publish'),
('IT_MANAGER', 'version.create'),
('IT_MANAGER', 'version.compare'),
('IT_MANAGER', 'workflow.initiate'),
('IT_MANAGER', 'workflow.approve'),

-- Employee gets basic document permissions
('EMPLOYEE', 'document.read'),
('EMPLOYEE', 'document.create'),
('EMPLOYEE', 'version.compare'),

-- Auditor gets read and compare permissions
('AUDITOR', 'document.read'),
('AUDITOR', 'version.compare')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create indexes for document management tables
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_owner_user_id ON documents(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_next_review_date ON documents(next_review_date);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_is_current ON document_versions(is_current);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON document_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions(created_at);

CREATE INDEX IF NOT EXISTS idx_document_approval_workflows_document_id ON document_approval_workflows(document_id);
CREATE INDEX IF NOT EXISTS idx_document_approval_workflows_status ON document_approval_workflows(status);
CREATE INDEX IF NOT EXISTS idx_document_approval_workflows_initiated_by ON document_approval_workflows(initiated_by);

CREATE INDEX IF NOT EXISTS idx_document_approval_steps_workflow_id ON document_approval_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_document_approval_steps_approver_user_id ON document_approval_steps(approver_user_id);
CREATE INDEX IF NOT EXISTS idx_document_approval_steps_status ON document_approval_steps(status);

CREATE INDEX IF NOT EXISTS idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_granted_to ON document_permissions(granted_to_type, granted_to_id);

CREATE INDEX IF NOT EXISTS idx_document_activity_log_document_id ON document_activity_log(document_id);
CREATE INDEX IF NOT EXISTS idx_document_activity_log_user_id ON document_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_document_activity_log_activity_type ON document_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_document_activity_log_created_at ON document_activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_document_relationships_source ON document_relationships(source_document_id);
CREATE INDEX IF NOT EXISTS idx_document_relationships_target ON document_relationships(target_document_id);

CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_version_id ON document_comments(version_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_created_by ON document_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_document_comments_status ON document_comments(status);

-- Microsoft Graph Secure Score Tables

-- Secure scores table - stores historical secure score data
CREATE TABLE IF NOT EXISTS secure_scores (
    id VARCHAR(255) PRIMARY KEY,
    current_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((current_score::DECIMAL / max_score::DECIMAL) * 100, 2)) STORED,
    created_date_time TIMESTAMP NOT NULL,
    active_user_count INTEGER,
    enabled_services INTEGER,
    licensed_user_count INTEGER,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Secure score control profiles table - stores control configuration and recommendations
CREATE TABLE IF NOT EXISTS secure_score_control_profiles (
    id VARCHAR(255) PRIMARY KEY,
    control_name VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    implementation_cost VARCHAR(50),
    user_impact VARCHAR(50),
    compliance_information JSONB,
    control_state_updates JSONB,
    max_score INTEGER,
    current_score INTEGER,
    percentage DECIMAL(5,2),
    description TEXT,
    remediation_impact TEXT,
    action_type VARCHAR(100),
    service VARCHAR(100),
    threats JSONB,
    deprecated BOOLEAN DEFAULT FALSE,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Secure score recommendations table - stores actionable recommendations
CREATE TABLE IF NOT EXISTS secure_score_recommendations (
    id SERIAL PRIMARY KEY,
    recommendation_id VARCHAR(255) UNIQUE NOT NULL,
    control_profile_id VARCHAR(255) REFERENCES secure_score_control_profiles(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    impact_score INTEGER,
    implementation_cost VARCHAR(50),
    user_impact VARCHAR(50),
    compliance_frameworks JSONB,
    action_required TEXT,
    estimated_effort_hours INTEGER,
    business_justification TEXT,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'dismissed', 'not_applicable')),
    assigned_to VARCHAR(255),
    due_date DATE,
    completed_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Secure score alerts table - stores alerts for significant changes
CREATE TABLE IF NOT EXISTS secure_score_alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(255) UNIQUE NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    current_score DECIMAL(5,2),
    previous_score DECIMAL(5,2),
    threshold_value DECIMAL(5,2),
    change_percentage DECIMAL(5,2),
    affected_controls JSONB,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Secure score compliance mapping table - maps controls to compliance frameworks
CREATE TABLE IF NOT EXISTS secure_score_compliance_mapping (
    id SERIAL PRIMARY KEY,
    control_profile_id VARCHAR(255) REFERENCES secure_score_control_profiles(id),
    compliance_framework VARCHAR(100) NOT NULL,
    control_reference VARCHAR(100),
    requirement_description TEXT,
    implementation_status VARCHAR(50) DEFAULT 'not_implemented',
    evidence_required BOOLEAN DEFAULT FALSE,
    evidence_provided BOOLEAN DEFAULT FALSE,
    last_assessment_date DATE,
    next_assessment_date DATE,
    assessor VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Secure score improvement tracking table - tracks implementation progress
CREATE TABLE IF NOT EXISTS secure_score_improvements (
    id SERIAL PRIMARY KEY,
    improvement_id VARCHAR(255) UNIQUE NOT NULL,
    recommendation_id VARCHAR(255) REFERENCES secure_score_recommendations(recommendation_id),
    control_profile_id VARCHAR(255) REFERENCES secure_score_control_profiles(id),
    improvement_type VARCHAR(100) NOT NULL,
    baseline_score INTEGER,
    target_score INTEGER,
    current_score INTEGER,
    implementation_start_date DATE,
    planned_completion_date DATE,
    actual_completion_date DATE,
    implementation_status VARCHAR(50) DEFAULT 'planned' CHECK (implementation_status IN ('planned', 'in_progress', 'testing', 'completed', 'failed', 'cancelled')),
    implementation_notes TEXT,
    business_impact TEXT,
    technical_impact TEXT,
    rollback_plan TEXT,
    success_criteria TEXT,
    assigned_team VARCHAR(255),
    project_manager VARCHAR(255),
    budget_allocated DECIMAL(10,2),
    budget_spent DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for secure score tables
CREATE INDEX IF NOT EXISTS idx_secure_scores_created_date_time ON secure_scores(created_date_time);
CREATE INDEX IF NOT EXISTS idx_secure_scores_percentage ON secure_scores(percentage);
CREATE INDEX IF NOT EXISTS idx_secure_scores_created_at ON secure_scores(created_at);

CREATE INDEX IF NOT EXISTS idx_secure_score_control_profiles_category ON secure_score_control_profiles(category);
CREATE INDEX IF NOT EXISTS idx_secure_score_control_profiles_implementation_cost ON secure_score_control_profiles(implementation_cost);
CREATE INDEX IF NOT EXISTS idx_secure_score_control_profiles_user_impact ON secure_score_control_profiles(user_impact);
CREATE INDEX IF NOT EXISTS idx_secure_score_control_profiles_deprecated ON secure_score_control_profiles(deprecated);

CREATE INDEX IF NOT EXISTS idx_secure_score_recommendations_priority ON secure_score_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_secure_score_recommendations_status ON secure_score_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_secure_score_recommendations_category ON secure_score_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_secure_score_recommendations_assigned_to ON secure_score_recommendations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_secure_score_recommendations_due_date ON secure_score_recommendations(due_date);

CREATE INDEX IF NOT EXISTS idx_secure_score_alerts_alert_type ON secure_score_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_secure_score_alerts_severity ON secure_score_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_secure_score_alerts_status ON secure_score_alerts(status);
CREATE INDEX IF NOT EXISTS idx_secure_score_alerts_created_at ON secure_score_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_secure_score_compliance_mapping_framework ON secure_score_compliance_mapping(compliance_framework);
CREATE INDEX IF NOT EXISTS idx_secure_score_compliance_mapping_status ON secure_score_compliance_mapping(implementation_status);
CREATE INDEX IF NOT EXISTS idx_secure_score_compliance_mapping_assessment_date ON secure_score_compliance_mapping(last_assessment_date);

CREATE INDEX IF NOT EXISTS idx_secure_score_improvements_status ON secure_score_improvements(implementation_status);
CREATE INDEX IF NOT EXISTS idx_secure_score_improvements_assigned_team ON secure_score_improvements(assigned_team);
CREATE INDEX IF NOT EXISTS idx_secure_score_improvements_completion_date ON secure_score_improvements(planned_completion_date);
