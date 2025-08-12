require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET /api/escalations/list - Get all escalations
router.get('/list', async (req, res) => {
  try {
    const { status, priority, level, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        e.escalation_id, e.feedback_id, e.escalation_level, 
        e.escalated_to, e.escalated_to_role, e.escalation_reason,
        e.escalation_date, e.status, e.priority, e.category,
        e.resolution_date, e.resolved_by, e.resolution_notes,
        f.subject, f.description, f.contact_info
      FROM escalations e
      LEFT JOIN feedback_submissions f ON e.feedback_id = f.feedback_id
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND e.status = $${paramCount}`;
      values.push(status);
    }

    if (priority) {
      paramCount++;
      query += ` AND e.priority = $${paramCount}`;
      values.push(priority);
    }

    if (level) {
      paramCount++;
      query += ` AND e.escalation_level = $${paramCount}`;
      values.push(parseInt(level));
    }

    query += ` ORDER BY e.escalation_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (error) {
    console.error('Escalations list error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve escalations', 
      details: error.message 
    });
  }
});

// GET /api/escalations/:id - Get specific escalation
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const escalationQuery = `
      SELECT 
        e.*, f.subject, f.description, f.contact_info, f.submitted_date
      FROM escalations e
      LEFT JOIN feedback_submissions f ON e.feedback_id = f.feedback_id
      WHERE e.escalation_id = $1
    `;
    
    const activityQuery = `
      SELECT * FROM escalation_activity_log 
      WHERE escalation_id = $1 
      ORDER BY created_date DESC
    `;

    const [escalationResult, activityResult] = await Promise.all([
      pool.query(escalationQuery, [id]),
      pool.query(activityQuery, [id])
    ]);

    if (escalationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Escalation not found' });
    }

    const escalation = escalationResult.rows[0];
    escalation.activities = activityResult.rows;

    res.json(escalation);

  } catch (error) {
    console.error('Escalation retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve escalation', 
      details: error.message 
    });
  }
});

