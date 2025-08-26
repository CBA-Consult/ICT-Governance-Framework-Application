# Enterprise System Connectors

## Overview

The ICT Governance Framework includes comprehensive enterprise system connectors that enable seamless integration with various enterprise systems and databases. These connectors provide standardized interfaces for data exchange, monitoring, and governance across the organization's technology ecosystem.

## Supported Enterprise Systems

### Core Business Systems

#### 1. SAP S/4HANA ERP (`sap-erp`)
- **Purpose**: Enterprise Resource Planning system integration
- **Capabilities**: Financial data, master data, user management, business processes
- **Integration Type**: OData REST API
- **Authentication**: Basic Authentication with CSRF token
- **Rate Limit**: 60 requests/minute

**Available Operations:**
- `getUsers(params)` - Retrieve user data from SAP
- `getFinancialData(params)` - Extract financial information
- `getMasterData(params)` - Access master data entities
- `healthCheck()` - System health verification

#### 2. Salesforce CRM (`salesforce`)
- **Purpose**: Customer Relationship Management platform
- **Capabilities**: Customer data, sales automation, marketing automation
- **Integration Type**: REST API v58.0
- **Authentication**: OAuth 2.0 Client Credentials
- **Rate Limit**: 100 requests/minute

**Available Operations:**
- `getAccounts(params)` - Retrieve account records
- `getOpportunities(params)` - Access sales opportunities
- `getContacts(params)` - Get contact information
- `createRecord(sobject, data)` - Create new records
- `healthCheck()` - Connection health check

#### 3. Workday HCM (`workday`)
- **Purpose**: Human Capital Management system
- **Capabilities**: Employee data, organizational data, workforce analytics
- **Integration Type**: Custom Report Web Services
- **Authentication**: Basic Authentication
- **Rate Limit**: 60 requests/minute

**Available Operations:**
- `getWorkers(params)` - Retrieve employee information
- `getOrganizations(params)` - Access organizational structure
- `getJobProfiles(params)` - Get job profile data
- `healthCheck()` - System availability check

### Security and Monitoring Systems

#### 4. Microsoft Defender for Cloud Apps (`defender-cloud-apps`)
- **Purpose**: Cloud application security monitoring and governance
- **Capabilities**: App discovery, security alerts, policy enforcement
- **Integration Type**: Microsoft Graph API
- **Authentication**: OAuth 2.0 with Azure AD
- **Rate Limit**: 30 requests/minute

**Available Operations:**
- `getDiscoveredApps(params)` - Retrieve discovered cloud applications
- `getAlerts(params)` - Access security alerts
- `getActivities(params)` - Monitor user activities
- `getPolicies(params)` - Manage security policies
- `healthCheck()` - Service health verification

#### 5. Microsoft Sentinel (`sentinel`)
- **Purpose**: Security Information and Event Management platform
- **Capabilities**: Security monitoring, threat detection, incident response
- **Integration Type**: Azure Management REST API
- **Authentication**: Azure AD Service Principal
- **Rate Limit**: 100 requests/minute

**Available Operations:**
- `getIncidents(params)` - Retrieve security incidents
- `getAlerts(params)` - Access alert rules
- `createIncident(data)` - Create new security incidents
- `healthCheck()` - Workspace connectivity check

### Identity and Access Management

#### 6. Azure Active Directory (`azure-ad`)
- **Purpose**: Enterprise identity and access management
- **Capabilities**: User management, group management, authentication
- **Integration Type**: Microsoft Graph API
- **Authentication**: OAuth 2.0 with Azure AD
- **Rate Limit**: 600 requests/minute

**Available Operations:**
- `getUsers(params)` - Retrieve user accounts
- `getGroups(params)` - Access group information
- `healthCheck()` - Directory service health

### IT Service Management

#### 7. ServiceNow ITSM (`servicenow`)
- **Purpose**: IT Service Management and workflow automation
- **Capabilities**: Incident management, change management, CMDB integration
- **Integration Type**: ServiceNow REST API
- **Authentication**: Basic Authentication
- **Rate Limit**: 120 requests/minute

**Available Operations:**
- `getIncidents(params)` - Retrieve incident records
- `createIncident(data)` - Create new incidents
- `updateIncident(sysId, data)` - Update existing incidents
- `getChangeRequests(params)` - Access change requests
- `createChangeRequest(data)` - Create change requests
- `getCMDBItems(params)` - Query CMDB items
- `updateCMDBItem(sysId, data)` - Update CMDB records
- `getServiceCatalogItems(params)` - Access service catalog
- `healthCheck()` - Instance connectivity check

