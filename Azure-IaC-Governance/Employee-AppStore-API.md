# Employee App Store API Integration

This document provides implementation guidance for creating and managing an enterprise employee app store with API integration as part of your ICT governance framework, deployed using Infrastructure as Code principles.

## Purpose

The Employee App Store API enables:

1. Self-service access to approved applications for employees
2. Governance-compliant application distribution
3. Automated deployment and updates of enterprise applications
4. Integration with existing identity and access management systems
5. Comprehensive usage tracking and compliance reporting
6. Validation of applications identified by SIEM or Cloud App Security
7. Complete tracking of ALL applications used on company devices

## Architecture Overview

![Employee App Store Architecture](./media/appstore-architecture.png)

The Employee App Store consists of the following components, all deployed and managed through Infrastructure as Code:

1. **API Layer**: RESTful API for application catalog, authentication, and distribution
2. **Application Registry**: Database of approved applications and their metadata
3. **Frontend Portal**: Web and mobile interfaces for employees to browse and install apps
4. **Admin Console**: Management interface for catalog administrators
5. **Integration Services**: Connectors to MDM, MDAC, and other enterprise systems
6. **SIEM/CAS Integration**: Connectors to security monitoring tools for application discovery
7. **Employee Validation Portal**: Interface for employees to validate discovered applications

## Implementation Approach

### 1. API Infrastructure as Code

The API infrastructure is defined using Bicep/ARM templates or Terraform:

```bicep
// App Service Plan for API hosting
resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: 'app-store-api-plan'
  location: resourceGroup().location
  sku: {
    name: 'P1v2'
    tier: 'PremiumV2'
  }
  properties: {
    reserved: true
  }
}

// API App Service
resource apiAppService 'Microsoft.Web/sites@2021-02-01' = {
  name: 'employee-app-store-api'
  location: resourceGroup().location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      appSettings: [
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~14'
        }
        {
          name: 'DATABASE_CONNECTION_STRING'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/DatabaseConnectionString)'
        }
      ]
      cors: {
        allowedOrigins: [
          'https://appstore.contoso.com',
          'https://appstore-admin.contoso.com'
        ]
      }
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Application Insights for monitoring
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'employee-app-store-insights'
  location: resourceGroup().location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

// Key Vault for secrets
resource keyVault 'Microsoft.KeyVault/vaults@2021-06-01-preview' = {
  name: 'app-store-keyvault'
  location: resourceGroup().location
  properties: {
    enableRbacAuthorization: true
    tenantId: subscription().tenantId
    sku: {
      name: 'standard'
      family: 'A'
    }
  }
}
```

### 2. API Endpoints and Documentation

The API should provide the following core endpoints, documented using OpenAPI/Swagger:

```yaml
openapi: 3.0.0
info:
  title: Employee App Store API
  version: 1.0.0
  description: API for the enterprise employee app store
paths:
  /api/apps:
    get:
      summary: List available applications
      parameters:
        - name: category
          in: query
          schema:
            type: string
        - name: platform
          in: query
          schema:
            type: string
  /api/apps/{id}:
    get:
      summary: Get application details
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
  /api/apps/{id}/install:
    post:
      summary: Install application
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
  /api/apps/{id}/uninstall:
    post:
      summary: Uninstall application
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
  /api/users/me/apps:
    get:
      summary: Get user's installed applications
  
  # SIEM/CAS Integration Endpoints
  /api/discovered-apps:
    post:
      summary: Submit discovered applications from SIEM/CAS
      description: Endpoint for SIEM or Cloud App Security to submit newly discovered applications
    get:
      summary: List discovered applications
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [Pending, Approved, Rejected]
        - name: source
          in: query
          schema:
            type: string
  
  # Employee Validation Endpoints
  /api/validation-requests:
    get:
      summary: List validation requests for the current user
    post:
      summary: Submit a validation request for a discovered application
  
  /api/validation-requests/{id}:
    put:
      summary: Update validation request status
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  enum: [Approved, Rejected]
                justification:
                  type: string
  
  # Analytics and Reporting
  /api/reports/application-usage:
    get:
      summary: Get application usage statistics
  
  /api/reports/compliance:
    get:
      summary: Get application compliance status
```

### 3. Database Schema and Migrations

Implement the application registry database with the following schema, using Infrastructure as Code:

