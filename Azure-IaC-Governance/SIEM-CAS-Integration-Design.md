# SIEM and Cloud App Security Integration Design

This technical design document outlines the architecture, components, and implementation details for integrating Security Information and Event Management (SIEM) and Microsoft Defender for Cloud Apps with the Employee App Store and Defender AppCatalog.

## Overview

The integration of SIEM and Cloud App Security provides automated discovery, risk assessment, and validation of applications used within the organization. This integration is critical for ensuring complete visibility of all applications used on company devices and enforcing governance policies.

## Architecture

![SIEM and Cloud App Security Integration Architecture](./media/siem-cas-integration.png)

The integration architecture consists of the following components:

### 1. Data Sources
- **Microsoft Sentinel** - SIEM platform collecting security events
- **Microsoft Defender for Cloud Apps** - Cloud Access Security Broker
- **Microsoft Defender for Endpoint** - Endpoint security solution
- **Azure Activity Logs** - Azure platform activity monitoring
- **Device Management Solutions** - Intune and other MDM platforms

### 2. Integration Services
- **Azure Logic Apps** - Workflow automation for data processing
- **Azure Functions** - Serverless compute for custom integration logic
- **Event Grid** - Event routing between services
- **Service Bus** - Reliable message delivery for critical operations

### 3. Processing Components
- **Application Discovery Service** - Processes and normalizes discovered applications
- **Risk Assessment Engine** - Evaluates application security posture
- **Validation Workflow Service** - Manages employee validation requests
- **Compliance Reporting Service** - Generates compliance metrics and reports

### 4. Storage Components
- **Application Registry Database** - Stores approved application metadata
- **Discovered Applications Database** - Tracks applications found by security tools
- **Validation Request Database** - Manages validation workflow data
- **Analytics Data Store** - Stores historical data for trend analysis

## Detailed Component Design

### 1. Application Discovery Service

The Application Discovery Service processes application data from multiple security sources, normalizes it, and identifies unique applications.

#### Key Components:
- **Discovery Collector** - Collects raw application data
- **Metadata Enrichment** - Enhances application data with additional context
- **Deduplication Engine** - Identifies and merges duplicate applications
- **Classification Service** - Categorizes applications by type and function

#### Implementation:

```csharp
public class ApplicationDiscoveryService : IApplicationDiscoveryService
{
    private readonly IDiscoveredAppRepository _discoveryRepository;
    private readonly IAppCatalogRepository _catalogRepository;
    private readonly IMetadataEnrichmentService _enrichmentService;
    private readonly IClassificationService _classificationService;
    private readonly ILogger<ApplicationDiscoveryService> _logger;

    public ApplicationDiscoveryService(
        IDiscoveredAppRepository discoveryRepository,
        IAppCatalogRepository catalogRepository,
        IMetadataEnrichmentService enrichmentService,
        IClassificationService classificationService,
        ILogger<ApplicationDiscoveryService> logger)
    {
        _discoveryRepository = discoveryRepository;
        _catalogRepository = catalogRepository;
        _enrichmentService = enrichmentService;
        _classificationService = classificationService;
        _logger = logger;
    }

    public async Task<DiscoveryResult> ProcessDiscoveredApplicationsAsync(
        IEnumerable<DiscoveredAppData> discoveredApps, 
        string source)
    {
        var result = new DiscoveryResult
        {
            Source = source,
            TotalProcessed = discoveredApps.Count(),
            NewDiscoveries = 0,
            AlreadyKnown = 0,
            EnrichmentPerformed = 0,
            FailedProcessing = 0
        };

        foreach (var appData in discoveredApps)
        {
            try
            {
                // Check if already in catalog by hash or identity
                var existingApp = await _catalogRepository.FindByIdentifiersAsync(
                    appData.FileHash, 
                    appData.Name, 
                    appData.Publisher);

                if (existingApp != null)
                {
                    result.AlreadyKnown++;
                    continue;
                }

                // Check if already discovered
                var existingDiscovery = await _discoveryRepository.FindByIdentifiersAsync(
                    appData.FileHash,
                    appData.Name,
                    appData.Publisher);

                if (existingDiscovery != null)
                {
                    // Update existing discovery with new data
                    existingDiscovery.LastSeenDate = DateTime.UtcNow;
                    existingDiscovery.DiscoveryCount++;
                    existingDiscovery.DiscoveredOnDevices.Add(appData.DeviceId);
                    existingDiscovery.DiscoveredByUsers.Add(appData.UserId);
                    
                    await _discoveryRepository.UpdateAsync(existingDiscovery);
                    result.AlreadyKnown++;
                    continue;
                }

                // Process new discovery
                var enrichedData = await _enrichmentService.EnrichApplicationDataAsync(appData);
                result.EnrichmentPerformed++;

                var classification = await _classificationService.ClassifyApplicationAsync(enrichedData);

                var discoveryRecord = new DiscoveredApplication
                {
                    DiscoveryId = Guid.NewGuid(),
                    Name = enrichedData.Name,
                    Publisher = enrichedData.Publisher,
                    Version = enrichedData.Version,
                    FileHash = enrichedData.FileHash,
                    FilePath = enrichedData.FilePath,
                    FileSize = enrichedData.FileSize,
                    SignatureStatus = enrichedData.SignatureStatus,
                    FirstDiscoveryDate = DateTime.UtcNow,
                    LastSeenDate = DateTime.UtcNow,
                    DiscoverySource = source,
                    DiscoveryCount = 1,
                    DiscoveredOnDevices = new List<string> { appData.DeviceId },
                    DiscoveredByUsers = new List<string> { appData.UserId },
                    Category = classification.Category,
                    RiskScore = classification.RiskScore,
                    DataClassification = classification.DataClassification,
                    ValidationStatus = "Pending"
                };

                await _discoveryRepository.AddAsync(discoveryRecord);
                result.NewDiscoveries++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing discovered application {Name}", appData.Name);
                result.FailedProcessing++;
            }
        }

        return result;
    }
}
```

