# Monitor Collaboration Platforms Compliance and Usage
# A014 - Collaboration Platforms Monitoring and Compliance Script
# This script monitors the health, usage, and compliance of deployed collaboration platforms

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$TenantId,
    
    [Parameter(Mandatory = $false)]
    [string]$ConfigPath = "./collaboration-config.json",
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("Daily", "Weekly", "Monthly", "OnDemand")]
    [string]$ReportType = "Daily",
    
    [Parameter(Mandatory = $false)]
    [string]$OutputPath = "./reports",
    
    [Parameter(Mandatory = $false)]
    [switch]$SendEmail,
    
    [Parameter(Mandatory = $false)]
    [string[]]$EmailRecipients = @("governance-council@company.com"),
    
    [Parameter(Mandatory = $false)]
    [switch]$GenerateAlerts
)

# Import required modules
$RequiredModules = @(
    'Microsoft.Graph',
    'MicrosoftTeams',
    'PnP.PowerShell',
    'Microsoft.PowerApps.Administration.PowerShell',
    'Az.Monitor'
)

foreach ($Module in $RequiredModules) {
    try {
        if (!(Get-Module -ListAvailable -Name $Module)) {
            Write-Warning "Installing required module: $Module"
            Install-Module -Name $Module -Force -AllowClobber -Scope CurrentUser
        }
        Import-Module -Name $Module -Force
        Write-Host "✅ Module $Module loaded successfully" -ForegroundColor Green
    }
    catch {
        Write-Error "❌ Failed to load module $Module`: $_"
        exit 1
    }
}

# Initialize logging
$LogFile = "Monitor-CollaborationPlatforms-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

# Load configuration
function Load-Configuration {
    param([string]$ConfigPath)
    
    if (-not (Test-Path $ConfigPath)) {
        Write-Log "Configuration file not found: $ConfigPath" "ERROR"
        throw "Configuration file not found"
    }
    
    try {
        $config = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json
        Write-Log "Configuration loaded from: $ConfigPath" "INFO"
        return $config
    }
    catch {
        Write-Log "Failed to load configuration: $_" "ERROR"
        throw
    }
}

# Connect to services
function Connect-ToServices {
    param([string]$TenantId)
    
    try {
        Write-Log "Connecting to Microsoft Graph..." "INFO"
        Connect-MgGraph -TenantId $TenantId -Scopes "Group.Read.All", "Directory.Read.All", "Sites.Read.All", "Reports.Read.All", "AuditLog.Read.All"
        
        Write-Log "Connecting to Microsoft Teams..." "INFO"
        Connect-MicrosoftTeams -TenantId $TenantId
        
        Write-Log "Connecting to Power Platform..." "INFO"
        Add-PowerAppsAccount
        
        Write-Log "✅ Successfully connected to all services" "INFO"
    }
    catch {
        Write-Log "❌ Failed to connect to services: $_" "ERROR"
        throw
    }
}

