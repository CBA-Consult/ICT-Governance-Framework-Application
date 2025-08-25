// File: ict-governance-framework/api/profile.js
// User Profile Management API endpoints for the ICT Governance Framework

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { 
  authenticateToken, 
  logActivity 
} = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.user_id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed'));
    }
  }
});

// Validation rules
const updateProfileValidation = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be 1-100 characters')
    .trim()
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be 1-100 characters')
    .trim()
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  body('displayName')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Display name must be less than 200 characters')
    .trim(),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  body('officeLocation')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Office location must be less than 100 characters')
    .trim()
];

const updatePreferencesValidation = [
  body('preferences')
    .isObject()
    .withMessage('Preferences must be an object')
    .custom((preferences) => {
      // Validate preferences structure
      const allowedKeys = ['theme', 'language', 'timezone', 'notifications', 'dashboard'];
      const providedKeys = Object.keys(preferences);
      
      for (const key of providedKeys) {
        if (!allowedKeys.includes(key)) {
          throw new Error(`Invalid preference key: ${key}`);
        }
      }
      
      // Validate specific preference values
      if (preferences.theme && !['light', 'dark', 'auto'].includes(preferences.theme)) {
        throw new Error('Theme must be light, dark, or auto');
      }
      
      if (preferences.language && !/^[a-z]{2}(-[A-Z]{2})?$/.test(preferences.language)) {
        throw new Error('Language must be in format: en, en-US, etc.');
      }
      
      return true;
    })
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain uppercase, lowercase, number, and special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
];

/**
 * GET /api/profile
 * Get current user's complete profile information
 */
