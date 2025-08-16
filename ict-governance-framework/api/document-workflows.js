// File: ict-governance-framework/api/document-workflows.js
// Document Approval Workflow Management API

const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, query } = require('express-validator');

const { authenticateToken, requirePermission, logActivity } = require('./auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper functions
function generateWorkflowId() {
  return `WF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function generateStepId() {
  return `STEP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

async function logDocumentActivity(documentId, versionId, activityType, description, userId, ipAddress, userAgent, metadata = {}) {
  const activityId = `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const query = `
    INSERT INTO document_activity_log (activity_id, document_id, version_id, activity_type, description, user_id, ip_address, user_agent, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `;
  
  await pool.query(query, [activityId, documentId, versionId, activityType, description, userId, ipAddress, userAgent, JSON.stringify(metadata)]);
}

// Validation middleware
const workflowValidation = [
  body('document_id').notEmpty().withMessage('Document ID is required'),
  body('version_id').notEmpty().withMessage('Version ID is required'),
  body('workflow_type').isIn(['Standard', 'Fast-Track', 'Emergency', 'Collaborative']).withMessage('Invalid workflow type'),
  body('priority').optional().isIn(['Critical', 'High', 'Medium', 'Low']).withMessage('Invalid priority'),
  body('due_date').optional().isISO8601().withMessage('Invalid due date'),
  body('approval_steps').isArray({ min: 1 }).withMessage('At least one approval step is required'),
  body('approval_steps.*.step_name').notEmpty().withMessage('Step name is required'),
  body('approval_steps.*.approver_user_id').optional().notEmpty().withMessage('Approver user ID cannot be empty if provided'),
  body('approval_steps.*.approver_role').optional().notEmpty().withMessage('Approver role cannot be empty if provided'),
  body('approval_steps.*.approval_type').isIn(['Required', 'Optional', 'Informational']).withMessage('Invalid approval type'),
  body('approval_steps.*.due_date').optional().isISO8601().withMessage('Invalid step due date')
];

const approvalValidation = [
  body('action').isIn(['approve', 'reject', 'skip']).withMessage('Invalid action'),
  body('comments').optional().trim().isLength({ max: 1000 }).withMessage('Comments must be less than 1000 characters')
];

// GET /api/document-workflows - List workflows with filtering
router.get('/', authenticateToken, requirePermission('workflow.approve'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['Pending', 'In Progress', 'Approved', 'Rejected', 'Cancelled']),
  query('document_id').optional().trim(),
  query('initiated_by').optional().trim(),
  query('assigned_to_me').optional().isBoolean().withMessage('assigned_to_me must be boolean')
], async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      status,
      document_id,
      initiated_by,
      assigned_to_me
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (status) {
      whereConditions.push(`daw.status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (document_id) {
      whereConditions.push(`daw.document_id = $${paramIndex++}`);
      queryParams.push(document_id);
    }

    if (initiated_by) {
      whereConditions.push(`daw.initiated_by = $${paramIndex++}`);
      queryParams.push(initiated_by);
    }

    if (assigned_to_me === 'true') {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM document_approval_steps das 
        WHERE das.workflow_id = daw.workflow_id 
        AND das.approver_user_id = $${paramIndex}
        AND das.status = 'Pending'
      )`);
      queryParams.push(req.user.user_id);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get workflows
    const workflowsQuery = `
      SELECT 
        daw.*,
        d.title as document_title,
        d.document_type,
        dv.version_number,
        u.username as initiated_by_username,
        u.first_name as initiated_by_first_name,
        u.last_name as initiated_by_last_name,
        (
          SELECT COUNT(*) 
          FROM document_approval_steps das 
          WHERE das.workflow_id = daw.workflow_id
        ) as total_steps,
        (
          SELECT COUNT(*) 
          FROM document_approval_steps das 
          WHERE das.workflow_id = daw.workflow_id AND das.status = 'Approved'
        ) as completed_steps
      FROM document_approval_workflows daw
      LEFT JOIN documents d ON daw.document_id = d.document_id
      LEFT JOIN document_versions dv ON daw.version_id = dv.version_id
      LEFT JOIN users u ON daw.initiated_by = u.user_id
      ${whereClause}
      ORDER BY daw.initiated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const workflowsResult = await client.query(workflowsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM document_approval_workflows daw
      LEFT JOIN documents d ON daw.document_id = d.document_id
      ${whereClause}
    `;

    const countResult = await client.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        workflows: workflowsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error listing workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list workflows',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// GET /api/document-workflows/:id - Get specific workflow with steps
router.get('/:id', authenticateToken, requirePermission('workflow.approve'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    // Get workflow details
    const workflowQuery = `
      SELECT 
        daw.*,
        d.title as document_title,
        d.document_type,
        d.description as document_description,
        dv.version_number,
        dv.change_summary,
        dv.content,
        u.username as initiated_by_username,
        u.first_name as initiated_by_first_name,
        u.last_name as initiated_by_last_name,
        u.email as initiated_by_email
      FROM document_approval_workflows daw
      LEFT JOIN documents d ON daw.document_id = d.document_id
      LEFT JOIN document_versions dv ON daw.version_id = dv.version_id
      LEFT JOIN users u ON daw.initiated_by = u.user_id
      WHERE daw.workflow_id = $1
    `;

    const workflowResult = await client.query(workflowQuery, [id]);

    if (workflowResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    const workflow = workflowResult.rows[0];

    // Get workflow steps
    const stepsQuery = `
      SELECT 
        das.*,
        u.username as approver_username,
        u.first_name as approver_first_name,
        u.last_name as approver_last_name,
        u.email as approver_email
      FROM document_approval_steps das
      LEFT JOIN users u ON das.approver_user_id = u.user_id
      WHERE das.workflow_id = $1
      ORDER BY das.step_number
    `;

    const stepsResult = await client.query(stepsQuery, [id]);

    res.json({
      success: true,
      data: {
        workflow,
        steps: stepsResult.rows
      }
    });

  } catch (error) {
    console.error('Error getting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workflow',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// POST /api/document-workflows - Create new approval workflow
router.post('/', authenticateToken, requirePermission('workflow.initiate'), workflowValidation, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    await client.query('BEGIN');

    const {
      document_id,
      version_id,
      workflow_type = 'Standard',
      priority = 'Medium',
      due_date,
      approval_steps,
      comments
    } = req.body;

    // Verify document and version exist
    const documentCheck = await client.query(`
      SELECT d.*, dv.version_number 
      FROM documents d
      LEFT JOIN document_versions dv ON d.document_id = dv.document_id AND dv.version_id = $2
      WHERE d.document_id = $1
    `, [document_id, version_id]);

    if (documentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Document or version not found'
      });
    }

    // Check if there's already an active workflow for this document
    const activeWorkflowCheck = await client.query(`
      SELECT workflow_id FROM document_approval_workflows 
      WHERE document_id = $1 AND status IN ('Pending', 'In Progress')
    `, [document_id]);

    if (activeWorkflowCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Document already has an active approval workflow'
      });
    }

    const workflowId = generateWorkflowId();

    // Create workflow
    const workflowQuery = `
      INSERT INTO document_approval_workflows (
        workflow_id, document_id, version_id, workflow_type, status, initiated_by,
        due_date, priority, approval_steps, comments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const workflowValues = [
      workflowId, document_id, version_id, workflow_type, 'Pending', req.user.user_id,
      due_date, priority, JSON.stringify(approval_steps), comments
    ];

    const workflowResult = await client.query(workflowQuery, workflowValues);
    const workflow = workflowResult.rows[0];

    // Create approval steps
    for (let i = 0; i < approval_steps.length; i++) {
      const step = approval_steps[i];
      const stepId = generateStepId();

      const stepQuery = `
        INSERT INTO document_approval_steps (
          step_id, workflow_id, step_number, step_name, approver_user_id, approver_role,
          approval_type, due_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      const stepValues = [
        stepId, workflowId, i + 1, step.step_name, step.approver_user_id, step.approver_role,
        step.approval_type, step.due_date
      ];

      await client.query(stepQuery, stepValues);
    }

    // Update document status to Under Review
    await client.query('UPDATE documents SET status = $1 WHERE document_id = $2', ['Under Review', document_id]);

    await client.query('COMMIT');

    await logDocumentActivity(
      document_id, 
      version_id, 
      'workflow.initiate', 
      `Approval workflow initiated: ${workflow_type}`, 
      req.user.user_id, 
      req.ip, 
      req.get('User-Agent'),
      { workflow_id: workflowId, workflow_type, steps_count: approval_steps.length }
    );

    res.status(201).json({
      success: true,
      message: 'Approval workflow created successfully',
      data: workflow
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create workflow',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// POST /api/document-workflows/:id/approve/:stepId - Approve/reject workflow step
router.post('/:id/approve/:stepId', authenticateToken, requirePermission('workflow.approve'), approvalValidation, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    await client.query('BEGIN');

    const { id: workflowId, stepId } = req.params;
    const { action, comments } = req.body;

    // Get workflow and step details
    const stepQuery = `
      SELECT 
        das.*,
        daw.document_id,
        daw.version_id,
        daw.status as workflow_status,
        d.title as document_title
      FROM document_approval_steps das
      LEFT JOIN document_approval_workflows daw ON das.workflow_id = daw.workflow_id
      LEFT JOIN documents d ON daw.document_id = d.document_id
      WHERE das.step_id = $1 AND das.workflow_id = $2
    `;

    const stepResult = await client.query(stepQuery, [stepId, workflowId]);

    if (stepResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Workflow step not found'
      });
    }

    const step = stepResult.rows[0];

    // Check if user is authorized to approve this step
    const isAuthorized = step.approver_user_id === req.user.user_id || 
                        req.user.roles.includes(step.approver_role) ||
                        req.user.permissions.includes('workflow.admin');

    if (!isAuthorized) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this step'
      });
    }

    // Check if step is already processed
    if (step.status !== 'Pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Step has already been processed'
      });
    }

    // Update step status
    const newStatus = action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Skipped';
    
    const updateStepQuery = `
      UPDATE document_approval_steps 
      SET status = $1, approved_at = CURRENT_TIMESTAMP, comments = $2
      WHERE step_id = $3
    `;

    await client.query(updateStepQuery, [newStatus, comments, stepId]);

    // Check if workflow is complete
    const workflowStepsQuery = `
      SELECT 
        COUNT(*) as total_steps,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_steps,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_steps,
        COUNT(CASE WHEN approval_type = 'Required' AND status = 'Pending' THEN 1 END) as pending_required_steps
      FROM document_approval_steps
      WHERE workflow_id = $1
    `;

    const workflowStepsResult = await client.query(workflowStepsQuery, [workflowId]);
    const stepStats = workflowStepsResult.rows[0];

    let workflowStatus = 'In Progress';
    let documentStatus = 'Under Review';

    if (action === 'reject') {
      // If any required step is rejected, workflow is rejected
      workflowStatus = 'Rejected';
      documentStatus = 'Draft';
    } else if (stepStats.pending_required_steps === '0') {
      // All required steps are complete
      workflowStatus = 'Approved';
      documentStatus = 'Approved';
    }

    // Update workflow status
    const updateWorkflowQuery = `
      UPDATE document_approval_workflows 
      SET status = $1, completed_at = CASE WHEN $1 IN ('Approved', 'Rejected') THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE workflow_id = $2
    `;

    await client.query(updateWorkflowQuery, [workflowStatus, workflowId]);

    // Update document status
    await client.query('UPDATE documents SET status = $1 WHERE document_id = $2', [documentStatus, step.document_id]);

    await client.query('COMMIT');

    await logDocumentActivity(
      step.document_id, 
      step.version_id, 
      `workflow.${action}`, 
      `Workflow step ${action}ed: ${step.step_name}`, 
      req.user.user_id, 
      req.ip, 
      req.get('User-Agent'),
      { 
        workflow_id: workflowId, 
        step_id: stepId, 
        step_name: step.step_name,
        workflow_status: workflowStatus,
        comments 
      }
    );

    res.json({
      success: true,
      message: `Step ${action}ed successfully`,
      data: {
        step_status: newStatus,
        workflow_status: workflowStatus,
        document_status: documentStatus
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing approval:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process approval',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// DELETE /api/document-workflows/:id - Cancel workflow
router.delete('/:id', authenticateToken, requirePermission('workflow.admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    // Get workflow details
    const workflowQuery = `
      SELECT daw.*, d.title as document_title
      FROM document_approval_workflows daw
      LEFT JOIN documents d ON daw.document_id = d.document_id
      WHERE daw.workflow_id = $1
    `;

    const workflowResult = await client.query(workflowQuery, [id]);

    if (workflowResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    const workflow = workflowResult.rows[0];

    // Check if workflow can be cancelled
    if (workflow.status === 'Approved' || workflow.status === 'Rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed workflow'
      });
    }

    await client.query('BEGIN');

    // Update workflow status
    await client.query('UPDATE document_approval_workflows SET status = $1 WHERE workflow_id = $2', ['Cancelled', id]);

    // Update document status back to Draft
    await client.query('UPDATE documents SET status = $1 WHERE document_id = $2', ['Draft', workflow.document_id]);

    await client.query('COMMIT');

    await logDocumentActivity(
      workflow.document_id, 
      workflow.version_id, 
      'workflow.cancel', 
      'Approval workflow cancelled', 
      req.user.user_id, 
      req.ip, 
      req.get('User-Agent'),
      { workflow_id: id }
    );

    res.json({
      success: true,
      message: 'Workflow cancelled successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel workflow',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// GET /api/document-workflows/my-tasks - Get tasks assigned to current user
router.get('/my-tasks', authenticateToken, requirePermission('workflow.approve'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const tasksQuery = `
      SELECT 
        das.*,
        daw.document_id,
        daw.version_id,
        daw.workflow_type,
        daw.priority as workflow_priority,
        daw.due_date as workflow_due_date,
        d.title as document_title,
        d.document_type,
        dv.version_number,
        dv.change_summary,
        u.username as initiated_by_username,
        u.first_name as initiated_by_first_name,
        u.last_name as initiated_by_last_name
      FROM document_approval_steps das
      LEFT JOIN document_approval_workflows daw ON das.workflow_id = daw.workflow_id
      LEFT JOIN documents d ON daw.document_id = d.document_id
      LEFT JOIN document_versions dv ON daw.version_id = dv.version_id
      LEFT JOIN users u ON daw.initiated_by = u.user_id
      WHERE das.status = 'Pending' 
      AND (das.approver_user_id = $1 OR das.approver_role = ANY($2))
      AND daw.status IN ('Pending', 'In Progress')
      ORDER BY 
        CASE daw.priority 
          WHEN 'Critical' THEN 1 
          WHEN 'High' THEN 2 
          WHEN 'Medium' THEN 3 
          WHEN 'Low' THEN 4 
        END,
        das.due_date ASC NULLS LAST,
        daw.initiated_at ASC
    `;

    const tasksResult = await client.query(tasksQuery, [req.user.user_id, req.user.roles]);

    res.json({
      success: true,
      data: tasksResult.rows
    });

  } catch (error) {
    console.error('Error getting user tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user tasks',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;