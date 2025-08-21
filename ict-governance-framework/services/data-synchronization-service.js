/**
 * Data Synchronization Service
 * Handles data synchronization between different systems and sources
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class DataSynchronizationService extends EventEmitter {
  constructor() {
    super();
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.activeSyncJobs = new Map();
    this.syncScheduler = null;
  }

  /**
   * Initialize the synchronization service
   */
  async initialize() {
    try {
      console.log('Initializing Data Synchronization Service...');
      await this.startScheduler();
      console.log('Data Synchronization Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Data Synchronization Service:', error);
      throw error;
    }
  }

  /**
   * Start the sync scheduler for automated synchronization
   */
  async startScheduler() {
    if (this.syncScheduler) {
      clearInterval(this.syncScheduler);
    }

    // Check for scheduled sync jobs every minute
    this.syncScheduler = setInterval(async () => {
      try {
        await this.processScheduledSyncs();
      } catch (error) {
        console.error('Error processing scheduled syncs:', error);
      }
    }, 60000); // 1 minute
  }

  /**
   * Stop the sync scheduler
   */
  stopScheduler() {
    if (this.syncScheduler) {
      clearInterval(this.syncScheduler);
      this.syncScheduler = null;
    }
  }

  /**
   * Register a new data source
   */
  async registerDataSource(sourceConfig) {
    const client = await this.pool.connect();
    try {
      const {
        source_name,
        source_type,
        connection_config,
        data_format,
        sync_frequency = 'manual',
        is_master_source = false,
        priority_level = 5,
        created_by,
        metadata = {},
        tags = []
      } = sourceConfig;

      const query = `
        INSERT INTO data_sources_registry (
          source_name, source_type, connection_config, data_format,
          sync_frequency, is_master_source, priority_level, created_by,
          metadata, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        source_name, source_type, connection_config, data_format,
        sync_frequency, is_master_source, priority_level, created_by,
        metadata, tags
      ];

      const result = await client.query(query, values);
      const newSource = result.rows[0];

      this.emit('sourceRegistered', newSource);
      return newSource;
    } finally {
      client.release();
    }
  }

  /**
   * Create a synchronization job
   */
  async createSyncJob(jobConfig) {
    const client = await this.pool.connect();
    try {
      const {
        job_name,
        source_id,
        target_id,
        sync_type,
        sync_direction,
        sync_schedule,
        transformation_rules = {},
        conflict_resolution_strategy = 'source_wins',
        created_by,
        metadata = {}
      } = jobConfig;

      const query = `
        INSERT INTO data_sync_jobs (
          job_name, source_id, target_id, sync_type, sync_direction,
          sync_schedule, transformation_rules, conflict_resolution_strategy,
          created_by, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        job_name, source_id, target_id, sync_type, sync_direction,
        sync_schedule, transformation_rules, conflict_resolution_strategy,
        created_by, metadata
      ];

      const result = await client.query(query, values);
      const newJob = result.rows[0];

      this.emit('syncJobCreated', newJob);
      return newJob;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a synchronization job
   */
  async executeSyncJob(jobId, options = {}) {
    const client = await this.pool.connect();
    try {
      // Get job details
      const jobQuery = `
        SELECT sj.*, 
               src.source_name as source_name, src.connection_config as source_config,
               src.data_format as source_format,
               tgt.source_name as target_name, tgt.connection_config as target_config,
               tgt.data_format as target_format
        FROM data_sync_jobs sj
        JOIN data_sources_registry src ON sj.source_id = src.source_id
        JOIN data_sources_registry tgt ON sj.target_id = tgt.source_id
        WHERE sj.job_id = $1
      `;

      const jobResult = await client.query(jobQuery, [jobId]);
      if (jobResult.rows.length === 0) {
        throw new Error(`Sync job ${jobId} not found`);
      }

      const job = jobResult.rows[0];
      const executionId = uuidv4();

      // Update job status to running
      await client.query(
        'UPDATE data_sync_jobs SET status = $1, started_at = $2 WHERE job_id = $3',
        ['running', new Date(), jobId]
      );

      this.activeSyncJobs.set(jobId, { executionId, startTime: Date.now() });
      this.emit('syncJobStarted', { jobId, executionId, job });

      try {
        const syncResult = await this.performSync(job, executionId, options);
        
        // Update job status to completed
        await client.query(`
          UPDATE data_sync_jobs 
          SET status = $1, completed_at = $2, records_processed = $3,
              records_successful = $4, records_failed = $5, performance_metrics = $6
          WHERE job_id = $7
        `, [
          'completed', new Date(), syncResult.recordsProcessed,
          syncResult.recordsSuccessful, syncResult.recordsFailed,
          syncResult.performanceMetrics, jobId
        ]);

        this.activeSyncJobs.delete(jobId);
        this.emit('syncJobCompleted', { jobId, executionId, result: syncResult });

        return syncResult;
      } catch (syncError) {
        // Update job status to failed
        await client.query(`
          UPDATE data_sync_jobs 
          SET status = $1, completed_at = $2, error_details = $3
          WHERE job_id = $4
        `, ['failed', new Date(), { error: syncError.message, stack: syncError.stack }, jobId]);

        this.activeSyncJobs.delete(jobId);
        this.emit('syncJobFailed', { jobId, executionId, error: syncError });

        throw syncError;
      }
    } finally {
      client.release();
    }
  }

  /**
   * Perform the actual synchronization
   */
  async performSync(job, executionId, options = {}) {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsSuccessful = 0;
    let recordsFailed = 0;

    try {
      // Get source data
      const sourceData = await this.extractData(job.source_config, job.source_format, options);
      
      // Apply transformations if specified
      let transformedData = sourceData;
      if (job.transformation_rules && Object.keys(job.transformation_rules).length > 0) {
        transformedData = await this.transformData(sourceData, job.transformation_rules);
      }

      // Load data to target
      const loadResult = await this.loadData(
        transformedData, 
        job.target_config, 
        job.target_format,
        job.conflict_resolution_strategy,
        executionId,
        job.job_id
      );

      recordsProcessed = loadResult.recordsProcessed;
      recordsSuccessful = loadResult.recordsSuccessful;
      recordsFailed = loadResult.recordsFailed;

      const endTime = Date.now();
      const performanceMetrics = {
        executionTimeMs: endTime - startTime,
        recordsPerSecond: recordsProcessed / ((endTime - startTime) / 1000),
        successRate: recordsProcessed > 0 ? (recordsSuccessful / recordsProcessed) * 100 : 0
      };

      return {
        executionId,
        recordsProcessed,
        recordsSuccessful,
        recordsFailed,
        performanceMetrics,
        details: loadResult.details
      };
    } catch (error) {
      console.error('Sync execution failed:', error);
      throw error;
    }
  }

  /**
   * Extract data from source
   */
  async extractData(sourceConfig, dataFormat, options = {}) {
    // This is a simplified implementation
    // In a real-world scenario, you would implement specific extractors for different source types
    
    switch (sourceConfig.type) {
      case 'database':
        return await this.extractFromDatabase(sourceConfig, options);
      case 'api':
        return await this.extractFromAPI(sourceConfig, options);
      case 'file':
        return await this.extractFromFile(sourceConfig, dataFormat, options);
      default:
        throw new Error(`Unsupported source type: ${sourceConfig.type}`);
    }
  }

  /**
   * Transform data according to transformation rules
   */
  async transformData(data, transformationRules) {
    // Apply transformation rules to the data
    // This is a simplified implementation
    
    if (!Array.isArray(data)) {
      data = [data];
    }

    return data.map(record => {
      let transformedRecord = { ...record };

      if (transformationRules.mappings) {
        transformationRules.mappings.forEach(mapping => {
          if (mapping.type === 'direct' && record[mapping.source] !== undefined) {
            transformedRecord[mapping.target] = record[mapping.source];
            if (mapping.source !== mapping.target) {
              delete transformedRecord[mapping.source];
            }
          }
        });
      }

      return transformedRecord;
    });
  }

  /**
   * Load data to target
   */
  async loadData(data, targetConfig, dataFormat, conflictStrategy, executionId, jobId) {
    const client = await this.pool.connect();
    try {
      let recordsProcessed = 0;
      let recordsSuccessful = 0;
      let recordsFailed = 0;
      const details = [];

      if (!Array.isArray(data)) {
        data = [data];
      }

      for (const record of data) {
        recordsProcessed++;
        try {
          // Log the sync operation
          await this.logSyncOperation(
            client, jobId, executionId, 'insert', 
            record.id || recordsProcessed.toString(), 
            null, record, null, 'success'
          );
          
          recordsSuccessful++;
          details.push({ record: record.id || recordsProcessed, status: 'success' });
        } catch (error) {
          recordsFailed++;
          details.push({ 
            record: record.id || recordsProcessed, 
            status: 'failed', 
            error: error.message 
          });

          await this.logSyncOperation(
            client, jobId, executionId, 'insert',
            record.id || recordsProcessed.toString(),
            null, record, null, 'failed', error.message
          );
        }
      }

      return {
        recordsProcessed,
        recordsSuccessful,
        recordsFailed,
        details
      };
    } finally {
      client.release();
    }
  }

  /**
   * Log sync operation to history
   */
  async logSyncOperation(client, jobId, executionId, operationType, recordId, sourceData, targetData, transformationApplied, status, errorMessage = null) {
    const query = `
      INSERT INTO data_sync_history (
        job_id, execution_id, operation_type, record_identifier,
        source_data, target_data, transformation_applied, status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    const values = [
      jobId, executionId, operationType, recordId,
      sourceData, targetData, transformationApplied, status, errorMessage
    ];

    await client.query(query, values);
  }

  /**
   * Extract data from database
   */
  async extractFromDatabase(sourceConfig, options = {}) {
    // Simplified database extraction
    // In practice, you would connect to the specific database and execute queries
    return [
      { id: '1', name: 'Sample Record 1', email: 'sample1@example.com' },
      { id: '2', name: 'Sample Record 2', email: 'sample2@example.com' }
    ];
  }

  /**
   * Extract data from API
   */
  async extractFromAPI(sourceConfig, options = {}) {
    // Simplified API extraction
    // In practice, you would make HTTP requests to the API
    return [
      { id: '1', name: 'API Record 1', email: 'api1@example.com' },
      { id: '2', name: 'API Record 2', email: 'api2@example.com' }
    ];
  }

  /**
   * Extract data from file
   */
  async extractFromFile(sourceConfig, dataFormat, options = {}) {
    // Simplified file extraction
    // In practice, you would read and parse files based on format
    return [
      { id: '1', name: 'File Record 1', email: 'file1@example.com' },
      { id: '2', name: 'File Record 2', email: 'file2@example.com' }
    ];
  }

  /**
   * Process scheduled synchronizations
   */
  async processScheduledSyncs() {
    const client = await this.pool.connect();
    try {
      // Find jobs that need to be executed based on schedule
      const query = `
        SELECT job_id, job_name, sync_schedule
        FROM data_sync_jobs
        WHERE status = 'pending' 
        AND sync_schedule IS NOT NULL
        AND sync_schedule != ''
      `;

      const result = await client.query(query);
      
      for (const job of result.rows) {
        try {
          // Simple schedule check - in practice, you would use a proper cron parser
          if (this.shouldExecuteJob(job.sync_schedule)) {
            await this.executeSyncJob(job.job_id);
          }
        } catch (error) {
          console.error(`Failed to execute scheduled job ${job.job_id}:`, error);
        }
      }
    } finally {
      client.release();
    }
  }

  /**
   * Check if a job should be executed based on its schedule
   */
  shouldExecuteJob(schedule) {
    // Simplified schedule checking
    // In practice, you would implement proper cron expression parsing
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Example: execute hourly jobs at the top of the hour
    if (schedule === 'hourly' && currentMinute === 0) {
      return true;
    }

    // Example: execute daily jobs at midnight
    if (schedule === 'daily' && currentHour === 0 && currentMinute === 0) {
      return true;
    }

    return false;
  }

  /**
   * Get synchronization status
   */
  async getSyncStatus(jobId) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT sj.*, 
               src.source_name, tgt.source_name as target_name
        FROM data_sync_jobs sj
        JOIN data_sources_registry src ON sj.source_id = src.source_id
        JOIN data_sources_registry tgt ON sj.target_id = tgt.source_id
        WHERE sj.job_id = $1
      `;

      const result = await client.query(query, [jobId]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Get sync history for a job
   */
  async getSyncHistory(jobId, limit = 100) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM data_sync_history
        WHERE job_id = $1
        ORDER BY processed_at DESC
        LIMIT $2
      `;

      const result = await client.query(query, [jobId, limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel a running sync job
   */
  async cancelSyncJob(jobId) {
    const client = await this.pool.connect();
    try {
      await client.query(
        'UPDATE data_sync_jobs SET status = $1, completed_at = $2 WHERE job_id = $3 AND status = $4',
        ['cancelled', new Date(), jobId, 'running']
      );

      this.activeSyncJobs.delete(jobId);
      this.emit('syncJobCancelled', { jobId });

      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Get all data sources
   */
  async getDataSources(filters = {}) {
    const client = await this.pool.connect();
    try {
      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (filters.source_type) {
        paramCount++;
        whereConditions.push(`source_type = $${paramCount}`);
        queryParams.push(filters.source_type);
      }

      if (filters.sync_status) {
        paramCount++;
        whereConditions.push(`sync_status = $${paramCount}`);
        queryParams.push(filters.sync_status);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT * FROM data_sources_registry
        ${whereClause}
        ORDER BY priority_level ASC, source_name ASC
      `;

      const result = await client.query(query, queryParams);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Update data source sync status
   */
  async updateDataSourceStatus(sourceId, status, errorMessage = null) {
    const client = await this.pool.connect();
    try {
      const query = `
        UPDATE data_sources_registry 
        SET sync_status = $1, last_sync_timestamp = $2, last_error_message = $3,
            error_count = CASE WHEN $1 = 'error' THEN error_count + 1 ELSE 0 END,
            updated_at = $2
        WHERE source_id = $4
        RETURNING *
      `;

      const values = [status, new Date(), errorMessage, sourceId];
      const result = await client.query(query, values);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Cleanup old sync history records
   */
  async cleanupSyncHistory(retentionDays = 30) {
    const client = await this.pool.connect();
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const query = `
        DELETE FROM data_sync_history
        WHERE processed_at < $1
      `;

      const result = await client.query(query, [cutoffDate]);
      console.log(`Cleaned up ${result.rowCount} old sync history records`);
      
      return result.rowCount;
    } finally {
      client.release();
    }
  }
}

module.exports = DataSynchronizationService;