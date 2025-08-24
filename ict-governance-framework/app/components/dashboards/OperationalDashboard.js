'use client';

import React, { useState, useEffect } from 'react';
import { 
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  ServerIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import DrillDownModal from './DrillDownModal';

export default function OperationalDashboard({ timeRange = 30, onDrillDown }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [drillDownData, setDrillDownData] = useState(null);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    fetchOperationalDashboardData();
  }, [timeRange]);

  const fetchOperationalDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/data-processing/dashboard-data?dashboard_type=operational&time_range_days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch operational dashboard data');
      }

      const result = await response.json();
      setDashboardData(result.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching operational dashboard data:', err);
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
      const response = await fetch('/api/data-analytics/multidimensional-analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: [metricName],
          time_range: {
            start_date: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date().toISOString()
          },
          dimensions: ['department', 'system', 'priority', 'status']
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

  // Mock operational data
  const mockPerformanceData = [
    { date: '2024-01-01', incidents: 5, resolved: 4, sla_met: 80, response_time: 2.5 },
    { date: '2024-01-02', incidents: 3, resolved: 3, sla_met: 100, response_time: 1.8 },
    { date: '2024-01-03', incidents: 7, resolved: 6, sla_met: 85, response_time: 3.2 },
    { date: '2024-01-04', incidents: 4, resolved: 4, sla_met: 100, response_time: 2.1 },
    { date: '2024-01-05', incidents: 6, resolved: 5, sla_met: 83, response_time: 2.8 },
    { date: '2024-01-06', incidents: 2, resolved: 2, sla_met: 100, response_time: 1.5 },
    { date: '2024-01-07', incidents: 8, resolved: 7, sla_met: 87, response_time: 3.5 }
  ];

  const mockSystemHealth = [
    { system: 'Identity Management', availability: 99.8, performance: 95, security: 98 },
    { system: 'Data Platform', availability: 99.5, performance: 92, security: 96 },
    { system: 'Compliance Engine', availability: 99.9, performance: 97, security: 99 },
    { system: 'Monitoring System', availability: 99.7, performance: 94, security: 97 },
    { system: 'Backup Services', availability: 99.6, performance: 89, security: 95 }
  ];

  const mockWorkflowData = [
    { process: 'Access Requests', total: 145, completed: 132, pending: 13, overdue: 0, avg_time: 2.3 },
    { process: 'Policy Reviews', total: 28, completed: 24, pending: 3, overdue: 1, avg_time: 5.2 },
    { process: 'Risk Assessments', total: 67, completed: 58, pending: 8, overdue: 1, avg_time: 7.8 },
    { process: 'Compliance Audits', total: 12, completed: 10, pending: 2, overdue: 0, avg_time: 12.5 },
    { process: 'Incident Response', total: 34, completed: 31, pending: 2, overdue: 1, avg_time: 4.1 }
  ];

  const mockResourceUtilization = [
    { resource: 'CPU', current: 68, threshold: 80, peak: 85 },
    { resource: 'Memory', current: 72, threshold: 85, peak: 89 },
    { resource: 'Storage', current: 45, threshold: 75, peak: 52 },
    { resource: 'Network', current: 34, threshold: 70, peak: 67 },
    { resource: 'Database', current: 56, threshold: 80, peak: 78 }
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
        <p className="text-red-600">Error loading operational dashboard: {error}</p>
        <button 
          onClick={fetchOperationalDashboardData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Operational KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleMetricClick('active_incidents', dashboardData?.metrics?.active_incidents)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Incidents</p>
              <p className="text-3xl font-bold text-red-600">7</p>
              <p className="text-sm text-gray-500">3 critical, 4 medium</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleMetricClick('sla_compliance', dashboardData?.metrics?.sla_compliance)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">SLA Compliance</p>
              <p className="text-3xl font-bold text-green-600">94.2%</p>
              <p className="text-sm text-gray-500">Target: 95%</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleMetricClick('avg_response_time', dashboardData?.metrics?.avg_response_time)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
              <p className="text-3xl font-bold text-blue-600">2.4h</p>
              <p className="text-sm text-gray-500">Target: &lt;4h</p>
            </div>
            <ClockIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleMetricClick('system_availability', dashboardData?.metrics?.system_availability)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Availability</p>
              <p className="text-3xl font-bold text-purple-600">99.7%</p>
              <p className="text-sm text-gray-500">Target: 99.5%</p>
            </div>
            <ServerIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'performance', label: 'Performance', icon: CogIcon },
              { id: 'systems', label: 'System Health', icon: ServerIcon },
              { id: 'workflows', label: 'Workflows', icon: DocumentTextIcon },
              { id: 'resources', label: 'Resources', icon: ShieldCheckIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Incident Management Performance
                </h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <ComposedChart data={mockPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis yAxisId="left" stroke="#6b7280" />
                      <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(31, 41, 55, 0.8)',
                          borderColor: '#4b5563',
                          color: '#ffffff',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="incidents" fill="#EF4444" name="Incidents" />
                      <Bar yAxisId="left" dataKey="resolved" fill="#10B981" name="Resolved" />
                      <Line yAxisId="right" type="monotone" dataKey="sla_met" stroke="#3B82F6" strokeWidth={2} name="SLA Met %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* System Health Tab */}
          {activeTab === 'systems' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  System Health Overview
                </h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={mockSystemHealth} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis type="number" domain={[0, 100]} stroke="#6b7280" />
                      <YAxis dataKey="system" type="category" stroke="#6b7280" width={120} />
                      <Tooltip
                        formatter={(value, name) => [`${value}%`, name]}
                        contentStyle={{
                          backgroundColor: 'rgba(31, 41, 55, 0.8)',
                          borderColor: '#4b5563',
                          color: '#ffffff',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="availability" fill="#10B981" name="Availability" />
                      <Bar dataKey="performance" fill="#3B82F6" name="Performance" />
                      <Bar dataKey="security" fill="#8B5CF6" name="Security" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Workflows Tab */}
          {activeTab === 'workflows' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Process Workflow Status
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Process
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Completed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Pending
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Overdue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Avg Time (days)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {mockWorkflowData.map((workflow, index) => (
                        <tr 
                          key={index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleMetricClick(workflow.process.toLowerCase().replace(' ', '_'), workflow)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {workflow.process}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {workflow.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            {workflow.completed}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                            {workflow.pending}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            {workflow.overdue}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {workflow.avg_time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Resource Utilization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockResourceUtilization.map((resource, index) => (
                    <div 
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleMetricClick(resource.resource.toLowerCase(), resource)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {resource.resource}
                        </span>
                        <span className={`text-sm font-bold ${
                          resource.current > resource.threshold ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {resource.current}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            resource.current > resource.threshold ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${resource.current}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Threshold: {resource.threshold}%</span>
                        <span>Peak: {resource.peak}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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