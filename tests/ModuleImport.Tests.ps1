# tests/ModuleImport.Tests.ps1
Describe 'ICT-Governance-Framework Module' {
    It 'Imports the module without error' {
        $modulePath = Join-Path -Path $PSScriptRoot -ChildPath '..\azure-automation\ICT-Governance-Framework.psd1'
        Import-Module $modulePath -Force -ErrorAction Stop
        (Get-Module -Name ICT-Governance-Framework) | Should Not BeNullOrEmpty
    }

    It 'Exports the expected public functions' {
        $expected = @(
            'Connect-GovAzure',
            'Get-GovNonCompliantResources',
            'Get-GovPolicyComplianceSummary',
            'Initialize-GovFramework',
            'New-GovAssessmentReport',
            'New-GovDashboardReport'
        )
        $exports = (Get-Module -Name ICT-Governance-Framework).ExportedCommands.Keys
        foreach ($e in $expected) {
            ($exports -contains $e) | Should Be $true
        }
    }
}
