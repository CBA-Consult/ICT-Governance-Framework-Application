'use client';

import { useState } from 'react';
import { 
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import SecureScoreDashboard from '../components/dashboards/SecureScoreDashboard';

export default function SecureScorePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeRange, setTimeRange] = useState(30);

  const tabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: ChartBarIcon,
      description: 'Overview of secure score metrics and trends'
    },
    {
      id: 'recommendations',
      name: 'Recommendations',
      icon: ShieldCheckIcon,
      description: 'Actionable security recommendations'
    },
    {
      id: 'controls',
      name: 'Controls',
      icon: Cog6ToothIcon,
      description: 'Security control profiles and configurations'
    },
    {
      id: 'reports',
      name: 'Reports',
      icon: DocumentTextIcon,
      description: 'Detailed security reports and compliance mapping'
    }
  ];

  const timeRangeOptions = [
    { value: 7, label: '7 days' },
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
    { value: 365, label: '1 year' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Microsoft Secure Score
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Monitor and improve your organization's security posture with Microsoft Graph API integration
              </p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Range:
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon
                      className={`mr-2 h-5 w-5 ${
                        activeTab === tab.id
                          ? 'text-blue-500 dark:text-blue-400'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Tab Description */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'dashboard' && (
            <SecureScoreDashboard timeRange={timeRange} />
          )}
          
          {activeTab === 'recommendations' && (
            <RecommendationsTab timeRange={timeRange} />
          )}
          
          {activeTab === 'controls' && (
            <ControlsTab timeRange={timeRange} />
          )}
          
          {activeTab === 'reports' && (
            <ReportsTab timeRange={timeRange} />
          )}
        </div>
      </div>
    </div>
  );
}

// Placeholder components for other tabs
function RecommendationsTab({ timeRange }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Security Recommendations
      </h3>
      <div className="text-center py-12">
        <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Detailed recommendations view coming soon...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This will show actionable security recommendations with filtering and prioritization options.
        </p>
      </div>
    </div>
  );
}

function ControlsTab({ timeRange }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Security Controls
      </h3>
      <div className="text-center py-12">
        <Cog6ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Security controls management coming soon...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This will show detailed control profiles, implementation status, and configuration options.
        </p>
      </div>
    </div>
  );
}

function ReportsTab({ timeRange }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Security Reports
      </h3>
      <div className="text-center py-12">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Detailed reporting coming soon...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This will show compliance reports, trend analysis, and executive summaries.
        </p>
      </div>
    </div>
  );
}