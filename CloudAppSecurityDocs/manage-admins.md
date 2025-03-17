---
title: Manage admin access to the Cloud App Security portal
description: This article provides instructions for setting access to the Cloud App Security portal for your admins.
ms.date: 04/27/2021
ms.topic: how-to
---
# Manage admin access

[!INCLUDE [Banner for top of topics](includes/banner.md)]

Microsoft Cloud App Security supports role-based access control. This article provides instructions for setting access to the [Cloud App Security portal](https://portal.cloudappsecurity.com/) for your admins. For more information about assigning administrator roles, see the articles for [Azure Active Directory (Azure AD)](/azure/active-directory/active-directory-assign-admin-roles) and [Office 365](/office365/admin/add-users/assign-admin-roles).

>[!IMPORTANT]
>We have changed the flow for adding external admins to Cloud App Security. For more information, see [Invite external admins](#invite-external-admins).

## Office 365 and Azure AD roles with access to Cloud App Security

> [!NOTE]
>
> - Office 365 and Azure AD roles aren't listed in the Cloud App Security **Manage admin access** page. To assign roles in Office 365 or Azure Active Directory, go to the relevant RBAC settings for that service.
> - Cloud App Security uses Azure Active Directory to determine the user's [directory level inactivity timeout setting](/azure/azure-portal/set-preferences#change-the-directory-timeout-setting-admin). If a user is configured in AAD to never sign out when inactive, the same setting will apply in Cloud App Security as well.

By default, the following Office 365 and [Azure AD](/azure/active-directory/users-groups-roles/directory-assign-admin-roles) admin roles have access to Cloud App Security:

- **Global administrator and Security administrator**: Administrators with **Full access** have full permissions in Cloud App Security. They can add admins, add policies and settings, upload logs and perform governance actions, access and manage SIEM agents.

- **Compliance administrator**: Has read-only permissions and can manage alerts. Can't access Security recommendations for cloud platforms. Can create and modify file policies, allow file governance actions, and view all the built-in reports under Data Management.

- **Compliance data administrator**: Has read-only permissions, can create and modify file policies, allow file governance actions, and view all discovery reports. Can't access Security recommendations for cloud platforms.

- **Security operator and Security reader**: Have read-only permissions and can manage alerts. These admins are restricted from doing the following actions:

  - Create policies or edit and change existing ones
  - Performing any governance actions
  - Uploading discovery logs
  - Banning or approving third-party apps
  - Accessing and viewing the IP address range settings page
  - Accessing and viewing any system settings pages
  - Accessing and viewing the Discovery settings
  - Accessing and viewing the App connectors page
  - Accessing and viewing the Governance log
  - Accessing and viewing the Manage snapshot reports page
  - Accessing and viewing SIEM agents

- **Global reader**: Has full read-only access to all aspects of Cloud App Security. Can't change any settings or take any actions.

## Built-in Cloud App Security admin roles

The following Cloud App Security specific admin roles can be configured in the Cloud App Security portal:

- **App/instance admin**: Has full or read-only permissions to all of the data in Cloud App Security that deals exclusively with the specific app or instance of an app selected. For example, you give a user admin permission to your Box European instance. The admin will see only data that relates to the Box European instance, whether it's files, activities, policies, or alerts:

  - Activities page - Only activities about the specific app
  - Alerts - Only alerts relating to the specific app
  - Policies - Can view all policies and if assigned full permissions can edit or create only policies that deal exclusively with the app/instance
  - Accounts page - Only accounts for the specific app/instance
  - App permissions - Only permissions for the specific app/instance
  - Files page - Only files from the specific app/instance
  - Conditional Access App Control - No permissions
  - Cloud Discovery activity - No permissions
  - Security extensions - Only permissions for API token with user permissions
  - Governance actions - Only for the specific app/instance
  - Security recommendations for cloud platforms - No permissions

- **User group admin**: Has full or read-only permissions to all of the data in Cloud App Security that deals exclusively with the specific groups assigned to them. For example, if you assign a user admin permissions to the group "Germany - all users", the admin can view and edit information in Cloud App Security only for that user group. The User group admin has the following access:

  - Activities page - Only activities about the users in the group
  - Alerts - Only alerts relating to the users in the group
  - Policies - Can view all policies and if assigned full permissions can edit or create only policies that deal exclusively with users in the group
  - Accounts page - Only accounts for the specific users in the group
  - App permissions – No permissions
  - Files page – No permissions
  - Conditional Access App Control - No permissions
  - Cloud Discovery activity - No permissions
  - Security extensions - Only permissions for API token with users in the group
  - Governance actions - Only for the specific users in the group
  - Security recommendations for cloud platforms - No permissions

    > [!NOTE]
    >
    > - To assign groups to user group admins, you must first [import user groups](user-groups.md) from connected apps.
    > - You can only assign user group admins permissions to imported Azure AD groups.

- **Cloud Discovery global admin**: Has permission to view and edit all Cloud Discovery settings and data. The Global Discovery admin has the following access:

  - Settings
    - System settings - View only
    - Cloud Discovery settings - View and edit all (anonymization permissions depend on whether it was allowed during role assignment)
  - Cloud Discovery activity - full permissions
  - Alerts - only alerts related to Cloud Discovery data
  - Policies - Can view all policies and can edit or create only Cloud Discovery policies
  - Activities page - No permissions
  - Accounts page - No permissions
  - App permissions – No permissions
  - Files page – No permissions
  - Conditional Access App Control - No permissions
  - Security extensions - Creating and deleting their own API tokens
  - Governance actions - Only Cloud Discovery related actions
  - Security recommendations for cloud platforms - No permissions

- **Cloud Discovery report admin**: Has permissions to view all the data in Cloud App Security that deals exclusively with the specific Cloud Discovery reports selected. For example, you can give someone admin permission to the continuous report from Microsoft Defender for Endpoint. The Discovery admin will see only the Cloud Discovery data that relates to that data source and to the app catalog. This admin won't have access to the **Activities**, **Files**, or **Security recommendations** pages and limited access to policies.

> [!NOTE]
> The built-in Cloud App Security admin roles only provide access permissions to Cloud App Security.

## Override admin permissions

If you want to override an administrator's permission from Azure AD or Office 365, you can do so by manually adding the user to Cloud App Security and assigning the user permissions. For example, if you want to assign Stephanie, who is a Security reader in Azure AD to have **Full access** in Cloud App Security, you can add her manually to Cloud App Security and assign her **Full access** to override her role and allow her the necessary permissions in Cloud App Security.

## Add additional admins

You can add additional admins to Cloud App Security without adding users to Azure AD administrative roles. To add additional admins, perform the following steps:

> [!IMPORTANT]
> Only Azure AD Global Administrators or Security Administrators can access the **Manage admin access** page and grant other users access to Cloud App Security.

1. Select the settings cog ![settings icon](media/settings-icon.png "settings icon") and then **Manage admin access**.

1. Select the plus icon to add the admins who should have access to Cloud App Security. Provide an email address of a user from inside your organization.

    > [!NOTE]
    > If you want to add external Managed Security Service Providers (MSSPs) as administrators of your Cloud App Security portal, make sure you first [invite them as a guest](#invite-external-admins) to your organization.

    ![add admins](media/add-admin.png)

1. Next, select the drop-down to set what type of role the admin has, **Global admin**, **Security reader**, **Compliance admin**, **App/Instance admin**, **User group admin**, **Cloud Discovery global admin**, or **Cloud Discovery report admin**. If you select **App/Instance admin**, select the app and instance for the admin to have permissions for.

    >[!NOTE]
    > Any admin, whose access is limited, that attempts to access a restricted page or perform a restricted action will receive an error that they don't have permission to access the page or perform the action.

1. Select **Add admin**.

## Invite external admins

Cloud App Security enables you to invite external admins (MSSPs) as administrators of your organization's (MSSP customer) Cloud App Security portal. To add MSSPs, make sure Cloud App Security is enabled on MSSPs tenant and then add them as [Azure AD B2B collaboration users](/azure/active-directory/external-identities/add-users-administrator) in the MSSPs customers Azure portal. Once added, MSSPs can be configured as administrators and assigned any of the roles available in Cloud App Security.

### To add MSSPs to the MSSP customer Cloud App Security portal

1. Add MSSPs as a guest in the MSSP customer directory using the steps under [Add guest users to the directory](/azure/active-directory/external-identities/add-users-administrator#add-guest-users-to-the-directory).
1. Add MSSPs and assign an administrator role in the MSSP customer Cloud App Security portal using the steps under [Add additional admins](#add-additional-admins). Provide the same external email address used when adding them as guests in the MSSP customer directory.

### Access for MSSPs to the MSSP customer Cloud App Security portal

By default, MSSPs access their Cloud App Security tenant through the following URL: `https://portal.cloudappsecurity.com`.

MSSPs however, will need to access the MSSP customer Cloud App Security portal using a tenant-specific URL in the following format: `https://portal.cloudappsecurity.com?tid=customer_tenant_id`.

MSSPs can use the following steps to obtain the MSSP customer portal tenant ID and then use the ID to access the tenant-specific URL:

1. As an MSSP, sign in to Azure AD with your credentials.

1. Switch directory to the MSSP customer's tenant.
1. Select **Azure Active Directory** > **Properties**. You'll find the MSSP customer tenant ID in the **Tenant ID** field.
1. Access the MSSP customer portal by replacing the `customer_tenant_id` value in the following URL: `https://portal.cloudappsecurity.com?tid=customer_tenant_id`.

## Admin activity auditing

Cloud App Security lets you export a log of admin sign-in activities and an audit of views of a specific user or alerts carried out as part of an investigation.

To export a log, perform the following steps:

1. In the **Manage admins access** page, select **Export admin activities**.

1. Specify the required time range.

1. Select **Export**.

## Next steps

> [!div class="nextstepaction"]
> [Set up Cloud Discovery](set-up-cloud-discovery.md)
