---
title: Threat protection policies 
description: This topic outlines the steps to configure many threat protection policies in Cloud App Security.
ms.date: 11/08/2020
ms.topic: conceptual
---
# Threat protection policies

[!INCLUDE [Banner for top of topics](includes/banner.md)]

Cloud App Security enables you to identify high-risk use and cloud security issues, detect abnormal user behavior, and prevent threats in your sanctioned cloud apps. Get visibility into user and admin activities and define policies to automatically alert when suspicious behavior or specific activities that you consider risky are detected. Draw from the vast amount of Microsoft threat intelligence and security research data to help ensure that your sanctioned apps have all the security controls you need in place and help you maintain control over them.

> [!NOTE]
> When integrating Cloud App Security with Microsoft Defender for Identity, policies from Defender for Identity also appear on the policies page. For a list of Defender for Identity policies, see [Security Alerts](/defender-for-identity/suspicious-activity-guide).

## Detect and control user activity from unfamiliar locations

Automatic detection of user access or activity from unfamiliar locations that were never visited by anyone else in your organization.

### Prerequisites

You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md) or on-boarded using [Conditional Access app control with session controls](proxy-deployment-aad.md).

### Steps

This detection is automatically configured out-of-the-box to alert you when there is access from new locations. You do not need to take any action to configure this policy. For more information, see [Anomaly detection policies](anomaly-detection-policy.md).

## Detect compromised account by impossible location (impossible travel)

Automatic detection of user access or activity from 2 different locations within a time period that is shorter than the time it takes to travel between the two.

### Prerequisites

You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md) or on-boarded using [Conditional Access app control with session controls](proxy-deployment-aad.md).

### Steps

1. This detection is automatically configured out-of-the-box to alert you when there is access from impossible locations. You do not need to take any action to configure this policy. For more information, see [Anomaly detection policies](anomaly-detection-policy.md).
2. Optional: you can [customize anomaly detection policies](anomaly-detection-policy.md#scope-anomaly-detection-policies):

    - Customize the detection scope in terms of users and groups

    - Choose the types of sign-ins to consider

    - Set your sensitivity preference for alerting

3. Create the anomaly detection policy.

## Detect suspicious activity from an "on-leave" employee

Detect when a user, who is on unpaid leave and should not be active on any organizational resource, is accessing any of your organization's cloud resources.

### Prerequisites

- You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md).

- Create a security group in Azure Active Directory for the users on unpaid leave and add all the users you want to monitor.

### Steps

1. On the [User groups](user-groups.md) screen, click **Create user group** and import the relevant Azure AD group.

2. On the **Policies** page, create a new **Activity policy**.

3. Set the filter **User group** equals to the name of the user groups you created in Azure AD for the unpaid leave users.

4. Optional: Set the **Governance** actions to be taken on files when a violation is detected. The governance actions available vary between services. You can choose **Suspend user**.

5. Create the file policy.

## Detect and notify when outdated browser OS is used

Detect when a user is using a browser with an outdated client version that might pose compliance or security risks to your organization.

### Prerequisites

You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md) or on-boarded using [Conditional Access app control with session controls](proxy-deployment-aad.md).

### Steps

1. On the **Policies** page, create a new **Activity policy**.

2. Set the filter **User agent tag** equals to **Outdated browser** and **Outdated operating system**.

3. Set the **Governance** actions to be taken on files when a violation is detected. The governance actions available vary between services. Under **All apps**, select **Notify user**, so that your users can act upon the alert and update the necessary components.

4. Create the Activity policy.

## Detect and alert when Admin activity is detected on risky IP addresses

Detect admin activities performed from and IP address that is considered a risky IP address, and notify the system admin for further investigation or set a governance action on the admin's account.

### Prerequisites

- You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md).

- From the Settings cog, select **IP address ranges** and click the + to add IP address ranges for your internal subnets and their egress public IP addresses. Set the **Category** to **Internal**.

### Steps

1. On the **Policies** page, create a new **Activity policy**.

2. Set **Act on** to **Single activity**.

3. Set the filter **IP address** to **Category** equals **Risky**

4. Set the filter **Administrative activity** to **True**

5. Set the **Governance** actions to be taken on files when a violation is detected. The governance actions available vary between services. Under **All apps**, select **Notify user**, so that your users can act upon the alert and update the necessary components **CC the user's manager**.

6. Create the activity policy.

## Detect activities by service account from external IP addresses

Detect service account activities originating from a non-internal IP addresses. This could indicate suspicious behavior or a compromised account.

### Prerequisites

- You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md).
- From the Settings cog, select **IP address ranges** and click the + to add IP address ranges for your internal subnets and their egress public IP addresses. Set the **Category** to **Internal**.

- Standardize a naming conventions for service accounts in your environment, for example, set all account names to start with "svc".

### Steps

1. On the **Policies** page, create a new **Activity policy**.

2. Set the filter **User** to **Name** and then **Starts with** and enter your naming convention, such as svc.

3. Set the filter **IP address** to **Category** does not equal **Other** and **Corporate**.

4. Set the **Governance** actions to be taken on files when a violation is detected. The governance actions available vary between services.

5. Create the policy.

## Detect mass download (data exfiltration)

Detect when a certain user accesses or downloads a massive number of files in a short period of time.

### Prerequisites

You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md) or on-boarded using [Conditional Access app control with session controls](proxy-deployment-aad.md).

### Steps

1. On the **Policies** page, create a new **Activity policy**.

2. Set the filter **IP addresses** to **Tag** does not equal **Microsoft Azure**. This will exclude non-interactive device-based activities.

3. Set the filter **Activity types** equals to and then select all relevant download activities.

