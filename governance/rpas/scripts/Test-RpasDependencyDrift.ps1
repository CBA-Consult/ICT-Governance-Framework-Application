param()
$ErrorActionPreference = 'Stop'

$repoRoot = (Get-Item $PSScriptRoot/../../..).FullName
$manifestPath = Join-Path $repoRoot "governance/rpas/status/aspire-manifest.json"
$driftReportPath = Join-Path $repoRoot "governance/rpas/status/arch-drift-report.md"

if (-not (Test-Path $manifestPath)) {
    Write-Host "No current Aspire manifest found. Skipping architectural drift detection."
    exit 0
}

$currentManifest = Get-Content $manifestPath | ConvertFrom-Json
$previousManifestContent = git show HEAD:governance/rpas/status/aspire-manifest.json 2>$null

if (-not $previousManifestContent) {
    Write-Host "No previous Aspire manifest found in HEAD. Architectural baseline established."
    exit 0
}

$previousManifest = $previousManifestContent | ConvertFrom-Json
$currentResources = $currentManifest.resources.PSObject.Properties.Name | Sort-Object
$previousResources = $previousManifest.resources.PSObject.Properties.Name | Sort-Object

$added = Compare-Object $previousResources $currentResources | Where-Object SideIndicator -eq '=>' | Select-Object -ExpandProperty InputObject
$removed = Compare-Object $previousResources $currentResources | Where-Object SideIndicator -eq '<=' | Select-Object -ExpandProperty InputObject

if ($added -or $removed) {
    $date = (Get-Date).ToString("yyyy-MM-dd HH:mm:ssZ")
    $md = "# 🏗️ Architectural Dependency Drift Report`n**Generated:** $date`n`n"
    $md += "The .NET Aspire orchestration manifest has drifted from the previous baseline.`n`n"
    if ($added) { $md += "### 🟢 Added Services/Resources`n"; $added | ForEach-Object { $md += "- $_\`n" } }
    if ($removed) { $md += "### 🔴 Removed Services/Resources`n"; $removed | ForEach-Object { $md += "- $_\`n" } }
    $md | Out-File $driftReportPath -Encoding utf8
    Write-Warning "Architectural drift detected. Report generated at $driftReportPath"
} else {
    Write-Host "✅ No architectural dependency drift detected."
    if (Test-Path $driftReportPath) { Remove-Item $driftReportPath -Force }
}