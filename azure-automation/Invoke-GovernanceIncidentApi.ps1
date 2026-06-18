# Invoke-GovernanceIncidentApi.ps1
# Gate A — POST compliance violations to the live governance incident API.
# Dot-source from automation runbooks: . .\Invoke-GovernanceIncidentApi.ps1

function Map-ComplianceSeverityToGovernance {
    param([string]$Severity)

    switch ($Severity.ToLower()) {
        'critical' { return 'CRITICAL' }
        'high'     { return 'HIGH' }
        'medium'   { return 'MEDIUM' }
        'low'      { return 'LOW' }
        default    { return 'HIGH' }
    }
}

function Invoke-GovernanceIncidentApi {
    param(
        [string]$ApiUrl = $(if ($env:GOVERNANCE_API_URL) { $env:GOVERNANCE_API_URL } else { 'http://localhost:4000' }),
        [string]$WebhookSecret = $env:GOVERNANCE_WEBHOOK_SECRET,
        [hashtable]$Payload
    )

    if (-not $WebhookSecret) {
        throw 'GOVERNANCE_WEBHOOK_SECRET environment variable is required.'
    }

    $headers = @{
        'x-governance-webhook-secret' = $WebhookSecret
        'Content-Type'                = 'application/json'
    }

    $uri = "$($ApiUrl.TrimEnd('/'))/api/governance/incidents"
    $body = $Payload | ConvertTo-Json -Depth 10 -Compress

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body
    $stopwatch.Stop()

    return @{
        Response  = $response
        LatencyMs = $stopwatch.ElapsedMilliseconds
    }
}
