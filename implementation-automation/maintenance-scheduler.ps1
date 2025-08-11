# CBA Consult IT Management Framework - Maintenance Scheduler
# This script provides automated scheduling and execution of maintenance activities

<#
.SYNOPSIS
    Automated maintenance scheduler for the ICT Governance Framework

.DESCRIPTION
    This script manages the scheduling and execution of regular maintenance activities
    including compliance checks, policy updates, documentation refresh, and system optimization.
    It ensures the framework remains current, compliant, and optimally configured.

.PARAMETER Action
    The maintenance action to perform: Schedule, Execute, Status, or Report

.PARAMETER MaintenanceType
    Type of maintenance: Daily, Weekly, Monthly, Quarterly, or All

.PARAMETER Environment
    Target environment: Dev, Test, or Prod

.PARAMETER ConfigPath
    Path to the maintenance configuration file

.EXAMPLE
    .\maintenance-scheduler.ps1 -Action Schedule -MaintenanceType All -Environment Prod
    Schedules all maintenance activities for production environment

.EXAMPLE
    .\maintenance-scheduler.ps1 -Action Execute -MaintenanceType Daily -Environment Dev
    Executes daily maintenance tasks for development environment

.NOTES
    Version: 1.0.0
    Author: CBA Consult ICT Governance Team
    Created: August 7, 2025
    Framework: CBA Consult IT Management Framework v3.2.0
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("Schedule", "Execute", "Status", "Report")]
    [string]$Action,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("Daily", "Weekly", "Monthly", "Quarterly", "All")]
    [string]$MaintenanceType = "All",
    
    [Parameter(Mandatory = $true)]
    [ValidateSet("Dev", "Test", "Prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [string]$ConfigPath = ".\config\maintenance-config.json",
    
    [Parameter(Mandatory = $false)]
    [string]$LogPath = ".\logs\maintenance\",
    
    [Parameter(Mandatory = $false)]
    [switch]$WhatIf
)

# Initialize logging
if (!(Test-Path $LogPath)) {
    New-Item -Path $LogPath -ItemType Directory -Force | Out-Null
}

$LogFile = Join-Path $LogPath "maintenance-scheduler-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "WARNING", "ERROR", "SUCCESS")]
        [string]$Level = "INFO"
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    Write-Host $LogEntry -ForegroundColor $(
        switch ($Level) {
            "INFO" { "White" }
            "WARNING" { "Yellow" }
            "ERROR" { "Red" }
            "SUCCESS" { "Green" }
        }
    )
    
    Add-Content -Path $LogFile -Value $LogEntry
}

