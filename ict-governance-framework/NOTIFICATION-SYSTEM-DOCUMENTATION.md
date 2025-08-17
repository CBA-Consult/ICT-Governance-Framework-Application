# Comprehensive Notification and Communication System Documentation

## Overview

This document describes the comprehensive notification system, alerts, communication features, and escalation mechanisms implemented for the ICT Governance Framework.

## System Architecture

### Core Components

1. **Notification System**
   - Database schema for notifications, preferences, and templates
   - REST API for notification management
   - Real-time delivery via Server-Sent Events (SSE)
   - Browser notification support

2. **Alert Management**
   - Alert rules and policies
   - Alert lifecycle management (active → acknowledged → resolved)
   - Automatic escalation based on severity and time
   - Alert dashboard and management interface

3. **Communication Features**
   - Communication channels (direct, group, broadcast)
   - Real-time messaging
   - Message reactions and threading
   - Channel membership management

4. **Escalation Mechanisms**
   - Automatic SLA breach detection
   - Multi-level escalation workflows
   - Escalation policies and rules
   - Manual escalation capabilities

## Database Schema

### Notification Tables

#### `notification_types`
Defines different types of notifications with categories and default settings.

```sql
CREATE TABLE notification_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(30) NOT NULL,
    description TEXT,
    default_priority VARCHAR(20) DEFAULT 'Medium',
    icon VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE
);
```

#### `notifications`
Main notifications table storing all notification records.

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    notification_id VARCHAR(50) UNIQUE NOT NULL,
    notification_type_id INTEGER NOT NULL,
    recipient_user_id INTEGER,
    recipient_role VARCHAR(50),
    sender_user_id INTEGER,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium',
    category VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'unread',
    delivery_channels JSONB DEFAULT '["in_app"]',
    metadata JSONB,
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(50),
    scheduled_for TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `user_notification_preferences`
User-specific notification preferences and settings.

```sql
CREATE TABLE user_notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    notification_type_id INTEGER NOT NULL,
    delivery_channels JSONB DEFAULT '["in_app"]',
    is_enabled BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC'
);
```

### Alert Tables

#### `alert_rules`
Defines rules for automatic alert generation.

```sql
CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,
    conditions JSONB NOT NULL,
    severity VARCHAR(20) DEFAULT 'Medium',
    notification_template_id INTEGER,
    escalation_policy_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    cooldown_period INTEGER DEFAULT 300
);
```

#### `alerts`
Active and historical alerts.

```sql
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(50) UNIQUE NOT NULL,
    alert_rule_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    source_system VARCHAR(50),
    source_data JSONB,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by INTEGER,
    resolved_at TIMESTAMP,
    resolved_by INTEGER,
    resolution_notes TEXT,
    escalated_at TIMESTAMP,
    escalation_level INTEGER DEFAULT 0,
    metadata JSONB
);
```

### Communication Tables

#### `communication_channels`
Communication channels for messaging.

```sql
CREATE TABLE communication_channels (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(50) UNIQUE NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    channel_type VARCHAR(30) NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP
);
```

#### `channel_messages`
Messages within communication channels.

