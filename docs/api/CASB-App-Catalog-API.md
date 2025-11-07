# CASB App Catalog API Documentation

## Overview

The CASB (Cloud App Security) App Catalog API provides a comprehensive solution for managing cloud application governance. It enables dynamic, interactive employee engagement with application approval processes, compliance tracking, and security monitoring.

## Base URL

```
http://localhost:4000/api/casb
```

## Authentication

All API endpoints require authentication. Include the following headers in your requests:

```
x-user-id: <user-id>
x-user-role: <role> (optional)
x-user-department: <department> (optional)
Authorization: Bearer <jwt-token>
```

---

## Employee-Facing Endpoints

### 1. Get Personalized App Catalog

Returns a personalized list of approved apps relevant to the logged-in employee based on their role and department.

**Endpoint:** `GET /api/casb/catalog/me`

**Query Parameters:**
- `role` (optional): User role for personalization
- `department` (optional): User department for personalization

**Response:**
```json
{
  "success": true,
  "userId": "user-123",
  "userRole": "Employee",
  "userDepartment": "Marketing",
  "apps": [
    {
      "id": "app-001",
      "name": "Microsoft Office 365",
      "description": "Complete productivity suite",
      "category": "Productivity",
      "publisher": "Microsoft Corporation",
      "securityRating": 95,
      "riskLevel": "Low",
      "recommendedForYou": 5,
      "personalizedNotes": ["Recommended for your role"],
      "complianceStatus": {
        "soc2": true,
        "iso27001": true,
        "gdpr": true
      }
    }
  ],
  "total": 3,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Get Application Details

Returns detailed information about a specific app including real-time compliance status, security information, and usage guidelines.

**Endpoint:** `GET /api/casb/catalog/:appId`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "app-001",
    "name": "Microsoft Office 365",
    "description": "Complete productivity suite",
    "category": "Productivity",
    "publisher": "Microsoft Corporation",
    "version": "2024.1",
    "securityRating": 95,
    "riskLevel": "Low",
    "complianceStatus": {
      "soc2": true,
      "iso27001": true,
      "gdpr": true,
      "hipaa": true
    },
    "vulnerabilities": [],
    "usageGuidelines": [
      "Use corporate credentials for authentication",
      "Follow data retention policies"
    ],
    "policies": [
      {
        "id": "pol-001",
        "name": "Data Retention Policy",
        "url": "/policies/data-retention"
      }
    ],
    "complianceValidation": {
      "isCompliant": true,
      "complianceScore": 95,
      "validationTimestamp": "2024-01-15T10:30:00Z"
    },
    "installationInstructions": {
      "steps": [
        "Review usage guidelines and policies",
        "Click the installation link",
        "Sign in with corporate credentials"
      ],
      "prerequisites": [
        "Active corporate account",
        "VPN connection if working remotely"
      ]
    },
    "supportInformation": {
      "vendor": "Microsoft Corporation",
      "internalSupport": "IT Help Desk - ext. 1234"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. Request Application Approval

Submit a request to install or use an application that requires approval.

**Endpoint:** `POST /api/casb/catalog/:appId/request-approval`

**Request Body:**
```json
{
  "businessJustification": "Need Slack for cross-team collaboration",
  "department": "Marketing",
  "estimatedUsers": 5,
  "urgency": "Medium"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "req-1234567890",
    "status": "Approval request submitted",
    "estimatedApprovalTime": "2 business days",
    "nextSteps": "Your manager will be notified for approval"
  }
}
```

### 4. Report Shadow IT Application

Report usage of an uncataloged application for security review.

**Endpoint:** `POST /api/casb/catalog/report-shadow-app`

**Request Body:**
```json
{
  "appName": "NewCollabTool",
  "appUrl": "https://newcollabtool.com",
  "description": "Project management and collaboration tool",
  "usageReason": "Team recommended it for better project tracking"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "shadow-1234567890",
    "status": "Shadow IT report submitted",
    "message": "Thank you for reporting. The security team will review this application.",
    "nextSteps": "You will be notified once the review is complete"
  }
}
```

### 5. Get User Compliance Status

Check your compliance status for all approved applications you're using.

**Endpoint:** `GET /api/casb/catalog/me/compliance`

**Response:**
```json
{
  "success": true,
  "userId": "user-123",
  "overallCompliance": true,
  "apps": [
    {
      "appId": "app-001",
      "appName": "Microsoft Office 365",
      "isCompliant": true,
      "policiesAcknowledged": true,
      "requiredActions": []
    },
    {
      "appId": "app-002",
      "appName": "Slack",
      "isCompliant": false,
      "policiesAcknowledged": false,
      "requiredActions": [
        {
          "action": "Acknowledge Policies",
          "description": "Review and acknowledge all required policies",
          "priority": "High"
        }
      ]
    }
  ],
  "totalApps": 2,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 6. Acknowledge Policy

Acknowledge that you've read and understood a policy for an application.

**Endpoint:** `POST /api/casb/catalog/:appId/acknowledge-policy`

**Request Body:**
```json
{
  "policyId": "pol-001",
  "acknowledged": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Policy acknowledgment recorded",
  "data": {
    "userId": "user-123",
    "appId": "app-001",
    "policyId": "pol-001",
    "status": "Acknowledged"
  }
}
```

### 7. Get User Notifications

Retrieve personalized notifications and alerts related to app usage.

**Endpoint:** `GET /api/casb/notifications/me`

**Response:**
```json
{
  "success": true,
  "userId": "user-123",
  "notifications": [
    {
      "type": "info",
      "title": "Approval Pending",
      "message": "Your request for Slack is pending approval",
      "timestamp": "2024-01-15T09:00:00Z"
    },
    {
      "type": "warning",
      "title": "Action Required",
      "message": "Please acknowledge policies for Microsoft Office 365",
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 2,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 8. Submit Application Feedback

Provide feedback and ratings for applications you're using.

**Endpoint:** `POST /api/casb/feedback/apps/:appId`

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Great tool, but could use better mobile support",
  "category": "Usability"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your feedback",
  "data": {
    "feedbackId": "feedback-1234567890",
    "appId": "app-001",
    "rating": 4
  }
}
```

---

## Admin/IT-Facing Endpoints

### 9. Get All Applications (Admin)

Retrieve all applications in the catalog with optional filtering.

**Endpoint:** `GET /api/casb/admin/catalog`

**Query Parameters:**
- `category` (optional): Filter by category
- `status` (optional): Filter by approval status (Approved, Pending, Rejected)
- `riskLevel` (optional): Filter by risk level (Low, Medium, High)

**Response:**
```json
{
  "success": true,
  "apps": [
    {
      "id": "app-001",
      "name": "Microsoft Office 365",
      "category": "Productivity",
      "approvalStatus": "Approved",
      "securityRating": 95,
      "riskLevel": "Low"
    }
  ],
  "total": 10,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 10. Add New Application (Admin)

Add a new application to the catalog.

**Endpoint:** `POST /api/casb/admin/catalog`

**Request Body:**
```json
{
  "name": "Trello",
  "publisher": "Atlassian",
  "category": "Project Management",
  "description": "Visual collaboration tool for organizing tasks",
  "version": "2024.1",
  "securityRating": 82,
  "riskLevel": "Medium",
  "dataClassification": "Business"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application added to catalog",
  "data": {
    "id": "app-004",
    "name": "Trello",
    "isApproved": false,
    "approvalStatus": "Pending Review"
  }
}
```

### 11. Update Application (Admin)

Update an existing application in the catalog.

**Endpoint:** `PUT /api/casb/admin/catalog/:appId`

**Request Body:**
```json
{
  "securityRating": 90,
  "approvalStatus": "Approved",
  "isApproved": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application updated successfully",
  "data": {
    "id": "app-004",
    "name": "Trello",
    "securityRating": 90,
    "approvalStatus": "Approved"
  }
}
```

### 12. Delete Application (Admin)

Remove an application from the catalog.

**Endpoint:** `DELETE /api/casb/admin/catalog/:appId`

**Response:**
```json
{
  "success": true,
  "message": "Application removed from catalog"
}
```

### 13. Get Approval Requests (Admin)

Retrieve all application approval requests.

**Endpoint:** `GET /api/casb/admin/app-requests`

**Query Parameters:**
- `status` (optional): Filter by status (Pending, Approved, Rejected)
- `department` (optional): Filter by department

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "req-1234567890",
      "appId": "app-002",
      "appName": "Slack",
      "userId": "user-123",
      "department": "Marketing",
      "businessJustification": "Need for team collaboration",
      "status": "Pending",
      "submittedAt": "2024-01-15T09:00:00Z"
    }
  ],
  "total": 5,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 14. Approve or Reject Request (Admin)

Process an application approval request.

**Endpoint:** `PUT /api/casb/admin/app-requests/:requestId`

**Request Body:**
```json
{
  "status": "Approved",
  "reviewNotes": "Approved for marketing team use. Ensure data encryption is enabled."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request approved successfully",
  "data": {
    "id": "req-1234567890",
    "status": "Approved",
    "reviewNotes": "Approved for marketing team use.",
    "reviewedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 15. Get Usage Analytics (Admin)

Retrieve comprehensive analytics and reports on application usage.

**Endpoint:** `GET /api/casb/admin/app-usage-analytics`

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalApps": 15,
    "approvedApps": 12,
    "pendingRequests": 5,
    "shadowITReports": 3,
    "topApps": [
      {
        "id": "app-001",
        "name": "Microsoft Office 365",
        "securityRating": 95,
        "category": "Productivity"
      }
    ],
    "riskDistribution": {
      "Low": 8,
      "Medium": 5,
      "High": 2
    },
    "complianceOverview": {
      "soc2Compliant": 10,
      "iso27001Compliant": 12,
      "gdprCompliant": 15,
      "hipaaCompliant": 7,
      "totalApps": 15
    },
    "userEngagement": {
      "totalUsers": 250,
      "totalFeedback": 45,
      "totalShadowITReports": 3,
      "totalRequests": 15,
      "avgComplianceRate": 0.85
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 16. Get Shadow IT Reports (Admin)

View all shadow IT reports submitted by employees.

**Endpoint:** `GET /api/casb/admin/shadow-it-reports`

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "shadow-1234567890",
      "appName": "NewCollabTool",
      "appUrl": "https://newcollabtool.com",
      "usageReason": "Team recommended for project tracking",
      "reportedBy": "user-123",
      "reportedAt": "2024-01-15T08:00:00Z",
      "status": "Under Review",
      "riskAssessment": "Pending"
    }
  ],
  "total": 3,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 17. Broadcast Policy Updates (Admin)

Send policy updates and notifications to users.

**Endpoint:** `POST /api/casb/admin/policy-updates/broadcast`

**Request Body:**
```json
{
  "title": "New Data Classification Policy",
  "message": "Please review the updated data classification policy effective Feb 1, 2024.",
  "targetAudience": "All",
  "priority": "High"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Policy update broadcast successfully",
  "data": {
    "id": "broadcast-1234567890",
    "title": "New Data Classification Policy",
    "targetAudience": "All",
    "priority": "High",
    "broadcastAt": "2024-01-15T10:30:00Z",
    "status": "Sent"
  }
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server-side error

---

## Rate Limiting

API requests are rate-limited to:
- 100 requests per 15 minutes per IP address
- Additional limits may apply to admin endpoints

---

## Database Schema

The API uses PostgreSQL database with the following main tables:

- `casb_app_catalog` - Main application catalog
- `casb_app_compliance` - Compliance status per application
- `casb_app_vulnerabilities` - Security vulnerabilities
- `casb_app_policies` - Application policies
- `casb_user_app_usage` - User application usage tracking
- `casb_app_requests` - Approval requests
- `casb_shadow_it_reports` - Shadow IT reports
- `casb_policy_acknowledgments` - Policy acknowledgments
- `casb_app_feedback` - Application feedback and ratings

See `db-casb-app-catalog-schema.sql` for complete schema definition.

---

## Integration Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Get personalized app catalog
async function getMyApps() {
  try {
    const response = await axios.get('http://localhost:4000/api/casb/catalog/me', {
      headers: {
        'x-user-id': 'user-123',
        'x-user-role': 'Employee',
        'Authorization': 'Bearer your-jwt-token'
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Submit app approval request
async function requestAppApproval(appId) {
  try {
    const response = await axios.post(
      `http://localhost:4000/api/casb/catalog/${appId}/request-approval`,
      {
        businessJustification: 'Need for team collaboration',
        department: 'Marketing',
        estimatedUsers: 5,
        urgency: 'Medium'
      },
      {
        headers: {
          'x-user-id': 'user-123',
          'Authorization': 'Bearer your-jwt-token'
        }
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

### Python

```python
import requests

BASE_URL = 'http://localhost:4000/api/casb'
HEADERS = {
    'x-user-id': 'user-123',
    'x-user-role': 'Employee',
    'Authorization': 'Bearer your-jwt-token'
}

# Get personalized app catalog
def get_my_apps():
    response = requests.get(f'{BASE_URL}/catalog/me', headers=HEADERS)
    return response.json()

# Report shadow IT
def report_shadow_app(app_data):
    response = requests.post(
        f'{BASE_URL}/catalog/report-shadow-app',
        json=app_data,
        headers=HEADERS
    )
    return response.json()

# Example usage
apps = get_my_apps()
print(f"Found {apps['total']} approved apps")
```

---

## Support and Contributing

For issues, questions, or contributions:
- Create an issue in the GitHub repository
- Contact the ICT Governance Team
- Review the main project documentation

---

## License

This API is part of the Multi-Cloud Multi-Tenant ICT Governance Framework, released under the MIT License.
