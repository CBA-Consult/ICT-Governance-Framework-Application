require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');

class EscalationService {
  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.isRunning = false;
    this.checkInterval = 60000; // Check every minute
  }

  // Start the escalation monitoring service
  start() {
    if (this.isRunning) {
      console.log('Escalation service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting escalation monitoring service...');
    
    // Initial check
    this.checkEscalations();
    
    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkEscalations();
    }, this.checkInterval);
  }

  // Stop the escalation monitoring service
  stop() {
    if (!this.isRunning) {
      console.log('Escalation service is not running');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log('Escalation monitoring service stopped');
  }

  // Main escalation check method
  async checkEscalations() {
    try {
      console.log('Checking for escalation triggers...');
      
      // Check feedback SLA breaches
      await this.checkFeedbackSLABreaches();
      
      // Check alert escalations
      await this.checkAlertEscalations();
      
      // Check existing escalation timeouts
      await this.checkEscalationTimeouts();
      
      // Check workflow approval timeouts
      await this.checkWorkflowApprovalTimeouts();
      
    } catch (error) {
      console.error('Error during escalation check:', error);
    }
  }

  // Check for feedback SLA breaches
  async checkFeedbackSLABreaches() {
    const client = await this.pool.connect();
    
    try {
      // Get feedback items that have breached SLA and haven't been escalated yet
      const query = `
        SELECT 
          fs.*,
          EXTRACT(EPOCH FROM (NOW() - fs.submitted_date))/60 as minutes_elapsed
        FROM feedback_submissions fs
        LEFT JOIN escalations e ON fs.feedback_id = e.feedback_id
        WHERE fs.status IN ('Open', 'In Progress')
          AND e.id IS NULL
          AND (
            (fs.priority = 'Critical' AND fs.submitted_date < NOW() - INTERVAL '15 minutes') OR
            (fs.priority = 'High' AND fs.submitted_date < NOW() - INTERVAL '1 hour') OR
            (fs.priority = 'Medium' AND fs.submitted_date < NOW() - INTERVAL '4 hours') OR
            (fs.priority = 'Low' AND fs.submitted_date < NOW() - INTERVAL '24 hours')
          )
      `;

      const result = await client.query(query);

      for (const feedback of result.rows) {
        await this.createFeedbackEscalation(client, feedback, 'SLA breach detected');
      }

      if (result.rows.length > 0) {
        console.log(`Created ${result.rows.length} feedback escalations for SLA breaches`);
      }
    } catch (error) {
      console.error('Error checking feedback SLA breaches:', error);
    } finally {
      client.release();
    }
  }

  // Check for alert escalations
  async checkAlertEscalations() {
    const client = await this.pool.connect();
    
    try {
      // Get critical alerts that haven't been acknowledged within 5 minutes
      const query = `
        SELECT *
        FROM alerts
        WHERE status = 'active'
          AND severity = 'Critical'
          AND triggered_at < NOW() - INTERVAL '5 minutes'
          AND escalation_level = 0
      `;

      const result = await client.query(query);

      for (const alert of result.rows) {
        await this.escalateAlert(client, alert, 'Critical alert not acknowledged within SLA');
      }

      if (result.rows.length > 0) {
        console.log(`Escalated ${result.rows.length} critical alerts`);
      }
    } catch (error) {
      console.error('Error checking alert escalations:', error);
    } finally {
      client.release();
    }
  }

  // Check for escalation timeouts
  async checkEscalationTimeouts() {
    const client = await this.pool.connect();
    
    try {
      // Get escalations that haven't been addressed within their timeout period
      const query = `
        SELECT 
          e.*,
          EXTRACT(EPOCH FROM (NOW() - e.escalation_date))/60 as minutes_elapsed
        FROM escalations e
        WHERE e.status IN ('Open', 'In Progress')
          AND (
            (e.priority = 'Critical' AND e.escalation_date < NOW() - INTERVAL '30 minutes') OR
            (e.priority = 'High' AND e.escalation_date < NOW() - INTERVAL '2 hours') OR
            (e.priority = 'Medium' AND e.escalation_date < NOW() - INTERVAL '8 hours')
          )
          AND e.escalation_level < 3
      `;

      const result = await client.query(query);

      for (const escalation of result.rows) {
        await this.escalateToNextLevel(client, escalation, 'Escalation timeout reached');
      }

      if (result.rows.length > 0) {
        console.log(`Escalated ${result.rows.length} items to next level`);
      }
    } catch (error) {
      console.error('Error checking escalation timeouts:', error);
    } finally {
      client.release();
    }
  }

  // Check for workflow approval timeouts
  async checkWorkflowApprovalTimeouts() {
    const client = await this.pool.connect();
    
    try {
      // Get workflow approvals that are overdue
        const query = `
          SELECT 
            wa.*,
            wi.workflow_type,
            wi.title as workflow_title
          FROM workflow_approvals wa
          JOIN workflow_instances wi ON wa.workflow_instance_id::VARCHAR = wi.id::VARCHAR
          WHERE wa.approval_status = 'pending'
            AND wa.due_date < NOW()
            AND wa.escalated_at IS NULL
        `;

      const result = await client.query(query);

      for (const approval of result.rows) {
        await this.escalateWorkflowApproval(client, approval, 'Approval deadline exceeded');
      }

      if (result.rows.length > 0) {
        console.log(`Escalated ${result.rows.length} overdue workflow approvals`);
      }
    } catch (error) {
      console.error('Error checking workflow approval timeouts:', error);
    } finally {
      client.release();
    }
  }

  // Create feedback escalation
  async createFeedbackEscalation(client, feedback, reason) {
    try {
      const escalationId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const escalationTarget = this.getEscalationTarget(feedback.priority, feedback.category);

      const escalationQuery = `
        INSERT INTO escalations (
          escalation_id, feedback_id, escalation_level, escalated_to, escalated_to_role,
          escalation_reason, priority, category, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const escalationValues = [
        escalationId,
        feedback.feedback_id,
        1,
        escalationTarget.user,
        escalationTarget.role,
        reason,
        feedback.priority,
        feedback.category,
        'Open'
      ];

      const escalationResult = await client.query(escalationQuery, escalationValues);

      // Log the escalation activity
      await client.query(`
        INSERT INTO escalation_activity_log (escalation_id, activity_type, description, created_by)
        VALUES ($1, 'escalation_created', $2, 'system')
      `, [escalationId, `Automatic escalation: ${reason}`]);

      // Create notification
      await this.createEscalationNotification(client, escalationResult.rows[0], 'created');

      return escalationResult.rows[0];
    } catch (error) {
      console.error('Error creating feedback escalation:', error);
      throw error;
    }
  }

  // Escalate alert
  async escalateAlert(client, alert, reason) {
    try {
      // Update alert escalation level
      await client.query(`
        UPDATE alerts 
        SET escalation_level = escalation_level + 1, escalated_at = NOW()
        WHERE alert_id = $1
      `, [alert.alert_id]);

      // Log the escalation action
      await client.query(`
        INSERT INTO alert_actions (alert_id, action_type, action_by, notes)
        VALUES ($1, 'escalate', NULL, $2)
      `, [alert.alert_id, `Automatic escalation: ${reason}`]);

      // Create notification for escalated alert
      await this.createAlertEscalationNotification(client, alert, reason);

    } catch (error) {
      console.error('Error escalating alert:', error);
      throw error;
    }
  }

  // Escalate to next level
  async escalateToNextLevel(client, escalation, reason) {
    try {
      const nextLevel = escalation.escalation_level + 1;
      const escalationTarget = this.getEscalationTarget(escalation.priority, escalation.category, nextLevel);

      // Create new escalation record
      const newEscalationId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const escalationQuery = `
        INSERT INTO escalations (
          escalation_id, feedback_id, escalation_level, escalated_to, escalated_to_role,
          escalation_reason, priority, category, status, parent_escalation_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const escalationValues = [
        newEscalationId,
        escalation.feedback_id,
        nextLevel,
        escalationTarget.user,
        escalationTarget.role,
        reason,
        escalation.priority,
        escalation.category,
        'Open',
        escalation.escalation_id
      ];

      const escalationResult = await client.query(escalationQuery, escalationValues);

      // Update parent escalation
      await client.query(`
        UPDATE escalations 
        SET status = 'Escalated', escalated_to_escalation_id = $1
        WHERE escalation_id = $2
      `, [newEscalationId, escalation.escalation_id]);

      // Log the escalation activity
      await client.query(`
        INSERT INTO escalation_activity_log (escalation_id, activity_type, description, created_by)
        VALUES ($1, 'escalation_created', $2, 'system')
      `, [newEscalationId, `Escalated to level ${nextLevel}: ${reason}`]);

      // Create notification
      await this.createEscalationNotification(client, escalationResult.rows[0], 'escalated');

      return escalationResult.rows[0];
    } catch (error) {
      console.error('Error escalating to next level:', error);
      throw error;
    }
  }

  // Escalate workflow approval
  async escalateWorkflowApproval(client, approval, reason) {
    try {
      // Mark approval as escalated
      await client.query(`
        UPDATE workflow_approvals 
        SET escalated_at = NOW(), escalation_reason = $1
        WHERE id = $2
      `, [reason, approval.id]);

      // Create escalation notification
      await this.createWorkflowEscalationNotification(client, approval, reason);

    } catch (error) {
      console.error('Error escalating workflow approval:', error);
      throw error;
    }
  }

  // Get escalation target based on priority and category
  getEscalationTarget(priority, category, level = 1) {
    const escalationMatrix = {
      'Critical': {
        1: { role: 'IT Manager', user: null },
        2: { role: 'System Administrator', user: null },
        3: { role: 'Executive', user: null }
      },
      'High': {
        1: { role: 'IT Manager', user: null },
        2: { role: 'System Administrator', user: null },
        3: { role: 'IT Manager', user: null }
      },
      'Medium': {
        1: { role: 'IT Support', user: null },
        2: { role: 'IT Manager', user: null },
        3: { role: 'System Administrator', user: null }
      },
      'Low': {
        1: { role: 'IT Support', user: null },
        2: { role: 'IT Manager', user: null },
        3: { role: 'IT Manager', user: null }
      }
    };

    return escalationMatrix[priority]?.[level] || { role: 'IT Manager', user: null };
  }

  // Create escalation notification
  async createEscalationNotification(client, escalation, action) {
    try {
      const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Get notification type ID
      const typeResult = await client.query(
        'SELECT id FROM notification_types WHERE type_name = $1',
        ['escalation_created']
      );

      if (typeResult.rows.length === 0) return;

      let subject, message;
      
      if (action === 'created') {
        subject = `New Escalation Created: ${escalation.escalation_id}`;
        message = `A new escalation has been created for ${escalation.category} issue. Priority: ${escalation.priority}. Reason: ${escalation.escalation_reason}`;
      } else if (action === 'escalated') {
        subject = `Escalation Level Increased: ${escalation.escalation_id}`;
        message = `Escalation ${escalation.escalation_id} has been escalated to level ${escalation.escalation_level}. Immediate attention required.`;
      }

      await client.query(`
        INSERT INTO notifications (
          notification_id, notification_type_id, recipient_role, subject, message,
          priority, category, related_entity_type, related_entity_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        notificationId,
        typeResult.rows[0].id,
        escalation.escalated_to_role,
        subject,
        message,
        escalation.priority,
        'escalation',
        'escalation',
        escalation.escalation_id,
        JSON.stringify({ escalation_level: escalation.escalation_level, action })
      ]);

    } catch (error) {
      console.error('Error creating escalation notification:', error);
    }
  }

  // Create alert escalation notification
  async createAlertEscalationNotification(client, alert, reason) {
    try {
      const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Get notification type ID
      const typeResult = await client.query(
        'SELECT id FROM notification_types WHERE type_name = $1',
        ['escalation_created']
      );

      if (typeResult.rows.length === 0) return;

      await client.query(`
        INSERT INTO notifications (
          notification_id, notification_type_id, recipient_role, subject, message,
          priority, category, related_entity_type, related_entity_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        notificationId,
        typeResult.rows[0].id,
        'System Administrator',
        `Alert Escalated: ${alert.title}`,
        `Critical alert ${alert.alert_id} has been automatically escalated. Reason: ${reason}`,
        'Critical',
        'security',
        'alert',
        alert.alert_id,
        JSON.stringify({ escalation_reason: reason, alert_severity: alert.severity })
      ]);

    } catch (error) {
      console.error('Error creating alert escalation notification:', error);
    }
  }

  // Create workflow escalation notification
  async createWorkflowEscalationNotification(client, approval, reason) {
    try {
      const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Get notification type ID
      const typeResult = await client.query(
        'SELECT id FROM notification_types WHERE type_name = $1',
        ['escalation_created']
      );

      if (typeResult.rows.length === 0) return;

      await client.query(`
        INSERT INTO notifications (
          notification_id, notification_type_id, recipient_role, subject, message,
          priority, category, related_entity_type, related_entity_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        notificationId,
        typeResult.rows[0].id,
        'IT Manager',
        `Workflow Approval Overdue: ${approval.workflow_title}`,
        `Workflow approval for "${approval.workflow_title}" is overdue. Reason: ${reason}`,
        'High',
        'workflow',
        'workflow',
        approval.workflow_instance_id,
        JSON.stringify({ approval_id: approval.id, escalation_reason: reason })
      ]);

    } catch (error) {
      console.error('Error creating workflow escalation notification:', error);
    }
  }

  // Get escalation statistics
  async getEscalationStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_escalations,
          COUNT(CASE WHEN status = 'Open' THEN 1 END) as open_escalations,
          COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_escalations,
          COUNT(CASE WHEN priority = 'Critical' AND status IN ('Open', 'In Progress') THEN 1 END) as critical_open,
          COUNT(CASE WHEN escalation_date >= NOW() - INTERVAL '24 hours' THEN 1 END) as escalations_24h,
          AVG(EXTRACT(EPOCH FROM (COALESCE(resolution_date, NOW()) - escalation_date))/3600) as avg_resolution_hours
        FROM escalations
        WHERE escalation_date >= NOW() - INTERVAL '30 days'
      `;

      const result = await this.pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting escalation stats:', error);
      return {};
    }
  }

  // Manual escalation method
  async createManualEscalation(feedbackId, reason, escalatedBy, escalatedTo, escalatedToRole) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get feedback details
      const feedbackResult = await client.query(
        'SELECT * FROM feedback_submissions WHERE feedback_id = $1',
        [feedbackId]
      );

      if (feedbackResult.rows.length === 0) {
        throw new Error('Feedback not found');
      }

      const feedback = feedbackResult.rows[0];
      const escalationId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Determine escalation level
      const existingEscalations = await client.query(
        'SELECT MAX(escalation_level) as max_level FROM escalations WHERE feedback_id = $1',
        [feedbackId]
      );

      const escalationLevel = (existingEscalations.rows[0]?.max_level || 0) + 1;

      const escalationQuery = `
        INSERT INTO escalations (
          escalation_id, feedback_id, escalation_level, escalated_to, escalated_to_role,
          escalation_reason, priority, category, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const escalationValues = [
        escalationId,
        feedbackId,
        escalationLevel,
        escalatedTo,
        escalatedToRole,
        reason,
        feedback.priority,
        feedback.category,
        'Open'
      ];

      const escalationResult = await client.query(escalationQuery, escalationValues);

      // Log the escalation activity
      await client.query(`
        INSERT INTO escalation_activity_log (escalation_id, activity_type, description, created_by)
        VALUES ($1, 'escalation_created', $2, $3)
      `, [escalationId, `Manual escalation: ${reason}`, escalatedBy]);

      // Create notification
      await this.createEscalationNotification(client, escalationResult.rows[0], 'created');

      await client.query('COMMIT');

      return escalationResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating manual escalation:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = EscalationService;