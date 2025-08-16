-- Notification System Database Schema Extension
-- This file extends the existing db-schema.sql with comprehensive notification features

-- Notification types and categories
CREATE TABLE IF NOT EXISTS notification_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('system', 'security', 'compliance', 'workflow', 'escalation', 'communication')),
    description TEXT,
    default_priority VARCHAR(20) DEFAULT 'Medium' CHECK (default_priority IN ('Critical', 'High', 'Medium', 'Low')),
    icon VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification templates for consistent messaging
CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) UNIQUE NOT NULL,
    notification_type_id INTEGER NOT NULL,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    variables JSONB, -- Available template variables
    delivery_channels JSONB DEFAULT '["in_app"]', -- in_app, email, sms, webhook
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_type_id) REFERENCES notification_types(id)
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    notification_type_id INTEGER NOT NULL,
    delivery_channels JSONB DEFAULT '["in_app"]',
    is_enabled BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_type_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_type_id) REFERENCES notification_types(id)
);

-- Main notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    notification_id VARCHAR(50) UNIQUE NOT NULL,
    notification_type_id INTEGER NOT NULL,
    recipient_user_id INTEGER,
    recipient_role VARCHAR(50),
    sender_user_id INTEGER,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    category VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived', 'deleted')),
    delivery_channels JSONB DEFAULT '["in_app"]',
    metadata JSONB, -- Additional context data
    related_entity_type VARCHAR(50), -- feedback, escalation, document, etc.
    related_entity_id VARCHAR(50),
    scheduled_for TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_type_id) REFERENCES notification_types(id),
    FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Notification delivery tracking
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id SERIAL PRIMARY KEY,
    notification_id VARCHAR(50) NOT NULL,
    delivery_channel VARCHAR(20) NOT NULL,
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    delivery_attempt INTEGER DEFAULT 1,
    delivery_details JSONB,
    delivered_at TIMESTAMP,
    failed_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(notification_id) ON DELETE CASCADE
);