```sql
-- Application table
CREATE TABLE Applications (
    AppId UNIQUEIDENTIFIER PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    Category NVARCHAR(50),
    Publisher NVARCHAR(100),
    CurrentVersion NVARCHAR(50),
    Platform NVARCHAR(50),
    InstallCommand NVARCHAR(MAX),
    UninstallCommand NVARCHAR(MAX),
    IconUrl NVARCHAR(255),
    IsEnabled BIT DEFAULT 1,
    RequiresApproval BIT DEFAULT 0,
    DiscoverySource NVARCHAR(50), -- Added for SIEM/CAS tracking
    RiskLevel NVARCHAR(20), -- Added for security assessment
    DataClassification NVARCHAR(50), -- Added for compliance
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    LastModifiedDate DATETIME2
);

-- Application versions
CREATE TABLE ApplicationVersions (
    VersionId UNIQUEIDENTIFIER PRIMARY KEY,
    AppId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Applications(AppId),
    VersionNumber NVARCHAR(50) NOT NULL,
    ReleaseDate DATETIME2,
    ReleaseNotes NVARCHAR(MAX),
    DownloadUrl NVARCHAR(255),
    FileHash NVARCHAR(255),
    FileSize BIGINT,
    IsEnabled BIT DEFAULT 1
);

-- User installations
CREATE TABLE UserInstallations (
    InstallationId UNIQUEIDENTIFIER PRIMARY KEY,
    UserId NVARCHAR(100) NOT NULL,
    AppId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Applications(AppId),
    VersionId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES ApplicationVersions(VersionId),
    InstallDate DATETIME2 DEFAULT GETUTCDATE(),
    DeviceId NVARCHAR(100),
    Status NVARCHAR(50)
);

-- SIEM/CAS Discovered Applications
CREATE TABLE DiscoveredApplications (
    DiscoveryId UNIQUEIDENTIFIER PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Publisher NVARCHAR(100),
    Version NVARCHAR(50),
    ExecutablePath NVARCHAR(MAX),
    FileHash NVARCHAR(255),
    DiscoverySource NVARCHAR(50) NOT NULL, -- 'SIEM', 'CAS', etc.
    DiscoveryDate DATETIME2 DEFAULT GETUTCDATE(),
    UserId NVARCHAR(100),
    DeviceId NVARCHAR(100),
    ValidatedByUser BIT DEFAULT 0,
    ValidationDate DATETIME2,
    ValidationStatus NVARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    CatalogAppId UNIQUEIDENTIFIER NULL FOREIGN KEY REFERENCES Applications(AppId)
);

-- Employee Validation Requests
CREATE TABLE ValidationRequests (
    RequestId UNIQUEIDENTIFIER PRIMARY KEY,
    DiscoveryId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES DiscoveredApplications(DiscoveryId),
    RequestDate DATETIME2 DEFAULT GETUTCDATE(),
    ResponseDate DATETIME2,
    Status NVARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    BusinessJustification NVARCHAR(MAX),
    ApprovedById NVARCHAR(100),
    Comments NVARCHAR(MAX)
);
```

### 4. API Integration with Defender Application Control

Integrate the Employee App Store API with Microsoft Defender Application Control:

```csharp
// Sample code for MDAC integration
public async Task<ActionResult> InstallApplication(Guid appId)
{
    // 1. Get current user
    var user = await _userService.GetCurrentUserAsync();
    
    // 2. Get application details
    var application = await _appRepository.GetApplicationByIdAsync(appId);
    if (application == null)
        return NotFound();
    
    // 3. Check user entitlement
    if (!await _entitlementService.IsUserEntitledToAppAsync(user.Id, appId))
        return Forbid();
    
    // 4. Register installation in AppCatalog
    var installation = new UserInstallation
    {
        InstallationId = Guid.NewGuid(),
        UserId = user.Id,
        AppId = appId,
        VersionId = application.CurrentVersionId,
        DeviceId = Request.Headers["DeviceId"],
        Status = "Pending"
    };
    await _installationRepository.CreateAsync(installation);
    
    // 5. Notify MDAC of new approved application for this device
    await _mdacService.RegisterApprovedApplicationAsync(
        deviceId: installation.DeviceId,
        applicationDetails: new MdacApplicationDetails
        {
            Name = application.Name,
            Publisher = application.Publisher,
            Version = application.CurrentVersion,
            FileHash = application.CurrentVersionFileHash,
            ExecutablePath = application.InstallPath
        });
    
    // 6. Trigger installation (MDM, direct, or user-guided)
    var installResult = await _deploymentService.TriggerInstallationAsync(installation);
    
    return Ok(new { 
        InstallationId = installation.InstallationId,
        Status = installResult.Status,
        NextSteps = installResult.UserInstructions
    });
}
```

### 5. Employee Validation for Discovered Applications

Implement a service for employee validation of applications discovered by SIEM or Cloud App Security:

```csharp
public class ValidationService : IValidationService
{
    private readonly IValidationRepository _validationRepository;
    private readonly IDiscoveredAppRepository _discoveredAppRepository;
    private readonly INotificationService _notificationService;
    private readonly ILogger<ValidationService> _logger;

    public ValidationService(
        IValidationRepository validationRepository,
        IDiscoveredAppRepository discoveredAppRepository,
        INotificationService notificationService,
        ILogger<ValidationService> logger)
    {
        _validationRepository = validationRepository;
        _discoveredAppRepository = discoveredAppRepository;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Guid> CreateValidationRequestAsync(Guid discoveryId, string userId, string comments)
    {
        // Check if discovery exists
        var discovery = await _discoveredAppRepository.GetByIdAsync(discoveryId);
        if (discovery == null)
        {
            throw new KeyNotFoundException($"Discovery {discoveryId} not found");
        }

        // Create validation request
        var requestId = Guid.NewGuid();
        var request = new ValidationRequest
        {
            RequestId = requestId,
            DiscoveryId = discoveryId,
            RequestDate = DateTime.UtcNow,
            Status = "Pending",
            BusinessJustification = comments
        };

        await _validationRepository.CreateAsync(request);

        // Send notification to user
        await _notificationService.SendValidationRequestNotificationAsync(
            userId,
            new ValidationRequestNotification
            {
                RequestId = requestId,
                ApplicationName = discovery.Name,
                Publisher = discovery.Publisher,
                DiscoverySource = discovery.DiscoverySource,
                DiscoveryDate = discovery.DiscoveryDate
            });

        _logger.LogInformation("Created validation request {RequestId} for discovery {DiscoveryId}", 
            requestId, discoveryId);

        return requestId;
    }

    public async Task<ValidationResponse> ProcessValidationResponseAsync(Guid requestId, ValidationDecision decision)
    {
        // Get the validation request
        var request = await _validationRepository.GetByIdAsync(requestId);
        if (request == null)
        {
            throw new KeyNotFoundException($"Validation request {requestId} not found");
        }

        // Update request status
        request.Status = decision.Approved ? "Approved" : "Rejected";
        request.ResponseDate = DateTime.UtcNow;
        request.BusinessJustification = decision.Justification;

        await _validationRepository.UpdateAsync(request);

        // Update the discovered application
        var discovery = await _discoveredAppRepository.GetByIdAsync(request.DiscoveryId);
        discovery.ValidationStatus = request.Status;
        discovery.ValidationDate = request.ResponseDate;
        discovery.ValidatedByUser = true;

        await _discoveredAppRepository.UpdateAsync(discovery);

        // If approved, check if application should be added to catalog
        if (decision.Approved && decision.AddToCatalog)
        {
            await AddToCatalogAsync(discovery, decision.CategoryId);
        }

        _logger.LogInformation("Processed validation request {RequestId} with decision {Decision}", 
            requestId, request.Status);

        return new ValidationResponse
        {
            RequestId = requestId,
            Status = request.Status,
            Next = decision.Approved ? 
                (decision.AddToCatalog ? "Application will be added to catalog" : "Application is approved for your use") : 
                "Application has been rejected"
        };
    }

    private async Task<Guid?> AddToCatalogAsync(DiscoveredApplication discovery, Guid? categoryId)
    {
        // Logic to add discovered application to catalog
        // This would typically involve:
        // 1. Creating a new catalog entry
        // 2. Possibly triggering an approval workflow for catalog administrators
        // 3. Setting up appropriate metadata and categorization

        return await Task.FromResult<Guid?>(null); // Placeholder
    }
}

// Employee validation controller
[ApiController]
[Route("api/validation")]
[Authorize] // Requires authenticated user
public class ValidationController : ControllerBase
{
    private readonly IValidationService _validationService;
    private readonly IValidationRepository _validationRepository;
    private readonly ILogger<ValidationController> _logger;

    public ValidationController(
        IValidationService validationService,
        IValidationRepository validationRepository,
        ILogger<ValidationController> logger)
    {
        _validationService = validationService;
        _validationRepository = validationRepository;
        _logger = logger;
    }

    [HttpGet("requests")]
    public async Task<ActionResult<IEnumerable<ValidationRequestDto>>> GetUserValidationRequests()
    {
        var userId = User.Identity.Name;
        var requests = await _validationRepository.GetRequestsForUserAsync(userId);
        return Ok(requests);
    }

    [HttpPost("requests/{requestId}/respond")]
    public async Task<ActionResult<ValidationResponse>> RespondToValidationRequest(
        Guid requestId, ValidationDecisionDto decision)
    {
        try
        {
            var response = await _validationService.ProcessValidationResponseAsync(
                requestId,
                new ValidationDecision
                {
                    Approved = decision.Approved,
                    Justification = decision.Justification,
                    AddToCatalog = decision.AddToCatalog,
                    CategoryId = decision.CategoryId
                });

            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Validation request not found");
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing validation response");
            return StatusCode(500, new { Message = "An error occurred while processing your validation response" });
        }
    }
}
```

### 5. Authentication and Authorization

Use Azure AD for authentication and implement RBAC for authorization:

```json
{
  "authentication": {
    "schemes": [
      {
        "name": "AzureAD",
        "type": "OAuth2",
        "flow": {
          "authorizationUrl": "https://login.microsoftonline.com/{{tenantId}}/oauth2/v2.0/authorize",
          "tokenUrl": "https://login.microsoftonline.com/{{tenantId}}/oauth2/v2.0/token",
          "scopes": ["User.Read", "AppCatalog.Read", "AppCatalog.Install"]
        }
      }
    ]
  },
  "authorization": {
    "roles": [
      {
        "name": "AppStore.User",
        "permissions": ["apps:read", "apps:install", "user-apps:read", "validation:respond"]
      },
      {
        "name": "AppStore.Admin",
        "permissions": ["apps:read", "apps:write", "apps:publish", "apps:unpublish", "users:read", "reports:read", "validation:manage"]
      },
      {
        "name": "AppStore.SecurityAdmin",
        "permissions": ["apps:read", "security:read", "security:write", "validation:approve", "reports:read"]
      }
    ]
  }
}
```

### 6. Employee Validation User Interface

Implement a React-based user interface for employee validation of discovered applications:

