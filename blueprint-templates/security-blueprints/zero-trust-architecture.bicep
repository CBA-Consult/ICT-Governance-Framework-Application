// Zero Trust Architecture Blueprint Template
// CBA Consult IT Management Framework - Task 3 Implementation
// This template provides a standardized approach to Zero Trust security architecture

// Template Metadata
metadata templateInfo = {
  name: 'Zero Trust Architecture Blueprint'
  version: '1.0.0'
  description: 'Standardized template for Zero Trust security architecture implementation'
  author: 'CBA Consult ICT Governance Team'
  framework: 'ICT Governance Framework v3.2.0'
  compliance: ['NIST Zero Trust', 'ISO 27001', 'NIST Cybersecurity Framework']
  lastUpdated: '2025-08-07'
}

// Parameters with security-focused defaults
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
param applicationName string = 'zerotrust'

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Cost center for billing allocation')
param costCenter string = 'SEC-12345'

@description('Security team contact for governance tracking')
param securityOwner string = 'Security Operations Team'

@description('Enable advanced threat protection')
param enableAdvancedThreatProtection bool = true

@description('Enable conditional access policies')
param enableConditionalAccess bool = true

@description('Enable network segmentation')
param enableNetworkSegmentation bool = true

@description('Data classification level for Zero Trust policies')
@allowed(['Public', 'Internal', 'Confidential', 'Restricted'])
param dataClassification string = 'Confidential'

@description('Compliance requirements')
param complianceRequirements array = ['ISO27001', 'NIST', 'SOC2']

// Variables for Zero Trust implementation
var namingConvention = {
  prefix: '${organizationCode}-${applicationName}-${environmentName}'
  suffix: uniqueString(resourceGroup().id)
}

var resourceNames = {
  logAnalytics: '${namingConvention.prefix}-la-${namingConvention.suffix}'
  keyVault: '${namingConvention.prefix}-kv-${namingConvention.suffix}'
  virtualNetwork: '${namingConvention.prefix}-vnet-${namingConvention.suffix}'
  networkSecurityGroup: '${namingConvention.prefix}-nsg-${namingConvention.suffix}'
  applicationGateway: '${namingConvention.prefix}-agw-${namingConvention.suffix}'
  firewallPolicy: '${namingConvention.prefix}-fwp-${namingConvention.suffix}'
  privateEndpoint: '${namingConvention.prefix}-pe-${namingConvention.suffix}'
}

var governanceTags = {
  Environment: environmentName
  Organization: organizationCode
  Application: applicationName
  CostCenter: costCenter
  Owner: securityOwner
  DataClassification: dataClassification
  Compliance: join(complianceRequirements, ',')
  Framework: 'ICT-Governance-v3.2.0'
  CreatedDate: utcNow('yyyy-MM-dd')
  ZeroTrustEnabled: 'true'
}

var zeroTrustConfig = {
  networkSegmentation: {
    enableMicrosegmentation: enableNetworkSegmentation
    defaultDenyAll: true
    explicitAllowRules: true
  }
  identityVerification: {
    enableMFA: true
    enableConditionalAccess: enableConditionalAccess
    enablePrivilegedAccess: true
  }
  deviceCompliance: {
    enableDeviceCompliance: true
    enableDeviceEncryption: true
    enableDeviceManagement: true
  }
  dataProtection: {
    enableEncryptionAtRest: true
    enableEncryptionInTransit: true
    enableDataLossPrevention: true
  }
  monitoring: {
    enableSecurityMonitoring: true
    enableThreatDetection: enableAdvancedThreatProtection
    enableAuditLogging: true
  }
}

// Log Analytics Workspace for Security Monitoring
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
      disableLocalAuth: true
    }
    workspaceCapping: {
      dailyQuotaGb: environmentName == 'prod' ? 100 : 10
    }
  }
}

// Key Vault for Secrets Management
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
    enabledForTemplateDeployment: false
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    enableRbacAuthorization: true
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Deny'
      ipRules: []
      virtualNetworkRules: []
    }
    publicNetworkAccess: 'Disabled'
  }
}

// Virtual Network with Zero Trust Network Segmentation
resource virtualNetwork 'Microsoft.Network/virtualNetworks@2022-07-01' = {
  name: resourceNames.virtualNetwork
  location: location
  tags: governanceTags
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'TrustedSubnet'
        properties: {
          addressPrefix: '10.0.1.0/24'
          networkSecurityGroup: {
            id: trustedNetworkSecurityGroup.id
          }
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
        }
      }
      {
        name: 'UnTrustedSubnet'
        properties: {
          addressPrefix: '10.0.2.0/24'
          networkSecurityGroup: {
            id: untrustedNetworkSecurityGroup.id
          }
          privateEndpointNetworkPolicies: 'Enabled'
          privateLinkServiceNetworkPolicies: 'Enabled'
        }
      }
      {
        name: 'ManagementSubnet'
        properties: {
          addressPrefix: '10.0.3.0/24'
          networkSecurityGroup: {
            id: managementNetworkSecurityGroup.id
          }
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
        }
      }
      {
        name: 'AzureFirewallSubnet'
        properties: {
          addressPrefix: '10.0.4.0/24'
        }
      }
    ]
    enableDdosProtection: environmentName == 'prod'
  }
}

