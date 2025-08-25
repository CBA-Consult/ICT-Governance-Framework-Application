require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get announcements with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      status = 'active',
      priority,
      category,
      target_audience,
      limit = 50, 
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    let query = `
      SELECT 
        a.*,
        u.username as created_by_username,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name,
        ar.read_at,
        COUNT(*) OVER() as total_count
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN announcement_reads ar ON a.announcement_id = ar.announcement_id AND ar.user_id = $1
      WHERE (
        a.target_audience = 'all' OR
        a.target_audience = 'authenticated' OR
        a.target_roles && $2 OR
        a.target_users @> $3
      )
    `;

    const values = [userId, JSON.stringify(userRoles), JSON.stringify([userId])];
    let paramCount = 3;

    // Apply filters
    if (status && status !== 'all') {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      values.push(status);
    }

    if (priority) {
      paramCount++;
      query += ` AND a.priority = $${paramCount}`;
      values.push(priority);
    }

    if (category) {
      paramCount++;
      query += ` AND a.category = $${paramCount}`;
      values.push(category);
    }

    if (target_audience) {
      paramCount++;
      query += ` AND a.target_audience = $${paramCount}`;
      values.push(target_audience);
    }

    // Apply date filters for active announcements
    if (status === 'active') {
      query += ` AND (a.start_date IS NULL OR a.start_date <= NOW())`;
      query += ` AND (a.end_date IS NULL OR a.end_date >= NOW())`;
    }

    // Apply sorting
    const validSortFields = ['created_at', 'priority', 'title', 'start_date', 'end_date'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY a.${sortField} ${sortDirection}`;

    // Apply pagination
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    values.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    values.push(offset);

    const result = await pool.query(query, values);

    res.json({
      announcements: result.rows,
      total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get announcement details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const query = `
      SELECT 
        a.*,
        u.username as created_by_username,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name,
        ar.read_at
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN announcement_reads ar ON a.announcement_id = ar.announcement_id AND ar.user_id = $1
      WHERE a.announcement_id = $2
    `;

    const result = await pool.query(query, [userId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const announcement = result.rows[0];

    // Check if user has access to this announcement
    const userRoles = req.user.roles || [];
    const hasAccess = (
      announcement.target_audience === 'all' ||
      announcement.target_audience === 'authenticated' ||
      (announcement.target_roles && announcement.target_roles.some(role => userRoles.includes(role))) ||
      (announcement.target_users && announcement.target_users.includes(userId))
    );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this announcement' });
    }

    res.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement details:', error);
    res.status(500).json({ error: 'Failed to fetch announcement details' });
  }
});

// Create new announcement
router.post('/', requirePermission('announcements.create'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      title,
      content,
      priority = 'Medium',
      category = 'general',
      target_audience = 'all',
      target_roles = [],
      target_users = [],
      start_date,
      end_date,
      allow_comments = true,
      send_notifications = true,
      attachments = []
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, content' 
      });
    }

    const announcementId = `ANN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create announcement
    const insertQuery = `
      INSERT INTO announcements (
        announcement_id, title, content, priority, category, target_audience,
        target_roles, target_users, start_date, end_date, allow_comments,
        send_notifications, attachments, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      announcementId, title, content, priority, category, target_audience,
      JSON.stringify(target_roles), JSON.stringify(target_users), start_date, end_date,
      allow_comments, send_notifications, JSON.stringify(attachments), req.user.id
    ]);

    // Create notifications if enabled
    if (send_notifications) {
      await createAnnouncementNotifications(client, result.rows[0], req.user.id);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  } finally {
    client.release();
  }
});

// Update announcement
router.put('/:id', requirePermission('announcements.update'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      title,
      content,
      priority,
      category,
      target_audience,
      target_roles,
      target_users,
      start_date,
      end_date,
      allow_comments,
      status,
      attachments
    } = req.body;

    const updateQuery = `
      UPDATE announcements 
      SET title = COALESCE($1, title),
          content = COALESCE($2, content),
          priority = COALESCE($3, priority),
          category = COALESCE($4, category),
          target_audience = COALESCE($5, target_audience),
          target_roles = COALESCE($6, target_roles),
          target_users = COALESCE($7, target_users),
          start_date = COALESCE($8, start_date),
          end_date = COALESCE($9, end_date),
          allow_comments = COALESCE($10, allow_comments),
          status = COALESCE($11, status),
          attachments = COALESCE($12, attachments),
          updated_at = NOW()
      WHERE announcement_id = $13
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      title, content, priority, category, target_audience,
      target_roles ? JSON.stringify(target_roles) : null,
      target_users ? JSON.stringify(target_users) : null,
      start_date, end_date, allow_comments, status,
      attachments ? JSON.stringify(attachments) : null,
      id
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Announcement not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Announcement updated successfully',
      announcement: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  } finally {
    client.release();
  }
});