```typescript
// Employee Validation Dashboard Component
import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, notification } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { fetchValidationRequests, respondToValidationRequest } from '../api/validationApi';
import { fetchApplicationCategories } from '../api/catalogApi';

const ValidationDashboard: React.FC = () => {
  const [requests, setRequests] = useState<ValidationRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [responseModalVisible, setResponseModalVisible] = useState<boolean>(false);
  const [currentRequest, setCurrentRequest] = useState<ValidationRequest | null>(null);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<ApplicationCategory[]>([]);

  useEffect(() => {
    loadRequests();
    loadCategories();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchValidationRequests();
      setRequests(data);
    } catch (error) {
      notification.error({
        message: 'Error loading validation requests',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchApplicationCategories();
      setCategories(data);
    } catch (error) {
      notification.error({
        message: 'Error loading application categories',
        description: error.message
      });
    }
  };

  const handleRespond = (request: ValidationRequest) => {
    setCurrentRequest(request);
    setResponseModalVisible(true);
    form.resetFields();
  };

  const handleSubmitResponse = async (values: any) => {
    if (!currentRequest) return;
    
    try {
      await respondToValidationRequest(currentRequest.requestId, {
        approved: values.decision === 'approve',
        justification: values.justification,
        addToCatalog: values.addToCatalog,
        categoryId: values.categoryId
      });
      
      notification.success({
        message: 'Response submitted',
        description: 'Your response has been recorded successfully'
      });
      
      setResponseModalVisible(false);
      loadRequests();
    } catch (error) {
      notification.error({
        message: 'Error submitting response',
        description: error.message
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <QuestionCircleOutlined style={{ color: '#1890ff' }} />;
      case 'Approved':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'Rejected':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      default:
        return null;
    }
  };

  return (
    <div className="validation-dashboard">
      <Card 
        title="Application Validation Requests" 
        extra={<Button onClick={loadRequests} loading={loading}>Refresh</Button>}
      >
        <Table
          dataSource={requests}
          rowKey="requestId"
          loading={loading}
          columns={[
            {
              title: 'Application',
              dataIndex: 'applicationName',
              key: 'applicationName',
            },
            {
              title: 'Publisher',
              dataIndex: 'publisher',
              key: 'publisher',
            },
            {
              title: 'Discovery Source',
              dataIndex: 'discoverySource',
              key: 'discoverySource',
            },
            {
              title: 'Discovery Date',
              dataIndex: 'discoveryDate',
              key: 'discoveryDate',
              render: (date) => new Date(date).toLocaleString(),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status) => (
                <span>
                  {getStatusIcon(status)} {status}
                </span>
              ),
            },
            {
              title: 'Action',
              key: 'action',
              render: (_, record) => (
                record.status === 'Pending' && (
                  <Button type="primary" onClick={() => handleRespond(record)}>
                    Respond
                  </Button>
                )
              ),
            },
          ]}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ margin: 0 }}>
                <p><strong>Path:</strong> {record.executablePath}</p>
                <p><strong>Version:</strong> {record.version}</p>
                {record.businessJustification && (
                  <p><strong>Justification:</strong> {record.businessJustification}</p>
                )}
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title="Respond to Validation Request"
        visible={responseModalVisible}
        onCancel={() => setResponseModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitResponse}>
          <Form.Item
            name="decision"
            label="Your Decision"
            rules={[{ required: true, message: 'Please select a decision' }]}
          >
            <Select>
              <Select.Option value="approve">Approve this application</Select.Option>
              <Select.Option value="reject">Reject this application</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="justification"
            label="Justification"
            rules={[{ required: true, message: 'Please provide a justification' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="addToCatalog"
            valuePropName="checked"
            dependencies={['decision']}
          >
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => 
                getFieldValue('decision') === 'approve' && (
                  <div>
                    <Form.Item name="addToCatalog" valuePropName="checked">
                      <Checkbox>Add this application to the company catalog</Checkbox>
                    </Form.Item>

                    <Form.Item
                      name="categoryId"
                      label="Application Category"
                      dependencies={['addToCatalog']}
                    >
                      {({ getFieldValue }) => 
                        getFieldValue('addToCatalog') && (
                          <Select>
                            {categories.map(category => (
                              <Select.Option key={category.id} value={category.id}>
                                {category.name}
                              </Select.Option>
                            ))}
                          </Select>
                        )
                      }
                    </Form.Item>
                  </div>
                )
              }
            </Form.Item>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit Response
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ValidationDashboard;
```

## CI/CD Integration

Implement CI/CD pipelines for API deployment:

```yaml
# API Deployment Pipeline
trigger:
  branches:
    include:
    - main
  paths:
    include:
    - infrastructure/appstore/**
    - src/api/**

stages:
- stage: Build
  jobs:
  - job: BuildAPI
    steps:
    - task: DotNetCoreCLI@2
      inputs:
        command: 'build'
        projects: 'src/api/EmployeeAppStore.Api.csproj'
    
    - task: DotNetCoreCLI@2
      inputs:
        command: 'test'
        projects: 'tests/api/EmployeeAppStore.Api.Tests.csproj'
    
    - task: DotNetCoreCLI@2
      inputs:
        command: 'publish'
        publishWebProjects: true
        arguments: '--configuration Release --output $(Build.ArtifactStagingDirectory)'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathtoPublish: '$(Build.ArtifactStagingDirectory)'
        artifactName: 'api'

- stage: DeployInfrastructure
  jobs:
  - job: DeployApiInfrastructure
    steps:
    - task: AzureResourceManagerTemplateDeployment@3
      inputs:
        deploymentScope: 'Resource Group'
        azureResourceManagerConnection: '$(azureServiceConnection)'
        subscriptionId: '$(subscriptionId)'
        action: 'Create Or Update Resource Group'
        resourceGroupName: '$(resourceGroupName)'
        location: '$(location)'
        templateLocation: 'Linked artifact'
        csmFile: 'infrastructure/appstore/api.bicep'
        overrideParameters: '-environment $(environment)'
        deploymentMode: 'Incremental'

- stage: DeployAPI
  dependsOn: DeployInfrastructure
  jobs:
  - job: DeployApiApp
    steps:
    - task: AzureRmWebAppDeployment@4
      inputs:
        ConnectionType: 'AzureRM'
        azureSubscription: '$(azureServiceConnection)'
        appType: 'webApp'
        WebAppName: 'employee-app-store-api-$(environment)'
        packageForLinux: '$(Pipeline.Workspace)/api/*.zip'
```

## Repository Structure

Organize the App Store code in your repository as follows:

```
/infrastructure/
  ├── /appstore/
  │   ├── api.bicep                # API infrastructure
  │   ├── database.bicep           # Database infrastructure
  │   ├── frontend.bicep           # Frontend infrastructure
  │   ├── keyvault.bicep           # Key Vault configuration
  │   └── monitoring.bicep         # Monitoring resources
  
/src/
  ├── /api/
  │   ├── Controllers/             # API controllers
  │   ├── Services/                # Business logic
  │   ├── Models/                  # Data models
  │   └── Integrations/            # External system integrations
  ├── /admin-portal/               # Admin interface
  ├── /employee-portal/            # Employee interface
  └── /shared/                     # Shared components

/database/
  ├── schema.sql                   # Database schema
  ├── migrations/                  # Schema migrations
  └── seed-data/                   # Initial catalog data

/docs/
  ├── api-specification.yaml       # OpenAPI specification
  ├── integration-guide.md         # Integration documentation
  └── admin-guide.md               # Administration guide
```

