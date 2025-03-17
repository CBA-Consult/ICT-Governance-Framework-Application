---
title: How Cloud App Security helps protect your Azure environment
description: This article provides information about the benefits of connecting your Azure app to Cloud App Security using the API connector for visibility and control over use.
ms.date: 09/15/2020
ms.topic: article
---
# How Cloud App Security helps protect your Azure environment

[!INCLUDE [Banner for top of topics](includes/banner.md)]

Azure is an IaaS provider that enables your organization to host and manage their entire workloads in the cloud. Along with the benefits of leveraging infrastructure in the cloud, your organization's most critical assets may be exposed to threats. Exposed assets include storage instances with potentially sensitive information, compute resources that operate some of your most critical applications, ports, and virtual private networks that enable access to your organization.

Connecting Azure to Cloud App Security helps you secure your assets and detect potential threats by monitoring administrative and sign-in activities, notifying on possible brute force attacks, malicious use of a privileged user account, and unusual deletions of VMs.

## Main threats

- Abuse of cloud resources
- Compromised accounts and insider threats
- Data leakage
- Resource misconfiguration and insufficient access control

## How Cloud App Security helps to protect your environment

- [Detect cloud threats, compromised accounts, and malicious insiders](best-practices.md#detect-cloud-threats-compromised-accounts-malicious-insiders-and-ransomware)
- [Limit exposure of shared data and enforce collaboration policies](best-practices.md#limit-exposure-of-shared-data-and-enforce-collaboration-policies)
- [Use the audit trail of activities for forensic investigations](best-practices.md#use-the-audit-trail-of-activities-for-forensic-investigations)
- [Review security configuration recommendations](security-config-azure.md)

## Control Azure with built-in policies and policy templates

You can use the following built-in policy templates to detect and notify you about potential threats:

| Type | Name |
| ---- | ---- |
| Built-in anomaly detection policy | [Activity from anonymous IP addresses](anomaly-detection-policy.md#activity-from-anonymous-ip-addresses)<br />[Activity from infrequent country](anomaly-detection-policy.md#activity-from-infrequent-country)<br />[Activity from suspicious IP addresses](anomaly-detection-policy.md#activity-from-suspicious-ip-addresses)<br />[Activity performed by terminated user](anomaly-detection-policy.md#activity-performed-by-terminated-user) (requires AAD as IdP)<br />[Multiple failed login attempts](anomaly-detection-policy.md#multiple-failed-login-attempts)<br />[Unusual administrative activities](anomaly-detection-policy.md#unusual-activities-by-user)<br />[Unusual multiple storage deletion activities](anomaly-detection-policy.md#unusual-activities-by-user) (preview)<br />[Multiple delete VM activities](anomaly-detection-policy.md#multiple-delete-vm-activities)<br />[Unusual multiple VM creation activities](anomaly-detection-policy.md#unusual-activities-by-user) (preview) |

For more information about creating policies, see [Create a policy](control-cloud-apps-with-policies.md#create-a-policy).

## Security Recommendations

Cloud App Security provides a tenant-level view of your Azure platform, listing security recommendations of all Azure subscriptions in the tenant. You can use out-of-the-box Azure security recommendations for over 100 Azure resources against the [Azure Security Benchmark](/azure/security/benchmarks/introduction), as well as [custom recommendations](/azure/security-center/custom-security-policies). Out-of-the-box recommendations include the following resource types: virtual machines, identity and access, data and storage, compute and apps, networks, containers, and app services.

You should continuously review the security recommendations to assess and evaluate the current status of your platform's security posture and identify important configuration gaps. Then, you should create a plan to mitigate the issues in your Azure platform.

For more information, see the [Azure recommendations guide](/azure/security-center/recommendations-reference) and [Azure security recommendations](security-config-azure.md).

## Automate governance controls

In addition to monitoring for potential threats, you can apply and automate the following Azure governance actions to remediate detected threats:

| Type | Action |
| ---- | ---- |
| User governance | - Notify user on alert (via Azure AD)<br />- Require user to sign in again (via Azure AD)<br />- Suspend user (via Azure AD) |

For more information about remediating threats from apps, see [Governing connected apps](governance-actions.md).

## Protect Azure in real time

Review our best practices for [securing and collaborating with external users](best-practices.md#secure-collaboration-with-external-users-by-enforcing-real-time-session-controls) and [blocking and protecting the download of sensitive data to unmanaged or risky devices](best-practices.md#block-and-protect-download-of-sensitive-data-to-unmanaged-or-risky-devices).

## Next steps

> [!div class="nextstepaction"]
> [How to connect Azure to Microsoft Cloud App Security](connect-azure-to-microsoft-cloud-app-security.md)
