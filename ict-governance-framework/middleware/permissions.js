require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Enhanced permission middleware for Express with database integration
function requirePermission(permission) {
  return async function (req, res, next) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      }

      const userId = req.user.id;

      // Handle multiple permissions (OR logic)
      const permissions = Array.isArray(permission) ? permission : [permission];

      // Check if user has any of the required permissions
      for (const perm of permissions) {
        const hasPermission = await checkUserPermission(userId, perm);
        if (hasPermission) {
          return next(); // User has at least one required permission
        }
      }

      // Log permission denial for audit
      await logPermissionDenial(userId, permissions, req);

      return res.status(403).json({ 
        error: 'Forbidden: Missing required permission(s)', 
        required_permissions: permissions,
        message: 'You do not have sufficient permissions to perform this action'
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Internal server error during permission check' });
    }
  };
}

// Check if user has specific permission
async function checkUserPermission(userId, permissionName) {
  try {
    const query = `
      SELECT user_has_permission($1, $2) as has_permission
    `;
    
    const result = await pool.query(query, [userId, permissionName]);
    return result.rows[0]?.has_permission || false;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

// Get all user permissions
async function getUserPermissions(userId) {
  try {
    const query = `
      SELECT permission_name, description, category 
      FROM get_user_permissions($1)
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

// Get user roles with permissions
async function getUserRolesWithPermissions(userId) {
  try {
    const query = `
      SELECT role_name, role_description, permission_name, permission_description, permission_category
      FROM get_user_roles_with_permissions($1)
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting user roles with permissions:', error);
    return [];
  }
}

// Check multiple permissions (AND logic)
function requireAllPermissions(permissions) {
  return async function (req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      }

      const userId = req.user.id;
      const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

      // Check if user has ALL required permissions
      for (const permission of permissionArray) {
        const hasPermission = await checkUserPermission(userId, permission);
        if (!hasPermission) {
          await logPermissionDenial(userId, permissionArray, req);
          return res.status(403).json({ 
            error: 'Forbidden: Missing required permission', 
            required_permission: permission,
            message: 'You do not have sufficient permissions to perform this action'
          });
        }
      }

      return next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Internal server error during permission check' });
    }
  };
}

// Check if user has any role
function requireRole(roles) {
  return async function (req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      }

      const userId = req.user.id;
      const roleArray = Array.isArray(roles) ? roles : [roles];

      const query = `
        SELECT r.role_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1 AND ur.is_active = true
        AND r.role_name = ANY($2)
      `;

      const result = await pool.query(query, [userId, roleArray]);

      if (result.rows.length === 0) {
        await logPermissionDenial(userId, roleArray, req, 'role_check');
        return res.status(403).json({ 
          error: 'Forbidden: Missing required role', 
          required_roles: roleArray,
          message: 'You do not have the required role to perform this action'
        });
      }

      return next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Internal server error during role check' });
    }
  };
}

// Middleware to add user permissions to request object
function attachUserPermissions() {
  return async function (req, res, next) {
    try {
      if (req.user && req.user.id) {
        const permissions = await getUserPermissions(req.user.id);
        req.user.permissions = permissions.map(p => p.permission_name);
        req.user.permissionDetails = permissions;
      }
      next();
    } catch (error) {
      console.error('Error attaching user permissions:', error);
      next(); // Continue without permissions
    }
  };
}

// Log permission denial for audit
async function logPermissionDenial(userId, permissions, req, action = 'permission_check') {
  try {
    const query = `
      INSERT INTO permission_audit_log (
        user_id, action, resource_type, permission_name, 
        old_value, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;

    const permissionNames = Array.isArray(permissions) ? permissions.join(', ') : permissions;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    await pool.query(query, [
      userId,
      'PERMISSION_DENIED',
      action,
      permissionNames,
      JSON.stringify({
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      }),
      ipAddress,
      userAgent
    ]);
  } catch (error) {
    console.error('Error logging permission denial:', error);
  }
}

// Check if user is system administrator
function requireSystemAdmin() {
  return requireRole(['admin', 'notification_administrator']);
}

// Check if user can manage specific resource type
function requireResourceManagement(resourceType) {
  const permissionMap = {
    'notification': 'notification.manage',
    'alert': 'alert.manage',
    'communication': 'communication.manage',
    'announcement': 'announcement.manage',
    'escalation': 'escalation.manage'
  };

  const permission = permissionMap[resourceType];
  if (!permission) {
    throw new Error(`Unknown resource type: ${resourceType}`);
  }

  return requirePermission(permission);
}

// Middleware for API endpoints that require specific permissions
function apiPermissionCheck(permissionConfig) {
  return function(req, res, next) {
    const method = req.method.toLowerCase();
    const permission = permissionConfig[method];

    if (!permission) {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    return requirePermission(permission)(req, res, next);
  };
}

// Helper function to check permissions in route handlers
async function hasPermission(userId, permission) {
  return await checkUserPermission(userId, permission);
}

// Helper function to get user's effective permissions
async function getEffectivePermissions(userId) {
  return await getUserPermissions(userId);
}

module.exports = {
  requirePermission,
  requireAllPermissions,
  requireRole,
  requireSystemAdmin,
  requireResourceManagement,
  attachUserPermissions,
  apiPermissionCheck,
  hasPermission,
  getEffectivePermissions,
  getUserPermissions,
  getUserRolesWithPermissions,
  checkUserPermission
};