### Data and Analytics Systems

#### 8. Azure Synapse Analytics (`synapse`)
- **Purpose**: Enterprise data warehouse and analytics platform
- **Capabilities**: Data integration, big data analytics, machine learning
- **Integration Type**: Azure Synapse REST API
- **Authentication**: Azure AD Service Principal
- **Rate Limit**: 100 requests/minute

**Available Operations:**
- `getPipelines(params)` - Retrieve data pipelines
- `getDatasets(params)` - Access dataset information
- `getSqlPools(params)` - Get SQL pool details
- `healthCheck()` - Workspace health verification

#### 9. Microsoft Power BI (`power-bi`)
- **Purpose**: Business intelligence and data visualization platform
- **Capabilities**: Report generation, dashboard creation, embedded analytics
- **Integration Type**: Power BI REST API
- **Authentication**: Azure AD Service Principal
- **Rate Limit**: 200 requests/minute

**Available Operations:**
- `getReports(params)` - Retrieve report metadata
- `getDatasets(params)` - Access dataset information
- `healthCheck()` - Service connectivity check

#### 10. Oracle Database (`oracle`)
- **Purpose**: Oracle database system integration
- **Capabilities**: Data extraction, query execution, performance monitoring
- **Integration Type**: Direct database connection
- **Authentication**: Database credentials
- **Rate Limit**: 200 requests/minute

**Available Operations:**
- `executeQuery(sql, params)` - Execute SQL queries
- `getTableData(tableName, params)` - Retrieve table data
- `getSystemMetrics()` - Access database metrics
- `healthCheck()` - Database connectivity check

### Cloud Platforms

#### 11. Amazon Web Services (`aws`)
- **Purpose**: AWS cloud platform integration
- **Capabilities**: Resource discovery, policy management, cost management
- **Integration Type**: AWS SDK/REST API
- **Authentication**: IAM Access Keys
- **Rate Limit**: 100 requests/minute

**Available Operations:**
- `getResources(params)` - Discover AWS resources
- `getPolicies(params)` - Access IAM policies
- `healthCheck()` - AWS connectivity check

#### 12. Google Cloud Platform (`gcp`)
- **Purpose**: GCP cloud platform integration
- **Capabilities**: Resource discovery, policy management, cost management
- **Integration Type**: Google Cloud APIs
- **Authentication**: Service Account Keys
- **Rate Limit**: 100 requests/minute

**Available Operations:**
- `getResources(params)` - Discover GCP resources
- `getPolicies(params)` - Access IAM policies
- `healthCheck()` - GCP connectivity check

### Legacy Systems

#### 13. Legacy Systems (`legacy-systems`)
- **Purpose**: Legacy system integration via file transfer and custom protocols
- **Capabilities**: File transfer, data extraction, batch processing
- **Integration Type**: SFTP, File-based, Custom protocols
- **Authentication**: Various (SFTP, Custom)
- **Rate Limit**: 30 requests/minute

**Available Operations:**
- `processFileTransfer(params)` - Handle file transfers
- `getMainframeData(params)` - Extract mainframe data
- `healthCheck()` - Legacy system connectivity

## Configuration

### Environment Variables

The enterprise connectors require the following environment variables to be configured:

```bash
# Azure Active Directory
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_SUBSCRIPTION_ID=your-subscription-id

# ServiceNow
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password

# SAP S/4HANA
SAP_BASE_URL=https://your-sap-server:8000
SAP_USERNAME=your-sap-username
SAP_PASSWORD=your-sap-password
SAP_SYSTEM_ID=your-system-id

# Salesforce
SALESFORCE_CLIENT_ID=your-salesforce-client-id
SALESFORCE_CLIENT_SECRET=your-salesforce-client-secret
SALESFORCE_LOGIN_URL=https://login.salesforce.com

# Workday
WORKDAY_BASE_URL=https://your-tenant.workday.com
WORKDAY_USERNAME=your-workday-username
WORKDAY_PASSWORD=your-workday-password
WORKDAY_TENANT=your-tenant-name

# Azure Synapse
SYNAPSE_WORKSPACE_NAME=your-synapse-workspace

# Microsoft Sentinel
SENTINEL_RESOURCE_GROUP=your-resource-group
SENTINEL_WORKSPACE_NAME=your-sentinel-workspace

# Power BI
POWERBI_CLIENT_ID=your-powerbi-client-id
POWERBI_CLIENT_SECRET=your-powerbi-client-secret

# Oracle Database
ORACLE_HOST=your-oracle-host
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=your-service-name
ORACLE_USERNAME=your-oracle-username
ORACLE_PASSWORD=your-oracle-password

# AWS
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=your-aws-region

# GCP
GCP_PROJECT_ID=your-gcp-project-id
GCP_KEY_FILE=path-to-service-account-key.json

# Legacy Systems
LEGACY_SFTP_HOST=your-sftp-host
LEGACY_SFTP_USERNAME=your-sftp-username
LEGACY_SFTP_PASSWORD=your-sftp-password
```

