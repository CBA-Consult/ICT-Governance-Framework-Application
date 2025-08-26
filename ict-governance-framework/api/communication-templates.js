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

// Get communication templates
router.get('/', requirePermission('communication.read'), async (req, res) => {
  try {
    const { 
      category,
      template_type,
      is_active = true,
      limit = 50, 
      offset = 0 
    } = req.query;

    let query = `
      SELECT 
        ct.*,
        u.username as created_by_username,
        COUNT(*) OVER() as total_count
      FROM communication_templates ct
      LEFT JOIN users u ON ct.created_by = u.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND ct.category = $${paramCount}`;
      values.push(category);
    }

    if (template_type) {
      paramCount++;
      query += ` AND ct.template_type = $${paramCount}`;
      values.push(template_type);
    }

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND ct.is_active = $${paramCount}`;
      values.push(is_active === 'true');
    }

    query += ` ORDER BY ct.template_name`;
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.json({
      templates: result.rows,
      total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching communication templates:', error);
    res.status(500).json({ error: 'Failed to fetch communication templates' });
  }
});

// Get template details
router.get('/:id', requirePermission('communication.read'), async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        ct.*,
        u.username as created_by_username,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name
      FROM communication_templates ct
      LEFT JOIN users u ON ct.created_by = u.id
      WHERE ct.template_id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Communication template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching template details:', error);
    res.status(500).json({ error: 'Failed to fetch template details' });
  }
});

// Create new communication template
router.post('/', requirePermission('communication.manage'), async (req, res) => {
  try {
    const {
      template_name,
      category,
      template_type,
      subject_template,
      body_template,
      variables = [],
      default_recipients = [],
      delivery_channels = ['in_app'],
      auto_send_conditions = {},
      approval_required = false,
      tags = []
    } = req.body;

    if (!template_name || !category || !template_type || !subject_template || !body_template) {
      return res.status(400).json({ 
        error: 'Missing required fields: template_name, category, template_type, subject_template, body_template' 
      });
    }

    const templateId = `TMPL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const insertQuery = `
      INSERT INTO communication_templates (
        template_id, template_name, category, template_type, subject_template,
        body_template, variables, default_recipients, delivery_channels,
        auto_send_conditions, approval_required, tags, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      templateId, template_name, category, template_type, subject_template,
      body_template, JSON.stringify(variables), JSON.stringify(default_recipients),
      JSON.stringify(delivery_channels), JSON.stringify(auto_send_conditions),
      approval_required, JSON.stringify(tags), req.user.id
    ]);

    res.status(201).json({
      message: 'Communication template created successfully',
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating communication template:', error);
    res.status(500).json({ error: 'Failed to create communication template' });
  }
});

// Update communication template
router.put('/:id', requirePermission('communication.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      template_name,
      category,
      template_type,
      subject_template,
      body_template,
      variables,
      default_recipients,
      delivery_channels,
      auto_send_conditions,
      approval_required,
      is_active,
      tags
    } = req.body;

    const updateQuery = `
      UPDATE communication_templates 
      SET template_name = COALESCE($1, template_name),
          category = COALESCE($2, category),
          template_type = COALESCE($3, template_type),
          subject_template = COALESCE($4, subject_template),
          body_template = COALESCE($5, body_template),
          variables = COALESCE($6, variables),
          default_recipients = COALESCE($7, default_recipients),
          delivery_channels = COALESCE($8, delivery_channels),
          auto_send_conditions = COALESCE($9, auto_send_conditions),
          approval_required = COALESCE($10, approval_required),
          is_active = COALESCE($11, is_active),
          tags = COALESCE($12, tags),
          updated_at = NOW()
      WHERE template_id = $13
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      template_name, category, template_type, subject_template, body_template,
      variables ? JSON.stringify(variables) : null,
      default_recipients ? JSON.stringify(default_recipients) : null,
      delivery_channels ? JSON.stringify(delivery_channels) : null,
      auto_send_conditions ? JSON.stringify(auto_send_conditions) : null,
      approval_required, is_active,
      tags ? JSON.stringify(tags) : null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Communication template not found' });
    }

    res.json({
      message: 'Communication template updated successfully',
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating communication template:', error);
    res.status(500).json({ error: 'Failed to update communication template' });
  }
});

