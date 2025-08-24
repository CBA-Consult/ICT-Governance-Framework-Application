/**
 * Data Transformation API
 * RESTful endpoints for data transformation operations
 */

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authenticateToken, requirePermissions, logActivity } = require('../middleware/auth');
const DataTransformationService = require('../services/data-transformation-service');

const router = express.Router();
const transformationService = new DataTransformationService();

// Initialize the service
transformationService.initialize().catch(console.error);

/**
 * @route GET /api/data-transformation/rules
 * @desc Get transformation rules
 * @access Private
 */
router.get('/rules',
  authenticateToken,
  requirePermissions(['data_transformation_read']),
  [
    query('rule_type').optional().isString(),
    query('is_active').optional().isBoolean(),
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
        rule_type: req.query.rule_type,
        is_active: req.query.is_active
      };

      const rules = await transformationService.getTransformationRules(filters);

      await logActivity(req.user.user_id, 'transformation_rules_viewed', 'transformation_rules', null, {
        filters,
        count: rules.length
      });

      res.json({
        success: true,
        data: rules,
        count: rules.length
      });
    } catch (error) {
      console.error('Error fetching transformation rules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transformation rules',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/data-transformation/rules
 * @desc Create a new transformation rule
 * @access Private
 */
router.post('/rules',
  authenticateToken,
  requirePermissions(['data_transformation_write']),
  [
    body('rule_name').notEmpty().isString().withMessage('Rule name is required'),
    body('rule_type').isIn(['mapping', 'validation', 'enrichment', 'aggregation', 'filtering']).withMessage('Invalid rule type'),
    body('source_schema').isObject().withMessage('Source schema must be an object'),
    body('target_schema').isObject().withMessage('Target schema must be an object'),
    body('transformation_logic').isObject().withMessage('Transformation logic must be an object'),
    body('validation_rules').optional().isObject(),
    body('priority_order').optional().isInt({ min: 1 }),
    body('description').optional().isString(),
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

      const ruleConfig = {
        ...req.body,
        created_by: req.user.user_id
      };

      const newRule = await transformationService.createTransformationRule(ruleConfig);

      await logActivity(req.user.user_id, 'transformation_rule_created', 'transformation_rules', newRule.rule_id, {
        rule_name: newRule.rule_name,
        rule_type: newRule.rule_type
      });

      res.status(201).json({
        success: true,
        message: 'Transformation rule created successfully',
        data: newRule
      });
    } catch (error) {
      console.error('Error creating transformation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create transformation rule',
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/data-transformation/rules/:ruleId
 * @desc Update a transformation rule
 * @access Private
 */
router.put('/rules/:ruleId',
  authenticateToken,
  requirePermissions(['data_transformation_write']),
  [
    body('rule_name').optional().isString(),
    body('rule_type').optional().isIn(['mapping', 'validation', 'enrichment', 'aggregation', 'filtering']),
    body('source_schema').optional().isObject(),
    body('target_schema').optional().isObject(),
    body('transformation_logic').optional().isObject(),
    body('validation_rules').optional().isObject(),
    body('priority_order').optional().isInt({ min: 1 }),
    body('is_active').optional().isBoolean(),
    body('description').optional().isString(),
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

      const { ruleId } = req.params;
      const updates = req.body;

      const updatedRule = await transformationService.updateTransformationRule(ruleId, updates);

      if (!updatedRule) {
        return res.status(404).json({
          success: false,
          message: 'Transformation rule not found'
        });
      }

      await logActivity(req.user.user_id, 'transformation_rule_updated', 'transformation_rules', ruleId, {
        updates: Object.keys(updates)
      });

      res.json({
        success: true,
        message: 'Transformation rule updated successfully',
        data: updatedRule
      });
    } catch (error) {
      console.error('Error updating transformation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update transformation rule',
        error: error.message
      });
    }
  }
);

/**
 * @route DELETE /api/data-transformation/rules/:ruleId
 * @desc Delete a transformation rule
 * @access Private
 */
router.delete('/rules/:ruleId',
  authenticateToken,
  requirePermissions(['data_transformation_delete']),
  async (req, res) => {
    try {
      const { ruleId } = req.params;

      const deleted = await transformationService.deleteTransformationRule(ruleId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Transformation rule not found'
        });
      }

      await logActivity(req.user.user_id, 'transformation_rule_deleted', 'transformation_rules', ruleId, {
        deleted_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Transformation rule deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting transformation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete transformation rule',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/data-transformation/transform
 * @desc Transform data using specified rules
 * @access Private
 */
router.post('/transform',
  authenticateToken,
  requirePermissions(['data_transformation_execute']),
  [
    body('data').isArray().withMessage('Data must be an array'),
    body('rule_ids').optional().isArray().withMessage('Rule IDs must be an array'),
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

      const { data, rule_ids = [], options = {} } = req.body;

      const result = await transformationService.transformData(data, rule_ids, options);

      await logActivity(req.user.user_id, 'data_transformation_executed', 'data_transformation', null, {
        original_record_count: result.originalRecordCount,
        transformed_record_count: result.transformedRecordCount,
        rules_applied: result.transformationLog.length
      });

      res.json({
        success: true,
        message: 'Data transformation completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error transforming data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to transform data',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/data-transformation/validate
 * @desc Validate data against transformation rules
 * @access Private
 */
router.post('/validate',
  authenticateToken,
  requirePermissions(['data_transformation_execute']),
  [
    body('data').isArray().withMessage('Data must be an array'),
    body('rule_id').isUUID().withMessage('Valid rule ID is required'),
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

      const { data, rule_id, options = {} } = req.body;

      const result = await transformationService.transformData(data, [rule_id], {
        ...options,
        includeInvalidRecords: true
      });

      await logActivity(req.user.user_id, 'data_validation_executed', 'data_validation', rule_id, {
        record_count: data.length,
        validation_rule: rule_id
      });

      res.json({
        success: true,
        message: 'Data validation completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error validating data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate data',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/data-transformation/test-rule
 * @desc Test a transformation rule with sample data
 * @access Private
 */
router.post('/test-rule',
  authenticateToken,
  requirePermissions(['data_transformation_execute']),
  [
    body('rule').isObject().withMessage('Rule configuration is required'),
    body('sample_data').isArray().withMessage('Sample data must be an array'),
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

      const { rule, sample_data, options = {} } = req.body;

      // Create a temporary rule for testing
      const tempRule = {
        rule_id: 'temp-rule',
        rule_name: 'Test Rule',
        rule_type: rule.rule_type,
        transformation_logic: rule.transformation_logic,
        validation_rules: rule.validation_rules || {},
        is_active: true,
        priority_order: 1
      };

      // Apply the rule to sample data
      const result = await transformationService.applyTransformationRule(sample_data, tempRule, options);

      await logActivity(req.user.user_id, 'transformation_rule_tested', 'transformation_test', null, {
        rule_type: rule.rule_type,
        sample_record_count: sample_data.length
      });

      res.json({
        success: true,
        message: 'Transformation rule test completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error testing transformation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test transformation rule',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/data-transformation/rule-types
 * @desc Get available transformation rule types and their configurations
 * @access Private
 */
router.get('/rule-types',
  authenticateToken,
  requirePermissions(['data_transformation_read']),
  async (req, res) => {
    try {
      const ruleTypes = {
        mapping: {
          name: 'Field Mapping',
          description: 'Map fields from source to target schema',
          configuration: {
            mappings: [
              {
                type: 'direct|calculated|concatenate|split|format',
                source: 'source_field_name',
                target: 'target_field_name',
                expression: 'calculation_expression (for calculated type)',
                separator: 'separator_string (for concatenate/split)',
                format: 'format_specification (for format type)'
              }
            ]
          }
        },
        validation: {
          name: 'Data Validation',
          description: 'Validate data against specified rules',
          configuration: {
            validations: [
              {
                field: 'field_name',
                rules: [
                  {
                    type: 'required|format|min|max|email|number|string|boolean|date',
                    value: 'rule_value',
                    pattern: 'regex_pattern (for format type)'
                  }
                ]
              }
            ]
          }
        },
        enrichment: {
          name: 'Data Enrichment',
          description: 'Enrich data with additional information',
          configuration: {
            enrichments: [
              {
                type: 'lookup|calculate|timestamp|uuid',
                sourceField: 'source_field',
                targetField: 'target_field',
                lookupTable: 'lookup_table_name (for lookup type)',
                lookupKey: 'lookup_key_field (for lookup type)',
                expression: 'calculation_expression (for calculate type)'
              }
            ]
          }
        },
        aggregation: {
          name: 'Data Aggregation',
          description: 'Aggregate data using various functions',
          configuration: {
            groupBy: ['field1', 'field2'],
            aggregations: [
              {
                function: 'count|sum|avg|min|max',
                sourceField: 'source_field',
                targetField: 'target_field'
              }
            ]
          }
        },
        filtering: {
          name: 'Data Filtering',
          description: 'Filter data based on specified conditions',
          configuration: {
            filters: [
              {
                field: 'field_name',
                operator: 'equals|not_equals|greater_than|less_than|contains|starts_with|ends_with|in|not_null|is_null',
                value: 'filter_value'
              }
            ]
          }
        }
      };

      res.json({
        success: true,
        data: ruleTypes
      });
    } catch (error) {
      console.error('Error fetching rule types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch rule types',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/data-transformation/dashboard
 * @desc Get transformation dashboard data
 * @access Private
 */
router.get('/dashboard',
  authenticateToken,
  requirePermissions(['data_transformation_read']),
  async (req, res) => {
    try {
      // This would typically aggregate data from transformation operations
      // For now, returning a placeholder dashboard
      const dashboardData = {
        totalRules: 0,
        activeRules: 0,
        rulesByType: {
          mapping: 0,
          validation: 0,
          enrichment: 0,
          aggregation: 0,
          filtering: 0
        },
        recentTransformations: [],
        transformationMetrics: {
          totalRecordsTransformed: 0,
          successRate: 0,
          averageProcessingTime: 0
        }
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Error fetching transformation dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transformation dashboard',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/data-transformation/bulk-transform
 * @desc Transform large datasets in batches
 * @access Private
 */
router.post('/bulk-transform',
  authenticateToken,
  requirePermissions(['data_transformation_execute']),
  [
    body('data_source').isObject().withMessage('Data source configuration is required'),
    body('rule_ids').isArray().withMessage('Rule IDs must be an array'),
    body('batch_size').optional().isInt({ min: 1, max: 10000 }),
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

      const { data_source, rule_ids, batch_size = 1000, options = {} } = req.body;

      // This would typically process data in batches from the specified source
      // For now, returning a placeholder response
      const result = {
        job_id: require('uuid').v4(),
        status: 'started',
        batch_size,
        estimated_batches: 0,
        processed_batches: 0,
        total_records: 0,
        processed_records: 0,
        successful_records: 0,
        failed_records: 0
      };

      await logActivity(req.user.user_id, 'bulk_transformation_started', 'bulk_transformation', result.job_id, {
        rule_count: rule_ids.length,
        batch_size
      });

      res.json({
        success: true,
        message: 'Bulk transformation job started successfully',
        data: result
      });
    } catch (error) {
      console.error('Error starting bulk transformation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start bulk transformation',
        error: error.message
      });
    }
  }
);

module.exports = router;