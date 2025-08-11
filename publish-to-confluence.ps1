param(
    [string]$MarkdownFile
    ,[string]$ConfluenceBaseUrl
    ,[string]$SpaceKey
    ,[string]$ParentPageId
    ,[string]$PageTitle
    ,[string]$Email # Your Atlassian email
    ,[string]$ApiToken # Your Atlassian API token
    ,[string[]]$Labels
    ,[switch]$BatchMode
    ,[string]$LogFile
)

function Import-EnvFile {
    param([string]$Path)
    if (Test-Path $Path) {
        $lines = Get-Content $Path | Where-Object { $_ -and -not $_.StartsWith('#') }
        foreach ($line in $lines) {
            if ($line -match '^(.*?)=(.*)$') {
                $key = $Matches[1].Trim()
                $val = $Matches[2].Trim()
                [System.Environment]::SetEnvironmentVariable($key, $val)
            }
        }
    }
}

Import-EnvFile -Path "$PSScriptRoot/.env"


# Set defaults for parameters if not provided
if (-not $MarkdownFile) { $MarkdownFile = "" }
if (-not $PageTitle) { $PageTitle = "" }
if (-not $BatchMode) { $BatchMode = $false }
if (-not $LogFile) { $LogFile = "publish-log.txt" }

# Set defaults from environment variables if not provided
if (-not $ConfluenceBaseUrl) { $ConfluenceBaseUrl = $env:CONFLUENCE_BASE_URL }
if (-not $SpaceKey) { $SpaceKey = $env:SPACE_KEY }
if (-not $ParentPageId) { $ParentPageId = $env:PARENT_PAGE_ID }
if (-not $Email) { $Email = $env:EMAIL }
if (-not $ApiToken) { $ApiToken = $env:API_TOKEN }
if (-not $Labels -and $env:LABELS) { $Labels = $env:LABELS -split ',' | ForEach-Object { $_.Trim() } }

# If LABELS env var is set, use as default for $Labels
if (-not $PSBoundParameters.ContainsKey('Labels') -and $env:LABELS) {
    $Labels = $env:LABELS -split ',' | ForEach-Object { $_.Trim() }
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
    try {
        $markdown = Get-Content $MarkdownFile -Raw
        $html = ConvertFrom-Markdown -Markdown $markdown | Select-Object -ExpandProperty Html
        $payload = @{
            type = "page"
            title = $PageTitle
            ancestors = @(@{ id = $ParentPageId })
            space = @{ key = $SpaceKey }
            body = @{ storage = @{ value = $html; representation = "storage" } }
        } | ConvertTo-Json -Depth 10
        $base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$Email`:$ApiToken"))
        $response = Invoke-RestMethod -Uri "$ConfluenceBaseUrl/rest/api/content" `
            -Headers @{ Authorization = "Basic $base64AuthInfo"; "Content-Type" = "application/json" } `
            -Method Post `
            -Body $payload
        $msg = "SUCCESS: $MarkdownFile -> $($response._links.web)"
        Write-Host $msg
        Add-Content -Path $LogFile -Value $msg

        # Add labels if provided
        if ($Labels.Count -gt 0) {
            $labelPayload = @{ labels = @() }
            foreach ($label in $Labels) {
                $labelPayload.labels += @{ prefix = "global"; name = $label }
            }
            $labelJson = $labelPayload | ConvertTo-Json -Depth 5
            $contentId = $response.id
            $labelUrl = "$ConfluenceBaseUrl/rest/api/content/$contentId/label"
            Invoke-RestMethod -Uri $labelUrl `
                -Headers @{ Authorization = "Basic $base64AuthInfo"; "Content-Type" = "application/json" } `
                -Method Post `
                -Body $labelJson
            Write-Host "Labels added: $($Labels -join ', ')"
        }
    } catch {
        $err = "ERROR: $MarkdownFile -> $($_.Exception.Message)"
        Write-Host $err
        Add-Content -Path $LogFile -Value $err
    }
}

if ($BatchMode) {
    $mdFiles = Get-ChildItem -Path (Split-Path $PSScriptRoot -Parent) -Recurse -Filter *.md
    foreach ($file in $mdFiles) {
        $title = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        # Use the immediate parent folder name as the label
        $folderName = Split-Path $file.DirectoryName -Leaf
        $autoLabels = @($folderName)

        # Parse YAML front-matter for tags/keywords
        $content = Get-Content $file.FullName -Raw
        if ($content -match "(?ms)^---\s*(.*?)\s*---") {
            $yaml = $Matches[1]
            # Look for 'tags' or 'keywords' in YAML (array or comma-separated)
            if ($yaml -match "tags:\s*\[(.*?)\]") {
                $tags = $Matches[1] -split ","
                foreach ($tag in $tags) {
                    $autoLabels += $tag.Trim().Trim('"').Trim("'")
                }
            } elseif ($yaml -match "keywords:\s*\[(.*?)\]") {
                $tags = $Matches[1] -split ","
                foreach ($tag in $tags) {
                    $autoLabels += $tag.Trim().Trim('"').Trim("'")
                }
            } elseif ($yaml -match "tags:\s*(.+)") {
                $tags = $Matches[1] -split ","
                foreach ($tag in $tags) {
                    $autoLabels += $tag.Trim().Trim('"').Trim("'")
                }
            } elseif ($yaml -match "keywords:\s*(.+)") {
                $tags = $Matches[1] -split ","
                foreach ($tag in $tags) {
                    $autoLabels += $tag.Trim().Trim('"').Trim("'")
                }
            }
        }

        if ($Labels) { $autoLabels += $Labels }
        # Remove duplicates and empty labels
        $autoLabels = $autoLabels | Where-Object { $_ -and $_ -ne '' } | Select-Object -Unique
        Publish-MarkdownToConfluence -MarkdownFile $file.FullName -ConfluenceBaseUrl $ConfluenceBaseUrl -SpaceKey $SpaceKey -ParentPageId $ParentPageId -PageTitle $title -Email $Email -ApiToken $ApiToken -Labels $autoLabels
    }
} elseif ($MarkdownFile) {
    $title = $PageTitle
    if (-not $title) {
        $title = [System.IO.Path]::GetFileNameWithoutExtension($MarkdownFile)
    }
    Publish-MarkdownToConfluence -MarkdownFile $MarkdownFile -ConfluenceBaseUrl $ConfluenceBaseUrl -SpaceKey $SpaceKey -ParentPageId $ParentPageId -PageTitle $title -Email $Email -ApiToken $ApiToken -Labels $Labels
} else {
    Write-Host "Please specify either -MarkdownFile or -BatchMode."
}
