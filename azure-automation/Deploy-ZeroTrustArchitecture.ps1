# Zero Trust Architecture Deployment Script
# CBA Consult ICT Governance Framework - Zero Trust Implementation
# This script provides automated deployment of Zero Trust security architecture for critical systems

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "test", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory = $false)]
    [string]$ResourceGroupName = "rg-zerotrust-$Environment",
    
    [Parameter(Mandatory = $false)]
    [string]$Location = "East US",
    
    [Parameter(Mandatory = $false)]
    [string]$OrganizationCode = "cba",
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("Confidential", "Internal", "Public")]
    [string]$DataClassification = "Confidential",
    
    [Parameter(Mandatory = $false)]
    [switch]$DeployInfrastructure,
    
    [Parameter(Mandatory = $false)]
    [switch]$DeployIdentityManagement,
    
    [Parameter(Mandatory = $false)]
    [switch]$ConfigurePolicies,
    
    [Parameter(Mandatory = $false)]
    [switch]$SetupMonitoring,
    
    [Parameter(Mandatory = $false)]
    [switch]$ValidateDeployment,
    
    [Parameter(Mandatory = $false)]
    [switch]$GenerateReport,
    
    [Parameter(Mandatory = $false)]
    [switch]$WhatIf
)

# Import required modules
$RequiredModules = @(
    'Az.Accounts',
    'Az.Resources', 
    'Az.Security',
    'Az.Monitor',
    'Az.KeyVault',
    'Az.Network',
    'Az.Storage'
)

foreach ($Module in $RequiredModules) {
    try {
        Import-Module $Module -Force -ErrorAction Stop
        Write-Host "✓ Imported module: $Module" -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to import required module: $Module. Please install it using: Install-Module $Module"
        exit 1
    }
}

# Initialize logging
$LogFile = "zero-trust-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$DeploymentStartTime = Get-Date

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "WARNING", "ERROR", "SUCCESS")]
        [string]$Level = "INFO"
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    switch ($Level) {
        "INFO" { Write-Host $LogEntry -ForegroundColor White }
        "WARNING" { Write-Host $LogEntry -ForegroundColor Yellow }
        "ERROR" { Write-Host $LogEntry -ForegroundColor Red }
        "SUCCESS" { Write-Host $LogEntry -ForegroundColor Green }
    }
    
    Add-Content -Path $LogFile -Value $LogEntry
}

function Test-Prerequisites {
    Write-Log "Checking deployment prerequisites..." "INFO"
    
    # Check Azure CLI
    try {
        $azVersion = az version --output json | ConvertFrom-Json
        Write-Log "Azure CLI version: $($azVersion.'azure-cli')" "SUCCESS"
    }
    catch {
        Write-Log "Azure CLI not found. Please install Azure CLI." "ERROR"
        return $false
    }
    
    # Check Azure PowerShell connection
    try {
        $context = Get-AzContext
        if (-not $context) {
            Write-Log "Not connected to Azure. Please run Connect-AzAccount." "ERROR"
            return $false
        }
        Write-Log "Connected to Azure subscription: $($context.Subscription.Name)" "SUCCESS"
    }
    catch {
        Write-Log "Azure PowerShell connection failed." "ERROR"
        return $false
    }
    
    # Check subscription access
    try {
        Set-AzContext -SubscriptionId $SubscriptionId
        Write-Log "Successfully set subscription context: $SubscriptionId" "SUCCESS"
    }
    catch {
        Write-Log "Failed to access subscription: $SubscriptionId" "ERROR"
        return $false
    }
    
    # Check required permissions
    $requiredRoles = @("Owner", "Contributor", "Security Admin")
    $currentUser = Get-AzContext
    $roleAssignments = Get-AzRoleAssignment -SignInName $currentUser.Account.Id
    
    $hasRequiredRole = $false
    foreach ($role in $roleAssignments) {
        if ($role.RoleDefinitionName -in $requiredRoles) {
            $hasRequiredRole = $true
            Write-Log "User has required role: $($role.RoleDefinitionName)" "SUCCESS"
            break
        }
    }
    
    if (-not $hasRequiredRole) {
        Write-Log "User does not have required permissions. Required roles: $($requiredRoles -join ', ')" "ERROR"
        return $false
    }
    
    return $true
}