# Monitor Microsoft Teams
function Monitor-MicrosoftTeams {
    param([object]$TeamsConfig)
    
    Write-Log "📊 Monitoring Microsoft Teams..." "INFO"
    
    $teamsReport = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        platform = "Microsoft Teams"
        metrics = @{}
        compliance = @{}
        alerts = @()
    }
    
    try {
        # Get all teams
        $allTeams = Get-Team
        $teamsReport.metrics.totalTeams = $allTeams.Count
        
        # Check governance teams
        $governanceTeams = @()
        foreach ($teamConfig in $TeamsConfig.governanceTeams) {
            $team = $allTeams | Where-Object { $_.DisplayName -eq $teamConfig.name }
            if ($team) {
                $teamDetails = @{
                    name = $team.DisplayName
                    id = $team.GroupId
                    privacy = $team.Visibility
                    memberCount = (Get-TeamUser -GroupId $team.GroupId).Count
                    channelCount = (Get-TeamChannel -GroupId $team.GroupId).Count
                    lastActivity = $null
                }
                
                # Check for compliance issues
                if ($team.Visibility -ne $teamConfig.privacy) {
                    $teamsReport.alerts += @{
                        severity = "Medium"
                        message = "Team '$($team.DisplayName)' privacy setting doesn't match configuration"
                        team = $team.DisplayName
                        expected = $teamConfig.privacy
                        actual = $team.Visibility
                    }
                }
                
                $governanceTeams += $teamDetails
            }
            else {
                $teamsReport.alerts += @{
                    severity = "High"
                    message = "Governance team '$($teamConfig.name)' not found"
                    team = $teamConfig.name
                }
            }
        }
        
        $teamsReport.metrics.governanceTeams = $governanceTeams
        $teamsReport.metrics.governanceTeamsCount = $governanceTeams.Count
        
        # Check guest access compliance
        $teamsWithGuests = $allTeams | Where-Object { 
            (Get-TeamUser -GroupId $_.GroupId | Where-Object { $_.Role -eq "Guest" }).Count -gt 0 
        }
        
        if ($teamsWithGuests.Count -gt 0 -and -not $TeamsConfig.policies.guestAccess) {
            $teamsReport.alerts += @{
                severity = "High"
                message = "Guest access detected in $($teamsWithGuests.Count) teams but policy prohibits guest access"
                teamsWithGuests = $teamsWithGuests.DisplayName
            }
        }
        
        $teamsReport.metrics.teamsWithGuests = $teamsWithGuests.Count
        
        # Usage metrics (if available)
        try {
            $usageReport = Get-MgReportTeamsUserActivityUserDetail -Period "D30"
            $teamsReport.metrics.activeUsers30Days = ($usageReport | Where-Object { $_.LastActivityDate -gt (Get-Date).AddDays(-30) }).Count
        }
        catch {
            Write-Log "⚠️ Warning: Could not retrieve Teams usage metrics: $_" "WARNING"
        }
        
        $teamsReport.compliance.status = if ($teamsReport.alerts.Count -eq 0) { "Compliant" } else { "Non-Compliant" }
        $teamsReport.compliance.issuesCount = $teamsReport.alerts.Count
        
        Write-Log "✅ Microsoft Teams monitoring completed" "INFO"
        return $teamsReport
    }
    catch {
        Write-Log "❌ Microsoft Teams monitoring failed: $_" "ERROR"
        $teamsReport.compliance.status = "Error"
        $teamsReport.compliance.error = $_.Exception.Message
        return $teamsReport
    }
}

# Monitor SharePoint Online
function Monitor-SharePointOnline {
    param([object]$SharePointConfig)
    
    Write-Log "📊 Monitoring SharePoint Online..." "INFO"
    
    $sharepointReport = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        platform = "SharePoint Online"
        metrics = @{}
        compliance = @{}
        alerts = @()
    }
    
    try {
        # Get tenant information
        $tenantDomain = (Get-MgDomain | Where-Object { $_.IsDefault -eq $true }).Id
        $tenantPrefix = $tenantDomain.Split('.')[0]
        
        # Check governance sites
        $governanceSites = @()
        foreach ($siteConfig in $SharePointConfig.sites) {
            $siteUrl = "https://$tenantPrefix.sharepoint.com/sites/$($siteConfig.url)"
            
            try {
                Connect-PnPOnline -Url $siteUrl -Interactive
                $site = Get-PnPSite
                
                $siteDetails = @{
                    name = $site.Title
                    url = $site.Url
                    template = $site.WebTemplate
                    storageUsed = $site.StorageUsage
                    lastModified = $site.LastItemModifiedDate
                    userCount = (Get-PnPUser).Count
                }
                
                # Check document libraries
                $libraries = Get-PnPList | Where-Object { $_.BaseTemplate -eq 101 }
                $siteDetails.documentLibraries = $libraries.Count
                
                # Check versioning compliance
                foreach ($library in $libraries) {
                    $librarySettings = Get-PnPList -Identity $library.Title
                    if (-not $librarySettings.EnableVersioning -and $SharePointConfig.features.versioningEnabled) {
                        $sharepointReport.alerts += @{
                            severity = "Medium"
                            message = "Versioning not enabled for library '$($library.Title)' in site '$($site.Title)'"
                            site = $site.Title
                            library = $library.Title
                        }
                    }
                }
                
                $governanceSites += $siteDetails
            }
            catch {
                $sharepointReport.alerts += @{
                    severity = "High"
                    message = "Cannot access governance site '$($siteConfig.name)' at $siteUrl"
                    site = $siteConfig.name
                    url = $siteUrl
                    error = $_.Exception.Message
                }
            }
        }
        
        $sharepointReport.metrics.governanceSites = $governanceSites
        $sharepointReport.metrics.governanceSitesCount = $governanceSites.Count
        
        # Get tenant storage metrics
        try {
            $tenantInfo = Get-PnPTenant
            $sharepointReport.metrics.tenantStorageUsed = $tenantInfo.StorageUsage
            $sharepointReport.metrics.tenantStorageQuota = $tenantInfo.StorageQuota
            $sharepointReport.metrics.storageUtilization = [math]::Round(($tenantInfo.StorageUsage / $tenantInfo.StorageQuota) * 100, 2)
            
            if ($sharepointReport.metrics.storageUtilization -gt 80) {
                $sharepointReport.alerts += @{
                    severity = "Medium"
                    message = "Tenant storage utilization is high: $($sharepointReport.metrics.storageUtilization)%"
                }
            }
        }
        catch {
            Write-Log "⚠️ Warning: Could not retrieve tenant storage metrics: $_" "WARNING"
        }
        
        $sharepointReport.compliance.status = if ($sharepointReport.alerts.Count -eq 0) { "Compliant" } else { "Non-Compliant" }
        $sharepointReport.compliance.issuesCount = $sharepointReport.alerts.Count
        
        Write-Log "✅ SharePoint Online monitoring completed" "INFO"
        return $sharepointReport
    }
    catch {
        Write-Log "❌ SharePoint Online monitoring failed: $_" "ERROR"
        $sharepointReport.compliance.status = "Error"
        $sharepointReport.compliance.error = $_.Exception.Message
        return $sharepointReport
    }
}