### 2. Cloud App Security Integration

This component integrates with Microsoft Defender for Cloud Apps to discover and monitor cloud applications.

#### Key Features:
- **Scheduled Data Collection** - Regular polling of Cloud App Security API
- **Real-time Alerts** - Event-driven notification of new app discoveries
- **Application Risk Assessment** - Cloud app risk scoring and classification
- **Usage Analytics** - User activity and access pattern analysis

#### Implementation:

```bicep
// Azure Logic App for Cloud App Security Integration
resource cloudAppSecurityLogicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: 'cas-integration-${environmentSuffix}'
  location: location
  properties: {
    state: 'Enabled'
    definition: {
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#',
      contentVersion: '1.0.0.0',
      parameters: {
        'CloudAppSecurityEndpoint': {
          type: 'string',
          defaultValue: 'https://${tenantDomain}.portal.cloudappsecurity.com'
        },
        'ApiKey': {
          type: 'securestring',
          metadata: {
            description: 'API key for Cloud App Security'
          }
        },
        'AppStoreApiEndpoint': {
          type: 'string',
          defaultValue: 'https://api.appstore.${domainName}/api'
        }
      },
      triggers: {
        recurrence: {
          recurrence: {
            frequency: 'Hour',
            interval: 6
          },
          type: 'Recurrence'
        }
      },
      actions: {
        'Get_Discovered_Apps': {
          runAfter: {},
          type: 'Http',
          inputs: {
            method: 'GET',
            uri: '@parameters(\'CloudAppSecurityEndpoint\')/api/v1/discovery/discovered_apps/',
            headers: {
              'Authorization': 'Token @{parameters(\'ApiKey\')}'
            }
          }
        },
        'For_Each_App': {
          foreach: '@body(\'Get_Discovered_Apps\').discovered_apps',
          actions: {
            'Submit_To_AppStore': {
              runAfter: {},
              type: 'Http',
              inputs: {
                method: 'POST',
                uri: '@parameters(\'AppStoreApiEndpoint\')/discovered-apps',
                headers: {
                  'Content-Type': 'application/json',
                  'x-functions-key': '@parameters(\'ApiFunctionKey\')'
                },
                body: {
                  source: 'CloudAppSecurity',
                  applications: [
                    {
                      name: '@items(\'For_Each_App\').name',
                      publisher: '@items(\'For_Each_App\').publisher',
                      category: '@items(\'For_Each_App\').category',
                      fileHash: '@items(\'For_Each_App\').file_hash',
                      userId: '@items(\'For_Each_App\').user_id',
                      deviceId: '@items(\'For_Each_App\').device_id',
                      riskScore: '@items(\'For_Each_App\').risk_score'
                    }
                  ]
                }
              }
            },
            'Log_Result': {
              runAfter: {
                'Submit_To_AppStore': [
                  'Succeeded'
                ]
              },
              type: 'AppendToArrayVariable',
              inputs: {
                name: 'ProcessedApps',
                value: {
                  name: '@items(\'For_Each_App\').name',
                  status: '@body(\'Submit_To_AppStore\').status'
                }
              }
            }
          },
          runAfter: {
            'Get_Discovered_Apps': [
              'Succeeded'
            ]
          },
          type: 'Foreach'
        },
        'Send_Summary_Email': {
          runAfter: {
            'For_Each_App': [
              'Succeeded'
            ]
          },
          type: 'ApiConnection',
          inputs: {
            body: {
              Body: 'Cloud App Security discovery process completed at @{utcNow()}.\n\nProcessed @{length(variables(\'ProcessedApps\'))} applications.\nNew discoveries: @{body(\'Count_New_Discoveries\')}\n\nSee attached report for details.',
              Subject: 'Cloud App Security Discovery - @{formatDateTime(utcNow(), \'yyyy-MM-dd\')}',
              To: securityTeamEmail
            },
            host: {
              connection: {
                name: '@parameters(\'$connections\')[\'office365\'][\'connectionId\']'
              }
            },
            method: 'post',
            path: '/v2/Mail'
          }
        }
      },
      outputs: {}
    },
    parameters: {
      '$connections': {
        value: {
          office365: {
            connectionId: office365Connection.id,
            connectionName: 'office365',
            id: '/subscriptions/${subscription().subscriptionId}/providers/Microsoft.Web/locations/${location}/managedApis/office365'
          }
        }
      }
    }
  }
}
```

