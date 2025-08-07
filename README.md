# ICT Governance Framework Application

## Overview

The CBA Consult IT Management Framework is a comprehensive solution to optimize companies' governance frameworks in a multi-cloud environment. This repository contains a structured set of documents, policies, and guidelines that form the ICT Governance Framework.

Last Updated: August 7, 2025 | Original Creation: October 22, 2020, Amsterdam, The Netherlands

## Framework Components

The ICT Governance Framework consists of the following core components:

1. **[ICT Governance Framework](ICT-Governance-Framework.md)** - The foundational document defining the governance structure, roles, responsibilities, and operating model.

2. **[ICT Governance Policies](ICT-Governance-Policies.md)** - Detailed policies covering technology selection, security, architecture, change management, asset lifecycle, and vendor management.

3. **[IaC and Version Control Integration](ICT-Governance-IaC-Integration.md)** - Guidelines for integrating the governance framework with Infrastructure as Code and version control systems.

4. **[Metrics and Reporting](ICT-Governance-Metrics.md)** - Key performance indicators, dashboards, and reporting mechanisms for evaluating governance effectiveness.

5. **[Training and Communication Plan](ICT-Governance-Training-Communication.md)** - Approach for creating awareness, providing training, and establishing communication about the governance framework.

## Key Features

- **Governance Structure**: Three-tiered governance model with clear roles and responsibilities
- **Policy Framework**: Comprehensive policies aligned with industry standards (COBIT, ITIL, ISO/IEC 38500)
- **IaC Integration**: "Governance as Code" approach with automated validation and enforcement
- **Compliance Management**: Alignment with regulatory requirements and standards
- **Metrics and Reporting**: KPIs and dashboards for governance effectiveness
- **Continuous Improvement**: Framework for ongoing assessment and enhancement

## Additional Resources

- **[Infrastructure as Code Management](IaC%20Infrastructure%20as%20Code%20Management.md)**: Guidelines for managing infrastructure as code
- **[Microsoft365DSC Integration](Integrating%20Microsoft365DSC.md)**: Extension of governance to Microsoft 365 services
- **[API Center Version Controls](Methodology%20API%20Center%20on%20Governance%20Framework%20Version%20Controls.md)**: API governance and versioning
- **[Information Governance Overview](InformationOverview.md)**: Information governance principles and approaches

## Implementation Approach

To implement this framework:

1. **Foundation**: Establish the governance structure and core policies
2. **Integration**: Connect governance with existing processes and tools
3. **Automation**: Implement automated validation and compliance checking
4. **Measurement**: Set up metrics and reporting
5. **Training**: Develop awareness and capabilities

## Continuous Improvement

The governance framework is designed as a living system that evolves with organizational needs and technology changes. Regular reviews and updates ensure it remains effective and aligned with business objectives.

## Contribution Guidelines

We welcome contributions to enhance this framework. Please follow these steps:
1. Create a feature branch from the main branch
2. Make your changes following the established document structure
3. Submit a pull request with a clear description of your changes
4. Ensure all documentation is updated appropriately

## License

[Specify License Information]

## Background and Original Vision

The IT Governance framework has evolved drastically with the introduction of numerous cloud services. This framework builds on the original vision of optimizing governance in multi-cloud environments while adding structure and comprehensive coverage across all ICT domains.

Key aspects of the original vision include:

- **Blueprint-Based Governance**: Using blueprints to define and enforce governance boundaries
- **Secure Score Comparison**: Comparing current secure scores with blueprint-initiated scores
- **Risk Management**: Controlling service activation and configuration through governance
- **Compliance Alignment**: Aligning with location-based compliance regulations
- **Version Control**: Managing versions for applications and governance frameworks
- **Infrastructure as Code**: Maintaining infrastructure definitions in version-controlled repositories

The framework extends these concepts into a comprehensive governance approach covering all aspects of information and communication technology.

## Mobile Application Integration

