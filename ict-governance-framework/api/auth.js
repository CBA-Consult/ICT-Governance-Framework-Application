// File: ict-governance-framework/api/auth.js
// Authentication API endpoints for the ICT Governance Framework

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const { 
  authenticateToken, 
  generateTokens, 
  verifyRefreshToken,
  logUserActivity 
} = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  message: {
    error: 'Too many registration attempts, please try again later',
    code: 'REGISTRATION_RATE_LIMIT'
  }
});

// Validation rules
const registerValidation = [
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
    .trim()
];

const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', registerLimiter, registerValidation, async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Check validation errors
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
      employeeId
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

    // Generate user ID and verification token
    const userId = `USR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert new user
    const insertUserQuery = `
      INSERT INTO users (
        user_id, username, email, password_hash, first_name, last_name,
        department, job_title, phone, employee_id, status,
        email_verification_token, email_verification_expires
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING user_id, username, email, first_name, last_name, status, created_at
    `;

    const userValues = [
      userId, username, email, passwordHash, firstName, lastName,
      department, jobTitle, phone, employeeId, 'Pending',
      emailVerificationToken, emailVerificationExpires
    ];

    const userResult = await client.query(insertUserQuery, userValues);
    const newUser = userResult.rows[0];

    // Assign default employee role
    const assignRoleQuery = `
      INSERT INTO user_roles (user_id, role_id, assigned_by, assignment_reason)
      VALUES ($1, 'ROLE_EMPLOYEE', $1, 'Default role assignment during registration')
    `;
    await client.query(assignRoleQuery, [userId]);

    // Store password in history
    const passwordHistoryQuery = `
      INSERT INTO password_history (user_id, password_hash)
      VALUES ($1, $2)
    `;
    await client.query(passwordHistoryQuery, [userId, passwordHash]);

    await client.query('COMMIT');

    // TODO: Send verification email (implement email service)
    console.log(`Email verification token for ${email}: ${emailVerificationToken}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        userId: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        status: newUser.status,
        createdAt: newUser.created_at
      },
      verificationRequired: true
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', authLimiter, loginValidation, async (req, res) => {
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

    const { username, password, twoFactorCode } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Find user by username or email
    const userQuery = `
      SELECT u.*, 
             array_agg(DISTINCT r.role_name) as roles,
             array_agg(DISTINCT p.permission_name) as permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = true
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id AND rp.is_active = true
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = true
      WHERE (u.username = $1 OR u.email = $1)
      GROUP BY u.id, u.user_id, u.username, u.email, u.password_hash, u.first_name, 
               u.last_name, u.status, u.email_verified, u.two_factor_enabled, 
               u.two_factor_secret, u.failed_login_attempts, u.account_locked_until
    `;

    const userResult = await client.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
      return res.status(423).json({
        error: 'Account is temporarily locked due to too many failed attempts',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.account_locked_until
      });
    }

    // Check if account is active
    if (user.status !== 'Active') {
      return res.status(401).json({
        error: 'Account is not active',
        code: 'ACCOUNT_INACTIVE',
        status: user.status
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      let lockUntil = null;

      // Lock account after 5 failed attempts for 30 minutes
      if (failedAttempts >= 5) {
        lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await client.query(
        'UPDATE users SET failed_login_attempts = $1, account_locked_until = $2 WHERE user_id = $3',
        [failedAttempts, lockUntil, user.user_id]
      );

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check two-factor authentication if enabled
    if (user.two_factor_enabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          message: 'Two-factor authentication required',
          requiresTwoFactor: true,
          tempToken: generateTempToken(user.user_id)
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({
          error: 'Invalid two-factor authentication code',
          code: 'INVALID_2FA'
        });
      }
    }

    // Reset failed login attempts
    await client.query(
      'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    // Create new session
    const sessionId = uuidv4();
    const { accessToken, refreshToken } = generateTokens(user.user_id, sessionId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const sessionQuery = `
      INSERT INTO user_sessions (
        session_id, user_id, refresh_token, device_info, ip_address, 
        user_agent, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const deviceInfo = {
      platform: req.get('sec-ch-ua-platform') || 'Unknown',
      browser: req.get('sec-ch-ua') || 'Unknown'
    };

    await client.query(sessionQuery, [
      sessionId, user.user_id, refreshToken, JSON.stringify(deviceInfo),
      ipAddress, userAgent, expiresAt
    ]);

    // Log successful login
    await logUserActivity({
      user: { user_id: user.user_id, sessionId },
      ip: ipAddress,
      get: () => userAgent,
      method: 'POST',
      originalUrl: '/api/auth/login'
    }, 'LOGIN', 'User logged in successfully', true);

    res.json({
      message: 'Login successful',
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: user.display_name,
        department: user.department,
        jobTitle: user.job_title,
        roles: user.roles.filter(r => r !== null),
        permissions: user.permissions.filter(p => p !== null)
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900 // 15 minutes in seconds
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if session exists and is active
    const sessionQuery = `
      SELECT s.*, u.status as user_status
      FROM user_sessions s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.session_id = $1 AND s.refresh_token = $2 AND s.is_active = true
    `;

    const sessionResult = await pool.query(sessionQuery, [decoded.sessionId, refreshToken]);

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const session = sessionResult.rows[0];

    if (new Date() > new Date(session.expires_at)) {
      return res.status(401).json({
        error: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }

    if (session.user_status !== 'Active') {
      return res.status(401).json({
        error: 'User account is not active',
        code: 'USER_INACTIVE'
      });
    }

    // Generate new access token
    const { accessToken } = generateTokens(decoded.userId, decoded.sessionId);

    // Update session activity
    await pool.query(
      'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = $1',
      [decoded.sessionId]
    );

    res.json({
      accessToken,
      expiresIn: 900 // 15 minutes in seconds
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      code: 'REFRESH_ERROR'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.user;

    // Invalidate session
    await pool.query(
      'UPDATE user_sessions SET is_active = false WHERE session_id = $1',
      [sessionId]
    );

    // Log logout activity
    await logUserActivity(req, 'LOGOUT', 'User logged out', true);

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**

 * POST /api/auth/logout-all
 * Logout from all devices
 */
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.user;

    // Invalidate all sessions for the user
    await pool.query(
      'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
      [user_id]
    );

    // Log logout all activity
    await logUserActivity(req, 'LOGOUT_ALL', 'User logged out from all devices', true);

    res.json({
      message: 'Logged out from all devices successfully'
    });

  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      error: 'Logout from all devices failed',
      code: 'LOGOUT_ALL_ERROR'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information (basic profile data)
 * Note: For complete profile data, use GET /api/profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: user.display_name,
        department: user.department,
        jobTitle: user.job_title,
        phone: user.phone,
        status: user.status,
        emailVerified: user.email_verified,
        twoFactorEnabled: user.two_factor_enabled,
        lastLogin: user.last_login,
        roles: user.roles,
        permissions: user.permissions,
        createdAt: user.created_at,
        profilePictureUrl: user.profile_picture_url
      }
    });

  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      error: 'Failed to get user information',
      code: 'USER_INFO_ERROR'
    });
  }
});

/**

 * POST /api/auth/verify-email
 * Verify user email address
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Verification token required',
        code: 'TOKEN_MISSING'
      });
    }

    const userQuery = `
      SELECT user_id, email, email_verification_expires
      FROM users
      WHERE email_verification_token = $1 AND status = 'Pending'
    `;

    const userResult = await pool.query(userQuery, [token]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    }

    const user = userResult.rows[0];

    if (new Date() > new Date(user.email_verification_expires)) {
      return res.status(400).json({
        error: 'Verification token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Update user status and clear verification token
    await pool.query(`
      UPDATE users 
      SET status = 'Active', email_verified = true, 
          email_verification_token = NULL, email_verification_expires = NULL
      WHERE user_id = $1
    `, [user.user_id]);

    res.json({
      message: 'Email verified successfully',
      email: user.email
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'Email verification failed',
      code: 'VERIFICATION_ERROR'
    });
  }
});

/**
 * Helper function to generate temporary token for 2FA
 */
function generateTempToken(userId) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, type: 'temp' },
    process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
    { expiresIn: '5m' }
  );
}

module.exports = router;