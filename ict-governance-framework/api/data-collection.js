// File: ict-governance-framework/api/data-collection.js
// Data Collection API for Governance Metrics and Reporting

const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, query } = require('express-validator');
const { requirePermissions, authenticateToken, logActivity } = require('../middleware/auth');
const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Data source validation schemas
const dataSourceValidation = [
  body('source_name').notEmpty().withMessage('Source name is required'),
  body('source_type').isIn(['api', 'database', 'file', 'manual', 'automated']).withMessage('Invalid source type'),
  body('data_category').isIn(['governance', 'compliance', 'risk', 'performance', 'financial', 'operational']).withMessage('Invalid data category'),
  body('collection_frequency').isIn(['real-time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'annual']).withMessage('Invalid collection frequency'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean')
];

const metricDataValidation = [
  body('metric_name').notEmpty().withMessage('Metric name is required'),
  body('metric_category').isIn(['kpi', 'operational', 'compliance', 'risk', 'financial', 'performance']).withMessage('Invalid metric category'),
  body('value').isNumeric().withMessage('Value must be numeric'),
  body('unit').optional().isString().withMessage('Unit must be string'),
  body('target_value').optional().isNumeric().withMessage('Target value must be numeric'),
  body('data_source_id').notEmpty().withMessage('Data source ID is required'),
  body('collection_timestamp').optional().isISO8601().withMessage('Invalid timestamp format')
];

// Helper function to generate collection IDs
function generateCollectionId() {
  return `COL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function generateDataSourceId() {
  return `DS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Data source management endpoints

// GET /api/data-collection/sources - List all data sources
router.get('/sources', 
  authenticateToken, 
  requirePermissions('data_collection_read'),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, source_type, data_category, is_active } = req.query;
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (source_type) {
        paramCount++;
        whereConditions.push(`source_type = $${paramCount}`);
        queryParams.push(source_type);
      }

      if (data_category) {
        paramCount++;
        whereConditions.push(`data_category = $${paramCount}`);
        queryParams.push(data_category);
      }

      if (is_active !== undefined) {
        paramCount++;
        whereConditions.push(`is_active = $${paramCount}`);
        queryParams.push(is_active === 'true');
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const sourcesQuery = `
        SELECT 
          data_source_id,
          source_name,
          source_type,
          data_category,
          description,
          connection_config,
          collection_frequency,
          last_collection_time,
          next_collection_time,
          is_active,
          created_at,
          updated_at,
          (SELECT COUNT(*) FROM metric_data WHERE data_source_id = ds.data_source_id) as metric_count
        FROM data_sources ds
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      queryParams.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM data_sources ds
        ${whereClause}
      `;

      const [sourcesResult, countResult] = await Promise.all([
        pool.query(sourcesQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2))
      ]);

      const sources = sourcesResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      await logActivity(
        req.user.user_id,
        'data_collection_sources_list',
        'Data sources listed',
        req.ip,
        req.get('User-Agent'),
        { filters: { source_type, data_category, is_active }, total_results: total }
      );

      res.json({
        success: true,
        data: {
          sources,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: total,
            items_per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error listing data sources:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list data sources',
        error: error.message
      });
    }
  }
);

// POST /api/data-collection/sources - Create new data source
router.post('/sources',
  authenticateToken,
  requirePermissions('data_collection_write'),
  dataSourceValidation,
  async (req, res) => {
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
        source_name,
        source_type,
        data_category,
        description,
        connection_config,
        collection_frequency,
        is_active = true
      } = req.body;

      await client.query('BEGIN');

      const dataSourceId = generateDataSourceId();

      const insertQuery = `
        INSERT INTO data_sources (
          data_source_id, source_name, source_type, data_category, description,
          connection_config, collection_frequency, is_active, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        dataSourceId, source_name, source_type, data_category, description,
        JSON.stringify(connection_config), collection_frequency, is_active,
        req.user.user_id, req.user.user_id
      ];

      const result = await client.query(insertQuery, values);
      const newDataSource = result.rows[0];

      await client.query('COMMIT');

      await logActivity(
        req.user.user_id,
        'data_source_created',
        `Data source created: ${source_name}`,
        req.ip,
        req.get('User-Agent'),
        { data_source_id: dataSourceId, source_type, data_category }
      );

      res.status(201).json({
        success: true,
        message: 'Data source created successfully',
        data: { data_source: newDataSource }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating data source:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create data source',
        error: error.message
      });
    } finally {
      client.release();
    }
  }
);

// Metric data collection endpoints

// POST /api/data-collection/metrics - Collect metric data
router.post('/metrics',
  authenticateToken,
  requirePermissions('data_collection_write'),
  metricDataValidation,
  async (req, res) => {
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
        metric_name,
        metric_category,
        value,
        unit,
        target_value,
        data_source_id,
        collection_timestamp = new Date().toISOString(),
        metadata = {}
      } = req.body;

      await client.query('BEGIN');

      // Verify data source exists and is active
      const sourceCheck = await client.query(
        'SELECT data_source_id, is_active FROM data_sources WHERE data_source_id = $1',
        [data_source_id]
      );

      if (sourceCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data source not found'
        });
      }

      if (!sourceCheck.rows[0].is_active) {
        return res.status(400).json({
          success: false,
          message: 'Data source is not active'
        });
      }

      const collectionId = generateCollectionId();

      const insertQuery = `
        INSERT INTO metric_data (
          collection_id, metric_name, metric_category, value, unit, target_value,
          data_source_id, collection_timestamp, metadata, collected_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        collectionId, metric_name, metric_category, value, unit, target_value,
        data_source_id, collection_timestamp, JSON.stringify(metadata), req.user.user_id
      ];

      const result = await client.query(insertQuery, values);
      const newMetricData = result.rows[0];

      // Update data source last collection time
      await client.query(
        'UPDATE data_sources SET last_collection_time = $1, updated_at = CURRENT_TIMESTAMP WHERE data_source_id = $2',
        [collection_timestamp, data_source_id]
      );

      await client.query('COMMIT');

      await logActivity(
        req.user.user_id,
        'metric_data_collected',
        `Metric data collected: ${metric_name}`,
        req.ip,
        req.get('User-Agent'),
        { collection_id: collectionId, metric_category, value, data_source_id }
      );

      res.status(201).json({
        success: true,
        message: 'Metric data collected successfully',
        data: { metric_data: newMetricData }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error collecting metric data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to collect metric data',
        error: error.message
      });
    } finally {
      client.release();
    }
  }
);