router.get('/',
  authenticateToken,
  logActivity('PROFILE_VIEW', 'Viewed own profile'),
  async (req, res) => {
    try {
      const userId = req.user.user_id;

      const profileQuery = `
        SELECT u.user_id, u.username, u.email, u.first_name, u.last_name,
               u.display_name, u.department, u.job_title, u.phone, u.office_location,
               u.employee_id, u.status, u.email_verified, u.phone_verified,
               u.two_factor_enabled, u.last_login, u.last_password_change,
               u.profile_picture_url, u.preferences, u.metadata, u.created_at, u.updated_at,
               m.first_name as manager_first_name, m.last_name as manager_last_name,
               m.email as manager_email,
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
                 m.first_name, m.last_name, m.email
      `;

      const profileResult = await pool.query(profileQuery, [userId]);

      if (profileResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      const profile = profileResult.rows[0];

      // Get active sessions count
      const sessionsQuery = `
        SELECT COUNT(*) as active_sessions
        FROM user_sessions
        WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
      `;
      const sessionsResult = await pool.query(sessionsQuery, [userId]);

      res.json({
        profile: {
          ...profile,
          manager: profile.manager_first_name ? {
            firstName: profile.manager_first_name,
            lastName: profile.manager_last_name,
            email: profile.manager_email
          } : null,
          roles: profile.roles || [],
          permissions: profile.permissions || [],
          activeSessions: parseInt(sessionsResult.rows[0].active_sessions)
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to retrieve profile',
        code: 'PROFILE_GET_ERROR'
      });
    }
  }
);

/**
 * PUT /api/profile
 * Update current user's profile information
 */
router.put('/',
  authenticateToken,
  updateProfileValidation,
  logActivity('PROFILE_UPDATE', 'Updated own profile'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
          field: error.path || error.param,
          message: error.msg,
          value: error.value,
          location: error.location
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formattedErrors,
          message: 'Please correct the validation errors and try again'
        });
      }

      const userId = req.user.user_id;
      const {
        firstName,
        lastName,
        displayName,
        phone,
        officeLocation
      } = req.body;

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramCount = 0;

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

      if (displayName !== undefined) {
        paramCount++;
        updateFields.push(`display_name = $${paramCount}`);
        updateValues.push(displayName || null);
      }

      if (phone !== undefined) {
        paramCount++;
        updateFields.push(`phone = $${paramCount}`);
        updateValues.push(phone || null);
      }

      if (officeLocation !== undefined) {
        paramCount++;
        updateFields.push(`office_location = $${paramCount}`);
        updateValues.push(officeLocation || null);
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
      updateValues.push(userId);

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
                  display_name, phone, office_location, updated_at
      `;

      const updateResult = await pool.query(updateQuery, updateValues);
      const updatedProfile = updateResult.rows[0];

      res.json({
        message: 'Profile updated successfully',
        profile: updatedProfile
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        code: 'PROFILE_UPDATE_ERROR'
      });
    }
  }
);

/**
 * PUT /api/profile/preferences
 * Update user preferences
 */
router.put('/preferences',
  authenticateToken,
  updatePreferencesValidation,
  logActivity('PROFILE_PREFERENCES_UPDATE', 'Updated profile preferences'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
          field: error.path || error.param,
          message: error.msg,
          value: error.value,
          location: error.location
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formattedErrors
        });
      }

      const userId = req.user.user_id;
      const { preferences } = req.body;

      // Get current preferences to merge with new ones
      const currentQuery = 'SELECT preferences FROM users WHERE user_id = $1';
      const currentResult = await pool.query(currentQuery, [userId]);
      
      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const currentPreferences = currentResult.rows[0].preferences || {};
      const mergedPreferences = { ...currentPreferences, ...preferences };

      const updateQuery = `
        UPDATE users 
        SET preferences = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING preferences, updated_at
      `;

      const updateResult = await pool.query(updateQuery, [
        JSON.stringify(mergedPreferences),
        userId
      ]);

      res.json({
        message: 'Preferences updated successfully',
        preferences: updateResult.rows[0].preferences,
        updatedAt: updateResult.rows[0].updated_at
      });

    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        error: 'Failed to update preferences',
        code: 'PREFERENCES_UPDATE_ERROR'
      });
    }
  }
);

/**
 * PUT /api/profile/password
 * Change user password
 */
router.put('/password',
  authenticateToken,
  changePasswordValidation,
  logActivity('PROFILE_PASSWORD_CHANGE', 'Changed password'),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
          field: error.path || error.param,
          message: error.msg,
          value: error.value,
          location: error.location
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formattedErrors
        });
      }

      await client.query('BEGIN');

      const userId = req.user.user_id;
      const { currentPassword, newPassword } = req.body;

      // Get current password hash
      const userQuery = 'SELECT password_hash FROM users WHERE user_id = $1';
      const userResult = await client.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const currentPasswordHash = userResult.rows[0].password_hash;

      // Verify current password
      const passwordValid = await bcrypt.compare(currentPassword, currentPasswordHash);
      if (!passwordValid) {
        return res.status(400).json({
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Check if new password is different from current
      const samePassword = await bcrypt.compare(newPassword, currentPasswordHash);
      if (samePassword) {
        return res.status(400).json({
          error: 'New password must be different from current password',
          code: 'SAME_PASSWORD'
        });
      }

      // Check password history (prevent reuse of last 5 passwords)
      const historyQuery = `
        SELECT password_hash 
        FROM password_history 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 5
      `;
      const historyResult = await client.query(historyQuery, [userId]);

      for (const row of historyResult.rows) {
        const isReused = await bcrypt.compare(newPassword, row.password_hash);
        if (isReused) {
          return res.status(400).json({
            error: 'Cannot reuse any of your last 5 passwords',
            code: 'PASSWORD_REUSED'
          });
        }
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, last_password_change = CURRENT_TIMESTAMP, 
            updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING last_password_change
      `;

      const updateResult = await client.query(updateQuery, [newPasswordHash, userId]);

      // Add to password history
      const historyInsertQuery = `
        INSERT INTO password_history (user_id, password_hash)
        VALUES ($1, $2)
      `;
      await client.query(historyInsertQuery, [userId, newPasswordHash]);

      // Clean up old password history (keep only last 10)
      const cleanupQuery = `
        DELETE FROM password_history 
        WHERE user_id = $1 AND id NOT IN (
          SELECT id FROM password_history 
          WHERE user_id = $1 
          ORDER BY created_at DESC 
          LIMIT 10
        )
      `;
      await client.query(cleanupQuery, [userId]);

      // Invalidate all other sessions except current one
      const invalidateSessionsQuery = `
        UPDATE user_sessions 
        SET is_active = false 
        WHERE user_id = $1 AND session_id != $2
      `;
      await client.query(invalidateSessionsQuery, [userId, req.user.sessionId]);

      await client.query('COMMIT');

      res.json({
        message: 'Password changed successfully',
        lastPasswordChange: updateResult.rows[0].last_password_change
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Failed to change password',
        code: 'PASSWORD_CHANGE_ERROR'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * POST /api/profile/upload-picture
 * Upload profile picture
 */
router.post('/upload-picture',
  authenticateToken,
  upload.single('profilePicture'),
  logActivity('PROFILE_PICTURE_UPLOAD', 'Uploaded profile picture'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          code: 'NO_FILE_UPLOADED'
        });
      }

      const userId = req.user.user_id;
      const fileName = req.file.filename;
      const profilePictureUrl = `/uploads/profile-pictures/${fileName}`;

      // Get current profile picture to delete old one
      const currentQuery = 'SELECT profile_picture_url FROM users WHERE user_id = $1';
      const currentResult = await pool.query(currentQuery, [userId]);
      
      const oldPictureUrl = currentResult.rows[0]?.profile_picture_url;

      // Update user's profile picture URL
      const updateQuery = `
        UPDATE users 
        SET profile_picture_url = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING profile_picture_url, updated_at
      `;

      const updateResult = await pool.query(updateQuery, [profilePictureUrl, userId]);

      // Delete old profile picture file if it exists
      if (oldPictureUrl && oldPictureUrl.startsWith('/uploads/profile-pictures/')) {
        const oldFilePath = path.join(__dirname, '..', oldPictureUrl);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      res.json({
        message: 'Profile picture uploaded successfully',
        profilePictureUrl: updateResult.rows[0].profile_picture_url,
        updatedAt: updateResult.rows[0].updated_at
      });

    } catch (error) {
      // Clean up uploaded file if there was an error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      if (error.message.includes('Only image files')) {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_FILE_TYPE'
        });
      }

      console.error('Upload profile picture error:', error);
      res.status(500).json({
        error: 'Failed to upload profile picture',
        code: 'PICTURE_UPLOAD_ERROR'
      });
    }
  }
);

