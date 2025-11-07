-- Multi-Tenant Management Database Schema
-- Multi-Cloud Multi-Tenant ICT Governance Framework
-- 
-- This schema supports comprehensive tenant lifecycle management including:
-- - Tenant registration and configuration
-- - Resource allocation and tracking
-- - Cost management and billing
-- - Compliance requirements tracking
-- - Audit logging

-- ============================================================================
-- Tenants Table
-- Core tenant information and configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id VARCHAR(255) PRIMARY KEY,
    tenant_name VARCHAR(255) NOT NULL,
    tenant_classification VARCHAR(50) NOT NULL CHECK (tenant_classification IN ('enterprise', 'government', 'healthcare', 'financial', 'standard')),
    isolation_model VARCHAR(50) NOT NULL CHECK (isolation_model IN ('silo', 'pool', 'hybrid')),
    service_tier VARCHAR(50) NOT NULL CHECK (service_tier IN ('premium', 'standard', 'basic')),
    tenant_state VARCHAR(50) NOT NULL CHECK (tenant_state IN ('pending', 'provisioning', 'active', 'suspended', 'deprovisioning', 'archived')),
    primary_cloud_provider VARCHAR(50) NOT NULL CHECK (primary_cloud_provider IN ('azure', 'aws', 'gcp', 'hybrid')),
    secondary_cloud_provider VARCHAR(50) CHECK (secondary_cloud_provider IN ('azure', 'aws', 'gcp', 'hybrid')),
    tenant_admin_email VARCHAR(255) NOT NULL,
    tenant_cost_center VARCHAR(100) NOT NULL,
    data_residency VARCHAR(100),
    enable_advanced_monitoring BOOLEAN DEFAULT true,
    enable_backup_dr BOOLEAN DEFAULT true,
    custom_configuration JSONB DEFAULT '{}',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_date TIMESTAMP,
    suspended_date TIMESTAMP,
    archived_date TIMESTAMP
    -- Note: Email validation is handled at application layer for better flexibility with international addresses
);

-- Create index on tenant state for faster queries
CREATE INDEX IF NOT EXISTS idx_tenants_state ON tenants(tenant_state);
CREATE INDEX IF NOT EXISTS idx_tenants_classification ON tenants(tenant_classification);
CREATE INDEX IF NOT EXISTS idx_tenants_cloud_provider ON tenants(primary_cloud_provider);
CREATE INDEX IF NOT EXISTS idx_tenants_created_date ON tenants(created_date DESC);

-- ============================================================================
-- Tenant Compliance Requirements Table
-- Track compliance requirements per tenant
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_compliance_requirements (
    requirement_id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    compliance_requirement VARCHAR(100) NOT NULL,
    compliance_status VARCHAR(50) NOT NULL CHECK (compliance_status IN ('pending', 'compliant', 'non-compliant', 'in-review')),
    last_check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_check_date TIMESTAMP,
    compliance_notes TEXT,
    evidence_documents JSONB DEFAULT '[]',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_compliance UNIQUE (tenant_id, compliance_requirement)
);

CREATE INDEX IF NOT EXISTS idx_compliance_tenant ON tenant_compliance_requirements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON tenant_compliance_requirements(compliance_status);

-- ============================================================================
-- Tenant Resources Table
-- Track all cloud resources allocated to tenants
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_resources (
    resource_id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    cloud_provider VARCHAR(50) NOT NULL,
    region VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('provisioning', 'active', 'suspended', 'deleting', 'deleted', 'error')),
    resource_config JSONB DEFAULT '{}',
    resource_tags JSONB DEFAULT '{}',
    monthly_cost DECIMAL(10, 2) DEFAULT 0.00,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_date TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resources_tenant ON tenant_resources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON tenant_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_provider ON tenant_resources(cloud_provider);
CREATE INDEX IF NOT EXISTS idx_resources_status ON tenant_resources(status);

-- ============================================================================
-- Tenant Costs Table
-- Track monthly costs and budget information per tenant
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_costs (
    cost_id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    month DATE NOT NULL,
    monthly_cost DECIMAL(10, 2) DEFAULT 0.00,
    cost_breakdown JSONB DEFAULT '{}',
    budget_limit DECIMAL(10, 2),
    budget_alerts JSONB DEFAULT '[]',
    cost_optimization_recommendations JSONB DEFAULT '[]',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_month UNIQUE (tenant_id, month)
);

