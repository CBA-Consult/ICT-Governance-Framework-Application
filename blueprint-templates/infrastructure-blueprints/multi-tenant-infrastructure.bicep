// Multi-Tenant Infrastructure Blueprint Template
// Multi-Cloud Multi-Tenant ICT Governance Framework
// This template provides standardized multi-tenant infrastructure deployment across cloud platforms

// Template Metadata
metadata templateInfo = {
  name: 'Multi-Tenant Infrastructure Blueprint'
  description: 'Comprehensive multi-tenant infrastructure template with tenant isolation and governance controls'
  version: '1.0.0'
  author: 'ICT Governance Framework Team'
  framework: 'Multi-Cloud Multi-Tenant ICT Governance Framework'
  lastUpdated: '2024-01-15'
  compliance: ['GDPR', 'HIPAA', 'SOX', 'ISO27001']
  tenantIsolation: 'Complete'
}

// Parameters for multi-tenant configuration
@description('Tenant identifier for resource naming and isolation')
@minLength(3)
@maxLength(8)
param tenantId string

@description('Environment designation (dev, test, prod)')
@allowed(['dev', 'test', 'prod'])
param environmentName string = 'dev'

@description('Tenant classification for security and compliance')
@allowed(['enterprise', 'government', 'healthcare', 'financial', 'standard'])
param tenantClassification string = 'standard'

@description('Tenant isolation model')
@allowed(['silo', 'pool', 'hybrid'])
param isolationModel string = 'silo'

@description('Azure region for tenant deployment')
param primaryRegion string = resourceGroup().location

@description('Secondary region for disaster recovery')
param secondaryRegion string = 'East US 2'

@description('Tenant administrator email for notifications')
param tenantAdminEmail string

@description('Tenant cost center for billing allocation')
param tenantCostCenter string

@description('Compliance requirements for the tenant')
param complianceRequirements array = ['ISO27001']

@description('Service tier for the tenant')
@allowed(['premium', 'standard', 'basic'])
param serviceTier string = 'standard'

@description('Enable advanced monitoring and logging')
param enableAdvancedMonitoring bool = true

@description('Enable backup and disaster recovery')
param enableBackupDR bool = true

@description('Data residency requirements')
param dataResidency string = 'none'

// Variables for tenant-specific configuration
var tenantPrefix = '${tenantId}-${environmentName}'
var tenantTags = {
  TenantId: tenantId
  Environment: environmentName
  TenantClassification: tenantClassification
  IsolationModel: isolationModel
  ServiceTier: serviceTier
  CostCenter: tenantCostCenter
  DataResidency: dataResidency
  ComplianceRequirements: join(complianceRequirements, ',')
  CreatedBy: 'Multi-Tenant-Framework'
  CreatedDate: utcNow('yyyy-MM-dd')
}

var networkConfig = {
  silo: {
    vnetAddressSpace: '10.${take(uniqueString(tenantId), 2)}.0.0/16'
    webSubnet: '10.${take(uniqueString(tenantId), 2)}.1.0/24'
    appSubnet: '10.${take(uniqueString(tenantId), 2)}.2.0/24'
    dataSubnet: '10.${take(uniqueString(tenantId), 2)}.3.0/24'
    mgmtSubnet: '10.${take(uniqueString(tenantId), 2)}.255.0/24'
  }
  pool: {
    vnetAddressSpace: '172.16.0.0/16'
    webSubnet: '172.16.1.0/24'
    appSubnet: '172.16.2.0/24'
    dataSubnet: '172.16.3.0/24'
    mgmtSubnet: '172.16.255.0/24'
  }
  hybrid: {
    vnetAddressSpace: tenantClassification == 'enterprise' ? '10.${take(uniqueString(tenantId), 2)}.0.0/16' : '172.16.0.0/16'
    webSubnet: tenantClassification == 'enterprise' ? '10.${take(uniqueString(tenantId), 2)}.1.0/24' : '172.16.1.0/24'
    appSubnet: tenantClassification == 'enterprise' ? '10.${take(uniqueString(tenantId), 2)}.2.0/24' : '172.16.2.0/24'
    dataSubnet: tenantClassification == 'enterprise' ? '10.${take(uniqueString(tenantId), 2)}.3.0/24' : '172.16.3.0/24'
    mgmtSubnet: tenantClassification == 'enterprise' ? '10.${take(uniqueString(tenantId), 2)}.255.0/24' : '172.16.255.0/24'
  }
}

