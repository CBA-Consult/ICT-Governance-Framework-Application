/**
 * Data Synchronization API
 * RESTful endpoints for data synchronization operations
 */

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authenticateToken, requirePermission, logActivity } = require('./auth');
const DataSynchronizationService = require('../services/data-synchronization-service');

const router = express.Router();
const syncService = new DataSynchronizationService();

// Initialize the service
syncService.initialize().catch(console.error);

/**
 * @route GET /api/data-synchronization/sources
 * @desc Get all data sources
 * @access Private
 */
router.get('/sources', 
  authenticateToken,
  requirePermission('data_sync_read'),
  [
    query('source_type').optional().isString(),
    query('sync_status').optional().isString(),
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
        source_type: req.query.source_type,
        sync_status: req.query.sync_status
      };

      const sources = await syncService.getDataSources(filters);

      await logActivity(req.user.user_id, 'data_sync_sources_viewed', 'data_sources', null, {
        filters,
        count: sources.length
      });

      res.json({
        success: true,
        data: sources,
        count: sources.length
      });
    } catch (error) {
      console.error('Error fetching data sources:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch data sources',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/data-synchronization/sources
 * @desc Register a new data source
 * @access Private
 */
router.post('/sources',
  authenticateToken,
  requirePermission('data_sync_write'),
  [
    body('source_name').notEmpty().isString().withMessage('Source name is required'),
    body('source_type').isIn(['database', 'api', 'file', 'stream', 'cloud_service']).withMessage('Invalid source type'),
    body('connection_config').isObject().withMessage('Connection config must be an object'),
    body('data_format').isIn(['json', 'xml', 'csv', 'sql', 'avro', 'parquet']).withMessage('Invalid data format'),
    body('sync_frequency').optional().isIn(['real-time', 'hourly', 'daily', 'weekly', 'manual']),
    body('is_master_source').optional().isBoolean(),
    body('priority_level').optional().isInt({ min: 1, max: 10 }),
    body('metadata').optional().isObject(),
    body('tags').optional().isArray()
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

      const sourceConfig = {
        ...req.body,
        created_by: req.user.user_id
      };

      const newSource = await syncService.registerDataSource(sourceConfig);

      await logActivity(req.user.user_id, 'data_source_registered', 'data_sources', newSource.source_id, {
        source_name: newSource.source_name,
        source_type: newSource.source_type
      });

      res.status(201).json({
        success: true,
        message: 'Data source registered successfully',
        data: newSource
      });
    } catch (error) {
      console.error('Error registering data source:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register data source',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/data-synchronization/jobs
 * @desc Get synchronization jobs
 * @access Private
 */
router.get('/jobs',
  authenticateToken,
  requirePermission('data_sync_read'),
  [
    query('status').optional().isString(),
    query('source_id').optional().isUUID(),
    query('target_id').optional().isUUID(),
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

      // This would typically query the database for sync jobs
      // For now, returning a placeholder response
      const jobs = [];

      res.json({
        success: true,
        data: jobs,
        count: jobs.length
      });
    } catch (error) {
      console.error('Error fetching sync jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sync jobs',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/data-synchronization/jobs
 * @desc Create a new synchronization job
 * @access Private
 */
router.post('/jobs',
  authenticateToken,
  requirePermission('data_sync_write'),
  [
    body('job_name').notEmpty().isString().withMessage('Job name is required'),
    body('source_id').isUUID().withMessage('Valid source ID is required'),
    body('target_id').isUUID().withMessage('Valid target ID is required'),
    body('sync_type').isIn(['full', 'incremental', 'delta', 'real-time']).withMessage('Invalid sync type'),
    body('sync_direction').isIn(['source_to_target', 'target_to_source', 'bidirectional']).withMessage('Invalid sync direction'),
    body('sync_schedule').optional().isString(),
    body('transformation_rules').optional().isObject(),
    body('conflict_resolution_strategy').optional().isIn(['source_wins', 'target_wins', 'merge', 'manual']),
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

      const jobConfig = {
        ...req.body,
        created_by: req.user.user_id
      };

      const newJob = await syncService.createSyncJob(jobConfig);

      await logActivity(req.user.user_id, 'sync_job_created', 'sync_jobs', newJob.job_id, {
        job_name: newJob.job_name,
        sync_type: newJob.sync_type
      });

      res.status(201).json({
        success: true,
        message: 'Synchronization job created successfully',
        data: newJob
      });
    } catch (error) {
      console.error('Error creating sync job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create sync job',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/data-synchronization/jobs/:jobId/execute
 * @desc Execute a synchronization job
 * @access Private
 */
router.post('/jobs/:jobId/execute',
  authenticateToken,
  requirePermission('data_sync_execute'),
  [
    body('options').optional().isObject()
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

      const { jobId } = req.params;
      const options = req.body.options || {};

      const result = await syncService.executeSyncJob(jobId, options);

      await logActivity(req.user.user_id, 'sync_job_executed', 'sync_jobs', jobId, {
        execution_id: result.executionId,
        records_processed: result.recordsProcessed,
        records_successful: result.recordsSuccessful,
        records_failed: result.recordsFailed
      });

      res.json({
        success: true,
        message: 'Synchronization job executed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error executing sync job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute sync job',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/data-synchronization/jobs/:jobId/status
 * @desc Get synchronization job status
 * @access Private
 */
router.get('/jobs/:jobId/status',
  authenticateToken,
  requirePermission('data_sync_read'),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const status = await syncService.getSyncStatus(jobId);

      if (!status) {
        return res.status(404).json({
          success: false,
          message: 'Sync job not found'
        });
      }

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error fetching sync job status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sync job status',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/data-synchronization/jobs/:jobId/history
 * @desc Get synchronization job history
 * @access Private
 */
router.get('/jobs/:jobId/history',
  authenticateToken,
  requirePermission('data_sync_read'),
  [
    query('limit').optional().isInt({ min: 1, max: 1000 })
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

      const { jobId } = req.params;
      const limit = parseInt(req.query.limit) || 100;

      const history = await syncService.getSyncHistory(jobId, limit);

      res.json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error) {
      console.error('Error fetching sync job history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sync job history',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/data-synchronization/jobs/:jobId/cancel
 * @desc Cancel a running synchronization job
 * @access Private
 */
router.post('/jobs/:jobId/cancel',
  authenticateToken,
  requirePermission('data_sync_execute'),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const cancelled = await syncService.cancelSyncJob(jobId);

      if (!cancelled) {
        return res.status(404).json({
          success: false,
          message: 'Sync job not found or not running'
        });
      }

      await logActivity(req.user.user_id, 'sync_job_cancelled', 'sync_jobs', jobId, {
        cancelled_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Synchronization job cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling sync job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel sync job',
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/data-synchronization/sources/:sourceId/status
 * @desc Update data source status
 * @access Private
 */
router.put('/sources/:sourceId/status',
  authenticateToken,
  requirePermission('data_sync_write'),
  [
    body('status').isIn(['active', 'inactive', 'error', 'syncing']).withMessage('Invalid status'),
    body('error_message').optional().isString()
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

      const { sourceId } = req.params;
      const { status, error_message } = req.body;

      const updatedSource = await syncService.updateDataSourceStatus(sourceId, status, error_message);

      if (!updatedSource) {
        return res.status(404).json({
          success: false,
          message: 'Data source not found'
        });
      }

      await logActivity(req.user.user_id, 'data_source_status_updated', 'data_sources', sourceId, {
        new_status: status,
        error_message
      });

      res.json({
        success: true,
        message: 'Data source status updated successfully',
        data: updatedSource
      });
    } catch (error) {
      console.error('Error updating data source status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update data source status',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/data-synchronization/cleanup
 * @desc Cleanup old sync history records
 * @access Private
 */
router.post('/cleanup',
  authenticateToken,
  requirePermission('data_sync_admin'),
  [
    body('retention_days').optional().isInt({ min: 1, max: 365 })
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

      const retentionDays = req.body.retention_days || 30;

      const deletedCount = await syncService.cleanupSyncHistory(retentionDays);

      await logActivity(req.user.user_id, 'sync_history_cleanup', 'sync_history', null, {
        retention_days: retentionDays,
        deleted_count: deletedCount
      });

      res.json({
        success: true,
        message: 'Sync history cleanup completed successfully',
        data: {
          deleted_count: deletedCount,
          retention_days: retentionDays
        }
      });
    } catch (error) {
      console.error('Error cleaning up sync history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup sync history',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/data-synchronization/dashboard
 * @desc Get synchronization dashboard data
 * @access Private
 */
router.get('/dashboard',
  authenticateToken,
  requirePermission('data_sync_read'),
  async (req, res) => {
    try {
      // This would typically aggregate data from various sync operations
      // For now, returning a placeholder dashboard
      const dashboardData = {
        totalSources: 0,
        activeSources: 0,
        totalJobs: 0,
        runningJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        recentActivity: [],
        syncMetrics: {
          totalRecordsProcessed: 0,
          successRate: 0,
          averageExecutionTime: 0
        }
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Error fetching sync dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sync dashboard',
        error: error.message
      });
    }
  }
);

module.exports = router;