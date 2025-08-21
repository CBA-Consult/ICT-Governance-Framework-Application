-- SQL script for Data Collection and Processing capabilities
-- Extends the existing ICT Governance Framework database schema

-- Data sources table - tracks all data collection sources
CREATE TABLE IF NOT EXISTS data_sources (
    id SERIAL PRIMARY KEY,
    data_source_id VARCHAR(50) UNIQUE NOT NULL,
    source_name VARCHAR(200) NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('api', 'database', 'file', 'manual', 'automated')),
    data_category VARCHAR(50) NOT NULL CHECK (data_category IN ('governance', 'compliance', 'risk', 'performance', 'financial', 'operational')),
    description TEXT,
    connection_config JSONB,
    collection_frequency VARCHAR(50) CHECK (collection_frequency IN ('real-time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'annual')),
    last_collection_time TIMESTAMP,
    next_collection_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Metric data table - stores collected metric values
CREATE TABLE IF NOT EXISTS metric_data (
    id SERIAL PRIMARY KEY,
    collection_id VARCHAR(50) UNIQUE NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    metric_category VARCHAR(50) NOT NULL CHECK (metric_category IN ('kpi', 'operational', 'compliance', 'risk', 'financial', 'performance')),
    value DECIMAL(15,4) NOT NULL,
    unit VARCHAR(50),
    target_value DECIMAL(15,4),
    data_source_id VARCHAR(50) NOT NULL,
    collection_timestamp TIMESTAMP NOT NULL,
    metadata JSONB,
    collected_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (data_source_id) REFERENCES data_sources(data_source_id),
    FOREIGN KEY (collected_by) REFERENCES users(user_id)
);

-- Data processing jobs table - tracks data processing operations
CREATE TABLE IF NOT EXISTS data_processing_jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) UNIQUE NOT NULL,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('kpi_calculation', 'trend_analysis', 'compliance_analysis', 'insight_generation', 'aggregation')),
    job_status VARCHAR(50) DEFAULT 'pending' CHECK (job_status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    input_parameters JSONB NOT NULL,
    output_data JSONB,
    error_message TEXT,
    processing_start_time TIMESTAMP,
    processing_end_time TIMESTAMP,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Workflow instances table - tracks workflow executions
CREATE TABLE IF NOT EXISTS workflow_instances (
    id VARCHAR(50) PRIMARY KEY,
    workflow_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated reports table - stores generated reports
CREATE TABLE IF NOT EXISTS generated_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(50) UNIQUE NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    report_data JSONB NOT NULL,
    time_range_start TIMESTAMP NOT NULL,
    time_range_end TIMESTAMP NOT NULL,
    generated_by VARCHAR(50),
    generation_options JSONB,
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    file_path VARCHAR(500),
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(user_id)
);

-- KPI definitions table - defines KPI calculation rules
CREATE TABLE IF NOT EXISTS kpi_definitions (
    id SERIAL PRIMARY KEY,
    kpi_id VARCHAR(50) UNIQUE NOT NULL,
    kpi_name VARCHAR(200) NOT NULL,
    kpi_category VARCHAR(50) NOT NULL,
    description TEXT,
    calculation_method VARCHAR(50) NOT NULL CHECK (calculation_method IN ('sum', 'avg', 'max', 'min', 'count', 'ratio', 'percentage', 'custom')),
    source_metrics JSONB NOT NULL, -- Array of metric names used in calculation
    target_value DECIMAL(15,4),
    target_operator VARCHAR(10) CHECK (target_operator IN ('>', '>=', '<', '<=', '=', '!=')),
    unit VARCHAR(50),
    frequency VARCHAR(50) CHECK (frequency IN ('real-time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'annual')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Calculated KPI values table - stores calculated KPI results
CREATE TABLE IF NOT EXISTS calculated_kpis (
    id SERIAL PRIMARY KEY,
    calculation_id VARCHAR(50) UNIQUE NOT NULL,
    kpi_id VARCHAR(50) NOT NULL,
    calculated_value DECIMAL(15,4) NOT NULL,
    target_value DECIMAL(15,4),
    variance_percentage DECIMAL(8,4),
    status VARCHAR(50) CHECK (status IN ('on_target', 'above_target', 'below_target', 'critical')),
    calculation_timestamp TIMESTAMP NOT NULL,
    calculation_period_start TIMESTAMP,
    calculation_period_end TIMESTAMP,
    input_data_points INTEGER,
    metadata JSONB,
    calculated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kpi_id) REFERENCES kpi_definitions(kpi_id),
    FOREIGN KEY (calculated_by) REFERENCES users(user_id)
);

-- Data quality metrics table - tracks data quality indicators
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id SERIAL PRIMARY KEY,
    quality_check_id VARCHAR(50) UNIQUE NOT NULL,
    data_source_id VARCHAR(50) NOT NULL,
    check_type VARCHAR(50) NOT NULL CHECK (check_type IN ('completeness', 'accuracy', 'consistency', 'timeliness', 'validity')),
    quality_score DECIMAL(5,2) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
    issues_found INTEGER DEFAULT 0,
    total_records_checked INTEGER,
    check_timestamp TIMESTAMP NOT NULL,
    check_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (data_source_id) REFERENCES data_sources(data_source_id)
);

-- Automated insights table - stores AI-generated insights
CREATE TABLE IF NOT EXISTS automated_insights (
    id SERIAL PRIMARY KEY,
    insight_id VARCHAR(50) UNIQUE NOT NULL,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('trend', 'anomaly', 'prediction', 'recommendation', 'alert')),
    metric_name VARCHAR(200),
    insight_text TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'critical')),
    supporting_data JSONB,
    time_range_start TIMESTAMP,
    time_range_end TIMESTAMP,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(50),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (acknowledged_by) REFERENCES users(user_id)
);

