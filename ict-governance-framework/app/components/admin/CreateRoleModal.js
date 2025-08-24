'use client';


import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function CreateRoleModal({ isOpen, onClose, onRoleCreated, apiClient }) {

  const [formData, setFormData] = useState({
    roleName: '',
    displayName: '',
    description: '',
    roleType: 'Custom',
    roleHierarchyLevel: 1,
    permissions: []
  });
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());

  // Fetch available permissions
  const fetchPermissions = async () => {
    try {
      const response = await apiClient.get('/roles/permissions/all');
      setAvailablePermissions(response.data.permissions || []);
      setGroupedPermissions(response.data.groupedPermissions || {});
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setError('Failed to load permissions');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
      // Reset form when modal opens
      setFormData({
        roleName: '',
        displayName: '',
        description: '',
        roleType: 'Custom',
        roleHierarchyLevel: 1,
        permissions: []
      });
      setSelectedPermissions(new Set());
      setError('');
      setFieldErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Auto-generate role name from display name if role name is empty
    if (name === 'displayName' && !formData.roleName) {
      const generatedRoleName = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      setFormData(prev => ({
        ...prev,
        roleName: generatedRoleName
      }));
    }
  };

  const handlePermissionChange = (permissionName, checked) => {
    const newSelectedPermissions = new Set(selectedPermissions);
    if (checked) {
      newSelectedPermissions.add(permissionName);
    } else {
      newSelectedPermissions.delete(permissionName);
    }
    setSelectedPermissions(newSelectedPermissions);
    
    setFormData(prev => ({
      ...prev,
      permissions: Array.from(newSelectedPermissions)
    }));
  };

  const handleSelectAllPermissions = (resource, checked) => {
    const resourcePermissions = groupedPermissions[resource] || [];
    const newSelectedPermissions = new Set(selectedPermissions);
    
    resourcePermissions.forEach(permission => {
      if (checked) {
        newSelectedPermissions.add(permission.permission_name);
      } else {
        newSelectedPermissions.delete(permission.permission_name);
      }
    });
    
    setSelectedPermissions(newSelectedPermissions);
    setFormData(prev => ({
      ...prev,
      permissions: Array.from(newSelectedPermissions)
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.roleName.trim()) {
      errors.roleName = 'Role name is required';
    } else if (formData.roleName.length < 3 || formData.roleName.length > 100) {
      errors.roleName = 'Role name must be 3-100 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.roleName)) {
      errors.roleName = 'Role name can only contain letters, numbers, underscores, and hyphens';
    }
    
    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
    }
    
    if (!formData.roleType) {
      errors.roleType = 'Role type is required';
    }
    
    if (formData.roleHierarchyLevel < 1 || formData.roleHierarchyLevel > 10) {
      errors.roleHierarchyLevel = 'Role hierarchy level must be between 1 and 10';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const roleData = {
        roleName: formData.roleName.trim(),
        displayName: formData.displayName.trim(),
        description: formData.description.trim(),
        roleType: formData.roleType,
        roleHierarchyLevel: parseInt(formData.roleHierarchyLevel),
        permissions: formData.permissions
      };
      
      const response = await apiClient.post('/roles', roleData);
      
      if (onRoleCreated) {
        onRoleCreated(response.data.role);
      }
      
      onClose();
    } catch (err) {
      console.error('Create role error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      } else {
        setError('Failed to create role. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Create New Role
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role Name */}
            <div>
              <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role Name *
              </label>
              <input
                type="text"
                id="roleName"
                name="roleName"
                value={formData.roleName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  fieldErrors.roleName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., content_manager or Content-Manager"
                disabled={loading}
              />
              {fieldErrors.roleName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.roleName}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Letters, numbers, underscores, and hyphens only (3-100 characters)
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  fieldErrors.displayName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., Content Manager"
                disabled={loading}
              />
              {fieldErrors.displayName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.displayName}</p>
              )}
            </div>

            {/* Role Type */}
            <div>
              <label htmlFor="roleType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role Type *
              </label>
              <select
                id="roleType"
                name="roleType"
                value={formData.roleType}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  fieldErrors.roleType ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={loading}
              >
                <option value="Custom">Custom</option>
                <option value="Functional">Functional</option>
                <option value="Organizational">Organizational</option>
              </select>
              {fieldErrors.roleType && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.roleType}</p>
              )}
            </div>

            {/* Role Hierarchy Level */}
            <div>
              <label htmlFor="roleHierarchyLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hierarchy Level *
              </label>
              <input
                type="number"
                id="roleHierarchyLevel"
                name="roleHierarchyLevel"
                value={formData.roleHierarchyLevel}
                onChange={handleInputChange}
                min="1"
                max="10"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  fieldErrors.roleHierarchyLevel ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={loading}
              />
              {fieldErrors.roleHierarchyLevel && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.roleHierarchyLevel}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                1 = Highest level, 10 = Lowest level
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Describe the role's purpose and responsibilities..."
              disabled={loading}
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Permissions ({selectedPermissions.size} selected)
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-96 overflow-y-auto">
              {Object.keys(groupedPermissions).length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Loading permissions...
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => {
                    const allSelected = resourcePermissions.every(p => selectedPermissions.has(p.permission_name));
                    const someSelected = resourcePermissions.some(p => selectedPermissions.has(p.permission_name));
                    
                    return (
                      <div key={resource} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {resource} Permissions
                          </h4>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={input => {
                                if (input) input.indeterminate = someSelected && !allSelected;
                              }}
                              onChange={(e) => handleSelectAllPermissions(resource, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              disabled={loading}
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              Select All
                            </span>
                          </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {resourcePermissions.map((permission) => (
                            <label key={permission.permission_id} className="flex items-start">
                              <input
                                type="checkbox"
                                checked={selectedPermissions.has(permission.permission_name)}
                                onChange={(e) => handlePermissionChange(permission.permission_name, e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                                disabled={loading}
                              />
                              <div className="ml-2 flex-1">
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
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Create Role
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}