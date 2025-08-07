# Template Customization Guide

## Overview

This guide provides detailed instructions for customizing blueprint and policy templates to meet specific organizational requirements. The templates are designed to be flexible and adaptable while maintaining compliance with governance frameworks and industry best practices.

## Customization Principles

### 1. Maintain Compliance Integrity
- Preserve required compliance controls and configurations
- Document any deviations from standard templates
- Ensure customizations don't compromise security posture
- Validate compliance alignment after modifications

### 2. Follow Organizational Standards
- Align with existing naming conventions
- Integrate with current governance processes
- Respect organizational hierarchy and approval workflows
- Maintain consistency across deployments

### 3. Preserve Template Structure
- Keep core template architecture intact
- Maintain required metadata and documentation
- Preserve governance tags and monitoring configurations
- Ensure outputs remain compatible with automation

### 4. Document Customizations
- Record all modifications and rationale
- Maintain version control for customized templates
- Document testing and validation procedures
- Create organization-specific implementation guides

## Blueprint Template Customization

### Parameter Customization

#### Core Governance Parameters
```bicep
// Standard parameters that should be customized for your organization
@description('Organization identifier for resource naming')
param organizationCode string = 'yourorg'  // Change from 'cba'

@description('Cost center for billing allocation')
param costCenter string = 'YOUR-12345'     // Update to your cost center format

@description('Resource owner for governance tracking')
param resourceOwner string = 'Your Team Name'  // Update to actual team/role
```

#### Environment-Specific Parameters
```bicep
// Customize for your environment strategy
@allowed(['dev', 'test', 'stage', 'prod'])  // Add 'stage' if needed
param environmentName string = 'dev'

// Customize regions for your deployment strategy
param primaryRegion string = 'East US 2'      // Your primary region
param secondaryRegion string = 'West US 2'    // Your DR region
```

#### Security and Compliance Parameters
```bicep
// Customize compliance requirements
param complianceRequirements array = [
  'ISO27001'
  'SOC2'
  'YourIndustryStandard'  // Add industry-specific requirements
]

// Customize data classification levels
@allowed(['Public', 'Internal', 'Confidential', 'Restricted', 'YourCustomLevel'])
param dataClassification string = 'Confidential'
```

### Variable Customization

#### Naming Conventions
```bicep
// Customize naming convention to match your standards
var namingConvention = {
  prefix: '${organizationCode}-${applicationName}-${environmentName}'
  suffix: uniqueString(resourceGroup().id)
  separator: '-'  // or '_' based on your preference
}

// Update resource naming patterns
var resourceNames = {
  logAnalytics: '${namingConvention.prefix}-la-${namingConvention.suffix}'
  keyVault: '${namingConvention.prefix}-kv-${namingConvention.suffix}'
  // Add your custom naming patterns
  customResource: '${organizationCode}${environmentName}${applicationName}${namingConvention.suffix}'
}
```

#### Governance Tags
```bicep
// Customize governance tags for your organization
var governanceTags = {
  Environment: environmentName
  Organization: organizationCode
  Application: applicationName
  CostCenter: costCenter
  Owner: resourceOwner
  DataClassification: dataClassification
  Compliance: join(complianceRequirements, ',')
  Framework: 'ICT-Governance-v3.2.0'
  CreatedDate: utcNow('yyyy-MM-dd')
  
  // Add your custom tags
  BusinessUnit: 'YourBusinessUnit'
  Project: 'YourProjectCode'
  SupportTeam: 'YourSupportTeam'
  BackupRequired: 'true'
  MonitoringLevel: 'standard'
}
```

### Resource Configuration Customization

#### Security Configuration
```bicep
// Customize security settings for your requirements
var securityConfig = {
  enableAdvancedThreatProtection: environmentName == 'prod'
  enableNetworkSegmentation: true
  enableEncryptionAtRest: true
  enableEncryptionInTransit: true
  
  // Add your custom security settings
  enableCustomFirewallRules: true
  enableVulnerabilityScanning: environmentName != 'dev'
  enableSecurityBaseline: true
}
```

#### Monitoring Configuration
```bicep
// Customize monitoring settings
var monitoringConfig = {
  retentionDays: environmentName == 'prod' ? 365 : 90
  enableDetailedMonitoring: environmentName == 'prod'
  alertingEnabled: true
  
  // Add your custom monitoring settings
  enableCustomMetrics: true
  enableApplicationInsights: true
  enableServiceMap: environmentName == 'prod'
}
```

