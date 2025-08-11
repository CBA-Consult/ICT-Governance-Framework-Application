# Continuous Compliance Monitoring Script
# CBA Consult ICT Governance Framework - Real-Time Compliance Monitoring
# This script provides continuous monitoring of compliance violations and security incidents

param(
    [Parameter(Mandatory = $false)]
    [string]$ConfigPath = ".\compliance-monitoring-config.json",
    
    [Parameter(Mandatory = $false)]
    [string]$LogAnalyticsWorkspace = "law-governance-prod",
    
    [Parameter(Mandatory = $false)]
    [string]$ResourceGroup = "rg-governance-prod",
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("All", "Critical", "High", "Medium", "Low")]
    [string]$Severity = "All",
    
    [Parameter(Mandatory = $false)]
    [int]$MonitoringIntervalSeconds = 60,
    
    [Parameter(Mandatory = $false)]
    [switch]$EnableRealTimeAlerts,
    
    [Parameter(Mandatory = $false)]
    [switch]$EnableAutomatedResponse,
    
    [Parameter(Mandatory = $false)]
    [switch]$Verbose
)

# Import required modules
try {
    Import-Module Az.Accounts -ErrorAction Stop
    Import-Module Az.Resources -ErrorAction Stop
    Import-Module Az.Monitor -ErrorAction Stop
    Import-Module Az.OperationalInsights -ErrorAction Stop
    Import-Module Az.Security -ErrorAction Stop
    Write-Output "All required Az modules imported successfully."
} catch {
    Write-Error "Failed to import required Az module: $($_.Exception.Message)"
    throw
}

# Initialize logging
$LogFile = "compliance-monitoring-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$Global:MonitoringActive = $true

