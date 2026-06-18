'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { authFetch, getStoredAccessToken, parseApiError } from '../../lib/authFetch';
import {
  deriveRiskPosture,
  formatScenarioLabel,
  formatRiskDriverLabel,
  trendLabel
} from '../../lib/dashboardRiskLabels';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#06B6D4'];
const RISK_COLORS = {
  low: '#10B981',
  medium: '#F59E0B', 
  high: '#EF4444',
  critical: '#DC2626'
};

export default function CISOExecutiveDashboard({ timeRange = 30 }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, tokens } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [fairRisk, setFairRisk] = useState(null);
  const [govMetrics, setGovMetrics] = useState(null);
  const [calibration, setCalibration] = useState(null);
  const [mitreMappings, setMitreMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchExecutiveSummary = useCallback(async () => {
    const token = tokens?.accessToken || getStoredAccessToken();
    if (!token) {
      setError('No access token available. Please log in.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [summaryResponse, fairResponse, govResponse, calibrationResponse, mitreResponse] = await Promise.all([
        authFetch(`/api/secure-scores/executive-summary?timeRange=${timeRange}`),
        authFetch('/api/governance/risk/exposure'),
        authFetch(`/api/governance/executive/metrics?days=${timeRange}`),
        authFetch('/api/governance/risk/calibration?limit=10'),
        authFetch('/api/governance/mitre/mappings')
      ]);

      if (summaryResponse.ok) {
        const result = await summaryResponse.json();
        setDashboardData(result.data);
      } else {
        setDashboardData(null);
      }

      if (govResponse.ok) {
        setGovMetrics(await govResponse.json());
      } else {
        setGovMetrics(null);
      }

      if (fairResponse.ok) {
        const fairData = await fairResponse.json();
        setFairRisk({
          totalAle: Number(fairData.total_enterprise_ale_usd || 0),
          riskDelta24h: Number(fairData.risk_delta_24h_usd || 0),
          riskTrend: fairData.risk_trend || 'stable',
          scenarios: fairData.top_scenarios || fairData.scenarios || [],
          lastUpdated: fairData.last_computed_at || fairData.attestation_timestamp
        });
      } else {
        setFairRisk(null);
      }

      if (calibrationResponse.ok) {
        setCalibration(await calibrationResponse.json());
      } else {
        setCalibration(null);
      }

      if (mitreResponse.ok) {
        const mitreData = await mitreResponse.json();
        setMitreMappings(mitreData.mappings || []);
      } else {
        setMitreMappings([]);
      }

      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching CISO executive summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange, tokens]);

  const formatDuration = (ms) => {
    if (ms == null || Number.isNaN(ms)) return '—';
    const min = Math.floor(ms / 60000);
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    return `${hr}h ${min % 60}m`;
  };

  const formatRelativeTime = (iso) => {
    if (!iso) return 'Never';
    const diffMs = Date.now() - new Date(iso).getTime();
    if (diffMs < 0) return 'Just now';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 48) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 14) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  const stabilityBadgeClass = (label) => {
    if (label === 'Stable') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    if (label === 'Moderate') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace('/auth?redirect=/ciso-dashboard');
      return;
    }

    fetchExecutiveSummary();
    const interval = setInterval(fetchExecutiveSummary, 300000);
    return () => clearInterval(interval);
  }, [authLoading, isAuthenticated, fetchExecutiveSummary, router]);

  if (authLoading || (!isAuthenticated && !error)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4" />
        <span className="text-gray-500 dark:text-gray-400">Loading CISO dashboard…</span>
      </div>
    );
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="h-6 w-6 text-green-500" />;
      case 'declining':
        return <ArrowTrendingDownIcon className="h-6 w-6 text-red-500" />;
      default:
        return <MinusIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'needs_improvement': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatPercentage = (value) => `${value}%`;
  const formatScore = (value) => value.toLocaleString();
  const formatCurrency = (value) =>
    `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">Error loading CISO dashboard: {error}</p>
        <button 
          onClick={fetchExecutiveSummary}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData && !govMetrics) {
    return <div>No data available</div>;
  }

  const securityPosture = dashboardData?.securityPosture;
  const controlsStatus = dashboardData?.controlsStatus;
  const complianceOverview = dashboardData?.complianceOverview;
  const riskLandscape = dashboardData?.riskLandscape;
  const priorityActions = dashboardData?.priorityActions || [];
  const trends = dashboardData?.trends;
  const executiveAlerts = dashboardData?.executiveAlerts || [];

  const liveFair = govMetrics?.fair || fairRisk;
  const incidents = govMetrics?.incidents;
  const aleTrend = govMetrics?.charts?.ale_trend || [];
  const incidentTrend = govMetrics?.charts?.incident_trend || [];
  const riskDrivers = govMetrics?.risk_drivers || [];
  const severityChart = govMetrics?.charts?.incident_severity || [];
  const liveControls = govMetrics?.compliance;
  const calSummary = calibration?.summary;
  const scenarioDrift = calibration?.scenario_drift || [];
  const pendingApprovals = calibration?.pending_approvals || [];

  const enterpriseAle = Number(liveFair?.total_enterprise_ale_usd ?? liveFair?.totalAle ?? 0);
  const riskPosture = deriveRiskPosture(enterpriseAle);
  const riskTrendKey = liveFair?.risk_trend ?? liveFair?.riskTrend ?? 'stable';
  const riskTrendDisplay = trendLabel(riskTrendKey);

  const topScenarioRow = (liveFair?.top_scenarios || liveFair?.scenarios || [])[0];
  const topDriverRaw = riskDrivers[0];
  const driverChartData = riskDrivers.map((d) => ({
    ...d,
    displayLabel: formatRiskDriverLabel(d.driver, mitreMappings)
  }));

  return (
    <div className="space-y-6">
      {/* Header with Last Updated */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CISO Executive Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastRefresh.toLocaleString()} • Auto-refresh: 5 minutes
          </p>
          {govMetrics && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
              LIVE GOVERNANCE DATA
            </span>
          )}
          {calSummary?.model_stability && (
            <span className={`inline-block mt-1 ml-2 px-2 py-0.5 text-xs font-bold rounded ${stabilityBadgeClass(calSummary.model_stability.label)}`}>
              Model: {calSummary.model_stability.label} ({calSummary.model_stability.band})
            </span>
          )}
          {calibration?.mapping_confidence?.average != null && (
            <span className="inline-block mt-1 ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
              Confidence: {calibration.mapping_confidence.average.toFixed(2)}
            </span>
          )}
        </div>
        <button
          onClick={fetchExecutiveSummary}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <ClockIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Board summary — executive decision layer */}
      {govMetrics && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-800 dark:text-indigo-200">
              Board Risk Summary
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link href="/secops-console" className="text-indigo-700 dark:text-indigo-300 hover:underline font-medium">
                SecOps Console →
              </Link>
              <a href="#calibration-panel" className="text-indigo-700 dark:text-indigo-300 hover:underline font-medium">
                Model calibration →
              </a>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-white dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 uppercase">Risk posture</p>
              <p className={`text-2xl font-bold mt-1 ${riskPosture.color}`}>{riskPosture.label}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{formatCurrency(enterpriseAle)} enterprise ALE</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-white dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 uppercase">Top risk driver</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 line-clamp-2" title={topDriverRaw?.driver}>
                {topDriverRaw
                  ? formatRiskDriverLabel(topDriverRaw.driver, mitreMappings)
                  : '—'}
              </p>
              {topDriverRaw && (
                <p className="text-xs text-amber-700 mt-1">×{Number(topDriverRaw.peak_multiplier).toFixed(2)} peak impact</p>
              )}
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-white dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 uppercase">Most affected scenario</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                {formatScenarioLabel(topScenarioRow?.scenario_id || calSummary?.most_adjusted_scenario?.scenario_id)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {topScenarioRow?.current_ale_usd != null
                  ? formatCurrency(topScenarioRow.current_ale_usd)
                  : calSummary?.most_adjusted_scenario?.adjusted_tef != null
                    ? `TEF ${calSummary.most_adjusted_scenario.adjusted_tef.toFixed(1)}`
                    : '—'}
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-white dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 uppercase">Trend (24h)</p>
              <p className={`text-2xl font-bold mt-1 ${riskTrendDisplay.tone}`}>{riskTrendDisplay.text}</p>
              <p className="text-xs text-gray-500 mt-1">
                {incidents?.open_critical ?? 0} open CRITICAL · {incidents?.sla_breaches_open ?? 0} SLA breaches
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Executive Alerts */}
      {executiveAlerts && executiveAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BellAlertIcon className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Critical Alerts</h3>
          </div>
          <div className="space-y-2">
            {executiveAlerts.map((alert, index) => (
              <div key={index} className={`p-3 rounded-md border ${getSeverityColor(alert.severity)}`}>
                <div className="font-medium">{alert.message}</div>
                <div className="text-sm mt-1">{alert.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live SecOps + FAIR KPIs (G-A2) */}
      {incidents && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-rose-200 dark:border-rose-900">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open CRITICAL Incidents</p>
            <p className="text-3xl font-bold text-rose-600">{incidents.open_critical}</p>
            <Link href="/secops-console" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">SecOps Console →</Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-amber-200 dark:border-amber-900">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">SLA Breaches (open)</p>
            <p className="text-3xl font-bold text-amber-700">{incidents.sla_breaches_open}</p>
            <p className="text-xs text-gray-500 mt-1">{incidents.open} open total</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg MTTR (resolved)</p>
            <p className="text-3xl font-bold text-purple-600">{formatDuration(incidents.mttr_avg_ms)}</p>
            <p className="text-xs text-gray-500 mt-1">From governance_incidents</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-violet-200 dark:border-violet-900">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enterprise risk</p>
            <p className={`text-2xl font-bold ${riskPosture.color}`}>{riskPosture.label}</p>
            <p className="text-lg font-semibold text-violet-700 dark:text-violet-400">{formatCurrency(enterpriseAle)}</p>
            {(liveFair?.risk_delta_24h_usd ?? liveFair?.riskDelta24h) != null && (liveFair?.risk_delta_24h_usd ?? liveFair?.riskDelta24h) !== 0 && (
              <p className={`text-xs mt-1 ${(liveFair?.risk_delta_24h_usd ?? liveFair?.riskDelta24h) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                24h: {(liveFair?.risk_delta_24h_usd ?? liveFair?.riskDelta24h) > 0 ? '+' : ''}
                {formatCurrency(liveFair?.risk_delta_24h_usd ?? liveFair?.riskDelta24h)}
                {liveFair?.risk_trend || liveFair?.riskTrend ? ` (${liveFair.risk_trend || liveFair.riskTrend})` : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* FAIR Model Calibration — P4-F1 */}
      {calibration && (
        <div id="calibration-panel" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-teal-200 dark:border-teal-900 scroll-mt-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <InformationCircleIcon className="h-5 w-5 text-teal-600" />
                FAIR Model Calibration
                <span className="text-xs font-normal text-teal-600 dark:text-teal-400">Adaptive risk · P4</span>
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Observed incident frequency → TEF calibration factors · full audit in{' '}
                <code className="text-xs">fair_model_calibration_log</code>
              </p>
            </div>
            <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${stabilityBadgeClass(calSummary?.model_stability?.label || 'Stable')}`}>
              {calSummary?.model_stability?.label || 'Stable'} ({calSummary?.model_stability?.band || '±5%'})
            </span>
            {(calSummary?.pending_approval_count ?? pendingApprovals.length) > 0 && (
              <span className="px-2 py-1 text-xs font-bold rounded uppercase bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
                {calSummary?.pending_approval_count ?? pendingApprovals.length} pending approval
              </span>
            )}
          </div>

          {pendingApprovals.length > 0 && (
            <div className="mb-6 p-4 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-800 dark:text-rose-200 mb-3">
                Pending calibration adjustments
              </p>
              <div className="space-y-2">
                {pendingApprovals.map((item) => (
                  <div
                    key={item.approval_id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm bg-white/70 dark:bg-gray-800/70 rounded p-3"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatScenarioLabel(item.scenario_id)}
                      {' · '}
                      {Number(item.previous_value).toFixed(3)} → {Number(item.proposed_value).toFixed(3)}
                      {' '}
                      <span className="text-rose-600">
                        ({Number(item.proposed_adjustment_pct) >= 0 ? '+' : ''}{Number(item.proposed_adjustment_pct).toFixed(1)}%)
                      </span>
                    </span>
                    <span className="text-xs text-gray-500">Awaiting approval · #{item.approval_id}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Approve via POST /api/governance/risk/calibration/approve (compliance.manage)
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last calibration</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {formatRelativeTime(calSummary?.last_calibration_run)}
              </p>
              {calSummary?.last_run_by && (
                <p className="text-xs text-gray-500 mt-1">by {calSummary.last_run_by}</p>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg adjustment</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {calSummary?.avg_adjustment_pct != null
                  ? `${calSummary.avg_adjustment_pct >= 0 ? '+' : ''}${calSummary.avg_adjustment_pct.toFixed(1)}%`
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last run TEF deltas</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Most adjusted</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1 truncate" title={calSummary?.most_adjusted_scenario?.scenario_id}>
                {calSummary?.most_adjusted_scenario?.scenario_id?.replace('RSK-', '') || '—'}
              </p>
              {calSummary?.most_adjusted_scenario && (
                <p className={`text-xs mt-1 ${calSummary.most_adjusted_scenario.drift_pct >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  TEF {calSummary.most_adjusted_scenario.baseline_tef?.toFixed(1)} → {calSummary.most_adjusted_scenario.adjusted_tef?.toFixed(1)}
                  {' '}({calSummary.most_adjusted_scenario.drift_pct >= 0 ? '+' : ''}{calSummary.most_adjusted_scenario.drift_pct.toFixed(1)}%)
                </p>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">MITRE confidence</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {calibration.mapping_confidence?.average != null
                  ? calibration.mapping_confidence.average.toFixed(2)
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {calibration.mapping_confidence?.mapping_count || 0} technique mappings
              </p>
            </div>
          </div>

          {scenarioDrift.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Scenario TEF drift</p>
              <div className="space-y-2">
                {scenarioDrift.map((row) => (
                  <div
                    key={row.scenario_id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[140px]">
                      {formatScenarioLabel(row.scenario_id)}
                      {calibration.scenarios?.find((s) => s.scenario_id === row.scenario_id)?.calibration_locked && (
                        <span className="ml-2 text-xs text-slate-500">(locked)</span>
                      )}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      TEF {row.baseline_tef.toFixed(1)} → {row.adjusted_tef.toFixed(1)}
                    </span>
                    <span className={`font-semibold ${Math.abs(row.drift_pct) <= 5 ? 'text-emerald-600' : Math.abs(row.drift_pct) <= 10 ? 'text-amber-600' : 'text-orange-600'}`}>
                      {row.drift_pct >= 0 ? '+' : ''}{row.drift_pct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">×{row.tef_calibration_factor.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(calibration.recent_adjustments?.length ?? 0) > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              {calSummary?.total_adjustments_logged} adjustments logged · learning rate {calibration.parameters?.learning_rate} · max Δ/run {((calibration.parameters?.max_delta_per_run || 0.1) * 100).toFixed(0)}%
            </p>
          )}
        </div>
      )}

      {/* Key Performance Indicators */}
      {securityPosture && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Security Score */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Secure Score</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-blue-600">{formatScore(securityPosture.currentScore)}</p>
                <p className="text-lg text-gray-500">/ {formatScore(securityPosture.maxScore)}</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl font-semibold text-blue-600">{formatPercentage(securityPosture.percentage)}</span>
                {getTrendIcon(securityPosture.trend)}
                {securityPosture.scoreDelta !== 0 && (
                  <span className={`text-sm ${securityPosture.scoreDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {securityPosture.scoreDelta > 0 ? '+' : ''}{securityPosture.scoreDelta} pts
                  </span>
                )}
              </div>
            </div>
            <ShieldCheckIcon className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        {/* Projected Score */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projected Score</p>
              <p className="text-3xl font-bold text-green-600">{formatScore(securityPosture.projectedScore)}</p>
              <p className="text-lg font-semibold text-green-600">{formatPercentage(securityPosture.projectedPercentage)}</p>
              <p className="text-xs text-gray-500 mt-1">If top 5 actions implemented</p>
            </div>
            <ArrowTrendingUpIcon className="h-12 w-12 text-green-600" />
          </div>
        </div>

        {/* Controls Implementation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Controls Implemented</p>
              <p className="text-3xl font-bold text-purple-600">{formatPercentage(controlsStatus.implementationRate)}</p>
              <p className="text-sm text-gray-500">{controlsStatus.implementedControls} of {controlsStatus.totalControls}</p>
              {controlsStatus.criticalGaps > 0 && (
                <p className="text-xs text-red-600 mt-1">{controlsStatus.criticalGaps} critical gaps</p>
              )}
            </div>
            <CheckCircleIcon className="h-12 w-12 text-purple-600" />
          </div>
        </div>

        {/* Compliance Average */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Compliance Score</p>
              <p className="text-3xl font-bold text-indigo-600">{formatPercentage(complianceOverview.averageScore)}</p>
              <p className="text-sm text-gray-500">{complianceOverview.frameworks.length} frameworks</p>
              {complianceOverview.criticalFrameworks > 0 && (
                <p className="text-xs text-red-600 mt-1">{complianceOverview.criticalFrameworks} need attention</p>
              )}
            </div>
            <DocumentTextIcon className="h-12 w-12 text-indigo-600" />
          </div>
        </div>
      </div>
      )}

      {/* Live Enterprise ALE + Incident Trends */}
      {(aleTrend.length > 0 || incidentTrend.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {aleTrend.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Enterprise ALE Trend
                <span className="ml-2 text-xs font-normal text-violet-600">FAIR live</span>
              </h3>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <AreaChart data={aleTrend}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="date" stroke="#6b7280" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                    <YAxis stroke="#6b7280" tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
                    <Tooltip
                      labelFormatter={(v) => new Date(v).toLocaleString()}
                      formatter={(v) => [formatCurrency(v), 'Enterprise ALE']}
                    />
                    <Area type="monotone" dataKey="total_ale_usd" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {incidentTrend.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Incident Volume
                <span className="ml-2 text-xs font-normal text-indigo-600">SecOps live</span>
              </h3>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={incidentTrend}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="date" stroke="#6b7280" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                    <YAxis stroke="#6b7280" allowDecimals={false} />
                    <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                    <Bar dataKey="count" name="Incidents" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Score Trend Chart (Microsoft Secure Score — when available) */}
      {trends?.scoreHistory?.length > 0 && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Microsoft Secure Score Trend</h3>
          <ChartBarIcon className="h-5 w-5 text-gray-500" />
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={trends.scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => [
                  name === 'percentage' ? `${value}%` : value,
                  name === 'percentage' ? 'Score %' : 'Score'
                ]}
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.8)',
                  borderColor: '#4b5563',
                  color: '#ffffff',
                  borderRadius: '0.5rem',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="percentage" 
                stroke="#3B82F6" 
                fill="#3B82F6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* Top Risk Drivers (telemetry) */}
      {driverChartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-amber-200 dark:border-amber-900">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Risk Drivers (30d)
            </h3>
            <Link href="/secops-console" className="text-xs font-medium text-indigo-600 hover:underline">
              Investigate in SecOps →
            </Link>
          </div>
          <div style={{ width: '100%', height: Math.max(260, driverChartData.length * 36) }}>
            <ResponsiveContainer>
              <BarChart data={driverChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis type="category" dataKey="displayLabel" stroke="#6b7280" width={200} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [`×${Number(v).toFixed(2)}`, 'Peak multiplier']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.driver || label}
                />
                <Bar dataKey="peak_multiplier" name="Peak multiplier" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Risk Landscape and Compliance Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Landscape — live FAIR ALE when available */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Risk Landscape
            {liveFair && (
              <span className="ml-2 text-xs font-normal text-indigo-600 dark:text-indigo-400">FAIR live</span>
            )}
          </h3>
          {liveFair ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Enterprise ALE</p>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(liveFair.total_enterprise_ale_usd ?? liveFair.totalAle)}</p>
                {(liveFair.risk_delta_24h_usd ?? liveFair.riskDelta24h) !== 0 && (
                  <p className={`text-sm mt-1 ${(liveFair.risk_delta_24h_usd ?? liveFair.riskDelta24h) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    24h delta: {(liveFair.risk_delta_24h_usd ?? liveFair.riskDelta24h) > 0 ? '+' : ''}
                    {formatCurrency(liveFair.risk_delta_24h_usd ?? liveFair.riskDelta24h)}
                  </p>
                )}
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Top scenarios</p>
                {(liveFair.top_scenarios || liveFair.scenarios || []).slice(0, 3).map((scenario) => (
                  <Link
                    key={scenario.scenario_id}
                    href="/secops-console"
                    className="flex justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-1 -mx-1 py-0.5"
                  >
                    <span className="text-gray-700 dark:text-gray-300 truncate pr-2" title={scenario.description}>
                      {formatScenarioLabel(scenario.scenario_id)}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white shrink-0">
                      {formatCurrency(scenario.current_ale_usd)}
                    </span>
                  </Link>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Risk Trend (24h):</span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(
                    (liveFair.risk_trend ?? liveFair.riskTrend) === 'decreasing' ? 'improving' :
                    (liveFair.risk_trend ?? liveFair.riskTrend) === 'increasing' ? 'declining' : 'stable'
                  )}
                  <span className="text-sm font-medium">{liveFair.risk_trend ?? liveFair.riskTrend}</span>
                </div>
              </div>
            </>
          ) : riskLandscape ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{riskLandscape.highRiskAreas}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">High Risk Areas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{riskLandscape.mediumRiskAreas}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Medium Risk Areas</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Risk Trend:</span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(riskLandscape.riskTrend === 'decreasing' ? 'improving' : 
                               riskLandscape.riskTrend === 'increasing' ? 'declining' : 'stable')}
                  <span className={`text-sm font-medium ${
                    riskLandscape.riskTrend === 'decreasing' ? 'text-green-600' :
                    riskLandscape.riskTrend === 'increasing' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {riskLandscape.riskTrend}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">No FAIR exposure data — run setup:fair-risk and ingest an incident.</p>
          )}
        </div>

        {/* Compliance — live NIST controls from PostgreSQL */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Governance Controls
            {liveControls?.total > 0 && (
              <span className="ml-2 text-xs font-normal text-emerald-600">live</span>
            )}
          </h3>
          {liveControls?.total > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div><p className="text-2xl font-bold text-emerald-600">{liveControls.implemented}</p><p className="text-xs text-gray-500">Implemented</p></div>
                <div><p className="text-2xl font-bold text-amber-600">{liveControls.partial}</p><p className="text-xs text-gray-500">Partial</p></div>
                <div><p className="text-2xl font-bold text-rose-600">{liveControls.gaps}</p><p className="text-xs text-gray-500">Gap</p></div>
              </div>
              {severityChart.length > 0 && (
                <div style={{ width: '100%', height: 160 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={severityChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={(e) => e.name}>
                        {severityChart.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-center text-gray-500">Incidents by severity</p>
                </div>
              )}
            </>
          ) : complianceOverview ? (
          <div className="space-y-3">
            {complianceOverview.frameworks.slice(0, 5).map((framework, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{framework.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatPercentage(framework.score)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(framework.status)}`}>
                    {framework.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <p className="text-sm text-gray-500">No compliance control records.</p>
          )}
        </div>
      </div>

      {/* Priority Incidents (live) or Secure Score actions */}
      {(incidents?.priority_incidents?.length > 0 || priorityActions.length > 0) && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {incidents?.priority_incidents?.length > 0 ? 'Open CRITICAL Incidents' : 'Top Priority Actions'}
        </h3>
        <div className="space-y-4">
          {incidents?.priority_incidents?.length > 0 ? incidents.priority_incidents.map((inc, index) => (
            <Link
              key={inc.incident_id}
              href="/secops-console"
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="flex items-center justify-center w-6 h-6 bg-rose-600 text-white text-xs font-bold rounded-full shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">#{inc.incident_id} — {inc.mitre_technique || inc.status}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{inc.description}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                {inc.sla_breached && (
                  <span className="text-xs font-bold text-rose-600">SLA BREACH</span>
                )}
                <div className="text-xs text-gray-500">{new Date(inc.detected_at).toLocaleDateString()}</div>
              </div>
            </Link>
          )) : priorityActions.map((action, index) => (
            <div key={action.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{action.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{action.category}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  action.priority === 'high' ? 'text-red-600 bg-red-100' :
                  action.priority === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                  'text-blue-600 bg-blue-100'
                }`}>
                  {action.priority} priority
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  +{action.estimatedImprovement}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Governance metrics: live API • FAIR + incidents + telemetry
          {govMetrics?.attestation_timestamp && ` • ${new Date(govMetrics.attestation_timestamp).toLocaleString()}`}
        </p>
      </div>
    </div>
  );
}