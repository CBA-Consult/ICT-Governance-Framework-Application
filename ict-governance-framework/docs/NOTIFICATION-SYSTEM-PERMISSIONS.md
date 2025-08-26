# Notification System Permissions and Roles Documentation

## Overview

This document provides comprehensive documentation for the permissions and roles implemented for the notification and communication system in the ICT Governance Framework.

## 🔐 Permission Categories

### 1. Notification Permissions
| Permission | Description | Resource Type |
|------------|-------------|---------------|
| `notification.create` | Create notifications | notification |
| `notification.read` | Read notifications | notification |
| `notification.update` | Update notifications | notification |
| `notification.delete` | Delete notifications | notification |
| `notification.manage` | Full notification management | notification |
| `notification.acknowledge` | Acknowledge notifications | notification |
| `notification.schedule` | Schedule notifications | notification |
| `notification.analytics` | View notification analytics | notification |
| `notification.bulk_action` | Perform bulk notification actions | notification |
| `notification.template.create` | Create notification templates | template |
| `notification.template.manage` | Manage notification templates | template |
| `notification.preferences.manage` | Manage notification preferences | preferences |

### 2. Alert Permissions
| Permission | Description | Resource Type |
|------------|-------------|---------------|
| `alert.create` | Create alerts | alert |
| `alert.read` | Read alerts | alert |
| `alert.update` | Update alerts | alert |
| `alert.delete` | Delete alerts | alert |
| `alert.manage` | Full alert management | alert |
| `alert.acknowledge` | Acknowledge alerts | alert |
| `alert.resolve` | Resolve alerts | alert |
| `alert.escalate` | Escalate alerts | alert |
| `alert.analytics` | View alert analytics | alert |
| `alert.bulk_action` | Perform bulk alert actions | alert |
| `alert.template.create` | Create alert templates | template |
| `alert.template.manage` | Manage alert templates | template |
| `alert.rule.create` | Create alert rules | rule |
| `alert.rule.manage` | Manage alert rules | rule |

### 3. Communication Permissions
| Permission | Description | Resource Type |
|------------|-------------|---------------|
| `communication.read` | Read communications | communication |
| `communication.send` | Send communications | communication |
| `communication.manage` | Manage communications | communication |
| `communication.channel.create` | Create communication channels | channel |
| `communication.channel.manage` | Manage communication channels | channel |
| `communication.channel.delete` | Delete communication channels | channel |
| `communication.message.send` | Send messages in channels | message |
| `communication.message.edit` | Edit messages | message |
| `communication.message.delete` | Delete messages | message |
| `communication.template.create` | Create communication templates | template |
| `communication.template.manage` | Manage communication templates | template |
| `communication.template.send` | Send communications using templates | template |
| `communication.analytics` | View communication analytics | analytics |

### 4. Announcement Permissions
| Permission | Description | Resource Type |
|------------|-------------|---------------|
| `announcement.create` | Create announcements | announcement |
| `announcement.read` | Read announcements | announcement |
| `announcement.update` | Update announcements | announcement |
| `announcement.delete` | Delete announcements | announcement |
| `announcement.manage` | Full announcement management | announcement |
| `announcement.comment` | Comment on announcements | comment |
| `announcement.moderate` | Moderate announcement comments | comment |
| `announcement.analytics` | View announcement analytics | analytics |
| `announcement.schedule` | Schedule announcements | announcement |
| `announcement.broadcast` | Create system-wide announcements | announcement |

### 5. Escalation Permissions
| Permission | Description | Resource Type |
|------------|-------------|---------------|
| `escalation.read` | Read escalations | escalation |
| `escalation.create` | Create escalations | escalation |
| `escalation.update` | Update escalations | escalation |
| `escalation.delete` | Delete escalations | escalation |
| `escalation.manage` | Full escalation management | escalation |
| `escalation.resolve` | Resolve escalations | escalation |
| `escalation.assign` | Assign escalations | escalation |
| `escalation.policy.create` | Create escalation policies | policy |
| `escalation.policy.manage` | Manage escalation policies | policy |
| `escalation.service.manage` | Manage escalation service | service |
| `escalation.analytics` | View escalation analytics | analytics |

### 6. System Administration Permissions
| Permission | Description | Resource Type |
|------------|-------------|---------------|
| `system.notification.admin` | Full notification system administration | notification |
| `system.alert.admin` | Full alert system administration | alert |
| `system.communication.admin` | Full communication system administration | communication |
| `system.escalation.admin` | Full escalation system administration | escalation |
| `system.monitoring.read` | Read system monitoring data | monitoring |
| `system.health.read` | Read system health status | health |
| `system.logs.read` | Read system logs | logs |
| `system.config.manage` | Manage system configuration | config |

## 👥 Roles and Their Permissions

### 1. Notification User (`notification_user`)
**Description:** Basic notification user with read and acknowledge permissions

**Permissions:**
- `notification.read`
- `notification.acknowledge`
- `notification.preferences.manage`

**Use Case:** Regular employees who need to receive and acknowledge notifications

### 2. Notification Manager (`notification_manager`)
**Description:** Notification manager with create and manage permissions