// Network Security Group for Trusted Zone
resource trustedNetworkSecurityGroup 'Microsoft.Network/networkSecurityGroups@2022-07-01' = {
  name: '${resourceNames.networkSecurityGroup}-trusted'
  location: location
  tags: governanceTags
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPSInbound'
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

// Network Security Group for Untrusted Zone
resource untrustedNetworkSecurityGroup 'Microsoft.Network/networkSecurityGroups@2022-07-01' = {
  name: '${resourceNames.networkSecurityGroup}-untrusted'
  location: location
  tags: governanceTags
  properties: {
    securityRules: [
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
      {
        name: 'DenyAllOutbound'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4096
          direction: 'Outbound'
        }
      }
    ]
  }
}

// Network Security Group for Management Zone
resource managementNetworkSecurityGroup 'Microsoft.Network/networkSecurityGroups@2022-07-01' = {
  name: '${resourceNames.networkSecurityGroup}-mgmt'
  location: location
  tags: governanceTags
  properties: {
    securityRules: [
      {
        name: 'AllowSSHFromBastion'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '22'
          sourceAddressPrefix: '10.0.5.0/24'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowRDPFromBastion'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '3389'
          sourceAddressPrefix: '10.0.5.0/24'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1001
          direction: 'Inbound'
        }
      }
      {
        name: 'DenyAllOtherInbound'
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

// Azure Firewall for Network Traffic Inspection
resource azureFirewall 'Microsoft.Network/azureFirewalls@2022-07-01' = if (enableNetworkSegmentation) {
  name: '${namingConvention.prefix}-fw-${namingConvention.suffix}'
  location: location
  tags: governanceTags
  properties: {
    sku: {
      name: 'AZFW_VNet'
      tier: 'Premium'
    }
    threatIntelMode: 'Alert'
    ipConfigurations: [
      {
        name: 'configuration'
        properties: {
          publicIPAddress: {
            id: firewallPublicIP.id
          }
          subnet: {
            id: '${virtualNetwork.id}/subnets/AzureFirewallSubnet'
          }
        }
      }
    ]
    firewallPolicy: {
      id: firewallPolicy.id
    }
  }
}

// Public IP for Azure Firewall
resource firewallPublicIP 'Microsoft.Network/publicIPAddresses@2022-07-01' = if (enableNetworkSegmentation) {
  name: '${namingConvention.prefix}-fw-pip-${namingConvention.suffix}'
  location: location
  tags: governanceTags
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    publicIPAddressVersion: 'IPv4'
  }
}

// Firewall Policy for Zero Trust Rules
resource firewallPolicy 'Microsoft.Network/firewallPolicies@2022-07-01' = if (enableNetworkSegmentation) {
  name: resourceNames.firewallPolicy
  location: location
  tags: governanceTags
  properties: {
    sku: {
      tier: 'Premium'
    }
    threatIntelMode: 'Alert'
    threatIntelWhitelist: {
      fqdns: []
      ipAddresses: []
    }
    dnsSettings: {
      servers: []
      enableProxy: true
    }
    intrusionDetection: {
      mode: 'Alert'
    }
  }
}

// Private Endpoint for Key Vault
resource keyVaultPrivateEndpoint 'Microsoft.Network/privateEndpoints@2022-07-01' = {
  name: '${resourceNames.privateEndpoint}-kv'
  location: location
  tags: governanceTags
  properties: {
    subnet: {
      id: '${virtualNetwork.id}/subnets/TrustedSubnet'
    }
    privateLinkServiceConnections: [
      {
        name: 'keyVaultConnection'
        properties: {
          privateLinkServiceId: keyVault.id
          groupIds: [
            'vault'
          ]
        }
      }
    ]
  }
}

// Security Center Configuration
resource securityCenterWorkspace 'Microsoft.Security/workspaceSettings@2017-08-01-preview' = {
  name: 'default'
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    scope: subscription().id
  }
}

// Diagnostic Settings for Security Monitoring
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

resource networkSecurityGroupDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'nsgDiagnostics'
  scope: trustedNetworkSecurityGroup
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'NetworkSecurityGroupEvent'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 365 : 90
        }
      }
      {
        category: 'NetworkSecurityGroupRuleCounter'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 365 : 90
        }
      }
    ]
  }
}

// Outputs for governance and compliance tracking
output zeroTrustCompliance object = {
  templateVersion: '1.0.0'
  deploymentTimestamp: utcNow()
  complianceFrameworks: complianceRequirements
  securityControls: {
    networkSegmentation: zeroTrustConfig.networkSegmentation
    identityVerification: zeroTrustConfig.identityVerification
    deviceCompliance: zeroTrustConfig.deviceCompliance
    dataProtection: zeroTrustConfig.dataProtection
    monitoring: zeroTrustConfig.monitoring
  }
  resourceIds: {
    logAnalyticsWorkspace: logAnalyticsWorkspace.id
    keyVault: keyVault.id
    virtualNetwork: virtualNetwork.id
    azureFirewall: enableNetworkSegmentation ? azureFirewall.id : ''
  }
}

output securityEndpoints object = {
  keyVaultUri: keyVault.properties.vaultUri
  logAnalyticsWorkspaceId: logAnalyticsWorkspace.properties.customerId
  virtualNetworkId: virtualNetwork.id
  firewallPrivateIP: enableNetworkSegmentation ? azureFirewall.properties.ipConfigurations[0].properties.privateIPAddress : ''
}