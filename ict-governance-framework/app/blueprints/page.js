// Blueprints Page - ICT Governance Framework

export default function BlueprintsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Blueprints</h1>
      <p className="mb-6 text-gray-700 dark:text-gray-200">
        The ICT Governance Framework leverages blueprint templates and reference architectures to ensure consistent, secure, and compliant technology deployments. Blueprints accelerate delivery, enforce standards, and support automation across the technology lifecycle.
      </p>
      <ul className="list-disc list-inside mb-6">
        <li><strong>Infrastructure as Code (IaC)</strong>: Standardized Bicep and Terraform templates for core infrastructure.</li>
        <li><strong>Security Blueprints</strong>: Pre-approved security configurations and controls for cloud and on-premises environments.</li>
        <li><strong>Application Patterns</strong>: Reference architectures for common application scenarios.</li>
        <li><strong>Compliance Automation</strong>: Automated policy enforcement and compliance scanning.</li>
        <li><strong>Change Management</strong>: Blueprint-based workflows for controlled deployments and updates.</li>
      </ul>
      <p className="text-gray-700 dark:text-gray-200">
        For a full list of available blueprints and templates, see the documentation and blueprint-templates directory in the repository.
      </p>
    </div>
  );
}