### 3. SIEM Integration

This component integrates with Microsoft Sentinel to collect and process security events related to application usage and installation.

#### Key Features:
- **Custom Sentinel Analytics Rules** - Detect unauthorized application usage
- **Automated Incident Response** - Trigger workflows for security incidents
- **Application Intelligence** - Correlation of application data with threat intelligence
- **Compliance Monitoring** - Track compliance violations for reporting

#### Implementation:

```bicep
// Sentinel Analytics Rule for Application Discovery
resource sentinelAnalyticsRule 'Microsoft.SecurityInsights/alertRules@2021-09-01-preview' = {
  name: 'app-discovery-rule'
  kind: 'Scheduled'
  properties: {
    displayName: 'New Application Installation Detection'
    description: 'Detects when new applications are installed on monitored devices'
    severity: 'Informational'
    enabled: true
    query: '''
    DeviceEvents
    | where ActionType == "ApplicationInstalled" or ActionType == "SoftwareInstalled"
    | where isnotempty(FileName) and isnotempty(SHA1)
    | project TimeGenerated, DeviceName, DeviceId, ActionType, FileName, FolderPath, SHA1, InitiatingProcessAccountName
    '''
    queryFrequency: 'PT1H'
    queryPeriod: 'PT1H'
    triggerOperator: 'GreaterThan'
    triggerThreshold: 0
    suppressionDuration: 'PT1H'
    suppressionEnabled: false
    tactics: [
      'Execution'
    ]
    entityMappings: [
      {
        entityType: 'Host'
        fieldMappings: [
          {
            identifier: 'HostName'
            columnName: 'DeviceName'
          }
        ]
      },
      {
        entityType: 'Account'
        fieldMappings: [
          {
            identifier: 'Name'
            columnName: 'InitiatingProcessAccountName'
          }
        ]
      },
      {
        entityType: 'FileHash'
        fieldMappings: [
          {
            identifier: 'Algorithm'
            columnName: 'SHA1'
          },
          {
            identifier: 'Value'
            columnName: 'SHA1'
          }
        ]
      }
    ]
  }
}

// Automation Rule for Application Discovery
resource sentinelAutomationRule 'Microsoft.SecurityInsights/automationRules@2021-09-01-preview' = {
  name: 'app-discovery-automation'
  properties: {
    displayName: 'Process New Application Discoveries'
    order: 1
    triggeringLogic: {
      triggersOn: 'Incidents'
      triggersWhen: 'Created'
      conditions: [
        {
          conditionType: 'Property'
          conditionProperties: {
            propertyName: 'AlertRule'
            propertyValues: [
              sentinelAnalyticsRule.name
            ]
            operator: 'Contains'
          }
        }
      ]
    }
    actions: [
      {
        actionType: 'LogicApp'
        actionProperties: {
          logicAppResourceId: appDiscoveryLogicApp.id
          tenantId: subscription().tenantId
        }
      }
    ]
  }
}

// Logic App for Processing SIEM Discoveries
resource appDiscoveryLogicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: 'siem-app-discovery-${environmentSuffix}'
  location: location
  properties: {
    definition: {
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#',
      contentVersion: '1.0.0.0',
      parameters: {
        'AppStoreApiEndpoint': {
          type: 'string',
          defaultValue: 'https://api.appstore.${domainName}/api'
        }
      },
      triggers: {
        request: {
          type: 'Request',
          kind: 'Http',
          inputs: {
            schema: {
              type: 'object',
              properties: {
                // Sentinel incident schema
              }
            }
          }
        }
      },
      actions: {
        'Parse_Incident': {
          runAfter: {},
          type: 'ParseJson',
          inputs: {
            content: '@triggerBody()',
            schema: {
              // Incident schema definition
            }
          }
        },
        'Get_Entities': {
          runAfter: {
            'Parse_Incident': [
              'Succeeded'
            ]
          },
          type: 'Compose',
          inputs: '@body(\'Parse_Incident\').entities'
        },
        'Filter_File_Entities': {
          runAfter: {
            'Get_Entities': [
              'Succeeded'
            ]
          },
          type: 'Query',
          inputs: {
            from: '@outputs(\'Get_Entities\')',
            where: '@equals(item().type, \'filehash\')'
          }
        },
        'Get_Host_Entity': {
          runAfter: {
            'Get_Entities': [
              'Succeeded'
            ]
          },
          type: 'Query',
          inputs: {
            from: '@outputs(\'Get_Entities\')',
            where: '@equals(item().type, \'host\')'
          }
        },
        'Get_Account_Entity': {
          runAfter: {
            'Get_Entities': [
              'Succeeded'
            ]
          },
          type: 'Query',
          inputs: {
            from: '@outputs(\'Get_Entities\')',
            where: '@equals(item().type, \'account\')'
          }
        },
        'For_Each_File': {
          foreach: '@body(\'Filter_File_Entities\')',
          actions: {
            'Submit_To_AppStore': {
              runAfter: {},
              type: 'Http',
              inputs: {
                method: 'POST',
                uri: '@parameters(\'AppStoreApiEndpoint\')/discovered-apps',
                headers: {
                  'Content-Type': 'application/json',
                  'x-functions-key': '@parameters(\'ApiFunctionKey\')'
                },
                body: {
                  source: 'Sentinel',
                  applications: [
                    {
                      name: '@items(\'For_Each_File\').fileName',
                      fileHash: '@items(\'For_Each_File\').value',
                      hashAlgorithm: '@items(\'For_Each_File\').algorithm',
                      deviceId: '@first(body(\'Get_Host_Entity\')).hostName',
                      userId: '@first(body(\'Get_Account_Entity\')).name'
                    }
                  ]
                }
              }
            }
          },
          runAfter: {
            'Filter_File_Entities': [
              'Succeeded'
            ],
            'Get_Host_Entity': [
              'Succeeded'
            ],
            'Get_Account_Entity': [
              'Succeeded'
            ]
          },
          type: 'Foreach'
        }
      },
      outputs: {}
    }
  }
}
```

