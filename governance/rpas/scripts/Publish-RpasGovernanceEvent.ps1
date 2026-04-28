param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force
$govRoot = Get-RpasGovernanceRoot
$gomPath = Join-Path $govRoot "status\governance-integrity.json"
$eventPath = Join-Path $govRoot "status\federated-event.json"

if (-not (Test-Path $gomPath)) { exit 0 }
$gom = Get-Content $gomPath | ConvertFrom-Json
$manifest = Get-RpasManifest
$binding = Get-RpasBindingConfig

# Construct an Enterprise-ready CloudEvent payload
$event = @{
    specversion = "1.0"
    type = "eu.cbaconsult.rpas.governance.state_updated"
    source = "urn:rpas:repo:$($binding.projectId)"
    id = [guid]::NewGuid().ToString()
    time = (Get-Date).ToString("o")
    datacontenttype = "application/json"
    data = @{
        projectId = $binding.projectId
        baselineVersion = $manifest.baselineVersion
        integrityIndex = $gom.integrityIndex
        riskSeverity = $gom.severity
        merkleStatus = $gom.merkleStatus
        actionableMitigations = $gom.actionableMitigationsCount
    }
}

$event | ConvertTo-Json -Depth 5 | Out-File $eventPath -Encoding utf8
Write-Host "✅ Federated Governance Event prepared at $eventPath" -ForegroundColor Cyan