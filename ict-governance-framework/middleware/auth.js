// File: ict-governance-framework/middleware/auth.js
// Authentication and authorization middleware for the ICT Governance Framework

const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// JWT secret keys (should be in environment variables)
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    
    // Get user details from database
    const userQuery = `
      SELECT u.*, 
             array_agg(DISTINCT r.role_name) as roles,
             array_agg(DISTINCT p.permission_name) as permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = true
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id AND rp.is_active = true
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = true
      WHERE u.user_id = $1 AND u.status = 'Active'
      GROUP BY u.id, u.user_id, u.username, u.email, u.first_name, u.last_name, 
               u.display_name, u.department, u.job_title, u.status, u.created_at
    `;

    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];
    
    // Check if session is still valid
    const sessionQuery = `
      SELECT session_id, expires_at, is_active 
      FROM user_sessions 
      WHERE user_id = $1 AND session_id = $2 AND is_active = true
    `;
    
    const sessionResult = await pool.query(sessionQuery, [decoded.userId, decoded.sessionId]);
    
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Session not found or expired',
        code: 'SESSION_INVALID'
      });
    }

    const session = sessionResult.rows[0];
    
    if (new Date() > new Date(session.expires_at)) {
      return res.status(401).json({ 
        error: 'Session expired',
        code: 'SESSION_EXPIRED'
      });
    }

    // Update last activity
    await pool.query(
      'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = $1',
      [decoded.sessionId]
    );

    // Attach user info to request
    req.user = {
      ...user,
      sessionId: decoded.sessionId,
      roles: user.roles.filter(r => r !== null),
      permissions: user.permissions.filter(p => p !== null)
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else {
      console.error('Authentication error:', error);
      return res.status(500).json({ 
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  }
};

/**
 * Middleware to check if user has required permissions
 */
const requirePermissions = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userPermissions = req.user.permissions || [];
    
    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      // Log unauthorized access attempt
      logUserActivity(req, 'UNAUTHORIZED_ACCESS', 'Access denied - insufficient permissions', false);
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: requiredPermissions,
        current: userPermissions
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has any of the required roles
 */
const requireRoles = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRoles = req.user.roles || [];
    
    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => 
      userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      // Log unauthorized access attempt
      logUserActivity(req, 'UNAUTHORIZED_ACCESS', 'Access denied - insufficient roles', false);
      
      return res.status(403).json({ 
        error: 'Insufficient role privileges',
        code: 'INSUFFICIENT_ROLES',
        required: requiredRoles,
        current: userRoles
      });
    }

    next();
  };
};

/**

 * Middleware to check if user is admin (has admin or super_admin role)
 */
const requireAdmin = requireRoles(['admin', 'super_admin']);

/**
 * Middleware to check if user is super admin
 */
const requireSuperAdmin = requireRoles(['super_admin']);

/**
 * Middleware to log user activities
 */
const logActivity = (activityType, getDescription) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the activity after response
      setImmediate(() => {
        const description = typeof getDescription === 'function' 
          ? getDescription(req, data) 
          : getDescription || activityType;
        
        const success = res.statusCode >= 200 && res.statusCode < 400;
        logUserActivity(req, activityType, description, success, data);
      });
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Function to log user activity to database
 */
async function logUserActivity(req, activityType, description, success = true, responseData = null) {
  try {
    const logId = uuidv4();
    const userId = req.user?.user_id || null;
    const sessionId = req.user?.sessionId || null;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // Extract relevant request data (excluding sensitive information)
    const requestData = {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      // Don't log request body for security reasons, but log if it exists
      hasBody: !!req.body && Object.keys(req.body).length > 0
    };

    const insertQuery = `
      INSERT INTO user_activity_log (
        log_id, user_id, session_id, activity_type, activity_description,
        resource, action, ip_address, user_agent, request_data,
        response_status, success, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;

    const values = [
      logId,
      userId,
      sessionId,
      activityType,
      description,
      req.route?.path || req.originalUrl,
      req.method,
      ipAddress,
      userAgent,
      JSON.stringify(requestData),
  (req.res ? req.res.statusCode : (req.statusCode || 200)),
      success,
      success ? null : (responseData?.error || 'Unknown error')
    ];

    await pool.query(insertQuery, values);
  } catch (error) {
    console.error('Failed to log user activity:', error);
    // Don't throw error to avoid breaking the main request
  }
}

/**
 * Middleware for optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    // Use the same logic as authenticateToken but don't fail
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    
    const userQuery = `
      SELECT u.*, 
             array_agg(DISTINCT r.role_name) as roles,
             array_agg(DISTINCT p.permission_name) as permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = true
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id AND rp.is_active = true
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = true
      WHERE u.user_id = $1 AND u.status = 'Active'
      GROUP BY u.id, u.user_id, u.username, u.email, u.first_name, u.last_name, 
               u.display_name, u.department, u.job_title, u.status, u.created_at
    `;

    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      req.user = {
        ...user,
        sessionId: decoded.sessionId,
        roles: user.roles.filter(r => r !== null),
        permissions: user.permissions.filter(p => p !== null)
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If optional auth fails, just continue without user
    req.user = null;
    next();
  }
};

/**
 * Utility function to generate JWT tokens
 */
function generateTokens(userId, sessionId) {
  const accessToken = jwt.sign(
    { userId, sessionId, type: 'access' },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, sessionId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

/**
 * Utility function to verify refresh token
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
  authenticateToken,
  requirePermissions,
  requireRoles,
  logActivity,
  logUserActivity,
  requireAdmin,
  requireSuperAdmin,
  logActivity,
  logUserActivity,
  optionalAuth,
  generateTokens,
  verifyRefreshToken
};