'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

export default function AlertsPage() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/auth';
    }
  }, [isAuthenticated, isLoading]);

  // Fetch alerts
  const fetchAlerts = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/alerts?status=${filter}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const data = await response.json();
      setAlerts(data.alerts);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch alert statistics
  const fetchStats = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/alerts/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch alert stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching alert stats:', err);
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId, notes = '') => {
    if (!token) return;

    try {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }

      // Refresh alerts
      fetchAlerts();
      fetchStats();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      alert('Failed to acknowledge alert: ' + err.message);
    }
  };

  // Resolve alert
  const resolveAlert = async (alertId, resolutionNotes = '') => {
    if (!token) return;

    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolution_notes: resolutionNotes })
      });

      if (!response.ok) {
        throw new Error('Failed to resolve alert');
      }

      // Refresh alerts
      fetchAlerts();
      fetchStats();
    } catch (err) {
      console.error('Error resolving alert:', err);
      alert('Failed to resolve alert: ' + err.message);
    }
  };

  // Escalate alert
  const escalateAlert = async (alertId, reason = '', target = '') => {
    if (!token) return;

    try {
      const response = await fetch(`/api/alerts/${alertId}/escalate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          escalation_reason: reason,
          escalation_target: target 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to escalate alert');
      }

      // Refresh alerts
      fetchAlerts();
      fetchStats();
    } catch (err) {
      console.error('Error escalating alert:', err);
      alert('Failed to escalate alert: ' + err.message);
    }
  };

  // Get alert details
  const getAlertDetails = async (alertId) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch alert details');
      }

      const data = await response.json();
      setSelectedAlert(data);
      setShowDetails(true);
    } catch (err) {
      console.error('Error fetching alert details:', err);
      alert('Failed to fetch alert details: ' + err.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAlerts();
      fetchStats();
    }
  }, [isAuthenticated, token, filter]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Filter alerts based on search term
  const filteredAlerts = alerts.filter(alert => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      alert.title.toLowerCase().includes(searchLower) ||
      alert.description?.toLowerCase().includes(searchLower) ||
      alert.severity.toLowerCase().includes(searchLower) ||
      alert.source_system?.toLowerCase().includes(searchLower)
    );
  });

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'suppressed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'Critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'High':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'Medium':
        return <ShieldExclamationIcon className="h-5 w-5 text-yellow-500" />;
      case 'Low':
        return <ClockIcon className="h-5 w-5 text-green-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Alert Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor and manage system alerts and security incidents
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Acknowledged</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.acknowledged || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resolved || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <ShieldExclamationIcon className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.critical_active || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Alerts</option>
                  <option value="active">Active</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="resolved">Resolved</option>
                  <option value="suppressed">Suppressed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading alerts...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              Error: {error}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No alerts found
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAlerts.map(alert => (
                <div
                  key={alert.alert_id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Severity Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getSeverityIcon(alert.severity)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {alert.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            getSeverityColor(alert.severity)
                          }`}>
                            {alert.severity}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getStatusColor(alert.status)
                          }`}>
                            {alert.status}
                          </span>
                        </div>
                        
                        {alert.description && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {alert.description}
                          </p>
                        )}
                        
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>ID: {alert.alert_id}</span>
                          {alert.source_system && <span>Source: {alert.source_system}</span>}
                          <span>Triggered: {formatDate(alert.triggered_at)}</span>
                          {alert.escalation_level > 0 && (
                            <span className="text-orange-600">
                              Escalation Level: {alert.escalation_level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => getAlertDetails(alert.alert_id)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      
                      {alert.status === 'active' && (
                        <button
                          onClick={() => {
                            const notes = prompt('Acknowledgment notes (optional):');
                            if (notes !== null) {
                              acknowledgeAlert(alert.alert_id, notes);
                            }
                          }}
                          className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                        >
                          Acknowledge
                        </button>
                      )}
                      
                      {['active', 'acknowledged'].includes(alert.status) && (
                        <button
                          onClick={() => {
                            const notes = prompt('Resolution notes:');
                            if (notes !== null) {
                              resolveAlert(alert.alert_id, notes);
                            }
                          }}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Resolve
                        </button>
                      )}
                      
                      {['active', 'acknowledged'].includes(alert.status) && (
                        <button
                          onClick={() => {
                            const reason = prompt('Escalation reason:');
                            if (reason !== null) {
                              const target = prompt('Escalation target (optional):');
                              escalateAlert(alert.alert_id, reason, target || '');
                            }
                          }}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Escalate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert Details Modal */}
        {showDetails && selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Alert Details
                  </h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Alert ID
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {selectedAlert.alert_id}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Title
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {selectedAlert.title}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Severity
                        </label>
                        <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          getSeverityColor(selectedAlert.severity)
                        }`}>
                          {selectedAlert.severity}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Status
                        </label>
                        <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusColor(selectedAlert.status)
                        }`}>
                          {selectedAlert.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedAlert.description && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Description
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedAlert.description}
                      </p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Timeline
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Triggered:</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatDate(selectedAlert.triggered_at)}
                        </span>
                      </div>
                      {selectedAlert.acknowledged_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Acknowledged:</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {formatDate(selectedAlert.acknowledged_at)}
                          </span>
                        </div>
                      )}
                      {selectedAlert.resolved_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Resolved:</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {formatDate(selectedAlert.resolved_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions History */}
                  {selectedAlert.actions && selectedAlert.actions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Actions History
                      </h3>
                      <div className="space-y-3">
                        {selectedAlert.actions.map((action, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {action.action_type}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                by {action.username}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(action.created_at)}
                              </span>
                            </div>
                            {action.notes && (
                              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                {action.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}