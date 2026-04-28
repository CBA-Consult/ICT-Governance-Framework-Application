param([switch]$SkipHookInstall)

$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'RpasGovernance.psm1') -Force

Write-Host "Registering RPAS Governance..."
Register-RpasGovernance -SkipHookInstall:$SkipHookInstall -RefreshChecksum
Write-Host "RPAS Governance registered successfully."