# Monitor Power Platform
function Monitor-PowerPlatform {
    param([object]$PowerPlatformConfig)
    
    Write-Log "📊 Monitoring Power Platform..." "INFO"
    
    $powerPlatformReport = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        platform = "Power Platform"
        metrics = @{}
        compliance = @{}
        alerts = @()
    }
    
    try {
        # Get all environments
        $allEnvironments = Get-AdminPowerAppEnvironment
        $powerPlatformReport.metrics.totalEnvironments = $allEnvironments.Count
        
        # Check governance environments
        $governanceEnvironments = @()
        foreach ($envConfig in $PowerPlatformConfig.environments) {
            $environment = $allEnvironments | Where-Object { $_.DisplayName -eq $envConfig.name }
            if ($environment) {
                $envDetails = @{
                    name = $environment.DisplayName
                    id = $environment.EnvironmentName
                    type = $environment.EnvironmentType
                    region = $environment.Location
                    state = $environment.ProvisioningState
                    createdTime = $environment.CreatedTime
                }
                
                # Get apps in environment
                try {
                    $apps = Get-AdminPowerApp -EnvironmentName $environment.EnvironmentName
                    $envDetails.appsCount = $apps.Count
                }
                catch {
                    $envDetails.appsCount = "Unknown"
                }
                
                # Get flows in environment
                try {
                    $flows = Get-AdminFlow -EnvironmentName $environment.EnvironmentName
                    $envDetails.flowsCount = $flows.Count
                }
                catch {
                    $envDetails.flowsCount = "Unknown"
                }
                
                $governanceEnvironments += $envDetails
            }
            else {
                $powerPlatformReport.alerts += @{
                    severity = "High"
                    message = "Governance environment '$($envConfig.name)' not found"
                    environment = $envConfig.name
                }
            }
        }
        
        $powerPlatformReport.metrics.governanceEnvironments = $governanceEnvironments
        $powerPlatformReport.metrics.governanceEnvironmentsCount = $governanceEnvironments.Count
        
        # Check DLP policies
        try {
            $dlpPolicies = Get-AdminDlpPolicy
            $powerPlatformReport.metrics.dlpPoliciesCount = $dlpPolicies.Count
            
            if ($PowerPlatformConfig.dataLossPrevention.enabled -and $dlpPolicies.Count -eq 0) {
                $powerPlatformReport.alerts += @{
                    severity = "High"
                    message = "No DLP policies found but DLP is required by configuration"
                }
            }
        }
        catch {
            Write-Log "⚠️ Warning: Could not retrieve DLP policies: $_" "WARNING"
        }
        
        # Check for orphaned resources
        $defaultEnvironment = $allEnvironments | Where-Object { $_.IsDefault -eq $true }
        if ($defaultEnvironment) {
            try {
                $defaultApps = Get-AdminPowerApp -EnvironmentName $defaultEnvironment.EnvironmentName
                if ($defaultApps.Count -gt 10) {
                    $powerPlatformReport.alerts += @{
                        severity = "Medium"
                        message = "High number of apps in default environment: $($defaultApps.Count)"
                        recommendation = "Consider moving apps to dedicated environments"
                    }
                }
            }
            catch {
                Write-Log "⚠️ Warning: Could not check default environment apps: $_" "WARNING"
            }
        }
        
        $powerPlatformReport.compliance.status = if ($powerPlatformReport.alerts.Count -eq 0) { "Compliant" } else { "Non-Compliant" }
        $powerPlatformReport.compliance.issuesCount = $powerPlatformReport.alerts.Count
        
        Write-Log "✅ Power Platform monitoring completed" "INFO"
        return $powerPlatformReport
    }
    catch {
        Write-Log "❌ Power Platform monitoring failed: $_" "ERROR"
        $powerPlatformReport.compliance.status = "Error"
        $powerPlatformReport.compliance.error = $_.Exception.Message
        return $powerPlatformReport
    }
}

