# tests/ReportGeneration.Tests.ps1
Describe 'Report generation (unit)' {
    BeforeAll {
        $modulePath = Join-Path -Path $PSScriptRoot -ChildPath '..\azure-automation\ICT-Governance-Framework.psd1'
        Import-Module -Name $modulePath -Force -ErrorAction Stop
        $Global:TestOutputDir = Join-Path -Path $PSScriptRoot -ChildPath 'TestOutputs'
        if (-not (Test-Path $Global:TestOutputDir)) { New-Item -Path $Global:TestOutputDir -ItemType Directory | Out-Null }
        $Global:TestOutputFile = Join-Path -Path $Global:TestOutputDir -ChildPath 'test-dashboard.html'

        # Mock Azure cmdlets used by New-GovDashboardReport
        Mock -CommandName Get-AzContext -MockWith { [PSCustomObject]@{ Subscription = [PSCustomObject]@{ Id = '00000000-0000-0000-0000-000000000000' } } }
        Mock -CommandName Get-AzPolicyState -MockWith { @() }
        Mock -CommandName Get-AzResourceGroup -MockWith { @() }
        Mock -CommandName Get-AzResource -MockWith { @() }
    }

    It 'Generates an HTML report file' {
        New-GovDashboardReport -OutputPath $Global:TestOutputFile | Out-Null
        Test-Path $Global:TestOutputFile | Should Be $true
    }

    AfterAll {
        if (Test-Path $Global:TestOutputFile) { Remove-Item $Global:TestOutputFile -Force }
        if (Test-Path $Global:TestOutputDir) { Remove-Item $Global:TestOutputDir -Recurse -Force }
    }
}
