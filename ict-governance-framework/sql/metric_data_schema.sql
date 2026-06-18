-- metric_data — executive/operational dashboard KPI storage (A065 reporting layer)
-- Matches api/data-processing.js and db-schema.sql shape

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
    created_by VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_metric_data_name_category ON metric_data(metric_name, metric_category);
CREATE INDEX IF NOT EXISTS idx_metric_data_collection_timestamp ON metric_data(collection_timestamp);
CREATE INDEX IF NOT EXISTS idx_metric_data_category ON metric_data(metric_category);

INSERT INTO metric_data (metric_id, metric_name, metric_category, value, target_value, unit, data_source, collection_timestamp, collection_method, metadata, tags) VALUES
('MET-001', 'governance_maturity_level', 'kpi', 3.5, 4.0, 'score', 'governance_assessment', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{}', ARRAY['governance']),
('MET-002', 'policy_compliance_rate', 'compliance', 85.5, 95.0, 'percentage', 'compliance_monitor', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{}', ARRAY['compliance']),
('MET-003', 'risk_remediation_rate', 'risk', 72.0, 85.0, 'percentage', 'risk_system', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{}', ARRAY['risk']),
('MET-004', 'stakeholder_satisfaction', 'kpi', 78.0, 85.0, 'percentage', 'survey_system', CURRENT_TIMESTAMP - INTERVAL '2 days', 'survey', '{}', ARRAY['governance']),
('MET-005', 'business_value_realization', 'financial', 1250000, 1500000, 'currency', 'financial_system', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{}', ARRAY['financial']),
('MET-006', 'process_automation_rate', 'performance', 68.0, 70.0, 'percentage', 'ops_monitor', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{}', ARRAY['operational']),
('MET-007', 'incident_rate', 'operational', 4.0, 2.0, 'count', 'governance_incidents', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{}', ARRAY['secops']),
('MET-008', 'mean_time_to_resolve', 'operational', 45.0, 60.0, 'minutes', 'governance_incidents', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{}', ARRAY['secops']),
('MET-009', 'architecture_compliance', 'compliance', 82.0, 90.0, 'percentage', 'architecture_review', CURRENT_TIMESTAMP - INTERVAL '2 days', 'automated', '{}', ARRAY['architecture']),
('MET-010', 'technology_standardization', 'performance', 74.0, 80.0, 'percentage', 'asset_register', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{}', ARRAY['technology']),
('MET-011', 'security_control_effectiveness', 'compliance', 88.0, 95.0, 'percentage', 'security_monitor', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{}', ARRAY['security']),
('MET-012', 'audit_findings_resolved', 'compliance', 91.0, 95.0, 'percentage', 'audit_tracker', CURRENT_TIMESTAMP - INTERVAL '3 days', 'manual', '{}', ARRAY['audit']),
('MET-013', 'regulatory_compliance_score', 'compliance', 86.5, 95.0, 'percentage', 'compliance_posture', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{}', ARRAY['regulatory']),
('MET-014', 'risk_identification_rate', 'risk', 94.0, 98.0, 'percentage', 'risk_register', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{}', ARRAY['risk']),
('MET-015', 'high_risk_exceptions', 'risk', 3.0, 0.0, 'count', 'fair_risk_engine', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{}', ARRAY['risk']),
('MET-016', 'security_incidents', 'risk', 2.0, 0.0, 'count', 'governance_incidents', CURRENT_TIMESTAMP - INTERVAL '1 day', 'automated', '{}', ARRAY['secops']),
('MET-017', 'vulnerability_remediation_rate', 'risk', 79.0, 90.0, 'percentage', 'vuln_scanner', CURRENT_TIMESTAMP - INTERVAL '2 days', 'automated', '{}', ARRAY['vulnerability'])
ON CONFLICT (metric_id) DO NOTHING;
