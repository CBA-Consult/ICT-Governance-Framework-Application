---
title: Integrate Azure Active Directory Identity Protection with Cloud App Security
description: This article provides information about how to leverage Identity Protection alerts in Cloud App Security for hybrid risk detection.
ms.date: 12/27/2020
ms.topic: how-to
---
# Azure Active Directory Identity Protection integration

[!INCLUDE [Banner for top of topics](includes/banner.md)]

Microsoft Cloud App Security integrates with Azure Active Directory Identity Protection (Identity Protection) to provide user entity behavioral analytics (UEBA) across a hybrid environment. For more information about the machine learning and behavioral analytics provided by Identity Protection, see [What is Identity Protection?](/azure/active-directory/identity-protection/overview-identity-protection).

## Prerequisites

- A Cloud App Security Admin account to enable integration between Identity Protection and Cloud App Security.

## Enable Identity Protection

> [!NOTE]
> The Identity Protection feature is enabled by default. However, if the feature was disabled, you can use these steps to enable it.

To enable Cloud App Security integration with Identity Protection:

1. In Cloud App Security, under the settings cog, select **Settings**.

    ![Settings menu](media/azip-system-settings.png)

1. Under **Threat Protection**, select **Azure AD Identity Protection**.

    ![enable azure advanced threat protection](media/aadip-integration.png)

1. Select **Enable Azure AD Identity Protection alert integration** and then click **Save**.

After enabling Identity Protection integration, you'll be able to see alerts for all the users in your organization.

## Disable Identity Protection

To disable Cloud App Security integration with Identity Protection:

1. In Cloud App Security, under the settings cog, select **Settings**.

1. Under **Threat Protection**, select **Azure AD Identity Protection**.

1. Clear **Enable Azure AD Identity Protection alert integration** and then click **Save**.

> [!NOTE]
>
> - When the integration is disabled, existing Identity Protection alerts are kept in accordance with Cloud App Security retention policies.
> - Since Cloud App Security only consumes interactive logins from Azure AD, some alerts may not show related activities. You can investigate such activities in the Azure AD portal.

## Configure Identity Protection Policies

The Identity Protection policies can be fine-tuned to your organization's need using the severity slider. The sensitivity slider allows you to control which alerts are ingested. In this way, you can adapt the detection according to your coverage needs and your (SNR) targets.

The following policies are available:

|Policy|Description|Default state|Default Severity|
|---|---|---|---|
|Leaked Credentials|Shows leaked credentials alerts, user's valid credentials have been leaked|Enabled|Low - Receive all alerts|
|Risky sign-in|Aggregates multiple risky sign-in detections, sign-ins that weren't performed by the user|Enabled|High - Receive only high severity alerts|

> [!NOTE]
> Cloud App Security does not send email notifications for Identity Protection alerts. However, you can configure email notifications for them in the Identity Protection portal.

## Next steps

> [!div class="nextstepaction"]
> [Control cloud apps with policies](control-cloud-apps-with-policies.md)

[!INCLUDE [Open support ticket](includes/support.md)]
