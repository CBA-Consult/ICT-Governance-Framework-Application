-- Database Permissions Update for Notification System
-- This file adds the necessary permissions for the comprehensive notification and communication system

-- Add notification-related permissions
INSERT INTO permissions (permission_id, permission_name, display_name, description, resource, action, is_system_permission) VALUES
-- Notification Management
('PERM_NOTIFICATION_CREATE', 'notification.create', 'Create Notifications', 'Create and send notifications', 'notifications', 'create', TRUE),
('PERM_NOTIFICATION_READ', 'notification.read', 'View Notifications', 'View and read notifications', 'notifications', 'read', TRUE),
('PERM_NOTIFICATION_MANAGE', 'notification.manage', 'Manage Notifications', 'Manage notification settings and preferences', 'notifications', 'manage', TRUE),
('PERM_NOTIFICATION_ADMIN', 'notification.admin', 'Notification Administration', 'Full notification system administration', 'notifications', 'admin', TRUE),

-- Alert Management
('PERM_ALERT_CREATE', 'alert.create', 'Create Alerts', 'Create and trigger alerts', 'alerts', 'create', TRUE),
('PERM_ALERT_READ', 'alert.read', 'View Alerts', 'View and read alerts', 'alerts', 'read', TRUE),
('PERM_ALERT_ACKNOWLEDGE', 'alert.acknowledge', 'Acknowledge Alerts', 'Acknowledge alerts', 'alerts', 'acknowledge', TRUE),
('PERM_ALERT_RESOLVE', 'alert.resolve', 'Resolve Alerts', 'Resolve and close alerts', 'alerts', 'resolve', TRUE),
('PERM_ALERT_ESCALATE', 'alert.escalate', 'Escalate Alerts', 'Escalate alerts to higher levels', 'alerts', 'escalate', TRUE),
('PERM_ALERT_COMMENT', 'alert.comment', 'Comment on Alerts', 'Add comments to alerts', 'alerts', 'comment', TRUE),
('PERM_ALERT_MANAGE', 'alert.manage', 'Manage Alerts', 'Full alert management capabilities', 'alerts', 'manage', TRUE),

-- Communication Management
('PERM_COMMUNICATION_CREATE', 'communication.create', 'Create Communications', 'Create communication channels and messages', 'communication', 'create', TRUE),
('PERM_COMMUNICATION_READ', 'communication.read', 'View Communications', 'View communication channels and messages', 'communication', 'read', TRUE),
('PERM_COMMUNICATION_MANAGE', 'communication.manage', 'Manage Communications', 'Manage communication channels and settings', 'communication', 'manage', TRUE),

-- Escalation Management (Enhanced)
('PERM_ESCALATION_CREATE', 'escalation.create', 'Create Escalations', 'Create manual escalations', 'escalations', 'create', TRUE),
('PERM_ESCALATION_READ', 'escalation.read', 'View Escalations', 'View escalation information', 'escalations', 'read', TRUE),
('PERM_ESCALATION_MANAGE', 'escalation.manage', 'Manage Escalations', 'Manage escalation policies and processes', 'escalations', 'manage', TRUE),
('PERM_ESCALATION_RESOLVE', 'escalation.resolve', 'Resolve Escalations', 'Resolve and close escalations', 'escalations', 'resolve', TRUE),

-- Real-time Notifications
('PERM_REALTIME_CONNECT', 'realtime.connect', 'Real-time Connection', 'Connect to real-time notification streams', 'realtime', 'connect', TRUE),
('PERM_REALTIME_BROADCAST', 'realtime.broadcast', 'Broadcast Messages', 'Broadcast real-time messages and announcements', 'realtime', 'broadcast', TRUE),

-- System Monitoring and Health
('PERM_SYSTEM_HEALTH', 'system.health', 'System Health', 'View system health and status information', 'system', 'health', TRUE),
('PERM_SYSTEM_MONITOR', 'system.monitor', 'System Monitoring', 'Monitor system performance and metrics', 'system', 'monitor', TRUE)

ON CONFLICT (permission_id) DO NOTHING;

-- Update role permissions for notification system

