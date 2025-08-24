-- Database schema for monitoring and health check capabilities
-- File: ict-governance-framework/db-monitoring-schema.sql

-- Integration health checks table
CREATE TABLE IF NOT EXISTS integration_health_checks (
    id SERIAL PRIMARY KEY,
    integration_name VARCHAR(100) NOT NULL,
    check_id UUID NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'unhealthy', 'warning', 'error', 'unknown')),
    response_time INTEGER NOT NULL DEFAULT 0,
    details JSONB,
    diagnostics JSONB,
    alerts JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration alerts table
CREATE TABLE IF NOT EXISTS integration_alerts (
    id SERIAL PRIMARY KEY,
    integration_name VARCHAR(100) NOT NULL,
    alert_id UUID NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    message TEXT NOT NULL,
    details JSONB,
    threshold_value NUMERIC,
    actual_value NUMERIC,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(100),
    acknowledgment_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(100),
    resolution VARCHAR(100),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration metrics table
CREATE TABLE IF NOT EXISTS integration_metrics (
    id SERIAL PRIMARY KEY,
    integration_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value NUMERIC NOT NULL,
    unit VARCHAR(20),
    tags JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration configurations table
CREATE TABLE IF NOT EXISTS integration_configurations (
    id SERIAL PRIMARY KEY,
    integration_name VARCHAR(100) NOT NULL UNIQUE,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    health_check_interval INTEGER NOT NULL DEFAULT 60000,
    alert_thresholds JSONB,
    custom_health_checks JSONB,
    diagnostic_tests JSONB,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration uptime tracking table
CREATE TABLE IF NOT EXISTS integration_uptime (
    id SERIAL PRIMARY KEY,
    integration_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    total_checks INTEGER NOT NULL DEFAULT 0,
    successful_checks INTEGER NOT NULL DEFAULT 0,
    failed_checks INTEGER NOT NULL DEFAULT 0,
    avg_response_time NUMERIC,
    min_response_time NUMERIC,
    max_response_time NUMERIC,
    uptime_percentage NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN total_checks > 0 THEN (successful_checks::NUMERIC / total_checks::NUMERIC) * 100
            ELSE 0
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(integration_name, date)
);

-- Monitoring incidents table
CREATE TABLE IF NOT EXISTS monitoring_incidents (
    id SERIAL PRIMARY KEY,
    incident_id UUID NOT NULL UNIQUE,
    integration_name VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    impact VARCHAR(20) CHECK (impact IN ('critical', 'high', 'medium', 'low')),
    root_cause TEXT,
    resolution TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    assigned_to VARCHAR(100),
    created_by VARCHAR(100),
    tags JSONB,
    related_alerts JSONB,
    timeline JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diagnostic test results table
CREATE TABLE IF NOT EXISTS diagnostic_test_results (
    id SERIAL PRIMARY KEY,
    test_id UUID NOT NULL UNIQUE,
    integration_name VARCHAR(100) NOT NULL,
    test_name VARCHAR(100) NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed', 'warning', 'skipped')),
    execution_time INTEGER,
    result_data JSONB,
    error_message TEXT,
    recommendations JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance baselines table
CREATE TABLE IF NOT EXISTS performance_baselines (
    id SERIAL PRIMARY KEY,
    integration_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    baseline_value NUMERIC NOT NULL,
    baseline_type VARCHAR(50) NOT NULL, -- 'average', 'percentile_95', 'max', etc.
    calculation_period VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    confidence_interval NUMERIC,
    sample_size INTEGER,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(integration_name, metric_name, baseline_type, calculation_period, valid_from)
);

-- Monitoring dashboards table
CREATE TABLE IF NOT EXISTS monitoring_dashboards (
    id SERIAL PRIMARY KEY,
    dashboard_id UUID NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    dashboard_type VARCHAR(50) NOT NULL, -- 'overview', 'integration', 'custom'
    configuration JSONB NOT NULL,
    widgets JSONB,
    filters JSONB,
    refresh_interval INTEGER DEFAULT 60,
    is_public BOOLEAN DEFAULT false,
    created_by VARCHAR(100),
    shared_with JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_checks_integration_timestamp 
ON integration_health_checks(integration_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_health_checks_status_timestamp 
ON integration_health_checks(status, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_integration_timestamp 
ON integration_alerts(integration_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_severity_status 
ON integration_alerts(severity, resolved_at) WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_metrics_integration_type_timestamp 
ON integration_metrics(integration_name, metric_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_uptime_integration_date 
ON integration_uptime(integration_name, date DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_status_severity 
ON monitoring_incidents(status, severity, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_diagnostic_results_integration_timestamp 
ON diagnostic_test_results(integration_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_baselines_integration_metric 
ON performance_baselines(integration_name, metric_name, valid_from DESC);

-- Create views for common queries

-- Integration health summary view
CREATE OR REPLACE VIEW integration_health_summary AS
SELECT 
    ic.integration_name,
    ic.priority,
    ic.enabled,
    COALESCE(latest.status, 'unknown') as current_status,
    latest.timestamp as last_check,
    latest.response_time as last_response_time,
    uptime.uptime_percentage as daily_uptime,
    COALESCE(alert_count.active_alerts, 0) as active_alerts
FROM integration_configurations ic
LEFT JOIN LATERAL (
    SELECT status, timestamp, response_time
    FROM integration_health_checks ihc
    WHERE ihc.integration_name = ic.integration_name
    ORDER BY timestamp DESC
    LIMIT 1
) latest ON true
LEFT JOIN integration_uptime uptime ON (
    uptime.integration_name = ic.integration_name 
    AND uptime.date = CURRENT_DATE
)
LEFT JOIN (
    SELECT integration_name, COUNT(*) as active_alerts
    FROM integration_alerts
    WHERE resolved_at IS NULL
    GROUP BY integration_name
) alert_count ON alert_count.integration_name = ic.integration_name;

-- Alert summary view
CREATE OR REPLACE VIEW alert_summary AS
SELECT 
    integration_name,
    severity,
    COUNT(*) as total_alerts,
    COUNT(CASE WHEN resolved_at IS NULL THEN 1 END) as active_alerts,
    COUNT(CASE WHEN acknowledged_at IS NOT NULL AND resolved_at IS NULL THEN 1 END) as acknowledged_alerts,
    AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - timestamp))/60) as avg_resolution_time_minutes
FROM integration_alerts
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY integration_name, severity;

-- Performance trends view
CREATE OR REPLACE VIEW performance_trends AS
SELECT 
    integration_name,
    DATE_TRUNC('hour', timestamp) as hour,
    AVG(response_time) as avg_response_time,
    MIN(response_time) as min_response_time,
    MAX(response_time) as max_response_time,
    COUNT(*) as total_checks,
    COUNT(CASE WHEN status = 'healthy' THEN 1 END) as healthy_checks,
    (COUNT(CASE WHEN status = 'healthy' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100 as availability_percentage
FROM integration_health_checks
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY integration_name, hour
ORDER BY integration_name, hour DESC;

-- Functions for automated maintenance

-- Function to cleanup old health check data
CREATE OR REPLACE FUNCTION cleanup_old_health_checks(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM integration_health_checks 
    WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily uptime statistics
CREATE OR REPLACE FUNCTION update_daily_uptime_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO integration_uptime (
        integration_name, 
        date, 
        total_checks, 
        successful_checks, 
        failed_checks,
        avg_response_time,
        min_response_time,
        max_response_time
    )
    SELECT 
        integration_name,
        target_date,
        COUNT(*) as total_checks,
        COUNT(CASE WHEN status = 'healthy' THEN 1 END) as successful_checks,
        COUNT(CASE WHEN status != 'healthy' THEN 1 END) as failed_checks,
        AVG(response_time) as avg_response_time,
        MIN(response_time) as min_response_time,
        MAX(response_time) as max_response_time
    FROM integration_health_checks
    WHERE DATE(timestamp) = target_date
    GROUP BY integration_name
    ON CONFLICT (integration_name, date) 
    DO UPDATE SET
        total_checks = EXCLUDED.total_checks,
        successful_checks = EXCLUDED.successful_checks,
        failed_checks = EXCLUDED.failed_checks,
        avg_response_time = EXCLUDED.avg_response_time,
        min_response_time = EXCLUDED.min_response_time,
        max_response_time = EXCLUDED.max_response_time,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate performance baselines
CREATE OR REPLACE FUNCTION calculate_performance_baselines(
    integration_name_param VARCHAR(100),
    metric_name_param VARCHAR(100),
    period_days INTEGER DEFAULT 30
)
RETURNS VOID AS $$
DECLARE
    avg_value NUMERIC;
    p95_value NUMERIC;
    max_value NUMERIC;
    sample_count INTEGER;
BEGIN
    -- Calculate statistics from health check data
    SELECT 
        AVG(response_time),
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time),
        MAX(response_time),
        COUNT(*)
    INTO avg_value, p95_value, max_value, sample_count
    FROM integration_health_checks
    WHERE integration_name = integration_name_param
    AND timestamp > NOW() - (period_days || ' days')::INTERVAL
    AND status = 'healthy';
    
    -- Insert baselines
    INSERT INTO performance_baselines (
        integration_name, metric_name, baseline_value, baseline_type, 
        calculation_period, sample_size, valid_from
    ) VALUES 
    (integration_name_param, metric_name_param, avg_value, 'average', period_days || '_days', sample_count, NOW()),
    (integration_name_param, metric_name_param, p95_value, 'percentile_95', period_days || '_days', sample_count, NOW()),
    (integration_name_param, metric_name_param, max_value, 'maximum', period_days || '_days', sample_count, NOW())
    ON CONFLICT (integration_name, metric_name, baseline_type, calculation_period, valid_from)
    DO UPDATE SET
        baseline_value = EXCLUDED.baseline_value,
        sample_size = EXCLUDED.sample_size;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update uptime stats
CREATE OR REPLACE FUNCTION trigger_update_uptime_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily uptime stats when new health check is inserted
    PERFORM update_daily_uptime_stats(DATE(NEW.timestamp));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER health_check_uptime_trigger
    AFTER INSERT ON integration_health_checks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_uptime_stats();

-- Insert default configurations for common integrations
INSERT INTO integration_configurations (
    integration_name, priority, health_check_interval, alert_thresholds
) VALUES 
('azure-ad', 'critical', 30000, '{"responseTime": 3000, "errorRate": 5, "availability": 99}'),
('defender-cloud-apps', 'critical', 60000, '{"responseTime": 5000, "errorRate": 10, "availability": 95}'),
('servicenow', 'high', 60000, '{"responseTime": 5000, "errorRate": 10, "availability": 95}'),
('power-bi', 'medium', 120000, '{"responseTime": 8000, "errorRate": 15, "availability": 90}'),
('sap-erp', 'critical', 60000, '{"responseTime": 10000, "errorRate": 5, "availability": 98}'),
('salesforce', 'high', 60000, '{"responseTime": 5000, "errorRate": 10, "availability": 95}'),
('workday', 'high', 120000, '{"responseTime": 8000, "errorRate": 10, "availability": 95}'),
('synapse', 'medium', 300000, '{"responseTime": 15000, "errorRate": 15, "availability": 90}'),
('sentinel', 'critical', 60000, '{"responseTime": 5000, "errorRate": 5, "availability": 98}'),
('oracle', 'high', 120000, '{"responseTime": 8000, "errorRate": 10, "availability": 95}'),
('aws', 'medium', 300000, '{"responseTime": 10000, "errorRate": 15, "availability": 90}'),
('gcp', 'medium', 300000, '{"responseTime": 10000, "errorRate": 15, "availability": 90}'),
('legacy-systems', 'low', 600000, '{"responseTime": 30000, "errorRate": 20, "availability": 85}')
ON CONFLICT (integration_name) DO NOTHING;

-- Create sample dashboard configurations
INSERT INTO monitoring_dashboards (
    dashboard_id, name, description, dashboard_type, configuration, widgets
) VALUES (
    gen_random_uuid(),
    'Integration Overview Dashboard',
    'High-level overview of all integration health and performance',
    'overview',
    '{"refreshInterval": 60, "autoRefresh": true}',
    '[
        {"type": "health_summary", "title": "Integration Health", "size": "large"},
        {"type": "alert_summary", "title": "Active Alerts", "size": "medium"},
        {"type": "performance_chart", "title": "Response Time Trends", "size": "large"},
        {"type": "uptime_chart", "title": "Availability Trends", "size": "medium"}
    ]'
),
(
    gen_random_uuid(),
    'Critical Integrations Dashboard',
    'Focused view of critical integrations requiring close monitoring',
    'custom',
    '{"refreshInterval": 30, "autoRefresh": true, "filters": {"priority": ["critical"]}}',
    '[
        {"type": "integration_grid", "title": "Critical Integrations", "size": "large"},
        {"type": "alert_timeline", "title": "Recent Alerts", "size": "medium"},
        {"type": "diagnostic_results", "title": "Latest Diagnostics", "size": "medium"}
    ]'
);

COMMENT ON TABLE integration_health_checks IS 'Stores health check results for all monitored integrations';
COMMENT ON TABLE integration_alerts IS 'Stores alerts generated by the monitoring system';
COMMENT ON TABLE integration_metrics IS 'Stores detailed metrics for integrations';
COMMENT ON TABLE integration_configurations IS 'Configuration settings for each monitored integration';
COMMENT ON TABLE integration_uptime IS 'Daily uptime statistics for integrations';
COMMENT ON TABLE monitoring_incidents IS 'Tracks incidents and their resolution';
COMMENT ON TABLE diagnostic_test_results IS 'Results from diagnostic tests run on integrations';
COMMENT ON TABLE performance_baselines IS 'Performance baselines for anomaly detection';
COMMENT ON TABLE monitoring_dashboards IS 'Configuration for monitoring dashboards';