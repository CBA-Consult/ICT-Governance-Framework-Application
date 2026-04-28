param([switch]$Ci, [switch]$RefreshChecksum)

$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'RpasGovernance.psm1') -Force

$result = Test-RpasGovernanceBaseline -SkipChecksum:$RefreshChecksum
if (-not $result.IsValid) {
    Write-Error "RPAS Governance Baseline validation failed:`n$($result.Errors -join "`n")"
    exit 1
}

Write-Host "RPAS Governance Baseline is valid."
exit 0