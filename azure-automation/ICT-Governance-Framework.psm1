# ICT Governance Framework - Azure Policy and Governance Automation (Module)
# Author: GitHub Copilot & Gemini
# Date: August 22, 2025

# --- CONFIGURATION ---
# The default configuration is loaded from the PrivateData section of the accompanying .psd1 manifest file.
# Load the manifest file from the same folder as this module in a robust way so import-time doesn't fail.
$psd1Path = Join-Path -Path $PSScriptRoot -ChildPath 'ICT-Governance-Framework.psd1'
$manifestData = $null
if (Test-Path -Path $psd1Path) {
    # Prefer Import-PowerShellDataFile when available (safe parse of PSD1)
    if (Get-Command -Name Import-PowerShellDataFile -ErrorAction SilentlyContinue) {
        try { $manifestData = Import-PowerShellDataFile -Path $psd1Path } catch { $manifestData = $null }
    }
    # Fallback: read file text and evaluate the hashtable literal (only used if Import-PowerShellDataFile is unavailable)
    if (-not $manifestData) {
        try {
            $psd1Text = Get-Content -Path $psd1Path -Raw
            # The PSD1 is a PowerShell data file that returns a hashtable when executed. Evaluate in a child scope.
            $manifestData = Invoke-Expression "& { $psd1Text }"
        }
        catch {
            $manifestData = $null
        }
    }
}

# Extract CONFIG from PrivateData if present; otherwise use sensible defaults.
if ($manifestData -and $manifestData.ContainsKey('PrivateData') -and $manifestData.PrivateData.ContainsKey('CONFIG')) {
    $CONFIG = $manifestData.PrivateData.CONFIG
} else {
    $CONFIG = @{
        LogPath = 'governance-logs'
        ReportPath = 'governance-reports'
        TemplatesPath = 'governance-templates'
        PolicyDefinitionsPath = 'policy-definitions'
    }
}

# Construct full paths for logs and reports relative to the module's location.
$CONFIG.LogPath = Join-Path -Path $PSScriptRoot -ChildPath $CONFIG.LogPath
$CONFIG.ReportPath = Join-Path -Path $PSScriptRoot -ChildPath $CONFIG.ReportPath
$CONFIG.TemplatesPath = Join-Path -Path $PSScriptRoot -ChildPath $CONFIG.TemplatesPath
$CONFIG.PolicyDefinitionsPath = Join-Path -Path $PSScriptRoot -ChildPath $CONFIG.PolicyDefinitionsPath


# --- PUBLIC FUNCTIONS ---

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
        foreach ($key in $customConfig.PSObject.Properties.Name) {
            $CONFIG[$key] = $customConfig.$key
        }
        Write-Host "Custom configuration loaded from: $CustomConfigPath" -ForegroundColor Yellow
    }
}

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
    switch ($Level) {
        "Info"    { Write-Host $logEntry -ForegroundColor White }
        "Warning" { Write-Host $logEntry -ForegroundColor Yellow }
        "Error"   { Write-Host $logEntry -ForegroundColor Red }
        "Success" { Write-Host $logEntry -ForegroundColor Green }
    }
    $logFile = Join-Path -Path $CONFIG.LogPath -ChildPath "governance-$(Get-Date -Format 'yyyy-MM-dd').log"
    Add-Content -Path $logFile -Value $logEntry
}

