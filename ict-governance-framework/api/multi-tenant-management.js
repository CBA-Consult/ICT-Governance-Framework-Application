/**
 * Multi-Tenant Management API
 * Multi-Cloud Multi-Tenant ICT Governance Framework
 * 
 * Provides comprehensive tenant lifecycle management including:
 * - Tenant onboarding and provisioning
 * - Tenant configuration and customization
 * - Tenant monitoring and compliance
 * - Tenant offboarding and cleanup
 */

const express = require('express');
const router = express.Router();

/**
 * Tenant classification types
 */
const TENANT_CLASSIFICATIONS = {
  ENTERPRISE: 'enterprise',
  GOVERNMENT: 'government',
  HEALTHCARE: 'healthcare',
  FINANCIAL: 'financial',
  STANDARD: 'standard'
};

/**
 * Tenant isolation models
 */
const ISOLATION_MODELS = {
  SILO: 'silo',      // Complete isolation with dedicated resources
  POOL: 'pool',      // Shared resources with logical isolation
  HYBRID: 'hybrid'   // Mix of dedicated and shared resources
};

/**
 * Service tiers
 */
const SERVICE_TIERS = {
  PREMIUM: 'premium',
  STANDARD: 'standard',
  BASIC: 'basic'
};

/**
 * Tenant lifecycle states
 */
const TENANT_STATES = {
  PENDING: 'pending',
  PROVISIONING: 'provisioning',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEPROVISIONING: 'deprovisioning',
  ARCHIVED: 'archived'
};

/**
 * GET /api/tenants
 * List all tenants with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { 
      classification, 
      state, 
      serviceTier, 
      cloudProvider,
      page = 1, 
      limit = 50 
    } = req.query;

    const pool = req.app.get('pool');
    
    let query = `
      SELECT 
        t.tenant_id,
        t.tenant_name,
        t.tenant_classification,
        t.isolation_model,
        t.service_tier,
        t.tenant_state,
        t.primary_cloud_provider,
        t.created_date,
        t.last_updated,
        COUNT(DISTINCT tr.resource_id) as resource_count,
        SUM(tc.monthly_cost) as monthly_cost
      FROM tenants t
      LEFT JOIN tenant_resources tr ON t.tenant_id = tr.tenant_id
      LEFT JOIN tenant_costs tc ON t.tenant_id = tc.tenant_id 
        AND tc.month = DATE_TRUNC('month', CURRENT_DATE)
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (classification) {
      query += ` AND t.tenant_classification = $${paramIndex++}`;
      params.push(classification);
    }

    if (state) {
      query += ` AND t.tenant_state = $${paramIndex++}`;
      params.push(state);
    }

    if (serviceTier) {
      query += ` AND t.service_tier = $${paramIndex++}`;
      params.push(serviceTier);
    }

    if (cloudProvider) {
      query += ` AND t.primary_cloud_provider = $${paramIndex++}`;
      params.push(cloudProvider);
    }

    query += `
      GROUP BY t.tenant_id, t.tenant_name, t.tenant_classification, 
               t.isolation_model, t.service_tier, t.tenant_state,
               t.primary_cloud_provider, t.created_date, t.last_updated
      ORDER BY t.created_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM tenants WHERE 1=1`;
    const countResult = await pool.query(countQuery);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tenants',
      message: error.message 
    });
  }
});

/**
 * GET /api/tenants/:tenantId
 * Get detailed information about a specific tenant
 */
router.get('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const pool = req.app.get('pool');

    const query = `
      SELECT 
        t.*,
        json_agg(DISTINCT jsonb_build_object(
          'resource_id', tr.resource_id,
          'resource_type', tr.resource_type,
          'cloud_provider', tr.cloud_provider,
          'status', tr.status
        )) as resources,
        json_agg(DISTINCT jsonb_build_object(
          'requirement', tcr.compliance_requirement,
          'status', tcr.compliance_status,
          'last_check', tcr.last_check_date
        )) as compliance_status
      FROM tenants t
      LEFT JOIN tenant_resources tr ON t.tenant_id = tr.tenant_id
      LEFT JOIN tenant_compliance_requirements tcr ON t.tenant_id = tcr.tenant_id
      WHERE t.tenant_id = $1
      GROUP BY t.tenant_id
    `;

    const result = await pool.query(query, [tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tenant not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tenant details',
      message: error.message 
    });
  }
});

/**
 * POST /api/tenants
 * Create and onboard a new tenant
 */