**Permissions:**
- `notification.create`
- `notification.read`
- `notification.update`
- `notification.delete`
- `notification.manage`
- `notification.acknowledge`
- `notification.schedule`
- `notification.analytics`
- `notification.bulk_action`
- `notification.template.create`
- `notification.template.manage`
- `notification.preferences.manage`

**Use Case:** Team leads or managers who need to create and manage notifications

### 3. Alert Operator (`alert_operator`)
**Description:** Alert operator with acknowledge and resolve permissions

**Permissions:**
- `alert.read`
- `alert.acknowledge`
- `alert.resolve`
- `alert.analytics`

**Use Case:** Operations team members who respond to alerts

### 4. Alert Manager (`alert_manager`)
**Description:** Alert manager with full alert management permissions

**Permissions:**
- `alert.create`
- `alert.read`
- `alert.update`
- `alert.delete`
- `alert.manage`
- `alert.acknowledge`
- `alert.resolve`
- `alert.escalate`
- `alert.analytics`
- `alert.bulk_action`
- `alert.template.create`
- `alert.template.manage`
- `alert.rule.create`
- `alert.rule.manage`

**Use Case:** Security or operations managers who oversee alert management

### 5. Communication User (`communication_user`)
**Description:** Basic communication user with send and read permissions

**Permissions:**
- `communication.read`
- `communication.send`
- `communication.message.send`
- `announcement.read`
- `announcement.comment`

**Use Case:** Regular employees who participate in communications

### 6. Communication Manager (`communication_manager`)
**Description:** Communication manager with channel and template management

**Permissions:**
- `communication.read`
- `communication.send`
- `communication.manage`
- `communication.channel.create`
- `communication.channel.manage`
- `communication.channel.delete`
- `communication.message.send`
- `communication.message.edit`
- `communication.message.delete`
- `communication.template.create`
- `communication.template.manage`
- `communication.template.send`
- `communication.analytics`

**Use Case:** HR or communications team members who manage organizational communications

### 7. Announcement Editor (`announcement_editor`)
**Description:** Announcement editor with create and manage permissions

**Permissions:**
- `announcement.create`
- `announcement.read`
- `announcement.update`
- `announcement.delete`
- `announcement.manage`
- `announcement.comment`
- `announcement.moderate`
- `announcement.analytics`
- `announcement.schedule`
- `announcement.broadcast`

**Use Case:** Communications team or executives who create company announcements

### 8. Escalation Specialist (`escalation_specialist`)
**Description:** Escalation specialist with escalation management permissions

**Permissions:**
- `escalation.read`
- `escalation.create`
- `escalation.update`
- `escalation.manage`
- `escalation.resolve`
- `escalation.assign`
- `escalation.policy.create`
- `escalation.policy.manage`
- `escalation.analytics`

**Use Case:** Senior support or management personnel who handle escalations

### 9. System Monitor (`system_monitor`)
**Description:** System monitor with read-only access to system metrics

**Permissions:**
- `system.monitoring.read`
- `system.health.read`
- `system.logs.read`
- `notification.analytics`
- `alert.analytics`
- `communication.analytics`
- `escalation.analytics`

**Use Case:** Operations team members who monitor system health and metrics

### 10. Notification Administrator (`notification_administrator`)
**Description:** Full notification system administrator

**Permissions:** All notification, alert, communication, announcement, escalation, and system permissions

**Use Case:** System administrators with full control over the notification system

## 🔗 Enhanced Existing Roles

### Admin Role
**Added Permissions:**
- `notification.manage`
- `alert.manage`
- `communication.manage`
- `announcement.manage`
- `escalation.manage`
- `system.notification.admin`
- `system.alert.admin`
- `system.communication.admin`
- `system.escalation.admin`

### IT Manager Role
**Added Permissions:**
- `notification.create`, `notification.read`, `notification.manage`
- `alert.read`, `alert.acknowledge`, `alert.resolve`, `alert.escalate`
- `communication.manage`
- `announcement.create`, `announcement.manage`
- `escalation.read`, `escalation.manage`

### Security Officer Role
**Added Permissions:**
- `notification.read`, `notification.create`
- `alert.read`, `alert.acknowledge`, `alert.resolve`, `alert.escalate`, `alert.manage`
- `communication.read`, `communication.send`
- `escalation.read`, `escalation.create`

### Compliance Officer Role
**Added Permissions:**
- `notification.read`, `notification.analytics`
- `alert.read`, `alert.analytics`
- `communication.read`, `communication.analytics`
- `announcement.read`, `announcement.analytics`
- `escalation.read`, `escalation.analytics`

### Employee Role
**Added Permissions:**
- `notification.read`, `notification.acknowledge`, `notification.preferences.manage`
- `communication.read`, `communication.send`, `communication.message.send`
- `announcement.read`, `announcement.comment`

## 🔄 Permission Dependencies

The system implements permission dependencies to ensure logical permission hierarchies:

