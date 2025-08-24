'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  XMarkIcon,
  EyeIcon,
  KeyIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function ViewUserPermissionsModal({ 
  isOpen, 
  onClose, 
  user 
}) {
  const { apiClient } = useAuth();
  const [userPermissions, setUserPermissions] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('permissions');

  // Fetch user permissions and roles
  useEffect(() => {
    if (isOpen && user) {
      fetchUserPermissions();
      fetchUserRoles();
    }
  }, [isOpen, user]);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/user-permissions/users/${user.user_id}/permissions`);
      setUserPermissions(response.data.permissions || []);
      setGroupedPermissions(response.data.groupedPermissions || {});
    } catch (err) {
      setError('Failed to fetch user permissions');
      console.error('Fetch user permissions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await apiClient.get(`/user-permissions/users/${user.user_id}/roles`);
      setUserRoles(response.data.roles || []);
    } catch (err) {
      setError('Failed to fetch user roles');
      console.error('Fetch user roles error:', err);
    }
  };

  const handleClose = () => {
    setError('');
    setSearchTerm('');
    setActiveTab('permissions');
    onClose();
  };

  // Filter permissions based on search term
  const filteredGroupedPermissions = Object.entries(groupedPermissions).reduce((acc, [resource, permissions]) => {
    if (!searchTerm) {
      acc[resource] = permissions;
      return acc;
    }

    const searchLower = searchTerm.toLowerCase();
    const filteredPermissions = permissions.filter(permission => 
      permission.display_name.toLowerCase().includes(searchLower) ||
      permission.permission_name.toLowerCase().includes(searchLower) ||
      permission.description?.toLowerCase().includes(searchLower) ||
      resource.toLowerCase().includes(searchLower)
    );

    if (filteredPermissions.length > 0) {
      acc[resource] = filteredPermissions;
    }

    return acc;
  }, {});

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <EyeIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Permissions for {user.first_name} {user.last_name}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div><span className="font-medium">Email:</span> {user.email}</div>
                <div><span className="font-medium">Username:</span> {user.username}</div>
                <div><span className="font-medium">Status:</span> 
                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div><span className="font-medium">Last Login:</span> {formatDate(user.last_login)}</div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-4">
              <nav className="flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'permissions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <KeyIcon className="h-4 w-4 inline mr-2" />
                  Effective Permissions ({userPermissions.length})
                </button>
                <button
                  onClick={() => setActiveTab('roles')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'roles'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <UserGroupIcon className="h-4 w-4 inline mr-2" />
                  Assigned Roles ({userRoles.length})
                </button>
              </nav>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            {/* Search */}
            {activeTab === 'permissions' && (
              <div className="mb-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
                </div>
              ) : activeTab === 'permissions' ? (
                Object.keys(filteredGroupedPermissions).length === 0 ? (
                  <div className="text-center py-8">
                    <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No permissions found matching your search' : 'No permissions assigned'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(filteredGroupedPermissions).map(([resource, permissions]) => (
                      <div key={resource} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 capitalize">
                          {resource} Permissions
                        </h4>
                        <div className="space-y-2">
                          {permissions.map((permission) => (
                            <div
                              key={permission.permission_id}
                              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {permission.display_name}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                    {permission.action}
                                  </span>
                                  {permission.scope && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                      {permission.scope}
                                    </span>
                                  )}
                                  {permission.is_system_permission && (
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                      System
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {permission.permission_name}
                              </div>
                              {permission.description && (
                                <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                                  {permission.description}
                                </div>
                              )}
                              {permission.granted_by_roles && permission.granted_by_roles.length > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  <span className="font-medium">Granted by roles:</span> {permission.granted_by_role_names.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Roles tab
                userRoles.length === 0 ? (
                  <div className="text-center py-8">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No roles assigned</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userRoles.map((role) => (
                      <div
                        key={role.role_id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {role.display_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {role.role_name}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleTypeColor(role.role_type)}`}>
                              {role.role_type}
                            </span>
                            {role.is_system_role && (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                System
                              </span>
                            )}
                          </div>
                        </div>
                        {role.description && (
                          <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                            {role.description}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            Assigned: {formatDate(role.assigned_at)}
                          </div>
                          {role.expires_at && (
                            <div className="flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Expires: {formatDate(role.expires_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}