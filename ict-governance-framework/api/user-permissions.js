require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const { 
  requirePermission, 
  requireSystemAdmin,
  getUserPermissions,
  getUserRolesWithPermissions,
  checkUserPermission
} = require('../middleware/permissions');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get current user's permissions
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [permissions, rolesWithPermissions] = await Promise.all([
      getUserPermissions(userId),
      getUserRolesWithPermissions(userId)
    ]);

    // Group permissions by category
    const permissionsByCategory = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});

    // Group roles with their permissions
    const rolePermissions = rolesWithPermissions.reduce((acc, item) => {
      if (!acc[item.role_name]) {
        acc[item.role_name] = {
          role_name: item.role_name,
          role_description: item.role_description,
          permissions: []
        };
      }
      if (item.permission_name) {
        acc[item.role_name].permissions.push({
          permission_name: item.permission_name,
          permission_description: item.permission_description,
          permission_category: item.permission_category
        });
      }
      return acc;
    }, {});

    res.json({
      user_id: userId,
      username: req.user.username,
      permissions: permissions,
      permissions_by_category: permissionsByCategory,
      roles: Object.values(rolePermissions),
      total_permissions: permissions.length,
      total_roles: Object.keys(rolePermissions).length
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});

// Check if current user has specific permission
router.get('/me/check/:permission', async (req, res) => {
  try {
    const userId = req.user.id;
    const { permission } = req.params;

    const hasPermission = await checkUserPermission(userId, permission);

    res.json({
      user_id: userId,
      permission: permission,
      has_permission: hasPermission
    });
  } catch (error) {
    console.error('Error checking user permission:', error);
    res.status(500).json({ error: 'Failed to check user permission' });
  }
});

// Get permissions for specific user (admin only)
router.get('/user/:userId', requireSystemAdmin(), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user exists
    const userCheck = await pool.query('SELECT username, email FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userCheck.rows[0];
    
    const [permissions, rolesWithPermissions] = await Promise.all([
      getUserPermissions(userId),
      getUserRolesWithPermissions(userId)
    ]);

    // Group permissions by category
    const permissionsByCategory = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});

    // Group roles with their permissions
    const rolePermissions = rolesWithPermissions.reduce((acc, item) => {
      if (!acc[item.role_name]) {
        acc[item.role_name] = {
          role_name: item.role_name,
          role_description: item.role_description,
          permissions: []
        };
      }
      if (item.permission_name) {
        acc[item.role_name].permissions.push({
          permission_name: item.permission_name,
          permission_description: item.permission_description,
          permission_category: item.permission_category
        });
      }
      return acc;
    }, {});

    res.json({
      user_id: parseInt(userId),
      username: user.username,
      email: user.email,
      permissions: permissions,
      permissions_by_category: permissionsByCategory,
      roles: Object.values(rolePermissions),
      total_permissions: permissions.length,
      total_roles: Object.keys(rolePermissions).length
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});

