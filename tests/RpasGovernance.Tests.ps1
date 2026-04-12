$pesterModule = Get-Module -ListAvailable Pester | Sort-Object Version -Descending | Select-Object -First 1
if (-not $pesterModule -or $pesterModule.Version.Major -lt 5) {
    throw "Pester v5 or later is required to run these tests. Install with: Install-Module -Name Pester -RequiredVersion 5 -Scope CurrentUser"
}

Describe 'RPAS governance integration' {
    BeforeAll {
        $modulePath = Join-Path $PSScriptRoot '..\governance\rpas\scripts\RpasGovernance.psm1'
        Import-Module $modulePath -Force -ErrorAction Stop
        $statePath = Join-Path $PSScriptRoot '..\governance\rpas\.state\registration.json'

        if (Test-Path -LiteralPath $statePath) {
            Remove-Item -LiteralPath $statePath -Force
        }
    }

    It 'validates the committed RPAS governance scaffold' {
        $result = Test-RpasGovernanceBaseline

        $result.IsValid | Should -BeTrue
        $result.Errors | Should -BeNullOrEmpty
    }

    It 'matches the committed RPAS checksum' {
        $storedChecksum = Get-RpasChecksumContent
        $currentChecksum = New-RpasChecksum

        $storedChecksum.combinedHash | Should -Be $currentChecksum.combinedHash
    }

    It 'registers local RPAS governance state without installing hooks' {
        $registration = Register-RpasGovernance -SkipHookInstall

        Test-Path -LiteralPath $registration.RegistrationStatePath | Should -BeTrue
        $registration.HookInstalled | Should -BeFalse
        $registration.Checksum | Should -Not -BeNullOrEmpty
    }

    AfterAll {
        if (Test-Path -LiteralPath $statePath) {
            Remove-Item -LiteralPath $statePath -Force
        }

        Remove-Module RpasGovernance -ErrorAction SilentlyContinue
    }
}
