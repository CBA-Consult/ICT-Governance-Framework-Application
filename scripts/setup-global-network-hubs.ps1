#Requires -Version 5.1
<#
.SYNOPSIS
  Provisions global hub resource groups, VNets, and required subnets for APAC, EMEA, and AMERS.
.DESCRIPTION
  Implements adpa/infrastructure/global-network-hubs.json.
  Idempotent at each step (resource group, VNet, subnet).
  Azure Firewall, VPN Gateway, ExpressRoute Gateway, and Azure Bastion are NOT deployed by default.
  Use -PrivateDnsOnly for Step 10 private DNS zones and VNet links.
  Use -PrivateLinkOnly for Step 11 private endpoints and DNS zone groups.
#>
param(
  [string]$RegistryPath = (Join-Path $PSScriptRoot '..\adpa\infrastructure\global-network-hubs.json'),
  [string]$SpokeRegistryPath = (Join-Path $PSScriptRoot '..\adpa\infrastructure\spoke-hub-peering.json'),
  [string]$PrivateDnsRegistryPath = (Join-Path $PSScriptRoot '..\adpa\infrastructure\private-dns-zones.json'),
  [string]$PrivateLinkRegistryPath = (Join-Path $PSScriptRoot '..\adpa\infrastructure\private-link-endpoints.json'),
  [switch]$ResourceGroupsOnly,
  [switch]$VnetsOnly,
  [switch]$SubnetsOnly,
  [switch]$FirewallOnly,
  [switch]$VpnGatewayOnly,
  [switch]$ExpressRouteGatewayOnly,
  [switch]$BastionOnly,
  [switch]$GlobalPeeringOnly,
  [switch]$SpokePeeringOnly,
  [switch]$SpokeRoutingOnly,
  [switch]$PrivateDnsOnly,
  [switch]$PrivateLinkOnly,
  [string]$HubId = '',
  [string]$SpokeId = '',
  [string]$TenantId = '',
  [switch]$AcknowledgeFirewallCost,
  [switch]$AcknowledgeVpnGatewayCost,
  [switch]$AcknowledgeExpressRouteGatewayCost,
  [switch]$AcknowledgeBastionCost,
  [switch]$AcknowledgeGlobalPeeringCost,
  [switch]$AcknowledgeSpokePeeringCost,
  [switch]$AcknowledgeSpokeRoutingCost,
  [switch]$AcknowledgePrivateDnsCost,
  [switch]$AcknowledgePrivateLinkCost
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
  Write-Error 'Azure CLI (az) is required. Install from https://learn.microsoft.com/cli/azure/install-azure-cli'
}

if (-not (Test-Path $RegistryPath)) {
  Write-Error "Registry not found: $RegistryPath"
}

$registry = Get-Content $RegistryPath -Raw | ConvertFrom-Json
$tags = @{}
foreach ($prop in $registry.governanceTags.PSObject.Properties) {
  $tags[$prop.Name] = [string]$prop.Value
}

function Get-HubTags([object]$Hub) {
  return @(
    "ManagedBy=$($tags.ManagedBy)",
    "Topology=$($tags.Topology)",
    "Pillar=$($tags.Pillar)",
    "DriftClass=$($tags.DriftClass)",
    "HubId=$($Hub.hubId)",
    "RegionCode=$($Hub.regionCode)"
  )
}