-- Super Admin gets all notification permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
('ROLE_SUPER_ADMIN', 'PERM_NOTIFICATION_CREATE'),
('ROLE_SUPER_ADMIN', 'PERM_NOTIFICATION_READ'),
('ROLE_SUPER_ADMIN', 'PERM_NOTIFICATION_MANAGE'),
('ROLE_SUPER_ADMIN', 'PERM_NOTIFICATION_ADMIN'),
('ROLE_SUPER_ADMIN', 'PERM_ALERT_CREATE'),
('ROLE_SUPER_ADMIN', 'PERM_ALERT_READ'),
('ROLE_SUPER_ADMIN', 'PERM_ALERT_ACKNOWLEDGE'),
('ROLE_SUPER_ADMIN', 'PERM_ALERT_RESOLVE'),
('ROLE_SUPER_ADMIN', 'PERM_ALERT_ESCALATE'),
('ROLE_SUPER_ADMIN', 'PERM_ALERT_COMMENT'),
('ROLE_SUPER_ADMIN', 'PERM_ALERT_MANAGE'),
('ROLE_SUPER_ADMIN', 'PERM_COMMUNICATION_CREATE'),
('ROLE_SUPER_ADMIN', 'PERM_COMMUNICATION_READ'),
('ROLE_SUPER_ADMIN', 'PERM_COMMUNICATION_MANAGE'),
('ROLE_SUPER_ADMIN', 'PERM_ESCALATION_CREATE'),
('ROLE_SUPER_ADMIN', 'PERM_ESCALATION_READ'),
('ROLE_SUPER_ADMIN', 'PERM_ESCALATION_MANAGE'),
('ROLE_SUPER_ADMIN', 'PERM_ESCALATION_RESOLVE'),
('ROLE_SUPER_ADMIN', 'PERM_REALTIME_CONNECT'),
('ROLE_SUPER_ADMIN', 'PERM_REALTIME_BROADCAST'),
('ROLE_SUPER_ADMIN', 'PERM_SYSTEM_HEALTH'),
('ROLE_SUPER_ADMIN', 'PERM_SYSTEM_MONITOR'),

-- Admin gets most notification permissions
('ROLE_ADMIN', 'PERM_NOTIFICATION_CREATE'),
('ROLE_ADMIN', 'PERM_NOTIFICATION_READ'),
('ROLE_ADMIN', 'PERM_NOTIFICATION_MANAGE'),
('ROLE_ADMIN', 'PERM_ALERT_CREATE'),
('ROLE_ADMIN', 'PERM_ALERT_READ'),
('ROLE_ADMIN', 'PERM_ALERT_ACKNOWLEDGE'),
('ROLE_ADMIN', 'PERM_ALERT_RESOLVE'),
('ROLE_ADMIN', 'PERM_ALERT_ESCALATE'),
('ROLE_ADMIN', 'PERM_ALERT_COMMENT'),
('ROLE_ADMIN', 'PERM_ALERT_MANAGE'),
('ROLE_ADMIN', 'PERM_COMMUNICATION_CREATE'),
('ROLE_ADMIN', 'PERM_COMMUNICATION_READ'),
('ROLE_ADMIN', 'PERM_COMMUNICATION_MANAGE'),
('ROLE_ADMIN', 'PERM_ESCALATION_CREATE'),
('ROLE_ADMIN', 'PERM_ESCALATION_READ'),
('ROLE_ADMIN', 'PERM_ESCALATION_MANAGE'),
('ROLE_ADMIN', 'PERM_ESCALATION_RESOLVE'),
('ROLE_ADMIN', 'PERM_REALTIME_CONNECT'),
('ROLE_ADMIN', 'PERM_REALTIME_BROADCAST'),
('ROLE_ADMIN', 'PERM_SYSTEM_HEALTH'),
('ROLE_ADMIN', 'PERM_SYSTEM_MONITOR'),

-- IT Manager gets comprehensive notification and alert permissions
('ROLE_IT_MANAGER', 'PERM_NOTIFICATION_CREATE'),
('ROLE_IT_MANAGER', 'PERM_NOTIFICATION_READ'),
('ROLE_IT_MANAGER', 'PERM_NOTIFICATION_MANAGE'),
('ROLE_IT_MANAGER', 'PERM_ALERT_CREATE'),
('ROLE_IT_MANAGER', 'PERM_ALERT_READ'),
('ROLE_IT_MANAGER', 'PERM_ALERT_ACKNOWLEDGE'),
('ROLE_IT_MANAGER', 'PERM_ALERT_RESOLVE'),
('ROLE_IT_MANAGER', 'PERM_ALERT_ESCALATE'),
('ROLE_IT_MANAGER', 'PERM_ALERT_COMMENT'),
('ROLE_IT_MANAGER', 'PERM_ALERT_MANAGE'),
('ROLE_IT_MANAGER', 'PERM_COMMUNICATION_CREATE'),
('ROLE_IT_MANAGER', 'PERM_COMMUNICATION_READ'),
('ROLE_IT_MANAGER', 'PERM_COMMUNICATION_MANAGE'),
('ROLE_IT_MANAGER', 'PERM_ESCALATION_CREATE'),
('ROLE_IT_MANAGER', 'PERM_ESCALATION_READ'),
('ROLE_IT_MANAGER', 'PERM_ESCALATION_MANAGE'),
('ROLE_IT_MANAGER', 'PERM_ESCALATION_RESOLVE'),
('ROLE_IT_MANAGER', 'PERM_REALTIME_CONNECT'),
('ROLE_IT_MANAGER', 'PERM_REALTIME_BROADCAST'),
('ROLE_IT_MANAGER', 'PERM_SYSTEM_HEALTH'),
('ROLE_IT_MANAGER', 'PERM_SYSTEM_MONITOR'),

