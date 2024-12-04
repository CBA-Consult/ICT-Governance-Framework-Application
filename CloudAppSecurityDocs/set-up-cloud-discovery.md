---
title: Deploy Cloud Discovery 
description: This article describes the setup procedure for getting Cloud Discovery working.
ms.date: 01/17/2021
ms.topic: how-to
---
# Set up Cloud Discovery

[!INCLUDE [Banner for top of topics](includes/banner.md)]

Cloud Discovery analyzes your traffic logs against Microsoft Cloud App Security's cloud app catalog of over 16,000 cloud apps. The apps are ranked and scored based on more than 80 risk factors to provide you with ongoing visibility into cloud use, Shadow IT, and the risk Shadow IT poses into your organization.

## Snapshot and continuous risk assessment reports

You can generate the following types of reports:

- **Snapshot reports** - Provides ad-hoc visibility on a set on traffic logs you manually upload from your firewalls and proxies.

- **Continuous reports** - Analyze all logs that are forwarded from your network using Cloud App Security. They provide improved visibility over all data, and automatically identify anomalous use using either the Machine Learning anomaly detection engine or by using custom policies that you define. These reports can be created by connecting in the following ways:

  - [**Microsoft Defender for Endpoint integration**](mde-integration.md): Cloud App Security integrates with Defender for Endpoint natively, to simplify rollout of Cloud Discovery, extend Cloud Discovery capabilities beyond your corporate network, and enable machine-based investigation.
  - [**Log collector**](discovery-docker.md): Log collectors enable you to easily automate log upload from your network. The log collector runs on your network and receives logs over Syslog or FTP.
  - **Secure Web Gateway (SWG)**: If you work with both Cloud App Security and one of the following SWGs, you can integrate the products to enhance your security Cloud Discovery experience. Together, Cloud App Security and SWGs provide seamless deployment of Cloud Discovery, automatic blocking of unsanctioned apps, and risk assessment directly in the SWG's portal.
    - [Zscaler integration](zscaler-integration.md)
    - [iboss integration](iboss-integration.md)
    - [Corrata integration](corrata-integration.md)
    - [Menlo Security integration](menlo-integration.md)

- **[Cloud Discovery API](api-discovery.md)** – Use Cloud App Security's Cloud Discovery API to automate traffic log upload and get automated Cloud Discovery report and risk assessment. You can also use the API to [generate block scripts](api-discovery-script.md) and streamline app controls directly to your network appliance.

## Log process flow: From raw data to risk assessment

The process of generating a risk assessment consists of the following steps. The process takes between a few minutes to several hours depending on the amount of data processed.

- **Upload** – Web traffic logs from your network are uploaded to the portal.

- **Parse** – Cloud App Security parses and extracts traffic data from the traffic logs with a dedicated parser for each data source.

- **Analyze** – Traffic data is analyzed against the Cloud App Catalog to identify more than 16,000 cloud apps and to assess their risk score. Active users and IP addresses are also identified as part of the analysis.

- **Generate report** - A risk assessment report of the data extracted from log files is generated.

>[!NOTE]
> Continuous report data is analyzed four times a day.

## Supported firewalls and proxies <a name="supported-firewalls-and-proxies"></a>

