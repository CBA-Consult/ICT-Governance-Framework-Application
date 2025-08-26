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

// Get alerts with filtering and pagination
router.get('/', requirePermission('alert.read'), async (req, res) => {
  try {
    const { 
      status = 'active', 
      severity, 
      source_system,
      limit = 50, 
      offset = 0,
      sort_by = 'triggered_at',
      sort_order = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        a.*,
        ar.rule_name,
        ar.description as rule_description,
        ack_user.username as acknowledged_by_username,
        res_user.username as resolved_by_username
      FROM alerts a
      JOIN alert_rules ar ON a.alert_rule_id = ar.id
      LEFT JOIN users ack_user ON a.acknowledged_by = ack_user.id
      LEFT JOIN users res_user ON a.resolved_by = res_user.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 0;

    // Filter by status
    if (status && status !== 'all') {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      values.push(status);
    }

    // Filter by severity
    if (severity) {
      paramCount++;
      query += ` AND a.severity = $${paramCount}`;
      values.push(severity);
    }

    // Filter by source system
    if (source_system) {
      paramCount++;
      query += ` AND a.source_system = $${paramCount}`;
      values.push(source_system);
    }

    // Add sorting
    const validSortColumns = ['triggered_at', 'severity', 'status', 'title'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortColumns.includes(sort_by) && validSortOrders.includes(sort_order.toUpperCase())) {
      query += ` ORDER BY a.${sort_by} ${sort_order.toUpperCase()}`;
    } else {
      query += ` ORDER BY a.triggered_at DESC`;
    }

    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM alerts a WHERE 1=1`;
    const countValues = [];
    let countParamCount = 0;

    if (status && status !== 'all') {
      countParamCount++;
      countQuery += ` AND a.status = $${countParamCount}`;
      countValues.push(status);
    }

    if (severity) {
      countParamCount++;
      countQuery += ` AND a.severity = $${countParamCount}`;
      countValues.push(severity);
    }

    if (source_system) {
      countParamCount++;
      countQuery += ` AND a.source_system = $${countParamCount}`;
      countValues.push(source_system);
    }

    const countResult = await pool.query(countQuery, countValues);

    res.json({
      alerts: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get alert statistics
router.get('/stats', requirePermission('alert.read'), async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'acknowledged' THEN 1 END) as acknowledged,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN severity = 'Critical' AND status = 'active' THEN 1 END) as critical_active,
        COUNT(CASE WHEN severity = 'High' AND status = 'active' THEN 1 END) as high_active,
        COUNT(CASE WHEN severity = 'Medium' AND status = 'active' THEN 1 END) as medium_active,
        COUNT(CASE WHEN severity = 'Low' AND status = 'active' THEN 1 END) as low_active
      FROM alerts 
      WHERE triggered_at >= NOW() - INTERVAL '30 days'
    `;

    const result = await pool.query(statsQuery);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({ error: 'Failed to fetch alert statistics' });
  }
});

// Get specific alert details
router.get('/:id', requirePermission('alert.read'), async (req, res) => {
  try {
    const { id } = req.params;

    const alertQuery = `
      SELECT 
        a.*,
        ar.rule_name,
        ar.description as rule_description,
        ar.conditions as rule_conditions,
        ack_user.username as acknowledged_by_username,
        res_user.username as resolved_by_username
      FROM alerts a
      JOIN alert_rules ar ON a.alert_rule_id = ar.id
      LEFT JOIN users ack_user ON a.acknowledged_by = ack_user.id
      LEFT JOIN users res_user ON a.resolved_by = res_user.id
      WHERE a.alert_id = $1
    `;

    const actionsQuery = `
      SELECT 
        aa.*,
        u.username,
        u.first_name,
        u.last_name
      FROM alert_actions aa
      JOIN users u ON aa.action_by = u.id
      WHERE aa.alert_id = $1
      ORDER BY aa.created_at DESC
    `;

    const [alertResult, actionsResult] = await Promise.all([
      pool.query(alertQuery, [id]),
      pool.query(actionsQuery, [id])
    ]);

    if (alertResult.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const alert = alertResult.rows[0];
    alert.actions = actionsResult.rows;

    res.json(alert);
  } catch (error) {
    console.error('Error fetching alert details:', error);
    res.status(500).json({ error: 'Failed to fetch alert details' });
  }
});

// Acknowledge alert
router.patch('/:id/acknowledge', requirePermission('alert.acknowledge'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    // Update alert status
    const updateQuery = `
      UPDATE alerts 
      SET status = 'acknowledged', acknowledged_at = NOW(), acknowledged_by = $1
      WHERE alert_id = $2 AND status = 'active'
      RETURNING *
    `;

    const result = await client.query(updateQuery, [userId, id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Alert not found or already acknowledged' });
    }

    // Log the action
    await client.query(`
      INSERT INTO alert_actions (alert_id, action_type, action_by, notes)
      VALUES ($1, 'acknowledge', $2, $3)
    `, [id, userId, notes || 'Alert acknowledged']);

    // Create notification for alert acknowledgment
    await createAlertNotification(client, result.rows[0], 'acknowledged', userId);

    await client.query('COMMIT');

    res.json({ 
      message: 'Alert acknowledged successfully', 
      alert: result.rows[0] 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  } finally {
    client.release();
  }
});

// Resolve alert
router.patch('/:id/resolve', requirePermission('alert.resolve'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { resolution_notes } = req.body;
    const userId = req.user.id;

    // Update alert status
    const updateQuery = `
      UPDATE alerts 
      SET status = 'resolved', resolved_at = NOW(), resolved_by = $1, resolution_notes = $2
      WHERE alert_id = $3 AND status IN ('active', 'acknowledged')
      RETURNING *
    `;

    const result = await client.query(updateQuery, [userId, resolution_notes, id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Alert not found or already resolved' });
    }

    // Log the action
    await client.query(`
      INSERT INTO alert_actions (alert_id, action_type, action_by, notes)
      VALUES ($1, 'resolve', $2, $3)
    `, [id, userId, resolution_notes || 'Alert resolved']);

    // Create notification for alert resolution
    await createAlertNotification(client, result.rows[0], 'resolved', userId);

    await client.query('COMMIT');

    res.json({ 
      message: 'Alert resolved successfully', 
      alert: result.rows[0] 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  } finally {
    client.release();
  }
});

// Escalate alert
router.patch('/:id/escalate', requirePermission('alert.escalate'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { escalation_reason, escalation_target } = req.body;
    const userId = req.user.id;

    // Update alert escalation level
    const updateQuery = `
      UPDATE alerts 
      SET escalation_level = escalation_level + 1, escalated_at = NOW()
      WHERE alert_id = $1 AND status IN ('active', 'acknowledged')
      RETURNING *
    `;

    const result = await client.query(updateQuery, [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Alert not found or cannot be escalated' });
    }

    // Log the action
    await client.query(`
      INSERT INTO alert_actions (alert_id, action_type, action_by, notes, action_details)
      VALUES ($1, 'escalate', $2, $3, $4)
    `, [
      id, 
      userId, 
      escalation_reason || 'Alert escalated',
      JSON.stringify({ escalation_target, escalation_level: result.rows[0].escalation_level })
    ]);

    // Create escalation notification
    await createAlertNotification(client, result.rows[0], 'escalated', userId, escalation_target);

    await client.query('COMMIT');

    res.json({ 
      message: 'Alert escalated successfully', 
      alert: result.rows[0] 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error escalating alert:', error);
    res.status(500).json({ error: 'Failed to escalate alert' });
  } finally {
    client.release();
  }
});

// Create new alert
router.post('/', requirePermission('alert.create'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      alert_rule_id,
      title,
      description,
      severity,
      source_system,
      source_data = {},
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!alert_rule_id || !title || !severity) {
      return res.status(400).json({ 
        error: 'Missing required fields: alert_rule_id, title, severity' 
      });
    }

    const alertId = `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const insertQuery = `
      INSERT INTO alerts (
        alert_id, alert_rule_id, title, description, severity,
        source_system, source_data, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      alertId,
      alert_rule_id,
      title,
      description,
      severity,
      source_system,
      JSON.stringify(source_data),
      JSON.stringify(metadata)
    ];

    const result = await client.query(insertQuery, values);

    // Log the creation action
    await client.query(`
      INSERT INTO alert_actions (alert_id, action_type, action_by, notes)
      VALUES ($1, 'create', $2, 'Alert created')
    `, [alertId, req.user.id]);

    // Create notification for new alert
    await createAlertNotification(client, result.rows[0], 'created', req.user.id);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Alert created successfully',
      alert: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  } finally {
    client.release();
  }
});

// Add comment to alert
router.post('/:id/comments', requirePermission('alert.comment'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    // Add comment as an action
    const insertQuery = `
      INSERT INTO alert_actions (alert_id, action_type, action_by, notes)
      VALUES ($1, 'comment', $2, $3)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [id, userId, comment]);

    res.status(201).json({
      message: 'Comment added successfully',
      action: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding comment to alert:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get alert rules
router.get('/rules/list', requirePermission('alert.read'), async (req, res) => {
  try {
    const query = `
      SELECT 
        ar.*,
        u.username as created_by_username
      FROM alert_rules ar
      LEFT JOIN users u ON ar.created_by = u.id
      WHERE ar.is_active = true
      ORDER BY ar.rule_name
    `;

    const result = await pool.query(query);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    res.status(500).json({ error: 'Failed to fetch alert rules' });
  }
});

// Helper function to create alert notifications
async function createAlertNotification(client, alert, action, actionBy, escalationTarget = null) {
  try {
    let notificationTypeId;
    let subject;
    let message;
    let recipientRole = null;

    switch (action) {
      case 'created':
        notificationTypeId = await getNotificationTypeId(client, 'security_alert');
        subject = `New Alert: ${alert.title}`;
        message = `A new ${alert.severity} severity alert has been created: ${alert.description}`;
        recipientRole = 'IT Manager'; // Notify IT managers of new alerts
        break;
      case 'acknowledged':
        notificationTypeId = await getNotificationTypeId(client, 'security_alert');
        subject = `Alert Acknowledged: ${alert.title}`;
        message = `Alert ${alert.alert_id} has been acknowledged and is being investigated.`;
        break;
      case 'resolved':
        notificationTypeId = await getNotificationTypeId(client, 'security_alert');
        subject = `Alert Resolved: ${alert.title}`;
        message = `Alert ${alert.alert_id} has been resolved. Resolution notes: ${alert.resolution_notes || 'None provided'}`;
        break;
      case 'escalated':
        notificationTypeId = await getNotificationTypeId(client, 'escalation_created');
        subject = `Alert Escalated: ${alert.title}`;
        message = `Alert ${alert.alert_id} has been escalated to level ${alert.escalation_level}. Immediate attention required.`;
        recipientRole = escalationTarget || 'System Administrator';
        break;
    }

    if (notificationTypeId) {
      const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await client.query(`
        INSERT INTO notifications (
          notification_id, notification_type_id, recipient_role, sender_user_id,
          subject, message, priority, category, related_entity_type, related_entity_id,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        notificationId,
        notificationTypeId,
        recipientRole,
        actionBy,
        subject,
        message,
        alert.severity,
        'security',
        'alert',
        alert.alert_id,
        JSON.stringify({ alert_action: action })
      ]);
    }
  } catch (error) {
    console.error('Error creating alert notification:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

// Helper function to get notification type ID
async function getNotificationTypeId(client, typeName) {
  try {
    const result = await client.query(
      'SELECT id FROM notification_types WHERE type_name = $1',
      [typeName]
    );
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (error) {
    console.error('Error getting notification type ID:', error);
    return null;
  }
}

module.exports = router;