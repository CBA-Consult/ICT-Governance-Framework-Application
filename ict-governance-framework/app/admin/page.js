'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, withAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { 
  UserGroupIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon
} from '@heroicons/react/24/outline';

function AdminDashboard() {
  const { apiClient, user: currentUser, hasAllPermissions } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    totalRoles: 0,
    recentActivities: [],
    systemHealth: 'good'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch user statistics
      const usersResponse = await apiClient.get('/users?limit=1');
      const rolesResponse = await apiClient.get('/roles');
      
      // Get user counts by status
      const activeUsersResponse = await apiClient.get('/users?status=Active&limit=1');
      const pendingUsersResponse = await apiClient.get('/users?status=Pending&limit=1');
      
      setStats({
        totalUsers: usersResponse.data.pagination.total || 0,
        activeUsers: activeUsersResponse.data.pagination.total || 0,
        pendingUsers: pendingUsersResponse.data.pagination.total || 0,
        totalRoles: rolesResponse.data.roles?.length || 0,
        recentActivities: [],
        systemHealth: 'good'
      });
    } catch (err) {
      setError('Failed to fetch dashboard statistics');
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add, edit, and manage user accounts',
      icon: UserGroupIcon,
      href: '/admin/users',
      color: 'bg-blue-500',
      requiredPermissions: ['user.read']

    },
    {
      title: 'Role Management',
      description: 'Configure roles and permissions',
      icon: ShieldCheckIcon,
      href: '/admin/roles',
      color: 'bg-green-500',
      requiredPermissions: ['role.read']
    },
    {
      title: 'System Policies',
      description: 'Manage governance policies',
      icon: DocumentTextIcon,
      href: '/policies',
      color: 'bg-purple-500',
      requiredPermissions: ['governance.read']
    },
    {
      title: 'Analytics',
      description: 'View system analytics and reports',
      icon: ChartBarIcon,
      href: '/analytics',
      color: 'bg-orange-500',
      requiredPermissions: ['reporting.read']
    }
  ];

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'good':
        return CheckCircleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'critical':
        return ExclamationTriangleIcon;
      default:
        return ClockIcon;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <CogIcon className="h-8 w-8 mr-3" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {currentUser?.firstName}. Manage your ICT governance system.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.totalUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.activeUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Users</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.pendingUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Roles</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.totalRoles}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions
              .filter(action => !action.requiredPermissions || hasAllPermissions(action.requiredPermissions))
              .map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6 block"
                >
                  <div className="flex items-center mb-4">
                    <div className={`flex-shrink-0 p-3 rounded-lg ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {action.description}
                  </p>
                </Link>
              ))}
          </div>
          {quickActions.filter(action => !action.requiredPermissions || hasAllPermissions(action.requiredPermissions)).length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No actions available with your current permissions.</p>
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Health</h2>
          <div className="flex items-center">
            {React.createElement(getHealthIcon(stats.systemHealth), {
              className: `h-6 w-6 mr-3 ${getHealthStatusColor(stats.systemHealth)}`
            })}
            <span className={`text-lg font-medium ${getHealthStatusColor(stats.systemHealth)}`}>
              {stats.systemHealth === 'good' ? 'All Systems Operational' : 
               stats.systemHealth === 'warning' ? 'Minor Issues Detected' : 
               'Critical Issues Detected'}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Last checked: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// Export with authentication and permission requirements
export default withAuth(AdminDashboard, ['system.admin'], ['admin', 'super_admin']);

