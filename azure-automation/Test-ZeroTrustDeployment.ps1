# Zero Trust Deployment Validation Script
# CBA Consult ICT Governance Framework - Zero Trust Testing and Validation
# This script validates Zero Trust architecture deployment and compliance

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "test", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory = $false)]
    [string]$ResourceGroupName = "rg-zerotrust-$Environment",
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("Quick", "Comprehensive", "Compliance")]
    [string]$TestLevel = "Comprehensive",
    
    [Parameter(Mandatory = $false)]
    [switch]$GenerateReport,
    
    [Parameter(Mandatory = $false)]
    [string]$ReportPath = "zero-trust-validation-report.html"
)

# Import required modules
$RequiredModules = @('Az.Accounts', 'Az.Resources', 'Az.Security', 'Az.Monitor', 'Az.KeyVault', 'Az.Network')

foreach ($Module in $RequiredModules) {
    try {
        Import-Module $Module -Force -ErrorAction Stop
        Write-Host "✓ Imported module: $Module" -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to import required module: $Module"
        exit 1
    }
}

# Initialize test results
$TestResults = @{
    OverallStatus = "Unknown"
    TestsRun = 0
    TestsPassed = 0
    TestsFailed = 0
    TestsSkipped = 0
    Details = @()
    StartTime = Get-Date
    EndTime = $null
}

function Write-TestResult {
    param(
        [string]$TestName,
        [ValidateSet("PASS", "FAIL", "SKIP", "INFO")]
        [string]$Status,
        [string]$Message,
        [string]$Details = ""
    )
    
    $result = @{
        TestName = $TestName
        Status = $Status
        Message = $Message
        Details = $Details
        Timestamp = Get-Date
    }
    
    $TestResults.Details += $result
    $TestResults.TestsRun++
    
    switch ($Status) {
        "PASS" { 
            $TestResults.TestsPassed++
            Write-Host "✓ $TestName - $Message" -ForegroundColor Green
        }
        "FAIL" { 
            $TestResults.TestsFailed++
            Write-Host "✗ $TestName - $Message" -ForegroundColor Red
        }
        "SKIP" { 
            $TestResults.TestsSkipped++
            Write-Host "⊘ $TestName - $Message" -ForegroundColor Yellow
        }
        "INFO" { 
            Write-Host "ℹ $TestName - $Message" -ForegroundColor Cyan
        }
    }
    
    if ($Details) {
        Write-Host "  Details: $Details" -ForegroundColor Gray
    }
}

function Test-Prerequisites {
    Write-Host "`n=== Testing Prerequisites ===" -ForegroundColor Magenta
    
    # Test Azure connection
    try {
        $context = Get-AzContext
        if ($context) {
            Write-TestResult "Azure Connection" "PASS" "Connected to Azure subscription: $($context.Subscription.Name)"
        } else {
            Write-TestResult "Azure Connection" "FAIL" "Not connected to Azure"
            return $false
        }
    }
    catch {
        Write-TestResult "Azure Connection" "FAIL" "Azure connection test failed: $($_.Exception.Message)"
        return $false
    }
    
    # Test subscription access
    try {
        Set-AzContext -SubscriptionId $SubscriptionId
        Write-TestResult "Subscription Access" "PASS" "Successfully accessed subscription: $SubscriptionId"
    }
    catch {
        Write-TestResult "Subscription Access" "FAIL" "Failed to access subscription: $SubscriptionId"
        return $false
    }
    
    # Test resource group existence
    try {
        $rg = Get-AzResourceGroup -Name $ResourceGroupName -ErrorAction Stop
        Write-TestResult "Resource Group" "PASS" "Resource group exists: $ResourceGroupName" "Location: $($rg.Location)"
    }
    catch {
        Write-TestResult "Resource Group" "FAIL" "Resource group not found: $ResourceGroupName"
        return $false
    }
    
    return $true
}

