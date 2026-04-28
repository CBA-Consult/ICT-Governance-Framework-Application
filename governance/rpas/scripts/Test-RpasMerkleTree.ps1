param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force
$govRoot = Get-RpasGovernanceRoot
$artifactsPath = Join-Path $govRoot "artifacts"
$merklePath = Join-Path $govRoot "status\merkle-root.json"

$csrFiles = Get-ChildItem -Path $artifactsPath -Filter "CSR-*.json" | Sort-Object Name
if ($csrFiles.Count -eq 0) { exit 0 }

$cumulativeHash = ""
$sha256 = [System.Security.Cryptography.SHA256]::Create()

foreach ($file in $csrFiles) {
    $content = Get-Content $file.FullName -Raw
    $normalizedContent = $content -replace "`r`n", "`n"
    
    # Hash = SHA256( PreviousHash + CurrentFileContent )
    $payload = $cumulativeHash + $normalizedContent
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    $hashBytes = $sha256.ComputeHash($bytes)
    $cumulativeHash = -join ($hashBytes | ForEach-Object { $_.ToString('x2') })
}
$sha256.Dispose()

$merkleData = @{
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    algorithm = "SHA256 Chained (Merkle)"
    certifiedReleasesCount = $csrFiles.Count
    chainOfTrustRoot = $cumulativeHash
    status = "SECURE"
}

$merkleData | ConvertTo-Json -Depth 3 | Out-File $merklePath -Encoding utf8
Write-Host "🔐 CSR Chain-of-Trust Merkle Root computed: $cumulativeHash"