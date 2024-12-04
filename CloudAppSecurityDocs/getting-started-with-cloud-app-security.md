---
title: Deploy Cloud App Security
description: This quickstart outlines the process for getting Cloud App Security up and running so you have cloud app use, insight, and control.
ms.date: 02/10/2021
ms.topic: quickstart
---

# Quickstart: Get started with Microsoft Cloud App Security

[!INCLUDE [Banner for top of topics](includes/banner.md)]

This quickstart provides you with steps for getting up and running with Cloud App Security. Microsoft Cloud App Security can help you take advantage of the benefits of cloud applications while maintaining control of your corporate resources. It works by improving visibility of cloud activity and helping to increase the protection of corporate data. In this article, we walk you through the steps you take to set up and work with Microsoft Cloud App Security.

## Prerequisites

- In order for your organization to be in compliance for licensing Microsoft Cloud App Security, you must obtain a license for every user protected by Microsoft Cloud App Security. For pricing details, see the [Cloud App Security licensing datasheet](https://aka.ms/mcaslicensing).

    For tenant activation support, see [Ways to contact support for business products - Admin Help](https://support.office.com/article/Contact-Office-365-for-business-support-Admin-Help-32a17ca7-6fa0-4870-8a8d-e25ba4ccfd4b).

    >[!NOTE]
    >Microsoft Cloud App Security is a security tool and therefore doesn't require Office 365 productivity suite licenses. For [Office 365 Cloud App Security](editions-cloud-app-security-o365.md) (Microsoft Cloud App Security only for Office 365), see [Office 365 Cloud App Security licensing](/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/microsoft-365-security-compliance-licensing-guidance#office-365-cloud-app-security).

- After you have a license for Cloud App Security, you'll receive an email with activation information and a link to the Cloud App Security portal.

- To set up Cloud App Security, you must be a Global Administrator or a Security Administrator in Azure Active Directory or Office 365. It's important to understand that a user who is assigned an admin role will have the same permissions across all of the cloud apps that your organization has subscribed to. This is regardless of whether you assign the role in the Microsoft 365 admin center, or in the Azure classic portal, or by using the Azure AD module for [Windows PowerShell](/microsoft-365/enterprise/assign-roles-to-user-accounts-with-microsoft-365-powershell?view=o365-worldwide&preserve-view=true). For more information, see [Assign admin roles](https://support.office.com/article/Assigning-admin-roles-in-Office-365-eac4d046-1afd-4f1a-85fc-8219c79e1504) and [Assigning administrator roles in Azure Active Directory](/azure/active-directory/users-groups-roles/directory-assign-admin-roles).

- To run the Cloud App Security portal, use Internet Explorer 11, Microsoft Edge (latest), Google Chrome (latest), Mozilla Firefox (latest), or Apple Safari (latest).

## To access the portal

To access the Cloud App Security portal, go to [https://portal.cloudappsecurity.com](https://portal.cloudappsecurity.com). You can also access the portal through the **[Microsoft 365 admin center](https://security.microsoft.com)**, as follows:

1. In the [Microsoft 365 admin center](https://admin.microsoft.com/), in the side menu, click **show all**, and then select **Security**.

    ![Access from Microsoft 365 admin center](media/access-from-o365.png)

1. In the Microsoft 365 security page, click **More resources**, and then select **Cloud App Security**.

    ![Select Cloud App Security](media/access-from-o365-s2.png)

## Step 1. [Set instant visibility, protection, and governance actions for your apps](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md)

Required task: Connect apps

1. From the settings cog, select **App connectors**.
1. Click the plus sign (**+**) to add an app and select an app.
1. Follow the configuration steps to connect the app.

**Why connect an app?**
After you connect an app, you can gain deeper visibility so you can investigate activities, files, and accounts for the apps in your cloud environment.

## Step 2. [Protect sensitive information with DLP policies](policies-information-protection.md)

Recommended task: Enable file monitoring and create file policies

1. Go to **Settings**, and then under **Information Protection**, select **Files**.
1. Select **Enable file monitoring** and then click **Save**.
1. If you use Azure Information Protection classification labels, under **Information Protection**, select **Azure Information Protection**.
1. Select the required settings and then click **Save**.
1. In [step 3](#step-3), create [File policies](data-protection-policies.md) to meet your organizational requirements.

> [!TIP]
> You can view files from your connected apps by browsing to **Investigate** > **Files**.

**Migration recommendation**  
We recommend using Cloud App Security sensitive information protection in parallel with your current Cloud Access Security Broker (CASB) solution. Start by [connecting the apps you want to protect](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md) to Microsoft Cloud App Security. Since API connectors use out-of-band connectivity, no conflict will occur. Then progressively migrate your [policies](control-cloud-apps-with-policies.md) from your current CASB solution to Cloud App Security.

> [!NOTE]
> For third-party apps, verify that the current load does not exceed the app's maximum number of allowed API calls.

<a name="step-3"></a>

## Step 3. [Control cloud apps with policies](control-cloud-apps-with-policies.md)

Required task: Create policies

### To create policies

1. Go to **Control** > **Templates**.
1. Select a policy template from the list, and then choose (+) **Create policy**.
1. Customize the policy (select filters, actions, and other settings), and then choose **Create**.
1. On the **Policies** tab, choose the policy to see the relevant matches (activities, files, alerts).

> [!TIP]
> To cover all your cloud environment security scenarios, create a policy for each **risk category**.

### How can policies help your organization?

You can use policies to help you monitor trends, see security threats, and generate customized reports and alerts. With policies, you can create governance actions, and set data loss prevention and file-sharing controls.

## Step 4. [Set up Cloud Discovery](set-up-cloud-discovery.md)

Required task: Enable Cloud App Security to view your cloud app use

1. [Integrate with Microsoft Defender for Endpoint](mde-integration.md) to automatically enable Cloud App Security to monitor your Windows 10 devices inside and outside your corporation.
1. If you use [Zscaler, integrate](zscaler-integration.md) it with Cloud App Security.
1. To achieve full coverage, create a continuous Cloud Discovery report

    1. From the settings cog, select   **Cloud Discovery settings**.
    1. Choose **Automatic log upload**.
    1. On the **Data sources** tab, add your sources.
    1. On the **Log collectors** tab, configure the log collector.

**Migration recommendation**  
We recommend using Cloud App Security discovery in parallel with your current CASB solution. Start by configuring automatic firewall log upload to Cloud App Security [log collectors](discovery-docker.md). If you use Defender for Endpoint, in Microsoft Defender Security Center, make sure you [turn on the option](mde-integration.md#how-to-integrate-microsoft-defender-for-endpoint-with-cloud-app-security) to forward signals to Cloud App Security. Configuring Cloud Discovery will not conflict with the log collection of your current CASB solution.

### To create a snapshot Cloud Discovery report

Go to **Discover** > **Snapshot report** and follow the steps shown.

### Why should you configure Cloud Discovery reports?

Having visibility into shadow IT in your organization is critical.
After your logs are analyzed, you can easily find which cloud apps are being used, by which people, and on which devices.

## Step 5. [Deploy Conditional Access App Control for featured apps](proxy-deployment-aad.md)

Recommended task: Deploy Conditional Access App Control for featured apps

1. Configure your IdP to work with Cloud App Security. If you have Azure AD, you can leverage inline controls such as *Monitor only* and *Block downloads* which will work for any featured app out of the box.
1. Onboard apps onto access and session controls.
    1. From the settings cog, select **Conditional Access App Control**.
    1. Sign in to each app using a user scoped to the policy
    1. Refresh the **Conditional Access App Control** page and to view the app.
1. Verify the apps are configured to use access and session controls

To configure session controls for custom line-of-business apps, non-featured SaaS apps, and on-premise apps, see [Onboard and deploy Conditional Access App Control for any app](proxy-deployment-any-app.md).

**Migration recommendation**  
Using Conditional Access App Control in parallel with another CASB solution can potentially lead to an app being proxied twice, causing latency or other errors. Therefore, we recommended progressively migrating apps and policies to Conditional Access App Control, creating the relevant session or access policies in  Cloud App Security as you go.

## Step 6. [Personalize your experience](mail-settings.md)

Recommended task: Add your organization details

### To enter email settings

1. From the settings cog, select **Mail settings**.
1. Under **Email sender identity**, enter your email addresses and display name.
1. Under **Email design**, upload your organization's email template.

### To set admin notifications

1. In the navigation bar, choose your user name, and then go to **User settings**.
1. Under **Notifications**, configure the methods you want to set for system notifications.
1. Choose **Save**.

### To customize the score metrics

1. From the settings cog, select **Cloud Discovery settings**.
1. From the settings cog, select **Cloud Discovery settings**.
1. Under **Score metrics**, configure the importance of various risk values.
1. Choose **Save**.

Now the risk scores given to discovered apps are configured precisely according to your organization needs and priorities.

### Why personalize your environment?

Some features work best when they're customized to your needs.
Provide a better experience for your users with your own email templates. Decide what notifications you receive and customize your risk score metric to fit your organization's preferences.

## Step 7. [Organize the data according to your needs](ip-tags.md)

Recommended task: Configure important settings

### To create IP address tags

1. From the settings cog, select **Cloud Discovery settings**.
1. From the settings cog, select **IP address ranges**.
1. Click the plus sign (**+**) to add an IP address range.
1. Enter the IP range **details**, **location**, **tags**, and **category**.
1. Choose **Create**.

    Now you can use IP tags when you create policies, and when you filter and create continuous reports.

### To create continuous reports

1. From the settings cog, **Cloud Discovery settings**.
1. Under **Continuous reports**, choose **Create report**.
1. Follow the configuration steps.
1. Choose **Create**.

Now you can view discovered data based on your own preferences, such as business units or IP ranges.

### To add domains

1. From the settings cog, select **Settings**.
1. Under **Organization details**, add your organization's internal domains.
1. Choose **Save**.

### Why should you configure these settings?

These settings help give you better control of features in the console. With IP tags, it's easier to create policies that fit your needs, to accurately filter data, and more. Use Data views to group your data into logical categories.

## Next steps

> [!div class="nextstepaction"]
> [Control cloud apps with policies](control-cloud-apps-with-policies.md).

[!INCLUDE [Open support ticket](includes/support.md)].