// POST /api/data-collection/metrics/batch - Batch collect metric data
router.post('/metrics/batch',
  authenticateToken,
  requirePermissions('data_collection_write'),
  async (req, res) => {
    const client = await pool.connect();
    
    try {
      const { metrics, data_source_id } = req.body;

      if (!Array.isArray(metrics) || metrics.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Metrics array is required and cannot be empty'
        });
      }

      if (metrics.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Batch size cannot exceed 1000 metrics'
        });
      }

      await client.query('BEGIN');

      // Verify data source exists and is active
      const sourceCheck = await client.query(
        'SELECT data_source_id, is_active FROM data_sources WHERE data_source_id = $1',
        [data_source_id]
      );

      if (sourceCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data source not found'
        });
      }

      if (!sourceCheck.rows[0].is_active) {
        return res.status(400).json({
          success: false,
          message: 'Data source is not active'
        });
      }

      const insertedMetrics = [];
      const currentTimestamp = new Date().toISOString();

      for (const metric of metrics) {
        const {
          metric_name,
          metric_category,
          value,
          unit,
          target_value,
          collection_timestamp = currentTimestamp,
          metadata = {}
        } = metric;

        // Basic validation for each metric
        if (!metric_name || !metric_category || value === undefined) {
          continue; // Skip invalid metrics
        }

        const collectionId = generateCollectionId();

        const insertQuery = `
          INSERT INTO metric_data (
            collection_id, metric_name, metric_category, value, unit, target_value,
            data_source_id, collection_timestamp, metadata, collected_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING collection_id, metric_name, value
        `;

        const values = [
          collectionId, metric_name, metric_category, value, unit, target_value,
          data_source_id, collection_timestamp, JSON.stringify(metadata), req.user.user_id
        ];

        const result = await client.query(insertQuery, values);
        insertedMetrics.push(result.rows[0]);
      }

      // Update data source last collection time
      await client.query(
        'UPDATE data_sources SET last_collection_time = $1, updated_at = CURRENT_TIMESTAMP WHERE data_source_id = $2',
        [currentTimestamp, data_source_id]
      );

      await client.query('COMMIT');

      await logActivity(
        req.user.user_id,
        'metric_data_batch_collected',
        `Batch metric data collected: ${insertedMetrics.length} metrics`,
        req.ip,
        req.get('User-Agent'),
        { data_source_id, metrics_count: insertedMetrics.length, total_submitted: metrics.length }
      );

      res.status(201).json({
        success: true,
        message: 'Batch metric data collected successfully',
        data: {
          inserted_count: insertedMetrics.length,
          total_submitted: metrics.length,
          inserted_metrics: insertedMetrics
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error collecting batch metric data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to collect batch metric data',
        error: error.message
      });
    } finally {
      client.release();
    }
  }
);

// GET /api/data-collection/metrics - Query metric data
router.get('/metrics',
  authenticateToken,
  requirePermissions('data_collection_read'),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 100,
        metric_name,
        metric_category,
        data_source_id,
        start_date,
        end_date,
        sort_by = 'collection_timestamp',
        sort_order = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (metric_name) {
        paramCount++;
        whereConditions.push(`metric_name = $${paramCount}`);
        queryParams.push(metric_name);
      }

      if (metric_category) {
        paramCount++;
        whereConditions.push(`metric_category = $${paramCount}`);
        queryParams.push(metric_category);
      }

      if (data_source_id) {
        paramCount++;
        whereConditions.push(`md.data_source_id = $${paramCount}`);
        queryParams.push(data_source_id);
      }

      if (start_date) {
        paramCount++;
        whereConditions.push(`collection_timestamp >= $${paramCount}`);
        queryParams.push(start_date);
      }

      if (end_date) {
        paramCount++;
        whereConditions.push(`collection_timestamp <= $${paramCount}`);
        queryParams.push(end_date);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      const validSortColumns = ['collection_timestamp', 'metric_name', 'value', 'created_at'];
      const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'collection_timestamp';
      const sortDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      const metricsQuery = `
        SELECT 
          md.collection_id,
          md.metric_name,
          md.metric_category,
          md.value,
          md.unit,
          md.target_value,
          md.collection_timestamp,
          md.metadata,
          md.created_at,
          ds.source_name,
          ds.source_type,
          u.username as collected_by_username
        FROM metric_data md
        LEFT JOIN data_sources ds ON md.data_source_id = ds.data_source_id
        LEFT JOIN users u ON md.collected_by = u.user_id
        ${whereClause}
        ORDER BY ${sortColumn} ${sortDirection}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      queryParams.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM metric_data md
        LEFT JOIN data_sources ds ON md.data_source_id = ds.data_source_id
        ${whereClause}
      `;

      const [metricsResult, countResult] = await Promise.all([
        pool.query(metricsQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2))
      ]);

      const metrics = metricsResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          metrics,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: total,
            items_per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error querying metric data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to query metric data',
        error: error.message
      });
    }
  }
);

module.exports = router;