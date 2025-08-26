'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function AddUserModal({ isOpen, onClose, onUserAdded, apiClient }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    department: '',
    jobTitle: '',
    roles: [],
    status: 'Active'
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[@$!%*?&]/.test(password)) strength += 1;
    if (password.length >= 16) strength += 1;
    return Math.min(strength, 5);
  };

  const getPasswordStrengthLabel = (strength) => {
    switch (strength) {
      case 0:
      case 1: return 'Very Weak';
      case 2: return 'Weak';
      case 3: return 'Fair';
      case 4: return 'Good';
      case 5: return 'Strong';
      default: return 'Very Weak';
    }
  };

  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 0:
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-blue-500';
      case 5: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  // Fetch available roles
  const fetchRoles = async () => {
    try {
      const response = await apiClient.get('/roles');
      setRoles(response.data.roles || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
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
    
    // Real-time validation for specific fields
    validateField(name, value);
  };

  const handleRoleChange = (roleName, checked) => {
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, roleName]
        : prev.roles.filter(role => role !== roleName)
    }));
  };

  const validateField = (fieldName, value) => {
    const errors = {};
    
    switch (fieldName) {
      case 'username':
        if (!value.trim()) {
          errors.username = 'Username is required';
        } else if (value.length < 3 || value.length > 50) {
          errors.username = 'Username must be 3-50 characters';
        } else if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          errors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
        }
        break;
        
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
        
      case 'password':
        // Calculate password strength
        const strength = calculatePasswordStrength(value);
        setPasswordStrength(strength);
        
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value)) {
          errors.password = 'Password must contain uppercase, lowercase, number, and special character';
        } else if (strength < 3) {
          errors.password = 'Password is too weak. Please use a stronger password.';
        }
        
        // Also validate confirm password if it exists
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        } else if (formData.confirmPassword && value === formData.confirmPassword) {
          // Clear confirm password error if passwords now match
          setFieldErrors(prev => ({
            ...prev,
            confirmPassword: ''
          }));
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;
        
      case 'firstName':
        if (!value.trim()) {
          errors.firstName = 'First name is required';
        } else if (value.length > 100) {
          errors.firstName = 'First name must be less than 100 characters';
        }
        break;
        
      case 'lastName':
        if (!value.trim()) {
          errors.lastName = 'Last name is required';
        } else if (value.length > 100) {
          errors.lastName = 'Last name must be less than 100 characters';
        }
        break;
        
      case 'department':
        if (value && value.length > 100) {
          errors.department = 'Department must be less than 100 characters';
        }
        break;
        
      case 'jobTitle':
        if (value && value.length > 150) {
          errors.jobTitle = 'Job title must be less than 150 characters';
        }
        break;
    }
    
    setFieldErrors(prev => ({
      ...prev,
      ...errors
    }));
    
    return Object.keys(errors).length === 0;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3 || formData.username.length > 50) {
      newErrors.username = 'Username must be 3-50 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length > 100) {
      newErrors.firstName = 'First name must be less than 100 characters';
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length > 100) {
      newErrors.lastName = 'Last name must be less than 100 characters';
    }
    
    // Optional field length validation
    if (formData.department && formData.department.length > 100) {
      newErrors.department = 'Department must be less than 100 characters';
    }
    
    if (formData.jobTitle && formData.jobTitle.length > 150) {
      newErrors.jobTitle = 'Job title must be less than 150 characters';
    }
    
    setFieldErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setError('Please correct the errors below');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const userData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        password: formData.password,
        department: formData.department.trim() || null,
        job_title: formData.jobTitle.trim() || null,
        roles: formData.roles,
        status: formData.status
      };

      const response = await apiClient.post('/users', userData);
      
      // Reset form
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: '',
        department: '',
        jobTitle: '',
        roles: [],
        status: 'Active'
      });
      setFieldErrors({});
      setPasswordStrength(0);
      
      // Pass user information back to parent for success message
      onUserAdded({
        username: userData.username,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name
      });
      onClose();
    } catch (err) {
      console.error('Create user error:', err);
      
      // Handle validation errors from server
      if (err.response?.data?.code === 'VALIDATION_ERROR' && err.response?.data?.details) {
        const serverErrors = {};
        err.response.data.details.forEach(detail => {
          const field = detail.field || detail.path || detail.param;
          if (field) {
            serverErrors[field] = detail.message || detail.msg;
          }
        });
        setFieldErrors(serverErrors);
        setError(err.response.data.message || 'Please correct the validation errors');
      } else if (err.response?.data?.code === 'USER_EXISTS' && err.response?.data?.details) {
        const serverErrors = {};
        err.response.data.details.forEach(detail => {
          serverErrors[detail.field] = detail.message;
        });
        setFieldErrors(serverErrors);
        setError(err.response.data.message || 'User already exists');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create user');
        setFieldErrors({});
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      department: '',
      jobTitle: '',
      roles: [],
      status: 'Active'
    });
    setError('');
    setFieldErrors({});
    setPasswordStrength(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col transform transition-all duration-300">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New User</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  fieldErrors.username 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                required
                aria-invalid={fieldErrors.username ? 'true' : 'false'}
                aria-describedby={fieldErrors.username ? 'username-error' : undefined}
              />
              {fieldErrors.username && (
                <p id="username-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  fieldErrors.email 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                required
                aria-invalid={fieldErrors.email ? 'true' : 'false'}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  fieldErrors.firstName 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                required
                aria-invalid={fieldErrors.firstName ? 'true' : 'false'}
                aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
              />
              {fieldErrors.firstName && (
                <p id="firstName-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  fieldErrors.lastName 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                required
                aria-invalid={fieldErrors.lastName ? 'true' : 'false'}
                aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
              />
              {fieldErrors.lastName && (
                <p id="lastName-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.lastName}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    fieldErrors.password 
                      ? 'border-red-300 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                  aria-invalid={fieldErrors.password ? 'true' : 'false'}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.password}
                </p>
              )}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Password Strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength < 2 ? 'text-red-600' :
                      passwordStrength < 3 ? 'text-orange-600' :
                      passwordStrength < 4 ? 'text-yellow-600' :
                      passwordStrength < 5 ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {getPasswordStrengthLabel(passwordStrength)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    fieldErrors.confirmPassword 
                      ? 'border-red-300 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                  aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  fieldErrors.department 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                aria-invalid={fieldErrors.department ? 'true' : 'false'}
                aria-describedby={fieldErrors.department ? 'department-error' : undefined}
              />
              {fieldErrors.department && (
                <p id="department-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.department}
                </p>
              )}
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Title
              </label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  fieldErrors.jobTitle 
                    ? 'border-red-300 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                aria-invalid={fieldErrors.jobTitle ? 'true' : 'false'}
                aria-describedby={fieldErrors.jobTitle ? 'jobTitle-error' : undefined}
              />
              {fieldErrors.jobTitle && (
                <p id="jobTitle-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.jobTitle}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Roles */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Roles
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => (
                <label key={role.role_id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role.role_name)}
                    onChange={(e) => handleRoleChange(role.role_name, e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {role.display_name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || Object.keys(fieldErrors).some(key => fieldErrors[key])}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={Object.keys(fieldErrors).some(key => fieldErrors[key]) ? 'Please fix validation errors before submitting' : ''}
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}