# Automated Remediation Implementation Guide

## Overview

This guide provides comprehensive instructions for implementing automated remediation processes within the ICT Governance Framework. The automated remediation system addresses the critical need to reduce manual intervention in compliance violation resolution, thereby decreasing response times and compliance risk.

## Problem Statement

Manual remediation processes slow response to violations, increasing compliance risk. This implementation provides automated remediation for common, low-risk violations and establishes a framework for expanding automation coverage over time.

## Solution Architecture

### Core Components

1. **Automated Remediation Framework** (`Automated-Remediation-Framework.ps1`)
   - Main PowerShell script that orchestrates remediation processes
   - Configurable violation detection and remediation logic
   - Support for multiple violation types and severity levels

2. **Remediation Configuration** (`remediation-config.json`)
   - Centralized configuration for remediation rules and policies
   - Environment-specific settings and thresholds
   - Expansion plan for phased implementation

3. **Deployment Infrastructure** (`Deploy-AutomatedRemediation.ps1`)
   - Azure Automation Account setup
   - Runbook deployment and scheduling
   - Monitoring and alerting configuration

4. **Integration with ICT Governance Framework**
   - Enhanced framework configuration with remediation capabilities
   - Unified reporting and monitoring
   - Compliance tracking and metrics

## Implementation Phases

### Phase 1: Low-Risk Violations (Months 1-2)

**Objective**: Begin automated remediation for common, low-risk violations

**Target Violations**:
- Missing required tags on resources
- Basic configuration standardization

**Implementation Steps**:

1. **Deploy Infrastructure**:
   ```powershell
   .\Deploy-AutomatedRemediation.ps1 -ResourceGroupName "rg-governance-automation" -Location "East US" -Environment "Development"
   ```

2. **Configure Remediation Rules**:
   - Enable only `MissingTags` violation type
   - Set `autoRemediable: true` for tag-related policies
   - Configure default tags in `remediation-config.json`

3. **Test in Development Environment**:
   ```powershell
   .\Automated-Remediation-Framework.ps1 -ConfigPath ".\remediation-config.json" -Environment "Development" -DryRun
   ```

4. **Monitor and Validate**:
   - Review remediation logs and reports
   - Validate tag application accuracy
   - Measure response time improvements

### Phase 2: Security Configurations (Months 3-4)

**Objective**: Expand to security configuration violations

**Target Violations**:
- HTTPS-only storage account configurations
- Key Vault security settings
- Basic encryption requirements

**Implementation Steps**:

1. **Update Configuration**:
   - Enable `SecurityConfiguration` violation type
   - Configure security remediation actions
   - Set appropriate severity levels

2. **Deploy to Staging**:
   ```powershell
   .\Deploy-AutomatedRemediation.ps1 -ResourceGroupName "rg-governance-automation-staging" -Location "East US" -Environment "Staging"
   ```

3. **Implement Security Remediations**:
   - Storage account HTTPS enforcement
   - Key Vault soft delete and purge protection
   - Basic security policy compliance

### Phase 3: Backup and Cost Optimization (Months 5-6)

**Objective**: Add detection and flagging for backup and cost violations

**Target Violations**:
- Missing backup configurations
- Cost optimization opportunities
- Resource utilization issues

**Implementation Steps**:

1. **Expand Detection Capabilities**:
   - Enable `BackupConfiguration` and `CostOptimization` types
   - Set `autoRemediable: false` for manual review
   - Configure notification workflows

2. **Implement Review Processes**:
   - Create manual review queues
   - Establish approval workflows
   - Integrate with ticketing systems

### Phase 4: Full Coverage (Month 7+)

**Objective**: Comprehensive violation detection and selective automation

**Target Violations**:
- All policy violations
- Advanced remediation scenarios
- Custom organizational policies

**Implementation Steps**:

1. **Complete Coverage**:
   - Enable all violation types
   - Implement advanced remediation logic
   - Add custom policy support

2. **Production Deployment**:
   ```powershell
   .\Deploy-AutomatedRemediation.ps1 -ResourceGroupName "rg-governance-automation-prod" -Location "East US" -Environment "Production"
   ```

