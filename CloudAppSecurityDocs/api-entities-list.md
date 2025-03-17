---
title: List - Entities API
description: This article describes the list request in Cloud App Security's Entities API.
ms.date: 03/27/2020
ms.topic: reference
---
# List - Entities API

[!INCLUDE [Banner for top of topics](includes/banner.md)]

> [!NOTE]
> This request is not available for Office 365 Cloud App Security.

Run the GET or POST request to fetch a list of entities matching the specified filters.

## HTTP request

```rest
GET /api/v1/entities/
```

```rest
POST /api/v1/entities/
```

## Request BODY parameters

| Parameter | Description |
| --- | --- |
| filters | Filter objects with all the search filters for the request, see [entity filters](api-entities.md#filters) for more details |
| sortDirection | The sorting direction. Possible values are: `asc` and `desc` |
| sortField | Fields used to sort entities. Possible values are:<br />- **date**: The date when then the entity was created<br />- **severity**: The severity of the entity |
| skip | Skips the specified number of records |
| limit | Maximum number of records returned by the request |

## Example

### Request

Here is an example of the request.

```rest
curl -XPOST -H "Authorization:Token <your_token_key>" "https://<tenant_id>.<tenant_region>.contoso.com/api/v1/entities/" -d '{
  "filters": {
    // some filters
  },
  "skip": 5,
  "limit": 10
  ...
}'
```

### Response

Returns a list of activities in JSON format.

```json
{
  "total": 5 // total number of records
  "hasNext": true // whether there is more data to show or not.
  "data": [
    // returned records
  ]
}
```

[!INCLUDE [Open support ticket](includes/support.md)]