```sql
CREATE TABLE channel_messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(50) UNIQUE NOT NULL,
    channel_id VARCHAR(50) NOT NULL,
    sender_id INTEGER NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    content TEXT NOT NULL,
    attachments JSONB,
    reply_to_message_id VARCHAR(50),
    edited_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Escalation Tables

#### `escalation_policies`
Defines escalation policies and workflows.

```sql
CREATE TABLE escalation_policies (
    id SERIAL PRIMARY KEY,
    policy_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    policy_type VARCHAR(30) NOT NULL,
    escalation_rules JSONB NOT NULL,
    notification_template_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Notification API (`/api/notifications`)

#### GET `/api/notifications`
Retrieve user notifications with filtering and pagination.

**Query Parameters:**
- `status`: Filter by status (unread, read, archived, all)
- `category`: Filter by category
- `priority`: Filter by priority
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "notifications": [...],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### GET `/api/notifications/stats`
Get notification statistics for the current user.

**Response:**
```json
{
  "total": 150,
  "unread": 25,
  "critical_unread": 3,
  "high_unread": 8,
  "security_unread": 5,
  "escalation_unread": 2
}
```

#### PATCH `/api/notifications/:id/read`
Mark a notification as read.

#### PATCH `/api/notifications/mark-all-read`
Mark all notifications as read.

#### POST `/api/notifications`
Create a new notification (admin/system use).

**Request Body:**
```json
{
  "notification_type": "security_alert",
  "recipient_user_id": 123,
  "recipient_role": "IT Manager",
  "subject": "Security Alert",
  "message": "A security incident has been detected",
  "priority": "High",
  "category": "security",
  "metadata": {},
  "delivery_channels": ["in_app", "email"]
}
```

### Alert API (`/api/alerts`)

#### GET `/api/alerts`
Retrieve alerts with filtering and pagination.

**Query Parameters:**
- `status`: Filter by status (active, acknowledged, resolved, all)
- `severity`: Filter by severity
- `source_system`: Filter by source system
- `limit`: Number of results
- `offset`: Pagination offset

#### GET `/api/alerts/stats`
Get alert statistics.

#### GET `/api/alerts/:id`
Get detailed alert information including action history.

#### PATCH `/api/alerts/:id/acknowledge`
Acknowledge an alert.

**Request Body:**
```json
{
  "notes": "Investigating the issue"
}
```

#### PATCH `/api/alerts/:id/resolve`
Resolve an alert.

**Request Body:**
```json
{
  "resolution_notes": "Issue resolved by restarting service"
}
```

#### PATCH `/api/alerts/:id/escalate`
Escalate an alert.

**Request Body:**
```json
{
  "escalation_reason": "No response within SLA",
  "escalation_target": "System Administrator"
}
```

### Communication API (`/api/communication`)

#### GET `/api/communication/channels`
Get user's communication channels.

#### POST `/api/communication/channels`
Create a new communication channel.

#### GET `/api/communication/channels/:id/messages`
Get messages from a channel.

#### POST `/api/communication/channels/:id/messages`
Send a message to a channel.

### Real-time Notifications (`/api/realtime`)

#### GET `/api/realtime/stream`
Server-Sent Events endpoint for real-time notifications.

**Event Types:**
- `connection`: Connection established
- `heartbeat`: Keep-alive ping
- `notification`: New notification received
- `alert`: Real-time alert
- `announcement`: System announcement

#### POST `/api/realtime/broadcast`
Broadcast a notification to users/roles.

### Escalation Management (`/api/escalation-management`)

#### POST `/api/escalation-management/service/start`
Start the escalation monitoring service.

#### POST `/api/escalation-management/service/stop`
Stop the escalation monitoring service.

#### GET `/api/escalation-management/service/status`
Get escalation service status and statistics.

#### POST `/api/escalation-management/manual`
Create a manual escalation.

#### GET `/api/escalation-management/policies`
Get escalation policies.

#### POST `/api/escalation-management/policies`
Create a new escalation policy.

## Frontend Components

### NotificationCenter Component
A dropdown component in the header showing recent notifications with:
- Unread count badge
- Real-time updates
- Quick actions (mark read, archive, delete)
- Filter by category/priority
- Connection status indicator

### Notifications Page
Full-page notification management interface with:
- Advanced filtering and search
- Bulk actions
- Pagination
- Detailed notification view
- Statistics dashboard

### Alerts Page
Alert management interface featuring:
- Alert dashboard with statistics
- Alert lifecycle management
- Detailed alert views with action history
- Escalation capabilities
- Search and filtering

### Real-time Notification Hook (`useNotifications`)
React hook providing:
- Real-time notification updates via SSE
- Notification state management
- Browser notification integration
- Connection status monitoring
- CRUD operations for notifications

## Escalation Service

### Automatic Escalation Triggers

1. **Feedback SLA Breaches**
   - Critical: 15 minutes
   - High: 1 hour
   - Medium: 4 hours
   - Low: 24 hours

2. **Alert Escalations**
   - Critical alerts not acknowledged within 5 minutes
   - High alerts not acknowledged within 15 minutes

3. **Escalation Timeouts**
   - Critical: 30 minutes between escalation levels
   - High: 2 hours between escalation levels
   - Medium: 8 hours between escalation levels

4. **Workflow Approval Timeouts**
   - Overdue approvals are escalated to supervisors

### Escalation Matrix

| Priority | Level 1 | Level 2 | Level 3 |
|----------|---------|---------|---------|
| Critical | IT Manager | System Administrator | Executive |
| High | IT Manager | System Administrator | IT Manager |
| Medium | IT Support | IT Manager | System Administrator |
| Low | IT Support | IT Manager | IT Manager |

## Configuration

### Environment Variables

```bash
# Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/ict_governance

# Server configuration
PORT=4000

# Notification settings
NOTIFICATION_CHECK_INTERVAL=60000
ESCALATION_CHECK_INTERVAL=60000
```

### Default Notification Types

The system includes these default notification types:
- `system_maintenance`: System maintenance notifications
- `security_alert`: Security-related alerts
- `compliance_violation`: Compliance violation alerts
- `workflow_approval`: Workflow approval requests
- `escalation_created`: New escalation created
- `feedback_received`: New feedback received
- `document_shared`: Document shared with you
- `policy_updated`: Policy or procedure updated
- `sla_breach`: SLA breach detected
- `user_mention`: You were mentioned

## Usage Examples

### Creating a Notification

```javascript
// Via API
const response = await fetch('/api/notifications', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notification_type: 'security_alert',
    recipient_role: 'IT Manager',
    subject: 'Security Incident Detected',
    message: 'Suspicious activity detected on server XYZ',
    priority: 'Critical',
    category: 'security',
    delivery_channels: ['in_app', 'email']
  })
});
```

### Using the Notification Hook

```javascript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const {
    notifications,
    stats,
    loading,
    connected,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  return (
    <div>
      <h2>Notifications ({stats.unread})</h2>
      {notifications.map(notification => (
        <div key={notification.notification_id}>
          <h3>{notification.subject}</h3>
          <p>{notification.message}</p>
          <button onClick={() => markAsRead(notification.notification_id)}>
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Real-time Notifications

```javascript
// The system automatically connects to SSE stream
// Browser notifications are shown for important alerts
// Connection status is monitored and displayed
```

## Security Considerations

1. **Authentication**: All API endpoints require valid JWT tokens
2. **Authorization**: Role-based permissions control access to features
3. **Data Validation**: Input validation on all API endpoints
4. **Rate Limiting**: API rate limiting to prevent abuse
5. **Secure Headers**: Security headers via Helmet middleware
6. **SQL Injection Prevention**: Parameterized queries throughout

## Performance Optimization

1. **Database Indexing**: Optimized indexes on frequently queried columns
2. **Pagination**: All list endpoints support pagination
3. **Connection Pooling**: PostgreSQL connection pooling
4. **Caching**: Browser caching for static assets
5. **Efficient Queries**: Optimized SQL queries with joins
6. **Real-time Efficiency**: SSE for efficient real-time updates

## Monitoring and Maintenance

### Health Checks
- Service status endpoints
- Database connectivity checks
- Real-time connection monitoring

### Logging
- Comprehensive error logging
- Escalation service activity logs
- API request logging

### Metrics
- Notification delivery rates
- Alert response times
- Escalation statistics
- User engagement metrics

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check user notification preferences
   - Verify notification type is active
   - Check browser notification permissions

2. **Real-time updates not working**
   - Verify SSE connection status
   - Check network connectivity
   - Review browser console for errors

3. **Escalations not triggering**
   - Check escalation service status
   - Verify SLA thresholds
   - Review escalation policies

4. **Alerts not being created**
   - Check alert rules configuration
   - Verify source system connectivity
   - Review alert rule conditions

### Debug Commands

```bash
# Check escalation service status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/escalation-management/service/status

# Trigger manual escalation check
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/escalation-management/service/check

# Get notification statistics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/notifications/stats
```

## Future Enhancements

1. **Mobile Push Notifications**: Integration with mobile push notification services
2. **SMS Notifications**: SMS delivery channel for critical alerts
3. **Webhook Integration**: Webhook delivery for external system integration
4. **Advanced Analytics**: Detailed analytics and reporting dashboard
5. **Machine Learning**: ML-based alert correlation and noise reduction
6. **Integration APIs**: APIs for third-party system integration
7. **Custom Notification Templates**: User-customizable notification templates
8. **Scheduled Notifications**: Support for scheduled/recurring notifications

## Support and Documentation

For additional support or questions about the notification system:
- Review the API documentation
- Check the troubleshooting section
- Examine the database schema
- Review the source code comments
- Contact the development team

This comprehensive notification system provides a robust foundation for communication, alerting, and escalation within the ICT Governance Framework.