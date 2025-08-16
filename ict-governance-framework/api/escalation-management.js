require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { Pool } = require('pg');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const EscalationService = require('../services/escalation-service');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize escalation service
const escalationService = new EscalationService();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Start escalation monitoring service
router.post('/service/start', requirePermission('escalation.manage'), async (req, res) => {
  try {
    escalationService.start();
    res.json({ 
      message: 'Escalation monitoring service started successfully',
      status: 'running'
    });
  } catch (error) {
    console.error('Error starting escalation service:', error);
    res.status(500).json({ error: 'Failed to start escalation service' });
  }
});

// Stop escalation monitoring service
router.post('/service/stop', requirePermission('escalation.manage'), async (req, res) => {
  try {
    escalationService.stop();
    res.json({ 
      message: 'Escalation monitoring service stopped successfully',
      status: 'stopped'
    });
  } catch (error) {
    console.error('Error stopping escalation service:', error);
    res.status(500).json({ error: 'Failed to stop escalation service' });
  }
});

// Get escalation service status
router.get('/service/status', requirePermission('escalation.read'), async (req, res) => {
  try {
    const stats = await escalationService.getEscalationStats();
    
    res.json({
      service_status: escalationService.isRunning ? 'running' : 'stopped',
      check_interval: escalationService.checkInterval,
      statistics: stats
    });
  } catch (error) {
    console.error('Error getting escalation service status:', error);
    res.status(500).json({ error: 'Failed to get escalation service status' });
  }
});

// Trigger manual escalation check
router.post('/service/check', requirePermission('escalation.manage'), async (req, res) => {
  try {
    await escalationService.checkEscalations();
    res.json({ 
      message: 'Manual escalation check completed successfully'
    });
  } catch (error) {
    console.error('Error during manual escalation check:', error);
    res.status(500).json({ error: 'Failed to perform escalation check' });
  }
});

// Create manual escalation
router.post('/manual', requirePermission('escalation.create'), async (req, res) => {
  try {
    const {
      feedback_id,
      reason,
      escalated_to,
      escalated_to_role
    } = req.body;

    if (!feedback_id || !reason) {
      return res.status(400).json({ 
        error: 'Missing required fields: feedback_id, reason' 
      });
    }

    const escalation = await escalationService.createManualEscalation(
      feedback_id,
      reason,
      req.user.id,
      escalated_to,
      escalated_to_role
    );

    res.status(201).json({
      message: 'Manual escalation created successfully',
      escalation
    });
  } catch (error) {
    console.error('Error creating manual escalation:', error);
    res.status(500).json({ error: 'Failed to create manual escalation' });
  }
});

// Get escalation policies
router.get('/policies', requirePermission('escalation.read'), async (req, res) => {
  try {
    const query = `
      SELECT 
        ep.*,
        u.username as created_by_username,
        nt.template_name as notification_template_name
      FROM escalation_policies ep
      LEFT JOIN users u ON ep.created_by = u.id
      LEFT JOIN notification_templates nt ON ep.notification_template_id = nt.id
      WHERE ep.is_active = true
      ORDER BY ep.policy_name
    `;

    const result = await pool.query(query);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching escalation policies:', error);
    res.status(500).json({ error: 'Failed to fetch escalation policies' });
  }
});

// Create escalation policy
router.post('/policies', requirePermission('escalation.manage'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      policy_name,
      description,
      policy_type,
      escalation_rules,
      notification_template_id,
      steps = []
    } = req.body;

    if (!policy_name || !policy_type || !escalation_rules) {
      return res.status(400).json({ 
        error: 'Missing required fields: policy_name, policy_type, escalation_rules' 
      });
    }

    // Create policy
    const policyQuery = `
      INSERT INTO escalation_policies (
        policy_name, description, policy_type, escalation_rules,
        notification_template_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const policyResult = await client.query(policyQuery, [
      policy_name,
      description,
      policy_type,
      JSON.stringify(escalation_rules),
      notification_template_id,
      req.user.id
    ]);

    const policyId = policyResult.rows[0].id;

    // Create policy steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await client.query(`
        INSERT INTO escalation_policy_steps (
          escalation_policy_id, step_order, step_name, delay_minutes,
          escalation_targets, notification_template_id, conditions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        policyId,
        i + 1,
        step.step_name,
        step.delay_minutes || 0,
        JSON.stringify(step.escalation_targets),
        step.notification_template_id,
        JSON.stringify(step.conditions || {})
      ]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Escalation policy created successfully',
      policy: policyResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating escalation policy:', error);
    res.status(500).json({ error: 'Failed to create escalation policy' });
  } finally {
    client.release();
  }
});

