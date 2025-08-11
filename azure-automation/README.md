# Azure ICT Governance Framework Automation

This directory contains PowerShell scripts for automating the governance and compliance management of Azure resources, specifically designed for ICT governance frameworks.

## Overview

The ICT Governance Framework Automation tools provide capabilities to:

- Monitor and report on Azure Policy compliance
- Generate governance dashboards and reports
- Assess resources for compliance with tagging standards
- Track non-compliant resources and policy violations
- Automate governance controls and checks

## Getting Started

### Prerequisites

- PowerShell 7.0 or later
- Az PowerShell modules:
  - Az.Accounts
  - Az.Resources
  - Az.PolicyInsights

You can install the required modules using:

```powershell
Install-Module -Name Az.Accounts, Az.Resources, Az.PolicyInsights -Force
```

### Installation

1. Clone this repository or download the scripts
2. Import the module or run the scripts directly

```powershell
# Import as a module
Import-Module .\ICT-Governance-Framework.ps1

# Or run directly
.\ICT-Governance-Framework.ps1
```

## Features

### Initialize-GovFramework

Initializes the governance framework by creating necessary directories and loading configurations.

```powershell
Initialize-GovFramework -CustomConfigPath ".\custom-config.json"
```

### Connect-GovAzure

Connects to Azure using different authentication methods.

```powershell
# Interactive login
Connect-GovAzure

# Use Managed Identity
Connect-GovAzure -UseManagedIdentity

# Connect to specific tenant
Connect-GovAzure -TenantId "your-tenant-id"
```

### Get-GovPolicyComplianceSummary

Retrieves a summary of Azure Policy compliance.

```powershell
# Get compliance for current subscription
$compliance = Get-GovPolicyComplianceSummary

# Get compliance for specific subscription
$compliance = Get-GovPolicyComplianceSummary -SubscriptionId "your-subscription-id"

# Export to file
Get-GovPolicyComplianceSummary -OutputPath ".\compliance-summary.json"
```

### Get-GovNonCompliantResources

Gets a list of resources that are non-compliant with Azure Policies.

```powershell
# Get non-compliant resources in current subscription
$nonCompliant = Get-GovNonCompliantResources

# Get non-compliant resources in specific resource group
$nonCompliant = Get-GovNonCompliantResources -ResourceGroupName "your-resource-group"

# Export to file
Get-GovNonCompliantResources -OutputPath ".\non-compliant.json"
```

### New-GovDashboardReport

Generates an HTML dashboard report for governance metrics.

```powershell
# Generate dashboard for current subscription
$reportPath = New-GovDashboardReport

# Generate dashboard for specific subscription
$reportPath = New-GovDashboardReport -SubscriptionId "your-subscription-id"

# Specify custom output path
$reportPath = New-GovDashboardReport -OutputPath ".\custom-dashboard.html"
```

### New-GovAssessmentReport

Creates a CSV report assessing resources against governance standards.

```powershell
# Generate assessment for specific subscription
$assessmentPath = New-GovAssessmentReport -SubscriptionId "your-subscription-id"

# Specify custom output path
$assessmentPath = New-GovAssessmentReport -SubscriptionId "your-subscription-id" -OutputPath ".\custom-assessment.csv"
```

## Directory Structure

The framework creates the following directory structure:

- `governance-logs/` - Contains log files with operation history
- `governance-reports/` - Contains generated reports and dashboards
- `governance-templates/` - Contains templates for reports and dashboards
- `policy-definitions/` - Contains custom policy definitions

## Best Practices

1. **Consistent Tagging**: Ensure all resources have the required tags (Owner, CostCenter, Environment)
2. **Resource Locks**: Apply locks to critical resources to prevent accidental deletion
3. **Regular Assessments**: Run governance assessments weekly to track compliance trends
4. **Custom Policies**: Develop custom policies to enforce organization-specific requirements
5. **Automated Remediation**: Implement automated remediation for common compliance issues

## Automated Remediation Framework

The ICT Governance Framework now includes comprehensive automated remediation capabilities to address compliance violations automatically, reducing manual intervention and response times.

### Key Features

- **Configurable Remediation Rules**: Define which violations can be automatically remediated
- **Phased Implementation**: Gradual expansion of automation coverage over time
- **Environment-Specific Controls**: Different remediation limits and approval requirements per environment
- **Comprehensive Logging**: Full audit trail of all remediation actions
- **Integration Ready**: Built-in support for ServiceNow, JIRA, and Azure DevOps integration

### Supported Violation Types

1. **Missing Tags** (Auto-remediable)
   - Automatically adds required tags to resources
   - Configurable default tag values
   - Excludes sensitive resource types

2. **Security Configuration** (Auto-remediable)
   - Enables HTTPS-only for storage accounts
   - Configures Key Vault security features
   - Applies encryption requirements

3. **Backup Configuration** (Manual review)
   - Flags resources missing backup configuration
   - Creates tickets for manual review
   - Tracks backup compliance

4. **Cost Optimization** (Manual review)
   - Identifies unused or oversized resources
   - Flags cost optimization opportunities
   - Generates cost reports

5. **Naming Convention** (Manual review)
   - Detects naming standard violations
   - Flags for manual remediation
   - Tracks naming compliance

### Quick Start

1. **Deploy Infrastructure**:
   ```powershell
   .\Deploy-AutomatedRemediation.ps1 -ResourceGroupName "rg-governance-automation" -Location "East US" -Environment "Development"
   ```

2. **Run Remediation**:
   ```powershell
   .\Automated-Remediation-Framework.ps1 -ConfigPath ".\remediation-config.json" -Environment "Development" -DryRun
   ```

3. **Monitor Results**:
   - Check generated reports in `governance-reports/`
   - Review logs in `governance-logs/`
   - Monitor Azure Automation Account for scheduled runs

### Configuration Files

- `remediation-config.json`: Main configuration for remediation rules and settings
- `Automated-Remediation-Framework.ps1`: Core remediation engine
- `Deploy-AutomatedRemediation.ps1`: Infrastructure deployment script

For detailed implementation guidance, see [Automated-Remediation-Implementation-Guide.md](../Automated-Remediation-Implementation-Guide.md)

## Contributing

Contributions to improve the ICT Governance Framework Automation are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Microsoft Azure Documentation
- PowerShell Community
- Azure Policy Best Practices
