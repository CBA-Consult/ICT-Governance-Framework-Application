param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force
$govRoot = Get-RpasGovernanceRoot
$genomePath = Join-Path $govRoot "status\governance-genome.json"
$fitnessPath = Join-Path $govRoot "status\evolutionary-fitness.md"
$gomPath = Join-Path $govRoot "status\governance-integrity.json"

if (-not (Test-Path $genomePath)) { exit 0 }
$genome = Get-Content $genomePath | ConvertFrom-Json
$gom = if (Test-Path $gomPath) { Get-Content $gomPath | ConvertFrom-Json } else { $null }

$integrityScore = if ($gom) { $gom.integrityIndex } else { 100 }
$environmentalPressure = if ($gom) { $gom.riskScore } else { 0 }

# Fitness Function: Integrity - Environmental Risk + Genetic Traits Base Score
$calculatedFitness = [math]::Round(($integrityScore - $environmentalPressure) + $genome.fitnessScore, 2)
$genome.fitnessScore = $calculatedFitness
$genome | ConvertTo-Json -Depth 5 | Out-File $genomePath -Encoding utf8

$survivalStatus = if ($calculatedFitness -ge 100) { "🧬 DOMINANT (Adapted to Environment)" } else { "⚠️ RECESSIVE (Sub-optimal Fitness)" }

$md = @"
# 🔬 Evolutionary Fitness Report
**Evaluation Date:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ssZ')
**Generation:** $($genome.generation)
**DNA Hash:** `$($genome.dnaSequence)`

## Genetic Fitness Assessment
- **Calculated Fitness Score:** $calculatedFitness
- **Environmental Pressure (Risk):** $environmentalPressure
- **Selection Status:** $survivalStatus

*The Evolutionary Engine continually subjects the framework's rule tolerances to micro-mutations. Only dominant genomes are permanently codified into the DRACO AI Auditor's logic.*
"@

$md | Out-File $fitnessPath -Encoding utf8
Write-Host "✅ Evolutionary Fitness evaluated: $calculatedFitness ($survivalStatus)"