| Permission | Depends On |
|------------|------------|
| `notification.manage` | `notification.read` |
| `notification.delete` | `notification.update` |
| `notification.update` | `notification.read` |
| `alert.manage` | `alert.read` |
| `alert.resolve` | `alert.acknowledge` |
| `alert.escalate` | `alert.read` |
| `communication.manage` | `communication.read` |
| `communication.channel.manage` | `communication.channel.create` |
| `announcement.manage` | `announcement.read` |
| `escalation.manage` | `escalation.read` |

## 🛠️ Database Functions

### Permission Checking Functions

#### `user_has_permission(user_id, permission_name)`
Checks if a user has a specific permission.

```sql
SELECT user_has_permission(123, 'notification.create');
```

#### `get_user_permissions(user_id)`
Returns all permissions for a user.

```sql
SELECT * FROM get_user_permissions(123);
```

#### `get_user_roles_with_permissions(user_id)`
Returns user roles with their associated permissions.

```sql
SELECT * FROM get_user_roles_with_permissions(123);
```

## 📊 Summary Views

### Role Permission Summary
```sql
SELECT * FROM role_permission_summary;
```

### User Permission Summary
```sql
SELECT * FROM user_permission_summary;
```

## 🔍 Audit and Monitoring

### Permission Audit Log
All permission-related changes are logged in the `permission_audit_log` table:

- User actions
- Permission changes
- Role assignments
- System configuration changes

### Monitoring Queries

#### Check User Permissions
```sql
-- Get all permissions for a user
SELECT permission_name, description, category 
FROM get_user_permissions(123);

-- Check specific permission
SELECT user_has_permission(123, 'alert.manage');
```

#### Role Analysis
```sql
-- Get role permission counts
SELECT role_name, permission_count, categories 
FROM role_permission_summary 
ORDER BY permission_count DESC;

-- Get users by role
SELECT u.username, r.role_name 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id 
WHERE r.role_name = 'alert_manager';
```

## 🚀 Implementation in Code

### API Endpoint Protection

```javascript
// Example: Protecting notification endpoints
router.post('/', requirePermission('notification.create'), async (req, res) => {
  // Create notification logic
});

router.get('/analytics', requirePermission('notification.analytics'), async (req, res) => {
  // Analytics logic
});

// Example: Protecting alert endpoints
router.patch('/:id/acknowledge', requirePermission('alert.acknowledge'), async (req, res) => {
  // Acknowledge alert logic
});

router.post('/bulk-action', requirePermission('alert.manage'), async (req, res) => {
  // Bulk action logic
});
```

### Middleware Usage

```javascript
const { requirePermission } = require('../middleware/permissions');

// Single permission
router.get('/alerts', requirePermission('alert.read'), alertController.getAlerts);

// Multiple permissions (OR logic)
router.post('/escalate', requirePermission(['alert.escalate', 'escalation.create']), alertController.escalate);
```

## 📋 Role Assignment Guidelines

### Recommended Role Assignments

1. **Regular Employees**
   - `Employee` (base role)
   - `notification_user`
   - `communication_user`

2. **Team Leads/Supervisors**
   - `Employee` (base role)
   - `notification_manager`
   - `communication_manager`

3. **IT Operations**
   - `alert_operator`
   - `escalation_specialist`
   - `system_monitor`

4. **IT Management**
   - `IT Manager` (enhanced role)
   - `alert_manager`
   - `notification_administrator`

5. **Security Team**
   - `Security Officer` (enhanced role)
   - `alert_manager`
   - `escalation_specialist`

6. **Communications Team**
   - `communication_manager`
   - `announcement_editor`
   - `notification_manager`

## 🔧 Configuration and Deployment

### Database Setup
1. Run the permissions schema: `db-permissions-notifications.sql`
2. Verify permissions: Check the completion message
3. Assign roles to users as needed

### API Configuration
Ensure all new endpoints have appropriate permission checks:

```javascript
// notifications.js
router.post('/', requirePermission('notification.create'), ...);
router.get('/analytics', requirePermission('notification.analytics'), ...);

// alerts.js
router.post('/bulk-action', requirePermission('alert.manage'), ...);
router.get('/analytics/trends', requirePermission('alert.analytics'), ...);

// announcements.js
router.post('/', requirePermission('announcement.create'), ...);
router.delete('/:id', requirePermission('announcement.delete'), ...);
```

## 🎯 Best Practices

### Permission Design
1. **Principle of Least Privilege**: Grant minimum permissions needed
2. **Role-Based Access**: Use roles rather than direct permission assignments
3. **Regular Audits**: Review permissions and roles regularly
4. **Clear Naming**: Use descriptive permission names
5. **Logical Grouping**: Group related permissions by category

### Security Considerations
1. **Permission Validation**: Always validate permissions on the server side
2. **Audit Logging**: Log all permission-related actions
3. **Regular Reviews**: Conduct periodic permission reviews
4. **Separation of Duties**: Ensure appropriate separation of critical functions
5. **Emergency Access**: Maintain emergency access procedures

### Monitoring and Maintenance
1. **Usage Analytics**: Monitor permission usage patterns
2. **Performance Impact**: Monitor permission checking performance
3. **Regular Cleanup**: Remove unused permissions and roles
4. **Documentation Updates**: Keep permission documentation current
5. **Training**: Ensure administrators understand the permission model

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Next Review:** 2025-02-27