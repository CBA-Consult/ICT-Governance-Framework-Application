# Global network infrastructure (ADPA)

Regional **hub** resource groups, hub VNets, and Azure-required subnets for hub-spoke topology.

| Hub | VNet | Prefix | GatewaySubnet | AzureFirewallSubnet | AzureBastionSubnet | snet-shared |
|-----|------|--------|---------------|---------------------|--------------------|-------------|
| APAC | `vnet-hub-apac-01` | `10.10.0.0/16` | `10.10.0.0/24` | `10.10.1.0/24` | `10.10.2.0/24` | `10.10.3.0/24` |
| EMEA | `vnet-hub-emea-01` | `10.20.0.0/16` | `10.20.0.0/24` | `10.20.1.0/24` | `10.20.2.0/24` | `10.20.3.0/24` |
| AMERS | `vnet-hub-amers-01` | `10.30.0.0/16` | `10.30.0.0/24` | `10.30.1.0/24` | `10.30.2.0/24` | `10.30.3.0/24` |

The hub foundation (resource groups, VNets, subnets) is **free of billable add-on charges**. Reserved subnets (`GatewaySubnet`, `AzureFirewallSubnet`, `AzureBastionSubnet`) have no cost until the corresponding resource is deployed.

| Step | Add-on | Resource | Approx. cost | Default script |
|------|--------|----------|--------------|----------------|
| 4 | Azure Firewall | `azfw-hub-*` | ~$912/mo Standard + per-GB | **Not deployed** |
| 5a | VPN Gateway | `vgw-hub-*` | ~$153/mo VpnGw1AZ + public IP | **Not deployed** |
| 5b | ExpressRoute Gateway | `ergw-hub-*` | ~$264/mo ErGw1AZ (+ circuit fees) | **Not deployed** |
| 6 | Azure Bastion | `bas-hub-*` | ~$139/mo Basic + public IP | **Not deployed** |
| 7 | Global VNet peering | `peer-*-to-*` | No hourly fee; **per-GB cross-region transfer** | **Not configured** |
| 8 | Spoke ↔ hub peering | `spoke-to-hub` / `peer-hub-to-*` | No hourly fee; **~$0.02/GB same-region** | **Not configured** |
| 9 | Spoke UDR → firewall | `rt-apac` / `rt-emea` / `rt-amers` | Route table **free**; **firewall per-GB applies** | **Not configured** |
| 10 | Private DNS zones + VNet links | `privatelink.*` | ~$0.50/zone/month per region + queries | **Not configured** |
| 11 | Private Link endpoints | `pe-*` on spoke `snet-data` | ~$0.01/hour per endpoint + data processing | **Not configured** |

**GatewaySubnet rule:** one virtual network gateway per hub — choose **VPN or ExpressRoute**, not both.

Canonical registry: [`global-network-hubs.json`](./global-network-hubs.json)

## Automated setup (resource groups + VNets + subnets only)

Default — **does not** create Azure Firewall or billable public IPs:

```powershell
.\scripts\setup-global-network-hubs.ps1
# or
npm run adpa:setup:global-hubs
```

```bash
./scripts/setup-global-network-hubs.sh
```

Partial runs:

```powershell
.\scripts\setup-global-network-hubs.ps1 -VnetsOnly
.\scripts\setup-global-network-hubs.ps1 -SubnetsOnly    # VNets must exist
```

```bash
VNETS_ONLY=1 ./scripts/setup-global-network-hubs.sh
SUBNETS_ONLY=1 ./scripts/setup-global-network-hubs.sh
```

## Optional add-on: Azure Firewall (client opt-in)

Direct Azure subscription cost. Requires `AzureFirewallSubnet` and **explicit cost acknowledgment**:

```powershell
.\scripts\setup-global-network-hubs.ps1 -FirewallOnly -AcknowledgeFirewallCost
# single region:
.\scripts\setup-global-network-hubs.ps1 -FirewallOnly -AcknowledgeFirewallCost -HubId hub-apac
```

```bash
FIREWALL_ONLY=1 ACKNOWLEDGE_FIREWALL_COST=1 ./scripts/setup-global-network-hubs.sh
HUB_ID=hub-apac FIREWALL_ONLY=1 ACKNOWLEDGE_FIREWALL_COST=1 ./scripts/setup-global-network-hubs.sh
```

