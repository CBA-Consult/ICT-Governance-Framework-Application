-- Sprint B Step 2: MITRE ATT&CK enrichment on governance incidents

ALTER TABLE governance_incidents
  ADD COLUMN IF NOT EXISTS mitre_tactic VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mitre_technique VARCHAR(20),
  ADD COLUMN IF NOT EXISTS mitre_technique_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS fair_scenario_id VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_incidents_mitre_technique ON governance_incidents(mitre_technique);
CREATE INDEX IF NOT EXISTS idx_incidents_fair_scenario ON governance_incidents(fair_scenario_id);

-- Optional FK when fair_risk_scenarios exists
DO $$ BEGIN
  ALTER TABLE governance_incidents
    ADD CONSTRAINT fk_incident_fair_scenario
    FOREIGN KEY (fair_scenario_id) REFERENCES fair_risk_scenarios(scenario_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;
