'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export default function EditRoleModal({ 
  isOpen, 
  onClose, 
  role,
  onRoleUpdated 
}) {
  const { apiClient } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    roleType: 'Custom',
    roleHierarchyLevel: 0,
    parentRoleId: ''
  });
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize form data when role changes
  useEffect(() => {
    if (isOpen && role) {
      setFormData({
        displayName: role.display_name || '',
        description: role.description || '',
        roleType: role.role_type || 'Custom',
        roleHierarchyLevel: role.role_hierarchy_level || 0,
        parentRoleId: role.parent_role_id || ''
      });
      fetchAvailableRoles();
      setError('');
      setValidationErrors({});
    }
  }, [isOpen, role]);

  const fetchAvailableRoles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/roles?limit=100');
      // Filter out the current role and its descendants to prevent circular references
      const filteredRoles = (response.data.roles || []).filter(r => 
        r.role_id !== role?.role_id
      );
      setAvailableRoles(filteredRoles);
    } catch (err) {
      console.error('Fetch roles error:', err);
    } finally {
      setLoading(false);
    }
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

  const validateForm = () => {
    const errors = {};

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

      const updateData = {
        ...formData,
        roleHierarchyLevel: parseInt(formData.roleHierarchyLevel) || 0
      };

      // Remove empty parentRoleId
      if (!updateData.parentRoleId) {
        delete updateData.parentRoleId;
      }

      const response = await apiClient.put(`/roles/${role.role_id}`, updateData);

      if (onRoleUpdated) {
        onRoleUpdated(response.data.role);
      }

      onClose();
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to update role');
      }
      console.error('Update role error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError('');
    setValidationErrors({});
    onClose();
  };

  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <PencilIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Edit Role: {role.display_name}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Role Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Role Name:</span> {role.role_name}
              </div>
              {role.is_system_role && (
                <div className="mt-1">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    System Role - Limited Editing
                  </span>
                </div>
              )}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name */}
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

              {/* Description */}
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

              {/* Role Configuration - Only for non-system roles */}
              {!role.is_system_role && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              )}

              {/* Parent Role - Only for non-system roles */}
              {!role.is_system_role && (
                <div>
                  <label htmlFor="parentRoleId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Parent Role
                  </label>
                  <select
                    id="parentRoleId"
                    name="parentRoleId"
                    value={formData.parentRoleId}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  >
                    <option value="">No Parent Role</option>
                    {availableRoles.map(availableRole => (
                      <option key={availableRole.role_id} value={availableRole.role_id}>
                        {availableRole.display_name}
                      </option>
                    ))}
                  </select>
                  {loading && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Loading roles...</p>
                  )}
                </div>
              )}

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
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Update Role
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