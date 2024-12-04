---
title: How Cloud App Security helps protect your Amazon Web Services environment
description: This article provides information about the benefits of connecting your AWS app to Cloud App Security using the API connector for visibility and control over use.
ms.date: 09/15/2020
ms.topic: article
---
# How Cloud App Security helps protect your Amazon Web Services (AWS) environment

[!INCLUDE [Banner for top of topics](includes/banner.md)]

Amazon Web Services is an IaaS provider that enables your organization to host and manage their entire workloads in the cloud. Along with the benefits of leveraging infrastructure in the cloud, your organization's most critical assets may be exposed to threats. Exposed assets include storage instances with potentially sensitive information, compute resources that operate some of your most critical applications, ports, and virtual private networks that enable access to your organization.

Connecting AWS to Cloud App Security helps you secure your assets and detect potential threats by monitoring administrative and sign-in activities, notifying on possible brute force attacks, malicious use of a privileged user account, unusual deletions of VMs, and publicly exposed storage buckets.

## Main threats

- Abuse of cloud resources
- Compromised accounts and insider threats
- Data leakage
- Resource misconfiguration and insufficient access control

## How Cloud App Security helps to protect your environment

- [Detect cloud threats, compromised accounts, and malicious insiders](best-practices.md#detect-cloud-threats-compromised-accounts-malicious-insiders-and-ransomware)
- [Limit exposure of shared data and enforce collaboration policies](best-practices.md#limit-exposure-of-shared-data-and-enforce-collaboration-policies)
- [Stay up to date with latest security configuration recommendation](security-config-aws.md)
- [Use the audit trail of activities for forensic investigations](best-practices.md#use-the-audit-trail-of-activities-for-forensic-investigations)
- [Review security configuration recommendations](security-config-aws.md)

## Control AWS with built-in policies and policy templates

You can use the following built-in policy templates to detect and notify you about potential threats:

| Type | Name |
| ---- | ---- |
| Activity policy template | Admin console sign-in failures<br />CloudTrail configuration changes<br />EC2 instance configuration changes<br />IAM policy changes<br />Logon from a risky IP address<br />Network access control list (ACL) changes<br />Network gateway changes<br />S3 configuration changes<br />Security group configuration changes<br />Virtual private network changes |
| Built-in anomaly detection policy | [Activity from anonymous IP addresses](anomaly-detection-policy.md#activity-from-anonymous-ip-addresses)<br />[Activity from infrequent country](anomaly-detection-policy.md#activity-from-infrequent-country)<br />[Activity from suspicious IP addresses](anomaly-detection-policy.md#activity-from-suspicious-ip-addresses)<br />[Impossible travel](anomaly-detection-policy.md#impossible-travel)<br />[Activity performed by terminated user](anomaly-detection-policy.md#activity-performed-by-terminated-user) (requires AAD as IdP)<br />[Multiple failed login attempts](anomaly-detection-policy.md#multiple-failed-login-attempts)<br />[Unusual administrative activities](anomaly-detection-policy.md#unusual-activities-by-user)<br />[Unusual multiple storage deletion activities](anomaly-detection-policy.md#unusual-activities-by-user) (preview)<br />[Multiple delete VM activities](anomaly-detection-policy.md#multiple-delete-vm-activities)<br />[Unusual multiple VM creation activities](anomaly-detection-policy.md#unusual-activities-by-user) (preview)<br />[Unusual region for cloud resource](anomaly-detection-policy.md#unusual-activities-by-user) (preview) |
| File policy template | S3 bucket is publicly accessible |

For more information about creating policies, see [Create a policy](control-cloud-apps-with-policies.md#create-a-policy).

## Automate governance controls

In addition to monitoring for potential threats, you can apply and automate the following AWS governance actions to remediate detected threats:

| Type | Action |
| ---- | ---- |
| User governance | - Notify user on alert (via Azure AD)<br />- Require user to sign in again (via Azure AD)<br />- Suspend user (via Azure AD) |
| Data governance | - Make an S3 bucket private<br />- Remove a collaborator for an S3 bucket |

For more information about remediating threats from apps, see [Governing connected apps](governance-actions.md).

## Security Recommendations

Cloud App Security provides an overview of your AWS platform configuration compliance for all your AWS accounts based on the Center for Internet Security (CIS) benchmark for AWS.

You should continuously review the security recommendations to assess and evaluate the current status of your platform's security posture and identify important configuration gaps. Then, you should create a plan to mitigate the issues in your AWS platform.

For more information, [AWS security recommendations](security-config-aws.md).

## Protect AWS in real time

Review our best practices for [blocking and protecting the download of sensitive data to unmanaged or risky devices](best-practices.md#block-and-protect-download-of-sensitive-data-to-unmanaged-or-risky-devices).

## Next steps

> [!div class="nextstepaction"]
> [How to connect AWS to Microsoft Cloud App Security](connect-aws-to-microsoft-cloud-app-security.md)
