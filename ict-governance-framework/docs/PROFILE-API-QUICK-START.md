# Profile API Quick Start Guide

## Overview

This guide provides a quick start for using the new User Profile Management API endpoints in the ICT Governance Framework.

## Prerequisites

1. Server is running on `http://localhost:4000`
2. You have a valid JWT access token (obtained via `/api/auth/login`)
3. Database is properly configured and running

## Quick Test

### 1. Get Access Token

First, log in to get an access token:

```bash
curl -X POST "http://localhost:4000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

Save the `accessToken` from the response.

### 2. Get Your Profile

```bash
curl -X GET "http://localhost:4000/api/profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Update Your Profile

```bash
curl -X PUT "http://localhost:4000/api/profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name",
    "displayName": "My Display Name"
  }'
```

### 4. Update Preferences

```bash
curl -X PUT "http://localhost:4000/api/profile/preferences" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "theme": "dark",
      "language": "en",
      "notifications": {
        "email": true,
        "push": false
      }
    }
  }'
```

### 5. View Your Activity

```bash
curl -X GET "http://localhost:4000/api/profile/activity?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. View Active Sessions

```bash
curl -X GET "http://localhost:4000/api/profile/sessions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. Upload Profile Picture

```bash
curl -X POST "http://localhost:4000/api/profile/upload-picture" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "profilePicture=@/path/to/your/image.jpg"
```

## Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get complete user profile |
| PUT | `/api/profile` | Update profile information |
| PUT | `/api/profile/preferences` | Update user preferences |
| PUT | `/api/profile/password` | Change password |
| POST | `/api/profile/upload-picture` | Upload profile picture |
| GET | `/api/profile/activity` | Get user activity log |
| GET | `/api/profile/sessions` | Get active sessions |
| DELETE | `/api/profile/sessions/:id` | Revoke specific session |
| DELETE | `/api/profile/sessions` | Revoke all other sessions |

## JavaScript Example

```javascript
// Set up axios with authentication
const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Get profile
const profile = await api.get('/profile');
console.log('User profile:', profile.data.profile);

// Update profile
const updatedProfile = await api.put('/profile', {
  firstName: 'New',
  lastName: 'Name'
});

// Update preferences
const preferences = await api.put('/profile/preferences', {
  preferences: {
    theme: 'dark',
    language: 'en'
  }
});

// Upload profile picture
const formData = new FormData();
formData.append('profilePicture', fileInput.files[0]);
const uploadResult = await api.post('/profile/upload-picture', formData);
```

## React Hook Example

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const api = axios.create({
    baseURL: 'http://localhost:4000/api',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile');
      setProfile(response.data.profile);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await api.put('/profile', data);
      setProfile(prev => ({ ...prev, ...response.data.profile }));
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Failed to update profile' 
      };
    }
  };

  const updatePreferences = async (preferences) => {
    try {
      const response = await api.put('/profile/preferences', { preferences });
      setProfile(prev => ({ ...prev, preferences: response.data.preferences }));
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Failed to update preferences' 
      };
    }
  };

  return {
    profile,
    loading,
    error,
    loadProfile,
    updateProfile,
    updatePreferences
  };
}

// Usage in component
function ProfilePage() {
  const { profile, loading, error, updateProfile } = useProfile();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Welcome, {profile.first_name}!</h1>
      <p>Email: {profile.email}</p>
      <p>Department: {profile.department}</p>
      {/* Profile editing form */}
    </div>
  );
}
```

## Testing

### Automated Testing

Run the test script:

```bash
# Update the access token in test-profile-endpoints.js first
node test-profile-endpoints.js
```

### Manual Testing

Use the provided cURL commands or the test script to verify all endpoints are working correctly.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": [
    {
      "field": "fieldName",
      "message": "Field-specific error",
      "value": "invalid_value"
    }
  ]
}
```

Common error codes:
- `VALIDATION_ERROR` - Input validation failed
- `PROFILE_NOT_FOUND` - User profile not found
- `INVALID_CURRENT_PASSWORD` - Wrong current password
- `NO_FILE_UPLOADED` - No file provided for upload
- `SESSION_NOT_FOUND` - Session not found

## Security Notes

1. All endpoints require authentication
2. Users can only access their own profile data
3. Password changes invalidate other sessions
4. File uploads are validated for type and size
5. All actions are logged for audit purposes

## Support

For detailed API documentation, see:
- [USER-PROFILE-API-DOCUMENTATION.md](./USER-PROFILE-API-DOCUMENTATION.md)
- [USER-PROFILE-IMPLEMENTATION-SUMMARY.md](./USER-PROFILE-IMPLEMENTATION-SUMMARY.md)

For issues or questions, check the server logs and ensure:
1. Database connection is working
2. JWT tokens are valid and not expired
3. Required permissions are in place
4. File upload directories exist and are writable