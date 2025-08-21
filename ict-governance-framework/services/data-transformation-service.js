/**
 * Data Transformation Service
 * Handles data transformation, validation, and enrichment
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

class DataTransformationService {
  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.transformationCache = new Map();
    this.validationSchemas = new Map();
  }

  /**
   * Initialize the transformation service
   */
  async initialize() {
    try {
      console.log('Initializing Data Transformation Service...');
      await this.loadTransformationRules();
      console.log('Data Transformation Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Data Transformation Service:', error);
      throw error;
    }
  }

  /**
   * Load transformation rules from database into cache
   */
  async loadTransformationRules() {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM data_transformation_rules
        WHERE is_active = true
        ORDER BY priority_order ASC
      `;

      const result = await client.query(query);
      
      for (const rule of result.rows) {
        this.transformationCache.set(rule.rule_id, rule);
        
        // Build Joi validation schema if validation rules exist
        if (rule.validation_rules && Object.keys(rule.validation_rules).length > 0) {
          const schema = this.buildValidationSchema(rule.validation_rules);
          this.validationSchemas.set(rule.rule_id, schema);
        }
      }

      console.log(`Loaded ${result.rows.length} transformation rules`);
    } finally {
      client.release();
    }
  }

  /**
   * Create a new transformation rule
   */
  async createTransformationRule(ruleConfig) {
    const client = await this.pool.connect();
    try {
      const {
        rule_name,
        rule_type,
        source_schema,
        target_schema,
        transformation_logic,
        validation_rules = {},
        priority_order = 100,
        description,
        created_by,
        tags = []
      } = ruleConfig;

      const query = `
        INSERT INTO data_transformation_rules (
          rule_name, rule_type, source_schema, target_schema,
          transformation_logic, validation_rules, priority_order,
          description, created_by, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        rule_name, rule_type, source_schema, target_schema,
        transformation_logic, validation_rules, priority_order,
        description, created_by, tags
      ];

      const result = await client.query(query, values);
      const newRule = result.rows[0];

      // Add to cache
      this.transformationCache.set(newRule.rule_id, newRule);

      // Build validation schema if needed
      if (validation_rules && Object.keys(validation_rules).length > 0) {
        const schema = this.buildValidationSchema(validation_rules);
        this.validationSchemas.set(newRule.rule_id, schema);
      }

      return newRule;
    } finally {
      client.release();
    }
  }

  /**
   * Apply transformation rules to data
   */
  async transformData(data, ruleIds = [], options = {}) {
    try {
      let transformedData = Array.isArray(data) ? [...data] : [data];
      const transformationLog = [];

      // If no specific rules provided, apply all applicable rules
      if (ruleIds.length === 0) {
        ruleIds = Array.from(this.transformationCache.keys());
      }

      // Sort rules by priority
      const sortedRules = ruleIds
        .map(id => this.transformationCache.get(id))
        .filter(rule => rule && rule.is_active)
        .sort((a, b) => a.priority_order - b.priority_order);

      for (const rule of sortedRules) {
        try {
          const ruleResult = await this.applyTransformationRule(transformedData, rule, options);
          transformedData = ruleResult.data;
          transformationLog.push({
            rule_id: rule.rule_id,
            rule_name: rule.rule_name,
            rule_type: rule.rule_type,
            records_processed: ruleResult.recordsProcessed,
            records_successful: ruleResult.recordsSuccessful,
            records_failed: ruleResult.recordsFailed,
            errors: ruleResult.errors
          });
        } catch (error) {
          console.error(`Error applying transformation rule ${rule.rule_id}:`, error);
          transformationLog.push({
            rule_id: rule.rule_id,
            rule_name: rule.rule_name,
            rule_type: rule.rule_type,
            error: error.message
          });
        }
      }

      return {
        data: Array.isArray(data) ? transformedData : transformedData[0],
        transformationLog,
        originalRecordCount: Array.isArray(data) ? data.length : 1,
        transformedRecordCount: transformedData.length
      };
    } catch (error) {
      console.error('Data transformation failed:', error);
      throw error;
    }
  }

  /**
   * Apply a single transformation rule
   */
  async applyTransformationRule(data, rule, options = {}) {
    let recordsProcessed = 0;
    let recordsSuccessful = 0;
    let recordsFailed = 0;
    const errors = [];

    switch (rule.rule_type) {
      case 'mapping':
        return await this.applyMappingRule(data, rule, options);
      case 'validation':
        return await this.applyValidationRule(data, rule, options);
      case 'enrichment':
        return await this.applyEnrichmentRule(data, rule, options);
      case 'aggregation':
        return await this.applyAggregationRule(data, rule, options);
      case 'filtering':
        return await this.applyFilteringRule(data, rule, options);
      default:
        throw new Error(`Unsupported transformation rule type: ${rule.rule_type}`);
    }
  }

  /**
   * Apply mapping transformation rule
   */
  async applyMappingRule(data, rule, options = {}) {
    const transformedData = [];
    let recordsProcessed = 0;
    let recordsSuccessful = 0;
    let recordsFailed = 0;
    const errors = [];

    const mappings = rule.transformation_logic.mappings || [];

    for (const record of data) {
      recordsProcessed++;
      try {
        const transformedRecord = { ...record };

        for (const mapping of mappings) {
          switch (mapping.type) {
            case 'direct':
              if (record[mapping.source] !== undefined) {
                transformedRecord[mapping.target] = record[mapping.source];
                if (mapping.source !== mapping.target && !mapping.keepSource) {
                  delete transformedRecord[mapping.source];
                }
              }
              break;

            case 'calculated':
              if (mapping.expression) {
                transformedRecord[mapping.target] = this.evaluateExpression(
                  mapping.expression, 
                  record
                );
              }
              break;

            case 'concatenate':
              if (mapping.sources && Array.isArray(mapping.sources)) {
                const values = mapping.sources
                  .map(source => record[source] || '')
                  .filter(val => val !== '');
                transformedRecord[mapping.target] = values.join(mapping.separator || ' ');
              }
              break;

            case 'split':
              if (record[mapping.source] && mapping.separator) {
                const parts = record[mapping.source].split(mapping.separator);
                if (mapping.targets && Array.isArray(mapping.targets)) {
                  mapping.targets.forEach((target, index) => {
                    transformedRecord[target] = parts[index] || '';
                  });
                }
              }
              break;

            case 'format':
              if (record[mapping.source] !== undefined) {
                transformedRecord[mapping.target] = this.formatValue(
                  record[mapping.source],
                  mapping.format
                );
              }
              break;
          }
        }

        transformedData.push(transformedRecord);
        recordsSuccessful++;
      } catch (error) {
        recordsFailed++;
        errors.push({
          record: recordsProcessed,
          error: error.message
        });
        
        // Include original record if transformation fails
        if (options.includeFailedRecords) {
          transformedData.push(record);
        }
      }
    }

    return {
      data: transformedData,
      recordsProcessed,
      recordsSuccessful,
      recordsFailed,
      errors
    };
  }

  /**
   * Apply validation transformation rule
   */
  async applyValidationRule(data, rule, options = {}) {
    const validatedData = [];
    let recordsProcessed = 0;
    let recordsSuccessful = 0;
    let recordsFailed = 0;
    const errors = [];

    const schema = this.validationSchemas.get(rule.rule_id);
    if (!schema) {
      throw new Error(`No validation schema found for rule ${rule.rule_id}`);
    }

    for (const record of data) {
      recordsProcessed++;
      try {
        const { error, value } = schema.validate(record, { abortEarly: false });
        
        if (error) {
          recordsFailed++;
          errors.push({
            record: recordsProcessed,
            validationErrors: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value
            }))
          });

          if (options.includeInvalidRecords) {
            validatedData.push({
              ...record,
              _validation_errors: error.details
            });
          }
        } else {
          validatedData.push(value);
          recordsSuccessful++;
        }
      } catch (error) {
        recordsFailed++;
        errors.push({
          record: recordsProcessed,
          error: error.message
        });
      }
    }

    return {
      data: validatedData,
      recordsProcessed,
      recordsSuccessful,
      recordsFailed,
      errors
    };
  }

  /**
   * Apply enrichment transformation rule
   */
  async applyEnrichmentRule(data, rule, options = {}) {
    const enrichedData = [];
    let recordsProcessed = 0;
    let recordsSuccessful = 0;
    let recordsFailed = 0;
    const errors = [];

    const enrichmentRules = rule.transformation_logic.enrichments || [];

    for (const record of data) {
      recordsProcessed++;
      try {
        const enrichedRecord = { ...record };

        for (const enrichment of enrichmentRules) {
          switch (enrichment.type) {
            case 'lookup':
              const lookupValue = await this.performLookup(
                enrichment.lookupTable,
                enrichment.lookupKey,
                record[enrichment.sourceField]
              );
              if (lookupValue) {
                enrichedRecord[enrichment.targetField] = lookupValue;
              }
              break;

            case 'calculate':
              enrichedRecord[enrichment.targetField] = this.evaluateExpression(
                enrichment.expression,
                record
              );
              break;

            case 'timestamp':
              enrichedRecord[enrichment.targetField] = new Date().toISOString();
              break;

            case 'uuid':
              enrichedRecord[enrichment.targetField] = uuidv4();
              break;
          }
        }

        enrichedData.push(enrichedRecord);
        recordsSuccessful++;
      } catch (error) {
        recordsFailed++;
        errors.push({
          record: recordsProcessed,
          error: error.message
        });
        
        enrichedData.push(record);
      }
    }

    return {
      data: enrichedData,
      recordsProcessed,
      recordsSuccessful,
      recordsFailed,
      errors
    };
  }

  /**
   * Apply aggregation transformation rule
   */
  async applyAggregationRule(data, rule, options = {}) {
    const aggregationRules = rule.transformation_logic.aggregations || [];
    const groupBy = rule.transformation_logic.groupBy || [];
    
    if (groupBy.length === 0) {
      // Simple aggregation without grouping
      const result = {};
      
      for (const agg of aggregationRules) {
        switch (agg.function) {
          case 'count':
            result[agg.targetField] = data.length;
            break;
          case 'sum':
            result[agg.targetField] = data.reduce((sum, record) => 
              sum + (parseFloat(record[agg.sourceField]) || 0), 0);
            break;
          case 'avg':
            const values = data.map(record => parseFloat(record[agg.sourceField]) || 0);
            result[agg.targetField] = values.reduce((sum, val) => sum + val, 0) / values.length;
            break;
          case 'min':
            result[agg.targetField] = Math.min(...data.map(record => 
              parseFloat(record[agg.sourceField]) || 0));
            break;
          case 'max':
            result[agg.targetField] = Math.max(...data.map(record => 
              parseFloat(record[agg.sourceField]) || 0));
            break;
        }
      }

      return {
        data: [result],
        recordsProcessed: data.length,
        recordsSuccessful: 1,
        recordsFailed: 0,
        errors: []
      };
    } else {
      // Group by aggregation
      const groups = this.groupData(data, groupBy);
      const aggregatedData = [];

      for (const [groupKey, groupData] of Object.entries(groups)) {
        const groupResult = {};
        
        // Add group by fields
        const groupKeyParts = groupKey.split('|');
        groupBy.forEach((field, index) => {
          groupResult[field] = groupKeyParts[index];
        });

        // Apply aggregations
        for (const agg of aggregationRules) {
          switch (agg.function) {
            case 'count':
              groupResult[agg.targetField] = groupData.length;
              break;
            case 'sum':
              groupResult[agg.targetField] = groupData.reduce((sum, record) => 
                sum + (parseFloat(record[agg.sourceField]) || 0), 0);
              break;
            case 'avg':
              const values = groupData.map(record => parseFloat(record[agg.sourceField]) || 0);
              groupResult[agg.targetField] = values.reduce((sum, val) => sum + val, 0) / values.length;
              break;
          }
        }

        aggregatedData.push(groupResult);
      }

      return {
        data: aggregatedData,
        recordsProcessed: data.length,
        recordsSuccessful: aggregatedData.length,
        recordsFailed: 0,
        errors: []
      };
    }
  }

  /**
   * Apply filtering transformation rule
   */
  async applyFilteringRule(data, rule, options = {}) {
    const filters = rule.transformation_logic.filters || [];
    let filteredData = [...data];

    for (const filter of filters) {
      filteredData = filteredData.filter(record => {
        return this.evaluateFilter(record, filter);
      });
    }

    return {
      data: filteredData,
      recordsProcessed: data.length,
      recordsSuccessful: filteredData.length,
      recordsFailed: data.length - filteredData.length,
      errors: []
    };
  }

  /**
   * Build Joi validation schema from validation rules
   */
  buildValidationSchema(validationRules) {
    const schemaObject = {};

    if (validationRules.validations) {
      for (const validation of validationRules.validations) {
        let fieldSchema = Joi.any();

        for (const rule of validation.rules) {
          switch (rule.type) {
            case 'required':
              fieldSchema = fieldSchema.required();
              break;
            case 'format':
              if (rule.pattern) {
                fieldSchema = Joi.string().pattern(new RegExp(rule.pattern));
              }
              break;
            case 'min':
              fieldSchema = fieldSchema.min(rule.value);
              break;
            case 'max':
              fieldSchema = fieldSchema.max(rule.value);
              break;
            case 'email':
              fieldSchema = Joi.string().email();
              break;
            case 'number':
              fieldSchema = Joi.number();
              break;
            case 'string':
              fieldSchema = Joi.string();
              break;
            case 'boolean':
              fieldSchema = Joi.boolean();
              break;
            case 'date':
              fieldSchema = Joi.date();
              break;
          }
        }

        schemaObject[validation.field] = fieldSchema;
      }
    }

    return Joi.object(schemaObject);
  }

  /**
   * Evaluate expression for calculated fields
   */
  evaluateExpression(expression, record) {
    // Simple expression evaluator
    // In production, you might want to use a more robust expression engine
    try {
      // Replace field references with actual values
      let evaluatedExpression = expression;
      
      // Find field references like {fieldName}
      const fieldReferences = expression.match(/\{([^}]+)\}/g);
      if (fieldReferences) {
        for (const ref of fieldReferences) {
          const fieldName = ref.slice(1, -1);
          const value = record[fieldName] || 0;
          evaluatedExpression = evaluatedExpression.replace(ref, value);
        }
      }

      // Evaluate simple mathematical expressions
      return Function(`"use strict"; return (${evaluatedExpression})`)();
    } catch (error) {
      console.error('Expression evaluation failed:', error);
      return null;
    }
  }

  /**
   * Format value according to format specification
   */
  formatValue(value, format) {
    switch (format.type) {
      case 'date':
        return new Date(value).toISOString().split('T')[0];
      case 'datetime':
        return new Date(value).toISOString();
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: format.currency || 'USD'
        }).format(value);
      case 'number':
        return parseFloat(value).toFixed(format.decimals || 2);
      default:
        return value;
    }
  }

  /**
   * Perform lookup operation
   */
  async performLookup(lookupTable, lookupKey, lookupValue) {
    // Simplified lookup - in practice, you would query the actual lookup table
    const lookupData = {
      'departments': {
        'IT': 'Information Technology',
        'HR': 'Human Resources',
        'FIN': 'Finance'
      },
      'countries': {
        'US': 'United States',
        'CA': 'Canada',
        'UK': 'United Kingdom'
      }
    };

    return lookupData[lookupTable]?.[lookupValue] || null;
  }

  /**
   * Group data by specified fields
   */
  groupData(data, groupByFields) {
    const groups = {};

    for (const record of data) {
      const groupKey = groupByFields.map(field => record[field] || '').join('|');
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(record);
    }

    return groups;
  }

  /**
   * Evaluate filter condition
   */
  evaluateFilter(record, filter) {
    const fieldValue = record[filter.field];
    const filterValue = filter.value;

    switch (filter.operator) {
      case 'equals':
        return fieldValue === filterValue;
      case 'not_equals':
        return fieldValue !== filterValue;
      case 'greater_than':
        return parseFloat(fieldValue) > parseFloat(filterValue);
      case 'less_than':
        return parseFloat(fieldValue) < parseFloat(filterValue);
      case 'contains':
        return String(fieldValue).includes(String(filterValue));
      case 'starts_with':
        return String(fieldValue).startsWith(String(filterValue));
      case 'ends_with':
        return String(fieldValue).endsWith(String(filterValue));
      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(fieldValue);
      case 'not_null':
        return fieldValue !== null && fieldValue !== undefined;
      case 'is_null':
        return fieldValue === null || fieldValue === undefined;
      default:
        return true;
    }
  }

  /**
   * Get transformation rules
   */
  async getTransformationRules(filters = {}) {
    const client = await this.pool.connect();
    try {
      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (filters.rule_type) {
        paramCount++;
        whereConditions.push(`rule_type = $${paramCount}`);
        queryParams.push(filters.rule_type);
      }

      if (filters.is_active !== undefined) {
        paramCount++;
        whereConditions.push(`is_active = $${paramCount}`);
        queryParams.push(filters.is_active);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT * FROM data_transformation_rules
        ${whereClause}
        ORDER BY priority_order ASC, rule_name ASC
      `;

      const result = await client.query(query, queryParams);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Update transformation rule
   */
  async updateTransformationRule(ruleId, updates) {
    const client = await this.pool.connect();
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const query = `
        UPDATE data_transformation_rules
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE rule_id = $1
        RETURNING *
      `;

      const values = [ruleId, ...Object.values(updates)];
      const result = await client.query(query, values);

      if (result.rows.length > 0) {
        const updatedRule = result.rows[0];
        
        // Update cache
        this.transformationCache.set(ruleId, updatedRule);
        
        // Update validation schema if needed
        if (updatedRule.validation_rules && Object.keys(updatedRule.validation_rules).length > 0) {
          const schema = this.buildValidationSchema(updatedRule.validation_rules);
          this.validationSchemas.set(ruleId, schema);
        }
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Delete transformation rule
   */
  async deleteTransformationRule(ruleId) {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM data_transformation_rules WHERE rule_id = $1';
      const result = await client.query(query, [ruleId]);

      // Remove from cache
      this.transformationCache.delete(ruleId);
      this.validationSchemas.delete(ruleId);

      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }
}

module.exports = DataTransformationService;