## Configuration Guide

### Remediation Configuration (`remediation-config.json`)

#### Basic Structure

```json
{
  "version": "1.0.0",
  "remediation": {
    "enabled": true,
    "globalSettings": {
      "maxConcurrentActions": 5,
      "retryAttempts": 3,
      "delayBetweenActions": 2,
      "timeoutMinutes": 30
    },
    "types": [
      {
        "type": "MissingTags",
        "enabled": true,
        "autoRemediable": true,
        "severity": "Low",
        "policyPattern": "require-tag",
        "defaultTags": {
          "Owner": "Unknown",
          "CostCenter": "IT-General",
          "Environment": "Unknown"
        }
      }
    ]
  }
}
```

#### Environment-Specific Settings

```json
{
  "environments": {
    "Development": {
      "maxRemediationActions": 100,
      "approvalRequired": false
    },
    "Staging": {
      "maxRemediationActions": 50,
      "approvalRequired": true
    },
    "Production": {
      "maxRemediationActions": 25,
      "approvalRequired": true
    }
  }
}
```

### Violation Type Configuration

#### Missing Tags Remediation

```json
{
  "type": "MissingTags",
  "description": "Automatically add missing required tags to resources",
  "enabled": true,
  "autoRemediable": true,
  "severity": "Low",
  "policyPattern": "require-tag",
  "defaultTags": {
    "Owner": "Unknown",
    "CostCenter": "IT-General",
    "Environment": "Unknown",
    "CreatedBy": "AutoRemediation",
    "CreatedDate": "{{current_date}}"
  },
  "excludedResourceTypes": [
    "Microsoft.Resources/resourceGroups"
  ]
}
```

#### Security Configuration Remediation

```json
{
  "type": "SecurityConfiguration",
  "description": "Fix common security configuration issues",
  "enabled": true,
  "autoRemediable": true,
  "severity": "High",
  "policyPattern": "require-https|require-encryption",
  "actions": [
    {
      "resourceType": "Microsoft.Storage/storageAccounts",
      "action": "EnableHttpsOnly",
      "description": "Enable HTTPS-only traffic for storage accounts"
    },
    {
      "resourceType": "Microsoft.KeyVault/vaults",
      "action": "EnableSoftDelete",
      "description": "Enable soft delete and purge protection for Key Vaults"
    }
  ]
}
```

## Usage Examples

### Basic Remediation Execution

```powershell
# Run automated remediation in dry-run mode
.\Automated-Remediation-Framework.ps1 -ConfigPath ".\remediation-config.json" -Environment "Development" -DryRun

# Run automated remediation for production
.\Automated-Remediation-Framework.ps1 -ConfigPath ".\remediation-config.json" -Environment "Production"

# Target specific violation type
.\Automated-Remediation-Framework.ps1 -ConfigPath ".\remediation-config.json" -Environment "Development" -ViolationType "MissingTags"
```

### Deployment Commands

```powershell
# Deploy to development environment
.\Deploy-AutomatedRemediation.ps1 -ResourceGroupName "rg-governance-dev" -Location "East US" -Environment "Development"

# Deploy to production with custom config
.\Deploy-AutomatedRemediation.ps1 -ResourceGroupName "rg-governance-prod" -Location "East US" -Environment "Production" -ConfigPath ".\custom-remediation-config.json"
```

## Monitoring and Reporting

### Key Metrics

1. **Remediation Success Rate**: Percentage of successful automated remediations
2. **Response Time**: Time from violation detection to remediation completion
3. **Violation Reduction**: Decrease in overall compliance violations
4. **Manual Intervention Rate**: Percentage of violations requiring manual review

### Dashboard Metrics

The automated remediation system provides comprehensive dashboards tracking:

- Total violations detected
- Remediated violations by type
- Pending violations requiring manual review
- Remediation success rates
- Average remediation time
- Compliance improvement trends

### Reporting Formats

- **JSON**: Machine-readable format for integration
- **CSV**: Spreadsheet-compatible format for analysis
- **HTML**: Human-readable dashboard format

