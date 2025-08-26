Import-Module .\ICT-Governance-Framework.psd1 -Force
$res = Connect-GovAzure -EnumerateTenants
if ($res -and $res.Count -gt 0) { $res | Select-Object -First 5 | Format-Table -AutoSize } else { Write-Host 'No results returned' }
