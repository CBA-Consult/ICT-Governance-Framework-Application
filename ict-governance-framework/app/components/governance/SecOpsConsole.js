'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { authFetch, parseApiError } from '../../lib/authFetch';

const NEXT_TRANSITIONS = {
  Detected: 'Acknowledged',
  Acknowledged: 'Remediating',
  Remediating: 'Resolved'
};

function formatTs(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function formatDuration(ms) {
  if (ms == null || Number.isNaN(ms)) return '—';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ${sec % 60}s`;
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m`;
}

function formatUsd(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function severityClass(severity) {
  if (severity === 'CRITICAL') return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200';
  if (severity === 'HIGH') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
  if (severity === 'MEDIUM') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

function statusClass(status) {
  if (status === 'Resolved') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
  if (status === 'Remediating') return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200';
  if (status === 'Acknowledged') return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200';
  return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
}

function mitreTacticClass(tactic) {
  const t = String(tactic || '').toLowerCase();
  if (t.includes('credential')) {
    return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700';
  }
  if (t.includes('exfil') || t.includes('collection')) {
    return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700';
  }
  if (t.includes('impact') || t.includes('denial')) {
    return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700';
  }
  if (t.includes('lateral') || t.includes('privilege') || t.includes('persistence')) {
    return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700';
  }
  return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700';
}

function MitreBadge({ tactic, technique, techniqueName, compact = false }) {
  if (!tactic && !technique) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${mitreTacticClass(tactic)}`}
      title={techniqueName || tactic || technique}
    >
      {technique && <span className="font-mono">{technique}</span>}
      {!compact && tactic && <span className="opacity-80">{tactic}</span>}
    </span>
  );
}

function timelineGroupKey(entry) {
  if (entry.event === 'status_change') {
    return `status_change:${entry.from}:${entry.to}`;
  }
  return entry.event;
}

function compressTimeline(entries) {
  if (!entries?.length) return [];
  const result = [];
  let i = 0;
  while (i < entries.length) {
    const entry = entries[i];
    const key = timelineGroupKey(entry);
    let j = i + 1;
    while (j < entries.length && timelineGroupKey(entries[j]) === key) {
      j += 1;
    }
    const count = j - i;
    if (count >= 3 && (entry.event === 'status_change' || entry.event === 'risk_updated')) {
      result.push({
        compressed: true,
        event: entry.event,
        count,
        entries: entries.slice(i, j),
        recorded_at: entries[i].recorded_at
      });
    } else {
      for (let k = i; k < j; k += 1) {
        result.push(entries[k]);
      }
    }
    i = j;
  }
  return result;
}

function pickTopRiskDriver(telemetryEntries) {
  if (!telemetryEntries?.length) return null;
  const ranked = [...telemetryEntries].sort((a, b) => {
    const multDiff = parseFloat(b.multiplier_applied || 0) - parseFloat(a.multiplier_applied || 0);
    if (multDiff !== 0) return multDiff;
    const weightDiff = parseFloat(b.raw_value || 0) - parseFloat(a.raw_value || 0);
    if (weightDiff !== 0) return weightDiff;
    return new Date(b.recorded_at) - new Date(a.recorded_at);
  });
  return ranked[0];
}

function SlaBadge({ incident }) {
  if (incident.sla_breached || incident.sla_ack_breached || incident.sla_mttr_breached) {
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white">SLA BREACH</span>;
  }
  if (incident.status === 'Resolved') {
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">SLA OK</span>;
  }
  return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">IN SLA</span>;
}

function TimelineEvent({ entry, expanded, onToggle }) {
  if (entry.compressed) {
    const label = entry.event.replace(/_/g, ' ');
    return (
      <li className="border-l-2 border-slate-400 pl-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600"
        >
          {entry.count} × {label}
          <span className="ml-2 text-[10px] font-normal text-slate-500">
            {formatTs(entry.entries[0].recorded_at)} → {formatTs(entry.entries[entry.entries.length - 1].recorded_at)}
          </span>
          <span className="ml-2 text-[10px] text-indigo-600">{expanded ? 'collapse' : 'expand'}</span>
        </button>
        {expanded && (
          <ul className="mt-2 space-y-1 ml-2">
            {entry.entries.map((child, idx) => (
              <TimelineEvent key={`${entry.event}-expanded-${idx}`} entry={child} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const base = 'border-l-2 pl-3 py-2';
  let border = 'border-slate-300 dark:border-slate-600';
  if (entry.event === 'risk_updated') border = 'border-violet-500';
  if (entry.event === 'incident_detected') border = 'border-rose-500';
  if (entry.event === 'status_change') border = 'border-sky-500';

  return (
    <li className={`${base} ${border}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          {entry.event.replace(/_/g, ' ')}
        </span>
        <span className="text-[10px] text-slate-500">{formatTs(entry.recorded_at)}</span>
      </div>
      {entry.event === 'incident_detected' && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
          <span>Severity {entry.severity}</span>
          {entry.mitre && (
            <MitreBadge
              tactic={entry.mitre.tactic}
              technique={entry.mitre.technique}
              techniqueName={entry.mitre.technique_name}
            />
          )}
        </p>
      )}
      {entry.event === 'status_change' && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          {entry.from} → <span className="font-semibold">{entry.to}</span>
        </p>
      )}
      {entry.event === 'risk_updated' && (
        <p className="text-xs text-violet-800 dark:text-violet-300 mt-1 font-mono">
          ALE {formatUsd(entry.ale_before_usd)} → {formatUsd(entry.ale_after_usd)}
          <span className={`ml-2 ${(entry.risk_delta_usd || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            Δ {formatUsd(entry.risk_delta_usd)}
          </span>
        </p>
      )}
      {entry.correlation_id && (
        <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate" title={entry.correlation_id}>
          {entry.correlation_id}
        </p>
      )}
    </li>
  );
}

function RiskImpactPanel({ timeline, topDriver, fairScenarioId, enterpriseTrend }) {
  const riskEvents = (timeline?.timeline || []).filter((e) => e.event === 'risk_updated');
  const ingestRisk = riskEvents.find((e) => e.trigger_source === 'incident');
  const resolveRisk = riskEvents.find((e) => e.trigger_source === 'incident_resolved');
  const netDelta = riskEvents.reduce((sum, e) => sum + (Number(e.risk_delta_usd) || 0), 0);

  if (riskEvents.length === 0 && !topDriver) {
    return <p className="text-sm text-slate-500">No FAIR risk_updated events on this timeline yet.</p>;
  }

  return (
    <div className="space-y-3 text-sm">
      {enterpriseTrend && (
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 text-xs">
          <span className="text-slate-500">Enterprise 24h trend: </span>
          <span className={`font-bold ${enterpriseTrend.delta >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {enterpriseTrend.delta >= 0 ? '+' : ''}{formatUsd(enterpriseTrend.delta)}
          </span>
          <span className="text-slate-500 ml-1">({enterpriseTrend.trend})</span>
        </div>
      )}
      {topDriver && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 uppercase">Top risk driver</p>
          <p className="font-mono mt-1 text-sm text-amber-950 dark:text-amber-100">{topDriver.driver}</p>
          <p className="text-[10px] text-amber-800 dark:text-amber-300 mt-1">
            Scenario {topDriver.scenario_id} · multiplier ×{Number(topDriver.multiplier_applied).toFixed(2)}
            {topDriver.raw_value != null ? ` · signal ${topDriver.raw_value}` : ''}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 italic">
            Selected by highest multiplier impact on this correlation_id
          </p>
        </div>
      )}
      {fairScenarioId && (
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Linked FAIR scenario: <span className="font-mono font-semibold">{fairScenarioId}</span>
        </p>
      )}
      {ingestRisk && (
        <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
          <p className="text-xs font-semibold text-violet-800 dark:text-violet-200 uppercase">On detection</p>
          <p className="font-mono mt-1">
            {formatUsd(ingestRisk.ale_before_usd)} → {formatUsd(ingestRisk.ale_after_usd)}
            <span className="text-rose-600 dark:text-rose-400 ml-2">+{formatUsd(ingestRisk.risk_delta_usd)}</span>
          </p>
        </div>
      )}
      {resolveRisk && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 uppercase">On resolution</p>
          <p className="font-mono mt-1">
            {formatUsd(resolveRisk.ale_before_usd)} → {formatUsd(resolveRisk.ale_after_usd)}
            <span className="text-emerald-700 dark:text-emerald-300 ml-2">{formatUsd(resolveRisk.risk_delta_usd)}</span>
          </p>
        </div>
      )}
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Net enterprise ALE movement across incident:{' '}
        <span className={`font-bold ${netDelta >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {netDelta >= 0 ? '+' : ''}{formatUsd(netDelta)}
        </span>
      </p>
    </div>
  );
}

export default function SecOpsConsole() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('compliance.manage');

  const [incidents, setIncidents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [patching, setPatching] = useState(false);
  const [error, setError] = useState(null);
  const [timelineError, setTimelineError] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTactic, setFilterTactic] = useState('');
  const [filterScenario, setFilterScenario] = useState('');
  const [fairExposure, setFairExposure] = useState(null);
  const [incidentTelemetry, setIncidentTelemetry] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/governance/incidents?limit=100');
      if (!res.ok) throw new Error(await parseApiError(res, 'Failed to load incidents'));
      const data = await res.json();
      setIncidents(data.incidents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    authFetch('/api/governance/risk/exposure')
      .then(async (res) => {
        if (res.ok) setFairExposure(await res.json());
      })
      .catch(() => {});
  }, []);

  const loadTimeline = useCallback(async (incidentId, correlationId) => {
    if (!incidentId) return;
    setTimelineLoading(true);
    setTimelineError(null);
    setIncidentTelemetry([]);
    setExpandedGroups({});
    try {
      const telemetryUrl = correlationId
        ? `/api/governance/risk/telemetry-log?correlation_id=${encodeURIComponent(correlationId)}&limit=20`
        : null;
      const [timelineRes, telemetryRes] = await Promise.all([
        authFetch(`/api/governance/incidents/${incidentId}/timeline`),
        telemetryUrl ? authFetch(telemetryUrl) : Promise.resolve(null)
      ]);
      if (!timelineRes.ok) {
        const message = await parseApiError(timelineRes, 'Failed to load timeline');
        if (timelineRes.status === 404) {
          throw new Error(
            'Timeline API not found — restart the API server (npm run server) to load Sprint B routes.'
          );
        }
        throw new Error(message);
      }
      const data = await timelineRes.json();
      setTimeline(data);
      if (telemetryRes?.ok) {
        const telemetryPayload = await telemetryRes.json();
        setIncidentTelemetry(telemetryPayload.entries || []);
      }
    } catch (err) {
      setTimelineError(err.message);
      setTimeline(null);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  useEffect(() => {
    if (selectedId) {
      const inc = incidents.find((i) => i.incident_id === selectedId);
      loadTimeline(selectedId, inc?.correlation_id);
    } else {
      setTimeline(null);
      setIncidentTelemetry([]);
    }
  }, [selectedId, incidents, loadTimeline]);

  const filterOptions = useMemo(() => {
    const tactics = new Set();
    const scenarios = new Set();
    incidents.forEach((inc) => {
      if (inc.mitre_tactic) tactics.add(inc.mitre_tactic);
      if (inc.fair_scenario_id) scenarios.add(inc.fair_scenario_id);
    });
    return {
      tactics: [...tactics].sort(),
      scenarios: [...scenarios].sort()
    };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (filterSeverity && inc.severity !== filterSeverity) return false;
      if (filterStatus && inc.status !== filterStatus) return false;
      if (filterTactic && inc.mitre_tactic !== filterTactic) return false;
      if (filterScenario && inc.fair_scenario_id !== filterScenario) return false;
      return true;
    });
  }, [incidents, filterSeverity, filterStatus, filterTactic, filterScenario]);

  const selectedIncident = incidents.find((i) => i.incident_id === selectedId) || null;
  const openCritical = incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'Resolved').length;
  const slaBreaches = incidents.filter((i) => i.sla_breached && i.status !== 'Resolved').length;

  const handleTransition = async (nextStatus) => {
    if (!selectedId || !canManage) return;
    setPatching(true);
    setError(null);
    try {
      const body = { status: nextStatus };
      if (nextStatus === 'Resolved' && resolutionNotes.trim()) {
        body.resolutionNotes = resolutionNotes.trim();
      }
      const res = await authFetch(`/api/governance/incidents/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Lifecycle transition failed'));
      setResolutionNotes('');
      await loadIncidents();
      await loadTimeline(selectedId, selectedIncident?.correlation_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setPatching(false);
    }
  };

  const nextStatus = selectedIncident ? NEXT_TRANSITIONS[selectedIncident.status] : null;
  const topRiskDriver = pickTopRiskDriver(incidentTelemetry);
  const compressedTimeline = useMemo(
    () => compressTimeline(timeline?.timeline || []),
    [timeline]
  );
  const enterpriseTrend = fairExposure
    ? {
        delta: fairExposure.risk_delta_24h_usd,
        trend: fairExposure.risk_trend
      }
    : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SecOps Console</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Incident queue, MITRE context, FAIR risk impact, and forensic IR timeline — live from governance API.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <p className="text-xs text-slate-500 uppercase font-semibold">Open incidents</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {incidents.filter((i) => i.status !== 'Resolved').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-900 rounded-lg p-3">
          <p className="text-xs text-rose-600 uppercase font-semibold">Open CRITICAL</p>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{openCritical}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
          <p className="text-xs text-amber-700 uppercase font-semibold">SLA breaches (open)</p>
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">{slaBreaches}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-900 rounded-lg p-3">
          <p className="text-xs text-violet-600 uppercase font-semibold">Enterprise ALE (24h)</p>
          <p className={`text-lg font-bold ${(fairExposure?.risk_delta_24h_usd || 0) >= 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
            {fairExposure
              ? `${fairExposure.risk_delta_24h_usd >= 0 ? '+' : ''}${formatUsd(fairExposure.risk_delta_24h_usd)}`
              : '—'}
          </p>
          <p className="text-[10px] text-slate-500">{fairExposure?.risk_trend || 'loading…'}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-end bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <label className="text-xs">
          <span className="block text-slate-500 mb-1">Severity</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 dark:bg-gray-900"
          >
            <option value="">All</option>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="block text-slate-500 mb-1">Status</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 dark:bg-gray-900"
          >
            <option value="">All</option>
            {['Detected', 'Acknowledged', 'Remediating', 'Resolved'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="block text-slate-500 mb-1">MITRE tactic</span>
          <select
            value={filterTactic}
            onChange={(e) => setFilterTactic(e.target.value)}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 dark:bg-gray-900 min-w-[10rem]"
          >
            <option value="">All</option>
            {filterOptions.tactics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="block text-slate-500 mb-1">FAIR scenario</span>
          <select
            value={filterScenario}
            onChange={(e) => setFilterScenario(e.target.value)}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 dark:bg-gray-900 min-w-[10rem]"
          >
            <option value="">All</option>
            {filterOptions.scenarios.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setFilterSeverity('');
            setFilterStatus('');
            setFilterTactic('');
            setFilterScenario('');
          }}
          className="text-xs text-indigo-600 font-semibold px-2 py-1"
        >
          Clear filters
        </button>
        <button
          type="button"
          onClick={loadIncidents}
          className="text-xs text-indigo-600 font-semibold px-2 py-1 ml-auto"
        >
          Refresh
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <section className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Incident Queue</h2>
          </div>
          {loading ? (
            <p className="p-4 text-sm text-gray-500">Loading incidents…</p>
          ) : filteredIncidents.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No incidents match the current filters.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[32rem] overflow-y-auto">
              {filteredIncidents.map((inc) => (
                <li key={inc.incident_id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(inc.incident_id)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 ${
                      selectedId === inc.incident_id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold">#{inc.incident_id}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${severityClass(inc.severity)}`}>
                        {inc.severity}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusClass(inc.status)}`}>
                        {inc.status}
                      </span>
                      <SlaBadge incident={inc} />
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 line-clamp-2">{inc.description}</p>
                    <div className="flex flex-wrap gap-2 mt-1 items-center">
                      <MitreBadge
                        tactic={inc.mitre_tactic}
                        technique={inc.mitre_technique}
                        compact
                      />
                      {inc.fair_scenario_id && (
                        <span className="text-[10px] font-mono text-slate-500">{inc.fair_scenario_id}</span>
                      )}
                      <span className="text-[10px] text-slate-500">{formatTs(inc.detected_at)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-3 space-y-4">
          {!selectedIncident ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-sm text-slate-500">
              Select an incident to view timeline, SLA metrics, and FAIR risk impact.
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Incident #{selectedIncident.incident_id}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedIncident.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${severityClass(selectedIncident.severity)}`}>
                      {selectedIncident.severity}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${statusClass(selectedIncident.status)}`}>
                      {selectedIncident.status}
                    </span>
                    <SlaBadge incident={selectedIncident} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mt-4 text-xs">
                  <div>
                    <p className="text-slate-500">MITRE</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <MitreBadge
                        tactic={selectedIncident.mitre_tactic}
                        technique={selectedIncident.mitre_technique}
                        techniqueName={selectedIncident.mitre_technique_name}
                      />
                      {!selectedIncident.mitre_technique && !selectedIncident.mitre_tactic && (
                        <span className="font-mono text-slate-400">—</span>
                      )}
                    </div>
                    {selectedIncident.mitre_technique_name && (
                      <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedIncident.mitre_technique_name}</p>
                    )}
                    {selectedIncident.mitre_severity_weight && (
                      <p className="text-[10px] text-violet-700 dark:text-violet-300 mt-1">
                        FAIR weight ×{Number(selectedIncident.mitre_severity_weight).toFixed(2)}
                        {selectedIncident.mitre_mapping_confidence != null && (
                          <span className="text-slate-500"> · confidence {Number(selectedIncident.mitre_mapping_confidence).toFixed(2)}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-slate-500">FAIR scenario</p>
                    <p className="font-mono">{selectedIncident.fair_scenario_id || timeline?.fair_scenario_id || '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Correlation ID</p>
                    <p className="font-mono truncate" title={selectedIncident.correlation_id}>
                      {selectedIncident.correlation_id || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">External ticket</p>
                    <p className="font-mono">{selectedIncident.external_ticket_id || '—'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-slate-500">Correlated asset</p>
                    {selectedIncident.asset_id ? (
                      <Link
                        href={`/asset-register?highlight=${encodeURIComponent(selectedIncident.asset_id)}`}
                        className="inline-flex items-center gap-1 font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {selectedIncident.asset_name || selectedIncident.asset_id}
                        {selectedIncident.asset_compliance_state
                          ? ` (${selectedIncident.asset_compliance_state})`
                          : ''}
                        <span className="text-[10px]">→ Asset Register</span>
                      </Link>
                    ) : (
                      <p className="font-mono">—</p>
                    )}
                  </div>
                </div>

                {canManage && nextStatus && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-end">
                    {nextStatus === 'Resolved' && (
                      <label className="flex-1 min-w-[12rem] text-xs">
                        <span className="block text-slate-500 mb-1">Resolution notes</span>
                        <input
                          type="text"
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Containment complete…"
                          className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 dark:bg-gray-900"
                        />
                      </label>
                    )}
                    <button
                      type="button"
                      disabled={patching}
                      onClick={() => handleTransition(nextStatus)}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                    >
                      {patching ? 'Updating…' : `→ ${nextStatus}`}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">SLA Tracking</h3>
                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Time to acknowledge</dt>
                      <dd className="font-mono">{formatDuration(selectedIncident.time_to_acknowledge_ms)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Time to resolve</dt>
                      <dd className="font-mono">{formatDuration(selectedIncident.time_to_resolve_ms)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Ack SLA target</dt>
                      <dd className="font-mono">
                        {formatDuration(selectedIncident.sla_targets?.ticketToAckMs)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">MTTR SLA target</dt>
                      <dd className="font-mono">
                        {formatDuration(selectedIncident.sla_targets?.mttrMs)}
                      </dd>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <dt className="text-slate-500">Ack breached</dt>
                      <dd className={selectedIncident.sla_ack_breached ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                        {selectedIncident.sla_ack_breached ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">MTTR breached</dt>
                      <dd className={selectedIncident.sla_mttr_breached ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                        {selectedIncident.sla_mttr_breached ? 'Yes' : 'No'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-900 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Risk Impact (FAIR)</h3>
                  {timelineLoading ? (
                    <p className="text-sm text-slate-500">Loading risk events…</p>
                  ) : (
                    <RiskImpactPanel
                      timeline={timeline}
                      topDriver={topRiskDriver}
                      fairScenarioId={selectedIncident.fair_scenario_id || timeline?.fair_scenario_id}
                      enterpriseTrend={enterpriseTrend}
                    />
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                  IR Timeline
                  {timeline?.event_count != null && (
                    <span className="ml-2 text-xs font-normal text-slate-500">({timeline.event_count} events)</span>
                  )}
                </h3>
                {timelineError && (
                  <div className="mb-3 rounded border border-red-200 bg-red-50 dark:bg-red-900/20 p-2 text-xs text-red-800 dark:text-red-200">
                    {timelineError}
                  </div>
                )}
                {timelineLoading ? (
                  <p className="text-sm text-slate-500">Loading timeline…</p>
                ) : !timeline?.timeline?.length ? (
                  <p className="text-sm text-slate-500">No timeline events recorded.</p>
                ) : (
                  <ul className="space-y-1 max-h-80 overflow-y-auto">
                    {compressedTimeline.map((entry, idx) => (
                      <TimelineEvent
                        key={entry.compressed ? `compressed-${idx}` : (entry.id || `${entry.event}-${idx}`)}
                        entry={entry}
                        expanded={Boolean(expandedGroups[idx])}
                        onToggle={() => setExpandedGroups((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