## Security Considerations

1. **Data Protection**:
   - Store application binaries in Azure Blob Storage with appropriate access controls
   - Implement encryption for application data at rest and in transit
   - Use Azure Key Vault for storing sensitive configuration

2. **Authentication and Authorization**:
   - Implement Azure AD authentication for all API endpoints
   - Use OAuth 2.0 and OpenID Connect for frontend authentication
   - Implement role-based access control for administrative functions

3. **API Security**:
   - Implement rate limiting to prevent abuse
   - Use Azure API Management for additional security controls
   - Implement proper input validation and output encoding

4. **Compliance**:
   - Log all access to application catalog and installation activities
   - Implement audit trails for administrative actions
   - Ensure GDPR compliance for user data

## Integration with Mobile Application

Your existing mobile application for governance compliance can be integrated with the Employee App Store API:

1. **App Discovery**: Mobile app can display available applications from the catalog
2. **Compliance Status**: Show compliance status of installed applications
3. **Self-Service**: Allow users to install approved applications
4. **Notifications**: Alert users about required updates or non-compliant applications

## Integration with SIEM and Cloud App Security

Add SIEM and Cloud App Security integration to automatically discover and catalog applications:

```csharp
// SIEM Integration Controller
[ApiController]
[Route("api/discovered-apps")]
[Authorize(Roles = "SecurityAdmin,AppStoreAdmin")]
public class DiscoveredAppsController : ControllerBase
{
    private readonly IDiscoveredAppRepository _repository;
    private readonly IValidationService _validationService;
    private readonly ILogger<DiscoveredAppsController> _logger;

    public DiscoveredAppsController(
        IDiscoveredAppRepository repository,
        IValidationService validationService,
        ILogger<DiscoveredAppsController> logger)
    {
        _repository = repository;
        _validationService = validationService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult> SubmitDiscoveredApps(DiscoveredAppsRequest request)
    {
        try
        {
            _logger.LogInformation("Received {Count} discovered applications from {Source}", 
                request.Applications.Count, request.Source);

            foreach (var app in request.Applications)
            {
                // Check if app already exists in discovered apps
                var existingApp = await _repository.GetByHashAsync(app.FileHash);
                if (existingApp != null)
                {
                    _logger.LogInformation("Application {Name} already exists in catalog", app.Name);
                    continue;
                }

                // Add to discovered apps
                var discoveredApp = new DiscoveredApplication
                {
                    DiscoveryId = Guid.NewGuid(),
                    Name = app.Name,
                    Publisher = app.Publisher,
                    Version = app.Version,
                    ExecutablePath = app.ExecutablePath,
                    FileHash = app.FileHash,
                    DiscoverySource = request.Source,
                    UserId = app.UserId,
                    DeviceId = app.DeviceId,
                    ValidationStatus = "Pending"
                };
                
                await _repository.AddAsync(discoveredApp);

                // Auto-trigger validation process
                if (!string.IsNullOrEmpty(app.UserId))
                {
                    await _validationService.CreateValidationRequestAsync(
                        discoveredApp.DiscoveryId, 
                        app.UserId,
                        "Automatic request from discovery process");
                }
            }

            return Ok(new { 
                Status = "Success", 
                Message = $"Processed {request.Applications.Count} applications" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing discovered applications");
            return StatusCode(500, new { Status = "Error", Message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DiscoveredAppDto>>> GetDiscoveredApps(
        [FromQuery] string status = null,
        [FromQuery] string source = null)
    {
        var apps = await _repository.ListAsync(status, source);
        return Ok(apps);
    }
}
```

### Cloud App Security Integration

Deploy an Azure Logic App to integrate with Microsoft Defender for Cloud Apps:

```bicep
resource cloudAppSecurityLogicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: 'cloud-app-security-integration'
  location: resourceGroup().location
  properties: {
    definition: {
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#',
      triggers: {
        schedule: {
          type: 'Recurrence',
          recurrence: {
            frequency: 'Hour',
            interval: 6
          }
        }
      },
      actions: {
        'Get_Cloud_App_Security_Data': {
          type: 'Http',
          inputs: {
            method: 'GET',
            uri: '@parameters(\'CloudAppSecurityApiEndpoint\')/api/v1/discovered_apps',
            headers: {
              'Authorization': 'Token @parameters(\'CloudAppSecurityApiToken\')'
            }
          }
        },
        'For_Each_Application': {
          type: 'Foreach',
          foreach: '@body(\'Get_Cloud_App_Security_Data\').discovered_apps',
          actions: {
            'Submit_to_App_Catalog': {
              type: 'Http',
              inputs: {
                method: 'POST',
                uri: '@parameters(\'AppStoreApiEndpoint\')/api/discovered-apps',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer @parameters(\'AppStoreApiToken\')'
                },
                body: {
                  source: 'CloudAppSecurity',
                  applications: [
                    {
                      name: '@items(\'For_Each_Application\').name',
                      publisher: '@items(\'For_Each_Application\').publisher',
                      version: '@items(\'For_Each_Application\').version',
                      fileHash: '@items(\'For_Each_Application\').file_hash',
                      userId: '@items(\'For_Each_Application\').user_id',
                      deviceId: '@items(\'For_Each_Application\').device_id'
                    }
                  ]
                }
              }
            }
          }
        }
      },
      parameters: {
        'CloudAppSecurityApiEndpoint': {
          type: 'string',
          defaultValue: 'https://[tenant].us.portal.cloudappsecurity.com'
        },
        'CloudAppSecurityApiToken': {
          type: 'securestring'
        },
        'AppStoreApiEndpoint': {
          type: 'string'
        },
        'AppStoreApiToken': {
          type: 'securestring'
        }
      }
    }
  }
}
```

## Metrics and Reporting

