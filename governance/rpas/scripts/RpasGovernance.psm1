Set-StrictMode -Version Latest

function Get-RpasProjectRoot {
    $projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
    return $projectRoot.Path
}

function Get-RpasGovernanceRoot {
    return (Join-Path (Get-RpasProjectRoot) 'governance\rpas')
}

function Resolve-RpasRepoPath {
    param(
        [Parameter(Mandatory)]
        [string]$RelativePath
    )

    return (Join-Path (Get-RpasProjectRoot) $RelativePath)
}

function Read-RpasJsonFile {
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Required RPAS file was not found: $Path"
    }

    return (Get-Content -LiteralPath $Path -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop)
}

function Write-RpasJsonFile {
    param(
        [Parameter(Mandatory)]
        [string]$Path,

        [Parameter(Mandatory)]
        [object]$Content
    )

    $directory = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }

    $json = $Content | ConvertTo-Json -Depth 20
    $normalizedJson = (($json -split "`r?`n") -join "`n") + "`n"
    Set-Content -LiteralPath $Path -Value $normalizedJson -NoNewline -Encoding utf8
}

function Get-RpasManifest {
    return (Read-RpasJsonFile -Path (Resolve-RpasRepoPath 'governance/rpas/manifest.json'))
}

function Get-RpasBindingConfig {
    return (Read-RpasJsonFile -Path (Resolve-RpasRepoPath 'governance/rpas/project.binding.json'))
}

function Get-RpasChecksumContent {
    $path = Resolve-RpasRepoPath 'governance/rpas/governance_checksum.json'
    if (-not (Test-Path -LiteralPath $path)) {
        return $null
    }

    return (Read-RpasJsonFile -Path $path)
}

function Test-RpasObjectKeys {
    param(
        [Parameter(Mandatory)]
        [object]$InputObject,

        [Parameter(Mandatory)]
        [string[]]$RequiredKeys,

        [Parameter(Mandatory)]
        [string]$Context
    )

    $errors = @()
    foreach ($requiredKey in $RequiredKeys) {
        if ($requiredKey -notin $InputObject.PSObject.Properties.Name) {
            $errors += "$Context is missing required key '$requiredKey'."
        }
    }

    return $errors
}

function Get-RpasRequiredFiles {
    $manifest = Get-RpasManifest
    return @($manifest.requiredFiles | ForEach-Object {
        [pscustomobject]@{
            RelativePath = $_
            FullPath = Resolve-RpasRepoPath $_
        }
    })
}

function Get-RpasFilesToHash {
    $manifest = Get-RpasManifest
    $excluded = @($manifest.hashExclusions)

    return @((Get-RpasRequiredFiles) | Where-Object { $_.RelativePath -notin $excluded })
}

function Get-RpasNormalizedFileHash {
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    $content = Get-Content -LiteralPath $Path -Raw -ErrorAction Stop
    $normalizedContent = $content -replace "`r`n", "`n"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($normalizedContent)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()

    try {
        $hashBytes = $sha256.ComputeHash($bytes)
    }
    finally {
        $sha256.Dispose()
    }

    return (-join ($hashBytes | ForEach-Object { $_.ToString('x2') }))
}

function New-RpasCombinedHash {
    param(
        [Parameter(Mandatory)]
        [object[]]$FileRecords
    )

    $payload = ($FileRecords |
        Sort-Object RelativePath |
        ForEach-Object { '{0}:{1}' -f $_.RelativePath, $_.Hash }) -join "`n"

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()

    try {
        $hashBytes = $sha256.ComputeHash($bytes)
    }
    finally {
        $sha256.Dispose()
    }

    return (-join ($hashBytes | ForEach-Object { $_.ToString('x2') }))
}

function New-RpasChecksum {
    $manifest = Get-RpasManifest
    $records = foreach ($file in Get-RpasFilesToHash) {
        if (-not (Test-Path -LiteralPath $file.FullPath)) {
            throw "Cannot compute RPAS checksum because a required file is missing: $($file.RelativePath)"
        }

        [pscustomobject]@{
            RelativePath = $file.RelativePath
            Hash = Get-RpasNormalizedFileHash -Path $file.FullPath
        }
    }

    return [pscustomobject]@{
        governanceId = $manifest.governanceId
        baselineVersion = $manifest.baselineVersion
        algorithm = 'SHA256'
        generatedOnUtc = [DateTime]::UtcNow.ToString('o')
        fileCount = $records.Count
        combinedHash = New-RpasCombinedHash -FileRecords $records
        files = @($records)
    }
}

function Save-RpasChecksum {
    $checksum = New-RpasChecksum
    $path = Resolve-RpasRepoPath 'governance/rpas/governance_checksum.json'
    Write-RpasJsonFile -Path $path -Content $checksum
    return $checksum
}

function Get-RpasHooksDirectory {
    $git = Get-Command git -ErrorAction SilentlyContinue
    if ($git) {
        $hooksPath = (& git rev-parse --git-path hooks 2>$null)
        if ($LASTEXITCODE -eq 0 -and $hooksPath) {
            if ([System.IO.Path]::IsPathRooted($hooksPath)) {
                return $hooksPath
            }

            return (Join-Path (Get-RpasProjectRoot) $hooksPath)
        }
    }

    return (Join-Path (Get-RpasProjectRoot) '.git\hooks')
}

