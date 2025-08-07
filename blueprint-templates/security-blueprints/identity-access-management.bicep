// Identity and Access Management Blueprint Template
// CBA Consult IT Management Framework - Task 3 Implementation
// This template provides a standardized approach to IAM implementation

// Template Metadata
metadata templateInfo = {
  name: 'Identity and Access Management Blueprint'
  version: '1.0.0'
  description: 'Standardized template for IAM and RBAC implementation'
  author: 'CBA Consult ICT Governance Team'
  framework: 'ICT Governance Framework v3.2.0'
  compliance: ['ISO 27001', 'NIST IAM', 'SOC 2', 'GDPR']
  lastUpdated: '2025-08-07'
}

// Parameters for IAM configuration
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
param applicationName string = 'iam'

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Cost center for billing allocation')
param costCenter string = 'IAM-12345'

@description('IAM team contact for governance tracking')
param iamOwner string = 'Identity and Access Management Team'

@description('Enable privileged identity management')
param enablePIM bool = true

@description('Enable conditional access policies')
param enableConditionalAccess bool = true

@description('Enable identity protection')
param enableIdentityProtection bool = true

@description('Data classification level')
@allowed(['Public', 'Internal', 'Confidential', 'Restricted'])
param dataClassification string = 'Confidential'

@description('Compliance requirements')
param complianceRequirements array = ['ISO27001', 'NIST', 'SOC2', 'GDPR']

@description('Enable multi-factor authentication enforcement')
param enforceMFA bool = true

@description('Password policy complexity requirements')
param passwordComplexity object = {
  minimumLength: 12
  requireUppercase: true
  requireLowercase: true
  requireNumbers: true
  requireSpecialCharacters: true
  passwordHistoryCount: 12
  maxPasswordAge: 90
}

// Variables for IAM implementation
var namingConvention = {
  prefix: '${organizationCode}-${applicationName}-${environmentName}'
  suffix: uniqueString(resourceGroup().id)
}

var resourceNames = {
  logAnalytics: '${namingConvention.prefix}-la-${namingConvention.suffix}'
  keyVault: '${namingConvention.prefix}-kv-${namingConvention.suffix}'
  userAssignedIdentity: '${namingConvention.prefix}-uai-${namingConvention.suffix}'
  automationAccount: '${namingConvention.prefix}-aa-${namingConvention.suffix}'
}

var governanceTags = {
  Environment: environmentName
  Organization: organizationCode
  Application: applicationName
  CostCenter: costCenter
  Owner: iamOwner
  DataClassification: dataClassification
  Compliance: join(complianceRequirements, ',')
  Framework: 'ICT-Governance-v3.2.0'
  CreatedDate: utcNow('yyyy-MM-dd')
  IAMEnabled: 'true'
}

var iamConfig = {
  roleBasedAccess: {
    enableRBAC: true
    enableCustomRoles: true
    enableJustInTimeAccess: enablePIM
  }
  authentication: {
    enableMFA: enforceMFA
    enableConditionalAccess: enableConditionalAccess
    enableIdentityProtection: enableIdentityProtection
  }
  authorization: {
    enablePrivilegedAccess: enablePIM
    enableAccessReviews: true
    enableEntitlementManagement: true
  }
  monitoring: {
    enableAuditLogging: true
    enableSignInMonitoring: true
    enableRiskDetection: enableIdentityProtection
  }
}

// Standard RBAC Role Definitions
var customRoleDefinitions = [
  {
    name: 'Application Administrator'
    description: 'Can manage application resources and configurations'
    permissions: [
      'Microsoft.Web/sites/*'
      'Microsoft.Storage/storageAccounts/read'
      'Microsoft.KeyVault/vaults/secrets/read'
    ]
    assignableScopes: [
      resourceGroup().id
    ]
  }
  {
    name: 'Security Reader'
    description: 'Can read security configurations and reports'
    permissions: [
      'Microsoft.Security/*/read'
      'Microsoft.KeyVault/vaults/read'
      'Microsoft.Network/networkSecurityGroups/read'
    ]
    assignableScopes: [
      resourceGroup().id
    ]
  }
  {
    name: 'Compliance Auditor'
    description: 'Can read compliance and audit information'
    permissions: [
      'Microsoft.Insights/*/read'
      'Microsoft.OperationalInsights/*/read'
      'Microsoft.Security/*/read'
    ]
    assignableScopes: [
      resourceGroup().id
    ]
  }
]

// Log Analytics Workspace for IAM Monitoring
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: resourceNames.logAnalytics
  location: location
  tags: governanceTags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: environmentName == 'prod' ? 365 : 90
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
      disableLocalAuth: false
    }
    workspaceCapping: {
      dailyQuotaGb: environmentName == 'prod' ? 50 : 5
    }
  }
}

// Key Vault for IAM Secrets and Certificates
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

// User Assigned Managed Identity for Applications
resource userAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: resourceNames.userAssignedIdentity
  location: location
  tags: governanceTags
}

// Automation Account for IAM Automation
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
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userAssignedIdentity.id}': {}
    }
  }
}