// Update escalation policy
router.put('/policies/:id', requirePermission('escalation.manage'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      policy_name,
      description,
      policy_type,
      escalation_rules,
      notification_template_id,
      is_active,
      steps = []
    } = req.body;

    // Update policy
    const updateQuery = `
      UPDATE escalation_policies 
      SET policy_name = $1, description = $2, policy_type = $3, 
          escalation_rules = $4, notification_template_id = $5, 
          is_active = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      policy_name,
      description,
      policy_type,
      JSON.stringify(escalation_rules),
      notification_template_id,
      is_active,
      id
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Escalation policy not found' });
    }

    // Delete existing steps
    await client.query('DELETE FROM escalation_policy_steps WHERE escalation_policy_id = $1', [id]);

    // Create new steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await client.query(`
        INSERT INTO escalation_policy_steps (
          escalation_policy_id, step_order, step_name, delay_minutes,
          escalation_targets, notification_template_id, conditions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        id,
        i + 1,
        step.step_name,
        step.delay_minutes || 0,
        JSON.stringify(step.escalation_targets),
        step.notification_template_id,
        JSON.stringify(step.conditions || {})
      ]);
    }

    await client.query('COMMIT');

    res.json({
      message: 'Escalation policy updated successfully',
      policy: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating escalation policy:', error);
    res.status(500).json({ error: 'Failed to update escalation policy' });
  } finally {
    client.release();
  }
});

// Get escalation policy details with steps
router.get('/policies/:id', requirePermission('escalation.read'), async (req, res) => {
  try {
    const { id } = req.params;

    const policyQuery = `
      SELECT 
        ep.*,
        u.username as created_by_username,
        nt.template_name as notification_template_name
      FROM escalation_policies ep
      LEFT JOIN users u ON ep.created_by = u.id
      LEFT JOIN notification_templates nt ON ep.notification_template_id = nt.id
      WHERE ep.id = $1
    `;

    const stepsQuery = `
      SELECT 
        eps.*,
        nt.template_name as notification_template_name
      FROM escalation_policy_steps eps
      LEFT JOIN notification_templates nt ON eps.notification_template_id = nt.id
      WHERE eps.escalation_policy_id = $1
      ORDER BY eps.step_order
    `;

    const [policyResult, stepsResult] = await Promise.all([
      pool.query(policyQuery, [id]),
      pool.query(stepsQuery, [id])
    ]);

    if (policyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Escalation policy not found' });
    }

    const policy = policyResult.rows[0];
    policy.steps = stepsResult.rows;

    res.json(policy);
  } catch (error) {
    console.error('Error fetching escalation policy details:', error);
    res.status(500).json({ error: 'Failed to fetch escalation policy details' });
  }
});

// Delete escalation policy
router.delete('/policies/:id', requirePermission('escalation.manage'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Delete policy steps first
    await client.query('DELETE FROM escalation_policy_steps WHERE escalation_policy_id = $1', [id]);

    // Delete policy
    const result = await client.query('DELETE FROM escalation_policies WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Escalation policy not found' });
    }

    await client.query('COMMIT');

    res.json({ message: 'Escalation policy deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting escalation policy:', error);
    res.status(500).json({ error: 'Failed to delete escalation policy' });
  } finally {
    client.release();
  }
});

// Get SLA monitoring data
router.get('/sla-monitoring', requirePermission('escalation.read'), async (req, res) => {
  try {
    const query = `
      SELECT 
        sm.*,
        fs.subject as feedback_subject,
        fs.priority as feedback_priority,
        fs.category as feedback_category
      FROM sla_monitoring sm
      LEFT JOIN feedback_submissions fs ON sm.item_id = fs.feedback_id
      WHERE sm.created_date >= NOW() - INTERVAL '7 days'
      ORDER BY sm.created_date DESC
      LIMIT 100
    `;

    const result = await pool.query(query);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching SLA monitoring data:', error);
    res.status(500).json({ error: 'Failed to fetch SLA monitoring data' });
  }
});

// Get escalation metrics
router.get('/metrics', requirePermission('escalation.read'), async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;

    const metricsQuery = `
      SELECT 
        COUNT(*) as total_escalations,
        COUNT(CASE WHEN status = 'Open' THEN 1 END) as open_escalations,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_escalations,
        COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved_escalations,
        COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical_escalations,
        COUNT(CASE WHEN priority = 'High' THEN 1 END) as high_escalations,
        AVG(EXTRACT(EPOCH FROM (COALESCE(resolution_date, NOW()) - escalation_date))/3600) as avg_resolution_hours,
        COUNT(CASE WHEN escalation_level > 1 THEN 1 END) as multi_level_escalations
      FROM escalations
      WHERE escalation_date >= NOW() - INTERVAL '${parseInt(timeframe)} days'
    `;

    const trendQuery = `
      SELECT 
        DATE(escalation_date) as date,
        COUNT(*) as escalations_count,
        COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical_count
      FROM escalations
      WHERE escalation_date >= NOW() - INTERVAL '${parseInt(timeframe)} days'
      GROUP BY DATE(escalation_date)
      ORDER BY date
    `;

    const [metricsResult, trendResult] = await Promise.all([
      pool.query(metricsQuery),
      pool.query(trendQuery)
    ]);

    res.json({
      metrics: metricsResult.rows[0],
      trend: trendResult.rows
    });
  } catch (error) {
    console.error('Error fetching escalation metrics:', error);
    res.status(500).json({ error: 'Failed to fetch escalation metrics' });
  }
});

// Auto-start escalation service when module loads
setTimeout(() => {
  try {
    escalationService.start();
    console.log('Escalation service auto-started');
  } catch (error) {
    console.error('Failed to auto-start escalation service:', error);
  }
}, 5000); // Start after 5 seconds to allow database connections to establish

module.exports = router;