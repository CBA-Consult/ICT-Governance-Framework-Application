# ICT Governance Framework - Azure Policy and Governance Automation
# This script helps manage and automate governance controls for Azure resources
# Author: GitHub Copilot
# Date: August 7, 2025

# Import required modules
Import-Module Az.Accounts
Import-Module Az.Resources
Import-Module Az.PolicyInsights

# Configuration variables
$CONFIG = @{
    LogPath = ".\governance-logs\"
    ReportPath = ".\governance-reports\"
    TemplatesPath = ".\governance-templates\"
    PolicyDefinitionsPath = ".\policy-definitions\"
}

# Initialize logging
function Initialize-GovFramework {
    param (
        [Parameter(Mandatory = $false)]
        [string]$CustomConfigPath
    )
    
    # Create directories if they don't exist
    if (!(Test-Path -Path $CONFIG.LogPath)) {
        New-Item -Path $CONFIG.LogPath -ItemType Directory -Force
    }
    
    if (!(Test-Path -Path $CONFIG.ReportPath)) {
        New-Item -Path $CONFIG.ReportPath -ItemType Directory -Force
    }
    
    Write-Host "ICT Governance Framework initialized successfully." -ForegroundColor Green
    Write-Host "Log Path: $($CONFIG.LogPath)" -ForegroundColor Cyan
    Write-Host "Report Path: $($CONFIG.ReportPath)" -ForegroundColor Cyan
    
    # Load custom configuration if provided
    if ($CustomConfigPath -and (Test-Path -Path $CustomConfigPath)) {
        $customConfig = Get-Content -Path $CustomConfigPath -Raw | ConvertFrom-Json
        # Merge configurations
        foreach ($key in $customConfig.PSObject.Properties.Name) {
            $CONFIG[$key] = $customConfig.$key
        }
        Write-Host "Custom configuration loaded from: $CustomConfigPath" -ForegroundColor Yellow
    }
}

# Log function
function Write-GovLog {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Message,
        
        [Parameter(Mandatory = $false)]
        [ValidateSet("Info", "Warning", "Error", "Success")]
        [string]$Level = "Info"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] - $Message"
    
    # Write to console with color
    switch ($Level) {
        "Info" { Write-Host $logEntry -ForegroundColor White }
        "Warning" { Write-Host $logEntry -ForegroundColor Yellow }
        "Error" { Write-Host $logEntry -ForegroundColor Red }
        "Success" { Write-Host $logEntry -ForegroundColor Green }
    }
    
    # Write to log file
    $logFile = Join-Path -Path $CONFIG.LogPath -ChildPath "governance-$(Get-Date -Format 'yyyy-MM-dd').log"
    Add-Content -Path $logFile -Value $logEntry
}

# Connect to Azure
function Connect-GovAzure {
    param (
        [Parameter(Mandatory = $false)]
        [switch]$UseManagedIdentity,
        
        [Parameter(Mandatory = $false)]
        [string]$TenantId
    )
    
    try {
        if ($UseManagedIdentity) {
            # Connect using Managed Identity
            Connect-AzAccount -Identity
            Write-GovLog -Message "Connected to Azure using Managed Identity" -Level "Success"
        }
        elseif ($TenantId) {
            # Connect with specific tenant
            Connect-AzAccount -TenantId $TenantId
            Write-GovLog -Message "Connected to Azure tenant: $TenantId" -Level "Success"
        }
        else {
            # Interactive login
            Connect-AzAccount
            Write-GovLog -Message "Connected to Azure interactively" -Level "Success"
        }
        
        # Display current context
        $context = Get-AzContext
        Write-GovLog -Message "Current context: Subscription - $($context.Subscription.Name), Tenant - $($context.Tenant.Id)" -Level "Info"
    }
    catch {
        Write-GovLog -Message "Failed to connect to Azure: $_" -Level "Error"
        throw
    }
}

