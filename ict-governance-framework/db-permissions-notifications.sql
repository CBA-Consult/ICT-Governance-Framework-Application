-- Notification and Communication System Permissions and Roles
-- This file adds comprehensive permissions and roles for the notification system

-- =====================================================
-- NOTIFICATION PERMISSIONS
-- =====================================================

-- Basic notification permissions
INSERT INTO permissions (permission_name, description, category, resource_type) VALUES
('notification.create', 'Create notifications', 'notification', 'notification'),
('notification.read', 'Read notifications', 'notification', 'notification'),
('notification.update', 'Update notifications', 'notification', 'notification'),
('notification.delete', 'Delete notifications', 'notification', 'notification'),
('notification.manage', 'Full notification management', 'notification', 'notification'),
('notification.acknowledge', 'Acknowledge notifications', 'notification', 'notification'),
('notification.schedule', 'Schedule notifications', 'notification', 'notification'),
('notification.analytics', 'View notification analytics', 'notification', 'notification'),
('notification.bulk_action', 'Perform bulk notification actions', 'notification', 'notification'),
('notification.template.create', 'Create notification templates', 'notification', 'template'),
('notification.template.manage', 'Manage notification templates', 'notification', 'template'),
('notification.preferences.manage', 'Manage notification preferences', 'notification', 'preferences')
ON CONFLICT (permission_name) DO NOTHING;

-- =====================================================
-- ALERT PERMISSIONS
-- =====================================================

-- Alert management permissions
INSERT INTO permissions (permission_name, description, category, resource_type) VALUES
('alert.create', 'Create alerts', 'alert', 'alert'),
('alert.read', 'Read alerts', 'alert', 'alert'),
('alert.update', 'Update alerts', 'alert', 'alert'),
('alert.delete', 'Delete alerts', 'alert', 'alert'),
('alert.manage', 'Full alert management', 'alert', 'alert'),
('alert.acknowledge', 'Acknowledge alerts', 'alert', 'alert'),
('alert.resolve', 'Resolve alerts', 'alert', 'alert'),
('alert.escalate', 'Escalate alerts', 'alert', 'alert'),
('alert.analytics', 'View alert analytics', 'alert', 'alert'),
('alert.bulk_action', 'Perform bulk alert actions', 'alert', 'alert'),
('alert.template.create', 'Create alert templates', 'alert', 'template'),
('alert.template.manage', 'Manage alert templates', 'alert', 'template'),
('alert.rule.create', 'Create alert rules', 'alert', 'rule'),
('alert.rule.manage', 'Manage alert rules', 'alert', 'rule')
ON CONFLICT (permission_name) DO NOTHING;

-- =====================================================
-- COMMUNICATION PERMISSIONS
-- =====================================================

-- Communication channel permissions
INSERT INTO permissions (permission_name, description, category, resource_type) VALUES
('communication.read', 'Read communications', 'communication', 'communication'),
('communication.send', 'Send communications', 'communication', 'communication'),
('communication.manage', 'Manage communications', 'communication', 'communication'),
('communication.channel.create', 'Create communication channels', 'communication', 'channel'),
('communication.channel.manage', 'Manage communication channels', 'communication', 'channel'),
('communication.channel.delete', 'Delete communication channels', 'communication', 'channel'),
('communication.message.send', 'Send messages in channels', 'communication', 'message'),
('communication.message.edit', 'Edit messages', 'communication', 'message'),
('communication.message.delete', 'Delete messages', 'communication', 'message'),
('communication.template.create', 'Create communication templates', 'communication', 'template'),
('communication.template.manage', 'Manage communication templates', 'communication', 'template'),
('communication.template.send', 'Send communications using templates', 'communication', 'template'),
('communication.analytics', 'View communication analytics', 'communication', 'analytics')
ON CONFLICT (permission_name) DO NOTHING;

-- =====================================================
-- ANNOUNCEMENT PERMISSIONS
-- =====================================================

