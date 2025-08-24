# User Management System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Environment Setup
```bash
# Clone and navigate
cd ict-governance-framework

# Install dependencies
npm install

# Setup environment
cp .env.example .env
```

### 2. Database Setup
```bash
# Create database
createdb ict_governance_framework

# Run schema
psql -d ict_governance_framework -f db-schema.sql
```

### 3. Start Services
```bash
# Terminal 1: Backend
node server.js

# Terminal 2: Frontend
npm run dev
```

### 4. Create Admin Account
1. Visit: `http://localhost:3000/auth?mode=register`
2. Register with your details
3. Run SQL to assign admin role:
```sql
-- Find your user ID
SELECT user_id, username, email FROM users WHERE email = 'your-email@example.com';

-- Assign super_admin role
INSERT INTO user_roles (user_id, role_id, assigned_by, assignment_reason)
VALUES ('YOUR_USER_ID', 'ROLE_SUPER_ADMIN', 'YOUR_USER_ID', 'Initial super admin setup');
```

## 🔑 Default Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|----------------|
| `super_admin` | Full system access | All permissions |
| `admin` | Administrative access | Most permissions except user/role creation |
| `governance_manager` | Governance oversight | Governance, compliance, workflow management |
| `compliance_officer` | Compliance monitoring | Compliance read/manage, audit access |
| `it_manager` | IT operations | IT management, app procurement, workflows |
| `security_analyst` | Security monitoring | Security audit, compliance read, monitoring |
| `auditor` | Audit and review | Read-only audit access, compliance review |
| `employee` | Standard user | Basic app procurement, feedback, workflow creation |
| `guest` | Limited access | Read-only governance and compliance |

## 📋 Common Tasks

### User Management
```bash
# List all users
GET /api/users

# Create user
POST /api/users
{
  "username": "jdoe",
  "email": "john.doe@company.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "department": "IT",
  "jobTitle": "Developer"
}

# Assign role to user
POST /api/users/{userId}/roles
{
  "roles": ["employee", "it_manager"],
  "reason": "Promotion to IT Manager"
}
```

### Role Management
```bash
# List all roles
GET /api/roles

# Create custom role
POST /api/roles
{
  "roleName": "project_manager",
  "displayName": "Project Manager",
  "description": "Manages projects and teams",
  "permissions": ["workflow.create", "workflow.manage", "user.read"]
}
```

### Authentication
```bash
# Login
POST /api/auth/login
{
  "username": "admin",
  "password": "AdminPass123!"
}

# Get current user info
GET /api/auth/me
Authorization: Bearer {access_token}
```

## 🔐 Security Features

### Password Requirements
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- Cannot reuse last 5 passwords
- Account locks after 5 failed attempts (30 min lockout)

### Session Management
- JWT access tokens (15 min expiry)
- Refresh tokens (7 day expiry)
- Multi-device session support
- Remote session termination

### Rate Limiting
- 100 requests per 15 minutes per IP (general)
- 5 login attempts per 15 minutes per IP
- 3 registration attempts per hour per IP

## 🎯 Access Control Examples

### Frontend Route Protection
```javascript
// Protect a page with permissions
export default withAuth(MyComponent, ['user.read'], ['admin', 'super_admin']);

// Check permissions in component
const { hasPermission, hasRole } = useAuth();
if (hasPermission('user.create')) {
  // Show create user button
}
```

### API Endpoint Protection
```javascript
// Require authentication + permissions
router.get('/users', 
  authenticateToken,
  requirePermissions(['user.read']),
  getUsersHandler
);

// Require specific roles
router.delete('/users/:id',
  authenticateToken,
  requireRoles(['admin', 'super_admin']),
  deleteUserHandler
);
```

## 🔍 Monitoring & Troubleshooting

### Health Check
```bash
GET /api/health
```

### View User Activity
```bash
GET /api/users/{userId}/activity
```

### Common Issues

**Login fails with valid credentials:**
- Check if account is locked: `SELECT account_locked_until FROM users WHERE username = 'username'`
- Check user status: `SELECT status FROM users WHERE username = 'username'`

**Permission denied errors:**
- Verify user roles: `SELECT r.role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE ur.user_id = 'USER_ID'`
- Check role permissions: `SELECT p.permission_name FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.permission_id WHERE rp.role_id = 'ROLE_ID'`

**Session expired frequently:**
- Check JWT_ACCESS_SECRET in .env
- Verify system time synchronization
- Check session expiration settings

## 📊 Database Quick Queries

```sql
-- View all users with roles
SELECT u.username, u.email, u.status, 
       array_agg(r.role_name) as roles
FROM users u
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.role_id
GROUP BY u.user_id, u.username, u.email, u.status;

-- View role permissions
SELECT r.role_name, r.display_name,
       array_agg(p.permission_name) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.permission_id
GROUP BY r.role_id, r.role_name, r.display_name;

-- View recent user activity
SELECT u.username, ual.activity_type, ual.activity_description, 
       ual.success, ual.created_at
FROM user_activity_log ual
JOIN users u ON ual.user_id = u.user_id
ORDER BY ual.created_at DESC
LIMIT 50;

-- Clean up expired sessions
DELETE FROM user_sessions 
WHERE expires_at < CURRENT_TIMESTAMP OR is_active = false;
```

## 🚀 Production Deployment

### Environment Variables (Production)
```bash
# Generate strong secrets
JWT_ACCESS_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# Database with SSL
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Production settings
NODE_ENV=production
PORT=4000
```

### Security Checklist
- [ ] Strong JWT secrets generated
- [ ] HTTPS enabled
- [ ] Database SSL enabled
- [ ] Rate limiting configured
- [ ] Monitoring and alerting setup
- [ ] Regular backups configured
- [ ] Security headers enabled (Helmet.js)
- [ ] Input validation on all endpoints
- [ ] Audit logging enabled

---

**Ready to go! The user management system provides enterprise-grade security and scalability for your ICT Governance Framework.**