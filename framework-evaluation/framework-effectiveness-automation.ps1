<#
.SYNOPSIS
    ICT Governance Framework Effectiveness Evaluation Automation Script

.DESCRIPTION
    This PowerShell script automates the collection, analysis, and reporting of 
    ICT Governance Framework effectiveness metrics. It integrates with various 
    data sources to provide comprehensive framework evaluation capabilities.

.PARAMETER ConfigFile
    Path to the configuration file containing data source connections and settings

.PARAMETER EvaluationType
    Type of evaluation to perform: Quarterly, SemiAnnual, or Annual

.PARAMETER OutputPath
    Path where evaluation reports and data will be saved

.PARAMETER SendReports
    Switch to automatically send reports to stakeholders

.EXAMPLE
    .\framework-effectiveness-automation.ps1 -ConfigFile "config.json" -EvaluationType "Quarterly" -OutputPath "C:\Reports"

.NOTES
    Version: 1.0
    Author: ICT Governance Team
    Date: December 2024
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ConfigFile,
    
    [Parameter(Mandatory = $true)]
    [ValidateSet("Quarterly", "SemiAnnual", "Annual")]
    [string]$EvaluationType,
    
    [Parameter(Mandatory = $true)]
    [string]$OutputPath,
    
    [switch]$SendReports
)

# Import required modules
Import-Module Az.Accounts -Force
Import-Module Az.Resources -Force
Import-Module Az.Monitor -Force
Import-Module ImportExcel -Force

# Global variables
$script:Config = $null
$script:EvaluationData = @{}
$script:AnalysisResults = @{}
$script:ReportPath = ""

#region Configuration Management

function Initialize-Configuration {
    param([string]$ConfigPath)
    
    Write-Host "Initializing configuration from: $ConfigPath" -ForegroundColor Green
    
    try {
        if (-not (Test-Path $ConfigPath)) {
            throw "Configuration file not found: $ConfigPath"
        }
        
        $script:Config = Get-Content $ConfigPath | ConvertFrom-Json
        
        # Validate required configuration sections
        $requiredSections = @('DataSources', 'Metrics', 'Thresholds', 'Reporting')
        foreach ($section in $requiredSections) {
            if (-not $script:Config.$section) {
                throw "Missing required configuration section: $section"
            }
        }
        
        Write-Host "Configuration loaded successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Error "Failed to load configuration: $($_.Exception.Message)"
        return $false
    }
}

function Get-EvaluationPeriod {
    param([string]$Type)
    
    $endDate = Get-Date
    
    switch ($Type) {
        "Quarterly" {
            $startDate = $endDate.AddMonths(-3)
        }
        "SemiAnnual" {
            $startDate = $endDate.AddMonths(-6)
        }
        "Annual" {
            $startDate = $endDate.AddYears(-1)
        }
    }
    
    return @{
        StartDate = $startDate
        EndDate = $endDate
        Period = $Type
    }
}

#endregion

#region Data Collection Functions

function Connect-DataSources {
    Write-Host "Connecting to data sources..." -ForegroundColor Yellow
    
    try {
        # Connect to Azure (if configured)
        if ($script:Config.DataSources.Azure) {
            Write-Host "Connecting to Azure..." -ForegroundColor Cyan
            Connect-AzAccount -Identity -ErrorAction SilentlyContinue
            Set-AzContext -SubscriptionId $script:Config.DataSources.Azure.SubscriptionId
        }
        
        # Test other data source connections
        foreach ($source in $script:Config.DataSources.PSObject.Properties) {
            if ($source.Name -ne "Azure") {
                Test-DataSourceConnection -SourceName $source.Name -Config $source.Value
            }
        }
        
        Write-Host "Data source connections established" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Error "Failed to connect to data sources: $($_.Exception.Message)"
        return $false
    }
}

