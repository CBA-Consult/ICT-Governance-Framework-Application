// File: ict-governance-framework/api/user-permissions.js
// User Permissions Management API
// Provides endpoints for managing user permissions and role assignments

const express = require('express');
const { Pool } = require('pg');
const { body, validationResult, param } = require('express-validator');

const { 
  authenticateToken, 
  requirePermissions 
} = require('../middleware/auth');

// Helper function to require a single permission
const requirePermission = (permission) => requirePermissions([permission]);

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Validation middleware
const userIdValidation = [
  param('userId').notEmpty().withMessage('User ID is required')
];

const roleAssignmentValidation = [
  body('roleIds').isArray().withMessage('Role IDs must be an array'),
  body('roleIds.*').notEmpty().withMessage('Each role ID must be provided'),
  body('reason').optional().isString().withMessage('Reason must be a string')
];

// ============================================================================
// PERMISSION ENDPOINTS
// ============================================================================

/**
 * GET /api/user-permissions/permissions
 * Get all available permissions in the system
 */
router.get('/permissions', authenticateToken, requirePermission('user.read'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      resource, 
      action, 
      scope,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['p.is_active = true'];
    let queryParams = [];
    let paramCount = 0;

    // Add filters
    if (resource) {
      paramCount++;
      whereConditions.push(`p.resource = $${paramCount}`);
      queryParams.push(resource);
    }

    if (action) {
      paramCount++;
      whereConditions.push(`p.action = $${paramCount}`);
      queryParams.push(action);
    }

    if (scope) {
      paramCount++;
      whereConditions.push(`p.scope = $${paramCount}`);
      queryParams.push(scope);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(p.permission_name ILIKE $${paramCount} OR p.display_name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get permissions with pagination
    const permissionsQuery = `
      SELECT 
        p.permission_id,
        p.permission_name,
        p.display_name,
        p.description,
        p.resource,
        p.action,
        p.scope,
        p.is_system_permission,
        p.created_at,
        p.updated_at
      FROM permissions p
      ${whereClause}
      ORDER BY p.resource, p.action, p.permission_name
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM permissions p
      ${whereClause}
    `;

    queryParams.push(limit, offset);

    const [permissionsResult, countResult] = await Promise.all([
      pool.query(permissionsQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    const permissions = permissionsResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // Group permissions by resource for better organization
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        permissions,
        groupedPermissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions',
      details: error.message
    });
  }
});

// ============================================================================
// USER PERMISSIONS ENDPOINTS
// ============================================================================

/**
 * GET /api/user-permissions/users/:userId/permissions
 * Get effective permissions for a specific user (through their roles)
 */
router.get('/users/:userId/permissions', authenticateToken, requirePermission('user.read'), userIdValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const { includeInactive = false } = req.query;

    // Check if user exists
    const userQuery = 'SELECT user_id, username, email, first_name, last_name FROM users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get user's effective permissions through roles
    const permissionsQuery = `
      SELECT DISTINCT
        p.permission_id,
        p.permission_name,
        p.display_name,
        p.description,
        p.resource,
        p.action,
        p.scope,
        p.is_system_permission,
        array_agg(DISTINCT r.role_name) as granted_by_roles,
        array_agg(DISTINCT r.display_name) as granted_by_role_names
      FROM permissions p
      INNER JOIN role_permissions rp ON p.permission_id = rp.permission_id
      INNER JOIN roles r ON rp.role_id = r.role_id
      INNER JOIN user_roles ur ON r.role_id = ur.role_id
      WHERE ur.user_id = $1
        AND ur.is_active = true
        AND r.is_active = true
        AND rp.is_active = true
        AND p.is_active = true
        ${includeInactive === 'true' ? '' : 'AND (ur.expires_at IS NULL OR ur.expires_at > NOW())'}
      GROUP BY p.permission_id, p.permission_name, p.display_name, p.description, p.resource, p.action, p.scope, p.is_system_permission
      ORDER BY p.resource, p.action, p.permission_name
    `;

    const permissionsResult = await pool.query(permissionsQuery, [userId]);
    const permissions = permissionsResult.rows;

    // Group permissions by resource
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        user,
        permissions,
        groupedPermissions,
        totalPermissions: permissions.length
      }
    });

  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user permissions',
      details: error.message
    });
  }
});

/**
 * GET /api/user-permissions/users/:userId/roles
 * Get roles assigned to a specific user
 */