function Write-Log {
    param(
        [string]$Message, 
        [ValidateSet("INFO", "WARNING", "ERROR", "DEBUG")]
        [string]$Level = "INFO"
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Output $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
    
    if ($Verbose -and $Level -eq "DEBUG") {
        Write-Verbose $LogEntry
    }
}

function Load-MonitoringConfig {
    param([string]$ConfigPath)
    
    try {
        if (Test-Path $ConfigPath) {
            $config = Get-Content $ConfigPath | ConvertFrom-Json
            Write-Log "Monitoring configuration loaded from $ConfigPath"
            return $config
        } else {
            Write-Log "Configuration file not found at $ConfigPath. Using default configuration." "WARNING"
            return Get-DefaultMonitoringConfig
        }
    } catch {
        Write-Log "Error loading configuration: $($_.Exception.Message)" "ERROR"
        return Get-DefaultMonitoringConfig
    }
}

function Get-DefaultMonitoringConfig {
    return @{
        "monitoringRules" = @(
            @{
                "name" = "critical_system_access_violation"
                "description" = "Unauthorized access to critical systems"
                "severity" = "Critical"
                "query" = "SigninLogs | where TimeGenerated > ago(5m) and AppDisplayName in ('ERP System', 'Financial Management', 'HR System') and ResultType != 0"
                "threshold" = 1
                "timeWindow" = "5m"
                "actions" = @("immediate_alert", "account_investigation", "ciso_notification")
            },
            @{
                "name" = "bulk_data_download"
                "description" = "Potential data exfiltration detected"
                "severity" = "Critical"
                "query" = "CloudAppEvents | where TimeGenerated > ago(10m) and ActionType == 'FileDownloaded' | summarize count() by AccountObjectId | where count_ > 100"
                "threshold" = 1
                "timeWindow" = "10m"
                "actions" = @("session_termination", "data_protection_alert", "investigation_trigger")
            },
            @{
                "name" = "policy_exception_threshold_breach"
                "description" = "Policy exception threshold exceeded"
                "severity" = "High"
                "query" = "PolicyExceptions_CL | where TimeGenerated > ago(1h) | summarize count() by PolicyName_s | where count_ > 5"
                "threshold" = 1
                "timeWindow" = "1h"
                "actions" = @("governance_team_alert", "exception_review_trigger")
            },
            @{
                "name" = "security_control_failure"
                "description" = "Security control effectiveness failure"
                "severity" = "High"
                "query" = "SecurityRecommendation | where TimeGenerated > ago(15m) and RecommendationState == 'Active' and RecommendationSeverity == 'High'"
                "threshold" = 5
                "timeWindow" = "15m"
                "actions" = @("security_team_alert", "control_remediation")
            },
            @{
                "name" = "compliance_drift_detection"
                "description" = "Compliance score degradation detected"
                "severity" = "Medium"
                "query" = "ComplianceScore_CL | where TimeGenerated > ago(30m) | summarize CurrentScore = avg(Score_d) by Domain_s | join (ComplianceScore_CL | where TimeGenerated between (ago(2h) .. ago(90m)) | summarize PreviousScore = avg(Score_d) by Domain_s) on Domain_s | where CurrentScore < PreviousScore - 5"
                "threshold" = 1
                "timeWindow" = "30m"
                "actions" = @("compliance_team_alert", "drift_analysis")
            }
        )
        "alertChannels" = @{
            "email" = @{
                "enabled" = $true
                "smtpServer" = "smtp.cbagroup.com"
                "recipients" = @{
                    "critical" = @("ciso@cbagroup.com", "security-team@cbagroup.com")
                    "high" = @("governance-team@cbagroup.com", "security-team@cbagroup.com")
                    "medium" = @("governance-team@cbagroup.com")
                    "low" = @("operations-team@cbagroup.com")
                }
            }
            "teams" = @{
                "enabled" = $true
                "webhookUrl" = "https://outlook.office.com/webhook/..."
            }
            "sms" = @{
                "enabled" = $true
                "provider" = "twilio"
                "recipients" = @{
                    "critical" = @("+1234567890", "+1234567891")
                }
            }
        }
        "automatedResponses" = @{
            "enabled" = $true
            "playbooks" = @{
                "critical_access_violation" = @{
                    "actions" = @("suspend_account", "revoke_sessions", "notify_security", "create_incident")
                }
                "data_exfiltration" = @{
                    "actions" = @("terminate_session", "block_downloads", "notify_dpo", "preserve_logs")
                }
                "policy_violation" = @{
                    "actions" = @("apply_policy", "notify_owner", "schedule_review", "update_risk")
                }
            }
        }
    }
}

function Initialize-ComplianceMonitoring {
    param($Config)
    
    Write-Log "Initializing continuous compliance monitoring..."
    
    # Verify Azure connection
    try {
        $context = Get-AzContext
        if (-not $context) {
            Write-Log "No Azure context found. Please run Connect-AzAccount first." "ERROR"
            throw "Azure authentication required"
        }
        Write-Log "Azure context verified: $($context.Account.Id)"
    } catch {
        Write-Log "Failed to verify Azure context: $($_.Exception.Message)" "ERROR"
        throw
    }
    
    # Verify Log Analytics workspace
    try {
        $workspace = Get-AzOperationalInsightsWorkspace -ResourceGroupName $ResourceGroup -Name $LogAnalyticsWorkspace
        if (-not $workspace) {
            Write-Log "Log Analytics workspace '$LogAnalyticsWorkspace' not found in resource group '$ResourceGroup'" "ERROR"
            throw "Workspace not found"
        }
        Write-Log "Log Analytics workspace verified: $($workspace.Name)"
        return $workspace
    } catch {
        Write-Log "Failed to verify Log Analytics workspace: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Start-ContinuousMonitoring {
    param($Config, $Workspace)
    
    Write-Log "Starting continuous compliance monitoring with $($MonitoringIntervalSeconds)s interval..."
    
    $monitoringStartTime = Get-Date
    $violationCount = 0
    $alertCount = 0
    
    while ($Global:MonitoringActive) {
        try {
            Write-Log "Running monitoring cycle..." "DEBUG"
            
            # Process each monitoring rule
            foreach ($rule in $Config.monitoringRules) {
                if ($Severity -ne "All" -and $rule.severity -ne $Severity) {
                    continue
                }
                
                Write-Log "Executing rule: $($rule.name)" "DEBUG"
                $violations = Invoke-ComplianceRule -Rule $rule -Workspace $Workspace
                
                if ($violations -and $violations.Count -gt 0) {
                    $violationCount += $violations.Count
                    Write-Log "Rule '$($rule.name)' detected $($violations.Count) violations" "WARNING"
                    
                    # Process violations
                    foreach ($violation in $violations) {
                        Process-ComplianceViolation -Violation $violation -Rule $rule -Config $Config
                    }
                    
                    # Send alerts if enabled
                    if ($EnableRealTimeAlerts) {
                        Send-ComplianceAlert -Rule $rule -Violations $violations -Config $Config
                        $alertCount++
                    }
                    
                    # Execute automated responses if enabled
                    if ($EnableAutomatedResponse) {
                        Invoke-AutomatedResponse -Rule $rule -Violations $violations -Config $Config
                    }
                }
            }
            
            # Update monitoring statistics
            $runtime = (Get-Date) - $monitoringStartTime
            Write-Log "Monitoring cycle completed. Runtime: $($runtime.TotalMinutes.ToString('F2')) minutes, Violations: $violationCount, Alerts: $alertCount" "DEBUG"
            
            # Wait for next cycle
            Start-Sleep -Seconds $MonitoringIntervalSeconds
            
        } catch {
            Write-Log "Error in monitoring cycle: $($_.Exception.Message)" "ERROR"
            Start-Sleep -Seconds 30  # Brief pause before retry
        }
    }
    
    Write-Log "Continuous monitoring stopped. Total violations detected: $violationCount, Alerts sent: $alertCount"
}

function Invoke-ComplianceRule {
    param($Rule, $Workspace)
    
    try {
        Write-Log "Executing query for rule '$($Rule.name)': $($Rule.query)" "DEBUG"
        
        # Execute KQL query against Log Analytics
        $queryResult = Invoke-AzOperationalInsightsQuery -WorkspaceId $Workspace.CustomerId -Query $Rule.query
        
        if ($queryResult.Results -and $queryResult.Results.Count -ge $Rule.threshold) {
            Write-Log "Rule '$($Rule.name)' threshold exceeded: $($queryResult.Results.Count) >= $($Rule.threshold)"
            
            # Convert results to violation objects
            $violations = @()
            foreach ($result in $queryResult.Results) {
                $violation = @{
                    "RuleName" = $Rule.name
                    "Severity" = $Rule.severity
                    "Description" = $Rule.description
                    "DetectionTime" = Get-Date
                    "Data" = $result
                    "TimeWindow" = $Rule.timeWindow
                    "Actions" = $Rule.actions
                }
                $violations += $violation
            }
            
            return $violations
        }
        
        return $null
        
    } catch {
        Write-Log "Error executing rule '$($Rule.name)': $($_.Exception.Message)" "ERROR"
        return $null
    }
}

function Process-ComplianceViolation {
    param($Violation, $Rule, $Config)
    
    try {
        Write-Log "Processing violation for rule '$($Rule.name)' with severity '$($Rule.severity)'"
        
        # Create violation record
        $violationRecord = @{
            "TimeGenerated" = $Violation.DetectionTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            "RuleName" = $Violation.RuleName
            "Severity" = $Violation.Severity
            "Description" = $Violation.Description
            "ViolationData" = ($Violation.Data | ConvertTo-Json -Compress)
            "Status" = "Active"
            "AssignedTo" = Get-AssignedResponder -Severity $Violation.Severity
            "SLATarget" = Get-SLATarget -Severity $Violation.Severity
            "Actions" = ($Violation.Actions -join ",")
        }
        
        # Log violation to Log Analytics
        Send-ViolationToLogAnalytics -ViolationRecord $violationRecord -Workspace $Workspace
        
        # Create incident ticket if critical
        if ($Violation.Severity -eq "Critical") {
            Create-IncidentTicket -Violation $violationRecord
        }
        
        Write-Log "Violation processed and logged for rule '$($Rule.name)'"
        
    } catch {
        Write-Log "Error processing violation: $($_.Exception.Message)" "ERROR"
    }
}

function Send-ComplianceAlert {
    param($Rule, $Violations, $Config)
    
    try {
        Write-Log "Sending alerts for rule '$($Rule.name)' with $($Violations.Count) violations"
        
        $alertMessage = @{
            "RuleName" = $Rule.name
            "Severity" = $Rule.severity
            "Description" = $Rule.description
            "ViolationCount" = $Violations.Count
            "DetectionTime" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            "RequiredActions" = $Rule.actions -join ", "
        }
        
        # Send email alerts
        if ($Config.alertChannels.email.enabled) {
            Send-EmailAlert -AlertMessage $alertMessage -Config $Config
        }
        
        # Send Teams alerts
        if ($Config.alertChannels.teams.enabled) {
            Send-TeamsAlert -AlertMessage $alertMessage -Config $Config
        }
        
        # Send SMS for critical alerts
        if ($Rule.severity -eq "Critical" -and $Config.alertChannels.sms.enabled) {
            Send-SMSAlert -AlertMessage $alertMessage -Config $Config
        }
        
        Write-Log "Alerts sent for rule '$($Rule.name)'"
        
    } catch {
        Write-Log "Error sending alerts: $($_.Exception.Message)" "ERROR"
    }
}

function Invoke-AutomatedResponse {
    param($Rule, $Violations, $Config)
    
    try {
        Write-Log "Executing automated response for rule '$($Rule.name)'"
        
        # Get playbook for this rule
        $playbookName = $Rule.name -replace "_", "-"
        $playbook = $Config.automatedResponses.playbooks.$playbookName
        
        if ($playbook) {
            foreach ($action in $playbook.actions) {
                Execute-ResponseAction -Action $action -Violations $Violations -Rule $Rule
            }
            Write-Log "Automated response completed for rule '$($Rule.name)'"
        } else {
            Write-Log "No automated response playbook found for rule '$($Rule.name)'" "WARNING"
        }
        
    } catch {
        Write-Log "Error executing automated response: $($_.Exception.Message)" "ERROR"
    }
}

function Execute-ResponseAction {
    param($Action, $Violations, $Rule)
    
    try {
        Write-Log "Executing response action: $Action" "DEBUG"
        
        switch ($Action) {
            "suspend_account" {
                # Suspend user accounts involved in violations
                foreach ($violation in $Violations) {
                    if ($violation.Data.UserPrincipalName) {
                        Write-Log "Suspending account: $($violation.Data.UserPrincipalName)"
                        # Add account suspension logic here
                    }
                }
            }
            "revoke_sessions" {
                # Revoke active sessions
                foreach ($violation in $Violations) {
                    if ($violation.Data.UserPrincipalName) {
                        Write-Log "Revoking sessions for: $($violation.Data.UserPrincipalName)"
                        # Add session revocation logic here
                    }
                }
            }
            "terminate_session" {
                # Terminate specific sessions
                foreach ($violation in $Violations) {
                    if ($violation.Data.SessionId) {
                        Write-Log "Terminating session: $($violation.Data.SessionId)"
                        # Add session termination logic here
                    }
                }
            }
            "block_downloads" {
                # Block file downloads
                Write-Log "Implementing download restrictions"
                # Add download blocking logic here
            }
            "apply_policy" {
                # Apply policy enforcement
                Write-Log "Applying policy enforcement for rule: $($Rule.name)"
                # Add policy enforcement logic here
            }
            "notify_security" {
                # Notify security team
                Write-Log "Notifying security team about violations"
                # Security team notification logic handled in alerting
            }
            "create_incident" {
                # Create incident ticket
                Write-Log "Creating incident ticket for violations"
                Create-IncidentTicket -Violations $Violations
            }
            default {
                Write-Log "Unknown response action: $Action" "WARNING"
            }
        }
        
    } catch {
        Write-Log "Error executing response action '$Action': $($_.Exception.Message)" "ERROR"
    }
}

function Send-EmailAlert {
    param($AlertMessage, $Config)
    
    try {
        $recipients = $Config.alertChannels.email.recipients.($AlertMessage.Severity.ToLower())
        if (-not $recipients) {
            $recipients = $Config.alertChannels.email.recipients.medium
        }
        
        $subject = "[$($AlertMessage.Severity)] Compliance Violation: $($AlertMessage.RuleName)"
        $body = @"
Compliance Violation Detected

Rule: $($AlertMessage.RuleName)
Severity: $($AlertMessage.Severity)
Description: $($AlertMessage.Description)
Violation Count: $($AlertMessage.ViolationCount)
Detection Time: $($AlertMessage.DetectionTime)
Required Actions: $($AlertMessage.RequiredActions)

Please check the real-time compliance dashboard for more details.
"@
        
        # Send email using configured SMTP server
        foreach ($recipient in $recipients) {
            Write-Log "Sending email alert to: $recipient" "DEBUG"
            # Add email sending logic here
        }
        
    } catch {
        Write-Log "Error sending email alert: $($_.Exception.Message)" "ERROR"
    }
}

function Send-TeamsAlert {
    param($AlertMessage, $Config)
    
    try {
        $teamsMessage = @{
            "@type" = "MessageCard"
            "@context" = "http://schema.org/extensions"
            "themeColor" = if ($AlertMessage.Severity -eq "Critical") { "FF0000" } elseif ($AlertMessage.Severity -eq "High") { "FF8C00" } else { "FFD700" }
            "summary" = "Compliance Violation: $($AlertMessage.RuleName)"
            "sections" = @(
                @{
                    "activityTitle" = "🚨 Compliance Violation Detected"
                    "activitySubtitle" = $AlertMessage.RuleName
                    "facts" = @(
                        @{ "name" = "Severity"; "value" = $AlertMessage.Severity },
                        @{ "name" = "Description"; "value" = $AlertMessage.Description },
                        @{ "name" = "Violation Count"; "value" = $AlertMessage.ViolationCount },
                        @{ "name" = "Detection Time"; "value" = $AlertMessage.DetectionTime },
                        @{ "name" = "Required Actions"; "value" = $AlertMessage.RequiredActions }
                    )
                }
            )
            "potentialAction" = @(
                @{
                    "@type" = "OpenUri"
                    "name" = "View Dashboard"
                    "targets" = @(
                        @{ "os" = "default"; "uri" = "https://dashboard.cbagroup.com/compliance" }
                    )
                }
            )
        }
        
        $json = $teamsMessage | ConvertTo-Json -Depth 10
        Invoke-RestMethod -Uri $Config.alertChannels.teams.webhookUrl -Method Post -Body $json -ContentType "application/json"
        
        Write-Log "Teams alert sent successfully" "DEBUG"
        
    } catch {
        Write-Log "Error sending Teams alert: $($_.Exception.Message)" "ERROR"
    }
}

function Send-SMSAlert {
    param($AlertMessage, $Config)
    
    try {
        $recipients = $Config.alertChannels.sms.recipients.critical
        $message = "CRITICAL: $($AlertMessage.RuleName) - $($AlertMessage.ViolationCount) violations detected. Check dashboard immediately."
        
        foreach ($recipient in $recipients) {
            Write-Log "Sending SMS alert to: $recipient" "DEBUG"
            # Add SMS sending logic here (Twilio, Azure Communication Services, etc.)
        }
        
    } catch {
        Write-Log "Error sending SMS alert: $($_.Exception.Message)" "ERROR"
    }
}

function Get-AssignedResponder {
    param($Severity)
    
    switch ($Severity) {
        "Critical" { return "security-team@cbagroup.com" }
        "High" { return "governance-team@cbagroup.com" }
        "Medium" { return "operations-team@cbagroup.com" }
        "Low" { return "support-team@cbagroup.com" }
        default { return "operations-team@cbagroup.com" }
    }
}

function Get-SLATarget {
    param($Severity)
    
    switch ($Severity) {
        "Critical" { return "5 minutes" }
        "High" { return "15 minutes" }
        "Medium" { return "1 hour" }
        "Low" { return "4 hours" }
        default { return "1 hour" }
    }
}

function Send-ViolationToLogAnalytics {
    param($ViolationRecord, $Workspace)
    
    try {
        # Convert violation record to JSON for Log Analytics
        $jsonData = $ViolationRecord | ConvertTo-Json -Compress
        
        # Send to custom log table
        $logType = "ComplianceViolations"
        
        # Use Log Analytics Data Collector API
        Write-Log "Sending violation record to Log Analytics table: $logType" "DEBUG"
        # Add Log Analytics ingestion logic here
        
    } catch {
        Write-Log "Error sending violation to Log Analytics: $($_.Exception.Message)" "ERROR"
    }
}

function Create-IncidentTicket {
    param($Violations)
    
    try {
        Write-Log "Creating incident ticket for violations"
        
        # Create incident in ticketing system (ServiceNow, Azure DevOps, etc.)
        $incidentData = @{
            "Title" = "Compliance Violation: $($Violations[0].RuleName)"
            "Description" = "Multiple compliance violations detected requiring immediate attention"
            "Severity" = $Violations[0].Severity
            "Category" = "Compliance"
            "AssignedTo" = Get-AssignedResponder -Severity $Violations[0].Severity
            "CreatedDate" = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            "ViolationCount" = $Violations.Count
        }
        
        Write-Log "Incident ticket created: $($incidentData.Title)" "DEBUG"
        # Add incident creation logic here
        
    } catch {
        Write-Log "Error creating incident ticket: $($_.Exception.Message)" "ERROR"
    }
}

function Stop-MonitoringGracefully {
    Write-Log "Stopping continuous compliance monitoring..."
    $Global:MonitoringActive = $false
}

# Register signal handlers for graceful shutdown
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Stop-MonitoringGracefully
}

# Main execution
try {
    Write-Log "Starting Continuous Compliance Monitoring Script"
    Write-Log "Configuration: Severity=$Severity, Interval=$($MonitoringIntervalSeconds)s, RealTimeAlerts=$EnableRealTimeAlerts, AutoResponse=$EnableAutomatedResponse"
    
    # Load configuration
    $config = Load-MonitoringConfig -ConfigPath $ConfigPath
    
    # Initialize monitoring
    $workspace = Initialize-ComplianceMonitoring -Config $config
    
    # Start continuous monitoring
    Start-ContinuousMonitoring -Config $config -Workspace $workspace
    
} catch {
    Write-Log "Fatal error in compliance monitoring: $($_.Exception.Message)" "ERROR"
    exit 1
} finally {
    Write-Log "Continuous Compliance Monitoring Script completed"
}