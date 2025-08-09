# Deploy ICT Governance Framework Infrastructure
# This script deploys the core infrastructure and policy assignments for the ICT Governance Framework

# Parameters
param (
    [Parameter(Mandatory = $true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory = $false)]
    [string]$EnvironmentName = "dev",
    
    [Parameter(Mandatory = $false)]
    [string]$OrganizationName = "contoso",
    
    [Parameter(Mandatory = $false)]
    [bool]$EnableDiagnostics = $true,
    
    [Parameter(Mandatory = $false)]
    [bool]$EnableRemediation = $false,
    
    [Parameter(Mandatory = $false)]
    [string]$OwnerName = "IT Governance Team",
    
    [Parameter(Mandatory = $false)]
    [string]$CostCenter = "IT-12345"
)

# Import required modules
Import-Module Az.Accounts
Import-Module Az.Resources

# Connect to Azure and set subscription context
try {
    # Check if already connected
    $context = Get-AzContext
    
    if (!$context -or $context.Subscription.Id -ne $SubscriptionId) {
        # Connect or set context to the specified subscription
        if (!$context) {
            Connect-AzAccount
        }
        
        Set-AzContext -SubscriptionId $SubscriptionId
        Write-Host "Set context to subscription: $SubscriptionId" -ForegroundColor Green
    }
}
catch {
    Write-Error "Failed to connect to Azure or set subscription context: $_"
    exit 1
}

# Create resource group if it doesn't exist
try {
    $resourceGroup = Get-AzResourceGroup -Name $ResourceGroupName -ErrorAction SilentlyContinue
    
    if (!$resourceGroup) {
        Write-Host "Creating resource group: $ResourceGroupName in $Location" -ForegroundColor Yellow
        $resourceGroup = New-AzResourceGroup -Name $ResourceGroupName -Location $Location -Tag @{
            Environment = $EnvironmentName
            Owner = $OwnerName
            CostCenter = $CostCenter
            Application = "ICT Governance Framework"
            ManagedBy = "PowerShell"
        }
    }
    else {
        Write-Host "Resource group already exists: $ResourceGroupName" -ForegroundColor Cyan
    }
}
catch {
    Write-Error "Failed to create or get resource group: $_"
    exit 1
}

# Deploy core infrastructure
try {
    Write-Host "Deploying core infrastructure..." -ForegroundColor Yellow
    
    $coreDeploymentParams = @{
        location = $Location
        environmentName = $EnvironmentName
        organizationName = $OrganizationName
        ownerName = $OwnerName
        costCenter = $CostCenter
        enableDiagnostics = $EnableDiagnostics
    }
    
    # What-if deployment to preview changes
    Write-Host "Previewing core infrastructure deployment..." -ForegroundColor Cyan
    New-AzResourceGroupDeployment -Name "ICTGov-Core-WhatIf" -ResourceGroupName $ResourceGroupName `
        -TemplateFile "./infra/core-infrastructure.bicep" -TemplateParameterObject $coreDeploymentParams `
        -WhatIf
    
    # Prompt for confirmation
    $confirmation = Read-Host "Do you want to proceed with the core infrastructure deployment? (Y/N)"
    if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
        Write-Host "Core infrastructure deployment cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    # Actual deployment
    $coreDeployment = New-AzResourceGroupDeployment -Name "ICTGov-Core-Deployment" -ResourceGroupName $ResourceGroupName `
        -TemplateFile "./infra/core-infrastructure.bicep" -TemplateParameterObject $coreDeploymentParams
    
    Write-Host "Core infrastructure deployed successfully." -ForegroundColor Green
    Write-Host "Log Analytics Workspace: $($coreDeployment.Outputs.logAnalyticsWorkspaceName.Value)" -ForegroundColor Green
    Write-Host "Storage Account: $($coreDeployment.Outputs.storageAccountName.Value)" -ForegroundColor Green
    Write-Host "Key Vault: $($coreDeployment.Outputs.keyVaultName.Value)" -ForegroundColor Green
}
catch {
    Write-Error "Failed to deploy core infrastructure: $_"
    exit 1
}

# Deploy policy assignments
try {
    Write-Host "Deploying policy assignments..." -ForegroundColor Yellow
    
    $policyDeploymentParams = @{
        location = $Location
        policyAssignmentScope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName"
        enableRemediation = $EnableRemediation
        requiredTags = @("Owner", "CostCenter", "Environment", "Application")
        commonTags = @{
            Environment = $EnvironmentName
            Owner = $OwnerName
            CostCenter = $CostCenter
            Application = "ICT Governance Framework"
            ManagedBy = "PowerShell"
        }
    }
    
    # What-if deployment to preview changes
    Write-Host "Previewing policy assignments deployment..." -ForegroundColor Cyan
    New-AzResourceGroupDeployment -Name "ICTGov-Policy-WhatIf" -ResourceGroupName $ResourceGroupName `
        -TemplateFile "./infra/policy-assignments.bicep" -TemplateParameterObject $policyDeploymentParams `
        -WhatIf
    
    # Prompt for confirmation
    $confirmation = Read-Host "Do you want to proceed with the policy assignments deployment? (Y/N)"
    if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
        Write-Host "Policy assignments deployment cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    # Actual deployment
    $policyDeployment = New-AzResourceGroupDeployment -Name "ICTGov-Policy-Deployment" -ResourceGroupName $ResourceGroupName `
        -TemplateFile "./infra/policy-assignments.bicep" -TemplateParameterObject $policyDeploymentParams
    
    # Store policy deployment outputs for later use
    $policyAssignmentIds = @{
        RequiredTags = $policyDeployment.Outputs.requiredTagsPolicyAssignmentId.Value
        HttpsStorage = $policyDeployment.Outputs.httpsStoragePolicyAssignmentId.Value
        KeyVaultNetwork = $policyDeployment.Outputs.keyVaultNetworkPolicyAssignmentId.Value
        ResourceLocks = $policyDeployment.Outputs.resourceLocksPolicyAssignmentId.Value
        VmVulnerability = $policyDeployment.Outputs.vmVulnerabilityPolicyAssignmentId.Value
    }
    
    Write-Host "Policy assignments deployed successfully." -ForegroundColor Green
}
catch {
    Write-Error "Failed to deploy policy assignments: $_"
    exit 1
}

