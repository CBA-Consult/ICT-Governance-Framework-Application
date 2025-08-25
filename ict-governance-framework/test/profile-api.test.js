// File: ict-governance-framework/test/profile-api.test.js
// Test suite for User Profile Management API endpoints

const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');

// Mock the database pool
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    connect: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn()
    }))
  }))
}));

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = {
      user_id: 'USR-TEST-123',
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      sessionId: 'session-123'
    };
    next();
  },
  logActivity: () => (req, res, next) => next()
}));

const profileRouter = require('../api/profile');

describe('Profile API Endpoints', () => {
  let app;
  let mockPool;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/profile', profileRouter);
    
    mockPool = new Pool();
    jest.clearAllMocks();
  });

  describe('GET /api/profile', () => {
    it('should return user profile successfully', async () => {
      const mockProfile = {
        user_id: 'USR-TEST-123',
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        display_name: 'Test User',
        department: 'IT',
        job_title: 'Developer',
        phone: '+1234567890',
        office_location: 'Building A',
        employee_id: 'EMP001',
        status: 'Active',
        email_verified: true,
        phone_verified: false,
        two_factor_enabled: false,
        last_login: '2024-01-15T10:30:00Z',
        last_password_change: '2024-01-01T00:00:00Z',
        profile_picture_url: '/uploads/profile-pictures/test.jpg',
        preferences: { theme: 'dark' },
        metadata: {},
        created_at: '2023-06-01T00:00:00Z',
        updated_at: '2024-01-15T09:00:00Z',
        manager_first_name: 'Jane',
        manager_last_name: 'Smith',
        manager_email: 'jane@example.com',
        roles: [{ roleId: 'ROLE_EMPLOYEE', roleName: 'employee' }],
        permissions: ['governance.read']
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockProfile] }) // Profile query
        .mockResolvedValueOnce({ rows: [{ active_sessions: 2 }] }); // Sessions query

      const response = await request(app)
        .get('/api/profile')
        .expect(200);

      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.user_id).toBe('USR-TEST-123');
      expect(response.body.profile.activeSessions).toBe(2);
    });

    it('should return 404 if profile not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/profile')
        .expect(404);

      expect(response.body.error).toBe('Profile not found');
      expect(response.body.code).toBe('PROFILE_NOT_FOUND');
    });
  });

  describe('PUT /api/profile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+9876543210'
      };

      const mockUpdatedProfile = {
        user_id: 'USR-TEST-123',
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Updated',
        last_name: 'Name',
        display_name: null,
        phone: '+9876543210',
        office_location: null,
        updated_at: '2024-01-15T14:30:00Z'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUpdatedProfile] });

      const response = await request(app)
        .put('/api/profile')
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.profile.first_name).toBe('Updated');
      expect(response.body.profile.last_name).toBe('Name');
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        firstName: '', // Empty first name
        phone: 'invalid-phone'
      };

      const response = await request(app)
        .put('/api/profile')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.details).toBeDefined();
    });

    it('should return error when no fields to update', async () => {
      const response = await request(app)
        .put('/api/profile')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('No fields to update');
      expect(response.body.code).toBe('NO_UPDATE_FIELDS');
    });
  });

  describe('PUT /api/profile/preferences', () => {
    it('should update preferences successfully', async () => {
      const preferencesData = {
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: {
            email: true,
            push: false
          }
        }
      };

      const currentPreferences = { timezone: 'UTC' };
      const mergedPreferences = { ...currentPreferences, ...preferencesData.preferences };

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ preferences: currentPreferences }] }) // Current preferences
        .mockResolvedValueOnce({ 
          rows: [{ 
            preferences: mergedPreferences, 
            updated_at: '2024-01-15T14:30:00Z' 
          }] 
        }); // Update result

      const response = await request(app)
        .put('/api/profile/preferences')
        .send(preferencesData)
        .expect(200);

      expect(response.body.message).toBe('Preferences updated successfully');
      expect(response.body.preferences.theme).toBe('dark');
      expect(response.body.preferences.timezone).toBe('UTC'); // Preserved from existing
    });

    it('should return validation error for invalid preferences', async () => {
      const invalidPreferences = {
        preferences: {
          theme: 'invalid-theme', // Invalid theme value
          language: 'invalid-lang-code'
        }
      };

      const response = await request(app)
        .put('/api/profile/preferences')
        .send(invalidPreferences)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/profile/password', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123!',
        newPassword: 'newPassword456@',
        confirmPassword: 'newPassword456@'
      };

      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValueOnce(mockClient);

      // Mock the password verification and update process
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ 
          rows: [{ password_hash: '$2a$12$hashedCurrentPassword' }] 
        }) // Get current password
        .mockResolvedValueOnce({ rows: [] }) // Password history check
        .mockResolvedValueOnce({ 
          rows: [{ last_password_change: '2024-01-15T14:30:00Z' }] 
        }) // Update password
        .mockResolvedValueOnce(undefined) // Insert password history
        .mockResolvedValueOnce(undefined) // Cleanup old history
        .mockResolvedValueOnce(undefined) // Invalidate sessions
        .mockResolvedValueOnce(undefined); // COMMIT

      // Mock bcrypt compare to return true for current password
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare')
        .mockResolvedValueOnce(true) // Current password valid
        .mockResolvedValueOnce(false); // New password different

      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('$2a$12$hashedNewPassword');

      const response = await request(app)
        .put('/api/profile/password')
        .send(passwordData)
        .expect(200);

      expect(response.body.message).toBe('Password changed successfully');
      expect(response.body.lastPasswordChange).toBeDefined();
    });

    it('should return error for incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456@',
        confirmPassword: 'newPassword456@'
      };

      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValueOnce(mockClient);

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ 
          rows: [{ password_hash: '$2a$12$hashedCurrentPassword' }] 
        }); // Get current password

      // Mock bcrypt compare to return false for wrong password
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

      const response = await request(app)
        .put('/api/profile/password')
        .send(passwordData)
        .expect(400);

      expect(response.body.error).toBe('Current password is incorrect');
      expect(response.body.code).toBe('INVALID_CURRENT_PASSWORD');
    });
  });

  describe('GET /api/profile/activity', () => {
    it('should return user activity with pagination', async () => {
      const mockActivities = [
        {
          log_id: 'LOG-123',
          activity_type: 'LOGIN',
          activity_description: 'User logged in',
          resource: 'auth',
          action: 'login',
          ip_address: '192.168.1.100',
          success: true,
          created_at: '2024-01-15T10:30:00Z'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockActivities }) // Activity query
        .mockResolvedValueOnce({ rows: [{ total: 1 }] }); // Count query

      const response = await request(app)
        .get('/api/profile/activity?page=1&limit=50')
        .expect(200);

      expect(response.body.activities).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(1);
    });
  });

  describe('GET /api/profile/sessions', () => {
    it('should return active sessions', async () => {
      const mockSessions = [
        {
          session_id: 'session-123',
          device_info: { platform: 'Windows', browser: 'Chrome' },
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0...',
          last_activity: '2024-01-15T14:30:00Z',
          expires_at: '2024-01-22T14:30:00Z',
          created_at: '2024-01-15T10:30:00Z',
          is_current: true
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockSessions });

      const response = await request(app)
        .get('/api/profile/sessions')
        .expect(200);

      expect(response.body.sessions).toHaveLength(1);
      expect(response.body.sessions[0].isCurrent).toBe(true);
    });
  });

  describe('DELETE /api/profile/sessions/:sessionId', () => {
    it('should revoke session successfully', async () => {
      const sessionId = 'session-456';

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ session_id: sessionId }] }) // Check session
        .mockResolvedValueOnce({ rowCount: 1 }); // Revoke session

      const response = await request(app)
        .delete(`/api/profile/sessions/${sessionId}`)
        .expect(200);

      expect(response.body.message).toBe('Session revoked successfully');
      expect(response.body.sessionId).toBe(sessionId);
    });

    it('should prevent revoking current session', async () => {
      const currentSessionId = 'session-123'; // Same as in mock user

      const response = await request(app)
        .delete(`/api/profile/sessions/${currentSessionId}`)
        .expect(400);

      expect(response.body.error).toBe('Cannot revoke current session. Use logout instead.');
      expect(response.body.code).toBe('CANNOT_REVOKE_CURRENT_SESSION');
    });
  });

  describe('DELETE /api/profile/sessions', () => {
    it('should revoke all other sessions', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 2 });

      const response = await request(app)
        .delete('/api/profile/sessions')
        .expect(200);

      expect(response.body.message).toBe('All other sessions revoked successfully');
      expect(response.body.revokedCount).toBe(2);
    });
  });
});

// Helper function to create mock file for upload tests
function createMockFile(filename = 'test.jpg', mimetype = 'image/jpeg') {
  return {
    fieldname: 'profilePicture',
    originalname: filename,
    encoding: '7bit',
    mimetype: mimetype,
    destination: '/tmp/uploads',
    filename: `USR-TEST-123-${Date.now()}.jpg`,
    path: `/tmp/uploads/USR-TEST-123-${Date.now()}.jpg`,
    size: 1024
  };
}

module.exports = {
  createMockFile
};