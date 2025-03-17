---
title: Require step-up authentication (authentication context) upon risky action
description: This tutorial provides instructions for requiring step-up authentication (authentication context) upon risky action.
ms.date: 04/29/2021
ms.topic: tutorial
---
# Tutorial: Require step-up authentication (authentication context) upon risky action

As an IT admin today, you're stuck between a rock and hard place. You want to enable your employees to be productive. That means allowing employees to access apps so they can work at any time, from any device. However, you want to protect the company's assets including proprietary and privileged information. How can you enable employees to access your cloud apps while protecting your data?

This tutorial allows you to reevaluate Azure AD Conditional Access policies when users take sensitive actions during a session.

## The threat

An employee logged in to SharePoint Online from the corporate office. During the same session, their IP address registered outside of the corporate network. Maybe they went to the coffee shop downstairs, or maybe their token was compromised or stolen by a malicious attacker.

## The solution

Protect your organization by requiring Azure AD Conditional Access policies to be reassessed during sensitive session actions Cloud App Security's Conditional Access App Control.

## Prerequisites

- A valid license for Azure AD Premium P1 license

- Configure a cloud app for SSO using one of the following authentication protocols:

    | IdP   | Protocols                           |
    | ----------- | -------------------------- |
    | Azure AD    | SAML 2.0 or OpenID Connect |

- Make sure the [app is deployed to Cloud App Security](proxy-deployment-aad.md)

## Create a policy to enforce step-up authentication

Cloud App Security session policies allow you to restrict a session based on device state. To accomplish control of a session using its device as a condition, create both a conditional access policy **and** a session policy.

### Step 1: Configure your IdP to work with Cloud App Security

Make sure you've configured your IdP solution to work with Cloud App Security, as follows:

- For [Azure AD Conditional Access](/azure/active-directory/active-directory-conditional-access-azure-portal), see [Configure integration with Azure AD](proxy-deployment-aad.md#configure-integration-with-azure-ad)

- For other IdP solutions, see [Configure integration with other IdP solutions](proxy-deployment-aad.md#configure-integration-with-other-idp-solutions)

After completing this task, go to the Cloud App Security portal and create a session policy to monitor and control file downloads in the session.

### Step 2: Create a session policy

1. In the [Cloud App Security portal](https://portal.cloudappsecurity.com/), select **Control** followed by **Policies**.

1. In the **Policies** page, select **Create policy** followed by **Session policy**.

1. In the **Create session policy** page, give your policy a name and description. For example, **Require step-up authentication on downloads from SharePoint Online from unmanaged devices**.

1. Assign a **Policy severity** and **Category**.

1. For the **Session control type**, select **Block activities,** **Control file upload (with inspection),** **Control file download (with inspection)**.

1. Under **Activity source** in the **Activities matching all the following** section, select the filters:

    - **Device tag**: Select **Does not equal**, and then select **Intune compliant**, **Hybrid Azure AD joined**, or **Valid client certificate**. Your selection depends on the method used in your organization for identifying managed devices.

    - **App**: Select the app you want to control.

    - **Users**: Select the users you want to monitor.

1. Under **Activity source** in the **Files matching all of the following** section, set the following filters:

    - **Classification labels**: If you use Azure Information Protection classification labels, filter the files based on a specific Azure Information Protection Classification label.

    - Select **File name** or **File type** to apply restrictions based on file name or type.

1. Enable **Content inspection** to enable the internal DLP to scan your files for sensitive content.

1. Under **Actions**, select **Require step-up authentication**.

    >[!NOTE]
    >This requires [authentication context to be created in Azure AD](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ConditionalAccessBlade/StepUpTags).

1. Set the alerts you want to receive when the policy is matched. You can set a limit so that you don't receive too many alerts. Select whether to get the alerts as an email message, text message, or both.

1. Select **Create**.

## Validate your policy

1. To simulate this policy, sign in to the app from an unmanaged device or a non-corporate network location. Then, try to download a file.

1. You should be required to perform the action configured in the authentication context policy.

1. In the Cloud App Security portal, select **Control** followed by **Policies**, and then select the policy you've created to view the policy report. A session policy match should appear shortly.

1. In the policy report, you can see which logins where redirected to Microsoft Cloud App Security for session control, and which files were downloaded or blocked from the monitored sessions.

## Next steps

[How to create an access policy](access-policy-aad.md)

[How to create a session policy](session-policy-aad.md)

If you run into any problems, we're here to help. To get assistance or support for your product issue, please [open a support ticket](support-and-ts.md).