# Generate comprehensive report
function Generate-ComprehensiveReport {
    param(
        [object]$TeamsReport,
        [object]$SharePointReport,
        [object]$PowerPlatformReport,
        [string]$ReportType
    )
    
    Write-Log "📊 Generating comprehensive report..." "INFO"
    
    $comprehensiveReport = @{
        reportMetadata = @{
            generatedDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            reportType = $ReportType
            version = "1.0.0"
            framework = "ICT Governance Framework A014"
        }
        executiveSummary = @{
            overallCompliance = "Unknown"
            totalAlerts = 0
            criticalIssues = 0
            platforms = @{
                teams = $TeamsReport.compliance.status
                sharepoint = $SharePointReport.compliance.status
                powerPlatform = $PowerPlatformReport.compliance.status
            }
        }
        platformReports = @{
            teams = $TeamsReport
            sharepoint = $SharePointReport
            powerPlatform = $PowerPlatformReport
        }
        recommendations = @()
        actionItems = @()
    }
    
    # Calculate overall compliance
    $allAlerts = @()
    $allAlerts += $TeamsReport.alerts
    $allAlerts += $SharePointReport.alerts
    $allAlerts += $PowerPlatformReport.alerts
    
    $comprehensiveReport.executiveSummary.totalAlerts = $allAlerts.Count
    $comprehensiveReport.executiveSummary.criticalIssues = ($allAlerts | Where-Object { $_.severity -eq "High" }).Count
    
    $compliantPlatforms = @($TeamsReport, $SharePointReport, $PowerPlatformReport) | Where-Object { $_.compliance.status -eq "Compliant" }
    $comprehensiveReport.executiveSummary.overallCompliance = if ($compliantPlatforms.Count -eq 3) { "Compliant" } elseif ($compliantPlatforms.Count -eq 0) { "Non-Compliant" } else { "Partially Compliant" }
    
    # Generate recommendations
    if ($allAlerts.Count -gt 0) {
        $highSeverityAlerts = $allAlerts | Where-Object { $_.severity -eq "High" }
        if ($highSeverityAlerts.Count -gt 0) {
            $comprehensiveReport.recommendations += "Address $($highSeverityAlerts.Count) high-severity compliance issues immediately"
        }
        
        $mediumSeverityAlerts = $allAlerts | Where-Object { $_.severity -eq "Medium" }
        if ($mediumSeverityAlerts.Count -gt 0) {
            $comprehensiveReport.recommendations += "Plan remediation for $($mediumSeverityAlerts.Count) medium-severity issues within 30 days"
        }
    }
    
    if ($comprehensiveReport.executiveSummary.overallCompliance -eq "Compliant") {
        $comprehensiveReport.recommendations += "All platforms are compliant. Continue regular monitoring and maintenance."
    }
    
    # Generate action items
    foreach ($alert in $allAlerts | Where-Object { $_.severity -eq "High" }) {
        $comprehensiveReport.actionItems += @{
            priority = "High"
            description = $alert.message
            platform = if ($TeamsReport.alerts -contains $alert) { "Teams" } elseif ($SharePointReport.alerts -contains $alert) { "SharePoint" } else { "Power Platform" }
            dueDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
        }
    }
    
    # Save report
    if (-not (Test-Path $OutputPath)) {
        New-Item -Path $OutputPath -ItemType Directory -Force
    }
    
    $reportFileName = "collaboration-platforms-report-$ReportType-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $reportFilePath = Join-Path $OutputPath $reportFileName
    
    $comprehensiveReport | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportFilePath
    Write-Log "✅ Comprehensive report saved to: $reportFilePath" "INFO"
    
    # Generate HTML report for easier reading
    $htmlReportPath = $reportFilePath.Replace('.json', '.html')
    Generate-HTMLReport -Report $comprehensiveReport -OutputPath $htmlReportPath
    
    return $comprehensiveReport
}

