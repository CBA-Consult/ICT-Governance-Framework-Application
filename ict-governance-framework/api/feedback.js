require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requirePermissions } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/feedback');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xlsx|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and spreadsheets are allowed.'));
    }
  }
});

// POST /api/feedback/submit - Submit new feedback
router.post('/submit', requirePermissions('feedback.create'), upload.array('attachments', 5), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      category,
      priority,
      subject,
      description,
      contactInfo,
      anonymous
    } = req.body;

    // Validate required fields
    if (!category || !priority || !subject || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields: category, priority, subject, description' 
      });
    }

    // Generate feedback ID
    const feedbackId = `FB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Prepare attachment information
    const attachments = req.files ? req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    // Insert feedback record
    const feedbackQuery = `
      INSERT INTO feedback_submissions (
        feedback_id, category, priority, subject, description, 
        contact_info, anonymous, attachments, status, submitted_date,
        acknowledgment_sent, first_response_date, resolution_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const feedbackValues = [
      feedbackId,
      category,
      priority,
      subject,
      description,
      anonymous === 'true' ? null : contactInfo,
      anonymous === 'true',
      JSON.stringify(attachments),
      'Open',
      new Date(),
      false,
      null,
      null
    ];

    const feedbackResult = await client.query(feedbackQuery, feedbackValues);
    
    // Create initial activity log entry
    const activityQuery = `
      INSERT INTO feedback_activity_log (
        feedback_id, activity_type, description, created_by, created_date
      ) VALUES ($1, $2, $3, $4, $5)
    `;
    
    const activityValues = [
      feedbackId,
      'Submitted',
      `Feedback submitted with priority: ${priority}`,
      anonymous === 'true' ? 'Anonymous' : contactInfo,
      new Date()
    ];

    await client.query(activityQuery, activityValues);

    // Check if immediate escalation is needed based on priority
    if (priority === 'Critical') {
      await createEscalation(client, feedbackResult.rows[0], 'Critical priority feedback requires immediate attention');
    }

    await client.query('COMMIT');

    // Send acknowledgment (if not anonymous)
    if (anonymous !== 'true' && contactInfo) {
      await sendAcknowledgment(feedbackId, contactInfo, priority);
    }

    res.json({
      success: true,
      feedbackId: feedbackId,
      message: 'Feedback submitted successfully',
      expectedResponse: getExpectedResponseTime(priority)
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Feedback submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit feedback', 
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// GET /api/feedback/list - Get feedback items (with optional filters)
router.get('/list', requirePermissions('feedback.read'), async (req, res) => {
  try {
    const { status, priority, category, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        feedback_id, category, priority, subject, description,
        contact_info, anonymous, status, submitted_date,
        acknowledgment_sent, first_response_date, resolution_date,
        assigned_to, escalation_level
      FROM feedback_submissions
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(status);
    }

    if (priority) {
      paramCount++;
      query += ` AND priority = $${paramCount}`;
      values.push(priority);
    }

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      values.push(category);
    }

    query += ` ORDER BY submitted_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (error) {
    console.error('Feedback list error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve feedback items', 
      details: error.message 
    });
  }
});

// GET /api/feedback/:id - Get specific feedback item
router.get('/:id', requirePermissions('feedback.read'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedbackQuery = `
      SELECT * FROM feedback_submissions WHERE feedback_id = $1
    `;
    
    const activityQuery = `
      SELECT * FROM feedback_activity_log 
      WHERE feedback_id = $1 
      ORDER BY created_date DESC
    `;

    const [feedbackResult, activityResult] = await Promise.all([
      pool.query(feedbackQuery, [id]),
      pool.query(activityQuery, [id])
    ]);

    if (feedbackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    const feedback = feedbackResult.rows[0];
    feedback.activities = activityResult.rows;

    res.json(feedback);

  } catch (error) {
    console.error('Feedback retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve feedback', 
      details: error.message 
    });
  }
});

// POST /api/feedback/:id/response - Add response to feedback
router.post('/:id/response', requirePermissions('feedback.manage'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { response, respondedBy, status } = req.body;

    if (!response || !respondedBy) {
      return res.status(400).json({ 
        error: 'Missing required fields: response, respondedBy' 
      });
    }

    // Update feedback with response
    const updateQuery = `
      UPDATE feedback_submissions 
      SET 
        first_response_date = COALESCE(first_response_date, NOW()),
        status = COALESCE($3, status),
        last_updated = NOW()
      WHERE feedback_id = $1
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [id, response, status]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Add activity log entry
    const activityQuery = `
      INSERT INTO feedback_activity_log (
        feedback_id, activity_type, description, created_by, created_date
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    await client.query(activityQuery, [
      id,
      'Response',
      response,
      respondedBy,
      new Date()
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Response added successfully',
      feedback: updateResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Response submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit response', 
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Helper function to create escalation
async function createEscalation(client, feedbackItem, reason) {
  const escalationId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  // Determine escalation target based on priority and category
  const escalationTarget = getEscalationTarget(feedbackItem.priority, feedbackItem.category);
  
  const escalationQuery = `
    INSERT INTO escalations (
      escalation_id, feedback_id, escalation_level, escalated_to, 
      escalated_to_role, escalation_reason, escalation_date, 
      status, priority, category
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `;

  await client.query(escalationQuery, [
    escalationId,
    feedbackItem.feedback_id,
    1,
    escalationTarget.assignee,
    escalationTarget.role,
    reason,
    new Date(),
    'Open',
    feedbackItem.priority,
    feedbackItem.category
  ]);

  // Update feedback with escalation info
  await client.query(
    'UPDATE feedback_submissions SET escalation_level = 1, assigned_to = $2 WHERE feedback_id = $1',
    [feedbackItem.feedback_id, escalationTarget.assignee]
  );

  return escalationId;
}

// Helper function to get escalation target
function getEscalationTarget(priority, category) {
  // This would typically come from the escalation configuration
  const escalationMatrix = {
    'Critical': { role: 'Domain Owner', assignee: 'domain-owner@company.com' },
    'High': { role: 'Technology Steward', assignee: 'steward@company.com' },
    'Medium': { role: 'Technology Custodian', assignee: 'custodian@company.com' },
    'Low': { role: 'Technology Custodian', assignee: 'custodian@company.com' }
  };

  return escalationMatrix[priority] || escalationMatrix['Medium'];
}

// Helper function to get expected response time
function getExpectedResponseTime(priority) {
  const responseTimes = {
    'Critical': 'Response within 2 hours',
    'High': 'Response within 8 hours',
    'Medium': 'Response within 24 hours',
    'Low': 'Response within 72 hours'
  };

  return responseTimes[priority] || responseTimes['Medium'];
}

// Helper function to send acknowledgment
async function sendAcknowledgment(feedbackId, contactInfo, priority) {
  // This would integrate with email service
  console.log(`Sending acknowledgment for ${feedbackId} to ${contactInfo} (Priority: ${priority})`);
  
  // Update acknowledgment status
  try {
    await pool.query(
      'UPDATE feedback_submissions SET acknowledgment_sent = true WHERE feedback_id = $1',
      [feedbackId]
    );
  } catch (error) {
    console.error('Failed to update acknowledgment status:', error);
  }
}

module.exports = router;