-- Security Analyst gets security-focused permissions
('ROLE_SECURITY_ANALYST', 'PERM_NOTIFICATION_READ'),
('ROLE_SECURITY_ANALYST', 'PERM_ALERT_CREATE'),
('ROLE_SECURITY_ANALYST', 'PERM_ALERT_READ'),
('ROLE_SECURITY_ANALYST', 'PERM_ALERT_ACKNOWLEDGE'),
('ROLE_SECURITY_ANALYST', 'PERM_ALERT_RESOLVE'),
('ROLE_SECURITY_ANALYST', 'PERM_ALERT_ESCALATE'),
('ROLE_SECURITY_ANALYST', 'PERM_ALERT_COMMENT'),
('ROLE_SECURITY_ANALYST', 'PERM_COMMUNICATION_CREATE'),
('ROLE_SECURITY_ANALYST', 'PERM_COMMUNICATION_READ'),
('ROLE_SECURITY_ANALYST', 'PERM_ESCALATION_CREATE'),
('ROLE_SECURITY_ANALYST', 'PERM_ESCALATION_READ'),
('ROLE_SECURITY_ANALYST', 'PERM_ESCALATION_RESOLVE'),
('ROLE_SECURITY_ANALYST', 'PERM_REALTIME_CONNECT'),
('ROLE_SECURITY_ANALYST', 'PERM_SYSTEM_HEALTH'),

-- Governance Manager gets governance-related notification permissions
('ROLE_GOVERNANCE_MANAGER', 'PERM_NOTIFICATION_CREATE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_NOTIFICATION_READ'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_NOTIFICATION_MANAGE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_ALERT_READ'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_ALERT_ACKNOWLEDGE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_ALERT_COMMENT'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_COMMUNICATION_CREATE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_COMMUNICATION_READ'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_COMMUNICATION_MANAGE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_ESCALATION_CREATE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_ESCALATION_READ'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_ESCALATION_MANAGE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_ESCALATION_RESOLVE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_REALTIME_CONNECT'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_SYSTEM_HEALTH'),

