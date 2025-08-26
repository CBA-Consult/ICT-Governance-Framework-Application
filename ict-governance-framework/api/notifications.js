require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { requirePermissions, authenticateToken } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user notifications with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      status = 'unread', 
      category, 
      priority, 
      limit = 50, 
      offset = 0,
      include_read = false 
    } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT 
        n.*,
        nt.type_name,
        nt.icon,
        nt.color,
        u.username as sender_username,
        u.first_name as sender_first_name,
        u.last_name as sender_last_name
      FROM notifications n
      JOIN notification_types nt ON n.notification_type_id = nt.id
      LEFT JOIN users u ON n.sender_user_id = u.id
      WHERE (n.recipient_user_id = $1 OR n.recipient_role = ANY($2))
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
    `;

    const values = [userId, req.user.roles || []];
    let paramCount = 2;

    // Filter by status
    if (status && status !== 'all') {
      if (include_read === 'true' && status === 'unread') {
        query += ` AND n.status IN ('unread', 'read')`;
      } else {
        paramCount++;
        query += ` AND n.status = $${paramCount}`;
        values.push(status);
      }
    }

    // Filter by category
    if (category) {
      paramCount++;
      query += ` AND n.category = $${paramCount}`;
      values.push(category);
    }

    // Filter by priority
    if (priority) {
      paramCount++;
      query += ` AND n.priority = $${paramCount}`;
      values.push(priority);
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM notifications n
      WHERE (n.recipient_user_id = $1 OR n.recipient_role = ANY($2))
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
    `;
    const countValues = [userId, req.user.roles || []];
    let countParamCount = 2;

    if (status && status !== 'all') {
      if (include_read === 'true' && status === 'unread') {
        countQuery += ` AND n.status IN ('unread', 'read')`;
      } else {
        countParamCount++;
        countQuery += ` AND n.status = $${countParamCount}`;
        countValues.push(status);
      }
    }

    if (category) {
      countParamCount++;
      countQuery += ` AND n.category = $${countParamCount}`;
      countValues.push(category);
    }

    if (priority) {
      countParamCount++;
      countQuery += ` AND n.priority = $${countParamCount}`;
      countValues.push(priority);
    }

    const countResult = await pool.query(countQuery, countValues);

    res.json({
      notifications: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get notification statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'unread' THEN 1 END) as unread,
        COUNT(CASE WHEN priority = 'Critical' AND status = 'unread' THEN 1 END) as critical_unread,
        COUNT(CASE WHEN priority = 'High' AND status = 'unread' THEN 1 END) as high_unread,
        COUNT(CASE WHEN category = 'security' AND status = 'unread' THEN 1 END) as security_unread,
        COUNT(CASE WHEN category = 'escalation' AND status = 'unread' THEN 1 END) as escalation_unread
      FROM notifications 
      WHERE (recipient_user_id = $1 OR recipient_role = ANY($2))
        AND (expires_at IS NULL OR expires_at > NOW())
        AND status != 'deleted'
    `;

    const result = await pool.query(statsQuery, [userId, req.user.roles || []]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updateQuery = `
      UPDATE notifications 
      SET status = 'read', read_at = NOW()
      WHERE notification_id = $1 
        AND (recipient_user_id = $2 OR recipient_role = ANY($3))
        AND status = 'unread'
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [id, userId, req.user.roles || []]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found or already read' });
    }

    res.json({ message: 'Notification marked as read', notification: result.rows[0] });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', async (req, res) => {
  try {
    const userId = req.user.id;

    const updateQuery = `
      UPDATE notifications 
      SET status = 'read', read_at = NOW()
      WHERE (recipient_user_id = $1 OR recipient_role = ANY($2))
        AND status = 'unread'
    `;

    const result = await pool.query(updateQuery, [userId, req.user.roles || []]);

    res.json({ 
      message: 'All notifications marked as read', 
      updated_count: result.rowCount 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Archive notification
router.patch('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updateQuery = `
      UPDATE notifications 
      SET status = 'archived'
      WHERE notification_id = $1 
        AND (recipient_user_id = $2 OR recipient_role = ANY($3))
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [id, userId, req.user.roles || []]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification archived', notification: result.rows[0] });
  } catch (error) {
    console.error('Error archiving notification:', error);
    res.status(500).json({ error: 'Failed to archive notification' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updateQuery = `
      UPDATE notifications 
      SET status = 'deleted'
      WHERE notification_id = $1 
        AND (recipient_user_id = $2 OR recipient_role = ANY($3))
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [id, userId, req.user.roles || []]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Create notification (admin/system use)
router.post('/', requirePermissions('notification.create'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      notification_type,
      recipient_user_id,
      recipient_role,
      subject,
      message,
      priority = 'Medium',
      category,
      metadata = {},
      related_entity_type,
      related_entity_id,
      scheduled_for,
      expires_at,
      delivery_channels = ['in_app']
    } = req.body;

    // Validate required fields
    if (!notification_type || !subject || !message || !category) {
      return res.status(400).json({ 
        error: 'Missing required fields: notification_type, subject, message, category' 
      });
    }

    // Get notification type ID
    const typeQuery = `SELECT id FROM notification_types WHERE type_name = $1`;
    const typeResult = await client.query(typeQuery, [notification_type]);
    
    if (typeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid notification type' });
    }

    const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const insertQuery = `
      INSERT INTO notifications (
        notification_id, notification_type_id, recipient_user_id, recipient_role,
        sender_user_id, subject, message, priority, category, metadata,
        related_entity_type, related_entity_id, scheduled_for, expires_at,
        delivery_channels
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      notificationId,
      typeResult.rows[0].id,
      recipient_user_id,
      recipient_role,
      req.user.id,
      subject,
      message,
      priority,
      category,
      JSON.stringify(metadata),
      related_entity_type,
      related_entity_id,
      scheduled_for,
      expires_at,
      JSON.stringify(delivery_channels)
    ];

    const result = await client.query(insertQuery, values);

    // Create delivery records for each channel
    for (const channel of delivery_channels) {
      await client.query(`
        INSERT INTO notification_deliveries (notification_id, delivery_channel)
        VALUES ($1, $2)
      `, [notificationId, channel]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Notification created successfully',
      notification: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  } finally {
    client.release();
  }
});

// Get user notification preferences
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        unp.*,
        nt.type_name,
        nt.category,
        nt.description
      FROM user_notification_preferences unp
      JOIN notification_types nt ON unp.notification_type_id = nt.id
      WHERE unp.user_id = $1
      ORDER BY nt.category, nt.type_name
    `;

    const result = await pool.query(query, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// Update user notification preferences
router.put('/preferences', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const userId = req.user.id;
    const { preferences } = req.body;

    // Delete existing preferences
    await client.query('DELETE FROM user_notification_preferences WHERE user_id = $1', [userId]);

    // Insert new preferences
    for (const pref of preferences) {
      await client.query(`
        INSERT INTO user_notification_preferences (
          user_id, notification_type_id, delivery_channels, is_enabled,
          quiet_hours_start, quiet_hours_end, timezone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        userId,
        pref.notification_type_id,
        JSON.stringify(pref.delivery_channels || ['in_app']),
        pref.is_enabled !== false,
        pref.quiet_hours_start,
        pref.quiet_hours_end,
        pref.timezone || 'UTC'
      ]);
    }

    await client.query('COMMIT');

    res.json({ message: 'Notification preferences updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  } finally {
    client.release();
  }
});

// Get notification types
router.get('/types', async (req, res) => {
  try {
    const query = `
      SELECT * FROM notification_types 
      WHERE is_active = true 
      ORDER BY category, type_name
    `;

    const result = await pool.query(query);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notification types:', error);
    res.status(500).json({ error: 'Failed to fetch notification types' });
  }
});

module.exports = router;