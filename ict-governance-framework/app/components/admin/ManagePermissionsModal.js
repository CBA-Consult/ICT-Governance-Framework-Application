'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

export default function ManagePermissionsModal({ 
  isOpen, 
  onClose, 
  role, 
  onPermissionsUpdated 
}) {
  const { apiClient } = useAuth();
  const [allPermissions, setAllPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [rolePermissions, setRolePermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResource, setFilterResource] = useState('');

  // Fetch all permissions and current role permissions
  useEffect(() => {
    if (isOpen && role) {
      fetchPermissions();
      fetchRolePermissions();
    }
  }, [isOpen, role]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/user-permissions/permissions');
      setAllPermissions(response.data.permissions || []);
      setGroupedPermissions(response.data.groupedPermissions || {});
    } catch (err) {
      setError('Failed to fetch permissions');
      console.error('Fetch permissions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const response = await apiClient.get(`/roles/${role.role_id}`);
      const currentPermissions = response.data.role.permissions || [];
      setRolePermissions(currentPermissions);
      
      // Set selected permissions based on current role permissions
      const permissionNames = currentPermissions.map(p => p.permissionName);
      setSelectedPermissions(new Set(permissionNames));
    } catch (err) {
      setError('Failed to fetch role permissions');
      console.error('Fetch role permissions error:', err);
    }
  };

  const handlePermissionToggle = (permissionName) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionName)) {
      newSelected.delete(permissionName);
    } else {
      newSelected.add(permissionName);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Get current permission names
      const currentPermissionNames = new Set(rolePermissions.map(p => p.permissionName));
      
      // Determine permissions to add and remove
      const permissionsToAdd = Array.from(selectedPermissions).filter(
        p => !currentPermissionNames.has(p)
      );
      const permissionsToRemove = Array.from(currentPermissionNames).filter(
        p => !selectedPermissions.has(p)
      );

      // Add new permissions
      if (permissionsToAdd.length > 0) {
        await apiClient.post(`/roles/${role.role_id}/permissions`, {
          permissions: permissionsToAdd
        });
      }

      // Remove permissions
      for (const permissionName of permissionsToRemove) {
        const permission = rolePermissions.find(p => p.permissionName === permissionName);
        if (permission) {
          await apiClient.delete(`/roles/${role.role_id}/permissions/${permission.permissionId}`);
        }
      }

      // Notify parent component
      if (onPermissionsUpdated) {
        onPermissionsUpdated();
      }

      onClose();
    } catch (err) {
      setError('Failed to update permissions');
      console.error('Save permissions error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSearchTerm('');
    setFilterResource('');
    onClose();
  };

  // Filter permissions based on search and resource filter
  const filteredGroupedPermissions = Object.entries(groupedPermissions).reduce((acc, [resource, permissions]) => {
    if (filterResource && resource !== filterResource) {
      return acc;
    }

    const filteredPermissions = permissions.filter(permission => {
      const matchesSearch = !searchTerm || 
        permission.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    if (filteredPermissions.length > 0) {
      acc[resource] = filteredPermissions;
    }

    return acc;
  }, {});

  const availableResources = Object.keys(groupedPermissions);

  if (!isOpen) return null;

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
                <KeyIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Manage Permissions for {role?.display_name}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              </div>
            )}

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
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
              <div>
                <select
                  value={filterResource}
                  onChange={(e) => setFilterResource(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">All Resources</option>
                  {availableResources.map(resource => (
                    <option key={resource} value={resource}>
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Permissions List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Loading permissions...</p>
                </div>
              ) : Object.keys(filteredGroupedPermissions).length === 0 ? (
                <div className="text-center py-8">
                  <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No permissions found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(filteredGroupedPermissions).map(([resource, permissions]) => (
                    <div key={resource} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 capitalize">
                        {resource} Permissions
                      </h4>
                      <div className="space-y-2">
                        {permissions.map((permission) => (
                          <div
                            key={permission.permission_id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <div className="flex items-center flex-1">
                              <input
                                type="checkbox"
                                id={`permission-${permission.permission_id}`}
                                checked={selectedPermissions.has(permission.permission_name)}
                                onChange={() => handlePermissionToggle(permission.permission_name)}
                                disabled={permission.is_system_permission && role?.role_type !== 'System'}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                              />
                              <label
                                htmlFor={`permission-${permission.permission_id}`}
                                className="ml-3 flex-1 cursor-pointer"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {permission.display_name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {permission.permission_name}
                                    </div>
                                    {permission.description && (
                                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                        {permission.description}
                                      </div>
                                    )}
                                  </div>
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
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}