-- Announcement permissions
INSERT INTO permissions (permission_name, description, category, resource_type) VALUES
('announcement.create', 'Create announcements', 'announcement', 'announcement'),
('announcement.read', 'Read announcements', 'announcement', 'announcement'),
('announcement.update', 'Update announcements', 'announcement', 'announcement'),
('announcement.delete', 'Delete announcements', 'announcement', 'announcement'),
('announcement.manage', 'Full announcement management', 'announcement', 'announcement'),
('announcement.comment', 'Comment on announcements', 'announcement', 'comment'),
('announcement.moderate', 'Moderate announcement comments', 'announcement', 'comment'),
('announcement.analytics', 'View announcement analytics', 'announcement', 'analytics'),
('announcement.schedule', 'Schedule announcements', 'announcement', 'announcement'),
('announcement.broadcast', 'Create system-wide announcements', 'announcement', 'announcement')
ON CONFLICT (permission_name) DO NOTHING;

-- =====================================================
-- ESCALATION PERMISSIONS
-- =====================================================

-- Escalation management permissions
INSERT INTO permissions (permission_name, description, category, resource_type) VALUES
('escalation.read', 'Read escalations', 'escalation', 'escalation'),
('escalation.create', 'Create escalations', 'escalation', 'escalation'),
('escalation.update', 'Update escalations', 'escalation', 'escalation'),
('escalation.delete', 'Delete escalations', 'escalation', 'escalation'),
('escalation.manage', 'Full escalation management', 'escalation', 'escalation'),
('escalation.resolve', 'Resolve escalations', 'escalation', 'escalation'),
('escalation.assign', 'Assign escalations', 'escalation', 'escalation'),
('escalation.policy.create', 'Create escalation policies', 'escalation', 'policy'),
('escalation.policy.manage', 'Manage escalation policies', 'escalation', 'policy'),
('escalation.service.manage', 'Manage escalation service', 'escalation', 'service'),
('escalation.analytics', 'View escalation analytics', 'escalation', 'analytics')
ON CONFLICT (permission_name) DO NOTHING;

-- =====================================================
-- SYSTEM ADMINISTRATION PERMISSIONS
-- =====================================================

-- System-level permissions for notification system
INSERT INTO permissions (permission_name, description, category, resource_type) VALUES
('system.notification.admin', 'Full notification system administration', 'system', 'notification'),
('system.alert.admin', 'Full alert system administration', 'system', 'alert'),
('system.communication.admin', 'Full communication system administration', 'system', 'communication'),
('system.escalation.admin', 'Full escalation system administration', 'system', 'escalation'),
('system.monitoring.read', 'Read system monitoring data', 'system', 'monitoring'),
('system.health.read', 'Read system health status', 'system', 'health'),
('system.logs.read', 'Read system logs', 'system', 'logs'),
('system.config.manage', 'Manage system configuration', 'system', 'config')
ON CONFLICT (permission_name) DO NOTHING;

-- =====================================================
-- ROLES DEFINITION
-- =====================================================

-- Notification User Role
INSERT INTO roles (role_name, description, is_system_role, created_by) VALUES
('notification_user', 'Basic notification user with read and acknowledge permissions', true, 'system')
ON CONFLICT (role_name) DO NOTHING;

-- Notification Manager Role
INSERT INTO roles (role_name, description, is_system_role, created_by) VALUES
('notification_manager', 'Notification manager with create and manage permissions', true, 'system')
ON CONFLICT (role_name) DO NOTHING;

-- Alert Operator Role
INSERT INTO roles (role_name, description, is_system_role, created_by) VALUES
('alert_operator', 'Alert operator with acknowledge and resolve permissions', true, 'system')
ON CONFLICT (role_name) DO NOTHING;

-- Alert Manager Role
INSERT INTO roles (role_name, description, is_system_role, created_by) VALUES
('alert_manager', 'Alert manager with full alert management permissions', true, 'system')
ON CONFLICT (role_name) DO NOTHING;