```bash
npm run adpa:setup:global-hubs:firewall
```

See `optionalAddOns.azureFirewall` in the registry for estimated pricing and governance linkage.

## Optional add-on: VPN Gateway (Step 5 — site-to-site / point-to-site)

Direct Azure subscription cost. Requires `GatewaySubnet` and **explicit cost acknowledgment**. Mutually exclusive with ExpressRoute gateway on the same hub.

| Hub | Gateway | Public IP |
|-----|---------|-----------|
| APAC | `vgw-hub-apac` | `pip-vpn-apac` |
| EMEA | `vgw-hub-emea` | `pip-vpn-emea` |
| AMERS | `vgw-hub-amers` | `pip-vpn-amers` |

```powershell
.\scripts\setup-global-network-hubs.ps1 -VpnGatewayOnly -AcknowledgeVpnGatewayCost
.\scripts\setup-global-network-hubs.ps1 -VpnGatewayOnly -AcknowledgeVpnGatewayCost -HubId hub-apac
```

```bash
VPN_GATEWAY_ONLY=1 ACKNOWLEDGE_VPN_GATEWAY_COST=1 ./scripts/setup-global-network-hubs.sh
HUB_ID=hub-apac VPN_GATEWAY_ONLY=1 ACKNOWLEDGE_VPN_GATEWAY_COST=1 ./scripts/setup-global-network-hubs.sh
```

```bash
npm run adpa:setup:global-hubs:vpn-gateway
```

Manual APAC example:

```bash
az network public-ip create \
  --name pip-vpn-apac \
  --resource-group rg-hub-apac \
  --location southeastasia \
  --sku Standard

az network vnet-gateway create \
  --name vgw-hub-apac \
  --resource-group rg-hub-apac \
  --location southeastasia \
  --vnet vnet-hub-apac-01 \
  --public-ip-address pip-vpn-apac \
  --gateway-type Vpn \
  --vpn-type RouteBased \
  --sku VpnGw1AZ
```

## Optional add-on: ExpressRoute Gateway (Step 5 — private peering)

Gateway hourly cost only — **ExpressRoute circuit bandwidth is provisioned and billed separately** with your carrier.

| Hub | Gateway |
|-----|---------|
| APAC | `ergw-hub-apac` |
| EMEA | `ergw-hub-emea` |
| AMERS | `ergw-hub-amers` |

```powershell
.\scripts\setup-global-network-hubs.ps1 -ExpressRouteGatewayOnly -AcknowledgeExpressRouteGatewayCost
.\scripts\setup-global-network-hubs.ps1 -ExpressRouteGatewayOnly -AcknowledgeExpressRouteGatewayCost -HubId hub-apac
```

```bash
EXPRESSROUTE_GATEWAY_ONLY=1 ACKNOWLEDGE_EXPRESSROUTE_GATEWAY_COST=1 ./scripts/setup-global-network-hubs.sh
```

```bash
npm run adpa:setup:global-hubs:expressroute-gateway
```

Manual APAC example:

```bash
az network vnet-gateway create \
  --name ergw-hub-apac \
  --resource-group rg-hub-apac \
  --location southeastasia \
  --vnet vnet-hub-apac-01 \
  --gateway-type ExpressRoute \
  --sku ErGw1AZ
```

## Optional add-on: Azure Bastion (Step 6 — secure VM access)

Direct Azure subscription cost. Billed **hourly while deployed**, even with no active sessions. Requires `AzureBastionSubnet` (/26 or larger) and **explicit cost acknowledgment**.

| Hub | Bastion host | Public IP |
|-----|--------------|-----------|
| APAC | `bas-hub-apac` | `pip-bastion-apac` |
| EMEA | `bas-hub-emea` | `pip-bastion-emea` |
| AMERS | `bas-hub-amers` | `pip-bastion-amers` |

```powershell
.\scripts\setup-global-network-hubs.ps1 -BastionOnly -AcknowledgeBastionCost
.\scripts\setup-global-network-hubs.ps1 -BastionOnly -AcknowledgeBastionCost -HubId hub-apac
```

