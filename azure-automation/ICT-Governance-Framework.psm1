# ICT Governance Framework - Azure Policy and Governance Automation (Module)
# Author: GitHub Copilot & Gemini
# --- ROBUST CONFIGURATION ---
# This block defensively constructs the $CONFIG object to avoid property-setting exceptions.

# Prefer reading the module manifest file directly so we don't depend on runtime module naming.
$manifestPath = Join-Path -Path $PSScriptRoot -ChildPath 'ICT-Governance-Framework.psd1'
$configFromManifest = $null
if (Test-Path -Path $manifestPath) {
    try {
        $manifestData = Import-PowerShellDataFile -Path $manifestPath
        if ($manifestData -and $manifestData.PrivateData -and $manifestData.PrivateData.ContainsKey('CONFIG')) {
            $configFromManifest = $manifestData.PrivateData['CONFIG']
        }
    }
    catch {
        Write-Warning "Unable to read module manifest at '$manifestPath'. Falling back to defaults. Error: $_"
        $configFromManifest = $null
    }
}

# Build a NEW, guaranteed-writable PSCustomObject for our configuration using manifest values when available.
$CONFIG = [PSCustomObject]@{
    LogPath               = if ($configFromManifest -and $configFromManifest.LogPath) { Join-Path -Path $PSScriptRoot -ChildPath $configFromManifest.LogPath } else { Join-Path -Path $PSScriptRoot -ChildPath 'governance-logs' }
    ReportPath            = if ($configFromManifest -and $configFromManifest.ReportPath) { Join-Path -Path $PSScriptRoot -ChildPath $configFromManifest.ReportPath } else { Join-Path -Path $PSScriptRoot -ChildPath 'governance-reports' }
    TemplatesPath         = if ($configFromManifest -and $configFromManifest.TemplatesPath) { Join-Path -Path $PSScriptRoot -ChildPath $configFromManifest.TemplatesPath } else { Join-Path -Path $PSScriptRoot -ChildPath 'governance-templates' }
    PolicyDefinitionsPath = if ($configFromManifest -and $configFromManifest.PolicyDefinitionsPath) { Join-Path -Path $PSScriptRoot -ChildPath $configFromManifest.PolicyDefinitionsPath } else { Join-Path -Path $PSScriptRoot -ChildPath 'policy-definitions' }
}

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
            try {
                $value = $customConfig.$key
                if ($CONFIG.PSObject.Properties.Match($key).Count -gt 0) {
                    # Property exists - assign directly
                    $CONFIG.$key = $value
                }
                else {
                    # Property missing - add it safely
                    $CONFIG | Add-Member -NotePropertyName $key -NotePropertyValue $value -Force
                }
            }
            catch {
                Write-Host "Warning: failed to apply custom config key '$key': $_" -ForegroundColor Yellow
            }
        }
        Write-Host "Custom configuration loaded from: $CustomConfigPath" -ForegroundColor Yellow
    }

    # --- ADD: create a template governance-config.json if it doesn't exist ---
    $configFilePath = Join-Path -Path $PSScriptRoot -ChildPath 'governance-config.json'
    if (-not (Test-Path -Path $configFilePath)) {
        $templateConfig = @{
            tenants = @(
                @{
                    name = "Example Tenant Name"
                    tenantId = "00000000-0000-0000-0000-000000000000"
                    subscriptions = @(
                        @{
                            name = "Example Subscription Name"
                            subscriptionId = "11111111-1111-1111-1111-111111111111"
                        }
                    )
                }
            )
        }
        $templateConfig | ConvertTo-Json -Depth 6 | Out-File -FilePath $configFilePath -Encoding utf8 -Force
        Write-Host "Template 'governance-config.json' created at: $configFilePath`nPlease update it with your tenant and subscription details." -ForegroundColor Yellow
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

    # Resolve log path locally without attempting to modify $CONFIG (which may be non-writable)
    $resolvedLogPath = $null
    try {
        if ($CONFIG -and $CONFIG.PSObject.Properties['LogPath']) {
            $candidate = [string]$CONFIG.LogPath
            if (-not [string]::IsNullOrWhiteSpace($candidate)) { $resolvedLogPath = $candidate }
        }
    } catch { $resolvedLogPath = $null }
    if ([string]::IsNullOrWhiteSpace($resolvedLogPath)) {
        $resolvedLogPath = Join-Path -Path $PSScriptRoot -ChildPath 'governance-logs'
    }

    try {
        if (-not (Test-Path -Path $resolvedLogPath)) {
            New-Item -Path $resolvedLogPath -ItemType Directory -Force | Out-Null
        }
        $logFile = Join-Path -Path $resolvedLogPath -ChildPath "governance-$(Get-Date -Format 'yyyy-MM-dd').log"
        Add-Content -Path $logFile -Value $logEntry -ErrorAction Stop
    }
    catch {
        # If file logging fails, write a warning to the host but do not throw.
        Write-Host "[Warning] Failed to write log to file: $_" -ForegroundColor Yellow
    }
}

