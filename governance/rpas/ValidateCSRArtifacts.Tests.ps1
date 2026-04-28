$modulePath = Join-Path $PSScriptRoot "..\scripts\RpasGovernance.psm1"
Import-Module $modulePath -Force -ErrorAction Stop

Describe "RPAS CSR Artifact Validation" {

    $manifestPath = Join-Path $PSScriptRoot "..\manifest.json"
    $manifest = Get-Content $manifestPath | ConvertFrom-Json

    It "Manifest must define at least one CSR artifact" {
        $manifest.artifacts | Should -Not -BeNullOrEmpty
    }

    foreach ($artifactDef in $manifest.artifacts) {

        Context "Validating CSR Artifact: $($artifactDef.id)" {

            # Navigate back to repo root to resolve the manifest path
            $artifactPath = Join-Path $PSScriptRoot "..\..\..\$($artifactDef.path)"
            $artifact = Get-Content $artifactPath -ErrorAction Stop | ConvertFrom-Json

            It "CSR artifact file must exist ($artifactPath)" {
                Test-Path $artifactPath | Should -BeTrue
            }

            foreach ($key in $artifactDef.requiredKeys) {
                It "CSR artifact must contain required key: $key" {
                    $artifact.PSObject.Properties.Name | Should -Contain $key
                }
            }

            It "artifactId must match manifest-defined ID" {
                $artifact.artifactId | Should -Be $artifactDef.id
            }

            It "aevGatesCleared must be true" {
                $artifact.aevGatesCleared | Should -Be $true
            }
        }
    }
}