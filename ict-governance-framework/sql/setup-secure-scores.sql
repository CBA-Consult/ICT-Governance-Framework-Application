-- Table to store Secure Score snapshots
CREATE TABLE IF NOT EXISTS secure_scores (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(128) NOT NULL,
    created_date TIMESTAMP NOT NULL,
    current_score NUMERIC,
    max_score NUMERIC,
    active_user_count INTEGER,
    licensed_user_count INTEGER,
    raw_json JSONB,
    UNIQUE (tenant_id, created_date)
);

-- Table to store individual control scores for each snapshot
CREATE TABLE IF NOT EXISTS secure_score_controls (
    id SERIAL PRIMARY KEY,
    secure_score_id INTEGER REFERENCES secure_scores(id) ON DELETE CASCADE,
    control_category VARCHAR(64),
    control_name VARCHAR(128),
    description TEXT,
    score NUMERIC,
    score_in_percentage NUMERIC,
    implementation_status TEXT,
    last_synced TIMESTAMP,
    extra_json JSONB
);
