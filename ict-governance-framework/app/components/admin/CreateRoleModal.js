'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  XMarkIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function CreateRoleModal({ 
  isOpen, 
  onClose, 
  onRoleCreated 
}) {
  const { apiClient } = useAuth();
  const [formData, setFormData] = useState({
    roleName: '',
    displayName: '',
    description: '',
    roleType: 'Custom',
    roleHierarchyLevel: 0,
    parentRoleId: '',
    permissions: []
  });
  const [allPermissions, setAllPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch permissions and roles when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
      fetchAvailableRoles();
      resetForm();
    }
  }, [isOpen]);

  const fetchPermissions = async () => {
    try {
      const response = await apiClient.get('/user-permissions/permissions');
      setAllPermissions(response.data.permissions || []);
      setGroupedPermissions(response.data.groupedPermissions || {});
    } catch (err) {
      setError('Failed to fetch permissions');
      console.error('Fetch permissions error:', err);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      const response = await apiClient.get('/roles?limit=100');
      setAvailableRoles(response.data.roles || []);
    } catch (err) {
      console.error('Fetch roles error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      roleName: '',
      displayName: '',
      description: '',
      roleType: 'Custom',
      roleHierarchyLevel: 0,
      parentRoleId: '',
      permissions: []
    });
    setSelectedPermissions(new Set());
    setError('');
    setValidationErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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

  const validateForm = () => {
    const errors = {};

    if (!formData.roleName.trim()) {
      errors.roleName = 'Role name is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.roleName)) {
      errors.roleName = 'Role name can only contain letters, numbers, underscores, and hyphens';
    } else if (formData.roleName.length < 3 || formData.roleName.length > 100) {
      errors.roleName = 'Role name must be between 3 and 100 characters';
    }

    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (formData.displayName.length > 150) {
      errors.displayName = 'Display name must be less than 150 characters';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      const roleData = {
        ...formData,
        permissions: Array.from(selectedPermissions),
        roleHierarchyLevel: parseInt(formData.roleHierarchyLevel) || 0
      };

      // Remove empty parentRoleId
      if (!roleData.parentRoleId) {
        delete roleData.parentRoleId;
      }

      const response = await apiClient.post('/roles', roleData);

      if (onRoleCreated) {
        onRoleCreated(response.data.role);
      }

      onClose();
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to create role');
      }
      console.error('Create role error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <UserGroupIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Create New Role
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    id="roleName"
                    name="roleName"
                    value={formData.roleName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                      validationErrors.roleName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., data_analyst"
                  />
                  {validationErrors.roleName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.roleName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                      validationErrors.displayName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., Data Analyst"
                  />
                  {validationErrors.displayName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.displayName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    validationErrors.description ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Describe the role's purpose and responsibilities"
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                )}
              </div>

              {/* Role Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="roleType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role Type
                  </label>
                  <select
                    id="roleType"
                    name="roleType"
                    value={formData.roleType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Custom">Custom</option>
                    <option value="Functional">Functional</option>
                    <option value="Organizational">Organizational</option>
                    <option value="System">System</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="roleHierarchyLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hierarchy Level
                  </label>
                  <input
                    type="number"
                    id="roleHierarchyLevel"
                    name="roleHierarchyLevel"
                    min="0"
                    max="10"
                    value={formData.roleHierarchyLevel}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="parentRoleId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Parent Role
                  </label>
                  <select
                    id="parentRoleId"
                    name="parentRoleId"
                    value={formData.parentRoleId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">No Parent Role</option>
                    {availableRoles.map(role => (
                      <option key={role.role_id} value={role.role_id}>
                        {role.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Permissions Selection */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Assign Permissions
                </h4>
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  {Object.keys(groupedPermissions).length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No permissions available
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                        <div key={resource}>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                            {resource} Permissions
                          </h5>
                          <div className="space-y-1 ml-4">
                            {permissions.map((permission) => (
                              <label
                                key={permission.permission_id}
                                className="flex items-center cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.has(permission.permission_name)}
                                  onChange={() => handlePermissionToggle(permission.permission_name)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                  {permission.display_name}
                                </span>
                                {permission.is_system_permission && (
                                  <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                    System
                                  </span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Selected {selectedPermissions.size} permission(s)
                </p>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Role
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}