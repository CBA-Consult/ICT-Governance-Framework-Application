The document outlines the following principles for using Azure API Center and similar technologies to detect drift within infrastructure as code (IaC) approved infrastructure:

Version Control APIs: Azure API Center enables you to version control API updates using the "Api Versions - Create Or Update" REST API. This practice ensures that each API change is tracked and managed as part of the IaC workflow.

Automated Change Detection: By leveraging version control for APIs, you can programmatically compare deployed API versions with the approved versions defined in your IaC repositories. This helps detect drift—unauthorized or unexpected changes—from the approved infrastructure state.

Lifecycle Management: Each API version includes properties such as lifecycleStage (e.g., production, preview) and title. Managing these attributes ensures consistent deployment and helps track the intended state of infrastructure components.

Auditable Change History: The API Center records metadata like creation and last modified timestamps, which supports traceability and auditability for compliance and governance.

Integration with Automation: The REST API endpoints and versioning model are designed for integration into CI/CD pipelines and automated drift detection tools, supporting a modern, governed approach to infrastructure management.

In summary, the methodology emphasizes automated, version-controlled, and auditable management of APIs and infrastructure, enabling early detection of drift and supporting robust governance in a multi-cloud environment.

In Azure API Center, you can version control API updates using the "Api Versions - Create Or Update" REST API¹. This allows you to create new API versions or update existing ones. Here's how it works:

1. **HTTP Request:**
   - **Method:** PUT
   - **Endpoint:** `https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiCenter/services/{serviceName}/workspaces/{workspaceName}/apis/{apiName}/versions/{versionName}?api-version=2024-03-01`
   - **URI Parameters:**
     - `apiName`: The name of the API (regex pattern: ^[a-zA-Z0-9-]{3,90}$).
     - `resourceGroupName`: The name of the resource group (case insensitive).
     - `serviceName`: The name of the Azure API Center service (regex pattern: ^[a-zA-Z0-9-]{3,90}$).
     - `subscriptionId`: The ID of the target subscription (must be a UUID).
     - `versionName`: The name of the API version (regex pattern: ^[a-zA-Z0-9-]{3,90}$).
   - **Request Body:**
     - `properties.lifecycleStage`: Current lifecycle stage of the API.
     - `properties.title`: API version title.
   - **Responses:**
     - Status code 200: 'ApiVersion' update operation succeeded.
     - Status code 201: 'ApiVersion' create operation succeeded.

2. **Sample Request (HTTP):**
   ```http
   PUT https://management.azure.com/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/contoso-resources/providers/Microsoft.ApiCenter/services/contoso/workspaces/default/apis/echo-api/versions/2023-01-01?api-version=2024-03-01
   {
       "properties": {
           "title": "2023-01-01",
           "lifecycleStage": "production"
       }
   }
   ```

3. **Sample Response (Status code 200):**
   ```json
   {
       "type": "Microsoft.ApiCenter/services/workspaces/apis/versions",
       "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/contoso-resources/providers/Microsoft.ApiCenter/services/contoso/workspaces/default/apis/echo-api/versions/2023-01-01",
       "name": "2023-01-01",
       "systemData": {
           "createdAt": "2023-07-03T18:27:09.128871Z",
           "lastModifiedAt": "2023-07-03T18:27:09.1288716Z"
       },
       "properties": {
           "title": "2023-01-01",
           "lifecycleStage": "production"
       }
   }
   ```

Remember to replace the placeholders (`{subscriptionId}`, `{resourceGroupName}`, etc.) with actual values specific to your environment. If you need further assistance, feel free to ask! 😊

Source: Conversation with Copilot, 7/17/2024
(1) Api Versions - Create Or Update - REST API (Azure API Center). https://learn.microsoft.com/en-us/rest/api/resource-manager/apicenter/api-versions/create-or-update?view=rest-resource-manager-apicenter-2024-03-01.
(2) API Versioning: When and How to Do It Successfully. https://www.apiboost.com/post/api-versioning-best-practices.
(3) Api Versions - REST API (Azure API Center) | Microsoft Learn. https://learn.microsoft.com/en-us/rest/api/resource-manager/apicenter/api-versions?view=rest-resource-manager-apicenter-2024-03-01.
(4) What is API versioning? Benefits, types & best practices - Postman. https://www.postman.com/api-platform/api-versioning/.
(5) undefined. https://management.azure.com/subscriptions/.
(6) undefined. https://login.microsoftonline.com/common/oauth2/authorize.
(7) undefined. https://management.azure.com/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/contoso-resources/providers/Microsoft.ApiCenter/services/contoso/workspaces/default/apis/echo-api/versions/2023-01-01?api-version=2024-03-01.