var securityConfig = {
  enterprise: {
    enableWAF: true
    enableDDoSProtection: true
    enablePrivateEndpoints: true
    enableNetworkWatcher: true
    enableJustInTimeAccess: true
  }
  government: {
    enableWAF: true
    enableDDoSProtection: true
    enablePrivateEndpoints: true
    enableNetworkWatcher: true
    enableJustInTimeAccess: true
  }
  healthcare: {
    enableWAF: true
    enableDDoSProtection: true
    enablePrivateEndpoints: true
    enableNetworkWatcher: true
    enableJustInTimeAccess: true
  }
  financial: {
    enableWAF: true
    enableDDoSProtection: true
    enablePrivateEndpoints: true
    enableNetworkWatcher: true
    enableJustInTimeAccess: true
  }
  standard: {
    enableWAF: serviceTier == 'premium'
    enableDDoSProtection: serviceTier != 'basic'
    enablePrivateEndpoints: serviceTier == 'premium'
    enableNetworkWatcher: true
    enableJustInTimeAccess: serviceTier != 'basic'
  }
}

var storageConfig = {
  premium: {
    accountType: 'Premium_LRS'
    tier: 'Premium'
    enableHierarchicalNamespace: true
    enableVersioning: true
    enableSoftDelete: true
    retentionDays: 90
  }
  standard: {
    accountType: 'Standard_GRS'
    tier: 'Standard'
    enableHierarchicalNamespace: false
    enableVersioning: true
    enableSoftDelete: true
    retentionDays: 30
  }
  basic: {
    accountType: 'Standard_LRS'
    tier: 'Standard'
    enableHierarchicalNamespace: false
    enableVersioning: false
    enableSoftDelete: true
    retentionDays: 7
  }
}

// Tenant-specific Key Vault for secrets management
resource tenantKeyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: '${tenantPrefix}-kv-${uniqueString(resourceGroup().id)}'
  location: primaryRegion
  tags: tenantTags
  properties: {
    sku: {
      family: 'A'
      name: serviceTier == 'premium' ? 'premium' : 'standard'
    }
    tenantId: subscription().tenantId
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: true
    enableSoftDelete: true
    softDeleteRetentionInDays: serviceTier == 'basic' ? 7 : 90
    enablePurgeProtection: serviceTier != 'basic'
    enableRbacAuthorization: true
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      virtualNetworkRules: []
      ipRules: []
    }
  }
}

// Tenant-specific Log Analytics Workspace
resource tenantLogAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = if (enableAdvancedMonitoring) {
  name: '${tenantPrefix}-law-${uniqueString(resourceGroup().id)}'
  location: primaryRegion
  tags: tenantTags
  properties: {
    sku: {
      name: serviceTier == 'premium' ? 'PerGB2018' : 'PerGB2018'
    }
    retentionInDays: serviceTier == 'premium' ? 730 : (serviceTier == 'standard' ? 90 : 30)
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: serviceTier == 'premium' ? 100 : (serviceTier == 'standard' ? 10 : 1)
    }
  }
}