/**
 * GET /api/profile/activity
 * Get current user's activity log
 */
router.get('/activity',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.user_id;
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

      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_activity_log
        ${whereClause}
      `;

      const [activityResult, countResult] = await Promise.all([
        pool.query(activityQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2))
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.json({
        activities: activityResult.rows,
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
      console.error('Get profile activity error:', error);
      res.status(500).json({
        error: 'Failed to retrieve activity',
        code: 'PROFILE_ACTIVITY_ERROR'
      });
    }
  }
);

/**
 * GET /api/profile/sessions
 * Get current user's active sessions
 */
router.get('/sessions',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.user_id;

      const sessionsQuery = `
        SELECT session_id, device_info, ip_address, user_agent, 
               last_activity, expires_at, created_at,
               CASE WHEN session_id = $2 THEN true ELSE false END as is_current
        FROM user_sessions
        WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
        ORDER BY last_activity DESC
      `;

      const sessionsResult = await pool.query(sessionsQuery, [userId, req.user.sessionId]);

      res.json({
        sessions: sessionsResult.rows.map(session => ({
          sessionId: session.session_id,
          deviceInfo: session.device_info,
          ipAddress: session.ip_address,
          userAgent: session.user_agent,
          lastActivity: session.last_activity,
          expiresAt: session.expires_at,
          createdAt: session.created_at,
          isCurrent: session.is_current
        }))
      });

    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        error: 'Failed to retrieve sessions',
        code: 'SESSIONS_GET_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/profile/sessions/:sessionId
 * Revoke a specific session
 */
router.delete('/sessions/:sessionId',
  authenticateToken,
  logActivity('PROFILE_SESSION_REVOKE', (req) => `Revoked session ${req.params.sessionId}`),
  async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { sessionId } = req.params;

      // Prevent revoking current session
      if (sessionId === req.user.sessionId) {
        return res.status(400).json({
          error: 'Cannot revoke current session. Use logout instead.',
          code: 'CANNOT_REVOKE_CURRENT_SESSION'
        });
      }

      // Check if session belongs to user
      const checkQuery = `
        SELECT session_id 
        FROM user_sessions 
        WHERE session_id = $1 AND user_id = $2 AND is_active = true
      `;
      const checkResult = await pool.query(checkQuery, [sessionId, userId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      // Revoke session
      const revokeQuery = `
        UPDATE user_sessions 
        SET is_active = false 
        WHERE session_id = $1 AND user_id = $2
      `;

      await pool.query(revokeQuery, [sessionId, userId]);

      res.json({
        message: 'Session revoked successfully',
        sessionId
      });

    } catch (error) {
      console.error('Revoke session error:', error);
      res.status(500).json({
        error: 'Failed to revoke session',
        code: 'SESSION_REVOKE_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/profile/sessions
 * Revoke all sessions except current
 */
router.delete('/sessions',
  authenticateToken,
  logActivity('PROFILE_SESSIONS_REVOKE_ALL', 'Revoked all other sessions'),
  async (req, res) => {
    try {
      const userId = req.user.user_id;
      const currentSessionId = req.user.sessionId;

      // Revoke all sessions except current
      const revokeQuery = `
        UPDATE user_sessions 
        SET is_active = false 
        WHERE user_id = $1 AND session_id != $2 AND is_active = true
      `;

      const result = await pool.query(revokeQuery, [userId, currentSessionId]);

      res.json({
        message: 'All other sessions revoked successfully',
        revokedCount: result.rowCount
      });

    } catch (error) {
      console.error('Revoke all sessions error:', error);
      res.status(500).json({
        error: 'Failed to revoke sessions',
        code: 'SESSIONS_REVOKE_ALL_ERROR'
      });
    }
  }
);

module.exports = router;