// Send communication using template
router.post('/:id/send', requirePermission('communication.send'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      recipients = [],
      variable_values = {},
      override_subject,
      override_body,
      delivery_channels,
      scheduled_at,
      priority = 'Medium'
    } = req.body;

    // Get template details
    const templateResult = await client.query(
      'SELECT * FROM communication_templates WHERE template_id = $1 AND is_active = true',
      [id]
    );

    if (templateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Communication template not found or inactive' });
    }

    const template = templateResult.rows[0];

    // Check if approval is required
    if (template.approval_required && !req.body.approved_by) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'This template requires approval before sending. Please get approval first.' 
      });
    }

    // Process template variables
    let processedSubject = override_subject || template.subject_template;
    let processedBody = override_body || template.body_template;

    // Replace variables in subject and body
    for (const [key, value] of Object.entries(variable_values)) {
      const placeholder = `{{${key}}}`;
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
      processedBody = processedBody.replace(new RegExp(placeholder, 'g'), value);
    }

    // Determine final recipients
    const finalRecipients = recipients.length > 0 ? recipients : template.default_recipients;
    const finalDeliveryChannels = delivery_channels || template.delivery_channels;

    if (finalRecipients.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No recipients specified' });
    }

    const communicationId = `COMM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create communication record
    const commInsertQuery = `
      INSERT INTO communications (
        communication_id, template_id, subject, body, recipients,
        delivery_channels, variable_values, priority, scheduled_at,
        created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const commResult = await client.query(commInsertQuery, [
      communicationId, id, processedSubject, processedBody,
      JSON.stringify(finalRecipients), JSON.stringify(finalDeliveryChannels),
      JSON.stringify(variable_values), priority, scheduled_at,
      req.user.id, scheduled_at ? 'scheduled' : 'sent'
    ]);

    // Send notifications if in_app delivery is enabled
    if (finalDeliveryChannels.includes('in_app')) {
      await sendInAppNotifications(client, commResult.rows[0], finalRecipients);
    }

    // Send emails if email delivery is enabled
    if (finalDeliveryChannels.includes('email')) {
      await scheduleEmailDelivery(client, commResult.rows[0], finalRecipients);
    }

    // Send SMS if SMS delivery is enabled
    if (finalDeliveryChannels.includes('sms')) {
      await scheduleSMSDelivery(client, commResult.rows[0], finalRecipients);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Communication sent successfully',
      communication: commResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending communication:', error);
    res.status(500).json({ error: 'Failed to send communication' });
  } finally {
    client.release();
  }
});

// Preview template with variables
router.post('/:id/preview', requirePermission('communication.read'), async (req, res) => {
  try {
    const { id } = req.params;
    const { variable_values = {} } = req.body;

    // Get template details
    const result = await pool.query(
      'SELECT * FROM communication_templates WHERE template_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Communication template not found' });
    }

    const template = result.rows[0];

    // Process template variables
    let processedSubject = template.subject_template;
    let processedBody = template.body_template;

    // Replace variables in subject and body
    for (const [key, value] of Object.entries(variable_values)) {
      const placeholder = `{{${key}}}`;
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
      processedBody = processedBody.replace(new RegExp(placeholder, 'g'), value);
    }

    res.json({
      template_name: template.template_name,
      processed_subject: processedSubject,
      processed_body: processedBody,
      variables: template.variables,
      delivery_channels: template.delivery_channels
    });
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({ error: 'Failed to preview template' });
  }
});