// Tenant-specific Virtual Network with isolation
resource tenantVirtualNetwork 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: '${tenantPrefix}-vnet'
  location: primaryRegion
  tags: tenantTags
  properties: {
    addressSpace: {
      addressPrefixes: [
        networkConfig[isolationModel].vnetAddressSpace
      ]
    }
    subnets: [
      {
        name: 'web-subnet'
        properties: {
          addressPrefix: networkConfig[isolationModel].webSubnet
          networkSecurityGroup: {
            id: webNSG.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.KeyVault'
            }
          ]
        }
      }
      {
        name: 'app-subnet'
        properties: {
          addressPrefix: networkConfig[isolationModel].appSubnet
          networkSecurityGroup: {
            id: appNSG.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.KeyVault'
            }
            {
              service: 'Microsoft.Sql'
            }
          ]
        }
      }
      {
        name: 'data-subnet'
        properties: {
          addressPrefix: networkConfig[isolationModel].dataSubnet
          networkSecurityGroup: {
            id: dataNSG.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
            {
              service: 'Microsoft.KeyVault'
            }
            {
              service: 'Microsoft.Sql'
            }
          ]
        }
      }
      {
        name: 'management-subnet'
        properties: {
          addressPrefix: networkConfig[isolationModel].mgmtSubnet
          networkSecurityGroup: {
            id: mgmtNSG.id
          }
        }
      }
    ]
    enableDdosProtection: securityConfig[tenantClassification].enableDDoSProtection
  }
}

// Network Security Groups for tenant isolation
resource webNSG 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: '${tenantPrefix}-web-nsg'
  location: primaryRegion
  tags: tenantTags
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPS'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowHTTP'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1001
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4096
          direction: 'Inbound'
        }
      }
    ]
  }
}

resource appNSG 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: '${tenantPrefix}-app-nsg'
  location: primaryRegion
  tags: tenantTags
  properties: {
    securityRules: [
      {
        name: 'AllowWebTier'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '8080'
          sourceAddressPrefix: networkConfig[isolationModel].webSubnet
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4096
          direction: 'Inbound'
        }
      }
    ]
  }
}

resource dataNSG 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: '${tenantPrefix}-data-nsg'
  location: primaryRegion
  tags: tenantTags
  properties: {
    securityRules: [
      {
        name: 'AllowAppTier'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '1433'
          sourceAddressPrefix: networkConfig[isolationModel].appSubnet
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4096
          direction: 'Inbound'
        }
      }
    ]
  }
}

resource mgmtNSG 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: '${tenantPrefix}-mgmt-nsg'
  location: primaryRegion
  tags: tenantTags
  properties: {
    securityRules: [
      {
        name: 'AllowRDP'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '3389'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowSSH'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '22'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1001
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4096
          direction: 'Inbound'
        }
      }
    ]
  }
}

// Tenant-specific Storage Account with encryption
resource tenantStorageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '${tenantId}${environmentName}st${uniqueString(resourceGroup().id)}'
  location: primaryRegion
  tags: tenantTags
  sku: {
    name: storageConfig[serviceTier].accountType
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    allowCrossTenantReplication: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    isHnsEnabled: storageConfig[serviceTier].enableHierarchicalNamespace
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
      keySource: 'Microsoft.Keyvault'
      keyvaultproperties: {
        keyname: 'storage-encryption-key'
        keyvaulturi: tenantKeyVault.properties.vaultUri
      }
    }
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      virtualNetworkRules: [
        {
          id: '${tenantVirtualNetwork.id}/subnets/web-subnet'
          action: 'Allow'
        }
        {
          id: '${tenantVirtualNetwork.id}/subnets/app-subnet'
          action: 'Allow'
        }
        {
          id: '${tenantVirtualNetwork.id}/subnets/data-subnet'
          action: 'Allow'
        }
      ]
    }
  }
}

