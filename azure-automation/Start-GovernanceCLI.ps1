# ICT Governance Framework - Command-Line Interface
# This script imports the ICT-Governance-Framework module and provides an interactive menu.

try {
    # Import the local module. -Force is used for easy testing during development.
    Import-Module -Name (Join-Path -Path $PSScriptRoot -ChildPath 'ICT-Governance-Framework.psd1') -Force
}
catch {
    Write-Host "Error: The ICT-Governance-Framework module could not be imported." -ForegroundColor Red
    Write-Host "Please ensure ICT-Governance-Framework.psm1 and .psd1 are in the same directory as this script." -ForegroundColor Red
    Write-Host "Error details: $_" -ForegroundColor Red
    return
}

# --- Main Menu Loop ---
do {
    Write-Host "`nICT Governance Framework Automation" -ForegroundColor Cyan
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
            Get-GovPolicyComplianceSummary -SubscriptionId $sub | Format-Table
        }
        "4" {
            $sub = Read-Host "Enter subscription ID (leave blank for current)"
            Get-GovNonCompliantResources -SubscriptionId $sub | Format-List
        }
        "5" {
            $sub = Read-Host "Enter subscription ID (leave blank for current)"
            $reportPath = New-GovDashboardReport -SubscriptionId $sub
            if ($reportPath) { Invoke-Item $reportPath } # Automatically open the report
        }
        "6" {
            $sub = Read-Host "Enter subscription ID (mandatory)"
            if ($sub) {
                $reportPath = New-GovAssessmentReport -SubscriptionId $sub
                if ($reportPath) { Invoke-Item $reportPath } # Automatically open the report
            }
            else {
                Write-Host "Subscription ID is required." -ForegroundColor Red
            }
        }
        "Q" {
            Write-Host "Exiting." -ForegroundColor Green
        }
        default {
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
        }
    }
} while ($choice -ne 'Q')
