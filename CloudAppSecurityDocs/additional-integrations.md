---
title: Additional integration with Cloud App Security
description: This article provides information integrating third-party solutions with Cloud App Security.
ms.date: 06/28/2020
ms.topic: how-to
---
# Additional integrations with external solutions

[!INCLUDE [Banner for top of topics](includes/banner.md)]

You can integrate Microsoft Cloud App Security with your other security investments to leverage and enhance an integrated ecosystem of protection. For example, you can integrate with external mobile device management solutions, UEBA solutions, and external threat intelligence feeds.

Cloud App Security's robust platform allows you to integrate with a wide variety of external security solutions, including:

- **Threat Intelligence (TI) feeds (Bring You Own TI)**  
    You can use the Cloud App Security [IP address range API](api-data-enrichment.md) to add new risky IP address ranges identified by third-party TI solutions. Once defined, IP address ranges allow you to tag, categorize, and customize the way logs and alerts are displayed and investigated.

- **Mobile Device Management (MDM) / Mobile Threat Defense (MTD) solutions**  
    Cloud App Security provides real-time, granular session controls. A key factor in the assessment and protection of sessions is the device used by the user, which helps build a comprehensive identity. A device's management status can be identified either directly through the device management status in [Azure Active Directory (Azure AD)](/azure/active-directory/conditional-access/overview), [Microsoft Intune](/intune/mobile-threat-defense), or more generically through the analysis of client certificates that allow integration with a variety of third-party MDM and MTD solutions.

    Cloud App Security can leverage signals from external MDM and MTD solutions to apply session controls based on a [device's management status](proxy-intro-aad.md#managed-device-identification).

- **UEBA solutions**  
    You can use multiple UEBA solutions to cater for different workloads and scenarios, where each UEBA solution relies on multiple data sources to identify suspicious and anomalous user behavior. External UEBA solutions can be integrated with Microsoft's security ecosystem through Azure AD Identity Protection.

    Once integrated, policies can be used to identify risky users, apply adaptive controls, and automatically remediate risky users by setting the user's risk level to high. Once a user is set to high, the relevant policy actions are enforced, such as resetting a user's password, requiring MFA authentication, or forcing a user to use a managed device.

    Cloud App Security allows security teams to automatically or manually confirm a user as compromised, to ensure fast remediation of compromised users.

    For more information, see [How does Azure AD use my risk feedback](/azure/active-directory/identity-protection/howto-identity-protection-risk-feedback#how-does-azure-ad-use-my-risk-feedback) and [Governance actions](accounts.md#governance-actions).

[!INCLUDE [Open support ticket](includes/support.md)]
