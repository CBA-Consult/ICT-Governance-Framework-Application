// File: ict-governance-framework/api/dashboard-access.js
// API endpoints for managing dashboard access and permissions

const express = require('express');
const { Pool } = require('pg');
const { body, validationResult, query } = require('express-validator');

const { 
  authenticateToken, 
  requirePermissions, 
  requireRoles,
  logActivity 
} = require('../middleware/auth');

const { getUserDashboardPermissions } = require('../middleware/dashboardAuth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * GET /api/dashboard-access/permissions
 * Get current user's dashboard permissions
 */
router.get('/permissions', 
  authenticateToken,
  logActivity('dashboard_permissions_check', (req) => 'User checked their dashboard permissions'),
  async (req, res) => {
    try {
      const permissions = await getUserDashboardPermissions(req.user.user_id);
      
      res.json({
        success: true,
        data: {
          userId: req.user.user_id,
          dashboardAccess: permissions,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting dashboard permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard permissions'
      });
    }
  }
);

/**
 * GET /api/dashboard-access/permissions/:userId
 * Get specific user's dashboard permissions (admin only)
 */
router.get('/permissions/:userId',
  authenticateToken,
  requirePermissions(['user.read', 'dashboard.admin']),
  logActivity('dashboard_permissions_view', (req) => `Viewed dashboard permissions for user ${req.params.userId}`),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user exists
      const userQuery = 'SELECT user_id, username, email, first_name, last_name FROM users WHERE user_id = $1';
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userResult.rows[0];
      const permissions = await getUserDashboardPermissions(userId);
      
      res.json({
        success: true,
        data: {
          user,
          dashboardAccess: permissions,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting user dashboard permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user dashboard permissions'
      });
    }
  }
);

/**
 * POST /api/dashboard-access/grant
 * Grant dashboard access to users
 */
router.post('/grant',
  authenticateToken,
  requirePermissions(['user.manage_roles', 'dashboard.admin']),
  [
    body('userIds').isArray().withMessage('User IDs must be an array'),
    body('userIds.*').isString().withMessage('Each user ID must be a string'),
    body('dashboardTypes').isArray().withMessage('Dashboard types must be an array'),
    body('dashboardTypes.*').isIn(['executive', 'operational', 'compliance', 'analytics', 'export'])
      .withMessage('Invalid dashboard type'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
    body('expiresAt').optional().isISO8601().withMessage('Expiration date must be valid ISO 8601 date')
  ],
  logActivity('dashboard_access_grant', (req) => `Granted dashboard access to ${req.body.userIds.length} users`),
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

      const { userIds, dashboardTypes, reason, expiresAt } = req.body;
      
      await client.query('BEGIN');

      // Map dashboard types to permission IDs
      const dashboardPermissionMap = {
        executive: 'PERM_DASHBOARD_EXECUTIVE',
        operational: 'PERM_DASHBOARD_OPERATIONAL',
        compliance: 'PERM_DASHBOARD_COMPLIANCE',
        analytics: 'PERM_DASHBOARD_ANALYTICS',
        export: 'PERM_DASHBOARD_EXPORT'
      };

      const results = [];

      for (const userId of userIds) {
        // Verify user exists
        const userQuery = 'SELECT user_id, username FROM users WHERE user_id = $1 AND status = $2';
        const userResult = await client.query(userQuery, [userId, 'Active']);
        
        if (userResult.rows.length === 0) {
          results.push({
            userId,
            success: false,
            message: 'User not found or inactive'
          });
          continue;
        }

        const user = userResult.rows[0];
        const grantedPermissions = [];

        for (const dashboardType of dashboardTypes) {
          const permissionId = dashboardPermissionMap[dashboardType];
          
          // Check if user already has this permission through any role
          const existingPermissionQuery = `
            SELECT ur.role_id, r.role_name
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.role_id
            JOIN role_permissions rp ON r.role_id = rp.role_id
            WHERE ur.user_id = $1 AND rp.permission_id = $2 AND ur.is_active = true AND rp.is_active = true
          `;
          
          const existingResult = await client.query(existingPermissionQuery, [userId, permissionId]);
          
          if (existingResult.rows.length > 0) {
            grantedPermissions.push({
              dashboardType,
              status: 'already_granted',
              viaRole: existingResult.rows[0].role_name
            });
            continue;
          }

          // Create a custom role for this dashboard access if needed
          const customRoleName = `dashboard_${dashboardType}_${userId}`;
          const customRoleId = `ROLE_CUSTOM_${dashboardType.toUpperCase()}_${userId}`;
          
          // Check if custom role already exists
          let roleQuery = 'SELECT role_id FROM roles WHERE role_id = $1';
          let roleResult = await client.query(roleQuery, [customRoleId]);
          
          if (roleResult.rows.length === 0) {
            // Create custom role
            const createRoleQuery = `
              INSERT INTO roles (role_id, role_name, display_name, description, role_type, created_by)
              VALUES ($1, $2, $3, $4, $5, $6)
            `;
            
            await client.query(createRoleQuery, [
              customRoleId,
              customRoleName,
              `${dashboardType.charAt(0).toUpperCase() + dashboardType.slice(1)} Dashboard Access`,
              `Custom role for ${dashboardType} dashboard access`,
              'Custom',
              req.user.user_id
            ]);

            // Assign permission to role
            const assignPermissionQuery = `
              INSERT INTO role_permissions (role_id, permission_id, granted_by)
              VALUES ($1, $2, $3)
            `;
            
            await client.query(assignPermissionQuery, [customRoleId, permissionId, req.user.user_id]);
          }

          // Assign role to user
          const assignRoleQuery = `
            INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at, assignment_reason)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, role_id) 
            DO UPDATE SET 
              is_active = true,
              assigned_by = $3,
              assigned_at = CURRENT_TIMESTAMP,
              expires_at = $4,
              assignment_reason = $5
          `;
          
          await client.query(assignRoleQuery, [
            userId,
            customRoleId,
            req.user.user_id,
            expiresAt || null,
            reason || `Dashboard access granted by ${req.user.username || req.user.user_id}`
          ]);

          grantedPermissions.push({
            dashboardType,
            status: 'granted',
            roleId: customRoleId
          });
        }

        results.push({
          userId,
          username: user.username,
          success: true,
          grantedPermissions
        });
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Dashboard access processing completed',
        data: {
          results,
          summary: {
            totalUsers: userIds.length,
            successfulGrants: results.filter(r => r.success).length,
            failedGrants: results.filter(r => !r.success).length
          }
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error granting dashboard access:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to grant dashboard access'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * POST /api/dashboard-access/revoke
 * Revoke dashboard access from users
 */
router.post('/revoke',
  authenticateToken,
  requirePermissions(['user.manage_roles', 'dashboard.admin']),
  [
    body('userIds').isArray().withMessage('User IDs must be an array'),
    body('userIds.*').isString().withMessage('Each user ID must be a string'),
    body('dashboardTypes').isArray().withMessage('Dashboard types must be an array'),
    body('dashboardTypes.*').isIn(['executive', 'operational', 'compliance', 'analytics', 'export'])
      .withMessage('Invalid dashboard type'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  logActivity('dashboard_access_revoke', (req) => `Revoked dashboard access from ${req.body.userIds.length} users`),
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

      const { userIds, dashboardTypes, reason } = req.body;
      
      await client.query('BEGIN');

      const results = [];

      for (const userId of userIds) {
        // Verify user exists
        const userQuery = 'SELECT user_id, username FROM users WHERE user_id = $1';
        const userResult = await client.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
          results.push({
            userId,
            success: false,
            message: 'User not found'
          });
          continue;
        }

        const user = userResult.rows[0];
        const revokedPermissions = [];

        for (const dashboardType of dashboardTypes) {
          // Find and deactivate custom dashboard roles
          const customRoleName = `dashboard_${dashboardType}_${userId}`;
          
          const deactivateRoleQuery = `
            UPDATE user_roles 
            SET is_active = false, 
                updated_at = CURRENT_TIMESTAMP,
                assignment_reason = $3
            WHERE user_id = $1 
              AND role_id IN (
                SELECT role_id FROM roles 
                WHERE role_name = $2 AND role_type = 'Custom'
              )
          `;
          
          const result = await client.query(deactivateRoleQuery, [
            userId, 
            customRoleName,
            reason || `Dashboard access revoked by ${req.user.username || req.user.user_id}`
          ]);

          revokedPermissions.push({
            dashboardType,
            status: result.rowCount > 0 ? 'revoked' : 'not_found'
          });
        }

        results.push({
          userId,
          username: user.username,
          success: true,
          revokedPermissions
        });
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Dashboard access revocation completed',
        data: {
          results,
          summary: {
            totalUsers: userIds.length,
            successfulRevocations: results.filter(r => r.success).length,
            failedRevocations: results.filter(r => !r.success).length
          }
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error revoking dashboard access:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke dashboard access'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * GET /api/dashboard-access/users
 * List users with dashboard access
 */
router.get('/users',
  authenticateToken,
  requirePermissions(['user.read', 'dashboard.admin']),
  [
    query('dashboardType').optional().isIn(['executive', 'operational', 'compliance', 'analytics', 'export'])
      .withMessage('Invalid dashboard type'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

      const { dashboardType, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = '';
      let queryParams = [];
      let paramCount = 0;

      if (dashboardType) {
        const dashboardPermissionMap = {
          executive: 'dashboard.executive',
          operational: 'dashboard.operational',
          compliance: 'dashboard.compliance',
          analytics: 'dashboard.analytics',
          export: 'dashboard.export'
        };
        
        whereClause = 'AND p.permission_name = $' + (++paramCount);
        queryParams.push(dashboardPermissionMap[dashboardType]);
      }

      const usersQuery = `
        SELECT DISTINCT 
          u.user_id,
          u.username,
          u.email,
          u.first_name,
          u.last_name,
          u.department,
          u.job_title,
          u.status,
          array_agg(DISTINCT p.permission_name) as dashboard_permissions,
          array_agg(DISTINCT r.role_name) as roles
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        JOIN role_permissions rp ON r.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE ur.is_active = true
          AND r.is_active = true
          AND rp.is_active = true
          AND p.is_active = true
          AND p.resource = 'dashboards'
          ${whereClause}
        GROUP BY u.user_id, u.username, u.email, u.first_name, u.last_name, u.department, u.job_title, u.status
        ORDER BY u.last_name, u.first_name
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      queryParams.push(limit, offset);

      const countQuery = `
        SELECT COUNT(DISTINCT u.user_id) as total
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        JOIN role_permissions rp ON r.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE ur.is_active = true
          AND r.is_active = true
          AND rp.is_active = true
          AND p.is_active = true
          AND p.resource = 'dashboards'
          ${whereClause}
      `;

      const [usersResult, countResult] = await Promise.all([
        pool.query(usersQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
      ]);

      const users = usersResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: {
            dashboardType: dashboardType || 'all'
          }
        }
      });

    } catch (error) {
      console.error('Error listing users with dashboard access:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users with dashboard access'
      });
    }
  }
);

/**
 * GET /api/dashboard-access/audit
 * Get dashboard access audit log
 */
router.get('/audit',
  authenticateToken,
  requirePermissions(['system.audit', 'dashboard.admin']),
  [
    query('userId').optional().isString().withMessage('User ID must be a string'),
    query('dashboardType').optional().isIn(['executive', 'operational', 'compliance', 'analytics', 'export'])
      .withMessage('Invalid dashboard type'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601 date'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

      const { userId, dashboardType, startDate, endDate, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      let whereConditions = ["activity_type = 'dashboard_access'"];
      let queryParams = [];
      let paramCount = 0;

      if (userId) {
        whereConditions.push(`user_id = $${++paramCount}`);
        queryParams.push(userId);
      }

      if (dashboardType) {
        whereConditions.push(`action = $${++paramCount}`);
        queryParams.push(dashboardType);
      }

      if (startDate) {
        whereConditions.push(`created_at >= $${++paramCount}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        whereConditions.push(`created_at <= $${++paramCount}`);
        queryParams.push(endDate);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const auditQuery = `
        SELECT 
          ual.log_id,
          ual.user_id,
          u.username,
          u.first_name,
          u.last_name,
          ual.activity_description,
          ual.action as dashboard_type,
          ual.ip_address,
          ual.success,
          ual.created_at
        FROM user_activity_log ual
        LEFT JOIN users u ON ual.user_id = u.user_id
        ${whereClause}
        ORDER BY ual.created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      queryParams.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_activity_log ual
        ${whereClause}
      `;

      const [auditResult, countResult] = await Promise.all([
        pool.query(auditQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
      ]);

      const auditLogs = auditResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          auditLogs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: {
            userId: userId || null,
            dashboardType: dashboardType || null,
            startDate: startDate || null,
            endDate: endDate || null
          }
        }
      });

    } catch (error) {
      console.error('Error retrieving dashboard access audit log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard access audit log'
      });
    }
  }
);

module.exports = router;