function Test-InfrastructureComponents {
    Write-Host "`n=== Testing Infrastructure Components ===" -ForegroundColor Magenta
    
    $resources = Get-AzResource -ResourceGroupName $ResourceGroupName
    
    # Test Log Analytics Workspace
    $logWorkspace = $resources | Where-Object { $_.ResourceType -eq "Microsoft.OperationalInsights/workspaces" }
    if ($logWorkspace) {
        Write-TestResult "Log Analytics Workspace" "PASS" "Found workspace: $($logWorkspace.Name)"
        
        # Test workspace configuration
        try {
            $workspace = Get-AzOperationalInsightsWorkspace -ResourceGroupName $ResourceGroupName -Name $logWorkspace.Name
            $retentionDays = $workspace.RetentionInDays
            if ($retentionDays -ge 90) {
                Write-TestResult "Log Retention Policy" "PASS" "Retention configured: $retentionDays days"
            } else {
                Write-TestResult "Log Retention Policy" "FAIL" "Insufficient retention: $retentionDays days (minimum 90)"
            }
        }
        catch {
            Write-TestResult "Log Retention Policy" "FAIL" "Failed to check retention policy"
        }
    } else {
        Write-TestResult "Log Analytics Workspace" "FAIL" "Log Analytics workspace not found"
    }
    
    # Test Key Vault
    $keyVault = $resources | Where-Object { $_.ResourceType -eq "Microsoft.KeyVault/vaults" }
    if ($keyVault) {
        Write-TestResult "Key Vault" "PASS" "Found Key Vault: $($keyVault.Name)"
        
        # Test Key Vault access policies
        try {
            $vault = Get-AzKeyVault -ResourceGroupName $ResourceGroupName -VaultName $keyVault.Name
            if ($vault.EnabledForDeployment -and $vault.EnabledForTemplateDeployment) {
                Write-TestResult "Key Vault Configuration" "PASS" "Key Vault properly configured for deployment"
            } else {
                Write-TestResult "Key Vault Configuration" "FAIL" "Key Vault deployment settings not optimal"
            }
        }
        catch {
            Write-TestResult "Key Vault Configuration" "FAIL" "Failed to check Key Vault configuration"
        }
    } else {
        Write-TestResult "Key Vault" "FAIL" "Key Vault not found"
    }
    
    # Test Virtual Network
    $vnet = $resources | Where-Object { $_.ResourceType -eq "Microsoft.Network/virtualNetworks" }
    if ($vnet) {
        Write-TestResult "Virtual Network" "PASS" "Found VNet: $($vnet.Name)"
        
        # Test network segmentation
        try {
            $network = Get-AzVirtualNetwork -ResourceGroupName $ResourceGroupName -Name $vnet.Name
            $subnetCount = $network.Subnets.Count
            if ($subnetCount -ge 3) {
                Write-TestResult "Network Segmentation" "PASS" "Network properly segmented: $subnetCount subnets"
            } else {
                Write-TestResult "Network Segmentation" "FAIL" "Insufficient network segmentation: $subnetCount subnets"
            }
        }
        catch {
            Write-TestResult "Network Segmentation" "FAIL" "Failed to check network segmentation"
        }
    } else {
        Write-TestResult "Virtual Network" "FAIL" "Virtual Network not found"
    }
    
    # Test Network Security Groups
    $nsgs = $resources | Where-Object { $_.ResourceType -eq "Microsoft.Network/networkSecurityGroups" }
    if ($nsgs.Count -gt 0) {
        Write-TestResult "Network Security Groups" "PASS" "Found $($nsgs.Count) NSGs"
        
        foreach ($nsg in $nsgs) {
            try {
                $nsgDetails = Get-AzNetworkSecurityGroup -ResourceGroupName $ResourceGroupName -Name $nsg.Name
                $ruleCount = $nsgDetails.SecurityRules.Count
                Write-TestResult "NSG Rules - $($nsg.Name)" "INFO" "Security rules configured: $ruleCount"
            }
            catch {
                Write-TestResult "NSG Rules - $($nsg.Name)" "FAIL" "Failed to check NSG rules"
            }
        }
    } else {
        Write-TestResult "Network Security Groups" "FAIL" "No Network Security Groups found"
    }
}

function Test-IdentityComponents {
    Write-Host "`n=== Testing Identity and Access Management ===" -ForegroundColor Magenta
    
    # Test Managed Identity
    $managedIdentities = Get-AzResource -ResourceGroupName $ResourceGroupName | Where-Object { $_.ResourceType -eq "Microsoft.ManagedIdentity/userAssignedIdentities" }
    if ($managedIdentities.Count -gt 0) {
        Write-TestResult "Managed Identities" "PASS" "Found $($managedIdentities.Count) managed identities"
    } else {
        Write-TestResult "Managed Identities" "FAIL" "No managed identities found"
    }
    
    # Test Automation Account
    $automationAccounts = Get-AzResource -ResourceGroupName $ResourceGroupName | Where-Object { $_.ResourceType -eq "Microsoft.Automation/automationAccounts" }
    if ($automationAccounts.Count -gt 0) {
        Write-TestResult "Automation Accounts" "PASS" "Found $($automationAccounts.Count) automation accounts"
        
        foreach ($account in $automationAccounts) {
            try {
                $automationAccount = Get-AzAutomationAccount -ResourceGroupName $ResourceGroupName -Name $account.Name
                Write-TestResult "Automation Account - $($account.Name)" "INFO" "Status: $($automationAccount.State)"
            }
            catch {
                Write-TestResult "Automation Account - $($account.Name)" "FAIL" "Failed to check automation account status"
            }
        }
    } else {
        Write-TestResult "Automation Accounts" "FAIL" "No automation accounts found"
    }
}