CREATE INDEX IF NOT EXISTS idx_costs_tenant ON tenant_costs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_costs_month ON tenant_costs(month DESC);

-- ============================================================================
-- Tenant Audit Log Table
-- Comprehensive audit trail of all tenant-related activities
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_audit_log (
    log_id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON tenant_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON tenant_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON tenant_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_performed_by ON tenant_audit_log(performed_by);

-- ============================================================================
-- Tenant SLA Table
-- Service Level Agreements per tenant
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_sla (
    sla_id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    sla_type VARCHAR(100) NOT NULL,
    target_value DECIMAL(5, 2) NOT NULL,
    current_value DECIMAL(5, 2),
    measurement_period VARCHAR(50) NOT NULL,
    last_measured TIMESTAMP,
    status VARCHAR(50) CHECK (status IN ('met', 'at-risk', 'breached', 'not-measured')),
    breach_count INTEGER DEFAULT 0,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_sla_type UNIQUE (tenant_id, sla_type)
);

CREATE INDEX IF NOT EXISTS idx_sla_tenant ON tenant_sla(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sla_status ON tenant_sla(status);

-- ============================================================================
-- Tenant Security Controls Table
-- Security configurations and controls per tenant
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_security_controls (
    control_id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    control_name VARCHAR(255) NOT NULL,
    control_type VARCHAR(100) NOT NULL,
    control_status VARCHAR(50) CHECK (control_status IN ('enabled', 'disabled', 'configuring', 'error')),
    control_config JSONB DEFAULT '{}',
    last_check TIMESTAMP,
    findings JSONB DEFAULT '[]',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_control UNIQUE (tenant_id, control_name)
);

CREATE INDEX IF NOT EXISTS idx_security_tenant ON tenant_security_controls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_status ON tenant_security_controls(control_status);

-- ============================================================================
-- Tenant Notifications Table
-- Notification preferences and history per tenant
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_notifications (
    notification_id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    notification_channel VARCHAR(50) CHECK (notification_channel IN ('email', 'sms', 'webhook', 'dashboard')),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    message TEXT NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    sent_date TIMESTAMP,
    delivered_date TIMESTAMP,
    error_message TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON tenant_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON tenant_notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON tenant_notifications(created_date DESC);

-- ============================================================================
-- Tenant Metrics Table
-- Performance and operational metrics per tenant
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_metrics (
    metric_id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15, 4) NOT NULL,
    metric_unit VARCHAR(50),
    cloud_provider VARCHAR(50),
    resource_type VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_tenant ON tenant_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON tenant_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON tenant_metrics(timestamp DESC);

-- ============================================================================
-- Tenant Incidents Table
-- Track incidents and issues per tenant
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_incidents (
    incident_id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    incident_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    status VARCHAR(50) CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    affected_resources JSONB DEFAULT '[]',
    resolution TEXT,
    reported_by VARCHAR(255),
    assigned_to VARCHAR(255),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_date TIMESTAMP,
    closed_date TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_tenant ON tenant_incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON tenant_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON tenant_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON tenant_incidents(created_date DESC);

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tenants table
CREATE TRIGGER update_tenants_timestamp
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_timestamp();

-- Trigger for tenant_resources table
CREATE TRIGGER update_tenant_resources_timestamp
    BEFORE UPDATE ON tenant_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_timestamp();

-- Trigger for tenant_costs table
CREATE TRIGGER update_tenant_costs_timestamp
    BEFORE UPDATE ON tenant_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_timestamp();

-- Trigger for tenant_security_controls table
CREATE TRIGGER update_tenant_security_controls_timestamp
    BEFORE UPDATE ON tenant_security_controls
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_timestamp();

-- ============================================================================
-- Sample Data for Testing (Optional)
-- ============================================================================

-- Insert sample tenant for testing
-- UNCOMMENT BELOW TO INSERT SAMPLE DATA

/*
INSERT INTO tenants (
    tenant_id, tenant_name, tenant_classification, isolation_model,
    service_tier, tenant_state, primary_cloud_provider,
    tenant_admin_email, tenant_cost_center, data_residency
) VALUES (
    'tenant-sample-001',
    'Sample Enterprise Tenant',
    'enterprise',
    'silo',
    'premium',
    'active',
    'azure',
    'admin@example.com',
    'IT-12345',
    'US'
) ON CONFLICT (tenant_id) DO NOTHING;

-- Insert sample compliance requirements
INSERT INTO tenant_compliance_requirements (
    tenant_id, compliance_requirement, compliance_status
) VALUES 
    ('tenant-sample-001', 'ISO27001', 'compliant'),
    ('tenant-sample-001', 'GDPR', 'compliant'),
    ('tenant-sample-001', 'SOX', 'in-review')
ON CONFLICT (tenant_id, compliance_requirement) DO NOTHING;
*/

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View: Tenant Summary
CREATE OR REPLACE VIEW tenant_summary AS
SELECT 
    t.tenant_id,
    t.tenant_name,
    t.tenant_classification,
    t.service_tier,
    t.tenant_state,
    t.primary_cloud_provider,
    COUNT(DISTINCT tr.resource_id) as resource_count,
    COALESCE(SUM(tc.monthly_cost), 0) as current_month_cost,
    COUNT(DISTINCT tcr.requirement_id) as compliance_requirement_count,
    COUNT(DISTINCT CASE WHEN tcr.compliance_status = 'compliant' THEN tcr.requirement_id END) as compliant_count
FROM tenants t
LEFT JOIN tenant_resources tr ON t.tenant_id = tr.tenant_id AND tr.status != 'deleted'
LEFT JOIN tenant_costs tc ON t.tenant_id = tc.tenant_id AND tc.month = DATE_TRUNC('month', CURRENT_DATE)
LEFT JOIN tenant_compliance_requirements tcr ON t.tenant_id = tcr.tenant_id
GROUP BY t.tenant_id, t.tenant_name, t.tenant_classification, t.service_tier, 
         t.tenant_state, t.primary_cloud_provider;

-- View: Active Tenants
CREATE OR REPLACE VIEW active_tenants AS
SELECT * FROM tenants WHERE tenant_state = 'active';

-- View: Tenant Compliance Status
CREATE OR REPLACE VIEW tenant_compliance_summary AS
SELECT 
    t.tenant_id,
    t.tenant_name,
    COUNT(DISTINCT tcr.requirement_id) as total_requirements,
    COUNT(DISTINCT CASE WHEN tcr.compliance_status = 'compliant' THEN tcr.requirement_id END) as compliant,
    COUNT(DISTINCT CASE WHEN tcr.compliance_status = 'non-compliant' THEN tcr.requirement_id END) as non_compliant,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT tcr.requirement_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN tcr.compliance_status = 'compliant' THEN tcr.requirement_id END)::DECIMAL / 
                  COUNT(DISTINCT tcr.requirement_id) * 100)
            ELSE 0 
        END, 
    2) as compliance_percentage
FROM tenants t
LEFT JOIN tenant_compliance_requirements tcr ON t.tenant_id = tcr.tenant_id
WHERE t.tenant_state IN ('active', 'suspended')
GROUP BY t.tenant_id, t.tenant_name;

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ict_governance_app;
-- GRANT SELECT ON ALL VIEWS IN SCHEMA public TO ict_governance_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ict_governance_app;

COMMENT ON TABLE tenants IS 'Core tenant information and configuration for multi-tenant governance';
COMMENT ON TABLE tenant_compliance_requirements IS 'Compliance requirements tracking per tenant';
COMMENT ON TABLE tenant_resources IS 'Cloud resources allocated to each tenant';
COMMENT ON TABLE tenant_costs IS 'Monthly cost tracking and budgets per tenant';
COMMENT ON TABLE tenant_audit_log IS 'Comprehensive audit trail of tenant activities';
COMMENT ON TABLE tenant_sla IS 'Service Level Agreement tracking per tenant';
COMMENT ON TABLE tenant_security_controls IS 'Security controls configuration per tenant';
COMMENT ON TABLE tenant_notifications IS 'Notification management per tenant';
COMMENT ON TABLE tenant_metrics IS 'Performance and operational metrics per tenant';
COMMENT ON TABLE tenant_incidents IS 'Incident tracking and management per tenant';