function Test-DataSourceConnection {
    param(
        [string]$SourceName,
        [object]$Config
    )
    
    Write-Host "Testing connection to $SourceName..." -ForegroundColor Cyan
    
    switch ($SourceName) {
        "ServiceNow" {
            Test-ServiceNowConnection -Config $Config
        }
        "SIEM" {
            Test-SIEMConnection -Config $Config
        }
        "Financial" {
            Test-FinancialSystemConnection -Config $Config
        }
        "Survey" {
            Test-SurveyPlatformConnection -Config $Config
        }
        default {
            Write-Warning "Unknown data source: $SourceName"
        }
    }
}

function Collect-BusinessValueMetrics {
    param([hashtable]$Period)
    
    Write-Host "Collecting Business Value Delivery metrics..." -ForegroundColor Yellow
    
    $metrics = @{}
    
    try {
        # Technology ROI
        $metrics.TechnologyROI = Get-TechnologyROI -Period $Period
        
        # Business Value Realization
        $metrics.BusinessValueRealization = Get-BusinessValueRealization -Period $Period
        
        # Cost Optimization
        $metrics.CostOptimization = Get-CostOptimization -Period $Period
        
        # Time to Market
        $metrics.TimeToMarket = Get-TimeToMarket -Period $Period
        
        # Innovation Success Rate
        $metrics.InnovationSuccessRate = Get-InnovationSuccessRate -Period $Period
        
        Write-Host "Business Value metrics collected successfully" -ForegroundColor Green
        return $metrics
    }
    catch {
        Write-Error "Failed to collect Business Value metrics: $($_.Exception.Message)"
        return @{}
    }
}

function Collect-OperationalExcellenceMetrics {
    param([hashtable]$Period)
    
    Write-Host "Collecting Operational Excellence metrics..." -ForegroundColor Yellow
    
    $metrics = @{}
    
    try {
        # System Availability
        $metrics.SystemAvailability = Get-SystemAvailability -Period $Period
        
        # Incident Resolution Time
        $metrics.IncidentResolutionTime = Get-IncidentResolutionTime -Period $Period
        
        # Change Success Rate
        $metrics.ChangeSuccessRate = Get-ChangeSuccessRate -Period $Period
        
        # SLA Achievement
        $metrics.SLAAchievement = Get-SLAAchievement -Period $Period
        
        # Capacity Utilization
        $metrics.CapacityUtilization = Get-CapacityUtilization -Period $Period
        
        Write-Host "Operational Excellence metrics collected successfully" -ForegroundColor Green
        return $metrics
    }
    catch {
        Write-Error "Failed to collect Operational Excellence metrics: $($_.Exception.Message)"
        return @{}
    }
}

function Collect-RiskManagementMetrics {
    param([hashtable]$Period)
    
    Write-Host "Collecting Risk Management metrics..." -ForegroundColor Yellow
    
    $metrics = @{}
    
    try {
        # Risk Assessment Coverage
        $metrics.RiskAssessmentCoverage = Get-RiskAssessmentCoverage -Period $Period
        
        # Security Incident Frequency
        $metrics.SecurityIncidentFrequency = Get-SecurityIncidentFrequency -Period $Period
        
        # Compliance Score
        $metrics.ComplianceScore = Get-ComplianceScore -Period $Period
        
        # Vulnerability Remediation Time
        $metrics.VulnerabilityRemediationTime = Get-VulnerabilityRemediationTime -Period $Period
        
        # Business Continuity Readiness
        $metrics.BusinessContinuityReadiness = Get-BusinessContinuityReadiness -Period $Period
        
        Write-Host "Risk Management metrics collected successfully" -ForegroundColor Green
        return $metrics
    }
    catch {
        Write-Error "Failed to collect Risk Management metrics: $($_.Exception.Message)"
        return @{}
    }
}

