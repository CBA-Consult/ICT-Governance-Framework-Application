'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import ExecutiveDashboard from './ExecutiveDashboard';
import OperationalDashboard from './OperationalDashboard';
import DashboardFilters from './DashboardFilters';
import InteractiveCharts from './InteractiveCharts';

export default function EnhancedDashboardPage() {
  const [activeView, setActiveView] = useState('executive');
  const [filters, setFilters] = useState({
    timeRange: '30',
    department: 'all',
    category: 'all',
    priority: 'all'
  });
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showFilters, setShowFilters] = useState(true);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastRefresh(new Date());
    setRefreshing(false);
  };

  const handleExport = () => {
    // Generate export data
    const exportData = {
      dashboard_type: activeView,
      filters: filters,
      generated_at: new Date().toISOString(),
      data: 'Dashboard data would be here'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${activeView}_dashboard_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const dashboardViews = [
    {
      id: 'executive',
      name: 'Executive',
      icon: UserGroupIcon,
      description: 'High-level strategic metrics and KPIs'
    },
    {
      id: 'operational',
      name: 'Operational',
      icon: Cog6ToothIcon,
      description: 'Detailed operational metrics and performance'
    },
    {
      id: 'compliance',
      name: 'Compliance',
      icon: ShieldCheckIcon,
      description: 'Compliance status and regulatory metrics'
    }
  ];

  // Mock data for interactive charts
  const mockChartData = [
    { date: '2024-01-01', governance_score: 85, compliance_rate: 92, risk_level: 78, incidents: 5 },
    { date: '2024-01-02', governance_score: 87, compliance_rate: 94, risk_level: 75, incidents: 3 },
    { date: '2024-01-03', governance_score: 89, compliance_rate: 96, risk_level: 72, incidents: 7 },
    { date: '2024-01-04', governance_score: 91, compliance_rate: 95, risk_level: 70, incidents: 4 },
    { date: '2024-01-05', governance_score: 93, compliance_rate: 97, risk_level: 68, incidents: 6 },
    { date: '2024-01-06', governance_score: 95, compliance_rate: 98, risk_level: 65, incidents: 2 },
    { date: '2024-01-07', governance_score: 94, compliance_rate: 96, risk_level: 67, incidents: 8 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Enhanced Governance Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Interactive dashboards with drill-down capabilities and real-time analytics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button
                onClick={handleExport}
                className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Export
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              {dashboardViews.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeView === view.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <view.icon className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div>{view.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                      {view.description}
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <DashboardFilters
                onFiltersChange={handleFiltersChange}
                initialFilters={filters}
                showAdvanced={true}
                availableFilters={{
                  departments: ['IT', 'Legal', 'Risk', 'Finance', 'HR', 'Operations'],
                  categories: ['Security', 'Compliance', 'Risk Management', 'Data Governance'],
                  priorities: ['Critical', 'High', 'Medium', 'Low'],
                  statuses: ['Active', 'Pending', 'Completed', 'On Hold'],
                  tags: ['urgent', 'review-required', 'automated', 'escalated']
                }}
              />
            </div>
          )}

          {/* Main Dashboard Content */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <div className="space-y-6">
              {/* Dashboard Content */}
              {activeView === 'executive' && (
                <ExecutiveDashboard 
                  timeRange={parseInt(filters.timeRange)}
                  onDrillDown={(metric, data) => console.log('Drill down:', metric, data)}
                />
              )}

              {activeView === 'operational' && (
                <OperationalDashboard 
                  timeRange={parseInt(filters.timeRange)}
                  onDrillDown={(metric, data) => console.log('Drill down:', metric, data)}
                />
              )}

              {activeView === 'compliance' && (
                <div className="space-y-6">
                  {/* Compliance-specific dashboard content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Compliance</p>
                          <p className="text-3xl font-bold text-green-600">96.2%</p>
                          <p className="text-sm text-gray-500">Target: 95%</p>
                        </div>
                        <ShieldCheckIcon className="h-8 w-8 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Policy Violations</p>
                          <p className="text-3xl font-bold text-red-600">12</p>
                          <p className="text-sm text-gray-500">-3 from last month</p>
                        </div>
                        <ChartBarIcon className="h-8 w-8 text-red-600" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Audit Findings</p>
                          <p className="text-3xl font-bold text-yellow-600">8</p>
                          <p className="text-sm text-gray-500">5 resolved, 3 pending</p>
                        </div>
                        <ChartBarIcon className="h-8 w-8 text-yellow-600" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Certification Status</p>
                          <p className="text-3xl font-bold text-blue-600">4/5</p>
                          <p className="text-sm text-gray-500">1 renewal pending</p>
                        </div>
                        <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  {/* Compliance Interactive Chart */}
                  <InteractiveCharts
                    data={mockChartData}
                    chartType="line"
                    title="Compliance Trends"
                    onDataPointClick={(data, index) => console.log('Chart clicked:', data, index)}
                    enableZoom={true}
                    enableFilter={true}
                    height={400}
                  />
                </div>
              )}

              {/* Interactive Charts Section */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Interactive Analytics
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <InteractiveCharts
                    data={mockChartData}
                    chartType="area"
                    title="Performance Metrics"
                    onDataPointClick={(data, index) => console.log('Performance chart clicked:', data, index)}
                    enableZoom={true}
                    enableFilter={true}
                    height={350}
                  />
                  <InteractiveCharts
                    data={mockChartData}
                    chartType="bar"
                    title="Incident Analysis"
                    onDataPointClick={(data, index) => console.log('Incident chart clicked:', data, index)}
                    enableZoom={true}
                    enableFilter={true}
                    height={350}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Summary Footer */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {activeView === 'executive' ? '12' : activeView === 'operational' ? '47' : '23'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Metrics</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {activeView === 'executive' ? '94.2%' : activeView === 'operational' ? '87.5%' : '96.2%'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Performance Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {filters.timeRange}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Days Range</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(filters).filter(key => 
                  filters[key] !== 'all' && filters[key] !== '' && 
                  !(Array.isArray(filters[key]) && filters[key].length === 0)
                ).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Filters</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}