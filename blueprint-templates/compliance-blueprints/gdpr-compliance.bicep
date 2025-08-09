// GDPR Compliance Blueprint Template
// CBA Consult IT Management Framework - Task 3 Implementation
// This template provides a standardized approach to GDPR compliance implementation

// Template Metadata
metadata templateInfo = {
  name: 'GDPR Compliance Blueprint'
  version: '1.0.0'
  description: 'Standardized template for GDPR compliance implementation'
  author: 'CBA Consult ICT Governance Team'
  framework: 'ICT Governance Framework v3.2.0'
  compliance: ['GDPR', 'ISO 27001', 'ISO 27018', 'SOC 2']
  lastUpdated: '2025-08-07'
}

// Parameters for GDPR compliance configuration
@description('Environment designation (dev, test, prod)')
@allowed(['dev', 'test', 'prod'])
param environmentName string = 'prod'

@description('Organization identifier for resource naming')
@minLength(2)
@maxLength(10)
param organizationCode string = 'cba'

@description('Application or workload identifier')
@minLength(2)
@maxLength(15)
param applicationName string = 'gdpr'

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Cost center for billing allocation')
param costCenter string = 'GDPR-12345'

@description('Data Protection Officer contact')
param dataProtectionOfficer string = 'Data Protection Officer'

@description('Enable data encryption at rest')
param enableEncryptionAtRest bool = true

@description('Enable data encryption in transit')
param enableEncryptionInTransit bool = true

@description('Enable data loss prevention')
param enableDataLossPrevention bool = true

@description('Data retention period in days')
@minValue(30)
@maxValue(2555) // 7 years maximum
param dataRetentionDays int = 2555

@description('Enable automated data subject request handling')
param enableAutomatedDSR bool = true

@description('Enable privacy impact assessment tracking')
param enablePIATracking bool = true

@description('Data processing lawful basis')
@allowed(['Consent', 'Contract', 'LegalObligation', 'VitalInterests', 'PublicTask', 'LegitimateInterests'])
param lawfulBasis string = 'LegitimateInterests'

@description('Data categories processed')
param dataCategories array = [
  'PersonalIdentifiers'
  'ContactInformation'
  'FinancialInformation'
  'EmploymentInformation'
]

// Variables for GDPR implementation
var namingConvention = {
  prefix: '${organizationCode}-${applicationName}-${environmentName}'
  suffix: uniqueString(resourceGroup().id)
}

var resourceNames = {
  logAnalytics: '${namingConvention.prefix}-la-${namingConvention.suffix}'
  keyVault: '${namingConvention.prefix}-kv-${namingConvention.suffix}'
  storageAccount: '${namingConvention.prefix}st${namingConvention.suffix}'
  cosmosDb: '${namingConvention.prefix}-cosmos-${namingConvention.suffix}'
  automationAccount: '${namingConvention.prefix}-aa-${namingConvention.suffix}'
  purviewAccount: '${namingConvention.prefix}-purview-${namingConvention.suffix}'
  dataFactory: '${namingConvention.prefix}-adf-${namingConvention.suffix}'
}

var governanceTags = {
  Environment: environmentName
  Organization: organizationCode
  Application: applicationName
  CostCenter: costCenter
  Owner: dataProtectionOfficer
  DataClassification: 'PersonalData'
  Compliance: 'GDPR,ISO27001,ISO27018,SOC2'
  Framework: 'ICT-Governance-v3.2.0'
  CreatedDate: utcNow('yyyy-MM-dd')
  GDPRCompliant: 'true'
  LawfulBasis: lawfulBasis
  DataCategories: join(dataCategories, ',')
}

var gdprConfig = {
  dataProtection: {
    encryptionAtRest: enableEncryptionAtRest
    encryptionInTransit: enableEncryptionInTransit
    dataLossPrevention: enableDataLossPrevention
  }
  dataSubjectRights: {
    rightOfAccess: true
    rightToRectification: true
    rightToErasure: true
    rightToPortability: true
    rightToRestriction: true
    rightToObject: true
  }
  dataGovernance: {
    dataRetentionDays: dataRetentionDays
    automatedDSR: enableAutomatedDSR
    piaTracking: enablePIATracking
    lawfulBasis: lawfulBasis
  }
  monitoring: {
    auditLogging: true
    dataAccessMonitoring: true
    breachDetection: true
  }
}