function Test-SecurityControls {
    Write-Host "`n=== Testing Security Controls ===" -ForegroundColor Magenta
    
    # Test Azure Security Center
    try {
        $securityContacts = Get-AzSecurityContact
        if ($securityContacts.Count -gt 0) {
            Write-TestResult "Security Center Contacts" "PASS" "Security contacts configured: $($securityContacts.Count)"
        } else {
            Write-TestResult "Security Center Contacts" "FAIL" "No security contacts configured"
        }
    }
    catch {
        Write-TestResult "Security Center Contacts" "FAIL" "Failed to check security contacts"
    }
    
    # Test Auto Provisioning
    try {
        $autoProvisioning = Get-AzSecurityAutoProvisioningSetting
        $enabledSettings = $autoProvisioning | Where-Object { $_.AutoProvision -eq "On" }
        if ($enabledSettings.Count -gt 0) {
            Write-TestResult "Auto Provisioning" "PASS" "Auto provisioning enabled for $($enabledSettings.Count) settings"
        } else {
            Write-TestResult "Auto Provisioning" "FAIL" "Auto provisioning not enabled"
        }
    }
    catch {
        Write-TestResult "Auto Provisioning" "FAIL" "Failed to check auto provisioning settings"
    }
    
    # Test Security Policies
    try {
        $policies = Get-AzPolicyAssignment -Scope "/subscriptions/$SubscriptionId"
        $securityPolicies = $policies | Where-Object { $_.Properties.DisplayName -like "*Security*" -or $_.Properties.DisplayName -like "*Zero Trust*" }
        if ($securityPolicies.Count -gt 0) {
            Write-TestResult "Security Policies" "PASS" "Found $($securityPolicies.Count) security-related policies"
        } else {
            Write-TestResult "Security Policies" "FAIL" "No security policies found"
        }
    }
    catch {
        Write-TestResult "Security Policies" "FAIL" "Failed to check security policies"
    }
}

function Test-MonitoringAndAlerting {
    Write-Host "`n=== Testing Monitoring and Alerting ===" -ForegroundColor Magenta
    
    # Test Diagnostic Settings
    $resources = Get-AzResource -ResourceGroupName $ResourceGroupName
    $resourcesWithDiagnostics = 0
    
    foreach ($resource in $resources) {
        try {
            $diagnostics = Get-AzDiagnosticSetting -ResourceId $resource.ResourceId -ErrorAction SilentlyContinue
            if ($diagnostics) {
                $resourcesWithDiagnostics++
            }
        }
        catch {
            # Silently continue for resources that don't support diagnostics
        }
    }
    
    if ($resourcesWithDiagnostics -gt 0) {
        Write-TestResult "Diagnostic Settings" "PASS" "Diagnostics configured for $resourcesWithDiagnostics resources"
    } else {
        Write-TestResult "Diagnostic Settings" "FAIL" "No diagnostic settings found"
    }
    
    # Test Alert Rules
    try {
        $alertRules = Get-AzScheduledQueryRule -ResourceGroupName $ResourceGroupName
        if ($alertRules.Count -gt 0) {
            Write-TestResult "Alert Rules" "PASS" "Found $($alertRules.Count) alert rules"
            
            foreach ($rule in $alertRules) {
                $status = if ($rule.Enabled) { "Enabled" } else { "Disabled" }
                Write-TestResult "Alert Rule - $($rule.Name)" "INFO" "Status: $status, Severity: $($rule.Severity)"
            }
        } else {
            Write-TestResult "Alert Rules" "FAIL" "No alert rules configured"
        }
    }
    catch {
        Write-TestResult "Alert Rules" "FAIL" "Failed to check alert rules"
    }
}

