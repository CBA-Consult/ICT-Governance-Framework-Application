---
title: Differences between Cloud App Security and Office 365 Cloud App Security
description: This article describes the differences between Cloud App Security and Office 365 Cloud App Security.
ms.date: 02/22/2021
ms.topic: overview
---
# What are the differences between Microsoft Cloud App Security and Office 365 Cloud App Security?

[!INCLUDE [Banner for top of topics](includes/banner.md)]

This article describes the differences between Cloud App Security and Office 365 Cloud App Security. For information about Office 365 Cloud App Security, see [Get started with Office 365 Cloud App Security](https://support.office.com/article/Get-started-with-Advanced-Management-Security-d9ee4d67-f2b3-42b4-9c9e-c4529904990a).

For information about licensing, see the [Microsoft Cloud App Security licensing datasheet](https://aka.ms/mcaslicensing).

## Microsoft Cloud App Security

Microsoft Cloud App Security is a comprehensive cross-SaaS solution bringing deep visibility, strong data controls, and enhanced threat protection to your cloud apps. With this service, you can gain visibility into Shadow IT by discovering cloud apps in use. You can control and protect data in the apps once you sanction them to the service.

## Office 365 Cloud App Security

Office 365 Cloud App Security is a subset of Microsoft Cloud App Security that provides enhanced visibility and control for Office 365. Office 365 Cloud App Security includes threat detection based on user activity logs, discovery of Shadow IT for apps that have similar functionality to Office 365 offerings, control app permissions to Office 365, and apply access and session controls.

### Feature support

|Capability|Feature|Microsoft Cloud App Security|Office 365 Cloud App Security|
|----|----|----|----|
|Cloud Discovery|Discovered apps |16,000 + cloud apps  |750+ cloud apps with similar functionality to Office 365|
||Deployment for discovery analysis|<li> Manual upload <br> <li> Automated upload - Log collector and API <br> <li> Native Defender for Endpoint integration |Manual log upload|
||Log anonymization for user privacy|Yes||
||Access to full Cloud App Catalog|Yes||
||Cloud app risk assessment|Yes||
||Cloud usage analytics per app, user, IP address|Yes||
||Ongoing analytics & reporting|Yes||
||Anomaly detection for discovered apps|Yes||
|Information Protection|Data Loss Prevention (DLP) support|Cross-SaaS DLP and data sharing control|Uses existing Office DLP (available in Office E3 and above)|
||App permissions and ability to revoke access|Yes|Yes|
||Policy setting and enforcement|Yes||
||Integration with Azure Information Protection |Yes||
||Integration with third-party DLP solutions|Yes||
|Threat Detection|Anomaly detection and behavioral analytics|For Cross-SaaS apps including Office 365|For Office 365 apps |
||Manual and automatic alert remediation|Yes|Yes|
||SIEM connector|Yes. Alerts and activity logs for cross-SaaS apps.|For Office 365 alerts only|
||Integration to Microsoft Intelligent Security Graph|Yes|Yes|
||Activity policies|Yes|Yes|
|Conditional Access App Control|Real-time session monitoring and control|Any cloud and on-premises app|For Office 365 apps|
|Cloud Platform Security|Security configurations|For Azure, AWS, and GCP|For Azure|

## Next steps

- Read about the basics in [Getting started with Cloud App Security](getting-started-with-cloud-app-security.md).

[!INCLUDE [Open support ticket](includes/support.md)].