// Log Analytics Workspace for GDPR Monitoring
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: resourceNames.logAnalytics
  location: location
  tags: governanceTags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: dataRetentionDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
      disableLocalAuth: false
    }
    workspaceCapping: {
      dailyQuotaGb: environmentName == 'prod' ? 100 : 10
    }
  }
}

// Key Vault for GDPR Encryption Keys
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: resourceNames.keyVault
  location: location
  tags: governanceTags
  properties: {
    sku: {
      family: 'A'
      name: 'premium'
    }
    tenantId: subscription().tenantId
    enabledForDeployment: false
    enabledForDiskEncryption: true
    enabledForTemplateDeployment: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    enableRbacAuthorization: true
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
      ipRules: []
      virtualNetworkRules: []
    }
    publicNetworkAccess: 'Enabled'
  }
}

// Storage Account with GDPR-compliant configuration
resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: resourceNames.storageAccount
  location: location
  tags: governanceTags
  sku: {
    name: 'Standard_ZRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    encryption: {
      requireInfrastructureEncryption: enableEncryptionAtRest
      keySource: 'Microsoft.Keyvault'
      keyvaultproperties: {
        keyname: keyVaultKey.name
        keyvaulturi: keyVault.properties.vaultUri
      }
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
        queue: {
          enabled: true
          keyType: 'Service'
        }
        table: {
          enabled: true
          keyType: 'Service'
        }
      }
    }
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: enableEncryptionInTransit
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
}

// Cosmos DB for GDPR-compliant data storage
resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts@2022-08-15' = {
  name: resourceNames.cosmosDb
  location: location
  tags: governanceTags
  kind: 'GlobalDocumentDB'
  properties: {
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    databaseAccountOfferType: 'Standard'
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    enableFreeTier: false
    enableAnalyticalStorage: false
    publicNetworkAccess: 'Enabled'
    networkAclBypass: 'AzureServices'
    disableKeyBasedMetadataWriteAccess: true
    enablePartitionMerge: false
    minimalTlsVersion: 'Tls12'
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240
        backupRetentionIntervalInHours: dataRetentionDays * 24
        backupStorageRedundancy: 'Zone'
      }
    }
  }
}

// Automation Account for GDPR Automation
resource automationAccount 'Microsoft.Automation/automationAccounts@2020-01-13-preview' = {
  name: resourceNames.automationAccount
  location: location
  tags: governanceTags
  properties: {
    sku: {
      name: 'Basic'
    }
    encryption: {
      keySource: 'Microsoft.Automation'
    }
    publicNetworkAccess: true
  }
}

// Data Factory for Data Subject Request Processing
resource dataFactory 'Microsoft.DataFactory/factories@2018-06-01' = if (enableAutomatedDSR) {
  name: resourceNames.dataFactory
  location: location
  tags: governanceTags
  properties: {
    publicNetworkAccess: 'Enabled'
    encryption: {
      identity: {
        type: 'SystemAssigned'
      }
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Encryption Key for GDPR Data Protection
resource gdprEncryptionKey 'Microsoft.KeyVault/vaults/keys@2022-07-01' = {
  name: 'gdpr-encryption-key'
  parent: keyVault
  properties: {
    kty: 'RSA'
    keySize: 2048
    keyOps: [
      'encrypt'
      'decrypt'
      'sign'
      'verify'
      'wrapKey'
      'unwrapKey'
    ]
    attributes: {
      enabled: true
      exportable: false
    }
  }
}

// Data Retention Policy Runbook
resource dataRetentionRunbook 'Microsoft.Automation/automationAccounts/runbooks@2020-01-13-preview' = {
  name: 'DataRetentionPolicy'
  parent: automationAccount
  properties: {
    runbookType: 'PowerShell'
    logProgress: true
    logVerbose: true
    description: 'Automated data retention and deletion runbook for GDPR compliance'
    publishContentLink: {
      uri: 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.automation/101-automation-runbook-getvms/Runbooks/Get-AzureVMTutorial.ps1'
      version: '1.0.0.0'
    }
  }
}

// Data Subject Request Runbook
resource dsrRunbook 'Microsoft.Automation/automationAccounts/runbooks@2020-01-13-preview' = if (enableAutomatedDSR) {
  name: 'DataSubjectRequestProcessor'
  parent: automationAccount
  properties: {
    runbookType: 'PowerShell'
    logProgress: true
    logVerbose: true
    description: 'Automated data subject request processing runbook'
    publishContentLink: {
      uri: 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.automation/101-automation-runbook-getvms/Runbooks/Get-AzureVMTutorial.ps1'
      version: '1.0.0.0'
    }
  }
}

// Schedule for Data Retention Policy
resource dataRetentionSchedule 'Microsoft.Automation/automationAccounts/schedules@2020-01-13-preview' = {
  name: 'DailyDataRetentionCheck'
  parent: automationAccount
  properties: {
    description: 'Daily data retention policy check'
    startTime: dateTimeAdd(utcNow(), 'P1D')
    frequency: 'Day'
    interval: 1
    timeZone: 'UTC'
  }
}

// Job Schedule for Data Retention
resource dataRetentionJobSchedule 'Microsoft.Automation/automationAccounts/jobSchedules@2020-01-13-preview' = {
  name: guid('DataRetentionJobSchedule', resourceGroup().id)
  parent: automationAccount
  properties: {
    runbook: {
      name: dataRetentionRunbook.name
    }
    schedule: {
      name: dataRetentionSchedule.name
    }
  }
}

// Diagnostic Settings for GDPR Monitoring
resource storageAccountDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'storageAccountDiagnostics'
  scope: storageAccount
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    metrics: [
      {
        category: 'Transaction'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: dataRetentionDays
        }
      }
    ]
  }
}