function Collect-StakeholderSatisfactionMetrics {
    param([hashtable]$Period)
    
    Write-Host "Collecting Stakeholder Satisfaction metrics..." -ForegroundColor Yellow
    
    $metrics = @{}
    
    try {
        # Business User Satisfaction
        $metrics.BusinessUserSatisfaction = Get-BusinessUserSatisfaction -Period $Period
        
        # Executive Satisfaction
        $metrics.ExecutiveSatisfaction = Get-ExecutiveSatisfaction -Period $Period
        
        # IT Staff Satisfaction
        $metrics.ITStaffSatisfaction = Get-ITStaffSatisfaction -Period $Period
        
        # Service Desk Satisfaction
        $metrics.ServiceDeskSatisfaction = Get-ServiceDeskSatisfaction -Period $Period
        
        Write-Host "Stakeholder Satisfaction metrics collected successfully" -ForegroundColor Green
        return $metrics
    }
    catch {
        Write-Error "Failed to collect Stakeholder Satisfaction metrics: $($_.Exception.Message)"
        return @{}
    }
}

#endregion

#region Specific Metric Collection Functions

function Get-TechnologyROI {
    param([hashtable]$Period)
    
    try {
        # Connect to financial systems and calculate ROI
        $investments = Get-TechnologyInvestments -Period $Period
        $benefits = Get-RealizedBenefits -Period $Period
        
        if ($investments -gt 0) {
            $roi = (($benefits - $investments) / $investments) * 100
        } else {
            $roi = 0
        }
        
        return @{
            Value = $roi
            Target = $script:Config.Thresholds.TechnologyROI
            Status = if ($roi -ge $script:Config.Thresholds.TechnologyROI) { "Met" } else { "Not Met" }
            Investments = $investments
            Benefits = $benefits
        }
    }
    catch {
        Write-Warning "Failed to calculate Technology ROI: $($_.Exception.Message)"
        return @{ Value = 0; Status = "Error" }
    }
}

function Get-SystemAvailability {
    param([hashtable]$Period)
    
    try {
        # Query Azure Monitor or other monitoring systems
        $availabilityData = @()
        
        if ($script:Config.DataSources.Azure) {
            $availabilityData += Get-AzureSystemAvailability -Period $Period
        }
        
        if ($script:Config.DataSources.Monitoring) {
            $availabilityData += Get-MonitoringSystemAvailability -Period $Period
        }
        
        $averageAvailability = ($availabilityData | Measure-Object -Average).Average
        
        return @{
            Value = $averageAvailability
            Target = $script:Config.Thresholds.SystemAvailability
            Status = if ($averageAvailability -ge $script:Config.Thresholds.SystemAvailability) { "Met" } else { "Not Met" }
            Details = $availabilityData
        }
    }
    catch {
        Write-Warning "Failed to get System Availability: $($_.Exception.Message)"
        return @{ Value = 0; Status = "Error" }
    }
}

function Get-SecurityIncidentFrequency {
    param([hashtable]$Period)
    
    try {
        # Query SIEM or security systems
        $incidents = Get-SecurityIncidents -Period $Period
        $monthsInPeriod = [math]::Round(($Period.EndDate - $Period.StartDate).TotalDays / 30, 1)
        $incidentsPerMonth = if ($monthsInPeriod -gt 0) { $incidents.Count / $monthsInPeriod } else { 0 }
        
        return @{
            Value = $incidentsPerMonth
            Target = $script:Config.Thresholds.SecurityIncidentFrequency
            Status = if ($incidentsPerMonth -le $script:Config.Thresholds.SecurityIncidentFrequency) { "Met" } else { "Not Met" }
            TotalIncidents = $incidents.Count
            Period = $monthsInPeriod
        }
    }
    catch {
        Write-Warning "Failed to get Security Incident Frequency: $($_.Exception.Message)"
        return @{ Value = 0; Status = "Error" }
    }
}

function Get-BusinessUserSatisfaction {
    param([hashtable]$Period)
    
    try {
        # Query survey platform
        $surveyResults = Get-SurveyResults -SurveyType "BusinessUser" -Period $Period
        $averageSatisfaction = ($surveyResults | Measure-Object -Property Score -Average).Average
        
        return @{
            Value = $averageSatisfaction
            Target = $script:Config.Thresholds.BusinessUserSatisfaction
            Status = if ($averageSatisfaction -ge $script:Config.Thresholds.BusinessUserSatisfaction) { "Met" } else { "Not Met" }
            ResponseCount = $surveyResults.Count
            Details = $surveyResults
        }
    }
    catch {
        Write-Warning "Failed to get Business User Satisfaction: $($_.Exception.Message)"
        return @{ Value = 0; Status = "Error" }
    }
}