function Test-ZeroTrustCompliance {
    Write-Host "`n=== Testing Zero Trust Compliance ===" -ForegroundColor Magenta
    
    # Test Critical Systems Classification
    $criticalSystemsFile = "critical-systems-inventory.json"
    if (Test-Path $criticalSystemsFile) {
        Write-TestResult "Critical Systems Inventory" "PASS" "Critical systems inventory file found"
        
        try {
            $inventory = Get-Content $criticalSystemsFile | ConvertFrom-Json
            $tier1Systems = $inventory | Where-Object { $_.Tier -eq "Tier1" }
            $tier2Systems = $inventory | Where-Object { $_.Tier -eq "Tier2" }
            
            Write-TestResult "Tier 1 Systems" "INFO" "Identified $($tier1Systems.Count) mission-critical systems"
            Write-TestResult "Tier 2 Systems" "INFO" "Identified $($tier2Systems.Count) business-important systems"
        }
        catch {
            Write-TestResult "Critical Systems Analysis" "FAIL" "Failed to parse critical systems inventory"
        }
    } else {
        Write-TestResult "Critical Systems Inventory" "FAIL" "Critical systems inventory not found"
    }
    
    # Test Zero Trust Maturity Assessment
    $maturityAssessmentScript = "azure-automation/Zero-Trust-Maturity-Assessment.ps1"
    if (Test-Path $maturityAssessmentScript) {
        Write-TestResult "Maturity Assessment Tool" "PASS" "Zero Trust maturity assessment tool available"
        
        if ($TestLevel -eq "Comprehensive") {
            try {
                Write-Host "Running Zero Trust maturity assessment..." -ForegroundColor Yellow
                $assessmentResult = & $maturityAssessmentScript -Pillar "All" -ConfigPath "azure-automation/zero-trust-assessment-config.json"
                Write-TestResult "Maturity Assessment Execution" "PASS" "Assessment completed successfully"
            }
            catch {
                Write-TestResult "Maturity Assessment Execution" "FAIL" "Assessment execution failed: $($_.Exception.Message)"
            }
        }
    } else {
        Write-TestResult "Maturity Assessment Tool" "FAIL" "Zero Trust maturity assessment tool not found"
    }
    
    # Test Implementation Guide
    $implementationGuide = "Zero-Trust-Implementation-Guide.md"
    if (Test-Path $implementationGuide) {
        Write-TestResult "Implementation Guide" "PASS" "Zero Trust implementation guide available"
    } else {
        Write-TestResult "Implementation Guide" "FAIL" "Zero Trust implementation guide not found"
    }
    
    # Test Governance Integration
    $governanceIntegration = "Zero-Trust-Governance-Integration.md"
    if (Test-Path $governanceIntegration) {
        Write-TestResult "Governance Integration" "PASS" "Zero Trust governance integration documented"
    } else {
        Write-TestResult "Governance Integration" "FAIL" "Zero Trust governance integration not found"
    }
}

function Test-BusinessContinuity {
    Write-Host "`n=== Testing Business Continuity ===" -ForegroundColor Magenta
    
    # Test Backup Configuration
    try {
        $backupVaults = Get-AzResource -ResourceType "Microsoft.RecoveryServices/vaults" -ResourceGroupName $ResourceGroupName
        if ($backupVaults.Count -gt 0) {
            Write-TestResult "Backup Vaults" "PASS" "Found $($backupVaults.Count) backup vaults"
        } else {
            Write-TestResult "Backup Vaults" "FAIL" "No backup vaults found"
        }
    }
    catch {
        Write-TestResult "Backup Vaults" "FAIL" "Failed to check backup configuration"
    }
    
    # Test Disaster Recovery
    $drDocumentation = "disaster-recovery-plan.md"
    if (Test-Path $drDocumentation) {
        Write-TestResult "Disaster Recovery Plan" "PASS" "Disaster recovery plan documented"
    } else {
        Write-TestResult "Disaster Recovery Plan" "FAIL" "Disaster recovery plan not found"
    }
    
    # Test High Availability
    $resources = Get-AzResource -ResourceGroupName $ResourceGroupName
    $haResources = $resources | Where-Object { $_.Location -ne $null }
    $uniqueLocations = ($haResources | Select-Object -ExpandProperty Location | Sort-Object -Unique).Count
    
    if ($uniqueLocations -gt 1) {
        Write-TestResult "High Availability" "PASS" "Resources deployed across $uniqueLocations locations"
    } else {
        Write-TestResult "High Availability" "FAIL" "Resources in single location - no geographic redundancy"
    }
}

