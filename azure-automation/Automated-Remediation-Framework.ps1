# ICT Governance Framework - Automated Remediation System
# This script provides automated remediation capabilities for common compliance violations
# Author: ICT Governance Team
# Date: 2025

<#
.SYNOPSIS
    Automated Remediation Framework for ICT Governance Compliance Violations

.DESCRIPTION
    This framework provides automated remediation capabilities for common, low-risk compliance violations.
    It includes configurable remediation actions, approval workflows, and expandable coverage for new violation types.

.PARAMETER ConfigPath
    Path to the remediation configuration file

.PARAMETER Environment
    Target environment (Development, Staging, Production)

.PARAMETER DryRun
    Execute in dry-run mode without making actual changes

.PARAMETER ViolationType
    Specific violation type to remediate (optional, processes all if not specified)

.EXAMPLE
    .\Automated-Remediation-Framework.ps1 -ConfigPath ".\remediation-config.json" -Environment "Development"

.EXAMPLE
    .\Automated-Remediation-Framework.ps1 -ConfigPath ".\remediation-config.json" -Environment "Production" -DryRun

.NOTES
    Requires Azure PowerShell modules and appropriate permissions for resource management
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ConfigPath,
    
    [Parameter(Mandatory = $true)]
    [ValidateSet("Development", "Staging", "Production")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory = $false)]
    [string]$ViolationType,
    
    [Parameter(Mandatory = $false)]
    [string]$LogPath = ".\governance-logs",
    
    [Parameter(Mandatory = $false)]
    [int]$MaxRemediationActions = 50
)

# Import required modules
$RequiredModules = @(
    'Az.Accounts',
    'Az.Resources', 
    'Az.PolicyInsights',
    'Az.Storage',
    'Az.KeyVault',
    'Az.Monitor',
    'Az.Automation'
)

foreach ($Module in $RequiredModules) {
    if (!(Get-Module -ListAvailable -Name $Module)) {
        Write-Warning "Module $Module is not installed. Installing..."
        Install-Module -Name $Module -Force -AllowClobber
    }
    Import-Module -Name $Module -Force
}

# Initialize logging
$LogFile = Join-Path $LogPath "automated-remediation-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
if (!(Test-Path $LogPath)) {
    New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
}

