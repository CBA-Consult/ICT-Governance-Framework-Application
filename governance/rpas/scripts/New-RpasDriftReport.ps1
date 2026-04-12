param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force

$govRoot = Get-RpasGovernanceRoot
$driftReportPath = Join-Path $govRoot "status\drift-report.md"

$baseline = Test-RpasGovernanceBaseline

if ($baseline.IsValid -and ($baseline.CurrentChecksum -eq $baseline.StoredChecksum)) {
    Write-Host "✅ No drift detected. Baseline is cryptographically secure."
    if (Test-Path $driftReportPath) { Remove-Item $driftReportPath -Force }
    exit 0
}

$date = (Get-Date).ToString("yyyy-MM-dd HH:mm:ssZ")
$errorsFormatted = if ($baseline.Errors.Count -gt 0) { $baseline.Errors | ForEach-Object { "- $_" } | Out-String } else { "- Integrity check failed silently." }

$md = @"
# ⚠️ RPAS-CM Governance Drift Report
**Generated:** $date

## 🚨 Drift Detected
The cryptographic governance ledger does not match the current repository state, or a required artifact is missing/invalid.

**Stored Checksum:** `$($baseline.StoredChecksum ?? 'MISSING')`  
**Current Checksum:** `$($baseline.CurrentChecksum ?? 'MISSING')`

## Validation Errors
$errorsFormatted

## Required Action
If these changes are intentional and governable, you must execute the AEV workflow and re-register the baseline:
`./governance/rpas/scripts/register-governance.ps1 -RefreshChecksum`
"@

$md | Out-File $driftReportPath -Encoding utf8
Write-Warning "Drift report generated at $driftReportPath"