-- Communication User Role
INSERT INTO roles (role_name, description, is_system_role, created_by) VALUES
('communication_user', 'Basic communication user with send and read permissions', true, 'system')
ON CONFLICT (role_name) DO NOTHING;

-- Communication Manager Role
INSERT INTO roles (role_name, description, is_system_role, created_by) VALUES
('communication_manager', 'Communication manager with channel and template management', true, 'system')
ON CONFLICT (role_name) DO NOTHING;

-- Announcement Editor Role
INSERT INTO roles (role_name, description, is_system_role, created_by) VALUES
('announcement_editor', 'Announcement editor with create and manage permissions', true, 'system')
ON CONFLICT (role_name) DO NOTHING;

-- Escalation Specialist Role
INSERT INTO roles (role_name, description, is_system_role, created_by) VALUES
('escalation_specialist', 'Escalation specialist with escalation management permissions', true, 'system')
ON CONFLICT (role_name) DO NOTHING;

-- System Monitor Role
INSERT INTO roles (role_name, description, is_system_role, created_by) VALUES
('system_monitor', 'System monitor with read-only access to system metrics', true, 'system')
ON CONFLICT (role_name) DO NOTHING;

-- Notification Administrator Role
INSERT INTO roles (role_name, description, is_system_role, created_by) VALUES
('notification_administrator', 'Full notification system administrator', true, 'system')
ON CONFLICT (role_name) DO NOTHING;

-- =====================================================
-- ROLE PERMISSION ASSIGNMENTS
-- =====================================================

