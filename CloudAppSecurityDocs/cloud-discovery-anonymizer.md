---
title: Anonymize user data in Cloud App Security
description: This article provides information about how to protect user privacy by anonymizing the usernames in your Cloud Discovery data.
ms.date: 04/20/2020
ms.topic: how-to
---
# Cloud Discovery data anonymization

[!INCLUDE [Banner for top of topics](includes/banner.md)]

Cloud Discovery data anonymization enables you to protect user privacy. Once the data log is uploaded to the Microsoft Cloud App Security portal, the log is sanitized and all username information is replaced with encrypted usernames. This way, all cloud activities are kept anonymous. When necessary, for a specific security investigation (for example, a security breach or suspicious user activity), admins can resolve the real username. If an admin has a reason to suspect a specific user, they can also look up the encrypted username of a known username, and then start investigating using the encrypted username. Each username conversion is audited in the portal's **Governance log**.

Key points:

- No private information is stored or displayed. Only encrypted information.
- Private data is encrypted using AES-128 with a dedicated key per tenant.
- Resolving usernames is done ad-hoc, per-username by deciphering a given encrypted username.

## How data anonymization works

1. There are three ways to apply data anonymization:

    - You can set the data from a specific log file to be anonymized, by [creating a new snapshot report](create-snapshot-cloud-discovery-reports.md) and selecting **Anonymize private information**.  
    ![Anonymize snapshot data](media/anonymize-log.png)

    - You can set the data from an [automated upload for a new data source](configure-automatic-log-upload-for-continuous-reports.md) to be anonymized by selecting  **Anonymize private information** when you add the new data source.  
    ![Anonymize log data](media/anonymize-autolog.png)

    - You can set the default in Cloud App Security to anonymize all data from both snapshot reports from uploaded log files and continuous reports from log collectors as follows:

        1. Select **Settings** > **Cloud Discovery settings**.

        2. In the **Anonymization** tab, to anonymize usernames by default, select **Anonymize private information by default in new reports and data sources**. You can also select **Anonymize device information by default in 'Win10 Endpoint Users' report**.
        3. Click **Save**.

        ![Anonymization settings page](media/anonymizer1.png)

2. When anonymization is selected, Cloud App Security parses the traffic log and extracts specific data attributes.
3. Cloud App Security replaces the username with an encrypted username.
4. It then analyzes cloud usage data and generates Cloud Discovery reports based on the anonymized data.

    ![Anonymize Cloud Discovery dashboard](media/anonymize-dashboard.png)

5. For a specific investigation, such as an investigation of an anomalous usage alert, you can resolve the specific username in the portal and provide a business justification.

    > [!NOTE]
    > The following steps also work for device names on the **Devices** tab.

    **To resolve a single username**

    1. Click on the three dots at the end of the row of the user you want to resolve and select **Deanonymize user**.

        ![Anonymize user table](media/anonymize-user-table.png)

    1. In the pop-up, enter the justification for resolving the username and then click **Resolve**. In the relevant row, the resolved username is displayed.

        > [!NOTE]
        > This action is audited.

        ![Anonymize resolve pop-up](media/anonymize-resolve-dialog.png)

    The following alternative way to resolve single usernames can also be used to look up the encrypted username of a known username.

    1. Under the Settings cog, select **Cloud Discovery settings**.

    1. In the **Anonymization** tab, under **Anonymize and resolve usernames**  enter a justification for why you're doing the resolution.
    1. Under **Enter username to resolve**, select **From anonymized** and enter the anonymized username, or select **To anonymized** and enter the original username to resolve. Click **Resolve**.

        ![Resolve anonymization pop-up](media/anonymizer.png)

    **To resolve multiple usernames**

    1. Either select the checkboxes that appear when you hover over the user icons by the users you want to resolve or, in the top-left, corner select the **Bulk selection** checkbox.

        ![Anonymize bulk resolve](media/anonymize-bulk-resolve.png)

    1. Click **Deanonymize user**.
    1. In the pop-up, enter the justification for resolving the username and then click **Resolve**. In the relevant rows, the resolved usernames are displayed.

        > [!NOTE]
        > This action is audited.

        ![Anonymize resolve pop-up](media/anonymize-resolve-dialog.png)

6. The action is audited in the portal's **Governance log**.

    ![Anonymization action in governance log](media/anonymize-gov-log.png)

## Next steps

> [!div class="nextstepaction"]
> [Control cloud apps with policies](control-cloud-apps-with-policies.md)

[!INCLUDE [Open support ticket](includes/support.md)]
