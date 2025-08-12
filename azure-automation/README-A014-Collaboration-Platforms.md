# A014 - Collaboration Platforms Automation Scripts

This directory contains the automation scripts for deploying and monitoring collaboration platforms as part of the ICT Governance Framework A014 task implementation.

## Overview

The A014 automation suite provides comprehensive deployment and monitoring capabilities for:
- Microsoft Teams governance teams
- SharePoint Online governance sites
- Azure DevOps governance projects
- Power Platform governance environments

## Scripts

### 1. Deploy-CollaborationPlatforms.ps1

**Purpose:** Automated deployment and configuration of all collaboration platforms.

**Features:**
- ✅ Microsoft Teams governance team creation with proper channels and permissions
- ✅ SharePoint Online governance sites with document libraries and workflows
- ✅ Azure DevOps project configuration with repositories and pipelines
- ✅ Power Platform environment setup with DLP policies
- ✅ Integration with unified governance platform
- ✅ Comprehensive deployment reporting
- ✅ WhatIf mode for testing

**Usage:**
```powershell
# Basic deployment
.\Deploy-CollaborationPlatforms.ps1 -TenantId "your-tenant-id" -SubscriptionId "your-subscription-id"

# Test deployment (WhatIf mode)
.\Deploy-CollaborationPlatforms.ps1 -TenantId "your-tenant-id" -SubscriptionId "your-subscription-id" -WhatIf

# Skip specific platforms
.\Deploy-CollaborationPlatforms.ps1 -TenantId "your-tenant-id" -SubscriptionId "your-subscription-id" -SkipTeams -SkipPowerPlatform

# Use custom configuration
.\Deploy-CollaborationPlatforms.ps1 -TenantId "your-tenant-id" -SubscriptionId "your-subscription-id" -ConfigPath "./custom-config.json"
```

**Parameters:**
- `TenantId` (Required): Azure AD tenant ID
- `SubscriptionId` (Required): Azure subscription ID
- `Environment` (Optional): Target environment (default: "prod")
- `ConfigPath` (Optional): Path to configuration file (default: "./collaboration-config.json")
- `WhatIf` (Optional): Test mode - shows what would be deployed without making changes
- `SkipTeams` (Optional): Skip Microsoft Teams deployment
- `SkipSharePoint` (Optional): Skip SharePoint Online deployment
- `SkipDevOps` (Optional): Skip Azure DevOps configuration
- `SkipPowerPlatform` (Optional): Skip Power Platform deployment

### 2. Monitor-CollaborationPlatforms.ps1

**Purpose:** Continuous monitoring and compliance checking of deployed collaboration platforms.

**Features:**
- ✅ Real-time compliance monitoring across all platforms
- ✅ Automated alert generation for policy violations
- ✅ Comprehensive reporting (JSON and HTML formats)
- ✅ Email notifications for critical issues
- ✅ Integration with governance metrics and dashboards
- ✅ Configurable monitoring frequency

**Usage:**
```powershell
# Daily monitoring report
.\Monitor-CollaborationPlatforms.ps1 -TenantId "your-tenant-id" -ReportType "Daily"

# Weekly comprehensive report with email notifications
.\Monitor-CollaborationPlatforms.ps1 -TenantId "your-tenant-id" -ReportType "Weekly" -SendEmail -EmailRecipients @("governance@company.com", "cio@company.com")

# On-demand monitoring with alerts
.\Monitor-CollaborationPlatforms.ps1 -TenantId "your-tenant-id" -ReportType "OnDemand" -GenerateAlerts

# Custom output location
.\Monitor-CollaborationPlatforms.ps1 -TenantId "your-tenant-id" -OutputPath "./custom-reports"
```

**Parameters:**
- `TenantId` (Required): Azure AD tenant ID
- `ConfigPath` (Optional): Path to configuration file (default: "./collaboration-config.json")
- `ReportType` (Optional): Report frequency - Daily, Weekly, Monthly, OnDemand (default: "Daily")
- `OutputPath` (Optional): Output directory for reports (default: "./reports")
- `SendEmail` (Optional): Send email notifications
- `EmailRecipients` (Optional): Email recipients for notifications
- `GenerateAlerts` (Optional): Generate alerts for critical issues

### 3. collaboration-config.json

**Purpose:** Centralized configuration file for all collaboration platforms.

**Key Sections:**
- `teams`: Microsoft Teams configuration including governance teams, channels, and policies
- `sharepoint`: SharePoint Online sites, libraries, and governance features
- `devops`: Azure DevOps projects, repositories, and pipelines
- `powerPlatform`: Power Platform environments, DLP policies, and applications
- `integration`: Unified governance platform integration settings
- `monitoring`: Monitoring and compliance configuration
- `compliance`: Compliance frameworks and requirements

## Prerequisites

### Required PowerShell Modules
```powershell
# Install required modules
Install-Module -Name Az.Accounts -Force
Install-Module -Name Az.Resources -Force
Install-Module -Name Microsoft.Graph -Force
Install-Module -Name MicrosoftTeams -Force
Install-Module -Name PnP.PowerShell -Force
Install-Module -Name Microsoft.PowerApps.Administration.PowerShell -Force
Install-Module -Name Az.Monitor -Force
```

