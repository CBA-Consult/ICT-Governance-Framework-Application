
param(
    [string]$MarkdownFile,
    [string]$ConfluenceBaseUrl,
    [string]$SpaceKey,
    [string]$ParentPageId,
    [string]$PageTitle,
    [string]$Email, # Your Atlassian email
    [string]$ApiToken, # Your Atlassian API token
    [string[]]$Labels,
    [switch]$BatchMode,

    [string]$LogFile
)

# Set default log file if not provided
if (-not $LogFile -or $LogFile -eq "") {
    $LogFile = Join-Path $PSScriptRoot "publish-log.txt"
}

function Publish-MarkdownToConfluence {
    param(
        [string]$MarkdownFile,
        [string]$ConfluenceBaseUrl,
        [string]$SpaceKey,
        [string]$ParentPageId,
        [string]$PageTitle,
        [string]$Email,
        [string]$ApiToken,
        [string[]]$Labels
    )
    Write-Host "DEBUG: Processing file: $MarkdownFile"
    if ($LogFile) { Add-Content -Path $LogFile -Value "DEBUG: Processing file: $MarkdownFile" }
    # Check if file exists and is not empty
    if (-not (Test-Path $MarkdownFile)) {
        $msg = "SKIP: $MarkdownFile does not exist."
        Write-Host $msg
        if ($LogFile) { Add-Content -Path $LogFile -Value $msg }
        return
    }
    $markdown = try { Get-Content $MarkdownFile -Raw } catch { $null }
    if (-not $markdown -or $markdown.Trim().Length -eq 0) {
        $msg = "SKIP: $MarkdownFile is empty or unreadable."
        Write-Host $msg
        if ($LogFile) { Add-Content -Path $LogFile -Value $msg }
        return
    }
    $html = $null
    try {
        $html = ConvertFrom-Markdown -InputObject $markdown | Select-Object -ExpandProperty Html
    } catch {
        $msg = "ERROR: ConvertFrom-Markdown failed for $MarkdownFile -> $($_.Exception.Message)"
        Write-Host $msg
        if ($LogFile) { Add-Content -Path $LogFile -Value $msg }
        return
    }
    $base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$Email`:$ApiToken"))
    $headers = @{ Authorization = "Basic $base64AuthInfo"; "Content-Type" = "application/json" }
    # Always check if the page exists first (by title and spaceKey)
    $searchUrl = "$ConfluenceBaseUrl/rest/api/content?title=$( [uri]::EscapeDataString($PageTitle) )&spaceKey=$SpaceKey&expand=version"
    $existingPage = $null
    try {
        $searchResult = Invoke-RestMethod -Uri $searchUrl -Headers $headers -Method Get
        if ($searchResult.results.Count -gt 0) {
            $existingPage = $searchResult.results[0]
        }
    } catch {
        Write-Host "[DEBUG] Failed to search for existing page: $_" -ForegroundColor Yellow
        if ($LogFile) { Add-Content -Path $LogFile -Value "[DEBUG] Failed to search for existing page: $($_ | Out-String)" }
    }
    $jsonPayload = @{
        type = "page"
        title = $PageTitle
        ancestors = @(@{ id = $ParentPageId })
        space = @{ key = $SpaceKey }
        body = @{ storage = @{ value = $html; representation = "storage" } }
    } | ConvertTo-Json -Depth 10
    Write-Host "DEBUG: Payload for ${MarkdownFile}: ${jsonPayload}"
    if ($LogFile) { Add-Content -Path $LogFile -Value "DEBUG: Payload for ${MarkdownFile}: ${jsonPayload}" }
    if ($existingPage) {
        # Page exists, do PUT (update)
        $pageId = $existingPage.id
        $currentVersion = $existingPage.version.number
        $updatePayload = @{
            id = $pageId
            type = "page"
            title = $PageTitle
            ancestors = @(@{ id = $ParentPageId })
            space = @{ key = $SpaceKey }
            body = @{ storage = @{ value = $html; representation = "storage" } }
            version = @{ number = ($currentVersion + 1) }
        } | ConvertTo-Json -Depth 10
        $updateUrl = "$ConfluenceBaseUrl/rest/api/content/$pageId"
        Write-Host "[DEBUG] Update URL: $updateUrl" -ForegroundColor Gray
        Write-Host "[DEBUG] Update payload for ${MarkdownFile}:`n$updatePayload`n" -ForegroundColor Gray
        if ($LogFile) {
            Add-Content -Path $LogFile -Value "[DEBUG] Update URL: $updateUrl"
            Add-Content -Path $LogFile -Value "[DEBUG] Update payload for ${MarkdownFile}:`n$updatePayload`n"
        }
        try {
            Invoke-RestMethod -Uri $updateUrl -Method Put -Headers $headers -Body $updatePayload -ContentType 'application/json'
            $msg = "Successfully updated $MarkdownFile as $PageTitle (Page ID: $pageId)"
            Write-Host $msg
            if ($LogFile) { Add-Content -Path $LogFile -Value $msg }
            # Set labels via separate API call if needed
            if ($Labels -and $Labels.Count -gt 0) {
                foreach ($label in $Labels) {
                    $labelPayload = @{ prefix = 'global'; name = $label } | ConvertTo-Json
                    $labelUrl = "$ConfluenceBaseUrl/rest/api/content/$pageId/label"
                    try {
                        Invoke-RestMethod -Uri $labelUrl -Method Post -Headers $headers -Body "[$labelPayload]" -ContentType 'application/json'
                        Write-Host "[DEBUG] Added label '$label' to page $pageId" -ForegroundColor Gray
                        if ($LogFile) { Add-Content -Path $LogFile -Value "[DEBUG] Added label '$label' to page $pageId" }
                    } catch {
                        Write-Host ('[DEBUG] Failed to add label ''{0}'' to page {1}: {2}' -f $label, $pageId, $_) -ForegroundColor Yellow
                        if ($LogFile) { Add-Content -Path $LogFile -Value ('[DEBUG] Failed to add label ''{0}'' to page {1}: {2}' -f $label, $pageId, $_) }
                    }
                }
            }
        } catch {
            $updateError = $_
            $msg = "ERROR: Failed to update existing page $PageTitle. ExceptionType: $($updateError.Exception.GetType().FullName) Message: $($updateError.Exception.Message)"
            Write-Host $msg -ForegroundColor Red
            if ($LogFile) { Add-Content -Path $LogFile -Value $msg }
            throw $msg
        }
    } else {
        # Page does not exist, do POST (create)
        if (-not $ParentPageId) {
            $msg = "ERROR: ParentPageId is required to create a new page ($PageTitle)."
            Write-Host $msg -ForegroundColor Red
            if ($LogFile) { Add-Content -Path $LogFile -Value $msg }
            throw $msg
        }
        try {
            $response = Invoke-RestMethod -Uri "$ConfluenceBaseUrl/rest/api/content" -Headers $headers -Method Post -Body $jsonPayload
            $msg = "SUCCESS: Created $MarkdownFile as $PageTitle -> $($response._links.web)"
            Write-Host $msg
            if ($LogFile) { Add-Content -Path $LogFile -Value $msg }
        } catch {
            $apiError = $_
            $msg = "ERROR: Failed to create new page $PageTitle. ExceptionType: $($apiError.Exception.GetType().FullName) Message: $($apiError.Exception.Message)"
            Write-Host $msg -ForegroundColor Red
            if ($LogFile) { Add-Content -Path $LogFile -Value $msg }
            throw $msg
        }
    }
    # Verification loop: check if the page now exists in Confluence (after create or update attempt)
    $verifyUrl = "$($ConfluenceBaseUrl)/rest/api/content?title=$( [uri]::EscapeDataString($PageTitle) )&spaceKey=$($SpaceKey)&expand=version"
    $maxTries = 5
    $found = $false
    for ($i = 1; $i -le $maxTries; $i++) {
        try {
            Start-Sleep -Seconds 2
            Write-Host ('[DEBUG] Verification attempt {0} for {1}: {2}' -f $i, $PageTitle, $verifyUrl) -ForegroundColor Gray            if ($LogFile) { Add-Content -Path $LogFile -Value ('[DEBUG] Verification attempt {0} for {1}: {2}' -f $i, $PageTitle, $verifyUrl) }
            $verifyResponse = Invoke-RestMethod -Uri $verifyUrl -Headers $headers -Method Get
            if ($LogFile) { Add-Content -Path $LogFile -Value "[DEBUG] Raw verifyResponse: $($verifyResponse | ConvertTo-Json -Depth 10)" }
            if ($verifyResponse.results -and $verifyResponse.results.Count -gt 0) {
                $found = $true
                Write-Host "Verified: $PageTitle is available in Confluence (id: $($verifyResponse.results[0].id))" -ForegroundColor Cyan
                if ($LogFile) { Add-Content -Path $LogFile -Value "VERIFIED: $PageTitle (id: $($verifyResponse.results[0].id))" }
                break
            } else {
                Write-Host "[DEBUG] No results found for $PageTitle on attempt $i." -ForegroundColor Yellow
                if ($LogFile) { Add-Content -Path $LogFile -Value "[DEBUG] No results found for $PageTitle on attempt $i." }
            }
        } catch {
            Write-Host "Verification attempt $i failed for ${PageTitle}: $_" -ForegroundColor Yellow
            if ($LogFile) { Add-Content -Path $LogFile -Value "[DEBUG] Verification attempt $i failed for ${PageTitle}: $_" }
        }
    }
    if (-not $found) {
        Write-Host "FAILED TO VERIFY: $PageTitle was not found in Confluence after $maxTries attempts." -ForegroundColor Red
        if ($LogFile) { Add-Content -Path $LogFile -Value "FAILED TO VERIFY: $PageTitle after $maxTries attempts" }
        throw "Verification failed for $PageTitle. Halting script execution."
    }
}

# Set defaults from environment variables if not provided
if (-not $ConfluenceBaseUrl) { $ConfluenceBaseUrl = $env:CONFLUENCE_BASE_URL }
if (-not $SpaceKey) { $SpaceKey = $env:SPACE_KEY }
if (-not $ParentPageId) { $ParentPageId = $env:PARENT_PAGE_ID }
if (-not $Email) { $Email = $env:EMAIL }
if (-not $ApiToken) { $ApiToken = $env:API_TOKEN }
if (-not $Labels -and $env:LABELS) { $Labels = $env:LABELS -split ',' | ForEach-Object { $_.Trim() } }

if ($BatchMode) {
    $mdFiles = Get-ChildItem -Path $PSScriptRoot -Recurse -Filter *.md | Where-Object { $_.FullName -notmatch "node_modules" }
    foreach ($file in $mdFiles) {
        $title = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        $folderName = Split-Path $file.DirectoryName -Leaf
        $autoLabels = @($folderName)
        $content = $null
        try {
            $content = Get-Content $file.FullName -Raw
        } catch {
            $msg = "SKIP: $($file.FullName) is unreadable."
            Write-Host $msg
            if ($LogFile) { Add-Content -Path $LogFile -Value $msg }
            continue
        }
        if (-not $content -or $content.Trim().Length -eq 0) {
            $msg = "SKIP: $($file.FullName) is empty."
            Write-Host $msg
            if ($LogFile) { Add-Content -Path $LogFile -Value $msg }
            continue
        }
        if ($content -match "(?ms)^---\s*(.*?)\s*---") {
            $yaml = $Matches[1]
            if ($yaml -match "tags:\s*\[(.*?)\]") {
                $tags = $Matches[1] -split ","
                foreach ($tag in $tags) { $autoLabels += $tag.Trim().Trim('"').Trim("'") }
            } elseif ($yaml -match "keywords:\s*\[(.*?)\]") {
                $tags = $Matches[1] -split ","
                foreach ($tag in $tags) { $autoLabels += $tag.Trim().Trim('"').Trim("'") }
            } elseif ($yaml -match "tags:\s*(.+)") {
                $tags = $Matches[1] -split ","
                foreach ($tag in $tags) { $autoLabels += $tag.Trim().Trim('"').Trim("'") }
            } elseif ($yaml -match "keywords:\s*(.+)") {
                $tags = $Matches[1] -split ","
                foreach ($tag in $tags) { $autoLabels += $tag.Trim().Trim('"').Trim("'") }
            }
        }
        if ($Labels) { $autoLabels += $Labels }
        $autoLabels = $autoLabels | Where-Object { $_ -and $_ -ne '' } | Select-Object -Unique
        try {
            Publish-MarkdownToConfluence -MarkdownFile $file.FullName -ConfluenceBaseUrl $ConfluenceBaseUrl -SpaceKey $SpaceKey -ParentPageId $ParentPageId -PageTitle $title -Email $Email -ApiToken $ApiToken -Labels $autoLabels
        } catch {
            Write-Host "Batch mode halted: $_" -ForegroundColor Red
            exit 1
        }
    }
} elseif ($MarkdownFile) {
    $title = $PageTitle
    if (-not $title) { $title = [System.IO.Path]::GetFileNameWithoutExtension($MarkdownFile) }
    Publish-MarkdownToConfluence -MarkdownFile $MarkdownFile -ConfluenceBaseUrl $ConfluenceBaseUrl -SpaceKey $SpaceKey -ParentPageId $ParentPageId -PageTitle $title -Email $Email -ApiToken $ApiToken -Labels $Labels
} else {
    Write-Host "Please specify either -MarkdownFile or -BatchMode."
}

