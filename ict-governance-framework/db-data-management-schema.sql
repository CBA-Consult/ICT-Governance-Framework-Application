-- ============================================================================
-- DATA SYNCHRONIZATION, TRANSFORMATION, AND MASTER DATA MANAGEMENT SCHEMA
-- ============================================================================

-- Data Sources Registry - Central registry of all data sources
CREATE TABLE IF NOT EXISTS data_sources_registry (
    source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(255) NOT NULL UNIQUE,
    source_type VARCHAR(100) NOT NULL, -- 'database', 'api', 'file', 'stream', 'cloud_service'
    connection_config JSONB NOT NULL, -- Connection details, credentials, endpoints
    data_format VARCHAR(50) NOT NULL, -- 'json', 'xml', 'csv', 'sql', 'avro', 'parquet'
    sync_frequency VARCHAR(50) DEFAULT 'manual', -- 'real-time', 'hourly', 'daily', 'weekly', 'manual'
    last_sync_timestamp TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'inactive', -- 'active', 'inactive', 'error', 'syncing'
    error_count INTEGER DEFAULT 0,
    last_error_message TEXT,
    is_master_source BOOLEAN DEFAULT false,
    priority_level INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    data_quality_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Data Synchronization Jobs - Track sync operations
CREATE TABLE IF NOT EXISTS data_sync_jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(255) NOT NULL,
    source_id UUID REFERENCES data_sources_registry(source_id) ON DELETE CASCADE,
    target_id UUID REFERENCES data_sources_registry(source_id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'delta', 'real-time'
    sync_direction VARCHAR(50) NOT NULL, -- 'source_to_target', 'target_to_source', 'bidirectional'
    sync_schedule VARCHAR(100), -- Cron expression for scheduled syncs
    transformation_rules JSONB DEFAULT '{}'::jsonb,
    conflict_resolution_strategy VARCHAR(100) DEFAULT 'source_wins', -- 'source_wins', 'target_wins', 'merge', 'manual'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    records_processed INTEGER DEFAULT 0,
    records_successful INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_details JSONB DEFAULT '{}'::jsonb,
    performance_metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Data Transformation Rules - Define how data should be transformed
CREATE TABLE IF NOT EXISTS data_transformation_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100) NOT NULL, -- 'mapping', 'validation', 'enrichment', 'aggregation', 'filtering'
    source_schema JSONB NOT NULL, -- Source data structure
    target_schema JSONB NOT NULL, -- Target data structure
    transformation_logic JSONB NOT NULL, -- Transformation rules and mappings
    validation_rules JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    priority_order INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    version VARCHAR(50) DEFAULT '1.0.0',
    description TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Master Data Entities - Define master data entities and their attributes
CREATE TABLE IF NOT EXISTS master_data_entities (
    entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name VARCHAR(255) NOT NULL UNIQUE,
    entity_type VARCHAR(100) NOT NULL, -- 'customer', 'product', 'employee', 'vendor', 'location', 'application'
    entity_schema JSONB NOT NULL, -- Schema definition for the entity
    business_rules JSONB DEFAULT '{}'::jsonb,
    data_quality_rules JSONB DEFAULT '{}'::jsonb,
    steward_user_id VARCHAR(255), -- Data steward responsible for this entity
    approval_workflow_id UUID, -- Reference to workflow for changes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    version VARCHAR(50) DEFAULT '1.0.0',
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Master Data Records - Store actual master data records
CREATE TABLE IF NOT EXISTS master_data_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES master_data_entities(entity_id) ON DELETE CASCADE,
    master_id VARCHAR(255) NOT NULL, -- Business identifier for the record
    record_data JSONB NOT NULL, -- The actual data record
    data_quality_score DECIMAL(3,2) DEFAULT 0.00,
    confidence_score DECIMAL(3,2) DEFAULT 0.00,
    source_system VARCHAR(255),
    last_verified_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'pending_approval', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(entity_id, master_id)
);

-- Data Quality Issues - Track data quality problems
CREATE TABLE IF NOT EXISTS data_quality_issues (
    issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES master_data_entities(entity_id) ON DELETE CASCADE,
    record_id UUID REFERENCES master_data_records(record_id) ON DELETE CASCADE,
    issue_type VARCHAR(100) NOT NULL, -- 'completeness', 'accuracy', 'consistency', 'validity', 'uniqueness'
    severity VARCHAR(50) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    description TEXT NOT NULL,
    field_name VARCHAR(255),
    current_value TEXT,
    expected_value TEXT,
    rule_violated VARCHAR(255),
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'false_positive'
    assigned_to VARCHAR(255),
    resolution_notes TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Data Lineage - Track data flow and transformations
CREATE TABLE IF NOT EXISTS data_lineage (
    lineage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_entity VARCHAR(255) NOT NULL,
    source_field VARCHAR(255),
    target_entity VARCHAR(255) NOT NULL,
    target_field VARCHAR(255),
    transformation_type VARCHAR(100), -- 'direct_copy', 'calculated', 'aggregated', 'enriched', 'filtered'
    transformation_rule_id UUID REFERENCES data_transformation_rules(rule_id),
    sync_job_id UUID REFERENCES data_sync_jobs(job_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Data Sync History - Audit trail of synchronization activities
CREATE TABLE IF NOT EXISTS data_sync_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES data_sync_jobs(job_id) ON DELETE CASCADE,
    execution_id UUID NOT NULL, -- Unique identifier for each job execution
    operation_type VARCHAR(50) NOT NULL, -- 'insert', 'update', 'delete', 'merge'
    record_identifier VARCHAR(255),
    source_data JSONB,
    target_data JSONB,
    transformation_applied JSONB,
    status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'skipped'
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_time_ms INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_sources_registry_type ON data_sources_registry(source_type);
CREATE INDEX IF NOT EXISTS idx_data_sources_registry_status ON data_sources_registry(sync_status);
CREATE INDEX IF NOT EXISTS idx_data_sources_registry_priority ON data_sources_registry(priority_level);
CREATE INDEX IF NOT EXISTS idx_data_sources_registry_last_sync ON data_sources_registry(last_sync_timestamp);

CREATE INDEX IF NOT EXISTS idx_data_sync_jobs_status ON data_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_data_sync_jobs_source ON data_sync_jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_jobs_target ON data_sync_jobs(target_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_jobs_started ON data_sync_jobs(started_at);

CREATE INDEX IF NOT EXISTS idx_transformation_rules_type ON data_transformation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_transformation_rules_active ON data_transformation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_transformation_rules_priority ON data_transformation_rules(priority_order);

CREATE INDEX IF NOT EXISTS idx_master_data_entities_type ON master_data_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_master_data_entities_active ON master_data_entities(is_active);
CREATE INDEX IF NOT EXISTS idx_master_data_entities_steward ON master_data_entities(steward_user_id);

CREATE INDEX IF NOT EXISTS idx_master_data_records_entity ON master_data_records(entity_id);
CREATE INDEX IF NOT EXISTS idx_master_data_records_master_id ON master_data_records(master_id);
CREATE INDEX IF NOT EXISTS idx_master_data_records_status ON master_data_records(status);
CREATE INDEX IF NOT EXISTS idx_master_data_records_quality ON master_data_records(data_quality_score);

CREATE INDEX IF NOT EXISTS idx_data_quality_issues_entity ON data_quality_issues(entity_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_issues_record ON data_quality_issues(record_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_issues_type ON data_quality_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_data_quality_issues_severity ON data_quality_issues(severity);
CREATE INDEX IF NOT EXISTS idx_data_quality_issues_status ON data_quality_issues(status);

CREATE INDEX IF NOT EXISTS idx_data_lineage_source ON data_lineage(source_entity, source_field);
CREATE INDEX IF NOT EXISTS idx_data_lineage_target ON data_lineage(target_entity, target_field);
CREATE INDEX IF NOT EXISTS idx_data_lineage_transformation ON data_lineage(transformation_rule_id);

CREATE INDEX IF NOT EXISTS idx_data_sync_history_job ON data_sync_history(job_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_history_execution ON data_sync_history(execution_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_history_status ON data_sync_history(status);
CREATE INDEX IF NOT EXISTS idx_data_sync_history_processed ON data_sync_history(processed_at);

-- Insert default master data entities
INSERT INTO master_data_entities (entity_name, entity_type, entity_schema, description, created_by) VALUES
('Applications', 'application', '{
    "properties": {
        "application_id": {"type": "string", "required": true},
        "application_name": {"type": "string", "required": true},
        "vendor": {"type": "string"},
        "version": {"type": "string"},
        "category": {"type": "string"},
        "business_owner": {"type": "string"},
        "technical_owner": {"type": "string"},
        "compliance_status": {"type": "string"},
        "risk_level": {"type": "string"},
        "data_classification": {"type": "string"}
    }
}', 'Master data for applications and software systems', 'system'),

('Users', 'employee', '{
    "properties": {
        "user_id": {"type": "string", "required": true},
        "email": {"type": "string", "required": true},
        "first_name": {"type": "string", "required": true},
        "last_name": {"type": "string", "required": true},
        "department": {"type": "string"},
        "role": {"type": "string"},
        "manager": {"type": "string"},
        "employment_status": {"type": "string"},
        "start_date": {"type": "string", "format": "date"}
    }
}', 'Master data for employees and users', 'system'),

('Vendors', 'vendor', '{
    "properties": {
        "vendor_id": {"type": "string", "required": true},
        "vendor_name": {"type": "string", "required": true},
        "contact_email": {"type": "string"},
        "contact_phone": {"type": "string"},
        "address": {"type": "object"},
        "contract_status": {"type": "string"},
        "risk_rating": {"type": "string"},
        "compliance_certifications": {"type": "array"}
    }
}', 'Master data for vendors and suppliers', 'system'),

('Locations', 'location', '{
    "properties": {
        "location_id": {"type": "string", "required": true},
        "location_name": {"type": "string", "required": true},
        "address": {"type": "object", "required": true},
        "country": {"type": "string", "required": true},
        "region": {"type": "string"},
        "timezone": {"type": "string"},
        "facility_type": {"type": "string"}
    }
}', 'Master data for physical locations and facilities', 'system');

-- Insert default transformation rules
INSERT INTO data_transformation_rules (rule_name, rule_type, source_schema, target_schema, transformation_logic, description, created_by) VALUES
('Standard User Mapping', 'mapping', '{
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "name": {"type": "string"},
        "email": {"type": "string"}
    }
}', '{
    "type": "object",
    "properties": {
        "user_id": {"type": "string"},
        "full_name": {"type": "string"},
        "email_address": {"type": "string"}
    }
}', '{
    "mappings": [
        {"source": "id", "target": "user_id", "type": "direct"},
        {"source": "name", "target": "full_name", "type": "direct"},
        {"source": "email", "target": "email_address", "type": "direct"}
    ]
}', 'Standard mapping for user data transformation', 'system'),

('Email Validation', 'validation', '{
    "type": "object",
    "properties": {
        "email": {"type": "string"}
    }
}', '{
    "type": "object",
    "properties": {
        "email": {"type": "string"},
        "is_valid": {"type": "boolean"}
    }
}', '{
    "validations": [
        {
            "field": "email",
            "rules": [
                {"type": "format", "pattern": "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"},
                {"type": "required"}
            ]
        }
    ]
}', 'Email format validation rule', 'system');