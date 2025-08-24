#!/usr/bin/env pwsh
# ICT Governance Framework - Main Menu
# This script provides a user-friendly interface to the ICT Governance Framework tools

# Clear the screen and display banner
Clear-Host
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "      ICT GOVERNANCE FRAMEWORK AUTOMATION TOOLKIT      " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "                                                       "

# Check if Az modules are installed
$requiredModules = @("Az.Accounts", "Az.Resources", "Az.PolicyInsights")
$missingModules = @()

foreach ($module in $requiredModules) {
    if (!(Get-Module -ListAvailable -Name $module)) {
        $missingModules += $module
    }
}

if ($missingModules.Count -gt 0) {
    Write-Host "Missing required PowerShell modules: $($missingModules -join ', ')" -ForegroundColor Yellow
    $installModules = Read-Host "Do you want to install these modules now? (Y/N)"
    
    if ($installModules -eq 'Y' -or $installModules -eq 'y') {
        foreach ($module in $missingModules) {
            Write-Host "Installing module: $module" -ForegroundColor Yellow
            Install-Module -Name $module -Scope CurrentUser -Force
        }
    }
    else {
        Write-Host "Please install the required modules before continuing." -ForegroundColor Red
        exit 1
    }
}

# Import ICT Governance Framework module (manifest) from module folder reliably
try {
    $modulePath = Join-Path -Path $PSScriptRoot -ChildPath 'ICT-Governance-Framework.psd1'
    if (Test-Path -Path $modulePath) {
        Import-Module -Name $modulePath -Force -ErrorAction Stop
    }
    else {
        Write-Host "Module manifest not found at $modulePath" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Failed to import ICT Governance Framework module: $_" -ForegroundColor Red
}

# Initialize the framework if the function is available
if (Get-Command -Name Initialize-GovFramework -ErrorAction SilentlyContinue) {
    Initialize-GovFramework
} else {
    Write-Host 'Initialize-GovFramework not available; ensure the module imported successfully.' -ForegroundColor Yellow
}

# CHANGE: minimal append-only logging setup
$logDir = Join-Path -Path $PSScriptRoot -ChildPath 'governance-logs'
if (-not (Test-Path -Path $logDir)) { New-Item -Path $logDir -ItemType Directory -Force | Out-Null }
$logFile = Join-Path -Path $logDir -ChildPath ("menu-log-$(Get-Date -Format 'yyyy-MM-dd').log")

function Write-Activity {
    param(
        [Parameter(Mandatory=$false)][ValidateSet('Info','Warning','Error','Success')][string]$Level = 'Info',
        [Parameter(Mandatory=$true)][string]$Message
    )
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $entry = "[$ts] [$Level] - $Message"
    # Prefer module-provided Write-GovLog when available, fallback to file append
    if (Get-Command -Name Write-GovLog -ErrorAction SilentlyContinue) {
        try { Write-GovLog -Level $Level -Message $Message -ErrorAction Stop } catch {
            # Guard against $logFile being null or the log directory missing
            if (-not $logFile) { $logFile = Join-Path -Path $PSScriptRoot -ChildPath ("menu-log-$(Get-Date -Format 'yyyy-MM-dd').log") }
            $logDirLocal = Split-Path -Path $logFile -Parent
            if (-not (Test-Path -Path $logDirLocal)) { New-Item -Path $logDirLocal -ItemType Directory -Force | Out-Null }
            Add-Content -Path $logFile -Value $entry -ErrorAction SilentlyContinue
        }
    }
    else {
        if (-not $logFile) { $logFile = Join-Path -Path $PSScriptRoot -ChildPath ("menu-log-$(Get-Date -Format 'yyyy-MM-dd').log") }
        $logDirLocal = Split-Path -Path $logFile -Parent
        if (-not (Test-Path -Path $logDirLocal)) { New-Item -Path $logDirLocal -ItemType Directory -Force | Out-Null }
        Add-Content -Path $logFile -Value $entry -ErrorAction SilentlyContinue
    }
}

# Log startup
Write-Activity -Level Info -Message "Menu started (user=$env:USERNAME)"

# Main menu function
function Show-MainMenu {
    Clear-Host
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "      ICT GOVERNANCE FRAMEWORK AUTOMATION TOOLKIT      " -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "                                                       "
    Write-Host "1. Connect to Azure" -ForegroundColor White
    Write-Host "2. Deploy ICT Governance Framework Infrastructure" -ForegroundColor White
    Write-Host "3. Run Compliance Reports" -ForegroundColor White
    Write-Host "4. Generate Governance Dashboard" -ForegroundColor White
    Write-Host "5. Run Governance Assessment" -ForegroundColor White
    Write-Host "6. View Documentation" -ForegroundColor White
    Write-Host "7. Exit" -ForegroundColor White
    Write-Host "                                                       "
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "                                                       "
    
    $choice = Read-Host "Enter your choice (1-7)"
    return $choice
}

# Function to handle Azure connection
function Connect-ToAzure {
    Clear-Host
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "                CONNECT TO AZURE                       " -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "                                                       "
    Write-Host "1. Connect to a Pre-Configured Subscription (Fastest)" -ForegroundColor White
    Write-Host "2. Discover All Subscriptions (Audit / First Time)" -ForegroundColor White
    Write-Host "3. Connect to a Specific Tenant ID" -ForegroundColor White
    Write-Host "4. Use Managed Identity" -ForegroundColor White
    Write-Host "5. Back to Main Menu" -ForegroundColor White
    Write-Host "                                                       "
    
    $choice = Read-Host "Enter your choice (1-5)"

    try {
        switch ($choice) {
            "1" { Connect-GovAzure -FromConfig }
            "2" { Connect-GovAzure -AuditAll | Out-Host }
            "3" {
                $tenantId = Read-Host "Enter Tenant ID"
                if (-not [string]::IsNullOrWhiteSpace($tenantId)) { Connect-GovAzure -TenantId $tenantId }
            }
            "4" { Connect-GovAzure -UseManagedIdentity }
            "5" { return }
            default { Write-Host "Invalid choice." -ForegroundColor Red }
        }
    }
    catch {
        Write-Host "`nAn error occurred during the connection process: $_" -ForegroundColor Red
    }
    Read-Host -Prompt 'Press Enter to continue'
}

# Function to handle deployment
function Invoke-Infrastructure {
    Clear-Host
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "     DEPLOY ICT GOVERNANCE FRAMEWORK INFRASTRUCTURE    " -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "                                                       "
    
    $subscriptionId = Read-Host "Enter Subscription ID"
    $resourceGroupName = Read-Host "Enter Resource Group Name"
    $location = Read-Host "Enter Location (press Enter for default: eastus)"
    if ([string]::IsNullOrWhiteSpace($location)) { $location = "eastus" }
    
    $environmentName = Read-Host "Enter Environment Name (dev, test, prod) (press Enter for default: dev)"
    if ([string]::IsNullOrWhiteSpace($environmentName)) { $environmentName = "dev" }
    
    $organizationName = Read-Host "Enter Organization Name (press Enter for default: contoso)"
    if ([string]::IsNullOrWhiteSpace($organizationName)) { $organizationName = "contoso" }
    
    $enableDiagnosticsInput = Read-Host "Enable Diagnostics? (Y/N) (press Enter for default: Y)"
    $enableDiagnostics = if ([string]::IsNullOrWhiteSpace($enableDiagnosticsInput) -or $enableDiagnosticsInput -eq 'Y' -or $enableDiagnosticsInput -eq 'y') { $true } else { $false }
    
    $enableRemediationInput = Read-Host "Enable Policy Remediation? (Y/N) (press Enter for default: N)"
    $enableRemediation = if ($enableRemediationInput -eq 'Y' -or $enableRemediationInput -eq 'y') { $true } else { $false }
    
    Write-Host "                                                       "
    Write-Host "Deployment parameters:" -ForegroundColor Yellow
    Write-Host "Subscription ID: $subscriptionId" -ForegroundColor Yellow
    Write-Host "Resource Group: $resourceGroupName" -ForegroundColor Yellow
    Write-Host "Location: $location" -ForegroundColor Yellow
    Write-Host "Environment: $environmentName" -ForegroundColor Yellow
    Write-Host "Organization: $organizationName" -ForegroundColor Yellow
    Write-Host "Enable Diagnostics: $enableDiagnostics" -ForegroundColor Yellow
    Write-Host "Enable Remediation: $enableRemediation" -ForegroundColor Yellow
    Write-Host "                                                       "
    
    $confirm = Read-Host "Proceed with deployment? (Y/N)"
    
    if ($confirm -match '^[Yy]') {
        try {
            $deployScript = Join-Path -Path $PSScriptRoot -ChildPath 'Deploy-ICTGovernanceFramework.ps1'
            if (Test-Path -Path $deployScript) {
                & $deployScript -SubscriptionId $subscriptionId -ResourceGroupName $resourceGroupName `
                    -Location $location -EnvironmentName $environmentName -OrganizationName $organizationName `
                    -EnableDiagnostics $enableDiagnostics -EnableRemediation $enableRemediation
            }
            else {
                Write-Host "Deploy script not found at $deployScript" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "Deployment failed: $_" -ForegroundColor Red
        }
    }
    Read-Host -Prompt 'Press Enter to continue'
}

# Function to handle compliance reports
function Get-ComplianceReports {
    Clear-Host
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "                RUN COMPLIANCE REPORTS                 " -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "                                                       "
    
    $subscriptionId = Read-Host "Enter Subscription ID (press Enter for current subscription)"
    $resourceGroupName = Read-Host "Enter Resource Group Name (optional)"
    
    $outputPath = Read-Host "Enter Output Path (press Enter for default path)"
    if ([string]::IsNullOrWhiteSpace($outputPath)) {
        $defaultDir = Join-Path -Path $PSScriptRoot -ChildPath 'governance-reports'
        if (-not (Test-Path -Path $defaultDir)) { New-Item -Path $defaultDir -ItemType Directory -Force | Out-Null }
        $outputPath = Join-Path -Path $defaultDir -ChildPath ("compliance-summary-$(Get-Date -Format 'yyyy-MM-dd').json")
    }
    
    Write-Host "Running compliance report..." -ForegroundColor Yellow
    try {
        if (![string]::IsNullOrWhiteSpace($subscriptionId) -and ![string]::IsNullOrWhiteSpace($resourceGroupName)) {
            $compliance = Get-GovPolicyComplianceSummary -SubscriptionId $subscriptionId -ResourceGroupName $resourceGroupName -OutputPath $outputPath
        }
        elseif (![string]::IsNullOrWhiteSpace($subscriptionId)) {
            $compliance = Get-GovPolicyComplianceSummary -SubscriptionId $subscriptionId -OutputPath $outputPath
        }
        else {
            $compliance = Get-GovPolicyComplianceSummary -OutputPath $outputPath
        }
    }
    catch {
        Write-Host "Failed to run compliance report: $_" -ForegroundColor Red
        Read-Host -Prompt 'Press Enter to continue'
        return
    }
    
    Write-Host "                                                       "
    Write-Host "Compliance Summary:" -ForegroundColor Green
    Write-Host "Scope: $($compliance.Scope)" -ForegroundColor Green
    Write-Host "Total Policies: $($compliance.TotalPolicies)" -ForegroundColor Green
    Write-Host "Compliant Policies: $($compliance.CompliantPolicies)" -ForegroundColor Green
    Write-Host "Non-Compliant Policies: $($compliance.NonCompliantPolicies)" -ForegroundColor Green
    Write-Host "Compliance Rate: $($compliance.ComplianceRate)%" -ForegroundColor Green
    Write-Host "                                                       "
    Write-Host "Report saved to: $outputPath" -ForegroundColor Green
    
    Read-Host -Prompt 'Press Enter to continue'
}

# Function to generate dashboard
function New-Dashboard {
    Clear-Host
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "             GENERATE GOVERNANCE DASHBOARD             " -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "                                                       "
    
    $subscriptionId = Read-Host "Enter Subscription ID (press Enter for current subscription)"
    
    $outputPath = Read-Host "Enter Output Path (press Enter for default path)"
    if ([string]::IsNullOrWhiteSpace($outputPath)) {
        $defaultDir = Join-Path -Path $PSScriptRoot -ChildPath 'governance-reports'
        if (-not (Test-Path -Path $defaultDir)) { New-Item -Path $defaultDir -ItemType Directory -Force | Out-Null }
        $outputPath = Join-Path -Path $defaultDir -ChildPath ("dashboard-$(Get-Date -Format 'yyyy-MM-dd').html")
    }
    
    Write-Host "Generating dashboard..." -ForegroundColor Yellow
    
    try {
        if (![string]::IsNullOrWhiteSpace($subscriptionId)) {
            $dashboardPath = New-GovDashboardReport -SubscriptionId $subscriptionId -OutputPath $outputPath
        }
        else {
            $dashboardPath = New-GovDashboardReport -OutputPath $outputPath
        }
    }
    catch {
        Write-Host "Failed to generate dashboard: $_" -ForegroundColor Red
        Read-Host -Prompt 'Press Enter to continue'
        return
    }
    
    Write-Host "                                                       "
    Write-Host "Dashboard generated successfully!" -ForegroundColor Green
    Write-Host "Dashboard saved to: $dashboardPath" -ForegroundColor Green
    Write-Host "                                                       "
    
    $openDashboard = Read-Host "Do you want to open the dashboard in your browser? (Y/N)"
    
    if ($openDashboard -match '^[Yy]') {
        # Open the dashboard in the default browser (cross-platform)
        try { Invoke-Item -Path $dashboardPath } catch { Start-Process -FilePath $dashboardPath }
    }
    Read-Host -Prompt 'Press Enter to continue'
}

# Function to run governance assessment
function Invoke-GovernanceAssessment {
    Clear-Host
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "              RUN GOVERNANCE ASSESSMENT                " -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "                                                       "
    
    $subscriptionId = Read-Host "Enter Subscription ID"
    
    if ([string]::IsNullOrWhiteSpace($subscriptionId)) {
        Write-Host "Subscription ID is required." -ForegroundColor Red
        Read-Host -Prompt 'Press Enter to continue'
        return
    }
    
    $outputPath = Read-Host "Enter Output Path (press Enter for default path)"
    if ([string]::IsNullOrWhiteSpace($outputPath)) {
        $defaultDir = Join-Path -Path $PSScriptRoot -ChildPath 'governance-reports'
        if (-not (Test-Path -Path $defaultDir)) { New-Item -Path $defaultDir -ItemType Directory -Force | Out-Null }
        $outputPath = Join-Path -Path $defaultDir -ChildPath ("assessment-$(Get-Date -Format 'yyyy-MM-dd').csv")
    }
    Write-Host "Running governance assessment..." -ForegroundColor Yellow
    try {
        $assessmentPath = New-GovAssessmentReport -SubscriptionId $subscriptionId -OutputPath $outputPath
        Write-Host "`nAssessment completed successfully!" -ForegroundColor Green
        Write-Host "Assessment report saved to: $assessmentPath" -ForegroundColor Green
    }
    catch {
        Write-Host "An error occurred during the assessment: $_" -ForegroundColor Red
    }
    Read-Host -Prompt 'Press Enter to continue'
}

# Function to view documentation
function Show-Documentation {
    Clear-Host
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "                  VIEW DOCUMENTATION                   " -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "                                                       "
    Write-Host "1. Framework Overview" -ForegroundColor White
    Write-Host "2. Installation Guide" -ForegroundColor White
    Write-Host "3. Usage Guide" -ForegroundColor White
    Write-Host "4. Back to Main Menu" -ForegroundColor White
    Write-Host "                                                       "
    
    $choice = Read-Host "Enter your choice (1-4)"
    
    switch ($choice) {
        "1" {
            Clear-Host
            Write-Host "=======================================================" -ForegroundColor Cyan
            Write-Host "                 FRAMEWORK OVERVIEW                    " -ForegroundColor Cyan
            Write-Host "=======================================================" -ForegroundColor Cyan
            Write-Host "                                                       "
            Write-Host "The ICT Governance Framework Automation provides tools to:"
            Write-Host "- Monitor and report on Azure Policy compliance"
            Write-Host "- Generate governance dashboards and reports"
            Write-Host "- Assess resources for compliance with tagging standards"
            Write-Host "- Track non-compliant resources and policy violations"
            Write-Host "- Automate governance controls and checks"
            Write-Host "                                                       "
            Write-Host "The framework consists of PowerShell scripts and Bicep templates"
            Write-Host "for deploying and managing governance controls in Azure."
            Write-Host "                                                       "
        Read-Host -Prompt 'Press Enter to continue'
        }
        "2" {
            Clear-Host
            Write-Host "=======================================================" -ForegroundColor Cyan
            Write-Host "                 INSTALLATION GUIDE                    " -ForegroundColor Cyan
            Write-Host "=======================================================" -ForegroundColor Cyan
            Write-Host "                                                       "
            Write-Host "Prerequisites:"
            Write-Host "- PowerShell 7.0 or later"
            Write-Host "- Az PowerShell modules: Az.Accounts, Az.Resources, Az.PolicyInsights"
            Write-Host "                                                       "
            Write-Host "Installation Steps:"
            Write-Host "1. Clone this repository or download the scripts"
            Write-Host "2. Import the module or run the scripts directly"
            Write-Host "3. Run the initialization function to set up the directory structure"
            Write-Host "4. Connect to Azure using the provided connection functions"
            Write-Host "5. Deploy the infrastructure using the deployment script"
            Write-Host "                                                       "
        Read-Host -Prompt 'Press Enter to continue'
        }
        "3" {
            Clear-Host
            Write-Host "=======================================================" -ForegroundColor Cyan
            Write-Host "                    USAGE GUIDE                        " -ForegroundColor Cyan
            Write-Host "=======================================================" -ForegroundColor Cyan
            Write-Host "                                                       "
            Write-Host "Main Functions:"
            Write-Host "- Initialize-GovFramework: Set up the framework environment"
            Write-Host "- Connect-GovAzure: Connect to Azure"
            Write-Host "- Get-GovPolicyComplianceSummary: Get compliance summary"
            Write-Host "- Get-GovNonCompliantResources: Get non-compliant resources"
            Write-Host "- New-GovDashboardReport: Generate a dashboard report"
            Write-Host "- New-GovAssessmentReport: Run a governance assessment"
            Write-Host "                                                       "
            Write-Host "Usage Example:"
            Write-Host "1. Initialize the framework: Initialize-GovFramework"
            Write-Host "2. Connect to Azure: Connect-GovAzure"
            Write-Host "3. Run a compliance scan: Get-GovPolicyComplianceSummary"
            Write-Host "4. Generate a dashboard: New-GovDashboardReport"
            Write-Host "                                                       "
        Read-Host -Prompt 'Press Enter to continue'
        }
        "4" {
            return
        }
        default {
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Read-Host -Prompt 'Press Enter to continue'
        }
    }
}

# Main program loop (wrapped to ensure a clean exit)
$exit = $false
try {
    while (-not $exit) {
        $choice = Show-MainMenu

        switch ($choice) {
                "1" { Write-Activity -Level Info -Message 'User selected Connect-ToAzure'; Connect-ToAzure }
                "2" { Write-Activity -Level Info -Message 'User selected Invoke-Infrastructure'; Invoke-Infrastructure }
                "3" { Write-Activity -Level Info -Message 'User selected Get-ComplianceReports'; Get-ComplianceReports }
                "4" { Write-Activity -Level Info -Message 'User selected New-Dashboard'; New-Dashboard }
                "5" { Write-Activity -Level Info -Message 'User selected Invoke-GovernanceAssessment'; Invoke-GovernanceAssessment }
                "6" { Write-Activity -Level Info -Message 'User selected Show-Documentation'; Show-Documentation }
                "7" { Write-Activity -Level Info -Message 'User selected Exit'; $exit = $true }
            default {
                Write-Host "Invalid choice. Please try again." -ForegroundColor Red
                Read-Host -Prompt 'Press Enter to continue'
            }
        }
    }
}
catch {
    Write-Host "An unexpected error occurred: $_" -ForegroundColor Red
    Write-Activity -Level Error -Message "Unexpected error in menu loop: $_"
    exit 1
}
finally {
    Clear-Host
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "Thank you for using ICT Governance Framework Automation" -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
    exit 0
}
