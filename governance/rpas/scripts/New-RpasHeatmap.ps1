param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force

$govRoot = Get-RpasGovernanceRoot
$heatmapPath = Join-Path $govRoot "status\HEATMAP.md"
$repoRoot = Get-RpasProjectRoot

Set-Location $repoRoot
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCheck) {
    Write-Warning "Git is required to generate the heatmap."
    exit 0
}

# Analyze git log for the governance folder
$logData = git log --pretty=format:"%ad" --date=short --name-only governance/rpas/
$fileCounts = @{}

foreach ($line in $logData -split "`n") {
    if ($line -match "^governance/rpas/(.+)") {
        $file = $matches[1]
        if (-not $fileCounts.ContainsKey($file)) { $fileCounts[$file] = 0 }
        $fileCounts[$file]++
    }
}

$md = "# 🌡️ RPAS-CM Governance Heatmap`n`n"
$md += "Tracks the mutation frequency of governance artifacts to surface policy hotspots.`n`n"
$md += "| Artifact | Mutation Count | Heat Level |`n|---|---|---|`n"

$fileCounts.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    $heat = if ($_.Value -gt 10) { "🔥 High" } elseif ($_.Value -gt 3) { "⚠️ Medium" } else { "🧊 Low" }
    $md += "| `$($_.Name)` | $($_.Value) | $heat |`n"
}

$md | Out-File $heatmapPath -Encoding utf8
Write-Host "✅ Governance Heatmap generated at $heatmapPath"