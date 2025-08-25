'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function AssignRolesModal({ 
  isOpen, 
  onClose, 
  user, 
  onRolesUpdated 
}) {
  const { apiClient } = useAuth();
  const [availableRoles, setAvailableRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [reason, setReason] = useState('');

  // Fetch available roles and current user roles
  useEffect(() => {
    if (isOpen && user) {
      fetchAvailableRoles();
      fetchUserRoles();
    }
  }, [isOpen, user]);

  const fetchAvailableRoles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/roles?limit=100');
      setAvailableRoles(response.data.roles || []);
    } catch (err) {
      setError('Failed to fetch available roles');
      console.error('Fetch roles error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await apiClient.get(`/user-permissions/users/${user.user_id}/roles`);
      const currentRoles = response.data.roles || [];
      setUserRoles(currentRoles);
      
      // Set selected roles based on current user roles
      const roleIds = currentRoles.map(r => r.role_id);
      setSelectedRoles(new Set(roleIds));
    } catch (err) {
      setError('Failed to fetch user roles');
      console.error('Fetch user roles error:', err);
    }
  };

  const handleRoleToggle = (roleId) => {
    const newSelected = new Set(selectedRoles);
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId);
    } else {
      newSelected.add(roleId);
    }
    setSelectedRoles(newSelected);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Get current role IDs
      const currentRoleIds = new Set(userRoles.map(r => r.role_id));
      
      // Determine roles to add and remove
      const rolesToAdd = Array.from(selectedRoles).filter(
        roleId => !currentRoleIds.has(roleId)
      );
      const rolesToRemove = Array.from(currentRoleIds).filter(
        roleId => !selectedRoles.has(roleId)
      );

      // Add new roles
      if (rolesToAdd.length > 0) {
        await apiClient.post(`/user-permissions/users/${user.user_id}/roles`, {
          roleIds: rolesToAdd,
          reason: reason || 'Assigned via admin interface'
        });
      }

      // Remove roles
      for (const roleId of rolesToRemove) {
        await apiClient.delete(`/user-permissions/users/${user.user_id}/roles/${roleId}`, {
          data: { reason: reason || 'Removed via admin interface' }
        });
      }

      // Notify parent component
      if (onRolesUpdated) {
        onRolesUpdated();
      }

      onClose();
    } catch (err) {
      setError('Failed to update user roles');
      console.error('Save roles error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSearchTerm('');
    setReason('');
    onClose();
  };

  // Filter roles based on search term
  const filteredRoles = availableRoles.filter(role => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      role.display_name.toLowerCase().includes(searchLower) ||
      role.role_name.toLowerCase().includes(searchLower) ||
      role.description?.toLowerCase().includes(searchLower)
    );
  });

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
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <UserPlusIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Manage Roles for {user.first_name} {user.last_name}
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
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div><span className="font-medium">Email:</span> {user.email}</div>
                <div><span className="font-medium">Username:</span> {user.username}</div>
              </div>
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

            {/* Search */}
            <div className="mb-4">
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
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Changes (Optional)
              </label>
              <input
                type="text"
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., Role change due to department transfer"
              />
            </div>

            {/* Roles List */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Loading roles...</p>
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No roles found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRoles.map((role) => (
                    <div
                      key={role.role_id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center flex-1">
                        <input
                          type="checkbox"
                          id={`role-${role.role_id}`}
                          checked={selectedRoles.has(role.role_id)}
                          onChange={() => handleRoleToggle(role.role_id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`role-${role.role_id}`}
                          className="ml-3 flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {role.display_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {role.role_name}
                              </div>
                              {role.description && (
                                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                  {role.description}
                                </div>
                              )}
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
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Selected:</strong> {selectedRoles.size} role(s)
              </div>
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