router.post('/', async (req, res) => {
  try {
    const {
      tenantName,
      tenantClassification = TENANT_CLASSIFICATIONS.STANDARD,
      isolationModel = ISOLATION_MODELS.POOL,
      serviceTier = SERVICE_TIERS.STANDARD,
      primaryCloudProvider = 'azure',
      secondaryCloudProvider = null,
      tenantAdminEmail,
      tenantCostCenter,
      complianceRequirements = ['ISO27001'],
      dataResidency = 'none',
      enableAdvancedMonitoring = true,
      enableBackupDR = true,
      customConfiguration = {}
    } = req.body;

    // Validate required fields
    if (!tenantName || !tenantAdminEmail || !tenantCostCenter) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: tenantName, tenantAdminEmail, tenantCostCenter' 
      });
    }

    const pool = req.app.get('pool');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate tenant ID
      const tenantId = `tenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Insert tenant
      const insertQuery = `
        INSERT INTO tenants (
          tenant_id, tenant_name, tenant_classification, isolation_model,
          service_tier, tenant_state, primary_cloud_provider, 
          secondary_cloud_provider, tenant_admin_email, tenant_cost_center,
          data_residency, enable_advanced_monitoring, enable_backup_dr,
          custom_configuration, created_date, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        RETURNING *
      `;

      const insertValues = [
        tenantId, tenantName, tenantClassification, isolationModel,
        serviceTier, TENANT_STATES.PENDING, primaryCloudProvider,
        secondaryCloudProvider, tenantAdminEmail, tenantCostCenter,
        dataResidency, enableAdvancedMonitoring, enableBackupDR,
        JSON.stringify(customConfiguration)
      ];

      const result = await client.query(insertQuery, insertValues);
      const tenant = result.rows[0];

      // Insert compliance requirements
      for (const requirement of complianceRequirements) {
        await client.query(`
          INSERT INTO tenant_compliance_requirements (
            tenant_id, compliance_requirement, compliance_status, last_check_date
          ) VALUES ($1, $2, $3, NOW())
        `, [tenantId, requirement, 'pending']);
      }

      // Create audit log entry
      await client.query(`
        INSERT INTO tenant_audit_log (
          tenant_id, action, performed_by, details, timestamp
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [
        tenantId, 
        'tenant_created', 
        req.user?.email || 'system',
        JSON.stringify({ tenantName, classification: tenantClassification })
      ]);

      await client.query('COMMIT');

      // Trigger asynchronous provisioning workflow
      // This would be handled by a separate service/queue in production
      console.log(`Tenant ${tenantId} created, triggering provisioning workflow...`);

      res.status(201).json({
        success: true,
        message: 'Tenant created successfully',
        data: tenant
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create tenant',
      message: error.message 
    });
  }
});

/**
 * PUT /api/tenants/:tenantId
 * Update tenant configuration
 */
router.put('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const updates = req.body;

    const pool = req.app.get('pool');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Build dynamic update query
      const allowedFields = [
        'tenant_name', 'tenant_classification', 'service_tier',
        'tenant_admin_email', 'tenant_cost_center', 'data_residency',
        'enable_advanced_monitoring', 'enable_backup_dr', 'custom_configuration'
      ];

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = $${paramIndex++}`);
          values.push(typeof value === 'object' ? JSON.stringify(value) : value);
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No valid fields to update' 
        });
      }

      updateFields.push(`last_updated = NOW()`);
      values.push(tenantId);

      const updateQuery = `
        UPDATE tenants 
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(updateQuery, values);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ 
          success: false, 
          error: 'Tenant not found' 
        });
      }

      // Create audit log entry
      await client.query(`
        INSERT INTO tenant_audit_log (
          tenant_id, action, performed_by, details, timestamp
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [
        tenantId, 
        'tenant_updated', 
        req.user?.email || 'system',
        JSON.stringify(updates)
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Tenant updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update tenant',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/tenants/:tenantId
 * Initiate tenant offboarding and cleanup
 */
router.delete('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { force = false } = req.query;

    const pool = req.app.get('pool');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if tenant exists
      const checkResult = await client.query(
        'SELECT * FROM tenants WHERE tenant_id = $1',
        [tenantId]
      );

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ 
          success: false, 
          error: 'Tenant not found' 
        });
      }

      const tenant = checkResult.rows[0];

      // Update tenant state to deprovisioning
      await client.query(`
        UPDATE tenants 
        SET tenant_state = $1, last_updated = NOW()
        WHERE tenant_id = $2
      `, [TENANT_STATES.DEPROVISIONING, tenantId]);

      // Create audit log entry
      await client.query(`
        INSERT INTO tenant_audit_log (
          tenant_id, action, performed_by, details, timestamp
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [
        tenantId, 
        'tenant_offboarding_initiated', 
        req.user?.email || 'system',
        JSON.stringify({ force, previousState: tenant.tenant_state })
      ]);

      await client.query('COMMIT');

      // Trigger asynchronous deprovisioning workflow
      console.log(`Tenant ${tenantId} offboarding initiated...`);

      res.json({
        success: true,
        message: 'Tenant offboarding initiated',
        data: {
          tenantId,
          state: TENANT_STATES.DEPROVISIONING,
          estimatedCompletionTime: '2-4 hours'
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error offboarding tenant:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate tenant offboarding',
      message: error.message 
    });
  }
});