# Wait for policy assignments to be created before checking compliance
Start-Sleep -Seconds 60

# Run initial compliance scan
try {
    Write-Host "Running initial compliance scan..." -ForegroundColor Yellow
    
    # Import ICT Governance Framework PowerShell module
    . ./ICT-Governance-Framework.ps1
    
    # Initialize the framework
    Initialize-GovFramework
    
    # Get policy compliance summary
    $complianceSummary = Get-GovPolicyComplianceSummary -SubscriptionId $SubscriptionId `
        -OutputPath "./governance-reports/initial-compliance-summary.json"
    
    # Get non-compliant resources
    Get-GovNonCompliantResources -SubscriptionId $SubscriptionId `
        -OutputPath "./governance-reports/initial-non-compliant-resources.json"
    
    # Generate dashboard report
    $dashboardPath = New-GovDashboardReport -SubscriptionId $SubscriptionId `
        -OutputPath "./governance-reports/initial-dashboard.html"
    
    Write-Host "Initial compliance scan completed." -ForegroundColor Green
    Write-Host "Compliance Rate: $($complianceSummary.ComplianceRate)%" -ForegroundColor Cyan
    Write-Host "Dashboard Report: $dashboardPath" -ForegroundColor Cyan
}
catch {
    Write-Warning "Failed to run initial compliance scan: $_"
    # Continue execution even if compliance scan fails
}

# Display completion message
Write-Host "ICT Governance Framework infrastructure deployed successfully!" -ForegroundColor Green
Write-Host "Subscription: $SubscriptionId" -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Green
Write-Host "Log Analytics Workspace: $($coreDeployment.Outputs.logAnalyticsWorkspaceName.Value)" -ForegroundColor Green
Write-Host "Storage Account: $($coreDeployment.Outputs.storageAccountName.Value)" -ForegroundColor Green
Write-Host "Key Vault: $($coreDeployment.Outputs.keyVaultName.Value)" -ForegroundColor Green

Write-Host "`nPolicy Assignments:" -ForegroundColor Cyan
Write-Host "Required Tags Policy: $($policyAssignmentIds.RequiredTags)" -ForegroundColor Cyan
Write-Host "HTTPS Storage Policy: $($policyAssignmentIds.HttpsStorage)" -ForegroundColor Cyan
Write-Host "Key Vault Network Policy: $($policyAssignmentIds.KeyVaultNetwork)" -ForegroundColor Cyan
Write-Host "Resource Locks Policy: $($policyAssignmentIds.ResourceLocks)" -ForegroundColor Cyan
Write-Host "VM Vulnerability Policy: $($policyAssignmentIds.VmVulnerability)" -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Review the initial compliance dashboard" -ForegroundColor Yellow
Write-Host "2. Set up scheduled tasks for regular compliance reporting" -ForegroundColor Yellow
Write-Host "3. Configure alerting for non-compliant resources" -ForegroundColor Yellow
Write-Host "4. Customize policy assignments for your organization's requirements" -ForegroundColor Yellow