// Custom Role Definitions
resource applicationAdministratorRole 'Microsoft.Authorization/roleDefinitions@2022-04-01' = {
  name: guid('ApplicationAdministrator', resourceGroup().id)
  properties: {
    roleName: 'Application Administrator - ${organizationCode}'
    description: 'Can manage application resources and configurations'
    type: 'CustomRole'
    permissions: [
      {
        actions: [
          'Microsoft.Web/sites/*'
          'Microsoft.Storage/storageAccounts/read'
          'Microsoft.KeyVault/vaults/secrets/read'
          'Microsoft.Insights/*/read'
        ]
        notActions: [
          'Microsoft.Web/sites/delete'
          'Microsoft.Storage/storageAccounts/delete'
        ]
        dataActions: []
        notDataActions: []
      }
    ]
    assignableScopes: [
      resourceGroup().id
    ]
  }
}

resource securityReaderRole 'Microsoft.Authorization/roleDefinitions@2022-04-01' = {
  name: guid('SecurityReader', resourceGroup().id)
  properties: {
    roleName: 'Security Reader - ${organizationCode}'
    description: 'Can read security configurations and reports'
    type: 'CustomRole'
    permissions: [
      {
        actions: [
          'Microsoft.Security/*/read'
          'Microsoft.KeyVault/vaults/read'
          'Microsoft.Network/networkSecurityGroups/read'
          'Microsoft.Insights/*/read'
        ]
        notActions: []
        dataActions: []
        notDataActions: []
      }
    ]
    assignableScopes: [
      resourceGroup().id
    ]
  }
}

resource complianceAuditorRole 'Microsoft.Authorization/roleDefinitions@2022-04-01' = {
  name: guid('ComplianceAuditor', resourceGroup().id)
  properties: {
    roleName: 'Compliance Auditor - ${organizationCode}'
    description: 'Can read compliance and audit information'
    type: 'CustomRole'
    permissions: [
      {
        actions: [
          'Microsoft.Insights/*/read'
          'Microsoft.OperationalInsights/*/read'
          'Microsoft.Security/*/read'
          'Microsoft.Authorization/*/read'
        ]
        notActions: []
        dataActions: []
        notDataActions: []
      }
    ]
    assignableScopes: [
      resourceGroup().id
    ]
  }
}

// Key Vault Access Policies for Service Principals
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2022-07-01' = {
  name: 'add'
  parent: keyVault
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: userAssignedIdentity.properties.principalId
        permissions: {
          keys: [
            'get'
            'list'
            'encrypt'
            'decrypt'
          ]
          secrets: [
            'get'
            'list'
            'set'
          ]
          certificates: [
            'get'
            'list'
            'create'
            'update'
          ]
        }
      }
    ]
  }
}

// Diagnostic Settings for IAM Monitoring
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
          days: environmentName == 'prod' ? 365 : 90
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 365 : 90
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
          days: environmentName == 'prod' ? 365 : 90
        }
      }
      {
        category: 'JobStreams'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 365 : 90
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 365 : 90
        }
      }
    ]
  }
}

// PowerShell Runbook for Access Reviews
resource accessReviewRunbook 'Microsoft.Automation/automationAccounts/runbooks@2020-01-13-preview' = {
  name: 'AccessReviewAutomation'
  parent: automationAccount
  properties: {
    runbookType: 'PowerShell'
    logProgress: true
    logVerbose: true
    description: 'Automated access review and reporting runbook'
    publishContentLink: {
      uri: 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.automation/101-automation-runbook-getvms/Runbooks/Get-AzureVMTutorial.ps1'
      version: '1.0.0.0'
    }
  }
}

// Schedule for Access Reviews
resource accessReviewSchedule 'Microsoft.Automation/automationAccounts/schedules@2020-01-13-preview' = {
  name: 'MonthlyAccessReview'
  parent: automationAccount
  properties: {
    description: 'Monthly access review schedule'
    startTime: dateTimeAdd(utcNow(), 'P1D')
    frequency: 'Month'
    interval: 1
    timeZone: 'UTC'
  }
}

// Job Schedule for Access Reviews
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

// Outputs for governance and compliance tracking
output iamCompliance object = {
  templateVersion: '1.0.0'
  deploymentTimestamp: utcNow()
  complianceFrameworks: complianceRequirements
  iamControls: {
    roleBasedAccess: iamConfig.roleBasedAccess
    authentication: iamConfig.authentication
    authorization: iamConfig.authorization
    monitoring: iamConfig.monitoring
  }
  customRoles: {
    applicationAdministrator: applicationAdministratorRole.id
    securityReader: securityReaderRole.id
    complianceAuditor: complianceAuditorRole.id
  }
  resourceIds: {
    logAnalyticsWorkspace: logAnalyticsWorkspace.id
    keyVault: keyVault.id
    userAssignedIdentity: userAssignedIdentity.id
    automationAccount: automationAccount.id
  }
}

output iamEndpoints object = {
  keyVaultUri: keyVault.properties.vaultUri
  logAnalyticsWorkspaceId: logAnalyticsWorkspace.properties.customerId
  userAssignedIdentityPrincipalId: userAssignedIdentity.properties.principalId
  userAssignedIdentityClientId: userAssignedIdentity.properties.clientId
  automationAccountId: automationAccount.id
}