<#
Deploy-ICTGovernanceFramework.ps1

Consolidated deployment script that:
- validates Bicep is installed
- validates Azure location against Get-AzLocation
- creates resource group if missing
- deploys core infrastructure and policy assignments with WhatIf previews
- runs a best-effort initial compliance scan
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param (
    [Parameter(Mandatory = $true)]
    [string]$SubscriptionId,

    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory = $false)]
    [string]$Location = "eastus",

    [Parameter(Mandatory = $false)]
    [ValidateSet('dev','test','prod')]
    [string]$EnvironmentName = 'dev',

    [Parameter(Mandatory = $false)]
    [string]$OrganizationName = 'contoso',

    [Parameter(Mandatory = $false)]
    [bool]$EnableDiagnostics = $true,

    [Parameter(Mandatory = $false)]
    [bool]$EnableRemediation = $false,

    [Parameter(Mandatory = $false)]
    [string]$OwnerName = 'IT Governance Team',

    [Parameter(Mandatory = $false)]
    [string]$CostCenter = 'IT-12345'
)

# Auto-add common user bicep folder to PATH for this session if present
$userBicepDir = Join-Path $env:USERPROFILE '.Azure\bin'
if (-not (Get-Command bicep -ErrorAction SilentlyContinue)) {
    $userBicepExe = Join-Path $userBicepDir 'bicep.exe'
    if (Test-Path $userBicepExe) {
        if (-not ($env:Path.Split(';') -contains $userBicepDir)) {
            $env:Path = "$env:Path;$userBicepDir"
            Write-Host "Added $userBicepDir to PATH for current session." -ForegroundColor Green
        }
    }
}

# Ensure Bicep CLI is available
if (-not (Get-Command bicep -ErrorAction SilentlyContinue)) {
    Write-Error "Bicep CLI is not installed or not in your PATH. Please visit https://aka.ms/bicep-install to install it before running this script."
    return
}

# Import Az modules (will throw if not installed)
Import-Module Az.Accounts -ErrorAction Stop
Import-Module Az.Resources -ErrorAction Stop

try {
    Write-Host "Setting context to subscription: $SubscriptionId" -ForegroundColor Cyan
    Set-AzContext -SubscriptionId $SubscriptionId -ErrorAction Stop | Out-Null
}
catch {
    Write-Error "Failed to set Az context to subscription ${SubscriptionId}: $($_)"
    throw
}

# Validate location
$availableLocations = (Get-AzLocation).Location
while ($availableLocations -notcontains $Location) {
    Write-Warning "The location '$Location' is not valid for this subscription."
    Write-Host "Please choose from the following available locations:"
    Write-Host ($availableLocations -join ', ')
    $Location = Read-Host "Enter a valid location"
}
Write-Host "Using valid location: $Location" -ForegroundColor Green

# Create resource group if missing
try {
    $rg = Get-AzResourceGroup -Name $ResourceGroupName -ErrorAction SilentlyContinue
    if (-not $rg) {
        Write-Host "Creating resource group: $ResourceGroupName in $Location" -ForegroundColor Cyan
        if ($PSCmdlet.ShouldProcess("resource group '$ResourceGroupName'", "Create")) {
            New-AzResourceGroup -Name $ResourceGroupName -Location $Location -Tag @{
                Environment = $EnvironmentName
                Owner = $OwnerName
                CostCenter = $CostCenter
                Application = 'ICT Governance Framework'
                ManagedBy = 'PowerShell'
            } -ErrorAction Stop | Out-Null
        }
    }
    else {
        Write-Host "Resource group already exists: $ResourceGroupName" -ForegroundColor Yellow
    }
}
catch {
    Write-Error "Failed to create or get resource group: $_"
    throw
}

# Deploy core infrastructure
try {
    Write-Host "Deploying core infrastructure..." -ForegroundColor Cyan
    $coreParams = @{
        location = $Location
        environmentName = $EnvironmentName
        organizationName = $OrganizationName
        ownerName = $OwnerName
        costCenter = $CostCenter
        enableDiagnostics = $EnableDiagnostics
    }

    $coreTemplate = Join-Path $PSScriptRoot 'infra/core-infrastructure.bicep'
    if (-not (Test-Path $coreTemplate)) {
        Write-Error "Core template not found: $coreTemplate"
        throw "Missing template"
    }

    New-AzResourceGroupDeployment -Name 'ICTGov-Core-WhatIf' -ResourceGroupName $ResourceGroupName -TemplateFile $coreTemplate -TemplateParameterObject $coreParams -WhatIf

    $confirm = Read-Host "Do you want to proceed with the core infrastructure deployment? (Y/N)";
    if ($confirm -ne 'Y' -and $confirm -ne 'y') {
        Write-Host "Core infrastructure deployment cancelled by user." -ForegroundColor Yellow
    }
    else {
        $coreDeployment = New-AzResourceGroupDeployment -Name 'ICTGov-Core-Deployment' -ResourceGroupName $ResourceGroupName -TemplateFile $coreTemplate -TemplateParameterObject $coreParams -ErrorAction Stop
        if ($coreDeployment.ProvisioningState -ne 'Succeeded') {
            throw "Core deployment failed"
        }
        Write-Host "Core infrastructure deployed successfully." -ForegroundColor Green
    }
}
catch {
    Write-Error "Failed to deploy core infrastructure: $_"
    throw
}

