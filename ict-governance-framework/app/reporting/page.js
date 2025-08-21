'use client';

import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  DownloadIcon, 
  EyeIcon,
  PlusIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

export default function ReportingPage() {
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState({});
  const [customTemplates, setCustomTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showCustomTemplateModal, setShowCustomTemplateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  const [filters, setFilters] = useState({
    search: '',
    report_type: '',
    status: '',
    date_range: 'all'
  });

  useEffect(() => {
    fetchReports();
    fetchTemplates();
    fetchCustomTemplates();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Build query parameters from filters
      const queryParams = new URLSearchParams();
      if (filters.report_type) queryParams.append('report_type', filters.report_type);
      if (filters.status) queryParams.append('status', filters.status);
      
      const response = await fetch(`/api/reporting/reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const result = await response.json();
      let filteredReports = result.data.reports;

      // Apply client-side filters
      if (filters.search) {
        filteredReports = filteredReports.filter(report => 
          report.report_type.toLowerCase().includes(filters.search.toLowerCase()) ||
          (report.report_name && report.report_name.toLowerCase().includes(filters.search.toLowerCase()))
        );
      }

      setReports(filteredReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reporting/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const result = await response.json();
      setTemplates(result.data.templates);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err.message);
    }
  };

  const fetchCustomTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reporting/custom-templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch custom templates');
      }

      const result = await response.json();
      setCustomTemplates(result.data.templates);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching custom templates:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const GenerateReportModal = () => {
    const [formData, setFormData] = useState({
      report_type: 'executive_summary',
      time_range: {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      },
      options: {}
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setGenerating(true);
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/reporting/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            time_range: {
              start_date: new Date(formData.time_range.start_date).toISOString(),
              end_date: new Date(formData.time_range.end_date).toISOString()
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate report');
        }

        const result = await response.json();
        setShowGenerateModal(false);
        fetchReports();
        alert('Report generated successfully!');
      } catch (err) {
        console.error('Error generating report:', err);
        alert('Failed to generate report: ' + err.message);
      } finally {
        setGenerating(false);
      }
    };

    if (!showGenerateModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Generate Report</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Report Type</label>
              <select
                value={formData.report_type}
                onChange={(e) => setFormData({...formData, report_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                {Object.entries(templates).map(([key, template]) => (
                  <option key={key} value={key}>{template.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={formData.time_range.start_date}
                onChange={(e) => setFormData({
                  ...formData, 
                  time_range: {...formData.time_range, start_date: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={formData.time_range.end_date}
                onChange={(e) => setFormData({
                  ...formData, 
                  time_range: {...formData.time_range, end_date: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                required
              />
            </div>
            
            {templates[formData.report_type] && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Description:</strong> {templates[formData.report_type].description}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  <strong>Frequency:</strong> {templates[formData.report_type].frequency}
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const CustomTemplateModal = () => {
    const [formData, setFormData] = useState({
      template_name: '',
      description: '',
      category: '',
      data_sources: ['metric_data'],
      template_config: {
        sections: [],
        metrics: [],
        filters: {}
      },
      visualization_config: {},
      is_public: false,
      tags: []
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setGenerating(true);
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/reporting/custom-templates', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to create custom template');
        }

        const result = await response.json();
        setShowCustomTemplateModal(false);
        fetchCustomTemplates();
        alert('Custom template created successfully!');
      } catch (err) {
        console.error('Error creating custom template:', err);
        alert('Failed to create custom template: ' + err.message);
      } finally {
        setGenerating(false);
      }
    };

    if (!showCustomTemplateModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Create Custom Report Template</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template Name</label>
                <input
                  type="text"
                  value={formData.template_name}
                  onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="">Select Category</option>
                  <option value="governance">Governance</option>
                  <option value="compliance">Compliance</option>
                  <option value="risk">Risk Management</option>
                  <option value="performance">Performance</option>
                  <option value="financial">Financial</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                rows="3"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                className="mr-2"
              />
              <label className="text-sm">Make this template public (visible to all users)</label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCustomTemplateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={generating}
              >
                {generating ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const downloadReport = async (reportId, format = 'json') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reporting/reports/${reportId}/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report-${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report: ' + err.message);
    }
  };

  const viewReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reporting/reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }

      const result = await response.json();
      
      // Create a new window to display the report
      const reportWindow = window.open('', '_blank');
      reportWindow.document.write(`
        <html>
          <head>
            <title>Report: ${result.data.report.report_type}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
              .section { margin-bottom: 30px; }
              .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
              .value { font-weight: bold; color: #2563eb; }
              pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Governance Report: ${result.data.report.report_type.replace(/_/g, ' ').toUpperCase()}</h1>
              <p>Generated: ${new Date(result.data.report.created_at).toLocaleString()}</p>
              <p>Period: ${new Date(result.data.report.time_range_start).toLocaleDateString()} - ${new Date(result.data.report.time_range_end).toLocaleDateString()}</p>
            </div>
            <div class="content">
              <pre>${JSON.stringify(JSON.parse(result.data.report.report_data), null, 2)}</pre>
            </div>
          </body>
        </html>
      `);
      reportWindow.document.close();
    } catch (err) {
      console.error('Error viewing report:', err);
      alert('Failed to view report: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reporting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Governance Reporting</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate and manage governance reports and analytics
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Generated Reports
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Standard Templates
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'custom'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Custom Templates
            </button>
          </nav>
        </div>

        {/* Filters and Search */}
        {activeTab === 'reports' && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    placeholder="Search reports..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Report Type</label>
                <select
                  value={filters.report_type}
                  onChange={(e) => setFilters({...filters, report_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="">All Types</option>
                  <option value="executive_summary">Executive Summary</option>
                  <option value="compliance_report">Compliance Report</option>
                  <option value="risk_management">Risk Management</option>
                  <option value="performance_dashboard">Performance Dashboard</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="generating">Generating</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({search: '', report_type: '', status: '', date_range: 'all'})}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">Error: {error}</p>
          </div>
        )}

        {/* Standard Templates Tab */}
        {activeTab === 'templates' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Standard Report Templates</h2>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Generate Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(templates).map(([key, template]) => (
                <div key={key} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-3">
                    <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Frequency: {template.frequency}
                    </span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {template.sections?.length || 0} sections
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Templates Tab */}
        {activeTab === 'custom' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Custom Report Templates</h2>
              <button
                onClick={() => setShowCustomTemplateModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Custom Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customTemplates.map((template) => (
                <div key={template.template_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <DocumentDuplicateIcon className="h-6 w-6 text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold">{template.template_name}</h3>
                    </div>
                    <div className="flex space-x-1">
                      {template.is_public && (
                        <UserGroupIcon className="h-4 w-4 text-blue-500" title="Public Template" />
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {template.description || 'No description provided'}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-500 dark:text-gray-400">
                      Category: {template.category || 'Uncategorized'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Used: {template.usage_count} times
                    </span>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        // Use custom template for generation
                        setShowGenerateModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Use Template
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {customTemplates.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <DocumentDuplicateIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No custom templates created yet</p>
                  <button
                    onClick={() => setShowCustomTemplateModal(true)}
                    className="mt-2 text-green-600 hover:text-green-800"
                  >
                    Create your first custom template
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generated Reports Section */}
        {activeTab === 'reports' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Generated Reports</h2>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Generate New Report
              </button>
            </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Report Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Time Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Generated By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((report) => (
                  <tr key={report.report_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {templates[report.report_type]?.name || report.report_type.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(report.time_range_start).toLocaleDateString()} - {new Date(report.time_range_end).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(report.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {report.generated_by_username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : report.status === 'failed'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewReport(report.report_id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Report"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => downloadReport(report.report_id, 'json')}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Download Report"
                          >
                            <DownloadIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowShareModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                          title="Share Report"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {reports.length === 0 && (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No reports generated yet</p>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Generate your first report
                </button>
              </div>
            )}
          </div>
          </div>
        )}

        <GenerateReportModal />
        <CustomTemplateModal />
      </div>
    </div>
  );
}