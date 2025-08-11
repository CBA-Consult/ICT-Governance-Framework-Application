# Requires: .env file in project root with JIRA_BASE_URL, JIRA_PROJECT_KEY, EMAIL, API_TOKEN
# This script creates a JIRA Task for every activity in the activity-list.md file.

# Load .env variables
$envPath = ".env"
Get-Content $envPath | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($name, $value)
    }
}

$jiraBaseUrl = $env:JIRA_BASE_URL
$jiraProjectKey = $env:JIRA_PROJECT_KEY
$email = $env:EMAIL
$apiToken = $env:API_TOKEN

if (-not $jiraBaseUrl -or -not $jiraProjectKey -or -not $email -or -not $apiToken) {
    Write-Error "Missing required .env variables (JIRA_BASE_URL, JIRA_PROJECT_KEY, EMAIL, API_TOKEN)"
    exit 1
}

# Parse all activities from activity-list.md
$activityFile = "generated-documents/planning-artifacts/activity-list.md"
$activityLines = Get-Content $activityFile
$activities = @()
$current = $null
foreach ($line in $activityLines) {
    if ($line -match "^\*\*Activity ID: ([A-Z0-9]+)\*\*") {
        if ($current) { $activities += $current }
        $current = @{ id = $matches[1]; summary = ""; desc = "" }
    } elseif ($line -match "^\- \*\*Activity Name:\*\* (.+)") {
        if ($current) { $current.summary = $matches[1] }
    } elseif ($line -match "^\- \*\*Description:\*\* (.+)") {
        if ($current) { $current.desc = $matches[1] }
    } elseif ($line -match "^\| ([A-Z0-9]+) \| ([^|]+) \| [^|]+ \| [^|]+ \| [^|]+ \|") {
        # Table row fallback (for summary tables)
        if ($current) {
            $current.id = $matches[1]
            $current.summary = $matches[2].Trim()
        }
    }
}
if ($current) { $activities += $current }

# Remove duplicates (by id)
$activities = $activities | Sort-Object id -Unique

$headers = @{
    "Authorization" = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$email`:$apiToken"))
    "Content-Type"  = "application/json"
    "Accept"        = "application/json"
}

foreach ($activity in $activities) {
    if (-not $activity.id -or -not $activity.summary) { continue }
    # Convert description to Atlassian Document Format (ADF)
    $adfDescription = @{
        type = "doc"
        version = 1
        content = @(
            @{
                type = "paragraph"
                content = @(
                    @{
                        type = "text"
                        text = $activity.desc
                    }
                )
            }
        )
    }

    $payload = @{
        fields = @{
            project     = @{ key = $jiraProjectKey }
            summary     = "$($activity.id): $($activity.summary)"
            description = $adfDescription
            issuetype   = @{ name = "Task" }
        }
    } | ConvertTo-Json -Depth 10

    $url = "$jiraBaseUrl/rest/api/3/issue"
    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $payload
        Write-Host "Created JIRA Task: $($activity.id) -> $($response.key)"
    } catch {
        Write-Host "Failed to create JIRA Task for $($activity.id): $($_.Exception.Message)" -ForegroundColor Red
        # PowerShell 7+ returns .ErrorRecord.Response.Content as a string
        $errorResponse = $null
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
            $errorResponse = $_.ErrorDetails.Message
        } elseif ($_.Exception.Response -and ($_.Exception.Response -is [System.Net.Http.HttpResponseMessage])) {
            $stream = $_.Exception.Response.Content.ReadAsStreamAsync().Result
            $reader = New-Object System.IO.StreamReader($stream)
            $errorResponse = $reader.ReadToEnd()
        }
        if ($errorResponse) {
            Write-Host "JIRA API response: $errorResponse" -ForegroundColor Yellow
        }
    }
}