### Adding Custom Resources

#### Custom Security Resources
```bicep
// Add organization-specific security resources
resource customSecurityResource 'Microsoft.Security/customResource@2022-01-01' = {
  name: '${namingConvention.prefix}-custom-security'
  location: location
  tags: governanceTags
  properties: {
    // Your custom security configuration
    customProperty: 'customValue'
    organizationSpecificSetting: true
  }
}
```

#### Custom Monitoring Resources
```bicep
// Add custom monitoring and alerting
resource customAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${namingConvention.prefix}-custom-alert'
  location: 'global'
  tags: governanceTags
  properties: {
    description: 'Custom alert for organization-specific metrics'
    severity: 2
    enabled: true
    scopes: [
      // Reference your custom resources
    ]
    // Your custom alert configuration
  }
}
```

## Policy Template Customization

### Document Metadata Customization

#### Header Information
```markdown
# Your Policy Name Template

## Document Information
- **Policy Name:** Your Custom Policy Name
- **Policy ID:** YOUR-POL-001  # Use your policy numbering system
- **Version:** 1.0.0
- **Effective Date:** [Your Date Format]
- **Review Date:** [Your Review Cycle]
- **Owner:** [Your Role/Department]
- **Approved By:** [Your Approval Authority]
- **Framework:** Your Governance Framework Name
```

#### Compliance References
```markdown
## Regulatory Compliance

This policy supports compliance with:
- **Your Industry Regulation** - Specific requirements
- **Your Regional Laws** - Applicable sections
- **Your Corporate Standards** - Internal requirements
- **ISO 27001:2013** - A.X.X (Your applicable controls)
```

### Content Customization

#### Organizational Context
```markdown
## Scope

This policy applies to:
- All [your employee categories]
- All [your system types]
- All [your data classifications]
- [Your specific environments]
- [Your geographic locations]
```

#### Roles and Responsibilities
```markdown
## Roles and Responsibilities

### Your Chief Information Officer
- [Your specific responsibilities]
- [Your approval authorities]
- [Your reporting requirements]

### Your Security Team
- [Your team-specific duties]
- [Your escalation procedures]
- [Your monitoring responsibilities]

### Your Business Units
- [Your business-specific requirements]
- [Your compliance obligations]
- [Your reporting procedures]
```

#### Procedures and Processes
```markdown
## Your Custom Process

### Phase 1: Your Initial Step
1. **Your Action:** [Your specific procedure]
2. **Your Validation:** [Your validation steps]
3. **Your Documentation:** [Your documentation requirements]

### Your Approval Matrix

| Your Category | Your Threshold | Your Approver | Your Timeline |
|---|---|---|---|
| Your Level 1 | Your Criteria | Your Role | Your SLA |
| Your Level 2 | Your Criteria | Your Role | Your SLA |
```

### Adding Custom Sections

#### Industry-Specific Requirements
```markdown
## Your Industry-Specific Section

### Your Regulatory Requirement
- [Your specific compliance needs]
- [Your industry standards]
- [Your certification requirements]

### Your Implementation Approach
- [Your methodology]
- [Your tools and systems]
- [Your validation procedures]
```

#### Organization-Specific Procedures
```markdown
## Your Custom Procedures

### Your Unique Process
1. [Your step-by-step procedure]
2. [Your validation checkpoints]
3. [Your documentation requirements]
4. [Your escalation procedures]

### Your Integration Points
- [Your system integrations]
- [Your workflow connections]
- [Your automation triggers]
```

## Validation Script Customization

### Configuration File Updates

#### Custom Validation Rules
```json
{
  "customValidationRules": {
    "blueprint": [
      {
        "name": "YourCustomRule",
        "description": "Your custom validation requirement",
        "pattern": "your-regex-pattern",
        "severity": "error",
        "enabled": true
      }
    ],
    "policy": [
      {
        "name": "YourPolicyRule",
        "description": "Your policy-specific validation",
        "requiredSections": ["Your Required Section"],
        "severity": "warning",
        "enabled": true
      }
    ]
  }
}
```

#### Organization-Specific Thresholds
```json
{
  "scoring": {
    "blueprint": {
      "yourCustomCategory": 15,
      "yourSecurityRequirement": 25
    },
    "thresholds": {
      "yourExcellent": 95,
      "yourGood": 85,
      "yourAcceptable": 75
    }
  }
}
```