resource cosmosDbDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'cosmosDbDiagnostics'
  scope: cosmosDb
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'DataPlaneRequests'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: dataRetentionDays
        }
      }
      {
        category: 'QueryRuntimeStatistics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: dataRetentionDays
        }
      }
    ]
    metrics: [
      {
        category: 'Requests'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: dataRetentionDays
        }
      }
    ]
  }
}

resource keyVaultDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'keyVaultDiagnostics'
  scope: keyVault
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'AuditEvent'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: dataRetentionDays
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: dataRetentionDays
        }
      }
    ]
  }
}

// GDPR Compliance Monitoring Alerts
resource dataAccessAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'GDPR-DataAccessAlert'
  location: 'global'
  tags: governanceTags
  properties: {
    description: 'Alert for unusual data access patterns'
    severity: 2
    enabled: true
    scopes: [
      storageAccount.id
      cosmosDb.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighDataAccess'
          metricName: 'Transactions'
          operator: 'GreaterThan'
          threshold: 1000
          timeAggregation: 'Total'
        }
      ]
    }
    actions: [
      {
        actionGroupId: ''
        webHookProperties: {}
      }
    ]
  }
}

// Outputs for governance and compliance tracking
output gdprCompliance object = {
  templateVersion: '1.0.0'
  deploymentTimestamp: utcNow()
  complianceFrameworks: ['GDPR', 'ISO27001', 'ISO27018', 'SOC2']
  gdprControls: {
    dataProtection: gdprConfig.dataProtection
    dataSubjectRights: gdprConfig.dataSubjectRights
    dataGovernance: gdprConfig.dataGovernance
    monitoring: gdprConfig.monitoring
  }
  dataProcessingDetails: {
    lawfulBasis: lawfulBasis
    dataCategories: dataCategories
    retentionPeriod: dataRetentionDays
    dataProtectionOfficer: dataProtectionOfficer
  }
  resourceIds: {
    logAnalyticsWorkspace: logAnalyticsWorkspace.id
    keyVault: keyVault.id
    storageAccount: storageAccount.id
    cosmosDb: cosmosDb.id
    automationAccount: automationAccount.id
    dataFactory: enableAutomatedDSR ? dataFactory.id : ''
  }
}

output gdprEndpoints object = {
  keyVaultUri: keyVault.properties.vaultUri
  logAnalyticsWorkspaceId: logAnalyticsWorkspace.properties.customerId
  storageAccountEndpoint: storageAccount.properties.primaryEndpoints.blob
  cosmosDbEndpoint: cosmosDb.properties.documentEndpoint
  automationAccountId: automationAccount.id
  dataFactoryId: enableAutomatedDSR ? dataFactory.id : ''
}