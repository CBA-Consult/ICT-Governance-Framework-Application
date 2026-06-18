/** Board-ready labels for CISO / executive dashboards */

const SCENARIO_LABELS = {
  'RSK-ADMIN-COMPROMISE': 'Admin Compromise',
  'RSK-SHADOW-IT-LEAK': 'Shadow IT Leak',
  'RSK-DR-FAILURE': 'DR Failure'
};

const DRIVER_LABELS = {
  unverified_shadow_it_assets: 'Unverified shadow IT assets',
  dr_at_risk_assets: 'DR at-risk assets',
  open_critical_incidents: 'Open critical incidents',
  active_break_glass_tickets: 'Active break-glass tickets'
};

const TECHNIQUE_NAMES = {
  T1003: 'Credential Dumping',
  T1078: 'Valid Accounts',
  T1110: 'Brute Force',
  T1136: 'Create Account',
  T1567: 'Exfiltration Over Web Service',
  T1041: 'Exfiltration Over C2',
  T1530: 'Data from Cloud Storage',
  T1485: 'Data Destruction',
  T1486: 'Data Encrypted for Impact',
  T1490: 'Inhibit System Recovery'
};

export function deriveRiskPosture(aleUsd) {
  const ale = Number(aleUsd) || 0;
  if (ale >= 5_000_000) return { label: 'CRITICAL', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30' };
  if (ale >= 3_000_000) return { label: 'HIGH', color: 'text-orange-700', bg: 'bg-orange-100 dark:bg-orange-900/30' };
  if (ale >= 1_000_000) return { label: 'ELEVATED', color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/30' };
  return { label: 'MODERATE', color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
}

export function formatScenarioLabel(scenarioId) {
  if (!scenarioId) return '—';
  return SCENARIO_LABELS[scenarioId] || scenarioId.replace(/^RSK-/, '').replace(/-/g, ' ');
}

export function formatRiskDriverLabel(driver, mitreMappings = []) {
  if (!driver) return 'Unknown driver';
  if (DRIVER_LABELS[driver]) return DRIVER_LABELS[driver];

  const techniqueMatch = driver.match(/^mitre_technique_(T\d+(?:\.\d+)?)/i);
  if (techniqueMatch) {
    const technique = techniqueMatch[1].toUpperCase();
    const mapped = mitreMappings.find((m) => m.technique === technique);
    const name = mapped?.technique_name || TECHNIQUE_NAMES[technique] || technique;
    return `${name} (${technique})`;
  }

  const tacticMatch = driver.match(/^mitre_tactic_(.+)/i);
  if (tacticMatch) {
    return `MITRE tactic: ${tacticMatch[1].replace(/_/g, ' ')}`;
  }

  return driver.replace(/_/g, ' ');
}

export function trendLabel(trend) {
  if (trend === 'increasing') return { text: 'Rising', tone: 'text-red-600' };
  if (trend === 'decreasing') return { text: 'Improving', tone: 'text-green-600' };
  return { text: 'Stable', tone: 'text-gray-600' };
}
