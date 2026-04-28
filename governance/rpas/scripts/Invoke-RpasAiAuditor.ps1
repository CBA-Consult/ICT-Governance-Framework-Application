param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force

$govRoot = Get-RpasGovernanceRoot
$repoRoot = Get-RpasProjectRoot
$riskReportPath = Join-Path $govRoot "status\risk-assessment.md"
$gomPath = Join-Path $govRoot "status\governance-integrity.json"

# Input Data Sources
$heatmapPath = Join-Path $govRoot "status\HEATMAP.md"
$archDriftPath = Join-Path $govRoot "status\arch-drift-report.md"
$govDriftPath = Join-Path $govRoot "status\drift-report.md"
$merklePath = Join-Path $govRoot "status\merkle-root.json"

# Initialize Risk Profile
$riskScore = 0
$riskFactors = @()
$mitigations = @()

Write-Host "🧠 DRACO AI Auditor analyzing governance state..."

# 1. Analyze Architectural Drift
if (Test-Path $archDriftPath) {
    $archDrift = Get-Content $archDriftPath -Raw
    if ($archDrift -match "Added Services/Resources") {
        $riskScore += 40
        $riskFactors += "🔴 **Expanding Attack Surface:** New architectural resources detected in Aspire manifest."
        $mitigations += "- **Mandatory:** Execute Zero Trust validation on newly added services."
        $mitigations += "- **Mandatory:** Update Threat Model to include new microservice boundaries."
    }
    if ($archDrift -match "Removed Services/Resources") {
        $riskScore += 30
        $riskFactors += "🟠 **Breaking Change Risk:** Services have been removed from the orchestration tier."
        $mitigations += "- **Action:** Verify no orphaned dependent services remain in the environment."
    }
}

# 2. Analyze Governance Drift
if (Test-Path $govDriftPath) {
    $riskScore += 80
    $riskFactors += "🔴 **Integrity Compromise:** Cryptographic ledger mismatch detected."
    $mitigations += "- **CRITICAL:** Halt all deployments. Run `./governance/rpas/scripts/Restore-RpasBaseline.ps1` to revert, or re-certify intentional changes via AEV Gate 4."
}

# 3. Analyze Heatmap Churn
if (Test-Path $heatmapPath) {
    $heatmap = Get-Content $heatmapPath -Raw
    $highChurnFiles = [regex]::Matches($heatmap, "\|\s*`([^`]+)`\s*\|\s*\d+\s*\|\s*🔥 High") | ForEach-Object { $_.Groups[1].Value }
    if ($highChurnFiles) {
        $riskScore += 20
        $riskFactors += "🟠 **Governance Instability:** High mutation frequency detected in foundational artifacts: $($highChurnFiles -join ', ')."
        $mitigations += "- **Action:** Review high-churn files for policy design flaws that require constant patching."
    }
}

# 4. Analyze Merkle Chain of Trust
if (Test-Path $merklePath) {
    $merkle = Get-Content $merklePath | ConvertFrom-Json
    if ($merkle.status -ne "SECURE") {
        $riskScore += 50
        $riskFactors += "🔴 **Lineage Compromise:** Merkle Chain-of-Trust verification failed."
        $mitigations += "- **CRITICAL:** Perform a forensic audit of the `artifacts` directory for unauthorized modifications."
    }
}

# Determine Final Severity
$severity = "🟢 LOW RISK"
if ($riskScore -ge 80) { $severity = "🔴 CRITICAL RISK" }
elseif ($riskScore -ge 40) { $severity = "🟠 HIGH RISK" }
elseif ($riskScore -ge 20) { $severity = "🟡 MEDIUM RISK" }

# Calculate Governance Integrity Index (0-100)
$integrityIndex = 100 - $riskScore
if ($integrityIndex -lt 0) { $integrityIndex = 0 }

$predictiveWarning = if ($riskScore -ge 40) { "High probability of escalating architectural or governance drift in upcoming cycles." } else { "Governance baseline is stable and predictable." }

# Generate Report
$date = (Get-Date).ToString("yyyy-MM-dd HH:mm:ssZ")
$md = @"
# 🧠 DRACO AI Auditor Risk Assessment
**Generated:** $date
**Risk Score:** $riskScore / 100
**Integrity Index:** $integrityIndex / 100
**Severity:** $severity

## 📊 Threat Intelligence & Risk Factors
"@

if ($riskFactors.Count -eq 0) {
    $md += "✅ *No significant architectural or governance risks detected in current execution state.*\n\n"
} else {
    $riskFactors | ForEach-Object { $md += "$_`n" }
    $md += "`n"
}

$md += "## 🛡️ Recommended Mitigations\n"
if ($mitigations.Count -eq 0) {
    $md += "✅ *Baseline is stable. Proceed with standard AEV workflow.*\n"
} else {
    $mitigations | ForEach-Object { $md += "$_`n" }
    if ($riskScore -ge 40) {
        $md += "\n> ⚠️ **DRACO BLOCKING OVERRIDE REQUIRED:** Risk score exceeds threshold. A human governor must explicitly acknowledge these mitigations before the next CSR promotion."
    }
}

$md += "`n---`n*This automated heuristic assessment ensures continuous alignment with ADPA Zero Trust and RPAS-CM governance mandates.*"

$md | Out-File $riskReportPath -Encoding utf8

# Export Unified Governance Object Model (GOM)
$gom = @{
    timestamp = $date
    integrityIndex = $integrityIndex
    riskScore = $riskScore
    severity = $severity
    predictiveAnalysis = $predictiveWarning
    actionableMitigationsCount = $mitigations.Count
    merkleStatus = if (Test-Path $merklePath) { $merkle.status } else { "UNKNOWN" }
}

$gom | ConvertTo-Json -Depth 3 | Out-File $gomPath -Encoding utf8
Write-Host "✅ Risk assessment and Governance Object Model (GOM) generated."