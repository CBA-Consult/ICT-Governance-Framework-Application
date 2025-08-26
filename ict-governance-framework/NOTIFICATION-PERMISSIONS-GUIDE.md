# Notification System Permissions Guide

## Overview

This guide explains the comprehensive permissions system for the notification and communication features in the ICT Governance Framework. The system uses role-based access control (RBAC) to ensure users have appropriate access to notification features based on their organizational roles.

## Permission Structure

### Permission Format
Permissions follow the format: `resource.action`
- **Resource**: The system component (notifications, alerts, escalations, etc.)
- **Action**: The operation (create, read, manage, etc.)

### Permission Hierarchy
- **Read**: Basic viewing permissions
- **Create**: Ability to create new items
- **Manage**: Full management capabilities including update and configuration
- **Admin**: Administrative access with system-wide control

## Notification System Permissions

### Core Notification Permissions

| Permission ID | Permission Name | Description | Scope |
|---------------|-----------------|-------------|-------|
| `PERM_NOTIFICATION_CREATE` | `notification.create` | Create and send notifications | System-wide |
| `PERM_NOTIFICATION_READ` | `notification.read` | View and read notifications | Personal/Role-based |
| `PERM_NOTIFICATION_MANAGE` | `notification.manage` | Manage notification settings and preferences | System-wide |
| `PERM_NOTIFICATION_ADMIN` | `notification.admin` | Full notification system administration | System-wide |

### Alert Management Permissions

| Permission ID | Permission Name | Description | Scope |
|---------------|-----------------|-------------|-------|
| `PERM_ALERT_CREATE` | `alert.create` | Create and trigger alerts | System-wide |
| `PERM_ALERT_READ` | `alert.read` | View and read alerts | Role-based |
| `PERM_ALERT_ACKNOWLEDGE` | `alert.acknowledge` | Acknowledge alerts | Role-based |
| `PERM_ALERT_RESOLVE` | `alert.resolve` | Resolve and close alerts | Role-based |
| `PERM_ALERT_ESCALATE` | `alert.escalate` | Escalate alerts to higher levels | Role-based |
| `PERM_ALERT_COMMENT` | `alert.comment` | Add comments to alerts | Role-based |
| `PERM_ALERT_MANAGE` | `alert.manage` | Full alert management capabilities | System-wide |

### Communication Permissions

| Permission ID | Permission Name | Description | Scope |
|---------------|-----------------|-------------|-------|
| `PERM_COMMUNICATION_CREATE` | `communication.create` | Create communication channels and messages | Role-based |
| `PERM_COMMUNICATION_READ` | `communication.read` | View communication channels and messages | Role-based |
| `PERM_COMMUNICATION_MANAGE` | `communication.manage` | Manage communication channels and settings | System-wide |

### Escalation Permissions

| Permission ID | Permission Name | Description | Scope |
|---------------|-----------------|-------------|-------|
| `PERM_ESCALATION_CREATE` | `escalation.create` | Create manual escalations | Role-based |
| `PERM_ESCALATION_READ` | `escalation.read` | View escalation information | Role-based |
| `PERM_ESCALATION_MANAGE` | `escalation.manage` | Manage escalation policies and processes | System-wide |
| `PERM_ESCALATION_RESOLVE` | `escalation.resolve` | Resolve and close escalations | Role-based |

### Real-time and System Permissions

| Permission ID | Permission Name | Description | Scope |
|---------------|-----------------|-------------|-------|
| `PERM_REALTIME_CONNECT` | `realtime.connect` | Connect to real-time notification streams | Personal |
| `PERM_REALTIME_BROADCAST` | `realtime.broadcast` | Broadcast real-time messages and announcements | System-wide |
| `PERM_SYSTEM_HEALTH` | `system.health` | View system health and status information | Role-based |
| `PERM_SYSTEM_MONITOR` | `system.monitor` | Monitor system performance and metrics | System-wide |

## Role-Based Permission Assignments

### Super Administrator (`super_admin`)
**Full Access**: All notification system permissions
- Complete system administration
- User and role management
- System configuration and monitoring
- All notification, alert, and communication features

**Permissions:**
- All `notification.*` permissions
- All `alert.*` permissions
- All `communication.*` permissions
- All `escalation.*` permissions
- All `realtime.*` permissions
- All `system.*` permissions

### Administrator (`admin`)
**Comprehensive Access**: Most notification features except user/role management
- System configuration and monitoring
- Full notification and alert management
- Communication channel management
- Escalation management

**Permissions:**
- `notification.create`, `notification.read`, `notification.manage`
- `alert.create`, `alert.read`, `alert.acknowledge`, `alert.resolve`, `alert.escalate`, `alert.comment`, `alert.manage`
- `communication.create`, `communication.read`, `communication.manage`
- `escalation.create`, `escalation.read`, `escalation.manage`, `escalation.resolve`
- `realtime.connect`, `realtime.broadcast`
- `system.health`, `system.monitor`