// POST /api/escalations/:id/action - Perform action on escalation
router.post('/:id/action', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { action, notes, assignedTo } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    // Get current escalation
    const escalationResult = await client.query(
      'SELECT * FROM escalations WHERE escalation_id = $1',
      [id]
    );

    if (escalationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Escalation not found' });
    }

    const escalation = escalationResult.rows[0];
    let updateQuery = '';
    let updateValues = [];
    let newStatus = escalation.status;

    switch (action) {
      case 'acknowledge':
        newStatus = 'In Progress';
        updateQuery = `
          UPDATE escalations 
          SET status = $2, acknowledged_date = NOW(), last_updated = NOW()
          WHERE escalation_id = $1
        `;
        updateValues = [id, newStatus];
        break;

      case 'assign':
        if (!assignedTo) {
          return res.status(400).json({ error: 'assignedTo is required for assign action' });
        }
        updateQuery = `
          UPDATE escalations 
          SET escalated_to = $2, last_updated = NOW()
          WHERE escalation_id = $1
        `;
        updateValues = [id, assignedTo];
        break;

      case 'resolve':
        newStatus = 'Resolved';
        updateQuery = `
          UPDATE escalations 
          SET status = $2, resolution_date = NOW(), resolution_notes = $3, last_updated = NOW()
          WHERE escalation_id = $1
        `;
        updateValues = [id, newStatus, notes];
        
        // Also update the related feedback
        await client.query(
          'UPDATE feedback_submissions SET status = $2 WHERE feedback_id = $1',
          [escalation.feedback_id, 'Resolved']
        );
        break;

      case 'escalate':
        // Create new escalation at higher level
        const newEscalationId = await createHigherLevelEscalation(
          client, 
          escalation, 
          notes || 'Escalated to higher level'
        );
        
        // Close current escalation
        newStatus = 'Escalated';
        updateQuery = `
          UPDATE escalations 
          SET status = $2, escalated_to_escalation_id = $3, last_updated = NOW()
          WHERE escalation_id = $1
        `;
        updateValues = [id, newStatus, newEscalationId];
        break;

      case 'close':
        newStatus = 'Closed';
        updateQuery = `
          UPDATE escalations 
          SET status = $2, resolution_date = NOW(), resolution_notes = $3, last_updated = NOW()
          WHERE escalation_id = $1
        `;
        updateValues = [id, newStatus, notes];
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Execute the update
    await client.query(updateQuery, updateValues);

    // Add activity log entry
    const activityQuery = `
      INSERT INTO escalation_activity_log (
        escalation_id, activity_type, description, created_by, created_date
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    await client.query(activityQuery, [
      id,
      action.charAt(0).toUpperCase() + action.slice(1),
      notes || `Escalation ${action}d`,
      'system', // This should be the actual user
      new Date()
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Escalation ${action}d successfully`,
      escalationId: id,
      newStatus: newStatus
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Escalation action error:', error);
    res.status(500).json({ 
      error: 'Failed to perform escalation action', 
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// POST /api/escalations/create - Create new escalation
router.post('/create', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      feedbackId,
      escalationLevel,
      escalatedTo,
      escalatedToRole,
      escalationReason,
      priority,
      category
    } = req.body;

    if (!feedbackId || !escalationLevel || !escalatedTo || !escalationReason) {
      return res.status(400).json({ 
        error: 'Missing required fields: feedbackId, escalationLevel, escalatedTo, escalationReason' 
      });
    }

    const escalationId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const escalationQuery = `
      INSERT INTO escalations (
        escalation_id, feedback_id, escalation_level, escalated_to, 
        escalated_to_role, escalation_reason, escalation_date, 
        status, priority, category
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const escalationValues = [
      escalationId,
      feedbackId,
      escalationLevel,
      escalatedTo,
      escalatedToRole,
      escalationReason,
      new Date(),
      'Open',
      priority,
      category
    ];

    const result = await client.query(escalationQuery, escalationValues);

    // Update feedback with escalation info
    await client.query(
      'UPDATE feedback_submissions SET escalation_level = $2, assigned_to = $3 WHERE feedback_id = $1',
      [feedbackId, escalationLevel, escalatedTo]
    );

    // Add activity log entry
    const activityQuery = `
      INSERT INTO escalation_activity_log (
        escalation_id, activity_type, description, created_by, created_date
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    await client.query(activityQuery, [
      escalationId,
      'Created',
      `Escalation created: ${escalationReason}`,
      'system',
      new Date()
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      escalationId: escalationId,
      escalation: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Escalation creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create escalation', 
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// GET /api/escalations/metrics - Get escalation metrics
router.get('/metrics', async (req, res) => {
  try {
    const metricsQuery = `
      SELECT 
        COUNT(*) as total_escalations,
        COUNT(CASE WHEN status = 'Open' THEN 1 END) as open_escalations,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_escalations,
        COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved_escalations,
        COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed_escalations,
        COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical_escalations,
        COUNT(CASE WHEN priority = 'High' THEN 1 END) as high_escalations,
        AVG(CASE 
          WHEN resolution_date IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (resolution_date - escalation_date))/3600 
        END) as avg_resolution_time_hours
      FROM escalations
      WHERE escalation_date >= NOW() - INTERVAL '30 days'
    `;

    const slaQuery = `
      SELECT 
        priority,
        COUNT(*) as total,
        COUNT(CASE 
          WHEN acknowledged_date IS NOT NULL 
          AND acknowledged_date <= escalation_date + INTERVAL '15 minutes'
          THEN 1 
        END) as acknowledgment_sla_met,
        COUNT(CASE 
          WHEN resolution_date IS NOT NULL 
          AND (
            (priority = 'Critical' AND resolution_date <= escalation_date + INTERVAL '2 hours') OR
            (priority = 'High' AND resolution_date <= escalation_date + INTERVAL '8 hours') OR
            (priority = 'Medium' AND resolution_date <= escalation_date + INTERVAL '24 hours') OR
            (priority = 'Low' AND resolution_date <= escalation_date + INTERVAL '72 hours')
          )
          THEN 1 
        END) as resolution_sla_met
      FROM escalations
      WHERE escalation_date >= NOW() - INTERVAL '30 days'
      GROUP BY priority
    `;

    const [metricsResult, slaResult] = await Promise.all([
      pool.query(metricsQuery),
      pool.query(slaQuery)
    ]);

    const metrics = metricsResult.rows[0];
    const slaMetrics = slaResult.rows;

    res.json({
      overall: metrics,
      sla: slaMetrics,
      period: 'Last 30 days'
    });

  } catch (error) {
    console.error('Escalation metrics error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve escalation metrics', 
      details: error.message 
    });
  }
});

// Helper function to create higher level escalation
async function createHigherLevelEscalation(client, currentEscalation, reason) {
  const newLevel = currentEscalation.escalation_level + 1;
  const escalationTarget = getEscalationTarget(newLevel, currentEscalation.category);
  
  if (!escalationTarget) {
    throw new Error('No higher escalation level available');
  }

  const escalationId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const escalationQuery = `
    INSERT INTO escalations (
      escalation_id, feedback_id, escalation_level, escalated_to, 
      escalated_to_role, escalation_reason, escalation_date, 
      status, priority, category, parent_escalation_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING escalation_id
  `;

  const result = await client.query(escalationQuery, [
    escalationId,
    currentEscalation.feedback_id,
    newLevel,
    escalationTarget.assignee,
    escalationTarget.role,
    reason,
    new Date(),
    'Open',
    currentEscalation.priority,
    currentEscalation.category,
    currentEscalation.escalation_id
  ]);

  return result.rows[0].escalation_id;
}

// Helper function to get escalation target by level
function getEscalationTarget(level, category) {
  const escalationMatrix = {
    1: { role: 'Technology Custodian', assignee: 'custodian@company.com' },
    2: { role: 'Technology Steward', assignee: 'steward@company.com' },
    3: { role: 'Domain Owner', assignee: 'domain-owner@company.com' },
    4: { role: 'ICT Governance Council', assignee: 'governance-council@company.com' },
    5: { role: 'Executive Leadership', assignee: 'executives@company.com' }
  };

  return escalationMatrix[level] || null;
}

module.exports = router;