## Usage Examples

### Basic Integration Usage

```javascript
const { EnterpriseIntegration } = require('./api/framework/enterprise-integration');

// Initialize the integration framework
const integration = new EnterpriseIntegration({
  timeout: 30000,
  retryAttempts: 3,
  enableMetrics: true,
  enableCaching: true
});

// Execute integration with ServiceNow
try {
  const incidents = await integration.executeIntegration(
    'servicenow',
    'getIncidents',
    { 
      limit: 50,
      query: 'state=1^priority=1' 
    },
    { 
      useCache: true,
      cacheTTL: 300 
    }
  );
  console.log('Retrieved incidents:', incidents);
} catch (error) {
  console.error('Integration failed:', error.message);
}

// Create incident in ServiceNow
try {
  const newIncident = await integration.executeIntegration(
    'servicenow',
    'createIncident',
    {
      title: 'Governance Policy Violation',
      description: 'Unauthorized application detected',
      priority: '2',
      category: 'ICT Governance',
      callerId: 'governance-system'
    }
  );
  console.log('Created incident:', newIncident);
} catch (error) {
  console.error('Failed to create incident:', error.message);
}
```

### Health Monitoring

```javascript
// Check health of all adapters
const healthStatus = await integration.getAdapterHealth();
console.log('Adapter Health Status:', healthStatus);

// Get integration metrics
const metrics = integration.getMetrics();
console.log('Integration Metrics:', metrics);
```

### Error Handling and Circuit Breaker

The framework includes built-in error handling and circuit breaker patterns:

- **Retry Logic**: Automatic retry with exponential backoff
- **Circuit Breaker**: Prevents cascading failures
- **Rate Limiting**: Respects API rate limits
- **Caching**: Reduces API calls and improves performance
- **Metrics**: Comprehensive monitoring and reporting

## Security Considerations

### Authentication and Authorization
- All connectors use secure authentication methods (OAuth 2.0, API keys, certificates)
- Credentials are stored as environment variables
- Token rotation and refresh are handled automatically

### Data Protection
- All communications use TLS encryption
- Sensitive data is masked in logs
- Audit trails are maintained for all operations

### Access Control
- Role-based access control for connector operations
- Principle of least privilege for service accounts
- Regular credential rotation and monitoring

## Monitoring and Alerting

### Health Checks
- Automated health checks for all connectors
- Real-time status monitoring
- Alerting on connector failures

### Performance Metrics
- Response time monitoring
- Success/failure rates
- Rate limit utilization
- Cache hit rates

### Logging and Auditing
- Comprehensive operation logging
- Security event auditing
- Compliance reporting

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify environment variables are set correctly
   - Check token expiration and refresh
   - Validate service account permissions

2. **Rate Limit Exceeded**
   - Review rate limit configuration
   - Implement request queuing
   - Use caching to reduce API calls

3. **Network Connectivity**
   - Verify network connectivity to target systems
   - Check firewall rules and proxy settings
   - Validate DNS resolution

4. **Data Format Issues**
   - Verify API version compatibility
   - Check data schema changes
   - Validate request/response formats

### Debugging

Enable debug logging by setting the log level:

```javascript
const integration = new EnterpriseIntegration({
  logLevel: 'debug'
});
```

## Future Enhancements

### Planned Connectors
- Microsoft Teams integration
- SharePoint Online connector
- Jira/Confluence integration
- Additional cloud platforms (Azure DevOps, GitHub)

### Feature Roadmap
- GraphQL API support
- Webhook integration
- Real-time streaming capabilities
- Advanced analytics and ML integration
- Enhanced security features

## Support and Maintenance

### Documentation Updates
- Regular updates to reflect API changes
- New connector documentation
- Best practices and examples

### Version Management
- Semantic versioning for connectors
- Backward compatibility maintenance
- Migration guides for major updates

For additional support or questions, please refer to the project documentation or contact the ICT Governance team.