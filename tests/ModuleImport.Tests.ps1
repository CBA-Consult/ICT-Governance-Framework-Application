# tests/ModuleImport.Tests.ps1
Describe 'ICT-Governance-Framework Module' {
    BeforeAll {
        # Mock Azure login/context so module import and functions do not require an actual Azure login in CI
        Mock -CommandName Connect-AzAccount -MockWith { $null }
        Mock -CommandName Get-AzContext -MockWith { [PSCustomObject]@{ Subscription = [PSCustomObject]@{ Id = '00000000-0000-0000-0000-000000000000' } } }

        $modulePath = Join-Path -Path $PSScriptRoot -ChildPath '..\azure-automation\ICT-Governance-Framework.psd1'
        Import-Module $modulePath -Force -ErrorAction Stop
    }

    It 'Imports the module without error' {
        Get-Module -Name ICT-Governance-Framework | Should -Not -BeNullOrEmpty
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
            $exports | Should -Contain $e
        }
    }

    AfterAll {
        # Clean up module from session
        Remove-Module -Name ICT-Governance-Framework -ErrorAction SilentlyContinue
    }
}
