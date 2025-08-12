"use client";
import React, { useState, useEffect } from 'react';

const EscalationsPage = () => {
  const [escalations, setEscalations] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchEscalations();
    fetchFeedbackItems();
  }, []);

  const fetchEscalations = async () => {
    try {
      const response = await fetch('/api/escalations/list');
      if (response.ok) {
        const data = await response.json();
        setEscalations(data);
      }
    } catch (error) {
      console.error('Failed to fetch escalations:', error);
    }
  };

  const fetchFeedbackItems = async () => {
    try {
      const response = await fetch('/api/feedback/list');
      if (response.ok) {
        const data = await response.json();
        setFeedbackItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch feedback items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalationAction = async (escalationId, action, notes = '') => {
    try {
      const response = await fetch(`/api/escalations/${escalationId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, notes }),
      });

      if (response.ok) {
        fetchEscalations();
        setShowModal(false);
        setSelectedEscalation(null);
      }
    } catch (error) {
      console.error('Failed to perform escalation action:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 font-bold';
      case 'High': return 'text-orange-600 font-semibold';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredEscalations = escalations.filter(escalation => {
    if (filter === 'all') return true;
    return escalation.status.toLowerCase() === filter;
  });

  const EscalationModal = ({ escalation, onClose, onAction }) => {
    const [action, setAction] = useState('');
    const [notes, setNotes] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Escalation Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Escalation ID:</h3>
              <p>{escalation.escalationId}</p>
            </div>
            <div>
              <h3 className="font-semibold">Feedback ID:</h3>
              <p>{escalation.feedbackId}</p>
            </div>
            <div>
              <h3 className="font-semibold">Current Level:</h3>
              <p>Level {escalation.escalationLevel} - {escalation.escalatedToRole}</p>
            </div>
            <div>
              <h3 className="font-semibold">Assigned To:</h3>
              <p>{escalation.escalatedTo}</p>
            </div>
            <div>
              <h3 className="font-semibold">Escalation Reason:</h3>
              <p>{escalation.escalationReason}</p>
            </div>
            <div>
              <h3 className="font-semibold">Created:</h3>
              <p>{new Date(escalation.escalationDate).toLocaleString()}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Take Action:</h3>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-3 bg-white dark:bg-gray-700"
              >
                <option value="">Select an action</option>
                <option value="acknowledge">Acknowledge</option>
                <option value="assign">Reassign</option>
                <option value="resolve">Resolve</option>
                <option value="escalate">Escalate Further</option>
                <option value="close">Close</option>
              </select>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes or comments..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-3 bg-white dark:bg-gray-700"
              />

              <div className="flex justify-end space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onAction(escalation.escalationId, action, notes)}
                  disabled={!action}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Action
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading escalations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Escalation Management</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor and manage feedback escalations across all governance domains.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Escalations</h3>
            <p className="text-3xl font-bold text-blue-600">{escalations.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Open</h3>
            <p className="text-3xl font-bold text-red-600">
              {escalations.filter(e => e.status === 'Open').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">In Progress</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {escalations.filter(e => e.status === 'In Progress').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Resolved</h3>
            <p className="text-3xl font-bold text-green-600">
              {escalations.filter(e => e.status === 'Resolved').length}
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="font-medium">Filter by Status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            >
              <option value="all">All Escalations</option>
              <option value="open">Open</option>
              <option value="in progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Escalations Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Escalation ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Feedback ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEscalations.map((escalation) => (
                  <tr key={escalation.escalationId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {escalation.escalationId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {escalation.feedbackId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={getPriorityColor(escalation.priority)}>
                        {escalation.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      Level {escalation.escalationLevel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {escalation.escalatedTo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(escalation.status)}`}>
                        {escalation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(escalation.escalationDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedEscalation(escalation);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEscalations.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No escalations found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filter === 'all' ? 'No escalations have been created yet.' : `No ${filter} escalations found.`}
              </p>
            </div>
          )}
        </div>

        {/* SLA Performance Summary */}
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">SLA Performance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">95%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Acknowledgment SLA Met</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">87%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Response SLA Met</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">78%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Resolution SLA Met</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">18h</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Avg Resolution Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedEscalation && (
        <EscalationModal
          escalation={selectedEscalation}
          onClose={() => {
            setShowModal(false);
            setSelectedEscalation(null);
          }}
          onAction={handleEscalationAction}
        />
      )}
    </div>
  );
};

export default EscalationsPage;