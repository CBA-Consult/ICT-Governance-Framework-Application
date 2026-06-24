// Global Hub Foundation — regional hub VNet with Azure-required subnets
// Deploy into an existing hub resource group (rg-hub-apac | rg-hub-emea | rg-hub-amers)
// Registry: adpa/infrastructure/global-network-hubs.json

@description('Hub identifier (hub-apac, hub-emea, hub-amers)')
@allowed([
  'hub-apac'
  'hub-emea'
  'hub-amers'
])
param hubId string

@description('Hub VNet address space (must match global-network-hubs.json)')
param hubAddressSpace string

@description('GatewaySubnet prefix — name is fixed by Azure')
param gatewaySubnetPrefix string

@description('AzureFirewallSubnet prefix — name is fixed by Azure')
param firewallSubnetPrefix string

@description('AzureBastionSubnet prefix — name is fixed by Azure')
param bastionSubnetPrefix string

@description('Shared services subnet prefix')
param sharedServicesSubnetPrefix string

@description('Environment tag value')
param environmentName string = 'prod'

@description('Cost center for billing allocation')
param costCenter string = 'NET-GLOBAL-HUB'

var hubTags = {
  HubId: hubId
  Topology: 'hub-spoke-regional'
  Pillar: 'network'
  Environment: environmentName
  CostCenter: costCenter
  ManagedBy: 'ADPA-ICT-GOV'
}

resource hubVnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: 'vnet-${hubId}-01'
  location: resourceGroup().location
  tags: hubTags
  properties: {
    addressSpace: {
      addressPrefixes: [
        hubAddressSpace
      ]
    }
    subnets: [
      {
        name: 'GatewaySubnet'
        properties: {
          addressPrefix: gatewaySubnetPrefix
        }
      }
      {
        name: 'AzureFirewallSubnet'
        properties: {
          addressPrefix: firewallSubnetPrefix
        }
      }
      {
        name: 'AzureBastionSubnet'
        properties: {
          addressPrefix: bastionSubnetPrefix
        }
      }
      {
        name: 'snet-shared'
        properties: {
          addressPrefix: sharedServicesSubnetPrefix
        }
      }
    ]
  }
}

output hubVnetId string = hubVnet.id
output hubVnetName string = hubVnet.name
output hubAddressSpace string = hubAddressSpace
output subnetNames array = [
  'GatewaySubnet'
  'AzureFirewallSubnet'
  'AzureBastionSubnet'
  'snet-shared'
]
