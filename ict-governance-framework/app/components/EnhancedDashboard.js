'use client';

import React, { useState, useEffect } from 'react';
import { ChartBarIcon, TrendingUpIcon, TrendingDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function EnhancedDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(30);
  const [dashboardType, setDashboardType] = useState('executive');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeRange, dashboardType]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/data-processing/dashboard-data?dashboard_type=${dashboardType}&time_range_days=${selectedTimeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      setDashboardData(result.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value, unit = '') => {
    if (value === null || value === undefined) return 'N/A';
    
    if (typeof value === 'number') {
      if (unit === 'percentage' || unit === '%') {
        return `${value.toFixed(1)}%`;
      } else if (unit === 'currency' || unit === '$') {
        return `$${value.toLocaleString()}`;
      } else if (Number.isInteger(value)) {
        return value.toLocaleString();
      } else {
        return value.toFixed(2);
      }
    }
    
    return value.toString();
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'increasing':
        return <TrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'decreasing':
        return <TrendingDownIcon className="h-5 w-5 text-red-500" />;
      case 'stable':
        return <div className="h-5 w-5 bg-yellow-500 rounded-full" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (currentValue, targetValue) => {
    if (!targetValue || !currentValue) return 'text-gray-500';
    
    const ratio = currentValue / targetValue;
    if (ratio >= 1) return 'text-green-600';
    if (ratio >= 0.9) return 'text-yellow-600';
    return 'text-red-600';
  };

  const MetricCard = ({ metricName, data }) => {
    const displayName = metricName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {displayName}
          </h3>
          {data.trend && getTrendIcon(data.trend.direction)}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Current Value:</span>
            <span className={`text-lg font-bold ${getStatusColor(data.current_value, data.target_value)}`}>
              {formatValue(data.current_value)}
            </span>
          </div>
          
          {data.target_value && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Target:</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {formatValue(data.target_value)}
              </span>
            </div>
          )}
          
          {data.trend && data.trend.rate !== 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Trend:</span>
              <span className={`text-sm font-medium ${
                data.trend.rate > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.trend.rate > 0 ? '+' : ''}{data.trend.rate.toFixed(1)}%
              </span>
            </div>
          )}
          
          {data.last_updated && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Last updated: {new Date(data.last_updated).toLocaleDateString()}
            </div>
          )}
          
          {data.error && (
            <div className="text-xs text-red-500 mt-2">
              {data.error}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">Error loading dashboard: {error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Enhanced Governance Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Real-time governance metrics and analytics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dashboardType}
                onChange={(e) => setDashboardType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="executive">Executive</option>
                <option value="operational">Operational</option>
                <option value="compliance">Compliance</option>
                <option value="risk">Risk</option>
              </select>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dashboard Type Info */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Showing {dashboardType} dashboard for the last {selectedTimeRange} days
              {dashboardData?.generated_at && (
                <span className="ml-2">
                  • Generated at {new Date(dashboardData.generated_at).toLocaleString()}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        {dashboardData?.metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {Object.entries(dashboardData.metrics).map(([metricName, data]) => (
              <MetricCard key={metricName} metricName={metricName} data={data} />
            ))}
          </div>
        )}

        {/* Summary Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Dashboard Summary</h2>
          
          {dashboardData?.metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(dashboardData.metrics).filter(m => 
                    m.current_value && m.target_value && m.current_value >= m.target_value
                  ).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Metrics Meeting Target</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.values(dashboardData.metrics).filter(m => 
                    m.current_value && m.target_value && 
                    m.current_value < m.target_value && m.current_value >= m.target_value * 0.9
                  ).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Metrics Near Target</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(dashboardData.metrics).filter(m => 
                    m.current_value && m.target_value && m.current_value < m.target_value * 0.9
                  ).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Metrics Below Target</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              No metrics data available
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
          <button
            onClick={() => window.open('/api/reporting/generate', '_blank')}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}