### 4. Validation Workflow Service

This component manages the employee validation process for applications discovered by security tools.

#### Key Features:
- **Validation Request Creation** - Generate requests for employee validation
- **Notification Delivery** - Multi-channel notifications for pending validations
- **Response Collection** - Capture and process employee responses
- **Approval Routing** - Route requests based on risk and organizational policies
- **Audit Trail** - Comprehensive logging of the validation process

#### Implementation:

```csharp
public class ValidationWorkflowService : IValidationWorkflowService
{
    private readonly IValidationRepository _validationRepository;
    private readonly IDiscoveredAppRepository _discoveredAppRepository;
    private readonly INotificationService _notificationService;
    private readonly IApprovalRoutingService _approvalRoutingService;
    private readonly ILogger<ValidationWorkflowService> _logger;

    public ValidationWorkflowService(
        IValidationRepository validationRepository,
        IDiscoveredAppRepository discoveredAppRepository,
        INotificationService notificationService,
        IApprovalRoutingService approvalRoutingService,
        ILogger<ValidationWorkflowService> logger)
    {
        _validationRepository = validationRepository;
        _discoveredAppRepository = discoveredAppRepository;
        _notificationService = notificationService;
        _approvalRoutingService = approvalRoutingService;
        _logger = logger;
    }

    public async Task<ValidationRequest> CreateValidationRequestAsync(
        Guid discoveryId,
        string requestType,
        string comments)
    {
        var discoveredApp = await _discoveredAppRepository.GetByIdAsync(discoveryId);
        if (discoveredApp == null)
        {
            throw new KeyNotFoundException($"Discovered application with ID {discoveryId} not found");
        }

        // Determine if this app requires additional approvals based on risk
        var approvalRoute = await _approvalRoutingService.DetermineApprovalRouteAsync(
            discoveredApp.RiskScore,
            discoveredApp.Category,
            discoveredApp.DataClassification);

        var validationRequest = new ValidationRequest
        {
            RequestId = Guid.NewGuid(),
            DiscoveryId = discoveryId,
            ApplicationName = discoveredApp.Name,
            Publisher = discoveredApp.Publisher,
            Version = discoveredApp.Version,
            FileHash = discoveredApp.FileHash,
            RequestType = requestType,
            RequestDate = DateTime.UtcNow,
            Status = "Pending",
            Comments = comments,
            RequesterUserId = discoveredApp.DiscoveredByUsers.FirstOrDefault(),
            DeviceId = discoveredApp.DiscoveredOnDevices.FirstOrDefault(),
            RiskScore = discoveredApp.RiskScore,
            ApprovalRoute = approvalRoute.RouteName,
            RequiredApprovers = approvalRoute.RequiredApprovers,
            CurrentApprovalStep = 0,
            TotalApprovalSteps = approvalRoute.ApprovalSteps.Count
        };

        await _validationRepository.CreateAsync(validationRequest);

        // Send notifications
        if (!string.IsNullOrEmpty(validationRequest.RequesterUserId))
        {
            await _notificationService.SendValidationRequestNotificationAsync(
                validationRequest.RequesterUserId,
                new ValidationRequestNotification
                {
                    RequestId = validationRequest.RequestId,
                    ApplicationName = validationRequest.ApplicationName,
                    Publisher = validationRequest.Publisher
                });
        }

        // If first approval step has designated approvers, notify them
        if (approvalRoute.ApprovalSteps.Count > 0 && 
            approvalRoute.ApprovalSteps[0].Approvers.Count > 0)
        {
            foreach (var approver in approvalRoute.ApprovalSteps[0].Approvers)
            {
                await _notificationService.SendApprovalRequestNotificationAsync(
                    approver,
                    new ApprovalRequestNotification
                    {
                        RequestId = validationRequest.RequestId,
                        ApplicationName = validationRequest.ApplicationName,
                        Publisher = validationRequest.Publisher,
                        Requester = validationRequest.RequesterUserId,
                        RiskScore = validationRequest.RiskScore
                    });
            }
        }

        _logger.LogInformation(
            "Created validation request {RequestId} for application {AppName} with approval route {Route}",
            validationRequest.RequestId,
            validationRequest.ApplicationName,
            approvalRoute.RouteName);

        return validationRequest;
    }

    public async Task<ValidationResponse> ProcessValidationResponseAsync(
        Guid requestId,
        ValidationDecision decision)
    {
        var request = await _validationRepository.GetByIdAsync(requestId);
        if (request == null)
        {
            throw new KeyNotFoundException($"Validation request {requestId} not found");
        }

        // Update validation request
        request.Status = decision.IsApproved ? "Approved" : "Rejected";
        request.ResponseDate = DateTime.UtcNow;
        request.ApproverComments = decision.Comments;
        request.ApproverUserId = decision.ApproverUserId;

        await _validationRepository.UpdateAsync(request);

        // Update discovered application
        var discoveredApp = await _discoveredAppRepository.GetByIdAsync(request.DiscoveryId);
        if (discoveredApp != null)
        {
            discoveredApp.ValidationStatus = request.Status;
            discoveredApp.ValidationDate = request.ResponseDate;
            discoveredApp.ValidatedByUser = true;

            await _discoveredAppRepository.UpdateAsync(discoveredApp);
        }

        // If approved, determine next steps
        var nextSteps = "Validation complete";
        if (decision.IsApproved)
        {
            if (decision.AddToCatalog)
            {
                // Add to catalog logic would go here
                nextSteps = "Application will be added to catalog";
            }
            else
            {
                nextSteps = "Application is approved for your use";
            }
        }
        else
        {
            nextSteps = "Application has been rejected";
        }

        // Notify requester of outcome
        if (!string.IsNullOrEmpty(request.RequesterUserId))
        {
            await _notificationService.SendValidationOutcomeNotificationAsync(
                request.RequesterUserId,
                new ValidationOutcomeNotification
                {
                    RequestId = request.RequestId,
                    ApplicationName = request.ApplicationName,
                    Status = request.Status,
                    ApproverComments = request.ApproverComments,
                    NextSteps = nextSteps
                });
        }

        _logger.LogInformation(
            "Processed validation request {RequestId} for application {AppName} with outcome {Outcome}",
            request.RequestId,
            request.ApplicationName,
            request.Status);

        return new ValidationResponse
        {
            RequestId = request.RequestId,
            Status = request.Status,
            NextSteps = nextSteps
        };
    }

    public async Task<ValidationRequestSummary> GetValidationRequestSummaryAsync(
        string userId,
        string status = null,
        DateTime? startDate = null,
        DateTime? endDate = null)
    {
        var requests = await _validationRepository.GetByUserIdAsync(userId, status, startDate, endDate);
        
        return new ValidationRequestSummary
        {
            TotalRequests = requests.Count,
            PendingRequests = requests.Count(r => r.Status == "Pending"),
            ApprovedRequests = requests.Count(r => r.Status == "Approved"),
            RejectedRequests = requests.Count(r => r.Status == "Rejected"),
            AverageResponseTime = requests
                .Where(r => r.ResponseDate.HasValue)
                .Average(r => (r.ResponseDate.Value - r.RequestDate).TotalHours),
            Requests = requests
        };
    }
}
```

