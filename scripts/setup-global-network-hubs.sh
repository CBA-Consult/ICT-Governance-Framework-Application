#!/usr/bin/env bash
# Provisions global hub resource groups, VNets, and required subnets for APAC, EMEA, and AMERS.
# Billable add-ons (firewall, VPN gateway, ExpressRoute gateway) require explicit flags and cost acknowledgment.
# Registry: adpa/infrastructure/global-network-hubs.json
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGISTRY="$ROOT/adpa/infrastructure/global-network-hubs.json"
RESOURCE_GROUPS_ONLY="${RESOURCE_GROUPS_ONLY:-0}"
VNETS_ONLY="${VNETS_ONLY:-0}"
SUBNETS_ONLY="${SUBNETS_ONLY:-0}"
FIREWALL_ONLY="${FIREWALL_ONLY:-0}"
VPN_GATEWAY_ONLY="${VPN_GATEWAY_ONLY:-0}"
EXPRESSROUTE_GATEWAY_ONLY="${EXPRESSROUTE_GATEWAY_ONLY:-0}"
BASTION_ONLY="${BASTION_ONLY:-0}"
GLOBAL_PEERING_ONLY="${GLOBAL_PEERING_ONLY:-0}"
SPOKE_PEERING_ONLY="${SPOKE_PEERING_ONLY:-0}"
SPOKE_ROUTING_ONLY="${SPOKE_ROUTING_ONLY:-0}"
PRIVATE_DNS_ONLY="${PRIVATE_DNS_ONLY:-0}"
PRIVATE_LINK_ONLY="${PRIVATE_LINK_ONLY:-0}"
SPOKE_REGISTRY="${SPOKE_REGISTRY:-$ROOT/adpa/infrastructure/spoke-hub-peering.json}"
PRIVATE_DNS_REGISTRY="${PRIVATE_DNS_REGISTRY:-$ROOT/adpa/infrastructure/private-dns-zones.json}"
PRIVATE_LINK_REGISTRY="${PRIVATE_LINK_REGISTRY:-$ROOT/adpa/infrastructure/private-link-endpoints.json}"
HUB_ID="${HUB_ID:-}"
SPOKE_ID="${SPOKE_ID:-}"
TENANT_ID="${TENANT_ID:-}"
ACKNOWLEDGE_FIREWALL_COST="${ACKNOWLEDGE_FIREWALL_COST:-0}"
ACKNOWLEDGE_VPN_GATEWAY_COST="${ACKNOWLEDGE_VPN_GATEWAY_COST:-0}"
ACKNOWLEDGE_EXPRESSROUTE_GATEWAY_COST="${ACKNOWLEDGE_EXPRESSROUTE_GATEWAY_COST:-0}"
ACKNOWLEDGE_BASTION_COST="${ACKNOWLEDGE_BASTION_COST:-0}"
ACKNOWLEDGE_GLOBAL_PEERING_COST="${ACKNOWLEDGE_GLOBAL_PEERING_COST:-0}"
ACKNOWLEDGE_SPOKE_PEERING_COST="${ACKNOWLEDGE_SPOKE_PEERING_COST:-0}"
ACKNOWLEDGE_SPOKE_ROUTING_COST="${ACKNOWLEDGE_SPOKE_ROUTING_COST:-0}"
ACKNOWLEDGE_PRIVATE_DNS_COST="${ACKNOWLEDGE_PRIVATE_DNS_COST:-0}"
ACKNOWLEDGE_PRIVATE_LINK_COST="${ACKNOWLEDGE_PRIVATE_LINK_COST:-0}"

add_on_count=0
[[ "$FIREWALL_ONLY" == "1" ]] && add_on_count=$((add_on_count + 1))
[[ "$VPN_GATEWAY_ONLY" == "1" ]] && add_on_count=$((add_on_count + 1))
[[ "$EXPRESSROUTE_GATEWAY_ONLY" == "1" ]] && add_on_count=$((add_on_count + 1))
[[ "$BASTION_ONLY" == "1" ]] && add_on_count=$((add_on_count + 1))
[[ "$GLOBAL_PEERING_ONLY" == "1" ]] && add_on_count=$((add_on_count + 1))
[[ "$SPOKE_PEERING_ONLY" == "1" ]] && add_on_count=$((add_on_count + 1))
[[ "$SPOKE_ROUTING_ONLY" == "1" ]] && add_on_count=$((add_on_count + 1))
[[ "$PRIVATE_DNS_ONLY" == "1" ]] && add_on_count=$((add_on_count + 1))
[[ "$PRIVATE_LINK_ONLY" == "1" ]] && add_on_count=$((add_on_count + 1))
if [[ "$add_on_count" -gt 1 ]]; then
  echo "Use only one add-on flag per run: FIREWALL_ONLY, VPN_GATEWAY_ONLY, EXPRESSROUTE_GATEWAY_ONLY, BASTION_ONLY, GLOBAL_PEERING_ONLY, SPOKE_PEERING_ONLY, SPOKE_ROUTING_ONLY, PRIVATE_DNS_ONLY, or PRIVATE_LINK_ONLY." >&2
  exit 1
fi

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI (az) is required." >&2
  exit 1
fi

if [[ ! -f "$REGISTRY" ]]; then
  echo "Registry not found: $REGISTRY" >&2
  exit 1
fi

node - "$REGISTRY" "$SPOKE_REGISTRY" "$PRIVATE_DNS_REGISTRY" "$PRIVATE_LINK_REGISTRY" "$RESOURCE_GROUPS_ONLY" "$VNETS_ONLY" "$SUBNETS_ONLY" "$FIREWALL_ONLY" "$VPN_GATEWAY_ONLY" "$EXPRESSROUTE_GATEWAY_ONLY" "$BASTION_ONLY" "$GLOBAL_PEERING_ONLY" "$SPOKE_PEERING_ONLY" "$SPOKE_ROUTING_ONLY" "$PRIVATE_DNS_ONLY" "$PRIVATE_LINK_ONLY" "$HUB_ID" "$SPOKE_ID" "$TENANT_ID" "$ACKNOWLEDGE_FIREWALL_COST" "$ACKNOWLEDGE_VPN_GATEWAY_COST" "$ACKNOWLEDGE_EXPRESSROUTE_GATEWAY_COST" "$ACKNOWLEDGE_BASTION_COST" "$ACKNOWLEDGE_GLOBAL_PEERING_COST" "$ACKNOWLEDGE_SPOKE_PEERING_COST" "$ACKNOWLEDGE_SPOKE_ROUTING_COST" "$ACKNOWLEDGE_PRIVATE_DNS_COST" "$ACKNOWLEDGE_PRIVATE_LINK_COST" <<'NODE'
const fs = require('fs');
const { execSync } = require('child_process');