function Connect-GovAzure {
    [CmdletBinding(DefaultParameterSetName = 'FromConfig')]
    param (
        [Parameter(Mandatory = $false, ParameterSetName = 'FromConfig')]
        [switch]$FromConfig,

        [Parameter(Mandatory = $false, ParameterSetName = 'AuditAll')]
        [switch]$AuditAll,

        [Parameter(Mandatory = $false, ParameterSetName = 'SingleTenant')]
        [string]$TenantId,

        [Parameter(Mandatory = $false, ParameterSetName = 'ManagedIdentity')]
        [switch]$UseManagedIdentity
    )

    try {
        # Ensure interactive login if required by these modes
        if ($PSCmdlet.ParameterSetName -in @('FromConfig', 'AuditAll', 'SingleTenant') -and -not (Get-AzContext -ErrorAction SilentlyContinue)) {
            Write-GovLog -Message "No active Azure context. Initiating interactive login..." -Level "Info"
            Connect-AzAccount | Out-Null
            if (-not (Get-AzContext -ErrorAction SilentlyContinue)) {
                Write-GovLog -Message "Login failed or was cancelled. Aborting." -Level "Error"
                return $null
            }
        }

        switch ($PSCmdlet.ParameterSetName) {
            'FromConfig' {
                $configPath = Join-Path -Path $PSScriptRoot -ChildPath 'governance-config.json'
                if (-not (Test-Path -Path $configPath)) {
                    throw "Configuration file not found at '$configPath'. Please run Initialize-GovFramework to create a template."
                }
                $config = Get-Content -Path $configPath -Raw | ConvertFrom-Json

                # Build a flat list for user selection
                $selectionList = @()
                foreach ($tenant in $config.tenants) {
                    foreach ($sub in $tenant.subscriptions) {
                        $selectionList += [PSCustomObject]@{
                            DisplayText = "$($tenant.name) - $($sub.name)"
                            TenantId = $tenant.tenantId
                            SubscriptionId = $sub.subscriptionId
                        }
                    }
                }

                if ($selectionList.Count -eq 0) {
                    throw "No tenants or subscriptions found in '$configPath'. Please configure it."
                }

                # Present menu and get selection
                Write-Host "`nPlease select a subscription to connect to:" -ForegroundColor Cyan
                for ($i = 0; $i -lt $selectionList.Count; $i++) {
                    Write-Host ("{0,3}: {1}" -f ($i + 1), $selectionList[$i].DisplayText)
                }

                $choice = Read-Host "`nEnter your choice"
                $index = [int]$choice - 1

                if ($index -ge 0 -and $index -lt $selectionList.Count) {
                    $selection = $selectionList[$index]
                    Set-AzContext -TenantId $selection.TenantId -SubscriptionId $selection.SubscriptionId | Out-Null
                    Write-GovLog -Message "Successfully set context to subscription '$($selection.DisplayText)'" -Level "Success"
                } else {
                    Write-GovLog -Message "Invalid selection. No context was changed." -Level "Warning"
                }
            }

            'AuditAll' {
                Write-GovLog -Message "AUDIT MODE: Discovering all accessible tenants and subscriptions..." -Level "Warning"
                $tenants = Get-AzTenant -ErrorAction SilentlyContinue
                $allSubscriptions = @()
                foreach ($tenant in $tenants) {
                    try {
                        $subs = Get-AzSubscription -TenantId $tenant.Id -ErrorAction Stop
                        foreach ($s in $subs) {
                            $allSubscriptions += [PSCustomObject]@{ Tenant = $tenant; Subscription = $s }
                        }
                    }
                    catch {
                        Write-GovLog -Message "Skipping tenant $($tenant.Id) due to error: $_" -Level "Warning"
                    }
                }
                Write-GovLog -Message "Audit complete. Found $($allSubscriptions.Count) subscriptions across $($tenants.Count) tenants." -Level "Success"
                return $allSubscriptions
            }

            'SingleTenant' {
                Connect-AzAccount -TenantId $TenantId
                Write-GovLog -Message "Connected to Azure tenant: $TenantId" -Level "Success"
                return Get-AzContext -ErrorAction SilentlyContinue
            }

            'ManagedIdentity' {
                Connect-AzAccount -Identity
                Write-GovLog -Message "Connected to Azure using Managed Identity" -Level "Success"
                return Get-AzContext -ErrorAction SilentlyContinue
            }
        }

        # Default: return current context
        return Get-AzContext -ErrorAction SilentlyContinue
    }
    catch {
        Write-GovLog -Level 'Error' -Message ("An error occurred in Connect-GovAzure: {0}" -f $_.Exception.Message) -ErrorAction SilentlyContinue
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

