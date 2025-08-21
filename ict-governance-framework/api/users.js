// File: ict-governance-framework/api/users.js
// User management API endpoints for the ICT Governance Framework

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, query } = require('express-validator');

const { 
  authenticateToken, 
  requirePermissions, 
  requireRoles,
  logActivity 
} = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Validation rules
const createUserValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('firstName')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('First name is required'),
  body('lastName')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Last name is required'),
  body('department')
    .optional()
    .isLength({ max: 100 })
    .trim(),
  body('jobTitle')
    .optional()
    .isLength({ max: 150 })
    .trim(),
  body('roles')
    .optional()
    .isArray()
    .withMessage('Roles must be an array')
];

const updateUserValidation = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('First name must be 1-100 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Last name must be 1-100 characters'),
  body('department')
    .optional()
    .isLength({ max: 100 })
    .trim(),
  body('jobTitle')
    .optional()
    .isLength({ max: 150 })
    .trim(),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Suspended', 'Pending'])
    .withMessage('Invalid status')
];

/**
 * GET /api/users
 * Get list of users with filtering and pagination
 */
router.get('/', 
  authenticateToken,
  requirePermissions(['user.read']),
  logActivity('USER_LIST', 'Retrieved user list'),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        department,
        status,
        role,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;
      const validSortColumns = ['username', 'email', 'first_name', 'last_name', 'department', 'status', 'created_at'];
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
        whereConditions.push(`(u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount})`);
        queryParams.push(`%${search}%`);
      }

      if (department) {
        paramCount++;
        whereConditions.push(`u.department = $${paramCount}`);
        queryParams.push(department);
      }

      if (status) {
        paramCount++;
        whereConditions.push(`u.status = $${paramCount}`);
        queryParams.push(status);
      }

      if (role) {
        paramCount++;
        whereConditions.push(`r.role_name = $${paramCount}`);
        queryParams.push(role);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Main query
      const usersQuery = `
        SELECT DISTINCT u.user_id, u.username, u.email, u.first_name, u.last_name,
               u.display_name, u.department, u.job_title, u.status, u.email_verified,
               u.last_login, u.created_at,
               array_agg(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
        LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = true
        ${whereClause}
        GROUP BY u.user_id, u.username, u.email, u.first_name, u.last_name,
                 u.display_name, u.department, u.job_title, u.status, u.email_verified,
                 u.last_login, u.created_at
        ORDER BY u.${sortBy} ${sortOrder}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      queryParams.push(limit, offset);

      // Count query
      const countQuery = `
        SELECT COUNT(DISTINCT u.user_id) as total
        FROM users u
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
        LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = true
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
      console.error('Get users error:', error);
      res.status(500).json({
        error: 'Failed to retrieve users',
        code: 'USER_LIST_ERROR'
      });
    }
  }
);

/**
 * GET /api/users/:userId
 * Get specific user details
 */
router.get('/:userId',
  authenticateToken,
  requirePermissions(['user.read']),
  logActivity('USER_VIEW', (req) => `Viewed user ${req.params.userId}`),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const userQuery = `
        SELECT u.user_id, u.username, u.email, u.first_name, u.last_name,
               u.display_name, u.department, u.job_title, u.phone, u.office_location,
               u.employee_id, u.status, u.email_verified, u.phone_verified,
               u.two_factor_enabled, u.last_login, u.last_password_change,
               u.profile_picture_url, u.preferences, u.metadata, u.created_at, u.updated_at,
               m.first_name as manager_first_name, m.last_name as manager_last_name,
               array_agg(DISTINCT jsonb_build_object(
                 'roleId', r.role_id,
                 'roleName', r.role_name,
                 'displayName', r.display_name,
                 'assignedAt', ur.assigned_at,
                 'expiresAt', ur.expires_at
               )) FILTER (WHERE r.role_id IS NOT NULL) as roles,
               array_agg(DISTINCT p.permission_name) FILTER (WHERE p.permission_name IS NOT NULL) as permissions
        FROM users u
        LEFT JOIN users m ON u.manager_id = m.user_id
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
        LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = true
        LEFT JOIN role_permissions rp ON r.role_id = rp.role_id AND rp.is_active = true
        LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = true
        WHERE u.user_id = $1
        GROUP BY u.user_id, u.username, u.email, u.first_name, u.last_name,
                 u.display_name, u.department, u.job_title, u.phone, u.office_location,
                 u.employee_id, u.status, u.email_verified, u.phone_verified,
                 u.two_factor_enabled, u.last_login, u.last_password_change,
                 u.profile_picture_url, u.preferences, u.metadata, u.created_at, u.updated_at,
                 m.first_name, m.last_name
      `;

      const userResult = await pool.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = userResult.rows[0];

      res.json({
        user: {
          ...user,
          manager: user.manager_first_name ? {
            firstName: user.manager_first_name,
            lastName: user.manager_last_name
          } : null,
          roles: user.roles || [],
          permissions: user.permissions || []
        }
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: 'Failed to retrieve user',
        code: 'USER_GET_ERROR'
      });
    }
  }
);

