# User Profile Data Research - Current API

## Overview

This document provides a comprehensive analysis of user profile data available in the current ICT Governance Framework API. The research covers all user-related endpoints and data structures to understand what information is available for user profile pages.

## Database Schema - Users Table

The core user profile data is stored in the `users` table with the following structure:

### Core Identity Fields
- `user_id` (VARCHAR(50)) - Unique user identifier (e.g., "USR-1234567890-ABC123DEF")
- `username` (VARCHAR(100)) - Unique username for login
- `email` (VARCHAR(255)) - User's email address (unique)

### Personal Information
- `first_name` (VARCHAR(100)) - User's first name
- `last_name` (VARCHAR(100)) - User's last name
- `display_name` (VARCHAR(200)) - Optional display name
- `phone` (VARCHAR(20)) - Phone number
- `profile_picture_url` (VARCHAR(500)) - URL to profile picture

### Organizational Information
- `department` (VARCHAR(100)) - User's department
- `job_title` (VARCHAR(150)) - User's job title
- `office_location` (VARCHAR(100)) - Physical office location
- `employee_id` (VARCHAR(50)) - Employee ID number
- `manager_id` (VARCHAR(50)) - Reference to manager's user_id

### Account Status & Security
- `status` (VARCHAR(20)) - Account status: 'Active', 'Inactive', 'Suspended', 'Pending'
- `email_verified` (BOOLEAN) - Email verification status
- `phone_verified` (BOOLEAN) - Phone verification status
- `two_factor_enabled` (BOOLEAN) - 2FA enablement status
- `two_factor_secret` (VARCHAR(255)) - 2FA secret (encrypted)

### Authentication & Security
- `password_hash` (VARCHAR(255)) - Encrypted password
- `password_reset_token` (VARCHAR(255)) - Password reset token
- `password_reset_expires` (TIMESTAMP) - Password reset expiration
- `email_verification_token` (VARCHAR(255)) - Email verification token
- `email_verification_expires` (TIMESTAMP) - Email verification expiration
- `last_login` (TIMESTAMP) - Last successful login
- `last_password_change` (TIMESTAMP) - Last password change
- `failed_login_attempts` (INTEGER) - Failed login counter
- `account_locked_until` (TIMESTAMP) - Account lock expiration

### Customization & Metadata
- `preferences` (JSONB) - User preferences and settings
- `metadata` (JSONB) - Additional metadata
- `created_by` (VARCHAR(50)) - Who created the user
- `created_at` (TIMESTAMP) - Account creation date
- `updated_by` (VARCHAR(50)) - Who last updated the user
- `updated_at` (TIMESTAMP) - Last update timestamp

## API Endpoints for User Profile Data

### 1. GET /api/users/:userId - Individual User Details

**Endpoint:** `GET /api/users/:userId`
**Authentication:** Required (user.read permission)

**Response Data:**
```json
{
  "user": {
    "user_id": "USR-1234567890-ABC123DEF",
    "username": "john.doe",
    "email": "john.doe@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "display_name": "John Doe",
    "department": "IT",
    "job_title": "Senior Developer",
    "phone": "+1234567890",
    "office_location": "Building A, Floor 3",
    "employee_id": "EMP001",
    "status": "Active",
    "email_verified": true,
    "phone_verified": false,
    "two_factor_enabled": true,
    "last_login": "2024-01-15T10:30:00Z",
    "last_password_change": "2024-01-01T00:00:00Z",
    "profile_picture_url": "https://example.com/profiles/john.jpg",
    "preferences": {
      "theme": "dark",
      "language": "en",
      "notifications": {
        "email": true,
        "push": false
      }
    },
    "metadata": {
      "onboarding_completed": true,
      "last_training_date": "2024-01-10"
    },
    "created_at": "2023-06-01T00:00:00Z",
    "updated_at": "2024-01-15T09:00:00Z",
    "manager": {
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "roles": [
      {
        "roleId": "ROLE_EMPLOYEE",
        "roleName": "employee",
        "displayName": "Employee",
        "assignedAt": "2023-06-01T00:00:00Z",
        "expiresAt": null
      }
    ],
    "permissions": [
      "governance.read",
      "compliance.read",
      "feedback.create"
    ]
  }
}
```

