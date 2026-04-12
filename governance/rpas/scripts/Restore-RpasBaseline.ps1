param(
    [Parameter(Mandatory=$true)]
    [string]$CsrId
)
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force
$repoRoot = Get-RpasProjectRoot
Set-Location $repoRoot

Write-Host "🔍 Searching for certification commit of $CsrId..."
# Find the commit where the CSR artifact was officially promoted
$commitHash = git log --all --grep="SAFE (RPAS): Promoted baseline to $CsrId" --format="%H" -n 1
if (-not $commitHash) {
    Write-Error "Could not find a SAFE (RPAS) certification commit for $CsrId. Ensure the ID is correct (e.g., CSR-42)."
    exit 1
}

Write-Host "⏪ Initiating Time Travel to commit $commitHash..."
git checkout $commitHash

Write-Host "🔐 Verifying cryptographic integrity of restored baseline..."
# Reload module from the checked-out state to ensure compatibility
Import-Module (Join-Path $repoRoot "governance/rpas/scripts/RpasGovernance.psm1") -Force
$baseline = Test-RpasGovernanceBaseline

if ($baseline.IsValid -and ($baseline.CurrentChecksum -eq $baseline.StoredChecksum)) {
    Write-Host "✅ Time Travel successful! $CsrId restored and cryptographically verified." -ForegroundColor Green
} else {
    Write-Warning "⚠️ Baseline restored, but cryptographic verification failed. The ledger may have been tampered with post-certification."
}