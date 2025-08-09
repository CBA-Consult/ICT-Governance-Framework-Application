// ICT Governance Framework - Policy Assignments
// This Bicep template deploys custom policy assignments for ICT Governance Framework

// Parameters
@description('The Azure region to deploy the resources')
param location string = resourceGroup().location

@description('The scope at which the policy assignments apply')
param policyAssignmentScope string = resourceGroup().id

@description('Enable policy remediation tasks')
param enableRemediation bool = false

@description('Required tags for all resources')
param requiredTags array = [
  'Owner'
  'CostCenter'
  'Environment'
  'Application'
]

@description('Tags to apply to all resources')
param commonTags object = {
  Environment: 'dev'
  Owner: 'IT Governance Team'
  CostCenter: 'IT-12345'
  Application: 'ICT Governance Framework'
  ManagedBy: 'Bicep'
}

// Variables
var policyAssignmentNamePrefix = 'ictgov-pa'

// Policy assignment for requiring tags
resource requiredTagsPolicyAssignment 'Microsoft.Authorization/policyAssignments@2022-06-01' = {
  name: '${policyAssignmentNamePrefix}-required-tags'
  location: location
  properties: {
    displayName: 'ICT Governance - Require specified tags on resources'
    description: 'This policy ensures that all resources have the required tags'
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/871b6d14-10aa-478d-b590-94f262ecfa99' // Built-in policy for requiring tags
    parameters: {
      tagNames: {
        value: requiredTags
      }
    }
    nonComplianceMessages: [
      {
        message: 'Resources must have all required tags: ${join(requiredTags, ', ')}'
      }
    ]
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Policy assignment for enforcing HTTPS for storage accounts
resource httpsStoragePolicyAssignment 'Microsoft.Authorization/policyAssignments@2022-06-01' = {
  name: '${policyAssignmentNamePrefix}-storage-https'
  location: location
  properties: {
    displayName: 'ICT Governance - Secure transfer to storage accounts should be enabled'
    description: 'Audit requirement of Secure transfer in your storage account. Secure transfer is an option that forces your storage account to accept requests only from secure connections (HTTPS).'
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/404c3081-a854-4457-ae30-26a93ef643f9' // Built-in policy for HTTPS for storage
    nonComplianceMessages: [
      {
        message: 'Storage accounts must have secure transfer (HTTPS) enabled'
      }
    ]
  }
}

// Policy assignment for Key Vault network restrictions
resource keyVaultNetworkPolicyAssignment 'Microsoft.Authorization/policyAssignments@2022-06-01' = {
  name: '${policyAssignmentNamePrefix}-keyvault-network'
  location: location
  properties: {
    displayName: 'ICT Governance - Key vaults should have network restrictions'
    description: 'Audits Key Vaults to ensure they have network restrictions applied. When this policy is set to AuditIfNotExists, the system checks if all internet traffic is restricted, or if a list of IP addresses are granted access.'
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/f9457a14-9505-4053-ab18-1de2701bb88d' // Built-in policy for Key Vault network restrictions
    nonComplianceMessages: [
      {
        message: 'Key Vaults must have network restrictions for security'
      }
    ]
  }
}

// Policy assignment for requiring resource locks on production resources
resource resourceLocksPolicyAssignment 'Microsoft.Authorization/policyAssignments@2022-06-01' = {
  name: '${policyAssignmentNamePrefix}-resource-locks'
  location: location
  properties: {
    displayName: 'ICT Governance - Production resources should have locks'
    description: 'This policy ensures that production resources have delete locks to prevent accidental deletion'
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/06a78e20-9358-41c9-923c-fb736d382a4d' // Audit resource locks
    parameters: {
      effect: {
        value: 'Audit'
      }
    }
    nonComplianceMessages: [
      {
        message: 'Production resources must have resource locks to prevent accidental deletion'
      }
    ]
  }
}

// Policy assignment for monitoring VM vulnerabilities
resource vmVulnerabilityPolicyAssignment 'Microsoft.Authorization/policyAssignments@2022-06-01' = {
  name: '${policyAssignmentNamePrefix}-vm-vulnerability'
  location: location
  properties: {
    displayName: 'ICT Governance - Vulnerabilities in VM security configuration should be remediated'
    description: 'Remediate vulnerabilities in security configuration on your virtual machines to protect them from attacks.'
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/1e5fd719-7ced-4431-986c-71292387a398' // Built-in policy for VM vulnerability assessment
    nonComplianceMessages: [
      {
        message: 'Virtual machines must have vulnerability assessments configured'
      }
    ]
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Create remediation tasks if enabled
resource requiredTagsRemediation 'Microsoft.PolicyInsights/remediations@2021-10-01' = if (enableRemediation) {
  name: '${policyAssignmentNamePrefix}-required-tags-remediation'
  scope: resourceGroup()
  properties: {
    policyAssignmentId: requiredTagsPolicyAssignment.id
    resourceDiscoveryMode: 'ReEvaluateCompliance'
  }
}

resource vmVulnerabilityRemediation 'Microsoft.PolicyInsights/remediations@2021-10-01' = if (enableRemediation) {
  name: '${policyAssignmentNamePrefix}-vm-vulnerability-remediation'
  scope: resourceGroup()
  properties: {
    policyAssignmentId: vmVulnerabilityPolicyAssignment.id
    resourceDiscoveryMode: 'ReEvaluateCompliance'
  }
}

// Outputs
output requiredTagsPolicyAssignmentId string = requiredTagsPolicyAssignment.id
output httpsStoragePolicyAssignmentId string = httpsStoragePolicyAssignment.id
output keyVaultNetworkPolicyAssignmentId string = keyVaultNetworkPolicyAssignment.id
output resourceLocksPolicyAssignmentId string = resourceLocksPolicyAssignment.id
output vmVulnerabilityPolicyAssignmentId string = vmVulnerabilityPolicyAssignment.id
