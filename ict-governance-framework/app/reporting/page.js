'use client';

import React, { useState, useEffect } from 'react';
import { DocumentTextIcon, ChartBarIcon, DownloadIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function ReportingPage() {
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchTemplates();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reporting/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const result = await response.json();
      setReports(result.data.reports);
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
      setLoading(false);
    } catch (err) {
      console.error('Error fetching templates:', err);
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">Error: {error}</p>
          </div>
        )}

        {/* Report Templates Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Available Report Templates</h2>
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

        {/* Generated Reports Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Generated Reports</h2>

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
                        <button
                          onClick={() => {
                            // Download functionality would be implemented here
                            alert('Download functionality coming soon!');
                          }}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Download Report"
                        >
                          <DownloadIcon className="h-4 w-4" />
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

        <GenerateReportModal />
      </div>
    </div>
  );
}