const registryPath = process.argv[1];
const spokeRegistryPath = process.argv[2];
const privateDnsRegistryPath = process.argv[3];
const privateLinkRegistryPath = process.argv[4];
const resourceGroupsOnly = process.argv[5] === '1';
const vnetsOnly = process.argv[6] === '1';
const subnetsOnly = process.argv[7] === '1';
const firewallOnly = process.argv[8] === '1';
const vpnGatewayOnly = process.argv[9] === '1';
const expressRouteGatewayOnly = process.argv[10] === '1';
const bastionOnly = process.argv[11] === '1';
const globalPeeringOnly = process.argv[12] === '1';
const spokePeeringOnly = process.argv[13] === '1';
const spokeRoutingOnly = process.argv[14] === '1';
const privateDnsOnly = process.argv[15] === '1';
const privateLinkOnly = process.argv[16] === '1';
const hubIdFilter = process.argv[17] || '';
const spokeIdFilter = process.argv[18] || '';
const tenantIdFilter = process.argv[19] || '';
const acknowledgeFirewallCost = process.argv[20] === '1';
const acknowledgeVpnGatewayCost = process.argv[21] === '1';
const acknowledgeExpressRouteGatewayCost = process.argv[22] === '1';
const acknowledgeBastionCost = process.argv[23] === '1';
const acknowledgeGlobalPeeringCost = process.argv[24] === '1';
const acknowledgeSpokePeeringCost = process.argv[25] === '1';
const acknowledgeSpokeRoutingCost = process.argv[26] === '1';
const acknowledgePrivateDnsCost = process.argv[27] === '1';
const acknowledgePrivateLinkCost = process.argv[28] === '1';
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const baseTags = registry.governanceTags || {};

function tagString(hub) {
  const tags = { ...baseTags, HubId: hub.hubId, RegionCode: hub.regionCode };
  return Object.entries(tags).map(([k, v]) => `${k}=${v}`).join(' ');
}

function groupExists(name) {
  return execSync(`az group exists --name ${name}`, { encoding: 'utf8' }).trim() === 'true';
}