```bash
BASTION_ONLY=1 ACKNOWLEDGE_BASTION_COST=1 ./scripts/setup-global-network-hubs.sh
HUB_ID=hub-apac BASTION_ONLY=1 ACKNOWLEDGE_BASTION_COST=1 ./scripts/setup-global-network-hubs.sh
```

```bash
npm run adpa:setup:global-hubs:bastion
```

Manual APAC example:

```bash
az network public-ip create \
  --name pip-bastion-apac \
  --resource-group rg-hub-apac \
  --location southeastasia \
  --sku Standard

az network bastion create \
  --name bas-hub-apac \
  --resource-group rg-hub-apac \
  --location southeastasia \
  --vnet-name vnet-hub-apac-01 \
  --public-ip-address pip-bastion-apac \
  --sku Basic
```

See `optionalAddOns.azureBastion` in the registry. For non-production/dev-only access, Azure Bastion **Developer** SKU is free but is not used by this hub registry.

## Optional connectivity: Global VNet Peering (Step 7)

Connects regional hubs in a **full mesh** (APAC ↔ EMEA ↔ AMERS). No hourly peering charge, but **cross-region data transfer is billed per GB** and grows with inter-hub traffic.

Governance defaults (non-transitive hub policy):

- `allowVnetAccess`: true
- `allowForwardedTraffic`: false
- `allowGatewayTransit`: false
- `useRemoteGateways`: false

| Link | Peering names |
|------|----------------|
| APAC ↔ EMEA | `peer-apac-to-emea` / `peer-emea-to-apac` |
| APAC ↔ AMERS | `peer-apac-to-amers` / `peer-amers-to-apac` |
| EMEA ↔ AMERS | `peer-emea-to-amers` / `peer-amers-to-emea` |

Requires all hub VNets to exist with non-overlapping prefixes (`10.10/10.20/10.30`).

```powershell
.\scripts\setup-global-network-hubs.ps1 -GlobalPeeringOnly -AcknowledgeGlobalPeeringCost
.\scripts\setup-global-network-hubs.ps1 -GlobalPeeringOnly -AcknowledgeGlobalPeeringCost -HubId hub-apac
```

```bash
GLOBAL_PEERING_ONLY=1 ACKNOWLEDGE_GLOBAL_PEERING_COST=1 ./scripts/setup-global-network-hubs.sh
HUB_ID=hub-apac GLOBAL_PEERING_ONLY=1 ACKNOWLEDGE_GLOBAL_PEERING_COST=1 ./scripts/setup-global-network-hubs.sh
```

```bash
npm run adpa:setup:global-hubs:peering
```

Manual APAC → EMEA example (both legs required):

```bash
REMOTE_ID=$(az network vnet show -g rg-hub-emea -n vnet-hub-emea-01 --query id -o tsv)

az network vnet peering create \
  --name peer-apac-to-emea \
  --resource-group rg-hub-apac \
  --vnet-name vnet-hub-apac-01 \
  --remote-vnet "$REMOTE_ID" \
  --allow-vnet-access true \
  --allow-forwarded-traffic false \
  --allow-gateway-transit false \
  --use-remote-gateways false

REMOTE_ID=$(az network vnet show -g rg-hub-apac -n vnet-hub-apac-01 --query id -o tsv)

az network vnet peering create \
  --name peer-emea-to-apac \
  --resource-group rg-hub-emea \
  --vnet-name vnet-hub-emea-01 \
  --remote-vnet "$REMOTE_ID" \
  --allow-vnet-access true \
  --allow-forwarded-traffic false \
  --allow-gateway-transit false \
  --use-remote-gateways false
```

See `globalHubPeering` and `optionalAddOns.globalHubPeering` in the registry.

## Optional connectivity: Spoke VNet peering (Step 8)

Connect each **workload (spoke) VNet** to its regional hub. Registry: [`spoke-hub-peering.json`](./spoke-hub-peering.json).

**Both peering legs are required** (spoke→hub and hub→spoke). Default policy enables spokes to use the **hub VPN/ExpressRoute gateway** via `useRemoteGateways` on the spoke leg and `allowGatewayTransit` on the hub leg.

