param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force
$govRoot = Get-RpasGovernanceRoot
$stagingDir = Join-Path $govRoot "artifacts\staging"
$crDir = Join-Path $govRoot "status\change-requests"

if (-not (Test-Path $stagingDir)) { New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null }

$manifest = Get-RpasManifest
$currentCsrDef = $manifest.artifacts | Select-Object -First 1

if (-not $currentCsrDef) { exit 0 }

# Auto-increment CSR ID (e.g., CSR-42 -> CSR-43)
$currentIdMatch = [regex]::Match($currentCsrDef.id, "CSR-(\d+)")
if ($currentIdMatch.Success) {
    $nextIdNum = [int]$currentIdMatch.Groups[1].Value + 1
    $nextCsrId = "CSR-$nextIdNum"
} else {
    $nextCsrId = "CSR-NEXT"
}

# Count pending CRs to absorb
$pendingCRs = if (Test-Path $crDir) { (Get-ChildItem -Path $crDir -Filter "*.md").Count } else { 0 }

# Calculate next semantic minor version
$versionParts = $manifest.baselineVersion.Split('.')
$nextVersion = if ($versionParts.Count -eq 3) { "$($versionParts[0]).$([int]$versionParts[1] + 1).0" } else { "Next" }

$draftPayload = @{
    artifactId = $nextCsrId
    version = $nextVersion
    certificationDate = "PENDING_PROMOTION"
    certifiedBy = "DRACO AI Governance Board (Auto-Staged)"
    status = "DRAFT"
    description = "Auto-staged payload absorbing $pendingCRs pending Change Requests and recent Positive Drift."
    aevGatesCleared = $false
    incorporatedCRs = $pendingCRs
}

$draftPath = Join-Path $stagingDir "$nextCsrId.draft.json"
$draftPayload | ConvertTo-Json -Depth 5 | Out-File $draftPath -Encoding utf8

Write-Host "✅ AI-Led CSR Preparation complete. Staged $nextCsrId draft." -ForegroundColor Green