Track the following metrics to measure App Store effectiveness:

| Metric | Description | Target | Reporting Frequency |
|--------|-------------|--------|---------------------|
| Catalog Usage | Number of application installations through the app store | Increasing trend | Monthly |
| Compliance Rate | Percentage of application installations that are compliant | >95% | Weekly |
| Request Fulfillment Time | Time from application request to availability | <5 business days | Monthly |
| User Satisfaction | Feedback score from app store users | >4.0/5.0 | Quarterly |

## Implementation Roadmap

### Phase 1: Foundation (1-3 months)

#### Month 1: Infrastructure and Core API
- **Week 1**: Set up infrastructure using Bicep/ARM templates
  - Deploy Azure SQL Database with geo-replication
  - Provision API App Service with staging slots
  - Create Key Vault for secrets management
  - Deploy Azure Function for background processing
  - Set up Application Insights monitoring
  
- **Week 2**: Implement core database schema
  - Create application tables and schema
  - Set up user installation tracking
  - Implement discovered applications schema
  - Configure database backup and retention policies
  - Set up database auditing and security

- **Week 3**: Develop basic API endpoints
  - Implement application catalog CRUD operations
  - Create user authentication and authorization
  - Set up application installation tracking
  - Implement basic reporting endpoints
  - Create API documentation with Swagger/OpenAPI

- **Week 4**: Create admin interface
  - Develop basic admin portal for catalog management
  - Implement application approval workflows
  - Create catalog administrator dashboard
  - Set up basic analytics reporting
  - Implement audit logging for administrative actions

#### Month 2: Security Integration and CI/CD
- **Week 1**: Set up Azure AD integration
  - Implement OAuth 2.0 and OpenID Connect
  - Configure role-based access control
  - Set up user group synchronization
  - Implement claims-based authorization
  - Configure conditional access policies

- **Week 2**: Deploy security controls
  - Implement API rate limiting and throttling
  - Set up IP restrictions and network security
  - Configure WAF policies
  - Implement input validation and sanitization
  - Deploy secure headers and CORS policies

- **Week 3**: Create CI/CD pipelines
  - Set up infrastructure deployment pipeline
  - Implement API build and test pipeline
  - Create database migration pipeline
  - Configure automated testing
  - Implement staged rollout strategy

- **Week 4**: Implement basic monitoring
  - Set up application health monitoring
  - Configure alerting for critical events
  - Implement logging and diagnostics
  - Create operational dashboards
  - Deploy usage analytics tracking

#### Month 3: Initial Deployment and Testing
- **Week 1-2**: Conduct performance testing
  - Perform load testing of API endpoints
  - Optimize database queries
  - Test scaling capabilities
  - Measure response times and throughput
  - Identify and resolve bottlenecks

- **Week 3-4**: Deploy to pilot user group
  - Onboard initial set of applications
  - Train catalog administrators
  - Collect feedback from pilot users
  - Refine user interface based on feedback
  - Document lessons learned

### Phase 2: Integration (3-6 months)

#### Month 1: Microsoft Defender Integration
- **Week 1**: Implement MDAC integration
  - Create MDAC application registration service
  - Build policy synchronization mechanism
  - Set up application hash validation
  - Implement signing certificate validation
  - Create MDAC exception handling

- **Week 2**: Develop security controls
  - Implement application risk assessment
  - Create vulnerability scanning integration
  - Set up malware detection for uploaded applications
  - Implement trust level classification
  - Create security review workflow

- **Week 3-4**: Build compliance reporting
  - Create compliance dashboards
  - Implement detailed audit logging
  - Develop executive-level reporting
  - Set up automated compliance alerts
  - Create historical compliance tracking

#### Month 2: Employee Portal and Distribution
- **Week 1-2**: Develop employee portal frontend
  - Create React/Angular-based frontend
  - Implement responsive design for mobile access
  - Build intuitive application browsing experience
  - Create personalized recommendations
  - Implement search and filtering capabilities

- **Week 3-4**: Implement distribution mechanisms
  - Create direct download capabilities
  - Implement integration with MDM for mobile deployment
  - Set up Windows deployment service integration
  - Build macOS deployment capabilities
  - Implement deployment status tracking

#### Month 3: SIEM and Cloud App Security Integration
- **Week 1**: Implement data connectors
  - Create Azure Logic App for Cloud App Security integration
  - Develop SIEM data ingestion service
  - Set up Sentinel connector for application discovery
  - Implement real-time data processing
  - Create application metadata enrichment

- **Week 2**: Build discovery workflows
  - Implement application discovery processing
  - Create automated cataloging for discovered apps
  - Develop risk assessment for discovered applications
  - Build notification system for new discoveries
  - Implement dashboards for discovery monitoring

- **Week 3-4**: Employee validation system
  - Create validation request workflow
  - Implement employee notification system
  - Build validation dashboard for employees
  - Create business justification collection
  - Implement approval routing based on risk score

### Phase 3: Advanced Features (6-9 months)

#### Month 1-2: Automated Application Packaging
- Deploy packaging automation service
  - Create containerization for application distribution
  - Implement automatic update packaging
  - Build application dependency management
  - Develop configuration management integration
  - Implement automated testing of packaged applications

#### Month 3-4: Advanced Analytics and Reporting
- Create comprehensive analytics platform
  - Implement application usage tracking
  - Build user adoption metrics
  - Create cost optimization analytics
  - Develop compliance trend analysis
  - Build predictive analytics for application needs

#### Month 5-6: MDM Integration and Mobile Support
- Complete MDM integration
  - Develop Intune integration for application deployment
  - Create mobile application management policies
  - Implement conditional access for applications
  - Build mobile application containment policies
  - Create cross-platform deployment capabilities

