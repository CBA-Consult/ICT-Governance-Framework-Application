---
title: Generate block script - Cloud Discovery API
description: This article describes the discovery_block_scripts request in Cloud App Security's Cloud Discovery API.
ms.date: 03/27/2020
ms.topic: reference
---
# Generate block script - Cloud Discovery API

[!INCLUDE [Banner for top of topics](includes/banner.md)]

> [!NOTE]
> This request is not available for Office 365 Cloud App Security.

Run the GET request to get a block script for your network appliance.

## HTTP request

```rest
GET /api/discovery_block_scripts/
```

## Request URL parameters

| Parameter | Description |
| --- | --- |
| format | The format of the network appliance. |

The following formats are currently supported:

| Appliance | Format |
| --- | --- |
| BlueCoat ProxySG | 102 |
| Cisco ASA | 104 |
| Fortinet FortiGate | 108 |
| Juniper SRX | 129 |
| Palo Alto | 112 |
| Websense | 135 |
| Zscaler | 120 |

> [!NOTE]
> If you can't find your appliance, generate a block script manually using the portal.

## Response

This request returns the block script as text.

## Example

### Request

Here is an example of the request.

```rest
curl -XGET -H "Authorization:Token <your_token_key>" "https://<tenant_id>.<tenant_region>.contoso.com/api/discovery_block_scripts/?format=102&type=banned"
```

### Response

```text
url.domain=application.com deny
url.domain=application.be deny
url.domain=application.co deny
```

[!INCLUDE [Open support ticket](includes/support.md)]
