'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';

export default function DataCollectionPage() {
  const [dataSources, setDataSources] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showAddMetricModal, setShowAddMetricModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);

  useEffect(() => {
    fetchDataSources();
    fetchMetrics();
  }, []);

  const fetchDataSources = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/data-collection/sources', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data sources');
      }

      const result = await response.json();
      setDataSources(result.data.sources);
    } catch (err) {
      console.error('Error fetching data sources:', err);
      setError(err.message);
    }
  };

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/data-collection/metrics?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const result = await response.json();
      setMetrics(result.data.metrics);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const AddDataSourceModal = () => {
    const [formData, setFormData] = useState({
      source_name: '',
      source_type: 'api',
      data_category: 'governance',
      description: '',
      collection_frequency: 'daily',
      is_active: true
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/data-collection/sources', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to create data source');
        }

        setShowAddSourceModal(false);
        fetchDataSources();
        setFormData({
          source_name: '',
          source_type: 'api',
          data_category: 'governance',
          description: '',
          collection_frequency: 'daily',
          is_active: true
        });
      } catch (err) {
        console.error('Error creating data source:', err);
        alert('Failed to create data source: ' + err.message);
      }
    };

    if (!showAddSourceModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Add Data Source</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Source Name</label>
              <input
                type="text"
                value={formData.source_name}
                onChange={(e) => setFormData({...formData, source_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Source Type</label>
              <select
                value={formData.source_type}
                onChange={(e) => setFormData({...formData, source_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="api">API</option>
                <option value="database">Database</option>
                <option value="file">File</option>
                <option value="manual">Manual</option>
                <option value="automated">Automated</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Data Category</label>
              <select
                value={formData.data_category}
                onChange={(e) => setFormData({...formData, data_category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="governance">Governance</option>
                <option value="compliance">Compliance</option>
                <option value="risk">Risk</option>
                <option value="performance">Performance</option>
                <option value="financial">Financial</option>
                <option value="operational">Operational</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Collection Frequency</label>
              <select
                value={formData.collection_frequency}
                onChange={(e) => setFormData({...formData, collection_frequency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="real-time">Real-time</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
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
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="mr-2"
              />
              <label className="text-sm font-medium">Active</label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddSourceModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AddMetricModal = () => {
    const [formData, setFormData] = useState({
      metric_name: '',
      metric_category: 'kpi',
      value: '',
      unit: '',
      target_value: '',
      data_source_id: '',
      metadata: {}
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/data-collection/metrics', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            value: parseFloat(formData.value),
            target_value: formData.target_value ? parseFloat(formData.target_value) : null
          })
        });

        if (!response.ok) {
          throw new Error('Failed to add metric');
        }

        setShowAddMetricModal(false);
        fetchMetrics();
        setFormData({
          metric_name: '',
          metric_category: 'kpi',
          value: '',
          unit: '',
          target_value: '',
          data_source_id: '',
          metadata: {}
        });
      } catch (err) {
        console.error('Error adding metric:', err);
        alert('Failed to add metric: ' + err.message);
      }
    };

    if (!showAddMetricModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Add Metric Data</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Metric Name</label>
              <input
                type="text"
                value={formData.metric_name}
                onChange={(e) => setFormData({...formData, metric_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.metric_category}
                onChange={(e) => setFormData({...formData, metric_category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="kpi">KPI</option>
                <option value="operational">Operational</option>
                <option value="compliance">Compliance</option>
                <option value="risk">Risk</option>
                <option value="financial">Financial</option>
                <option value="performance">Performance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Value</label>
              <input
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                placeholder="e.g., %, $, count"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Target Value (optional)</label>
              <input
                type="number"
                step="0.01"
                value={formData.target_value}
                onChange={(e) => setFormData({...formData, target_value: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Data Source</label>
              <select
                value={formData.data_source_id}
                onChange={(e) => setFormData({...formData, data_source_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                required
              >
                <option value="">Select a data source</option>
                {dataSources.map(source => (
                  <option key={source.data_source_id} value={source.data_source_id}>
                    {source.source_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddMetricModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Metric
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading data collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Data Collection Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage data sources and collect governance metrics
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">Error: {error}</p>
          </div>
        )}

        {/* Data Sources Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Data Sources</h2>
            <button
              onClick={() => setShowAddSourceModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Data Source
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Metrics
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {dataSources.map((source) => (
                  <tr key={source.data_source_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium">{source.source_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{source.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {source.source_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {source.data_category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {source.collection_frequency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        source.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {source.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {source.metric_count || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Metrics Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Metrics</h2>
            <button
              onClick={() => setShowAddMetricModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Metric
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Metric Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Collected
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {metrics.slice(0, 10).map((metric) => (
                  <tr key={metric.collection_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{metric.metric_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {metric.metric_category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {metric.value} {metric.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {metric.target_value ? `${metric.target_value} ${metric.unit}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {metric.source_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(metric.collection_timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <AddDataSourceModal />
        <AddMetricModal />
      </div>
    </div>
  );
}