| Spoke | Hub | Prefix |
|-------|-----|--------|
| `vnet-app-apac` (rg-app-apac) | `vnet-hub-apac-01` | `10.11.0.0/16` |
| `vnet-app-emea` (rg-app-emea) | `vnet-hub-emea-01` | `10.21.0.0/16` |
| `vnet-app-amers` (rg-app-amers) | `vnet-hub-amers-01` | `10.31.0.0/16` |

**Important:**

- **Gateway:** `--use-remote-gateways` only works after Step 5 (hub VPN or ExpressRoute gateway) is deployed.
- **Firewall:** Peering does **not** route traffic through Azure Firewall automatically. Add spoke **UDRs** pointing to the hub firewall private IP for forced inspection.
- **Cost:** No hourly fee; same-region transfer ~**$0.01/GB in + $0.01/GB out**.

```powershell
.\scripts\setup-global-network-hubs.ps1 -SpokePeeringOnly -AcknowledgeSpokePeeringCost
.\scripts\setup-global-network-hubs.ps1 -SpokePeeringOnly -AcknowledgeSpokePeeringCost -SpokeId app-apac-prod
.\scripts\setup-global-network-hubs.ps1 -SpokePeeringOnly -AcknowledgeSpokePeeringCost -TenantId tenant-contoso-health
```

```bash
SPOKE_PEERING_ONLY=1 ACKNOWLEDGE_SPOKE_PEERING_COST=1 ./scripts/setup-global-network-hubs.sh
SPOKE_ID=app-apac-prod SPOKE_PEERING_ONLY=1 ACKNOWLEDGE_SPOKE_PEERING_COST=1 ./scripts/setup-global-network-hubs.sh
```

```bash
npm run adpa:setup:global-hubs:spoke-peering
```

Manual APAC spoke example (spoke leg — script creates hub leg too):

```bash
HUB_ID=$(az network vnet show -g rg-hub-apac -n vnet-hub-apac-01 --query id -o tsv)

az network vnet peering create \
  --name spoke-to-hub \
  --resource-group rg-app-apac \
  --vnet-name vnet-app-apac \
  --remote-vnet "$HUB_ID" \
  --allow-vnet-access true \
  --allow-forwarded-traffic false \
  --allow-gateway-transit false \
  --use-remote-gateways true
```

Hub return leg (`allow-gateway-transit true`):

```bash
SPOKE_ID=$(az network vnet show -g rg-app-apac -n vnet-app-apac --query id -o tsv)

az network vnet peering create \
  --name peer-hub-to-app-apac-prod \
  --resource-group rg-hub-apac \
  --vnet-name vnet-hub-apac-01 \
  --remote-vnet "$SPOKE_ID" \
  --allow-vnet-access true \
  --allow-forwarded-traffic false \
  --allow-gateway-transit true \
  --use-remote-gateways false
```

Add new workload VNets to `spoke-hub-peering.json` before running Step 8.

## Optional routing: Spoke UDR via hub firewall (Step 9 — critical)

Forces spoke egress through the **hub Azure Firewall** using a route table with `VirtualAppliance` next hop. The firewall private IP is **resolved automatically** from the deployed hub firewall (Step 4).

| Hub | Route table | Resource group | Default route |
|-----|-------------|----------------|---------------|
| APAC | `rt-apac` | `rg-hub-apac` | `0.0.0.0/0` → firewall IP |
| EMEA | `rt-emea` | `rg-hub-emea` | `0.0.0.0/0` → firewall IP |
| AMERS | `rt-amers` | `rg-hub-amers` | `0.0.0.0/0` → firewall IP |

Associated spoke subnets (Contoso demo): `snet-workload`, `snet-data` on each `vnet-app-*`.

**Prerequisites:** Step 4 (hub firewall) + Step 8 (spoke peering) + spoke subnets must exist.

**Cost:** Route tables are free. Inspected traffic uses Azure Firewall hourly + per-GB processing.

```powershell
.\scripts\setup-global-network-hubs.ps1 -SpokeRoutingOnly -AcknowledgeSpokeRoutingCost
.\scripts\setup-global-network-hubs.ps1 -SpokeRoutingOnly -AcknowledgeSpokeRoutingCost -SpokeId app-apac-prod
.\scripts\setup-global-network-hubs.ps1 -SpokeRoutingOnly -AcknowledgeSpokeRoutingCost -TenantId tenant-contoso-health
```

