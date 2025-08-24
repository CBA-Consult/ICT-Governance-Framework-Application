# Runner: import module and save Connect-GovAzure -EnumerateTenants output to JSON
Import-Module "$PSScriptRoot\ICT-Governance-Framework.psd1" -Force
# Ensure output folder exists
$reportDir = Join-Path -Path $PSScriptRoot -ChildPath 'governance-reports'
if (!(Test-Path -Path $reportDir)) { New-Item -Path $reportDir -ItemType Directory -Force | Out-Null }

$res = Connect-GovAzure -EnumerateTenants
if ($res -and $res.Count -gt 0) {
    $out = $res | Select-Object -First 50
    $out | ConvertTo-Json -Depth 5 | Out-File -FilePath (Join-Path $reportDir 'enumeration-output.json') -Force
    Write-Host "Saved enumeration to governance-reports\enumeration-output.json"
} else {
    Write-Host 'No results returned'
}
