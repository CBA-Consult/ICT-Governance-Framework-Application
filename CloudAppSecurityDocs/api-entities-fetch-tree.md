---
title: Fetch entity tree - Entities API
description: This article describes the fetch entity tree request in Cloud App Security's Entities API.
ms.date: 03/27/2020
ms.topic: reference
---
# Fetch entity tree - Entities API

[!INCLUDE [Banner for top of topics](includes/banner.md)]

> [!NOTE]
> This request is not available for Office 365 Cloud App Security.

Run the GET request to fetch all entities related to the entity matching the specified primary key. If the entity is a user, fetches all accounts associated with the user. If the entity is an account, fetches the entity's parent and siblings.

## HTTP request

```rest
GET /api/v1/entities/<pk>/retrieve_tree/
```

## Request URL parameters

| Parameter | Description |
| --- | --- |
| pk | The ID of the entity |

## Example

### Request

Here is an example of the request.

```rest
curl -XPOST -H "Authorization:Token <your_token_key>" "https://<tenant_id>.<tenant_region>.contoso.com/api/v1/entities/<pk>/retrieve_tree/"
```

### Response

Returns the specified entity tree in JSON format.

```json
{
  // entity tree record
}
```

[!INCLUDE [Open support ticket](includes/support.md)]
