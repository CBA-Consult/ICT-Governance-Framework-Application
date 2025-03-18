## SD-03 - Infrastructure Build and Configuration Standards

**Infrastructure as Code (IaC)** tools play a crucial role in automating the setup, configuration, and management of cloud infrastructure. Let's explore some popular IaC tools:

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
|**Dataflows** | Cloud-based data prep in Power BI, enabling Python script execution for transformations. Recommended for orchestrating data movement and preparation for Power BI reports.| Power Bi Development and reporting. Running Python Code for analysis and machine learning.                                           |
#### IaC Code Management

*   **Version Control:** All IaC code *must* be stored in a version control system (e.g., Git) using the [Organization Name] standard branching strategy.
*   **Code Reviews:** All changes to IaC code *must* be reviewed and approved by at least one other team member before being merged into the main branch.
*   **CI/CD:**  IaC deployments *must* be automated using CI/CD pipelines (e.g., Azure DevOps Pipelines, GitHub Actions). Manual deployments are prohibited.
*   **Infrastructure Drift:** Regular checks *must* be performed to detect and remediate infrastructure drift.  [Describe the process and tools to be used].

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

