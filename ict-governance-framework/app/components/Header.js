'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  UserCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import NotificationCenter from './NotificationCenter';

export default function Header() {
  const { isAuthenticated, user, logout, hasPermission, hasRole } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                CBA Consult IT Management Framework
              </h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                v3.2.0
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            {isAuthenticated && (
              <nav className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Dashboard
                </Link>
                
                {hasPermission('app.procurement') && (
                  <>
                    <Link href="/employee-app-store" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                      App Store
                    </Link>
                    <Link href="/application-procurement" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      Procurement
                    </Link>
                  </>
                )}

                {hasPermission('governance.read') && (
                  <Link href="/policies" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Policies
                  </Link>
                )}

                {hasPermission('document.read') && (
                  <Link href="/documents" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                    Document Management System
                  </Link>
                )}

                {hasPermission('workflow.approve') && (
                  <Link href="/workflows" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Workflows
                  </Link>
                )}

                {hasPermission('governance.read') && (
                  <Link href="/blueprints" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Blueprints
                  </Link>
                )}

                {hasPermission('compliance.read') && (
                  <>
                    <Link href="/compliance" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      Compliance
                    </Link>
                    <Link href="/compliance-dashboard" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      Compliance Dashboard
                    </Link>
                  </>
                )}

                {hasPermission('view_security_metrics') && (
                  <>
                    <Link href="/secure-score" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                      Secure Score
                    </Link>
                    <Link href="/ciso-dashboard" className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold flex items-center gap-1">
                      <ShieldCheckIcon className="h-4 w-4" />
                      CISO Dashboard
                    </Link>
                  </>
                )}

                {hasPermission('system.audit') && (
                  <Link href="/defender-activities" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Defender Activities
                  </Link>
                )}

                {hasPermission('alert.read') && (
                  <Link href="/alerts" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Alerts
                  </Link>
                )}

                <Link href="/notifications" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Notifications
                </Link>

                {hasPermission('data_collection_read') && (
                  <Link href="/data-collection" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Data Collection
                  </Link>
                )}

                {hasPermission('reporting_read') && (
                  <Link href="/reporting" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Reports
                  </Link>
                )}

                {hasPermission('data_analytics_read') && (
                  <Link href="/analytics" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Analytics
                  </Link>
                )}

                {hasPermission('feedback.create') && (
                  <>
                    <Link href="/feedback" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      Feedback
                    </Link>
                    <Link href="/escalations" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      Escalations
                    </Link>
                  </>
                )}

                <Link href="/docs" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-semibold">
                  Docs
                </Link>

                {/* Admin Links */}
                {(hasPermission('user.read') || hasPermission('role.read')) && (
                  <div className="relative">
                    <Link href="/admin" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 mr-1" />
                      Admin
                    </Link>
                  </div>
                )}
              </nav>
            )}

            {/* Notification Center */}
            {isAuthenticated && <NotificationCenter />}

            {/* User Menu or Login Button */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <div className="flex items-center space-x-2">
                    <UserCircleIcon className="h-8 w-8" />
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">
                        {user?.displayName || `${user?.firstName} ${user?.lastName}`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.jobTitle || user?.department || 'User'}
                      </div>
                    </div>
                    <ChevronDownIcon className="h-4 w-4" />
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.displayName || `${user?.firstName} ${user?.lastName}`}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Roles: {user?.roles?.join(', ') || 'None'}
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      Profile
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-2" />
                      Settings
                    </Link>

                    {(hasPermission('user.read') || hasPermission('role.read')) && (
                      <Link
                        href="/admin/users"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <ShieldCheckIcon className="h-4 w-4 mr-2" />
                        User Management
                      </Link>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth?mode=register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && (
          <div className="md:hidden pb-4">
            <nav className="flex flex-wrap gap-2">
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Dashboard
              </Link>
              
              {hasPermission('app.procurement') && (
                <>
                  <Link href="/employee-app-store" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    App Store
                  </Link>
                  <Link href="/application-procurement" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Procurement
                  </Link>
                </>
              )}

              {hasPermission('governance.read') && (
                <>
                  <Link href="/policies" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Policies
                  </Link>
                  <Link href="/blueprints" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Blueprints
                  </Link>
                </>
              )}

              {hasPermission('document.read') && (
                <Link href="/documents" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Documents
                </Link>
              )}

              {hasPermission('workflow.approve') && (
                <Link href="/workflows" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Workflows
                </Link>
              )}

              {hasPermission('compliance.read') && (
                <>
                  <Link href="/compliance" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Compliance
                  </Link>
                  <Link href="/compliance-dashboard" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Compliance Dashboard
                  </Link>
                </>
              )}

              {hasPermission('data_collection_read') && (
                <Link href="/data-collection" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Data Collection
                </Link>
              )}

              {hasPermission('reporting_read') && (
                <Link href="/reporting" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Reports
                </Link>
              )}

              {hasPermission('data_analytics_read') && (
                <Link href="/analytics" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Analytics
                </Link>
              )}

              {hasPermission('feedback.create') && (
                <>
                  <Link href="/feedback" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Feedback
                  </Link>
                  <Link href="/escalations" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Escalations
                  </Link>
                </>
              )}

              <Link href="/docs" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-semibold">
                Docs
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
}