// Mark announcement as read
router.post('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const insertQuery = `
      INSERT INTO announcement_reads (announcement_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (announcement_id, user_id) DO UPDATE SET read_at = NOW()
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [id, userId]);

    res.json({
      message: 'Announcement marked as read',
      read_record: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    res.status(500).json({ error: 'Failed to mark announcement as read' });
  }
});

// Add comment to announcement
router.post('/:id/comments', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    // Check if announcement allows comments
    const announcementCheck = await client.query(
      'SELECT allow_comments FROM announcements WHERE announcement_id = $1',
      [id]
    );

    if (announcementCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (!announcementCheck.rows[0].allow_comments) {
      return res.status(403).json({ error: 'Comments are not allowed on this announcement' });
    }

    const commentId = `COMM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const insertQuery = `
      INSERT INTO announcement_comments (
        comment_id, announcement_id, user_id, comment
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [commentId, id, userId, comment]);

    // Get user info for response
    const userQuery = `
      SELECT username, first_name, last_name
      FROM users
      WHERE id = $1
    `;

    const userResult = await client.query(userQuery, [userId]);

    await client.query('COMMIT');

    const commentWithUser = {
      ...result.rows[0],
      username: userResult.rows[0].username,
      first_name: userResult.rows[0].first_name,
      last_name: userResult.rows[0].last_name
    };

    res.status(201).json({
      message: 'Comment added successfully',
      comment: commentWithUser
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  } finally {
    client.release();
  }
});

// Get announcement comments
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const query = `
      SELECT 
        ac.*,
        u.username,
        u.first_name,
        u.last_name
      FROM announcement_comments ac
      JOIN users u ON ac.user_id = u.id
      WHERE ac.announcement_id = $1
      ORDER BY ac.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [id, limit, offset]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching announcement comments:', error);
    res.status(500).json({ error: 'Failed to fetch announcement comments' });
  }
});

// Get announcement statistics
router.get('/stats/overview', requirePermission('announcements.read'), async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;

    const statsQuery = `
      SELECT 
        COUNT(*) as total_announcements,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_announcements,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_announcements,
        COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical_announcements,
        COUNT(CASE WHEN priority = 'High' THEN 1 END) as high_announcements,
        AVG((SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = a.announcement_id)) as avg_read_count
      FROM announcements a
      WHERE created_at >= NOW() - INTERVAL '${parseInt(timeframe)} days'
    `;

    const readStatsQuery = `
      SELECT 
        a.announcement_id,
        a.title,
        a.priority,
        COUNT(ar.user_id) as read_count,
        (SELECT COUNT(*) FROM users WHERE status = 'active') as total_users,
        ROUND(COUNT(ar.user_id) * 100.0 / NULLIF((SELECT COUNT(*) FROM users WHERE status = 'active'), 0), 2) as read_percentage
      FROM announcements a
      LEFT JOIN announcement_reads ar ON a.announcement_id = ar.announcement_id
      WHERE a.created_at >= NOW() - INTERVAL '${parseInt(timeframe)} days'
        AND a.status = 'active'
      GROUP BY a.announcement_id, a.title, a.priority
      ORDER BY read_percentage DESC
      LIMIT 10
    `;

    const [statsResult, readStatsResult] = await Promise.all([
      pool.query(statsQuery),
      pool.query(readStatsQuery)
    ]);

    res.json({
      statistics: statsResult.rows[0],
      top_read_announcements: readStatsResult.rows,
      timeframe: parseInt(timeframe)
    });
  } catch (error) {
    console.error('Error fetching announcement statistics:', error);
    res.status(500).json({ error: 'Failed to fetch announcement statistics' });
  }
});

// Delete announcement
router.delete('/:id', requirePermission('announcements.delete'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Delete related records first
    await client.query('DELETE FROM announcement_comments WHERE announcement_id = $1', [id]);
    await client.query('DELETE FROM announcement_reads WHERE announcement_id = $1', [id]);

    // Delete announcement
    const result = await client.query('DELETE FROM announcements WHERE announcement_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Announcement not found' });
    }

    await client.query('COMMIT');

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  } finally {
    client.release();
  }
});

// Helper function to create announcement notifications
async function createAnnouncementNotifications(client, announcement, createdBy) {
  try {
    const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Get notification type ID for announcements
    const typeResult = await client.query(
      'SELECT id FROM notification_types WHERE type_name = $1',
      ['system_announcement']
    );

    if (typeResult.rows.length === 0) {
      console.warn('Notification type "system_announcement" not found');
      return;
    }

    const notificationTypeId = typeResult.rows[0].id;

    // Create notification based on target audience
    let insertQuery = '';
    let values = [];

    if (announcement.target_audience === 'all' || announcement.target_audience === 'authenticated') {
      // Broadcast notification
      insertQuery = `
        INSERT INTO notifications (
          notification_id, notification_type_id, subject, message,
          priority, category, related_entity_type, related_entity_id,
          broadcast_to_roles, metadata, sender_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      values = [
        notificationId,
        notificationTypeId,
        `New Announcement: ${announcement.title}`,
        announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
        announcement.priority,
        'announcement',
        'announcement',
        announcement.announcement_id,
        JSON.stringify(['all']),
        JSON.stringify({ announcement_category: announcement.category }),
        createdBy
      ];
    } else if (announcement.target_roles && announcement.target_roles.length > 0) {
      // Role-based notification
      insertQuery = `
        INSERT INTO notifications (
          notification_id, notification_type_id, subject, message,
          priority, category, related_entity_type, related_entity_id,
          broadcast_to_roles, metadata, sender_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      values = [
        notificationId,
        notificationTypeId,
        `New Announcement: ${announcement.title}`,
        announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
        announcement.priority,
        'announcement',
        'announcement',
        announcement.announcement_id,
        JSON.stringify(announcement.target_roles),
        JSON.stringify({ announcement_category: announcement.category }),
        createdBy
      ];
    } else if (announcement.target_users && announcement.target_users.length > 0) {
      // User-specific notifications
      for (const userId of announcement.target_users) {
        const userNotificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        await client.query(`
          INSERT INTO notifications (
            notification_id, user_id, notification_type_id, subject, message,
            priority, category, related_entity_type, related_entity_id,
            metadata, sender_user_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          userNotificationId,
          userId,
          notificationTypeId,
          `New Announcement: ${announcement.title}`,
          announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
          announcement.priority,
          'announcement',
          'announcement',
          announcement.announcement_id,
          JSON.stringify({ announcement_category: announcement.category }),
          createdBy
        ]);
      }
      return; // Skip the main insert since we've done individual inserts
    }

    if (insertQuery) {
      await client.query(insertQuery, values);
    }
  } catch (error) {
    console.error('Error creating announcement notifications:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

module.exports = router;