#endregion

#region Analysis Functions

function Analyze-FrameworkEffectiveness {
    param([hashtable]$EvaluationData)
    
    Write-Host "Analyzing framework effectiveness..." -ForegroundColor Yellow
    
    try {
        $analysis = @{}
        
        # Calculate dimension scores
        $analysis.DimensionScores = Calculate-DimensionScores -Data $EvaluationData
        
        # Calculate overall effectiveness score
        $analysis.OverallScore = Calculate-OverallEffectivenessScore -DimensionScores $analysis.DimensionScores
        
        # Perform trend analysis
        $analysis.TrendAnalysis = Perform-TrendAnalysis -Data $EvaluationData
        
        # Identify improvement opportunities
        $analysis.ImprovementOpportunities = Identify-ImprovementOpportunities -Data $EvaluationData
        
        # Generate recommendations
        $analysis.Recommendations = Generate-Recommendations -Analysis $analysis
        
        Write-Host "Framework effectiveness analysis completed" -ForegroundColor Green
        return $analysis
    }
    catch {
        Write-Error "Failed to analyze framework effectiveness: $($_.Exception.Message)"
        return @{}
    }
}

function Calculate-DimensionScores {
    param([hashtable]$Data)
    
    $weights = $script:Config.Metrics.Weights
    $scores = @{}
    
    # Business Value Delivery (25%)
    $bvdMetrics = $Data.BusinessValue
    $bvdScore = Calculate-WeightedScore -Metrics $bvdMetrics -Category "BusinessValue"
    $scores.BusinessValueDelivery = @{ Score = $bvdScore; Weight = $weights.BusinessValue }
    
    # Operational Excellence (20%)
    $oeMetrics = $Data.OperationalExcellence
    $oeScore = Calculate-WeightedScore -Metrics $oeMetrics -Category "OperationalExcellence"
    $scores.OperationalExcellence = @{ Score = $oeScore; Weight = $weights.OperationalExcellence }
    
    # Risk Management (18%)
    $rmMetrics = $Data.RiskManagement
    $rmScore = Calculate-WeightedScore -Metrics $rmMetrics -Category "RiskManagement"
    $scores.RiskManagement = @{ Score = $rmScore; Weight = $weights.RiskManagement }
    
    # Strategic Alignment (15%)
    $saMetrics = $Data.StrategicAlignment
    $saScore = Calculate-WeightedScore -Metrics $saMetrics -Category "StrategicAlignment"
    $scores.StrategicAlignment = @{ Score = $saScore; Weight = $weights.StrategicAlignment }
    
    # Stakeholder Satisfaction (12%)
    $ssMetrics = $Data.StakeholderSatisfaction
    $ssScore = Calculate-WeightedScore -Metrics $ssMetrics -Category "StakeholderSatisfaction"
    $scores.StakeholderSatisfaction = @{ Score = $ssScore; Weight = $weights.StakeholderSatisfaction }
    
    # Innovation Enablement (10%)
    $ieMetrics = $Data.InnovationEnablement
    $ieScore = Calculate-WeightedScore -Metrics $ieMetrics -Category "InnovationEnablement"
    $scores.InnovationEnablement = @{ Score = $ieScore; Weight = $weights.InnovationEnablement }
    
    return $scores
}

function Calculate-OverallEffectivenessScore {
    param([hashtable]$DimensionScores)
    
    $totalScore = 0
    $totalWeight = 0
    
    foreach ($dimension in $DimensionScores.Keys) {
        $score = $DimensionScores[$dimension].Score
        $weight = $DimensionScores[$dimension].Weight
        
        $totalScore += ($score * $weight)
        $totalWeight += $weight
    }
    
    $overallScore = if ($totalWeight -gt 0) { $totalScore / $totalWeight } else { 0 }
    
    return @{
        Score = $overallScore
        Grade = Get-PerformanceGrade -Score $overallScore
        MaturityLevel = Get-MaturityLevel -Score $overallScore
    }
}

