---
title: Connect ServiceNow to Cloud App Security
description: This article provides information about how to connect your ServiceNow app to Cloud App Security using the API connector for visibility and control over use.

ms.date: 03/10/2021
ms.topic: how-to
---
# Connect ServiceNow to Microsoft Cloud App Security

[!INCLUDE [Banner for top of topics](includes/banner.md)]

This article provides instructions for connecting Microsoft Cloud App Security to your existing ServiceNow account using the app connector API. This connection gives you visibility into and control over ServiceNow use. For information about how Cloud App Security protects ServiceNow, see [Protect ServiceNow](protect-servicenow.md).

> [!NOTE]
> We recommend deploying ServiceNow  using OAuth app tokens, available for Fuji and later releases (see the relevant [ServiceNow documentation](https://docs.servicenow.com/bundle/paris-platform-administration/page/administer/security/concept/c_OAuthApplications.html#c_OAuthApplications).
> For earlier releases, a [legacy connection mode](#legacy-servicenow-connection) is available based on user/password. The username/password provided are only used for API token generation and are not saved after the initial connection process.

> [!NOTE]
> Cloud App Security supports the following ServiceNow versions: Eureka, Fiji, Geneva, Helsinki, Istanbul, Jakarta, Kingston, London, Madrid, New York, Orlando and Paris. In order to connect ServiceNow with Cloud App Security, you must have the role **Admin** and make sure the ServiceNow instance supports API access. For more information, see the [ServiceNow Product Documentation](https://docs.servicenow.com/bundle/paris-platform-administration/page/administer/security/concept/c_OAuthApplications.html#c_OAuthApplications).

## How to connect ServiceNow to Cloud App Security using OAuth

1. Sign in with an Admin account to your ServiceNow account.

    > [!NOTE]
    > The username/password provided are only used for API token generation and are not saved after the initial connection process.

2. In the **Filter navigator** search bar, type **OAuth** and select **Application Registry**.

3. In the **Application Registries** menu bar, select **New** to create a new OAuth profile.

    ![ServiceNow new OAuth profile](media/servicenow-app-registry.png)

4. Under **What kind of OAuth application?**, select **Create an OAuth API endpoint for external clients**.

    ![ServiceNow OAuth type](media/servicenow-oauth-app-type.png)

5. Under **Application Registries New record** fill in the following fields:

    - **Name** field, name the new OAuth profile, for example, CloudAppSecurity.

    - The **Client ID** is generated automatically. Copy this ID, you need to paste it into Cloud App Security to complete connection.

    - In the **Client Secret** field, enter a string. If left empty, a random Secret is generated automatically. Copy and save it for later.

    - Increase the **Access Token Lifespan** to at least 3,600.

    - Select **Submit**.

    ![ServiceNow profile IDs](media/servicenow-profile-ids.png)

6. In the [Cloud App Security portal](https://portal.cloudappsecurity.com/), select **Investigate** and then **Connected apps**.

7. In the **App connectors** page, select the plus button and then **ServiceNow**.

    ![connect ServiceNow](media/connect-servicenow.png "connect ServiceNow")

8. In the pop-up, add your ServiceNow user ID, password, instance URL, Client ID, and Client secret in the appropriate boxes. To find your ServiceNow User ID, in the ServiceNow portal, go to **Users** and then locate your name in the table.

    ![ServiceNow user ID](media/servicenow-userid.png)

9. Select **Connect**.

    ![ServiceNow connect to CAS](media/servicenow-portal-connect.png "ServiceNow connect in portal")

10. Make sure the connection succeeded by selecting **Test now**.

    Testing may take a couple of minutes. After receiving a success notice, select **Close**.

After connecting ServiceNow, you'll receive events for seven days prior to connection.

## Legacy ServiceNow connection

To connect ServiceNow with Cloud App Security, you must have admin-level permissions and make sure the ServiceNow instance supports API access.

1. Sign in with an Admin account to your ServiceNow account.

2. Create a new service account for Cloud App Security and attach the Admin role to the newly created account.

3. Make sure the REST API plug-in is turned on.

    ![ServiceNow account](media/servicenow-account.png "ServiceNow account")

4. In the [Cloud App Security portal](https://portal.cloudappsecurity.com/), select **Investigate** and then **Sanctioned apps**.

5. In the ServiceNow row, select **Connect** in the **App Connector status** column, or select the **Connect an app** button and then **ServiceNow**.

   ![connect ServiceNow](media/connect-servicenow.png "connect ServiceNow")

6. In the ServiceNow settings page, on the API tab, add your ServiceNow user ID, password, and instance URL in the appropriate boxes.

7. Select **Connect**.

    ![ServiceNow update password](media/servicenow-update-password.png "ServiceNow update password")

8. Make sure the connection succeeded by selecting **Test API**.

    Testing may take a couple of minutes. After receiving a success notice, select **Close**.

After connecting ServiceNow, you'll receive events for seven days prior to connection.

If you have any problems connecting the app, see [Troubleshooting App Connectors](troubleshooting-api-connectors-using-error-messages.md).

## Next steps

> [!div class="nextstepaction"]
> [Control cloud apps with policies](control-cloud-apps-with-policies.md)

[!INCLUDE [Open support ticket](includes/support.md)]
