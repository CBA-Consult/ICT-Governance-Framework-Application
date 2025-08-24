'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, withAuth } from '../../contexts/AuthContext';
import CreateRoleModal from '../../components/admin/CreateRoleModal';
import { 
  ShieldCheckIcon,
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  KeyIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

function RoleManagementPage() {
  const { apiClient, user: currentUser, hasAllPermissions } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeTab, setActiveTab] = useState('roles');

  // Fetch roles
  const fetchRoles = async (page = 1, search = '', type = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(type && { type })
      });

      const response = await apiClient.get(`/roles?${params}`);
      setRoles(response.data.roles || []);
      setPagination(prev => ({
        ...prev,
        page: response.data.pagination.page,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      }));
    } catch (err) {
      setError('Failed to fetch roles');
      console.error('Fetch roles error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions
  const fetchPermissions = async () => {
    try {
      const response = await apiClient.get('/roles/permissions/all');
      setPermissions(response.data.permissions || []);
      setGroupedPermissions(response.data.groupedPermissions || {});
    } catch (err) {
      setError('Failed to fetch permissions');
      console.error('Fetch permissions error:', err);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchRoles(1, searchTerm, typeFilter);
  };

  // Handle filter change
  const handleFilterChange = (type) => {
    setTypeFilter(type);
    fetchRoles(1, searchTerm, type);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchRoles(newPage, searchTerm, typeFilter);
  };

  // Handle create role
  const handleCreateRole = () => {
    if (!hasAllPermissions(['role.create'])) {
      setError('You do not have permission to create roles');
      return;
    }
    setSelectedRole(null);
    setShowCreateModal(true);
  };

  // Handle edit role
  const handleEditRole = (role) => {
    if (!hasAllPermissions(['role.update'])) {
      setError('You do not have permission to edit roles');
      return;
    }
    setSelectedRole(role);
    setShowEditModal(true);
  };

  // Handle manage permissions
  const handleManagePermissions = (role) => {
    if (!hasAllPermissions(['role.manage_permissions'])) {
      setError('You do not have permission to manage role permissions');
      return;
    }
    setSelectedRole(role);
    setShowPermissionsModal(true);
  };

  // Handle delete role
  const handleDeleteRole = async (roleId) => {
    if (!hasAllPermissions(['role.delete'])) {
      setError('You do not have permission to delete roles');
      return;
    }

    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/roles/${roleId}`);
      setSuccessMessage('Role deleted successfully');
      fetchRoles(pagination.page, searchTerm, typeFilter);
    } catch (err) {
      setError('Failed to delete role');
      console.error('Delete role error:', err);
    }
  };

  // Handle role created successfully
  const handleRoleCreated = (newRole) => {
    setSuccessMessage('Role created successfully');
    fetchRoles(pagination.page, searchTerm, typeFilter);
    setShowCreateModal(false);
  };

  // Clear messages
  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const getRoleTypeColor = (type) => {
    switch (type) {
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
                <ShieldCheckIcon className="h-8 w-8 mr-3" />
                Role &amp; Permission Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage user roles and permissions for the ICT governance system.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              Roles
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <KeyIcon className="h-5 w-5 inline mr-2" />
              Permissions
            </button>
          </nav>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
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

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <>
            {/* Search and Filter Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </form>
                
                <div className="flex gap-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All Types</option>
                    <option value="System">System</option>
                    <option value="Custom">Custom</option>
                    <option value="Functional">Functional</option>
                    <option value="Organizational">Organizational</option>
                  </select>
                  
                  {hasAllPermissions(['role.create']) && (
                    <button
                      onClick={handleCreateRole}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Role
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Roles Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
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
                          Loading roles...
                        </td>
                      </tr>
                    ) : roles.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          No roles found
                        </td>
                      </tr>
                    ) : (
                      roles.map((role) => (
                        <tr key={role.role_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {role.display_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {role.role_name}
                              </div>
                              {role.description && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {role.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleTypeColor(role.role_type)}`}>
                              {role.role_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {role.userCount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {role.permissions ? role.permissions.length : 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {role.is_active ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                <XCircleIcon className="h-3 w-3 mr-1" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              {hasAllPermissions(['role.manage_permissions']) && (
                                <button
                                  onClick={() => handleManagePermissions(role)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Manage Permissions"
                                >
                                  <KeyIcon className="h-4 w-4" />
                                </button>
                              )}
                              {hasAllPermissions(['role.update']) && (
                                <button
                                  onClick={() => handleEditRole(role)}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  title="Edit Role"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                              )}
                              {hasAllPermissions(['role.delete']) && !role.is_system_role && (
                                <button
                                  onClick={() => handleDeleteRole(role.role_id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  title="Delete Role"
                                >
                                  <TrashIcon className="h-4 w-4" />
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
          </>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Available Permissions
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              View all available permissions in the system, organized by resource.
            </p>
            
            {Object.keys(groupedPermissions).length === 0 ? (
              <div className="text-center py-8">
                <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No permissions found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
                  <div key={resource} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 capitalize">
                      {resource} Permissions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {resourcePermissions.map((permission) => (
                        <div
                          key={permission.permission_id}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {permission.display_name}
                            </span>
                            {permission.is_system_permission && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                System
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {permission.permission_name}
                          </div>
                          {permission.description && (
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                              {permission.description}
                            </div>
                          )}
                          <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                              {permission.action}
                            </span>
                            {permission.scope && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                {permission.scope}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals would go here - CreateRoleModal, EditRoleModal, ManagePermissionsModal */}
      {/* For now, these are placeholders as they would require additional components */}
      {/* Create Role Modal */}
      <CreateRoleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoleCreated={handleRoleCreated}
        apiClient={apiClient}
      />
    </div>
  );
}

// Export with authentication and permission requirements
export default withAuth(RoleManagementPage, ['role.read'], ['admin', 'super_admin']);