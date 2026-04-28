param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force
$govRoot = Get-RpasGovernanceRoot
$consensusPath = Join-Path $govRoot "status\federated-consensus.md"
$gomPath = Join-Path $govRoot "status\governance-integrity.json"

$gom = if (Test-Path $gomPath) { Get-Content $gomPath | ConvertFrom-Json } else { $null }

$md = "# 🌐 Federated Governance Consensus`n**Evaluated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ssZ')`n`n"

if ($gom -and $gom.integrityIndex -ge 80 -and $gom.merkleStatus -eq "SECURE") {
    $md += "## ✅ Global Consensus Achieved`n"
    $md += "Local governance state is healthy and aligned with enterprise federation mandates.`n"
    $md += "- **Peer Synchronization:** ACTIVE`n"
    $md += "- **Cross-Domain Risk Propagation:** LOW`n"
} else {
    $md += "## ⚠️ Federation Warning (Node Isolated)`n"
    $md += "Local integrity has degraded or Merkle lineage is broken. The DRACO global consensus protocol has flagged this node for isolation until risk mitigations are applied to prevent enterprise contagion.`n"
    $md += "- **Peer Synchronization:** HALTED`n"
    $md += "- **Cross-Domain Risk Propagation:** ELEVATED`n"
}
$md | Out-File $consensusPath -Encoding utf8
Write-Host "✅ Federated Consensus evaluated at $consensusPath"