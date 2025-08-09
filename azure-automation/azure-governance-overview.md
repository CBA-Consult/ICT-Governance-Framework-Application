# Azure ICT Governance Framework

This document provides an overview of the Azure-based automation framework for ICT governance, including installation, configuration, and usage instructions.

## Overview

The Azure ICT Governance Framework Automation provides tools for monitoring, managing, and enforcing governance controls in Azure environments. It consists of PowerShell scripts and Bicep templates that can be used to:

- Deploy governance infrastructure including Log Analytics, Storage, and Key Vault
- Assign Azure Policies aligned with ICT governance frameworks
- Monitor and report on policy compliance
- Generate compliance dashboards and reports
- Assess resources for governance standards

## Getting Started

### Prerequisites

- PowerShell 7.0 or later
- Az PowerShell modules:
  - Az.Accounts
  - Az.Resources
  - Az.PolicyInsights
- Azure subscription with appropriate permissions

### Installation

1. Clone or download this repository
2. Navigate to the `azure-automation` directory
3. Run the initialization script:

```powershell
cd .\azure-automation\
.\ICT-Governance-Framework-Menu.ps1
```

### First-Time Setup

When setting up the framework for the first time:

1. Select option 1 from the menu to connect to Azure
2. Select option 2 to deploy the ICT Governance Framework infrastructure
3. Follow the prompts to provide subscription ID, resource group, and other configuration settings
4. Review the deployment preview and confirm when ready

## Key Components

### PowerShell Scripts

- **ICT-Governance-Framework.ps1**: Core module with functions for governance operations
- **ICT-Governance-Framework-Menu.ps1**: Interactive menu for accessing all framework features
- **Deploy-ICTGovernanceFramework.ps1**: Automated deployment script for infrastructure and policies

### Bicep Templates

- **core-infrastructure.bicep**: Deploys the core governance infrastructure
- **policy-assignments.bicep**: Assigns governance policies to resources

### Generated Reports

- **Compliance Summary**: JSON report showing policy compliance rates
- **Governance Dashboard**: Interactive HTML dashboard with compliance metrics
- **Resource Assessment**: CSV report evaluating resources against governance standards

## Usage Guide

### Monitoring Compliance

1. From the menu, select option 3 (Run Compliance Reports)
2. Enter your subscription ID
3. Optionally specify a resource group to narrow the scope
4. Review the compliance summary

### Generating Dashboards

1. From the menu, select option 4 (Generate Governance Dashboard)
2. Enter your subscription ID
3. Specify an output path or accept the default
4. Open the generated HTML dashboard in your browser

### Running Governance Assessments

1. From the menu, select option 5 (Run Governance Assessment)
2. Enter your subscription ID
3. Review the assessment results showing resources that don't comply with governance standards

## Customization

The framework can be customized in several ways:

- Edit the Bicep templates to change deployed resources
- Modify policy assignments to align with your specific governance requirements
- Customize the dashboard HTML template
- Add your own governance assessment criteria

## Troubleshooting

- **Connection Issues**: Ensure you have the proper Azure permissions
- **Deployment Failures**: Check Azure deployment logs for detailed error information
- **Policy Compliance Delays**: Policy compliance state may take up to 30 minutes to update

## Contributing

Contributions to improve the ICT Governance Framework are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