### System Administrator (`system_administrator`)
**Technical Focus**: Full technical system administration
- Infrastructure and system management
- Technical monitoring and maintenance
- Alert and escalation management
- System health monitoring

**Permissions:**
- All notification and alert permissions
- All communication permissions
- All escalation permissions
- All real-time and system monitoring permissions

### IT Manager (`it_manager`)
**Operational Management**: Comprehensive IT operations management
- Team and resource management
- Incident and escalation management
- System monitoring and reporting
- Communication coordination

**Permissions:**
- `notification.create`, `notification.read`, `notification.manage`
- All alert permissions
- All communication permissions
- All escalation permissions
- `realtime.connect`, `realtime.broadcast`
- `system.health`, `system.monitor`

### Security Analyst (`security_analyst`)
**Security Focus**: Security-focused notification and alert management
- Security incident management
- Alert investigation and response
- Security communication
- Escalation for security issues

**Permissions:**
- `notification.read`
- All alert permissions
- `communication.create`, `communication.read`
- `escalation.create`, `escalation.read`, `escalation.resolve`
- `realtime.connect`
- `system.health`

### Governance Manager (`governance_manager`)
**Governance Focus**: Governance and compliance-related notifications
- Policy and procedure notifications
- Compliance alerts
- Governance communication
- Process escalations

**Permissions:**
- `notification.create`, `notification.read`, `notification.manage`
- `alert.read`, `alert.acknowledge`, `alert.comment`
- All communication permissions
- All escalation permissions
- `realtime.connect`
- `system.health`

### Compliance Officer (`compliance_officer`)
**Compliance Focus**: Compliance monitoring and reporting
- Compliance notifications
- Regulatory alerts
- Compliance communication
- Compliance escalations

**Permissions:**
- `notification.read`
- `alert.read`, `alert.acknowledge`, `alert.comment`
- `communication.create`, `communication.read`
- `escalation.create`, `escalation.read`
- `realtime.connect`
- `system.health`

### IT Support (`it_support`)
**Support Operations**: First-level support and basic operations
- Basic notification access
- Alert acknowledgment
- Support communication
- Issue escalation

**Permissions:**
- `notification.read`
- `alert.read`, `alert.acknowledge`, `alert.comment`
- `communication.create`, `communication.read`
- `escalation.create`, `escalation.read`
- `realtime.connect`
- `system.health`

### Notification Administrator (`notification_admin`)
**Notification Specialist**: Dedicated notification system management
- Notification system configuration
- Communication channel management
- Notification template management
- Real-time broadcasting

**Permissions:**
- All notification permissions
- All communication permissions
- `realtime.connect`, `realtime.broadcast`

### Auditor (`auditor`)
**Audit Access**: Read-only access for audit purposes
- View notifications and alerts
- Review communication logs
- Access escalation history
- System health monitoring

**Permissions:**
- `notification.read`
- `alert.read`
- `communication.read`
- `escalation.read`
- `realtime.connect`
- `system.health`

### Employee (`employee`)
**Basic Access**: Standard employee notification access
- Personal notifications
- Basic communication
- Issue escalation
- Real-time updates

**Permissions:**
- `notification.read`
- `communication.create`, `communication.read`
- `escalation.create`, `escalation.read`
- `realtime.connect`

### Guest (`guest`)
**Limited Access**: Minimal read-only access
- Basic notification viewing
- Limited communication access
- Real-time connection

**Permissions:**
- `notification.read`
- `communication.read`
- `realtime.connect`

## API Endpoint Protection

### Authentication Requirements
All notification system APIs require authentication via JWT tokens:
```javascript
router.use(authenticateToken);
```

### Permission Checks
Each endpoint is protected with specific permission requirements:
```javascript
router.get('/notifications', requirePermission('notification.read'), async (req, res) => {
  // Endpoint implementation
});
```

### Example Protected Endpoints

#### Notification Endpoints
- `GET /api/notifications` - Requires: `notification.read`
- `POST /api/notifications` - Requires: `notification.create`
- `PATCH /api/notifications/:id/read` - Requires: `notification.read`
- `PUT /api/notifications/preferences` - Requires: `notification.read`

#### Alert Endpoints
- `GET /api/alerts` - Requires: `alert.read`
- `POST /api/alerts` - Requires: `alert.create`
- `PATCH /api/alerts/:id/acknowledge` - Requires: `alert.acknowledge`
- `PATCH /api/alerts/:id/resolve` - Requires: `alert.resolve`
- `PATCH /api/alerts/:id/escalate` - Requires: `alert.escalate`

