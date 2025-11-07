# CASB App Catalog API

## Overview

The Cloud App Security (CASB) App Catalog API is a comprehensive solution for managing cloud application governance through a dynamic, interactive platform. It empowers employees with self-service capabilities while providing IT administrators with powerful management and analytics tools.

## Key Features

### For Employees
- **Personalized App Catalog**: View apps tailored to your role and department
- **Real-Time Compliance Status**: See up-to-date security ratings and compliance information
- **App Approval Requests**: Request access to new applications with business justification
- **Shadow IT Reporting**: Report unapproved applications for security review
- **Policy Acknowledgment**: Track and acknowledge required usage policies
- **Feedback System**: Rate and provide feedback on applications
- **Notifications**: Receive alerts about approvals, policy updates, and required actions

### For IT Administrators
- **Centralized Catalog Management**: Add, update, and remove applications
- **Approval Workflow**: Review and process application access requests
- **Usage Analytics**: Comprehensive insights into app usage and adoption
- **Shadow IT Monitoring**: Track and respond to employee-reported applications
- **Policy Broadcasting**: Communicate updates to users
- **Compliance Oversight**: Monitor organization-wide compliance status

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    CASB App Catalog API                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐         │
│  │ Employee-Facing  │        │ Admin-Facing     │         │
│  │ Endpoints (8)    │        │ Endpoints (9)    │         │
│  └──────────────────┘        └──────────────────┘         │
│           │                           │                     │
│           └───────────┬───────────────┘                     │
│                       │                                     │
│           ┌───────────▼───────────┐                        │
│           │  Compliance           │                        │
│           │  Validation Service   │                        │
│           └───────────┬───────────┘                        │
│                       │                                     │
│           ┌───────────▼───────────┐                        │
│           │  PostgreSQL Database  │                        │
│           │  (13 tables)          │                        │
│           └───────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Validation**: express-validator
- **Testing**: Supertest
- **Authentication**: JWT (integrated with existing auth system)

## Installation

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL 12.x or higher
- NPM or Yarn

### Setup

1. **Install dependencies**:
   ```bash
   cd ict-governance-framework
   npm install
   ```

2. **Set up database**:
   ```bash
   psql $DATABASE_URL -f db-casb-app-catalog-schema.sql
   ```

3. **Configure environment variables** (in `.env`):
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/ict_governance_framework
   PORT=4000
   ```

4. **Start the server**:
   ```bash
   npm run server
   ```

## Usage

### Running Tests

```bash
# Run unit tests
npm run test-casb

# Run integration tests (requires server running)
npm run test-casb-integration
```

### API Endpoints

#### Employee-Facing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/casb/catalog/me` | Get personalized app catalog |
| GET | `/api/casb/catalog/:appId` | Get app details with compliance info |
| POST | `/api/casb/catalog/:appId/request-approval` | Request app approval |
| POST | `/api/casb/catalog/report-shadow-app` | Report shadow IT |
| GET | `/api/casb/catalog/me/compliance` | Check compliance status |
| POST | `/api/casb/catalog/:appId/acknowledge-policy` | Acknowledge policy |
| GET | `/api/casb/notifications/me` | Get user notifications |
| POST | `/api/casb/feedback/apps/:appId` | Submit app feedback |

#### Admin-Facing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/casb/admin/catalog` | View all applications |
| POST | `/api/casb/admin/catalog` | Add new application |
| PUT | `/api/casb/admin/catalog/:appId` | Update application |
| DELETE | `/api/casb/admin/catalog/:appId` | Remove application |
| GET | `/api/casb/admin/app-requests` | View approval requests |
| PUT | `/api/casb/admin/app-requests/:requestId` | Process request |
| GET | `/api/casb/admin/app-usage-analytics` | Get usage analytics |
| GET | `/api/casb/admin/shadow-it-reports` | View shadow IT reports |
| POST | `/api/casb/admin/policy-updates/broadcast` | Broadcast policy update |

See [API Documentation](../../docs/api/CASB-App-Catalog-API.md) for detailed endpoint documentation.

## Database Schema

The API uses a comprehensive PostgreSQL schema with 13 tables:

### Core Tables
- `casb_app_catalog` - Application information
- `casb_app_compliance` - Compliance certifications
- `casb_app_vulnerabilities` - Security vulnerabilities
- `casb_app_policies` - Usage policies

### User Interaction Tables
- `casb_user_app_usage` - User application usage tracking
- `casb_app_requests` - Approval requests
- `casb_shadow_it_reports` - Shadow IT reports
- `casb_policy_acknowledgments` - Policy acknowledgments
- `casb_app_feedback` - User feedback and ratings

