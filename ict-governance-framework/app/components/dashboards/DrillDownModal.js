'use client';

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  ChartBarIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function DrillDownModal({ isOpen, onClose, metricName, data, timeRange }) {
  const [viewMode, setViewMode] = useState('chart');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('value');
  const [detailedData, setDetailedData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && metricName) {
      fetchDetailedData();
    }
  }, [isOpen, metricName, filterBy, sortBy]);

  const fetchDetailedData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch trend data for the metric
      const response = await fetch('/api/data-processing/calculate-trend', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metric_name: metricName,
          time_range: {
            start_date: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date().toISOString()
          },
          interval_type: 'daily'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setDetailedData(result.data);
      }
    } catch (err) {
      console.error('Error fetching detailed data:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!detailedData) return;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Value,Trend\n"
      + detailedData.trend_data?.map(item => 
          `${item.date},${item.value},${item.trend || ''}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${metricName}_drill_down.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mock detailed data for demonstration
  const mockTrendData = [
    { date: '2024-01-01', value: 85, category: 'Security', department: 'IT' },
    { date: '2024-01-02', value: 87, category: 'Security', department: 'IT' },
    { date: '2024-01-03', value: 89, category: 'Compliance', department: 'Legal' },
    { date: '2024-01-04', value: 91, category: 'Security', department: 'IT' },
    { date: '2024-01-05', value: 88, category: 'Risk', department: 'Risk' },
    { date: '2024-01-06', value: 92, category: 'Compliance', department: 'Legal' },
    { date: '2024-01-07', value: 94, category: 'Security', department: 'IT' }
  ];

  const mockBreakdownData = [
    { name: 'Critical', value: 15, count: 3 },
    { name: 'High', value: 25, count: 8 },
    { name: 'Medium', value: 35, count: 12 },
    { name: 'Low', value: 25, count: 7 }
  ];

  const mockDepartmentData = [
    { department: 'IT', value: 92, trend: 'up', incidents: 5 },
    { department: 'Legal', value: 88, trend: 'stable', incidents: 2 },
    { department: 'Risk', value: 85, trend: 'down', incidents: 8 },
    { department: 'Finance', value: 90, trend: 'up', incidents: 3 },
    { department: 'HR', value: 87, trend: 'stable', incidents: 1 }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Detailed Analysis: {metricName?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last {timeRange} days • {mockTrendData.length} data points
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('chart')}
                    className={`flex items-center px-3 py-1 rounded-md text-sm ${
                      viewMode === 'chart' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    Chart
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center px-3 py-1 rounded-md text-sm ${
                      viewMode === 'table' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <TableCellsIcon className="h-4 w-4 mr-1" />
                    Table
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <FunnelIcon className="h-4 w-4 text-gray-500" />
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800"
                  >
                    <option value="all">All Categories</option>
                    <option value="security">Security</option>
                    <option value="compliance">Compliance</option>
                    <option value="risk">Risk</option>
                  </select>
                </div>
              </div>

              <button
                onClick={exportData}
                className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 px-6 py-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {mockTrendData[mockTrendData.length - 1]?.value || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Current Value</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      +{((mockTrendData[mockTrendData.length - 1]?.value - mockTrendData[0]?.value) / mockTrendData[0]?.value * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Change</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600">
                      {(mockTrendData.reduce((sum, item) => sum + item.value, 0) / mockTrendData.length).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Average</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.max(...mockTrendData.map(item => item.value))}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Peak Value</div>
                  </div>
                </div>

                {viewMode === 'chart' ? (
                  <div className="space-y-6">
                    {/* Trend Chart */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Trend Analysis</h4>
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                          <AreaChart data={mockTrendData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="date" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(31, 41, 55, 0.8)',
                                borderColor: '#4b5563',
                                color: '#ffffff',
                                borderRadius: '0.5rem',
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#3B82F6" 
                              fill="#3B82F6" 
                              fillOpacity={0.3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Breakdown Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Priority Breakdown */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Priority Breakdown</h4>
                        <div style={{ width: '100%', height: 250 }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={mockBreakdownData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {mockBreakdownData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value, name, props) => [
                                  `${value}% (${props.payload.count} items)`,
                                  name
                                ]}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Department Performance */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Department Performance</h4>
                        <div style={{ width: '100%', height: 250 }}>
                          <ResponsiveContainer>
                            <BarChart data={mockDepartmentData}>
                              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                              <XAxis dataKey="department" stroke="#6b7280" />
                              <YAxis stroke="#6b7280" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(31, 41, 55, 0.8)',
                                  borderColor: '#4b5563',
                                  color: '#ffffff',
                                  borderRadius: '0.5rem',
                                }}
                              />
                              <Bar dataKey="value" fill="#3B82F6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Table View */
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Detailed Data</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Value
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Department
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {mockTrendData.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {new Date(item.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {item.value}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {item.category}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {item.department}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}