### 2. GET /api/auth/me - Current User Profile

**Endpoint:** `GET /api/auth/me`
**Authentication:** Required (valid JWT token)

**Response Data:**
```json
{
  "user": {
    "userId": "USR-1234567890-ABC123DEF",
    "username": "john.doe",
    "email": "john.doe@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "department": "IT",
    "jobTitle": "Senior Developer",
    "phone": "+1234567890",
    "status": "Active",
    "emailVerified": true,
    "twoFactorEnabled": true,
    "lastLogin": "2024-01-15T10:30:00Z",
    "roles": ["employee", "developer"],
    "permissions": ["governance.read", "compliance.read"],
    "createdAt": "2023-06-01T00:00:00Z"
  }
}
```

### 3. POST /api/auth/login - Login Response with Profile

**Endpoint:** `POST /api/auth/login`
**Authentication:** Username/password

**Response Data:**
```json
{
  "message": "Login successful",
  "user": {
    "userId": "USR-1234567890-ABC123DEF",
    "username": "john.doe",
    "email": "john.doe@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "department": "IT",
    "jobTitle": "Senior Developer",
    "roles": ["employee", "developer"],
    "permissions": ["governance.read", "compliance.read"]
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900
  }
}
```

### 4. GET /api/user-permissions/users/:userId/permissions - User Permissions

**Endpoint:** `GET /api/user-permissions/users/:userId/permissions`
**Authentication:** Required (user.read permission)

**Response Data:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "USR-1234567890-ABC123DEF",
      "username": "john.doe",
      "email": "john.doe@company.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "permissions": [
      {
        "permission_id": "PERM_GOVERNANCE_READ",
        "permission_name": "governance.read",
        "display_name": "View Governance",
        "description": "View governance information",
        "resource": "governance",
        "action": "read",
        "scope": "Global",
        "granted_by_roles": ["employee"],
        "granted_by_role_names": ["Employee"]
      }
    ],
    "groupedPermissions": {
      "governance": [...],
      "compliance": [...],
      "feedback": [...]
    },
    "totalPermissions": 15
  }
}
```

### 5. GET /api/user-permissions/users/:userId/roles - User Roles

**Endpoint:** `GET /api/user-permissions/users/:userId/roles`
**Authentication:** Required (user.read permission)

**Response Data:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "USR-1234567890-ABC123DEF",
      "username": "john.doe",
      "email": "john.doe@company.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "roles": [
      {
        "role_id": "ROLE_EMPLOYEE",
        "role_name": "employee",
        "display_name": "Employee",
        "description": "Standard employee access",
        "role_type": "System",
        "is_system_role": true,
        "role_hierarchy_level": 10,
        "assigned_by": "USR-ADMIN-001",
        "assigned_at": "2023-06-01T00:00:00Z",
        "expires_at": null,
        "is_active": true,
        "assignment_reason": "Default role assignment",
        "assigned_by_username": "admin",
        "assigned_by_first_name": "System",
        "assigned_by_last_name": "Administrator",
        "is_expired": false
      }
    ],
    "totalRoles": 1
  }
}
```

### 6. GET /api/users/:userId/activity - User Activity Log

**Endpoint:** `GET /api/users/:userId/activity`
**Authentication:** Required (system.audit permission)

**Response Data:**
```json
{
  "activities": [
    {
      "log_id": "LOG-1234567890-ABC123",
      "activity_type": "LOGIN",
      "activity_description": "User logged in successfully",
      "resource": "auth",
      "action": "login",
      "ip_address": "192.168.1.100",
      "success": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50
  }
}
```