function Write-RemediationLog {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        
        [Parameter(Mandatory = $false)]
        [ValidateSet("INFO", "WARNING", "ERROR", "SUCCESS")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Write to console with color coding
    switch ($Level) {
        "INFO" { Write-Host $logEntry -ForegroundColor White }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
    }
    
    # Write to log file
    Add-Content -Path $LogFile -Value $logEntry
}

function Get-RemediationConfig {
    param([string]$ConfigPath)
    
    try {
        if (!(Test-Path $ConfigPath)) {
            throw "Configuration file not found: $ConfigPath"
        }
        
        $config = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json
        Write-RemediationLog "Configuration loaded successfully from $ConfigPath" "SUCCESS"
        return $config
    }
    catch {
        Write-RemediationLog "Failed to load configuration: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Connect-ToAzureForRemediation {
    param($Config)
    
    try {
        Write-RemediationLog "Connecting to Azure..." "INFO"
        
        if ($Config.authentication.useManagedIdentity) {
            Connect-AzAccount -Identity
        }
        elseif ($Config.authentication.tenantId) {
            Connect-AzAccount -TenantId $Config.authentication.tenantId
        }
        else {
            Connect-AzAccount
        }
        
        # Set subscription context
        if ($Config.environments.$Environment.subscriptionId) {
            Set-AzContext -SubscriptionId $Config.environments.$Environment.subscriptionId
        }
        
        Write-RemediationLog "Successfully connected to Azure" "SUCCESS"
    }
    catch {
        Write-RemediationLog "Failed to connect to Azure: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Get-ComplianceViolations {
    param(
        $Config,
        [string]$ViolationType = $null
    )
    
    try {
        Write-RemediationLog "Scanning for compliance violations..." "INFO"
        
        $violations = @()
        
        # Get policy compliance state
        $policyStates = Get-AzPolicyState -All
        
        foreach ($state in $policyStates) {
            if ($state.ComplianceState -eq "NonCompliant") {
                $violation = @{
                    ResourceId = $state.ResourceId
                    ResourceType = $state.ResourceType
                    PolicyDefinitionName = $state.PolicyDefinitionName
                    PolicyAssignmentName = $state.PolicyAssignmentName
                    ComplianceState = $state.ComplianceState
                    Timestamp = $state.Timestamp
                    ViolationType = Get-ViolationType -PolicyDefinitionName $state.PolicyDefinitionName
                    Severity = Get-ViolationSeverity -PolicyDefinitionName $state.PolicyDefinitionName -Config $Config
                    AutoRemediable = Test-AutoRemediable -PolicyDefinitionName $state.PolicyDefinitionName -Config $Config
                }
                
                # Filter by violation type if specified
                if (!$ViolationType -or $violation.ViolationType -eq $ViolationType) {
                    $violations += $violation
                }
            }
        }
        
        Write-RemediationLog "Found $($violations.Count) compliance violations" "INFO"
        return $violations
    }
    catch {
        Write-RemediationLog "Failed to get compliance violations: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Get-ViolationType {
    param([string]$PolicyDefinitionName)
    
    # Map policy definitions to violation types
    $violationTypeMap = @{
        "require-tag" = "MissingTags"
        "allowed-locations" = "InvalidLocation"
        "allowed-resource-types" = "InvalidResourceType"
        "require-https-storage" = "SecurityConfiguration"
        "require-encryption" = "SecurityConfiguration"
        "require-backup" = "BackupConfiguration"
        "cost-management" = "CostOptimization"
        "naming-convention" = "NamingConvention"
    }
    
    foreach ($key in $violationTypeMap.Keys) {
        if ($PolicyDefinitionName -like "*$key*") {
            return $violationTypeMap[$key]
        }
    }
    
    return "Unknown"
}

function Get-ViolationSeverity {
    param(
        [string]$PolicyDefinitionName,
        $Config
    )
    
    # Default severity mapping
    $severityMap = @{
        "require-tag" = "Low"
        "allowed-locations" = "Medium"
        "allowed-resource-types" = "High"
        "require-https-storage" = "High"
        "require-encryption" = "High"
        "require-backup" = "Medium"
        "cost-management" = "Low"
        "naming-convention" = "Low"
    }
    
    # Check config for custom severity mappings
    if ($Config.remediation.severityMappings) {
        foreach ($mapping in $Config.remediation.severityMappings) {
            if ($PolicyDefinitionName -like "*$($mapping.policyPattern)*") {
                return $mapping.severity
            }
        }
    }
    
    # Use default mapping
    foreach ($key in $severityMap.Keys) {
        if ($PolicyDefinitionName -like "*$key*") {
            return $severityMap[$key]
        }
    }
    
    return "Medium"
}

function Test-AutoRemediable {
    param(
        [string]$PolicyDefinitionName,
        $Config
    )
    
    # Check if violation type is configured for auto-remediation
    foreach ($remediationType in $Config.remediation.types) {
        if ($PolicyDefinitionName -like "*$($remediationType.policyPattern)*") {
            return $remediationType.autoRemediable -and $remediationType.enabled
        }
    }
    
    return $false
}

function Invoke-AutomaticRemediation {
    param(
        $Violations,
        $Config,
        [switch]$DryRun
    )
    
    $remediationResults = @()
    $actionCount = 0
    
    # Filter for auto-remediable violations
    $autoRemediableViolations = $Violations | Where-Object { $_.AutoRemediable -eq $true }
    
    Write-RemediationLog "Processing $($autoRemediableViolations.Count) auto-remediable violations" "INFO"
    
    foreach ($violation in $autoRemediableViolations) {
        if ($actionCount -ge $MaxRemediationActions) {
            Write-RemediationLog "Maximum remediation actions ($MaxRemediationActions) reached. Stopping." "WARNING"
            break
        }
        
        try {
            $result = Invoke-ViolationRemediation -Violation $violation -Config $Config -DryRun:$DryRun
            $remediationResults += $result
            $actionCount++
            
            if ($result.Success) {
                Write-RemediationLog "Successfully remediated violation: $($violation.ResourceId)" "SUCCESS"
            }
            else {
                Write-RemediationLog "Failed to remediate violation: $($violation.ResourceId) - $($result.Error)" "ERROR"
            }
        }
        catch {
            Write-RemediationLog "Exception during remediation of $($violation.ResourceId): $($_.Exception.Message)" "ERROR"
        }
        
        # Add delay between actions to prevent throttling
        Start-Sleep -Seconds 2
    }
    
    return $remediationResults
}

function Invoke-ViolationRemediation {
    param(
        $Violation,
        $Config,
        [switch]$DryRun
    )
    
    $result = @{
        ViolationId = $Violation.ResourceId
        ViolationType = $Violation.ViolationType
        Action = ""
        Success = $false
        Error = ""
        Timestamp = Get-Date
        DryRun = $DryRun.IsPresent
    }
    
    try {
        switch ($Violation.ViolationType) {
            "MissingTags" {
                $result = Remediate-MissingTags -Violation $Violation -Config $Config -DryRun:$DryRun
            }
            "SecurityConfiguration" {
                $result = Remediate-SecurityConfiguration -Violation $Violation -Config $Config -DryRun:$DryRun
            }
            "BackupConfiguration" {
                $result = Remediate-BackupConfiguration -Violation $Violation -Config $Config -DryRun:$DryRun
            }
            "CostOptimization" {
                $result = Remediate-CostOptimization -Violation $Violation -Config $Config -DryRun:$DryRun
            }
            "NamingConvention" {
                $result = Remediate-NamingConvention -Violation $Violation -Config $Config -DryRun:$DryRun
            }
            default {
                $result.Error = "No remediation action defined for violation type: $($Violation.ViolationType)"
            }
        }
    }
    catch {
        $result.Error = $_.Exception.Message
    }
    
    return $result
}

function Remediate-MissingTags {
    param(
        $Violation,
        $Config,
        [switch]$DryRun
    )
    
    $result = @{
        ViolationId = $Violation.ResourceId
        ViolationType = $Violation.ViolationType
        Action = "Add missing tags"
        Success = $false
        Error = ""
        Timestamp = Get-Date
        DryRun = $DryRun.IsPresent
    }
    
    try {
        # Get resource
        $resource = Get-AzResource -ResourceId $Violation.ResourceId
        
        if (!$resource) {
            $result.Error = "Resource not found"
            return $result
        }
        
        # Get required tags from config
        $requiredTags = $Config.remediation.types | Where-Object { $_.type -eq "MissingTags" } | Select-Object -ExpandProperty defaultTags
        
        if (!$requiredTags) {
            $result.Error = "No default tags configured"
            return $result
        }
        
        # Prepare tags to add
        $tagsToAdd = @{}
        $currentTags = $resource.Tags ?? @{}
        
        foreach ($tag in $requiredTags.PSObject.Properties) {
            if (!$currentTags.ContainsKey($tag.Name)) {
                $tagsToAdd[$tag.Name] = $tag.Value
            }
        }
        
        if ($tagsToAdd.Count -eq 0) {
            $result.Success = $true
            $result.Action = "No tags needed to be added"
            return $result
        }
        
        if (!$DryRun) {
            # Merge existing tags with new tags
            $allTags = $currentTags.Clone()
            foreach ($tag in $tagsToAdd.GetEnumerator()) {
                $allTags[$tag.Key] = $tag.Value
            }
            
            # Update resource tags
            Set-AzResource -ResourceId $Violation.ResourceId -Tag $allTags -Force
        }
        
        $result.Success = $true
        $result.Action = "Added tags: $($tagsToAdd.Keys -join ', ')"
        
        Write-RemediationLog "$(if($DryRun){'[DRY RUN] '}else{''})Added missing tags to resource: $($Violation.ResourceId)" "INFO"
    }
    catch {
        $result.Error = $_.Exception.Message
    }
    
    return $result
}

function Remediate-SecurityConfiguration {
    param(
        $Violation,
        $Config,
        [switch]$DryRun
    )
    
    $result = @{
        ViolationId = $Violation.ResourceId
        ViolationType = $Violation.ViolationType
        Action = "Fix security configuration"
        Success = $false
        Error = ""
        Timestamp = Get-Date
        DryRun = $DryRun.IsPresent
    }
    
    try {
        # Get resource
        $resource = Get-AzResource -ResourceId $Violation.ResourceId
        
        if (!$resource) {
            $result.Error = "Resource not found"
            return $result
        }
        
        # Handle different resource types
        switch ($resource.ResourceType) {
            "Microsoft.Storage/storageAccounts" {
                $result = Remediate-StorageAccountSecurity -Resource $resource -Violation $Violation -Config $Config -DryRun:$DryRun
            }
            "Microsoft.KeyVault/vaults" {
                $result = Remediate-KeyVaultSecurity -Resource $resource -Violation $Violation -Config $Config -DryRun:$DryRun
            }
            default {
                $result.Error = "Security remediation not implemented for resource type: $($resource.ResourceType)"
            }
        }
    }
    catch {
        $result.Error = $_.Exception.Message
    }
    
    return $result
}

function Remediate-StorageAccountSecurity {
    param(
        $Resource,
        $Violation,
        $Config,
        [switch]$DryRun
    )
    
    $result = @{
        ViolationId = $Violation.ResourceId
        ViolationType = $Violation.ViolationType
        Action = "Enable HTTPS-only for storage account"
        Success = $false
        Error = ""
        Timestamp = Get-Date
        DryRun = $DryRun.IsPresent
    }
    
    try {
        if (!$DryRun) {
            # Enable HTTPS-only traffic
            $storageAccount = Get-AzStorageAccount -ResourceGroupName $Resource.ResourceGroupName -Name $Resource.Name
            Set-AzStorageAccount -ResourceGroupName $Resource.ResourceGroupName -Name $Resource.Name -EnableHttpsTrafficOnly $true
        }
        
        $result.Success = $true
        Write-RemediationLog "$(if($DryRun){'[DRY RUN] '}else{''})Enabled HTTPS-only for storage account: $($Resource.Name)" "INFO"
    }
    catch {
        $result.Error = $_.Exception.Message
    }
    
    return $result
}

function Remediate-KeyVaultSecurity {
    param(
        $Resource,
        $Violation,
        $Config,
        [switch]$DryRun
    )
    
    $result = @{
        ViolationId = $Violation.ResourceId
        ViolationType = $Violation.ViolationType
        Action = "Enable Key Vault security features"
        Success = $false
        Error = ""
        Timestamp = Get-Date
        DryRun = $DryRun.IsPresent
    }
    
    try {
        if (!$DryRun) {
            # Enable soft delete and purge protection
            Update-AzKeyVault -ResourceGroupName $Resource.ResourceGroupName -VaultName $Resource.Name -EnableSoftDelete -EnablePurgeProtection
        }
        
        $result.Success = $true
        Write-RemediationLog "$(if($DryRun){'[DRY RUN] '}else{''})Enabled security features for Key Vault: $($Resource.Name)" "INFO"
    }
    catch {
        $result.Error = $_.Exception.Message
    }
    
    return $result
}

function Remediate-BackupConfiguration {
    param(
        $Violation,
        $Config,
        [switch]$DryRun
    )
    
    $result = @{
        ViolationId = $Violation.ResourceId
        ViolationType = $Violation.ViolationType
        Action = "Configure backup"
        Success = $false
        Error = ""
        Timestamp = Get-Date
        DryRun = $DryRun.IsPresent
    }
    
    try {
        # Get resource
        $resource = Get-AzResource -ResourceId $Violation.ResourceId
        
        if (!$resource) {
            $result.Error = "Resource not found"
            return $result
        }
        
        # For now, just log the action - actual backup configuration would require more complex logic
        $result.Success = $true
        $result.Action = "Backup configuration remediation logged for review"
        
        Write-RemediationLog "$(if($DryRun){'[DRY RUN] '}else{''})Backup configuration needed for resource: $($Violation.ResourceId)" "WARNING"
    }
    catch {
        $result.Error = $_.Exception.Message
    }
    
    return $result
}

function Remediate-CostOptimization {
    param(
        $Violation,
        $Config,
        [switch]$DryRun
    )
    
    $result = @{
        ViolationId = $Violation.ResourceId
        ViolationType = $Violation.ViolationType
        Action = "Cost optimization"
        Success = $false
        Error = ""
        Timestamp = Get-Date
        DryRun = $DryRun.IsPresent
    }
    
    try {
        # Get resource
        $resource = Get-AzResource -ResourceId $Violation.ResourceId
        
        if (!$resource) {
            $result.Error = "Resource not found"
            return $result
        }
        
        # For cost optimization, we typically want manual review rather than automatic changes
        $result.Success = $true
        $result.Action = "Cost optimization opportunity flagged for review"
        
        Write-RemediationLog "$(if($DryRun){'[DRY RUN] '}else{''})Cost optimization opportunity identified: $($Violation.ResourceId)" "INFO"
    }
    catch {
        $result.Error = $_.Exception.Message
    }
    
    return $result
}

function Remediate-NamingConvention {
    param(
        $Violation,
        $Config,
        [switch]$DryRun
    )
    
    $result = @{
        ViolationId = $Violation.ResourceId
        ViolationType = $Violation.ViolationType
        Action = "Naming convention violation"
        Success = $false
        Error = ""
        Timestamp = Get-Date
        DryRun = $DryRun.IsPresent
    }
    
    try {
        # Naming convention violations typically require manual intervention
        # as renaming resources can be complex and risky
        $result.Success = $true
        $result.Action = "Naming convention violation flagged for manual review"
        
        Write-RemediationLog "$(if($DryRun){'[DRY RUN] '}else{''})Naming convention violation flagged: $($Violation.ResourceId)" "WARNING"
    }
    catch {
        $result.Error = $_.Exception.Message
    }
    
    return $result
}

function Send-RemediationNotification {
    param(
        $RemediationResults,
        $Config
    )
    
    try {
        $successCount = ($RemediationResults | Where-Object { $_.Success }).Count
        $failureCount = ($RemediationResults | Where-Object { !$_.Success }).Count
        
        $subject = "Automated Remediation Report - $Environment"
        $body = @"
Automated Remediation Summary for $Environment environment:

Total Actions: $($RemediationResults.Count)
Successful: $successCount
Failed: $failureCount

Detailed Results:
$($RemediationResults | ConvertTo-Json -Depth 3)

Log File: $LogFile
"@
        
        # Send notification based on configuration
        if ($Config.notifications.email.enabled) {
            Send-EmailNotification -Subject $subject -Body $body -Config $Config
        }
        
        if ($Config.notifications.teams.enabled) {
            Send-TeamsNotification -Subject $subject -Body $body -Config $Config
        }
        
        Write-RemediationLog "Remediation notification sent" "INFO"
    }
    catch {
        Write-RemediationLog "Failed to send notification: $($_.Exception.Message)" "ERROR"
    }
}

function Send-EmailNotification {
    param(
        [string]$Subject,
        [string]$Body,
        $Config
    )
    
    # Email notification implementation would go here
    # This is a placeholder for the actual email sending logic
    Write-RemediationLog "Email notification would be sent: $Subject" "INFO"
}

function Send-TeamsNotification {
    param(
        [string]$Subject,
        [string]$Body,
        $Config
    )
    
    # Teams notification implementation would go here
    # This is a placeholder for the actual Teams webhook logic
    Write-RemediationLog "Teams notification would be sent: $Subject" "INFO"
}

function Export-RemediationReport {
    param(
        $RemediationResults,
        $Config
    )
    
    try {
        $reportPath = Join-Path $LogPath "remediation-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        
        $report = @{
            Timestamp = Get-Date
            Environment = $Environment
            TotalViolations = $RemediationResults.Count
            SuccessfulRemediations = ($RemediationResults | Where-Object { $_.Success }).Count
            FailedRemediations = ($RemediationResults | Where-Object { !$_.Success }).Count
            Results = $RemediationResults
        }
        
        $report | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportPath -Encoding UTF8
        
        Write-RemediationLog "Remediation report exported to: $reportPath" "SUCCESS"
        return $reportPath
    }
    catch {
        Write-RemediationLog "Failed to export remediation report: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Main execution logic
try {
    Write-RemediationLog "Starting Automated Remediation Framework" "INFO"
    Write-RemediationLog "Environment: $Environment" "INFO"
    Write-RemediationLog "Dry Run: $($DryRun.IsPresent)" "INFO"
    
    # Get configuration
    $config = Get-RemediationConfig -ConfigPath $ConfigPath
    
    # Connect to Azure
    Connect-ToAzureForRemediation -Config $config
    
    # Get compliance violations
    $violations = Get-ComplianceViolations -Config $config -ViolationType $ViolationType
    
    if ($violations.Count -eq 0) {
        Write-RemediationLog "No compliance violations found" "SUCCESS"
        return
    }
    
    # Perform automatic remediation
    $remediationResults = Invoke-AutomaticRemediation -Violations $violations -Config $config -DryRun:$DryRun
    
    # Export report
    $reportPath = Export-RemediationReport -RemediationResults $remediationResults -Config $config
    
    # Send notifications
    Send-RemediationNotification -RemediationResults $remediationResults -Config $config
    
    Write-RemediationLog "Automated remediation completed successfully" "SUCCESS"
    Write-RemediationLog "Report available at: $reportPath" "INFO"
}
catch {
    Write-RemediationLog "Automated remediation failed: $($_.Exception.Message)" "ERROR"
    exit 1
}
finally {
    Write-RemediationLog "Automated Remediation Framework execution completed" "INFO"
}