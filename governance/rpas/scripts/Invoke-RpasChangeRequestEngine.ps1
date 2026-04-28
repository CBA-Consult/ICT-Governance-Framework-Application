param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force
$govRoot = Get-RpasGovernanceRoot
$crDir = Join-Path $govRoot "status\change-requests"
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"

if (-not (Test-Path $crDir)) { New-Item -ItemType Directory -Path $crDir -Force | Out-Null }

# Data Sources
$archDriftPath = Join-Path $govRoot "status\arch-drift-report.md"
$govDriftPath = Join-Path $govRoot "status\drift-report.md"
$gomPath = Join-Path $govRoot "status\governance-integrity.json"

$gom = if (Test-Path $gomPath) { Get-Content $gomPath | ConvertFrom-Json } else { $null }
$crGenerated = 0

function Write-CR {
    param([string]$Type, [string]$Title, [string]$Description, [string]$Action)
    $crId = "CR-$timestamp-$($Type.ToUpper())"
    $crPath = Join-Path $crDir "$crId.md"
    $md = @"
# 📝 Auto-Generated Change Request: $crId
**Type:** $Type Drift Remediation / Formalization
**Date:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ssZ')

## 📌 Title: $Title
**Description:** 
$Description

## 🚀 Suggested Action:
$Action
"@
    $md | Out-File $crPath -Encoding utf8
    Write-Host "✅ CR Suggested: $crId ($Type)"
}

if (Test-Path $archDriftPath) {
    Write-CR -Type "Architectural" -Title "Architecture Review & Manifest Alignment" -Description "New or removed resources detected in the Aspire orchestration manifest." -Action "Conduct Architectural Impact Review and update the target CSR baseline to absorb this drift."
    $crGenerated++
}

if (Test-Path $govDriftPath) {
    Write-CR -Type "Governance" -Title "Baseline Correction & Checksum Registration" -Description "Cryptographic mismatch detected in the governance ledger." -Action "Execute AEV Gate 4 to re-register the CSR integrity checksum."
    $crGenerated++
}

if ($gom -and $gom.positiveDriftCount -gt 0) {
    Write-CR -Type "Innovation" -Title "Formalize Positive Drift" -Description "Beneficial capability expansion or automation detected." -Action "Absorb this positive drift into a formal CSR release and assess for IP retention."
    $crGenerated++
}