// Tenant-specific SQL Server with advanced security
resource tenantSqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: '${tenantPrefix}-sql-${uniqueString(resourceGroup().id)}'
  location: primaryRegion
  tags: tenantTags
  properties: {
    administratorLogin: 'sqladmin'
    administratorLoginPassword: 'P@ssw0rd123!' // This should be retrieved from Key Vault
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
  }
  
  resource sqlDatabase 'databases@2023-05-01-preview' = {
    name: '${tenantPrefix}-db'
    location: primaryRegion
    tags: tenantTags
    sku: {
      name: serviceTier == 'premium' ? 'S2' : (serviceTier == 'standard' ? 'S1' : 'S0')
      tier: 'Standard'
    }
    properties: {
      collation: 'SQL_Latin1_General_CP1_CI_AS'
      maxSizeBytes: serviceTier == 'premium' ? 268435456000 : (serviceTier == 'standard' ? 53687091200 : 2147483648)
      catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'
      zoneRedundant: serviceTier == 'premium'
      readScale: serviceTier == 'premium' ? 'Enabled' : 'Disabled'
      requestedBackupStorageRedundancy: serviceTier == 'premium' ? 'Geo' : 'Local'
    }
  }

  resource transparentDataEncryption 'encryptionProtector@2023-05-01-preview' = {
    name: 'current'
    properties: {
      serverKeyType: 'AzureKeyVault'
      serverKeyName: '${tenantKeyVault.name}_database-encryption-key_${uniqueString(tenantKeyVault.id)}'
    }
  }
}

// Application Insights for tenant monitoring
resource tenantAppInsights 'Microsoft.Insights/components@2020-02-02' = if (enableAdvancedMonitoring) {
  name: '${tenantPrefix}-ai'
  location: primaryRegion
  tags: tenantTags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: enableAdvancedMonitoring ? tenantLogAnalytics.id : null
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Recovery Services Vault for backup and disaster recovery
resource tenantRecoveryVault 'Microsoft.RecoveryServices/vaults@2023-06-01' = if (enableBackupDR) {
  name: '${tenantPrefix}-rsv'
  location: primaryRegion
  tags: tenantTags
  sku: {
    name: 'RS0'
    tier: 'Standard'
  }
  properties: {
    encryption: {
      keyVaultProperties: {
        keyUri: '${tenantKeyVault.properties.vaultUri}keys/backup-encryption-key'
      }
      kekIdentity: {
        useSystemAssignedIdentity: true
      }
      infrastructureEncryption: 'Enabled'
    }
  }
}

// Tenant-specific Application Gateway (if premium tier)
resource tenantAppGateway 'Microsoft.Network/applicationGateways@2023-09-01' = if (serviceTier == 'premium') {
  name: '${tenantPrefix}-agw'
  location: primaryRegion
  tags: tenantTags
  properties: {
    sku: {
      name: 'WAF_v2'
      tier: 'WAF_v2'
      capacity: 2
    }
    gatewayIPConfigurations: [
      {
        name: 'appGatewayIpConfig'
        properties: {
          subnet: {
            id: '${tenantVirtualNetwork.id}/subnets/web-subnet'
          }
        }
      }
    ]
    frontendIPConfigurations: [
      {
        name: 'appGatewayFrontendIP'
        properties: {
          publicIPAddress: {
            id: tenantPublicIP.id
          }
        }
      }
    ]
    frontendPorts: [
      {
        name: 'port_80'
        properties: {
          port: 80
        }
      }
      {
        name: 'port_443'
        properties: {
          port: 443
        }
      }
    ]
    backendAddressPools: [
      {
        name: 'appGatewayBackendPool'
        properties: {}
      }
    ]
    backendHttpSettingsCollection: [
      {
        name: 'appGatewayBackendHttpSettings'
        properties: {
          port: 80
          protocol: 'Http'
          cookieBasedAffinity: 'Disabled'
          pickHostNameFromBackendAddress: false
          requestTimeout: 20
        }
      }
    ]
    httpListeners: [
      {
        name: 'appGatewayHttpListener'
        properties: {
          frontendIPConfiguration: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendIPConfigurations', '${tenantPrefix}-agw', 'appGatewayFrontendIP')
          }
          frontendPort: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendPorts', '${tenantPrefix}-agw', 'port_80')
          }
          protocol: 'Http'
        }
      }
    ]
    requestRoutingRules: [
      {
        name: 'rule1'
        properties: {
          ruleType: 'Basic'
          httpListener: {
            id: resourceId('Microsoft.Network/applicationGateways/httpListeners', '${tenantPrefix}-agw', 'appGatewayHttpListener')
          }
          backendAddressPool: {
            id: resourceId('Microsoft.Network/applicationGateways/backendAddressPools', '${tenantPrefix}-agw', 'appGatewayBackendPool')
          }
          backendHttpSettings: {
            id: resourceId('Microsoft.Network/applicationGateways/backendHttpSettingsCollection', '${tenantPrefix}-agw', 'appGatewayBackendHttpSettings')
          }
        }
      }
    ]
    webApplicationFirewallConfiguration: {
      enabled: true
      firewallMode: 'Prevention'
      ruleSetType: 'OWASP'
      ruleSetVersion: '3.2'
      disabledRuleGroups: []
      requestBodyCheck: true
      maxRequestBodySizeInKb: 128
      fileUploadLimitInMb: 100
    }
  }
}

