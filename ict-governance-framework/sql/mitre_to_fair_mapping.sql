-- Sprint B Step 3.2: Data-driven MITRE ATT&CK → FAIR scenario mapping (tunable weights)

CREATE TABLE IF NOT EXISTS mitre_to_fair_mapping (
  mapping_id SERIAL PRIMARY KEY,
  technique VARCHAR(20),
  tactic VARCHAR(100),
  technique_name VARCHAR(255),
  scenario_id VARCHAR(50) NOT NULL,
  severity_weight NUMERIC(5, 2) NOT NULL DEFAULT 1.00
    CHECK (severity_weight >= 0.1 AND severity_weight <= 5.0),
  confidence_score NUMERIC(3, 2) NOT NULL DEFAULT 0.80
    CHECK (confidence_score >= 0 AND confidence_score <= 1),
  mapping_version VARCHAR(20) NOT NULL DEFAULT '1.0',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT mitre_mapping_technique_or_tactic CHECK (technique IS NOT NULL OR tactic IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mitre_fair_technique
  ON mitre_to_fair_mapping (technique) WHERE technique IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mitre_fair_tactic_fallback
  ON mitre_to_fair_mapping (lower(tactic)) WHERE technique IS NULL AND tactic IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mitre_fair_scenario ON mitre_to_fair_mapping (scenario_id);

DO $$ BEGIN
  ALTER TABLE mitre_to_fair_mapping
    ADD CONSTRAINT fk_mitre_fair_scenario
    FOREIGN KEY (scenario_id) REFERENCES fair_risk_scenarios(scenario_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

ALTER TABLE governance_incidents
  ADD COLUMN IF NOT EXISTS mitre_severity_weight NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS mitre_mapping_confidence NUMERIC(3, 2);

-- Idempotent seed (setup re-run safe)
DELETE FROM mitre_to_fair_mapping;

INSERT INTO mitre_to_fair_mapping (technique, tactic, technique_name, scenario_id, severity_weight, confidence_score) VALUES
('T1003', 'Credential Access', 'OS Credential Dumping', 'RSK-ADMIN-COMPROMISE', 1.40, 0.95),
('T1078', 'Credential Access', 'Valid Accounts', 'RSK-ADMIN-COMPROMISE', 1.35, 0.92),
('T1110', 'Credential Access', 'Brute Force', 'RSK-ADMIN-COMPROMISE', 1.25, 0.88),
('T1136', 'Persistence', 'Create Account', 'RSK-ADMIN-COMPROMISE', 1.30, 0.90),
('T1567', 'Exfiltration', 'Exfiltration Over Web Service', 'RSK-SHADOW-IT-LEAK', 1.35, 0.93),
('T1041', 'Exfiltration', 'Exfiltration Over C2 Channel', 'RSK-SHADOW-IT-LEAK', 1.30, 0.91),
('T1530', 'Collection', 'Data from Cloud Storage', 'RSK-SHADOW-IT-LEAK', 1.20, 0.85),
('T1485', 'Impact', 'Data Destruction', 'RSK-DR-FAILURE', 1.45, 0.94),
('T1486', 'Impact', 'Data Encrypted for Impact', 'RSK-DR-FAILURE', 1.50, 0.96),
('T1490', 'Impact', 'Inhibit System Recovery', 'RSK-DR-FAILURE', 1.40, 0.93);

INSERT INTO mitre_to_fair_mapping (technique, tactic, technique_name, scenario_id, severity_weight, confidence_score) VALUES
(NULL, 'Credential Access', NULL, 'RSK-ADMIN-COMPROMISE', 1.20, 0.75),
(NULL, 'Privilege Escalation', NULL, 'RSK-ADMIN-COMPROMISE', 1.25, 0.78),
(NULL, 'Initial Access', NULL, 'RSK-ADMIN-COMPROMISE', 1.15, 0.72),
(NULL, 'Persistence', NULL, 'RSK-ADMIN-COMPROMISE', 1.20, 0.74),
(NULL, 'Lateral Movement', NULL, 'RSK-ADMIN-COMPROMISE', 1.25, 0.76),
(NULL, 'Exfiltration', NULL, 'RSK-SHADOW-IT-LEAK', 1.25, 0.80),
(NULL, 'Collection', NULL, 'RSK-SHADOW-IT-LEAK', 1.15, 0.73),
(NULL, 'Impact', NULL, 'RSK-DR-FAILURE', 1.35, 0.82),
(NULL, 'Denial of Service', NULL, 'RSK-DR-FAILURE', 1.30, 0.80);