-- Dashboard configurations table - stores dashboard layout and settings
CREATE TABLE IF NOT EXISTS dashboard_configurations (
    id SERIAL PRIMARY KEY,
    dashboard_id VARCHAR(50) UNIQUE NOT NULL,
    dashboard_name VARCHAR(200) NOT NULL,
    dashboard_type VARCHAR(50) NOT NULL CHECK (dashboard_type IN ('executive', 'operational', 'compliance', 'risk', 'custom')),
    layout_config JSONB NOT NULL,
    widget_configs JSONB NOT NULL,
    access_permissions JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Data collection schedules table - manages automated data collection
CREATE TABLE IF NOT EXISTS data_collection_schedules (
    id SERIAL PRIMARY KEY,
    schedule_id VARCHAR(50) UNIQUE NOT NULL,
    data_source_id VARCHAR(50) NOT NULL,
    schedule_name VARCHAR(200) NOT NULL,
    cron_expression VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_run_time TIMESTAMP,
    next_run_time TIMESTAMP,
    last_run_status VARCHAR(50) CHECK (last_run_status IN ('success', 'failed', 'skipped')),
    last_run_details JSONB,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (data_source_id) REFERENCES data_sources(data_source_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Workflow approvals table - tracks workflow approval processes
CREATE TABLE IF NOT EXISTS workflow_approvals (
    id SERIAL PRIMARY KEY,
    approval_id VARCHAR(50) UNIQUE NOT NULL,
    workflow_id VARCHAR(50) NOT NULL,
    approver_id VARCHAR(50) NOT NULL,
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'skipped')),
    due_date TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    workflow_instance_id VARCHAR(50),
    escalated_at TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id),
    FOREIGN KEY (approver_id) REFERENCES users(user_id)
);

-- Alter workflow_instances table to add workflow_type column
ALTER TABLE workflow_instances ADD COLUMN workflow_type VARCHAR(50);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_metric_data_metric_name ON metric_data(metric_name);
CREATE INDEX IF NOT EXISTS idx_metric_data_category ON metric_data(metric_category);
CREATE INDEX IF NOT EXISTS idx_metric_data_timestamp ON metric_data(collection_timestamp);
CREATE INDEX IF NOT EXISTS idx_metric_data_source_id ON metric_data(data_source_id);
CREATE INDEX IF NOT EXISTS idx_metric_data_collected_by ON metric_data(collected_by);

CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_data_sources_category ON data_sources(data_category);
CREATE INDEX IF NOT EXISTS idx_data_sources_active ON data_sources(is_active);

CREATE INDEX IF NOT EXISTS idx_calculated_kpis_kpi_id ON calculated_kpis(kpi_id);
CREATE INDEX IF NOT EXISTS idx_calculated_kpis_timestamp ON calculated_kpis(calculation_timestamp);
CREATE INDEX IF NOT EXISTS idx_calculated_kpis_status ON calculated_kpis(status);

CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON generated_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_by ON generated_reports(generated_by);

