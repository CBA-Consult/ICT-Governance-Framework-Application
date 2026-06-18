/**
 * MITRE ATT&CK enrichment — ingest normalization + FAIR scenario linkage (Sprint B)
 * Step 3.2: DB-backed mitre_to_fair_mapping with static fallback
 */
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const TACTIC_TO_FAIR_SCENARIO = {
  'credential access': 'RSK-ADMIN-COMPROMISE',
  'privilege escalation': 'RSK-ADMIN-COMPROMISE',
  'initial access': 'RSK-ADMIN-COMPROMISE',
  'persistence': 'RSK-ADMIN-COMPROMISE',
  'lateral movement': 'RSK-ADMIN-COMPROMISE',
  'exfiltration': 'RSK-SHADOW-IT-LEAK',
  'collection': 'RSK-SHADOW-IT-LEAK',
  'impact': 'RSK-DR-FAILURE',
  'denial of service': 'RSK-DR-FAILURE'
};

const TECHNIQUE_TO_FAIR_SCENARIO = {
  T1003: 'RSK-ADMIN-COMPROMISE',
  T1078: 'RSK-ADMIN-COMPROMISE',
  T1110: 'RSK-ADMIN-COMPROMISE',
  T1136: 'RSK-ADMIN-COMPROMISE',
  T1567: 'RSK-SHADOW-IT-LEAK',
  T1041: 'RSK-SHADOW-IT-LEAK',
  T1530: 'RSK-SHADOW-IT-LEAK',
  T1485: 'RSK-DR-FAILURE',
  T1486: 'RSK-DR-FAILURE',
  T1490: 'RSK-DR-FAILURE'
};

const TECHNIQUE_NAMES = {
  T1003: 'OS Credential Dumping',
  T1078: 'Valid Accounts',
  T1110: 'Brute Force',
  T1136: 'Create Account',
  T1567: 'Exfiltration Over Web Service',
  T1041: 'Exfiltration Over C2 Channel',
  T1530: 'Data from Cloud Storage',
  T1485: 'Data Destruction',
  T1486: 'Data Encrypted for Impact',
  T1490: 'Inhibit System Recovery'
};

const STATIC_TECHNIQUE_WEIGHTS = {
  T1003: 1.4,
  T1078: 1.35,
  T1110: 1.25,
  T1136: 1.3,
  T1567: 1.35,
  T1041: 1.3,
  T1530: 1.2,
  T1485: 1.45,
  T1486: 1.5,
  T1490: 1.4
};

const CACHE_TTL_MS = 60_000;
let mappingCache = { byTechnique: {}, byTactic: {} };
let cacheLoadedAt = 0;

function normalizeTechniqueId(value) {
  if (!value) return null;
  const match = String(value).toUpperCase().match(/T\d{4}(?:\.\d{3})?/);
  return match ? match[0].split('.')[0] : null;
}

