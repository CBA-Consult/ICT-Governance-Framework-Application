// Multi-Cloud Infrastructure Blueprint Template
// CBA Consult IT Management Framework - Task 3 Implementation
// This template provides a standardized approach to multi-cloud infrastructure deployment

// Template Metadata
metadata templateInfo = {
  name: 'Multi-Cloud Infrastructure Blueprint'
  version: '1.0.0'
  description: 'Standardized template for multi-cloud infrastructure deployment'
  author: 'CBA Consult ICT Governance Team'
  framework: 'ICT Governance Framework v3.2.0'
  compliance: ['ISO 27001', 'NIST', 'COBIT 2019']
  lastUpdated: '2025-08-07'
}

// Parameters with governance-compliant defaults
@description('Environment designation (dev, test, prod)')
@allowed(['dev', 'test', 'prod'])
param environmentName string = 'dev'

@description('Organization identifier for resource naming')
@minLength(2)
@maxLength(10)
param organizationCode string = 'cba'

@description('Application or workload identifier')
@minLength(2)
@maxLength(15)
param applicationName string = 'webapp'

@description('Azure region for primary deployment')
param primaryRegion string = resourceGroup().location

@description('Secondary region for disaster recovery')
param secondaryRegion string = 'East US 2'

@description('Cost center for billing allocation')
param costCenter string = 'IT-12345'

@description('Resource owner for governance tracking')
param resourceOwner string = 'IT Governance Team'

@description('Enable high availability configuration')
param enableHighAvailability bool = true

@description('Enable disaster recovery configuration')
param enableDisasterRecovery bool = false

@description('Enable monitoring and logging')
param enableMonitoring bool = true

@description('Data classification level')
@allowed(['Public', 'Internal', 'Confidential', 'Restricted'])
param dataClassification string = 'Internal'

// Variables for consistent naming and configuration
var namingConvention = {
  prefix: '${toLower(organizationCode)}-${toLower(environmentName)}'
  suffix: toLower(applicationName)
}

var resourceNames = {
  logAnalytics: '${namingConvention.prefix}-law-${namingConvention.suffix}'
  storageAccount: replace('${namingConvention.prefix}st${namingConvention.suffix}', '-', '')
  keyVault: '${namingConvention.prefix}-kv-${namingConvention.suffix}'
  appServicePlan: '${namingConvention.prefix}-asp-${namingConvention.suffix}'
  webApp: '${namingConvention.prefix}-app-${namingConvention.suffix}'
  sqlServer: '${namingConvention.prefix}-sql-${namingConvention.suffix}'
  sqlDatabase: '${namingConvention.prefix}-sqldb-${namingConvention.suffix}'
  networkSecurityGroup: '${namingConvention.prefix}-nsg-${namingConvention.suffix}'
  virtualNetwork: '${namingConvention.prefix}-vnet-${namingConvention.suffix}'
}

// Governance-compliant tags
var governanceTags = {
  Environment: environmentName
  Application: applicationName
  Owner: resourceOwner
  CostCenter: costCenter
  DataClassification: dataClassification
  Framework: 'ICT Governance Framework'
  Template: 'Multi-Cloud Infrastructure Blueprint'
  Version: '1.0.0'
  CreatedDate: utcNow('yyyy-MM-dd')
  ManagedBy: 'Infrastructure as Code'
}

// Security configuration based on data classification
var securityConfig = {
  Public: {
    tlsVersion: 'TLS1_2'
    httpsOnly: true
    publicAccess: 'Enabled'
    firewallRules: 'Basic'
  }
  Internal: {
    tlsVersion: 'TLS1_2'
    httpsOnly: true
    publicAccess: 'Disabled'
    firewallRules: 'Standard'
  }
  Confidential: {
    tlsVersion: 'TLS1_3'
    httpsOnly: true
    publicAccess: 'Disabled'
    firewallRules: 'Strict'
  }
  Restricted: {
    tlsVersion: 'TLS1_3'
    httpsOnly: true
    publicAccess: 'Disabled'
    firewallRules: 'Maximum'
  }
}

// Log Analytics Workspace for centralized monitoring
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = if (enableMonitoring) {
  name: resourceNames.logAnalytics
  location: primaryRegion
  tags: governanceTags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: environmentName == 'prod' ? 90 : 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: environmentName == 'prod' ? 10 : 1
    }
  }
}