function Get-PerformanceGrade {
    param([double]$Score)
    
    switch ($Score) {
        { $_ -ge 4.5 } { return "Excellent" }
        { $_ -ge 3.5 } { return "Good" }
        { $_ -ge 2.5 } { return "Satisfactory" }
        { $_ -ge 1.5 } { return "Below Average" }
        default { return "Poor" }
    }
}

function Get-MaturityLevel {
    param([double]$Score)
    
    switch ($Score) {
        { $_ -ge 4.5 } { return "Level 5 - Optimizing" }
        { $_ -ge 3.5 } { return "Level 4 - Managed" }
        { $_ -ge 2.5 } { return "Level 3 - Defined" }
        { $_ -ge 1.5 } { return "Level 2 - Repeatable" }
        default { return "Level 1 - Initial" }
    }
}

function Identify-ImprovementOpportunities {
    param([hashtable]$Data)
    
    $opportunities = @()
    
    # Analyze each metric for improvement potential
    foreach ($category in $Data.Keys) {
        foreach ($metric in $Data[$category].Keys) {
            $metricData = $Data[$category][$metric]
            
            if ($metricData.Status -eq "Not Met") {
                $gap = $metricData.Target - $metricData.Value
                $impact = Calculate-ImprovementImpact -Category $category -Metric $metric -Gap $gap
                
                $opportunities += @{
                    Category = $category
                    Metric = $metric
                    CurrentValue = $metricData.Value
                    Target = $metricData.Target
                    Gap = $gap
                    Impact = $impact
                    Priority = Get-ImprovementPriority -Impact $impact -Gap $gap
                }
            }
        }
    }
    
    return $opportunities | Sort-Object Priority -Descending
}

#endregion

#region Reporting Functions

function Generate-EffectivenessReport {
    param(
        [hashtable]$EvaluationData,
        [hashtable]$AnalysisResults,
        [string]$OutputPath
    )
    
    Write-Host "Generating effectiveness report..." -ForegroundColor Yellow
    
    try {
        $reportDate = Get-Date -Format "yyyy-MM-dd"
        $reportName = "ICT-Governance-Framework-Effectiveness-Report-$($EvaluationType)-$reportDate"
        $script:ReportPath = Join-Path $OutputPath "$reportName.xlsx"
        
        # Create Excel workbook
        $excel = New-Object -ComObject Excel.Application
        $excel.Visible = $false
        $workbook = $excel.Workbooks.Add()
        
        # Create worksheets
        Create-ExecutiveSummarySheet -Workbook $workbook -Analysis $AnalysisResults
        Create-MetricsDetailSheet -Workbook $workbook -Data $EvaluationData
        Create-TrendAnalysisSheet -Workbook $workbook -Analysis $AnalysisResults
        Create-ImprovementOpportunitiesSheet -Workbook $workbook -Analysis $AnalysisResults
        Create-RecommendationsSheet -Workbook $workbook -Analysis $AnalysisResults
        
        # Save workbook
        $workbook.SaveAs($script:ReportPath)
        $workbook.Close()
        $excel.Quit()
        
        # Generate PDF summary
        Generate-PDFSummary -Analysis $AnalysisResults -OutputPath $OutputPath
        
        # Generate dashboard data
        Generate-DashboardData -Data $EvaluationData -Analysis $AnalysisResults -OutputPath $OutputPath
        
        Write-Host "Effectiveness report generated: $script:ReportPath" -ForegroundColor Green
        return $script:ReportPath
    }
    catch {
        Write-Error "Failed to generate effectiveness report: $($_.Exception.Message)"
        return $null
    }
}

