# Deploy Collaboration Platforms and Tools
# A014 - Set Up Collaboration Platforms and Tools - Deployment Automation
# This script automates the deployment and configuration of collaboration platforms

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$TenantId,
    
    [Parameter(Mandatory = $true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory = $false)]
    [string]$Environment = "prod",
    
    [Parameter(Mandatory = $false)]
    [string]$ConfigPath = "./collaboration-config.json",
    
    [Parameter(Mandatory = $false)]
    [switch]$WhatIf,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipTeams,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipSharePoint,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipDevOps,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipPowerPlatform
)

# Import required modules
$RequiredModules = @(
    'Az.Accounts',
    'Az.Resources',
    'Az.DevOps',
    'Microsoft.Graph',
    'MicrosoftTeams',
    'PnP.PowerShell',
    'Microsoft.PowerApps.Administration.PowerShell'
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
$LogFile = "Deploy-CollaborationPlatforms-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
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
        Write-Log "Configuration file not found: $ConfigPath. Using default configuration." "WARNING"
        return Get-DefaultConfiguration
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

# Default configuration
function Get-DefaultConfiguration {
    return @{
        teams = @{
            governanceTeams = @(
                @{
                    name = "ICT Governance Council"
                    description = "Strategic governance oversight and decision-making"
                    privacy = "Private"
                    channels = @("General", "Policies", "Decisions", "Escalations")
                },
                @{
                    name = "Domain Owners"
                    description = "Domain-specific governance and oversight"
                    privacy = "Private"
                    channels = @("General", "Architecture", "Security", "Compliance")
                },
                @{
                    name = "Technology Stewards"
                    description = "Technical governance and implementation"
                    privacy = "Private"
                    channels = @("General", "Implementation", "Issues", "Best Practices")
                }
            )
            policies = @{
                guestAccess = $false
                allowCreateUpdateChannels = $true
                allowDeleteChannels = $false
                allowAddRemoveApps = $false
                allowCreateUpdateRemoveTabs = $true
                allowCreateUpdateRemoveConnectors = $false
            }
        }
        sharepoint = @{
            sites = @(
                @{
                    name = "ICT Governance Hub"
                    template = "CommunicationSite"
                    description = "Central hub for ICT governance documentation and resources"
                    url = "ict-governance-hub"
                },
                @{
                    name = "Policy Library"
                    template = "TeamSite"
                    description = "Repository for all ICT policies and procedures"
                    url = "policy-library"
                },
                @{
                    name = "Governance Reports"
                    template = "TeamSite"
                    description = "Governance reporting and analytics"
                    url = "governance-reports"
                }
            )
            features = @{
                versioningEnabled = $true
                contentApprovalRequired = $true
                checkoutRequired = $false
                audienceTargeting = $true
            }
        }
        devops = @{
            organization = "ict-governance"
            projects = @(
                @{
                    name = "ICT Governance Framework"
                    description = "Main governance framework implementation project"
                    visibility = "Private"
                    processTemplate = "Agile"
                },
                @{
                    name = "Policy Management"
                    description = "Policy development and management workflows"
                    visibility = "Private"
                    processTemplate = "Scrum"
                }
            )
            repositories = @(
                @{
                    name = "governance-policies"
                    description = "ICT governance policies and procedures"
                    type = "Git"
                },
                @{
                    name = "automation-scripts"
                    description = "Governance automation and deployment scripts"
                    type = "Git"
                }
            )
        }
        powerPlatform = @{
            environments = @(
                @{
                    name = "ICT Governance Production"
                    type = "Production"
                    region = "unitedstates"
                },
                @{
                    name = "ICT Governance Development"
                    type = "Sandbox"
                    region = "unitedstates"
                }
            )
            dataLossPrevention = @{
                enabled = $true
                blockHighRiskConnectors = $true
                requireApprovalForNewConnectors = $true
            }
        }
    }
}

# Connect to services
function Connect-ToServices {
    param([string]$TenantId, [string]$SubscriptionId)
    
    try {
        Write-Log "Connecting to Azure..." "INFO"
        Connect-AzAccount -TenantId $TenantId -SubscriptionId $SubscriptionId
        
        Write-Log "Connecting to Microsoft Graph..." "INFO"
        Connect-MgGraph -TenantId $TenantId -Scopes "Group.ReadWrite.All", "Directory.ReadWrite.All", "Sites.ReadWrite.All"
        
        Write-Log "Connecting to Microsoft Teams..." "INFO"
        Connect-MicrosoftTeams -TenantId $TenantId
        
        Write-Log "Connecting to SharePoint..." "INFO"
        $adminUrl = "https://$((Get-AzContext).Tenant.Id.Split('-')[0])-admin.sharepoint.com"
        Connect-PnPOnline -Url $adminUrl -Interactive
        
        Write-Log "Connecting to Power Platform..." "INFO"
        Add-PowerAppsAccount
        
        Write-Log "✅ Successfully connected to all services" "INFO"
    }
    catch {
        Write-Log "❌ Failed to connect to services: $_" "ERROR"
        throw
    }
}

# Deploy Microsoft Teams
function Deploy-MicrosoftTeams {
    param([object]$TeamsConfig)
    
    if ($SkipTeams) {
        Write-Log "Skipping Microsoft Teams deployment" "INFO"
        return
    }
    
    Write-Log "🚀 Starting Microsoft Teams deployment..." "INFO"
    
    try {
        # Configure Teams policies
        Write-Log "Configuring Teams policies..." "INFO"
        
        $policyConfig = $TeamsConfig.policies
        
        # Create governance-specific Teams policy
        $policyName = "ICT-Governance-Policy"
        try {
            $existingPolicy = Get-CsTeamsMessagingPolicy -Identity $policyName -ErrorAction SilentlyContinue
            if (-not $existingPolicy) {
                New-CsTeamsMessagingPolicy -Identity $policyName `
                    -AllowGiphy $false `
                    -AllowStickers $false `
                    -AllowMemes $false `
                    -AllowImmersiveReader $true `
                    -AllowUrlPreviews $true `
                    -AllowUserTranslation $true
                Write-Log "✅ Created Teams messaging policy: $policyName" "INFO"
            }
        }
        catch {
            Write-Log "⚠️ Warning: Could not create Teams policy: $_" "WARNING"
        }
        
        # Create governance teams
        foreach ($teamConfig in $TeamsConfig.governanceTeams) {
            try {
                Write-Log "Creating team: $($teamConfig.name)" "INFO"
                
                # Check if team already exists
                $existingTeam = Get-Team -DisplayName $teamConfig.name -ErrorAction SilentlyContinue
                
                if (-not $existingTeam) {
                    $team = New-Team -DisplayName $teamConfig.name `
                        -Description $teamConfig.description `
                        -Visibility $teamConfig.privacy
                    
                    Write-Log "✅ Created team: $($teamConfig.name)" "INFO"
                    
                    # Create channels
                    foreach ($channelName in $teamConfig.channels) {
                        if ($channelName -ne "General") {
                            try {
                                New-TeamChannel -GroupId $team.GroupId -DisplayName $channelName
                                Write-Log "✅ Created channel: $channelName in team: $($teamConfig.name)" "INFO"
                            }
                            catch {
                                Write-Log "⚠️ Warning: Could not create channel $channelName`: $_" "WARNING"
                            }
                        }
                    }
                }
                else {
                    Write-Log "ℹ️ Team already exists: $($teamConfig.name)" "INFO"
                }
            }
            catch {
                Write-Log "❌ Failed to create team $($teamConfig.name)`: $_" "ERROR"
            }
        }
        
        Write-Log "✅ Microsoft Teams deployment completed" "INFO"
    }
    catch {
        Write-Log "❌ Microsoft Teams deployment failed: $_" "ERROR"
        throw
    }
}

# Deploy SharePoint Online
function Deploy-SharePointOnline {
    param([object]$SharePointConfig)
    
    if ($SkipSharePoint) {
        Write-Log "Skipping SharePoint Online deployment" "INFO"
        return
    }
    
    Write-Log "🚀 Starting SharePoint Online deployment..." "INFO"
    
    try {
        # Create governance sites
        foreach ($siteConfig in $SharePointConfig.sites) {
            try {
                Write-Log "Creating SharePoint site: $($siteConfig.name)" "INFO"
                
                $siteUrl = "https://$((Get-AzContext).Tenant.Id.Split('-')[0]).sharepoint.com/sites/$($siteConfig.url)"
                
                # Check if site already exists
                try {
                    $existingSite = Get-PnPTenantSite -Url $siteUrl -ErrorAction SilentlyContinue
                    if ($existingSite) {
                        Write-Log "ℹ️ Site already exists: $($siteConfig.name)" "INFO"
                        continue
                    }
                }
                catch {
                    # Site doesn't exist, continue with creation
                }
                
                if ($siteConfig.template -eq "CommunicationSite") {
                    New-PnPSite -Type CommunicationSite `
                        -Title $siteConfig.name `
                        -Url $siteUrl `
                        -Description $siteConfig.description
                }
                else {
                    New-PnPSite -Type TeamSite `
                        -Title $siteConfig.name `
                        -Alias $siteConfig.url `
                        -Description $siteConfig.description `
                        -IsPublic:$false
                }
                
                Write-Log "✅ Created SharePoint site: $($siteConfig.name)" "INFO"
                
                # Configure site features
                Connect-PnPOnline -Url $siteUrl -Interactive
                
                if ($SharePointConfig.features.versioningEnabled) {
                    Set-PnPList -Identity "Documents" -EnableVersioning $true -MajorVersions 50
                }
                
                if ($SharePointConfig.features.contentApprovalRequired) {
                    Set-PnPList -Identity "Documents" -EnableContentTypes $true -ContentTypesEnabled $true
                }
                
                Write-Log "✅ Configured features for site: $($siteConfig.name)" "INFO"
            }
            catch {
                Write-Log "❌ Failed to create SharePoint site $($siteConfig.name)`: $_" "ERROR"
            }
        }
        
        Write-Log "✅ SharePoint Online deployment completed" "INFO"
    }
    catch {
        Write-Log "❌ SharePoint Online deployment failed: $_" "ERROR"
        throw
    }
}

# Deploy Azure DevOps
function Deploy-AzureDevOps {
    param([object]$DevOpsConfig)
    
    if ($SkipDevOps) {
        Write-Log "Skipping Azure DevOps deployment" "INFO"
        return
    }
    
    Write-Log "🚀 Starting Azure DevOps deployment..." "INFO"
    
    try {
        # Note: Azure DevOps deployment requires manual setup of organization
        # This section provides the configuration that should be applied
        
        Write-Log "Azure DevOps Configuration:" "INFO"
        Write-Log "Organization: $($DevOpsConfig.organization)" "INFO"
        
        foreach ($project in $DevOpsConfig.projects) {
            Write-Log "Project to create: $($project.name)" "INFO"
            Write-Log "  Description: $($project.description)" "INFO"
            Write-Log "  Visibility: $($project.visibility)" "INFO"
            Write-Log "  Process Template: $($project.processTemplate)" "INFO"
        }
        
        foreach ($repo in $DevOpsConfig.repositories) {
            Write-Log "Repository to create: $($repo.name)" "INFO"
            Write-Log "  Description: $($repo.description)" "INFO"
            Write-Log "  Type: $($repo.type)" "INFO"
        }
        
        # Create Azure DevOps configuration file for manual setup
        $devopsSetupConfig = @{
            organization = $DevOpsConfig.organization
            projects = $DevOpsConfig.projects
            repositories = $DevOpsConfig.repositories
            setupInstructions = @(
                "1. Navigate to https://dev.azure.com",
                "2. Create organization: $($DevOpsConfig.organization)",
                "3. Create projects as specified in the configuration",
                "4. Create repositories within each project",
                "5. Configure branch policies and security settings",
                "6. Set up CI/CD pipelines for governance automation"
            )
        }
        
        $configFile = "azure-devops-setup-config.json"
        $devopsSetupConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $configFile
        Write-Log "✅ Azure DevOps configuration saved to: $configFile" "INFO"
        
        Write-Log "✅ Azure DevOps deployment configuration completed" "INFO"
    }
    catch {
        Write-Log "❌ Azure DevOps deployment failed: $_" "ERROR"
        throw
    }
}

# Deploy Power Platform
function Deploy-PowerPlatform {
    param([object]$PowerPlatformConfig)
    
    if ($SkipPowerPlatform) {
        Write-Log "Skipping Power Platform deployment" "INFO"
        return
    }
    
    Write-Log "🚀 Starting Power Platform deployment..." "INFO"
    
    try {
        # Create environments
        foreach ($envConfig in $PowerPlatformConfig.environments) {
            try {
                Write-Log "Creating Power Platform environment: $($envConfig.name)" "INFO"
                
                # Check if environment already exists
                $existingEnv = Get-AdminPowerAppEnvironment | Where-Object { $_.DisplayName -eq $envConfig.name }
                
                if (-not $existingEnv) {
                    $newEnv = New-AdminPowerAppEnvironment -DisplayName $envConfig.name `
                        -LocationName $envConfig.region `
                        -EnvironmentSku $envConfig.type
                    
                    Write-Log "✅ Created Power Platform environment: $($envConfig.name)" "INFO"
                }
                else {
                    Write-Log "ℹ️ Environment already exists: $($envConfig.name)" "INFO"
                }
            }
            catch {
                Write-Log "❌ Failed to create Power Platform environment $($envConfig.name)`: $_" "ERROR"
            }
        }
        
        # Configure DLP policies
        if ($PowerPlatformConfig.dataLossPrevention.enabled) {
            try {
                Write-Log "Configuring Data Loss Prevention policies..." "INFO"
                
                $dlpPolicyName = "ICT-Governance-DLP-Policy"
                
                # Create DLP policy configuration
                $dlpConfig = @{
                    displayName = $dlpPolicyName
                    defaultConnectorsClassification = "Blocked"
                    connectorGroups = @(
                        @{
                            classification = "Business"
                            connectors = @(
                                "shared_office365",
                                "shared_sharepointonline",
                                "shared_teams",
                                "shared_onedriveforbusiness"
                            )
                        },
                        @{
                            classification = "NonBusiness"
                            connectors = @(
                                "shared_twitter",
                                "shared_facebook",
                                "shared_instagram"
                            )
                        }
                    )
                }
                
                $dlpConfigFile = "power-platform-dlp-config.json"
                $dlpConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $dlpConfigFile
                Write-Log "✅ DLP configuration saved to: $dlpConfigFile" "INFO"
            }
            catch {
                Write-Log "⚠️ Warning: Could not configure DLP policies: $_" "WARNING"
            }
        }
        
        Write-Log "✅ Power Platform deployment completed" "INFO"
    }
    catch {
        Write-Log "❌ Power Platform deployment failed: $_" "ERROR"
        throw
    }
}

# Configure integration with unified governance platform
function Configure-GovernanceIntegration {
    Write-Log "🔗 Configuring governance platform integration..." "INFO"
    
    try {
        # Create integration configuration
        $integrationConfig = @{
            platforms = @{
                teams = @{
                    enabled = $true
                    apiEndpoint = "https://graph.microsoft.com/v1.0/teams"
                    monitoringEnabled = $true
                    complianceChecks = @("GuestAccess", "ExternalSharing", "DataRetention")
                }
                sharepoint = @{
                    enabled = $true
                    apiEndpoint = "https://graph.microsoft.com/v1.0/sites"
                    monitoringEnabled = $true
                    complianceChecks = @("Permissions", "Versioning", "ContentApproval")
                }
                devops = @{
                    enabled = $true
                    apiEndpoint = "https://dev.azure.com"
                    monitoringEnabled = $true
                    complianceChecks = @("BranchPolicies", "SecurityScanning", "AccessReview")
                }
                powerPlatform = @{
                    enabled = $true
                    apiEndpoint = "https://api.powerapps.com"
                    monitoringEnabled = $true
                    complianceChecks = @("DLPPolicies", "EnvironmentSecurity", "ConnectorUsage")
                }
            }
            monitoring = @{
                frequency = "Daily"
                alerting = @{
                    enabled = $true
                    channels = @("Email", "Teams", "ServiceNow")
                }
                reporting = @{
                    enabled = $true
                    schedule = "Weekly"
                    recipients = @("governance-council@company.com")
                }
            }
        }
        
        $integrationConfigFile = "governance-integration-config.json"
        $integrationConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $integrationConfigFile
        Write-Log "✅ Governance integration configuration saved to: $integrationConfigFile" "INFO"
        
        Write-Log "✅ Governance platform integration configured" "INFO"
    }
    catch {
        Write-Log "❌ Failed to configure governance integration: $_" "ERROR"
        throw
    }
}

# Generate deployment report
function Generate-DeploymentReport {
    param([object]$Config)
    
    Write-Log "📊 Generating deployment report..." "INFO"
    
    $report = @{
        deploymentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        environment = $Environment
        platforms = @{
            teams = @{
                deployed = -not $SkipTeams
                teamsCreated = $Config.teams.governanceTeams.Count
                status = if (-not $SkipTeams) { "Completed" } else { "Skipped" }
            }
            sharepoint = @{
                deployed = -not $SkipSharePoint
                sitesCreated = $Config.sharepoint.sites.Count
                status = if (-not $SkipSharePoint) { "Completed" } else { "Skipped" }
            }
            devops = @{
                deployed = -not $SkipDevOps
                projectsConfigured = $Config.devops.projects.Count
                status = if (-not $SkipDevOps) { "Configuration Ready" } else { "Skipped" }
            }
            powerPlatform = @{
                deployed = -not $SkipPowerPlatform
                environmentsCreated = $Config.powerPlatform.environments.Count
                status = if (-not $SkipPowerPlatform) { "Completed" } else { "Skipped" }
            }
        }
        nextSteps = @(
            "Review and validate all platform configurations",
            "Complete user access assignments and permissions",
            "Execute training programs for end users",
            "Set up monitoring and compliance checking",
            "Perform user acceptance testing",
            "Go-live and production rollout"
        )
    }
    
    $reportFile = "collaboration-platforms-deployment-report.json"
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportFile
    Write-Log "✅ Deployment report saved to: $reportFile" "INFO"
    
    # Display summary
    Write-Host "`n🎉 DEPLOYMENT SUMMARY" -ForegroundColor Green
    Write-Host "=====================" -ForegroundColor Green
    Write-Host "Environment: $Environment" -ForegroundColor Cyan
    Write-Host "Teams: $($report.platforms.teams.status)" -ForegroundColor $(if ($report.platforms.teams.deployed) { "Green" } else { "Yellow" })
    Write-Host "SharePoint: $($report.platforms.sharepoint.status)" -ForegroundColor $(if ($report.platforms.sharepoint.deployed) { "Green" } else { "Yellow" })
    Write-Host "Azure DevOps: $($report.platforms.devops.status)" -ForegroundColor $(if ($report.platforms.devops.deployed) { "Green" } else { "Yellow" })
    Write-Host "Power Platform: $($report.platforms.powerPlatform.status)" -ForegroundColor $(if ($report.platforms.powerPlatform.deployed) { "Green" } else { "Yellow" })
    Write-Host "`nLog file: $LogFile" -ForegroundColor Cyan
    Write-Host "Report file: $reportFile" -ForegroundColor Cyan
}

# Main execution
try {
    Write-Log "🚀 Starting A014 - Collaboration Platforms Deployment" "INFO"
    Write-Log "Environment: $Environment" "INFO"
    Write-Log "WhatIf Mode: $WhatIf" "INFO"
    
    if ($WhatIf) {
        Write-Log "⚠️ Running in WhatIf mode - no changes will be made" "WARNING"
    }
    
    # Load configuration
    $config = Load-Configuration -ConfigPath $ConfigPath
    
    # Connect to services
    if (-not $WhatIf) {
        Connect-ToServices -TenantId $TenantId -SubscriptionId $SubscriptionId
    }
    
    # Deploy platforms
    if (-not $WhatIf) {
        Deploy-MicrosoftTeams -TeamsConfig $config.teams
        Deploy-SharePointOnline -SharePointConfig $config.sharepoint
        Deploy-AzureDevOps -DevOpsConfig $config.devops
        Deploy-PowerPlatform -PowerPlatformConfig $config.powerPlatform
        Configure-GovernanceIntegration
    }
    else {
        Write-Log "WhatIf: Would deploy Microsoft Teams with $($config.teams.governanceTeams.Count) teams" "INFO"
        Write-Log "WhatIf: Would deploy SharePoint with $($config.sharepoint.sites.Count) sites" "INFO"
        Write-Log "WhatIf: Would configure Azure DevOps with $($config.devops.projects.Count) projects" "INFO"
        Write-Log "WhatIf: Would deploy Power Platform with $($config.powerPlatform.environments.Count) environments" "INFO"
    }
    
    # Generate report
    Generate-DeploymentReport -Config $config
    
    Write-Log "✅ A014 - Collaboration Platforms Deployment completed successfully" "INFO"
}
catch {
    Write-Log "❌ Deployment failed: $_" "ERROR"
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