// Public IP for Application Gateway
resource tenantPublicIP 'Microsoft.Network/publicIPAddresses@2023-09-01' = if (serviceTier == 'premium') {
  name: '${tenantPrefix}-pip'
  location: primaryRegion
  tags: tenantTags
  sku: {
    name: 'Standard'
    tier: 'Regional'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    dnsSettings: {
      domainNameLabel: '${tenantPrefix}-${uniqueString(resourceGroup().id)}'
    }
  }
}

// Outputs for tenant information
output tenantInfo object = {
  tenantId: tenantId
  environment: environmentName
  classification: tenantClassification
  isolationModel: isolationModel
  serviceTier: serviceTier
  primaryRegion: primaryRegion
  resourceGroupName: resourceGroup().name
}

output networkInfo object = {
  virtualNetworkId: tenantVirtualNetwork.id
  virtualNetworkName: tenantVirtualNetwork.name
  addressSpace: networkConfig[isolationModel].vnetAddressSpace
  subnets: {
    web: networkConfig[isolationModel].webSubnet
    app: networkConfig[isolationModel].appSubnet
    data: networkConfig[isolationModel].dataSubnet
    management: networkConfig[isolationModel].mgmtSubnet
  }
}

output securityInfo object = {
  keyVaultId: tenantKeyVault.id
  keyVaultName: tenantKeyVault.name
  keyVaultUri: tenantKeyVault.properties.vaultUri
  networkSecurityGroups: {
    web: webNSG.id
    app: appNSG.id
    data: dataNSG.id
    management: mgmtNSG.id
  }
}

output storageInfo object = {
  storageAccountId: tenantStorageAccount.id
  storageAccountName: tenantStorageAccount.name
  primaryEndpoints: tenantStorageAccount.properties.primaryEndpoints
}

output databaseInfo object = {
  sqlServerId: tenantSqlServer.id
  sqlServerName: tenantSqlServer.name
  databaseId: tenantSqlServer::sqlDatabase.id
  databaseName: tenantSqlServer::sqlDatabase.name
}

output monitoringInfo object = {
  logAnalyticsWorkspaceId: enableAdvancedMonitoring ? tenantLogAnalytics.id : null
  applicationInsightsId: enableAdvancedMonitoring ? tenantAppInsights.id : null
  instrumentationKey: enableAdvancedMonitoring ? tenantAppInsights.properties.InstrumentationKey : null
}

output complianceInfo object = {
  complianceRequirements: complianceRequirements
  dataResidency: dataResidency
  encryptionEnabled: true
  backupEnabled: enableBackupDR
  monitoringEnabled: enableAdvancedMonitoring
  networkIsolation: isolationModel
  securityControls: securityConfig[tenantClassification]
}