### 7. GET /api/roles/:roleId/users - Users with Specific Role

**Endpoint:** `GET /api/roles/:roleId/users`
**Authentication:** Required (role.read and user.read permissions)

**Response Data:**
```json
{
  "users": [
    {
      "user_id": "USR-1234567890-ABC123DEF",
      "username": "john.doe",
      "email": "john.doe@company.com",
      "first_name": "John",
      "last_name": "Doe",
      "department": "IT",
      "job_title": "Senior Developer",
      "status": "Active",
      "assigned_at": "2023-06-01T00:00:00Z",
      "expires_at": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

## Related Data Structures

### User Sessions
- Session management data including device info, IP addresses, and activity tracking
- Available through user_sessions table

### Password History
- Historical password hashes for security compliance
- Available through password_history table

### Role Assignments
- Detailed role assignment history with reasons and expiration dates
- Available through user_roles table

### Activity Logs
- Comprehensive audit trail of user actions
- Available through user_activity_log table

## Data Validation Rules

### User Creation/Update Validation
- **Username:** 3-50 characters, alphanumeric with underscores and hyphens
- **Email:** Valid email format, max 255 characters
- **Password:** Min 8 characters with uppercase, lowercase, number, and special character
- **Names:** 1-100 characters, letters, spaces, hyphens, and apostrophes only
- **Department:** Max 100 characters
- **Job Title:** Max 150 characters
- **Phone:** Valid mobile phone format
- **Employee ID:** Max 50 characters

## Security Considerations

### Sensitive Data
The following fields contain sensitive information and should be handled carefully:
- `password_hash` - Never exposed in API responses
- `two_factor_secret` - Never exposed in API responses
- `password_reset_token` - Only used internally
- `email_verification_token` - Only used internally

### Access Control
- User profile data requires appropriate permissions
- Users can view their own profile via `/api/auth/me`
- Viewing other users requires `user.read` permission
- Modifying users requires `user.update` permission
- Managing roles requires `user.manage_roles` permission

## Customization Options

### Preferences Field (JSONB)
The preferences field allows for flexible user customization:
```json
{
  "theme": "dark|light",
  "language": "en|es|fr|de",
  "timezone": "UTC|EST|PST",
  "notifications": {
    "email": true|false,
    "push": true|false,
    "sms": true|false
  },
  "dashboard": {
    "layout": "grid|list",
    "widgets": ["widget1", "widget2"]
  }
}
```

### Metadata Field (JSONB)
The metadata field stores additional system-generated or administrative data:
```json
{
  "onboarding_completed": true|false,
  "last_training_date": "2024-01-10",
  "compliance_status": "compliant|non-compliant",
  "security_clearance": "public|confidential|secret",
  "cost_center": "CC-001",
  "hire_date": "2023-06-01"
}
```

## Recommendations for User Profile Page

Based on the available data, a comprehensive user profile page should include:

### Basic Information Section
- Profile picture
- Full name (first_name + last_name)
- Display name
- Username
- Email address
- Phone number
- Employee ID

### Organizational Information Section
- Department
- Job title
- Office location
- Manager information
- Hire date (from metadata)

### Account Status Section
- Account status
- Email verification status
- Phone verification status
- Two-factor authentication status
- Last login date
- Account creation date

### Security Section
- Password last changed
- Active sessions
- Recent activity log
- Two-factor authentication settings

### Roles & Permissions Section
- Assigned roles with assignment dates
- Effective permissions
- Role hierarchy visualization

### Preferences Section
- Theme settings
- Language preferences
- Notification preferences
- Dashboard customization

### Activity Section
- Recent login history
- Recent actions
- Security events

## Conclusion

The current API provides comprehensive user profile data suitable for building rich user profile pages. The data is well-structured with proper validation, security controls, and flexibility for customization through JSONB fields. The role-based permission system ensures appropriate access control while the activity logging provides audit capabilities.