#### Month 7-9: Self-Service Workflows and Optimization
- Implement advanced self-service capabilities
  - Create application request workflow with automated approval
  - Build license management and optimization
  - Implement user feedback collection system
  - Develop advanced search with semantic capabilities
  - Create recommendation engine based on user behavior
  - Optimize performance and scalability for enterprise use

### Phase 4: Continuous Improvement (Ongoing)

#### Quarterly Activities
- Review and enhance security controls
- Optimize database performance
- Conduct user experience testing and improvements
- Update compliance reporting based on new requirements
- Implement new integration points with enterprise systems

#### Monthly Activities
- Review and update application catalog
- Process application approval requests
- Generate and distribute compliance reports
- Conduct system health checks and optimization
- Review and respond to user feedback

## Comprehensive Application Tracking

To ensure complete tracking of ALL applications used on company devices, implement the following components:

### 1. Device Management Integration

```csharp
// Device Application Inventory Service
public class DeviceApplicationInventoryService : IDeviceApplicationInventoryService
{
    private readonly ILogger<DeviceApplicationInventoryService> _logger;
    private readonly IApplicationInventoryRepository _repository;
    private readonly IDeviceRepository _deviceRepository;
    private readonly IDiscoveredAppRepository _discoveredAppRepository;

    public DeviceApplicationInventoryService(
        ILogger<DeviceApplicationInventoryService> logger,
        IApplicationInventoryRepository repository,
        IDeviceRepository deviceRepository,
        IDiscoveredAppRepository discoveredAppRepository)
    {
        _logger = logger;
        _repository = repository;
        _deviceRepository = deviceRepository;
        _discoveredAppRepository = discoveredAppRepository;
    }

    public async Task ProcessDeviceInventoryAsync(DeviceInventoryReport report)
    {
        try
        {
            _logger.LogInformation("Processing inventory for device {DeviceId} with {Count} applications", 
                report.DeviceId, report.Applications.Count);

            // Validate device exists
            var device = await _deviceRepository.GetByIdAsync(report.DeviceId);
            if (device == null)
            {
                _logger.LogWarning("Unknown device {DeviceId} submitted inventory", report.DeviceId);
                device = new Device
                {
                    DeviceId = report.DeviceId,
                    DeviceName = report.DeviceName,
                    PlatformType = report.PlatformType,
                    OsVersion = report.OsVersion,
                    LastSeen = DateTime.UtcNow,
                    Status = "Active"
                };
                await _deviceRepository.AddAsync(device);
            }
            else
            {
                // Update device information
                device.LastSeen = DateTime.UtcNow;
                device.OsVersion = report.OsVersion;
                device.DeviceName = report.DeviceName;
                await _deviceRepository.UpdateAsync(device);
            }

            // Get existing inventory for this device
            var existingApps = await _repository.GetByDeviceIdAsync(report.DeviceId);
            var existingAppIds = existingApps.Select(a => a.ApplicationId).ToHashSet();
            
            // Process each application in the report
            foreach (var app in report.Applications)
            {
                var appId = app.ApplicationId ?? Guid.NewGuid();
                
                if (!existingAppIds.Contains(appId))
                {
                    // New application for this device
                    var inventoryItem = new ApplicationInventoryItem
                    {
                        InventoryId = Guid.NewGuid(),
                        DeviceId = report.DeviceId,
                        ApplicationId = appId,
                        ApplicationName = app.Name,
                        Publisher = app.Publisher,
                        Version = app.Version,
                        InstallDate = app.InstallDate ?? DateTime.UtcNow,
                        InstallPath = app.InstallPath,
                        FileHash = app.FileHash,
                        FileSize = app.FileSize,
                        LastUsed = app.LastUsed,
                        IsApproved = false, // Default to not approved
                        Source = "DeviceInventory",
                        ScanDate = DateTime.UtcNow
                    };
                    
                    await _repository.AddAsync(inventoryItem);
                    
                    // Check if this is an unknown application
                    var knownApp = await _discoveredAppRepository.GetByHashAsync(app.FileHash);
                    if (knownApp == null)
                    {
                        // Add to discovered applications for review
                        var discoveredApp = new DiscoveredApplication
                        {
                            DiscoveryId = Guid.NewGuid(),
                            Name = app.Name,
                            Publisher = app.Publisher,
                            Version = app.Version,
                            ExecutablePath = app.InstallPath,
                            FileHash = app.FileHash,
                            DiscoverySource = "DeviceInventory",
                            DiscoveryDate = DateTime.UtcNow,
                            DeviceId = report.DeviceId,
                            UserId = report.PrimaryUserId,
                            ValidationStatus = "Pending"
                        };
                        
                        await _discoveredAppRepository.AddAsync(discoveredApp);
                        
                        _logger.LogInformation("Added new discovered application {Name} from device {DeviceId}", 
                            app.Name, report.DeviceId);
                    }
                }
                else
                {
                    // Update existing inventory item
                    var existingItem = existingApps.First(a => a.ApplicationId == appId);
                    existingItem.Version = app.Version;
                    existingItem.LastUsed = app.LastUsed > existingItem.LastUsed ? app.LastUsed : existingItem.LastUsed;
                    existingItem.ScanDate = DateTime.UtcNow;
                    
                    await _repository.UpdateAsync(existingItem);
                    existingAppIds.Remove(appId);
                }
            }
            
            // Mark applications no longer on device as uninstalled
            foreach (var removedAppId in existingAppIds)
            {
                var removedApp = existingApps.First(a => a.ApplicationId == removedAppId);
                removedApp.UninstallDate = DateTime.UtcNow;
                removedApp.Status = "Uninstalled";
                
                await _repository.UpdateAsync(removedApp);
                
                _logger.LogInformation("Application {Name} ({Id}) was uninstalled from device {DeviceId}", 
                    removedApp.ApplicationName, removedAppId, report.DeviceId);
            }
            
            _logger.LogInformation("Successfully processed inventory for device {DeviceId}", report.DeviceId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing device inventory for {DeviceId}", report.DeviceId);
            throw;
        }
    }
}
```