```bash
SPOKE_ROUTING_ONLY=1 ACKNOWLEDGE_SPOKE_ROUTING_COST=1 ./scripts/setup-global-network-hubs.sh
SPOKE_ID=app-apac-prod SPOKE_ROUTING_ONLY=1 ACKNOWLEDGE_SPOKE_ROUTING_COST=1 ./scripts/setup-global-network-hubs.sh
```

```bash
npm run adpa:setup:global-hubs:spoke-routing
```

Manual APAC example (script resolves firewall IP and associates subnets):

```bash
FW_IP=$(az network firewall show -g rg-hub-apac -n azfw-hub-apac \
  --query "ipConfigurations[?name=='configuration'].privateIPAddress | [0]" -o tsv)

az network route-table create \
  --name rt-apac \
  --resource-group rg-hub-apac \
  --location southeastasia

az network route-table route create \
  --resource-group rg-hub-apac \
  --route-table-name rt-apac \
  --name default-route \
  --address-prefix 0.0.0.0/0 \
  --next-hop-type VirtualAppliance \
  --next-hop-ip-address "$FW_IP"

RT_ID=$(az network route-table show -g rg-hub-apac -n rt-apac --query id -o tsv)

az network vnet subnet update \
  --resource-group rg-app-apac \
  --vnet-name vnet-app-apac \
  --name snet-workload \
  --route-table "$RT_ID"
```

See `spokeRouting` in [`spoke-hub-peering.json`](./spoke-hub-peering.json).

## Optional add-on: Private DNS zones (Step 10 — name resolution for Private Link)

Creates regional **Private DNS zones** in each hub resource group and links them to the hub VNet and registered spoke VNets. This is the **DNS layer only** — it does not create private endpoints. Step 11 attaches endpoints to these zones.

| Hub | Resource group | Hub link name | Example zones |
|-----|----------------|---------------|---------------|
| APAC | `rg-hub-apac` | `link-apac` | `privatelink.database.windows.net`, `privatelink.blob.core.windows.net`, … |
| EMEA | `rg-hub-emea` | `link-emea` | same zone set per region |
| AMERS | `rg-hub-amers` | `link-amers` | same zone set per region |

**Prerequisites:** Hub VNet (Steps 1–3). Spoke VNet links use entries in [`spoke-hub-peering.json`](./spoke-hub-peering.json) when `linkSpokeVnets` is enabled.

**Cost:** ~$0.50/zone/month per region plus negligible query charges. Four default zones ≈ ~$2/hub/month.

```powershell
.\scripts\setup-global-network-hubs.ps1 -PrivateDnsOnly -AcknowledgePrivateDnsCost
.\scripts\setup-global-network-hubs.ps1 -PrivateDnsOnly -AcknowledgePrivateDnsCost -HubId hub-apac
```

```bash
PRIVATE_DNS_ONLY=1 ACKNOWLEDGE_PRIVATE_DNS_COST=1 ./scripts/setup-global-network-hubs.sh
HUB_ID=hub-apac PRIVATE_DNS_ONLY=1 ACKNOWLEDGE_PRIVATE_DNS_COST=1 ./scripts/setup-global-network-hubs.sh
```

```bash
npm run adpa:setup:global-hubs:private-dns
```

Canonical zone list: [`private-dns-zones.json`](./private-dns-zones.json).

Manual APAC example (one zone; repeat for each zone and region):

```bash
az network private-dns zone create \
  --resource-group rg-hub-apac \
  --name privatelink.database.windows.net

az network private-dns link vnet create \
  --resource-group rg-hub-apac \
  --zone-name privatelink.database.windows.net \
  --name link-apac \
  --virtual-network vnet-hub-apac-01 \
  --registration-enabled false
```

## Optional add-on: Private Link endpoints (Step 11 — PaaS connectivity)

Deploys **private endpoints** in spoke subnets and registers **A records** in the Step 10 private DNS zones via DNS zone groups. Each endpoint connects one PaaS resource (Key Vault, Storage, SQL, etc.) to the spoke VNet over Private Link.