## Database Schema

The integration relies on several key database tables:

### 1. DiscoveredApplications Table

```sql
CREATE TABLE [dbo].[DiscoveredApplications] (
    [DiscoveryId] UNIQUEIDENTIFIER PRIMARY KEY,
    [Name] NVARCHAR(255) NOT NULL,
    [Publisher] NVARCHAR(255) NULL,
    [Version] NVARCHAR(100) NULL,
    [FileHash] NVARCHAR(255) NULL,
    [FilePath] NVARCHAR(1000) NULL,
    [FileSize] BIGINT NULL,
    [SignatureStatus] NVARCHAR(50) NULL,
    [FirstDiscoveryDate] DATETIME2 NOT NULL,
    [LastSeenDate] DATETIME2 NOT NULL,
    [DiscoverySource] NVARCHAR(50) NOT NULL,
    [DiscoveryCount] INT NOT NULL DEFAULT 1,
    [DiscoveredOnDevices] NVARCHAR(MAX) NULL, -- JSON array of device IDs
    [DiscoveredByUsers] NVARCHAR(MAX) NULL, -- JSON array of user IDs
    [Category] NVARCHAR(100) NULL,
    [RiskScore] FLOAT NULL,
    [DataClassification] NVARCHAR(50) NULL,
    [ValidationStatus] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    [ValidationDate] DATETIME2 NULL,
    [ValidatedByUser] BIT NOT NULL DEFAULT 0,
    [CatalogApplicationId] UNIQUEIDENTIFIER NULL, -- Reference to catalog if added
    [Notes] NVARCHAR(MAX) NULL
);

CREATE INDEX [IX_DiscoveredApplications_FileHash] ON [dbo].[DiscoveredApplications] ([FileHash]);
CREATE INDEX [IX_DiscoveredApplications_Name_Publisher] ON [dbo].[DiscoveredApplications] ([Name], [Publisher]);
CREATE INDEX [IX_DiscoveredApplications_ValidationStatus] ON [dbo].[DiscoveredApplications] ([ValidationStatus]);
CREATE INDEX [IX_DiscoveredApplications_DiscoverySource] ON [dbo].[DiscoveredApplications] ([DiscoverySource]);
```

