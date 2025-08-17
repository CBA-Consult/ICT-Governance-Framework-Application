'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    critical_unread: 0,
    high_unread: 0,
    security_unread: 0,
    escalation_unread: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!token) return;

    try {
      const params = new URLSearchParams({
        limit: options.limit || 50,
        offset: options.offset || 0,
        status: options.status || 'unread',
        include_read: options.include_read || false,
        ...options.filters
      });

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      if (options.append) {
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }

      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching notifications:', err);
    }
  }, [token]);

  // Fetch notification statistics
  const fetchStats = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching notification stats:', err);
    }
  }, [token]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.notification_id === notificationId 
            ? { ...notif, status: 'read', read_at: new Date().toISOString() }
            : notif
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));

      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [token]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          status: 'read', 
          read_at: new Date().toISOString() 
        }))
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        unread: 0,
        critical_unread: 0,
        high_unread: 0,
        security_unread: 0,
        escalation_unread: 0
      }));

      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [token]);

  // Archive notification
  const archiveNotification = useCallback(async (notificationId) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to archive notification');
      }

      // Remove from local state
      setNotifications(prev => 
        prev.filter(notif => notif.notification_id !== notificationId)
      );

      return true;
    } catch (err) {
      console.error('Error archiving notification:', err);
      return false;
    }
  }, [token]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Remove from local state
      setNotifications(prev => 
        prev.filter(notif => notif.notification_id !== notificationId)
      );

      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  }, [token]);

  // Setup real-time notifications via Server-Sent Events
  const setupRealTimeNotifications = useCallback(() => {
    if (!token || !user) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(`/api/realtime/stream`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      eventSource.onopen = () => {
        console.log('Real-time notification connection opened');
        setConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connection':
              console.log('Connected to notification stream');
              break;
              
            case 'heartbeat':
              // Keep connection alive
              break;
              
            case 'notification':
              // Add new notification to the list
              setNotifications(prev => [data.data, ...prev]);
              setStats(prev => ({
                ...prev,
                unread: prev.unread + 1,
                total: prev.total + 1
              }));
              
              // Show browser notification if permission granted
              if (Notification.permission === 'granted') {
                new Notification(data.data.subject, {
                  body: data.data.message,
                  icon: '/favicon.ico',
                  tag: data.data.notification_id
                });
              }
              break;
              
            case 'alert':
              // Handle real-time alerts
              console.log('Real-time alert received:', data.data);
              
              // Show browser notification for alerts
              if (Notification.permission === 'granted') {
                new Notification(`Alert: ${data.data.title}`, {
                  body: data.data.message,
                  icon: '/favicon.ico',
                  tag: data.data.alert_id,
                  requireInteraction: data.data.severity === 'Critical'
                });
              }
              break;
              
            case 'announcement':
              // Handle system announcements
              console.log('System announcement:', data.data);
              break;
              
            case 'pending_notifications':
              // Handle pending notifications on connection
              if (data.data && data.data.length > 0) {
                setNotifications(prev => {
                  const existingIds = new Set(prev.map(n => n.notification_id));
                  const newNotifications = data.data.filter(n => !existingIds.has(n.notification_id));
                  return [...newNotifications, ...prev];
                });
              }
              break;
              
            default:
              console.log('Unknown notification type:', data.type);
          }
        } catch (err) {
          console.error('Error parsing notification data:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Real-time notification error:', error);
        setConnected(false);
        setError('Connection to notification service lost');
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (eventSourceRef.current === eventSource) {
            setupRealTimeNotifications();
          }
        }, 5000);
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error('Error setting up real-time notifications:', err);
      setError('Failed to connect to notification service');
    }
  }, [token, user]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Initialize notifications
  useEffect(() => {
    if (user && token) {
      setLoading(true);
      Promise.all([
        fetchNotifications(),
        fetchStats()
      ]).finally(() => {
        setLoading(false);
      });

      // Setup real-time notifications
      setupRealTimeNotifications();

      // Request notification permission
      requestNotificationPermission();
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [user, token, fetchNotifications, fetchStats, setupRealTimeNotifications, requestNotificationPermission]);

  // Refresh notifications periodically as fallback
  useEffect(() => {
    if (!user || !token) return;

    const interval = setInterval(() => {
      fetchStats();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [user, token, fetchStats]);

  return {
    notifications,
    stats,
    loading,
    error,
    connected,
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    requestNotificationPermission
  };
}