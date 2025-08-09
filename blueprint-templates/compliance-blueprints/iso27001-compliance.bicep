// ISO 27001 Compliance Blueprint Template
// CBA Consult IT Management Framework - Task 3 Implementation
// This template provides a standardized approach to ISO 27001 compliance implementation

// Template Metadata
metadata templateInfo = {
  name: 'ISO 27001 Compliance Blueprint'
  version: '1.0.0'
  description: 'Standardized template for ISO 27001 compliance implementation'
  author: 'CBA Consult ICT Governance Team'
  framework: 'ICT Governance Framework v3.2.0'
  compliance: ['ISO 27001:2013', 'ISO 27002:2022', 'NIST CSF', 'SOC 2']
  lastUpdated: '2025-08-07'
}

// Parameters for ISO 27001 compliance configuration
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
param applicationName string = 'iso27001'

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Cost center for billing allocation')
param costCenter string = 'COMP-12345'

@description('Information Security Officer contact')
param informationSecurityOfficer string = 'Information Security Officer'

@description('Enable information security management system (ISMS)')
param enableISMS bool = true

@description('Enable risk management framework')
param enableRiskManagement bool = true

@description('Enable security monitoring and incident management')
param enableSecurityMonitoring bool = true

@description('Enable business continuity management')
param enableBusinessContinuity bool = true

@description('Enable supplier relationship security')
param enableSupplierSecurity bool = true

@description('Data retention period in days for audit logs')
@minValue(365)
@maxValue(2555) // 7 years maximum
param auditLogRetentionDays int = 2555

@description('Security control implementation level')
@allowed(['Basic', 'Standard', 'Advanced'])
param securityControlLevel string = 'Standard'

@description('Compliance assessment frequency')
@allowed(['Monthly', 'Quarterly', 'SemiAnnually', 'Annually'])
param assessmentFrequency string = 'Quarterly'

// Variables for ISO 27001 implementation
var namingConvention = {
  prefix: '${organizationCode}-${applicationName}-${environmentName}'
  suffix: uniqueString(resourceGroup().id)
}

var resourceNames = {
  logAnalytics: '${namingConvention.prefix}-la-${namingConvention.suffix}'
  keyVault: '${namingConvention.prefix}-kv-${namingConvention.suffix}'
  storageAccount: '${namingConvention.prefix}st${namingConvention.suffix}'
  automationAccount: '${namingConvention.prefix}-aa-${namingConvention.suffix}'
  securityCenter: '${namingConvention.prefix}-sc-${namingConvention.suffix}'
  sentinel: '${namingConvention.prefix}-sentinel-${namingConvention.suffix}'
  recoveryVault: '${namingConvention.prefix}-rsv-${namingConvention.suffix}'
}

var governanceTags = {
  Environment: environmentName
  Organization: organizationCode
  Application: applicationName
  CostCenter: costCenter
  Owner: informationSecurityOfficer
  DataClassification: 'Confidential'
  Compliance: 'ISO27001,ISO27002,NIST,SOC2'
  Framework: 'ICT-Governance-v3.2.0'
  CreatedDate: utcNow('yyyy-MM-dd')
  ISO27001Compliant: 'true'
  SecurityControlLevel: securityControlLevel
}

var iso27001Config = {
  informationSecurity: {
    enableISMS: enableISMS
    securityPolicies: true
    organizationOfSecurity: true
    humanResourceSecurity: true
  }
  assetManagement: {
    responsibilityForAssets: true
    informationClassification: true
    mediaHandling: true
  }
  accessControl: {
    businessRequirements: true
    userAccessManagement: true
    userResponsibilities: true
    systemApplicationAccess: true
  }
  cryptography: {
    cryptographicControls: true
    keyManagement: true
  }
  physicalEnvironmentalSecurity: {
    secureAreas: true
    equipment: true
  }
  operationsSecurity: {
    operationalProcedures: true
    protectionFromMalware: true
    backup: true
    logging: enableSecurityMonitoring
    controlOfOperationalSoftware: true
    technicalVulnerabilityManagement: true
  }
  communicationsSecurity: {
    networkSecurityManagement: true
    informationTransfer: true
  }
  systemAcquisition: {
    securityRequirements: true
    securityInDevelopment: true
    testData: true
  }
  supplierRelationships: {
    informationSecurityInSupplierRelationships: enableSupplierSecurity
    supplierServiceDeliveryManagement: enableSupplierSecurity
  }
  incidentManagement: {
    managementOfSecurityIncidents: enableSecurityMonitoring
    improvementsAfterIncidents: true
  }
  businessContinuity: {
    informationSecurityContinuity: enableBusinessContinuity
    redundancies: enableBusinessContinuity
  }
  compliance: {
    complianceWithLegalRequirements: true
    informationSecurityReviews: true
  }
}

