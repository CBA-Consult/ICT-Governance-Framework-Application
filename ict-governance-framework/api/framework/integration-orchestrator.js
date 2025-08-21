// File: ict-governance-framework/api/framework/integration-orchestrator.js
// Integration Orchestrator for managing complex enterprise workflows

const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

/**
 * Integration Orchestrator
 * Manages complex integration workflows and data synchronization across enterprise systems
 */
class IntegrationOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxConcurrentWorkflows: 10,
      workflowTimeout: 300000, // 5 minutes
      retryAttempts: 3,
      retryDelay: 5000,
      enablePersistence: true,
      enableMetrics: true,
      ...options
    };
    
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.workflows = new Map();
    this.activeExecutions = new Map();
    this.integrationAdapters = new Map();
    this.metrics = new Map();
    
    this.initializeOrchestrator();
  }

  /**
   * Initialize orchestrator and load workflows
   */
  async initializeOrchestrator() {
    try {
      await this.createWorkflowTables();
      await this.loadWorkflows();
      await this.resumePendingExecutions();
      console.log('Integration Orchestrator initialized');
    } catch (error) {
      console.error('Failed to initialize Integration Orchestrator:', error);
    }
  }

  /**
   * Create database tables for workflow persistence
   */
  async createWorkflowTables() {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS integration_workflows (
          workflow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          definition JSONB NOT NULL,
          version VARCHAR(20) DEFAULT '1.0.0',
          status VARCHAR(20) DEFAULT 'active',
          created_by VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS workflow_executions (
          execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          workflow_id UUID REFERENCES integration_workflows(workflow_id) ON DELETE CASCADE,
          status VARCHAR(20) DEFAULT 'pending',
          input_data JSONB,
          output_data JSONB,
          error_details JSONB,
          started_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP,
          correlation_id UUID,
          triggered_by VARCHAR(100),
          execution_context JSONB
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS workflow_steps (
          step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          execution_id UUID REFERENCES workflow_executions(execution_id) ON DELETE CASCADE,
          step_name VARCHAR(100) NOT NULL,
          step_type VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          input_data JSONB,
          output_data JSONB,
          error_details JSONB,
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          retry_count INTEGER DEFAULT 0,
          step_order INTEGER NOT NULL
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS integration_mappings (
          mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_system VARCHAR(100) NOT NULL,
          target_system VARCHAR(100) NOT NULL,
          mapping_type VARCHAR(50) NOT NULL,
          field_mappings JSONB NOT NULL,
          transformation_rules JSONB,
          validation_rules JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log('Workflow tables created successfully');
    } finally {
      client.release();
    }
  }

  /**
   * Load workflows from database
   */
  async loadWorkflows() {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM integration_workflows 
        WHERE status = 'active'
        ORDER BY name
      `);

      for (const row of result.rows) {
        this.workflows.set(row.name, {
          id: row.workflow_id,
          name: row.name,
          description: row.description,
          definition: row.definition,
          version: row.version,
          status: row.status,
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        });
      }

      console.log(`Loaded ${result.rows.length} workflows`);
    } finally {
      client.release();
    }
  }

  /**
   * Resume pending workflow executions
   */
  async resumePendingExecutions() {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT we.*, iw.name as workflow_name, iw.definition
        FROM workflow_executions we
        JOIN integration_workflows iw ON we.workflow_id = iw.workflow_id
        WHERE we.status IN ('pending', 'running')
        ORDER BY we.started_at
      `);

      for (const execution of result.rows) {
        console.log(`Resuming workflow execution: ${execution.execution_id}`);
        this.resumeExecution(execution);
      }

      console.log(`Resumed ${result.rows.length} pending executions`);
    } finally {
      client.release();
    }
  }

  /**
   * Register workflow definition
   */
  async registerWorkflow(workflowDefinition) {
    this.validateWorkflowDefinition(workflowDefinition);
    
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO integration_workflows (
          name, description, definition, version, created_by
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name) 
        DO UPDATE SET 
          description = $2,
          definition = $3,
          version = $4,
          updated_at = NOW()
        RETURNING workflow_id
      `, [
        workflowDefinition.name,
        workflowDefinition.description,
        JSON.stringify(workflowDefinition),
        workflowDefinition.version || '1.0.0',
        workflowDefinition.createdBy || 'system'
      ]);

      const workflowId = result.rows[0].workflow_id;
      
      // Cache the workflow
      this.workflows.set(workflowDefinition.name, {
        id: workflowId,
        ...workflowDefinition
      });

      console.log(`Registered workflow: ${workflowDefinition.name}`);
      return workflowId;

    } finally {
      client.release();
    }
  }

  /**
   * Validate workflow definition
   */
  validateWorkflowDefinition(definition) {
    const required = ['name', 'steps'];
    for (const field of required) {
      if (!definition[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(definition.steps) || definition.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    for (const step of definition.steps) {
      if (!step.name || !step.type) {
        throw new Error('Each step must have name and type');
      }
    }
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowName, inputData = {}, context = {}) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }

    const executionId = uuidv4();
    const correlationId = context.correlationId || uuidv4();

    // Check concurrent execution limit
    if (this.activeExecutions.size >= this.options.maxConcurrentWorkflows) {
      throw new Error('Maximum concurrent workflows reached');
    }

    // Create execution record
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        INSERT INTO workflow_executions (
          execution_id, workflow_id, input_data, correlation_id, 
          triggered_by, execution_context
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        executionId,
        workflow.id,
        JSON.stringify(inputData),
        correlationId,
        context.triggeredBy || 'api',
        JSON.stringify(context)
      ]);

      // Start execution
      const execution = {
        id: executionId,
        workflowId: workflow.id,
        workflowName,
        definition: workflow.definition,
        inputData,
        context,
        correlationId,
        status: 'running',
        currentStep: 0,
        stepResults: {},
        startedAt: new Date(),
        timeout: setTimeout(() => this.timeoutExecution(executionId), this.options.workflowTimeout)
      };

      this.activeExecutions.set(executionId, execution);
      
      // Update status to running
      await client.query(`
        UPDATE workflow_executions 
        SET status = 'running' 
        WHERE execution_id = $1
      `, [executionId]);

      console.log(`Started workflow execution: ${executionId} for workflow: ${workflowName}`);
      
      // Execute asynchronously
      this.executeSteps(execution).catch(error => {
        console.error(`Workflow execution failed: ${executionId}`, error);
      });

      return {
        executionId,
        correlationId,
        status: 'running',
        startedAt: execution.startedAt
      };

    } finally {
      client.release();
    }
  }

  /**
   * Execute workflow steps
   */
  async executeSteps(execution) {
    try {
      const steps = execution.definition.steps;
      
      for (let i = execution.currentStep; i < steps.length; i++) {
        const step = steps[i];
        execution.currentStep = i;
        
        console.log(`Executing step ${i + 1}/${steps.length}: ${step.name} (${execution.id})`);
        
        const stepResult = await this.executeStep(execution, step, i);
        execution.stepResults[step.name] = stepResult;
        
        // Check for conditional execution
        if (step.condition && !this.evaluateCondition(step.condition, execution.stepResults)) {
          console.log(`Skipping remaining steps due to condition: ${step.condition}`);
          break;
        }
        
        // Check for early termination
        if (stepResult.terminate) {
          console.log(`Workflow terminated early by step: ${step.name}`);
          break;
        }
      }
      
      await this.completeExecution(execution, 'completed');
      
    } catch (error) {
      await this.completeExecution(execution, 'failed', error);
    }
  }

  /**
   * Execute individual step
   */
  async executeStep(execution, step, stepOrder) {
    const stepId = uuidv4();
    const startTime = Date.now();
    
    // Create step record
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        INSERT INTO workflow_steps (
          step_id, execution_id, step_name, step_type, 
          input_data, step_order, started_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        stepId,
        execution.id,
        step.name,
        step.type,
        JSON.stringify(step.input || {}),
        stepOrder
      ]);

      let result;
      let retryCount = 0;
      const maxRetries = step.retryAttempts || this.options.retryAttempts;

      while (retryCount <= maxRetries) {
        try {
          result = await this.executeStepAction(execution, step);
          break;
        } catch (error) {
          retryCount++;
          
          if (retryCount > maxRetries) {
            throw error;
          }
          
          console.log(`Step ${step.name} failed, retrying (${retryCount}/${maxRetries})`);
          await this.sleep(this.options.retryDelay * retryCount);
          
          // Update retry count
          await client.query(`
            UPDATE workflow_steps 
            SET retry_count = $1 
            WHERE step_id = $2
          `, [retryCount, stepId]);
        }
      }

      // Update step completion
      await client.query(`
        UPDATE workflow_steps 
        SET status = 'completed', output_data = $1, completed_at = NOW()
        WHERE step_id = $2
      `, [JSON.stringify(result), stepId]);

      this.recordStepMetrics(step.type, Date.now() - startTime, true);
      
      return result;

    } catch (error) {
      // Update step failure
      await client.query(`
        UPDATE workflow_steps 
        SET status = 'failed', error_details = $1, completed_at = NOW()
        WHERE step_id = $2
      `, [JSON.stringify({ message: error.message, stack: error.stack }), stepId]);

      this.recordStepMetrics(step.type, Date.now() - startTime, false);
      
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute step action based on type
   */
  async executeStepAction(execution, step) {
    switch (step.type) {
      case 'integration':
        return await this.executeIntegrationStep(execution, step);
      
      case 'transformation':
        return await this.executeTransformationStep(execution, step);
      
      case 'validation':
        return await this.executeValidationStep(execution, step);
      
      case 'notification':
        return await this.executeNotificationStep(execution, step);
      
      case 'condition':
        return await this.executeConditionStep(execution, step);
      
      case 'parallel':
        return await this.executeParallelStep(execution, step);
      
      case 'delay':
        return await this.executeDelayStep(execution, step);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute integration step
   */
  async executeIntegrationStep(execution, step) {
    const { adapter, operation, parameters } = step.config;
    
    if (!this.integrationAdapters.has(adapter)) {
      throw new Error(`Integration adapter not found: ${adapter}`);
    }
    
    const adapterInstance = this.integrationAdapters.get(adapter);
    const resolvedParams = this.resolveParameters(parameters, execution);
    
    const result = await adapterInstance.execute(operation, resolvedParams);
    
    return {
      adapter,
      operation,
      result,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute transformation step
   */
  async executeTransformationStep(execution, step) {
    const { sourceData, mappings, transformations } = step.config;
    const data = this.resolveParameters(sourceData, execution);
    
    let transformedData = { ...data };
    
    // Apply field mappings
    if (mappings) {
      transformedData = this.applyFieldMappings(transformedData, mappings);
    }
    
    // Apply transformations
    if (transformations) {
      transformedData = this.applyTransformations(transformedData, transformations);
    }
    
    return {
      originalData: data,
      transformedData,
      mappingsApplied: !!mappings,
      transformationsApplied: !!transformations
    };
  }

  /**
   * Execute validation step
   */
  async executeValidationStep(execution, step) {
    const { data, rules } = step.config;
    const resolvedData = this.resolveParameters(data, execution);
    
    const validationResults = [];
    
    for (const rule of rules) {
      const result = this.validateRule(resolvedData, rule);
      validationResults.push(result);
    }
    
    const isValid = validationResults.every(r => r.valid);
    
    if (!isValid && step.config.failOnValidationError) {
      throw new Error(`Validation failed: ${validationResults.filter(r => !r.valid).map(r => r.message).join(', ')}`);
    }
    
    return {
      isValid,
      validationResults,
      data: resolvedData
    };
  }

  /**
   * Execute notification step
   */
  async executeNotificationStep(execution, step) {
    const { type, recipients, template, data } = step.config;
    const resolvedData = this.resolveParameters(data, execution);
    
    // Emit notification event
    this.emit('notification', {
      type,
      recipients,
      template,
      data: resolvedData,
      executionId: execution.id,
      correlationId: execution.correlationId
    });
    
    return {
      type,
      recipients,
      sent: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute condition step
   */
  async executeConditionStep(execution, step) {
    const { condition } = step.config;
    const result = this.evaluateCondition(condition, execution.stepResults);
    
    return {
      condition,
      result,
      terminate: !result && step.config.terminateOnFalse
    };
  }

  /**
   * Execute parallel step
   */
  async executeParallelStep(execution, step) {
    const { steps } = step.config;
    const promises = steps.map(parallelStep => 
      this.executeStepAction(execution, parallelStep)
    );
    
    const results = await Promise.allSettled(promises);
    
    return {
      parallelResults: results.map((result, index) => ({
        stepName: steps[index].name,
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    };
  }

  /**
   * Execute delay step
   */
  async executeDelayStep(execution, step) {
    const { duration } = step.config;
    await this.sleep(duration);
    
    return {
      delayed: true,
      duration,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Resolve parameters with context
   */
  resolveParameters(parameters, execution) {
    if (typeof parameters === 'string') {
      return this.interpolateString(parameters, execution);
    }
    
    if (Array.isArray(parameters)) {
      return parameters.map(param => this.resolveParameters(param, execution));
    }
    
    if (typeof parameters === 'object' && parameters !== null) {
      const resolved = {};
      for (const [key, value] of Object.entries(parameters)) {
        resolved[key] = this.resolveParameters(value, execution);
      }
      return resolved;
    }
    
    return parameters;
  }

  /**
   * Interpolate string with execution context
   */
  interpolateString(str, execution) {
    return str.replace(/\$\{([^}]+)\}/g, (match, path) => {
      const value = this.getValueByPath(execution, path);
      return value !== undefined ? value : match;
    });
  }

  /**
   * Get value by dot notation path
   */
  getValueByPath(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Apply field mappings
   */
  applyFieldMappings(data, mappings) {
    const mapped = {};
    
    for (const [targetField, sourceField] of Object.entries(mappings)) {
      const value = this.getValueByPath(data, sourceField);
      if (value !== undefined) {
        this.setValueByPath(mapped, targetField, value);
      }
    }
    
    return mapped;
  }

  /**
   * Set value by dot notation path
   */
  setValueByPath(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  /**
   * Apply transformations
   */
  applyTransformations(data, transformations) {
    let result = { ...data };
    
    for (const transformation of transformations) {
      switch (transformation.type) {
        case 'uppercase':
          result[transformation.field] = result[transformation.field]?.toUpperCase();
          break;
        case 'lowercase':
          result[transformation.field] = result[transformation.field]?.toLowerCase();
          break;
        case 'date_format':
          result[transformation.field] = new Date(result[transformation.field]).toISOString();
          break;
        case 'default_value':
          if (!result[transformation.field]) {
            result[transformation.field] = transformation.value;
          }
          break;
      }
    }
    
    return result;
  }

  /**
   * Validate rule
   */
  validateRule(data, rule) {
    switch (rule.type) {
      case 'required':
        return {
          valid: data[rule.field] !== undefined && data[rule.field] !== null && data[rule.field] !== '',
          message: `Field ${rule.field} is required`
        };
      
      case 'type':
        return {
          valid: typeof data[rule.field] === rule.expectedType,
          message: `Field ${rule.field} must be of type ${rule.expectedType}`
        };
      
      case 'range':
        const value = data[rule.field];
        return {
          valid: value >= rule.min && value <= rule.max,
          message: `Field ${rule.field} must be between ${rule.min} and ${rule.max}`
        };
      
      default:
        return { valid: true, message: 'Unknown validation rule' };
    }
  }

  /**
   * Evaluate condition
   */
  evaluateCondition(condition, stepResults) {
    // Simple condition evaluation - can be extended
    try {
      const context = { stepResults };
      return Function('context', `with(context) { return ${condition}; }`)(context);
    } catch (error) {
      console.warn('Condition evaluation failed:', error.message);
      return false;
    }
  }

  /**
   * Complete workflow execution
   */
  async completeExecution(execution, status, error = null) {
    clearTimeout(execution.timeout);
    this.activeExecutions.delete(execution.id);
    
    const client = await this.pool.connect();
    
    try {
      const outputData = status === 'completed' ? execution.stepResults : null;
      const errorDetails = error ? { message: error.message, stack: error.stack } : null;
      
      await client.query(`
        UPDATE workflow_executions 
        SET status = $1, output_data = $2, error_details = $3, completed_at = NOW()
        WHERE execution_id = $4
      `, [status, JSON.stringify(outputData), JSON.stringify(errorDetails), execution.id]);

      const duration = Date.now() - execution.startedAt.getTime();
      this.recordWorkflowMetrics(execution.workflowName, duration, status === 'completed');

      this.emit('workflow-completed', {
        executionId: execution.id,
        workflowName: execution.workflowName,
        status,
        duration,
        error: error?.message
      });

      console.log(`Workflow execution ${status}: ${execution.id} (${duration}ms)`);

    } finally {
      client.release();
    }
  }

  /**
   * Timeout execution
   */
  async timeoutExecution(executionId) {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      await this.completeExecution(execution, 'timeout', new Error('Workflow execution timed out'));
    }
  }

  /**
   * Resume execution
   */
  async resumeExecution(executionData) {
    // Implementation for resuming interrupted executions
    console.log(`Resuming execution: ${executionData.execution_id}`);
    // This would reconstruct the execution state and continue from where it left off
  }

  /**
   * Record workflow metrics
   */
  recordWorkflowMetrics(workflowName, duration, success) {
    const key = workflowName;
    const existing = this.metrics.get(key) || {
      executions: 0,
      successes: 0,
      totalDuration: 0
    };

    existing.executions++;
    existing.totalDuration += duration;
    if (success) existing.successes++;

    this.metrics.set(key, existing);
  }

  /**
   * Record step metrics
   */
  recordStepMetrics(stepType, duration, success) {
    const key = `step:${stepType}`;
    const existing = this.metrics.get(key) || {
      executions: 0,
      successes: 0,
      totalDuration: 0
    };

    existing.executions++;
    existing.totalDuration += duration;
    if (success) existing.successes++;

    this.metrics.set(key, existing);
  }

  /**
   * Get orchestrator metrics
   */
  getMetrics() {
    const metrics = {};
    for (const [key, value] of this.metrics.entries()) {
      metrics[key] = {
        ...value,
        successRate: (value.successes / value.executions) * 100,
        avgDuration: value.totalDuration / value.executions
      };
    }
    return metrics;
  }

  /**
   * Register integration adapter
   */
  registerIntegrationAdapter(name, adapter) {
    this.integrationAdapters.set(name, adapter);
    console.log(`Registered integration adapter: ${name}`);
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = IntegrationOrchestrator;