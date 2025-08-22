# Dashboard Access Setup Guide

This guide will help you set up dashboard access rights and create users who can access the dashboard pages.

## Quick Setup (Recommended)

### 1. Prerequisites
- PostgreSQL database running
- Node.js and npm installed
- Environment variables configured (see `.env.example`)

### 2. Complete Setup (One Command)
```bash
npm run setup-complete
```

This will:
- Set up the database schema with permissions
- Create default users with dashboard access
- Verify that everything is working correctly

### 3. Start the Application
```bash
# Terminal 1: Start the backend server
npm run server

# Terminal 2: Start the frontend (in a new terminal)
npm run dev
```

### 4. Access the Dashboards
- **Main Dashboard**: http://localhost:3000/dashboard
- **Admin Interface**: http://localhost:3000/admin/dashboard-access

## Manual Setup (Step by Step)

### Step 1: Database Schema Setup
```bash
# Set up the database schema with permissions
npm run setup-db
```

Or manually:
```bash
psql $DATABASE_URL -f db-schema.sql
```

### Step 2: Create Users with Dashboard Access
```bash
# Create default users with appropriate dashboard permissions
npm run setup-users
```

Or manually:
```bash
node setup-dashboard-access.js
```

### Step 3: Verify Setup
```bash
# Verify that users have proper dashboard access
npm run verify-access
```

Or manually:
```bash
node verify-dashboard-access.js
```

## Default Users Created

The setup creates the following users with dashboard access:

### Administrative Users
| Username | Password | Role | Dashboard Access |
|----------|----------|------|------------------|
| `superadmin` | `Admin123!` | Super Administrator | All dashboards + Admin |
| `admin` | `Admin123!` | Administrator | All dashboards (except Admin) |

### Functional Users
| Username | Password | Role | Dashboard Access |
|----------|----------|------|------------------|
| `govmanager` | `Admin123!` | Governance Manager | Executive, Operational, Compliance, Analytics, Export |
| `compliance` | `Admin123!` | Compliance Officer | Operational, Compliance, Analytics, Export |
| `itmanager` | `Admin123!` | IT Manager | Operational, Analytics, Export |
| `security` | `Admin123!` | Security Analyst | Operational, Compliance, Analytics |
| `auditor` | `Admin123!` | Auditor | Compliance, Analytics |

### Test Users
| Username | Password | Role | Dashboard Access |
|----------|----------|------|------------------|
| `employee` | `Admin123!` | Employee + Dashboard Role | Operational, Analytics |
| `demo` | `Admin123!` | Demo User + Dashboard Role | Operational, Analytics |
| `executive` | `Admin123!` | Executive (Governance Manager) | Executive, Operational, Compliance, Analytics, Export |
| `manager` | `Admin123!` | Manager + Dashboard Role | Operational, Compliance, Analytics, Export |

## Dashboard Types and Access Levels

### 📈 Executive Dashboard
- **Purpose**: High-level strategic metrics and KPIs
- **Access**: Executives, Governance Managers, Admins
- **Features**: Strategic performance trends, governance maturity, business value

### ⚙️ Operational Dashboard
- **Purpose**: Detailed operational metrics and performance
- **Access**: Most roles (IT Managers, Compliance Officers, Security Analysts, etc.)
- **Features**: System health, incident management, workflow status

### 📋 Compliance Dashboard
- **Purpose**: Compliance status and regulatory metrics
- **Access**: Compliance Officers, Security Analysts, Auditors, Governance Managers
- **Features**: Policy compliance, audit findings, certification status

### 📊 Analytics Dashboard
- **Purpose**: Advanced analytics and data visualization
- **Access**: Most analytical roles
- **Features**: Interactive charts, drill-down capabilities, trend analysis

### 💾 Export Capability
- **Purpose**: Export dashboard data and reports
- **Access**: Most management and analytical roles
- **Features**: Data export in various formats

### 🔧 Admin Dashboard
- **Purpose**: Dashboard administration and user management
- **Access**: Super Admins only
- **Features**: User access management, permission configuration

## Testing Dashboard Access

### 1. Login with Test Users
Use any of the created users to test dashboard access:

```
URL: http://localhost:3000/auth (if you have a login page)
Username: demo
Password: Admin123!
```

### 2. Access Dashboard
Navigate to: http://localhost:3000/dashboard

The system will:
- Check your authentication
- Verify your dashboard permissions
- Show available dashboard types based on your access rights
- Display appropriate error messages if access is denied

### 3. Test Admin Interface
Login as `superadmin` or `admin` and navigate to:
http://localhost:3000/admin/dashboard-access

This interface allows you to:
- View all users and their dashboard permissions
- Grant dashboard access to users
- Revoke dashboard access from users
- Search and filter users
- View audit logs

## Granting Dashboard Access to Additional Users

### Using the Admin Interface (Recommended)
1. Login as an admin user
2. Navigate to `/admin/dashboard-access`
3. Select users you want to grant access to
4. Click "Grant Access"
5. Choose dashboard types
6. Optionally add a reason and expiration date
7. Submit the form