# Get Azure Policy Compliance Summary
function Get-GovPolicyComplianceSummary {
    param (
        [Parameter(Mandatory = $false)]
        [string]$SubscriptionId,
        
        [Parameter(Mandatory = $false)]
        [string]$ResourceGroupName,
        
        [Parameter(Mandatory = $false)]
        [string]$OutputPath
    )
    
    try {
        # Set context if subscription is provided
        if ($SubscriptionId) {
            Set-AzContext -SubscriptionId $SubscriptionId | Out-Null
            Write-GovLog -Message "Set context to subscription: $SubscriptionId" -Level "Info"
        }
        
        # Get policy states
        if ($ResourceGroupName) {
            $scope = "/subscriptions/$($context.Subscription.Id)/resourceGroups/$ResourceGroupName"
            $policyStates = Get-AzPolicyState -ResourceGroupName $ResourceGroupName
            Write-GovLog -Message "Retrieved policy states for resource group: $ResourceGroupName" -Level "Info"
        }
        else {
            $scope = "/subscriptions/$($context.Subscription.Id)"
            $policyStates = Get-AzPolicyState
            Write-GovLog -Message "Retrieved policy states for subscription: $($context.Subscription.Id)" -Level "Info"
        }
        
        # Summarize compliance
        $compliantCount = ($policyStates | Where-Object { $_.ComplianceState -eq "Compliant" }).Count
        $nonCompliantCount = ($policyStates | Where-Object { $_.ComplianceState -eq "NonCompliant" }).Count
        $totalCount = $policyStates.Count
        
        $complianceSummary = [PSCustomObject]@{
            Scope = $scope
            TotalPolicies = $totalCount
            CompliantPolicies = $compliantCount
            NonCompliantPolicies = $nonCompliantCount
            ComplianceRate = if ($totalCount -gt 0) { [math]::Round(($compliantCount / $totalCount) * 100, 2) } else { 0 }
            Timestamp = Get-Date
        }
        
        # Export to file if path is provided
        if ($OutputPath) {
            if (!(Test-Path -Path (Split-Path -Path $OutputPath -Parent))) {
                New-Item -Path (Split-Path -Path $OutputPath -Parent) -ItemType Directory -Force
            }
            
            $complianceSummary | ConvertTo-Json | Out-File -FilePath $OutputPath -Force
            Write-GovLog -Message "Compliance summary exported to: $OutputPath" -Level "Success"
        }
        
        return $complianceSummary
    }
    catch {
        Write-GovLog -Message "Failed to retrieve policy compliance summary: $_" -Level "Error"
        throw
    }
}

# Get Non-Compliant Resources
function Get-GovNonCompliantResources {
    param (
        [Parameter(Mandatory = $false)]
        [string]$SubscriptionId,
        
        [Parameter(Mandatory = $false)]
        [string]$ResourceGroupName,
        
        [Parameter(Mandatory = $false)]
        [string]$OutputPath
    )
    
    try {
        # Set context if subscription is provided
        if ($SubscriptionId) {
            Set-AzContext -SubscriptionId $SubscriptionId | Out-Null
            Write-GovLog -Message "Set context to subscription: $SubscriptionId" -Level "Info"
        }
        
        # Get non-compliant policy states
        if ($ResourceGroupName) {
            $policyStates = Get-AzPolicyState -ResourceGroupName $ResourceGroupName | Where-Object { $_.ComplianceState -eq "NonCompliant" }
            Write-GovLog -Message "Retrieved non-compliant policy states for resource group: $ResourceGroupName" -Level "Info"
        }
        else {
            $policyStates = Get-AzPolicyState | Where-Object { $_.ComplianceState -eq "NonCompliant" }
            Write-GovLog -Message "Retrieved non-compliant policy states for subscription: $($context.Subscription.Id)" -Level "Info"
        }
        
        # Group by resource
        $nonCompliantResources = $policyStates | Group-Object -Property ResourceId | ForEach-Object {
            $resource = $_
            [PSCustomObject]@{
                ResourceId = $resource.Name
                ResourceType = ($resource.Group | Select-Object -First 1).ResourceType
                ResourceGroup = ($resource.Group | Select-Object -First 1).ResourceGroup
                NonCompliantPolicies = $resource.Group | ForEach-Object {
                    [PSCustomObject]@{
                        PolicyDefinitionId = $_.PolicyDefinitionId
                        PolicyDefinitionName = $_.PolicyDefinitionName
                        PolicyAssignmentId = $_.PolicyAssignmentId
                        PolicyAssignmentName = $_.PolicyAssignmentName
                    }
                }
                NonCompliantCount = $resource.Count
            }
        }
        
        # Export to file if path is provided
        if ($OutputPath) {
            if (!(Test-Path -Path (Split-Path -Path $OutputPath -Parent))) {
                New-Item -Path (Split-Path -Path $OutputPath -Parent) -ItemType Directory -Force
            }
            
            $nonCompliantResources | ConvertTo-Json -Depth 5 | Out-File -FilePath $OutputPath -Force
            Write-GovLog -Message "Non-compliant resources exported to: $OutputPath" -Level "Success"
        }
        
        return $nonCompliantResources
    }
    catch {
        Write-GovLog -Message "Failed to retrieve non-compliant resources: $_" -Level "Error"
        throw
    }
}