function Create-ExecutiveSummarySheet {
    param($Workbook, $Analysis)
    
    $worksheet = $Workbook.Worksheets.Add()
    $worksheet.Name = "Executive Summary"
    
    # Add header
    $worksheet.Cells.Item(1, 1) = "ICT Governance Framework Effectiveness Assessment"
    $worksheet.Cells.Item(1, 1).Font.Size = 16
    $worksheet.Cells.Item(1, 1).Font.Bold = $true
    
    # Add assessment details
    $row = 3
    $worksheet.Cells.Item($row, 1) = "Assessment Period:"
    $worksheet.Cells.Item($row, 2) = $EvaluationType
    $row++
    
    $worksheet.Cells.Item($row, 1) = "Assessment Date:"
    $worksheet.Cells.Item($row, 2) = (Get-Date -Format "yyyy-MM-dd")
    $row++
    
    $worksheet.Cells.Item($row, 1) = "Overall Effectiveness Score:"
    $worksheet.Cells.Item($row, 2) = [math]::Round($Analysis.OverallScore.Score, 2)
    $row++
    
    $worksheet.Cells.Item($row, 1) = "Performance Grade:"
    $worksheet.Cells.Item($row, 2) = $Analysis.OverallScore.Grade
    $row++
    
    $worksheet.Cells.Item($row, 1) = "Maturity Level:"
    $worksheet.Cells.Item($row, 2) = $Analysis.OverallScore.MaturityLevel
    $row += 2
    
    # Add dimension scores
    $worksheet.Cells.Item($row, 1) = "Dimension Scores:"
    $worksheet.Cells.Item($row, 1).Font.Bold = $true
    $row++
    
    foreach ($dimension in $Analysis.DimensionScores.Keys) {
        $worksheet.Cells.Item($row, 1) = $dimension
        $worksheet.Cells.Item($row, 2) = [math]::Round($Analysis.DimensionScores[$dimension].Score, 2)
        $row++
    }
}