// Storage Account with governance-compliant configuration
resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: resourceNames.storageAccount
  location: primaryRegion
  tags: governanceTags
  kind: 'StorageV2'
  sku: {
    name: enableHighAvailability ? 'Standard_GRS' : 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: securityConfig[dataClassification].publicAccess == 'Enabled'
    allowSharedKeyAccess: true
    supportsHttpsTrafficOnly: securityConfig[dataClassification].httpsOnly
    minimumTlsVersion: securityConfig[dataClassification].tlsVersion
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: dataClassification == 'Public' ? 'Allow' : 'Deny'
    }
    encryption: {
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

// Key Vault for secrets management
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: resourceNames.keyVault
  location: primaryRegion
  tags: governanceTags
  properties: {
    enabledForDeployment: true
    enabledForDiskEncryption: true
    enabledForTemplateDeployment: true
    tenantId: subscription().tenantId
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: dataClassification == 'Restricted' || dataClassification == 'Confidential'
    sku: {
      name: 'standard'
      family: 'A'
    }
    accessPolicies: []
    enableRbacAuthorization: true
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: dataClassification == 'Public' ? 'Allow' : 'Deny'
    }
  }
}

// Virtual Network for network isolation
resource virtualNetwork 'Microsoft.Network/virtualNetworks@2022-07-01' = {
  name: resourceNames.virtualNetwork
  location: primaryRegion
  tags: governanceTags
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'web-subnet'
        properties: {
          addressPrefix: '10.0.1.0/24'
          networkSecurityGroup: {
            id: networkSecurityGroup.id
          }
        }
      }
      {
        name: 'data-subnet'
        properties: {
          addressPrefix: '10.0.2.0/24'
          networkSecurityGroup: {
            id: networkSecurityGroup.id
          }
        }
      }
    ]
  }
}

// Network Security Group with governance-compliant rules
resource networkSecurityGroup 'Microsoft.Network/networkSecurityGroups@2022-07-01' = {
  name: resourceNames.networkSecurityGroup
  location: primaryRegion
  tags: governanceTags
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPS'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyHTTP'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 1100
          direction: 'Inbound'
        }
      }
    ]
  }
}

// App Service Plan for web applications
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: resourceNames.appServicePlan
  location: primaryRegion
  tags: governanceTags
  sku: {
    name: environmentName == 'prod' ? 'P1v3' : 'B1'
    tier: environmentName == 'prod' ? 'PremiumV3' : 'Basic'
  }
  properties: {
    reserved: false
  }
}

// Web Application with governance-compliant configuration
resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: resourceNames.webApp
  location: primaryRegion
  tags: governanceTags
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: securityConfig[dataClassification].httpsOnly
    siteConfig: {
      minTlsVersion: securityConfig[dataClassification].tlsVersion
      ftpsState: 'Disabled'
      alwaysOn: environmentName == 'prod'
      http20Enabled: true
      appSettings: [
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: enableMonitoring ? applicationInsights.properties.InstrumentationKey : ''
        }
      ]
    }
  }
}

// Application Insights for application monitoring
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = if (enableMonitoring) {
  name: '${resourceNames.webApp}-ai'
  location: primaryRegion
  tags: governanceTags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: enableMonitoring ? logAnalyticsWorkspace.id : null
  }
}

// SQL Server for database services
resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: resourceNames.sqlServer
  location: primaryRegion
  tags: governanceTags
  properties: {
    administratorLogin: 'sqladmin'
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: securityConfig[dataClassification].tlsVersion
    publicNetworkAccess: dataClassification == 'Public' ? 'Enabled' : 'Disabled'
  }
}

// SQL Database with appropriate tier based on environment
resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: resourceNames.sqlDatabase
  location: primaryRegion
  tags: governanceTags
  sku: {
    name: environmentName == 'prod' ? 'S2' : 'S0'
    tier: 'Standard'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: environmentName == 'prod' ? 268435456000 : 2147483648 // 250GB for prod, 2GB for others
  }
}

// Diagnostic settings for monitoring
resource webAppDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (enableMonitoring) {
  name: 'webapp-diagnostics'
  scope: webApp
  properties: {
    workspaceId: enableMonitoring ? logAnalyticsWorkspace.id : null
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

// Outputs for integration with other templates
output resourceGroupName string = resourceGroup().name
output logAnalyticsWorkspaceId string = enableMonitoring ? logAnalyticsWorkspace.id : ''
output storageAccountName string = storageAccount.name
output keyVaultName string = keyVault.name
output webAppName string = webApp.name
output sqlServerName string = sqlServer.name
output sqlDatabaseName string = sqlDatabase.name
output virtualNetworkId string = virtualNetwork.id

// Governance compliance outputs
output governanceCompliance object = {
  templateVersion: '1.0.0'
  frameworkVersion: 'ICT Governance Framework v3.2.0'
  dataClassification: dataClassification
  securityConfiguration: securityConfig[dataClassification]
  monitoringEnabled: enableMonitoring
  highAvailabilityEnabled: enableHighAvailability
  disasterRecoveryEnabled: enableDisasterRecovery
  complianceStandards: ['ISO 27001', 'NIST', 'COBIT 2019']
  deploymentDate: utcNow('yyyy-MM-dd HH:mm:ss')
}