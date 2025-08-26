'use client';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
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
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const { state } = useContext(AuthContext);

  // Guard: show loading spinner and redirect if context is not ready
  useEffect(() => {
    if (!state || !state.tokens) {
      // Show spinner for 1s, then redirect
      const timer = setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  if (!state || !state.tokens) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div>
        <span className="text-gray-500">Redirecting to login...</span>
      </div>
    );
  }

  useEffect(() => {
    fetchExecutiveSummary();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchExecutiveSummary, 300000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchExecutiveSummary = async () => {
    try {
      setLoading(true);
      const token = state.tokens?.accessToken;
      if (!token) {
        setError('No access token available. Please log in.');
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/secure-scores/executive-summary?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch CISO executive summary');
      }
      const result = await response.json();
      setDashboardData(result.data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching CISO executive summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  if (!dashboardData) {
    return <div>No data available</div>;
  }

  const { securityPosture, controlsStatus, complianceOverview, riskLandscape, priorityActions, trends, executiveAlerts } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header with Last Updated */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CISO Executive Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastRefresh.toLocaleString()} • Auto-refresh: 5 minutes
          </p>
        </div>
        <button
          onClick={fetchExecutiveSummary}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <ClockIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

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

      {/* Key Performance Indicators */}
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

      {/* Security Score Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Score Trend</h3>
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

      {/* Risk Landscape and Compliance Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Areas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Landscape</h3>
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
        </div>

        {/* Compliance Frameworks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compliance Frameworks</h3>
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
        </div>
      </div>

      {/* Priority Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Priority Actions</h3>
        <div className="space-y-4">
          {priorityActions.map((action, index) => (
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

      {/* Footer with Data Freshness */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Data refreshed hourly • Next update: {new Date(Date.now() + 3600000).toLocaleTimeString()}</p>
      </div>
    </div>
  );
}