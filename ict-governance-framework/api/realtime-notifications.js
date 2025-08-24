require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Store active SSE connections
const activeConnections = new Map();

// Apply authentication middleware
router.use(authenticateToken);

// Server-Sent Events endpoint for real-time notifications
router.get('/stream', (req, res) => {
  const userId = req.user.id;
  const connectionId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connection',
    message: 'Connected to notification stream',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Store connection
  activeConnections.set(connectionId, {
    userId,
    response: res,
    lastPing: Date.now()
  });

  // Send periodic heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      })}\n\n`);
      
      // Update last ping
      const connection = activeConnections.get(connectionId);
      if (connection) {
        connection.lastPing = Date.now();
      }
    } catch (error) {
      console.error('Error sending heartbeat:', error);
      clearInterval(heartbeat);
      activeConnections.delete(connectionId);
    }
  }, 30000); // 30 seconds

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    activeConnections.delete(connectionId);
    console.log(`SSE connection closed for user ${userId}`);
  });

  req.on('error', (error) => {
    console.error('SSE connection error:', error);
    clearInterval(heartbeat);
    activeConnections.delete(connectionId);
  });

  // Send any pending notifications
  sendPendingNotifications(userId, res);
});

// WebSocket-style message broadcasting endpoint
router.post('/broadcast', async (req, res) => {
  try {
    const {
      recipient_user_id,
      recipient_role,
      notification_type,
      subject,
      message,
      priority = 'Medium',
      category,
      metadata = {}
    } = req.body;

    // Create notification in database
    const notificationResult = await createNotification({
      notification_type,
      recipient_user_id,
      recipient_role,
      sender_user_id: req.user.id,
      subject,
      message,
      priority,
      category,
      metadata
    });

    if (notificationResult.success) {
      // Broadcast to active connections
      if (recipient_user_id) {
        broadcastToUser(recipient_user_id, {
          type: 'notification',
          data: notificationResult.notification
        });
      }

      if (recipient_role) {
        broadcastToRole(recipient_role, {
          type: 'notification',
          data: notificationResult.notification
        });
      }

      res.json({
        message: 'Notification broadcasted successfully',
        notification_id: notificationResult.notification.notification_id
      });
    } else {
      res.status(500).json({ error: 'Failed to create notification' });
    }
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
});

// Send alert broadcast
router.post('/broadcast/alert', async (req, res) => {
  try {
    const {
      alert_id,
      title,
      severity,
      message,
      target_roles = ['IT Manager', 'System Administrator']
    } = req.body;

    const alertData = {
      type: 'alert',
      data: {
        alert_id,
        title,
        severity,
        message,
        timestamp: new Date().toISOString()
      }
    };

    // Broadcast to specified roles
    for (const role of target_roles) {
      broadcastToRole(role, alertData);
    }

    res.json({
      message: 'Alert broadcasted successfully',
      target_roles
    });
  } catch (error) {
    console.error('Error broadcasting alert:', error);
    res.status(500).json({ error: 'Failed to broadcast alert' });
  }
});

// Send system announcement
router.post('/broadcast/announcement', async (req, res) => {
  try {
    const {
      title,
      message,
      priority = 'Medium',
      target_all = false,
      target_roles = []
    } = req.body;

    const announcementData = {
      type: 'announcement',
      data: {
        title,
        message,
        priority,
        timestamp: new Date().toISOString(),
        sender: req.user.username
      }
    };

    if (target_all) {
      // Broadcast to all active connections
      broadcastToAll(announcementData);
    } else {
      // Broadcast to specific roles
      for (const role of target_roles) {
        broadcastToRole(role, announcementData);
      }
    }

    res.json({
      message: 'Announcement broadcasted successfully',
      target_all,
      target_roles
    });
  } catch (error) {
    console.error('Error broadcasting announcement:', error);
    res.status(500).json({ error: 'Failed to broadcast announcement' });
  }
});

// Get active connections status (admin only)
router.get('/connections/status', async (req, res) => {
  try {
    // Check if user has admin permissions
    if (!req.user.roles || !req.user.roles.includes('System Administrator')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const connections = Array.from(activeConnections.entries()).map(([id, conn]) => ({
      connection_id: id,
      user_id: conn.userId,
      last_ping: new Date(conn.lastPing).toISOString(),
      connected_since: new Date(parseInt(id.split('-')[1])).toISOString()
    }));

    res.json({
      total_connections: connections.length,
      connections
    });
  } catch (error) {
    console.error('Error getting connection status:', error);
    res.status(500).json({ error: 'Failed to get connection status' });
  }
});

// Helper function to send pending notifications
async function sendPendingNotifications(userId, response) {
  try {
    const query = `
      SELECT 
        n.*,
        nt.type_name,
        nt.icon,
        nt.color
      FROM notifications n
      JOIN notification_types nt ON n.notification_type_id = nt.id
      WHERE (n.recipient_user_id = $1 OR n.recipient_role = ANY($2))
        AND n.status = 'unread'
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
        AND n.created_at > NOW() - INTERVAL '1 hour'
      ORDER BY n.created_at DESC
      LIMIT 10
    `;

    // Get user roles from active connections or database
    const userRoles = await getUserRoles(userId);
    const result = await pool.query(query, [userId, userRoles]);

    if (result.rows.length > 0) {
      response.write(`data: ${JSON.stringify({
        type: 'pending_notifications',
        data: result.rows,
        count: result.rows.length
      })}\n\n`);
    }
  } catch (error) {
    console.error('Error sending pending notifications:', error);
  }
}

// Helper function to get user roles
async function getUserRoles(userId) {
  try {
    const query = `
      SELECT ARRAY_AGG(r.role_name) as roles
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0]?.roles || [];
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}

// Helper function to create notification
async function createNotification(notificationData) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get notification type ID
    const typeQuery = `SELECT id FROM notification_types WHERE type_name = $1`;
    const typeResult = await client.query(typeQuery, [notificationData.notification_type]);
    
    if (typeResult.rows.length === 0) {
      throw new Error('Invalid notification type');
    }

    const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const insertQuery = `
      INSERT INTO notifications (
        notification_id, notification_type_id, recipient_user_id, recipient_role,
        sender_user_id, subject, message, priority, category, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      notificationId,
      typeResult.rows[0].id,
      notificationData.recipient_user_id,
      notificationData.recipient_role,
      notificationData.sender_user_id,
      notificationData.subject,
      notificationData.message,
      notificationData.priority,
      notificationData.category,
      JSON.stringify(notificationData.metadata)
    ];

    const result = await client.query(insertQuery, values);

    await client.query('COMMIT');

    return {
      success: true,
      notification: result.rows[0]
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

// Helper function to broadcast to specific user
function broadcastToUser(userId, data) {
  for (const [connectionId, connection] of activeConnections.entries()) {
    if (connection.userId === userId) {
      try {
        connection.response.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('Error broadcasting to user:', error);
        activeConnections.delete(connectionId);
      }
    }
  }
}

// Helper function to broadcast to users with specific role
async function broadcastToRole(role, data) {
  try {
    // Get users with the specified role
    const query = `
      SELECT DISTINCT u.id
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.role_name = $1
    `;
    
    const result = await pool.query(query, [role]);
    const userIds = result.rows.map(row => row.id);

    // Broadcast to active connections for these users
    for (const [connectionId, connection] of activeConnections.entries()) {
      if (userIds.includes(connection.userId)) {
        try {
          connection.response.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
          console.error('Error broadcasting to role:', error);
          activeConnections.delete(connectionId);
        }
      }
    }
  } catch (error) {
    console.error('Error broadcasting to role:', error);
  }
}

// Helper function to broadcast to all active connections
function broadcastToAll(data) {
  for (const [connectionId, connection] of activeConnections.entries()) {
    try {
      connection.response.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error broadcasting to all:', error);
      activeConnections.delete(connectionId);
    }
  }
}

// Cleanup inactive connections periodically
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes

  for (const [connectionId, connection] of activeConnections.entries()) {
    if (now - connection.lastPing > timeout) {
      console.log(`Cleaning up inactive connection: ${connectionId}`);
      try {
        connection.response.end();
      } catch (error) {
        // Connection already closed
      }
      activeConnections.delete(connectionId);
    }
  }
}, 60000); // Check every minute

module.exports = router;