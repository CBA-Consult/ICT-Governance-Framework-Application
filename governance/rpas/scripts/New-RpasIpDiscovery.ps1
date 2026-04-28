param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force
$govRoot = Get-RpasGovernanceRoot
$repoRoot = Get-RpasProjectRoot
$dossierDir = Join-Path $govRoot "status\ip-dossier"
$ipReportPath = Join-Path $dossierDir "ip-discovery-report.md"

if (-not (Test-Path $dossierDir)) { New-Item -ItemType Directory -Path $dossierDir -Force | Out-Null }

Set-Location $repoRoot
# Analyze recent diffs for innovation keywords
$recentChanges = git diff HEAD~1 HEAD 2>$null

$ipKeywords = @(
    "predictive", "heuristic", "monte carlo", "digital twin", "merkle", 
    "chain-of-trust", "autonomous", "auto-correct", "anomaly detection",
    "machine learning", "proprietary algorithm", "novel"
)

$discoveredIp = @()

if ($recentChanges) {
    foreach ($keyword in $ipKeywords) {
        if ($recentChanges -match "(?i)$keyword") {
            $discoveredIp += $keyword
        }
    }
}

if ($discoveredIp.Count -gt 0) {
    $uniqueIp = $discoveredIp | Select-Object -Unique
    $date = (Get-Date).ToString("yyyy-MM-dd HH:mm:ssZ")
    $md = @"
# 🛑 CONFIDENTIAL: RPAS-CM IP / Octrooi Discovery Dossier
**Generated:** $date
**Status:** PENDING LEGAL REVIEW

## 💡 Automated Innovation Detection
The RPAS-CM Tier V+ engine has detected code or architectural patterns in the latest AEV cycle that strongly correlate with proprietary Intellectual Property or patentable (Octrooi) methods.

### 🔍 Trigger Keywords Detected:
"@
    $uniqueIp | ForEach-Object { $md += "- **$($_)**\n" }
    $md += "\n## ⚖️ Required Action\n"
    $md += "1. **Code Freeze:** Restrict public distribution of the affected modules.\n"
    $md += "2. **Legal Review:** Forward this dossier to the enterprise IP/Patent counsel for Octrooi eligibility assessment.\n"
    
    $md | Out-File $ipReportPath -Encoding utf8
    Write-Host "✅ IP/Octrooi indicators detected! Dossier generated at $ipReportPath" -ForegroundColor Magenta
}