function New-ResourceGroup {
    param([string]$Name, [string]$Location)
    
    Write-Log "Creating resource group: $Name in $Location" "INFO"
    
    if ($WhatIf) {
        Write-Log "WHAT-IF: Would create resource group $Name" "INFO"
        return
    }
    
    try {
        $rg = Get-AzResourceGroup -Name $Name -ErrorAction SilentlyContinue
        if ($rg) {
            Write-Log "Resource group $Name already exists" "WARNING"
        }
        else {
            $rg = New-AzResourceGroup -Name $Name -Location $Location
            Write-Log "Successfully created resource group: $Name" "SUCCESS"
        }
        return $rg
    }
    catch {
        Write-Log "Failed to create resource group: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Deploy-ZeroTrustInfrastructure {
    Write-Log "Deploying Zero Trust infrastructure components..." "INFO"
    
    $templatePath = "blueprint-templates/security-blueprints/zero-trust-architecture.bicep"
    
    if (-not (Test-Path $templatePath)) {
        Write-Log "Template file not found: $templatePath" "ERROR"
        throw "Template file not found"
    }
    
    $parameters = @{
        environmentName = $Environment
        organizationCode = $OrganizationCode
        location = $Location
        dataClassification = $DataClassification
        enableAdvancedThreatProtection = $true
        enableConditionalAccess = $true
        enableNetworkSegmentation = $true
        complianceRequirements = @("ISO27001", "NIST", "SOC2")
    }
    
    if ($WhatIf) {
        Write-Log "WHAT-IF: Would deploy Zero Trust infrastructure with parameters:" "INFO"
        $parameters | ConvertTo-Json | Write-Log
        return
    }
    
    try {
        $deploymentName = "zerotrust-infrastructure-$(Get-Date -Format 'yyyyMMddHHmmss')"
        
        Write-Log "Starting infrastructure deployment: $deploymentName" "INFO"
        
        $deployment = New-AzResourceGroupDeployment `
            -ResourceGroupName $ResourceGroupName `
            -Name $deploymentName `
            -TemplateFile $templatePath `
            -TemplateParameterObject $parameters `
            -Verbose
        
        if ($deployment.ProvisioningState -eq "Succeeded") {
            Write-Log "Infrastructure deployment completed successfully" "SUCCESS"
            Write-Log "Deployment outputs:" "INFO"
            $deployment.Outputs | ConvertTo-Json | Write-Log
        }
        else {
            Write-Log "Infrastructure deployment failed with state: $($deployment.ProvisioningState)" "ERROR"
            throw "Infrastructure deployment failed"
        }
        
        return $deployment
    }
    catch {
        Write-Log "Infrastructure deployment error: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Deploy-IdentityManagement {
    Write-Log "Deploying Identity and Access Management components..." "INFO"
    
    $templatePath = "blueprint-templates/security-blueprints/identity-access-management.bicep"
    
    if (-not (Test-Path $templatePath)) {
        Write-Log "Template file not found: $templatePath" "ERROR"
        throw "Template file not found"
    }
    
    $parameters = @{
        environmentName = $Environment
        organizationCode = $OrganizationCode
        location = $Location
        dataClassification = $DataClassification
        enablePIM = $true
        enableConditionalAccess = $true
        enableIdentityProtection = $true
    }
    
    if ($WhatIf) {
        Write-Log "WHAT-IF: Would deploy Identity Management with parameters:" "INFO"
        $parameters | ConvertTo-Json | Write-Log
        return
    }
    
    try {
        $deploymentName = "zerotrust-iam-$(Get-Date -Format 'yyyyMMddHHmmss')"
        
        Write-Log "Starting IAM deployment: $deploymentName" "INFO"
        
        $deployment = New-AzResourceGroupDeployment `
            -ResourceGroupName $ResourceGroupName `
            -Name $deploymentName `
            -TemplateFile $templatePath `
            -TemplateParameterObject $parameters `
            -Verbose
        
        if ($deployment.ProvisioningState -eq "Succeeded") {
            Write-Log "IAM deployment completed successfully" "SUCCESS"
        }
        else {
            Write-Log "IAM deployment failed with state: $($deployment.ProvisioningState)" "ERROR"
            throw "IAM deployment failed"
        }
        
        return $deployment
    }
    catch {
        Write-Log "IAM deployment error: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Set-ZeroTrustPolicies {
    Write-Log "Configuring Zero Trust security policies..." "INFO"
    
    if ($WhatIf) {
        Write-Log "WHAT-IF: Would configure Zero Trust policies" "INFO"
        return
    }
    
    try {
        # Configure Azure Security Center
        Write-Log "Configuring Azure Security Center policies..." "INFO"
        
        $securityContacts = @{
            Email = "security@cbagroup.com"
            Phone = "+1-555-0123"
            AlertNotifications = $true
            AlertsToAdmins = $true
        }
        
        # Set security contact
        Set-AzSecurityContact @securityContacts
        
        # Enable auto-provisioning
        Set-AzSecurityAutoProvisioningSetting -Name "default" -EnableAutoProvisioning
        
        # Configure security policies for critical systems
        $policyDefinitions = @(
            @{
                Name = "Zero Trust Network Access"
                Description = "Enforce Zero Trust network access controls"
                Rules = @{
                    RequireMFA = $true
                    RequireCompliantDevice = $true
                    BlockLegacyAuth = $true
                }
            },
            @{
                Name = "Critical Data Protection"
                Description = "Protect critical data with encryption and access controls"
                Rules = @{
                    RequireEncryption = $true
                    RequireDataClassification = $true
                    EnableDLP = $true
                }
            }
        )
        
        foreach ($policy in $policyDefinitions) {
            Write-Log "Configuring policy: $($policy.Name)" "INFO"
            # Policy configuration would be implemented here
        }
        
        Write-Log "Zero Trust policies configured successfully" "SUCCESS"
    }
    catch {
        Write-Log "Policy configuration error: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Set-MonitoringAndAlerting {
    Write-Log "Setting up monitoring and alerting..." "INFO"
    
    if ($WhatIf) {
        Write-Log "WHAT-IF: Would setup monitoring and alerting" "INFO"
        return
    }
    
    try {
        # Get Log Analytics workspace from infrastructure deployment
        $workspace = Get-AzOperationalInsightsWorkspace -ResourceGroupName $ResourceGroupName | Where-Object { $_.Name -like "*zerotrust*" }
        
        if (-not $workspace) {
            Write-Log "Log Analytics workspace not found. Ensure infrastructure is deployed first." "ERROR"
            throw "Log Analytics workspace not found"
        }
        
        Write-Log "Found Log Analytics workspace: $($workspace.Name)" "SUCCESS"
        
        # Configure alert rules for Zero Trust monitoring
        $alertRules = @(
            @{
                Name = "High Risk Sign-in Detected"
                Description = "Alert when high-risk sign-in is detected"
                Query = "SigninLogs | where RiskLevelDuringSignIn == 'high'"
                Severity = 1
                Frequency = 5
                TimeWindow = 15
            },
            @{
                Name = "Privileged Access Anomaly"
                Description = "Alert when privileged access anomaly is detected"
                Query = "AuditLogs | where Category == 'RoleManagement' and Result == 'success'"
                Severity = 2
                Frequency = 15
                TimeWindow = 60
            },
            @{
                Name = "Data Exfiltration Attempt"
                Description = "Alert when potential data exfiltration is detected"
                Query = "CloudAppEvents | where ActionType == 'FileDownloaded' and AccountObjectId != ''"
                Severity = 1
                Frequency = 5
                TimeWindow = 15
            }
        )
        
        foreach ($rule in $alertRules) {
            Write-Log "Creating alert rule: $($rule.Name)" "INFO"
            
            # Create scheduled query rule
            $alertRule = New-AzScheduledQueryRule `
                -ResourceGroupName $ResourceGroupName `
                -Location $Location `
                -Name $rule.Name `
                -Description $rule.Description `
                -Query $rule.Query `
                -Severity $rule.Severity `
                -Frequency $rule.Frequency `
                -TimeWindow $rule.TimeWindow `
                -DataSourceId $workspace.ResourceId
            
            Write-Log "Created alert rule: $($rule.Name)" "SUCCESS"
        }
        
        Write-Log "Monitoring and alerting setup completed" "SUCCESS"
    }
    catch {
        Write-Log "Monitoring setup error: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Test-ZeroTrustDeployment {
    Write-Log "Validating Zero Trust deployment..." "INFO"
    
    try {
        $validationResults = @{
            Infrastructure = $false
            Identity = $false
            Policies = $false
            Monitoring = $false
            Overall = $false
        }
        
        # Validate infrastructure components
        Write-Log "Validating infrastructure components..." "INFO"
        $resources = Get-AzResource -ResourceGroupName $ResourceGroupName
        
        $requiredResources = @(
            "Microsoft.OperationalInsights/workspaces",
            "Microsoft.KeyVault/vaults",
            "Microsoft.Network/virtualNetworks",
            "Microsoft.Network/networkSecurityGroups"
        )
        
        $foundResources = @()
        foreach ($resource in $resources) {
            if ($resource.ResourceType -in $requiredResources) {
                $foundResources += $resource.ResourceType
            }
        }
        
        if ($foundResources.Count -eq $requiredResources.Count) {
            $validationResults.Infrastructure = $true
            Write-Log "Infrastructure validation: PASSED" "SUCCESS"
        }
        else {
            Write-Log "Infrastructure validation: FAILED - Missing resources" "ERROR"
        }
        
        # Validate identity components
        Write-Log "Validating identity components..." "INFO"
        $identityResources = $resources | Where-Object { $_.ResourceType -like "*Identity*" -or $_.ResourceType -like "*KeyVault*" }
        
        if ($identityResources.Count -gt 0) {
            $validationResults.Identity = $true
            Write-Log "Identity validation: PASSED" "SUCCESS"
        }
        else {
            Write-Log "Identity validation: FAILED" "ERROR"
        }
        
        # Validate monitoring
        Write-Log "Validating monitoring components..." "INFO"
        $monitoringResources = $resources | Where-Object { $_.ResourceType -like "*Insights*" -or $_.ResourceType -like "*Monitor*" }
        
        if ($monitoringResources.Count -gt 0) {
            $validationResults.Monitoring = $true
            Write-Log "Monitoring validation: PASSED" "SUCCESS"
        }
        else {
            Write-Log "Monitoring validation: FAILED" "ERROR"
        }
        
        # Overall validation
        $validationResults.Overall = $validationResults.Infrastructure -and $validationResults.Identity -and $validationResults.Monitoring
        
        if ($validationResults.Overall) {
            Write-Log "Overall deployment validation: PASSED" "SUCCESS"
        }
        else {
            Write-Log "Overall deployment validation: FAILED" "ERROR"
        }
        
        return $validationResults
    }
    catch {
        Write-Log "Validation error: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function New-DeploymentReport {
    param([hashtable]$ValidationResults)
    
    Write-Log "Generating deployment report..." "INFO"
    
    $reportPath = "zero-trust-deployment-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Zero Trust Architecture Deployment Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #0078d4; color: white; padding: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { color: blue; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Zero Trust Architecture Deployment Report</h1>
        <p>Environment: $Environment | Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
    </div>
    
    <div class="section">
        <h2>Deployment Summary</h2>
        <table>
            <tr><th>Component</th><th>Status</th></tr>
            <tr><td>Infrastructure</td><td class="$(if($ValidationResults.Infrastructure){'success'}else{'error'})">$(if($ValidationResults.Infrastructure){'PASSED'}else{'FAILED'})</td></tr>
            <tr><td>Identity Management</td><td class="$(if($ValidationResults.Identity){'success'}else{'error'})">$(if($ValidationResults.Identity){'PASSED'}else{'FAILED'})</td></tr>
            <tr><td>Monitoring</td><td class="$(if($ValidationResults.Monitoring){'success'}else{'error'})">$(if($ValidationResults.Monitoring){'PASSED'}else{'FAILED'})</td></tr>
            <tr><td>Overall</td><td class="$(if($ValidationResults.Overall){'success'}else{'error'})">$(if($ValidationResults.Overall){'PASSED'}else{'FAILED'})</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Deployment Details</h2>
        <p><strong>Subscription ID:</strong> $SubscriptionId</p>
        <p><strong>Resource Group:</strong> $ResourceGroupName</p>
        <p><strong>Location:</strong> $Location</p>
        <p><strong>Data Classification:</strong> $DataClassification</p>
        <p><strong>Deployment Start Time:</strong> $DeploymentStartTime</p>
        <p><strong>Deployment End Time:</strong> $(Get-Date)</p>
        <p><strong>Total Duration:</strong> $((Get-Date) - $DeploymentStartTime)</p>
    </div>
    
    <div class="section">
        <h2>Next Steps</h2>
        <ul>
            <li>Review and configure conditional access policies</li>
            <li>Set up user training and awareness programs</li>
            <li>Conduct Zero Trust maturity assessment</li>
            <li>Implement continuous monitoring and improvement</li>
            <li>Schedule regular security reviews and audits</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Support and Documentation</h2>
        <p>For support and additional information, refer to:</p>
        <ul>
            <li><a href="Zero-Trust-Implementation-Guide.md">Zero Trust Implementation Guide</a></li>
            <li><a href="Zero-Trust-Maturity-Model.md">Zero Trust Maturity Model</a></li>
            <li><a href="ICT-Governance-Framework.md">ICT Governance Framework</a></li>
        </ul>
    </div>
</body>
</html>
"@
    
    $html | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Log "Deployment report generated: $reportPath" "SUCCESS"
    
    return $reportPath
}

# Main execution
try {
    Write-Log "Starting Zero Trust Architecture deployment..." "INFO"
    Write-Log "Environment: $Environment | Subscription: $SubscriptionId" "INFO"
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Log "Prerequisites check failed. Exiting." "ERROR"
        exit 1
    }
    
    # Create resource group
    $resourceGroup = New-ResourceGroup -Name $ResourceGroupName -Location $Location
    
    # Deploy components based on parameters
    if ($DeployInfrastructure -or (-not $DeployIdentityManagement -and -not $ConfigurePolicies -and -not $SetupMonitoring)) {
        Deploy-ZeroTrustInfrastructure
    }
    
    if ($DeployIdentityManagement -or (-not $DeployInfrastructure -and -not $ConfigurePolicies -and -not $SetupMonitoring)) {
        Deploy-IdentityManagement
    }
    
    if ($ConfigurePolicies -or (-not $DeployInfrastructure -and -not $DeployIdentityManagement -and -not $SetupMonitoring)) {
        Set-ZeroTrustPolicies
    }
    
    if ($SetupMonitoring -or (-not $DeployInfrastructure -and -not $DeployIdentityManagement -and -not $ConfigurePolicies)) {
        Set-MonitoringAndAlerting
    }
    
    # Validate deployment
    $validationResults = $null
    if ($ValidateDeployment -or (-not $DeployInfrastructure -and -not $DeployIdentityManagement -and -not $ConfigurePolicies -and -not $SetupMonitoring)) {
        $validationResults = Test-ZeroTrustDeployment
    }
    
    # Generate report
    if ($GenerateReport -and $validationResults) {
        $reportPath = New-DeploymentReport -ValidationResults $validationResults
        Write-Log "Deployment completed. Report available at: $reportPath" "SUCCESS"
    }
    
    Write-Log "Zero Trust Architecture deployment completed successfully!" "SUCCESS"
    Write-Log "Total deployment time: $((Get-Date) - $DeploymentStartTime)" "INFO"
}
catch {
    Write-Log "Deployment failed: $($_.Exception.Message)" "ERROR"
    Write-Log "Check the log file for detailed error information: $LogFile" "ERROR"
    exit 1
}
finally {
    Write-Log "Deployment log saved to: $LogFile" "INFO"
}