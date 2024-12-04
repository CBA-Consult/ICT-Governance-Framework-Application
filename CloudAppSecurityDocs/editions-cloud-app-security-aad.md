---
title: Discovery capability differences for Cloud App Security and Azure AD
description: This article describes the differences between discovery capabilities in Microsoft Cloud App Security and Azure AD.
ms.date: 02/22/2021
ms.topic: overview
---

# What are the differences in discovery capabilities for Azure Active Directory and Microsoft Cloud App Security?

[!INCLUDE [Banner for top of topics](includes/banner.md)]

This article describes the differences between discovery capabilities in Microsoft Cloud App Security and Azure Active Directory (Azure AD).

For information about licensing, see the [Microsoft Cloud App Security licensing datasheet](https://aka.ms/mcaslicensing).

## Microsoft Cloud App Security

Microsoft Cloud App Security is a comprehensive cross-SaaS solution bringing deep visibility, strong data controls, and enhanced threat protection to your cloud apps. Cloud Discovery is one of the features of Cloud App Security, which enables you to gain visibility into Shadow IT by discovering cloud apps in use.

## Enhanced Cloud App Discovery in Azure Active Directory

Azure Active Directory Premium P1 includes [Azure Active Directory Cloud App Discovery](./set-up-cloud-discovery.md) at no additional cost. This feature is based on the Microsoft Cloud App Security Cloud Discovery capabilities that provide deeper visibility into cloud app usage in your organizations. [Upgrade to Microsoft Cloud App Security](https://www.microsoft.com/cloud-platform/cloud-app-security) to receive the full suite of Cloud App Security Broker (CASB) capabilities offered by Microsoft Cloud App Security.

### Feature comparison

The following table is a comparison of the discovery capabilities in Microsoft Cloud App Security and Azure AD.

|Capability|Feature|Microsoft Cloud App Security|Azure AD Cloud App Discovery|
|----|----|----|----|
|Cloud Discovery|Discovered apps|16,000 + cloud apps|16,000 + cloud apps|
||Deployment for discovery analysis|<li> Manual upload <br> <li> Automated upload - Log collector and API <br> <li> Native Defender for Endpoint integration |Manual and automatic log upload. [Learn more about setting up Cloud Discovery](set-up-cloud-discovery.md)|
||Log anonymization for user privacy|Yes|Yes|
||Access to full Cloud App Catalog|Yes|Yes|
||Cloud app risk assessment|Yes|Yes|
||Cloud usage analytics per app, user, IP address|Yes|Yes|
||Ongoing analytics & reporting|Yes|Yes|
||Custom policy creation |Yes|Yes|
||Anomaly detection for discovered apps|Yes||
|Information Protection|Data Loss Prevention (DLP) support|Cross-SaaS DLP and data sharing control||
||App permissions and ability to revoke access (OAuth apps)|Yes||
||Policy setting and enforcement|Yes||
||Integration with Azure Information Protection |Yes||
||Integration with third-party DLP solutions|Yes||
|Threat Detection|Anomaly detection and behavioral analytics|For Cross-SaaS apps||
||Manual and automatic alert remediation|Yes||
||SIEM connector|Yes. Alerts and activity logs for cross-SaaS apps.||
||Integration to Microsoft Intelligent Security Graph|Yes||
||Activity policies|Yes||

## Next steps

- Read about the basics in [Getting started with Cloud App Security](getting-started-with-cloud-app-security.md).

[!INCLUDE [Open support ticket](includes/support.md)].
