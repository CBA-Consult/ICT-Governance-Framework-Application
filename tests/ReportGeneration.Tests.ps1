# tests/ReportGeneration.Tests.ps1
Describe 'Report generation (unit)' {
    BeforeAll {
        # Mock Azure cmdlets before importing module to avoid requiring credentials in CI
        Mock -CommandName Connect-AzAccount -MockWith { $null }
    # Return the same subscription id as in azure-automation\governance-config.json so the module finds a match
    Mock -CommandName Get-AzContext -MockWith { [PSCustomObject]@{ Subscription = [PSCustomObject]@{ Id = 'e759446b-8bb7-4065-a0ed-9d5273a05c46' } } }
        # Provide representative sample data for policy states, resource groups and resources
        $samplePolicyStates = @(
            [PSCustomObject]@{ ComplianceState = 'Compliant'; ResourceId = '/subscriptions/e759446b-8bb7-4065-a0ed-9d5273a05c46/resourceGroups/rg1/providers/Microsoft.Compute/virtualMachines/vm1'; PolicyDefinitionId = '/providers/Microsoft.Authorization/policyDefinitions/PD1'; PolicyAssignmentId = '/providers/Microsoft.Authorization/policyAssignments/PA1' },
            [PSCustomObject]@{ ComplianceState = 'NonCompliant'; ResourceId = '/subscriptions/e759446b-8bb7-4065-a0ed-9d5273a05c46/resourceGroups/rg2/providers/Microsoft.Storage/storageAccounts/sa1'; PolicyDefinitionId = '/providers/Microsoft.Authorization/policyDefinitions/PD2'; PolicyAssignmentId = '/providers/Microsoft.Authorization/policyAssignments/PA2' }
        )
        Mock -CommandName Get-AzPolicyState -MockWith { $samplePolicyStates }

        $sampleResourceGroups = @(
            [PSCustomObject]@{ ResourceGroupName = 'rg1'; Location = 'westeurope' },
            [PSCustomObject]@{ ResourceGroupName = 'rg2'; Location = 'westeurope' }
        )
        Mock -CommandName Get-AzResourceGroup -MockWith { $sampleResourceGroups }

        $sampleResources = @(
            [PSCustomObject]@{ Name = 'vm1'; ResourceType = 'Microsoft.Compute/virtualMachines'; ResourceGroupName = 'rg1' },
            [PSCustomObject]@{ Name = 'sa1'; ResourceType = 'Microsoft.Storage/storageAccounts'; ResourceGroupName = 'rg2' }
        )
        Mock -CommandName Get-AzResource -MockWith { $sampleResources }

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
