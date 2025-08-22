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

# Import ICT Governance Framework module
. ./ICT-Governance-Framework.ps1

# Initialize the framework
Initialize-GovFramework

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
    Write-Host "1. Interactive Login" -ForegroundColor White
    Write-Host "2. Use Managed Identity" -ForegroundColor White
    Write-Host "3. Connect to Specific Tenant" -ForegroundColor White
    Write-Host "4. Back to Main Menu" -ForegroundColor White
    Write-Host "                                                       "
    
    $choice = Read-Host "Enter your choice (1-4)"
    
    switch ($choice) {
        "1" {
            Connect-GovAzure
            Pause
        }
        "2" {
            Connect-GovAzure -UseManagedIdentity
            Pause
        }
        "3" {
            $tenantId = Read-Host "Enter Tenant ID"
            Connect-GovAzure -TenantId $tenantId
            Pause
        }
        "4" {
            return
        }
        default {
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Pause
        }
    }
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
    
    if ($confirm -eq 'Y' -or $confirm -eq 'y') {
        & ./Deploy-ICTGovernanceFramework.ps1 -SubscriptionId $subscriptionId -ResourceGroupName $resourceGroupName `
            -Location $location -EnvironmentName $environmentName -OrganizationName $organizationName `
            -EnableDiagnostics $enableDiagnostics -EnableRemediation $enableRemediation
        
        Pause
    }
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
        $outputPath = "./governance-reports/compliance-summary-$(Get-Date -Format 'yyyy-MM-dd').json"
    }
    
    Write-Host "Running compliance report..." -ForegroundColor Yellow
    
    if (![string]::IsNullOrWhiteSpace($subscriptionId) -and ![string]::IsNullOrWhiteSpace($resourceGroupName)) {
        $compliance = Get-GovPolicyComplianceSummary -SubscriptionId $subscriptionId -ResourceGroupName $resourceGroupName -OutputPath $outputPath
    }
    elseif (![string]::IsNullOrWhiteSpace($subscriptionId)) {
        $compliance = Get-GovPolicyComplianceSummary -SubscriptionId $subscriptionId -OutputPath $outputPath
    }
    else {
        $compliance = Get-GovPolicyComplianceSummary -OutputPath $outputPath
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
    
    Pause
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
        $outputPath = "./governance-reports/dashboard-$(Get-Date -Format 'yyyy-MM-dd').html"
    }
    
    Write-Host "Generating dashboard..." -ForegroundColor Yellow
    
    if (![string]::IsNullOrWhiteSpace($subscriptionId)) {
        $dashboardPath = New-GovDashboardReport -SubscriptionId $subscriptionId -OutputPath $outputPath
    }
    else {
        $dashboardPath = New-GovDashboardReport -OutputPath $outputPath
    }
    
    Write-Host "                                                       "
    Write-Host "Dashboard generated successfully!" -ForegroundColor Green
    Write-Host "Dashboard saved to: $dashboardPath" -ForegroundColor Green
    Write-Host "                                                       "
    
    $openDashboard = Read-Host "Do you want to open the dashboard in your browser? (Y/N)"
    
    if ($openDashboard -eq 'Y' -or $openDashboard -eq 'y') {
        # Open the dashboard in the default browser
        Start-Process $dashboardPath
    }
    
    Pause
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
        Pause
        return
    }
    
    $outputPath = Read-Host "Enter Output Path (press Enter for default path)"
    if ([string]::IsNullOrWhiteSpace($outputPath)) {
        $outputPath = "./governance-reports/assessment-$(Get-Date -Format 'yyyy-MM-dd').csv"
    }
    
    Write-Host "Running governance assessment..." -ForegroundColor Yellow
    
    $assessmentPath = New-GovAssessmentReport -SubscriptionId $subscriptionId -OutputPath $outputPath
    
    Write-Host "                                                       "
    Write-Host "Assessment completed successfully!" -ForegroundColor Green
    Write-Host "Assessment report saved to: $assessmentPath" -ForegroundColor Green
    Write-Host "                                                       "
    
    Pause
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
            Pause
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
            Pause
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
            Pause
        }
        "4" {
            return
        }
        default {
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Pause
        }
    }
}

# Main program loop
$exit = $false

while (-not $exit) {
    $choice = Show-MainMenu
    
    switch ($choice) {
        "1" {
            Connect-ToAzure
        }
        "2" {
            Invoke-Infrastructure
        }
        "3" {
            Get-ComplianceReports
        }
        "4" {
            New-Dashboard
        }
        "5" {
            Invoke-GovernanceAssessment
        }
        "6" {
            Show-Documentation
        }
        "7" {
            $exit = $true
        }
        default {
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Pause
        }
    }
}

Clear-Host
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Thank you for using ICT Governance Framework Automation" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
