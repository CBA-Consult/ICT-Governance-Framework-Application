'use client';

import { useState, useEffect } from 'react';

function statusBadgeClass(status) {
  if (status === 'Implemented') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
  if (status === 'Partial' || status === 'Planned') {
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  }
  return 'bg-rose-50 text-rose-700 border border-rose-200';
}

function severityClass(severity) {
  if (severity === 'CRITICAL') return 'bg-rose-100 text-rose-800';
  if (severity === 'HIGH') return 'bg-orange-100 text-orange-800';
  if (severity === 'MEDIUM') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

export default function ComplianceDashboard() {
  const [data, setData] = useState({ summary: [], controls: [], demo_mode: true, attestation_timestamp: null });
  const [incidents, setIncidents] = useState([]);
  const [fairRisk, setFairRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    Promise.all([
      fetch('/api/governance/posture', { headers }),
      fetch('/api/governance/incidents?limit=20', { headers }),
      fetch('/api/governance/risk/exposure', { headers })
    ])
      .then(async ([postureRes, incidentsRes, fairRes]) => {
        if (!postureRes.ok) {
          const body = await postureRes.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to retrieve live data from governance API.');
        }
        const payload = await postureRes.json();
        setData(payload);

        if (incidentsRes.ok) {
          const incidentPayload = await incidentsRes.json();
          setIncidents(incidentPayload.incidents || []);
        }

        if (fairRes.ok) {
          const fairPayload = await fairRes.json();
          setFairRisk(fairPayload);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-600 font-medium dark:text-slate-300">Querying framework control records...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600 font-semibold">Gate A Operational Error: {error}</p>
        <p className="text-sm text-slate-500 mt-2">Ensure you are logged in and the API server is running on port 4000.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">NIST CSF 2.0 Compliance Posture</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Live Production Environmental Baseline Verification</p>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded text-xs font-bold ${data.demo_mode ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {data.demo_mode ? 'DEMO / MOCK DATA MODE' : 'LIVE PRODUCTION ENVIRONMENT'}
          </span>
          <p className="text-xs text-slate-400 mt-1">Evaluated: {data.attestation_timestamp}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {data.summary.map((item) => (
          <div key={item.implementation_status} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.implementation_status}</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-bold text-slate-800 dark:text-white">{item.count}</span>
              <span className="text-sm text-slate-500">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">A034 Requirement Crosswalk Validation Traceability</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-gray-900 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Control ID</th>
                <th className="p-4">Framework Module</th>
                <th className="p-4">Control Title</th>
                <th className="p-4">Status</th>
                <th className="p-4">As-Built Git Reference Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-700 dark:text-slate-300">
              {data.controls.map((control) => (
                <tr key={control.control_id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                  <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{control.control_id}</td>
                  <td className="p-4 text-slate-500">{control.category}</td>
                  <td className="p-4">{control.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusBadgeClass(control.implementation_status)}`}>
                      {control.implementation_status}
                    </span>
                  </td>
                  <td className="p-4">
                    {control.code_evidence_url ? (
                      <a href={control.code_evidence_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-mono text-xs truncate max-w-xs block">
                        {control.code_evidence_url}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic text-xs">No matching codebase evidence attached (Unverified claim)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {fairRisk && (
        <div className="bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-900 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800 flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Live FAIR Risk Exposure (FR-GOV-005)</h3>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">Telemetry-driven Annualized Loss Expectancy — GV.RM quantitative layer</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-900 dark:text-white">
                ${Number(fairRisk.total_enterprise_ale_usd || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">Enterprise ALE (USD)</p>
              {fairRisk.risk_delta_24h_usd != null && fairRisk.risk_delta_24h_usd !== 0 && (
                <p className={`text-xs mt-1 font-medium ${fairRisk.risk_delta_24h_usd > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  24h: {fairRisk.risk_delta_24h_usd > 0 ? '+' : ''}
                  ${Number(fairRisk.risk_delta_24h_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  {' '}({fairRisk.risk_trend || 'stable'})
                </p>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-50 dark:bg-gray-900 text-left text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="p-4">Scenario</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Current ALE (USD)</th>
                  <th className="p-4">Last computed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {(fairRisk.scenarios || []).map((row) => (
                  <tr key={row.scenario_id}>
                    <td className="p-4 font-mono text-indigo-700 dark:text-indigo-300">{row.scenario_id}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{row.description}</td>
                    <td className="p-4 font-semibold">
                      ${Number(row.current_ale_usd || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-4 text-slate-500">
                      {row.last_computed_at ? new Date(row.last_computed_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fairRisk.total_enterprise_ale_usd === 0 && (
            <p className="p-4 text-sm text-amber-700 dark:text-amber-300">
              No FAIR sweep recorded yet. Run <code className="font-mono text-xs">npm run setup:fair-risk</code> and{' '}
              <code className="font-mono text-xs">POST /api/governance/risk/recalculate</code> (compliance.manage + JIT when enforced).
            </p>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">Live Detect &amp; Respond — Governance Incidents</h3>
          <span className="text-xs text-slate-500">{incidents.length} recorded</span>
        </div>
        {incidents.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No incidents ingested yet. POST to <code className="font-mono text-xs">/api/governance/incidents</code> from Sentinel or SIEM.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-50 dark:bg-gray-900 text-left text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Tenant</th>
                  <th className="p-4">Drift</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Correlated Asset</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4">Asset State</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Detected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {incidents.map((inc) => (
                  <tr key={inc.incident_id}>
                    <td className="p-4 font-mono">{inc.incident_id}</td>
                    <td className="p-4">{inc.tenant_name || inc.tenant_id}</td>
                    <td className="p-4 capitalize">{inc.drift_type}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${severityClass(inc.severity)}`}>{inc.severity}</span></td>
                    <td className="p-4">
                      {inc.asset_name ? (
                        <span title={inc.asset_id}>{inc.asset_name}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4">{inc.asset_provider || '—'}</td>
                    <td className="p-4">
                      {inc.asset_compliance_state ? (
                        <span className={inc.asset_compliance_state === 'NonCompliant' ? 'text-red-600 font-medium' : 'text-emerald-600'}>
                          {inc.asset_compliance_state}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-4">{inc.status}</td>
                    <td className="p-4 text-slate-500">{new Date(inc.detected_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
