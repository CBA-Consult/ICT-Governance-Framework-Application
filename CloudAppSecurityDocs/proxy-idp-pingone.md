---
title: Deploy Cloud App Security Conditional Access App Control for any web app using PingOne
description: This article provides information about how to deploy the Microsoft Cloud App Security Conditional Access App Control for any web app using the PingOne identity provider.
ms.date: 09/29/2020
ms.topic: how-to
---
# Onboard and deploy Conditional Access App Control for any web app using PingOne as the identity provider (IdP)

[!INCLUDE [Banner for top of topics](includes/banner.md)]

You can configure session controls in Microsoft Cloud App Security to work with any web app and any third-party IdP. This article describes how to route app sessions from PingOne to Cloud App Security for real-time session controls.

For this article, we'll use the Salesforce app as an example of a web app being configured to use Cloud App Security session controls. To configure other apps, perform the same steps according to their requirements.

## Prerequisites

- Your organization must have the following licenses to use Conditional Access App Control:

  - A relevant PingOne license (required for single sign-on)
  - Microsoft Cloud App Security

- An existing PingOne single sign-on configuration for the app using the SAML 2.0 authentication protocol

## To configure session controls for your app using PingOne as the IdP

Use the following steps to route your web app sessions from PingOne to Cloud App Security. For Azure AD configuration steps, see [Configure integration with Azure AD](proxy-deployment-any-app.md#configure-integration-with-azure-ad).

> [!NOTE]
> You can configure the app's SAML single sign-on information provided by PingOne using one of the following methods:
>
> - **Option 1**: Uploading the app's SAML metadata file.
> - **Option 2**: Manually providing the app's SAML data.
>
> In the following steps, we'll use option 2.

**Step 1: [Get your app's SAML single sign-on settings](#idp1-get-your-app-saml-sso-info)**

**Step 2: [Configure Cloud App Security with your app's SAML information](#idp1-conf-cas-with-your-app-saml-info)**

**Step 3: [Create a custom app in PingOne](#idp1-create-custom-app-pingone)**

**Step 4: [Configure Cloud App Security with the PingOne app's information](#idp1-conf-cas-with-pingone-app-info)**

**Step 5: [Complete the custom app in PingOne](#idp1-complete-custom-app-in-pingone)**

**Step 6: [Get the app changes in Cloud App Security](#idp1-get-app-changes-in-cas)**

**Step 7: [Complete the app changes](#idp1-complete-app-changes)**

**Step 8: [Complete the configuration in Cloud App Security](#idp1-complete-conf-in-cas)**

<a name="idp1-get-your-app-saml-sso-info"></a>

## Step 1: Get your app's SAML single sign-on settings

1. In Salesforce, browse to **Setup** > **Settings** > **Identity** > **Single Sign-On Settings**.

1. Under **Single Sign-On Settings**, select the name of your existing SAML 2.0 configuration.

    ![Select Salesforce SSO settings](media/proxy-idp-pingone/idp-pingone-sf-select-sso-settings.png)

1. On the **SAML Single Sign-On Setting** page, make a note of the Salesforce **Login URL**. You'll need this later.

    > [!NOTE]
    > If your app provides a SAML certificate, download the certificate file.

    ![Select Salesforce SSO login URL](media/proxy-idp-pingone/idp-pingone-sf-copy-saml-sso-login-url.png)

<a name="idp1-conf-cas-with-your-app-saml-info"></a>

## Step 2: Configure Cloud App Security with your app's SAML information

1. In Cloud App Security, browse to **Investigate** > **Connected apps** > **Conditional Access App Control apps**.

1. Select plus sign (**+**), and in the pop-up, select the app you want to deploy, and then select **Start Wizard**.
1. On the **APP INFORMATION** page, select **Fill in data manually**, in the **Assertion consumer service URL** enter the Salesforce **Login URL** you noted earlier, and then select **Next**.

    > [!NOTE]
    > If your app provides a SAML certificate, select **Use <app_name> SAML certificate** and upload the certificate file.

    ![Manually fill in Salesforce SAML information](media/proxy-idp-pingone/idp-pingone-cas-sf-app-info.png)

<a name="idp1-create-custom-app-pingone"></a>

## Step 3: Create a custom app in PingOne

Before you proceed, use the following steps to get information from your existing Salesforce app.

1. In PingOne, edit your existing Salesforce app.

1. On the **SSO Attribute Mapping** page, make a note of the SAML_SUBJECT attribute and value, and then download the **Signing Certificate** and **SAML Metadata** files.

    ![Note existing Salesforce app's attributes](media/proxy-idp-pingone/idp-pingone-sf-app-copy-saml-sso-attributes.png)

1. Open the SAML metadata file and make a note of the PingOne **SingleSignOnService Location**. You'll need this later.

    ![Note existing Salesforce app's SSO service location](media/proxy-idp-pingone/idp-pingone-sf-app-copy-saml-sso-service-location.png)

1. On the **Group Access** page, make a note of the assigned groups.

    ![Note existing Salesforce app's assigned groups](media/proxy-idp-pingone/idp-pingone-sf-app-copy-saml-sso-user-groups.png)

Then use the instructions from the **Add a SAML application with your identity provider** page to configure a custom app in your IdP's portal.

![Add SAML app with your identity provider](media/proxy-deploy-add-idp-get-conf.png)

> [!NOTE]
> Configuring a custom app enables you to test the existing app with access and session controls without changing the current behavior for your organization.

1. Create a **New SAML Application**.

    ![In PingOne, create new custom Salesforce app](media/proxy-idp-pingone/idp-pingone-sf-custom-app-new.png)

1. On the **Application Details** page, fill out the form, and then select **Continue to Next Step**.

    > [!TIP]
    > Use an app name that will help you to differentiate between the custom app and the existing Salesforce app.

    ![Fill out the custom app details](media/proxy-idp-pingone/idp-pingone-sf-custom-app-details.png)

1. On the **Application Configuration** page, do the following, and then select **Continue to Next Step**.
    - In the **Single sign-on service URL** field, enter the Salesforce **Login URL** you noted earlier.
    - In the **Entity ID** field, enter a unique ID starting with *https://*. Make sure this is different from the exiting Salesforce PingOne app's configuration.
    - Make a note of the **Entity ID**. You'll need this later.

    ![Configure custom app with Salesforce SAML details](media/proxy-idp-pingone/idp-pingone-sf-custom-app-set-saml-sso-properties.png)

1. On the **SSO Attribute Mapping** page, add the existing Salesforce app's **SAML_SUBJECT** attribute and value you noted earlier, and then select **Continue to Next Step**.

    ![Add attributes to custom Salesforce app](media/proxy-idp-pingone/idp-pingone-sf-custom-app-set-saml-sso-attributes.png)

1. On the **Group Access** page, add the existing Salesforce app's groups you noted earlier, and complete the configuration.

    ![Assign groups to custom Salesforce app](media/proxy-idp-pingone/idp-pingone-sf-custom-app-set-saml-sso-user-groups.png)

<a name="idp1-conf-cas-with-pingone-app-info"></a>

## Step 4: Configure Cloud App Security with the PingOne app's information

1. Back in the Cloud App Security **IDENTITY PROVIDER** page, select **Next** to proceed.

1. On the next page, select **Fill in data manually**, do the following, and then select **Next**.
    - For the **Assertion consumer service URL**, enter the Salesforce **Login URL** you noted earlier.
    - Select **Upload identity provider's SAML certificate** and upload the certificate file you downloaded earlier.

    ![Add SSO service URL and SAML certificate](media/proxy-idp-pingone/idp-pingone-cas-sf-app-idp-info.png)

1. On the next page, make a note of the following information, and then select **Next**. You'll need the information later.

    - Cloud App Security single sign-on URL
    - Cloud App Security attributes and values

    ![In Cloud App Security, note SSO URL and attributes](media/proxy-idp-pingone/idp-pingone-cas-get-sf-app-external-config.png)

<a name="idp1-complete-custom-app-in-pingone"></a>

## Step 5: Complete the custom app in PingOne

1. In PingOne, locate and edit the custom Salesforce app.

    ![Locate and edit custom Salesforce app](media/proxy-idp-pingone/idp-pingone-sf-custom-app-edit.png)

1. In the **Assertion Consumer Service (ACS)** field, replace the URL with the Cloud App Security single sign-on URL you noted earlier, and then select **Next**.

    ![Replace ACS in custom Salesforce app](media/proxy-idp-pingone/idp-pingone-sf-custom-app-replace-saml-sso-properties.png)

1. Add the Cloud App Security attributes and values you noted earlier to the app's properties.

    ![Add Cloud App Security attributes to custom Salesforce app](media/proxy-idp-pingone/idp-pingone-sf-custom-app-replace-saml-sso-attributes.png)

1. Save your settings.

<a name="idp1-get-app-changes-in-cas"></a>

## Step 6: Get the app changes in Cloud App Security

Back in the Cloud App Security **APP CHANGES** page, do the following, but **don't select Finish**. You'll need the information later.

- Copy the Cloud App Security SAML Single sign-on URL
- Download the Cloud App Security SAML certificate

![Note the Cloud App Security SAML SSO URL and download the certificate](media/proxy-idp-pingone/idp-pingone-cas-sf-app-changes.png)

<a name="idp1-complete-app-changes"></a>

## Step 7: Complete the app changes

In Salesforce, browse to **Setup** > **Settings** > **Identity** > **Single Sign-On Settings**, and do the following:

1. Recommended: Create a backup of your current settings.
1. Replace the **Identity Provider Login URL** field value with the Cloud App Security SAML single sign-on URL you noted earlier.
1. Upload the Cloud App Security SAML certificate you downloaded earlier.
1. Replace the **Entity ID** field value with the PingOne custom app Entity ID you noted earlier.
1. Select **Save**.

    > [!NOTE]
    > The Cloud App Security SAML certificate is valid for one year. After it expires, a new certificate will need to be generated.

    ![Update custom Salesforce app with Cloud App Security SAML details](media/proxy-idp-pingone/idp-pingone-sf-custom-app-changes.png)

<a name="idp1-complete-conf-in-cas"></a>

## Step 8: Complete the configuration in Cloud App Security

- Back in the Cloud App Security **APP CHANGES** page, select **Finish**. After completing the wizard, all associated login requests to this app will be routed through Conditional Access App Control.

## Next steps

> [!div class="nextstepaction"]
> [« PREVIOUS: Deploy Conditional Access App Control for any apps](proxy-deployment-any-app.md)

## See also

> [!div class="nextstepaction"]
> [Introduction to Conditional Access App Control](proxy-intro-aad.md)

> [!div class="nextstepaction"]
> [Troubleshooting access and session controls](troubleshooting-proxy.md)

[!INCLUDE [Open support ticket](includes/support.md)]