4. Set the **Governance** actions to be taken on files when a violation is detected. The governance actions available vary between services.
5. Create the policy.

## Detect potential Ransomware activity

Automatic detection of potential Ransomware activity.

### Prerequisites

You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md).

### Steps

1. This detection is automatically configured out-of-the-box to alert you when there is a potential ransomware risk detected. You do not need to take any action to configure this policy. For more information, see [Anomaly detection policies](anomaly-detection-policy.md).

2. It is possible to configure the **Scope** of the detection and to customize the Governance actions to be taken when an alert is triggered. For more information about how Cloud App Security identifies Ransomware, see [Protecting your organization from ransomware](use-case-ransomware.md).

> [!NOTE]
> This applies to Office 365, Google Workspace, Box, and Dropbox.

## Detect malware in the cloud

Detect files containing malware in your cloud environments by utilizing Cloud App Security's integration with the Microsoft's Threat Intelligence engine.

### Prerequisites

- For Office 365 malware detection, you must have a valid license for Microsoft Defender for Office 365 P1.
- You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md).

### Steps

- This detection is automatically configured out-of-the-box to alert you when there is a file that may contain malware. You do not need to take any action to configure this policy. For more information, see [Anomaly detection policies](anomaly-detection-policy.md).

## Detect rogue admin takeover

Detect repeated admin activity that might indicate malicious intentions.

### Prerequisites

You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md).

### Steps

1. On the **Policies** page, create a new **Activity policy**.

2. Set **Act on** to **Repeated activity** and customize the **Minimum repeated activities** and set a **Timeframe** to comply with your organization's policy..

3. Set the filter **User** to **From group** equals and select all the related admin group as **Actor only**.

4. Set the filter **Activity type** equals to all activities that relate to password updates, changes, and resets.

5. Set the **Governance** actions to be taken on files when a violation is detected. The governance actions available vary between services.
6. Create the policy.

## Detect suspicious inbox manipulation rules

If a suspicious inbox rule was set on a user's inbox, it may indicate that the user account is compromised, and that the mailbox is being used to distribute spam and malware in your organization.

### Prerequisites

- Use of Microsoft Exchange for email.

### Steps

- This detection is automatically configured out-of-the-box to alert you when there is a suspicious inbox rule set. You do not need to take any action to configure this policy. For more information, see [Anomaly detection policies](anomaly-detection-policy.md).

## Detect leaked credentials

When cyber criminals compromise valid passwords of legitimate users, they often share those credentials. This is usually done by posting them publicly on the dark web or paste sites or by trading or selling the credentials on the black market.

Cloud App Security utilizes Microsoft's Threat intelligence to match such credentials to the ones used inside your organization.

### Prerequisites

You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md).

### Steps

This detection is automatically configured out-of-the-box to alert you when a possible credential leak is detected. You do not need to take any action to configure this policy. For more information, see [Anomaly detection policies](anomaly-detection-policy.md).

## Detect anomalous file downloads

Detect when users perform multiple file download activities in a single session, relative to the baseline learned. This could indicate an attempted breach.

### Prerequisites

You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md) or on-boarded using [Conditional Access app control with session controls](proxy-deployment-aad.md).

### Steps

1. This detection is automatically configured out-of-the-box to alert you when an anomalous download occurs. You do not need to take any action to configure this policy. For more information, see [Anomaly detection policies](anomaly-detection-policy.md).

2. It is possible to configure the scope of the detection and to customize the action to be taken when an alert is triggered.

## Detect anomalous file shares by a user

Detect when users perform multiple file-sharing activities in a single session with respect to the baseline learned, which could indicate an attempted breach.

### Prerequisites

You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md) or on-boarded using [Conditional Access app control with session controls](proxy-deployment-aad.md).

### Steps

1. This detection is automatically configured out-of-the-box to alert you when users perform multiple file sharing. You do not need to take any action to configure this policy. For more information, see [Anomaly detection policies](anomaly-detection-policy.md).

2. It is possible to configure the scope of the detection and to customize the action to be taken when an alert is triggered.

## Detect anomalous activities from infrequent country

Detect activities from a location that was not recently or was never visited by the user or by any user in your organization.

### Prerequisites

You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md) or on-boarded using [Conditional Access app control with session controls](proxy-deployment-aad.md).

### Steps

1. This detection is automatically configured out-of-the-box to alert you when an anomalous activity occurs from an infrequent country/region. You do not need to take any action to configure this policy. For more information, see [Anomaly detection policies](anomaly-detection-policy.md).

2. It is possible to configure the scope of the detection and to customize the action to be taken when an alert is triggered.

> [!NOTE]
> Detecting anomalous locations necessitates an initial learning period of 7 days. During the learning period, Cloud App Security does not generate alerts for new locations.

## Detect activity performed by a terminated user

Detect when a user who is no longer an employee of your organization performs an activity in a sanctioned app. This may indicate malicious activity by a terminated employee who still has access to corporate resources.

### Prerequisites

You must have at least one app connected using [app connectors](enable-instant-visibility-protection-and-governance-actions-for-your-apps.md).

### Steps

1. This detection is automatically configured out-of-the-box to alert you when an activity is performed by a terminated employee. You do not need to take any action to configure this policy. For more information, see [Anomaly detection policies](anomaly-detection-policy.md).

2. It is possible to configure the scope of the detection and to customize the action to be taken when an alert is triggered.

## Next steps

> [!div class="nextstepaction"]
> [Daily activities to protect your cloud environment](daily-activities-to-protect-your-cloud-environment.md)

[!INCLUDE [Open support ticket](includes/support.md)]