- Barracuda - Web App Firewall (W3C)
- Blue Coat Proxy SG - Access log (W3C)
- Check Point
- Cisco ASA with FirePOWER
- Cisco ASA Firewall (For Cisco ASA firewalls, it's necessary to set the information level to 6)
- Cisco Cloud Web Security
- Cisco FWSM
- Cisco IronPort WSA
- Cisco Meraki – URLs log
- Clavister NGFW (Syslog)
- ContentKeeper
- Corrata
- Digital Arts i-FILTER
- Forcepoint
- Fortinet Fortigate
- iboss Secure Cloud Gateway
- Juniper SRX
- Juniper SSG
- McAfee Secure Web Gateway
- Menlo Security (CEF)
- Microsoft Forefront Threat Management Gateway (W3C)
- Palo Alto series Firewall
- Sonicwall (formerly Dell)
- Sophos SG
- Sophos XG
- Sophos Cyberoam
- Squid (Common)
- Squid (Native)
- Stormshield
- Websense - Web Security Solutions - Investigative detail report (CSV)
- Websense - Web Security Solutions - Internet activity log (CEF)
- WatchGuard
- Zscaler

> [!NOTE]
> Cloud Discovery supports both IPv4 and IPv6 addresses.

If your log isn't supported, or if you are using a newly released log format from one of the supported data sources and the upload is failing, select **Other** as the **Data source** and specify the appliance and log you're trying to upload. Your log will be reviewed by the Cloud App Security cloud analyst team and you'll be notified if support for your log type is added. Alternatively, you can define a custom parser that matches your format. For more information, see [Use a custom log parser](custom-log-parser.md).

> [!NOTE]
> The following list of supported appliances may not work with newly released log formats. If you are using a newly released format and the upload is failing, [use a custom log parser](custom-log-parser.md) and if required, open a support case.

Data attributes (according to vendor documentation):

| Data source | Target App URL | Target App IP | Username | Origin IP | Total traffic | Uploaded bytes |
|----------------------------------------------|----------------------|----------------------|----------------------|----------------------|----------------------|----------------------|
| Barracuda | **Yes** | **Yes** | **Yes** | **Yes** | No | No |
| Blue Coat | **Yes** | No | **Yes** | **Yes** | **Yes** | **Yes** |
| Check Point | No | **Yes** | No | **Yes** | No | No |
| Cisco ASA (Syslog) | No | **Yes** | No | **Yes** | **Yes** | No |
| Cisco ASA with FirePOWER | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| Cisco Cloud Web Security |**Yes**|**Yes**|**Yes**|**Yes**|**Yes**|**Yes**|
| Cisco FWSM | No | **Yes** | No | **Yes** | **Yes** | No |
| Cisco Ironport WSA | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| Cisco Meraki | **Yes** | **Yes** | No | **Yes** | No | No |
| Clavister NGFW (Syslog) | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| ContentKeeper | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| Corrata | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| SonicWall (formerly Dell) | **Yes** | **Yes** | No | **Yes** | **Yes** | **Yes** |
| Digital Arts i-FILTER | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| ForcePoint LEEF |**Yes**|**Yes**|**Yes**|**Yes**|**Yes**|**Yes**|
| ForcePoint Web Security Cloud\* |**Yes**|**Yes**|**Yes**|**Yes**|**Yes**|**Yes**|
| Fortinet Fortigate | No | **Yes** | No | **Yes** | **Yes** | **Yes** |
| FortiOS |**Yes**|**Yes**|No|**Yes**|**Yes**|**Yes**|
| iboss |**Yes**|**Yes**|**Yes**|**Yes**|**Yes**|**Yes**|
| Juniper SRX | No | **Yes** | No | **Yes** | **Yes** | **Yes** |
| Juniper SSG | No | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| McAfee SWG | **Yes** | No | No | **Yes** | **Yes** | **Yes** |
| Menlo Security (CEF) | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| MS TMG | **Yes** | No | **Yes** | **Yes** | **Yes** | **Yes** |
| Palo Alto Networks | No | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| Sophos | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | No |
| Squid (Common) | **Yes** | No | **Yes** | **Yes** | **Yes** | No |
| Squid (Native) | **Yes** | No | **Yes** | **Yes** | No | No |
| Stormshield | No | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| Websense - Investigative detail report (CSV) | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| Websense - Internet activity log (CEF) | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| WatchGuard | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| Zscaler | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |

\* Versions 8.5 and later of Forcepoint Web Security Cloud are not supported

## Next steps

> [!div class="nextstepaction"]
> [Create snapshot Cloud Discovery reports](create-snapshot-cloud-discovery-reports.md)

> [!div class="nextstepaction"]
> [Configure automatic log upload for continuous reports](discovery-docker.md)

> [!div class="nextstepaction"]
> [Working with Cloud Discovery data](working-with-cloud-discovery-data.md)
