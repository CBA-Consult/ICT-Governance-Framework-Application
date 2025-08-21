'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

export default function DashboardAccessManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDashboard, setFilterDashboard] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filterDashboard, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(filterDashboard !== 'all' && { dashboardType: filterDashboard }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/dashboard-access/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      setUsers(result.data.users);
      setTotalPages(result.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.user_id));
    }
  };

  const handleGrantAccess = async (dashboardTypes, reason, expiresAt) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/dashboard-access/grant', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          dashboardTypes,
          reason,
          expiresAt
        })
      });

      if (!response.ok) {
        throw new Error('Failed to grant dashboard access');
      }

      const result = await response.json();
      
      // Show success message
      alert(`Successfully granted dashboard access to ${result.data.summary.successfulGrants} users`);
      
      // Refresh users list
      fetchUsers();
      setSelectedUsers([]);
      setShowGrantModal(false);
    } catch (err) {
      console.error('Error granting access:', err);
      alert('Error granting dashboard access: ' + err.message);
    }
  };

  const handleRevokeAccess = async (dashboardTypes, reason) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/dashboard-access/revoke', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          dashboardTypes,
          reason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to revoke dashboard access');
      }

      const result = await response.json();
      
      // Show success message
      alert(`Successfully revoked dashboard access from ${result.data.summary.successfulRevocations} users`);
      
      // Refresh users list
      fetchUsers();
      setSelectedUsers([]);
      setShowRevokeModal(false);
    } catch (err) {
      console.error('Error revoking access:', err);
      alert('Error revoking dashboard access: ' + err.message);
    }
  };

  const getDashboardIcon = (dashboardType) => {
    switch (dashboardType) {
      case 'executive':
        return <UserGroupIcon className="h-4 w-4" />;
      case 'operational':
        return <AdjustmentsHorizontalIcon className="h-4 w-4" />;
      case 'compliance':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'analytics':
        return <EyeIcon className="h-4 w-4" />;
      default:
        return <LockClosedIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">Error: {error}</p>
          <button 
            onClick={fetchUsers}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Access Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage user access to different dashboard types
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={filterDashboard}
                onChange={(e) => setFilterDashboard(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Dashboards</option>
                <option value="executive">Executive</option>
                <option value="operational">Operational</option>
                <option value="compliance">Compliance</option>
                <option value="analytics">Analytics</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedUsers.length} selected
              </span>
              <button
                onClick={() => setShowGrantModal(true)}
                disabled={selectedUsers.length === 0}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Grant Access
              </button>
              <button
                onClick={() => setShowRevokeModal(true)}
                disabled={selectedUsers.length === 0}
                className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Revoke Access
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Dashboard Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.user_id)}
                        onChange={() => handleUserSelection(user.user_id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.dashboard_permissions?.map((permission) => {
                          const dashboardType = permission.replace('dashboard.', '');
                          return (
                            <span
                              key={permission}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            >
                              {getDashboardIcon(dashboardType)}
                              <span className="ml-1 capitalize">{dashboardType}</span>
                            </span>
                          );
                        })}
                        {(!user.dashboard_permissions || user.dashboard_permissions.length === 0) && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">No access</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.slice(0, 2).map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          >
                            {role.replace('_', ' ')}
                          </span>
                        ))}
                        {user.roles?.length > 2 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{user.roles.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'Active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grant Access Modal */}
        {showGrantModal && (
          <GrantAccessModal
            selectedUsers={selectedUsers}
            onGrant={handleGrantAccess}
            onClose={() => setShowGrantModal(false)}
          />
        )}

        {/* Revoke Access Modal */}
        {showRevokeModal && (
          <RevokeAccessModal
            selectedUsers={selectedUsers}
            onRevoke={handleRevokeAccess}
            onClose={() => setShowRevokeModal(false)}
          />
        )}
      </div>
    </div>
  );
}

// Grant Access Modal Component
function GrantAccessModal({ selectedUsers, onGrant, onClose }) {
  const [dashboardTypes, setDashboardTypes] = useState([]);
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleDashboardToggle = (type) => {
    setDashboardTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (dashboardTypes.length === 0) {
      alert('Please select at least one dashboard type');
      return;
    }
    onGrant(dashboardTypes, reason, expiresAt || null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Grant Dashboard Access
                  </h3>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Granting access to {selectedUsers.length} user(s)
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Dashboard Types
                        </label>
                        <div className="space-y-2">
                          {['executive', 'operational', 'compliance', 'analytics'].map((type) => (
                            <label key={type} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={dashboardTypes.includes(type)}
                                onChange={() => handleDashboardToggle(type)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">
                                {type} Dashboard
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reason (Optional)
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Reason for granting access..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Expires At (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Grant Access
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Revoke Access Modal Component
function RevokeAccessModal({ selectedUsers, onRevoke, onClose }) {
  const [dashboardTypes, setDashboardTypes] = useState([]);
  const [reason, setReason] = useState('');

  const handleDashboardToggle = (type) => {
    setDashboardTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (dashboardTypes.length === 0) {
      alert('Please select at least one dashboard type');
      return;
    }
    onRevoke(dashboardTypes, reason);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Revoke Dashboard Access
                  </h3>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Revoking access from {selectedUsers.length} user(s)
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Dashboard Types
                        </label>
                        <div className="space-y-2">
                          {['executive', 'operational', 'compliance', 'analytics'].map((type) => (
                            <label key={type} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={dashboardTypes.includes(type)}
                                onChange={() => handleDashboardToggle(type)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">
                                {type} Dashboard
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reason (Optional)
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Reason for revoking access..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Revoke Access
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}