/**
 * Master Data Management API
 * RESTful endpoints for master data management operations
 */

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authenticateToken, requirePermission, logActivity } = require('./auth');
const MasterDataManagementService = require('../services/master-data-management-service');

const router = express.Router();
const mdmService = new MasterDataManagementService();

// Initialize the service
mdmService.initialize().catch(console.error);

/**
 * @route GET /api/master-data-management/entities
 * @desc Get master data entities
 * @access Private
 */
router.get('/entities',
  authenticateToken,
  requirePermission('master_data_read'),
  [
    query('entity_type').optional().isString(),
    query('is_active').optional().isBoolean(),
    query('steward_user_id').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const filters = {
        entity_type: req.query.entity_type,
        is_active: req.query.is_active,
        steward_user_id: req.query.steward_user_id
      };

      const entities = await mdmService.getMasterDataEntities(filters);

      await logActivity(req.user.user_id, 'master_data_entities_viewed', 'master_data_entities', null, {
        filters,
        count: entities.length
      });

      res.json({
        success: true,
        data: entities,
        count: entities.length
      });
    } catch (error) {
      console.error('Error fetching master data entities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch master data entities',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/master-data-management/entities
 * @desc Create a new master data entity
 * @access Private
 */
router.post('/entities',
  authenticateToken,
  requirePermission('master_data_write'),
  [
    body('entity_name').notEmpty().isString().withMessage('Entity name is required'),
    body('entity_type').isIn(['customer', 'product', 'employee', 'vendor', 'location', 'application']).withMessage('Invalid entity type'),
    body('entity_schema').isObject().withMessage('Entity schema must be an object'),
    body('business_rules').optional().isObject(),
    body('data_quality_rules').optional().isObject(),
    body('steward_user_id').optional().isString(),
    body('approval_workflow_id').optional().isUUID(),
    body('description').optional().isString(),
    body('metadata').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const entityConfig = {
        ...req.body,
        created_by: req.user.user_id
      };

      const newEntity = await mdmService.createMasterDataEntity(entityConfig);

      await logActivity(req.user.user_id, 'master_data_entity_created', 'master_data_entities', newEntity.entity_id, {
        entity_name: newEntity.entity_name,
        entity_type: newEntity.entity_type
      });

      res.status(201).json({
        success: true,
        message: 'Master data entity created successfully',
        data: newEntity
      });
    } catch (error) {
      console.error('Error creating master data entity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create master data entity',
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/master-data-management/entities/:entityId
 * @desc Update a master data entity
 * @access Private
 */
router.put('/entities/:entityId',
  authenticateToken,
  requirePermission('master_data_write'),
  [
    body('entity_name').optional().isString(),
    body('entity_type').optional().isIn(['customer', 'product', 'employee', 'vendor', 'location', 'application']),
    body('entity_schema').optional().isObject(),
    body('business_rules').optional().isObject(),
    body('data_quality_rules').optional().isObject(),
    body('steward_user_id').optional().isString(),
    body('approval_workflow_id').optional().isUUID(),
    body('is_active').optional().isBoolean(),
    body('description').optional().isString(),
    body('metadata').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { entityId } = req.params;
      const updates = req.body;

      const updatedEntity = await mdmService.updateMasterDataEntity(entityId, updates);

      if (!updatedEntity) {
        return res.status(404).json({
          success: false,
          message: 'Master data entity not found'
        });
      }

      await logActivity(req.user.user_id, 'master_data_entity_updated', 'master_data_entities', entityId, {
        updates: Object.keys(updates)
      });

      res.json({
        success: true,
        message: 'Master data entity updated successfully',
        data: updatedEntity
      });
    } catch (error) {
      console.error('Error updating master data entity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update master data entity',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/master-data-management/entities/:entityId/records
 * @desc Get master data records for an entity
 * @access Private
 */
router.get('/entities/:entityId/records',
  authenticateToken,
  requirePermission('master_data_read'),
  [
    query('status').optional().isString(),
    query('source_system').optional().isString(),
    query('min_quality_score').optional().isFloat({ min: 0, max: 1 }),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { entityId } = req.params;
      const filters = {
        status: req.query.status,
        source_system: req.query.source_system,
        min_quality_score: req.query.min_quality_score,
        search: req.query.search
      };
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await mdmService.getMasterDataRecords(entityId, filters, pagination);

      await logActivity(req.user.user_id, 'master_data_records_viewed', 'master_data_records', entityId, {
        filters,
        pagination,
        count: result.records.length
      });

      res.json({
        success: true,
        data: result.records,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching master data records:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch master data records',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/master-data-management/entities/:entityId/records
 * @desc Create or update a master data record
 * @access Private
 */
router.post('/entities/:entityId/records',
  authenticateToken,
  requirePermission('master_data_write'),
  [
    body('master_id').notEmpty().isString().withMessage('Master ID is required'),
    body('record_data').isObject().withMessage('Record data must be an object'),
    body('source_system').optional().isString(),
    body('metadata').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { entityId } = req.params;
      const { master_id, record_data, source_system, metadata } = req.body;

      const options = {
        master_id,
        source_system,
        created_by: req.user.user_id,
        updated_by: req.user.user_id,
        metadata
      };

      const record = await mdmService.upsertMasterDataRecord(entityId, record_data, options);

      await logActivity(req.user.user_id, 'master_data_record_upserted', 'master_data_records', record.record_id, {
        entity_id: entityId,
        master_id,
        data_quality_score: record.data_quality_score
      });

      res.status(201).json({
        success: true,
        message: 'Master data record saved successfully',
        data: record
      });
    } catch (error) {
      console.error('Error saving master data record:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save master data record',
        error: error.message
      });
    }
  }
);

/**
 * @route DELETE /api/master-data-management/entities/:entityId/records/:masterId
 * @desc Delete a master data record
 * @access Private
 */
router.delete('/entities/:entityId/records/:masterId',
  authenticateToken,
  requirePermission('master_data_delete'),
  async (req, res) => {
    try {
      const { entityId, masterId } = req.params;

      const deleted = await mdmService.deleteMasterDataRecord(entityId, masterId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Master data record not found'
        });
      }

      await logActivity(req.user.user_id, 'master_data_record_deleted', 'master_data_records', null, {
        entity_id: entityId,
        master_id: masterId,
        deleted_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Master data record deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting master data record:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete master data record',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/master-data-management/quality-issues
 * @desc Get data quality issues
 * @access Private
 */
router.get('/quality-issues',
  authenticateToken,
  requirePermission('data_quality_read'),
  [
    query('entity_id').optional().isUUID(),
    query('issue_type').optional().isString(),
    query('severity').optional().isIn(['critical', 'high', 'medium', 'low']),
    query('status').optional().isIn(['open', 'in_progress', 'resolved', 'false_positive']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const filters = {
        entity_id: req.query.entity_id,
        issue_type: req.query.issue_type,
        severity: req.query.severity,
        status: req.query.status
      };
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await mdmService.getDataQualityIssues(filters, pagination);

      await logActivity(req.user.user_id, 'data_quality_issues_viewed', 'data_quality_issues', null, {
        filters,
        count: result.issues.length
      });

      res.json({
        success: true,
        data: result.issues,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching data quality issues:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch data quality issues',
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/master-data-management/quality-issues/:issueId/resolve
 * @desc Resolve a data quality issue
 * @access Private
 */
router.put('/quality-issues/:issueId/resolve',
  authenticateToken,
  requirePermission('data_quality_write'),
  [
    body('status').isIn(['resolved', 'false_positive']).withMessage('Invalid status'),
    body('resolution_notes').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { issueId } = req.params;
      const resolution = {
        ...req.body,
        resolved_by: req.user.user_id
      };

      const resolvedIssue = await mdmService.resolveDataQualityIssue(issueId, resolution);

      if (!resolvedIssue) {
        return res.status(404).json({
          success: false,
          message: 'Data quality issue not found'
        });
      }

      await logActivity(req.user.user_id, 'data_quality_issue_resolved', 'data_quality_issues', issueId, {
        status: resolution.status,
        resolved_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Data quality issue resolved successfully',
        data: resolvedIssue
      });
    } catch (error) {
      console.error('Error resolving data quality issue:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve data quality issue',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/master-data-management/lineage/:entityName
 * @desc Get data lineage for an entity
 * @access Private
 */
router.get('/lineage/:entityName',
  authenticateToken,
  requirePermission('data_lineage_read'),
  [
    query('field_name').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { entityName } = req.params;
      const { field_name } = req.query;

      const lineage = await mdmService.getDataLineage(entityName, field_name);

      await logActivity(req.user.user_id, 'data_lineage_viewed', 'data_lineage', null, {
        entity_name: entityName,
        field_name,
        lineage_count: lineage.length
      });

      res.json({
        success: true,
        data: lineage,
        count: lineage.length
      });
    } catch (error) {
      console.error('Error fetching data lineage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch data lineage',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/master-data-management/lineage
 * @desc Create a data lineage record
 * @access Private
 */
router.post('/lineage',
  authenticateToken,
  requirePermission('data_lineage_write'),
  [
    body('source_entity').notEmpty().isString().withMessage('Source entity is required'),
    body('target_entity').notEmpty().isString().withMessage('Target entity is required'),
    body('source_field').optional().isString(),
    body('target_field').optional().isString(),
    body('transformation_type').optional().isIn(['direct_copy', 'calculated', 'aggregated', 'enriched', 'filtered']),
    body('transformation_rule_id').optional().isUUID(),
    body('sync_job_id').optional().isUUID(),
    body('metadata').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const lineageData = req.body;

      const lineage = await mdmService.createDataLineage(lineageData);

      await logActivity(req.user.user_id, 'data_lineage_created', 'data_lineage', lineage.lineage_id, {
        source_entity: lineage.source_entity,
        target_entity: lineage.target_entity,
        transformation_type: lineage.transformation_type
      });

      res.status(201).json({
        success: true,
        message: 'Data lineage record created successfully',
        data: lineage
      });
    } catch (error) {
      console.error('Error creating data lineage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create data lineage',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/master-data-management/quality-metrics
 * @desc Get data quality metrics
 * @access Private
 */
router.get('/quality-metrics',
  authenticateToken,
  requirePermission('data_quality_read'),
  [
    query('entity_id').optional().isUUID()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { entity_id } = req.query;

      const metrics = await mdmService.getDataQualityMetrics(entity_id);

      await logActivity(req.user.user_id, 'data_quality_metrics_viewed', 'data_quality_metrics', entity_id, {
        entity_id,
        total_records: metrics.totalRecords,
        average_quality_score: metrics.averageQualityScore
      });

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error fetching data quality metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch data quality metrics',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/master-data-management/dashboard
 * @desc Get master data management dashboard
 * @access Private
 */
router.get('/dashboard',
  authenticateToken,
  requirePermission('master_data_read'),
  async (req, res) => {
    try {
      const entities = await mdmService.getMasterDataEntities({ is_active: true });
      const qualityMetrics = await mdmService.getDataQualityMetrics();
      const qualityIssues = await mdmService.getDataQualityIssues({ status: 'open' }, { limit: 10 });

      const dashboardData = {
        totalEntities: entities.length,
        entitiesByType: entities.reduce((acc, entity) => {
          acc[entity.entity_type] = (acc[entity.entity_type] || 0) + 1;
          return acc;
        }, {}),
        qualityMetrics,
        recentQualityIssues: qualityIssues.issues,
        entitySummary: entities.map(entity => ({
          entity_id: entity.entity_id,
          entity_name: entity.entity_name,
          entity_type: entity.entity_type,
          steward_user_id: entity.steward_user_id,
          created_at: entity.created_at
        }))
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Error fetching MDM dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch MDM dashboard',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/master-data-management/validate-record
 * @desc Validate a record against entity schema
 * @access Private
 */
router.post('/validate-record',
  authenticateToken,
  requirePermission('master_data_read'),
  [
    body('entity_id').isUUID().withMessage('Valid entity ID is required'),
    body('record_data').isObject().withMessage('Record data must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { entity_id, record_data } = req.body;

      const validationResult = await mdmService.validateRecord(entity_id, record_data);

      await logActivity(req.user.user_id, 'record_validation_performed', 'record_validation', entity_id, {
        is_valid: validationResult.isValid,
        error_count: validationResult.errors.length
      });

      res.json({
        success: true,
        data: validationResult
      });
    } catch (error) {
      console.error('Error validating record:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate record',
        error: error.message
      });
    }
  }
);

module.exports = router;