## Security and Compliance

### Access Controls

1. **Azure RBAC**: Proper role assignments for automation accounts
2. **Managed Identity**: Secure authentication without stored credentials
3. **Least Privilege**: Minimal permissions required for remediation actions

### Audit Trail

1. **Comprehensive Logging**: All remediation actions are logged
2. **Change Tracking**: Before/after states for all modifications
3. **Compliance Mapping**: Actions mapped to relevant compliance standards

### Approval Workflows

For production environments and high-risk changes:

1. **Manual Approval**: Required for certain violation types
2. **Escalation Procedures**: Automatic escalation for failed remediations
3. **Review Processes**: Regular review of automated actions

## Troubleshooting

### Common Issues

1. **Permission Errors**:
   - Verify Azure RBAC assignments
   - Check managed identity configuration
   - Validate subscription access

2. **Configuration Errors**:
   - Validate JSON syntax in configuration files
   - Check policy pattern matching
   - Verify environment-specific settings

3. **Remediation Failures**:
   - Review error logs for specific failure reasons
   - Check resource state and dependencies
   - Validate remediation logic for resource types

### Debugging Commands

```powershell
# Test configuration loading
$config = Get-Content -Path ".\remediation-config.json" -Raw | ConvertFrom-Json

# Test Azure connectivity
Connect-AzAccount
Get-AzContext

# Test policy compliance retrieval
Get-AzPolicyState -All | Where-Object { $_.ComplianceState -eq "NonCompliant" }
```

## Integration with Existing Systems

### ServiceNow Integration

```json
{
  "integration": {
    "serviceNow": {
      "enabled": true,
      "endpoint": "https://company.service-now.com",
      "createIncidents": true,
      "incidentPriority": {
        "High": 1,
        "Medium": 2,
        "Low": 3
      }
    }
  }
}
```

### JIRA Integration

```json
{
  "integration": {
    "jira": {
      "enabled": true,
      "endpoint": "https://company.atlassian.net",
      "createTasks": true,
      "projectKey": "GOV"
    }
  }
}
```

## Best Practices

### Configuration Management

1. **Version Control**: Store configuration files in version control
2. **Environment Separation**: Maintain separate configs per environment
3. **Change Management**: Follow change control processes for config updates

### Testing and Validation

1. **Dry Run Testing**: Always test with `-DryRun` flag first
2. **Staged Deployment**: Deploy to development, then staging, then production
3. **Rollback Procedures**: Maintain ability to quickly disable automation

### Monitoring and Alerting

1. **Proactive Monitoring**: Set up alerts for remediation failures
2. **Regular Reviews**: Schedule regular reviews of remediation effectiveness
3. **Continuous Improvement**: Use metrics to identify improvement opportunities

## Expansion Guidelines

### Adding New Violation Types

1. **Define Violation Pattern**: Create policy pattern matching rules
2. **Implement Remediation Logic**: Add remediation functions
3. **Configure Severity**: Set appropriate severity levels
4. **Test Thoroughly**: Validate in non-production environments

### Custom Remediation Actions

1. **Follow Framework Patterns**: Use existing function structures
2. **Error Handling**: Implement comprehensive error handling
3. **Logging**: Add detailed logging for troubleshooting
4. **Documentation**: Document new remediation capabilities

## Support and Maintenance

### Regular Maintenance Tasks

1. **Log Cleanup**: Archive old logs according to retention policies
2. **Configuration Updates**: Keep remediation rules current
3. **Performance Monitoring**: Monitor system performance and optimize
4. **Security Updates**: Keep automation infrastructure updated

### Support Contacts

- **Governance Team**: governance-team@company.com
- **Security Team**: security-team@company.com
- **Operations Team**: operations-team@company.com

## Conclusion

The Automated Remediation Framework provides a robust foundation for reducing manual compliance violation remediation while maintaining security and control. The phased implementation approach ensures gradual expansion of automation coverage while building confidence in the system's reliability and effectiveness.

By following this implementation guide, organizations can significantly reduce compliance risk, improve response times, and free up valuable resources for more strategic governance activities.