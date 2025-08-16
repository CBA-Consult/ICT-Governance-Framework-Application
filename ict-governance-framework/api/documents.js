// File: ict-governance-framework/api/documents.js
// Document and Policy Management API

const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, query } = require('express-validator');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const { authenticateToken, requirePermission, logActivity } = require('./auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md', '.html'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, MD, and HTML files are allowed.'));
    }
  }
});

// Validation middleware
const documentValidation = [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('category_id').notEmpty().withMessage('Category is required'),
  body('document_type').isIn(['Policy', 'Procedure', 'Standard', 'Guideline', 'Template', 'Form', 'Manual', 'Report']).withMessage('Invalid document type'),
  body('priority').optional().isIn(['Critical', 'High', 'Medium', 'Low']).withMessage('Invalid priority'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('compliance_frameworks').optional().isArray().withMessage('Compliance frameworks must be an array'),
  body('review_frequency_months').optional().isInt({ min: 1, max: 120 }).withMessage('Review frequency must be between 1 and 120 months'),
  body('effective_date').optional().isISO8601().withMessage('Invalid effective date'),
  body('expiry_date').optional().isISO8601().withMessage('Invalid expiry date')
];

const versionValidation = [
  body('content').notEmpty().withMessage('Content is required'),
  body('change_summary').trim().isLength({ min: 1, max: 500 }).withMessage('Change summary is required and must be less than 500 characters'),
  body('change_type').isIn(['Major', 'Minor', 'Patch', 'Emergency']).withMessage('Invalid change type'),
  body('content_type').optional().isIn(['markdown', 'html', 'text', 'pdf']).withMessage('Invalid content type')
];

// Helper functions
function generateDocumentId() {
  return `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function generateVersionId() {
  return `VER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function generateWorkflowId() {
  return `WF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function calculateNextVersion(currentVersion, changeType) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (changeType) {
    case 'Major':
      return `${major + 1}.0.0`;
    case 'Minor':
      return `${major}.${minor + 1}.0`;
    case 'Patch':
    case 'Emergency':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

async function logDocumentActivity(documentId, versionId, activityType, description, userId, ipAddress, userAgent, metadata = {}) {
  const activityId = `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const query = `
    INSERT INTO document_activity_log (activity_id, document_id, version_id, activity_type, description, user_id, ip_address, user_agent, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `;
  
  await pool.query(query, [activityId, documentId, versionId, activityType, description, userId, ipAddress, userAgent, JSON.stringify(metadata)]);
}

// GET /api/documents - List documents with filtering and pagination
router.get('/', authenticateToken, requirePermission('document.read'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().trim(),
  query('status').optional().isIn(['Draft', 'Under Review', 'Approved', 'Published', 'Archived', 'Deprecated']),
  query('document_type').optional().isIn(['Policy', 'Procedure', 'Standard', 'Guideline', 'Template', 'Form', 'Manual', 'Report']),
  query('search').optional().trim(),
  query('owner').optional().trim(),
  query('tags').optional().trim()
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
      category,
      status,
      document_type,
      search,
      owner,
      tags
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (category) {
      whereConditions.push(`d.category_id = $${paramIndex++}`);
      queryParams.push(category);
    }

    if (status) {
      whereConditions.push(`d.status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (document_type) {
      whereConditions.push(`d.document_type = $${paramIndex++}`);
      queryParams.push(document_type);
    }

    if (owner) {
      whereConditions.push(`d.owner_user_id = $${paramIndex++}`);
      queryParams.push(owner);
    }

    if (search) {
      whereConditions.push(`(d.title ILIKE $${paramIndex} OR d.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (tags) {
      whereConditions.push(`d.tags @> $${paramIndex++}`);
      queryParams.push(JSON.stringify([tags]));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get documents with current version info
    const documentsQuery = `
      SELECT 
        d.*,
        dc.name as category_name,
        dc.color as category_color,
        dc.icon as category_icon,
        u.username as owner_username,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        approver.username as approver_username,
        approver.first_name as approver_first_name,
        approver.last_name as approver_last_name,
        dv.version_number as current_version,
        dv.created_at as version_created_at,
        dv.created_by as version_created_by
      FROM documents d
      LEFT JOIN document_categories dc ON d.category_id = dc.category_id
      LEFT JOIN users u ON d.owner_user_id = u.user_id
      LEFT JOIN users approver ON d.approver_user_id = approver.user_id
      LEFT JOIN document_versions dv ON d.document_id = dv.document_id AND dv.is_current = true
      ${whereClause}
      ORDER BY d.updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const documentsResult = await client.query(documentsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM documents d
      LEFT JOIN document_categories dc ON d.category_id = dc.category_id
      ${whereClause}
    `;

    const countResult = await client.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    await logActivity(req.user.user_id, 'document.list', 'Listed documents', req.ip, req.get('User-Agent'), { 
      filters: { category, status, document_type, search, owner, tags },
      page,
      limit,
      total
    });

    res.json({
      success: true,
      data: {
        documents: documentsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list documents',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// GET /api/documents/categories - Get document categories
router.get('/categories', authenticateToken, requirePermission('document.read'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        category_id,
        name,
        description,
        color,
        icon,
        (SELECT COUNT(*) FROM documents WHERE category_id = dc.category_id) as document_count
      FROM document_categories dc
      ORDER BY name
    `;

    const result = await client.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error getting document categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get document categories',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// GET /api/documents/:id - Get specific document with versions
router.get('/:id', authenticateToken, requirePermission('document.read'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    // Get document details
    const documentQuery = `
      SELECT 
        d.*,
        dc.name as category_name,
        dc.color as category_color,
        dc.icon as category_icon,
        u.username as owner_username,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.email as owner_email,
        approver.username as approver_username,
        approver.first_name as approver_first_name,
        approver.last_name as approver_last_name,
        approver.email as approver_email
      FROM documents d
      LEFT JOIN document_categories dc ON d.category_id = dc.category_id
      LEFT JOIN users u ON d.owner_user_id = u.user_id
      LEFT JOIN users approver ON d.approver_user_id = approver.user_id
      WHERE d.document_id = $1
    `;

    const documentResult = await client.query(documentQuery, [id]);

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const document = documentResult.rows[0];

    // Get document versions
    const versionsQuery = `
      SELECT 
        dv.*,
        u.username as created_by_username,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name
      FROM document_versions dv
      LEFT JOIN users u ON dv.created_by = u.user_id
      WHERE dv.document_id = $1
      ORDER BY dv.major_version DESC, dv.minor_version DESC, dv.patch_version DESC
    `;

    const versionsResult = await client.query(versionsQuery, [id]);

    // Get current workflow if any
    const workflowQuery = `
      SELECT 
        daw.*,
        u.username as initiated_by_username,
        u.first_name as initiated_by_first_name,
        u.last_name as initiated_by_last_name
      FROM document_approval_workflows daw
      LEFT JOIN users u ON daw.initiated_by = u.user_id
      WHERE daw.document_id = $1 AND daw.status IN ('Pending', 'In Progress')
      ORDER BY daw.initiated_at DESC
      LIMIT 1
    `;

    const workflowResult = await client.query(workflowQuery, [id]);

    // Get document relationships
    const relationshipsQuery = `
      SELECT 
        dr.*,
        d.title as target_title,
        d.document_type as target_type,
        d.status as target_status
      FROM document_relationships dr
      LEFT JOIN documents d ON dr.target_document_id = d.document_id
      WHERE dr.source_document_id = $1
      ORDER BY dr.relationship_type, d.title
    `;

    const relationshipsResult = await client.query(relationshipsQuery, [id]);

    await logDocumentActivity(
      id, 
      null, 
      'document.view', 
      'Document viewed', 
      req.user.user_id, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json({
      success: true,
      data: {
        document,
        versions: versionsResult.rows,
        currentWorkflow: workflowResult.rows[0] || null,
        relationships: relationshipsResult.rows
      }
    });

  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get document',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// POST /api/documents - Create new document
router.post('/', authenticateToken, requirePermission('document.create'), documentValidation, async (req, res) => {
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
      title,
      description,
      category_id,
      document_type,
      priority = 'Medium',
      tags = [],
      metadata = {},
      compliance_frameworks = [],
      review_frequency_months = 12,
      effective_date,
      expiry_date,
      approver_user_id
    } = req.body;

    const documentId = generateDocumentId();
    const nextReviewDate = new Date();
    nextReviewDate.setMonth(nextReviewDate.getMonth() + review_frequency_months);

    // Create document
    const documentQuery = `
      INSERT INTO documents (
        document_id, title, description, category_id, document_type, status, priority,
        owner_user_id, approver_user_id, tags, metadata, compliance_frameworks,
        review_frequency_months, next_review_date, effective_date, expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const documentValues = [
      documentId, title, description, category_id, document_type, 'Draft', priority,
      req.user.user_id, approver_user_id, JSON.stringify(tags), JSON.stringify(metadata),
      JSON.stringify(compliance_frameworks), review_frequency_months, nextReviewDate,
      effective_date, expiry_date
    ];

    const documentResult = await client.query(documentQuery, documentValues);
    const document = documentResult.rows[0];

    await client.query('COMMIT');

    await logDocumentActivity(
      documentId, 
      null, 
      'document.create', 
      'Document created', 
      req.user.user_id, 
      req.ip, 
      req.get('User-Agent'),
      { title, document_type, category_id }
    );

    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      data: document
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create document',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// POST /api/documents/:id/versions - Create new version
router.post('/:id/versions', authenticateToken, requirePermission('version.create'), upload.single('file'), versionValidation, async (req, res) => {
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

    const { id } = req.params;
    const {
      content,
      change_summary,
      change_type,
      content_type = 'markdown'
    } = req.body;

    // Check if document exists
    const documentCheck = await client.query('SELECT * FROM documents WHERE document_id = $1', [id]);
    if (documentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Get current version
    const currentVersionQuery = `
      SELECT version_number, major_version, minor_version, patch_version
      FROM document_versions 
      WHERE document_id = $1 AND is_current = true
    `;
    const currentVersionResult = await client.query(currentVersionQuery, [id]);
    
    let nextVersion = '1.0.0';
    if (currentVersionResult.rows.length > 0) {
      const current = currentVersionResult.rows[0];
      nextVersion = calculateNextVersion(current.version_number, change_type);
    }

    const [major, minor, patch] = nextVersion.split('.').map(Number);
    const versionId = generateVersionId();

    // Handle file upload
    let filePath = null;
    let fileSize = null;
    let fileHash = null;

    if (req.file) {
      filePath = req.file.path;
      fileSize = req.file.size;
      
      // Calculate file hash
      const fileBuffer = await fs.readFile(req.file.path);
      fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    // Mark current version as not current
    await client.query('UPDATE document_versions SET is_current = false WHERE document_id = $1', [id]);

    // Create new version
    const versionQuery = `
      INSERT INTO document_versions (
        version_id, document_id, version_number, major_version, minor_version, patch_version,
        content, content_type, file_path, file_size, file_hash, change_summary, change_type,
        created_by, is_current
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const versionValues = [
      versionId, id, nextVersion, major, minor, patch,
      content, content_type, filePath, fileSize, fileHash, change_summary, change_type,
      req.user.user_id, true
    ];

    const versionResult = await client.query(versionQuery, versionValues);
    const version = versionResult.rows[0];

    // Update document updated_at
    await client.query('UPDATE documents SET updated_at = CURRENT_TIMESTAMP WHERE document_id = $1', [id]);

    await client.query('COMMIT');

    await logDocumentActivity(
      id, 
      versionId, 
      'version.create', 
      `New version ${nextVersion} created: ${change_summary}`, 
      req.user.user_id, 
      req.ip, 
      req.get('User-Agent'),
      { version_number: nextVersion, change_type, file_uploaded: !!req.file }
    );

    res.status(201).json({
      success: true,
      message: 'Document version created successfully',
      data: version
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating document version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create document version',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// PUT /api/documents/:id - Update document
router.put('/:id', authenticateToken, requirePermission('document.edit'), documentValidation, async (req, res) => {
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

    const { id } = req.params;
    const {
      title,
      description,
      category_id,
      document_type,
      priority,
      tags,
      metadata,
      compliance_frameworks,
      review_frequency_months,
      effective_date,
      expiry_date,
      approver_user_id
    } = req.body;

    // Check if document exists and user has permission
    const documentCheck = await client.query(`
      SELECT * FROM documents 
      WHERE document_id = $1 AND (owner_user_id = $2 OR $3 = ANY(
        SELECT permission_id FROM user_permissions WHERE user_id = $2
      ))
    `, [id, req.user.user_id, 'document.admin']);

    if (documentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or insufficient permissions'
      });
    }

    const updateQuery = `
      UPDATE documents SET
        title = $1,
        description = $2,
        category_id = $3,
        document_type = $4,
        priority = $5,
        tags = $6,
        metadata = $7,
        compliance_frameworks = $8,
        review_frequency_months = $9,
        effective_date = $10,
        expiry_date = $11,
        approver_user_id = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE document_id = $13
      RETURNING *
    `;

    const updateValues = [
      title, description, category_id, document_type, priority,
      JSON.stringify(tags), JSON.stringify(metadata), JSON.stringify(compliance_frameworks),
      review_frequency_months, effective_date, expiry_date, approver_user_id, id
    ];

    const result = await client.query(updateQuery, updateValues);

    await logDocumentActivity(
      id, 
      null, 
      'document.update', 
      'Document updated', 
      req.user.user_id, 
      req.ip, 
      req.get('User-Agent'),
      { title, document_type, category_id }
    );

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// DELETE /api/documents/:id - Delete document
router.delete('/:id', authenticateToken, requirePermission('document.delete'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    // Check if document exists and user has permission
    const documentCheck = await client.query(`
      SELECT * FROM documents 
      WHERE document_id = $1 AND (owner_user_id = $2 OR $3 = ANY(
        SELECT permission_id FROM user_permissions WHERE user_id = $2
      ))
    `, [id, req.user.user_id, 'document.admin']);

    if (documentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or insufficient permissions'
      });
    }

    await client.query('BEGIN');

    // Get file paths to delete
    const filesQuery = 'SELECT file_path FROM document_versions WHERE document_id = $1 AND file_path IS NOT NULL';
    const filesResult = await client.query(filesQuery, [id]);

    // Delete related records
    await client.query('DELETE FROM document_comments WHERE document_id = $1', [id]);
    await client.query('DELETE FROM document_relationships WHERE source_document_id = $1 OR target_document_id = $1', [id]);
    await client.query('DELETE FROM document_activity_log WHERE document_id = $1', [id]);
    await client.query('DELETE FROM document_permissions WHERE document_id = $1', [id]);
    await client.query('DELETE FROM document_approval_steps WHERE workflow_id IN (SELECT workflow_id FROM document_approval_workflows WHERE document_id = $1)', [id]);
    await client.query('DELETE FROM document_approval_workflows WHERE document_id = $1', [id]);
    await client.query('DELETE FROM document_versions WHERE document_id = $1', [id]);
    await client.query('DELETE FROM documents WHERE document_id = $1', [id]);

    await client.query('COMMIT');

    // Delete physical files
    for (const file of filesResult.rows) {
      if (file.file_path) {
        try {
          await fs.unlink(file.file_path);
        } catch (error) {
          console.warn('Failed to delete file:', file.file_path, error.message);
        }
      }
    }

    await logDocumentActivity(
      id, 
      null, 
      'document.delete', 
      'Document deleted', 
      req.user.user_id, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;