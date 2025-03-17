---
title: Block downloads from unmanaged devices with Cloud App Security Conditional Access App Control tutorial
description: This tutorial describes the scenario for protecting your organization against downloads of sensitive data by unmanaged devices using Azure AD reverse proxy capabilities.
ms.date: 02/24/2021
ms.topic: tutorial
---
# Tutorial: Block download of sensitive information

[!INCLUDE [Banner for top of topics](includes/banner.md)]

Today's IT admin is stuck between a rock and hard place. You want to enable your employees to be productive. That means allowing employees to access apps so they can work at any time, from any device. However, you want to protect the company's assets including proprietary and privileged information. How can you enable employees to access your cloud apps while protecting your data? **This tutorial allows you to block downloads by users who have access to your sensitive data in enterprise cloud apps from either unmanaged devices or off-corporate network locations.**

In this tutorial, you'll learn how to:

> [!div class="checklist"]
>
> - [Create a block download policy for unmanaged devices](#create-a-block-download-policy-for-unmanaged-devices)
> - [Validate your policy](#validate-your-policy)

## The threat

An account manager in your organization wants to check something in Salesforce from home over the weekend, on their personal laptop. The Salesforce data might include client credit card information or personal information. The home PC is unmanaged. If they download documents from Salesforce onto the PC, it might be infected with malware. Should the device be lost or stolen, it may not be password protected and anyone who finds it has access to sensitive information.

## The solution

Protect your organization by monitoring and controlling cloud app use with any IdP solution and Cloud App Security's Conditional Access App Control.

## Prerequisites

- A valid license for Azure AD Premium P1 license, or the license required by your identity provider (IdP) solution
- Configure a cloud app for SSO using one of the following authentication protocols:

    |IdP|Protocols|
    |---|---|
    |Azure AD|SAML 2.0 or OpenID Connect|
    |Other|SAML 2.0|
- Make sure the [app is deployed to Cloud App Security](proxy-deployment-aad.md)

## Create a block download policy for unmanaged devices

Cloud App Security session policies allow you to restrict a session based on device state. To accomplish control of a session using its device as a condition, create both a conditional access policy AND a session policy.

### Step 1: Configure your IdP to work with Cloud App Security

Make sure you have configured your IdP solution to work with Cloud App Security, as follows:

- For [Azure AD Conditional Access](/azure/active-directory/active-directory-conditional-access-azure-portal), see [Configure integration with Azure AD](proxy-deployment-aad.md#configure-integration-with-azure-ad)
- For other IdP solutions, see [Configure integration with other IdP solutions](proxy-deployment-aad.md#configure-integration-with-other-idp-solutions)

After completing this task, go to the Cloud App Security portal and create a session policy to monitor and control file downloads in the session.

### Step 2: Create a session policy

1. In the [Cloud App Security portal](https://portal.cloudappsecurity.com/), select **Control** followed by **Policies**.

1. In the **Policies** page, click **Create policy** followed by **Session policy**.

1. In the **Create session policy** page, give your policy a name and description. For example, **Block downloads from Salesforce for unmanaged devices**.

1. Assign a **Policy severity** and **Category**.

1. For the **Session control type**, select **Control file download (with inspection)**. This setting gives you the ability to monitor everything your users do within a Salesforce session and gives you control to block and protect downloads in real time.

1. Under **Activity source** in the **Activities matching all of the following** section, select the filters:

    - **Device tag**: Select **Does not equal**. and then select **Intune compliant**, **Hybrid Azure AD joined**, or **Valid client certificate**. Your selection depends on the method used in your organization for identifying managed devices.

    - **App**: Select the app you want to control.

    - **Users**: Select the users you want to monitor.

1. Alternatively, you can block the downloads for locations that aren't part of your corporate network. Under **Activity source** in the **Activities matching all of the following** section, set the following filters:

    - **IP address** or **Location**: You can use either of these two parameters to identify non-corporate or unknown locations, from which a user might be trying to access sensitive data.

     > [!NOTE]
     > If you want to block downloads from BOTH unmanaged devices and non-corporate locations, you have to create two session policies. One policy sets the **Activity source** using the location. The other policy sets the **Activity source** to unmanaged devices.

    - **App**: Select the app you want to control.

    - **Users**: Select the users you want to monitor.

1. Under **Activity source** in the **Files matching all of the following** section, set the following filters:

    - **Classification labels**: If you use Azure Information Protection classification labels, filter the files based on a specific Azure Information Protection Classification label.

    - Select **File name** or **File type** to apply restrictions based on file name or type.
1. Enable **Content inspection** to enable the internal DLP to scan your files for sensitive content.

1. Under **Actions**, select **block**. Customize the blocking message that your users get when they're unable to download files.

1. Set the alerts you want to receive when the policy is matched. You can set a limit so that you don't receive too many alerts. Select whether to get the alerts as an email message, text message, or both.

1. Click **Create**

## Validate your policy

1. To simulate the blocked file download, from an unmanaged device or a non-corporate network location, sign in to the app. Then, try to download a file.

1. The file should be blocked and you should receive the message you set under **Customize block messages**.

1. In the [Cloud App Security portal](https://portal.cloudappsecurity.com/), click on **Control** followed by **Policies**, and then click on the policy you've created to view the policy report. A session policy match should appear shortly.

1. In the policy report, you can see which logins where redirected to Microsoft Cloud App Security for session control, and which files were downloaded or blocked from the monitored sessions.

## Next steps

> [!div class="nextstepaction"]
> [How to create an access policy](access-policy-aad.md)

> [!div class="nextstepaction"]
> [How to create a session policy](session-policy-aad.md)

[!INCLUDE [Open support ticket](includes/support.md)]