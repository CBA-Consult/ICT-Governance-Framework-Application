-- CASB App Catalog Database Schema
-- Database schema for Cloud App Security (CASB) App Catalog
-- Supports employee-facing and admin-facing API functionality

-- ==============================================
-- Application Catalog Tables
-- ==============================================

-- Main application catalog table
CREATE TABLE IF NOT EXISTS casb_app_catalog (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    publisher VARCHAR(255) NOT NULL,
    version VARCHAR(50),
    is_approved BOOLEAN DEFAULT false,
    approval_status VARCHAR(50) DEFAULT 'Pending Review',
    security_rating INTEGER CHECK (security_rating >= 0 AND security_rating <= 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('Low', 'Medium', 'High')),
    data_classification VARCHAR(50),
    last_security_update TIMESTAMP,
    last_compliance_review TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance status for applications
CREATE TABLE IF NOT EXISTS casb_app_compliance (
    id SERIAL PRIMARY KEY,
    app_id VARCHAR(100) REFERENCES casb_app_catalog(id) ON DELETE CASCADE,
    soc2_compliant BOOLEAN DEFAULT false,
    iso27001_compliant BOOLEAN DEFAULT false,
    gdpr_compliant BOOLEAN DEFAULT false,
    hipaa_compliant BOOLEAN DEFAULT false,
    pci_dss_compliant BOOLEAN DEFAULT false,
    compliance_notes TEXT,
    last_validated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(app_id)
);

-- Security vulnerabilities for applications
CREATE TABLE IF NOT EXISTS casb_app_vulnerabilities (
    id SERIAL PRIMARY KEY,
    app_id VARCHAR(100) REFERENCES casb_app_catalog(id) ON DELETE CASCADE,
    severity VARCHAR(20) CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT NOT NULL,
    cve_id VARCHAR(50),
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Acknowledged'))
);

-- Application usage guidelines
CREATE TABLE IF NOT EXISTS casb_app_guidelines (
    id SERIAL PRIMARY KEY,
    app_id VARCHAR(100) REFERENCES casb_app_catalog(id) ON DELETE CASCADE,
    guideline TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application policies
CREATE TABLE IF NOT EXISTS casb_app_policies (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    policy_url VARCHAR(500),
    version VARCHAR(50),
    effective_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mapping between applications and policies
CREATE TABLE IF NOT EXISTS casb_app_policy_mapping (
    id SERIAL PRIMARY KEY,
    app_id VARCHAR(100) REFERENCES casb_app_catalog(id) ON DELETE CASCADE,
    policy_id VARCHAR(100) REFERENCES casb_app_policies(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT true,
    UNIQUE(app_id, policy_id)
);

-- ==============================================
-- User Interaction Tables
-- ==============================================

-- User application usage tracking
CREATE TABLE IF NOT EXISTS casb_user_app_usage (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    app_id VARCHAR(100) REFERENCES casb_app_catalog(id) ON DELETE CASCADE,
    installation_id VARCHAR(100) UNIQUE,
    install_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Uninstalled')),
    version VARCHAR(50),
    UNIQUE(user_id, app_id)
);

-- Application approval requests
CREATE TABLE IF NOT EXISTS casb_app_requests (
    id VARCHAR(100) PRIMARY KEY,
    app_id VARCHAR(100) REFERENCES casb_app_catalog(id),
    user_id VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    business_justification TEXT NOT NULL,
    estimated_users INTEGER DEFAULT 1,
    urgency VARCHAR(20) DEFAULT 'Medium' CHECK (urgency IN ('Low', 'Medium', 'High')),
    status VARCHAR(50) DEFAULT 'Pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(100),
    review_notes TEXT
);

-- Approval workflow steps
CREATE TABLE IF NOT EXISTS casb_approval_workflow (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(100) REFERENCES casb_app_requests(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Rejected')),
    approver_role VARCHAR(100),
    completed_at TIMESTAMP,
    notes TEXT
);

-- Shadow IT reports
CREATE TABLE IF NOT EXISTS casb_shadow_it_reports (
    id VARCHAR(100) PRIMARY KEY,
    app_name VARCHAR(255) NOT NULL,
    app_url VARCHAR(500),
    description TEXT,
    usage_reason TEXT NOT NULL,
    reported_by VARCHAR(100) NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Under Review',
    risk_assessment VARCHAR(50) DEFAULT 'Pending',
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(100),
    action_taken TEXT
);

-- Policy acknowledgments
CREATE TABLE IF NOT EXISTS casb_policy_acknowledgments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    app_id VARCHAR(100) REFERENCES casb_app_catalog(id) ON DELETE CASCADE,
    policy_id VARCHAR(100) REFERENCES casb_app_policies(id) ON DELETE CASCADE,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP,
    UNIQUE(user_id, app_id, policy_id)
);

-- Application feedback and ratings
CREATE TABLE IF NOT EXISTS casb_app_feedback (
    id VARCHAR(100) PRIMARY KEY,
    app_id VARCHAR(100) REFERENCES casb_app_catalog(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category VARCHAR(50) CHECK (category IN ('Performance', 'Security', 'Usability', 'Support', 'Other')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User notifications
CREATE TABLE IF NOT EXISTS casb_user_notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- ==============================================
-- Admin and Analytics Tables
-- ==============================================

-- Policy update broadcasts
CREATE TABLE IF NOT EXISTS casb_policy_broadcasts (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_audience VARCHAR(50) DEFAULT 'All' CHECK (target_audience IN ('All', 'Department', 'Role', 'Specific')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    broadcast_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Sent'
);

-- Application usage analytics
CREATE TABLE IF NOT EXISTS casb_app_usage_analytics (
    id SERIAL PRIMARY KEY,
    app_id VARCHAR(100) REFERENCES casb_app_catalog(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_installations INTEGER DEFAULT 0,
    avg_satisfaction_rating DECIMAL(3,2),
    total_feedback_count INTEGER DEFAULT 0,
    UNIQUE(app_id, date)
);

-- ==============================================
-- Indexes for Performance
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_casb_app_catalog_category ON casb_app_catalog(category);
CREATE INDEX IF NOT EXISTS idx_casb_app_catalog_approval_status ON casb_app_catalog(approval_status);
CREATE INDEX IF NOT EXISTS idx_casb_app_catalog_risk_level ON casb_app_catalog(risk_level);
CREATE INDEX IF NOT EXISTS idx_casb_app_catalog_is_approved ON casb_app_catalog(is_approved);

CREATE INDEX IF NOT EXISTS idx_casb_app_requests_user_id ON casb_app_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_casb_app_requests_status ON casb_app_requests(status);
CREATE INDEX IF NOT EXISTS idx_casb_app_requests_department ON casb_app_requests(department);

CREATE INDEX IF NOT EXISTS idx_casb_user_app_usage_user_id ON casb_user_app_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_casb_user_app_usage_app_id ON casb_user_app_usage(app_id);

CREATE INDEX IF NOT EXISTS idx_casb_shadow_it_reports_status ON casb_shadow_it_reports(status);
CREATE INDEX IF NOT EXISTS idx_casb_shadow_it_reports_reported_by ON casb_shadow_it_reports(reported_by);

CREATE INDEX IF NOT EXISTS idx_casb_policy_acknowledgments_user_id ON casb_policy_acknowledgments(user_id);
CREATE INDEX IF NOT EXISTS idx_casb_policy_acknowledgments_app_id ON casb_policy_acknowledgments(app_id);

CREATE INDEX IF NOT EXISTS idx_casb_app_feedback_app_id ON casb_app_feedback(app_id);
CREATE INDEX IF NOT EXISTS idx_casb_app_feedback_user_id ON casb_app_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_casb_user_notifications_user_id ON casb_user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_casb_user_notifications_is_read ON casb_user_notifications(is_read);

-- ==============================================
-- Sample Data Insertion
-- ==============================================

-- Insert sample applications
INSERT INTO casb_app_catalog (id, name, description, category, publisher, version, is_approved, approval_status, security_rating, risk_level, data_classification, last_security_update, last_compliance_review)
VALUES 
    ('app-001', 'Microsoft Office 365', 'Complete productivity suite with Word, Excel, PowerPoint, and Teams', 'Productivity', 'Microsoft Corporation', '2024.1', true, 'Approved', 95, 'Low', 'Business', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('app-002', 'Slack', 'Team collaboration and communication platform', 'Communication', 'Slack Technologies', '4.35.0', true, 'Approved with Restrictions', 88, 'Medium', 'Business', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('app-003', 'Zoom', 'Video conferencing and online meetings', 'Communication', 'Zoom Video Communications', '5.16.0', true, 'Approved', 85, 'Medium', 'Business', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Insert compliance information
INSERT INTO casb_app_compliance (app_id, soc2_compliant, iso27001_compliant, gdpr_compliant, hipaa_compliant, pci_dss_compliant)
VALUES 
    ('app-001', true, true, true, true, false),
    ('app-002', true, true, true, false, false),
    ('app-003', true, true, true, true, false)
ON CONFLICT (app_id) DO NOTHING;

-- Insert sample policies
INSERT INTO casb_app_policies (id, name, description, policy_url, version, effective_date)
VALUES 
    ('pol-001', 'Data Retention Policy', 'Guidelines for data retention and archival', '/policies/data-retention', '1.0', '2024-01-01'),
    ('pol-002', 'Information Security Policy', 'Information security requirements and guidelines', '/policies/info-security', '2.0', '2024-01-01'),
    ('pol-003', 'Communication Policy', 'Guidelines for business communication', '/policies/communication', '1.0', '2024-01-01'),
    ('pol-004', 'Data Classification Policy', 'Data classification and handling guidelines', '/policies/data-classification', '1.5', '2024-01-01'),
    ('pol-005', 'Video Conference Policy', 'Video conferencing security and privacy guidelines', '/policies/video-conference', '1.0', '2024-01-01')
ON CONFLICT (id) DO NOTHING;

-- Map policies to applications
INSERT INTO casb_app_policy_mapping (app_id, policy_id, is_required)
VALUES 
    ('app-001', 'pol-001', true),
    ('app-001', 'pol-002', true),
    ('app-002', 'pol-003', true),
    ('app-002', 'pol-004', true),
    ('app-003', 'pol-005', true)
ON CONFLICT (app_id, policy_id) DO NOTHING;

-- Insert usage guidelines
INSERT INTO casb_app_guidelines (app_id, guideline, priority)
VALUES 
    ('app-001', 'Use corporate credentials for authentication', 1),
    ('app-001', 'Follow data retention policies', 2),
    ('app-001', 'Do not share sensitive data externally without approval', 3),
    ('app-002', 'Approved for internal collaboration only', 1),
    ('app-002', 'Do not share customer data without encryption', 2),
    ('app-002', 'Review channel permissions regularly', 3),
    ('app-003', 'Enable waiting room for external meetings', 1),
    ('app-003', 'Use password protection for sensitive meetings', 2),
    ('app-003', 'Record meetings only with participant consent', 3);

-- Insert sample vulnerability
INSERT INTO casb_app_vulnerabilities (app_id, severity, description, cve_id, status)
VALUES 
    ('app-002', 'Low', 'Update to latest version recommended', 'CVE-2023-12345', 'Acknowledged');

-- ==============================================
-- Views for Common Queries
-- ==============================================

-- View for approved applications with full details
CREATE OR REPLACE VIEW casb_approved_apps_view AS
SELECT 
    a.id,
    a.name,
    a.description,
    a.category,
    a.publisher,
    a.version,
    a.security_rating,
    a.risk_level,
    c.soc2_compliant,
    c.iso27001_compliant,
    c.gdpr_compliant,
    c.hipaa_compliant,
    COUNT(DISTINCT v.id) as vulnerability_count,
    COUNT(DISTINCT f.id) as feedback_count,
    AVG(f.rating) as avg_rating
FROM casb_app_catalog a
LEFT JOIN casb_app_compliance c ON a.id = c.app_id
LEFT JOIN casb_app_vulnerabilities v ON a.id = v.app_id AND v.status = 'Open'
LEFT JOIN casb_app_feedback f ON a.id = f.app_id
WHERE a.is_approved = true
GROUP BY a.id, a.name, a.description, a.category, a.publisher, a.version, 
         a.security_rating, a.risk_level, c.soc2_compliant, c.iso27001_compliant, 
         c.gdpr_compliant, c.hipaa_compliant;

-- View for pending approval requests
CREATE OR REPLACE VIEW casb_pending_requests_view AS
SELECT 
    r.id,
    r.user_id,
    r.department,
    r.business_justification,
    r.submitted_at,
    a.name as app_name,
    a.category,
    a.risk_level,
    COUNT(w.id) as workflow_steps,
    COUNT(CASE WHEN w.status = 'Completed' THEN 1 END) as completed_steps
FROM casb_app_requests r
JOIN casb_app_catalog a ON r.app_id = a.id
LEFT JOIN casb_approval_workflow w ON r.id = w.request_id
WHERE r.status = 'Pending'
GROUP BY r.id, r.user_id, r.department, r.business_justification, 
         r.submitted_at, a.name, a.category, a.risk_level;

-- ==============================================
-- Functions for Common Operations
-- ==============================================

-- Function to check if user has acknowledged all required policies for an app
CREATE OR REPLACE FUNCTION casb_check_policy_compliance(p_user_id VARCHAR, p_app_id VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    required_policies_count INTEGER;
    acknowledged_policies_count INTEGER;
BEGIN
    -- Count required policies for the app
    SELECT COUNT(*) INTO required_policies_count
    FROM casb_app_policy_mapping
    WHERE app_id = p_app_id AND is_required = true;
    
    -- Count acknowledged policies by the user
    SELECT COUNT(*) INTO acknowledged_policies_count
    FROM casb_policy_acknowledgments pa
    JOIN casb_app_policy_mapping pm ON pa.policy_id = pm.policy_id AND pa.app_id = pm.app_id
    WHERE pa.user_id = p_user_id 
      AND pa.app_id = p_app_id 
      AND pa.acknowledged = true
      AND pm.is_required = true;
    
    -- Return true if all required policies are acknowledged
    RETURN required_policies_count = acknowledged_policies_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update application usage analytics
CREATE OR REPLACE FUNCTION casb_update_usage_analytics()
RETURNS void AS $$
BEGIN
    INSERT INTO casb_app_usage_analytics (app_id, date, total_users, active_users, new_installations, avg_satisfaction_rating, total_feedback_count)
    SELECT 
        u.app_id,
        CURRENT_DATE,
        COUNT(DISTINCT u.user_id) as total_users,
        COUNT(DISTINCT CASE WHEN u.last_used >= CURRENT_DATE - INTERVAL '7 days' THEN u.user_id END) as active_users,
        COUNT(DISTINCT CASE WHEN u.install_date >= CURRENT_DATE THEN u.user_id END) as new_installations,
        AVG(f.rating) as avg_satisfaction_rating,
        COUNT(DISTINCT f.id) as total_feedback_count
    FROM casb_user_app_usage u
    LEFT JOIN casb_app_feedback f ON u.app_id = f.app_id
    WHERE u.status = 'Active'
    GROUP BY u.app_id
    ON CONFLICT (app_id, date) 
    DO UPDATE SET
        total_users = EXCLUDED.total_users,
        active_users = EXCLUDED.active_users,
        new_installations = EXCLUDED.new_installations,
        avg_satisfaction_rating = EXCLUDED.avg_satisfaction_rating,
        total_feedback_count = EXCLUDED.total_feedback_count;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- Triggers
-- ==============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_casb_app_catalog_updated_at
    BEFORE UPDATE ON casb_app_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_casb_app_policies_updated_at
    BEFORE UPDATE ON casb_app_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- Permissions (adjust as needed)
-- ==============================================

-- Grant appropriate permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