Part of the application ecosystem is a mobile application for end-user assessment of compliance and security: 
- [ICT Governance Framework Mobile App](https://xd.adobe.com/view/0ca1c123-cf98-43de-8aab-a71dad328273-59f2)

This mobile app provides end users with a clear overview of applications and web applications used together with their current compliance scores.

## Related Links

- [Governance Framework Best Practices](https://github.com/CBA-Consult/ICT-Governance-Framework-Application/wiki/Governance-Framework-Best-Practices-and-process-ownership-and-drift-within-the-governance-framework)
- [Contract Management Integration](https://pwc.to/3LBQCzp)

Infrastructure as code and the mandatory Bicep ARM templates being administered in a git repository to ensure any bicep arm templates written maintained by a main branch and only updated by a pull request.

Managing infrastructure as code (IaC) using Bicep and ARM templates in a Git repository is a best practice. Let’s break down the steps to achieve this:

Git Repository for Bicep Templates:
Create a Git repository to store your Bicep templates. You can use platforms like GitHub, Azure DevOps, or any other Git provider.
Organize your templates into folders based on their purpose (e.g., networking, compute, storage).

Branching Strategy:
Use a branching strategy to manage your templates effectively.
Consider the following branches:
Main Branch: This branch contains production-ready templates.
Feature Branches: Create feature branches for new templates or changes.
Pull Requests (PRs): Developers create PRs from feature branches to the main branch.

Template Maintenance Workflow:
Developers work on feature branches, creating or modifying templates.
When ready, they create a PR to merge their changes into the main branch.
The PR triggers automated validation (e.g., template linting, policy checks).
Once approved, the changes are merged into the main branch.

Continuous Integration (CI):
Set up CI pipelines to validate templates automatically.
Use tools like GitHub Actions, Azure Pipelines, or GitLab CI/CD.
Validate syntax, compliance, and best practices during CI.

Deployment Automation:
Use Azure CLI or Azure PowerShell to deploy templates.
Authenticate using az login.
Set the correct Azure subscription using az account set -s <subscriptionId>.

Cleanup Resources:
When deploying templates for testing, ensure you clean up resources afterward.
Azure offers free subscriptions for testing purposes.

Regarding the ICT Governance Framework:

Integrate the approval process into your Git repository using pull requests.
Document the governance framework alongside your templates.
Regularly compare the governance framework with the production environment to identify any discrepancies.
Remember, Bicep simplifies ARM template creation and provides a more concise syntax. It’s a great choice for managing your Azure infrastructure as code!

While Bicep and ARM templates are primarily used for defining and deploying infrastructure resources, they are not typically used to directly represent governance frameworks or documentation. However, you can achieve a comparison between the actual infrastructure and the approved governance framework by following these steps:

Infrastructure as Code (IaC) for Governance Framework:

Create a separate set of Bicep or ARM templates specifically for your governance framework.
Define policies, naming conventions, resource tagging, access controls, and other governance rules within these templates.
These templates act as a representation of your governance requirements.

Comparison Process:

Periodically compare the actual deployed resources (based on existing Bicep/ARM templates) with the governance framework templates.
Use tools like Azure Policy, Azure Resource Graph, or custom scripts to identify discrepancies.
Look for differences in resource names, tags, permissions, and configurations.

Automated Validation:

Set up automated validation during deployment or CI/CD pipelines.
Validate that the deployed resources adhere to the governance rules defined in your framework.
If any deviations are detected, trigger alerts or notifications.

Documentation Integration:

While the governance framework itself isn’t directly written in Bicep or ARM templates, you can integrate it with documentation.
Document the governance rules, policies, and guidelines alongside the templates.
Explain how each template aligns with specific governance requirements.

Reporting and Remediation:

Generate reports highlighting discrepancies between the actual infrastructure and the governance framework.
Develop processes to remediate any non-compliance issues.
Update the governance framework documentation as needed.
Remember that Bicep and ARM templates are powerful tools for managing infrastructure, but they serve a different purpose than governance documentation. 

By combining both approaches, you can maintain a consistent and compliant environment.

To automate the comparison between the actual infrastructure and the governance framework documentation, follow these steps:

1. **Infrastructure Scanning**:
   - Use tools like Azure Policy, Azure Resource Graph, or custom scripts to scan your deployed resources.
   - Compare them against the governance rules defined in your framework.

2. **Automated Reporting**:
   - Generate reports highlighting discrepancies.
   - Include details on non-compliant resources, naming conventions, tags, permissions, etc.

3. **Remediation Workflow**:
   - Develop processes to address non-compliance.
   - Update the governance framework documentation based on findings.

Remember, automation streamlines governance and ensures consistency. If you need further assistance, feel free to ask! 😊

Infrastructure as Code Center (API Center) version control for your comparison current infrastructure and the Infrastructure as a Code in your Governance Framework

Establish your initial setup policies and configuration (Bsseline) and review to discover drift. See more at Sovereign Cloud

https://github.com/CBA-Consult/ICT-Governance-Framework-Application/wiki/Governance-Framework-Best-Practices-and-process-ownership-and-drift-within-the-governance-framework