| Spoke | Example endpoints | Subnet | Target PaaS |
|-------|-------------------|--------|-------------|
| APAC | `pe-kv-apac`, `pe-st-apac`, `pe-sql-apac` | `snet-data` | Key Vault, Storage, SQL in `rg-app-apac` |
| EMEA | `pe-kv-emea`, `pe-st-emea` | `snet-data` | Key Vault, Storage in `rg-app-emea` |
| AMERS | `pe-kv-amers`, `pe-st-amers` | `snet-data` | Key Vault, Storage in `rg-app-amers` |

**Prerequisites:** Step 10 (private DNS zones) + target PaaS resources deployed + spoke `snet-data` subnet exists.

**Cost:** ~$0.01/hour per private endpoint (~$7.30/month each) plus data processing.

**Behavior:** Endpoints whose target resource is not yet deployed are **skipped** (`skipIfTargetMissing: true` in the registry). Add or update entries in [`private-link-endpoints.json`](./private-link-endpoints.json) before running.

```powershell
.\scripts\setup-global-network-hubs.ps1 -PrivateLinkOnly -AcknowledgePrivateLinkCost
.\scripts\setup-global-network-hubs.ps1 -PrivateLinkOnly -AcknowledgePrivateLinkCost -SpokeId app-apac-prod
.\scripts\setup-global-network-hubs.ps1 -PrivateLinkOnly -AcknowledgePrivateLinkCost -TenantId tenant-contoso-health
```

```bash
PRIVATE_LINK_ONLY=1 ACKNOWLEDGE_PRIVATE_LINK_COST=1 ./scripts/setup-global-network-hubs.sh
SPOKE_ID=app-apac-prod PRIVATE_LINK_ONLY=1 ACKNOWLEDGE_PRIVATE_LINK_COST=1 ./scripts/setup-global-network-hubs.sh
```

```bash
npm run adpa:setup:global-hubs:private-link
```

Manual APAC example (Key Vault — target must exist):

```bash
# After Step 10 zones exist and kv-contoso-apac is deployed
az network vnet subnet update \
  --resource-group rg-app-apac \
  --vnet-name vnet-app-apac \
  --name snet-data \
  --disable-private-endpoint-network-policies true

KV_ID=$(az keyvault show -g rg-app-apac -n kv-contoso-apac --query id -o tsv)

az network private-endpoint create \
  --name pe-kv-apac \
  --resource-group rg-app-apac \
  --vnet-name vnet-app-apac \
  --subnet snet-data \
  --location southeastasia \
  --private-connection-resource-id "$KV_ID" \
  --group-id vault \
  --connection-name pe-kv-apac-connection

ZONE_ID=$(az network private-dns zone show \
  -g rg-hub-apac -n privatelink.vaultcore.azure.net --query id -o tsv)

az network private-endpoint dns-zone-group create \
  --resource-group rg-app-apac \
  --endpoint-name pe-kv-apac \
  --name default \
  --private-dns-zone "$ZONE_ID" \
  --zone-name privatelink.vaultcore.azure.net
```

### Step 10 vs Step 11

| | Step 10 — Private DNS | Step 11 — Private Link |
|---|----------------------|------------------------|
| What | DNS zones + VNet links | Private endpoints on PaaS |
| Where | Hub resource group | Spoke subnet (`snet-data`) |
| Resolves | `*.privatelink.*` names | Creates NIC + DNS A record |
| Needs PaaS resource? | No | Yes — target must exist |

## What you end up with (full opt-in stack)

When Steps 1–11 are deployed for a region, each hub/spoke stack provides:

| Capability | Step | Resource |
|------------|------|----------|
| Hub VNet + subnets | 1–3 | `vnet-hub-*-01`, `GatewaySubnet`, `AzureFirewallSubnet`, `AzureBastionSubnet`, `snet-shared` |
| Central security | 4 | `azfw-hub-*` (Azure Firewall) |
| Hybrid connectivity | 5 | `vgw-hub-*` **or** `ergw-hub-*` (one gateway per hub) |
| Secure access | 6 | `bas-hub-*` (Azure Bastion) |
| Global connectivity | 7 | Full-mesh hub peering (`peer-*-to-*`) |
| Peered spokes | 8 | Spoke ↔ hub VNet peering |
| Inspected egress | 9 | Route table `rt-*` → firewall |
| Private DNS (name resolution) | 10 | `privatelink.*` zones + VNet links |
| Private Link (PaaS connectivity) | 11 | `pe-*` endpoints + DNS zone groups |

