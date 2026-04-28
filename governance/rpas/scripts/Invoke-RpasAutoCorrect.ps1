param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force
$govRoot = Get-RpasGovernanceRoot
$autoCorrectPath = Join-Path $govRoot "status\autocorrect-plan.md"
$gomPath = Join-Path $govRoot "status\governance-integrity.json"
$driftPath = Join-Path $govRoot "status\drift-report.md"

if (-not (Test-Path $gomPath)) { exit 0 }
$gom = Get-Content $gomPath | ConvertFrom-Json

$md = "# 🪄 Autonomous Governance Auto-Correct Plan`n**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ssZ')`n`n"

if ($gom.actionableMitigationsCount -gt 0 -or (Test-Path $driftPath)) {
    $md += "## 🔧 Recommended Auto-Remediations`n"
    
    if (Test-Path $driftPath) {
        $md += "### 🚨 Cryptographic Drift Detected`n"
        $md += "**Auto-Correct Action:** Restore baseline to last known good state.`n"
        $md += "```powershell`n./governance/rpas/scripts/Restore-RpasBaseline.ps1 -CsrId $($gom.csrInfo.id ?? 'LATEST')`n````n"
    }
    if ($gom.integrityIndex -lt 100) {
        $md += "### 📉 Integrity Index Degradation`n"
        $md += "**Auto-Correct Action:** Initiate DRACO mitigation review.`n"
        $md += "```powershell`n# Review ./governance/rpas/status/risk-assessment.md`n````n"
    }
} else {
    $md += "✅ No auto-correct actions required. Governance state is optimal.`n"
}
$md | Out-File $autoCorrectPath -Encoding utf8
Write-Host "✅ Auto-correct plan generated at $autoCorrectPath"