/**
 * POST /api/tenants/:tenantId/suspend
 * Suspend tenant operations
 */
router.post('/:tenantId/suspend', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    const pool = req.app.get('pool');
    
    const result = await pool.query(`
      UPDATE tenants 
      SET tenant_state = $1, last_updated = NOW()
      WHERE tenant_id = $2 AND tenant_state = $3
      RETURNING *
    `, [TENANT_STATES.SUSPENDED, tenantId, TENANT_STATES.ACTIVE]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tenant not found or not in active state' 
      });
    }

    // Create audit log entry
    await pool.query(`
      INSERT INTO tenant_audit_log (
        tenant_id, action, performed_by, details, timestamp
      ) VALUES ($1, $2, $3, $4, NOW())
    `, [
      tenantId, 
      'tenant_suspended', 
      req.user?.email || 'system',
      JSON.stringify({ reason })
    ]);

    res.json({
      success: true,
      message: 'Tenant suspended successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error suspending tenant:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to suspend tenant',
      message: error.message 
    });
  }
});

/**
 * POST /api/tenants/:tenantId/activate
 * Reactivate suspended tenant
 */
router.post('/:tenantId/activate', async (req, res) => {
  try {
    const { tenantId } = req.params;

    const pool = req.app.get('pool');
    
    const result = await pool.query(`
      UPDATE tenants 
      SET tenant_state = $1, last_updated = NOW()
      WHERE tenant_id = $2 AND tenant_state = $3
      RETURNING *
    `, [TENANT_STATES.ACTIVE, tenantId, TENANT_STATES.SUSPENDED]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tenant not found or not in suspended state' 
      });
    }

    // Create audit log entry
    await pool.query(`
      INSERT INTO tenant_audit_log (
        tenant_id, action, performed_by, details, timestamp
      ) VALUES ($1, $2, $3, $4, NOW())
    `, [
      tenantId, 
      'tenant_activated', 
      req.user?.email || 'system',
      JSON.stringify({})
    ]);

    res.json({
      success: true,
      message: 'Tenant activated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error activating tenant:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to activate tenant',
      message: error.message 
    });
  }
});

/**
 * GET /api/tenants/:tenantId/resources
 * Get all resources allocated to a tenant
 */
router.get('/:tenantId/resources', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { cloudProvider, resourceType } = req.query;

    const pool = req.app.get('pool');
    
    let query = `
      SELECT * FROM tenant_resources 
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (cloudProvider) {
      query += ` AND cloud_provider = $${paramIndex++}`;
      params.push(cloudProvider);
    }

    if (resourceType) {
      query += ` AND resource_type = $${paramIndex++}`;
      params.push(resourceType);
    }

    query += ` ORDER BY created_date DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching tenant resources:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tenant resources',
      message: error.message 
    });
  }
});

/**
 * GET /api/tenants/:tenantId/costs
 * Get tenant cost and billing information
 */
router.get('/:tenantId/costs', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate } = req.query;

    const pool = req.app.get('pool');
    
    let query = `
      SELECT 
        month,
        monthly_cost,
        cost_breakdown,
        budget_limit,
        CASE 
          WHEN budget_limit > 0 THEN (monthly_cost / budget_limit * 100)
          ELSE 0 
        END as budget_utilization
      FROM tenant_costs 
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND month >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND month <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` ORDER BY month DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching tenant costs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tenant costs',
      message: error.message 
    });
  }
});

/**
 * GET /api/tenants/:tenantId/audit-log
 * Get tenant audit log
 */
router.get('/:tenantId/audit-log', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate, action, page = 1, limit = 100 } = req.query;

    const pool = req.app.get('pool');
    
    let query = `
      SELECT * FROM tenant_audit_log 
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND timestamp >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramIndex++}`;
      params.push(endDate);
    }

    if (action) {
      query += ` AND action = $${paramIndex++}`;
      params.push(action);
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch audit log',
      message: error.message 
    });
  }
});

module.exports = router;
