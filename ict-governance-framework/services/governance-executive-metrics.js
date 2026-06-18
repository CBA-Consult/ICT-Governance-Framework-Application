/**
 * G-A2 — Live executive metrics from governance incidents, FAIR, and telemetry
 */
const { Pool } = require('pg');
const { getFairExposureSummary } = require('./fair-risk-engine');
const { enrichIncidentWithSla } = require('./governance-sla');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getIncidentMetrics(client, days) {
  const windowDays = Math.min(Math.max(parseInt(days, 10) || 30, 7), 365);

  let incidents = [];
  try {
    const { rows } = await client.query(
      `
      SELECT gi.*, t.name AS tenant_name
      FROM governance_incidents gi
      LEFT JOIN tenants t ON gi.tenant_id = t.tenant_id
      ORDER BY gi.detected_at DESC
      LIMIT 500
      `
    );
    incidents = rows.map(enrichIncidentWithSla);
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  const open = incidents.filter((i) => i.status !== 'Resolved');
  const openCritical = open.filter((i) => i.severity === 'CRITICAL');
  const slaBreachesOpen = open.filter((i) => i.sla_breached || i.sla_ack_breached || i.sla_mttr_breached);

  const resolved = incidents.filter((i) => i.status === 'Resolved' && i.time_to_resolve_ms != null);
  const mttrAvgMs = resolved.length
    ? Math.round(resolved.reduce((s, i) => s + i.time_to_resolve_ms, 0) / resolved.length)
    : null;

  const bySeverity = {};
  const byStatus = {};
  for (const inc of incidents) {
    bySeverity[inc.severity] = (bySeverity[inc.severity] || 0) + 1;
    byStatus[inc.status] = (byStatus[inc.status] || 0) + 1;
  }

  let trendRows = [];
  try {
    const trend = await client.query(
      `
      SELECT date_trunc('day', detected_at) AS day, COUNT(*)::int AS count
      FROM governance_incidents
      WHERE detected_at >= NOW() - ($1 || ' days')::interval
      GROUP BY 1
      ORDER BY 1 ASC
      `,
      [windowDays]
    );
    trendRows = trend.rows.map((r) => ({
      date: r.day,
      count: r.count
    }));
  } catch (err) {
    if (err.code !== '42P01') throw err;
  }

  const priorityIncidents = openCritical.slice(0, 5).map((inc) => ({
    incident_id: inc.incident_id,
    severity: inc.severity,
    status: inc.status,
    description: inc.description,
    detected_at: inc.detected_at,
    fair_scenario_id: inc.fair_scenario_id,
    mitre_technique: inc.mitre_technique,
    sla_breached: inc.sla_breached || inc.sla_ack_breached || inc.sla_mttr_breached
  }));

  return {
    total: incidents.length,
    open: open.length,
    open_critical: openCritical.length,
    sla_breaches_open: slaBreachesOpen.length,
    mttr_avg_ms: mttrAvgMs,
    by_severity: bySeverity,
    by_status: byStatus,
    incident_trend: trendRows,
    priority_incidents: priorityIncidents
  };
}

async function getAleHistory(client, days) {
  const windowDays = Math.min(Math.max(parseInt(days, 10) || 30, 7), 365);
  try {
    const { rows } = await client.query(
      `
      SELECT total_ale_usd, recorded_at
      FROM fair_risk_enterprise_history
      WHERE recorded_at >= NOW() - ($1 || ' days')::interval
      ORDER BY recorded_at ASC
      `,
      [windowDays]
    );
    return rows.map((r) => ({
      date: r.recorded_at,
      total_ale_usd: parseFloat(r.total_ale_usd),
      total_ale_millions: parseFloat(r.total_ale_usd) / 1_000_000
    }));
  } catch (err) {
    if (err.code === '42P01') return [];
    throw err;
  }
}

async function getTopRiskDrivers(client, limit = 8) {
  try {
    const { rows } = await client.query(
      `
      SELECT driver, scenario_id,
             MAX(multiplier_applied) AS peak_multiplier,
             COUNT(*)::int AS event_count,
             MAX(recorded_at) AS last_seen
      FROM fair_risk_telemetry_log
      WHERE recorded_at >= NOW() - INTERVAL '30 days'
      GROUP BY driver, scenario_id
      ORDER BY peak_multiplier DESC, event_count DESC
      LIMIT $1
      `,
      [limit]
    );
    return rows.map((r) => ({
      driver: r.driver,
      scenario_id: r.scenario_id,
      peak_multiplier: parseFloat(r.peak_multiplier),
      event_count: r.event_count,
      last_seen: r.last_seen
    }));
  } catch (err) {
    if (err.code === '42P01') return [];
    throw err;
  }
}

async function getCompliancePostureSummary(client) {
  try {
    const summary = await client.query(`
      SELECT implementation_status, COUNT(*)::int AS count
      FROM compliance_controls
      GROUP BY implementation_status
    `);
    const controls = await client.query(`
      SELECT control_id, name, implementation_status, framework
      FROM compliance_controls
      ORDER BY control_id
    `);
    const gapCount = summary.rows.find((r) => r.implementation_status === 'Gap')?.count || 0;
    const partialCount = summary.rows.find((r) => r.implementation_status === 'Partial')?.count || 0;
    const implementedCount = summary.rows.find((r) => r.implementation_status === 'Implemented')?.count || 0;
    const total = summary.rows.reduce((s, r) => s + r.count, 0);
    return {
      total,
      implemented: implementedCount,
      partial: partialCount,
      gaps: gapCount,
      summary: summary.rows,
      controls: controls.rows
    };
  } catch (err) {
    if (err.code === '42P01') return { total: 0, implemented: 0, partial: 0, gaps: 0, summary: [], controls: [] };
    throw err;
  }
}

async function getExecutiveMetrics({ days = 30 } = {}) {
  const client = await pool.connect();
  try {
    const [fair, incidents, aleHistory, riskDrivers, compliance] = await Promise.all([
      getFairExposureSummary().catch(() => null),
      getIncidentMetrics(client, days),
      getAleHistory(client, days),
      getTopRiskDrivers(client),
      getCompliancePostureSummary(client)
    ]);

    const scenarioChart = (fair?.scenarios || []).slice(0, 5).map((s) => ({
      name: s.scenario_id,
      ale_usd: parseFloat(s.current_ale_usd || 0),
      description: s.description
    }));

    const severityChart = Object.entries(incidents.by_severity || {}).map(([name, value]) => ({
      name,
      value
    }));

    return {
      demo_mode: false,
      data_sources: [
        'governance_incidents',
        'fair_risk_scenarios',
        'fair_risk_enterprise_history',
        'fair_risk_telemetry_log',
        'compliance_controls'
      ],
      incidents,
      fair: fair
        ? {
            total_enterprise_ale_usd: fair.total_enterprise_ale_usd,
            risk_delta_24h_usd: fair.risk_delta_24h_usd,
            risk_trend: fair.risk_trend,
            last_computed_at: fair.last_computed_at,
            top_scenarios: fair.top_scenarios || fair.scenarios?.slice(0, 5) || [],
            scenario_chart: scenarioChart
          }
        : null,
      ale_history: aleHistory,
      risk_drivers: riskDrivers,
      compliance,
      charts: {
        ale_trend: aleHistory,
        incident_trend: incidents.incident_trend,
        scenario_ale: scenarioChart,
        incident_severity: severityChart
      },
      attestation_timestamp: new Date().toISOString()
    };
  } finally {
    client.release();
  }
}

module.exports = {
  getExecutiveMetrics,
  getIncidentMetrics,
  getAleHistory,
  getTopRiskDrivers
};
