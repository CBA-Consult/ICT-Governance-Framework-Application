# tests/ReportGeneration.Tests.ps1
Describe 'Report generation (unit)' {
    BeforeAll {
        # Mock Azure cmdlets before importing module to avoid requiring credentials in CI
        Mock -CommandName Connect-AzAccount -MockWith { $null }
        Mock -CommandName Get-AzContext -MockWith { [PSCustomObject]@{ Subscription = [PSCustomObject]@{ Id = '00000000-0000-0000-0000-000000000000' } } }
        Mock -CommandName Get-AzPolicyState -MockWith { @() }
        Mock -CommandName Get-AzResourceGroup -MockWith { @() }
        Mock -CommandName Get-AzResource -MockWith { @() }

        $modulePath = Join-Path -Path $PSScriptRoot -ChildPath '..\azure-automation\ICT-Governance-Framework.psd1'
        Import-Module -Name $modulePath -Force -ErrorAction Stop

        $Global:TestOutputDir = Join-Path -Path $PSScriptRoot -ChildPath 'TestOutputs'
        if (-not (Test-Path $Global:TestOutputDir)) { New-Item -Path $Global:TestOutputDir -ItemType Directory | Out-Null }
        $Global:TestOutputFile = Join-Path -Path $Global:TestOutputDir -ChildPath 'test-dashboard.html'
    }

    It 'Generates an HTML report file' {
        New-GovDashboardReport -OutputPath $Global:TestOutputFile | Out-Null
        Test-Path $Global:TestOutputFile | Should -BeTrue
    }

    AfterAll {
        if (Test-Path $Global:TestOutputFile) { Remove-Item $Global:TestOutputFile -Force }
        if (Test-Path $Global:TestOutputDir) { Remove-Item $Global:TestOutputDir -Recurse -Force }
        Remove-Module -Name ICT-Governance-Framework -ErrorAction SilentlyContinue
    }
}