# Generate HTML report
function Generate-HTMLReport {
    param(
        [object]$Report,
        [string]$OutputPath
    )
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Collaboration Platforms Monitoring Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #0078d4; color: white; padding: 20px; border-radius: 5px; }
        .summary { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .compliant { color: #28a745; font-weight: bold; }
        .non-compliant { color: #dc3545; font-weight: bold; }
        .partially-compliant { color: #ffc107; font-weight: bold; }
        .alert-high { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; margin: 5px 0; border-radius: 3px; }
        .alert-medium { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 5px 0; border-radius: 3px; }
        .alert-low { background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 10px; margin: 5px 0; border-radius: 3px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background-color: #e9ecef; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Collaboration Platforms Monitoring Report</h1>
        <p>Generated: $($Report.reportMetadata.generatedDate) | Type: $($Report.reportMetadata.reportType)</p>
    </div>
    
    <div class="summary">
        <h2>Executive Summary</h2>
        <div class="metric">
            <strong>Overall Compliance:</strong> 
            <span class="$(($Report.executiveSummary.overallCompliance -replace ' ', '-').ToLower())">$($Report.executiveSummary.overallCompliance)</span>
        </div>
        <div class="metric">
            <strong>Total Alerts:</strong> $($Report.executiveSummary.totalAlerts)
        </div>
        <div class="metric">
            <strong>Critical Issues:</strong> $($Report.executiveSummary.criticalIssues)
        </div>
    </div>
    
    <h2>Platform Status</h2>
    <table>
        <tr><th>Platform</th><th>Status</th><th>Alerts</th></tr>
        <tr>
            <td>Microsoft Teams</td>
            <td class="$(($Report.platformReports.teams.compliance.status -replace ' ', '-').ToLower())">$($Report.platformReports.teams.compliance.status)</td>
            <td>$($Report.platformReports.teams.alerts.Count)</td>
        </tr>
        <tr>
            <td>SharePoint Online</td>
            <td class="$(($Report.platformReports.sharepoint.compliance.status -replace ' ', '-').ToLower())">$($Report.platformReports.sharepoint.compliance.status)</td>
            <td>$($Report.platformReports.sharepoint.alerts.Count)</td>
        </tr>
        <tr>
            <td>Power Platform</td>
            <td class="$(($Report.platformReports.powerPlatform.compliance.status -replace ' ', '-').ToLower())">$($Report.platformReports.powerPlatform.compliance.status)</td>
            <td>$($Report.platformReports.powerPlatform.alerts.Count)</td>
        </tr>
    </table>
"@

    # Add alerts section
    $allAlerts = @()
    $allAlerts += $Report.platformReports.teams.alerts
    $allAlerts += $Report.platformReports.sharepoint.alerts
    $allAlerts += $Report.platformReports.powerPlatform.alerts
    
    if ($allAlerts.Count -gt 0) {
        $html += "<h2>Alerts and Issues</h2>"
        foreach ($alert in $allAlerts) {
            $alertClass = "alert-$($alert.severity.ToLower())"
            $html += "<div class='$alertClass'><strong>$($alert.severity):</strong> $($alert.message)</div>"
        }
    }
    
    # Add recommendations
    if ($Report.recommendations.Count -gt 0) {
        $html += "<h2>Recommendations</h2><ul>"
        foreach ($recommendation in $Report.recommendations) {
            $html += "<li>$recommendation</li>"
        }
        $html += "</ul>"
    }
    
    $html += "</body></html>"
    
    $html | Out-File -FilePath $OutputPath -Encoding UTF8
    Write-Log "✅ HTML report saved to: $OutputPath" "INFO"
}

# Send email notification
function Send-EmailNotification {
    param(
        [object]$Report,
        [string[]]$Recipients
    )
    
    if (-not $SendEmail) {
        return
    }
    
    Write-Log "📧 Sending email notification..." "INFO"
    
    $subject = "Collaboration Platforms Monitoring Report - $($Report.executiveSummary.overallCompliance)"
    $body = @"
Collaboration Platforms Monitoring Report

Generated: $($Report.reportMetadata.generatedDate)
Report Type: $($Report.reportMetadata.reportType)

Executive Summary:
- Overall Compliance: $($Report.executiveSummary.overallCompliance)
- Total Alerts: $($Report.executiveSummary.totalAlerts)
- Critical Issues: $($Report.executiveSummary.criticalIssues)

Platform Status:
- Microsoft Teams: $($Report.platformReports.teams.compliance.status)
- SharePoint Online: $($Report.platformReports.sharepoint.compliance.status)
- Power Platform: $($Report.platformReports.powerPlatform.compliance.status)

For detailed information, please review the full report.

This is an automated message from the ICT Governance Framework monitoring system.
"@

    try {
        # Note: Email sending would require SMTP configuration or Graph API
        # This is a placeholder for the email functionality
        Write-Log "Email notification prepared for: $($Recipients -join ', ')" "INFO"
        Write-Log "Subject: $subject" "INFO"
        Write-Log "✅ Email notification would be sent (SMTP configuration required)" "INFO"
    }
    catch {
        Write-Log "❌ Failed to send email notification: $_" "ERROR"
    }
}

# Main execution
try {
    Write-Log "🚀 Starting A014 - Collaboration Platforms Monitoring" "INFO"
    Write-Log "Report Type: $ReportType" "INFO"
    
    # Load configuration
    $config = Load-Configuration -ConfigPath $ConfigPath
    
    # Connect to services
    Connect-ToServices -TenantId $TenantId
    
    # Monitor platforms
    $teamsReport = Monitor-MicrosoftTeams -TeamsConfig $config.teams
    $sharepointReport = Monitor-SharePointOnline -SharePointConfig $config.sharepoint
    $powerPlatformReport = Monitor-PowerPlatform -PowerPlatformConfig $config.powerPlatform
    
    # Generate comprehensive report
    $comprehensiveReport = Generate-ComprehensiveReport -TeamsReport $teamsReport -SharePointReport $sharepointReport -PowerPlatformReport $powerPlatformReport -ReportType $ReportType
    
    # Send email notification if requested
    if ($SendEmail) {
        Send-EmailNotification -Report $comprehensiveReport -Recipients $EmailRecipients
    }
    
    # Generate alerts if requested
    if ($GenerateAlerts -and $comprehensiveReport.executiveSummary.criticalIssues -gt 0) {
        Write-Log "🚨 CRITICAL ALERTS: $($comprehensiveReport.executiveSummary.criticalIssues) critical issues found!" "ERROR"
        Write-Log "Immediate attention required for compliance violations" "ERROR"
    }
    
    Write-Log "✅ A014 - Collaboration Platforms Monitoring completed successfully" "INFO"
    Write-Log "Overall Compliance Status: $($comprehensiveReport.executiveSummary.overallCompliance)" "INFO"
    
    # Return exit code based on compliance status
    if ($comprehensiveReport.executiveSummary.overallCompliance -eq "Non-Compliant") {
        exit 1
    }
    else {
        exit 0
    }
}
catch {
    Write-Log "❌ Monitoring failed: $_" "ERROR"
    Write-Log "Stack trace: $($_.ScriptStackTrace)" "ERROR"
    exit 1
}
finally {
    # Cleanup connections
    try {
        Disconnect-MgGraph -ErrorAction SilentlyContinue
        Disconnect-MicrosoftTeams -ErrorAction SilentlyContinue
        Disconnect-PnPOnline -ErrorAction SilentlyContinue
    }
    catch {
        # Ignore cleanup errors
    }
}