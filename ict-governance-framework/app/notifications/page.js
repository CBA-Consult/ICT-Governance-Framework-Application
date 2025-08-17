'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import {
  BellIcon,
  CheckIcon,
  ArchiveBoxIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  DocumentIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const {
    notifications,
    stats,
    loading,
    error,
    connected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification
  } = useNotifications();

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/auth';
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Filter and search notifications
  const filteredNotifications = notifications
    .filter(notification => {
      // Apply filter
      switch (filter) {
        case 'unread':
          return notification.status === 'unread';
        case 'read':
          return notification.status === 'read';
        case 'critical':
          return notification.priority === 'Critical';
        case 'high':
          return notification.priority === 'High';
        case 'security':
          return notification.category === 'security';
        case 'escalation':
          return notification.category === 'escalation';
        case 'system':
          return notification.category === 'system';
        case 'workflow':
          return notification.category === 'workflow';
        default:
          return true;
      }
    })
    .filter(notification => {
      // Apply search
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.subject.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower) ||
        notification.category.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Apply sorting
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage);

  // Get icon for notification category
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'security':
        return <ShieldExclamationIcon className="h-5 w-5 text-red-500" />;
      case 'escalation':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'system':
        return <Cog6ToothIcon className="h-5 w-5 text-blue-500" />;
      case 'workflow':
        return <DocumentIcon className="h-5 w-5 text-purple-500" />;
      case 'communication':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-green-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    const promises = Array.from(selectedNotifications).map(notificationId => {
      switch (action) {
        case 'read':
          return markAsRead(notificationId);
        case 'archive':
          return archiveNotification(notificationId);
        case 'delete':
          return deleteNotification(notificationId);
        default:
          return Promise.resolve();
      }
    });

    await Promise.all(promises);
    setSelectedNotifications(new Set());
  };

  // Toggle notification selection
  const toggleSelection = (notificationId) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId);
    } else {
      newSelection.add(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  // Select all visible notifications
  const selectAll = () => {
    const allIds = new Set(paginatedNotifications.map(n => n.notification_id));
    setSelectedNotifications(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedNotifications(new Set());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Notifications
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage your notifications and stay updated with important information
              </p>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <BellIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unread}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <ShieldExclamationIcon className="h-8 w-8 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.critical_unread}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Security</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.security_unread}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="critical">Critical</option>
                  <option value="high">High Priority</option>
                  <option value="security">Security</option>
                  <option value="escalation">Escalations</option>
                  <option value="system">System</option>
                  <option value="workflow">Workflow</option>
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="created_at-desc">Newest First</option>
                  <option value="created_at-asc">Oldest First</option>
                  <option value="priority-desc">Priority High to Low</option>
                  <option value="priority-asc">Priority Low to High</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedNotifications.size > 0 && (
              <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedNotifications.size} notification(s) selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkAction('read')}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Mark Read
                  </button>
                  <button
                    onClick={() => handleBulkAction('archive')}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              Error: {error}
            </div>
          ) : paginatedNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No notifications found
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.size === paginatedNotifications.length}
                    onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select All
                  </span>
                  {stats.unread > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="ml-auto text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Mark All Read
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedNotifications.map(notification => (
                  <div
                    key={notification.notification_id}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      notification.status === 'unread' ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedNotifications.has(notification.notification_id)}
                        onChange={() => toggleSelection(notification.notification_id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />

                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getCategoryIcon(notification.category)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.subject}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {notification.message}
                            </p>
                            
                            {/* Metadata */}
                            <div className="mt-2 flex items-center space-x-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                getPriorityColor(notification.priority)
                              }`}>
                                {notification.priority}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {notification.category}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(notification.created_at)}
                              </span>
                              {notification.status === 'unread' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Unread
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            {notification.status === 'unread' && (
                              <button
                                onClick={() => markAsRead(notification.notification_id)}
                                className="p-1 text-gray-400 hover:text-blue-600"
                                title="Mark as read"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => archiveNotification(notification.notification_id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Archive"
                            >
                              <ArchiveBoxIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteNotification(notification.notification_id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}