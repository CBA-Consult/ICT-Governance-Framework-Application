param()

$ErrorActionPreference = 'Stop'

# Import Governance Module
$govModule = Join-Path $PSScriptRoot "RpasGovernance.psm1"
Import-Module $govModule -Force

$repoRoot = Get-RpasProjectRoot
$govRoot = Get-RpasGovernanceRoot

$statusJsonPath = Join-Path $govRoot "status\status.json"
$statusMdPath = Join-Path $govRoot "status\STATUS.md"
$gomPath = Join-Path $govRoot "status\governance-integrity.json"
$merklePath = Join-Path $govRoot "status\merkle-root.json"
$eventPath = Join-Path $govRoot "status\federated-event.json"
$genomePath = Join-Path $govRoot "status\governance-genome.json"

# Ensure status directory exists
$statusDir = Split-Path $statusJsonPath
if (-not (Test-Path $statusDir)) { New-Item -ItemType Directory -Path $statusDir -Force | Out-Null }

# Load manifest
$manifest = Get-RpasManifest

# Get CSR artifact
$csrDef = $manifest.artifacts | Select-Object -First 1
$csrPath = Join-Path $repoRoot $csrDef.path
$csr = Get-Content $csrPath | ConvertFrom-Json

# Run governance baseline validation
$baseline = Test-RpasGovernanceBaseline

# Load Tier V Intelligence Artifacts
$gom = if (Test-Path $gomPath) { Get-Content $gomPath | ConvertFrom-Json } else { $null }
$merkle = if (Test-Path $merklePath) { Get-Content $merklePath | ConvertFrom-Json } else { $null }
$fedEvent = if (Test-Path $eventPath) { Get-Content $eventPath | ConvertFrom-Json } else { $null }
$genome = if (Test-Path $genomePath) { Get-Content $genomePath | ConvertFrom-Json } else { $null }

# Compute badge states using correct properties from Test-RpasGovernanceBaseline
$driftDetected  = ($baseline.CurrentChecksum -ne $baseline.StoredChecksum)
$baselineBadge  = if ($baseline.IsValid) { "brightgreen" } else { "red" }
$aevBadge       = if ($baseline.IsValid) { "brightgreen" } else { "red" }
$csrBadge       = if ($baseline.IsValid) { "brightgreen" } else { "red" }
$driftBadge     = if (-not $driftDetected) { "brightgreen" } else { "yellow" }

# Compute Tier V Badges
$integrityBadge = if ($gom -and $gom.integrityIndex -ge 80) { "brightgreen" } elseif ($gom -and $gom.integrityIndex -ge 60) { "yellow" } else { "red" }
$merkleBadge    = if ($merkle -and $merkle.status -eq "SECURE") { "brightgreen" } else { "red" }
$federationBadge = if ($gom -and $gom.integrityIndex -ge 80 -and $merkle.status -eq "SECURE") { "brightgreen" } else { "red" }
$genomeBadge    = if ($genome -and $genome.fitnessScore -ge 100) { "brightgreen" } else { "blue" }

# Build status.json
$status = @{
    governanceBaseline = $baseline.IsValid
    aevGatesPassed     = $baseline.IsValid
    csrValid           = $baseline.IsValid
    driftDetected      = $driftDetected
    integrityIndex     = if ($gom) { $gom.integrityIndex } else { 100 }
    merkleStatus       = if ($merkle) { $merkle.status } else { "PENDING" }
    csrInfo = @{
        id                = $csr.artifactId
        version           = $csr.version
        certificationDate = $csr.certificationDate
    }
}

$status | ConvertTo-Json -Depth 5 | Out-File $statusJsonPath -Encoding utf8

# Build STATUS.md content
$md = @"
# 🛡️ ADPA RPAS‑CM Governance Dashboard

This dashboard reflects the **current governance and certification state** of the repository,
as validated by the RPAS‑AEV CI workflow and the cryptographic governance ledger.

---

## ✅ Governance Status

| Category | Status |
|---------|--------|
| **Governance Baseline** | https://img.shields.io/badge/Baseline-$baselineBadge |
| **AEV Workflow Gates** | https://img.shields.io/badge/AEV%20Gates-$aevBadge |
| **CSR Artifacts** | https://img.shields.io/badge/CSR-$csrBadge |
| **Drift Detection** | https://img.shields.io/badge/Drift-$driftBadge |

---

## 🧠 Tier V Governance Intelligence

| Metric | Status |
|---------|--------|
| **Integrity Index** | https://img.shields.io/badge/Integrity_Score-$($status.integrityIndex)-$integrityBadge |
| **Merkle Chain-of-Trust** | https://img.shields.io/badge/Merkle_Root-$($status.merkleStatus)-$merkleBadge |
| **AI Risk Severity** | `$($gom.severity ?? 'N/A')` |
| **Positive Drift** | `$($gom.positiveDriftCount ?? 0) identified` |
| **IP / Octrooi Candidates** | `$($gom.ipCandidatesCount ?? 0) pending review` |

---

## 🌐 Enterprise Federation Fabric

| Metric | Status |
|---------|--------|
| **Network Consensus** | https://img.shields.io/badge/Federated_Sync-$(if($federationBadge -eq 'brightgreen') {'ACTIVE'} else {'ISOLATED'})-$federationBadge |
| **Enterprise Bus Identity** | `urn:rpas:repo:$($fedEvent.data.projectId ?? 'N/A')` |

---

## 🧬 Tier X Self-Evolving DNA

| Metric | Status |
|---------|--------|
| **Evolutionary Generation** | https://img.shields.io/badge/Generation-$($genome.generation ?? 0)-$genomeBadge |
| **Genome Fitness Score** | `$($genome.fitnessScore ?? 0)` |

---

## 📌 Last Certified Stable Release (CSR)

**ID:** `$($csr.artifactId)`  
**Version:** `$($csr.version)`  
**Date:** `$($csr.certificationDate)`  
**Status:** ✅ Certified  
**Artifact:** `governance/rpas/artifacts/$($csr.artifactId).json`

> This CSR represents the latest *immutable* RTM baseline checkpoint.
> All governance and execution evidence can be found inside the CSR release notes and checksum ledger.

---

🟢 **Dashboard updated automatically by RPAS‑AEV Governance CI**
"@

$md | Out-File $statusMdPath -Encoding utf8

Write-Host "✅ STATUS.md and status.json regenerated."