function Test-SubnetExists([string]$Rg, [string]$Vnet, [string]$Subnet) {
  az network vnet subnet show --resource-group $Rg --vnet-name $Vnet --name $Subnet --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Test-VnetExists([string]$Rg, [string]$Vnet) {
  az network vnet show --resource-group $Rg --name $Vnet --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Test-FirewallExists([string]$Rg, [string]$Name) {
  az network firewall show --resource-group $Rg --name $Name --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Test-PublicIpExists([string]$Rg, [string]$Name) {
  az network public-ip show --resource-group $Rg --name $Name --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Test-FirewallIpConfigExists([string]$Rg, [string]$Firewall, [string]$IpConfig) {
  az network firewall ip-config show --resource-group $Rg --firewall-name $Firewall --name $IpConfig --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Test-VnetGatewayExists([string]$Rg, [string]$Name) {
  az network vnet-gateway show --resource-group $Rg --name $Name --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Get-VnetGatewaysInGroup([string]$Rg) {
  $json = az network vnet-gateway list --resource-group $Rg --query '[].{name:name,gatewayType:gatewayType}' -o json 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($json)) {
    return @()
  }
  return @($json | ConvertFrom-Json)
}

function Test-BastionExists([string]$Rg, [string]$Name) {
  az network bastion show --resource-group $Rg --name $Name --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Test-VnetPeeringExists([string]$Rg, [string]$Vnet, [string]$PeeringName) {
  az network vnet peering show --resource-group $Rg --vnet-name $Vnet --name $PeeringName --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Get-HubById([object[]]$Hubs, [string]$Id) {
  $hub = @($Hubs | Where-Object { $_.hubId -eq $Id } | Select-Object -First 1)
  if ($hub.Count -eq 0) {
    Write-Error "HubId '$Id' not found in registry."
  }
  return $hub[0]
}

function Get-VnetResourceId([string]$Rg, [string]$Vnet) {
  $id = az network vnet show --resource-group $Rg --name $Vnet --query id -o tsv
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($id)) {
    Write-Error "Unable to resolve VNet resource ID for $Vnet in $Rg."
  }
  return $id.Trim()
}

function New-VnetPeeringLeg(
  [string]$LocalRg,
  [string]$LocalVnet,
  [string]$RemoteRg,
  [string]$RemoteVnet,
  [string]$PeeringName,
  [object]$Options
) {
  $remoteId = Get-VnetResourceId $RemoteRg $RemoteVnet

  if (Test-VnetPeeringExists $LocalRg $LocalVnet $PeeringName) {
    Write-Host "[skip] $LocalVnet/$PeeringName already exists" -ForegroundColor Yellow
    return
  }

  if (-not (Test-VnetExists $LocalRg $LocalVnet)) {
    Write-Error "VNet $LocalVnet not found in $LocalRg."
  }
  if (-not (Test-VnetExists $RemoteRg $RemoteVnet)) {
    Write-Error "Remote VNet $RemoteVnet not found in $RemoteRg."
  }

  Write-Host "[create] $LocalVnet/$PeeringName -> $RemoteVnet" -ForegroundColor Green
  $allowVnetAccess = if ($null -ne $Options.allowVnetAccess) { [bool]$Options.allowVnetAccess } else { $true }
  $allowForwarded = if ($null -ne $Options.allowForwardedTraffic) { [bool]$Options.allowForwardedTraffic } else { $false }
  $allowGatewayTransit = if ($null -ne $Options.allowGatewayTransit) { [bool]$Options.allowGatewayTransit } else { $false }
  $useRemoteGateways = if ($null -ne $Options.useRemoteGateways) { [bool]$Options.useRemoteGateways } else { $false }

  az network vnet peering create `
    --name $PeeringName `
    --resource-group $LocalRg `
    --vnet-name $LocalVnet `
    --remote-vnet $remoteId `
    --allow-vnet-access $(if ($allowVnetAccess) { 'true' } else { 'false' }) `
    --allow-forwarded-traffic $(if ($allowForwarded) { 'true' } else { 'false' }) `
    --allow-gateway-transit $(if ($allowGatewayTransit) { 'true' } else { 'false' }) `
    --use-remote-gateways $(if ($useRemoteGateways) { 'true' } else { 'false' }) | Out-Null
}

function New-HubPeeringLeg(
  [object]$LocalHub,
  [object]$RemoteHub,
  [string]$PeeringName,
  [object]$Options
) {
  New-VnetPeeringLeg `
    $LocalHub.resourceGroupName `
    $LocalHub.vnetName `
    $RemoteHub.resourceGroupName `
    $RemoteHub.vnetName `
    $PeeringName `
    $Options
}

function Resolve-PeeringNameTemplate([string]$Template, [string]$SpokeId) {
  return $Template.Replace('{spokeId}', $SpokeId)
}

function Resolve-RouteTableNameTemplate([string]$Template, [object]$Hub) {
  return $Template.Replace('{regionCode}', $Hub.regionCode.ToLowerInvariant())
}

function Test-RouteTableExists([string]$Rg, [string]$Name) {
  az network route-table show --resource-group $Rg --name $Name --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Test-RouteTableRouteExists([string]$Rg, [string]$RouteTable, [string]$RouteName) {
  az network route-table route show --resource-group $Rg --route-table-name $RouteTable --name $RouteName --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Get-FirewallPrivateIp([string]$Rg, [string]$FirewallName) {
  $queries = @(
    "ipConfigurations[?name=='configuration'].privateIPAddress | [0]",
    'ipConfigurations[0].privateIPAddress',
    'ipConfigurations[0].properties.privateIPAddress'
  )
  foreach ($query in $queries) {
    $ip = az network firewall show --resource-group $Rg --name $FirewallName --query $query -o tsv 2>$null
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($ip)) {
      return $ip.Trim()
    }
  }
  Write-Error "Unable to resolve private IP for firewall $FirewallName in $Rg. Deploy the hub firewall (Step 4) first."
}

function Get-RouteTableResourceId([string]$Rg, [string]$Name) {
  $id = az network route-table show --resource-group $Rg --name $Name --query id -o tsv
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($id)) {
    Write-Error "Unable to resolve route table ID for $Name in $Rg."
  }
  return $id.Trim()
}

function Get-FilteredSpokes([object]$SpokeRegistry) {
  if (-not $SpokeRegistry.spokes) {
    Write-Error 'spokes not defined in spoke registry.'
  }
  $spokes = @($SpokeRegistry.spokes)
  if (-not [string]::IsNullOrWhiteSpace($SpokeId)) {
    $spokes = @($spokes | Where-Object { $_.spokeId -eq $SpokeId })
    if ($spokes.Count -eq 0) { Write-Error "SpokeId '$SpokeId' not found in spoke registry." }
  }
  if (-not [string]::IsNullOrWhiteSpace($HubId)) {
    $spokes = @($spokes | Where-Object { $_.hubId -eq $HubId })
    if ($spokes.Count -eq 0) { Write-Error "No spokes reference HubId '$HubId'." }
  }
  if (-not [string]::IsNullOrWhiteSpace($TenantId)) {
    $spokes = @($spokes | Where-Object { $_.tenantId -eq $TenantId })
    if ($spokes.Count -eq 0) { Write-Error "No spokes reference TenantId '$TenantId'." }
  }
  return $spokes
}

function Resolve-DnsLinkNameTemplate([string]$Template, [object]$Hub, [string]$SpokeId = '') {
  $name = $Template.Replace('{regionCode}', $Hub.regionCode.ToLowerInvariant())
  if (-not [string]::IsNullOrWhiteSpace($SpokeId)) {
    $name = $name.Replace('{spokeId}', $SpokeId)
  }
  return $name
}

function Test-PrivateDnsZoneExists([string]$Rg, [string]$Zone) {
  az network private-dns zone show --resource-group $Rg --name $Zone --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Test-PrivateDnsVnetLinkExists([string]$Rg, [string]$Zone, [string]$LinkName) {
  az network private-dns link vnet show --resource-group $Rg --zone-name $Zone --name $LinkName --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function New-PrivateDnsVnetLink(
  [string]$ZoneRg,
  [string]$ZoneName,
  [string]$LinkName,
  [string]$VnetRg,
  [string]$VnetName,
  [bool]$RegistrationEnabled
) {
  if (-not (Test-VnetExists $VnetRg $VnetName)) {
    Write-Error "VNet $VnetName not found in $VnetRg."
  }
  if (Test-PrivateDnsVnetLinkExists $ZoneRg $ZoneName $LinkName) {
    Write-Host "[skip] $ZoneName/$LinkName already linked to $VnetName" -ForegroundColor Yellow
    return
  }
  $vnetId = Get-VnetResourceId $VnetRg $VnetName
  Write-Host "[create] link $LinkName on $ZoneName -> $VnetName" -ForegroundColor Green
  az network private-dns link vnet create `
    --resource-group $ZoneRg `
    --zone-name $ZoneName `
    --name $LinkName `
    --virtual-network $vnetId `
    --registration-enabled $(if ($RegistrationEnabled) { 'true' } else { 'false' }) | Out-Null
}

function Get-SubscriptionId {
  return (az account show --query id -o tsv).Trim()
}

function Resolve-TargetResourceId([object]$Endpoint, [string]$SubscriptionId) {
  if ($Endpoint.targetResourceId) {
    return [string]$Endpoint.targetResourceId
  }
  if (-not $Endpoint.target) {
    return $null
  }
  $t = $Endpoint.target
  return "/subscriptions/$SubscriptionId/resourceGroups/$($t.resourceGroupName)/providers/$($t.resourceType)/$($t.resourceName)"
}

function Test-ArmResourceExists([string]$ResourceId) {
  az resource show --ids $ResourceId --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Test-PrivateEndpointExists([string]$Rg, [string]$Name) {
  az network private-endpoint show --resource-group $Rg --name $Name --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Test-PrivateEndpointDnsZoneGroupExists([string]$Rg, [string]$EndpointName, [string]$GroupName) {
  az network private-endpoint dns-zone-group show `
    --resource-group $Rg `
    --endpoint-name $EndpointName `
    --name $GroupName `
    --only-show-errors 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Enable-SubnetPrivateEndpointPolicies([string]$Rg, [string]$VnetName, [string]$SubnetName) {
  $policies = az network vnet subnet show `
    --resource-group $Rg `
    --vnet-name $VnetName `
    --name $SubnetName `
    --query privateEndpointNetworkPolicies -o tsv
  if ($policies -ne 'Disabled') {
    Write-Host "[update] disable private-endpoint network policies on $VnetName/$SubnetName" -ForegroundColor Green
    az network vnet subnet update `
      --resource-group $Rg `
      --vnet-name $VnetName `
      --name $SubnetName `
      --disable-private-endpoint-network-policies true | Out-Null
  }
}

function Get-SpokeById([object]$SpokeRegistry, [string]$SpokeIdValue) {
  $spoke = @($SpokeRegistry.spokes | Where-Object { $_.spokeId -eq $SpokeIdValue })
  if ($spoke.Count -eq 0) {
    Write-Error "SpokeId '$SpokeIdValue' not found in spoke registry."
  }
  return $spoke[0]
}

function Get-FilteredPrivateLinkEndpoints([object]$LinkRegistry, [object]$SpokeRegistry) {
  if (-not $LinkRegistry.privateLink -or -not $LinkRegistry.privateLink.endpoints) {
    Write-Error 'privateLink.endpoints not defined in private link registry.'
  }
  $endpoints = @($LinkRegistry.privateLink.endpoints)
  if (-not [string]::IsNullOrWhiteSpace($SpokeId)) {
    $endpoints = @($endpoints | Where-Object { $_.spokeId -eq $SpokeId })
    if ($endpoints.Count -eq 0) {
      Write-Error "No private link endpoints reference SpokeId '$SpokeId'."
    }
  }
  if (-not [string]::IsNullOrWhiteSpace($HubId)) {
    $hubSpokeIds = @($SpokeRegistry.spokes | Where-Object { $_.hubId -eq $HubId } | ForEach-Object { $_.spokeId })
    $endpoints = @($endpoints | Where-Object { $hubSpokeIds -contains $_.spokeId })
    if ($endpoints.Count -eq 0) {
      Write-Error "No private link endpoints reference HubId '$HubId'."
    }
  }
  if (-not [string]::IsNullOrWhiteSpace($TenantId)) {
    $tenantSpokeIds = @($SpokeRegistry.spokes | Where-Object { $_.tenantId -eq $TenantId } | ForEach-Object { $_.spokeId })
    $endpoints = @($endpoints | Where-Object { $tenantSpokeIds -contains $_.spokeId })
    if ($endpoints.Count -eq 0) {
      Write-Error "No private link endpoints reference TenantId '$TenantId'."
    }
  }
  return $endpoints
}

$addOnOnly = $FirewallOnly -or $VpnGatewayOnly -or $ExpressRouteGatewayOnly -or $BastionOnly -or $GlobalPeeringOnly -or $SpokePeeringOnly -or $SpokeRoutingOnly -or $PrivateDnsOnly -or $PrivateLinkOnly
$addOnFlagCount = @(
  $FirewallOnly.IsPresent,
  $VpnGatewayOnly.IsPresent,
  $ExpressRouteGatewayOnly.IsPresent,
  $BastionOnly.IsPresent,
  $GlobalPeeringOnly.IsPresent,
  $SpokePeeringOnly.IsPresent,
  $SpokeRoutingOnly.IsPresent,
  $PrivateDnsOnly.IsPresent,
  $PrivateLinkOnly.IsPresent
) | Where-Object { $_ } | Measure-Object | Select-Object -ExpandProperty Count
if ($addOnFlagCount -gt 1) {
  Write-Error 'Use only one add-on flag per run: -FirewallOnly, -VpnGatewayOnly, -ExpressRouteGatewayOnly, -BastionOnly, -GlobalPeeringOnly, -SpokePeeringOnly, -SpokeRoutingOnly, -PrivateDnsOnly, or -PrivateLinkOnly.'
}

$provisionResourceGroups = (-not $VnetsOnly) -and (-not $SubnetsOnly) -and (-not $addOnOnly)
$provisionVnets = (-not $ResourceGroupsOnly) -and (-not $SubnetsOnly) -and (-not $addOnOnly)
$provisionSubnets = (-not $ResourceGroupsOnly) -and (-not $VnetsOnly) -and (-not $addOnOnly)
$provisionFirewall = $FirewallOnly.IsPresent
$provisionVpnGateway = $VpnGatewayOnly.IsPresent
$provisionExpressRouteGateway = $ExpressRouteGatewayOnly.IsPresent
$provisionBastion = $BastionOnly.IsPresent
$provisionGlobalPeering = $GlobalPeeringOnly.IsPresent
$provisionSpokePeering = $SpokePeeringOnly.IsPresent
$provisionSpokeRouting = $SpokeRoutingOnly.IsPresent
$provisionPrivateDns = $PrivateDnsOnly.IsPresent
$provisionPrivateLink = $PrivateLinkOnly.IsPresent

function Get-TargetHubs([object[]]$Hubs) {
  if ([string]::IsNullOrWhiteSpace($HubId)) {
    return $Hubs
  }
  $filtered = @($Hubs | Where-Object { $_.hubId -eq $HubId })
  if ($filtered.Count -eq 0) {
    Write-Error "HubId '$HubId' not found in registry."
  }
  return $filtered
}

if ($provisionResourceGroups) {
  Write-Host "Provisioning $($registry.hubs.Count) global hub resource groups..." -ForegroundColor Cyan
  foreach ($hub in $registry.hubs) {
    $rg = $hub.resourceGroupName
    $location = $hub.azureLocation
    $exists = az group exists --name $rg | ConvertFrom-Json
    if ($exists) {
      Write-Host "[skip] $rg already exists ($location)" -ForegroundColor Yellow
      continue
    }
    Write-Host "[create] $rg in $location ($($hub.displayName))" -ForegroundColor Green
    az group create --name $rg --location $location --tags (Get-HubTags $hub) | Out-Null
  }
  Write-Host 'Global hub resource groups ready.' -ForegroundColor Cyan
}

if ($provisionVnets) {
  Write-Host "Provisioning $($registry.hubs.Count) global hub VNets..." -ForegroundColor Cyan
  foreach ($hub in $registry.hubs) {
    $rg = $hub.resourceGroupName
    $vnet = $hub.vnetName
    $location = $hub.azureLocation
    $prefix = $hub.hubAddressSpace

    if (Test-VnetExists $rg $vnet) {
      Write-Host "[skip] $vnet already exists in $rg" -ForegroundColor Yellow
      continue
    }

    Write-Host "[create] $vnet ($prefix) in $rg ($location)" -ForegroundColor Green
    az network vnet create `
      --name $vnet `
      --resource-group $rg `
      --location $location `
      --address-prefix $prefix `
      --tags (Get-HubTags $hub) | Out-Null
  }
  Write-Host 'Global hub VNets ready.' -ForegroundColor Cyan
}

if ($provisionSubnets) {
  Write-Host "Provisioning hub subnets (Azure-required names)..." -ForegroundColor Cyan
  foreach ($hub in $registry.hubs) {
    $rg = $hub.resourceGroupName
    $vnet = $hub.vnetName

    if (-not (Test-VnetExists $rg $vnet)) {
      Write-Error "VNet $vnet not found in $rg. Create the VNet before adding subnets."
    }

    foreach ($subnet in $hub.subnets) {
      $name = $subnet.name
      $prefix = $subnet.addressPrefix

      if (Test-SubnetExists $rg $vnet $name) {
        Write-Host "[skip] $vnet/$name already exists" -ForegroundColor Yellow
        continue
      }

      Write-Host "[create] $vnet/$name ($prefix)" -ForegroundColor Green
      az network vnet subnet create `
        --vnet-name $vnet `
        --resource-group $rg `
        --name $name `
        --address-prefix $prefix | Out-Null
    }
  }
  Write-Host 'Global hub subnets ready.' -ForegroundColor Cyan
}

if ($provisionFirewall) {
  if (-not $AcknowledgeFirewallCost) {
    Write-Error @"
Azure Firewall is a paid Azure add-on (Standard ~`$912/month per hub + ~`$0.016/GB processed, plus public IP).
It is never deployed by the default hub script. Re-run with -FirewallOnly -AcknowledgeFirewallCost after client approval.
Optional: -HubId hub-apac to provision a single region.
"@
  }

  $firewallHubs = Get-TargetHubs @($registry.hubs)
  Write-Host "Provisioning Azure Firewall add-on for $($firewallHubs.Count) hub(s)..." -ForegroundColor Cyan
  foreach ($hub in $firewallHubs) {
    $rg = $hub.resourceGroupName
    $location = $hub.azureLocation
    $vnet = $hub.vnetName
    $fw = $hub.firewall

    if (-not $fw) {
      Write-Host "[skip] $($hub.hubId) has no firewall definition" -ForegroundColor Yellow
      continue
    }

    if (-not (Test-SubnetExists $rg $vnet 'AzureFirewallSubnet')) {
      Write-Error "AzureFirewallSubnet missing on $vnet. Run with -SubnetsOnly first."
    }

    if (-not (Test-PublicIpExists $rg $fw.publicIpName)) {
      Write-Host "[create] public IP $($fw.publicIpName) ($location)" -ForegroundColor Green
      az network public-ip create `
        --name $fw.publicIpName `
        --resource-group $rg `
        --location $location `
        --sku $fw.publicIpSku | Out-Null
    } else {
      Write-Host "[skip] public IP $($fw.publicIpName) already exists" -ForegroundColor Yellow
    }

    if (-not (Test-FirewallExists $rg $fw.firewallName)) {
      Write-Host "[create] firewall $($fw.firewallName) ($location)" -ForegroundColor Green
      az network firewall create `
        --name $fw.firewallName `
        --resource-group $rg `
        --location $location `
        --sku-name $fw.firewallSku | Out-Null
    } else {
      Write-Host "[skip] firewall $($fw.firewallName) already exists" -ForegroundColor Yellow
    }

    if (-not (Test-FirewallIpConfigExists $rg $fw.firewallName $fw.ipConfigName)) {
      Write-Host "[create] firewall ip-config $($fw.ipConfigName) on $vnet" -ForegroundColor Green
      az network firewall ip-config create `
        --firewall-name $fw.firewallName `
        --name $fw.ipConfigName `
        --public-ip-address $fw.publicIpName `
        --resource-group $rg `
        --vnet-name $vnet | Out-Null
    } else {
      Write-Host "[skip] firewall ip-config $($fw.ipConfigName) already exists" -ForegroundColor Yellow
    }
  }
  Write-Host 'Regional Azure Firewalls ready.' -ForegroundColor Cyan
}

if ($provisionVpnGateway) {
  if (-not $AcknowledgeVpnGatewayCost) {
    Write-Error @"
VPN Gateway is a paid Azure add-on (VpnGw1AZ ~`$153/month per hub + public IP, hourly while provisioned).
It is never deployed by the default hub script. Re-run with -VpnGatewayOnly -AcknowledgeVpnGatewayCost after client approval.
Optional: -HubId hub-apac for a single region. Mutually exclusive with ExpressRoute gateway on the same hub.
"@
  }

  $vpnHubs = Get-TargetHubs @($registry.hubs)
  Write-Host "Provisioning VPN Gateway add-on for $($vpnHubs.Count) hub(s)..." -ForegroundColor Cyan
  foreach ($hub in $vpnHubs) {
    $rg = $hub.resourceGroupName
    $location = $hub.azureLocation
    $vnet = $hub.vnetName
    $gw = $hub.vpnGateway

    if (-not $gw) {
      Write-Host "[skip] $($hub.hubId) has no vpnGateway definition" -ForegroundColor Yellow
      continue
    }

    if (-not (Test-SubnetExists $rg $vnet 'GatewaySubnet')) {
      Write-Error "GatewaySubnet missing on $vnet. Run with -SubnetsOnly first."
    }

    $existingGateways = Get-VnetGatewaysInGroup $rg
    $otherGateway = @($existingGateways | Where-Object { $_.name -ne $gw.gatewayName })
    if ($otherGateway.Count -gt 0) {
      $inUse = ($otherGateway | ForEach-Object { "$($_.name) ($($_.gatewayType))" }) -join ', '
      Write-Error "GatewaySubnet already in use in $rg`: $inUse. VPN and ExpressRoute gateways are mutually exclusive per hub."
    }

    if ($gw.publicIpName) {
      if (-not (Test-PublicIpExists $rg $gw.publicIpName)) {
        Write-Host "[create] public IP $($gw.publicIpName) ($location)" -ForegroundColor Green
        az network public-ip create `
          --name $gw.publicIpName `
          --resource-group $rg `
          --location $location `
          --sku $gw.publicIpSku | Out-Null
      } else {
        Write-Host "[skip] public IP $($gw.publicIpName) already exists" -ForegroundColor Yellow
      }
    }

    if (-not (Test-VnetGatewayExists $rg $gw.gatewayName)) {
      Write-Host "[create] VPN gateway $($gw.gatewayName) ($($gw.sku)) on $vnet — may take 20-45 minutes" -ForegroundColor Green
      $createArgs = @(
        'network', 'vnet-gateway', 'create',
        '--name', $gw.gatewayName,
        '--resource-group', $rg,
        '--location', $location,
        '--vnet', $vnet,
        '--gateway-type', $gw.gatewayType,
        '--vpn-type', $gw.vpnType,
        '--sku', $gw.sku
      )
      if ($gw.publicIpName) {
        $createArgs += @('--public-ip-address', $gw.publicIpName)
      }
      az @createArgs | Out-Null
    } else {
      Write-Host "[skip] VPN gateway $($gw.gatewayName) already exists" -ForegroundColor Yellow
    }
  }
  Write-Host 'Regional VPN Gateways ready (or still provisioning in Azure).' -ForegroundColor Cyan
}

if ($provisionExpressRouteGateway) {
  if (-not $AcknowledgeExpressRouteGatewayCost) {
    Write-Error @"
ExpressRoute Gateway is a paid Azure add-on (ErGw1AZ ~`$264/month per hub, hourly while provisioned).
ExpressRoute circuit bandwidth is billed separately. Re-run with -ExpressRouteGatewayOnly -AcknowledgeExpressRouteGatewayCost after client approval.
Optional: -HubId hub-apac for a single region. Mutually exclusive with VPN gateway on the same hub.
"@
  }

  $erHubs = Get-TargetHubs @($registry.hubs)
  Write-Host "Provisioning ExpressRoute Gateway add-on for $($erHubs.Count) hub(s)..." -ForegroundColor Cyan
  foreach ($hub in $erHubs) {
    $rg = $hub.resourceGroupName
    $location = $hub.azureLocation
    $vnet = $hub.vnetName
    $gw = $hub.expressRouteGateway

    if (-not $gw) {
      Write-Host "[skip] $($hub.hubId) has no expressRouteGateway definition" -ForegroundColor Yellow
      continue
    }

    if (-not (Test-SubnetExists $rg $vnet 'GatewaySubnet')) {
      Write-Error "GatewaySubnet missing on $vnet. Run with -SubnetsOnly first."
    }

    $existingGateways = Get-VnetGatewaysInGroup $rg
    $otherGateway = @($existingGateways | Where-Object { $_.name -ne $gw.gatewayName })
    if ($otherGateway.Count -gt 0) {
      $inUse = ($otherGateway | ForEach-Object { "$($_.name) ($($_.gatewayType))" }) -join ', '
      Write-Error "GatewaySubnet already in use in $rg`: $inUse. VPN and ExpressRoute gateways are mutually exclusive per hub."
    }

    if (-not (Test-VnetGatewayExists $rg $gw.gatewayName)) {
      Write-Host "[create] ExpressRoute gateway $($gw.gatewayName) ($($gw.sku)) on $vnet — may take 20-45 minutes" -ForegroundColor Green
      az network vnet-gateway create `
        --name $gw.gatewayName `
        --resource-group $rg `
        --location $location `
        --vnet $vnet `
        --gateway-type $gw.gatewayType `
        --sku $gw.sku | Out-Null
    } else {
      Write-Host "[skip] ExpressRoute gateway $($gw.gatewayName) already exists" -ForegroundColor Yellow
    }
  }
  Write-Host 'Regional ExpressRoute Gateways ready (or still provisioning in Azure).' -ForegroundColor Cyan
}

if ($provisionBastion) {
  if (-not $AcknowledgeBastionCost) {
    Write-Error @"
Azure Bastion is a paid Azure add-on (Basic ~`$139/month per hub + public IP, hourly while provisioned).
It is never deployed by the default hub script. Re-run with -BastionOnly -AcknowledgeBastionCost after client approval.
Optional: -HubId hub-apac for a single region. Developer SKU is free but not used for production hubs.
"@
  }

  $bastionHubs = Get-TargetHubs @($registry.hubs)
  Write-Host "Provisioning Azure Bastion add-on for $($bastionHubs.Count) hub(s)..." -ForegroundColor Cyan
  foreach ($hub in $bastionHubs) {
    $rg = $hub.resourceGroupName
    $location = $hub.azureLocation
    $vnet = $hub.vnetName
    $bas = $hub.bastion

    if (-not $bas) {
      Write-Host "[skip] $($hub.hubId) has no bastion definition" -ForegroundColor Yellow
      continue
    }

    if (-not (Test-SubnetExists $rg $vnet 'AzureBastionSubnet')) {
      Write-Error "AzureBastionSubnet missing on $vnet. Run with -SubnetsOnly first (minimum /26 required)."
    }

    if (-not (Test-PublicIpExists $rg $bas.publicIpName)) {
      Write-Host "[create] public IP $($bas.publicIpName) ($location)" -ForegroundColor Green
      az network public-ip create `
        --name $bas.publicIpName `
        --resource-group $rg `
        --location $location `
        --sku $bas.publicIpSku | Out-Null
    } else {
      Write-Host "[skip] public IP $($bas.publicIpName) already exists" -ForegroundColor Yellow
    }

    if (-not (Test-BastionExists $rg $bas.bastionName)) {
      Write-Host "[create] bastion $($bas.bastionName) ($($bas.sku)) on $vnet — may take several minutes" -ForegroundColor Green
      az network bastion create `
        --name $bas.bastionName `
        --resource-group $rg `
        --location $location `
        --vnet-name $vnet `
        --public-ip-address $bas.publicIpName `
        --sku $bas.sku | Out-Null
    } else {
      Write-Host "[skip] bastion $($bas.bastionName) already exists" -ForegroundColor Yellow
    }
  }
  Write-Host 'Regional Azure Bastion hosts ready (or still provisioning in Azure).' -ForegroundColor Cyan
}

if ($provisionGlobalPeering) {
  if (-not $AcknowledgeGlobalPeeringCost) {
    Write-Error @"
Global VNet peering has no hourly fee but cross-region data transfer is billed per GB (varies by region pair).
Re-run with -GlobalPeeringOnly -AcknowledgeGlobalPeeringCost after client approval.
Optional: -HubId hub-apac to configure only peering links touching that hub.
"@
  }

  $peeringConfig = $registry.globalHubPeering
  if (-not $peeringConfig -or -not $peeringConfig.links) {
    Write-Error 'globalHubPeering.links not defined in registry.'
  }

  $links = @($peeringConfig.links)
  if (-not [string]::IsNullOrWhiteSpace($HubId)) {
    $links = @($links | Where-Object { $_.hubA -eq $HubId -or $_.hubB -eq $HubId })
    if ($links.Count -eq 0) {
      Write-Error "No globalHubPeering links reference HubId '$HubId'."
    }
  }

  $options = $peeringConfig.defaultOptions
  Write-Host "Configuring global hub VNet peering ($($links.Count) link(s), $($peeringConfig.topology))..." -ForegroundColor Cyan
  foreach ($link in $links) {
    $hubA = Get-HubById @($registry.hubs) $link.hubA
    $hubB = Get-HubById @($registry.hubs) $link.hubB
    New-HubPeeringLeg $hubA $hubB $link.peeringNameAtoB $options
    New-HubPeeringLeg $hubB $hubA $link.peeringNameBtoA $options
  }
  Write-Host 'Global hub VNet peering configured (verify Connected state in Azure portal).' -ForegroundColor Cyan
}

if ($provisionSpokePeering) {
  if (-not $AcknowledgeSpokePeeringCost) {
    Write-Error @"
Spoke-to-hub VNet peering has no hourly fee but same-region data transfer is billed per GB (~`$0.02/GB total typical).
Re-run with -SpokePeeringOnly -AcknowledgeSpokePeeringCost after client approval.
Optional: -SpokeId app-apac-prod, -HubId hub-apac, or -TenantId tenant-contoso-health to limit scope.
useRemoteGateways requires a deployed hub VPN/ExpressRoute gateway. Firewall inspection requires spoke UDRs to the hub firewall IP.
"@
  }

  if (-not (Test-Path $SpokeRegistryPath)) {
    Write-Error "Spoke registry not found: $SpokeRegistryPath"
  }

  $spokeRegistry = Get-Content $SpokeRegistryPath -Raw | ConvertFrom-Json
  $spokes = Get-FilteredSpokes $spokeRegistry

  $policy = $spokeRegistry.spokePeeringPolicy
  if (-not $policy) {
    Write-Error 'spokePeeringPolicy not defined in spoke registry.'
  }

  Write-Host "Configuring spoke-to-hub peering for $($spokes.Count) workload VNet(s)..." -ForegroundColor Cyan
  foreach ($spoke in $spokes) {
    $hub = Get-HubById @($registry.hubs) $spoke.hubId
    $hubLegName = Resolve-PeeringNameTemplate $policy.hubLeg.peeringNameTemplate $spoke.spokeId
    $spokeLegName = $policy.spokeLeg.peeringName

    Write-Host "--- $($spoke.spokeId) ($($spoke.vnetName)) -> $($hub.vnetName) ---" -ForegroundColor Cyan
    New-VnetPeeringLeg `
      $spoke.resourceGroupName `
      $spoke.vnetName `
      $hub.resourceGroupName `
      $hub.vnetName `
      $spokeLegName `
      $policy.spokeLeg
    New-VnetPeeringLeg `
      $hub.resourceGroupName `
      $hub.vnetName `
      $spoke.resourceGroupName `
      $spoke.vnetName `
      $hubLegName `
      $policy.hubLeg
  }
  Write-Host 'Spoke-to-hub peering configured (verify Connected state; deploy hub gateway before relying on useRemoteGateways).' -ForegroundColor Cyan
  Write-Host "Spoke registry: $SpokeRegistryPath"
}

if ($provisionSpokeRouting) {
  if (-not $AcknowledgeSpokeRoutingCost) {
    Write-Error @"
Spoke UDR routing forces traffic via the hub Azure Firewall (VirtualAppliance next hop).
Route tables are free; inspected traffic incurs Azure Firewall hourly + per-GB processing charges.
Re-run with -SpokeRoutingOnly -AcknowledgeSpokeRoutingCost after hub firewall (Step 4) and spoke peering (Step 8).
Optional: -SpokeId app-apac-prod, -HubId hub-apac, or -TenantId tenant-contoso-health.
"@
  }

  if (-not (Test-Path $SpokeRegistryPath)) {
    Write-Error "Spoke registry not found: $SpokeRegistryPath"
  }

  $spokeRegistry = Get-Content $SpokeRegistryPath -Raw | ConvertFrom-Json
  $routing = $spokeRegistry.spokeRouting
  if (-not $routing) {
    Write-Error 'spokeRouting not defined in spoke registry.'
  }

  $spokes = Get-FilteredSpokes $spokeRegistry
  $hubGroups = $spokes | Group-Object -Property hubId

  Write-Host "Configuring spoke UDR routing for $($spokes.Count) workload VNet(s) across $($hubGroups.Count) hub(s)..." -ForegroundColor Cyan
  foreach ($hubGroup in $hubGroups) {
    $hub = Get-HubById @($registry.hubs) $hubGroup.Name
    $fw = $hub.firewall
    if (-not $fw) {
      Write-Error "Hub $($hub.hubId) has no firewall definition in hub registry."
    }

    $rtRg = if ($routing.routeTableResourceGroup -eq 'hub') { $hub.resourceGroupName } else { $routing.routeTableResourceGroup }
    $rtName = Resolve-RouteTableNameTemplate $routing.routeTableNameTemplate $hub
    $firewallIp = Get-FirewallPrivateIp $hub.resourceGroupName $fw.firewallName
    $defaultRoute = $routing.defaultRoute

    if (-not (Test-RouteTableExists $rtRg $rtName)) {
      Write-Host "[create] route table $rtName in $rtRg ($($hub.azureLocation))" -ForegroundColor Green
      az network route-table create `
        --name $rtName `
        --resource-group $rtRg `
        --location $hub.azureLocation `
        --tags (Get-HubTags $hub) | Out-Null
    } else {
      Write-Host "[skip] route table $rtName already exists in $rtRg" -ForegroundColor Yellow
    }

    if (-not (Test-RouteTableRouteExists $rtRg $rtName $defaultRoute.name)) {
      Write-Host "[create] route $($defaultRoute.name) -> $firewallIp (VirtualAppliance)" -ForegroundColor Green
      az network route-table route create `
        --resource-group $rtRg `
        --route-table-name $rtName `
        --name $defaultRoute.name `
        --address-prefix $defaultRoute.addressPrefix `
        --next-hop-type $defaultRoute.nextHopType `
        --next-hop-ip-address $firewallIp | Out-Null
    } else {
      Write-Host "[skip] route $($defaultRoute.name) already exists on $rtName" -ForegroundColor Yellow
    }

    $rtId = Get-RouteTableResourceId $rtRg $rtName

    foreach ($spoke in $hubGroup.Group) {
      $subnetNames = @($spoke.routeTableAssociation.subnetNames)
      if ($subnetNames.Count -eq 0) {
        Write-Error "Spoke $($spoke.spokeId) has no routeTableAssociation.subnetNames defined."
      }

      Write-Host "--- $($spoke.spokeId): associate $rtName with subnets ---" -ForegroundColor Cyan
      foreach ($subnetName in $subnetNames) {
        if (-not (Test-SubnetExists $spoke.resourceGroupName $spoke.vnetName $subnetName)) {
          Write-Error "Subnet $subnetName not found on $($spoke.vnetName). Create the spoke subnet before associating routes."
        }
        Write-Host "[associate] $($spoke.vnetName)/$subnetName -> $rtName" -ForegroundColor Green
        az network vnet subnet update `
          --resource-group $spoke.resourceGroupName `
          --vnet-name $spoke.vnetName `
          --name $subnetName `
          --route-table $rtId | Out-Null
      }
    }
  }
  Write-Host 'Spoke UDR routing configured (verify effective routes on spoke VMs).' -ForegroundColor Cyan
  Write-Host "Spoke registry: $SpokeRegistryPath"
}

if ($provisionPrivateDns) {
  if (-not $AcknowledgePrivateDnsCost) {
    Write-Error @"
Private DNS zones are a paid Azure add-on (~`$0.50/zone/month per region plus query charges).
Re-run with -PrivateDnsOnly -AcknowledgePrivateDnsCost after client approval.
Optional: -HubId hub-apac. Links hub VNet and registered spoke VNets with registration-enabled false.
"@
  }

  if (-not (Test-Path $PrivateDnsRegistryPath)) {
    Write-Error "Private DNS registry not found: $PrivateDnsRegistryPath"
  }

  $dnsRegistry = Get-Content $PrivateDnsRegistryPath -Raw | ConvertFrom-Json
  $dnsConfig = $dnsRegistry.privateDns
  if (-not $dnsConfig -or -not $dnsConfig.zones) {
    Write-Error 'privateDns.zones not defined in private DNS registry.'
  }

  $registrationEnabled = [bool]$dnsConfig.registrationEnabledDefault
  $dnsHubs = Get-TargetHubs @($registry.hubs)

  $spokesByHub = @{}
  if ($dnsConfig.linkSpokeVnets -and (Test-Path $SpokeRegistryPath)) {
    $spokeRegistry = Get-Content $SpokeRegistryPath -Raw | ConvertFrom-Json
    foreach ($spoke in (Get-FilteredSpokes $spokeRegistry)) {
      if (-not $spokesByHub.ContainsKey($spoke.hubId)) {
        $spokesByHub[$spoke.hubId] = @()
      }
      $spokesByHub[$spoke.hubId] += $spoke
    }
  }

  Write-Host "Configuring private DNS for $($dnsHubs.Count) hub region(s), $($dnsConfig.zones.Count) zone(s)..." -ForegroundColor Cyan
  foreach ($hub in $dnsHubs) {
    $zoneRg = if ($dnsConfig.resourceGroup -eq 'hub') { $hub.resourceGroupName } else { $dnsConfig.resourceGroup }
    Write-Host "--- $($hub.hubId) ($zoneRg) ---" -ForegroundColor Cyan

    foreach ($zone in $dnsConfig.zones) {
      if (-not (Test-PrivateDnsZoneExists $zoneRg $zone.zoneName)) {
        Write-Host "[create] private DNS zone $($zone.zoneName)" -ForegroundColor Green
        az network private-dns zone create `
          --resource-group $zoneRg `
          --name $zone.zoneName | Out-Null
      } else {
        Write-Host "[skip] private DNS zone $($zone.zoneName) already exists" -ForegroundColor Yellow
      }

      if ($dnsConfig.linkHubVnet) {
        $hubLinkName = Resolve-DnsLinkNameTemplate $dnsConfig.hubLinkNameTemplate $hub
        New-PrivateDnsVnetLink $zoneRg $zone.zoneName $hubLinkName $hub.resourceGroupName $hub.vnetName $registrationEnabled
      }

      if ($dnsConfig.linkSpokeVnets -and $spokesByHub.ContainsKey($hub.hubId)) {
        foreach ($spoke in $spokesByHub[$hub.hubId]) {
          $spokeLinkName = Resolve-DnsLinkNameTemplate $dnsConfig.spokeLinkNameTemplate $hub $spoke.spokeId
          New-PrivateDnsVnetLink $zoneRg $zone.zoneName $spokeLinkName $spoke.resourceGroupName $spoke.vnetName $registrationEnabled
        }
      }
    }
  }
  Write-Host 'Private DNS zones and VNet links configured.' -ForegroundColor Cyan
  Write-Host "Private DNS registry: $PrivateDnsRegistryPath"
}

if ($provisionPrivateLink) {
  if (-not $AcknowledgePrivateLinkCost) {
    Write-Error @"
Private Link endpoints are a paid Azure add-on (~`$0.01/hour per endpoint plus data processing).
Re-run with -PrivateLinkOnly -AcknowledgePrivateLinkCost after client approval and target PaaS resources exist.
Optional: -SpokeId app-apac-prod, -HubId hub-apac, -TenantId tenant-contoso-health.
Prerequisite: Step 10 private DNS zones must exist in the hub region.
"@
  }

  if (-not (Test-Path $PrivateLinkRegistryPath)) {
    Write-Error "Private link registry not found: $PrivateLinkRegistryPath"
  }
  if (-not (Test-Path $SpokeRegistryPath)) {
    Write-Error "Spoke registry not found: $SpokeRegistryPath"
  }

  $linkRegistry = Get-Content $PrivateLinkRegistryPath -Raw | ConvertFrom-Json
  $linkConfig = $linkRegistry.privateLink
  $spokeRegistry = Get-Content $SpokeRegistryPath -Raw | ConvertFrom-Json
  $endpoints = Get-FilteredPrivateLinkEndpoints $linkRegistry $spokeRegistry
  $subscriptionId = Get-SubscriptionId
  $skipIfTargetMissing = [bool]$linkConfig.skipIfTargetMissing
  $dnsZoneGroupName = if ($linkConfig.dnsZoneGroupName) { $linkConfig.dnsZoneGroupName } else { 'default' }

  Write-Host "Provisioning $($endpoints.Count) private link endpoint(s)..." -ForegroundColor Cyan
  foreach ($endpoint in $endpoints) {
    $spoke = Get-SpokeById $spokeRegistry $endpoint.spokeId
    $hub = Get-HubById $registry.hubs $spoke.hubId
    $subnetName = if ($endpoint.subnetName) { $endpoint.subnetName } else { $linkConfig.defaultSubnetName }
    $endpointRg = if ($endpoint.resourceGroupName) { $endpoint.resourceGroupName } else { $spoke.resourceGroupName }
    $connectionName = if ($endpoint.connectionName) {
      $endpoint.connectionName
    } else {
      $linkConfig.connectionNameTemplate.Replace('{endpointName}', $endpoint.endpointName)
    }
    $targetId = Resolve-TargetResourceId $endpoint $subscriptionId
    if ([string]::IsNullOrWhiteSpace($targetId)) {
      Write-Error "Endpoint $($endpoint.endpointId) has no targetResourceId or target definition."
    }

    Write-Host "--- $($endpoint.endpointId) ($($endpoint.endpointName)) ---" -ForegroundColor Cyan

    if (-not (Test-ArmResourceExists $targetId)) {
      if ($skipIfTargetMissing) {
        Write-Host "[skip] target resource not found: $targetId" -ForegroundColor Yellow
        continue
      }
      Write-Error "Target resource not found: $targetId. Deploy the PaaS resource first or set skipIfTargetMissing."
    }

    if (-not (Test-SubnetExists $spoke.resourceGroupName $spoke.vnetName $subnetName)) {
      Write-Error "Subnet $subnetName not found on $($spoke.vnetName). Create the spoke data subnet before private endpoints."
    }

    $zoneRg = if ($linkConfig.dnsZoneResourceGroup -eq 'hub') { $hub.resourceGroupName } else { $linkConfig.dnsZoneResourceGroup }
    if (-not (Test-PrivateDnsZoneExists $zoneRg $endpoint.privateDnsZoneName)) {
      Write-Error "Private DNS zone $($endpoint.privateDnsZoneName) not found in $zoneRg. Run Step 10 (-PrivateDnsOnly) first."
    }

    Enable-SubnetPrivateEndpointPolicies $spoke.resourceGroupName $spoke.vnetName $subnetName

    if (-not (Test-PrivateEndpointExists $endpointRg $endpoint.endpointName)) {
      Write-Host "[create] private endpoint $($endpoint.endpointName) on $subnetName -> $targetId" -ForegroundColor Green
      az network private-endpoint create `
        --name $endpoint.endpointName `
        --resource-group $endpointRg `
        --vnet-name $spoke.vnetName `
        --subnet $subnetName `
        --location $hub.azureLocation `
        --private-connection-resource-id $targetId `
        --group-id $endpoint.groupId `
        --connection-name $connectionName | Out-Null
    } else {
      Write-Host "[skip] private endpoint $($endpoint.endpointName) already exists in $endpointRg" -ForegroundColor Yellow
    }

    if (-not (Test-PrivateEndpointDnsZoneGroupExists $endpointRg $endpoint.endpointName $dnsZoneGroupName)) {
      $zoneId = (az network private-dns zone show `
        --resource-group $zoneRg `
        --name $endpoint.privateDnsZoneName `
        --query id -o tsv).Trim()
      Write-Host "[create] DNS zone group $dnsZoneGroupName -> $($endpoint.privateDnsZoneName)" -ForegroundColor Green
      az network private-endpoint dns-zone-group create `
        --resource-group $endpointRg `
        --endpoint-name $endpoint.endpointName `
        --name $dnsZoneGroupName `
        --private-dns-zone $zoneId `
        --zone-name $endpoint.privateDnsZoneName | Out-Null
    } else {
      Write-Host "[skip] DNS zone group $dnsZoneGroupName already exists on $($endpoint.endpointName)" -ForegroundColor Yellow
    }
  }
  Write-Host 'Private link endpoints configured (verify DNS resolution from spoke workloads).' -ForegroundColor Cyan
  Write-Host "Private link registry: $PrivateLinkRegistryPath"
}

Write-Host "Registry: $RegistryPath"