### 2. ValidationRequests Table

```sql
CREATE TABLE [dbo].[ValidationRequests] (
    [RequestId] UNIQUEIDENTIFIER PRIMARY KEY,
    [DiscoveryId] UNIQUEIDENTIFIER NOT NULL,
    [ApplicationName] NVARCHAR(255) NOT NULL,
    [Publisher] NVARCHAR(255) NULL,
    [Version] NVARCHAR(100) NULL,
    [FileHash] NVARCHAR(255) NULL,
    [RequestType] NVARCHAR(50) NOT NULL,
    [RequestDate] DATETIME2 NOT NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    [Comments] NVARCHAR(MAX) NULL,
    [RequesterUserId] NVARCHAR(255) NULL,
    [DeviceId] NVARCHAR(255) NULL,
    [ResponseDate] DATETIME2 NULL,
    [ApproverUserId] NVARCHAR(255) NULL,
    [ApproverComments] NVARCHAR(MAX) NULL,
    [RiskScore] FLOAT NULL,
    [ApprovalRoute] NVARCHAR(100) NULL,
    [RequiredApprovers] NVARCHAR(MAX) NULL, -- JSON array of approver IDs or roles
    [CurrentApprovalStep] INT NOT NULL DEFAULT 0,
    [TotalApprovalSteps] INT NOT NULL DEFAULT 1,
    [AddToCatalog] BIT NULL,
    [CatalogCategoryId] UNIQUEIDENTIFIER NULL,
    [BusinessJustification] NVARCHAR(MAX) NULL
);

CREATE INDEX [IX_ValidationRequests_DiscoveryId] ON [dbo].[ValidationRequests] ([DiscoveryId]);
CREATE INDEX [IX_ValidationRequests_RequesterUserId] ON [dbo].[ValidationRequests] ([RequesterUserId]);
CREATE INDEX [IX_ValidationRequests_Status] ON [dbo].[ValidationRequests] ([Status]);
CREATE INDEX [IX_ValidationRequests_RequestDate] ON [dbo].[ValidationRequests] ([RequestDate]);
```