function Send-EffectivenessReports {
    param([string]$ReportPath)
    
    if (-not $SendReports) {
        Write-Host "Report sending skipped (SendReports switch not specified)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Sending effectiveness reports to stakeholders..." -ForegroundColor Yellow
    
    try {
        $recipients = $script:Config.Reporting.Recipients
        
        foreach ($recipient in $recipients) {
            $subject = "ICT Governance Framework Effectiveness Report - $EvaluationType"
            $body = Generate-EmailBody -RecipientType $recipient.Type
            
            Send-MailMessage -To $recipient.Email -Subject $subject -Body $body -Attachments $ReportPath -BodyAsHtml
            Write-Host "Report sent to: $($recipient.Email)" -ForegroundColor Green
        }
    }
    catch {
        Write-Error "Failed to send reports: $($_.Exception.Message)"
    }
}

#endregion

#region Utility Functions

function Write-LogEntry {
    param(
        [string]$Message,
        [string]$Level = "Info"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Write to console
    switch ($Level) {
        "Error" { Write-Host $logEntry -ForegroundColor Red }
        "Warning" { Write-Host $logEntry -ForegroundColor Yellow }
        "Success" { Write-Host $logEntry -ForegroundColor Green }
        default { Write-Host $logEntry -ForegroundColor White }
    }
    
    # Write to log file
    $logPath = Join-Path $OutputPath "evaluation-log.txt"
    Add-Content -Path $logPath -Value $logEntry
}

function Test-Prerequisites {
    Write-Host "Testing prerequisites..." -ForegroundColor Yellow
    
    $prerequisites = @(
        @{ Name = "PowerShell Version"; Test = { $PSVersionTable.PSVersion.Major -ge 5 } },
        @{ Name = "Output Directory"; Test = { Test-Path $OutputPath } },
        @{ Name = "Configuration File"; Test = { Test-Path $ConfigFile } },
        @{ Name = "Excel COM Object"; Test = { try { New-Object -ComObject Excel.Application; $true } catch { $false } } }
    )
    
    $allPassed = $true
    
    foreach ($prereq in $prerequisites) {
        $result = & $prereq.Test
        if ($result) {
            Write-Host "✓ $($prereq.Name)" -ForegroundColor Green
        } else {
            Write-Host "✗ $($prereq.Name)" -ForegroundColor Red
            $allPassed = $false
        }
    }
    
    return $allPassed
}

function Export-EvaluationData {
    param(
        [hashtable]$Data,
        [string]$OutputPath
    )
    
    $dataPath = Join-Path $OutputPath "evaluation-data.json"
    $Data | ConvertTo-Json -Depth 10 | Out-File -FilePath $dataPath -Encoding UTF8
    
    Write-Host "Evaluation data exported to: $dataPath" -ForegroundColor Green
}

#endregion

#region Main Execution

function Start-FrameworkEffectivenessEvaluation {
    Write-Host "Starting ICT Governance Framework Effectiveness Evaluation" -ForegroundColor Cyan
    Write-Host "Evaluation Type: $EvaluationType" -ForegroundColor Cyan
    Write-Host "Output Path: $OutputPath" -ForegroundColor Cyan
    
    try {
        # Test prerequisites
        if (-not (Test-Prerequisites)) {
            throw "Prerequisites not met. Please resolve issues and try again."
        }
        
        # Initialize configuration
        if (-not (Initialize-Configuration -ConfigPath $ConfigFile)) {
            throw "Failed to initialize configuration"
        }
        
        # Get evaluation period
        $evaluationPeriod = Get-EvaluationPeriod -Type $EvaluationType
        Write-Host "Evaluation Period: $($evaluationPeriod.StartDate.ToString('yyyy-MM-dd')) to $($evaluationPeriod.EndDate.ToString('yyyy-MM-dd'))" -ForegroundColor Cyan
        
        # Connect to data sources
        if (-not (Connect-DataSources)) {
            throw "Failed to connect to data sources"
        }
        
        # Collect metrics data
        Write-Host "Collecting effectiveness metrics..." -ForegroundColor Yellow
        
        $script:EvaluationData = @{
            BusinessValue = Collect-BusinessValueMetrics -Period $evaluationPeriod
            OperationalExcellence = Collect-OperationalExcellenceMetrics -Period $evaluationPeriod
            RiskManagement = Collect-RiskManagementMetrics -Period $evaluationPeriod
            StakeholderSatisfaction = Collect-StakeholderSatisfactionMetrics -Period $evaluationPeriod
        }
        
        # Analyze effectiveness
        $script:AnalysisResults = Analyze-FrameworkEffectiveness -EvaluationData $script:EvaluationData
        
        # Generate reports
        $reportPath = Generate-EffectivenessReport -EvaluationData $script:EvaluationData -AnalysisResults $script:AnalysisResults -OutputPath $OutputPath
        
        # Export raw data
        Export-EvaluationData -Data $script:EvaluationData -OutputPath $OutputPath
        
        # Send reports if requested
        if ($reportPath) {
            Send-EffectivenessReports -ReportPath $reportPath
        }
        
        Write-Host "Framework effectiveness evaluation completed successfully!" -ForegroundColor Green
        Write-Host "Overall Effectiveness Score: $([math]::Round($script:AnalysisResults.OverallScore.Score, 2))" -ForegroundColor Green
        Write-Host "Performance Grade: $($script:AnalysisResults.OverallScore.Grade)" -ForegroundColor Green
        
        return @{
            Success = $true
            OverallScore = $script:AnalysisResults.OverallScore.Score
            Grade = $script:AnalysisResults.OverallScore.Grade
            ReportPath = $reportPath
        }
    }
    catch {
        Write-Error "Framework effectiveness evaluation failed: $($_.Exception.Message)"
        Write-LogEntry -Message "Evaluation failed: $($_.Exception.Message)" -Level "Error"
        
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

#endregion

# Execute main function
$result = Start-FrameworkEffectivenessEvaluation

# Exit with appropriate code
if ($result.Success) {
    exit 0
} else {
    exit 1
}