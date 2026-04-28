param()
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot "RpasGovernance.psm1") -Force
$govRoot = Get-RpasGovernanceRoot
$genomePath = Join-Path $govRoot "status\governance-genome.json"

# Define the base genome (Generation 0)
$defaultGenome = @{
    generation = 0
    dnaSequence = [guid]::NewGuid().ToString()
    traits = @{
        gate3VarianceTolerance = 0.05
        driftForgivenessFactor = 0.10
        riskSeverityThreshold = 80
        mutationRate = 0.02
    }
    fitnessScore = 0
}

if (-not (Test-Path $genomePath)) {
    $genome = $defaultGenome
    Write-Host "🧬 Initializing Governance Genome (Generation 0)..." -ForegroundColor Cyan
} else {
    $genome = Get-Content $genomePath | ConvertFrom-Json
    
    # Evolve to next generation
    $genome.generation += 1
    $genome.dnaSequence = [guid]::NewGuid().ToString()
    
    # Introduce micro-mutations based on the mutationRate
    $rand = New-Object Random
    $mutation = ($rand.NextDouble() * 2 - 1) * $genome.traits.mutationRate
    
    $genome.traits.gate3VarianceTolerance = [math]::Round([math]::Max(0.01, $genome.traits.gate3VarianceTolerance + $mutation), 3)
    $genome.traits.driftForgivenessFactor = [math]::Round([math]::Max(0.05, $genome.traits.driftForgivenessFactor - ($mutation * 0.5)), 3)
    
    # Randomly shift the risk threshold slightly (simulating adaptation to stress)
    $thresholdShift = $rand.Next(-2, 3)
    $genome.traits.riskSeverityThreshold = [math]::Clamp($genome.traits.riskSeverityThreshold + $thresholdShift, 70, 95)
    
    Write-Host "🧬 Evolving to Generation $($genome.generation). Micro-mutations applied." -ForegroundColor Magenta
}

# Calculate a simulated baseline fitness before stress testing
$genome.fitnessScore = ($genome.traits.riskSeverityThreshold * 0.5) + ($genome.traits.driftForgivenessFactor * 100)

$genome | ConvertTo-Json -Depth 5 | Out-File $genomePath -Encoding utf8
Write-Host "✅ Evolutionary Engine completed. Genome saved at $genomePath"