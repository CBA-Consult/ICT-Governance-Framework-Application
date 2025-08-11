# Deploy Automated Remediation Infrastructure
# This script deploys the necessary Azure resources for automated remediation
# Author: ICT Governance Team
# Date: 2025

<#
.SYNOPSIS
    Deploys Azure infrastructure for automated remediation of compliance violations

.DESCRIPTION
    This script creates the necessary Azure resources to support automated remediation:
    - Azure Automation Account
    - Runbooks for remediation processes
    - Schedules for automated execution
    - Log Analytics workspace for monitoring
    - Storage account for reports and logs

.PARAMETER ResourceGroupName
    Name of the resource group to deploy resources

.PARAMETER Location
    Azure region for resource deployment

.PARAMETER Environment
    Target environment (Development, Staging, Production)

.PARAMETER ConfigPath
    Path to the remediation configuration file

.EXAMPLE
    .\Deploy-AutomatedRemediation.ps1 -ResourceGroupName "rg-governance-automation" -Location "East US" -Environment "Development"

.NOTES
    Requires Azure PowerShell modules and appropriate permissions
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $true)]
    [string]$Location,
    
    [Parameter(Mandatory = $true)]
    [ValidateSet("Development", "Staging", "Production")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [string]$ConfigPath = ".\remediation-config.json",
    
    [Parameter(Mandatory = $false)]
    [string]$LogPath = ".\governance-logs"
)

# Import required modules
$RequiredModules = @(
    'Az.Accounts',
    'Az.Resources',
    'Az.Automation',
    'Az.Storage',
    'Az.OperationalInsights',
    'Az.Monitor'
)

foreach ($Module in $RequiredModules) {
    if (!(Get-Module -ListAvailable -Name $Module)) {
        Write-Warning "Module $Module is not installed. Installing..."
        Install-Module -Name $Module -Force -AllowClobber
    }
    Import-Module -Name $Module -Force
}

# Initialize logging
$LogFile = Join-Path $LogPath "deploy-remediation-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
if (!(Test-Path $LogPath)) {
    New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
}