function Generate-ValidationReport {
    Write-Host "`n=== Generating Validation Report ===" -ForegroundColor Magenta
    
    $TestResults.EndTime = Get-Date
    $duration = $TestResults.EndTime - $TestResults.StartTime
    
    # Calculate overall status
    if ($TestResults.TestsFailed -eq 0) {
        $TestResults.OverallStatus = "PASS"
        $statusColor = "green"
    } elseif ($TestResults.TestsPassed -gt $TestResults.TestsFailed) {
        $TestResults.OverallStatus = "PARTIAL"
        $statusColor = "orange"
    } else {
        $TestResults.OverallStatus = "FAIL"
        $statusColor = "red"
    }
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Zero Trust Deployment Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #0078d4; color: white; padding: 20px; }
        .summary { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 5px solid #0078d4; }
        .section { margin: 20px 0; }
        .pass { color: green; font-weight: bold; }
        .fail { color: red; font-weight: bold; }
        .skip { color: orange; font-weight: bold; }
        .info { color: blue; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-$statusColor { color: $statusColor; font-weight: bold; font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Zero Trust Architecture Deployment Validation Report</h1>
        <p>Environment: $Environment | Subscription: $SubscriptionId</p>
        <p>Test Level: $TestLevel | Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
    </div>
    
    <div class="summary">
        <h2>Validation Summary</h2>
        <p><strong>Overall Status:</strong> <span class="status-$statusColor">$($TestResults.OverallStatus)</span></p>
        <p><strong>Tests Run:</strong> $($TestResults.TestsRun)</p>
        <p><strong>Tests Passed:</strong> $($TestResults.TestsPassed)</p>
        <p><strong>Tests Failed:</strong> $($TestResults.TestsFailed)</p>
        <p><strong>Tests Skipped:</strong> $($TestResults.TestsSkipped)</p>
        <p><strong>Duration:</strong> $($duration.ToString('hh\:mm\:ss'))</p>
    </div>
    
    <div class="section">
        <h2>Detailed Test Results</h2>
        <table>
            <tr>
                <th>Test Name</th>
                <th>Status</th>
                <th>Message</th>
                <th>Details</th>
                <th>Timestamp</th>
            </tr>
"@

    foreach ($test in $TestResults.Details) {
        $statusClass = $test.Status.ToLower()
        $html += @"
            <tr>
                <td>$($test.TestName)</td>
                <td class="$statusClass">$($test.Status)</td>
                <td>$($test.Message)</td>
                <td>$($test.Details)</td>
                <td>$($test.Timestamp.ToString('HH:mm:ss'))</td>
            </tr>
"@
    }

    $html += @"
        </table>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
"@

    if ($TestResults.TestsFailed -gt 0) {
        $html += "<li>Review and address failed test items before proceeding to production</li>"
    }
    
    $html += @"
            <li>Conduct regular Zero Trust maturity assessments</li>
            <li>Implement continuous monitoring and alerting</li>
            <li>Schedule periodic security reviews and audits</li>
            <li>Maintain up-to-date documentation and procedures</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Address any failed validation items</li>
            <li>Complete Zero Trust maturity assessment</li>
            <li>Implement monitoring dashboard</li>
            <li>Conduct user training and awareness</li>
            <li>Schedule regular governance reviews</li>
        </ol>
    </div>
</body>
</html>
"@

    $html | Out-File -FilePath $ReportPath -Encoding UTF8
    Write-TestResult "Report Generation" "PASS" "Validation report generated: $ReportPath"
}

# Main execution
try {
    Write-Host "Zero Trust Deployment Validation" -ForegroundColor Cyan
    Write-Host "Environment: $Environment" -ForegroundColor Cyan
    Write-Host "Test Level: $TestLevel" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
    
    # Run validation tests
    if (-not (Test-Prerequisites)) {
        Write-Host "`nPrerequisites failed. Exiting validation." -ForegroundColor Red
        exit 1
    }
    
    Test-InfrastructureComponents
    Test-IdentityComponents
    Test-SecurityControls
    Test-MonitoringAndAlerting
    Test-ZeroTrustCompliance
    
    if ($TestLevel -eq "Comprehensive") {
        Test-BusinessContinuity
    }
    
    # Generate report
    if ($GenerateReport) {
        Generate-ValidationReport
    }
    
    # Final summary
    Write-Host "`n" + "=" * 50 -ForegroundColor Cyan
    Write-Host "Validation Complete" -ForegroundColor Cyan
    Write-Host "Overall Status: $($TestResults.OverallStatus)" -ForegroundColor $(if($TestResults.OverallStatus -eq "PASS"){"Green"}elseif($TestResults.OverallStatus -eq "PARTIAL"){"Yellow"}else{"Red"})
    Write-Host "Tests: $($TestResults.TestsPassed) passed, $($TestResults.TestsFailed) failed, $($TestResults.TestsSkipped) skipped" -ForegroundColor Cyan
    
    if ($TestResults.TestsFailed -gt 0) {
        Write-Host "`nFailed tests require attention before deployment can be considered complete." -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "`nZero Trust deployment validation successful!" -ForegroundColor Green
        exit 0
    }
}
catch {
    Write-Host "`nValidation failed with error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
