param()
$ErrorActionPreference = 'Stop'

$repoRoot = (Get-Item $PSScriptRoot/../../..).FullName
$manifestPath = Join-Path $repoRoot "governance/rpas/status/aspire-manifest.json"
$graphPath = Join-Path $repoRoot "governance/rpas/status/architecture.md"

if (-not (Test-Path $manifestPath)) {
    Write-Host "No Aspire manifest found. Skipping architecture graph generation."
    exit 0
}

$manifest = Get-Content $manifestPath | ConvertFrom-Json
$resources = $manifest.resources.PSObject.Properties

$md = @"
# 🏗️ ADPA Architectural Topology
This diagram is auto-generated from the `.NET Aspire` orchestration manifest, representing the actual execution boundaries of the framework.

```mermaid
graph TD
"@

foreach ($res in $resources) {
    $name = $res.Name
    $type = $res.Value.type
    
    # Styling based on Aspire resource type
    if ($type -match "project") {
        $md += "    $name([⚙️ $name])`n"
    } elseif ($type -match "container" -or $type -match "redis" -or $type -match "postgres") {
        $md += "    $name[(🗄️ $name)]`n"
    } elseif ($type -match "executable") {
        $md += "    $name>🚀 $name]`n"
    } else {
        $md += "    $name[$name]`n"
    }
    
    # Map basic references if they exist in standard Aspire format
    if ($res.Value.references) {
        foreach ($ref in $res.Value.references) {
            $md += "    $name --> $($ref)`n"
        }
    }
}
$md += "```\n"
$md | Out-File $graphPath -Encoding utf8
Write-Host "✅ Visual Architecture Graph generated at $graphPath"