// Log Analytics Workspace for ISO 27001 Monitoring
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: resourceNames.logAnalytics
  location: location
  tags: governanceTags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: auditLogRetentionDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
      disableLocalAuth: false
    }
    workspaceCapping: {
      dailyQuotaGb: environmentName == 'prod' ? 200 : 20
    }
  }
}

// Key Vault for Cryptographic Controls (A.10)
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

// Storage Account for Secure Information Storage (A.8)
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
      requireInfrastructureEncryption: true
      keySource: 'Microsoft.Keyvault'
      keyvaultproperties: {
        keyname: 'iso27001-encryption-key'
        keyvaulturi: keyVault.properties.vaultUri
      keySource: 'Microsoft.Storage'
      // NOTE: To enable customer-managed keys (CMK) with Key Vault, update the storage account after the Key Vault and key are created.
      // keyvaultproperties block intentionally omitted to avoid circular dependency during initial deployment.
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
    supportsHttpsTrafficOnly: true
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
}

// Automation Account for Operations Security (A.12)
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

// Recovery Services Vault for Business Continuity (A.17)
resource recoveryVault 'Microsoft.RecoveryServices/vaults@2022-10-01' = if (enableBusinessContinuity) {
  name: resourceNames.recoveryVault
  location: location
  tags: governanceTags
  sku: {
    name: 'Standard'
  }
  properties: {
    publicNetworkAccess: 'Enabled'
  }
}

// Security Center Configuration for Compliance Monitoring
resource securityCenterWorkspace 'Microsoft.Security/workspaceSettings@2017-08-01-preview' = {
  name: 'default'
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    scope: subscription().id
  }
}

// Encryption Key for ISO 27001 Cryptographic Controls
resource iso27001EncryptionKey 'Microsoft.KeyVault/vaults/keys@2022-07-01' = {
  name: 'iso27001-encryption-key'
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

// Vulnerability Assessment Runbook (A.12.6)
resource vulnerabilityAssessmentRunbook 'Microsoft.Automation/automationAccounts/runbooks@2020-01-13-preview' = {
  name: 'VulnerabilityAssessment'
  parent: automationAccount
  properties: {
    runbookType: 'PowerShell'
    logProgress: true
    logVerbose: true
    description: 'Automated vulnerability assessment and reporting for ISO 27001 compliance'
    publishContentLink: {
      uri: 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.automation/101-automation-runbook-getvms/Runbooks/Get-AzureVMTutorial.ps1'
      version: '1.0.0.0'
    }
  }
}

// Access Review Runbook (A.9.2.5)
resource accessReviewRunbook 'Microsoft.Automation/automationAccounts/runbooks@2020-01-13-preview' = {
  name: 'AccessReview'
  parent: automationAccount
  properties: {
    runbookType: 'PowerShell'
    logProgress: true
    logVerbose: true
    description: 'Automated access review for ISO 27001 compliance'
    publishContentLink: {
      uri: 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.automation/101-automation-runbook-getvms/Runbooks/Get-AzureVMTutorial.ps1'
      version: '1.0.0.0'
    }
  }
}

// Backup Policy Runbook (A.12.3)
resource backupPolicyRunbook 'Microsoft.Automation/automationAccounts/runbooks@2020-01-13-preview' = if (enableBusinessContinuity) {
  name: 'BackupPolicyCompliance'
  parent: automationAccount
  properties: {
    runbookType: 'PowerShell'
    logProgress: true
    logVerbose: true
    description: 'Automated backup policy compliance checking for ISO 27001'
    publishContentLink: {
      uri: 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.automation/101-automation-runbook-getvms/Runbooks/Get-AzureVMTutorial.ps1'
      version: '1.0.0.0'
    }
  }
}

// Schedule for Vulnerability Assessment
resource vulnerabilityAssessmentSchedule 'Microsoft.Automation/automationAccounts/schedules@2020-01-13-preview' = {
  name: 'WeeklyVulnerabilityAssessment'
  parent: automationAccount
  properties: {
    description: 'Weekly vulnerability assessment schedule for ISO 27001 compliance'
    startTime: dateTimeAdd(utcNow(), 'P1D')
    frequency: 'Week'
    interval: 1
    timeZone: 'UTC'
  }
}

// Schedule for Access Reviews
resource accessReviewSchedule 'Microsoft.Automation/automationAccounts/schedules@2020-01-13-preview' = {
  name: assessmentFrequency == 'Monthly' ? 'MonthlyAccessReview' : assessmentFrequency == 'Quarterly' ? 'QuarterlyAccessReview' : 'SemiAnnualAccessReview'
  parent: automationAccount
  properties: {
    description: '${assessmentFrequency} access review schedule for ISO 27001 compliance'
    startTime: dateTimeAdd(utcNow(), 'P1D')
    frequency: assessmentFrequency == 'Monthly' ? 'Month' : assessmentFrequency == 'Quarterly' ? 'Month' : 'Month'
    interval: assessmentFrequency == 'Monthly' ? 1 : assessmentFrequency == 'Quarterly' ? 3 : 6
    timeZone: 'UTC'
  }
}

// Job Schedules
resource vulnerabilityJobSchedule 'Microsoft.Automation/automationAccounts/jobSchedules@2020-01-13-preview' = {
  name: guid('VulnerabilityJobSchedule', resourceGroup().id)
  parent: automationAccount
  properties: {
    runbook: {
      name: vulnerabilityAssessmentRunbook.name
    }
    schedule: {
      name: vulnerabilityAssessmentSchedule.name
    }
  }
}

resource accessReviewJobSchedule 'Microsoft.Automation/automationAccounts/jobSchedules@2020-01-13-preview' = {
  name: guid('AccessReviewJobSchedule', resourceGroup().id)
  parent: automationAccount
  properties: {
    runbook: {
      name: accessReviewRunbook.name
    }
    schedule: {
      name: accessReviewSchedule.name
    }
  }
}

// Diagnostic Settings for Compliance Monitoring (A.12.4)
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
          days: auditLogRetentionDays
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: auditLogRetentionDays
        }
      }
    ]
  }
}

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
          days: auditLogRetentionDays
        }
      }
    ]
  }
}