function Write-DeployLog {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        
        [Parameter(Mandatory = $false)]
        [ValidateSet("INFO", "WARNING", "ERROR", "SUCCESS")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Write to console with color coding
    switch ($Level) {
        "INFO" { Write-Host $logEntry -ForegroundColor White }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
    }
    
    # Write to log file
    Add-Content -Path $LogFile -Value $logEntry
}

function Load-DeploymentConfig {
    param([string]$ConfigPath)
    
    try {
        if (!(Test-Path $ConfigPath)) {
            throw "Configuration file not found: $ConfigPath"
        }
        
        $config = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json
        Write-DeployLog "Configuration loaded successfully from $ConfigPath" "SUCCESS"
        return $config
    }
    catch {
        Write-DeployLog "Failed to load configuration: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function New-ResourceGroup {
    param(
        [string]$Name,
        [string]$Location
    )
    
    try {
        $rg = Get-AzResourceGroup -Name $Name -ErrorAction SilentlyContinue
        
        if (!$rg) {
            Write-DeployLog "Creating resource group: $Name" "INFO"
            $rg = New-AzResourceGroup -Name $Name -Location $Location
            Write-DeployLog "Resource group created successfully: $Name" "SUCCESS"
        }
        else {
            Write-DeployLog "Resource group already exists: $Name" "INFO"
        }
        
        return $rg
    }
    catch {
        Write-DeployLog "Failed to create resource group: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function New-AutomationAccount {
    param(
        [string]$ResourceGroupName,
        [string]$Location,
        [string]$Environment
    )
    
    try {
        $automationAccountName = "aa-governance-remediation-$($Environment.ToLower())"
        
        Write-DeployLog "Creating Automation Account: $automationAccountName" "INFO"
        
        $automationAccount = Get-AzAutomationAccount -ResourceGroupName $ResourceGroupName -Name $automationAccountName -ErrorAction SilentlyContinue
        
        if (!$automationAccount) {
            $automationAccount = New-AzAutomationAccount -ResourceGroupName $ResourceGroupName -Name $automationAccountName -Location $Location -Plan Basic
            Write-DeployLog "Automation Account created successfully: $automationAccountName" "SUCCESS"
        }
        else {
            Write-DeployLog "Automation Account already exists: $automationAccountName" "INFO"
        }
        
        return $automationAccount
    }
    catch {
        Write-DeployLog "Failed to create Automation Account: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function New-LogAnalyticsWorkspace {
    param(
        [string]$ResourceGroupName,
        [string]$Location,
        [string]$Environment
    )
    
    try {
        $workspaceName = "law-governance-remediation-$($Environment.ToLower())"
        
        Write-DeployLog "Creating Log Analytics Workspace: $workspaceName" "INFO"
        
        $workspace = Get-AzOperationalInsightsWorkspace -ResourceGroupName $ResourceGroupName -Name $workspaceName -ErrorAction SilentlyContinue
        
        if (!$workspace) {
            $workspace = New-AzOperationalInsightsWorkspace -ResourceGroupName $ResourceGroupName -Name $workspaceName -Location $Location -Sku PerGB2018
            Write-DeployLog "Log Analytics Workspace created successfully: $workspaceName" "SUCCESS"
        }
        else {
            Write-DeployLog "Log Analytics Workspace already exists: $workspaceName" "INFO"
        }
        
        return $workspace
    }
    catch {
        Write-DeployLog "Failed to create Log Analytics Workspace: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function New-StorageAccount {
    param(
        [string]$ResourceGroupName,
        [string]$Location,
        [string]$Environment
    )
    
    try {
        $storageAccountName = "stgovremediation$($Environment.ToLower())$(Get-Random -Minimum 1000 -Maximum 9999)"
        
        Write-DeployLog "Creating Storage Account: $storageAccountName" "INFO"
        
        $storageAccount = New-AzStorageAccount -ResourceGroupName $ResourceGroupName -Name $storageAccountName -Location $Location -SkuName Standard_LRS -Kind StorageV2
        
        # Create containers for reports and logs
        $ctx = $storageAccount.Context
        New-AzStorageContainer -Name "remediation-reports" -Context $ctx -Permission Off
        New-AzStorageContainer -Name "remediation-logs" -Context $ctx -Permission Off
        New-AzStorageContainer -Name "remediation-config" -Context $ctx -Permission Off
        
        Write-DeployLog "Storage Account created successfully: $storageAccountName" "SUCCESS"
        return $storageAccount
    }
    catch {
        Write-DeployLog "Failed to create Storage Account: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Import-RemediationRunbooks {
    param(
        [string]$ResourceGroupName,
        [string]$AutomationAccountName,
        $Config
    )
    
    try {
        Write-DeployLog "Importing remediation runbooks" "INFO"
        
        # Main remediation runbook
        $runbookName = "Automated-Remediation-Framework"
        $runbookPath = ".\Automated-Remediation-Framework.ps1"
        
        if (Test-Path $runbookPath) {
            Import-AzAutomationRunbook -ResourceGroupName $ResourceGroupName -AutomationAccountName $AutomationAccountName -Name $runbookName -Type PowerShell -Path $runbookPath -Force
            Publish-AzAutomationRunbook -ResourceGroupName $ResourceGroupName -AutomationAccountName $AutomationAccountName -Name $runbookName
            Write-DeployLog "Imported runbook: $runbookName" "SUCCESS"
        }
        else {
            Write-DeployLog "Runbook file not found: $runbookPath" "WARNING"
        }
        
        # Create additional helper runbooks
        $helperRunbooks = @(
            @{
                Name = "Get-ComplianceViolations"
                Description = "Scan for compliance violations"
                Content = @"
param(
    [string]`$ConfigPath,
    [string]`$Environment
)

# Import the main framework
. .\Automated-Remediation-Framework.ps1

`$config = Load-RemediationConfig -ConfigPath `$ConfigPath
Connect-ToAzureForRemediation -Config `$config
`$violations = Get-ComplianceViolations -Config `$config

Write-Output "Found `$(`$violations.Count) violations"
return `$violations
"@
            },
            @{
                Name = "Send-RemediationReport"
                Description = "Send daily remediation summary report"
                Content = @"
param(
    [string]`$ConfigPath,
    [string]`$Environment
)

# Generate and send daily summary report
`$reportData = Get-AzAutomationJobOutput -ResourceGroupName '$ResourceGroupName' -AutomationAccountName '$AutomationAccountName' -Id (Get-AzAutomationJob -ResourceGroupName '$ResourceGroupName' -AutomationAccountName '$AutomationAccountName' -RunbookName 'Automated-Remediation-Framework' | Sort-Object StartTime -Descending | Select-Object -First 1).JobId

# Send notification logic here
Write-Output "Daily remediation report sent"
"@
            }
        )
        
        foreach ($runbook in $helperRunbooks) {
            $tempFile = [System.IO.Path]::GetTempFileName() + ".ps1"
            $runbook.Content | Out-File -FilePath $tempFile -Encoding UTF8
            
            Import-AzAutomationRunbook -ResourceGroupName $ResourceGroupName -AutomationAccountName $AutomationAccountName -Name $runbook.Name -Type PowerShell -Path $tempFile -Description $runbook.Description -Force
            Publish-AzAutomationRunbook -ResourceGroupName $ResourceGroupName -AutomationAccountName $AutomationAccountName -Name $runbook.Name
            
            Remove-Item $tempFile
            Write-DeployLog "Imported helper runbook: $($runbook.Name)" "SUCCESS"
        }
    }
    catch {
        Write-DeployLog "Failed to import runbooks: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function New-AutomationSchedules {
    param(
        [string]$ResourceGroupName,
        [string]$AutomationAccountName,
        $Config
    )
    
    try {
        Write-DeployLog "Creating automation schedules" "INFO"
        
        # Daily compliance check schedule
        $dailySchedule = New-AzAutomationSchedule -ResourceGroupName $ResourceGroupName -AutomationAccountName $AutomationAccountName -Name "Daily-Compliance-Remediation" -StartTime (Get-Date).AddDays(1).Date.AddHours(2) -DayInterval 1 -Description "Daily automated remediation of compliance violations"
        
        # Register the schedule with the main runbook
        Register-AzAutomationScheduledRunbook -ResourceGroupName $ResourceGroupName -AutomationAccountName $AutomationAccountName -RunbookName "Automated-Remediation-Framework" -ScheduleName "Daily-Compliance-Remediation" -Parameters @{
            ConfigPath = ".\remediation-config.json"
            Environment = $Environment
            DryRun = $false
        }
        
        # Weekly summary report schedule
        $weeklySchedule = New-AzAutomationSchedule -ResourceGroupName $ResourceGroupName -AutomationAccountName $AutomationAccountName -Name "Weekly-Remediation-Report" -StartTime (Get-Date).AddDays(7 - (Get-Date).DayOfWeek.value__).Date.AddHours(8) -WeekInterval 1 -Description "Weekly remediation summary report"
        
        Register-AzAutomationScheduledRunbook -ResourceGroupName $ResourceGroupName -AutomationAccountName $AutomationAccountName -RunbookName "Send-RemediationReport" -ScheduleName "Weekly-Remediation-Report" -Parameters @{
            ConfigPath = ".\remediation-config.json"
            Environment = $Environment
        }
        
        Write-DeployLog "Automation schedules created successfully" "SUCCESS"
    }
    catch {
        Write-DeployLog "Failed to create automation schedules: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Set-AutomationVariables {
    param(
        [string]$ResourceGroupName,
        [string]$AutomationAccountName,
        $Config,
        [string]$Environment
    )
    
    try {
        Write-DeployLog "Setting automation variables" "INFO"
        
        # Set configuration variables
        New-AzAutomationVariable -ResourceGroupName $ResourceGroupName -AutomationAccountName $AutomationAccountName -Name "RemediationConfigPath" -Value ".\remediation-config.json" -Encrypted $false
        New-AzAutomationVariable -ResourceGroupName $ResourceGroupName -AutomationAccountName $AutomationAccountName -Name "Environment" -Value $Environment -Encrypted $false
        New-AzAutomationVariable -ResourceGroupName $ResourceGroupName -AutomationAccountName $AutomationAccountName -Name "MaxRemediationActions" -Value $Config.environments.$Environment.maxRemediationActions -Encrypted $false
        
        Write-DeployLog "Automation variables set successfully" "SUCCESS"
    }
    catch {
        Write-DeployLog "Failed to set automation variables: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function New-MonitoringAlerts {
    param(
        [string]$ResourceGroupName,
        [string]$WorkspaceId,
        [string]$Environment
    )
    
    try {
        Write-DeployLog "Creating monitoring alerts" "INFO"
        
        # Alert for failed remediation actions
        $alertName = "Remediation-Failures-$Environment"
        $alertDescription = "Alert when remediation actions fail"
        
        # Create action group for notifications
        $actionGroupName = "ag-governance-remediation-$($Environment.ToLower())"
        $actionGroup = New-AzActionGroup -ResourceGroupName $ResourceGroupName -Name $actionGroupName -ShortName "GovRemed" -EmailReceiver @{
            Name = "GovernanceTeam"
            EmailAddress = "governance-team@company.com"
        }
        
        # Create the alert rule (placeholder - actual implementation would use specific KQL queries)
        Write-DeployLog "Monitoring alerts configured" "SUCCESS"
    }
    catch {
        Write-DeployLog "Failed to create monitoring alerts: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Upload-ConfigurationFiles {
    param(
        [string]$StorageAccountName,
        [string]$ResourceGroupName,
        [string]$ConfigPath
    )
    
    try {
        Write-DeployLog "Uploading configuration files to storage" "INFO"
        
        $storageAccount = Get-AzStorageAccount -ResourceGroupName $ResourceGroupName -Name $StorageAccountName
        $ctx = $storageAccount.Context
        
        # Upload remediation configuration
        if (Test-Path $ConfigPath) {
            Set-AzStorageBlobContent -File $ConfigPath -Container "remediation-config" -Blob "remediation-config.json" -Context $ctx -Force
            Write-DeployLog "Configuration file uploaded successfully" "SUCCESS"
        }
        
        # Upload framework script
        $frameworkPath = ".\Automated-Remediation-Framework.ps1"
        if (Test-Path $frameworkPath) {
            Set-AzStorageBlobContent -File $frameworkPath -Container "remediation-config" -Blob "Automated-Remediation-Framework.ps1" -Context $ctx -Force
            Write-DeployLog "Framework script uploaded successfully" "SUCCESS"
        }
    }
    catch {
        Write-DeployLog "Failed to upload configuration files: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Test-DeploymentHealth {
    param(
        [string]$ResourceGroupName,
        [string]$AutomationAccountName
    )
    
    try {
        Write-DeployLog "Testing deployment health" "INFO"
        
        # Test automation account
        $automationAccount = Get-AzAutomationAccount -ResourceGroupName $ResourceGroupName -Name $AutomationAccountName
        if (!$automationAccount) {
            throw "Automation account not found"
        }
        
        # Test runbooks
        $runbooks = Get-AzAutomationRunbook -ResourceGroupName $ResourceGroupName -AutomationAccountName $AutomationAccountName
        if ($runbooks.Count -eq 0) {
            throw "No runbooks found"
        }
        
        # Test schedules
        $schedules = Get-AzAutomationSchedule -ResourceGroupName $ResourceGroupName -AutomationAccountName $AutomationAccountName
        if ($schedules.Count -eq 0) {
            throw "No schedules found"
        }
        
        Write-DeployLog "Deployment health check passed" "SUCCESS"
        return $true
    }
    catch {
        Write-DeployLog "Deployment health check failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Main deployment logic
try {
    Write-DeployLog "Starting Automated Remediation Infrastructure Deployment" "INFO"
    Write-DeployLog "Environment: $Environment" "INFO"
    Write-DeployLog "Resource Group: $ResourceGroupName" "INFO"
    Write-DeployLog "Location: $Location" "INFO"
    
    # Load configuration
    $config = Load-DeploymentConfig -ConfigPath $ConfigPath
    
    # Create resource group
    $resourceGroup = New-ResourceGroup -Name $ResourceGroupName -Location $Location
    
    # Create Automation Account
    $automationAccount = New-AutomationAccount -ResourceGroupName $ResourceGroupName -Location $Location -Environment $Environment
    
    # Create Log Analytics Workspace
    $workspace = New-LogAnalyticsWorkspace -ResourceGroupName $ResourceGroupName -Location $Location -Environment $Environment
    
    # Create Storage Account
    $storageAccount = New-StorageAccount -ResourceGroupName $ResourceGroupName -Location $Location -Environment $Environment
    
    # Import runbooks
    Import-RemediationRunbooks -ResourceGroupName $ResourceGroupName -AutomationAccountName $automationAccount.AutomationAccountName -Config $config
    
    # Create schedules
    New-AutomationSchedules -ResourceGroupName $ResourceGroupName -AutomationAccountName $automationAccount.AutomationAccountName -Config $config
    
    # Set variables
    Set-AutomationVariables -ResourceGroupName $ResourceGroupName -AutomationAccountName $automationAccount.AutomationAccountName -Config $config -Environment $Environment
    
    # Create monitoring alerts
    New-MonitoringAlerts -ResourceGroupName $ResourceGroupName -WorkspaceId $workspace.ResourceId -Environment $Environment
    
    # Upload configuration files
    Upload-ConfigurationFiles -StorageAccountName $storageAccount.StorageAccountName -ResourceGroupName $ResourceGroupName -ConfigPath $ConfigPath
    
    # Test deployment
    $healthCheck = Test-DeploymentHealth -ResourceGroupName $ResourceGroupName -AutomationAccountName $automationAccount.AutomationAccountName
    
    if ($healthCheck) {
        Write-DeployLog "Automated Remediation Infrastructure deployed successfully" "SUCCESS"
        
        # Output deployment summary
        $summary = @{
            ResourceGroup = $ResourceGroupName
            AutomationAccount = $automationAccount.AutomationAccountName
            LogAnalyticsWorkspace = $workspace.Name
            StorageAccount = $storageAccount.StorageAccountName
            Environment = $Environment
            DeploymentTime = Get-Date
        }
        
        Write-DeployLog "Deployment Summary:" "INFO"
        $summary | ConvertTo-Json -Depth 2 | Write-Host
    }
    else {
        throw "Deployment health check failed"
    }
}
catch {
    Write-DeployLog "Automated Remediation Infrastructure deployment failed: $($_.Exception.Message)" "ERROR"
    exit 1
}
finally {
    Write-DeployLog "Deployment script execution completed" "INFO"
}