Cross-region: Steps 7 links APAC, EMEA, and AMERS hubs for global routing (subject to peering data-transfer charges).

## Manual: APAC Azure Firewall

Requires `AzureFirewallSubnet` on `vnet-hub-apac-01`.

```bash
# Public IP for firewall
az network public-ip create \
  --name pip-fw-apac \
  --resource-group rg-hub-apac \
  --location southeastasia \
  --sku Standard

# Firewall
az network firewall create \
  --name azfw-hub-apac \
  --resource-group rg-hub-apac \
  --location southeastasia \
  --sku-name Standard

# Attach to hub VNet (uses AzureFirewallSubnet)
az network firewall ip-config create \
  --firewall-name azfw-hub-apac \
  --name configuration \
  --public-ip-address pip-fw-apac \
  --resource-group rg-hub-apac \
  --vnet-name vnet-hub-apac-01
```

## Manual: EMEA / AMERS firewalls

Repeat with:

| | EMEA | AMERS |
|---|------|-------|
| Public IP | `pip-fw-emea` | `pip-fw-amers` |
| Firewall | `azfw-hub-emea` | `azfw-hub-amers` |
| Resource group | `rg-hub-emea` | `rg-hub-amers` |
| Location | `westeurope` | `westus` |
| VNet | `vnet-hub-emea-01` | `vnet-hub-amers-01` |

## Manual: APAC hub subnets

After `vnet-hub-apac-01` exists in `rg-hub-apac`:

```bash
# Gateway subnet (REQUIRED NAME)
az network vnet subnet create \
  --vnet-name vnet-hub-apac-01 \
  --resource-group rg-hub-apac \
  --name GatewaySubnet \
  --address-prefix 10.10.0.0/24

# Firewall subnet (REQUIRED NAME)
az network vnet subnet create \
  --vnet-name vnet-hub-apac-01 \
  --resource-group rg-hub-apac \
  --name AzureFirewallSubnet \
  --address-prefix 10.10.1.0/24

# Bastion subnet (REQUIRED NAME)
az network vnet subnet create \
  --vnet-name vnet-hub-apac-01 \
  --resource-group rg-hub-apac \
  --name AzureBastionSubnet \
  --address-prefix 10.10.2.0/24

# Shared services
az network vnet subnet create \
  --vnet-name vnet-hub-apac-01 \
  --resource-group rg-hub-apac \
  --name snet-shared \
  --address-prefix 10.10.3.0/24
```

## Manual: EMEA hub subnets

Replace `10.10` → `10.20`, `rg-hub-apac` → `rg-hub-emea`, `vnet-hub-apac-01` → `vnet-hub-emea-01`.

## Manual: AMERS hub subnets

Replace `10.10` → `10.30`, `rg-hub-apac` → `rg-hub-amers`, `vnet-hub-apac-01` → `vnet-hub-amers-01`.

## Bicep (all subnets in one deployment)

`blueprint-templates/infrastructure-blueprints/global-hub-foundation.bicep`

Example APAC parameters file:

```json
{
  "hubId": { "value": "hub-apac" },
  "hubAddressSpace": { "value": "10.10.0.0/16" },
  "gatewaySubnetPrefix": { "value": "10.10.0.0/24" },
  "firewallSubnetPrefix": { "value": "10.10.1.0/24" },
  "bastionSubnetPrefix": { "value": "10.10.2.0/24" },
  "sharedServicesSubnetPrefix": { "value": "10.10.3.0/24" }
}
```

## Governance linkage

- **Requirement:** `adpa/tenants/*/requirements/network-segmentation-requirement.json`
- **Approved infrastructure:** `adpa/tenants/*/approved-infrastructure.json` → `global-regional-hubs`
- **Governed assets:** `adpa/tenants/*/governed-assets.json`