-- Alert system tables
CREATE TABLE IF NOT EXISTS alert_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL, -- threshold, pattern, anomaly, schedule
    conditions JSONB NOT NULL, -- Rule conditions and parameters
    severity VARCHAR(20) DEFAULT 'Medium' CHECK (severity IN ('Critical', 'High', 'Medium', 'Low', 'Info')),
    notification_template_id INTEGER,
    escalation_policy_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    cooldown_period INTEGER DEFAULT 300, -- seconds
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_template_id) REFERENCES notification_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Active alerts
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(50) UNIQUE NOT NULL,
    alert_rule_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'suppressed')),
    source_system VARCHAR(50),
    source_data JSONB,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by INTEGER,
    resolved_at TIMESTAMP,
    resolved_by INTEGER,
    resolution_notes TEXT,
    escalated_at TIMESTAMP,
    escalation_level INTEGER DEFAULT 0,
    metadata JSONB,
    FOREIGN KEY (alert_rule_id) REFERENCES alert_rules(id),
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Alert acknowledgments and actions
CREATE TABLE IF NOT EXISTS alert_actions (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- acknowledge, resolve, escalate, suppress, comment
    action_by INTEGER NOT NULL,
    action_details JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alert_id) REFERENCES alerts(alert_id) ON DELETE CASCADE,
    FOREIGN KEY (action_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Communication channels and threads
CREATE TABLE IF NOT EXISTS communication_channels (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(50) UNIQUE NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    channel_type VARCHAR(30) NOT NULL CHECK (channel_type IN ('direct', 'group', 'broadcast', 'incident', 'project')),
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Channel memberships
CREATE TABLE IF NOT EXISTS channel_memberships (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'readonly')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    muted BOOLEAN DEFAULT FALSE,
    UNIQUE(channel_id, user_id),
    FOREIGN KEY (channel_id) REFERENCES communication_channels(channel_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages within channels
CREATE TABLE IF NOT EXISTS channel_messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(50) UNIQUE NOT NULL,
    channel_id VARCHAR(50) NOT NULL,
    sender_id INTEGER NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system', 'alert')),
    content TEXT NOT NULL,
    attachments JSONB,
    reply_to_message_id VARCHAR(50),
    edited_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES communication_channels(channel_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_message_id) REFERENCES channel_messages(message_id) ON DELETE SET NULL
);

-- Message reactions and interactions
CREATE TABLE IF NOT EXISTS message_reactions (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL,
    reaction_type VARCHAR(20) NOT NULL, -- like, dislike, thumbs_up, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, reaction_type),
    FOREIGN KEY (message_id) REFERENCES channel_messages(message_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enhanced escalation policies
CREATE TABLE IF NOT EXISTS escalation_policies (
    id SERIAL PRIMARY KEY,
    policy_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    policy_type VARCHAR(30) NOT NULL CHECK (policy_type IN ('time_based', 'severity_based', 'manual', 'automatic')),
    escalation_rules JSONB NOT NULL, -- Escalation rules and conditions
    notification_template_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_template_id) REFERENCES notification_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Escalation policy steps
CREATE TABLE IF NOT EXISTS escalation_policy_steps (
    id SERIAL PRIMARY KEY,
    escalation_policy_id INTEGER NOT NULL,
    step_order INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    delay_minutes INTEGER DEFAULT 0,
    escalation_targets JSONB NOT NULL, -- Users, roles, or external systems
    notification_template_id INTEGER,
    conditions JSONB, -- Optional conditions for this step
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (escalation_policy_id) REFERENCES escalation_policies(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_template_id) REFERENCES notification_templates(id)
);

-- Real-time notification subscriptions (for WebSocket connections)
CREATE TABLE IF NOT EXISTS notification_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subscription_id VARCHAR(100) UNIQUE NOT NULL,
    connection_type VARCHAR(20) DEFAULT 'websocket' CHECK (connection_type IN ('websocket', 'sse', 'webhook')),
    endpoint_url VARCHAR(500),
    subscription_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered_at ON alerts(triggered_at);
CREATE INDEX IF NOT EXISTS idx_alerts_alert_rule_id ON alerts(alert_rule_id);

CREATE INDEX IF NOT EXISTS idx_channel_messages_channel_id ON channel_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_created_at ON channel_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_channel_messages_sender_id ON channel_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id ON notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON notification_deliveries(delivery_status);

-- Insert default notification types
INSERT INTO notification_types (type_name, category, description, default_priority, icon, color) VALUES
('system_maintenance', 'system', 'System maintenance notifications', 'Medium', 'cog', 'blue'),
('security_alert', 'security', 'Security-related alerts', 'High', 'shield-exclamation', 'red'),
('compliance_violation', 'compliance', 'Compliance violation alerts', 'High', 'exclamation-triangle', 'orange'),
('workflow_approval', 'workflow', 'Workflow approval requests', 'Medium', 'clipboard-check', 'green'),
('escalation_created', 'escalation', 'New escalation created', 'High', 'arrow-trending-up', 'red'),
('feedback_received', 'communication', 'New feedback received', 'Medium', 'chat-bubble-left', 'blue'),
('document_shared', 'communication', 'Document shared with you', 'Low', 'document', 'gray'),
('policy_updated', 'system', 'Policy or procedure updated', 'Medium', 'document-text', 'blue'),
('sla_breach', 'escalation', 'SLA breach detected', 'Critical', 'clock', 'red'),
('user_mention', 'communication', 'You were mentioned', 'Medium', 'at-symbol', 'blue')
ON CONFLICT (type_name) DO NOTHING;

-- Insert default notification templates
INSERT INTO notification_templates (template_name, notification_type_id, subject_template, body_template, variables, delivery_channels) VALUES
('system_maintenance_template', 
 (SELECT id FROM notification_types WHERE type_name = 'system_maintenance'),
 'System Maintenance: {{title}}',
 'System maintenance is scheduled for {{start_time}} to {{end_time}}. {{description}}',
 '["title", "start_time", "end_time", "description"]',
 '["in_app", "email"]'),

('security_alert_template',
 (SELECT id FROM notification_types WHERE type_name = 'security_alert'),
 'Security Alert: {{alert_type}}',
 'A security alert has been triggered: {{description}}. Severity: {{severity}}. Please review immediately.',
 '["alert_type", "description", "severity"]',
 '["in_app", "email"]'),

('workflow_approval_template',
 (SELECT id FROM notification_types WHERE type_name = 'workflow_approval'),
 'Approval Required: {{workflow_name}}',
 'A workflow requires your approval: {{workflow_name}}. Submitted by: {{submitter}}. Please review and take action.',
 '["workflow_name", "submitter", "description"]',
 '["in_app", "email"]'),

('escalation_created_template',
 (SELECT id FROM notification_types WHERE type_name = 'escalation_created'),
 'Escalation Created: {{escalation_id}}',
 'A new escalation has been created: {{escalation_id}}. Priority: {{priority}}. Reason: {{reason}}',
 '["escalation_id", "priority", "reason", "description"]',
 '["in_app", "email"]'),

('sla_breach_template',
 (SELECT id FROM notification_types WHERE type_name = 'sla_breach'),
 'SLA Breach Alert: {{item_type}} {{item_id}}',
 'SLA breach detected for {{item_type}} {{item_id}}. Expected response time: {{sla_time}}. Current time: {{current_time}}.',
 '["item_type", "item_id", "sla_time", "current_time"]',
 '["in_app", "email"]')
ON CONFLICT (template_name) DO NOTHING;

-- Insert default escalation policies
INSERT INTO escalation_policies (policy_name, description, policy_type, escalation_rules) VALUES
('critical_incident_policy', 'Escalation policy for critical incidents', 'time_based', 
 '{"initial_delay": 0, "escalation_intervals": [15, 30, 60], "max_escalations": 3}'),
('feedback_escalation_policy', 'Standard feedback escalation policy', 'time_based',
 '{"initial_delay": 60, "escalation_intervals": [240, 480, 1440], "max_escalations": 3}'),
('compliance_violation_policy', 'Escalation policy for compliance violations', 'severity_based',
 '{"critical_delay": 5, "high_delay": 30, "medium_delay": 120, "low_delay": 480}')
ON CONFLICT (policy_name) DO NOTHING;