#### Communication Endpoints
- `GET /api/communication/channels` - Requires: `communication.read`
- `POST /api/communication/channels` - Requires: `communication.create`
- `POST /api/communication/channels/:id/messages` - Requires: `communication.create`

#### Escalation Endpoints
- `GET /api/escalations/list` - Requires: `escalation.read`
- `POST /api/escalations/create` - Requires: `escalation.create`
- `POST /api/escalations/:id/action` - Requires: `escalation.manage`

#### Real-time Endpoints
- `GET /api/realtime/stream` - Requires: `realtime.connect`
- `POST /api/realtime/broadcast` - Requires: `realtime.broadcast`

## Database Schema

### Core Tables
- `permissions` - Defines all available permissions
- `roles` - Defines system and custom roles
- `role_permissions` - Maps permissions to roles
- `user_roles` - Assigns roles to users

### Permission Assignment Process
1. **Permission Definition**: Permissions are defined in the `permissions` table
2. **Role Creation**: Roles are created in the `roles` table
3. **Permission Assignment**: Permissions are assigned to roles via `role_permissions`
4. **User Assignment**: Users are assigned roles via `user_roles`

### Permission Checking Process
1. **Authentication**: User authenticates and receives JWT token
2. **Token Validation**: Middleware validates JWT and extracts user information
3. **Permission Lookup**: System queries user's roles and associated permissions
4. **Access Control**: Endpoint checks if user has required permission

## Implementation Guide

### Setting Up Permissions

1. **Run Database Updates**:
   ```bash
   psql -d ict_governance -f db-permissions-update.sql
   ```

2. **Assign Roles to Users**:
   ```sql
   INSERT INTO user_roles (user_id, role_id, assigned_by)
   VALUES ('USER123', 'ROLE_IT_MANAGER', 'ADMIN_USER');
   ```

3. **Custom Role Creation**:
   ```sql
   INSERT INTO roles (role_id, role_name, display_name, description, role_type)
   VALUES ('ROLE_CUSTOM', 'custom_role', 'Custom Role', 'Custom role description', 'Custom');
   
   INSERT INTO role_permissions (role_id, permission_id)
   VALUES ('ROLE_CUSTOM', 'PERM_NOTIFICATION_READ');
   ```

### Checking Permissions in Code

```javascript
// Middleware usage
router.get('/protected-endpoint', 
  authenticateToken, 
  requirePermission('notification.read'), 
  async (req, res) => {
    // Endpoint implementation
  }
);

// Manual permission check
if (req.user.permissions.includes('alert.manage')) {
  // User has alert management permission
}
```

### Frontend Permission Checks

```javascript
// Using auth context
const { hasPermission } = useAuth();

if (hasPermission('notification.create')) {
  // Show create notification button
}
```

## Security Considerations

### Principle of Least Privilege
- Users are assigned minimal permissions required for their role
- Permissions can be escalated as needed
- Regular permission audits should be conducted

### Permission Inheritance
- Roles can inherit permissions from parent roles
- Higher-level roles typically include lower-level permissions
- Custom roles can be created for specific needs

### Audit Trail
- All permission assignments are logged
- User activity is tracked for security monitoring
- Permission changes require administrative approval

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**:
   - Check user's assigned roles
   - Verify role has required permissions
   - Ensure user session is valid

2. **Missing Permissions**:
   - Run permission update script
   - Check role-permission mappings
   - Verify database schema is current

3. **Authentication Failures**:
   - Check JWT token validity
   - Verify user account status
   - Ensure proper middleware order

### Debug Commands

```sql
-- Check user's roles
SELECT r.role_name, r.display_name 
FROM user_roles ur 
JOIN roles r ON ur.role_id = r.role_id 
WHERE ur.user_id = 'USER123';

-- Check role's permissions
SELECT p.permission_name, p.display_name 
FROM role_permissions rp 
JOIN permissions p ON rp.permission_id = p.permission_id 
WHERE rp.role_id = 'ROLE_IT_MANAGER';

-- Check user's effective permissions
SELECT DISTINCT p.permission_name, p.display_name
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.permission_id
WHERE ur.user_id = 'USER123' AND ur.is_active = TRUE;
```

## Best Practices

### Role Design
- Create roles based on job functions
- Use descriptive role names and descriptions
- Document role purposes and responsibilities
- Regular review and update of role definitions

### Permission Management
- Group related permissions logically
- Use consistent naming conventions
- Document permission purposes
- Regular permission audits

### User Assignment
- Assign roles based on job requirements
- Use temporary role assignments when appropriate
- Document assignment reasons
- Regular review of user assignments

### Security
- Implement strong authentication
- Use secure token management
- Monitor permission usage
- Log all administrative actions

This comprehensive permissions system ensures that the notification and communication features are properly secured while providing appropriate access based on user roles and responsibilities.