### 2. Comprehensive Reporting

Extend the API with comprehensive application reporting endpoints:

```csharp
[ApiController]
[Route("api/reports")]
[Authorize(Roles = "AppStore.Admin,AppStore.SecurityAdmin")]
public class ApplicationReportingController : ControllerBase
{
    private readonly IApplicationInventoryRepository _inventoryRepository;
    private readonly IDiscoveredAppRepository _discoveredAppRepository;
    private readonly IApplicationRepository _applicationRepository;
    private readonly ILogger<ApplicationReportingController> _logger;

    public ApplicationReportingController(
        IApplicationInventoryRepository inventoryRepository,
        IDiscoveredAppRepository discoveredAppRepository,
        IApplicationRepository applicationRepository,
        ILogger<ApplicationReportingController> logger)
    {
        _inventoryRepository = inventoryRepository;
        _discoveredAppRepository = discoveredAppRepository;
        _applicationRepository = applicationRepository;
        _logger = logger;
    }

    [HttpGet("application-usage")]
    public async Task<ActionResult<ApplicationUsageReport>> GetApplicationUsageReport(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var effectiveStartDate = startDate ?? DateTime.UtcNow.AddMonths(-1);
            var effectiveEndDate = endDate ?? DateTime.UtcNow;

            var installedApps = await _inventoryRepository.GetActiveInstallationsAsync(
                effectiveStartDate, effectiveEndDate);
            
            var approvedApps = await _applicationRepository.GetAllAsync();
            var approvedAppIds = approvedApps.Select(a => a.AppId).ToHashSet();

            var report = new ApplicationUsageReport
            {
                StartDate = effectiveStartDate,
                EndDate = effectiveEndDate,
                TotalApplications = installedApps.Select(a => a.ApplicationId).Distinct().Count(),
                ApprovedApplications = installedApps
                    .Count(a => approvedAppIds.Contains(a.ApplicationId)),
                UnapprovedApplications = installedApps
                    .Count(a => !approvedAppIds.Contains(a.ApplicationId)),
                TotalInstallations = installedApps.Count,
                TopApplications = installedApps
                    .GroupBy(a => a.ApplicationName)
                    .Select(g => new TopApplication
                    {
                        Name = g.Key,
                        InstallCount = g.Count(),
                        IsApproved = approvedAppIds.Contains(g.First().ApplicationId)
                    })
                    .OrderByDescending(a => a.InstallCount)
                    .Take(10)
                    .ToList()
            };

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating application usage report");
            return StatusCode(500, new { Message = "An error occurred while generating the report" });
        }
    }

    [HttpGet("compliance")]
    public async Task<ActionResult<ComplianceReport>> GetComplianceReport(
        [FromQuery] string departmentId = null)
    {
        try
        {
            var activeDevices = await _inventoryRepository.GetActiveDevicesAsync();
            
            var deviceCompliance = new List<DeviceComplianceStatus>();
            
            foreach (var device in activeDevices)
            {
                if (departmentId != null && device.DepartmentId != departmentId)
                    continue;
                
                var apps = await _inventoryRepository.GetByDeviceIdAsync(device.DeviceId);
                var totalApps = apps.Count;
                var approvedApps = apps.Count(a => a.IsApproved);
                
                deviceCompliance.Add(new DeviceComplianceStatus
                {
                    DeviceId = device.DeviceId,
                    DeviceName = device.DeviceName,
                    PlatformType = device.PlatformType,
                    UserId = device.PrimaryUserId,
                    UserName = device.PrimaryUserName,
                    DepartmentId = device.DepartmentId,
                    DepartmentName = device.DepartmentName,
                    TotalApplications = totalApps,
                    ApprovedApplications = approvedApps,
                    CompliancePercentage = totalApps > 0 ? (approvedApps * 100.0 / totalApps) : 100.0,
                    LastScanDate = device.LastSeen
                });
            }
            
            var report = new ComplianceReport
            {
                GeneratedDate = DateTime.UtcNow,
                TotalDevices = deviceCompliance.Count,
                FullyCompliantDevices = deviceCompliance.Count(d => d.CompliancePercentage == 100),
                PartiallyCompliantDevices = deviceCompliance.Count(d => d.CompliancePercentage >= 80 && d.CompliancePercentage < 100),
                NonCompliantDevices = deviceCompliance.Count(d => d.CompliancePercentage < 80),
                OverallCompliancePercentage = deviceCompliance.Any() 
                    ? deviceCompliance.Average(d => d.CompliancePercentage) 
                    : 0,
                DeviceCompliance = deviceCompliance
            };
            
            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating compliance report");
            return StatusCode(500, new { Message = "An error occurred while generating the report" });
        }
    }
}
```

---

This implementation guidance aligns with the ICT Governance Framework's principles while providing specific guidance for implementing an Employee App Store API with comprehensive application tracking and employee validation capabilities, all managed through Infrastructure as Code.

## Summary of Key Features

1. **Employee App Store API** - Core API for application catalog, authentication, and distribution
2. **SIEM and Cloud App Security Integration** - Automatic discovery and cataloging of applications
3. **Employee Validation Workflow** - Self-service validation for discovered applications
4. **Comprehensive Application Tracking** - Complete inventory of ALL applications on company devices
5. **Security Integration** - Seamless integration with Microsoft Defender Application Control
6. **Compliance Reporting** - Detailed metrics on application usage and compliance status

This implementation provides a governance-compliant approach to managing the entire application lifecycle, from discovery through validation, approval, deployment, and monitoring.