/**
 * POST /api/users
 * Create a new user
 */
router.post('/',
  authenticateToken,
  requirePermissions(['user.create']),
  createUserValidation,
  logActivity('USER_CREATE', (req) => `Created user ${req.body.username}`),
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
        username,
        email,
        password,
        firstName,
        lastName,
        department,
        jobTitle,
        phone,
        employeeId,
        managerId,
        roles = ['employee']
      } = req.body;

      // Check if username or email already exists
      const existingUserQuery = `
        SELECT user_id, username, email 
        FROM users 
        WHERE username = $1 OR email = $2
      `;
      const existingUser = await client.query(existingUserQuery, [username, email]);

      if (existingUser.rows.length > 0) {
        const existing = existingUser.rows[0];
        const field = existing.username === username ? 'username' : 'email';
        return res.status(409).json({
          error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
          code: 'USER_EXISTS',
          field
        });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate user ID
      const userId = `USR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Insert new user
      const insertUserQuery = `
        INSERT INTO users (
          user_id, username, email, password_hash, first_name, last_name,
          department, job_title, phone, employee_id, manager_id, status,
          email_verified, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING user_id, username, email, first_name, last_name, status, created_at
      `;

      const userValues = [
        userId, username, email, passwordHash, firstName, lastName,
        department, jobTitle, phone, employeeId, managerId, 'Active',
        true, req.user.user_id
      ];

      const userResult = await client.query(insertUserQuery, userValues);
      const newUser = userResult.rows[0];

      // Assign roles
      for (const roleName of roles) {
        const roleQuery = 'SELECT role_id FROM roles WHERE role_name = $1 AND is_active = true';
        const roleResult = await client.query(roleQuery, [roleName]);

        if (roleResult.rows.length > 0) {
          const assignRoleQuery = `
            INSERT INTO user_roles (user_id, role_id, assigned_by, assignment_reason)
            VALUES ($1, $2, $3, $4)
          `;
          await client.query(assignRoleQuery, [
            userId, 
            roleResult.rows[0].role_id, 
            req.user.user_id,
            'Role assigned during user creation'
          ]);
        }
      }

      // Store password in history
      const passwordHistoryQuery = `
        INSERT INTO password_history (user_id, password_hash)
        VALUES ($1, $2)
      `;
      await client.query(passwordHistoryQuery, [userId, passwordHash]);

      await client.query('COMMIT');

      res.status(201).json({
        message: 'User created successfully',
        user: {
          userId: newUser.user_id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          status: newUser.status,
          createdAt: newUser.created_at
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create user error:', error);
      res.status(500).json({
        error: 'Failed to create user',
        code: 'USER_CREATE_ERROR'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * PUT /api/users/:userId
 * Update user information
 */
router.put('/:userId',
  authenticateToken,
  requirePermissions(['user.update']),
  updateUserValidation,
  logActivity('USER_UPDATE', (req) => `Updated user ${req.params.userId}`),
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

      const { userId } = req.params;
      const {
        email,
        firstName,
        lastName,
        department,
        jobTitle,
        phone,
        employeeId,
        managerId,
        status,
        preferences
      } = req.body;

      // Check if user exists
      const existingUserQuery = 'SELECT user_id FROM users WHERE user_id = $1';
      const existingUser = await pool.query(existingUserQuery, [userId]);

      if (existingUser.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if email is already taken by another user
      if (email) {
        const emailCheckQuery = 'SELECT user_id FROM users WHERE email = $1 AND user_id != $2';
        const emailCheck = await pool.query(emailCheckQuery, [email, userId]);

        if (emailCheck.rows.length > 0) {
          return res.status(409).json({
            error: 'Email already exists',
            code: 'EMAIL_EXISTS'
          });
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramCount = 0;

      if (email !== undefined) {
        paramCount++;
        updateFields.push(`email = $${paramCount}`);
        updateValues.push(email);
      }

      if (firstName !== undefined) {
        paramCount++;
        updateFields.push(`first_name = $${paramCount}`);
        updateValues.push(firstName);
      }

      if (lastName !== undefined) {
        paramCount++;
        updateFields.push(`last_name = $${paramCount}`);
        updateValues.push(lastName);
      }

      if (department !== undefined) {
        paramCount++;
        updateFields.push(`department = $${paramCount}`);
        updateValues.push(department);
      }

      if (jobTitle !== undefined) {
        paramCount++;
        updateFields.push(`job_title = $${paramCount}`);
        updateValues.push(jobTitle);
      }

      if (phone !== undefined) {
        paramCount++;
        updateFields.push(`phone = $${paramCount}`);
        updateValues.push(phone);
      }

      if (employeeId !== undefined) {
        paramCount++;
        updateFields.push(`employee_id = $${paramCount}`);
        updateValues.push(employeeId);
      }

      if (managerId !== undefined) {
        paramCount++;
        updateFields.push(`manager_id = $${paramCount}`);
        updateValues.push(managerId);
      }

      if (status !== undefined) {
        paramCount++;
        updateFields.push(`status = $${paramCount}`);
        updateValues.push(status);
      }

      if (preferences !== undefined) {
        paramCount++;
        updateFields.push(`preferences = $${paramCount}`);
        updateValues.push(JSON.stringify(preferences));
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

      // Add userId for WHERE clause
      paramCount++;
      updateValues.push(userId);

      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramCount}
        RETURNING user_id, username, email, first_name, last_name, 
                  department, job_title, status, updated_at
      `;

      const updateResult = await pool.query(updateQuery, updateValues);
      const updatedUser = updateResult.rows[0];

      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        error: 'Failed to update user',
        code: 'USER_UPDATE_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/users/:userId
 * Delete (deactivate) a user
 */
router.delete('/:userId',
  authenticateToken,
  requirePermissions(['user.delete']),
  logActivity('USER_DELETE', (req) => `Deleted user ${req.params.userId}`),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Check if user exists
      const existingUserQuery = 'SELECT user_id, status FROM users WHERE user_id = $1';
      const existingUser = await pool.query(existingUserQuery, [userId]);

      if (existingUser.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Prevent self-deletion
      if (userId === req.user.user_id) {
        return res.status(400).json({
          error: 'Cannot delete your own account',
          code: 'SELF_DELETE_FORBIDDEN'
        });
      }

      // Deactivate user instead of hard delete
      const updateQuery = `
        UPDATE users 
        SET status = 'Inactive', updated_by = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING user_id, username, status
      `;

      const updateResult = await pool.query(updateQuery, [req.user.user_id, userId]);
      const deactivatedUser = updateResult.rows[0];

      // Deactivate all user sessions
      await pool.query(
        'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
        [userId]
      );

      res.json({
        message: 'User deactivated successfully',
        user: deactivatedUser
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        error: 'Failed to delete user',
        code: 'USER_DELETE_ERROR'
      });
    }
  }
);

/**
 * POST /api/users/:userId/roles
 * Assign roles to a user
 */
router.post('/:userId/roles',
  authenticateToken,
  requirePermissions(['user.manage_roles']),
  logActivity('USER_ROLE_ASSIGN', (req) => `Assigned roles to user ${req.params.userId}`),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;
      const { roles, reason } = req.body;

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({
          error: 'Roles array is required',
          code: 'ROLES_REQUIRED'
        });
      }

      await client.query('BEGIN');

      // Check if user exists
      const userQuery = 'SELECT user_id FROM users WHERE user_id = $1';
      const userResult = await client.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Validate roles exist
      const roleQuery = 'SELECT role_id, role_name FROM roles WHERE role_name = ANY($1) AND is_active = true';
      const roleResult = await client.query(roleQuery, [roles]);

      if (roleResult.rows.length !== roles.length) {
        const foundRoles = roleResult.rows.map(r => r.role_name);
        const missingRoles = roles.filter(r => !foundRoles.includes(r));
        return res.status(400).json({
          error: 'Some roles not found',
          code: 'ROLES_NOT_FOUND',
          missingRoles
        });
      }

      // Assign roles
      const assignedRoles = [];
      for (const role of roleResult.rows) {
        const assignQuery = `
          INSERT INTO user_roles (user_id, role_id, assigned_by, assignment_reason)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, role_id) 
          DO UPDATE SET is_active = true, assigned_by = $3, assigned_at = CURRENT_TIMESTAMP
          RETURNING role_id
        `;

        await client.query(assignQuery, [
          userId,
          role.role_id,
          req.user.user_id,
          reason || 'Role assigned via API'
        ]);

        assignedRoles.push(role.role_name);
      }

      await client.query('COMMIT');

      res.json({
        message: 'Roles assigned successfully',
        userId,
        assignedRoles
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Assign roles error:', error);
      res.status(500).json({
        error: 'Failed to assign roles',
        code: 'ROLE_ASSIGN_ERROR'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * PUT /api/users/:userId/roles
 * Update user roles (replace all roles)
 */
router.put('/:userId/roles',
  authenticateToken,
  requirePermissions(['user.manage_roles']),
  logActivity('USER_ROLE_UPDATE', (req) => `Updated roles for user ${req.params.userId}`),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId } = req.params;
      const { roles, reason } = req.body;

      if (!roles || !Array.isArray(roles)) {
        return res.status(400).json({
          error: 'Roles array is required',
          code: 'ROLES_REQUIRED'
        });
      }

      await client.query('BEGIN');

      // Check if user exists
      const userQuery = 'SELECT user_id FROM users WHERE user_id = $1';
      const userResult = await client.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Validate roles exist
      if (roles.length > 0) {
        const roleQuery = 'SELECT role_id, role_name FROM roles WHERE role_name = ANY($1) AND is_active = true';
        const roleResult = await client.query(roleQuery, [roles]);

        if (roleResult.rows.length !== roles.length) {
          const foundRoles = roleResult.rows.map(r => r.role_name);
          const missingRoles = roles.filter(r => !foundRoles.includes(r));
          return res.status(400).json({
            error: 'Some roles not found',
            code: 'ROLES_NOT_FOUND',
            missingRoles
          });
        }
      }

      // Deactivate all current roles
      await client.query(
        'UPDATE user_roles SET is_active = false WHERE user_id = $1',
        [userId]
      );

      // Assign new roles
      const assignedRoles = [];
      if (roles.length > 0) {
        const roleQuery = 'SELECT role_id, role_name FROM roles WHERE role_name = ANY($1) AND is_active = true';
        const roleResult = await client.query(roleQuery, [roles]);

        for (const role of roleResult.rows) {
          const assignQuery = `
            INSERT INTO user_roles (user_id, role_id, assigned_by, assignment_reason)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, role_id) 
            DO UPDATE SET is_active = true, assigned_by = $3, assigned_at = CURRENT_TIMESTAMP
            RETURNING role_id
          `;

          await client.query(assignQuery, [
            userId,
            role.role_id,
            req.user.user_id,
            reason || 'Role updated via API'
          ]);

          assignedRoles.push(role.role_name);
        }
      }

      await client.query('COMMIT');

      res.json({
        message: 'User roles updated successfully',
        userId,
        roles: assignedRoles
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Update user roles error:', error);
      res.status(500).json({
        error: 'Failed to update user roles',
        code: 'ROLE_UPDATE_ERROR'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * DELETE /api/users/:userId/roles/:roleId
 * Remove a role from a user
 */
router.delete('/:userId/roles/:roleId',
  authenticateToken,
  requirePermissions(['user.manage_roles']),
  logActivity('USER_ROLE_REMOVE', (req) => `Removed role ${req.params.roleId} from user ${req.params.userId}`),
  async (req, res) => {
    try {
      const { userId, roleId } = req.params;

      // Check if user and role assignment exist
      const checkQuery = `
        SELECT ur.id, r.role_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.role_id
        WHERE ur.user_id = $1 AND ur.role_id = $2 AND ur.is_active = true
      `;

      const checkResult = await pool.query(checkQuery, [userId, roleId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User role assignment not found',
          code: 'USER_ROLE_NOT_FOUND'
        });
      }

      // Remove role assignment
      const removeQuery = `
        UPDATE user_roles 
        SET is_active = false 
        WHERE user_id = $1 AND role_id = $2
      `;

      await pool.query(removeQuery, [userId, roleId]);

      res.json({
        message: 'Role removed successfully',
        userId,
        roleId,
        roleName: checkResult.rows[0].role_name
      });

    } catch (error) {
      console.error('Remove role error:', error);
      res.status(500).json({
        error: 'Failed to remove role',
        code: 'ROLE_REMOVE_ERROR'
      });
    }
  }
);

/**
 * GET /api/users/:userId/activity
 * Get user activity log
 */
router.get('/:userId/activity',
  authenticateToken,
  requirePermissions(['system.audit']),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 50, activityType } = req.query;

      const offset = (page - 1) * limit;

      let whereClause = 'WHERE user_id = $1';
      let queryParams = [userId];

      if (activityType) {
        whereClause += ' AND activity_type = $2';
        queryParams.push(activityType);
      }

      const activityQuery = `
        SELECT log_id, activity_type, activity_description, resource, action,
               ip_address, success, created_at
        FROM user_activity_log
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;

      queryParams.push(limit, offset);

      const activityResult = await pool.query(activityQuery, queryParams);

      res.json({
        activities: activityResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get user activity error:', error);
      res.status(500).json({
        error: 'Failed to retrieve user activity',
        code: 'USER_ACTIVITY_ERROR'
      });
    }
  }
);

module.exports = router;