### Using the API
```javascript
// Grant dashboard access via API
const response = await fetch('/api/dashboard-access/grant', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userIds: ['USR-EMPLOYEE-002'],
    dashboardTypes: ['operational', 'analytics'],
    reason: 'New employee needs dashboard access for reporting',
    expiresAt: '2024-12-31T23:59:59Z' // Optional
  })
});
```

### Using SQL (Direct Database)
```sql
-- Create a custom role for specific dashboard access
INSERT INTO roles (role_id, role_name, display_name, description, role_type, created_by) 
VALUES ('ROLE_CUSTOM_ANALYST', 'custom_analyst', 'Custom Analyst Role', 'Custom role for analytics dashboard access', 'Custom', 'USR-SUPERADMIN-001');

-- Assign permissions to the role
INSERT INTO role_permissions (role_id, permission_id, granted_by) 
VALUES ('ROLE_CUSTOM_ANALYST', 'PERM_DASHBOARD_ANALYTICS', 'USR-SUPERADMIN-001');

-- Assign role to user
INSERT INTO user_roles (user_id, role_id, assigned_by, assignment_reason) 
VALUES ('USR-EMPLOYEE-002', 'ROLE_CUSTOM_ANALYST', 'USR-SUPERADMIN-001', 'Analytics access for reporting');
```

## Troubleshooting

### Common Issues

#### 1. "Authentication required" Error
- **Cause**: User is not logged in
- **Solution**: Ensure the user has a valid authentication token
- **Check**: Verify login functionality is working

#### 2. "No dashboard access permissions found" Error
- **Cause**: User has no dashboard permissions assigned
- **Solution**: Grant dashboard access using the admin interface or API
- **Check**: Run `npm run verify-access` to see current permissions

#### 3. "Access denied: Insufficient permissions" Error
- **Cause**: User trying to access a dashboard they don't have permission for
- **Solution**: Grant the specific dashboard permission or redirect to an accessible dashboard
- **Check**: Verify user's permissions match the dashboard they're trying to access

#### 4. Database Connection Issues
- **Cause**: Database not running or connection string incorrect
- **Solution**: Check DATABASE_URL environment variable and ensure PostgreSQL is running
- **Check**: Test database connection with `psql $DATABASE_URL`

### Verification Commands

```bash
# Check if users have dashboard access
npm run verify-access

# Test specific user permissions
node verify-dashboard-access.js username1 username2

# Check database schema
psql $DATABASE_URL -c "SELECT * FROM permissions WHERE resource = 'dashboards';"

# Check user roles
psql $DATABASE_URL -c "SELECT u.username, r.role_name FROM users u JOIN user_roles ur ON u.user_id = ur.user_id JOIN roles r ON ur.role_id = r.role_id WHERE ur.is_active = true;"
```

### Debug Mode

To enable debug logging, set environment variables:
```bash
export DEBUG=dashboard:*
export LOG_LEVEL=debug
```

## Security Considerations

### Password Security
- **Default Password**: All users are created with `Admin123!`
- **⚠️ IMPORTANT**: Change these passwords in production!
- **Recommendation**: Implement password reset functionality

### Permission Management
- **Principle of Least Privilege**: Users only get access to dashboards they need
- **Role-Based Access**: Permissions are managed through roles, not direct user assignments
- **Audit Trail**: All access grants/revocations are logged

### API Security
- **Authentication**: All API endpoints require valid JWT tokens
- **Authorization**: Role-based access control for admin functions
- **Rate Limiting**: Prevents abuse of API endpoints
- **Input Validation**: All inputs are validated and sanitized

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ict_governance

# JWT Secrets
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Server Configuration
PORT=4000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Dashboard Access Management
- `GET /api/dashboard-access/permissions` - Get current user's permissions
- `GET /api/dashboard-access/permissions/:userId` - Get specific user's permissions (admin)
- `POST /api/dashboard-access/grant` - Grant dashboard access
- `POST /api/dashboard-access/revoke` - Revoke dashboard access
- `GET /api/dashboard-access/users` - List users with dashboard access
- `GET /api/dashboard-access/audit` - Get access audit logs

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### User Management
- `GET /api/users` - List users (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

## Next Steps

1. **Change Default Passwords**: Update all user passwords for security
2. **Customize Permissions**: Adjust role permissions based on your organization's needs
3. **Add More Users**: Create additional users as needed
4. **Configure SSO**: Integrate with your organization's identity provider
5. **Set Up Monitoring**: Implement logging and monitoring for dashboard access
6. **Backup Strategy**: Set up regular database backups
7. **Production Deployment**: Configure for production environment

## Support

If you encounter issues:

1. **Check the logs**: Look at server and browser console logs
2. **Verify setup**: Run `npm run verify-access` to check configuration
3. **Test API**: Use tools like Postman to test API endpoints
4. **Database check**: Verify database schema and data integrity
5. **Environment**: Ensure all environment variables are set correctly

For additional help, refer to the implementation documentation in `A066-DASHBOARD-ACCESS-IMPLEMENTATION-SUMMARY.md`.

---

**Last Updated**: December 2024  
**Version**: 1.0