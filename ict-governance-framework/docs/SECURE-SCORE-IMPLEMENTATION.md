# Microsoft Secure Score Implementation Guide

## Overview

This document provides comprehensive guidance for implementing and utilizing Microsoft Secure Score recommendations within the ICT Governance Framework. The implementation leverages the Microsoft Graph API to provide real-time security posture monitoring, actionable recommendations, and compliance tracking.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Integration](#api-integration)
3. [Dashboard Components](#dashboard-components)
4. [Database Schema](#database-schema)
5. [Configuration](#configuration)
6. [Usage Guide](#usage-guide)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

### Components

The Secure Score implementation consists of several key components:

- **API Layer**: `ict-governance-framework/api/secure-scores.js`
- **Dashboard Components**: `ict-governance-framework/app/components/dashboards/SecureScoreDashboard.js`
- **Page Component**: `ict-governance-framework/app/secure-score/page.js`
- **Database Schema**: Extended `db-schema.sql` with secure score tables
- **Configuration**: Updated enterprise connectors and environment settings

### Data Flow

```
Microsoft Graph API → Secure Score API → Database → Dashboard Components → User Interface
```

1. **Data Collection**: Automated sync with Microsoft Graph API
2. **Data Processing**: Transform and store secure score data
3. **Analysis**: Generate recommendations and trends
4. **Visualization**: Display insights through interactive dashboards
5. **Alerting**: Notify stakeholders of significant changes

## API Integration

### Microsoft Graph API Endpoints

The implementation integrates with the following Microsoft Graph API endpoints:

- **Secure Scores**: `/v1.0/security/secureScores`
- **Control Profiles**: `/v1.0/security/secureScoreControlProfiles`

### Authentication

Uses Azure AD application credentials with the following required permissions:

- `SecurityEvents.Read.All`
- `SecurityActions.Read.All`
- `Directory.Read.All`

### API Routes

#### GET `/api/secure-scores`
Retrieve current secure scores with optional parameters:
- `timeRange`: Number of days for historical data (default: 30)
- `includeHistory`: Include historical trend data (default: false)
- `includeControlScores`: Include control profile data (default: false)

#### GET `/api/secure-scores/dashboard`
Get comprehensive dashboard data including:
- Current score overview
- Historical trends
- Control categories analysis
- Top recommendations
- Risk areas identification
- Compliance impact assessment

#### POST `/api/secure-scores/sync`
Manually trigger synchronization with Microsoft Graph API

#### GET `/api/secure-scores/recommendations`
Get filtered recommendations with parameters:
- `priority`: Filter by priority level (critical, high, medium, low)
- `category`: Filter by control category

## Dashboard Components

### SecureScoreDashboard

Main dashboard component providing:

- **Overview Cards**: Current score, percentage, risk areas, recommendations count
- **Score Gauge**: Visual representation of current score vs. maximum
- **Trend Charts**: Historical score progression
- **Control Categories**: Implementation status by category
- **Recommendations**: Top actionable recommendations
- **Risk Areas**: Areas requiring immediate attention
- **Compliance Impact**: Framework-specific compliance scores

### Features

- **Real-time Updates**: Automatic data refresh
- **Interactive Charts**: Drill-down capabilities
- **Responsive Design**: Mobile and desktop optimized
- **Dark Mode Support**: Theme-aware components
- **Export Capabilities**: Data export for reporting

## Database Schema

### Core Tables

#### `secure_scores`
Stores historical secure score data:
- `id`: Unique identifier from Microsoft Graph
- `current_score`: Current secure score value
- `max_score`: Maximum possible score
- `percentage`: Calculated percentage (auto-generated)
- `created_date_time`: Score timestamp
- `active_user_count`: Number of active users
- `enabled_services`: Count of enabled services
- `licensed_user_count`: Number of licensed users
- `raw_data`: Complete JSON response from API

#### `secure_score_control_profiles`
Stores control configuration and details:
- `id`: Control profile identifier
- `control_name`: Name of the security control
- `title`: Human-readable title
- `category`: Control category
- `implementation_cost`: Cost level (Low, Moderate, High)
- `user_impact`: Impact on users (Low, Moderate, High)
- `compliance_information`: Related compliance frameworks
- `control_state_updates`: State change history

#### `secure_score_recommendations`
Stores actionable recommendations:
- `recommendation_id`: Unique recommendation identifier
- `control_profile_id`: Related control profile
- `title`: Recommendation title
- `description`: Detailed description
- `priority`: Priority level
- `impact_score`: Calculated impact score
- `status`: Implementation status
- `assigned_to`: Responsible person/team

#### `secure_score_alerts`
Stores alerts for significant changes:
- `alert_id`: Unique alert identifier
- `alert_type`: Type of alert (score_drop, low_score, etc.)
- `severity`: Alert severity level
- `current_score`: Score when alert triggered
- `previous_score`: Previous score for comparison
- `status`: Alert status (open, acknowledged, resolved)

### Supporting Tables

- `secure_score_compliance_mapping`: Maps controls to compliance frameworks
- `secure_score_improvements`: Tracks implementation progress

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# Azure AD Configuration
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Microsoft Graph API
GRAPH_API_BASE_URL=https://graph.microsoft.com
GRAPH_API_VERSION=v1.0

# Secure Score Configuration
SECURE_SCORE_SYNC_INTERVAL=3600000
SECURE_SCORE_ALERT_THRESHOLD=5
SECURE_SCORE_LOW_SCORE_THRESHOLD=60
SECURE_SCORE_CRITICAL_THRESHOLD=40
```

### Enterprise Connectors

The `secure-score` connector is configured in `config/enterprise-connectors.json`:

```json
{
  "secure-score": {
    "name": "Microsoft Secure Score",
    "type": "security",
    "priority": "high",
    "enabled": true,
    "capabilities": [
      "secure-score-monitoring",
      "control-profiles",
      "security-recommendations",
      "compliance-mapping",
      "trend-analysis"
    ],
    "syncSettings": {
      "autoSync": true,
      "syncInterval": 3600000,
      "alertThreshold": 5
    }
  }
}
```

## Usage Guide

### Accessing the Dashboard

1. Navigate to `/secure-score` in the application
2. Select desired time range (7, 30, 90, or 365 days)
3. Use tabs to switch between different views:
   - **Dashboard**: Overview and trends
   - **Recommendations**: Detailed recommendations
   - **Controls**: Control profiles and configurations
   - **Reports**: Compliance and detailed reports

### Interpreting Metrics

#### Secure Score Percentage
- **80-100%**: Excellent security posture
- **60-79%**: Good security posture with room for improvement
- **40-59%**: Moderate security posture requiring attention
- **Below 40%**: Poor security posture requiring immediate action

#### Priority Levels
- **Critical**: Immediate action required
- **High**: Address within 30 days
- **Medium**: Address within 90 days
- **Low**: Address when resources permit

### Implementing Recommendations

1. **Review Recommendations**: Sort by impact score and priority
2. **Assess Resources**: Consider implementation cost and user impact
3. **Plan Implementation**: Create improvement tracking records
4. **Monitor Progress**: Track implementation status
5. **Measure Impact**: Monitor score improvements

### Setting Up Alerts

Alerts are automatically generated for:
- Score drops exceeding threshold (default: 5%)
- Scores below critical threshold (default: 40%)
- Scores below low threshold (default: 60%)

## Troubleshooting

### Common Issues

#### Authentication Errors
- Verify Azure AD application permissions
- Check client ID, secret, and tenant ID
- Ensure application has required Graph API permissions

#### Data Sync Issues
- Check network connectivity to Microsoft Graph API
- Verify rate limiting compliance
- Review API response errors in logs

#### Dashboard Loading Issues
- Verify database connectivity
- Check for missing environment variables
- Review browser console for JavaScript errors

### Monitoring and Logging

- API requests are logged with timestamps and response codes
- Database operations include error handling and transaction management
- Dashboard components include error boundaries and loading states

### Performance Optimization

- Implement caching for frequently accessed data
- Use pagination for large datasets
- Optimize database queries with proper indexing
- Consider implementing data archiving for historical records

## Security Considerations

### Data Protection
- Secure score data contains sensitive security information
- Implement proper access controls and permissions
- Use encryption for data at rest and in transit
- Regular security audits and compliance checks

### API Security
- Secure storage of Azure AD credentials
- Implement proper token management and refresh
- Use HTTPS for all API communications
- Monitor for unusual API usage patterns

## Compliance and Governance

### Framework Mapping
The implementation supports mapping to various compliance frameworks:
- ISO 27001
- NIST Cybersecurity Framework
- SOC 2
- GDPR
- HIPAA

### Reporting
- Executive dashboards for leadership
- Detailed technical reports for IT teams
- Compliance reports for auditors
- Trend analysis for strategic planning

## Future Enhancements

### Planned Features
- Advanced analytics and machine learning insights
- Integration with other security tools
- Automated remediation workflows
- Custom scoring models
- Enhanced reporting capabilities

### Integration Opportunities
- ServiceNow for incident management
- Power BI for advanced analytics
- Azure Sentinel for security operations
- Microsoft Defender for comprehensive security

## Support and Maintenance

### Regular Tasks
- Monitor sync operations
- Review and update recommendations
- Maintain database performance
- Update API permissions as needed

### Troubleshooting Resources
- Microsoft Graph API documentation
- Azure AD troubleshooting guides
- Application logs and monitoring
- Community forums and support channels

---

For additional support or questions, please refer to the main ICT Governance Framework documentation or contact the development team.