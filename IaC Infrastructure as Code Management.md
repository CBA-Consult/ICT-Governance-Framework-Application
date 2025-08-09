## SD-03 - Infrastructure Build and Configuration Standards
#### Comprehensive Drift Detection Strategy

*   **Resource Inventory:** Maintain a complete inventory of all resources, including applications, through automated discovery
*   **Scheduled Scans:** Perform daily automated drift detection scans across all environments
*   **Event-Based Detection:** Trigger drift detection on resource modification events
*   **Integrated Monitoring:** Combine SIEM, Cloud App Security, and infrastructure monitoring for holistic drift detection
*   **Unified Reporting:** Generate integrated drift reports covering both infrastructure and application landscapes
*   **Shadow IT Detection:** Identify unauthorized applications as a critical form of infrastructure drift
*   **Consolidated Approach:** Follow the [Shadow IT as Infrastructure Drift](Shadow-IT-as-Infrastructure-Drift.md) integration frameworkastructure as Code (IaC)** tools play a crucial role in automating the setup, configuration, and management of cloud infrastructure. Let's explore some popular IaC tools:

1. **Terraform**:
   - **Description**: Terraform uses declarative configuration files (written in HashiCorp Configuration Language) to define and provision infrastructure resources across various cloud providers.
   - **Usage**: Define resources (e.g., VMs, networks) in Terraform files, and Terraform handles provisioning.
   - [Learn more about Terraform](https://bluelight.co/blog/best-infrastructure-as-code-tools#terraform)

2. **AWS CloudFormation**:
   - **Description**: AWS-specific tool for defining and provisioning AWS resources using JSON or YAML templates.
   - **Usage**: Create CloudFormation stacks to manage infrastructure.
   - [Learn more about AWS CloudFormation](https://bluelight.co/blog/best-infrastructure-as-code-tools#aws-cloudformation)

3. **Azure Resource Manager (ARM)**:
   - **Description**: Microsoft Azure's native IaC tool.
   - **Usage**: Define resources in ARM templates (JSON) for Azure deployments.
   - [Learn more about Azure Resource Manager](https://bluelight.co/blog/best-infrastructure-as-code-tools#azure-resource-manager)

4. **Google Cloud Deployment Manager**:
   - **Description**: Google Cloud's IaC solution.
   - **Usage**: Define resources in YAML or Python templates.
   - [Learn more about Google Cloud Deployment Manager](https://bluelight.co/blog/best-infrastructure-as-code-tools#google-cloud-deployment-manager)

5. **Pulumi**:
   - **Description**: Allows infrastructure definition using familiar programming languages (e.g., TypeScript, Python).
   - **Usage**: Write code to create and manage resources.
   - [Learn more about Pulumi](https://bluelight.co/blog/best-infrastructure-as-code-tools#pulumi)

6. **Ansible**:
   - **Description**: Configuration management tool that can also be used for IaC.
   - **Usage**: Define infrastructure tasks in Ansible playbooks.
   - [Learn more about Ansible](https://bluelight.co/blog/best-infrastructure-as-code-tools#ansible)

Remember, IaC streamlines infrastructure management, enhances collaboration, and ensures consistency! 😊
### Infrastructure as Code (IaC)

All Azure infrastructure *must* be deployed and managed using Infrastructure as Code (IaC).  Manual deployments through the Azure portal or CLI are *strictly prohibited* for production environments.

#### IaC Tooling

The following IaC tools are approved for use within [Organization Name]:

| Tool        | Description                                                                                                                                                              | Use Cases                                                                                                                             |
|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| **Bicep**   | Azure-native Domain-Specific Language (DSL) for deploying Azure resources.  Transpiles to ARM templates.  Recommended for most Azure-specific deployments.               | Azure-only deployments, simple to moderately complex infrastructure, teams familiar with Azure concepts.                             |
| **Terraform**| Multi-cloud IaC tool from HashiCorp. Uses HashiCorp Configuration Language (HCL).  Mature and widely adopted.                                                           | Multi-cloud deployments, complex infrastructure, large teams, organizations with existing Terraform expertise.                      |
| **ARM Templates** | Azure Resource Manager templates (JSON).  The underlying technology for Azure deployments.  Bicep is generally preferred for authoring.                           | Legacy deployments, situations where direct ARM template manipulation is required (rare).                                        |
| **Pulumi**    | Uses general-purpose programming languages (Python, TypeScript, Go, .NET) to define infrastructure.                                                                | Teams with strong programming skills, multi-cloud deployments, complex infrastructure requiring imperative logic.                   |
| **Microsoft365DSC** | Desired State Configuration (DSC) tool for Microsoft 365 tenant configurations. | Microsoft 365 tenant governance, SaaS configuration management, extending IaC principles to cloud services. |
#### IaC Code Management

*   **Version Control:** All IaC code *must* be stored in a version control system (e.g., Git) using the [Organization Name] standard branching strategy.
*   **Code Reviews:** All changes to IaC code *must* be reviewed and approved by at least one other team member before being merged into the main branch.
*   **CI/CD:**  IaC deployments *must* be automated using CI/CD pipelines (e.g., Azure DevOps Pipelines, GitHub Actions). Manual deployments are prohibited.
*   **Infrastructure Drift:** Regular checks *must* be performed to detect and remediate all forms of infrastructure drift including:
    * **Resource Drift:** Differences between deployed resources and IaC definitions
    * **Configuration Drift:** Changes to resource configurations outside of IaC processes
    * **Application Drift:** Unauthorized or undocumented applications (Shadow IT)
    * **Security Drift:** Changes to security controls or configurations
    * **Compliance Drift:** Deviations from compliance requirements

#### Comprehensive Drift Detection Strategy

*   **Resource Inventory:** Maintain a complete inventory of all resources, including applications, through automated discovery
*   **Scheduled Scans:** Perform daily automated drift detection scans across all environments
*   **Event-Based Detection:** Trigger drift detection on resource modification events
*   **Integrated Monitoring:** Combine SIEM, Cloud App Security, and infrastructure monitoring for holistic drift detection
*   **Unified Reporting:** Generate integrated drift reports covering both infrastructure and application landscapes

#### IaC Testing

IaC code *must* be thoroughly tested before deployment to production environments.  Testing should include:

*   **Linting:**  Use linters (e.g., `bicep build`, Pester) to check for syntax errors and best practice violations.
*   **Validation:**  Use pre-deployment validation tools (e.g., `Test-AzResourceGroupDeployment`, `az deployment group what-if`) to preview the changes that a deployment will make.
*   **Integration Testing:**  Deploy resources to a test environment and verify their functionality.
*    **Compliance testing** Use Azure Policy to enforce standards

### Using Preview Features

Azure preview features (including beta APIs and preview services) *should be avoided* in production environments due to their instability and lack of support guarantees.

If a preview feature *must* be used, the following requirements apply:

1.  **Justification:** A documented justification must be provided, explaining why the preview feature is necessary and why no stable alternative exists.
2.  **Approval:** Use of the preview feature must be approved by [Designated Approver/Team].
3.  **Isolation:** The use of the preview feature must be isolated as much as possible within the infrastructure code.
4.  **Monitoring:** The preview feature must be actively monitored for changes and updates.
5.  **Mitigation Plan:** A documented plan must be in place to address potential changes or removal of the preview feature.

### Shadow IT Detection and Application Governance

All applications deployed and used within the organization *must* follow the governance-compliant application lifecycle management process, with special focus on detecting and managing shadow IT.

#### Shadow IT Detection and Drift Management

1. **Integrated Approach to Drift Management**
   * Shadow IT *must* be treated as a form of infrastructure drift requiring the same governance controls
   * The [Shadow IT as Infrastructure Drift](Shadow-IT-as-Infrastructure-Drift.md) framework *must* be followed for all unauthorized application detection
   * All Shadow IT risk assessments *must* use the standard [Shadow IT Risk Assessment Template](Shadow-IT-Risk-Assessment-Template.md)

2. **Continuous Shadow IT Monitoring**
   * All company devices *must* be monitored through SIEM and Cloud App Security solutions
   * Shadow IT discovery results *must* be treated as critical infrastructure drift indicators
   * Unauthorized applications represent governance drift and *must* be investigated with the same priority as infrastructure drift
   * Weekly shadow IT drift reports *must* be generated and reviewed by the Application Governance Owner and Security Domain Owner

3. **Drift Investigation Process**
   * Shadow IT drift *must* be investigated within 48 hours of detection
   * Investigation *must* determine:
     - Business purpose of the unauthorized application
     - Data security and compliance implications
     - Potential alternative solutions from the approved catalog
   * Investigation findings *must* be documented in the governance platform

4. **Shadow IT Remediation**
   * Applications discovered outside the governance process *must* be reviewed within 5 business days
   * High-risk applications *must* be remediated within 24 hours of detection
   * Non-compliant applications *must* either be approved through the validation process or scheduled for removal
   * Regular reports of shadow IT findings *must* be reviewed by the Application Governance Owner

#### Employee App Store and Application Governance

1. **Application Discovery and Validation**
   * Applications discovered through shadow IT detection *must* undergo the validation workflow
   * Employees *must* justify business needs for discovered applications
   * Application validation *must* follow the multi-tier approval process based on risk profile

2. **Approved Application Deployment**
   * All approved applications *must* be distributed through the Employee App Store
   * Application deployments *must* be defined as Infrastructure as Code using approved templates
   * Application configurations *must* be version-controlled and deployed through automation pipelines
