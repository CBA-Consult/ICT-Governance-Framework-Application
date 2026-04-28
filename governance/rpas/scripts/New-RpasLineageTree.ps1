param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force

$govRoot = Get-RpasGovernanceRoot
$artifactsPath = Join-Path $govRoot "artifacts"
$lineageMdPath = Join-Path $govRoot "status\LINEAGE.md"

$csrFiles = Get-ChildItem -Path $artifactsPath -Filter "CSR-*.json"
$csrList = @()

foreach ($file in $csrFiles) {
    $content = Get-Content $file.FullName | ConvertFrom-Json
    $csrList += $content
}

# Sort chronologically
$sortedCsr = $csrList | Sort-Object certificationDate

$md = "# 🌳 CSR Lineage Tree`n`n"
$md += "This document tracks the immutable progression of Certified Stable Releases (CSR) within the ADPA framework.`n`n"

foreach ($csr in $sortedCsr) {
    $statusIcon = if ($csr.status -eq 'CERTIFIED') { "✅" } else { "⚠️" }
    $md += "### $statusIcon $($csr.artifactId) (v$($csr.version))`n"
    $md += "- **Date:** $($csr.certificationDate)`n"
    $md += "- **Certified By:** $($csr.certifiedBy)`n"
    $md += "- **Description:** $($csr.description)`n`n"
    if ($csr.artifactId -ne $sortedCsr[-1].artifactId) {
        $md += "⬇️ *Superseded by next RTM baseline*`n`n"
    }
}

$md | Out-File $lineageMdPath -Encoding utf8
Write-Host "✅ LINEAGE.md generated."