function Register-RpasGovernance {
    param(
        [switch]$SkipHookInstall,
        [switch]$RefreshChecksum
    )

    $binding = Get-RpasBindingConfig
    $hookInstalled = $false
    $hooksDirectory = Get-RpasHooksDirectory
    $hookPath = Join-Path $hooksDirectory 'pre-commit'

    if (-not $SkipHookInstall) {
        if (-not (Test-Path -LiteralPath $hooksDirectory)) {
            New-Item -ItemType Directory -Path $hooksDirectory -Force | Out-Null
        }

        $templatePath = Resolve-RpasRepoPath $binding.paths.hookTemplate
        Copy-Item -LiteralPath $templatePath -Destination $hookPath -Force

        $chmod = Get-Command chmod -ErrorAction SilentlyContinue
        if ($chmod) {
            & $chmod.Source +x $hookPath | Out-Null
        }

        $hookInstalled = $true
    }

    $checksum = if ($RefreshChecksum) { Save-RpasChecksum } else { Get-RpasChecksumContent }
    $statePath = Join-Path (Get-RpasGovernanceRoot) '.state\registration.json'
    $state = [pscustomobject]@{
        registeredOnUtc = [DateTime]::UtcNow.ToString('o')
        projectId = $binding.projectId
        hookInstalled = $hookInstalled
        hooksDirectory = $hooksDirectory
        checksum = if ($checksum) { $checksum.combinedHash } else { $null }
    }

    Write-RpasJsonFile -Path $statePath -Content $state

    return [pscustomobject]@{
        ProjectId = $binding.projectId
        HookInstalled = $hookInstalled
        HooksDirectory = $hooksDirectory
        RegistrationStatePath = $statePath
        Checksum = if ($checksum) { $checksum.combinedHash } else { $null }
    }
}

function Test-RpasGovernanceBaseline {
    param(
        [switch]$SkipChecksum
    )

    $errors = @()
    $warnings = @()
    $currentChecksum = $null
    $storedChecksum = $null

    try {
        $manifest = Get-RpasManifest
    }
    catch {
        return [pscustomobject]@{
            IsValid = $false
            Errors = @($_.Exception.Message)
            Warnings = @()
            CurrentChecksum = $null
            StoredChecksum = $null
        }
    }

    try {
        $binding = Get-RpasBindingConfig
    }
    catch {
        return [pscustomobject]@{
            IsValid = $false
            Errors = @($_.Exception.Message)
            Warnings = @()
            CurrentChecksum = $null
            StoredChecksum = $null
        }
    }

    $errors += Test-RpasObjectKeys -InputObject $manifest -RequiredKeys @('manifestVersion', 'governanceId', 'baselineVersion', 'requiredFiles', 'artifacts', 'enforcement') -Context 'governance/rpas/manifest.json'
    $errors += Test-RpasObjectKeys -InputObject $binding -RequiredKeys @('projectId', 'repository', 'governanceRoot', 'integrationMethod', 'paths', 'enforcement') -Context 'governance/rpas/project.binding.json'

    foreach ($file in Get-RpasRequiredFiles) {
        if (-not (Test-Path -LiteralPath $file.FullPath)) {
            $errors += "Missing required RPAS file: $($file.RelativePath)"
        }
    }

    foreach ($artifact in @($manifest.artifacts)) {
        $artifactPath = Resolve-RpasRepoPath $artifact.path
        if (-not (Test-Path -LiteralPath $artifactPath)) {
            $errors += "Missing RPAS artifact file: $($artifact.path)"
            continue
        }

        try {
            $artifactContent = Read-RpasJsonFile -Path $artifactPath
            $errors += Test-RpasObjectKeys -InputObject $artifactContent -RequiredKeys @($artifact.requiredKeys) -Context $artifact.path

            if (($artifactContent.PSObject.Properties.Name -contains 'artifactId') -and $artifactContent.artifactId -ne $artifact.id) {
                $errors += "Artifact identifier mismatch in $($artifact.path). Expected '$($artifact.id)' but found '$($artifactContent.artifactId)'."
            }
        }
        catch {
            $errors += "Failed to parse RPAS artifact file $($artifact.path): $($_.Exception.Message)"
        }
    }

    foreach ($pathName in @('validator', 'register', 'hookTemplate', 'checksum', 'evidenceTemplate')) {
        if ($pathName -notin $binding.paths.PSObject.Properties.Name) {
            $errors += "project.binding.json is missing paths.$pathName."
            continue
        }

        $boundPath = Resolve-RpasRepoPath $binding.paths.$pathName
        if (-not (Test-Path -LiteralPath $boundPath)) {
            $errors += "Configured RPAS path does not exist: $($binding.paths.$pathName)"
        }
    }

    if (-not $SkipChecksum) {
        $storedChecksumContent = Get-RpasChecksumContent
        if (-not $storedChecksumContent) {
            $errors += 'Missing RPAS checksum file: governance/rpas/governance_checksum.json'
        }
        else {
            $storedChecksum = $storedChecksumContent.combinedHash
            $currentChecksumContent = New-RpasChecksum
            $currentChecksum = $currentChecksumContent.combinedHash

            if ($storedChecksum -ne $currentChecksum) {
                $errors += "RPAS checksum mismatch. Stored '$storedChecksum' but computed '$currentChecksum'. Run ./governance/rpas/scripts/validate-aev.ps1 -RefreshChecksum after intentional governance changes."
            }
        }
    }
    else {
        $warnings += 'Checksum validation was skipped.'
    }

    return [pscustomobject]@{
        IsValid = ($errors.Count -eq 0)
        Errors = @($errors)
        Warnings = @($warnings)
        CurrentChecksum = $currentChecksum
        StoredChecksum = $storedChecksum
    }
}

Export-ModuleMember -Function Get-RpasBindingConfig, Get-RpasChecksumContent, Get-RpasGovernanceRoot, Get-RpasHooksDirectory, Get-RpasManifest, Get-RpasProjectRoot, New-RpasChecksum, Register-RpasGovernance, Save-RpasChecksum, Test-RpasGovernanceBaseline