router.get('/users/:userId/roles', authenticateToken, requirePermission('user.read'), userIdValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const { includeExpired = false } = req.query;

    // Check if user exists
    const userQuery = 'SELECT user_id, username, email, first_name, last_name FROM users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get user's roles
    const rolesQuery = `
      SELECT 
        r.role_id,
        r.role_name,
        r.display_name,
        r.description,
        r.role_type,
        r.is_system_role,
        r.role_hierarchy_level,
        ur.assigned_by,
        ur.assigned_at,
        ur.expires_at,
        ur.is_active,
        ur.assignment_reason,
        assignedBy.username as assigned_by_username,
        assignedBy.first_name as assigned_by_first_name,
        assignedBy.last_name as assigned_by_last_name,
        CASE 
          WHEN ur.expires_at IS NOT NULL AND ur.expires_at <= NOW() THEN true
          ELSE false
        END as is_expired
      FROM roles r
      INNER JOIN user_roles ur ON r.role_id = ur.role_id
      LEFT JOIN users assignedBy ON ur.assigned_by = assignedBy.user_id
      WHERE ur.user_id = $1
        AND ur.is_active = true
        AND r.is_active = true
        ${includeExpired === 'true' ? '' : 'AND (ur.expires_at IS NULL OR ur.expires_at > NOW())'}
      ORDER BY r.role_hierarchy_level DESC, r.role_name
    `;

    const rolesResult = await pool.query(rolesQuery, [userId]);
    const roles = rolesResult.rows;

    res.json({
      success: true,
      data: {
        user,
        roles,
        totalRoles: roles.length
      }
    });

  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user roles',
      details: error.message
    });
  }
});

/**
 * POST /api/user-permissions/users/:userId/roles
 * Assign roles to a user
 */
