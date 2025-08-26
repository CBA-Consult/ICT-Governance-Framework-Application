-- SQL script to create default users with dashboard access rights
-- This script should be run after the main db-schema.sql to set up users with proper access

-- Create default users with dashboard access
INSERT INTO users (
    user_id, username, email, password_hash, first_name, last_name, 
    display_name, department, job_title, status, email_verified, 
    created_at, updated_at
) VALUES
-- Super Admin User
(
    'USR-SUPERADMIN-001', 'superadmin', 'superadmin@company.com',
    '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', -- password: Admin123!
    'Super', 'Administrator', 'Super Administrator',
    'IT', 'Super Administrator', 'Active', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Admin User
(
    'USR-ADMIN-001', 'admin', 'admin@company.com',
    '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', -- password: Admin123!
    'System', 'Administrator', 'System Administrator',
    'IT', 'System Administrator', 'Active', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Governance Manager
(
    'USR-GOVMGR-001', 'govmanager', 'governance.manager@company.com',
    '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', -- password: Admin123!
    'Jane', 'Smith', 'Jane Smith - Governance Manager',
    'Governance', 'Governance Manager', 'Active', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Compliance Officer
(
    'USR-COMPLIANCE-001', 'compliance', 'compliance.officer@company.com',
    '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', -- password: Admin123!
    'John', 'Doe', 'John Doe - Compliance Officer',
    'Legal', 'Compliance Officer', 'Active', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- IT Manager
(
    'USR-ITMGR-001', 'itmanager', 'it.manager@company.com',
    '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', -- password: Admin123!
    'Mike', 'Johnson', 'Mike Johnson - IT Manager',
    'IT', 'IT Manager', 'Active', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Security Analyst
(
    'USR-SECURITY-001', 'security', 'security.analyst@company.com',
    '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', -- password: Admin123!
    'Sarah', 'Wilson', 'Sarah Wilson - Security Analyst',
    'Security', 'Security Analyst', 'Active', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Auditor
(
    'USR-AUDITOR-001', 'auditor', 'auditor@company.com',
    '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', -- password: Admin123!
    'David', 'Brown', 'David Brown - Auditor',
    'Audit', 'Internal Auditor', 'Active', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Regular Employee with Dashboard Access
(
    'USR-EMPLOYEE-001', 'employee', 'employee@company.com',
    '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', -- password: Admin123!
    'Alice', 'Davis', 'Alice Davis - Employee',
    'Operations', 'Business Analyst', 'Active', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Demo User for Testing
(
    'USR-DEMO-001', 'demo', 'demo@company.com',
    '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', -- password: Admin123!
    'Demo', 'User', 'Demo User',
    'Demo', 'Demo User', 'Active', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO NOTHING;

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active, assignment_reason) VALUES
-- Super Admin
('USR-SUPERADMIN-001', 'ROLE_SUPER_ADMIN', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true, 'Initial system setup'),
-- Admin
('USR-ADMIN-001', 'ROLE_ADMIN', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true, 'Initial system setup'),
-- Governance Manager
('USR-GOVMGR-001', 'ROLE_GOVERNANCE_MANAGER', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true, 'Initial system setup'),
-- Compliance Officer
('USR-COMPLIANCE-001', 'ROLE_COMPLIANCE_OFFICER', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true, 'Initial system setup'),
-- IT Manager
('USR-ITMGR-001', 'ROLE_IT_MANAGER', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true, 'Initial system setup'),
-- Security Analyst
('USR-SECURITY-001', 'ROLE_SECURITY_ANALYST', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true, 'Initial system setup'),
-- Auditor
('USR-AUDITOR-001', 'ROLE_AUDITOR', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true, 'Initial system setup'),
-- Employee (base role)
('USR-EMPLOYEE-001', 'ROLE_EMPLOYEE', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true, 'Initial system setup'),
-- Demo User (employee role)
('USR-DEMO-001', 'ROLE_EMPLOYEE', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true, 'Initial system setup')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Grant additional dashboard access to specific users who need it
-- Create custom dashboard roles for employees who need specific access

-- Create a custom role for employees with operational dashboard access
INSERT INTO roles (role_id, role_name, display_name, description, role_type, is_system_role, role_hierarchy_level, created_by) VALUES
('ROLE_EMPLOYEE_DASHBOARD', 'employee_dashboard', 'Employee Dashboard Access', 'Employee role with operational dashboard access', 'Custom', FALSE, 15, 'USR-SUPERADMIN-001')
ON CONFLICT (role_id) DO NOTHING;

-- Assign operational dashboard permission to the custom employee role
INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at, is_active) VALUES
('ROLE_EMPLOYEE_DASHBOARD', 'PERM_DASHBOARD_OPERATIONAL', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true),
('ROLE_EMPLOYEE_DASHBOARD', 'PERM_DASHBOARD_ANALYTICS', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign the custom dashboard role to employees who need dashboard access
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active, assignment_reason) VALUES
('USR-EMPLOYEE-001', 'ROLE_EMPLOYEE_DASHBOARD', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true, 'Dashboard access for business analysis'),
('USR-DEMO-001', 'ROLE_EMPLOYEE_DASHBOARD', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true, 'Demo dashboard access')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Create additional test users with specific dashboard access patterns
INSERT INTO users (
    user_id, username, email, password_hash, first_name, last_name, 
    display_name, department, job_title, status, email_verified, 
    created_at, updated_at
) VALUES
-- Executive User
(
    'USR-EXECUTIVE-001', 'executive', 'executive@company.com',
    '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', -- password: Admin123!
    'Robert', 'Executive', 'Robert Executive - CEO',
    'Executive', 'Chief Executive Officer', 'Active', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Manager with limited access
(
    'USR-MANAGER-001', 'manager', 'manager@company.com',
    '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', -- password: Admin123!
    'Lisa', 'Manager', 'Lisa Manager - Department Head',
    'Operations', 'Department Manager', 'Active', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO NOTHING;

-- Create custom roles for specific access patterns
INSERT INTO roles (role_id, role_name, display_name, description, role_type, is_system_role, role_hierarchy_level, created_by) VALUES
('ROLE_EXECUTIVE_DASHBOARD', 'executive_dashboard', 'Executive Dashboard Only', 'Executive role with only executive dashboard access', 'Custom', FALSE, 85, 'USR-SUPERADMIN-001'),
('ROLE_MANAGER_DASHBOARD', 'manager_dashboard', 'Manager Dashboard Access', 'Manager role with operational and compliance dashboard access', 'Custom', FALSE, 50, 'USR-SUPERADMIN-001')
ON CONFLICT (role_id) DO NOTHING;

-- Assign permissions to custom roles
INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at, is_active) VALUES
-- Executive Dashboard Role
('ROLE_EXECUTIVE_DASHBOARD', 'PERM_DASHBOARD_EXECUTIVE', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true),
('ROLE_EXECUTIVE_DASHBOARD', 'PERM_DASHBOARD_EXPORT', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true),
-- Manager Dashboard Role
('ROLE_MANAGER_DASHBOARD', 'PERM_DASHBOARD_OPERATIONAL', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true),
('ROLE_MANAGER_DASHBOARD', 'PERM_DASHBOARD_COMPLIANCE', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true),
('ROLE_MANAGER_DASHBOARD', 'PERM_DASHBOARD_ANALYTICS', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true),
('ROLE_MANAGER_DASHBOARD', 'PERM_DASHBOARD_EXPORT', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign roles to the new users
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active, assignment_reason) VALUES
-- Executive User
('USR-EXECUTIVE-001', 'ROLE_EXECUTIVE_DASHBOARD', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true, 'Executive dashboard access'),
-- Manager User
('USR-MANAGER-001', 'ROLE_MANAGER_DASHBOARD', 'USR-SUPERADMIN-001', CURRENT_TIMESTAMP, true, 'Manager dashboard access')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Insert password history for all users (required by the system)
INSERT INTO password_history (user_id, password_hash, created_at) VALUES
('USR-SUPERADMIN-001', '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', CURRENT_TIMESTAMP),
('USR-ADMIN-001', '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', CURRENT_TIMESTAMP),
('USR-GOVMGR-001', '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', CURRENT_TIMESTAMP),
('USR-COMPLIANCE-001', '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', CURRENT_TIMESTAMP),
('USR-ITMGR-001', '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', CURRENT_TIMESTAMP),
('USR-SECURITY-001', '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', CURRENT_TIMESTAMP),
('USR-AUDITOR-001', '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', CURRENT_TIMESTAMP),
('USR-EMPLOYEE-001', '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', CURRENT_TIMESTAMP),
('USR-DEMO-001', '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', CURRENT_TIMESTAMP),
('USR-EXECUTIVE-001', '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', CURRENT_TIMESTAMP),
('USR-MANAGER-001', '$2a$12$LQv3c1yqBwEHxPuNYkGGa.drlh7.sy6UvGBXarfnoQI3jtM9UjvgS', CURRENT_TIMESTAMP)
ON CONFLICT (user_id, password_hash) DO NOTHING;

-- Create a summary view of user dashboard permissions for easy verification
CREATE OR REPLACE VIEW user_dashboard_permissions AS
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.department,
    u.job_title,
    u.status,
    array_agg(DISTINCT r.role_name ORDER BY r.role_name) as roles,
    array_agg(DISTINCT p.permission_name ORDER BY p.permission_name) FILTER (WHERE p.resource = 'dashboards') as dashboard_permissions,
    bool_or(p.permission_name = 'dashboard.executive') as has_executive_access,
    bool_or(p.permission_name = 'dashboard.operational') as has_operational_access,
    bool_or(p.permission_name = 'dashboard.compliance') as has_compliance_access,
    bool_or(p.permission_name = 'dashboard.analytics') as has_analytics_access,
    bool_or(p.permission_name = 'dashboard.export') as has_export_access,
    bool_or(p.permission_name = 'dashboard.admin') as has_admin_access
FROM users u
LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = true
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id AND rp.is_active = true
LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = true
WHERE u.status = 'Active'
GROUP BY u.user_id, u.username, u.email, u.first_name, u.last_name, u.department, u.job_title, u.status
ORDER BY u.last_name, u.first_name;

-- Display the summary of user dashboard permissions
SELECT 
    username,
    CONCAT(first_name, ' ', last_name) as full_name,
    department,
    job_title,
    CASE 
        WHEN has_executive_access THEN 'Executive, '
        ELSE ''
    END ||
    CASE 
        WHEN has_operational_access THEN 'Operational, '
        ELSE ''
    END ||
    CASE 
        WHEN has_compliance_access THEN 'Compliance, '
        ELSE ''
    END ||
    CASE 
        WHEN has_analytics_access THEN 'Analytics, '
        ELSE ''
    END ||
    CASE 
        WHEN has_export_access THEN 'Export, '
        ELSE ''
    END ||
    CASE 
        WHEN has_admin_access THEN 'Admin'
        ELSE ''
    END as dashboard_access
FROM user_dashboard_permissions
WHERE array_length(dashboard_permissions, 1) > 0 OR dashboard_permissions IS NOT NULL;

-- Insert some sample activity logs to demonstrate the audit functionality
INSERT INTO user_activity_log (
    log_id, user_id, activity_type, activity_description, 
    resource, action, success, created_at
) VALUES
('LOG-SETUP-001', 'USR-SUPERADMIN-001', 'user_creation', 'Initial system setup - created default users', 'users', 'create', true, CURRENT_TIMESTAMP),
('LOG-SETUP-002', 'USR-SUPERADMIN-001', 'role_assignment', 'Initial system setup - assigned dashboard roles', 'roles', 'assign', true, CURRENT_TIMESTAMP),
('LOG-SETUP-003', 'USR-SUPERADMIN-001', 'dashboard_access', 'Initial system setup - configured dashboard permissions', 'dashboards', 'setup', true, CURRENT_TIMESTAMP)
ON CONFLICT (log_id) DO NOTHING;