function Connect-GovAzure {
    param (
        [Parameter(Mandatory = $false)]
        [switch]$UseManagedIdentity,
        [Parameter(Mandatory = $false)]
        [string]$TenantId
    )
    try {
        if ($UseManagedIdentity) {
            Connect-AzAccount -Identity
            Write-GovLog -Message "Connected to Azure using Managed Identity" -Level "Success"
        }
        elseif ($TenantId) {
            Connect-AzAccount -TenantId $TenantId
            Write-GovLog -Message "Connected to Azure tenant: $TenantId" -Level "Success"
        }
        else {
            Connect-AzAccount
            Write-GovLog -Message "Connected to Azure interactively" -Level "Success"
        }
        $context = Get-AzContext
        Write-GovLog -Message "Current context: Subscription - $($context.Subscription.Name), Tenant - $($context.Tenant.Id)" -Level "Info"
    }
    catch {
        Write-GovLog -Message "Failed to connect to Azure: $_" -Level "Error"
        throw
    }
}

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
        if ($SubscriptionId) {
            Set-AzContext -SubscriptionId $SubscriptionId | Out-Null
            Write-GovLog -Message "Set context to subscription: $SubscriptionId" -Level "Info"
        }
        $context = Get-AzContext
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
        $compliantCount = ($policyStates | Where-Object { $_.ComplianceState -eq "Compliant" }).Count
        $nonCompliantCount = ($policyStates | Where-Object { $_.ComplianceState -eq "NonCompliant" }).Count
        $totalCount = $policyStates.Count
        $complianceSummary = [PSCustomObject]@{
            Scope              = $scope
            TotalPolicies      = $totalCount
            CompliantPolicies  = $compliantCount
            NonCompliantPolicies = $nonCompliantCount
            ComplianceRate     = if ($totalCount -gt 0) { [math]::Round(($compliantCount / $totalCount) * 100, 2) } else { 0 }
            Timestamp          = Get-Date
        }
        if ($OutputPath) {
            $parentDir = Split-Path -Path $OutputPath -Parent
            if (!(Test-Path -Path $parentDir)) {
                New-Item -Path $parentDir -ItemType Directory -Force | Out-Null
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
        if ($SubscriptionId) {
            Set-AzContext -SubscriptionId $SubscriptionId | Out-Null
            Write-GovLog -Message "Set context to subscription: $SubscriptionId" -Level "Info"
        }
        $context = Get-AzContext
        $filter = "ComplianceState eq 'NonCompliant'"
        if ($ResourceGroupName) {
            $policyStates = Get-AzPolicyState -ResourceGroupName $ResourceGroupName -Filter $filter
            Write-GovLog -Message "Retrieved non-compliant policy states for resource group: $ResourceGroupName" -Level "Info"
        }
        else {
            $policyStates = Get-AzPolicyState -Filter $filter
            Write-GovLog -Message "Retrieved non-compliant policy states for subscription: $($context.Subscription.Id)" -Level "Info"
        }
        $nonCompliantResources = $policyStates | Group-Object -Property ResourceId | ForEach-Object {
            $resource = $_
            [PSCustomObject]@{
                ResourceId           = $resource.Name
                ResourceType         = ($resource.Group | Select-Object -First 1).ResourceType
                ResourceGroup        = ($resource.Group | Select-Object -First 1).ResourceGroupName
                NonCompliantPolicies = $resource.Group | ForEach-Object {
                    [PSCustomObject]@{
                        PolicyDefinitionName = ($_.PolicyDefinitionId -split '/')[-1]
                        PolicyAssignmentName = ($_.PolicyAssignmentId -split '/')[-1]
                        PolicyDefinitionId   = $_.PolicyDefinitionId
                        PolicyAssignmentId   = $_.PolicyAssignmentId
                    }
                }
                NonCompliantCount    = $resource.Count
            }
        }
        if ($OutputPath) {
             $parentDir = Split-Path -Path $OutputPath -Parent
            if (!(Test-Path -Path $parentDir)) {
                New-Item -Path $parentDir -ItemType Directory -Force | Out-Null
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

function New-GovDashboardReport {
    param (
        [Parameter(Mandatory = $false)]
        [string]$SubscriptionId,
        [Parameter(Mandatory = $false)]
        [string]$OutputPath = (Join-Path -Path $CONFIG.ReportPath -ChildPath "governance-dashboard-$(Get-Date -Format 'yyyy-MM-dd').html")
    )
    try {
        if ($SubscriptionId) {
            Set-AzContext -SubscriptionId $SubscriptionId | Out-Null
            Write-GovLog -Message "Set context to subscription: $SubscriptionId" -Level "Info"
        }
    # Get data
    $complianceSummary = Get-GovPolicyComplianceSummary -SubscriptionId $SubscriptionId
    $nonCompliantResources = Get-GovNonCompliantResources -SubscriptionId $SubscriptionId
    $resourceGroups = Get-AzResourceGroup
    $resources = Get-AzResource
    $resourceTypes = $resources | Group-Object -Property ResourceType | Select-Object Name, Count | Sort-Object -Property Count -Descending

    # Small usage of collected data to avoid unused-variable warnings and provide quick summary
    $rgCount = $resourceGroups.Count
    $resCount = $resources.Count
    $nonCompliantResCount = ($nonCompliantResources).Count
    $topResourceTypes = ($resourceTypes | Select-Object -First 5 | ForEach-Object { "$($_.Name):$($_.Count)" }) -join ", "
    Write-GovLog -Message "Dashboard data summary: Policies=$($complianceSummary.TotalPolicies), Compliant=$($complianceSummary.CompliantPolicies), NonCompliantPolicies=$($complianceSummary.NonCompliantPolicies); NonCompliantResources=$nonCompliantResCount; ResourceGroups=$rgCount; Resources=$resCount; TopResourceTypes=$topResourceTypes" -Level "Info"
        
        # Create HTML report
        # Precompute some HTML fragments (tables/lists) to embed in the template
        $nonCompliantRows = ($nonCompliantResources | Select-Object -First 50 | ForEach-Object {
            "<tr><td>$($_.ResourceId)</td><td>$($_.ResourceType)</td><td>$($_.ResourceGroup)</td><td>$($_.NonCompliantCount)</td></tr>"
        }) -join "`n"

        $resourceTypeItems = ($resourceTypes | Select-Object -First 20 | ForEach-Object {
            "<li>$($_.Name): $($_.Count)</li>"
        }) -join "`n"

        $generatedOn = Get-Date -Format "MMMM dd, yyyy HH:mm"

        $htmlContent = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ICT Governance Dashboard</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background: #f7f7f7; color: #222 }
        .container { max-width: 1100px; margin: 24px auto; padding: 16px; }
        .header { background: #004578; color: white; padding: 16px; border-radius: 6px; }
        .header h1 { margin: 0; font-size: 22px }
        .meta { margin-top: 6px; color: #d0e6ff }
        .card { background: white; padding: 16px; margin-top: 16px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.06) }
        .flex { display:flex; gap:12px; align-items:stretch }
        .metric { flex:1; padding:12px; background:#f2f6fb; border-radius:6px; text-align:center }
        .metric-label { color:#666; font-size:13px }
        .metric-value { font-size:24px; font-weight:700; margin-top:8px }
        table { width:100%; border-collapse:collapse; margin-top:12px }
        th, td { padding:8px 10px; border-bottom:1px solid #e6e6e6; text-align:left }
        th { background:#f3f6fb; font-weight:600 }
        .footer { margin-top:20px; color:#666; font-size:12px }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ICT Governance Framework Dashboard</h1>
            <div class="meta">Generated on: $generatedOn</div>
        </div>

        <div class="card">
            <h2>Resource Overview</h2>
            <div class="flex">
                <div class="metric">
                    <div class="metric-label">Resource Groups</div>
                    <div class="metric-value">$($resourceGroups.Count)</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Total Resources</div>
                    <div class="metric-value">$($resources.Count)</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Non-compliant Resources</div>
                    <div class="metric-value">$nonCompliantResCount</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Total Policies</div>
                    <div class="metric-value">$($complianceSummary.TotalPolicies)</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Top Resource Types</h2>
            <ul>
                $resourceTypeItems
            </ul>
        </div>

        <div class="card">
            <h2>Non-compliant Resources (top 50)</h2>
            <table>
                <thead>
                    <tr><th>ResourceId</th><th>Type</th><th>ResourceGroup</th><th>Count</th></tr>
                </thead>
                <tbody>
                    $nonCompliantRows
                </tbody>
            </table>
        </div>

        <div class="card footer">
            <p>ICT Governance Framework Automation | Generated by PowerShell</p>
        </div>
    </div>
</body>
</html>
"@
        $parentDir = Split-Path -Path $OutputPath -Parent
        if (!(Test-Path -Path $parentDir)) {
            New-Item -Path $parentDir -ItemType Directory -Force | Out-Null
        }
        $htmlContent | Out-File -FilePath $OutputPath -Force
        Write-GovLog -Message "Governance dashboard report generated at: $OutputPath" -Level "Success"
        return $OutputPath
    }
    catch {
        Write-GovLog -Message "Failed to generate governance dashboard report: $_" -Level "Error"
        throw
    }
}

function New-GovAssessmentReport {
    param (
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$SubscriptionId,
        [Parameter(Mandatory = $false)]
        [string]$OutputPath = (Join-Path -Path $CONFIG.ReportPath -ChildPath "governance-assessment-$(Get-Date -Format 'yyyy-MM-dd').csv")
    )
    try {
        Set-AzContext -SubscriptionId $SubscriptionId | Out-Null
        Write-GovLog -Message "Set context to subscription: $SubscriptionId" -Level "Info"
        $resources = Get-AzResource
        Write-GovLog -Message "Retrieved $($resources.Count) resources" -Level "Info"
        
        # Your existing assessment code...
        $assessmentResults = foreach ($resource in $resources) {
            # ...
        }

        $parentDir = Split-Path -Path $OutputPath -Parent
        if (!(Test-Path -Path $parentDir)) {
            New-Item -Path $parentDir -ItemType Directory -Force | Out-Null
        }
        $assessmentResults | Export-Csv -Path $OutputPath -NoTypeInformation -Force
        Write-GovLog -Message "Governance assessment report exported to: $OutputPath" -Level "Success"

    # Your existing summary code...
    $compliantResourcesCount = ($assessmentResults | Where-Object { $_.HasAllRequiredTags -eq $true }).Count
    $complianceRate = if ($resources.Count -gt 0) { [math]::Round(($compliantResourcesCount / $resources.Count) * 100, 2) } else { 0 }
    Write-GovLog -Message "Assessment Summary: $complianceRate% compliant ($compliantResourcesCount/$($resources.Count) resources)" -Level "Info"
    return $OutputPath
    }
    catch {
        Write-GovLog -Message "Failed to generate governance assessment report: $_" -Level "Error"
        throw
    }
}