function firstString(...values) {
  for (const v of values) {
    if (v == null) continue;
    if (Array.isArray(v) && v.length > 0) return String(v[0]);
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

function resolveFromStatic(mitre) {
  if (!mitre) return null;

  if (mitre.technique && TECHNIQUE_TO_FAIR_SCENARIO[mitre.technique]) {
    return {
      scenario_id: TECHNIQUE_TO_FAIR_SCENARIO[mitre.technique],
      severity_weight: STATIC_TECHNIQUE_WEIGHTS[mitre.technique] || 1.0,
      confidence_score: 0.7,
      mapping_source: 'static_fallback',
      technique: mitre.technique,
      tactic: mitre.tactic || null,
      technique_name: mitre.technique_name || TECHNIQUE_NAMES[mitre.technique] || null
    };
  }

  if (mitre.tactic) {
    const key = String(mitre.tactic).toLowerCase();
    const scenarioId = TACTIC_TO_FAIR_SCENARIO[key];
    if (!scenarioId) return null;
    return {
      scenario_id: scenarioId,
      severity_weight: 1.15,
      confidence_score: 0.65,
      mapping_source: 'static_fallback',
      technique: mitre.technique || null,
      tactic: mitre.tactic,
      technique_name: mitre.technique_name || null
    };
  }

  return null;
}

async function refreshMappingCache(db) {
  const client = db?.query ? db : pool;
  const { rows } = await client.query(`
    SELECT technique, tactic, technique_name, scenario_id, severity_weight, confidence_score, mapping_version
    FROM mitre_to_fair_mapping
    ORDER BY technique NULLS LAST
  `);

  const byTechnique = {};
  const byTactic = {};
  for (const row of rows) {
    const entry = {
      scenario_id: row.scenario_id,
      severity_weight: parseFloat(row.severity_weight),
      confidence_score: parseFloat(row.confidence_score),
      mapping_source: 'mitre_to_fair_mapping',
      mapping_version: row.mapping_version,
      technique: row.technique,
      tactic: row.tactic,
      technique_name: row.technique_name
    };
    if (row.technique) {
      byTechnique[String(row.technique).toUpperCase()] = entry;
    } else if (row.tactic) {
      byTactic[String(row.tactic).toLowerCase()] = entry;
    }
  }

  mappingCache = { byTechnique, byTactic };
  cacheLoadedAt = Date.now();
  return mappingCache;
}

async function ensureMappingCache(db) {
  if (Date.now() - cacheLoadedAt < CACHE_TTL_MS && Object.keys(mappingCache.byTechnique).length > 0) {
    return mappingCache;
  }
  try {
    return await refreshMappingCache(db);
  } catch (err) {
    if (err.code === '42P01') return mappingCache;
    throw err;
  }
}

function lookupFromCache(mitre) {
  if (!mitre) return null;

  if (mitre.technique) {
    const hit = mappingCache.byTechnique[String(mitre.technique).toUpperCase()];
    if (hit) {
      return {
        ...hit,
        technique: mitre.technique,
        tactic: hit.tactic || mitre.tactic,
        technique_name: mitre.technique_name || hit.technique_name
      };
    }
  }

  if (mitre.tactic) {
    const hit = mappingCache.byTactic[String(mitre.tactic).toLowerCase()];
    if (hit) {
      return {
        ...hit,
        tactic: mitre.tactic,
        technique: mitre.technique || null,
        technique_name: mitre.technique_name || hit.technique_name
      };
    }
  }

  return null;
}

async function resolveMitreFairMapping(db, mitre) {
  if (!mitre) return null;
  await ensureMappingCache(db);
  const fromDb = lookupFromCache(mitre);
  if (fromDb) return fromDb;
  return resolveFromStatic(mitre);
}

function extractMitreFromPayload(body) {
  const mitreBlock = body.mitre || body.Mitre || {};
  const properties = body.properties || body.Properties || {};

  let tactic = mitreBlock.tactic
    || body.mitreTactic
    || body.mitre_tactic
    || firstString(properties.tactics, properties.Tactics, properties.mitreTactic);

  let technique = normalizeTechniqueId(
    mitreBlock.technique
    || body.mitreTechnique
    || body.mitre_technique
    || firstString(properties.techniques, properties.Techniques, properties.mitreTechnique)
  );

  let techniqueName = mitreBlock.technique_name
    || mitreBlock.techniqueName
    || body.mitreTechniqueName
    || body.mitre_technique_name
    || properties.techniqueName
    || properties.TechniqueName
    || null;

  if (!techniqueName && technique && TECHNIQUE_NAMES[technique]) {
    techniqueName = TECHNIQUE_NAMES[technique];
  }

  if (!tactic && !technique) {
    return null;
  }

  return {
    tactic: tactic || null,
    technique: technique || null,
    technique_name: techniqueName || null
  };
}

function mapMitreToFairScenario(mitre) {
  const resolved = lookupFromCache(mitre) || resolveFromStatic(mitre);
  return resolved?.scenario_id || null;
}

function buildMitreResponse(incidentOrMitre) {
  if (!incidentOrMitre) return null;

  const tactic = incidentOrMitre.mitre_tactic ?? incidentOrMitre.tactic;
  const technique = incidentOrMitre.mitre_technique ?? incidentOrMitre.technique;
  const techniqueName = incidentOrMitre.mitre_technique_name ?? incidentOrMitre.technique_name;

  if (!tactic && !technique) return null;

  const cached = lookupFromCache({ tactic, technique, technique_name: techniqueName })
    || resolveFromStatic({ tactic, technique, technique_name: techniqueName });

  return {
    tactic,
    technique,
    technique_name: techniqueName || cached?.technique_name || null,
    fair_scenario_id: incidentOrMitre.fair_scenario_id || cached?.scenario_id || mapMitreToFairScenario({
      tactic,
      technique
    }),
    severity_weight: incidentOrMitre.mitre_severity_weight != null
      ? parseFloat(incidentOrMitre.mitre_severity_weight)
      : cached?.severity_weight || null,
    confidence_score: incidentOrMitre.mitre_mapping_confidence != null
      ? parseFloat(incidentOrMitre.mitre_mapping_confidence)
      : cached?.confidence_score || null,
    mapping_source: cached?.mapping_source || (technique || tactic ? 'static_fallback' : null)
  };
}

async function listMitreFairMappings(db) {
  await ensureMappingCache(db);
  const client = db?.query ? db : pool;
  try {
    const { rows } = await client.query(`
      SELECT mapping_id, technique, tactic, technique_name, scenario_id,
             severity_weight, confidence_score, mapping_version, last_updated
      FROM mitre_to_fair_mapping
      ORDER BY scenario_id, technique NULLS LAST, tactic
    `);
    return rows;
  } catch (err) {
    if (err.code === '42P01') return [];
    throw err;
  }
}

module.exports = {
  TACTIC_TO_FAIR_SCENARIO,
  TECHNIQUE_TO_FAIR_SCENARIO,
  TECHNIQUE_NAMES,
  extractMitreFromPayload,
  resolveMitreFairMapping,
  refreshMappingCache,
  mapMitreToFairScenario,
  buildMitreResponse,
  listMitreFairMappings,
  normalizeTechniqueId
};
