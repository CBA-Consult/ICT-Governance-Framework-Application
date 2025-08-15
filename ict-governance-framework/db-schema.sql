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
('PERM_APP_MANAGE', 'app.manage', 'Manage Applications', 'Manage application catalog and registrations', 'applications', 'manage', TRUE)
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

-- Employee
('ROLE_EMPLOYEE', 'PERM_GOVERNANCE_READ'),
('ROLE_EMPLOYEE', 'PERM_COMPLIANCE_READ'),
('ROLE_EMPLOYEE', 'PERM_FEEDBACK_CREATE'),
('ROLE_EMPLOYEE', 'PERM_FEEDBACK_READ'),
('ROLE_EMPLOYEE', 'PERM_WORKFLOW_CREATE'),
('ROLE_EMPLOYEE', 'PERM_WORKFLOW_READ'),
('ROLE_EMPLOYEE', 'PERM_APP_PROCUREMENT'),

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