CREATE INDEX IF NOT EXISTS idx_data_processing_jobs_status ON data_processing_jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_data_processing_jobs_type ON data_processing_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_data_processing_jobs_created_at ON data_processing_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_automated_insights_type ON automated_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_automated_insights_severity ON automated_insights(severity);
CREATE INDEX IF NOT EXISTS idx_automated_insights_acknowledged ON automated_insights(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_automated_insights_created_at ON automated_insights(created_at);

CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_source_id ON data_quality_metrics(data_source_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_check_type ON data_quality_metrics(check_type);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_timestamp ON data_quality_metrics(check_timestamp);

CREATE INDEX IF NOT EXISTS idx_workflow_approvals_workflow_id ON workflow_approvals(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_approver_id ON workflow_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_status ON workflow_approvals(approval_status);

-- Insert default data sources
INSERT INTO data_sources (data_source_id, source_name, source_type, data_category, description, collection_frequency, is_active, created_by, updated_by)
VALUES 
    ('DS-MANUAL-001', 'Manual Data Entry', 'manual', 'governance', 'Manual data entry for governance metrics', 'monthly', true, 'SYSTEM', 'SYSTEM'),
    ('DS-API-001', 'Governance API', 'api', 'governance', 'Automated governance metrics collection via API', 'daily', true, 'SYSTEM', 'SYSTEM'),
    ('DS-COMPLIANCE-001', 'Compliance Scanner', 'automated', 'compliance', 'Automated compliance scanning and reporting', 'daily', true, 'SYSTEM', 'SYSTEM'),
    ('DS-RISK-001', 'Risk Assessment System', 'database', 'risk', 'Risk metrics from risk management database', 'weekly', true, 'SYSTEM', 'SYSTEM'),
    ('DS-PERFORMANCE-001', 'Performance Monitor', 'automated', 'performance', 'System performance and operational metrics', 'hourly', true, 'SYSTEM', 'SYSTEM'),
    ('DS-FINANCIAL-001', 'Financial System', 'api', 'financial', 'Financial and cost metrics integration', 'monthly', true, 'SYSTEM', 'SYSTEM')
ON CONFLICT (data_source_id) DO NOTHING;

-- Insert default KPI definitions
INSERT INTO kpi_definitions (kpi_id, kpi_name, kpi_category, description, calculation_method, source_metrics, target_value, target_operator, unit, frequency, is_active, created_by, updated_by)
VALUES 
    ('KPI-GOV-001', 'Governance Maturity Level', 'governance', 'Overall governance maturity assessment', 'avg', '["governance_maturity_assessment"]', 4.0, '>=', 'level', 'quarterly', true, 'SYSTEM', 'SYSTEM'),
    ('KPI-COMP-001', 'Policy Compliance Rate', 'compliance', 'Percentage of assets compliant with policies', 'avg', '["policy_compliance_percentage"]', 95.0, '>=', 'percentage', 'monthly', true, 'SYSTEM', 'SYSTEM'),
    ('KPI-RISK-001', 'Risk Remediation Rate', 'risk', 'Percentage of risks remediated within SLA', 'avg', '["risk_remediation_percentage"]', 90.0, '>=', 'percentage', 'monthly', true, 'SYSTEM', 'SYSTEM'),
    ('KPI-PERF-001', 'Process Automation Rate', 'performance', 'Percentage of processes with automation', 'avg', '["process_automation_percentage"]', 70.0, '>=', 'percentage', 'quarterly', true, 'SYSTEM', 'SYSTEM'),
    ('KPI-STAKE-001', 'Stakeholder Satisfaction', 'governance', 'Overall stakeholder satisfaction score', 'avg', '["stakeholder_satisfaction_score"]', 85.0, '>=', 'percentage', 'quarterly', true, 'SYSTEM', 'SYSTEM')
ON CONFLICT (kpi_id) DO NOTHING;

-- Insert default dashboard configurations
INSERT INTO dashboard_configurations (dashboard_id, dashboard_name, dashboard_type, layout_config, widget_configs, is_default, is_active, created_by, updated_by)
VALUES 
    ('DASH-EXEC-001', 'Executive Dashboard', 'executive', 
     '{"layout": "grid", "columns": 4, "rows": 3}',
     '{"widgets": [
        {"id": "governance_maturity", "type": "gauge", "position": {"x": 0, "y": 0, "w": 1, "h": 1}},
        {"id": "policy_compliance", "type": "percentage", "position": {"x": 1, "y": 0, "w": 1, "h": 1}},
        {"id": "risk_overview", "type": "chart", "position": {"x": 2, "y": 0, "w": 2, "h": 1}},
        {"id": "stakeholder_satisfaction", "type": "gauge", "position": {"x": 0, "y": 1, "w": 1, "h": 1}},
        {"id": "business_value", "type": "metric", "position": {"x": 1, "y": 1, "w": 1, "h": 1}},
        {"id": "trend_analysis", "type": "chart", "position": {"x": 2, "y": 1, "w": 2, "h": 2}}
     ]}',
     true, true, 'SYSTEM', 'SYSTEM'),
    ('DASH-OPS-001', 'Operational Dashboard', 'operational',
     '{"layout": "grid", "columns": 3, "rows": 4}',
     '{"widgets": [
        {"id": "automation_rate", "type": "percentage", "position": {"x": 0, "y": 0, "w": 1, "h": 1}},
        {"id": "incident_rate", "type": "metric", "position": {"x": 1, "y": 0, "w": 1, "h": 1}},
        {"id": "mttr", "type": "metric", "position": {"x": 2, "y": 0, "w": 1, "h": 1}},
        {"id": "compliance_status", "type": "chart", "position": {"x": 0, "y": 1, "w": 3, "h": 2}},
        {"id": "recent_activities", "type": "list", "position": {"x": 0, "y": 3, "w": 3, "h": 1}}
     ]}',
     true, true, 'SYSTEM', 'SYSTEM')
ON CONFLICT (dashboard_id) DO NOTHING;

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kpi_definitions_updated_at BEFORE UPDATE ON kpi_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_configurations_updated_at BEFORE UPDATE ON dashboard_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_collection_schedules_updated_at BEFORE UPDATE ON data_collection_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_processing_jobs_updated_at BEFORE UPDATE ON data_processing_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_reports_updated_at BEFORE UPDATE ON generated_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_approvals_updated_at BEFORE UPDATE ON workflow_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();