### Custom Validation Functions

#### PowerShell Script Extensions
```powershell
function Test-YourCustomRequirement {
    param([string]$Content)
    
    # Your custom validation logic
    $yourPattern = "your-validation-pattern"
    $matches = [regex]::Matches($Content, $yourPattern)
    
    if ($matches.Count -gt 0) {
        return @{
            Passed = $true
            Message = "Your custom requirement met"
            Score = 1.0
        }
    } else {
        return @{
            Passed = $false
            Message = "Your custom requirement not met"
            PartialScore = 0
        }
    }
}
```

## Testing Customized Templates

### Validation Testing

#### Pre-Deployment Validation
```bash
# Test your customized blueprint
./template-validator.ps1 -TemplatePath "your-custom-template.bicep" -TemplateType "blueprint"

# Test your customized policy
./template-validator.ps1 -TemplatePath "your-custom-policy.md" -TemplateType "policy"
```

#### Compliance Validation
```bash
# Validate compliance alignment
./template-validator.ps1 -TemplatePath "your-template" -Detailed -OutputFormat "json"
```

### Deployment Testing

#### Development Environment Testing
```bash
# Deploy to development environment
az deployment group create \
  --resource-group "your-dev-rg" \
  --template-file "your-custom-template.bicep" \
  --parameters "your-dev-parameters.json"
```

#### Security Testing
```bash
# Run security validation
az security assessment list --resource-group "your-dev-rg"

# Check compliance status
az policy state list --resource-group "your-dev-rg"
```

## Version Control and Documentation

### Template Versioning

#### Version Control Strategy
```
your-templates/
├── v1.0/
│   ├── original-templates/
│   └── customized-templates/
├── v1.1/
│   ├── updated-templates/
│   └── customization-notes.md
└── current/
    ├── production-templates/
    └── deployment-guides/
```

#### Change Documentation
```markdown
## Customization Log

### Version 1.1.0 - [Date]
- **Changed:** Parameter defaults for organization alignment
- **Added:** Custom security resources for compliance
- **Removed:** Unused monitoring components
- **Rationale:** Align with organizational security standards

### Version 1.0.1 - [Date]
- **Fixed:** Naming convention alignment
- **Updated:** Governance tags for cost tracking
- **Rationale:** Support financial reporting requirements
```

### Documentation Requirements

#### Customization Documentation
```markdown
# Your Organization Template Customization

## Overview
- **Base Template:** [Original template name and version]
- **Customization Date:** [Date]
- **Customized By:** [Team/Individual]
- **Approval:** [Approval authority and date]

## Customizations Made
1. **Parameter Changes:** [List of parameter modifications]
2. **Resource Additions:** [New resources added]
3. **Configuration Updates:** [Modified configurations]
4. **Policy Adaptations:** [Policy-specific changes]

## Testing Results
- **Validation Status:** [Pass/Fail with details]
- **Security Testing:** [Results summary]
- **Compliance Verification:** [Compliance status]
- **Performance Testing:** [Performance metrics]

## Deployment Instructions
1. [Step-by-step deployment guide]
2. [Prerequisites and dependencies]
3. [Post-deployment validation]
4. [Rollback procedures]
```

## Best Practices

### Customization Best Practices

1. **Start Small:** Begin with minimal customizations and iterate
2. **Test Thoroughly:** Validate all changes in development environments
3. **Document Everything:** Maintain comprehensive documentation
4. **Version Control:** Use proper version control for all customizations
5. **Regular Reviews:** Periodically review and update customizations

### Maintenance Best Practices

1. **Regular Updates:** Keep templates updated with latest best practices
2. **Security Patches:** Apply security updates promptly
3. **Compliance Reviews:** Regular compliance validation
4. **Performance Monitoring:** Monitor template performance and optimization
5. **Feedback Integration:** Incorporate user feedback and lessons learned

### Collaboration Best Practices

1. **Team Reviews:** Conduct peer reviews of customizations
2. **Stakeholder Approval:** Obtain appropriate approvals for changes
3. **Knowledge Sharing:** Share customization knowledge across teams
4. **Training:** Provide training on customized templates
5. **Support:** Establish support procedures for customized templates

---

*This customization guide is part of the CBA Consult IT Management Framework and should be used in conjunction with the template selection guide and validation procedures.*