// Get all available permissions (admin only)
router.get('/available', requireSystemAdmin(), async (req, res) => {
  try {
    const { category, resource_type } = req.query;

    let query = `
      SELECT 
        permission_name,
        description,
        category,
        resource_type,
        created_at
      FROM permissions
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      values.push(category);
    }

    if (resource_type) {
      paramCount++;
      query += ` AND resource_type = $${paramCount}`;
      values.push(resource_type);
    }

    query += ` ORDER BY category, permission_name`;

    const result = await pool.query(query, values);

    // Group by category
    const permissionsByCategory = result.rows.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});

    res.json({
      permissions: result.rows,
      permissions_by_category: permissionsByCategory,
      total_permissions: result.rows.length,
      categories: Object.keys(permissionsByCategory)
    });
  } catch (error) {
    console.error('Error fetching available permissions:', error);
    res.status(500).json({ error: 'Failed to fetch available permissions' });
  }
});

// Get all available roles (admin only)
router.get('/roles', requireSystemAdmin(), async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.role_name,
        r.description,
        r.is_system_role,
        r.created_at,
        COUNT(rp.permission_id) as permission_count,
        STRING_AGG(p.category, ', ' ORDER BY p.category) as categories
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      GROUP BY r.id, r.role_name, r.description, r.is_system_role, r.created_at
      ORDER BY r.role_name
    `;

    const result = await pool.query(query);

    res.json({
      roles: result.rows,
      total_roles: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Get role details with permissions (admin only)
router.get('/roles/:roleId', requireSystemAdmin(), async (req, res) => {
  try {
    const { roleId } = req.params;

    const roleQuery = `
      SELECT 
        r.id,
        r.role_name,
        r.description,
        r.is_system_role,
        r.created_at,
        u.username as created_by_username
      FROM roles r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = $1
    `;

    const permissionsQuery = `
      SELECT 
        p.permission_name,
        p.description,
        p.category,
        p.resource_type
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
      ORDER BY p.category, p.permission_name
    `;

    const usersQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        ur.assigned_at,
        ur.is_active
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.role_id = $1
      ORDER BY u.username
    `;

    const [roleResult, permissionsResult, usersResult] = await Promise.all([
      pool.query(roleQuery, [roleId]),
      pool.query(permissionsQuery, [roleId]),
      pool.query(usersQuery, [roleId])
    ]);

    if (roleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const role = roleResult.rows[0];
    const permissions = permissionsResult.rows;
    const users = usersResult.rows;

    // Group permissions by category
    const permissionsByCategory = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});

    res.json({
      role: role,
      permissions: permissions,
      permissions_by_category: permissionsByCategory,
      users: users,
      total_permissions: permissions.length,
      total_users: users.length,
      active_users: users.filter(u => u.is_active).length
    });
  } catch (error) {
    console.error('Error fetching role details:', error);
    res.status(500).json({ error: 'Failed to fetch role details' });
  }
});

// Assign role to user (admin only)
router.post('/users/:userId/roles', requireSystemAdmin(), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { userId } = req.params;
    const { role_id, role_name } = req.body;

    if (!role_id && !role_name) {
      return res.status(400).json({ error: 'Either role_id or role_name is required' });
    }

    // Get role ID if role_name is provided
    let finalRoleId = role_id;
    if (!finalRoleId && role_name) {
      const roleResult = await client.query('SELECT id FROM roles WHERE role_name = $1', [role_name]);
      if (roleResult.rows.length === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }
      finalRoleId = roleResult.rows[0].id;
    }

    // Check if user exists
    const userCheck = await client.query('SELECT username FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if role assignment already exists
    const existingAssignment = await client.query(
      'SELECT id, is_active FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, finalRoleId]
    );

    if (existingAssignment.rows.length > 0) {
      // Reactivate if inactive
      if (!existingAssignment.rows[0].is_active) {
        await client.query(
          'UPDATE user_roles SET is_active = true, assigned_at = NOW() WHERE user_id = $1 AND role_id = $2',
          [userId, finalRoleId]
        );
      } else {
        return res.status(409).json({ error: 'User already has this role' });
      }
    } else {
      // Create new assignment
      await client.query(
        'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3)',
        [userId, finalRoleId, req.user.id]
      );
    }

    // Log the assignment
    await client.query(`
      INSERT INTO permission_audit_log (
        user_id, action, resource_type, resource_id, new_value, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      req.user.id,
      'ROLE_ASSIGNED',
      'user_role',
      userId,
      JSON.stringify({ role_id: finalRoleId, assigned_to: userId })
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Role assigned successfully',
      user_id: parseInt(userId),
      role_id: finalRoleId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error assigning role:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  } finally {
    client.release();
  }
});

// Remove role from user (admin only)
router.delete('/users/:userId/roles/:roleId', requireSystemAdmin(), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { userId, roleId } = req.params;

    // Check if assignment exists
    const assignmentCheck = await client.query(
      'SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2 AND is_active = true',
      [userId, roleId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Role assignment not found' });
    }

    // Deactivate the assignment
    await client.query(
      'UPDATE user_roles SET is_active = false, removed_at = NOW(), removed_by = $1 WHERE user_id = $2 AND role_id = $3',
      [req.user.id, userId, roleId]
    );

    // Log the removal
    await client.query(`
      INSERT INTO permission_audit_log (
        user_id, action, resource_type, resource_id, old_value, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      req.user.id,
      'ROLE_REMOVED',
      'user_role',
      userId,
      JSON.stringify({ role_id: roleId, removed_from: userId })
    ]);

    await client.query('COMMIT');

    res.json({
      message: 'Role removed successfully',
      user_id: parseInt(userId),
      role_id: parseInt(roleId)
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error removing role:', error);
    res.status(500).json({ error: 'Failed to remove role' });
  } finally {
    client.release();
  }
});

// Get permission audit log (admin only)
router.get('/audit', requireSystemAdmin(), async (req, res) => {
  try {
    const { 
      user_id, 
      action, 
      limit = 50, 
      offset = 0,
      start_date,
      end_date
    } = req.query;

    let query = `
      SELECT 
        pal.*,
        u.username
      FROM permission_audit_log pal
      LEFT JOIN users u ON pal.user_id = u.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 0;

    if (user_id) {
      paramCount++;
      query += ` AND pal.user_id = $${paramCount}`;
      values.push(user_id);
    }

    if (action) {
      paramCount++;
      query += ` AND pal.action = $${paramCount}`;
      values.push(action);
    }

    if (start_date) {
      paramCount++;
      query += ` AND pal.created_at >= $${paramCount}`;
      values.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND pal.created_at <= $${paramCount}`;
      values.push(end_date);
    }

    query += ` ORDER BY pal.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.json({
      audit_log: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Get permission statistics (admin only)
router.get('/stats', requireSystemAdmin(), async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM permissions) as total_permissions,
        (SELECT COUNT(*) FROM roles) as total_roles,
        (SELECT COUNT(*) FROM user_roles WHERE is_active = true) as active_role_assignments,
        (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE is_active = true) as users_with_roles,
        (SELECT COUNT(*) FROM permission_audit_log WHERE created_at >= NOW() - INTERVAL '30 days') as recent_audit_entries
    `;

    const categoryQuery = `
      SELECT 
        category,
        COUNT(*) as permission_count
      FROM permissions
      GROUP BY category
      ORDER BY permission_count DESC
    `;

    const roleUsageQuery = `
      SELECT 
        r.role_name,
        COUNT(ur.user_id) as user_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = true
      GROUP BY r.id, r.role_name
      ORDER BY user_count DESC
      LIMIT 10
    `;

    const [statsResult, categoryResult, roleUsageResult] = await Promise.all([
      pool.query(statsQuery),
      pool.query(categoryQuery),
      pool.query(roleUsageQuery)
    ]);

    res.json({
      statistics: statsResult.rows[0],
      permissions_by_category: categoryResult.rows,
      role_usage: roleUsageResult.rows
    });
  } catch (error) {
    console.error('Error fetching permission statistics:', error);
    res.status(500).json({ error: 'Failed to fetch permission statistics' });
  }
});

module.exports = router;