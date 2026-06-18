'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
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
import DrillDownModal from './DrillDownModal';
import { authFetch, getStoredAccessToken } from '../../lib/authFetch';
import { deriveRiskPosture, formatRiskDriverLabel, formatScenarioLabel, trendLabel } from '../../lib/dashboardRiskLabels';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function ExecutiveDashboard({ timeRange = 30, onDrillDown }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [govMetrics, setGovMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [drillDownData, setDrillDownData] = useState(null);
  const [showDrillDown, setShowDrillDown] = useState(false);

  const fetchExecutiveDashboardData = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setError('No access token available. Please log in.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [legacyResponse, govResponse] = await Promise.all([
        fetch(`http://localhost:4000/api/data-processing/dashboard-data?dashboard_type=executive&time_range_days=${timeRange}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => null),
        authFetch(`/api/governance/executive/metrics?days=${timeRange}`)
      ]);

      if (legacyResponse?.ok) {
        const result = await legacyResponse.json();
        setDashboardData(result.data);
      } else {
        setDashboardData(null);
      }

      if (govResponse.ok) {
        setGovMetrics(await govResponse.json());
        setError(null);
      } else {
        setGovMetrics(null);
        const apiErr = await govResponse.text().catch(() => '');
        setError(`Failed to load governance metrics (${govResponse.status})${apiErr ? `: ${apiErr.slice(0, 120)}` : ''}`);
      }
    } catch (err) {
      console.error('Error fetching executive dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchExecutiveDashboardData();
  }, [fetchExecutiveDashboardData]);

  const handleMetricClick = async (metricName, metricData) => {
    try {
      setSelectedMetric(metricName);
      const token = localStorage.getItem('token');
      
      // Fetch detailed drill-down data
      // Calculate dates on client side only
      let startDate = '';
      let endDate = '';
      if (typeof window !== 'undefined') {
        startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString();
        endDate = new Date().toISOString();
      }
      const response = await fetch('/api/data-analytics/multidimensional-analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: [metricName],
          time_range: {
            start_date: startDate,
            end_date: endDate
          },
          dimensions: ['department', 'category', 'priority']
        })
      });

      if (response.ok) {
        const result = await response.json();
        setDrillDownData(result.data);
        setShowDrillDown(true);
      }
    } catch (err) {
      console.error('Error fetching drill-down data:', err);
    }
  };

  const formatValue = (value, type = 'number') => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'time':
        return `${value}h`;
      default:
        return typeof value === 'number' ? value.toLocaleString() : value;
    }
  };

  const getTrendIcon = (trend) => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'increasing':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'decreasing':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 bg-yellow-500 rounded-full" />;
    }
  };

  const getStatusColor = (currentValue, targetValue) => {
    if (!targetValue || !currentValue) return 'text-gray-500';
    
    const ratio = currentValue / targetValue;
    if (ratio >= 1) return 'text-green-600';
    if (ratio >= 0.9) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (value) => {
    if (value == null || Number.isNaN(Number(value))) return 'N/A';
    const n = Number(value);
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  const formatDuration = (ms) => {
    if (ms == null || Number.isNaN(ms)) return 'N/A';
    const min = Math.floor(ms / 60000);
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    return `${hr}h ${min % 60}m`;
  };

  const complianceRate = useMemo(() => {
    const c = govMetrics?.compliance;
    if (!c?.total) return null;
    return Math.round((c.implemented / c.total) * 100);
  }, [govMetrics]);

  const complianceByFramework = useMemo(() => {
    const controls = govMetrics?.compliance?.controls || [];
    const byFramework = {};
    for (const control of controls) {
      const fw = control.framework || 'Other';
      if (!byFramework[fw]) byFramework[fw] = { framework: fw, total: 0, implemented: 0 };
      byFramework[fw].total += 1;
      if (control.implementation_status === 'Implemented') byFramework[fw].implemented += 1;
    }
    return Object.values(byFramework).map((row) => ({
      framework: row.framework,
      compliance: row.total ? Math.round((row.implemented / row.total) * 100) : 0,
      target: 90
    }));
  }, [govMetrics]);

  const aleTrendData = useMemo(() => {
    return (govMetrics?.ale_history || []).map((row) => ({
      date: new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      ale_millions: row.total_ale_millions ?? Number(row.total_ale_usd || 0) / 1_000_000
    }));
  }, [govMetrics]);

  const incidentTrendData = useMemo(() => {
    return (govMetrics?.incidents?.incident_trend || []).map((row) => ({
      date: new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: row.count
    }));
  }, [govMetrics]);

  const severityChartData = useMemo(() => {
    const entries = Object.entries(govMetrics?.incidents?.by_severity || {});
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
    return entries.map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      count
    }));
  }, [govMetrics]);

  const fair = govMetrics?.fair;
  const incidents = govMetrics?.incidents;
  const enterprisePosture = deriveRiskPosture(fair?.total_enterprise_ale_usd);
  const executiveDriverChart = useMemo(
    () => (govMetrics?.risk_drivers || []).map((d) => ({
      ...d,
      displayLabel: formatRiskDriverLabel(d.driver)
    })),
    [govMetrics]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !govMetrics) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Error loading executive dashboard: {error}</p>
        <button 
          onClick={fetchExecutiveDashboardData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {govMetrics && (
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          <ShieldCheckIcon className="h-4 w-4" />
          Live governance data • FAIR + incidents + compliance controls
        </div>
      )}

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleMetricClick('compliance_posture', govMetrics?.compliance)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Compliance Implemented</p>
              <p className="text-3xl font-bold text-blue-600">{complianceRate != null ? `${complianceRate}%` : 'N/A'}</p>
              <p className="text-sm text-gray-500">
                {govMetrics?.compliance?.implemented ?? 0} / {govMetrics?.compliance?.total ?? 0} controls
              </p>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              {getTrendIcon({ direction: 'stable' })}
            </div>
          </div>
        </div>

        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleMetricClick('enterprise_ale', fair)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk posture</p>
              <p className={`text-3xl font-bold ${enterprisePosture.color}`}>{enterprisePosture.label}</p>
              <p className="text-lg font-semibold text-red-600">{formatCurrency(fair?.total_enterprise_ale_usd)}</p>
              <p className={`text-sm ${(fair?.risk_delta_24h_usd || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                24h: {(fair?.risk_delta_24h_usd || 0) > 0 ? '+' : ''}{formatCurrency(fair?.risk_delta_24h_usd || 0)}
                {fair?.risk_trend ? ` · ${trendLabel(fair.risk_trend).text}` : ''}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-red-600" />
              {getTrendIcon({
                direction: fair?.risk_trend === 'increasing' ? 'decreasing' : fair?.risk_trend === 'decreasing' ? 'increasing' : 'stable'
              })}
            </div>
          </div>
        </div>

        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleMetricClick('open_critical', incidents)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Critical Incidents</p>
              <p className="text-3xl font-bold text-yellow-600">{incidents?.open_critical ?? 0}</p>
              <p className="text-sm text-gray-500">{incidents?.sla_breaches_open ?? 0} SLA breaches open</p>
            </div>
            <div className="flex flex-col items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              {getTrendIcon({ direction: (incidents?.open_critical || 0) > 0 ? 'decreasing' : 'increasing' })}
            </div>
          </div>
        </div>

        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleMetricClick('incident_resolution', incidents)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Resolution Time</p>
              <p className="text-3xl font-bold text-purple-600">{formatDuration(incidents?.mttr_avg_ms)}</p>
              <p className="text-sm text-gray-500">{incidents?.open ?? 0} open / {incidents?.total ?? 0} total</p>
            </div>
            <div className="flex flex-col items-center">
              <ClockIcon className="h-8 w-8 text-purple-600" />
              {getTrendIcon({ direction: 'decreasing' })}
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise ALE + Incident Volume Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enterprise ALE Trend</h3>
            <ChartBarIcon className="h-5 w-5 text-gray-500" />
          </div>
          {aleTrendData.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={aleTrendData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tickFormatter={(v) => `$${v}M`} />
                  <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}M`, 'Enterprise ALE']} />
                  <Area type="monotone" dataKey="ale_millions" stroke="#EF4444" fill="#FEE2E2" name="Enterprise ALE ($M)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-12 text-center">No ALE history in selected window.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Incident Volume Trend</h3>
            <ChartBarIcon className="h-5 w-5 text-gray-500" />
          </div>
          {incidentTrendData.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={incidentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Incidents" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-12 text-center">No incidents recorded in selected window.</p>
          )}
        </div>
      </div>

      {/* Risk Distribution and Compliance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident severity distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Incident Severity Distribution</h3>
          {severityChartData.length > 0 ? (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={severityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value}% (${props.payload.count} incidents)`,
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(31, 41, 55, 0.8)',
                      borderColor: '#4b5563',
                      color: '#ffffff',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-12 text-center">No incident severity data available.</p>
          )}
        </div>

        {/* Compliance by framework */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compliance by Framework</h3>
          {complianceByFramework.length > 0 ? (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={complianceByFramework} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis type="number" domain={[0, 100]} stroke="#6b7280" />
                  <YAxis dataKey="framework" type="category" stroke="#6b7280" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => [`${value}%`, name === 'compliance' ? 'Implemented' : name]} />
                  <Bar dataKey="compliance" name="Implemented" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-12 text-center">No compliance controls loaded.</p>
          )}
        </div>
      </div>

      {/* Top FAIR risk drivers */}
      {(executiveDriverChart.length ?? 0) > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Risk Drivers (30d)</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={executiveDriverChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis type="category" dataKey="displayLabel" stroke="#6b7280" width={180} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`×${Number(v).toFixed(2)}`, 'Peak multiplier']} />
                <Bar dataKey="peak_multiplier" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Strategic Initiatives — demo placeholder until PMO integration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-dashed border-amber-300 dark:border-amber-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Strategic Initiatives</h3>
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Demo mode</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-75">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Initiatives</div>
            <div className="text-xs text-gray-500 mt-1">Placeholder — no PMO API wired</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">89%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">On-Track Rate</div>
            <div className="text-xs text-gray-500 mt-1">Placeholder — no PMO API wired</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">$1.2M</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cost Savings</div>
            <div className="text-xs text-gray-500 mt-1">Placeholder — no PMO API wired</div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Governance metrics: live API • FAIR + incidents + telemetry
          {govMetrics?.attestation_timestamp && ` • ${new Date(govMetrics.attestation_timestamp).toLocaleString()}`}
        </p>
      </div>

      {/* Drill-down Modal */}
      {showDrillDown && (
        <DrillDownModal
          isOpen={showDrillDown}
          onClose={() => setShowDrillDown(false)}
          metricName={selectedMetric}
          data={drillDownData}
          timeRange={timeRange}
        />
      )}
    </div>
  );
}