### Supporting Tables
- `casb_app_guidelines` - Usage guidelines
- `casb_app_policy_mapping` - App-policy relationships
- `casb_user_notifications` - User notifications
- `casb_policy_broadcasts` - Policy update broadcasts
- `casb_app_usage_analytics` - Analytics data

## Examples

### Get Personalized Catalog (Employee)

```javascript
const axios = require('axios');

const response = await axios.get('http://localhost:4000/api/casb/catalog/me', {
  headers: {
    'x-user-id': 'user-123',
    'x-user-role': 'Employee',
    'x-user-department': 'Marketing'
  }
});

console.log(response.data.apps);
```

### Request App Approval (Employee)

```javascript
const response = await axios.post(
  'http://localhost:4000/api/casb/catalog/app-002/request-approval',
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

console.log(response.data.data.requestId);
```

### Get Usage Analytics (Admin)

```javascript
const response = await axios.get(
  'http://localhost:4000/api/casb/admin/app-usage-analytics',
  {
    headers: {
      'x-user-id': 'admin-123',
      'x-user-role': 'Administrator'
    }
  }
);

console.log(response.data.analytics);
```

## Security Considerations

### Authentication & Authorization
- All endpoints require user authentication via headers
- Admin endpoints require administrator role
- Rate limiting applied (100 requests per 15 minutes)
- Input validation on all endpoints

### Data Protection
- Sensitive data encrypted in database
- Compliance information validated against external CASB services
- Audit logging for all administrative actions
- GDPR-compliant data handling

### Best Practices
1. Always use HTTPS in production
2. Implement proper JWT token validation
3. Use environment variables for sensitive configuration
4. Regularly update dependencies
5. Monitor API usage and anomalies

## Integration with Microsoft Defender Cloud App Security

The API integrates with Microsoft Defender Cloud App Security for:
- Real-time application security ratings
- Compliance validation (SOC2, ISO27001, GDPR, HIPAA)
- Vulnerability detection
- Risk assessment

Configuration in `services/compliance-validation-service.js`:
```javascript
{
  cloudAppSecurityEndpoint: process.env.CLOUD_APP_SECURITY_API_ENDPOINT,
  apiKey: process.env.CLOUD_APP_SECURITY_API_KEY,
  tenantId: process.env.AZURE_TENANT_ID
}
```

## Monitoring & Maintenance

### Health Check
```bash
curl http://localhost:4000/api/health
```

Response includes CASB service status:
```json
{
  "status": "ok",
  "services": {
    "casbAppCatalog": "enabled",
    ...
  }
}
```

### Maintenance Tasks

1. **Update Analytics** (recommended: daily):
   ```sql
   SELECT casb_update_usage_analytics();
   ```

2. **Review Shadow IT Reports** (recommended: weekly)
3. **Check for New Vulnerabilities** (recommended: daily)
4. **Update Compliance Status** (recommended: weekly)

## Troubleshooting

### Common Issues

**Issue**: API returns 500 errors
- Check database connection
- Verify environment variables
- Review server logs

**Issue**: Compliance validation fails
- Verify CLOUD_APP_SECURITY_API_ENDPOINT is set
- Check API key validity
- Ensure network connectivity to Microsoft services

**Issue**: Tests fail
- Ensure dependencies are installed: `npm install`
- Check that database schema is loaded
- Verify no port conflicts (default: 4000)

## Contributing

1. Create a feature branch
2. Make your changes
3. Add/update tests
4. Run tests: `npm run test-casb`
5. Submit a pull request

## License

This API is part of the Multi-Cloud Multi-Tenant ICT Governance Framework, released under the MIT License.

## Support

- **Documentation**: [Full API Documentation](../../docs/api/CASB-App-Catalog-API.md)
- **Issues**: Submit via GitHub Issues
- **Contact**: ICT Governance Team

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial release
- 17 API endpoints (8 employee-facing, 9 admin-facing)
- PostgreSQL database schema with 13 tables
- Integration with Microsoft Defender Cloud App Security
- Comprehensive test suite
- Full API documentation

## Roadmap

### Planned Features
- [ ] Mobile API endpoints for mobile app integration
- [ ] Advanced analytics dashboards
- [ ] Automated approval workflows
- [ ] Integration with additional CASB providers
- [ ] Machine learning-based risk assessment
- [ ] Real-time WebSocket notifications
- [ ] API rate limiting per user
- [ ] Multi-language support
- [ ] Bulk operations API
- [ ] Export/import functionality

---

**Last Updated**: 2024-01-15  
**API Version**: 1.0.0  
**Maintainers**: ICT Governance Team
