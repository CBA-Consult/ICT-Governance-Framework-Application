// File: ict-governance-framework/middleware/dashboardAuth.js
// Dashboard-specific authentication and authorization middleware

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';

/**
 * Middleware to check dashboard access permissions
 * @param {string} dashboardType - Type of dashboard (executive, operational, compliance, analytics)
 * @returns {Function} Express middleware function
 */
const requireDashboardAccess = (dashboardType) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access token required for dashboard access'
        });
      }

      const token = authHeader.substring(7);
      let decoded;
      
      try {
        decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired access token'
        });
      }

      // Get user permissions
      const permissionQuery = `
        SELECT DISTINCT p.permission_name, p.resource, p.action
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        JOIN role_permissions rp ON r.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE u.user_id = $1 
          AND u.status = 'Active'
          AND ur.is_active = true
          AND r.is_active = true
          AND rp.is_active = true
          AND p.is_active = true
      `;

      const permissionResult = await pool.query(permissionQuery, [decoded.userId]);
      const userPermissions = permissionResult.rows.map(row => row.permission_name);

      // Define required permissions for each dashboard type
      const dashboardPermissions = {
        executive: ['dashboard.executive'],
        operational: ['dashboard.operational'],
        compliance: ['dashboard.compliance'],
        analytics: ['dashboard.analytics'],
        export: ['dashboard.export'],
        admin: ['dashboard.admin']
      };

      // Check if user has required permission for the dashboard type
      const requiredPermissions = dashboardPermissions[dashboardType];
      if (!requiredPermissions) {
        return res.status(400).json({
          success: false,
          message: 'Invalid dashboard type specified'
        });
      }

      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        // Log access attempt
        await logDashboardAccess(decoded.userId, dashboardType, false, req.ip);
        
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${requiredPermissions.join(' or ')}`,
          dashboardType,
          userPermissions: userPermissions.filter(p => p.startsWith('dashboard.'))
        });
      }

      // Log successful access
      await logDashboardAccess(decoded.userId, dashboardType, true, req.ip);

      // Add user info and permissions to request
      req.user = {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        permissions: userPermissions,
        dashboardAccess: {
          type: dashboardType,
          granted: true
        }
      };

      next();
    } catch (error) {
      console.error('Dashboard authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during dashboard authorization'
      });
    }
  };
};

/**
 * Middleware to check multiple dashboard permissions (OR logic)
 * @param {string[]} dashboardTypes - Array of dashboard types
 * @returns {Function} Express middleware function
 */
const requireAnyDashboardAccess = (dashboardTypes) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access token required for dashboard access'
        });
      }

      const token = authHeader.substring(7);
      let decoded;
      
      try {
        decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired access token'
        });
      }

      // Get user permissions
      const permissionQuery = `
        SELECT DISTINCT p.permission_name, p.resource, p.action
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        JOIN role_permissions rp ON r.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE u.user_id = $1 
          AND u.status = 'Active'
          AND ur.is_active = true
          AND r.is_active = true
          AND rp.is_active = true
          AND p.is_active = true
      `;

      const permissionResult = await pool.query(permissionQuery, [decoded.userId]);
      const userPermissions = permissionResult.rows.map(row => row.permission_name);

      // Check if user has any of the required dashboard permissions
      const dashboardPermissions = {
        executive: 'dashboard.executive',
        operational: 'dashboard.operational',
        compliance: 'dashboard.compliance',
        analytics: 'dashboard.analytics',
        export: 'dashboard.export',
        admin: 'dashboard.admin'
      };

      const requiredPermissions = dashboardTypes.map(type => dashboardPermissions[type]).filter(Boolean);
      const hasAnyPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permissions: ${requiredPermissions.join(' or ')}`,
          dashboardTypes,
          userPermissions: userPermissions.filter(p => p.startsWith('dashboard.'))
        });
      }

      // Determine which dashboards the user can access
      const accessibleDashboards = dashboardTypes.filter(type => 
        userPermissions.includes(dashboardPermissions[type])
      );

      // Add user info and permissions to request
      req.user = {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        permissions: userPermissions,
        dashboardAccess: {
          accessible: accessibleDashboards,
          all: dashboardTypes
        }
      };

      next();
    } catch (error) {
      console.error('Dashboard authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during dashboard authorization'
      });
    }
  };
};