router.post('/users/:userId/roles', authenticateToken, requirePermission('user.manage_roles'), [...userIdValidation, ...roleAssignmentValidation], async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const { roleIds, reason, expiresAt } = req.body;

    // Check if user exists
    const userQuery = 'SELECT user_id, username FROM users WHERE user_id = $1';
    const userResult = await client.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Validate that all roles exist and are active
    const roleQuery = 'SELECT role_id, role_name, display_name FROM roles WHERE role_id = ANY($1) AND is_active = true';
    const roleResult = await client.query(roleQuery, [roleIds]);

    if (roleResult.rows.length !== roleIds.length) {
      const foundRoles = roleResult.rows.map(r => r.role_id);
      const missingRoles = roleIds.filter(r => !foundRoles.includes(r));
      
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Some roles not found or inactive',
        details: { missingRoles }
      });
    }

    const assignedRoles = [];

    // Assign each role to the user
    for (const roleId of roleIds) {
      const role = roleResult.rows.find(r => r.role_id === roleId);
      
      // Check if user already has this role
      const existingAssignmentQuery = `
        SELECT id FROM user_roles 
        WHERE user_id = $1 AND role_id = $2 AND is_active = true
      `;
      const existingAssignment = await client.query(existingAssignmentQuery, [userId, roleId]);

      if (existingAssignment.rows.length === 0) {
        // Assign the role
        const assignQuery = `
          INSERT INTO user_roles (user_id, role_id, assigned_by, assignment_reason, expires_at)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        const assignResult = await client.query(assignQuery, [
          userId,
          roleId,
          req.user.user_id,
          reason || `Role assigned by ${req.user.username}`,
          expiresAt || null
        ]);

        assignedRoles.push({
          ...role,
          assignment: assignResult.rows[0]
        });

        // Log the activity
        const logQuery = `
          INSERT INTO user_activity_log (log_id, user_id, activity_type, activity_description, resource, action)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        await client.query(logQuery, [
          `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          'role_assignment',
          `Role "${role.role_name}" assigned by ${req.user.username}`,
          'user_roles',
          'create'
        ]);
      } else {
        assignedRoles.push({
          ...role,
          assignment: null,
          message: 'Role already assigned'
        });
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Roles assigned successfully',
      data: {
        user,
        assignedRoles,
        totalAssigned: assignedRoles.filter(r => r.assignment !== null).length
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error assigning roles to user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign roles to user',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/user-permissions/users/:userId/roles/:roleId
 * Remove a role from a user
 */
router.delete('/users/:userId/roles/:roleId', authenticateToken, requirePermission('user.manage_roles'), [
  param('userId').notEmpty().withMessage('User ID is required'),
  param('roleId').notEmpty().withMessage('Role ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId, roleId } = req.params;
    const { reason } = req.body;

    // Check if the assignment exists
    const checkQuery = `
      SELECT ur.*, r.role_name, r.display_name, u.username
      FROM user_roles ur
      INNER JOIN roles r ON ur.role_id = r.role_id
      INNER JOIN users u ON ur.user_id = u.user_id
      WHERE ur.user_id = $1 AND ur.role_id = $2 AND ur.is_active = true
    `;
    
    const checkResult = await pool.query(checkQuery, [userId, roleId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role assignment not found or already inactive'
      });
    }

    const assignment = checkResult.rows[0];

    // Remove the role assignment (soft delete)
    const removeQuery = `
      UPDATE user_roles 
      SET is_active = false
      WHERE user_id = $1 AND role_id = $2 AND is_active = true
      RETURNING *
    `;
    
    const removeResult = await pool.query(removeQuery, [userId, roleId]);

    // Log the activity
    const logQuery = `
      INSERT INTO user_activity_log (log_id, user_id, activity_type, activity_description, resource, action)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    await pool.query(logQuery, [
      `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      'role_removal',
      `Role "${assignment.role_name}" removed by ${req.user.username}. Reason: ${reason || 'No reason provided'}`,
      'user_roles',
      'delete'
    ]);

    res.json({
      success: true,
      message: 'Role removed successfully',
      data: {
        removedAssignment: {
          userId,
          roleId,
          roleName: assignment.role_name,
          displayName: assignment.display_name,
          username: assignment.username,
          removedBy: req.user.username,
          removedAt: new Date().toISOString(),
          reason: reason || 'No reason provided'
        }
      }
    });

  } catch (error) {
    console.error('Error removing role from user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove role from user',
      details: error.message
    });
  }
});

/**
 * PUT /api/user-permissions/users/:userId/roles
 * Update user's role assignments (replace all roles)
 */
router.put('/users/:userId/roles', authenticateToken, requirePermission('user.manage_roles'), [...userIdValidation, ...roleAssignmentValidation], async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const { roleIds, reason } = req.body;

    // Check if user exists
    const userQuery = 'SELECT user_id, username FROM users WHERE user_id = $1';
    const userResult = await client.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Validate that all new roles exist and are active
    if (roleIds.length > 0) {
      const roleQuery = 'SELECT role_id, role_name FROM roles WHERE role_id = ANY($1) AND is_active = true';
      const roleResult = await client.query(roleQuery, [roleIds]);

      if (roleResult.rows.length !== roleIds.length) {
        const foundRoles = roleResult.rows.map(r => r.role_id);
        const missingRoles = roleIds.filter(r => !foundRoles.includes(r));
        
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Some roles not found or inactive',
          details: { missingRoles }
        });
      }
    }

    // Get current active role assignments
    const currentRolesQuery = `
      SELECT role_id FROM user_roles 
      WHERE user_id = $1 AND is_active = true
    `;
    const currentRolesResult = await client.query(currentRolesQuery, [userId]);
    const currentRoleIds = currentRolesResult.rows.map(r => r.role_id);

    // Determine roles to add and remove
    const rolesToAdd = roleIds.filter(roleId => !currentRoleIds.includes(roleId));
    const rolesToRemove = currentRoleIds.filter(roleId => !roleIds.includes(roleId));

    // Remove roles that are no longer assigned
    if (rolesToRemove.length > 0) {
      const removeQuery = `
        UPDATE user_roles 
        SET is_active = false
        WHERE user_id = $1 AND role_id = ANY($2) AND is_active = true
      `;
      await client.query(removeQuery, [userId, rolesToRemove]);
    }

    // Add new roles
    const addedRoles = [];
    for (const roleId of rolesToAdd) {
      const assignQuery = `
        INSERT INTO user_roles (user_id, role_id, assigned_by, assignment_reason)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const assignResult = await client.query(assignQuery, [
        userId,
        roleId,
        req.user.user_id,
        reason || `Role updated by ${req.user.username}`
      ]);

      addedRoles.push(assignResult.rows[0]);
    }

    // Log the activity
    const logQuery = `
      INSERT INTO user_activity_log (log_id, user_id, activity_type, activity_description, resource, action)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    await client.query(logQuery, [
      `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      'role_update',
      `User roles updated by ${req.user.username}. Added: ${rolesToAdd.length}, Removed: ${rolesToRemove.length}`,
      'user_roles',
      'update'
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'User roles updated successfully',
      data: {
        user,
        changes: {
          added: rolesToAdd,
          removed: rolesToRemove,
          totalAdded: rolesToAdd.length,
          totalRemoved: rolesToRemove.length
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user roles',
      details: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;