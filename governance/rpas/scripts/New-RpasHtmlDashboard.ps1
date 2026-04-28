param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force

$govRoot = Get-RpasGovernanceRoot
$statusJsonPath = Join-Path $govRoot "status\status.json"
$htmlPath = Join-Path $govRoot "status\dashboard.html"
$checksumPath = Join-Path $govRoot "governance_checksum.json"
$gomPath = Join-Path $govRoot "status\governance-integrity.json"
$merklePath = Join-Path $govRoot "status\merkle-root.json"
$consensusPath = Join-Path $govRoot "status\federated-consensus.md"
$negoPath = Join-Path $govRoot "status\agent-negotiation-log.md"
$metaPath = Join-Path $govRoot "status\meta-simulation.md"
$genomePath = Join-Path $govRoot "status\governance-genome.json"

if (-not (Test-Path $statusJsonPath)) {
    Write-Warning "status.json not found. Run generate-status.ps1 first."
    exit 0
}

$status = Get-Content $statusJsonPath | ConvertFrom-Json
$checksum = if (Test-Path $checksumPath) { Get-Content $checksumPath | ConvertFrom-Json } else { $null }
$gom = if (Test-Path $gomPath) { Get-Content $gomPath | ConvertFrom-Json } else { $null }
$merkle = if (Test-Path $merklePath) { Get-Content $merklePath | ConvertFrom-Json } else { $null }
$consensus = if (Test-Path $consensusPath) { Get-Content $consensusPath -Raw } else { "" }
$negoExists = Test-Path $negoPath
$metaExists = Test-Path $metaPath
$genome = if (Test-Path $genomePath) { Get-Content $genomePath | ConvertFrom-Json } else { $null }

$date = (Get-Date).ToString("yyyy-MM-dd HH:mm:ssZ")
$baselineColor = if ($status.governanceBaseline) { "#107c10" } else { "#d13438" }
$driftColor = if ($status.driftDetected) { "#d13438" } else { "#107c10" }
$integrityColor = if ($status.integrityIndex -ge 80) { "#107c10" } elseif ($status.integrityIndex -ge 60) { "#ffa500" } else { "#d13438" }
$merkleColor = if ($status.merkleStatus -eq "SECURE") { "#107c10" } else { "#d13438" }
$fedColor = if ($consensus -match "Global Consensus Achieved") { "#107c10" } else { "#d13438" }