# Deploy policy assignments
try {
    Write-Host "Deploying policy assignments..." -ForegroundColor Cyan
    $policyParams = @{
        location = $Location
        policyAssignmentScope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName"
        enableRemediation = $EnableRemediation
        requiredTags = @('Owner','CostCenter','Environment','Application')
        commonTags = @{
            Environment = $EnvironmentName
            Owner = $OwnerName
            CostCenter = $CostCenter
            Application = 'ICT Governance Framework'
            ManagedBy = 'PowerShell'
        }
    }

    $policyTemplate = Join-Path $PSScriptRoot 'infra/policy-assignments.bicep'
    if (-not (Test-Path $policyTemplate)) {
        Write-Error "Policy template not found: $policyTemplate"
        throw "Missing template"
    }

    New-AzResourceGroupDeployment -Name 'ICTGov-Policy-WhatIf' -ResourceGroupName $ResourceGroupName -TemplateFile $policyTemplate -TemplateParameterObject $policyParams -WhatIf

    $confirm = Read-Host "Do you want to proceed with the policy assignments deployment? (Y/N)";
    if ($confirm -ne 'Y' -and $confirm -ne 'y') {
        Write-Host "Policy assignments deployment cancelled by user." -ForegroundColor Yellow
    }
    else {
        $policyDeployment = New-AzResourceGroupDeployment -Name 'ICTGov-Policy-Deployment' -ResourceGroupName $ResourceGroupName -TemplateFile $policyTemplate -TemplateParameterObject $policyParams -ErrorAction Stop
        Write-Host "Policy assignments deployed successfully." -ForegroundColor Green

        # capture outputs if present
        $policyAssignmentIds = @{}
        if ($policyDeployment.Outputs) {
            foreach ($k in $policyDeployment.Outputs.Keys) {
                $policyAssignmentIds[$k] = $policyDeployment.Outputs[$k].Value
            }
        }
    }
}
catch {
    Write-Error "Failed to deploy policy assignments: $_"
    throw
}

# Wait briefly for policies to register
Start-Sleep -Seconds 30

# Run initial compliance scan (best-effort)
try {
    Write-Host "Running initial compliance scan..." -ForegroundColor Cyan
    # Import the local module if available
    $modulePath = Join-Path $PSScriptRoot 'ICT-Governance-Framework.ps1'
    if (Test-Path $modulePath) {
        . $modulePath
        if (Get-Command -Name Initialize-GovFramework -ErrorAction SilentlyContinue) {
            Initialize-GovFramework
        }
    }

    $compliancePath = Join-Path $PSScriptRoot 'governance-reports/initial-compliance-summary.json'
    $nonCompliantPath = Join-Path $PSScriptRoot 'governance-reports/initial-non-compliant-resources.json'

    Get-GovPolicyComplianceSummary -SubscriptionId $SubscriptionId -OutputPath $compliancePath -ErrorAction SilentlyContinue | Out-Null
    Get-GovNonCompliantResources -SubscriptionId $SubscriptionId -OutputPath $nonCompliantPath -ErrorAction SilentlyContinue | Out-Null

    New-GovDashboardReport -SubscriptionId $SubscriptionId -OutputPath (Join-Path $PSScriptRoot 'governance-reports/initial-dashboard.html') -ErrorAction SilentlyContinue
    Write-Host "Initial compliance scan (best-effort) completed." -ForegroundColor Green
}
catch {
    Write-Warning "Initial compliance scan failed or tools not available: $_"
}

# Summary output
Write-Host "ICT Governance Framework infrastructure process completed." -ForegroundColor Green
Write-Host "Subscription: $SubscriptionId" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Cyan
if ($coreDeployment -and $coreDeployment.Outputs) {
    Write-Host "Log Analytics Workspace: $($coreDeployment.Outputs.logAnalyticsWorkspaceName.Value)" -ForegroundColor Cyan
    Write-Host "Storage Account: $($coreDeployment.Outputs.storageAccountName.Value)" -ForegroundColor Cyan
    Write-Host "Key Vault: $($coreDeployment.Outputs.keyVaultName.Value)" -ForegroundColor Cyan
}

if ($policyAssignmentIds) {
    Write-Host "Policy Assignments:" -ForegroundColor Cyan
    $policyAssignmentIds.GetEnumerator() | ForEach-Object { Write-Host " - $($_.Key): $($_.Value)" }
}

Write-Host "Next Steps: Review governance reports in the governance-reports folder." -ForegroundColor Yellow
