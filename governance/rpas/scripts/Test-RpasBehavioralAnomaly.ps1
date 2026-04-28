param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force
$govRoot = Get-RpasGovernanceRoot
$repoRoot = Get-RpasProjectRoot
$anomalyPath = Join-Path $govRoot "status\behavioral-anomalies.md"

Set-Location $repoRoot
$recentCommits = git log --since="24 hours" --format="%an|%ae" --name-only governance/rpas/
$authorChanges = @{}

foreach ($line in $recentCommits -split "`n") {
    if ($line -match "\|") {
        $author = $line.Split('|')[0].Trim()
        if (-not $authorChanges.ContainsKey($author)) { $authorChanges[$author] = 0 }
    } elseif ($line -match "^governance/rpas/") {
        $authorChanges[$author]++
    }
}

$md = "# 🕵️ Governance Behavioral Anomaly Report`n**Analysis Window:** Last 24 Hours`n`n"
$anomaliesFound = 0

$md += "| Actor | Governance Mutations | Status |`n|---|---|---|`n"

$authorChanges.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    $status = "🟢 Normal"
    if ($_.Value -gt 15) { 
        $status = "🔴 ANOMALY (Excessive Churn)"
        $anomaliesFound++
    } elseif ($_.Value -gt 5) { 
        $status = "🟡 Elevated" 
    }
    $md += "| $($_.Name) | $($_.Value) | $status |`n"
}

if ($authorChanges.Count -eq 0) { $md += "| *No mutations* | 0 | 🟢 Normal |`n" }

$md += "`n**Total Anomalies Detected:** $anomaliesFound`n"
$md | Out-File $anomalyPath -Encoding utf8
Write-Host "✅ Behavioral anomaly analysis completed at $anomalyPath"