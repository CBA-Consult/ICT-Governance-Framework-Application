/**
 * Master Data Management Service
 * Handles master data entities, data quality, and data governance
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class MasterDataManagementService extends EventEmitter {
  constructor() {
    super();
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.dataQualityRules = new Map();
    this.entitySchemas = new Map();
  }

  /**
   * Initialize the master data management service
   */
  async initialize() {
    try {
      console.log('Initializing Master Data Management Service...');
      await this.loadEntitySchemas();
      await this.loadDataQualityRules();
      console.log('Master Data Management Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Master Data Management Service:', error);
      throw error;
    }
  }

  /**
   * Load entity schemas from database
   */
  async loadEntitySchemas() {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM master_data_entities
        WHERE is_active = true
        ORDER BY entity_name
      `;

      const result = await client.query(query);
      
      for (const entity of result.rows) {
        this.entitySchemas.set(entity.entity_id, entity);
      }

      console.log(`Loaded ${result.rows.length} master data entity schemas`);
    } finally {
      client.release();
    }
  }

  /**
   * Load data quality rules
   */
  async loadDataQualityRules() {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT entity_id, data_quality_rules
        FROM master_data_entities
        WHERE is_active = true AND data_quality_rules IS NOT NULL
      `;

      const result = await client.query(query);
      
      for (const row of result.rows) {
        this.dataQualityRules.set(row.entity_id, row.data_quality_rules);
      }

      console.log(`Loaded data quality rules for ${result.rows.length} entities`);
    } finally {
      client.release();
    }
  }

  /**
   * Create a new master data entity
   */
  async createMasterDataEntity(entityConfig) {
    const client = await this.pool.connect();
    try {
      const {
        entity_name,
        entity_type,
        entity_schema,
        business_rules = {},
        data_quality_rules = {},
        steward_user_id,
        approval_workflow_id,
        description,
        created_by,
        metadata = {}
      } = entityConfig;

      const query = `
        INSERT INTO master_data_entities (
          entity_name, entity_type, entity_schema, business_rules,
          data_quality_rules, steward_user_id, approval_workflow_id,
          description, created_by, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        entity_name, entity_type, entity_schema, business_rules,
        data_quality_rules, steward_user_id, approval_workflow_id,
        description, created_by, metadata
      ];

      const result = await client.query(query, values);
      const newEntity = result.rows[0];

      // Add to cache
      this.entitySchemas.set(newEntity.entity_id, newEntity);
      if (data_quality_rules && Object.keys(data_quality_rules).length > 0) {
        this.dataQualityRules.set(newEntity.entity_id, data_quality_rules);
      }

      this.emit('entityCreated', newEntity);
      return newEntity;
    } finally {
      client.release();
    }
  }

  /**
   * Create or update a master data record
   */
  async upsertMasterDataRecord(entityId, recordData, options = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const entity = this.entitySchemas.get(entityId);
      if (!entity) {
        throw new Error(`Entity ${entityId} not found`);
      }

      const {
        master_id,
        source_system,
        created_by,
        updated_by,
        metadata = {}
      } = options;

      // Validate record against entity schema
      const validationResult = await this.validateRecord(entityId, recordData);
      if (!validationResult.isValid) {
        throw new Error(`Record validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Calculate data quality score
      const qualityScore = await this.calculateDataQualityScore(entityId, recordData);

      // Check if record exists
      const existingQuery = `
        SELECT * FROM master_data_records
        WHERE entity_id = $1 AND master_id = $2
      `;
      const existingResult = await client.query(existingQuery, [entityId, master_id]);

      let result;
      if (existingResult.rows.length > 0) {
        // Update existing record
        const updateQuery = `
          UPDATE master_data_records
          SET record_data = $1, data_quality_score = $2, updated_at = CURRENT_TIMESTAMP,
              updated_by = $3, version = version + 1, metadata = $4
          WHERE entity_id = $5 AND master_id = $6
          RETURNING *
        `;
        const updateValues = [recordData, qualityScore, updated_by, metadata, entityId, master_id];
        result = await client.query(updateQuery, updateValues);

        this.emit('recordUpdated', {
          entityId,
          masterId: master_id,
          record: result.rows[0],
          previousVersion: existingResult.rows[0]
        });
      } else {
        // Insert new record
        const insertQuery = `
          INSERT INTO master_data_records (
            entity_id, master_id, record_data, data_quality_score,
            source_system, created_by, updated_by, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;
        const insertValues = [
          entityId, master_id, recordData, qualityScore,
          source_system, created_by, updated_by, metadata
        ];
        result = await client.query(insertQuery, insertValues);

        this.emit('recordCreated', {
          entityId,
          masterId: master_id,
          record: result.rows[0]
        });
      }

      // Perform data quality checks
      await this.performDataQualityChecks(client, entityId, result.rows[0]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get master data records
   */
  async getMasterDataRecords(entityId, filters = {}, pagination = {}) {
    const client = await this.pool.connect();
    try {
      const { page = 1, limit = 50 } = pagination;
      const offset = (page - 1) * limit;

      let whereConditions = ['entity_id = $1'];
      let queryParams = [entityId];
      let paramCount = 1;

      if (filters.status) {
        paramCount++;
        whereConditions.push(`status = $${paramCount}`);
        queryParams.push(filters.status);
      }

      if (filters.source_system) {
        paramCount++;
        whereConditions.push(`source_system = $${paramCount}`);
        queryParams.push(filters.source_system);
      }

      if (filters.min_quality_score) {
        paramCount++;
        whereConditions.push(`data_quality_score >= $${paramCount}`);
        queryParams.push(filters.min_quality_score);
      }

      if (filters.search) {
        paramCount++;
        whereConditions.push(`record_data::text ILIKE $${paramCount}`);
        queryParams.push(`%${filters.search}%`);
      }

      const whereClause = whereConditions.join(' AND ');

      const recordsQuery = `
        SELECT * FROM master_data_records
        WHERE ${whereClause}
        ORDER BY updated_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      const countQuery = `
        SELECT COUNT(*) as total FROM master_data_records
        WHERE ${whereClause}
      `;

      queryParams.push(limit, offset);

      const [recordsResult, countResult] = await Promise.all([
        client.query(recordsQuery, queryParams),
        client.query(countQuery, queryParams.slice(0, -2))
      ]);

      const records = recordsResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        records,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } finally {
      client.release();
    }
  }

  /**
   * Validate record against entity schema
   */
  async validateRecord(entityId, recordData) {
    const entity = this.entitySchemas.get(entityId);
    if (!entity) {
      return { isValid: false, errors: ['Entity not found'] };
    }

    const schema = entity.entity_schema;
    const errors = [];

    // Check required fields
    if (schema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        if (fieldSchema.required && (recordData[fieldName] === undefined || recordData[fieldName] === null)) {
          errors.push(`Required field '${fieldName}' is missing`);
        }

        // Type validation
        if (recordData[fieldName] !== undefined && fieldSchema.type) {
          const isValidType = this.validateFieldType(recordData[fieldName], fieldSchema.type);
          if (!isValidType) {
            errors.push(`Field '${fieldName}' has invalid type. Expected: ${fieldSchema.type}`);
          }
        }

        // Format validation
        if (recordData[fieldName] && fieldSchema.format) {
          const isValidFormat = this.validateFieldFormat(recordData[fieldName], fieldSchema.format);
          if (!isValidFormat) {
            errors.push(`Field '${fieldName}' has invalid format. Expected: ${fieldSchema.format}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate field type
   */
  validateFieldType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * Validate field format
   */
  validateFieldFormat(value, format) {
    switch (format) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      case 'date':
        return !isNaN(Date.parse(value));
      case 'uuid':
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
      default:
        return true;
    }
  }

  /**
   * Calculate data quality score
   */
  async calculateDataQualityScore(entityId, recordData) {
    const qualityRules = this.dataQualityRules.get(entityId);
    if (!qualityRules || !qualityRules.rules) {
      return 1.0; // Default score if no rules defined
    }

    let totalScore = 0;
    let ruleCount = 0;

    for (const rule of qualityRules.rules) {
      ruleCount++;
      let ruleScore = 0;

      switch (rule.type) {
        case 'completeness':
          ruleScore = this.calculateCompletenessScore(recordData, rule.fields);
          break;
        case 'accuracy':
          ruleScore = this.calculateAccuracyScore(recordData, rule);
          break;
        case 'consistency':
          ruleScore = this.calculateConsistencyScore(recordData, rule);
          break;
        case 'validity':
          ruleScore = this.calculateValidityScore(recordData, rule);
          break;
        case 'uniqueness':
          ruleScore = await this.calculateUniquenessScore(entityId, recordData, rule);
          break;
        default:
          ruleScore = 1.0;
      }

      totalScore += ruleScore * (rule.weight || 1);
    }

    return Math.min(1.0, totalScore / ruleCount);
  }

  /**
   * Calculate completeness score
   */
  calculateCompletenessScore(recordData, fields) {
    if (!fields || fields.length === 0) return 1.0;

    let completedFields = 0;
    for (const field of fields) {
      if (recordData[field] !== undefined && recordData[field] !== null && recordData[field] !== '') {
        completedFields++;
      }
    }

    return completedFields / fields.length;
  }

  /**
   * Calculate accuracy score
   */
  calculateAccuracyScore(recordData, rule) {
    // Simplified accuracy check based on format validation
    if (rule.field && rule.format) {
      const value = recordData[rule.field];
      if (value && this.validateFieldFormat(value, rule.format)) {
        return 1.0;
      }
      return 0.0;
    }
    return 1.0;
  }

  /**
   * Calculate consistency score
   */
  calculateConsistencyScore(recordData, rule) {
    // Check if related fields are consistent
    if (rule.fields && rule.fields.length >= 2) {
      const values = rule.fields.map(field => recordData[field]);
      const uniqueValues = [...new Set(values)];
      
      // For consistency, we expect certain relationships
      if (rule.relationship === 'equal') {
        return uniqueValues.length === 1 ? 1.0 : 0.0;
      }
    }
    return 1.0;
  }

  /**
   * Calculate validity score
   */
  calculateValidityScore(recordData, rule) {
    if (rule.field && rule.validValues) {
      const value = recordData[rule.field];
      return rule.validValues.includes(value) ? 1.0 : 0.0;
    }
    return 1.0;
  }

  /**
   * Calculate uniqueness score
   */
  async calculateUniquenessScore(entityId, recordData, rule) {
    if (!rule.field) return 1.0;

    const client = await this.pool.connect();
    try {
      const value = recordData[rule.field];
      const query = `
        SELECT COUNT(*) as count
        FROM master_data_records
        WHERE entity_id = $1 AND record_data->$2 = $3
      `;

      const result = await client.query(query, [entityId, rule.field, JSON.stringify(value)]);
      const count = parseInt(result.rows[0].count);

      return count === 0 ? 1.0 : 0.0;
    } finally {
      client.release();
    }
  }

  /**
   * Perform data quality checks
   */
  async performDataQualityChecks(client, entityId, record) {
    const qualityRules = this.dataQualityRules.get(entityId);
    if (!qualityRules || !qualityRules.rules) {
      return;
    }

    for (const rule of qualityRules.rules) {
      const issues = await this.checkDataQualityRule(record, rule);
      
      for (const issue of issues) {
        await this.createDataQualityIssue(client, {
          entity_id: entityId,
          record_id: record.record_id,
          issue_type: rule.type,
          severity: rule.severity || 'medium',
          description: issue.description,
          field_name: issue.field,
          current_value: issue.currentValue,
          expected_value: issue.expectedValue,
          rule_violated: rule.name || rule.type
        });
      }
    }
  }

  /**
   * Check a specific data quality rule
   */
  async checkDataQualityRule(record, rule) {
    const issues = [];

    switch (rule.type) {
      case 'completeness':
        if (rule.fields) {
          for (const field of rule.fields) {
            const value = record.record_data[field];
            if (value === undefined || value === null || value === '') {
              issues.push({
                field,
                description: `Field '${field}' is incomplete`,
                currentValue: value,
                expectedValue: 'Non-empty value'
              });
            }
          }
        }
        break;

      case 'accuracy':
        if (rule.field && rule.format) {
          const value = record.record_data[rule.field];
          if (value && !this.validateFieldFormat(value, rule.format)) {
            issues.push({
              field: rule.field,
              description: `Field '${rule.field}' has incorrect format`,
              currentValue: value,
              expectedValue: `Valid ${rule.format} format`
            });
          }
        }
        break;

      case 'validity':
        if (rule.field && rule.validValues) {
          const value = record.record_data[rule.field];
          if (value && !rule.validValues.includes(value)) {
            issues.push({
              field: rule.field,
              description: `Field '${rule.field}' has invalid value`,
              currentValue: value,
              expectedValue: `One of: ${rule.validValues.join(', ')}`
            });
          }
        }
        break;
    }

    return issues;
  }

  /**
   * Create data quality issue
   */
  async createDataQualityIssue(client, issueData) {
    const query = `
      INSERT INTO data_quality_issues (
        entity_id, record_id, issue_type, severity, description,
        field_name, current_value, expected_value, rule_violated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      issueData.entity_id, issueData.record_id, issueData.issue_type,
      issueData.severity, issueData.description, issueData.field_name,
      issueData.current_value, issueData.expected_value, issueData.rule_violated
    ];

    const result = await client.query(query, values);
    
    this.emit('qualityIssueDetected', result.rows[0]);
    return result.rows[0];
  }

  /**
   * Get data quality issues
   */
  async getDataQualityIssues(filters = {}, pagination = {}) {
    const client = await this.pool.connect();
    try {
      const { page = 1, limit = 50 } = pagination;
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (filters.entity_id) {
        paramCount++;
        whereConditions.push(`entity_id = $${paramCount}`);
        queryParams.push(filters.entity_id);
      }

      if (filters.issue_type) {
        paramCount++;
        whereConditions.push(`issue_type = $${paramCount}`);
        queryParams.push(filters.issue_type);
      }

      if (filters.severity) {
        paramCount++;
        whereConditions.push(`severity = $${paramCount}`);
        queryParams.push(filters.severity);
      }

      if (filters.status) {
        paramCount++;
        whereConditions.push(`status = $${paramCount}`);
        queryParams.push(filters.status);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const issuesQuery = `
        SELECT dqi.*, mde.entity_name, mdr.master_id
        FROM data_quality_issues dqi
        JOIN master_data_entities mde ON dqi.entity_id = mde.entity_id
        LEFT JOIN master_data_records mdr ON dqi.record_id = mdr.record_id
        ${whereClause}
        ORDER BY dqi.detected_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      const countQuery = `
        SELECT COUNT(*) as total FROM data_quality_issues
        ${whereClause}
      `;

      queryParams.push(limit, offset);

      const [issuesResult, countResult] = await Promise.all([
        client.query(issuesQuery, queryParams),
        client.query(countQuery, queryParams.slice(0, -2))
      ]);

      const issues = issuesResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        issues,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } finally {
      client.release();
    }
  }

  /**
   * Resolve data quality issue
   */
  async resolveDataQualityIssue(issueId, resolution) {
    const client = await this.pool.connect();
    try {
      const {
        status = 'resolved',
        resolution_notes,
        resolved_by
      } = resolution;

      const query = `
        UPDATE data_quality_issues
        SET status = $1, resolution_notes = $2, resolved_at = CURRENT_TIMESTAMP
        WHERE issue_id = $3
        RETURNING *
      `;

      const values = [status, resolution_notes, issueId];
      const result = await client.query(query, values);

      if (result.rows.length > 0) {
        this.emit('qualityIssueResolved', result.rows[0]);
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get master data entities
   */
  async getMasterDataEntities(filters = {}) {
    const client = await this.pool.connect();
    try {
      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (filters.entity_type) {
        paramCount++;
        whereConditions.push(`entity_type = $${paramCount}`);
        queryParams.push(filters.entity_type);
      }

      if (filters.is_active !== undefined) {
        paramCount++;
        whereConditions.push(`is_active = $${paramCount}`);
        queryParams.push(filters.is_active);
      }

      if (filters.steward_user_id) {
        paramCount++;
        whereConditions.push(`steward_user_id = $${paramCount}`);
        queryParams.push(filters.steward_user_id);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT * FROM master_data_entities
        ${whereClause}
        ORDER BY entity_name ASC
      `;

      const result = await client.query(query, queryParams);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Update master data entity
   */
  async updateMasterDataEntity(entityId, updates) {
    const client = await this.pool.connect();
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const query = `
        UPDATE master_data_entities
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE entity_id = $1
        RETURNING *
      `;

      const values = [entityId, ...Object.values(updates)];
      const result = await client.query(query, values);

      if (result.rows.length > 0) {
        const updatedEntity = result.rows[0];
        
        // Update cache
        this.entitySchemas.set(entityId, updatedEntity);
        
        if (updatedEntity.data_quality_rules) {
          this.dataQualityRules.set(entityId, updatedEntity.data_quality_rules);
        }

        this.emit('entityUpdated', updatedEntity);
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Delete master data record
   */
  async deleteMasterDataRecord(entityId, masterId) {
    const client = await this.pool.connect();
    try {
      const query = `
        DELETE FROM master_data_records
        WHERE entity_id = $1 AND master_id = $2
        RETURNING *
      `;

      const result = await client.query(query, [entityId, masterId]);
      
      if (result.rows.length > 0) {
        this.emit('recordDeleted', {
          entityId,
          masterId,
          record: result.rows[0]
        });
      }

      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Get data lineage for a record
   */
  async getDataLineage(entityName, fieldName = null) {
    const client = await this.pool.connect();
    try {
      let whereConditions = ['source_entity = $1 OR target_entity = $1'];
      let queryParams = [entityName];

      if (fieldName) {
        whereConditions.push('(source_field = $2 OR target_field = $2)');
        queryParams.push(fieldName);
      }

      const query = `
        SELECT dl.*, 
               dtr.rule_name, dtr.transformation_logic,
               dsj.job_name, dsj.sync_type
        FROM data_lineage dl
        LEFT JOIN data_transformation_rules dtr ON dl.transformation_rule_id = dtr.rule_id
        LEFT JOIN data_sync_jobs dsj ON dl.sync_job_id = dsj.job_id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY dl.created_at DESC
      `;

      const result = await client.query(query, queryParams);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Create data lineage record
   */
  async createDataLineage(lineageData) {
    const client = await this.pool.connect();
    try {
      const {
        source_entity,
        source_field,
        target_entity,
        target_field,
        transformation_type,
        transformation_rule_id,
        sync_job_id,
        metadata = {}
      } = lineageData;

      const query = `
        INSERT INTO data_lineage (
          source_entity, source_field, target_entity, target_field,
          transformation_type, transformation_rule_id, sync_job_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        source_entity, source_field, target_entity, target_field,
        transformation_type, transformation_rule_id, sync_job_id, metadata
      ];

      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get data quality dashboard metrics
   */
  async getDataQualityMetrics(entityId = null) {
    const client = await this.pool.connect();
    try {
      let entityFilter = '';
      let queryParams = [];

      if (entityId) {
        entityFilter = 'WHERE entity_id = $1';
        queryParams.push(entityId);
      }

      const queries = {
        totalRecords: `
          SELECT COUNT(*) as count FROM master_data_records ${entityFilter}
        `,
        averageQualityScore: `
          SELECT AVG(data_quality_score) as avg_score FROM master_data_records ${entityFilter}
        `,
        qualityDistribution: `
          SELECT 
            CASE 
              WHEN data_quality_score >= 0.9 THEN 'excellent'
              WHEN data_quality_score >= 0.7 THEN 'good'
              WHEN data_quality_score >= 0.5 THEN 'fair'
              ELSE 'poor'
            END as quality_level,
            COUNT(*) as count
          FROM master_data_records ${entityFilter}
          GROUP BY quality_level
        `,
        issuesByType: `
          SELECT issue_type, COUNT(*) as count
          FROM data_quality_issues 
          WHERE status = 'open' ${entityId ? 'AND entity_id = $1' : ''}
          GROUP BY issue_type
        `,
        issuesBySeverity: `
          SELECT severity, COUNT(*) as count
          FROM data_quality_issues 
          WHERE status = 'open' ${entityId ? 'AND entity_id = $1' : ''}
          GROUP BY severity
        `
      };

      const results = {};
      for (const [key, query] of Object.entries(queries)) {
        const result = await client.query(query, queryParams);
        results[key] = result.rows;
      }

      return {
        totalRecords: parseInt(results.totalRecords[0]?.count || 0),
        averageQualityScore: parseFloat(results.averageQualityScore[0]?.avg_score || 0),
        qualityDistribution: results.qualityDistribution,
        issuesByType: results.issuesByType,
        issuesBySeverity: results.issuesBySeverity
      };
    } finally {
      client.release();
    }
  }
}

module.exports = MasterDataManagementService;