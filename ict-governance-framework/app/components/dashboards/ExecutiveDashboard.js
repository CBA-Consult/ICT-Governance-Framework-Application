'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon
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
import DrillDownModal from './DrillDownModal';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function ExecutiveDashboard({ timeRange = 30, onDrillDown }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [drillDownData, setDrillDownData] = useState(null);
  const [showDrillDown, setShowDrillDown] = useState(false);

  useEffect(() => {
    fetchExecutiveDashboardData();
  }, [timeRange]);

  const fetchExecutiveDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
  const response = await fetch(`http://localhost:4000/api/data-processing/dashboard-data?dashboard_type=executive&time_range_days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch executive dashboard data');
      }

      const result = await response.json();
      setDashboardData(result.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching executive dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        return <TrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'decreasing':
        return <TrendingDownIcon className="h-5 w-5 text-red-500" />;
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

  // Mock data for demonstration - replace with real data
  const mockTrendData = [
    { month: 'Jan', governance: 85, compliance: 92, risk: 78, value: 2.1 },
    { month: 'Feb', governance: 87, compliance: 94, risk: 75, value: 2.3 },
    { month: 'Mar', governance: 89, compliance: 96, risk: 72, value: 2.5 },
    { month: 'Apr', governance: 91, compliance: 95, risk: 70, value: 2.7 },
    { month: 'May', governance: 93, compliance: 97, risk: 68, value: 2.9 },
    { month: 'Jun', governance: 95, compliance: 98, risk: 65, value: 3.1 }
  ];

  const mockRiskDistribution = [
    { name: 'Low Risk', value: 65, count: 45 },
    { name: 'Medium Risk', value: 25, count: 18 },
    { name: 'High Risk', value: 8, count: 6 },
    { name: 'Critical Risk', value: 2, count: 1 }
  ];

  const mockComplianceData = [
    { framework: 'ISO 27001', compliance: 96, target: 95 },
    { framework: 'GDPR', compliance: 94, target: 98 },
    { framework: 'SOX', compliance: 98, target: 95 },
    { framework: 'NIST', compliance: 92, target: 90 }
  ];

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
      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleMetricClick('governance_maturity', dashboardData?.metrics?.governance_maturity)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Governance Maturity</p>
              <p className="text-3xl font-bold text-blue-600">Level 4</p>
              <p className="text-sm text-gray-500">Target: Level 4</p>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              {getTrendIcon({ direction: 'increasing' })}
            </div>
          </div>
        </div>

        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleMetricClick('business_value', dashboardData?.metrics?.business_value)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Business Value</p>
              <p className="text-3xl font-bold text-green-600">$3.1M</p>
              <p className="text-sm text-gray-500">Target: $2.5M</p>
            </div>
            <div className="flex flex-col items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              {getTrendIcon({ direction: 'increasing' })}
            </div>
          </div>
        </div>

        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleMetricClick('stakeholder_satisfaction', dashboardData?.metrics?.stakeholder_satisfaction)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stakeholder Satisfaction</p>
              <p className="text-3xl font-bold text-yellow-600">87%</p>
              <p className="text-sm text-gray-500">Target: 85%</p>
            </div>
            <div className="flex flex-col items-center">
              <UserGroupIcon className="h-8 w-8 text-yellow-600" />
              {getTrendIcon({ direction: 'increasing' })}
            </div>
          </div>
        </div>

        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleMetricClick('incident_resolution', dashboardData?.metrics?.incident_resolution)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Resolution Time</p>
              <p className="text-3xl font-bold text-purple-600">16h</p>
              <p className="text-sm text-gray-500">Target: &lt;24h</p>
            </div>
            <div className="flex flex-col items-center">
              <ClockIcon className="h-8 w-8 text-purple-600" />
              {getTrendIcon({ direction: 'decreasing' })}
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Trends Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Strategic Performance Trends</h3>
          <ChartBarIcon className="h-5 w-5 text-gray-500" />
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={mockTrendData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.8)',
                  borderColor: '#4b5563',
                  color: '#ffffff',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="governance" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Governance Score"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="compliance" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Compliance Rate"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Business Value ($M)"
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Distribution and Compliance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Distribution</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={mockRiskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockRiskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value}% (${props.payload.count} items)`,
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
        </div>

        {/* Compliance Framework Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compliance Framework Status</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={mockComplianceData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis type="number" domain={[0, 100]} stroke="#6b7280" />
                <YAxis dataKey="framework" type="category" stroke="#6b7280" width={80} />
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.8)',
                    borderColor: '#4b5563',
                    color: '#ffffff',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="compliance" name="Current" fill="#10B981" />
                <Bar dataKey="target" name="Target" fill="#6B7280" opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strategic Initiatives Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Strategic Initiatives</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Initiatives</div>
            <div className="text-xs text-green-600 mt-1">+2 this quarter</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">89%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">On-Track Rate</div>
            <div className="text-xs text-green-600 mt-1">+5% improvement</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">$1.2M</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cost Savings</div>
            <div className="text-xs text-green-600 mt-1">+15% vs target</div>
          </div>
        </div>
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