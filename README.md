22nd of October 2020, Amsterdam The Netherlands

# ICT-Governance-Framework-Application
The CBA Consult IT Management Framework is a project to optimize companies goverenance framework in a multi cloud environment. One of the reasons the framework and the procedures involved in creating, maintaining and updating the framework is leveraging the IT innovative solutions as in governance and maintaince framework updates and execution of blueprints, policies and ensure compliance to these requirements.

Introduction
The IT Governance framework has evolved drastically with the introduction of numerous cloud services. Some of which allow for a governance framework which is partly automated based on the business requirements and the exposed compliance requirements these services have on the business.

The reason for this project is to ensure your governance framework is updated, the infrastructure which it supports updated with the relevant adjustments in policy, compliance and blueprints. To ensure these updates are processed into Governance Framework Update notification automation to meet business requirements.

The comparison between your current secure score and a blueprint (currently in preview not to be sold) initiated secure score and any differences between the two was created in May 2019. This results in possible integration based on the blueprints and the allowed score in your business/company set requirements. A secure implementation of cloud services.

One of the great advantages when using the blueprints is the reduced risk set for the company of not automatically offering the extensive services made available upon launch. When new innovation is added to the Azure portal they will prior to being an active part of your goverance framework have to be activated and configured for your Tenant. The Blueprint will require to be adjusted to set the boundaries for regions of activation and the size of the services it will render in your tenant. Greater allignment to location based compliance regulations and future automate the comparisson between your goverrnance framework and the difference between the blueprint and active services in your tenant which produce a difference and a paragraph for approval in your governance framework documentation. The services are first reviewed and allow you to make strategic decisions on what you wish to do when integrating / adopting these services within your company. Exposing the services into your Tenant but due to the blueprint restrictiosn will not allow for an architect or engineer to activate withoiut the blueprint allowing these services to be created in the regions you define in the these policies. You will not automatically accept each change in possible solutions which extend far beyond what we currently know understand and see as possible.

To ensure these new services do not conflict with current ongoing production they will not automatically be added to the environment. They will first require adjustment to the governance framework and the blueprints which will control which services by which threshold and type of exposed risk.

Part of the applications and tools made available is a mobile application. Please find the mobile application under ICT Governance Framework Application - Projects: CBA Consult Compliance and Security - End User Mobile Assessment Tools - https://xd.adobe.com/view/0ca1c123-cf98-43de-8aab-a71dad328273-59f2 
This includes the Apps from the compliance App Catalog to include the end user with a clear overview applications and webapplications used together with the current known compliance score.

Both the amount of new services and the amount of blueprint new combinations to make are a constant stream of both version controls. Versions for the applications and versioning for the guiding blueprints governanceframework and the diffrences between them. The latest compliance score was by selecting several high priority iso standards, policies and sox or soc measures to mitigate risks they showed an exponential amount of growth. Fit gap analyses between each governing framework. The fit gap between two iso standards as well as the overlap from a sox policy as and soc policy could overlap. As well as the privacy shield in as the US Privacy Shield could overlap in main areas with the European GDPR policy a fit gap analyses between both policies should highlight the overlap between the standards in governance.

With the integration of contract management into the Azure portal the following article provide a possible better solution to the above named github repo. https://pwc.to/3LBQCzp

It sounds like you're discussing a comprehensive IT management framework designed for optimizing governance in a multi-cloud environment. The CBA Consult IT Management Framework aims to leverage innovative IT solutions to maintain and update governance frameworks, ensuring compliance with business and regulatory requirements.

**Key Points of the CBA Consult IT Management Framework:**
- **Automation:** Partly automates the governance framework based on business and compliance requirements.
- **Updates:** Ensures the governance framework and supporting infrastructure are updated with relevant policy, compliance, and blueprint adjustments.
- **Secure Score Comparison:** Compares the current secure score with a blueprint-initiated secure score to guide integration and policy adjustments.
- **Risk Management:** Utilizes blueprints to manage risks by controlling the activation and configuration of new services within the Azure portal.
- **Compliance Alignment:** Aligns with location-based compliance regulations and automates the comparison between governance frameworks and service implementations.
- **Strategic Control:** Provides strategic control over service integration and adoption, with blueprint restrictions guiding the activation of services.
- **Non-Automatic Integration:** New services are not automatically added to the production environment; they require governance framework and blueprint adjustments first.
- **Mobile Application:** Offers a mobile application for end-user assessment of compliance and security ([ICT Governance Framework Application](https://xd.adobe.com/view/0ca1c123-cf98-43de-8aab-a71dad328273-59f2)).
- **Version Control:** Manages a constant stream of new services and blueprint combinations, with version control for applications and governance frameworks.
- **Compliance Scoring:** Utilizes high-priority ISO standards, policies, and SOX or SOC measures for compliance scoring and risk mitigation.
- **Fit Gap Analysis:** Conducts fit gap analyses between governance frameworks, ISO standards, and policies like SOX, SOC, US Privacy Shield, and GDPR to identify overlaps and gaps.

The integration of contract management into the Azure portal, as mentioned in the provided article, seems to offer a solution that enhances the governance framework by streamlining contract management processes.

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

Establish your initial setup poicies and configuration and review to discover drift. See more at Sovereign Cloud

https://github.com/CBA-Consult/ICT-Governance-Framework-Application/wiki/Governance-Framework-Best-Practices-and-process-ownership-and-drift-within-the-governance-framework
