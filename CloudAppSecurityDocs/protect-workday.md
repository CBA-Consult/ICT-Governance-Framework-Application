---
title: How Cloud App Security helps protect your Workday environment
description: This article provides information about the benefits of connecting your Workday app to Cloud App Security using the API connector for visibility and control over use.
ms.date: 12/04/2019
ms.topic: article
---
# How Cloud App Security helps protect your Workday environment

[!INCLUDE [Banner for top of topics](includes/banner.md)]

As a major HCM solution, Workday holds some of the most sensitive information in your organization such as employees' personal data, contracts, vendor details, and more. Preventing exposure of this data requires continuous monitoring to prevent any malicious actors or security unaware insiders from exfiltrating the sensitive information.

Connecting Workday to Cloud App Security gives you improved insights into your users' activities and provides threat detection for anomalous behavior.

## Main threats

- Compromised accounts and insider threats
- Data leakage
- Insufficient security awareness
- Unmanaged bring your own device (BYOD)

## How Cloud App Security helps to protect your environment

- [Detect cloud threats, compromised accounts, and malicious insiders](best-practices.md#detect-cloud-threats-compromised-accounts-malicious-insiders-and-ransomware)
- [Use the audit trail of activities for forensic investigations](best-practices.md#use-the-audit-trail-of-activities-for-forensic-investigations)

## Control Workday with built-in policies and policy templates

You can use the following built-in policy templates to detect and notify you about potential threats:

| Type | Name |
| ---- | ---- |
| Built-in anomaly detection policy | [Activity from anonymous IP addresses](anomaly-detection-policy.md#activity-from-anonymous-ip-addresses)<br />[Activity from infrequent country](anomaly-detection-policy.md#activity-from-infrequent-country)<br />[Activity from suspicious IP addresses](anomaly-detection-policy.md#activity-from-suspicious-ip-addresses)<br />[Impossible travel](anomaly-detection-policy.md#impossible-travel) |
| Activity policy template | Logon from a risky IP address |

For more information about creating policies, see [Create a policy](control-cloud-apps-with-policies.md#create-a-policy).

## Automate governance controls

Currently, there are no governance controls available for Workday. If you are interested in having governance actions for this connector, you can [send the Cloud App Security team feedback](support-and-ts.md#feedback) with details of the actions you want.

For more information about remediating threats from apps, see [Governing connected apps](governance-actions.md).

## Protect Workday in real time

Review our best practices for [securing and collaborating with external users](best-practices.md#secure-collaboration-with-external-users-by-enforcing-real-time-session-controls) and [blocking and protecting the download of sensitive data to unmanaged or risky devices](best-practices.md#block-and-protect-download-of-sensitive-data-to-unmanaged-or-risky-devices).

## Next steps

> [!div class="nextstepaction"]
> [How to connect Workday to Microsoft Cloud App Security](connect-workday-to-microsoft-cloud-app-security.md)