# Generate Governance Dashboard Report
function New-GovDashboardReport {
    param (
        [Parameter(Mandatory = $false)]
        [string]$SubscriptionId,
        
        [Parameter(Mandatory = $false)]
        [string]$OutputPath = (Join-Path -Path $CONFIG.ReportPath -ChildPath "governance-dashboard-$(Get-Date -Format 'yyyy-MM-dd').html")
    )
    
    try {
        # Set context if subscription is provided
        if ($SubscriptionId) {
            Set-AzContext -SubscriptionId $SubscriptionId | Out-Null
            Write-GovLog -Message "Set context to subscription: $SubscriptionId" -Level "Info"
        }
        
        # Get compliance summary
        $tempCompliancePath = Join-Path -Path $CONFIG.ReportPath -ChildPath "temp-compliance-summary.json"
        $complianceSummary = Get-GovPolicyComplianceSummary -OutputPath $tempCompliancePath
        
        # Get non-compliant resources
        $tempNonCompliantPath = Join-Path -Path $CONFIG.ReportPath -ChildPath "temp-non-compliant.json"
        $nonCompliantResources = Get-GovNonCompliantResources -OutputPath $tempNonCompliantPath
        
        # Get resource counts
        $resourceGroups = Get-AzResourceGroup
        $resources = Get-AzResource
        $resourceTypes = $resources | Group-Object -Property ResourceType | Select-Object Name, Count | Sort-Object -Property Count -Descending
        
        # Create HTML report
        $htmlContent = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ICT Governance Dashboard</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            background-color: #0078d4;
            color: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        .card {
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 20px;
        }
        .flex-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
        }
        .flex-item {
            flex: 1;
            min-width: 300px;
        }
        .metric {
            text-align: center;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
            margin-bottom: 10px;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
        }
        .metric-label {
            font-size: 14px;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
        .progress-container {
            width: 100%;
            background-color: #e0e0e0;
            border-radius: 4px;
            margin: 10px 0;
        }
        .progress-bar {
            height: 20px;
            border-radius: 4px;
            background-color: #0078d4;
            text-align: center;
            color: white;
            line-height: 20px;
        }
        .progress-bar.warning {
            background-color: #ffa500;
        }
        .progress-bar.danger {
            background-color: #d13438;
        }
        .progress-bar.success {
            background-color: #107c10;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ICT Governance Framework Dashboard</h1>
        <p>Generated on: $(Get-Date -Format "MMMM dd, yyyy HH:mm")</p>
    </div>
    
    <div class="card">
        <h2>Resource Overview</h2>
        <div class="flex-container">
            <div class="flex-item">
                <div class="metric">
                    <div class="metric-label">Resource Groups</div>
                    <div class="metric-value">$($resourceGroups.Count)</div>
                </div>
            </div>
            <div class="flex-item">
                <div class="metric">
                    <div class="metric-label">Total Resources</div>
                    <div class="metric-value">$($resources.Count)</div>
                </div>
            </div>
            <div class="flex-item">
                <div class="metric">
                    <div class="metric-label">Resource Types</div>
                    <div class="metric-value">$($resourceTypes.Count)</div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="card">
        <h2>Policy Compliance</h2>
        <div class="flex-container">
            <div class="flex-item">
                <div class="metric">
                    <div class="metric-label">Compliance Rate</div>
                    <div class="metric-value">$($complianceSummary.ComplianceRate)%</div>
                    <div class="progress-container">
                        <div class="progress-bar $(if($complianceSummary.ComplianceRate -lt 70){'danger'}elseif($complianceSummary.ComplianceRate -lt 90){'warning'}else{'success'})" 
                             style="width: $($complianceSummary.ComplianceRate)%">
                            $($complianceSummary.ComplianceRate)%
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex-item">
                <div class="metric">
                    <div class="metric-label">Compliant Policies</div>
                    <div class="metric-value">$($complianceSummary.CompliantPolicies)</div>
                </div>
            </div>
            <div class="flex-item">
                <div class="metric">
                    <div class="metric-label">Non-Compliant Policies</div>
                    <div class="metric-value">$($complianceSummary.NonCompliantPolicies)</div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="card">
        <h2>Top Resource Types</h2>
        <table>
            <tr>
                <th>Resource Type</th>
                <th>Count</th>
            </tr>
            $(foreach($rt in $resourceTypes | Select-Object -First 10) {
                "<tr><td>$($rt.Name)</td><td>$($rt.Count)</td></tr>"
            })
        </table>
    </div>
    
    <div class="card">
        <h2>Non-Compliant Resources (Top 10)</h2>
        <table>
            <tr>
                <th>Resource</th>
                <th>Resource Group</th>
                <th>Type</th>
                <th>Non-Compliant Policies</th>
            </tr>
            $(foreach($ncr in $nonCompliantResources | Select-Object -First 10) {
                "<tr>
                    <td>$($ncr.ResourceId.Split('/')[-1])</td>
                    <td>$($ncr.ResourceGroup)</td>
                    <td>$($ncr.ResourceType)</td>
                    <td>$($ncr.NonCompliantCount)</td>
                </tr>"
            })
        </table>
    </div>
    
    <div class="footer">
        <p>ICT Governance Framework Automation | Generated by PowerShell</p>
    </div>
</body>
</html>
"@
        
        # Output HTML report
        if (!(Test-Path -Path (Split-Path -Path $OutputPath -Parent))) {
            New-Item -Path (Split-Path -Path $OutputPath -Parent) -ItemType Directory -Force
        }
        
        $htmlContent | Out-File -FilePath $OutputPath -Force
        Write-GovLog -Message "Governance dashboard report generated at: $OutputPath" -Level "Success"
        
        # Clean up temporary files
        if (Test-Path -Path $tempCompliancePath) { Remove-Item -Path $tempCompliancePath -Force }
        if (Test-Path -Path $tempNonCompliantPath) { Remove-Item -Path $tempNonCompliantPath -Force }
        
        return $OutputPath
    }
    catch {
        Write-GovLog -Message "Failed to generate governance dashboard report: $_" -Level "Error"
        throw
    }
}

# Create a Governance Assessment Report
function New-GovAssessmentReport {
    param (
        [Parameter(Mandatory = $true)]
        [string]$SubscriptionId,
        
        [Parameter(Mandatory = $false)]
        [string]$OutputPath = (Join-Path -Path $CONFIG.ReportPath -ChildPath "governance-assessment-$(Get-Date -Format 'yyyy-MM-dd').csv")
    )
    
    try {
        # Set context
        Set-AzContext -SubscriptionId $SubscriptionId | Out-Null
        Write-GovLog -Message "Set context to subscription: $SubscriptionId" -Level "Info"
        
        # Get resources
        $resources = Get-AzResource
        Write-GovLog -Message "Retrieved $($resources.Count) resources" -Level "Info"
        
        # Assessment criteria
        $assessmentResults = foreach ($resource in $resources) {
            # Get resource locks
            $locks = Get-AzResourceLock -ResourceId $resource.ResourceId -ErrorAction SilentlyContinue
            
            # Get resource tags
            $tags = $resource.Tags
            $hasOwnerTag = if ($tags -and $tags.ContainsKey('Owner')) { $true } else { $false }
            $hasCostCenterTag = if ($tags -and $tags.ContainsKey('CostCenter')) { $true } else { $false }
            $hasEnvironmentTag = if ($tags -and $tags.ContainsKey('Environment')) { $true } else { $false }
            
            # Create assessment object
            [PSCustomObject]@{
                ResourceName = $resource.Name
                ResourceType = $resource.ResourceType
                ResourceGroup = $resource.ResourceGroupName
                Location = $resource.Location
                HasLock = if ($locks) { $true } else { $false }
                HasOwnerTag = $hasOwnerTag
                HasCostCenterTag = $hasCostCenterTag
                HasEnvironmentTag = $hasEnvironmentTag
                TagComplianceScore = (($hasOwnerTag, $hasCostCenterTag, $hasEnvironmentTag | Where-Object { $_ -eq $true }).Count / 3) * 100
                HasAllRequiredTags = if ($hasOwnerTag -and $hasCostCenterTag -and $hasEnvironmentTag) { $true } else { $false }
                Tags = if ($tags) { $tags | ConvertTo-Json -Compress } else { "{}" }
            }
        }
        
        # Export to CSV
        if (!(Test-Path -Path (Split-Path -Path $OutputPath -Parent))) {
            New-Item -Path (Split-Path -Path $OutputPath -Parent) -ItemType Directory -Force
        }
        
        $assessmentResults | Export-Csv -Path $OutputPath -NoTypeInformation -Force
        Write-GovLog -Message "Governance assessment report exported to: $OutputPath" -Level "Success"
        
        # Summary
        $compliantResourcesCount = ($assessmentResults | Where-Object { $_.HasAllRequiredTags -eq $true }).Count
        $complianceRate = if ($resources.Count -gt 0) { [math]::Round(($compliantResourcesCount / $resources.Count) * 100, 2) } else { 0 }
        
        $summary = [PSCustomObject]@{
            TotalResources = $resources.Count
            CompliantResources = $compliantResourcesCount
            NonCompliantResources = $resources.Count - $compliantResourcesCount
            ComplianceRate = $complianceRate
            Timestamp = Get-Date
        }
        
        Write-GovLog -Message "Assessment Summary: $($summary.ComplianceRate)% compliant ($($summary.CompliantResources)/$($summary.TotalResources) resources)" -Level "Info"
        
        return $OutputPath
    }
    catch {
        Write-GovLog -Message "Failed to generate governance assessment report: $_" -Level "Error"
        throw
    }
}

# Export ICT Governance Framework module functions
Export-ModuleMember -Function Initialize-GovFramework, Connect-GovAzure, Get-GovPolicyComplianceSummary, Get-GovNonCompliantResources, New-GovDashboardReport, New-GovAssessmentReport

# Sample usage
if ($MyInvocation.InvocationName -eq $MyInvocation.MyCommand.Name) {
    # Script is being run directly
    Write-Host "ICT Governance Framework Automation" -ForegroundColor Cyan
    Write-Host "===============================" -ForegroundColor Cyan
    Write-Host "1. Initialize"
    Write-Host "2. Connect to Azure"
    Write-Host "3. Get Policy Compliance Summary"
    Write-Host "4. Get Non-Compliant Resources"
    Write-Host "5. Generate Dashboard Report"
    Write-Host "6. Run Governance Assessment"
    Write-Host "Q. Quit"
    Write-Host ""
    
    $choice = Read-Host "Enter your choice"
    
    switch ($choice) {
        "1" {
            Initialize-GovFramework
        }
        "2" {
            Connect-GovAzure
        }
        "3" {
            $sub = Read-Host "Enter subscription ID (leave blank for current)"
            if ($sub) {
                Get-GovPolicyComplianceSummary -SubscriptionId $sub
            }
            else {
                Get-GovPolicyComplianceSummary
            }
        }
        "4" {
            $sub = Read-Host "Enter subscription ID (leave blank for current)"
            if ($sub) {
                Get-GovNonCompliantResources -SubscriptionId $sub
            }
            else {
                Get-GovNonCompliantResources
            }
        }
        "5" {
            $sub = Read-Host "Enter subscription ID (leave blank for current)"
            if ($sub) {
                New-GovDashboardReport -SubscriptionId $sub
            }
            else {
                New-GovDashboardReport
            }
        }
        "6" {
            $sub = Read-Host "Enter subscription ID"
            if ($sub) {
                New-GovAssessmentReport -SubscriptionId $sub
            }
            else {
                Write-Host "Subscription ID is required" -ForegroundColor Red
            }
        }
        "Q" {
            return
        }
        default {
            Write-Host "Invalid choice" -ForegroundColor Red
        }
    }
}