function vnetExists(rg, name) {
  try {
    execSync(`az network vnet show --resource-group ${rg} --name ${name} --only-show-errors`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return true;
  } catch {
    return false;
  }
}

function subnetExists(rg, vnet, subnet) {
  try {
    execSync(
      `az network vnet subnet show --resource-group ${rg} --vnet-name ${vnet} --name ${subnet} --only-show-errors`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

function firewallIpConfigExists(rg, firewall, ipConfig) {
  try {
    execSync(
      `az network firewall ip-config show --resource-group ${rg} --firewall-name ${firewall} --name ${ipConfig} --only-show-errors`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

function publicIpExists(rg, name) {
  try {
    execSync(`az network public-ip show --resource-group ${rg} --name ${name} --only-show-errors`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return true;
  } catch {
    return false;
  }
}

function firewallExists(rg, name) {
  try {
    execSync(`az network firewall show --resource-group ${rg} --name ${name} --only-show-errors`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return true;
  } catch {
    return false;
  }
}

function vnetGatewayExists(rg, name) {
  try {
    execSync(`az network vnet-gateway show --resource-group ${rg} --name ${name} --only-show-errors`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return true;
  } catch {
    return false;
  }
}

function listVnetGateways(rg) {
  try {
    const json = execSync(
      `az network vnet-gateway list --resource-group ${rg} --query "[].{name:name,gatewayType:gatewayType}" -o json`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    return JSON.parse(json || '[]');
  } catch {
    return [];
  }
}

function bastionExists(rg, name) {
  try {
    execSync(`az network bastion show --resource-group ${rg} --name ${name} --only-show-errors`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return true;
  } catch {
    return false;
  }
}

function vnetPeeringExists(rg, vnet, peeringName) {
  try {
    execSync(
      `az network vnet peering show --resource-group ${rg} --vnet-name ${vnet} --name ${peeringName} --only-show-errors`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

function hubById(hubs, hubId) {
  const hub = hubs.find((h) => h.hubId === hubId);
  if (!hub) throw new Error(`HubId '${hubId}' not found in registry.`);
  return hub;
}

function vnetResourceId(rg, vnet) {
  return execSync(`az network vnet show --resource-group ${rg} --name ${vnet} --query id -o tsv`, {
    encoding: 'utf8',
    stdio: 'pipe'
  }).trim();
}

function createVnetPeeringLeg(localRg, localVnet, remoteRg, remoteVnet, peeringName, options) {
  if (vnetPeeringExists(localRg, localVnet, peeringName)) {
    console.log(`[skip] ${localVnet}/${peeringName} already exists`);
    return;
  }
  if (!vnetExists(localRg, localVnet)) {
    throw new Error(`VNet ${localVnet} not found in ${localRg}.`);
  }
  if (!vnetExists(remoteRg, remoteVnet)) {
    throw new Error(`Remote VNet ${remoteVnet} not found in ${remoteRg}.`);
  }

  const remoteId = vnetResourceId(remoteRg, remoteVnet);
  const allowVnetAccess = options.allowVnetAccess !== false;
  const allowForwarded = options.allowForwardedTraffic === true;
  const allowGatewayTransit = options.allowGatewayTransit === true;
  const useRemoteGateways = options.useRemoteGateways === true;

  console.log(`[create] ${localVnet}/${peeringName} -> ${remoteVnet}`);
  execSync(
    `az network vnet peering create --name ${peeringName} --resource-group ${localRg} --vnet-name ${localVnet} --remote-vnet ${remoteId} --allow-vnet-access ${allowVnetAccess} --allow-forwarded-traffic ${allowForwarded} --allow-gateway-transit ${allowGatewayTransit} --use-remote-gateways ${useRemoteGateways}`,
    { stdio: 'inherit' }
  );
}

function createPeeringLeg(localHub, remoteHub, peeringName, options) {
  createVnetPeeringLeg(
    localHub.resourceGroupName,
    localHub.vnetName,
    remoteHub.resourceGroupName,
    remoteHub.vnetName,
    peeringName,
    options
  );
}

function resolvePeeringNameTemplate(template, spokeId) {
  return template.replace('{spokeId}', spokeId);
}

function resolveRouteTableNameTemplate(template, hub) {
  return template.replace('{regionCode}', hub.regionCode.toLowerCase());
}

function routeTableExists(rg, name) {
  try {
    execSync(`az network route-table show --resource-group ${rg} --name ${name} --only-show-errors`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return true;
  } catch {
    return false;
  }
}

function routeTableRouteExists(rg, routeTable, routeName) {
  try {
    execSync(
      `az network route-table route show --resource-group ${rg} --route-table-name ${routeTable} --name ${routeName} --only-show-errors`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

function firewallPrivateIp(rg, firewallName) {
  const queries = [
    "ipConfigurations[?name=='configuration'].privateIPAddress | [0]",
    'ipConfigurations[0].privateIPAddress',
    'ipConfigurations[0].properties.privateIPAddress'
  ];
  for (const query of queries) {
    try {
      const ip = execSync(
        `az network firewall show --resource-group ${rg} --name ${firewallName} --query "${query}" -o tsv`,
        { encoding: 'utf8', stdio: 'pipe' }
      ).trim();
      if (ip) return ip;
    } catch {
      // try next query
    }
  }
  throw new Error(`Unable to resolve private IP for firewall ${firewallName} in ${rg}. Deploy hub firewall (Step 4) first.`);
}

function routeTableResourceId(rg, name) {
  return execSync(`az network route-table show --resource-group ${rg} --name ${name} --query id -o tsv`, {
    encoding: 'utf8',
    stdio: 'pipe'
  }).trim();
}

function getFilteredSpokes(spokeRegistry) {
  if (!spokeRegistry.spokes) throw new Error('spokes not defined in spoke registry.');
  let spokes = spokeRegistry.spokes;
  if (spokeIdFilter) {
    spokes = spokes.filter((s) => s.spokeId === spokeIdFilter);
    if (spokes.length === 0) throw new Error(`SpokeId '${spokeIdFilter}' not found in spoke registry.`);
  }
  if (hubIdFilter) {
    spokes = spokes.filter((s) => s.hubId === hubIdFilter);
    if (spokes.length === 0) throw new Error(`No spokes reference HubId '${hubIdFilter}'.`);
  }
  if (tenantIdFilter) {
    spokes = spokes.filter((s) => s.tenantId === tenantIdFilter);
    if (spokes.length === 0) throw new Error(`No spokes reference TenantId '${tenantIdFilter}'.`);
  }
  return spokes;
}

function resolveDnsLinkNameTemplate(template, hub, spokeId = '') {
  let name = template.replace('{regionCode}', hub.regionCode.toLowerCase());
  if (spokeId) name = name.replace('{spokeId}', spokeId);
  return name;
}

function privateDnsZoneExists(rg, zone) {
  try {
    execSync(`az network private-dns zone show --resource-group ${rg} --name ${zone} --only-show-errors`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return true;
  } catch {
    return false;
  }
}

function privateDnsVnetLinkExists(rg, zone, linkName) {
  try {
    execSync(
      `az network private-dns link vnet show --resource-group ${rg} --zone-name ${zone} --name ${linkName} --only-show-errors`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

function createPrivateDnsVnetLink(zoneRg, zoneName, linkName, vnetRg, vnetName, registrationEnabled) {
  if (!vnetExists(vnetRg, vnetName)) {
    throw new Error(`VNet ${vnetName} not found in ${vnetRg}.`);
  }
  if (privateDnsVnetLinkExists(zoneRg, zoneName, linkName)) {
    console.log(`[skip] ${zoneName}/${linkName} already linked to ${vnetName}`);
    return;
  }
  const vnetId = vnetResourceId(vnetRg, vnetName);
  console.log(`[create] link ${linkName} on ${zoneName} -> ${vnetName}`);
  execSync(
    `az network private-dns link vnet create --resource-group ${zoneRg} --zone-name ${zoneName} --name ${linkName} --virtual-network ${vnetId} --registration-enabled ${registrationEnabled}`,
    { stdio: 'inherit' }
  );
}

function subscriptionId() {
  return execSync('az account show --query id -o tsv', { encoding: 'utf8', stdio: 'pipe' }).trim();
}

function resolveTargetResourceId(endpoint, subId) {
  if (endpoint.targetResourceId) return endpoint.targetResourceId;
  if (!endpoint.target) return null;
  const t = endpoint.target;
  return `/subscriptions/${subId}/resourceGroups/${t.resourceGroupName}/providers/${t.resourceType}/${t.resourceName}`;
}

function armResourceExists(resourceId) {
  try {
    execSync(`az resource show --ids ${resourceId} --only-show-errors`, { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function privateEndpointExists(rg, name) {
  try {
    execSync(`az network private-endpoint show --resource-group ${rg} --name ${name} --only-show-errors`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return true;
  } catch {
    return false;
  }
}

function privateEndpointDnsZoneGroupExists(rg, endpointName, groupName) {
  try {
    execSync(
      `az network private-endpoint dns-zone-group show --resource-group ${rg} --endpoint-name ${endpointName} --name ${groupName} --only-show-errors`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

function enableSubnetPrivateEndpointPolicies(rg, vnetName, subnetName) {
  const policies = execSync(
    `az network vnet subnet show --resource-group ${rg} --vnet-name ${vnetName} --name ${subnetName} --query privateEndpointNetworkPolicies -o tsv`,
    { encoding: 'utf8', stdio: 'pipe' }
  ).trim();
  if (policies !== 'Disabled') {
    console.log(`[update] disable private-endpoint network policies on ${vnetName}/${subnetName}`);
    execSync(
      `az network vnet subnet update --resource-group ${rg} --vnet-name ${vnetName} --name ${subnetName} --disable-private-endpoint-network-policies true`,
      { stdio: 'inherit' }
    );
  }
}

function getSpokeById(spokeRegistry, spokeIdValue) {
  const spoke = spokeRegistry.spokes.find((s) => s.spokeId === spokeIdValue);
  if (!spoke) throw new Error(`SpokeId '${spokeIdValue}' not found in spoke registry.`);
  return spoke;
}

function getFilteredPrivateLinkEndpoints(linkRegistry, spokeRegistry) {
  if (!linkRegistry.privateLink || !linkRegistry.privateLink.endpoints) {
    throw new Error('privateLink.endpoints not defined in private link registry.');
  }
  let endpoints = linkRegistry.privateLink.endpoints;
  if (spokeIdFilter) {
    endpoints = endpoints.filter((e) => e.spokeId === spokeIdFilter);
    if (endpoints.length === 0) throw new Error(`No private link endpoints reference SpokeId '${spokeIdFilter}'.`);
  }
  if (hubIdFilter) {
    const hubSpokeIds = spokeRegistry.spokes.filter((s) => s.hubId === hubIdFilter).map((s) => s.spokeId);
    endpoints = endpoints.filter((e) => hubSpokeIds.includes(e.spokeId));
    if (endpoints.length === 0) throw new Error(`No private link endpoints reference HubId '${hubIdFilter}'.`);
  }
  if (tenantIdFilter) {
    const tenantSpokeIds = spokeRegistry.spokes.filter((s) => s.tenantId === tenantIdFilter).map((s) => s.spokeId);
    endpoints = endpoints.filter((e) => tenantSpokeIds.includes(e.spokeId));
    if (endpoints.length === 0) throw new Error(`No private link endpoints reference TenantId '${tenantIdFilter}'.`);
  }
  return endpoints;
}

function assertGatewaySubnetAvailable(rg, gatewayName) {
  const existing = listVnetGateways(rg).filter((g) => g.name !== gatewayName);
  if (existing.length > 0) {
    const inUse = existing.map((g) => `${g.name} (${g.gatewayType})`).join(', ');
    throw new Error(
      `GatewaySubnet already in use in ${rg}: ${inUse}. VPN and ExpressRoute gateways are mutually exclusive per hub.`
    );
  }
}

const addOnOnly = firewallOnly || vpnGatewayOnly || expressRouteGatewayOnly || bastionOnly || globalPeeringOnly || spokePeeringOnly || spokeRoutingOnly || privateDnsOnly || privateLinkOnly;
const provisionResourceGroups = !vnetsOnly && !subnetsOnly && !addOnOnly;
const provisionVnets = !resourceGroupsOnly && !subnetsOnly && !addOnOnly;
const provisionSubnets = !resourceGroupsOnly && !vnetsOnly && !addOnOnly;
const provisionFirewall = firewallOnly;
const provisionVpnGateway = vpnGatewayOnly;
const provisionExpressRouteGateway = expressRouteGatewayOnly;
const provisionBastion = bastionOnly;
const provisionGlobalPeering = globalPeeringOnly;
const provisionSpokePeering = spokePeeringOnly;
const provisionSpokeRouting = spokeRoutingOnly;
const provisionPrivateDns = privateDnsOnly;
const provisionPrivateLink = privateLinkOnly;

function targetHubs(hubs) {
  if (!hubIdFilter) return hubs;
  const filtered = hubs.filter((h) => h.hubId === hubIdFilter);
  if (filtered.length === 0) {
    throw new Error(`HubId '${hubIdFilter}' not found in registry.`);
  }
  return filtered;
}

if (provisionResourceGroups) {
  console.log(`Provisioning ${registry.hubs.length} global hub resource groups...`);
  for (const hub of registry.hubs) {
    if (groupExists(hub.resourceGroupName)) {
      console.log(`[skip] ${hub.resourceGroupName} already exists (${hub.azureLocation})`);
      continue;
    }
    console.log(`[create] ${hub.resourceGroupName} in ${hub.azureLocation} (${hub.displayName})`);
    execSync(
      `az group create --name ${hub.resourceGroupName} --location ${hub.azureLocation} --tags ${tagString(hub)}`,
      { stdio: 'inherit' }
    );
  }
  console.log('Global hub resource groups ready.');
}

if (provisionVnets) {
  console.log(`Provisioning ${registry.hubs.length} global hub VNets...`);
  for (const hub of registry.hubs) {
    if (vnetExists(hub.resourceGroupName, hub.vnetName)) {
      console.log(`[skip] ${hub.vnetName} already exists in ${hub.resourceGroupName}`);
      continue;
    }
    console.log(`[create] ${hub.vnetName} (${hub.hubAddressSpace}) in ${hub.resourceGroupName}`);
    execSync(
      `az network vnet create --name ${hub.vnetName} --resource-group ${hub.resourceGroupName} --location ${hub.azureLocation} --address-prefix ${hub.hubAddressSpace} --tags ${tagString(hub)}`,
      { stdio: 'inherit' }
    );
  }
  console.log('Global hub VNets ready.');
}

if (provisionSubnets) {
  console.log('Provisioning hub subnets (Azure-required names)...');
  for (const hub of registry.hubs) {
    if (!vnetExists(hub.resourceGroupName, hub.vnetName)) {
      throw new Error(`VNet ${hub.vnetName} not found in ${hub.resourceGroupName}. Create the VNet before adding subnets.`);
    }
    for (const subnet of hub.subnets) {
      if (subnetExists(hub.resourceGroupName, hub.vnetName, subnet.name)) {
        console.log(`[skip] ${hub.vnetName}/${subnet.name} already exists`);
        continue;
      }
      console.log(`[create] ${hub.vnetName}/${subnet.name} (${subnet.addressPrefix})`);
      execSync(
        `az network vnet subnet create --vnet-name ${hub.vnetName} --resource-group ${hub.resourceGroupName} --name ${subnet.name} --address-prefix ${subnet.addressPrefix}`,
        { stdio: 'inherit' }
      );
    }
  }
  console.log('Global hub subnets ready.');
}

if (provisionFirewall) {
  if (!acknowledgeFirewallCost) {
    throw new Error(
      'Azure Firewall is a paid add-on (~$912/month per hub Standard + ~$0.016/GB). ' +
        'Set ACKNOWLEDGE_FIREWALL_COST=1 with FIREWALL_ONLY=1 after client approval. ' +
        'Optional: HUB_ID=hub-apac for a single region.'
    );
  }

  const firewallHubs = targetHubs(registry.hubs);
  console.log(`Provisioning Azure Firewall add-on for ${firewallHubs.length} hub(s)...`);
  for (const hub of firewallHubs) {
    const fw = hub.firewall;
    if (!fw) {
      console.log(`[skip] ${hub.hubId} has no firewall definition`);
      continue;
    }
    if (!subnetExists(hub.resourceGroupName, hub.vnetName, 'AzureFirewallSubnet')) {
      throw new Error(`AzureFirewallSubnet missing on ${hub.vnetName}. Create subnets first.`);
    }

    if (!publicIpExists(hub.resourceGroupName, fw.publicIpName)) {
      console.log(`[create] public IP ${fw.publicIpName} (${hub.azureLocation})`);
      execSync(
        `az network public-ip create --name ${fw.publicIpName} --resource-group ${hub.resourceGroupName} --location ${hub.azureLocation} --sku ${fw.publicIpSku}`,
        { stdio: 'inherit' }
      );
    } else {
      console.log(`[skip] public IP ${fw.publicIpName} already exists`);
    }

    if (!firewallExists(hub.resourceGroupName, fw.firewallName)) {
      console.log(`[create] firewall ${fw.firewallName} (${hub.azureLocation})`);
      execSync(
        `az network firewall create --name ${fw.firewallName} --resource-group ${hub.resourceGroupName} --location ${hub.azureLocation} --sku-name ${fw.firewallSku}`,
        { stdio: 'inherit' }
      );
    } else {
      console.log(`[skip] firewall ${fw.firewallName} already exists`);
    }

    if (!firewallIpConfigExists(hub.resourceGroupName, fw.firewallName, fw.ipConfigName)) {
      console.log(`[create] firewall ip-config ${fw.ipConfigName} on ${hub.vnetName}`);
      execSync(
        `az network firewall ip-config create --firewall-name ${fw.firewallName} --name ${fw.ipConfigName} --public-ip-address ${fw.publicIpName} --resource-group ${hub.resourceGroupName} --vnet-name ${hub.vnetName}`,
        { stdio: 'inherit' }
      );
    } else {
      console.log(`[skip] firewall ip-config ${fw.ipConfigName} already exists`);
    }
  }
  console.log('Regional Azure Firewalls ready.');
}

if (provisionVpnGateway) {
  if (!acknowledgeVpnGatewayCost) {
    throw new Error(
      'VPN Gateway is a paid add-on (VpnGw1AZ ~$153/month per hub + public IP). ' +
        'Set ACKNOWLEDGE_VPN_GATEWAY_COST=1 with VPN_GATEWAY_ONLY=1 after client approval. ' +
        'Optional: HUB_ID=hub-apac. Mutually exclusive with ExpressRoute gateway on the same hub.'
    );
  }

  const vpnHubs = targetHubs(registry.hubs);
  console.log(`Provisioning VPN Gateway add-on for ${vpnHubs.length} hub(s)...`);
  for (const hub of vpnHubs) {
    const gw = hub.vpnGateway;
    if (!gw) {
      console.log(`[skip] ${hub.hubId} has no vpnGateway definition`);
      continue;
    }
    if (!subnetExists(hub.resourceGroupName, hub.vnetName, 'GatewaySubnet')) {
      throw new Error(`GatewaySubnet missing on ${hub.vnetName}. Create subnets first.`);
    }
    assertGatewaySubnetAvailable(hub.resourceGroupName, gw.gatewayName);

    if (gw.publicIpName && !publicIpExists(hub.resourceGroupName, gw.publicIpName)) {
      console.log(`[create] public IP ${gw.publicIpName} (${hub.azureLocation})`);
      execSync(
        `az network public-ip create --name ${gw.publicIpName} --resource-group ${hub.resourceGroupName} --location ${hub.azureLocation} --sku ${gw.publicIpSku}`,
        { stdio: 'inherit' }
      );
    } else if (gw.publicIpName) {
      console.log(`[skip] public IP ${gw.publicIpName} already exists`);
    }

    if (!vnetGatewayExists(hub.resourceGroupName, gw.gatewayName)) {
      console.log(`[create] VPN gateway ${gw.gatewayName} (${gw.sku}) on ${hub.vnetName} — may take 20-45 minutes`);
      const pipArg = gw.publicIpName ? ` --public-ip-address ${gw.publicIpName}` : '';
      execSync(
        `az network vnet-gateway create --name ${gw.gatewayName} --resource-group ${hub.resourceGroupName} --location ${hub.azureLocation} --vnet ${hub.vnetName} --gateway-type ${gw.gatewayType} --vpn-type ${gw.vpnType} --sku ${gw.sku}${pipArg}`,
        { stdio: 'inherit' }
      );
    } else {
      console.log(`[skip] VPN gateway ${gw.gatewayName} already exists`);
    }
  }
  console.log('Regional VPN Gateways ready (or still provisioning in Azure).');
}

if (provisionExpressRouteGateway) {
  if (!acknowledgeExpressRouteGatewayCost) {
    throw new Error(
      'ExpressRoute Gateway is a paid add-on (ErGw1AZ ~$264/month per hub). ' +
        'ExpressRoute circuit bandwidth is billed separately. ' +
        'Set ACKNOWLEDGE_EXPRESSROUTE_GATEWAY_COST=1 with EXPRESSROUTE_GATEWAY_ONLY=1 after client approval. ' +
        'Optional: HUB_ID=hub-apac. Mutually exclusive with VPN gateway on the same hub.'
    );
  }

  const erHubs = targetHubs(registry.hubs);
  console.log(`Provisioning ExpressRoute Gateway add-on for ${erHubs.length} hub(s)...`);
  for (const hub of erHubs) {
    const gw = hub.expressRouteGateway;
    if (!gw) {
      console.log(`[skip] ${hub.hubId} has no expressRouteGateway definition`);
      continue;
    }
    if (!subnetExists(hub.resourceGroupName, hub.vnetName, 'GatewaySubnet')) {
      throw new Error(`GatewaySubnet missing on ${hub.vnetName}. Create subnets first.`);
    }
    assertGatewaySubnetAvailable(hub.resourceGroupName, gw.gatewayName);

    if (!vnetGatewayExists(hub.resourceGroupName, gw.gatewayName)) {
      console.log(`[create] ExpressRoute gateway ${gw.gatewayName} (${gw.sku}) on ${hub.vnetName} — may take 20-45 minutes`);
      execSync(
        `az network vnet-gateway create --name ${gw.gatewayName} --resource-group ${hub.resourceGroupName} --location ${hub.azureLocation} --vnet ${hub.vnetName} --gateway-type ${gw.gatewayType} --sku ${gw.sku}`,
        { stdio: 'inherit' }
      );
    } else {
      console.log(`[skip] ExpressRoute gateway ${gw.gatewayName} already exists`);
    }
  }
  console.log('Regional ExpressRoute Gateways ready (or still provisioning in Azure).');
}

if (provisionBastion) {
  if (!acknowledgeBastionCost) {
    throw new Error(
      'Azure Bastion is a paid add-on (Basic ~$139/month per hub + public IP). ' +
        'Set ACKNOWLEDGE_BASTION_COST=1 with BASTION_ONLY=1 after client approval. ' +
        'Optional: HUB_ID=hub-apac. Billed hourly while deployed regardless of sessions.'
    );
  }

  const bastionHubs = targetHubs(registry.hubs);
  console.log(`Provisioning Azure Bastion add-on for ${bastionHubs.length} hub(s)...`);
  for (const hub of bastionHubs) {
    const bas = hub.bastion;
    if (!bas) {
      console.log(`[skip] ${hub.hubId} has no bastion definition`);
      continue;
    }
    if (!subnetExists(hub.resourceGroupName, hub.vnetName, 'AzureBastionSubnet')) {
      throw new Error(`AzureBastionSubnet missing on ${hub.vnetName}. Create subnets first (minimum /26).`);
    }

    if (!publicIpExists(hub.resourceGroupName, bas.publicIpName)) {
      console.log(`[create] public IP ${bas.publicIpName} (${hub.azureLocation})`);
      execSync(
        `az network public-ip create --name ${bas.publicIpName} --resource-group ${hub.resourceGroupName} --location ${hub.azureLocation} --sku ${bas.publicIpSku}`,
        { stdio: 'inherit' }
      );
    } else {
      console.log(`[skip] public IP ${bas.publicIpName} already exists`);
    }

    if (!bastionExists(hub.resourceGroupName, bas.bastionName)) {
      console.log(`[create] bastion ${bas.bastionName} (${bas.sku}) on ${hub.vnetName} — may take several minutes`);
      execSync(
        `az network bastion create --name ${bas.bastionName} --resource-group ${hub.resourceGroupName} --location ${hub.azureLocation} --vnet-name ${hub.vnetName} --public-ip-address ${bas.publicIpName} --sku ${bas.sku}`,
        { stdio: 'inherit' }
      );
    } else {
      console.log(`[skip] bastion ${bas.bastionName} already exists`);
    }
  }
  console.log('Regional Azure Bastion hosts ready (or still provisioning in Azure).');
}

if (provisionGlobalPeering) {
  if (!acknowledgeGlobalPeeringCost) {
    throw new Error(
      'Global VNet peering has no hourly fee but cross-region data transfer is billed per GB. ' +
        'Set ACKNOWLEDGE_GLOBAL_PEERING_COST=1 with GLOBAL_PEERING_ONLY=1 after client approval. ' +
        'Optional: HUB_ID=hub-apac for links touching that hub only.'
    );
  }

  const peeringConfig = registry.globalHubPeering;
  if (!peeringConfig || !peeringConfig.links) {
    throw new Error('globalHubPeering.links not defined in registry.');
  }

  let links = peeringConfig.links;
  if (hubIdFilter) {
    links = links.filter((link) => link.hubA === hubIdFilter || link.hubB === hubIdFilter);
    if (links.length === 0) {
      throw new Error(`No globalHubPeering links reference HubId '${hubIdFilter}'.`);
    }
  }

  const options = peeringConfig.defaultOptions || {};
  console.log(`Configuring global hub VNet peering (${links.length} link(s), ${peeringConfig.topology})...`);
  for (const link of links) {
    const hubA = hubById(registry.hubs, link.hubA);
    const hubB = hubById(registry.hubs, link.hubB);
    createPeeringLeg(hubA, hubB, link.peeringNameAtoB, options);
    createPeeringLeg(hubB, hubA, link.peeringNameBtoA, options);
  }
  console.log('Global hub VNet peering configured (verify Connected state in Azure portal).');
}

if (provisionSpokePeering) {
  if (!acknowledgeSpokePeeringCost) {
    throw new Error(
      'Spoke-to-hub peering has no hourly fee but same-region data transfer is billed per GB (~$0.02/GB typical). ' +
        'Set ACKNOWLEDGE_SPOKE_PEERING_COST=1 with SPOKE_PEERING_ONLY=1 after client approval. ' +
        'Optional: SPOKE_ID, HUB_ID, or TENANT_ID. useRemoteGateways requires a hub gateway; firewall needs spoke UDRs.'
    );
  }

  if (!fs.existsSync(spokeRegistryPath)) {
    throw new Error(`Spoke registry not found: ${spokeRegistryPath}`);
  }

  const spokeRegistry = JSON.parse(fs.readFileSync(spokeRegistryPath, 'utf8'));
  const spokes = getFilteredSpokes(spokeRegistry);

  const policy = spokeRegistry.spokePeeringPolicy;
  if (!policy) throw new Error('spokePeeringPolicy not defined in spoke registry.');

  console.log(`Configuring spoke-to-hub peering for ${spokes.length} workload VNet(s)...`);
  for (const spoke of spokes) {
    const hub = hubById(registry.hubs, spoke.hubId);
    const hubLegName = resolvePeeringNameTemplate(policy.hubLeg.peeringNameTemplate, spoke.spokeId);
    const spokeLegName = policy.spokeLeg.peeringName;

    console.log(`--- ${spoke.spokeId} (${spoke.vnetName}) -> ${hub.vnetName} ---`);
    createVnetPeeringLeg(
      spoke.resourceGroupName,
      spoke.vnetName,
      hub.resourceGroupName,
      hub.vnetName,
      spokeLegName,
      policy.spokeLeg
    );
    createVnetPeeringLeg(
      hub.resourceGroupName,
      hub.vnetName,
      spoke.resourceGroupName,
      spoke.vnetName,
      hubLegName,
      policy.hubLeg
    );
  }
  console.log('Spoke-to-hub peering configured (verify Connected state; deploy hub gateway before useRemoteGateways).');
  console.log(`Spoke registry: ${spokeRegistryPath}`);
}

if (provisionSpokeRouting) {
  if (!acknowledgeSpokeRoutingCost) {
    throw new Error(
      'Spoke UDR routing forces traffic via hub Azure Firewall. Route tables are free; inspected traffic incurs firewall charges. ' +
        'Set ACKNOWLEDGE_SPOKE_ROUTING_COST=1 with SPOKE_ROUTING_ONLY=1 after Steps 4 and 8. Optional: SPOKE_ID, HUB_ID, TENANT_ID.'
    );
  }

  if (!fs.existsSync(spokeRegistryPath)) {
    throw new Error(`Spoke registry not found: ${spokeRegistryPath}`);
  }

  const spokeRegistry = JSON.parse(fs.readFileSync(spokeRegistryPath, 'utf8'));
  const routing = spokeRegistry.spokeRouting;
  if (!routing) throw new Error('spokeRouting not defined in spoke registry.');

  const spokes = getFilteredSpokes(spokeRegistry);
  const hubIds = [...new Set(spokes.map((s) => s.hubId))];

  console.log(`Configuring spoke UDR routing for ${spokes.length} workload VNet(s) across ${hubIds.length} hub(s)...`);
  for (const hubId of hubIds) {
    const hub = hubById(registry.hubs, hubId);
    const fw = hub.firewall;
    if (!fw) throw new Error(`Hub ${hub.hubId} has no firewall definition in hub registry.`);

    const rtRg = routing.routeTableResourceGroup === 'hub' ? hub.resourceGroupName : routing.routeTableResourceGroup;
    const rtName = resolveRouteTableNameTemplate(routing.routeTableNameTemplate, hub);
    const firewallIp = firewallPrivateIp(hub.resourceGroupName, fw.firewallName);
    const defaultRoute = routing.defaultRoute;

    if (!routeTableExists(rtRg, rtName)) {
      console.log(`[create] route table ${rtName} in ${rtRg} (${hub.azureLocation})`);
      execSync(
        `az network route-table create --name ${rtName} --resource-group ${rtRg} --location ${hub.azureLocation}`,
        { stdio: 'inherit' }
      );
    } else {
      console.log(`[skip] route table ${rtName} already exists in ${rtRg}`);
    }

    if (!routeTableRouteExists(rtRg, rtName, defaultRoute.name)) {
      console.log(`[create] route ${defaultRoute.name} -> ${firewallIp} (VirtualAppliance)`);
      execSync(
        `az network route-table route create --resource-group ${rtRg} --route-table-name ${rtName} --name ${defaultRoute.name} --address-prefix ${defaultRoute.addressPrefix} --next-hop-type ${defaultRoute.nextHopType} --next-hop-ip-address ${firewallIp}`,
        { stdio: 'inherit' }
      );
    } else {
      console.log(`[skip] route ${defaultRoute.name} already exists on ${rtName}`);
    }

    const rtId = routeTableResourceId(rtRg, rtName);
    const hubSpokes = spokes.filter((s) => s.hubId === hubId);

    for (const spoke of hubSpokes) {
      const subnetNames = spoke.routeTableAssociation?.subnetNames || [];
      if (subnetNames.length === 0) {
        throw new Error(`Spoke ${spoke.spokeId} has no routeTableAssociation.subnetNames defined.`);
      }

      console.log(`--- ${spoke.spokeId}: associate ${rtName} with subnets ---`);
      for (const subnetName of subnetNames) {
        if (!subnetExists(spoke.resourceGroupName, spoke.vnetName, subnetName)) {
          throw new Error(`Subnet ${subnetName} not found on ${spoke.vnetName}. Create the spoke subnet first.`);
        }
        console.log(`[associate] ${spoke.vnetName}/${subnetName} -> ${rtName}`);
        execSync(
          `az network vnet subnet update --resource-group ${spoke.resourceGroupName} --vnet-name ${spoke.vnetName} --name ${subnetName} --route-table ${rtId}`,
          { stdio: 'inherit' }
        );
      }
    }
  }
  console.log('Spoke UDR routing configured (verify effective routes on spoke VMs).');
  console.log(`Spoke registry: ${spokeRegistryPath}`);
}

if (provisionPrivateDns) {
  if (!acknowledgePrivateDnsCost) {
    throw new Error(
      'Private DNS zones cost ~$0.50/zone/month per region plus query charges. ' +
        'Set ACKNOWLEDGE_PRIVATE_DNS_COST=1 with PRIVATE_DNS_ONLY=1 after client approval. Optional: HUB_ID.'
    );
  }

  if (!fs.existsSync(privateDnsRegistryPath)) {
    throw new Error(`Private DNS registry not found: ${privateDnsRegistryPath}`);
  }

  const dnsRegistry = JSON.parse(fs.readFileSync(privateDnsRegistryPath, 'utf8'));
  const dnsConfig = dnsRegistry.privateDns;
  if (!dnsConfig || !dnsConfig.zones) {
    throw new Error('privateDns.zones not defined in private DNS registry.');
  }

  const registrationEnabled = dnsConfig.registrationEnabledDefault === true;
  const dnsHubs = targetHubs(registry.hubs);
  const spokesByHub = {};

  if (dnsConfig.linkSpokeVnets && fs.existsSync(spokeRegistryPath)) {
    const spokeRegistry = JSON.parse(fs.readFileSync(spokeRegistryPath, 'utf8'));
    for (const spoke of getFilteredSpokes(spokeRegistry)) {
      if (!spokesByHub[spoke.hubId]) spokesByHub[spoke.hubId] = [];
      spokesByHub[spoke.hubId].push(spoke);
    }
  }

  console.log(`Configuring private DNS for ${dnsHubs.length} hub region(s), ${dnsConfig.zones.length} zone(s)...`);
  for (const hub of dnsHubs) {
    const zoneRg = dnsConfig.resourceGroup === 'hub' ? hub.resourceGroupName : dnsConfig.resourceGroup;
    console.log(`--- ${hub.hubId} (${zoneRg}) ---`);

    for (const zone of dnsConfig.zones) {
      if (!privateDnsZoneExists(zoneRg, zone.zoneName)) {
        console.log(`[create] private DNS zone ${zone.zoneName}`);
        execSync(`az network private-dns zone create --resource-group ${zoneRg} --name ${zone.zoneName}`, {
          stdio: 'inherit'
        });
      } else {
        console.log(`[skip] private DNS zone ${zone.zoneName} already exists`);
      }

      if (dnsConfig.linkHubVnet) {
        const hubLinkName = resolveDnsLinkNameTemplate(dnsConfig.hubLinkNameTemplate, hub);
        createPrivateDnsVnetLink(zoneRg, zone.zoneName, hubLinkName, hub.resourceGroupName, hub.vnetName, registrationEnabled);
      }

      if (dnsConfig.linkSpokeVnets && spokesByHub[hub.hubId]) {
        for (const spoke of spokesByHub[hub.hubId]) {
          const spokeLinkName = resolveDnsLinkNameTemplate(dnsConfig.spokeLinkNameTemplate, hub, spoke.spokeId);
          createPrivateDnsVnetLink(
            zoneRg,
            zone.zoneName,
            spokeLinkName,
            spoke.resourceGroupName,
            spoke.vnetName,
            registrationEnabled
          );
        }
      }
    }
  }
  console.log('Private DNS zones and VNet links configured.');
  console.log(`Private DNS registry: ${privateDnsRegistryPath}`);
}

if (provisionPrivateLink) {
  if (!acknowledgePrivateLinkCost) {
    throw new Error(
      'Private Link endpoints cost ~$0.01/hour per endpoint plus data processing. ' +
        'Set ACKNOWLEDGE_PRIVATE_LINK_COST=1 with PRIVATE_LINK_ONLY=1 after Step 10 and target PaaS resources exist. ' +
        'Optional: SPOKE_ID, HUB_ID, TENANT_ID.'
    );
  }

  if (!fs.existsSync(privateLinkRegistryPath)) {
    throw new Error(`Private link registry not found: ${privateLinkRegistryPath}`);
  }
  if (!fs.existsSync(spokeRegistryPath)) {
    throw new Error(`Spoke registry not found: ${spokeRegistryPath}`);
  }

  const linkRegistry = JSON.parse(fs.readFileSync(privateLinkRegistryPath, 'utf8'));
  const linkConfig = linkRegistry.privateLink;
  const spokeRegistry = JSON.parse(fs.readFileSync(spokeRegistryPath, 'utf8'));
  const endpoints = getFilteredPrivateLinkEndpoints(linkRegistry, spokeRegistry);
  const subId = subscriptionId();
  const skipIfTargetMissing = linkConfig.skipIfTargetMissing !== false;
  const dnsZoneGroupName = linkConfig.dnsZoneGroupName || 'default';

  console.log(`Provisioning ${endpoints.length} private link endpoint(s)...`);
  for (const endpoint of endpoints) {
    const spoke = getSpokeById(spokeRegistry, endpoint.spokeId);
    const hub = hubById(registry.hubs, spoke.hubId);
    const subnetName = endpoint.subnetName || linkConfig.defaultSubnetName;
    const endpointRg = endpoint.resourceGroupName || spoke.resourceGroupName;
    const connectionName =
      endpoint.connectionName || linkConfig.connectionNameTemplate.replace('{endpointName}', endpoint.endpointName);
    const targetId = resolveTargetResourceId(endpoint, subId);
    if (!targetId) throw new Error(`Endpoint ${endpoint.endpointId} has no targetResourceId or target definition.`);

    console.log(`--- ${endpoint.endpointId} (${endpoint.endpointName}) ---`);

    if (!armResourceExists(targetId)) {
      if (skipIfTargetMissing) {
        console.log(`[skip] target resource not found: ${targetId}`);
        continue;
      }
      throw new Error(`Target resource not found: ${targetId}. Deploy the PaaS resource first.`);
    }

    if (!subnetExists(spoke.resourceGroupName, spoke.vnetName, subnetName)) {
      throw new Error(`Subnet ${subnetName} not found on ${spoke.vnetName}. Create the spoke data subnet first.`);
    }

    const zoneRg = linkConfig.dnsZoneResourceGroup === 'hub' ? hub.resourceGroupName : linkConfig.dnsZoneResourceGroup;
    if (!privateDnsZoneExists(zoneRg, endpoint.privateDnsZoneName)) {
      throw new Error(
        `Private DNS zone ${endpoint.privateDnsZoneName} not found in ${zoneRg}. Run Step 10 (PRIVATE_DNS_ONLY=1) first.`
      );
    }

    enableSubnetPrivateEndpointPolicies(spoke.resourceGroupName, spoke.vnetName, subnetName);

    if (!privateEndpointExists(endpointRg, endpoint.endpointName)) {
      console.log(`[create] private endpoint ${endpoint.endpointName} on ${subnetName} -> ${targetId}`);
      execSync(
        `az network private-endpoint create --name ${endpoint.endpointName} --resource-group ${endpointRg} --vnet-name ${spoke.vnetName} --subnet ${subnetName} --location ${hub.azureLocation} --private-connection-resource-id ${targetId} --group-id ${endpoint.groupId} --connection-name ${connectionName}`,
        { stdio: 'inherit' }
      );
    } else {
      console.log(`[skip] private endpoint ${endpoint.endpointName} already exists in ${endpointRg}`);
    }

    if (!privateEndpointDnsZoneGroupExists(endpointRg, endpoint.endpointName, dnsZoneGroupName)) {
      const zoneId = execSync(
        `az network private-dns zone show --resource-group ${zoneRg} --name ${endpoint.privateDnsZoneName} --query id -o tsv`,
        { encoding: 'utf8', stdio: 'pipe' }
      ).trim();
      console.log(`[create] DNS zone group ${dnsZoneGroupName} -> ${endpoint.privateDnsZoneName}`);
      execSync(
        `az network private-endpoint dns-zone-group create --resource-group ${endpointRg} --endpoint-name ${endpoint.endpointName} --name ${dnsZoneGroupName} --private-dns-zone ${zoneId} --zone-name ${endpoint.privateDnsZoneName}`,
        { stdio: 'inherit' }
      );
    } else {
      console.log(`[skip] DNS zone group ${dnsZoneGroupName} already exists on ${endpoint.endpointName}`);
    }
  }
  console.log('Private link endpoints configured (verify DNS resolution from spoke workloads).');
  console.log(`Private link registry: ${privateLinkRegistryPath}`);
}

console.log(`Registry: ${registryPath}`);
NODE
