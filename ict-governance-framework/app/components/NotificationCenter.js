'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ArchiveBoxIcon,
  TrashIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

export default function NotificationCenter() {
  const {
    notifications,
    stats,
    loading,
    error,
    connected,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setActionMenuOpen(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return notification.status === 'unread';
      case 'critical':
        return notification.priority === 'Critical';
      case 'security':
        return notification.category === 'security';
      case 'escalation':
        return notification.category === 'escalation';
      default:
        return true;
    }
  });

  // Get icon for notification type
  const getNotificationIcon = (notification) => {
    switch (notification.category) {
      case 'security':
        return <ShieldExclamationIcon className="h-5 w-5 text-red-500" />;
      case 'escalation':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'system':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'High':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (notification.status === 'unread') {
      await markAsRead(notification.notification_id);
    }
    
    // Navigate to related entity if available
    if (notification.related_entity_type && notification.related_entity_id) {
      const entityRoutes = {
        'feedback': '/feedback',
        'escalation': '/escalations',
        'document': '/documents',
        'alert': '/alerts'
      };
      
      const route = entityRoutes[notification.related_entity_type];
      if (route) {
        window.location.href = `${route}?id=${notification.related_entity_id}`;
      }
    }
  };

  // Handle action menu
  const handleAction = async (action, notificationId) => {
    setActionMenuOpen(null);
    
    switch (action) {
      case 'read':
        await markAsRead(notificationId);
        break;
      case 'archive':
        await archiveNotification(notificationId);
        break;
      case 'delete':
        await deleteNotification(notificationId);
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        {stats.unread > 0 ? (
          <BellSolidIcon className="h-6 w-6" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Unread count badge */}
        {stats.unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {stats.unread > 99 ? '99+' : stats.unread}
          </span>
        )}
        
        {/* Connection status indicator */}
        <span className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full ${
          connected ? 'bg-green-400' : 'bg-gray-400'
        }`} />
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {stats.unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Stats */}
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{stats.unread} unread</span>
              {stats.critical_unread > 0 && (
                <span className="text-red-600">{stats.critical_unread} critical</span>
              )}
              {!connected && (
                <span className="text-orange-600">Offline</span>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: stats.unread },
              { key: 'critical', label: 'Critical', count: stats.critical_unread },
              { key: 'security', label: 'Security', count: stats.security_unread }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-600 rounded-full px-1">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading notifications...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                Error: {error}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications found
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <div
                  key={notification.notification_id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    notification.status === 'unread' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {notification.subject}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          {/* Priority and time */}
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                              getPriorityColor(notification.priority)
                            }`}>
                              {notification.priority}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatRelativeTime(notification.created_at)}
                            </span>
                            {notification.status === 'unread' && (
                              <span className="h-2 w-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </div>
                        
                        {/* Action Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuOpen(
                                actionMenuOpen === notification.notification_id 
                                  ? null 
                                  : notification.notification_id
                              );
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </button>
                          
                          {actionMenuOpen === notification.notification_id && (
                            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              {notification.status === 'unread' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction('read', notification.notification_id);
                                  }}
                                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <CheckIcon className="h-4 w-4 mr-2" />
                                  Mark read
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction('archive', notification.notification_id);
                                }}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                                Archive
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction('delete', notification.notification_id);
                                }}
                                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/notifications';
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}