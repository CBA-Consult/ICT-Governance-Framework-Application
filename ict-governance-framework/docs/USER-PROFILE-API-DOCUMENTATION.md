# User Profile Management API Documentation

## Overview

This document provides comprehensive documentation for the User Profile Management API endpoints in the ICT Governance Framework. These endpoints allow users to manage their own profiles, including personal information, preferences, passwords, profile pictures, and sessions.

## Base URL

All endpoints are prefixed with `/api/profile`

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### 1. Get User Profile

**Endpoint:** `GET /api/profile`

**Description:** Retrieves the complete profile information for the currently authenticated user.

**Authentication:** Required

**Request Parameters:** None

**Response:**
```json
{
  "profile": {
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
    "profile_picture_url": "/uploads/profile-pictures/john-123456789.jpg",
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
      "lastName": "Smith",
      "email": "jane.smith@company.com"
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
    ],
    "activeSessions": 3
  }
}
```

**Error Responses:**
- `404 Not Found` - Profile not found
- `500 Internal Server Error` - Server error

---

### 2. Update User Profile

**Endpoint:** `PUT /api/profile`

**Description:** Updates the current user's profile information. Only provided fields will be updated.

**Authentication:** Required

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "Johnny Doe",
  "phone": "+1234567890",
  "officeLocation": "Building B, Floor 2"
}
```

**Validation Rules:**
- `firstName`: 1-100 characters, letters, spaces, hyphens, and apostrophes only
- `lastName`: 1-100 characters, letters, spaces, hyphens, and apostrophes only
- `displayName`: Optional, max 200 characters
- `phone`: Valid mobile phone format
- `officeLocation`: Optional, max 100 characters

**Response:**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "user_id": "USR-1234567890-ABC123DEF",
    "username": "john.doe",
    "email": "john.doe@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "display_name": "Johnny Doe",
    "phone": "+1234567890",
    "office_location": "Building B, Floor 2",
    "updated_at": "2024-01-15T14:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors or no fields to update
- `500 Internal Server Error` - Server error

---

### 3. Update User Preferences

**Endpoint:** `PUT /api/profile/preferences`

**Description:** Updates user preferences. Preferences are merged with existing ones.

**Authentication:** Required

**Request Body:**
```json
{
  "preferences": {
    "theme": "dark",
    "language": "en-US",
    "timezone": "UTC",
    "notifications": {
      "email": true,
      "push": false,
      "sms": true
    },
    "dashboard": {
      "layout": "grid",
      "widgets": ["widget1", "widget2"]
    }
  }
}
```

**Allowed Preference Keys:**
- `theme`: "light", "dark", or "auto"
- `language`: Language code (e.g., "en", "en-US")
- `timezone`: Timezone identifier
- `notifications`: Object with email, push, sms boolean values
- `dashboard`: Object with layout and widgets configuration

**Response:**
```json
{
  "message": "Preferences updated successfully",
  "preferences": {
    "theme": "dark",
    "language": "en-US",
    "timezone": "UTC",
    "notifications": {
      "email": true,
      "push": false,
      "sms": true
    },
    "dashboard": {
      "layout": "grid",
      "widgets": ["widget1", "widget2"]
    }
  },
  "updatedAt": "2024-01-15T14:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid preference values
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

---

### 4. Change Password

**Endpoint:** `PUT /api/profile/password`

**Description:** Changes the user's password with security validations.

**Authentication:** Required

**Request Body:**
```json
{
  "currentPassword": "currentPassword123!",
  "newPassword": "newPassword456@",
  "confirmPassword": "newPassword456@"
}
```

**Validation Rules:**
- `currentPassword`: Required, must match current password
- `newPassword`: 8-128 characters with uppercase, lowercase, number, and special character
- `confirmPassword`: Must match newPassword
- New password must be different from current password
- Cannot reuse any of the last 5 passwords

**Response:**
```json
{
  "message": "Password changed successfully",
  "lastPasswordChange": "2024-01-15T14:30:00Z"
}
```

**Security Features:**
- Validates current password
- Enforces password complexity requirements
- Prevents password reuse (last 5 passwords)
- Invalidates all other sessions except current one
- Stores password history for security compliance

**Error Responses:**
- `400 Bad Request` - Validation errors, incorrect current password, or password reuse
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

---

### 5. Upload Profile Picture

**Endpoint:** `POST /api/profile/upload-picture`

**Description:** Uploads a new profile picture for the user.

**Authentication:** Required

**Request:** Multipart form data with file field named `profilePicture`

**File Requirements:**
- Allowed formats: JPEG, JPG, PNG, GIF
- Maximum file size: 5MB
- File is automatically renamed with user ID and timestamp

**Response:**
```json
{
  "message": "Profile picture uploaded successfully",
  "profilePictureUrl": "/uploads/profile-pictures/USR-1234567890-ABC123DEF-1642234567890.jpg",
  "updatedAt": "2024-01-15T14:30:00Z"
}
```

**Features:**
- Automatically deletes old profile picture
- Generates unique filename to prevent conflicts
- Validates file type and size
- Creates upload directory if it doesn't exist

**Error Responses:**
- `400 Bad Request` - No file uploaded or invalid file type
- `500 Internal Server Error` - Server error

---

### 6. Get User Activity

**Endpoint:** `GET /api/profile/activity`

**Description:** Retrieves the current user's activity log with pagination.

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `activityType` (optional): Filter by activity type

**Response:**
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
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Error Responses:**
- `500 Internal Server Error` - Server error

---

### 7. Get Active Sessions

**Endpoint:** `GET /api/profile/sessions`

**Description:** Retrieves all active sessions for the current user.

**Authentication:** Required

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "session-uuid-1",
      "deviceInfo": {
        "platform": "Windows",
        "browser": "Chrome"
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "lastActivity": "2024-01-15T14:30:00Z",
      "expiresAt": "2024-01-22T14:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "isCurrent": true
    }
  ]
}
```

**Error Responses:**
- `500 Internal Server Error` - Server error

---

### 8. Revoke Session

**Endpoint:** `DELETE /api/profile/sessions/:sessionId`

**Description:** Revokes a specific session. Cannot revoke the current session.

**Authentication:** Required

**Path Parameters:**
- `sessionId`: The session ID to revoke

**Response:**
```json
{
  "message": "Session revoked successfully",
  "sessionId": "session-uuid-1"
}
```

**Error Responses:**
- `400 Bad Request` - Attempting to revoke current session
- `404 Not Found` - Session not found
- `500 Internal Server Error` - Server error

---

### 9. Revoke All Other Sessions

**Endpoint:** `DELETE /api/profile/sessions`

**Description:** Revokes all sessions except the current one.

**Authentication:** Required

**Response:**
```json
{
  "message": "All other sessions revoked successfully",
  "revokedCount": 2
}
```

**Error Responses:**
- `500 Internal Server Error` - Server error

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": [
    {
      "field": "fieldName",
      "message": "Field-specific error message",
      "value": "invalid_value",
      "location": "body"
    }
  ]
}
```

## Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `PROFILE_NOT_FOUND` - User profile not found
- `USER_NOT_FOUND` - User not found
- `NO_UPDATE_FIELDS` - No fields provided for update
- `INVALID_CURRENT_PASSWORD` - Current password is incorrect
- `SAME_PASSWORD` - New password same as current
- `PASSWORD_REUSED` - Password was recently used
- `NO_FILE_UPLOADED` - No file provided for upload
- `INVALID_FILE_TYPE` - File type not allowed
- `SESSION_NOT_FOUND` - Session not found
- `CANNOT_REVOKE_CURRENT_SESSION` - Cannot revoke current session

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own profile data
3. **Password Security**: 
   - Current password verification required
   - Password complexity enforcement
   - Password history tracking
   - Session invalidation on password change
4. **File Upload Security**:
   - File type validation
   - File size limits
   - Unique filename generation
   - Automatic cleanup of old files
5. **Session Management**:
   - Session tracking and management
   - Ability to revoke sessions for security
6. **Activity Logging**: All profile changes are logged for audit purposes

## Usage Examples

### JavaScript/Fetch Example

```javascript
// Get user profile
const response = await fetch('/api/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
const { profile } = await response.json();

// Update profile
const updateResponse = await fetch('/api/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe'
  })
});

// Upload profile picture
const formData = new FormData();
formData.append('profilePicture', fileInput.files[0]);

const uploadResponse = await fetch('/api/profile/upload-picture', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});
```

### cURL Examples

```bash
# Get profile
curl -X GET "http://localhost:4000/api/profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Update profile
curl -X PUT "http://localhost:4000/api/profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Doe"}'

# Change password
curl -X PUT "http://localhost:4000/api/profile/password" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldPassword123!",
    "newPassword": "newPassword456@",
    "confirmPassword": "newPassword456@"
  }'

# Upload profile picture
curl -X POST "http://localhost:4000/api/profile/upload-picture" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "profilePicture=@/path/to/image.jpg"
```

## Integration with Frontend

These endpoints are designed to work seamlessly with frontend applications:

1. **Profile Page**: Use `GET /api/profile` to populate user profile page
2. **Settings Page**: Use update endpoints for user settings management
3. **Security Page**: Use password change and session management endpoints
4. **Avatar Component**: Use profile picture upload endpoint
5. **Activity Dashboard**: Use activity endpoint for user activity tracking

## Rate Limiting

All endpoints are subject to the general rate limiting configured in the server:
- 100 requests per 15 minutes per IP address
- Additional rate limiting may apply to specific endpoints

## Conclusion

The User Profile Management API provides comprehensive functionality for users to manage their profiles securely and efficiently. The API follows REST principles, includes proper validation and security measures, and provides detailed error handling for robust frontend integration.