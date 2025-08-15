// File: ict-governance-framework/api/roles.js
// Role management API endpoints for the ICT Governance Framework

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

const { 
  authenticateToken, 
  requirePermissions, 
  logActivity 
} = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Validation rules
const createRoleValidation = [
  body('roleName')
    .isLength({ min: 3, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Role name must be 3-100 characters and contain only letters, numbers, underscores, and hyphens'),
  body('displayName')
    .isLength({ min: 1, max: 150 })
    .trim()
    .withMessage('Display name is required'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .trim(),
  body('roleType')
    .optional()
    .isIn(['System', 'Custom', 'Functional', 'Organizational'])
    .withMessage('Invalid role type'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array')
];

const updateRoleValidation = [
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 150 })
    .trim()
    .withMessage('Display name must be 1-150 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .trim(),
  body('roleType')
    .optional()
    .isIn(['System', 'Custom', 'Functional', 'Organizational'])
    .withMessage('Invalid role type'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

/**
 * GET /api/roles
 * Get list of roles with filtering and pagination
 */
router.get('/',
  authenticateToken,
  requirePermissions(['role.read']),
  logActivity('ROLE_LIST', 'Retrieved role list'),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        roleType,
        isActive,
        sortBy = 'role_hierarchy_level',
        sortOrder = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;
      const validSortColumns = ['role_name', 'display_name', 'role_type', 'role_hierarchy_level', 'created_at'];
      const validSortOrders = ['asc', 'desc'];

      if (!validSortColumns.includes(sortBy) || !validSortOrders.includes(sortOrder)) {
        return res.status(400).json({
          error: 'Invalid sort parameters',
          code: 'INVALID_SORT'
        });
      }

      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      // Build WHERE conditions
      if (search) {
        paramCount++;
        whereConditions.push(`(r.role_name ILIKE $${paramCount} OR r.display_name ILIKE $${paramCount} OR r.description ILIKE $${paramCount})`);
        queryParams.push(`%${search}%`);
      }

      if (roleType) {
        paramCount++;
        whereConditions.push(`r.role_type = $${paramCount}`);
        queryParams.push(roleType);
      }

      if (isActive !== undefined) {
        paramCount++;
        whereConditions.push(`r.is_active = $${paramCount}`);
        queryParams.push(isActive === 'true');
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Main query
      const rolesQuery = `
        SELECT r.role_id, r.role_name, r.display_name, r.description, r.role_type,
               r.is_system_role, r.is_active, r.role_hierarchy_level, r.created_at,
               pr.role_name as parent_role_name,
               array_agg(DISTINCT p.permission_name) FILTER (WHERE p.permission_name IS NOT NULL) as permissions,
               COUNT(DISTINCT ur.user_id) as user_count
        FROM roles r
        LEFT JOIN roles pr ON r.parent_role_id = pr.role_id
        LEFT JOIN role_permissions rp ON r.role_id = rp.role_id AND rp.is_active = true
        LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = true
        LEFT JOIN user_roles ur ON r.role_id = ur.role_id AND ur.is_active = true
        ${whereClause}
        GROUP BY r.role_id, r.role_name, r.display_name, r.description, r.role_type,
                 r.is_system_role, r.is_active, r.role_hierarchy_level, r.created_at,
                 pr.role_name
        ORDER BY r.${sortBy} ${sortOrder}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      queryParams.push(limit, offset);

      // Count query
      const countQuery = `
        SELECT COUNT(DISTINCT r.role_id) as total
        FROM roles r
        ${whereClause}
      `;

      const [rolesResult, countResult] = await Promise.all([
        pool.query(rolesQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
      ]);

      const roles = rolesResult.rows.map(role => ({
        ...role,
        permissions: role.permissions || [],
        userCount: parseInt(role.user_count)
      }));

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.json({
        roles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Get roles error:', error);
      res.status(500).json({
        error: 'Failed to retrieve roles',
        code: 'ROLE_LIST_ERROR'
      });
    }
  }
);

/**
 * GET /api/roles/:roleId
 * Get specific role details
 */
router.get('/:roleId',
  authenticateToken,
  requirePermissions(['role.read']),
  logActivity('ROLE_VIEW', (req) => `Viewed role ${req.params.roleId}`),
  async (req, res) => {
    try {
      const { roleId } = req.params;

      const roleQuery = `
        SELECT r.role_id, r.role_name, r.display_name, r.description, r.role_type,
               r.is_system_role, r.is_active, r.role_hierarchy_level, r.parent_role_id,
               r.created_at, r.updated_at,
               pr.role_name as parent_role_name, pr.display_name as parent_display_name,
               array_agg(DISTINCT jsonb_build_object(
                 'permissionId', p.permission_id,
                 'permissionName', p.permission_name,
                 'displayName', p.display_name,
                 'description', p.description,
                 'resource', p.resource,
                 'action', p.action,
                 'scope', p.scope,
                 'grantedAt', rp.granted_at
               )) FILTER (WHERE p.permission_id IS NOT NULL) as permissions,
               COUNT(DISTINCT ur.user_id) as user_count
        FROM roles r
        LEFT JOIN roles pr ON r.parent_role_id = pr.role_id
        LEFT JOIN role_permissions rp ON r.role_id = rp.role_id AND rp.is_active = true
        LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = true
        LEFT JOIN user_roles ur ON r.role_id = ur.role_id AND ur.is_active = true
        WHERE r.role_id = $1
        GROUP BY r.role_id, r.role_name, r.display_name, r.description, r.role_type,
                 r.is_system_role, r.is_active, r.role_hierarchy_level, r.parent_role_id,
                 r.created_at, r.updated_at, pr.role_name, pr.display_name
      `;

      const roleResult = await pool.query(roleQuery, [roleId]);

      if (roleResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      const role = roleResult.rows[0];

      res.json({
        role: {
          ...role,
          parentRole: role.parent_role_name ? {
            roleId: role.parent_role_id,
            roleName: role.parent_role_name,
            displayName: role.parent_display_name
          } : null,
          permissions: role.permissions || [],
          userCount: parseInt(role.user_count)
        }
      });

    } catch (error) {
      console.error('Get role error:', error);
      res.status(500).json({
        error: 'Failed to retrieve role',
        code: 'ROLE_GET_ERROR'
      });
    }
  }
);

/**
 * POST /api/roles
 * Create a new role
 */
router.post('/',
  authenticateToken,
  requirePermissions(['role.create']),
  createRoleValidation,
  logActivity('ROLE_CREATE', (req) => `Created role ${req.body.roleName}`),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      await client.query('BEGIN');

      const {
        roleName,
        displayName,
        description,
        roleType = 'Custom',
        roleHierarchyLevel = 0,
        parentRoleId,
        permissions = []
      } = req.body;

      // Check if role name already exists
      const existingRoleQuery = 'SELECT role_id FROM roles WHERE role_name = $1';
      const existingRole = await client.query(existingRoleQuery, [roleName]);

      if (existingRole.rows.length > 0) {
        return res.status(409).json({
          error: 'Role name already exists',
          code: 'ROLE_EXISTS'
        });
      }

      // Generate role ID
      const roleId = `ROLE_${roleName.toUpperCase()}`;

      // Insert new role
      const insertRoleQuery = `
        INSERT INTO roles (
          role_id, role_name, display_name, description, role_type,
          role_hierarchy_level, parent_role_id, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING role_id, role_name, display_name, description, role_type,
                  role_hierarchy_level, created_at
      `;

      const roleValues = [
        roleId, roleName, displayName, description, roleType,
        roleHierarchyLevel, parentRoleId, req.user.user_id
      ];

      const roleResult = await client.query(insertRoleQuery, roleValues);
      const newRole = roleResult.rows[0];

      // Assign permissions if provided
      if (permissions.length > 0) {
        // Validate permissions exist
        const permissionQuery = 'SELECT permission_id, permission_name FROM permissions WHERE permission_name = ANY($1) AND is_active = true';
        const permissionResult = await client.query(permissionQuery, [permissions]);

        if (permissionResult.rows.length !== permissions.length) {
          const foundPermissions = permissionResult.rows.map(p => p.permission_name);
          const missingPermissions = permissions.filter(p => !foundPermissions.includes(p));
          return res.status(400).json({
            error: 'Some permissions not found',
            code: 'PERMISSIONS_NOT_FOUND',
            missingPermissions
          });
        }

        // Assign permissions to role
        for (const permission of permissionResult.rows) {
          const assignPermissionQuery = `
            INSERT INTO role_permissions (role_id, permission_id, granted_by)
            VALUES ($1, $2, $3)
          `;
          await client.query(assignPermissionQuery, [
            roleId,
            permission.permission_id,
            req.user.user_id
          ]);
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Role created successfully',
        role: {
          ...newRole,
          permissions: permissions
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create role error:', error);
      res.status(500).json({
        error: 'Failed to create role',
        code: 'ROLE_CREATE_ERROR'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * PUT /api/roles/:roleId
 * Update role information
 */
router.put('/:roleId',
  authenticateToken,
  requirePermissions(['role.update']),
  updateRoleValidation,
  logActivity('ROLE_UPDATE', (req) => `Updated role ${req.params.roleId}`),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { roleId } = req.params;
      const {
        displayName,
        description,
        roleType,
        roleHierarchyLevel,
        parentRoleId,
        isActive
      } = req.body;

      // Check if role exists and is not a system role
      const existingRoleQuery = 'SELECT role_id, is_system_role FROM roles WHERE role_id = $1';
      const existingRole = await pool.query(existingRoleQuery, [roleId]);

      if (existingRole.rows.length === 0) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      if (existingRole.rows[0].is_system_role) {
        return res.status(403).json({
          error: 'Cannot modify system roles',
          code: 'SYSTEM_ROLE_IMMUTABLE'
        });
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramCount = 0;

      if (displayName !== undefined) {
        paramCount++;
        updateFields.push(`display_name = $${paramCount}`);
        updateValues.push(displayName);
      }

      if (description !== undefined) {
        paramCount++;
        updateFields.push(`description = $${paramCount}`);
        updateValues.push(description);
      }

      if (roleType !== undefined) {
        paramCount++;
        updateFields.push(`role_type = $${paramCount}`);
        updateValues.push(roleType);
      }

      if (roleHierarchyLevel !== undefined) {
        paramCount++;
        updateFields.push(`role_hierarchy_level = $${paramCount}`);
        updateValues.push(roleHierarchyLevel);
      }

      if (parentRoleId !== undefined) {
        paramCount++;
        updateFields.push(`parent_role_id = $${paramCount}`);
        updateValues.push(parentRoleId);
      }

      if (isActive !== undefined) {
        paramCount++;
        updateFields.push(`is_active = $${paramCount}`);
        updateValues.push(isActive);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'No fields to update',
          code: 'NO_UPDATE_FIELDS'
        });
      }

      // Add updated_by and updated_at
      paramCount++;
      updateFields.push(`updated_by = $${paramCount}`);
      updateValues.push(req.user.user_id);

      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      updateValues.push(new Date());

      // Add roleId for WHERE clause
      paramCount++;
      updateValues.push(roleId);

      const updateQuery = `
        UPDATE roles 
        SET ${updateFields.join(', ')}
        WHERE role_id = $${paramCount}
        RETURNING role_id, role_name, display_name, description, role_type,
                  role_hierarchy_level, is_active, updated_at
      `;

      const updateResult = await pool.query(updateQuery, updateValues);
      const updatedRole = updateResult.rows[0];

      res.json({
        message: 'Role updated successfully',
        role: updatedRole
      });

    } catch (error) {
      console.error('Update role error:', error);
      res.status(500).json({
        error: 'Failed to update role',
        code: 'ROLE_UPDATE_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/roles/:roleId
 * Delete (deactivate) a role
 */
router.delete('/:roleId',
  authenticateToken,
  requirePermissions(['role.delete']),
  logActivity('ROLE_DELETE', (req) => `Deleted role ${req.params.roleId}`),
  async (req, res) => {
    try {
      const { roleId } = req.params;

      // Check if role exists and is not a system role
      const existingRoleQuery = `
        SELECT role_id, role_name, is_system_role, is_active,
               COUNT(ur.user_id) as user_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.role_id = ur.role_id AND ur.is_active = true
        WHERE r.role_id = $1
        GROUP BY r.role_id, r.role_name, r.is_system_role, r.is_active
      `;
      const existingRole = await pool.query(existingRoleQuery, [roleId]);

      if (existingRole.rows.length === 0) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      const role = existingRole.rows[0];

      if (role.is_system_role) {
        return res.status(403).json({
          error: 'Cannot delete system roles',
          code: 'SYSTEM_ROLE_IMMUTABLE'
        });
      }

      if (parseInt(role.user_count) > 0) {
        return res.status(400).json({
          error: 'Cannot delete role with assigned users',
          code: 'ROLE_HAS_USERS',
          userCount: parseInt(role.user_count)
        });
      }

      // Deactivate role instead of hard delete
      const updateQuery = `
        UPDATE roles 
        SET is_active = false, updated_by = $1, updated_at = CURRENT_TIMESTAMP
        WHERE role_id = $2
        RETURNING role_id, role_name, is_active
      `;

      const updateResult = await pool.query(updateQuery, [req.user.user_id, roleId]);
      const deactivatedRole = updateResult.rows[0];

      res.json({
        message: 'Role deactivated successfully',
        role: deactivatedRole
      });

    } catch (error) {
      console.error('Delete role error:', error);
      res.status(500).json({
        error: 'Failed to delete role',
        code: 'ROLE_DELETE_ERROR'
      });
    }
  }
);

/**
 * POST /api/roles/:roleId/permissions
 * Assign permissions to a role
 */
router.post('/:roleId/permissions',
  authenticateToken,
  requirePermissions(['role.manage_permissions']),
  logActivity('ROLE_PERMISSION_ASSIGN', (req) => `Assigned permissions to role ${req.params.roleId}`),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { roleId } = req.params;
      const { permissions } = req.body;

      if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({
          error: 'Permissions array is required',
          code: 'PERMISSIONS_REQUIRED'
        });
      }

      await client.query('BEGIN');

      // Check if role exists and is not a system role
      const roleQuery = 'SELECT role_id, is_system_role FROM roles WHERE role_id = $1 AND is_active = true';
      const roleResult = await client.query(roleQuery, [roleId]);

      if (roleResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      if (roleResult.rows[0].is_system_role) {
        return res.status(403).json({
          error: 'Cannot modify permissions for system roles',
          code: 'SYSTEM_ROLE_IMMUTABLE'
        });
      }

      // Validate permissions exist
      const permissionQuery = 'SELECT permission_id, permission_name FROM permissions WHERE permission_name = ANY($1) AND is_active = true';
      const permissionResult = await client.query(permissionQuery, [permissions]);

      if (permissionResult.rows.length !== permissions.length) {
        const foundPermissions = permissionResult.rows.map(p => p.permission_name);
        const missingPermissions = permissions.filter(p => !foundPermissions.includes(p));
        return res.status(400).json({
          error: 'Some permissions not found',
          code: 'PERMISSIONS_NOT_FOUND',
          missingPermissions
        });
      }

      // Assign permissions
      const assignedPermissions = [];
      for (const permission of permissionResult.rows) {
        const assignQuery = `
          INSERT INTO role_permissions (role_id, permission_id, granted_by)
          VALUES ($1, $2, $3)
          ON CONFLICT (role_id, permission_id) 
          DO UPDATE SET is_active = true, granted_by = $3, granted_at = CURRENT_TIMESTAMP
          RETURNING permission_id
        `;

        await client.query(assignQuery, [
          roleId,
          permission.permission_id,
          req.user.user_id
        ]);

        assignedPermissions.push(permission.permission_name);
      }

      await client.query('COMMIT');

      res.json({
        message: 'Permissions assigned successfully',
        roleId,
        assignedPermissions
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Assign permissions error:', error);
      res.status(500).json({
        error: 'Failed to assign permissions',
        code: 'PERMISSION_ASSIGN_ERROR'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * DELETE /api/roles/:roleId/permissions/:permissionId
 * Remove a permission from a role
 */
router.delete('/:roleId/permissions/:permissionId',
  authenticateToken,
  requirePermissions(['role.manage_permissions']),
  logActivity('ROLE_PERMISSION_REMOVE', (req) => `Removed permission ${req.params.permissionId} from role ${req.params.roleId}`),
  async (req, res) => {
    try {
      const { roleId, permissionId } = req.params;

      // Check if role exists and is not a system role
      const roleQuery = 'SELECT role_id, is_system_role FROM roles WHERE role_id = $1 AND is_active = true';
      const roleResult = await pool.query(roleQuery, [roleId]);

      if (roleResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      if (roleResult.rows[0].is_system_role) {
        return res.status(403).json({
          error: 'Cannot modify permissions for system roles',
          code: 'SYSTEM_ROLE_IMMUTABLE'
        });
      }

      // Check if permission assignment exists
      const checkQuery = `
        SELECT rp.id, p.permission_name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE rp.role_id = $1 AND rp.permission_id = $2 AND rp.is_active = true
      `;

      const checkResult = await pool.query(checkQuery, [roleId, permissionId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Role permission assignment not found',
          code: 'ROLE_PERMISSION_NOT_FOUND'
        });
      }

      // Remove permission assignment
      const removeQuery = `
        UPDATE role_permissions 
        SET is_active = false 
        WHERE role_id = $1 AND permission_id = $2
      `;

      await pool.query(removeQuery, [roleId, permissionId]);

      res.json({
        message: 'Permission removed successfully',
        roleId,
        permissionId,
        permissionName: checkResult.rows[0].permission_name
      });

    } catch (error) {
      console.error('Remove permission error:', error);
      res.status(500).json({
        error: 'Failed to remove permission',
        code: 'PERMISSION_REMOVE_ERROR'
      });
    }
  }
);

/**
 * GET /api/roles/:roleId/users
 * Get users assigned to a role
 */
router.get('/:roleId/users',
  authenticateToken,
  requirePermissions(['role.read', 'user.read']),
  async (req, res) => {
    try {
      const { roleId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      const usersQuery = `
        SELECT u.user_id, u.username, u.email, u.first_name, u.last_name,
               u.department, u.job_title, u.status, ur.assigned_at, ur.expires_at
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.user_id
        WHERE ur.role_id = $1 AND ur.is_active = true
        ORDER BY ur.assigned_at DESC
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_roles ur
        WHERE ur.role_id = $1 AND ur.is_active = true
      `;

      const [usersResult, countResult] = await Promise.all([
        pool.query(usersQuery, [roleId, limit, offset]),
        pool.query(countQuery, [roleId])
      ]);

      const users = usersResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Get role users error:', error);
      res.status(500).json({
        error: 'Failed to retrieve role users',
        code: 'ROLE_USERS_ERROR'
      });
    }
  }
);

/**
 * GET /api/roles/permissions
 * Get all available permissions
 */
router.get('/permissions/all',
  authenticateToken,
  requirePermissions(['role.read']),
  async (req, res) => {
    try {
      const { resource, action, scope } = req.query;

      let whereConditions = ['p.is_active = true'];
      let queryParams = [];
      let paramCount = 0;

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

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      const permissionsQuery = `
        SELECT permission_id, permission_name, display_name, description,
               resource, action, scope, is_system_permission
        FROM permissions p
        ${whereClause}
        ORDER BY resource, action, permission_name
      `;

      const permissionsResult = await pool.query(permissionsQuery, queryParams);

      // Group permissions by resource
      const groupedPermissions = permissionsResult.rows.reduce((acc, permission) => {
        if (!acc[permission.resource]) {
          acc[permission.resource] = [];
        }
        acc[permission.resource].push(permission);
        return acc;
      }, {});

      res.json({
        permissions: permissionsResult.rows,
        groupedPermissions
      });

    } catch (error) {
      console.error('Get permissions error:', error);
      res.status(500).json({
        error: 'Failed to retrieve permissions',
        code: 'PERMISSIONS_GET_ERROR'
      });
    }
  }
);

module.exports = router;