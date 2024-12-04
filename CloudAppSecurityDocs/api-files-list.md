---
title: List - Files API
description: This article describes the list request in Cloud App Security's Files API.
ms.date: 03/27/2020
ms.topic: reference
---
# List - Files API

[!INCLUDE [Banner for top of topics](includes/banner.md)]

> [!NOTE]
>
> - This API will soon be deprecated. Microsoft Cloud App Security is developing a new solution for identifying and acting upon files that violate policies.
> - This endpoint may time out when filtering and paginating large collections.
> - This API is not available for Office 365 Cloud App Security.

Run the GET or POST request to fetch a list of files matching the specified filters.

## HTTP request

```rest
GET /api/v1/files/
```

```rest
POST /api/v1/files/
```

## Request BODY parameters

| Parameter | Description |
| --- | --- |
| filters | Filter objects with all the search filters for the request, see [file filters](api-files.md#filters) for more details |
| skip | Skips the specified number of records |
| limit | Maximum number of records returned by the request |

## Example

### Request

Here is an example of the request.

```rest
curl -XPOST -H "Authorization:Token <your_token_key>" "https://<tenant_id>.<tenant_region>.contoso.com/api/v1/files/" -d '{
  "filters": {
    // some filters
  },
  "skip": 5,
  "limit": 10
  ...
}'
```

### Response

Returns a list of files in JSON format.

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