// Get template usage statistics
router.get('/:id/stats', requirePermission('communication.read'), async (req, res) => {
  try {
    const { id } = req.params;
    const { timeframe = '30' } = req.query;

    const statsQuery = `
      SELECT 
        COUNT(*) as total_uses,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        AVG(array_length(recipients, 1)) as avg_recipients,
        MAX(created_at) as last_used
      FROM communications
      WHERE template_id = $1 
        AND created_at >= NOW() - INTERVAL '${parseInt(timeframe)} days'
    `;

    const usageQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as usage_count,
        SUM(array_length(recipients, 1)) as total_recipients
      FROM communications
      WHERE template_id = $1 
        AND created_at >= NOW() - INTERVAL '${parseInt(timeframe)} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const [statsResult, usageResult] = await Promise.all([
      pool.query(statsQuery, [id]),
      pool.query(usageQuery, [id])
    ]);

    res.json({
      statistics: statsResult.rows[0],
      usage_trend: usageResult.rows,
      timeframe: parseInt(timeframe)
    });
  } catch (error) {
    console.error('Error fetching template statistics:', error);
    res.status(500).json({ error: 'Failed to fetch template statistics' });
  }
});

// Delete communication template
router.delete('/:id', requirePermission('communication.manage'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if template is being used
    const usageCheck = await pool.query(
      'SELECT COUNT(*) FROM communications WHERE template_id = $1',
      [id]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      // Soft delete - mark as inactive instead of deleting
      const result = await pool.query(
        'UPDATE communication_templates SET is_active = false WHERE template_id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Communication template not found' });
      }

      res.json({ 
        message: 'Communication template deactivated (has usage history)',
        template: result.rows[0]
      });
    } else {
      // Hard delete if no usage
      const result = await pool.query(
        'DELETE FROM communication_templates WHERE template_id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Communication template not found' });
      }

      res.json({ message: 'Communication template deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting communication template:', error);
    res.status(500).json({ error: 'Failed to delete communication template' });
  }
});

// Helper function to send in-app notifications
async function sendInAppNotifications(client, communication, recipients) {
  try {
    // Get notification type ID
    const typeResult = await client.query(
      'SELECT id FROM notification_types WHERE type_name = $1',
      ['communication']
    );

    if (typeResult.rows.length === 0) {
      console.warn('Notification type "communication" not found');
      return;
    }

    const notificationTypeId = typeResult.rows[0].id;

    // Create notifications for each recipient
    for (const recipient of recipients) {
      const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await client.query(`
        INSERT INTO notifications (
          notification_id, user_id, notification_type_id, subject, message,
          priority, category, related_entity_type, related_entity_id,
          metadata, sender_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        notificationId,
        recipient,
        notificationTypeId,
        communication.subject,
        communication.body,
        communication.priority,
        'communication',
        'communication',
        communication.communication_id,
        JSON.stringify({ delivery_channel: 'in_app' }),
        communication.created_by
      ]);
    }
  } catch (error) {
    console.error('Error sending in-app notifications:', error);
  }
}

// Helper function to schedule email delivery
async function scheduleEmailDelivery(client, communication, recipients) {
  try {
    // Create email delivery records
    for (const recipient of recipients) {
      const deliveryId = `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await client.query(`
        INSERT INTO communication_deliveries (
          delivery_id, communication_id, recipient_id, delivery_channel,
          status, scheduled_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        deliveryId,
        communication.communication_id,
        recipient,
        'email',
        'pending',
        communication.scheduled_at || new Date()
      ]);
    }
  } catch (error) {
    console.error('Error scheduling email delivery:', error);
  }
}

// Helper function to schedule SMS delivery
async function scheduleSMSDelivery(client, communication, recipients) {
  try {
    // Create SMS delivery records
    for (const recipient of recipients) {
      const deliveryId = `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await client.query(`
        INSERT INTO communication_deliveries (
          delivery_id, communication_id, recipient_id, delivery_channel,
          status, scheduled_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        deliveryId,
        communication.communication_id,
        recipient,
        'sms',
        'pending',
        communication.scheduled_at || new Date()
      ]);
    }
  } catch (error) {
    console.error('Error scheduling SMS delivery:', error);
  }
}

module.exports = router;