### 3. ApprovalRoutes Table

```sql
CREATE TABLE [dbo].[ApprovalRoutes] (
    [RouteId] UNIQUEIDENTIFIER PRIMARY KEY,
    [RouteName] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [RiskScoreMin] FLOAT NULL,
    [RiskScoreMax] FLOAT NULL,
    [Categories] NVARCHAR(MAX) NULL, -- JSON array of applicable categories
    [DataClassifications] NVARCHAR(MAX) NULL, -- JSON array of applicable data classifications
    [ApprovalSteps] NVARCHAR(MAX) NOT NULL, -- JSON array of approval steps
    [CreatedDate] DATETIME2 NOT NULL,
    [LastModifiedDate] DATETIME2 NOT NULL,
    [CreatedBy] NVARCHAR(255) NOT NULL,
    [LastModifiedBy] NVARCHAR(255) NOT NULL
);

CREATE INDEX [IX_ApprovalRoutes_RouteName] ON [dbo].[ApprovalRoutes] ([RouteName]);
CREATE INDEX [IX_ApprovalRoutes_IsActive] ON [dbo].[ApprovalRoutes] ([IsActive]);
```

## API Endpoints

The integration exposes the following API endpoints:

### 1. Discovery API

```
POST /api/discovered-apps
```
Submit applications discovered by SIEM or Cloud App Security.

**Request Body:**
```json
{
  "source": "CloudAppSecurity",
  "applications": [
    {
      "name": "Example App",
      "publisher": "Example Publisher",
      "version": "1.0.0",
      "fileHash": "a1b2c3d4e5f6...",
      "hashAlgorithm": "SHA256",
      "filePath": "C:\\Program Files\\Example\\App.exe",
      "fileSize": 1024000,
      "userId": "user@example.com",
      "deviceId": "device123",
      "category": "Productivity",
      "riskScore": 42
    }
  ]
}
```

**Response:**
```json
{
  "status": "Success",
  "processedCount": 1,
  "newDiscoveries": 1,
  "alreadyKnown": 0,
  "failedProcessing": 0
}
```

### 2. Validation API

```
GET /api/validation-requests
```
List validation requests for the current user.

**Response:**
```json
{
  "totalRequests": 5,
  "pendingRequests": 2,
  "approvedRequests": 2,
  "rejectedRequests": 1,
  "averageResponseTime": 24.5,
  "requests": [
    {
      "requestId": "00000000-0000-0000-0000-000000000001",
      "applicationName": "Example App",
      "publisher": "Example Publisher",
      "requestDate": "2023-08-01T10:30:00Z",
      "status": "Pending"
    }
  ]
}
```

```
POST /api/validation-requests/{requestId}/respond
```
Respond to a validation request.

