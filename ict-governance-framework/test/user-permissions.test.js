// File: ict-governance-framework/test/user-permissions.test.js
// Tests for User Permissions Management API

const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

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
    // Mock authenticated user
    req.user = {
      user_id: 'USR-TEST-123',
      username: 'test.user',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      roles: ['admin'],
      permissions: ['user.read', 'user.manage_roles'],
      sessionId: 'session-123'
    };
    next();
  },
  requirePermissions: (permissions) => (req, res, next) => {
    const userPermissions = req.user?.permissions || [];
    const hasPermissions = permissions.every(p => userPermissions.includes(p));
    if (!hasPermissions) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  }
}));

const userPermissionsRouter = require('../api/user-permissions');

describe('User Permissions API', () => {
  let app;
  let mockPool;
  let mockClient;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/user-permissions', userPermissionsRouter);

    mockPool = new Pool();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    mockPool.connect.mockResolvedValue(mockClient);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /permissions', () => {
    it('should return all permissions with pagination', async () => {
      const mockPermissions = [
        {
          permission_id: 'PERM_USER_READ',
          permission_name: 'user.read',
          display_name: 'View Users',
          description: 'View user information',
          resource: 'users',
          action: 'read',
          scope: 'Global',
          is_system_permission: true,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockPermissions }) // permissions query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }); // count query

      const response = await request(app)
        .get('/api/user-permissions/permissions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.permissions).toEqual(mockPermissions);
      expect(response.body.data.pagination.total).toBe(1);
      expect(response.body.data.groupedPermissions.users).toEqual(mockPermissions);
    });

    it('should filter permissions by resource', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      const response = await request(app)
        .get('/api/user-permissions/permissions?resource=users')
        .expect(200);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('p.resource = $1'),
        expect.arrayContaining(['users'])
      );
    });

    it('should handle search query', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await request(app)
        .get('/api/user-permissions/permissions?search=user')
        .expect(200);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['%user%'])
      );
    });
  });

  describe('GET /users/:userId/permissions', () => {
    const userId = 'USR-123';

    it('should return user permissions successfully', async () => {
      const mockUser = {
        user_id: userId,
        username: 'john.doe',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };

      const mockPermissions = [
        {
          permission_id: 'PERM_USER_READ',
          permission_name: 'user.read',
          display_name: 'View Users',
          description: 'View user information',
          resource: 'users',
          action: 'read',
          scope: 'Global',
          is_system_permission: true,
          granted_by_roles: ['admin'],
          granted_by_role_names: ['Administrator']
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // user query
        .mockResolvedValueOnce({ rows: mockPermissions }); // permissions query

      const response = await request(app)
        .get(`/api/user-permissions/users/${userId}/permissions`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockUser);
      expect(response.body.data.permissions).toEqual(mockPermissions);
      expect(response.body.data.totalPermissions).toBe(1);
    });

    it('should return 404 for non-existent user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get(`/api/user-permissions/users/INVALID-USER/permissions`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should validate userId parameter', async () => {
      const response = await request(app)
        .get('/api/user-permissions/users//permissions')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /users/:userId/roles', () => {
    const userId = 'USR-123';

    it('should return user roles successfully', async () => {
      const mockUser = {
        user_id: userId,
        username: 'john.doe',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };

      const mockRoles = [
        {
          role_id: 'ROLE_ADMIN',
          role_name: 'admin',
          display_name: 'Administrator',
          description: 'Administrative access',
          role_type: 'System',
          is_system_role: true,
          role_hierarchy_level: 90,
          assigned_by: 'USR-456',
          assigned_at: '2024-01-01T00:00:00.000Z',
          expires_at: null,
          is_active: true,
          assignment_reason: 'Initial assignment',
          assigned_by_username: 'admin',
          assigned_by_first_name: 'Admin',
          assigned_by_last_name: 'User',
          is_expired: false
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: mockRoles });

      const response = await request(app)
        .get(`/api/user-permissions/users/${userId}/roles`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockUser);
      expect(response.body.data.roles).toEqual(mockRoles);
      expect(response.body.data.totalRoles).toBe(1);
    });
  });

  describe('POST /users/:userId/roles', () => {
    const userId = 'USR-123';

    it('should assign roles to user successfully', async () => {
      const mockUser = { user_id: userId, username: 'john.doe' };
      const mockRoles = [
        { role_id: 'ROLE_ADMIN', role_name: 'admin', display_name: 'Administrator' }
      ];
      const mockAssignment = {
        id: 1,
        user_id: userId,
        role_id: 'ROLE_ADMIN',
        assigned_by: 'USR-TEST-123',
        assigned_at: '2024-01-01T00:00:00.000Z',
        is_active: true
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // user check
        .mockResolvedValueOnce({ rows: mockRoles }) // roles validation
        .mockResolvedValueOnce({ rows: [] }) // existing assignment check
        .mockResolvedValueOnce({ rows: [mockAssignment] }) // role assignment
        .mockResolvedValueOnce({ rows: [] }); // activity log

      const response = await request(app)
        .post(`/api/user-permissions/users/${userId}/roles`)
        .send({
          roleIds: ['ROLE_ADMIN'],
          reason: 'Test assignment'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Roles assigned successfully');
      expect(response.body.data.totalAssigned).toBe(1);
    });

    it('should return 404 for non-existent user', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post(`/api/user-permissions/users/INVALID-USER/roles`)
        .send({
          roleIds: ['ROLE_ADMIN'],
          reason: 'Test assignment'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post(`/api/user-permissions/users/${userId}/roles`)
        .send({
          roleIds: 'not-an-array'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle non-existent roles', async () => {
      const mockUser = { user_id: userId, username: 'john.doe' };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [] }); // no roles found

      const response = await request(app)
        .post(`/api/user-permissions/users/${userId}/roles`)
        .send({
          roleIds: ['INVALID-ROLE'],
          reason: 'Test assignment'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Some roles not found or inactive');
    });
  });

  describe('DELETE /users/:userId/roles/:roleId', () => {
    const userId = 'USR-123';
    const roleId = 'ROLE_ADMIN';

    it('should remove role from user successfully', async () => {
      const mockAssignment = {
        user_id: userId,
        role_id: roleId,
        role_name: 'admin',
        display_name: 'Administrator',
        username: 'john.doe'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockAssignment] }) // check assignment
        .mockResolvedValueOnce({ rows: [mockAssignment] }) // remove assignment
        .mockResolvedValueOnce({ rows: [] }); // activity log

      const response = await request(app)
        .delete(`/api/user-permissions/users/${userId}/roles/${roleId}`)
        .send({ reason: 'No longer needed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Role removed successfully');
      expect(response.body.data.removedAssignment.roleId).toBe(roleId);
    });

    it('should return 404 for non-existent assignment', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .delete(`/api/user-permissions/users/${userId}/roles/${roleId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Role assignment not found or already inactive');
    });
  });

  describe('PUT /users/:userId/roles', () => {
    const userId = 'USR-123';

    it('should update user roles successfully', async () => {
      const mockUser = { user_id: userId, username: 'john.doe' };
      const mockRoles = [
        { role_id: 'ROLE_EMPLOYEE', role_name: 'employee' }
      ];

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // user check
        .mockResolvedValueOnce({ rows: mockRoles }) // roles validation
        .mockResolvedValueOnce({ rows: [{ role_id: 'ROLE_ADMIN' }] }) // current roles
        .mockResolvedValueOnce({ rows: [] }) // remove old roles
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // add new role
        .mockResolvedValueOnce({ rows: [] }); // activity log

      const response = await request(app)
        .put(`/api/user-permissions/users/${userId}/roles`)
        .send({
          roleIds: ['ROLE_EMPLOYEE'],
          reason: 'Role update'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User roles updated successfully');
      expect(response.body.data.changes.added).toEqual(['ROLE_EMPLOYEE']);
      expect(response.body.data.changes.removed).toEqual(['ROLE_ADMIN']);
    });

    it('should handle empty role list', async () => {
      const mockUser = { user_id: userId, username: 'john.doe' };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [{ role_id: 'ROLE_ADMIN' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put(`/api/user-permissions/users/${userId}/roles`)
        .send({
          roleIds: [],
          reason: 'Remove all roles'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.changes.totalRemoved).toBe(1);
      expect(response.body.data.changes.totalAdded).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/user-permissions/permissions')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch permissions');
    });

    it('should handle transaction rollback on errors', async () => {
      const userId = 'USR-123';
      mockClient.query.mockRejectedValueOnce(new Error('Transaction failed'));

      const response = await request(app)
        .post(`/api/user-permissions/users/${userId}/roles`)
        .send({
          roleIds: ['ROLE_ADMIN'],
          reason: 'Test assignment'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to assign roles to user');
    });
  });

  describe('Permission Checks', () => {
    beforeEach(() => {
      // Mock user without permissions
      jest.doMock('../middleware/auth', () => ({
        authenticateToken: (req, res, next) => {
          req.user = {
            user_id: 'USR-TEST-123',
            username: 'test.user',
            permissions: [] // No permissions
          };
          next();
        },
        requirePermissions: (permissions) => (req, res, next) => {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      }));
    });

    it('should deny access without proper permissions', async () => {
      const response = await request(app)
        .get('/api/user-permissions/permissions')
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions');
    });
  });
});

describe('Integration Tests', () => {
  // These would be integration tests that actually connect to a test database
  // and test the full flow of the API endpoints
  
  it.skip('should perform full user permission management flow', async () => {
    // This would test:
    // 1. Create a test user
    // 2. Assign roles to the user
    // 3. Verify permissions are correctly calculated
    // 4. Update roles
    // 5. Remove roles
    // 6. Clean up test data
  });
});