/**
 * Get user's dashboard permissions
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Dashboard permissions object
 */
const getUserDashboardPermissions = async (userId) => {
  try {
    // Get dashboard permissions
    const permissionQuery = `
      SELECT DISTINCT p.permission_name, p.display_name, p.description
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id
      JOIN roles r ON ur.role_id = r.role_id
      JOIN role_permissions rp ON r.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE u.user_id = $1 
        AND u.status = 'Active'
        AND ur.is_active = true
        AND r.is_active = true
        AND rp.is_active = true
        AND p.is_active = true
        AND p.resource = 'dashboards'
    `;

    // Get user roles to check for admin/super admin status
    const roleQuery = `
      SELECT DISTINCT r.role_name, r.role_type, r.role_hierarchy_level
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id
      JOIN roles r ON ur.role_id = r.role_id
      WHERE u.user_id = $1 
        AND u.status = 'Active'
        AND ur.is_active = true
        AND r.is_active = true
    `;

    const [permissionResult, roleResult] = await Promise.all([
      pool.query(permissionQuery, [userId]),
      pool.query(roleQuery, [userId])
    ]);

    const permissions = permissionResult.rows;
    const roles = roleResult.rows;

    // Check if user has super admin or admin roles
    const isSuperAdmin = roles.some(r => r.role_name === 'super_admin');
    const isAdmin = roles.some(r => r.role_name === 'admin');
    const hasHighLevelRole = roles.some(r => r.role_hierarchy_level >= 80); // Governance Manager level and above

    return {
      executive: permissions.some(p => p.permission_name === 'dashboard.executive'),
      operational: permissions.some(p => p.permission_name === 'dashboard.operational'),
      compliance: permissions.some(p => p.permission_name === 'dashboard.compliance'),
      analytics: permissions.some(p => p.permission_name === 'dashboard.analytics'),
      export: permissions.some(p => p.permission_name === 'dashboard.export'),
      admin: permissions.some(p => p.permission_name === 'dashboard.admin'),
      // Include role-based flags for dashboard access logic
      super_admin: isSuperAdmin,
      superAdmin: isSuperAdmin, // Alternative naming
      administrator: isAdmin,
      hasHighLevelAccess: hasHighLevelRole,
      roles: roles.map(r => r.role_name),
      permissions: permissions
    };
  } catch (error) {
    console.error('Error getting user dashboard permissions:', error);
    throw error;
  }
};

/**
 * Log dashboard access attempts
 * @param {string} userId - User ID
 * @param {string} dashboardType - Dashboard type
 * @param {boolean} success - Whether access was granted
 * @param {string} ipAddress - IP address
 */
const logDashboardAccess = async (userId, dashboardType, success, ipAddress) => {
  try {
    const logQuery = `
      INSERT INTO user_activity_log (
        log_id, user_id, activity_type, activity_description, 
        resource, action, ip_address, success, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP
      )
    `;

    const logId = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const activityDescription = success 
      ? `Successfully accessed ${dashboardType} dashboard`
      : `Failed to access ${dashboardType} dashboard - insufficient permissions`;

    await pool.query(logQuery, [
      logId,
      userId,
      'dashboard_access',
      activityDescription,
      'dashboards',
      dashboardType,
      ipAddress,
      success
    ]);
  } catch (error) {
    console.error('Error logging dashboard access:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

module.exports = {
  requireDashboardAccess,
  requireAnyDashboardAccess,
  getUserDashboardPermissions,
  logDashboardAccess
};