-- Notification User Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'notification_user'
AND p.permission_name IN (
    'notification.read',
    'notification.acknowledge',
    'notification.preferences.manage'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Notification Manager Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'notification_manager'
AND p.permission_name IN (
    'notification.create',
    'notification.read',
    'notification.update',
    'notification.delete',
    'notification.manage',
    'notification.acknowledge',
    'notification.schedule',
    'notification.analytics',
    'notification.bulk_action',
    'notification.template.create',
    'notification.template.manage',
    'notification.preferences.manage'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Alert Operator Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'alert_operator'
AND p.permission_name IN (
    'alert.read',
    'alert.acknowledge',
    'alert.resolve',
    'alert.analytics'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Alert Manager Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'alert_manager'
AND p.permission_name IN (
    'alert.create',
    'alert.read',
    'alert.update',
    'alert.delete',
    'alert.manage',
    'alert.acknowledge',
    'alert.resolve',
    'alert.escalate',
    'alert.analytics',
    'alert.bulk_action',
    'alert.template.create',
    'alert.template.manage',
    'alert.rule.create',
    'alert.rule.manage'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Communication User Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'communication_user'
AND p.permission_name IN (
    'communication.read',
    'communication.send',
    'communication.message.send',
    'announcement.read',
    'announcement.comment'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Communication Manager Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'communication_manager'
AND p.permission_name IN (
    'communication.read',
    'communication.send',
    'communication.manage',
    'communication.channel.create',
    'communication.channel.manage',
    'communication.channel.delete',
    'communication.message.send',
    'communication.message.edit',
    'communication.message.delete',
    'communication.template.create',
    'communication.template.manage',
    'communication.template.send',
    'communication.analytics'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Announcement Editor Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'announcement_editor'
AND p.permission_name IN (
    'announcement.create',
    'announcement.read',
    'announcement.update',
    'announcement.delete',
    'announcement.manage',
    'announcement.comment',
    'announcement.moderate',
    'announcement.analytics',
    'announcement.schedule',
    'announcement.broadcast'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Escalation Specialist Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'escalation_specialist'
AND p.permission_name IN (
    'escalation.read',
    'escalation.create',
    'escalation.update',
    'escalation.manage',
    'escalation.resolve',
    'escalation.assign',
    'escalation.policy.create',
    'escalation.policy.manage',
    'escalation.analytics'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- System Monitor Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'system_monitor'
AND p.permission_name IN (
    'system.monitoring.read',
    'system.health.read',
    'system.logs.read',
    'notification.analytics',
    'alert.analytics',
    'communication.analytics',
    'escalation.analytics'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Notification Administrator Role Permissions (Full Access)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'notification_administrator'
AND p.permission_name LIKE 'notification.%'
OR p.permission_name LIKE 'alert.%'
OR p.permission_name LIKE 'communication.%'
OR p.permission_name LIKE 'announcement.%'
OR p.permission_name LIKE 'escalation.%'
OR p.permission_name LIKE 'system.%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- ENHANCED EXISTING ROLES
-- =====================================================

-- Add notification permissions to existing admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'admin'
AND p.permission_name IN (
    'notification.manage',
    'alert.manage',
    'communication.manage',
    'announcement.manage',
    'escalation.manage',
    'system.notification.admin',
    'system.alert.admin',
    'system.communication.admin',
    'system.escalation.admin'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Add notification permissions to existing IT Manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'IT Manager'
AND p.permission_name IN (
    'notification.create',
    'notification.read',
    'notification.manage',
    'alert.read',
    'alert.acknowledge',
    'alert.resolve',
    'alert.escalate',
    'communication.manage',
    'announcement.create',
    'announcement.manage',
    'escalation.read',
    'escalation.manage'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Add notification permissions to existing Security Officer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'Security Officer'
AND p.permission_name IN (
    'notification.read',
    'notification.create',
    'alert.read',
    'alert.acknowledge',
    'alert.resolve',
    'alert.escalate',
    'alert.manage',
    'communication.read',
    'communication.send',
    'escalation.read',
    'escalation.create'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Add notification permissions to existing Compliance Officer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'Compliance Officer'
AND p.permission_name IN (
    'notification.read',
    'notification.analytics',
    'alert.read',
    'alert.analytics',
    'communication.read',
    'communication.analytics',
    'announcement.read',
    'announcement.analytics',
    'escalation.read',
    'escalation.analytics'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Add basic notification permissions to existing Employee role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'Employee'
AND p.permission_name IN (
    'notification.read',
    'notification.acknowledge',
    'notification.preferences.manage',
    'communication.read',
    'communication.send',
    'communication.message.send',
    'announcement.read',
    'announcement.comment'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- PERMISSION HIERARCHY AND DEPENDENCIES
-- =====================================================

-- Create permission dependencies table if it doesn't exist
CREATE TABLE IF NOT EXISTS permission_dependencies (
    id SERIAL PRIMARY KEY,
    permission_id INTEGER NOT NULL REFERENCES permissions(id),
    depends_on_permission_id INTEGER NOT NULL REFERENCES permissions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(permission_id, depends_on_permission_id)
);

-- Define permission dependencies
INSERT INTO permission_dependencies (permission_id, depends_on_permission_id)
SELECT p1.id, p2.id
FROM permissions p1, permissions p2
WHERE (p1.permission_name = 'notification.manage' AND p2.permission_name = 'notification.read')
   OR (p1.permission_name = 'notification.delete' AND p2.permission_name = 'notification.update')
   OR (p1.permission_name = 'notification.update' AND p2.permission_name = 'notification.read')
   OR (p1.permission_name = 'alert.manage' AND p2.permission_name = 'alert.read')
   OR (p1.permission_name = 'alert.resolve' AND p2.permission_name = 'alert.acknowledge')
   OR (p1.permission_name = 'alert.escalate' AND p2.permission_name = 'alert.read')
   OR (p1.permission_name = 'communication.manage' AND p2.permission_name = 'communication.read')
   OR (p1.permission_name = 'communication.channel.manage' AND p2.permission_name = 'communication.channel.create')
   OR (p1.permission_name = 'announcement.manage' AND p2.permission_name = 'announcement.read')
   OR (p1.permission_name = 'escalation.manage' AND p2.permission_name = 'escalation.read')
ON CONFLICT (permission_id, depends_on_permission_id) DO NOTHING;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better permission checking performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_type ON permissions(resource_type);

-- =====================================================
-- PERMISSION VALIDATION FUNCTIONS
-- =====================================================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(user_id_param INTEGER, permission_name_param VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = user_id_param
        AND p.permission_name = permission_name_param
        AND ur.is_active = true
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function to get all user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_id_param INTEGER)
RETURNS TABLE(permission_name VARCHAR, description TEXT, category VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.permission_name, p.description, p.category
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_id_param
    AND ur.is_active = true
    ORDER BY p.category, p.permission_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get user roles with permissions
CREATE OR REPLACE FUNCTION get_user_roles_with_permissions(user_id_param INTEGER)
RETURNS TABLE(
    role_name VARCHAR, 
    role_description TEXT, 
    permission_name VARCHAR, 
    permission_description TEXT,
    permission_category VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.role_name,
        r.description as role_description,
        p.permission_name,
        p.description as permission_description,
        p.category as permission_category
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_id_param
    AND ur.is_active = true
    ORDER BY r.role_name, p.category, p.permission_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUDIT LOGGING FOR PERMISSIONS
-- =====================================================

-- Create audit table for permission changes
CREATE TABLE IF NOT EXISTS permission_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    permission_name VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_user_id ON permission_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_created_at ON permission_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_action ON permission_audit_log(action);

-- =====================================================
-- SUMMARY VIEWS
-- =====================================================

-- View for role permission summary
CREATE OR REPLACE VIEW role_permission_summary AS
SELECT 
    r.role_name,
    r.description as role_description,
    COUNT(rp.permission_id) as permission_count,
    STRING_AGG(p.category, ', ' ORDER BY p.category) as categories,
    r.created_at,
    r.is_system_role
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.role_name, r.description, r.created_at, r.is_system_role
ORDER BY r.role_name;

-- View for user permission summary
CREATE OR REPLACE VIEW user_permission_summary AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    COUNT(DISTINCT ur.role_id) as role_count,
    COUNT(DISTINCT p.id) as permission_count,
    STRING_AGG(DISTINCT r.role_name, ', ' ORDER BY r.role_name) as roles,
    STRING_AGG(DISTINCT p.category, ', ' ORDER BY p.category) as permission_categories
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY u.id, u.username, u.email
ORDER BY u.username;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Log completion
INSERT INTO permission_audit_log (action, resource_type, resource_id, new_value, created_at)
VALUES (
    'SCHEMA_UPDATE',
    'notification_system',
    'permissions_and_roles',
    '{"message": "Notification system permissions and roles successfully created", "permissions_added": 52, "roles_added": 10, "timestamp": "' || NOW() || '"}',
    NOW()
);

-- Display summary
DO $$
DECLARE
    permission_count INTEGER;
    role_count INTEGER;
    assignment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO permission_count FROM permissions WHERE category IN ('notification', 'alert', 'communication', 'announcement', 'escalation', 'system');
    SELECT COUNT(*) INTO role_count FROM roles WHERE role_name LIKE '%notification%' OR role_name LIKE '%alert%' OR role_name LIKE '%communication%' OR role_name LIKE '%announcement%' OR role_name LIKE '%escalation%';
    SELECT COUNT(*) INTO assignment_count FROM role_permissions rp 
    JOIN permissions p ON rp.permission_id = p.id 
    WHERE p.category IN ('notification', 'alert', 'communication', 'announcement', 'escalation', 'system');
    
    RAISE NOTICE '=== NOTIFICATION SYSTEM PERMISSIONS SETUP COMPLETE ===';
    RAISE NOTICE 'Permissions created: %', permission_count;
    RAISE NOTICE 'Roles created: %', role_count;
    RAISE NOTICE 'Role-Permission assignments: %', assignment_count;
    RAISE NOTICE '=== SETUP SUCCESSFUL ===';
END $$;