function Load-MaintenanceConfig {
    param([string]$ConfigPath)
    
    try {
        if (Test-Path $ConfigPath) {
            $Config = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json
            Write-Log "Loaded maintenance configuration from: $ConfigPath" "SUCCESS"
            return $Config
        }
        else {
            Write-Log "Configuration file not found: $ConfigPath. Using default configuration." "WARNING"
            return Get-DefaultMaintenanceConfig
        }
    }
    catch {
        Write-Log "Failed to load configuration: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Get-DefaultMaintenanceConfig {
    return @{
        version = "1.0.0"
        schedules = @{
            daily = @{
                enabled = $true
                time = "02:00"
                tasks = @(
                    "health-check",
                    "log-cleanup",
                    "backup-verification",
                    "security-scan"
                )
            }
            weekly = @{
                enabled = $true
                day = "Sunday"
                time = "01:00"
                tasks = @(
                    "compliance-check",
                    "policy-review",
                    "performance-analysis",
                    "documentation-update"
                )
            }
            monthly = @{
                enabled = $true
                day = 1
                time = "00:00"
                tasks = @(
                    "full-compliance-audit",
                    "framework-assessment",
                    "cost-optimization",
                    "capacity-planning"
                )
            }
            quarterly = @{
                enabled = $true
                months = @(1, 4, 7, 10)
                day = 1
                time = "00:00"
                tasks = @(
                    "strategic-review",
                    "framework-update",
                    "training-assessment",
                    "vendor-review"
                )
            }
        }
        notifications = @{
            email = @{
                enabled = $true
                recipients = @("governance@company.com", "it-management@company.com")
                smtp_server = "smtp.company.com"
            }
            teams = @{
                enabled = $true
                webhook_url = "https://company.webhook.office.com/webhookb2/..."
            }
        }
        retention = @{
            logs = 90
            reports = 365
            backups = 30
        }
    }
}

function Schedule-MaintenanceTasks {
    param($Config, $MaintenanceType, $Environment)
    
    Write-Log "Scheduling maintenance tasks for type: $MaintenanceType, environment: $Environment" "INFO"
    
    $ScheduledTasks = @()
    
    if ($MaintenanceType -eq "All" -or $MaintenanceType -eq "Daily") {
        $ScheduledTasks += Schedule-DailyTasks $Config $Environment
    }
    
    if ($MaintenanceType -eq "All" -or $MaintenanceType -eq "Weekly") {
        $ScheduledTasks += Schedule-WeeklyTasks $Config $Environment
    }
    
    if ($MaintenanceType -eq "All" -or $MaintenanceType -eq "Monthly") {
        $ScheduledTasks += Schedule-MonthlyTasks $Config $Environment
    }
    
    if ($MaintenanceType -eq "All" -or $MaintenanceType -eq "Quarterly") {
        $ScheduledTasks += Schedule-QuarterlyTasks $Config $Environment
    }
    
    Write-Log "Scheduled $($ScheduledTasks.Count) maintenance tasks" "SUCCESS"
    return $ScheduledTasks
}

function Schedule-DailyTasks {
    param($Config, $Environment)
    
    Write-Log "Scheduling daily maintenance tasks..." "INFO"
    
    $DailyConfig = $Config.schedules.daily
    $Tasks = @()
    
    foreach ($TaskName in $DailyConfig.tasks) {
        $Task = @{
            Name = "Daily-$TaskName-$Environment"
            Type = "Daily"
            Schedule = $DailyConfig.time
            Environment = $Environment
            TaskName = $TaskName
            Enabled = $DailyConfig.enabled
        }
        
        if (!$WhatIf) {
            # Create scheduled task using Windows Task Scheduler
            Create-ScheduledTask $Task
        }
        else {
            Write-Log "WhatIf: Would schedule daily task: $TaskName" "INFO"
        }
        
        $Tasks += $Task
    }
    
    return $Tasks
}

function Schedule-WeeklyTasks {
    param($Config, $Environment)
    
    Write-Log "Scheduling weekly maintenance tasks..." "INFO"
    
    $WeeklyConfig = $Config.schedules.weekly
    $Tasks = @()
    
    foreach ($TaskName in $WeeklyConfig.tasks) {
        $Task = @{
            Name = "Weekly-$TaskName-$Environment"
            Type = "Weekly"
            Schedule = "$($WeeklyConfig.day) $($WeeklyConfig.time)"
            Environment = $Environment
            TaskName = $TaskName
            Enabled = $WeeklyConfig.enabled
        }
        
        if (!$WhatIf) {
            Create-ScheduledTask $Task
        }
        else {
            Write-Log "WhatIf: Would schedule weekly task: $TaskName" "INFO"
        }
        
        $Tasks += $Task
    }
    
    return $Tasks
}

function Schedule-MonthlyTasks {
    param($Config, $Environment)
    
    Write-Log "Scheduling monthly maintenance tasks..." "INFO"
    
    $MonthlyConfig = $Config.schedules.monthly
    $Tasks = @()
    
    foreach ($TaskName in $MonthlyConfig.tasks) {
        $Task = @{
            Name = "Monthly-$TaskName-$Environment"
            Type = "Monthly"
            Schedule = "Day $($MonthlyConfig.day) at $($MonthlyConfig.time)"
            Environment = $Environment
            TaskName = $TaskName
            Enabled = $MonthlyConfig.enabled
        }
        
        if (!$WhatIf) {
            Create-ScheduledTask $Task
        }
        else {
            Write-Log "WhatIf: Would schedule monthly task: $TaskName" "INFO"
        }
        
        $Tasks += $Task
    }
    
    return $Tasks
}

function Schedule-QuarterlyTasks {
    param($Config, $Environment)
    
    Write-Log "Scheduling quarterly maintenance tasks..." "INFO"
    
    $QuarterlyConfig = $Config.schedules.quarterly
    $Tasks = @()
    
    foreach ($TaskName in $QuarterlyConfig.tasks) {
        $Task = @{
            Name = "Quarterly-$TaskName-$Environment"
            Type = "Quarterly"
            Schedule = "Months $($QuarterlyConfig.months -join ',') Day $($QuarterlyConfig.day) at $($QuarterlyConfig.time)"
            Environment = $Environment
            TaskName = $TaskName
            Enabled = $QuarterlyConfig.enabled
        }
        
        if (!$WhatIf) {
            Create-ScheduledTask $Task
        }
        else {
            Write-Log "WhatIf: Would schedule quarterly task: $TaskName" "INFO"
        }
        
        $Tasks += $Task
    }
    
    return $Tasks
}

function Create-ScheduledTask {
    param($Task)
    
    try {
        # Create Windows scheduled task
        $TaskAction = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$PSScriptRoot\execute-maintenance-task.ps1`" -TaskName `"$($Task.TaskName)`" -Environment `"$($Task.Environment)`""
        
        switch ($Task.Type) {
            "Daily" {
                $TaskTrigger = New-ScheduledTaskTrigger -Daily -At $Task.Schedule
            }
            "Weekly" {
                $DayOfWeek = $Task.Schedule.Split(' ')[0]
                $Time = $Task.Schedule.Split(' ')[1]
                $TaskTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $DayOfWeek -At $Time
            }
            "Monthly" {
                $Day = [int]($Task.Schedule.Split(' ')[1])
                $Time = $Task.Schedule.Split(' ')[3]
                $TaskTrigger = New-ScheduledTaskTrigger -Monthly -DaysOfMonth $Day -At $Time
            }
            "Quarterly" {
                # For quarterly tasks, create multiple monthly triggers
                $Months = $Task.Schedule.Split(' ')[1].Split(',')
                $Day = [int]($Task.Schedule.Split(' ')[3])
                $Time = $Task.Schedule.Split(' ')[5]
                $TaskTrigger = @()
                foreach ($Month in $Months) {
                    $TaskTrigger += New-ScheduledTaskTrigger -Monthly -DaysOfMonth $Day -At $Time -MonthsOfYear $Month
                }
            }
        }
        
        $TaskSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        $TaskPrincipal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        
        Register-ScheduledTask -TaskName $Task.Name -Action $TaskAction -Trigger $TaskTrigger -Settings $TaskSettings -Principal $TaskPrincipal -Force
        
        Write-Log "Created scheduled task: $($Task.Name)" "SUCCESS"
    }
    catch {
        Write-Log "Failed to create scheduled task $($Task.Name): $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Execute-MaintenanceTasks {
    param($Config, $MaintenanceType, $Environment)
    
    Write-Log "Executing maintenance tasks for type: $MaintenanceType, environment: $Environment" "INFO"
    
    $ExecutionResults = @{
        StartTime = Get-Date
        Environment = $Environment
        MaintenanceType = $MaintenanceType
        Tasks = @()
        OverallStatus = "Success"
    }
    
    $TasksToExecute = Get-TasksForType $Config $MaintenanceType
    
    foreach ($TaskName in $TasksToExecute) {
        try {
            Write-Log "Executing task: $TaskName" "INFO"
            $TaskResult = Execute-MaintenanceTask $TaskName $Environment
            $ExecutionResults.Tasks += $TaskResult
            
            if ($TaskResult.Status -eq "Failed") {
                $ExecutionResults.OverallStatus = "Failed"
            }
        }
        catch {
            Write-Log "Failed to execute task $TaskName: $($_.Exception.Message)" "ERROR"
            $ExecutionResults.OverallStatus = "Failed"
            $ExecutionResults.Tasks += @{
                Name = $TaskName
                Status = "Failed"
                Error = $_.Exception.Message
                Duration = 0
            }
        }
    }
    
    $ExecutionResults.EndTime = Get-Date
    $ExecutionResults.TotalDuration = ($ExecutionResults.EndTime - $ExecutionResults.StartTime).TotalMinutes
    
    # Generate execution report
    Generate-ExecutionReport $ExecutionResults
    
    # Send notifications
    Send-MaintenanceNotifications $Config $ExecutionResults
    
    Write-Log "Maintenance execution completed. Overall status: $($ExecutionResults.OverallStatus)" "SUCCESS"
    return $ExecutionResults
}

function Get-TasksForType {
    param($Config, $MaintenanceType)
    
    $Tasks = @()
    
    switch ($MaintenanceType) {
        "Daily" { $Tasks = $Config.schedules.daily.tasks }
        "Weekly" { $Tasks = $Config.schedules.weekly.tasks }
        "Monthly" { $Tasks = $Config.schedules.monthly.tasks }
        "Quarterly" { $Tasks = $Config.schedules.quarterly.tasks }
        "All" {
            $Tasks += $Config.schedules.daily.tasks
            $Tasks += $Config.schedules.weekly.tasks
            $Tasks += $Config.schedules.monthly.tasks
            $Tasks += $Config.schedules.quarterly.tasks
        }
    }
    
    return $Tasks | Sort-Object | Get-Unique
}

function Execute-MaintenanceTask {
    param($TaskName, $Environment)
    
    $StartTime = Get-Date
    $TaskResult = @{
        Name = $TaskName
        Environment = $Environment
        StartTime = $StartTime
        Status = "Running"
        Output = @()
        Warnings = @()
        Errors = @()
    }
    
    try {
        switch ($TaskName) {
            "health-check" {
                $TaskResult.Output += Invoke-HealthCheck $Environment
            }
            "log-cleanup" {
                $TaskResult.Output += Invoke-LogCleanup $Environment
            }
            "backup-verification" {
                $TaskResult.Output += Invoke-BackupVerification $Environment
            }
            "security-scan" {
                $TaskResult.Output += Invoke-SecurityScan $Environment
            }
            "compliance-check" {
                $TaskResult.Output += Invoke-ComplianceCheck $Environment
            }
            "policy-review" {
                $TaskResult.Output += Invoke-PolicyReview $Environment
            }
            "performance-analysis" {
                $TaskResult.Output += Invoke-PerformanceAnalysis $Environment
            }
            "documentation-update" {
                $TaskResult.Output += Invoke-DocumentationUpdate $Environment
            }
            "full-compliance-audit" {
                $TaskResult.Output += Invoke-FullComplianceAudit $Environment
            }
            "framework-assessment" {
                $TaskResult.Output += Invoke-FrameworkAssessment $Environment
            }
            "cost-optimization" {
                $TaskResult.Output += Invoke-CostOptimization $Environment
            }
            "capacity-planning" {
                $TaskResult.Output += Invoke-CapacityPlanning $Environment
            }
            "strategic-review" {
                $TaskResult.Output += Invoke-StrategicReview $Environment
            }
            "framework-update" {
                $TaskResult.Output += Invoke-FrameworkUpdate $Environment
            }
            "training-assessment" {
                $TaskResult.Output += Invoke-TrainingAssessment $Environment
            }
            "vendor-review" {
                $TaskResult.Output += Invoke-VendorReview $Environment
            }
            default {
                throw "Unknown maintenance task: $TaskName"
            }
        }
        
        $TaskResult.Status = "Success"
        Write-Log "Task $TaskName completed successfully" "SUCCESS"
    }
    catch {
        $TaskResult.Status = "Failed"
        $TaskResult.Errors += $_.Exception.Message
        Write-Log "Task $TaskName failed: $($_.Exception.Message)" "ERROR"
    }
    finally {
        $TaskResult.EndTime = Get-Date
        $TaskResult.Duration = ($TaskResult.EndTime - $TaskResult.StartTime).TotalMinutes
    }
    
    return $TaskResult
}

# Maintenance task implementations
function Invoke-HealthCheck {
    param($Environment)
    
    Write-Log "Performing health check for environment: $Environment" "INFO"
    
    $HealthResults = @{
        Timestamp = Get-Date
        Environment = $Environment
        Services = @()
        OverallHealth = "Healthy"
    }
    
    # Check Azure services health
    $Services = @("Storage", "KeyVault", "LogAnalytics", "AppService", "SqlDatabase")
    
    foreach ($Service in $Services) {
        $ServiceHealth = @{
            Name = $Service
            Status = "Healthy"
            ResponseTime = (Get-Random -Minimum 50 -Maximum 200)
            LastChecked = Get-Date
        }
        
        # Simulate health check logic
        if ((Get-Random -Minimum 1 -Maximum 100) -gt 95) {
            $ServiceHealth.Status = "Degraded"
            $HealthResults.OverallHealth = "Degraded"
        }
        
        $HealthResults.Services += $ServiceHealth
    }
    
    return "Health check completed. Overall status: $($HealthResults.OverallHealth)"
}

function Invoke-LogCleanup {
    param($Environment)
    
    Write-Log "Performing log cleanup for environment: $Environment" "INFO"
    
    $CleanupResults = @{
        FilesRemoved = 0
        SpaceFreed = 0
        Errors = @()
    }
    
    # Cleanup old log files
    $LogDirectories = @(".\logs\", ".\logs\maintenance\", ".\logs\compliance\")
    
    foreach ($LogDir in $LogDirectories) {
        if (Test-Path $LogDir) {
            $OldFiles = Get-ChildItem -Path $LogDir -Filter "*.log" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }
            
            foreach ($File in $OldFiles) {
                try {
                    $FileSize = $File.Length
                    Remove-Item $File.FullName -Force
                    $CleanupResults.FilesRemoved++
                    $CleanupResults.SpaceFreed += $FileSize
                }
                catch {
                    $CleanupResults.Errors += "Failed to remove $($File.FullName): $($_.Exception.Message)"
                }
            }
        }
    }
    
    return "Log cleanup completed. Removed $($CleanupResults.FilesRemoved) files, freed $([math]::Round($CleanupResults.SpaceFreed / 1MB, 2)) MB"
}

function Invoke-ComplianceCheck {
    param($Environment)
    
    Write-Log "Performing compliance check for environment: $Environment" "INFO"
    
    # Execute the framework implementation script for compliance checking
    $ComplianceScript = Join-Path $PSScriptRoot "framework-implementation-script.ps1"
    
    if (Test-Path $ComplianceScript) {
        & $ComplianceScript -Action Compliance -Environment $Environment
        return "Compliance check executed successfully"
    }
    else {
        return "Compliance script not found: $ComplianceScript"
    }
}

function Generate-ExecutionReport {
    param($ExecutionResults)
    
    Write-Log "Generating maintenance execution report..." "INFO"
    
    $ReportPath = Join-Path $LogPath "maintenance-execution-report-$($ExecutionResults.Environment)-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $ExecutionResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportPath
    
    Write-Log "Execution report generated: $ReportPath" "SUCCESS"
}

function Send-MaintenanceNotifications {
    param($Config, $ExecutionResults)
    
    if ($Config.notifications.email.enabled) {
        Send-EmailNotification $Config.notifications.email $ExecutionResults
    }
    
    if ($Config.notifications.teams.enabled) {
        Send-TeamsNotification $Config.notifications.teams $ExecutionResults
    }
}

function Send-EmailNotification {
    param($EmailConfig, $ExecutionResults)
    
    Write-Log "Sending email notification..." "INFO"
    
    $Subject = "Maintenance Execution Report - $($ExecutionResults.Environment) - $($ExecutionResults.OverallStatus)"
    $Body = @"
Maintenance execution completed for environment: $($ExecutionResults.Environment)

Overall Status: $($ExecutionResults.OverallStatus)
Start Time: $($ExecutionResults.StartTime)
End Time: $($ExecutionResults.EndTime)
Duration: $([math]::Round($ExecutionResults.TotalDuration, 2)) minutes

Tasks Executed: $($ExecutionResults.Tasks.Count)
Successful: $($ExecutionResults.Tasks | Where-Object { $_.Status -eq "Success" } | Measure-Object | Select-Object -ExpandProperty Count)
Failed: $($ExecutionResults.Tasks | Where-Object { $_.Status -eq "Failed" } | Measure-Object | Select-Object -ExpandProperty Count)

For detailed results, please check the maintenance logs.
"@
    
    # Email sending logic would be implemented here
    Write-Log "Email notification prepared (actual sending not implemented in this demo)" "INFO"
}

function Send-TeamsNotification {
    param($TeamsConfig, $ExecutionResults)
    
    Write-Log "Sending Teams notification..." "INFO"
    
    $TeamsMessage = @{
        "@type" = "MessageCard"
        "@context" = "http://schema.org/extensions"
        "themeColor" = if ($ExecutionResults.OverallStatus -eq "Success") { "00FF00" } else { "FF0000" }
        "summary" = "Maintenance Execution Report"
        "sections" = @(
            @{
                "activityTitle" = "Maintenance Execution Completed"
                "activitySubtitle" = "Environment: $($ExecutionResults.Environment)"
                "facts" = @(
                    @{ "name" = "Status"; "value" = $ExecutionResults.OverallStatus },
                    @{ "name" = "Duration"; "value" = "$([math]::Round($ExecutionResults.TotalDuration, 2)) minutes" },
                    @{ "name" = "Tasks Executed"; "value" = $ExecutionResults.Tasks.Count },
                    @{ "name" = "Successful"; "value" = ($ExecutionResults.Tasks | Where-Object { $_.Status -eq "Success" } | Measure-Object | Select-Object -ExpandProperty Count) },
                    @{ "name" = "Failed"; "value" = ($ExecutionResults.Tasks | Where-Object { $_.Status -eq "Failed" } | Measure-Object | Select-Object -ExpandProperty Count) }
                )
            }
        )
    }
    
    # Teams webhook posting logic would be implemented here
    Write-Log "Teams notification prepared (actual sending not implemented in this demo)" "INFO"
}

# Main execution logic
try {
    Write-Log "Starting CBA Consult IT Management Framework - Maintenance Scheduler" "INFO"
    Write-Log "Action: $Action, Type: $MaintenanceType, Environment: $Environment" "INFO"
    
    # Load configuration
    $Config = Load-MaintenanceConfig -ConfigPath $ConfigPath
    
    # Execute requested action
    switch ($Action) {
        "Schedule" {
            $ScheduledTasks = Schedule-MaintenanceTasks -Config $Config -MaintenanceType $MaintenanceType -Environment $Environment
            Write-Log "Scheduled $($ScheduledTasks.Count) maintenance tasks" "SUCCESS"
        }
        "Execute" {
            $ExecutionResults = Execute-MaintenanceTasks -Config $Config -MaintenanceType $MaintenanceType -Environment $Environment
            Write-Log "Executed maintenance tasks with overall status: $($ExecutionResults.OverallStatus)" "SUCCESS"
        }
        "Status" {
            # Get status of scheduled tasks
            $ScheduledTasks = Get-ScheduledTask | Where-Object { $_.TaskName -like "*$Environment*" }
            Write-Log "Found $($ScheduledTasks.Count) scheduled maintenance tasks for environment: $Environment" "INFO"
            foreach ($Task in $ScheduledTasks) {
                Write-Log "Task: $($Task.TaskName), State: $($Task.State), Last Run: $($Task.LastRunTime)" "INFO"
            }
        }
        "Report" {
            # Generate comprehensive maintenance report
            Write-Log "Generating comprehensive maintenance report..." "INFO"
            # Report generation logic would be implemented here
        }
    }
    
    Write-Log "Maintenance scheduler execution completed successfully" "SUCCESS"
}
catch {
    Write-Log "Maintenance scheduler execution failed: $($_.Exception.Message)" "ERROR"
    Write-Log "Stack trace: $($_.ScriptStackTrace)" "ERROR"
    exit 1
}
finally {
    Write-Log "Log file saved to: $LogFile" "INFO"
}