$html = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ADPA RPAS-CM Governance Dashboard</title>
    <style>
        :root { --bg: #0d1117; --card-bg: #161b22; --text: #c9d1d9; --border: #30363d; --accent: #58a6ff; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { border-bottom: 1px solid var(--border); padding-bottom: 20px; margin-bottom: 20px; }
        h1 { margin: 0; color: #fff; }
        .meta { color: #8b949e; font-size: 0.9em; margin-top: 5px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 6px; padding: 20px; }
        .card h2 { margin-top: 0; font-size: 1.2em; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
        .status-indicator { display: inline-block; padding: 5px 10px; border-radius: 20px; font-weight: bold; color: white; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.9em; }
        th { color: #8b949e; font-weight: normal; }
        code { background: rgba(110,118,129,0.4); padding: 2px 5px; border-radius: 4px; font-family: monospace; font-size: 0.85em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ ADPA RPAS-CM Dashboard</h1>
            <div class="meta">Last Updated: $date | Engine: DRACO Governance Board</div>
        </div>
        <div class="grid">
            <div class="card">
                <h2>Certification Status</h2>
                <p>Baseline Integrity: <span class="status-indicator" style="background: $baselineColor">$($status.governanceBaseline)</span></p>
                <p>Drift Detected: <span class="status-indicator" style="background: $driftColor">$($status.driftDetected)</span></p>
                <p>AEV Gates Passed: <strong>$($status.aevGatesPassed)</strong></p>
            </div>
            <div class="card">
                <h2>Active Release (CSR)</h2>
                <p><strong>ID:</strong> <code>$($status.csrInfo.id)</code></p>
                <p><strong>Version:</strong> $($status.csrInfo.version)</p>
                <p><strong>Date:</strong> $($status.csrInfo.certificationDate)</p>
            </div>
        </div>
        <div class="grid" style="margin-top: 20px;">
            <div class="card">
                <h2>🧠 DRACO AI Auditor</h2>
                <p>Governance Integrity Index: <span class="status-indicator" style="background: $integrityColor">$($status.integrityIndex) / 100</span></p>
                <p><strong>Risk Severity:</strong> $($gom.severity ?? 'N/A')</p>
                <p><strong>Predictive Insight:</strong> <br><em>$($gom.predictiveAnalysis ?? 'N/A')</em></p>
            </div>
            <div class="card">
                <h2>🔗 Merkle Chain-of-Trust</h2>
                <p>Chain Verification: <span class="status-indicator" style="background: $merkleColor">$($status.merkleStatus)</span></p>
                <p><strong>Root Hash:</strong> <br><code style="word-break: break-all; color: var(--accent);">$($merkle.chainOfTrustRoot ?? 'N/A')</code></p>
                <p><strong>Total CSRs Secured:</strong> $($merkle.certifiedReleasesCount ?? 0)</p>
            </div>
            <div class="card">
                <h2>💡 Innovation & IP (Octrooi)</h2>
                <p>Positive Drift Events: <strong>$($gom.positiveDriftCount ?? 0)</strong></p>
                <p>IP / Patent Candidates: <strong>$($gom.ipCandidatesCount ?? 0)</strong></p>
                <p><em>Pending Legal / Change Request Review</em></p>
            </div>
        </div>
        <div class="grid" style="margin-top: 20px;">
            <div class="card" style="border-color: #d29922;">
                <h2 style="color: #d29922;">🌌 Tier IX: Governance Singularity</h2>
                <p>Agent Negotiation Log: <strong>$(if($negoExists){'ACTIVE'}else{'IDLE'})</strong></p>
                <p>Meta-Simulation: <strong>$(if($metaExists){'PASSED'}else{'IDLE'})</strong></p>
                <p>Autonomous AMDs: <strong>Pending Human Veto</strong></p>
                <p><em>The system is actively directing its own policy evolution.</em></p>
            </div>
            <div class="card" style="border-color: #8957e5;">
                <h2 style="color: #8957e5;">🧬 Tier X: Governance DNA</h2>
                <p>Evolutionary Generation: <span class="status-indicator" style="background: #8957e5">Gen $($genome.generation ?? 0)</span></p>
                <p><strong>Genome Hash:</strong> <code style="word-break: break-all;">$($genome.dnaSequence ?? 'N/A')</code></p>
                <p><strong>Fitness Score:</strong> $($genome.fitnessScore ?? 0)</p>
                <p><em>Applying natural selection to rule tolerances.</em></p>
            </div>
        </div>
        <div class="card" style="margin-top: 20px;">
            <h2>🌐 Enterprise Federated Fabric</h2>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <p>Network Consensus State: <span class="status-indicator" style="background: $fedColor">$(if($fedColor -eq '#107c10') {'SYNC ACTIVE'} else {'NODE ISOLATED'})</span></p>
                <p><strong>Cross-Domain Risk:</strong> $(if($fedColor -eq '#107c10') {'LOW (Contained)'} else {'ELEVATED (Quarantined)'})</p>
            </div>
            <p><em>This node broadcasts its Governance Object Model to the central ADPA enterprise event bus.</em></p>
        </div>
        <div class="card" style="margin-top: 20px;">
            <h2>Cryptographic Ledger</h2>
            <p><strong>Governance ID:</strong> <code>$($checksum.governanceId ?? 'N/A')</code></p>
            <p><strong>Combined Hash (SHA256):</strong> <br><code style="word-break: break-all; color: var(--accent);">$($checksum.combinedHash ?? 'N/A')</code></p>
            <p><strong>Monitored Files:</strong> $($checksum.fileCount ?? 0)</p>
        </div>
    </div>
</body>
</html>
"@

$html | Out-File $htmlPath -Encoding utf8
Write-Host "✅ HTML Dashboard generated at $htmlPath"