### Required Permissions

#### Azure AD Permissions
- Global Administrator (for initial setup)
- Teams Administrator
- SharePoint Administrator
- Power Platform Administrator

#### Microsoft Graph API Permissions
- Group.ReadWrite.All
- Directory.ReadWrite.All
- Sites.ReadWrite.All
- Reports.Read.All
- AuditLog.Read.All

#### Azure Permissions
- Contributor role on target subscription
- User Access Administrator (for role assignments)

## Configuration

### 1. Update Configuration File

Edit `collaboration-config.json` to match your organization's requirements:

```json
{
  "teams": {
    "governanceTeams": [
      {
        "name": "ICT Governance Council",
        "description": "Strategic governance oversight and decision-making",
        "privacy": "Private",
        "channels": ["General", "Strategic Planning", "Policy Decisions"],
        "members": {
          "owners": ["governance-council-chair@company.com"],
          "members": ["domain-owners@company.com"]
        }
      }
    ]
  }
}
```

### 2. Set Up Service Principal (Recommended for Production)

```powershell
# Create service principal for automation
$sp = New-AzADServicePrincipal -DisplayName "ICT-Governance-Automation"

# Assign required roles
New-AzRoleAssignment -ObjectId $sp.Id -RoleDefinitionName "Contributor" -Scope "/subscriptions/your-subscription-id"
```

### 3. Configure Monitoring Schedule

Set up scheduled tasks or Azure Automation runbooks to execute monitoring scripts:

```powershell
# Example: Daily monitoring at 8 AM
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Scripts\Monitor-CollaborationPlatforms.ps1 -TenantId 'your-tenant-id' -ReportType 'Daily'"
$trigger = New-ScheduledTaskTrigger -Daily -At 8am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "ICT-Governance-Daily-Monitoring"
```

## Deployment Process

### Phase 1: Preparation
1. Install required PowerShell modules
2. Configure service principal and permissions
3. Customize configuration file
4. Test deployment in WhatIf mode

### Phase 2: Deployment
1. Deploy Microsoft Teams governance structure
2. Create SharePoint governance sites
3. Configure Azure DevOps projects
4. Set up Power Platform environments
5. Validate integration with governance platform

### Phase 3: Monitoring Setup
1. Configure monitoring scripts
2. Set up scheduled monitoring tasks
3. Test alert mechanisms
4. Validate reporting functionality

### Phase 4: Validation
1. Execute comprehensive compliance check
2. Validate all platform configurations
3. Test user access and permissions
4. Confirm integration with governance framework

## Troubleshooting

### Common Issues

#### Authentication Errors
```powershell
# Clear cached credentials
Disconnect-AzAccount
Disconnect-MgGraph
Disconnect-MicrosoftTeams

# Reconnect with fresh authentication
Connect-AzAccount -TenantId "your-tenant-id"
```

#### Permission Errors
- Verify service principal has required permissions
- Check Azure AD role assignments
- Confirm API permissions are granted and consented

#### Module Import Errors
```powershell
# Update PowerShell modules
Update-Module -Name Az -Force
Update-Module -Name Microsoft.Graph -Force
```

### Logging and Diagnostics

All scripts generate detailed logs:
- **Deployment logs:** `Deploy-CollaborationPlatforms-YYYYMMDD-HHMMSS.log`
- **Monitoring logs:** `Monitor-CollaborationPlatforms-YYYYMMDD-HHMMSS.log`

Enable verbose logging for troubleshooting:
```powershell
.\Deploy-CollaborationPlatforms.ps1 -TenantId "your-tenant-id" -SubscriptionId "your-subscription-id" -Verbose
```

## Integration with ICT Governance Framework

### Unified Governance Platform
The automation scripts integrate with the unified governance platform through:
- **API Integration:** RESTful API calls to governance endpoints
- **Event Publishing:** Platform events published to governance event hub
- **Metrics Collection:** Performance and compliance metrics sent to governance analytics
- **Policy Enforcement:** Automated policy compliance checking and remediation

### Compliance Frameworks
Supports compliance with:
- ISO 27001
- NIST Cybersecurity Framework
- COBIT 2019
- ITIL 4
- SOX
- GDPR

### Reporting and Analytics
- **Executive Dashboards:** Real-time governance metrics
- **Compliance Reports:** Automated compliance status reporting
- **Trend Analysis:** Historical compliance and usage trends
- **Risk Assessment:** Automated risk scoring and alerts

## Support and Maintenance

### Regular Maintenance Tasks
1. **Monthly:** Review and update configuration
2. **Quarterly:** Validate permissions and access
3. **Semi-annually:** Update PowerShell modules
4. **Annually:** Review and update compliance requirements

### Support Contacts
- **Technical Support:** ict-governance-support@company.com
- **Governance Council:** governance-council@company.com
- **Emergency Escalation:** cio@company.com

### Documentation Updates
This documentation is maintained in the ICT Governance Framework repository and updated with each release.

---

**Document Information:**
- **Version:** 1.0.0
- **Last Updated:** August 8, 2025
- **Owner:** ICT Governance Team
- **Review Frequency:** Quarterly