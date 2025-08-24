'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, withAuth } from '../../contexts/AuthContext';
import {
  UserIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Import modal components
import AssignRolesModal from '../../components/admin/AssignRolesModal';
import ViewUserPermissionsModal from '../../components/admin/ViewUserPermissionsModal';

function UserPermissionsPage() {
  const { apiClient, user: currentUser, hasAllPermissions } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [showAssignRolesModal, setShowAssignRolesModal] = useState(false);
  const [showViewPermissionsModal, setShowViewPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users with their roles and permissions
  const fetchUsers = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(status && { status })
      });

      const response = await apiClient.get(`/users?${params}`);
      setUsers(response.data.users || []);
      setPagination(prev => ({
        ...prev,
        page: response.data.pagination.page,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      }));
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, searchTerm, statusFilter);
  };

  // Handle filter change
  const handleFilterChange = (status) => {
    setStatusFilter(status);
    fetchUsers(1, searchTerm, status);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchUsers(newPage, searchTerm, statusFilter);
  };

  // Handle assign roles
  const handleAssignRoles = (user) => {
    if (!hasAllPermissions(['user.manage_roles'])) {
      setError('You do not have permission to manage user roles');
      return;
    }
    setSelectedUser(user);
    setShowAssignRolesModal(true);
  };

  // Handle view permissions
  const handleViewPermissions = (user) => {
    if (!hasAllPermissions(['user.read'])) {
      setError('You do not have permission to view user permissions');
      return;
    }
    setSelectedUser(user);
    setShowViewPermissionsModal(true);
  };

  // Handle remove role
  const handleRemoveRole = async (userId, roleId, roleName) => {
    if (!hasAllPermissions(['user.manage_roles'])) {
      setError('You do not have permission to manage user roles');
      return;
    }

    if (!confirm(`Are you sure you want to remove the "${roleName}" role from this user?`)) {
      return;
    }

    try {
      await apiClient.delete(`/user-permissions/users/${userId}/roles/${roleId}`, {
        data: { reason: 'Removed via admin interface' }
      });
      setSuccessMessage(`Role "${roleName}" removed successfully`);
      fetchUsers(pagination.page, searchTerm, statusFilter);
    } catch (err) {
      setError('Failed to remove role');
      console.error('Remove role error:', err);
    }
  };

  // Clear messages
  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  // Callback functions for real-time updates
  const handleRolesUpdated = () => {
    setSuccessMessage('User roles updated successfully');
    fetchUsers(pagination.page, searchTerm, statusFilter);
  };

  const getUserStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getRoleTypeColor = (roleType) => {
    switch (roleType) {
      case 'System':
        return 'bg-red-100 text-red-800';
      case 'Custom':
        return 'bg-blue-100 text-blue-800';
      case 'Functional':
        return 'bg-green-100 text-green-800';
      case 'Organizational':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <UserIcon className="h-8 w-8 mr-3" />
                User Permissions Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage user role assignments and view effective permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <div className="text-red-800 flex-1">{error}</div>
              <button
                onClick={clearMessages}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
              <div className="text-green-800 flex-1">{successMessage}</div>
              <button
                onClick={clearMessages}
                className="text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </form>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Users</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.slice(0, 3).map((role) => (
                              <div key={role.role_id} className="flex items-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleTypeColor(role.role_type)}`}>
                                  {role.display_name}
                                </span>
                                {hasAllPermissions(['user.manage_roles']) && !role.is_system_role && (
                                  <button
                                    onClick={() => handleRemoveRole(user.user_id, role.role_id, role.display_name)}
                                    className="ml-1 text-red-500 hover:text-red-700"
                                    title="Remove role"
                                  >
                                    <XCircleIcon className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">No roles assigned</span>
                          )}
                          {user.roles && user.roles.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{user.roles.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {user.effective_permissions_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getUserStatusColor(user.is_active)}`}>
                          {user.is_active ? (
                            <>
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.last_login ? (
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {new Date(user.last_login).toLocaleDateString()}
                          </div>
                        ) : (
                          'Never'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {hasAllPermissions(['user.read']) && (
                            <button
                              onClick={() => handleViewPermissions(user)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View Permissions"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          )}
                          {hasAllPermissions(['user.manage_roles']) && (
                            <button
                              onClick={() => handleAssignRoles(user)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Manage Roles"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AssignRolesModal
        isOpen={showAssignRolesModal}
        onClose={() => setShowAssignRolesModal(false)}
        user={selectedUser}
        onRolesUpdated={handleRolesUpdated}
      />

      <ViewUserPermissionsModal
        isOpen={showViewPermissionsModal}
        onClose={() => setShowViewPermissionsModal(false)}
        user={selectedUser}
      />
    </div>
  );
}

// Export with authentication and permission requirements
export default withAuth(UserPermissionsPage, ['user.read'], ['admin', 'super_admin']);