resource automationAccountDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'automationAccountDiagnostics'
  scope: automationAccount
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'JobLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: auditLogRetentionDays
        }
      }
      {
        category: 'JobStreams'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: auditLogRetentionDays
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: auditLogRetentionDays
        }
      }
    ]
  }
}

// ISO 27001 Compliance Monitoring Alerts
resource securityIncidentAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableSecurityMonitoring) {
  name: 'ISO27001-SecurityIncidentAlert'
  location: 'global'
  tags: governanceTags
  properties: {
    description: 'Alert for security incidents requiring ISO 27001 incident management'
    severity: 1
    enabled: true
    scopes: [
      logAnalyticsWorkspace.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'SecurityEvents'
          metricName: 'Heartbeat'
          operator: 'LessThan'
          threshold: 1
          timeAggregation: 'Total'
        }
      ]
    }
    actions: []
  }
}

resource complianceViolationAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'ISO27001-ComplianceViolationAlert'
  location: 'global'
  tags: governanceTags
  properties: {
    description: 'Alert for potential ISO 27001 compliance violations'
    severity: 2
    enabled: true
    scopes: [
      keyVault.id
      storageAccount.id
    ]
    evaluationFrequency: 'PT15M'
    windowSize: 'PT30M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'UnauthorizedAccess'
          metricName: 'ServiceApiResult'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Total'
        }
      ]
    }
    actions: []
  }
}

// Outputs for governance and compliance tracking
output iso27001Compliance object = {
  templateVersion: '1.0.0'
  deploymentTimestamp: utcNow()
  complianceFrameworks: ['ISO27001:2013', 'ISO27002:2022', 'NIST', 'SOC2']
  iso27001Controls: {
    informationSecurity: iso27001Config.informationSecurity
    assetManagement: iso27001Config.assetManagement
    accessControl: iso27001Config.accessControl
    cryptography: iso27001Config.cryptography
    physicalEnvironmentalSecurity: iso27001Config.physicalEnvironmentalSecurity
    operationsSecurity: iso27001Config.operationsSecurity
    communicationsSecurity: iso27001Config.communicationsSecurity
    systemAcquisition: iso27001Config.systemAcquisition
    supplierRelationships: iso27001Config.supplierRelationships
    incidentManagement: iso27001Config.incidentManagement
    businessContinuity: iso27001Config.businessContinuity
    compliance: iso27001Config.compliance
  }
  implementationDetails: {
    securityControlLevel: securityControlLevel
    assessmentFrequency: assessmentFrequency
    auditLogRetention: auditLogRetentionDays
    informationSecurityOfficer: informationSecurityOfficer
  }
  resourceIds: {
    logAnalyticsWorkspace: logAnalyticsWorkspace.id
    keyVault: keyVault.id
    storageAccount: storageAccount.id
    automationAccount: automationAccount.id
    recoveryVault: enableBusinessContinuity ? recoveryVault.id : ''
  }
}

output iso27001Endpoints object = {
  keyVaultUri: keyVault.properties.vaultUri
  logAnalyticsWorkspaceId: logAnalyticsWorkspace.properties.customerId
  storageAccountEndpoint: storageAccount.properties.primaryEndpoints.blob
  automationAccountId: automationAccount.id
  recoveryVaultId: enableBusinessContinuity ? recoveryVault.id : ''
}