-- Compliance Officer gets compliance-focused permissions
('ROLE_COMPLIANCE_OFFICER', 'PERM_NOTIFICATION_READ'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_ALERT_READ'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_ALERT_ACKNOWLEDGE'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_ALERT_COMMENT'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_COMMUNICATION_CREATE'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_COMMUNICATION_READ'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_ESCALATION_CREATE'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_ESCALATION_READ'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_REALTIME_CONNECT'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_SYSTEM_HEALTH'),

-- Auditor gets read-only access for audit purposes
('ROLE_AUDITOR', 'PERM_NOTIFICATION_READ'),
('ROLE_AUDITOR', 'PERM_ALERT_READ'),
('ROLE_AUDITOR', 'PERM_COMMUNICATION_READ'),
('ROLE_AUDITOR', 'PERM_ESCALATION_READ'),
('ROLE_AUDITOR', 'PERM_REALTIME_CONNECT'),
('ROLE_AUDITOR', 'PERM_SYSTEM_HEALTH'),

-- Employee gets basic notification and communication permissions
('ROLE_EMPLOYEE', 'PERM_NOTIFICATION_READ'),
('ROLE_EMPLOYEE', 'PERM_COMMUNICATION_CREATE'),
('ROLE_EMPLOYEE', 'PERM_COMMUNICATION_READ'),
('ROLE_EMPLOYEE', 'PERM_ESCALATION_CREATE'),
('ROLE_EMPLOYEE', 'PERM_ESCALATION_READ'),
('ROLE_EMPLOYEE', 'PERM_REALTIME_CONNECT'),

-- Guest gets minimal read access
('ROLE_GUEST', 'PERM_NOTIFICATION_READ'),
('ROLE_GUEST', 'PERM_COMMUNICATION_READ'),
('ROLE_GUEST', 'PERM_REALTIME_CONNECT')

ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Add new system roles for notification management
INSERT INTO roles (role_id, role_name, display_name, description, role_type, is_system_role, role_hierarchy_level) VALUES
('ROLE_SYSTEM_ADMINISTRATOR', 'system_administrator', 'System Administrator', 'Technical system administration and infrastructure management', 'System', TRUE, 85),
('ROLE_IT_SUPPORT', 'it_support', 'IT Support', 'First-level IT support and basic system operations', 'Functional', TRUE, 40),
('ROLE_NOTIFICATION_ADMIN', 'notification_admin', 'Notification Administrator', 'Manages notification system and communication channels', 'Functional', TRUE, 65)
ON CONFLICT (role_id) DO NOTHING;

-- Assign permissions to new roles
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- System Administrator gets full technical permissions
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_NOTIFICATION_CREATE'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_NOTIFICATION_READ'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_NOTIFICATION_MANAGE'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_NOTIFICATION_ADMIN'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_ALERT_CREATE'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_ALERT_READ'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_ALERT_ACKNOWLEDGE'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_ALERT_RESOLVE'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_ALERT_ESCALATE'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_ALERT_COMMENT'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_ALERT_MANAGE'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_COMMUNICATION_CREATE'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_COMMUNICATION_READ'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_COMMUNICATION_MANAGE'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_ESCALATION_CREATE'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_ESCALATION_READ'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_ESCALATION_MANAGE'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_ESCALATION_RESOLVE'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_REALTIME_CONNECT'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_REALTIME_BROADCAST'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_SYSTEM_HEALTH'),
('ROLE_SYSTEM_ADMINISTRATOR', 'PERM_SYSTEM_MONITOR'),

-- IT Support gets operational permissions
('ROLE_IT_SUPPORT', 'PERM_NOTIFICATION_READ'),
('ROLE_IT_SUPPORT', 'PERM_ALERT_READ'),
('ROLE_IT_SUPPORT', 'PERM_ALERT_ACKNOWLEDGE'),
('ROLE_IT_SUPPORT', 'PERM_ALERT_COMMENT'),
('ROLE_IT_SUPPORT', 'PERM_COMMUNICATION_CREATE'),
('ROLE_IT_SUPPORT', 'PERM_COMMUNICATION_READ'),
('ROLE_IT_SUPPORT', 'PERM_ESCALATION_CREATE'),
('ROLE_IT_SUPPORT', 'PERM_ESCALATION_READ'),
('ROLE_IT_SUPPORT', 'PERM_REALTIME_CONNECT'),
('ROLE_IT_SUPPORT', 'PERM_SYSTEM_HEALTH'),

-- Notification Admin gets notification-specific permissions
('ROLE_NOTIFICATION_ADMIN', 'PERM_NOTIFICATION_CREATE'),
('ROLE_NOTIFICATION_ADMIN', 'PERM_NOTIFICATION_READ'),
('ROLE_NOTIFICATION_ADMIN', 'PERM_NOTIFICATION_MANAGE'),
('ROLE_NOTIFICATION_ADMIN', 'PERM_NOTIFICATION_ADMIN'),
('ROLE_NOTIFICATION_ADMIN', 'PERM_COMMUNICATION_CREATE'),
('ROLE_NOTIFICATION_ADMIN', 'PERM_COMMUNICATION_READ'),
('ROLE_NOTIFICATION_ADMIN', 'PERM_COMMUNICATION_MANAGE'),
('ROLE_NOTIFICATION_ADMIN', 'PERM_REALTIME_CONNECT'),
('ROLE_NOTIFICATION_ADMIN', 'PERM_REALTIME_BROADCAST')

ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Update existing escalation permissions for current roles
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- Add escalation permissions to existing roles that should have them
('ROLE_IT_MANAGER', 'PERM_ESCALATION_CREATE'),
('ROLE_IT_MANAGER', 'PERM_ESCALATION_READ'),
('ROLE_IT_MANAGER', 'PERM_ESCALATION_MANAGE'),
('ROLE_IT_MANAGER', 'PERM_ESCALATION_RESOLVE'),

('ROLE_GOVERNANCE_MANAGER', 'PERM_ESCALATION_CREATE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_ESCALATION_READ'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_ESCALATION_MANAGE'),
('ROLE_GOVERNANCE_MANAGER', 'PERM_ESCALATION_RESOLVE'),

('ROLE_COMPLIANCE_OFFICER', 'PERM_ESCALATION_CREATE'),
('ROLE_COMPLIANCE_OFFICER', 'PERM_ESCALATION_READ'),

('ROLE_SECURITY_ANALYST', 'PERM_ESCALATION_CREATE'),
('ROLE_SECURITY_ANALYST', 'PERM_ESCALATION_READ'),
('ROLE_SECURITY_ANALYST', 'PERM_ESCALATION_RESOLVE')

ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_roles_role_name ON roles(role_name);
CREATE INDEX IF NOT EXISTS idx_permissions_permission_name ON permissions(permission_name);