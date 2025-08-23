# User Permissions Management API

This document describes the User Permissions Management API endpoints for the ICT Governance Framework. These endpoints allow you to manage user permissions through role assignments and view effective permissions.

## Base URL

All endpoints are prefixed with `/api/user-permissions`

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Permissions Required

Different endpoints require different permissions:
- `user.read` - View user information and permissions
- `user.manage_roles` - Assign and remove user roles

## Endpoints

### 1. Get All Available Permissions

**GET** `/api/user-permissions/permissions`

Retrieves all available permissions in the system.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 50) |
| resource | string | No | Filter by resource type |
| action | string | No | Filter by action type |
| scope | string | No | Filter by scope (Global, Department, Team, Personal) |
| search | string | No | Search in permission name, display name, or description |

#### Response

```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "permission_id": "PERM_USER_READ",
        "permission_name": "user.read",
        "display_name": "View Users",
        "description": "View user information",
        "resource": "users",
        "action": "read",
        "scope": "Global",
        "is_system_permission": true,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "groupedPermissions": {
      "users": [
        // permissions grouped by resource
      ]
    },
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. Get User's Effective Permissions

**GET** `/api/user-permissions/users/:userId/permissions`

Retrieves all effective permissions for a specific user (through their roles).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | The user ID |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| includeInactive | boolean | No | Include inactive role assignments (default: false) |

#### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "USR-123",
      "username": "john.doe",
      "email": "john.doe@company.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "permissions": [
      {
        "permission_id": "PERM_USER_READ",
        "permission_name": "user.read",
        "display_name": "View Users",
        "description": "View user information",
        "resource": "users",
        "action": "read",
        "scope": "Global",
        "is_system_permission": true,
        "granted_by_roles": ["admin", "user_manager"],
        "granted_by_role_names": ["Administrator", "User Manager"]
      }
    ],
    "groupedPermissions": {
      "users": [
        // permissions grouped by resource
      ]
    },
    "totalPermissions": 25
  }
}
```

### 3. Get User's Roles

**GET** `/api/user-permissions/users/:userId/roles`

Retrieves all roles assigned to a specific user.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | The user ID |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| includeExpired | boolean | No | Include expired role assignments (default: false) |

#### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "USR-123",
      "username": "john.doe",
      "email": "john.doe@company.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "roles": [
      {
        "role_id": "ROLE_ADMIN",
        "role_name": "admin",
        "display_name": "Administrator",
        "description": "Administrative access to most system functions",
        "role_type": "System",
        "is_system_role": true,
        "role_hierarchy_level": 90,
        "assigned_by": "USR-456",
        "assigned_at": "2024-01-01T00:00:00.000Z",
        "expires_at": null,
        "is_active": true,
        "assignment_reason": "Role assigned by admin",
        "assigned_by_username": "admin.user",
        "assigned_by_first_name": "Admin",
        "assigned_by_last_name": "User",
        "is_expired": false
      }
    ],
    "totalRoles": 2
  }
}
```

### 4. Assign Roles to User

**POST** `/api/user-permissions/users/:userId/roles`

Assigns one or more roles to a user.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | The user ID |

#### Request Body

```json
{
  "roleIds": ["ROLE_ADMIN", "ROLE_USER_MANAGER"],
  "reason": "Promoting user to administrator",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| roleIds | array | Yes | Array of role IDs to assign |
| reason | string | No | Reason for the assignment |
| expiresAt | string | No | ISO date when the assignment expires |

#### Response

```json
{
  "success": true,
  "message": "Roles assigned successfully",
  "data": {
    "user": {
      "user_id": "USR-123",
      "username": "john.doe"
    },
    "assignedRoles": [
      {
        "role_id": "ROLE_ADMIN",
        "role_name": "admin",
        "display_name": "Administrator",
        "assignment": {
          "id": 123,
          "user_id": "USR-123",
          "role_id": "ROLE_ADMIN",
          "assigned_by": "USR-456",
          "assigned_at": "2024-01-01T00:00:00.000Z",
          "expires_at": "2024-12-31T23:59:59.000Z",
          "is_active": true,
          "assignment_reason": "Promoting user to administrator"
        }
      }
    ],
    "totalAssigned": 1
  }
}
```

### 5. Remove Role from User

**DELETE** `/api/user-permissions/users/:userId/roles/:roleId`

Removes a specific role from a user.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | The user ID |
| roleId | string | Yes | The role ID to remove |

#### Request Body

```json
{
  "reason": "User no longer needs administrator access"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | No | Reason for removing the role |

#### Response

```json
{
  "success": true,
  "message": "Role removed successfully",
  "data": {
    "removedAssignment": {
      "userId": "USR-123",
      "roleId": "ROLE_ADMIN",
      "roleName": "admin",
      "displayName": "Administrator",
      "username": "john.doe",
      "removedBy": "admin.user",
      "removedAt": "2024-01-01T00:00:00.000Z",
      "reason": "User no longer needs administrator access"
    }
  }
}
```

### 6. Update User's Role Assignments

**PUT** `/api/user-permissions/users/:userId/roles`

Replaces all role assignments for a user with the provided roles.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | The user ID |

#### Request Body

```json
{
  "roleIds": ["ROLE_EMPLOYEE", "ROLE_USER_MANAGER"],
  "reason": "Updating user's role assignments"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| roleIds | array | Yes | Array of role IDs (replaces all current assignments) |
| reason | string | No | Reason for the update |

#### Response

```json
{
  "success": true,
  "message": "User roles updated successfully",
  "data": {
    "user": {
      "user_id": "USR-123",
      "username": "john.doe"
    },
    "changes": {
      "added": ["ROLE_USER_MANAGER"],
      "removed": ["ROLE_ADMIN"],
      "totalAdded": 1,
      "totalRemoved": 1
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details or validation errors"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (user or role not found)
- `500` - Internal Server Error

## Usage Examples

### JavaScript/Node.js

```javascript
// Get user permissions
const response = await fetch('/api/user-permissions/users/USR-123/permissions', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data.permissions);

// Assign roles to user
const assignResponse = await fetch('/api/user-permissions/users/USR-123/roles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    roleIds: ['ROLE_ADMIN'],
    reason: 'Promoting to administrator'
  })
});
```

### cURL

```bash
# Get user permissions
curl -X GET "http://localhost:4000/api/user-permissions/users/USR-123/permissions" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Assign roles to user
curl -X POST "http://localhost:4000/api/user-permissions/users/USR-123/roles" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleIds": ["ROLE_ADMIN"],
    "reason": "Promoting to administrator"
  }'
```

## Security Considerations

1. **Authentication Required**: All endpoints require valid JWT authentication
2. **Permission Checks**: Endpoints check for appropriate permissions before allowing access
3. **Audit Logging**: All permission changes are logged to the user activity log
4. **Input Validation**: All inputs are validated using express-validator
5. **SQL Injection Protection**: All database queries use parameterized statements
6. **Rate Limiting**: API endpoints are subject to rate limiting

## Related APIs

- [Users API](./USERS-API.md) - User management
- [Roles API](./ROLES-API.md) - Role management
- [Authentication API](./AUTH-API.md) - Authentication and session management