**Request Body:**
```json
{
  "isApproved": true,
  "comments": "This application is required for my role",
  "addToCatalog": true,
  "categoryId": "00000000-0000-0000-0000-000000000001"
}
```

**Response:**
```json
{
  "requestId": "00000000-0000-0000-0000-000000000001",
  "status": "Approved",
  "nextSteps": "Application will be added to catalog"
}
```

### 3. Reports API

```
GET /api/reports/discovered-applications
```
Get a report of discovered applications.

**Query Parameters:**
- `source` - Filter by discovery source
- `status` - Filter by validation status
- `startDate` - Start date for discovery period
- `endDate` - End date for discovery period

**Response:**
```json
{
  "totalDiscoveredApps": 125,
  "pendingValidation": 45,
  "validated": 80,
  "approvedApps": 65,
  "rejectedApps": 15,
  "averageRiskScore": 38.5,
  "topDiscoverySources": [
    {
      "source": "CloudAppSecurity",
      "count": 75
    },
    {
      "source": "Sentinel",
      "count": 50
    }
  ],
  "discoveryTrend": [
    {
      "date": "2023-07-01",
      "count": 15
    },
    {
      "date": "2023-08-01",
      "count": 22
    }
  ]
}
```

## Security Considerations

### 1. Authentication and Authorization
- All API endpoints must be secured with Azure AD authentication
- Role-based access control must be implemented for all operations
- Service-to-service authentication must use managed identities where possible
- API keys for external integrations must be stored in Azure Key Vault

### 2. Data Protection
- All sensitive data must be encrypted at rest and in transit
- Personal identifiable information must be handled according to privacy policies
- Data retention policies must be implemented for discovered applications
- Database firewall rules must restrict access to authorized services only

### 3. Integration Security
- Logic App connections must use secure connection strings
- Webhook endpoints must implement signature validation
- API throttling must be implemented to prevent abuse
- IP restrictions should be applied where appropriate

## Monitoring and Alerting

1. **Key Metrics to Monitor:**
   - Discovery ingestion rate and latency
   - Validation request processing time
   - API response times and error rates
   - Database performance metrics
   - Integration service health

2. **Alerts:**
   - Failed integrations with security tools
   - High-risk application discoveries
   - Validation request SLA breaches
   - Unusual discovery patterns or volumes
   - Integration service failures

3. **Logging:**
   - All application discovery events
   - Validation workflow actions
   - API access and usage
   - Authentication and authorization events
   - Integration service operations

## Testing Strategy

### 1. Integration Testing
- Test data flow between SIEM/CAS and application discovery service
- Verify correct processing of application metadata
- Validate deduplication logic for discovered applications
- Test notification delivery for validation requests
- Verify complete end-to-end workflow

### 2. Security Testing
- Conduct penetration testing of API endpoints
- Verify authentication and authorization controls
- Test data protection mechanisms
- Validate secure integration patterns
- Verify secure handling of sensitive information

### 3. Performance Testing
- Test ingestion performance with high volume of discoveries
- Validate API performance under load
- Measure database query performance
- Test notification service throughput
- Verify end-to-end latency meets requirements

## Deployment and Operations

### 1. Deployment Strategy
- Deploy infrastructure using Infrastructure as Code (Bicep/ARM)
- Implement blue-green deployment for API services
- Use staging slots for zero-downtime updates
- Implement database migrations with rollback capability
- Deploy Logic Apps with version control

### 2. Operational Procedures
- Implement regular backup and recovery testing
- Create runbooks for common operational tasks
- Document troubleshooting procedures
- Establish incident response process
- Develop maintenance windows and procedures

## Implementation Timeline

| Component | Duration | Dependencies |
|-----------|----------|--------------|
| Database Schema | 1 week | None |
| Application Discovery Service | 2 weeks | Database Schema |
| Cloud App Security Integration | 2 weeks | Application Discovery Service |
| SIEM Integration | 2 weeks | Application Discovery Service |
| Validation Workflow Service | 3 weeks | Application Discovery Service |
| API Endpoints | 2 weeks | All services |
| Monitoring and Alerting | 1 week | All components |
| Testing | 2 weeks | All components |
| Documentation | 1 week | All components |

## Conclusion

This technical design provides a comprehensive approach for integrating SIEM and Cloud App Security with the Employee App Store and Defender AppCatalog. The implementation will enable automated discovery, risk assessment, and validation of applications used within the organization, ensuring complete visibility and governance compliance.
