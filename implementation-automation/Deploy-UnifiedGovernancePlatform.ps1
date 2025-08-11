# Deploy Unified Governance Platform
# This script deploys the unified governance platform infrastructure and integrates all governance tools

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $true)]
    [string]$Location,
    
    [Parameter(Mandatory = $false)]
    [string]$Environment = "prod",
    
    [Parameter(Mandatory = $false)]
    [string]$ConfigPath = "./config/framework-config.json",
    
    [Parameter(Mandatory = $false)]
    [switch]$WhatIf
)

# Import required modules
Import-Module Az.Accounts -Force
Import-Module Az.Resources -Force
Import-Module Az.ApiManagement -Force
Import-Module Az.EventHub -Force
Import-Module Az.ServiceBus -Force
Import-Module Az.Sql -Force
Import-Module Az.KeyVault -Force
Import-Module Az.Monitor -Force

# Initialize logging
$LogFile = "Deploy-UnifiedGovernancePlatform-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

try {
    Write-Log "Starting Unified Governance Platform deployment" "INFO"
    
    # Load configuration
    if (-not (Test-Path $ConfigPath)) {
        throw "Configuration file not found: $ConfigPath"
    }
    
    $Config = Get-Content $ConfigPath | ConvertFrom-Json
    Write-Log "Configuration loaded from $ConfigPath" "INFO"
    
    # Connect to Azure
    Write-Log "Connecting to Azure subscription: $SubscriptionId" "INFO"
    $Context = Set-AzContext -SubscriptionId $SubscriptionId
    if (-not $Context) {
        throw "Failed to connect to Azure subscription"
    }
    
    # Create or verify resource group
    Write-Log "Creating/verifying resource group: $ResourceGroupName" "INFO"
    $ResourceGroup = Get-AzResourceGroup -Name $ResourceGroupName -ErrorAction SilentlyContinue
    if (-not $ResourceGroup) {
        if ($WhatIf) {
            Write-Log "WHATIF: Would create resource group $ResourceGroupName in $Location" "INFO"
        } else {
            $ResourceGroup = New-AzResourceGroup -Name $ResourceGroupName -Location $Location
            Write-Log "Created resource group: $ResourceGroupName" "INFO"
        }
    } else {
        Write-Log "Resource group already exists: $ResourceGroupName" "INFO"
    }
    
    # Deploy unified platform infrastructure
    Write-Log "Deploying unified platform infrastructure" "INFO"
    
    # 1. Deploy API Management (API Gateway)
    Write-Log "Deploying API Management service" "INFO"
    $ApiManagementName = "apim-governance-$Environment"
    
    if ($WhatIf) {
        Write-Log "WHATIF: Would deploy API Management: $ApiManagementName" "INFO"
    } else {
        $ApiManagementParams = @{
            ResourceGroupName = $ResourceGroupName
            Name = $ApiManagementName
            Location = $Location
            Organization = $Config.organization.name
            AdminEmail = "governance@company.com"
            Sku = "Premium"
            Capacity = 2
        }
        
        $ApiManagement = Get-AzApiManagement -ResourceGroupName $ResourceGroupName -Name $ApiManagementName -ErrorAction SilentlyContinue
        if (-not $ApiManagement) {
            $ApiManagement = New-AzApiManagement @ApiManagementParams
            Write-Log "Created API Management: $ApiManagementName" "INFO"
        } else {
            Write-Log "API Management already exists: $ApiManagementName" "INFO"
        }
    }
    
    # 2. Deploy Event Hub Namespace (Real-time data streaming)
    Write-Log "Deploying Event Hub namespace" "INFO"
    $EventHubNamespaceName = "evhns-governance-$Environment"
    
    if ($WhatIf) {
        Write-Log "WHATIF: Would deploy Event Hub namespace: $EventHubNamespaceName" "INFO"
    } else {
        $EventHubParams = @{
            ResourceGroupName = $ResourceGroupName
            Name = $EventHubNamespaceName
            Location = $Location
            SkuName = "Standard"
            SkuCapacity = 2
            EnableAutoInflate = $true
            MaximumThroughputUnits = 10
        }
        
        $EventHubNamespace = Get-AzEventHubNamespace -ResourceGroupName $ResourceGroupName -Name $EventHubNamespaceName -ErrorAction SilentlyContinue
        if (-not $EventHubNamespace) {
            $EventHubNamespace = New-AzEventHubNamespace @EventHubParams
            Write-Log "Created Event Hub namespace: $EventHubNamespaceName" "INFO"
        } else {
            Write-Log "Event Hub namespace already exists: $EventHubNamespaceName" "INFO"
        }
    }
    
    # 3. Deploy Service Bus Namespace (Workflow orchestration)
    Write-Log "Deploying Service Bus namespace" "INFO"
    $ServiceBusNamespaceName = "sb-governance-$Environment"
    
    if ($WhatIf) {
        Write-Log "WHATIF: Would deploy Service Bus namespace: $ServiceBusNamespaceName" "INFO"
    } else {
        $ServiceBusParams = @{
            ResourceGroupName = $ResourceGroupName
            Name = $ServiceBusNamespaceName
            Location = $Location
            SkuName = "Premium"
            SkuCapacity = 1
        }
        
        $ServiceBusNamespace = Get-AzServiceBusNamespace -ResourceGroupName $ResourceGroupName -Name $ServiceBusNamespaceName -ErrorAction SilentlyContinue
        if (-not $ServiceBusNamespace) {
            $ServiceBusNamespace = New-AzServiceBusNamespace @ServiceBusParams
            Write-Log "Created Service Bus namespace: $ServiceBusNamespaceName" "INFO"
        } else {
            Write-Log "Service Bus namespace already exists: $ServiceBusNamespaceName" "INFO"
        }
    }
    
    # 4. Deploy SQL Database (Unified data layer)
    Write-Log "Deploying SQL Database" "INFO"
    $SqlServerName = "sql-governance-$Environment"
    $DatabaseName = "governance-unified"
    
    if ($WhatIf) {
        Write-Log "WHATIF: Would deploy SQL Server: $SqlServerName and Database: $DatabaseName" "INFO"
    } else {
        # Generate random password for SQL admin
        $SqlAdminPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
        $SecurePassword = ConvertTo-SecureString $SqlAdminPassword -AsPlainText -Force
        
        $SqlServerParams = @{
            ResourceGroupName = $ResourceGroupName
            ServerName = $SqlServerName
            Location = $Location
            SqlAdministratorCredentials = New-Object System.Management.Automation.PSCredential("governanceadmin", $SecurePassword)
        }
        
        $SqlServer = Get-AzSqlServer -ResourceGroupName $ResourceGroupName -ServerName $SqlServerName -ErrorAction SilentlyContinue
        if (-not $SqlServer) {
            $SqlServer = New-AzSqlServer @SqlServerParams
            Write-Log "Created SQL Server: $SqlServerName" "INFO"
        } else {
            Write-Log "SQL Server already exists: $SqlServerName" "INFO"
        }
        
        # Create database
        $DatabaseParams = @{
            ResourceGroupName = $ResourceGroupName
            ServerName = $SqlServerName
            DatabaseName = $DatabaseName
            Edition = "Premium"
            RequestedServiceObjectiveName = "P2"
        }
        
        $Database = Get-AzSqlDatabase -ResourceGroupName $ResourceGroupName -ServerName $SqlServerName -DatabaseName $DatabaseName -ErrorAction SilentlyContinue
        if (-not $Database) {
            $Database = New-AzSqlDatabase @DatabaseParams
            Write-Log "Created SQL Database: $DatabaseName" "INFO"
        } else {
            Write-Log "SQL Database already exists: $DatabaseName" "INFO"
        }
    }
    
    # 5. Deploy Key Vault (Secrets management)
    Write-Log "Deploying Key Vault" "INFO"
    $KeyVaultName = "kv-governance-$Environment"
    
    if ($WhatIf) {
        Write-Log "WHATIF: Would deploy Key Vault: $KeyVaultName" "INFO"
    } else {
        $KeyVaultParams = @{
            VaultName = $KeyVaultName
            ResourceGroupName = $ResourceGroupName
            Location = $Location
            Sku = "Premium"
            EnableRbacAuthorization = $true
        }
        
        $KeyVault = Get-AzKeyVault -VaultName $KeyVaultName -ResourceGroupName $ResourceGroupName -ErrorAction SilentlyContinue
        if (-not $KeyVault) {
            $KeyVault = New-AzKeyVault @KeyVaultParams
            Write-Log "Created Key Vault: $KeyVaultName" "INFO"
            
            # Store SQL admin password in Key Vault
            $SecretValue = ConvertTo-SecureString $SqlAdminPassword -AsPlainText -Force
            Set-AzKeyVaultSecret -VaultName $KeyVaultName -Name "SqlAdminPassword" -SecretValue $SecretValue
            Write-Log "Stored SQL admin password in Key Vault" "INFO"
        } else {
            Write-Log "Key Vault already exists: $KeyVaultName" "INFO"
        }
    }
    
    # 6. Deploy Application Insights (Monitoring)
    Write-Log "Deploying Application Insights" "INFO"
    $AppInsightsName = "ai-governance-$Environment"
    
    if ($WhatIf) {
        Write-Log "WHATIF: Would deploy Application Insights: $AppInsightsName" "INFO"
    } else {
        $AppInsightsParams = @{
            ResourceGroupName = $ResourceGroupName
            Name = $AppInsightsName
            Location = $Location
            Kind = "web"
            ApplicationType = "web"
        }
        
        $AppInsights = Get-AzApplicationInsights -ResourceGroupName $ResourceGroupName -Name $AppInsightsName -ErrorAction SilentlyContinue
        if (-not $AppInsights) {
            $AppInsights = New-AzApplicationInsights @AppInsightsParams
            Write-Log "Created Application Insights: $AppInsightsName" "INFO"
        } else {
            Write-Log "Application Insights already exists: $AppInsightsName" "INFO"
        }
    }
    
    # 7. Deploy Log Analytics Workspace
    Write-Log "Deploying Log Analytics Workspace" "INFO"
    $LogAnalyticsName = "law-governance-$Environment"
    
    if ($WhatIf) {
        Write-Log "WHATIF: Would deploy Log Analytics Workspace: $LogAnalyticsName" "INFO"
    } else {
        $LogAnalyticsParams = @{
            ResourceGroupName = $ResourceGroupName
            Name = $LogAnalyticsName
            Location = $Location
            Sku = "PerGB2018"
            RetentionInDays = 90
        }
        
        $LogAnalytics = Get-AzOperationalInsightsWorkspace -ResourceGroupName $ResourceGroupName -Name $LogAnalyticsName -ErrorAction SilentlyContinue
        if (-not $LogAnalytics) {
            $LogAnalytics = New-AzOperationalInsightsWorkspace @LogAnalyticsParams
            Write-Log "Created Log Analytics Workspace: $LogAnalyticsName" "INFO"
        } else {
            Write-Log "Log Analytics Workspace already exists: $LogAnalyticsName" "INFO"
        }
    }
    
    # Configure API Management APIs
    Write-Log "Configuring API Management APIs" "INFO"
    
    if (-not $WhatIf) {
        $ApiManagementContext = New-AzApiManagementContext -ResourceGroupName $ResourceGroupName -ServiceName $ApiManagementName
        
        # Core Governance API
        $CoreApiParams = @{
            Context = $ApiManagementContext
            ApiId = "core-governance-api"
            Name = "Core Governance API"
            Description = "Core governance operations and overview"
            ServiceUrl = "https://core-governance-api.company.com"
            Path = "core"
            Protocols = @("https")
        }
        
        $CoreApi = Get-AzApiManagementApi -Context $ApiManagementContext -ApiId "core-governance-api" -ErrorAction SilentlyContinue
        if (-not $CoreApi) {
            $CoreApi = New-AzApiManagementApi @CoreApiParams
            Write-Log "Created Core Governance API in API Management" "INFO"
        }
        
        # Policy Management API
        $PolicyApiParams = @{
            Context = $ApiManagementContext
            ApiId = "policy-management-api"
            Name = "Policy Management API"
            Description = "Policy management and compliance operations"
            ServiceUrl = "https://policy-management-api.company.com"
            Path = "policies"
            Protocols = @("https")
        }
        
        $PolicyApi = Get-AzApiManagementApi -Context $ApiManagementContext -ApiId "policy-management-api" -ErrorAction SilentlyContinue
        if (-not $PolicyApi) {
            $PolicyApi = New-AzApiManagementApi @PolicyApiParams
            Write-Log "Created Policy Management API in API Management" "INFO"
        }
        
        # Configure additional APIs for each domain
        $DomainApis = @(
            @{ Id = "ict-governance-api"; Name = "ICT Governance API"; Path = "ict-governance"; Url = "https://ict-governance-api.company.com" },
            @{ Id = "azure-governance-api"; Name = "Azure Governance API"; Path = "azure"; Url = "https://azure-governance-api.company.com" },
            @{ Id = "multi-cloud-api"; Name = "Multi-Cloud Governance API"; Path = "multi-cloud"; Url = "https://multi-cloud-api.company.com" },
            @{ Id = "application-api"; Name = "Application Governance API"; Path = "applications"; Url = "https://application-api.company.com" },
            @{ Id = "security-api"; Name = "Security Governance API"; Path = "security"; Url = "https://security-api.company.com" }
        )
        
        foreach ($DomainApi in $DomainApis) {
            $ApiParams = @{
                Context = $ApiManagementContext
                ApiId = $DomainApi.Id
                Name = $DomainApi.Name
                Description = "$($DomainApi.Name) operations"
                ServiceUrl = $DomainApi.Url
                Path = $DomainApi.Path
                Protocols = @("https")
            }
            
            $Api = Get-AzApiManagementApi -Context $ApiManagementContext -ApiId $DomainApi.Id -ErrorAction SilentlyContinue
            if (-not $Api) {
                $Api = New-AzApiManagementApi @ApiParams
                Write-Log "Created $($DomainApi.Name) in API Management" "INFO"
            }
        }
    }
    
    # Create Event Hub topics
    Write-Log "Creating Event Hub topics" "INFO"
    
    if (-not $WhatIf) {
        $EventHubTopics = @("governance-events", "compliance-events", "workflow-events", "integration-events")
        
        foreach ($Topic in $EventHubTopics) {
            $EventHubParams = @{
                ResourceGroupName = $ResourceGroupName
                NamespaceName = $EventHubNamespaceName
                Name = $Topic
                MessageRetentionInDays = 7
                PartitionCount = 4
            }
            
            $EventHub = Get-AzEventHub -ResourceGroupName $ResourceGroupName -NamespaceName $EventHubNamespaceName -Name $Topic -ErrorAction SilentlyContinue
            if (-not $EventHub) {
                $EventHub = New-AzEventHub @EventHubParams
                Write-Log "Created Event Hub topic: $Topic" "INFO"
            } else {
                Write-Log "Event Hub topic already exists: $Topic" "INFO"
            }
        }
    }
    
    # Create Service Bus queues
    Write-Log "Creating Service Bus queues" "INFO"
    
    if (-not $WhatIf) {
        $ServiceBusQueues = @("approval-requests", "compliance-checks", "notifications", "workflow-tasks")
        
        foreach ($Queue in $ServiceBusQueues) {
            $QueueParams = @{
                ResourceGroupName = $ResourceGroupName
                NamespaceName = $ServiceBusNamespaceName
                Name = $Queue
                EnablePartitioning = $true
                MaxSizeInMegabytes = 5120
            }
            
            $ServiceBusQueue = Get-AzServiceBusQueue -ResourceGroupName $ResourceGroupName -NamespaceName $ServiceBusNamespaceName -Name $Queue -ErrorAction SilentlyContinue
            if (-not $ServiceBusQueue) {
                $ServiceBusQueue = New-AzServiceBusQueue @QueueParams
                Write-Log "Created Service Bus queue: $Queue" "INFO"
            } else {
                Write-Log "Service Bus queue already exists: $Queue" "INFO"
            }
        }
    }
    
    # Configure monitoring and alerting
    Write-Log "Configuring monitoring and alerting" "INFO"
    
    if (-not $WhatIf) {
        # Create action group for alerts
        $ActionGroupName = "ag-governance-$Environment"
        $ActionGroupParams = @{
            ResourceGroupName = $ResourceGroupName
            Name = $ActionGroupName
            ShortName = "GovAlert"
            EmailReceiver = @{
                Name = "GovernanceTeam"
                EmailAddress = "governance-team@company.com"
            }
        }
        
        $ActionGroup = Get-AzActionGroup -ResourceGroupName $ResourceGroupName -Name $ActionGroupName -ErrorAction SilentlyContinue
        if (-not $ActionGroup) {
            $ActionGroup = New-AzActionGroup @ActionGroupParams
            Write-Log "Created action group: $ActionGroupName" "INFO"
        }
        
        # Create metric alerts
        $AlertRules = @(
            @{
                Name = "API-Gateway-High-Response-Time"
                Description = "Alert when API Gateway response time is high"
                TargetResourceId = $ApiManagement.Id
                MetricName = "Duration"
                Operator = "GreaterThan"
                Threshold = 1000
                TimeAggregation = "Average"
            },
            @{
                Name = "Database-High-CPU"
                Description = "Alert when database CPU is high"
                TargetResourceId = $Database.ResourceId
                MetricName = "cpu_percent"
                Operator = "GreaterThan"
                Threshold = 80
                TimeAggregation = "Average"
            }
        )
        
        foreach ($Alert in $AlertRules) {
            $AlertParams = @{
                ResourceGroupName = $ResourceGroupName
                Name = $Alert.Name
                Description = $Alert.Description
                TargetResourceId = $Alert.TargetResourceId
                MetricName = $Alert.MetricName
                Operator = $Alert.Operator
                Threshold = $Alert.Threshold
                TimeAggregation = $Alert.TimeAggregation
                WindowSize = "00:05:00"
                EvaluationFrequency = "00:01:00"
                ActionGroupId = $ActionGroup.Id
                Severity = 2
            }
            
            $ExistingAlert = Get-AzMetricAlertRuleV2 -ResourceGroupName $ResourceGroupName -Name $Alert.Name -ErrorAction SilentlyContinue
            if (-not $ExistingAlert) {
                $MetricAlert = Add-AzMetricAlertRuleV2 @AlertParams
                Write-Log "Created metric alert: $($Alert.Name)" "INFO"
            } else {
                Write-Log "Metric alert already exists: $($Alert.Name)" "INFO"
            }
        }
    }
    
    # Generate deployment summary
    Write-Log "Generating deployment summary" "INFO"
    
    $DeploymentSummary = @{
        SubscriptionId = $SubscriptionId
        ResourceGroupName = $ResourceGroupName
        Location = $Location
        Environment = $Environment
        DeploymentTime = Get-Date
        Components = @{
            ApiManagement = $ApiManagementName
            EventHubNamespace = $EventHubNamespaceName
            ServiceBusNamespace = $ServiceBusNamespaceName
            SqlServer = $SqlServerName
            Database = $DatabaseName
            KeyVault = $KeyVaultName
            ApplicationInsights = $AppInsightsName
            LogAnalytics = $LogAnalyticsName
        }
        Endpoints = @{
            ApiGateway = "https://$ApiManagementName.azure-api.net"
            DeveloperPortal = "https://$ApiManagementName.developer.azure-api.net"
        }
        NextSteps = @(
            "Configure API authentication and authorization",
            "Deploy application services behind the API gateway",
            "Set up data synchronization between systems",
            "Configure workflow automation",
            "Test end-to-end integration"
        )
    }
    
    $SummaryJson = $DeploymentSummary | ConvertTo-Json -Depth 4
    $SummaryFile = "UnifiedGovernancePlatform-Deployment-Summary-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $SummaryJson | Out-File -FilePath $SummaryFile -Encoding UTF8
    
    Write-Log "Deployment summary saved to: $SummaryFile" "INFO"
    Write-Log "Unified Governance Platform deployment completed successfully" "SUCCESS"
    
    # Display summary
    Write-Host "`n=== DEPLOYMENT SUMMARY ===" -ForegroundColor Green
    Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
    Write-Host "Location: $Location" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow
    Write-Host "`nDeployed Components:" -ForegroundColor Green
    foreach ($Component in $DeploymentSummary.Components.GetEnumerator()) {
        Write-Host "  $($Component.Key): $($Component.Value)" -ForegroundColor White
    }
    Write-Host "`nAPI Endpoints:" -ForegroundColor Green
    foreach ($Endpoint in $DeploymentSummary.Endpoints.GetEnumerator()) {
        Write-Host "  $($Component.Key): $($Component.Value)" -ForegroundColor White
    }
    Write-Host "`nNext Steps:" -ForegroundColor Green
    foreach ($Step in $DeploymentSummary.NextSteps) {
        Write-Host "  - $Step" -ForegroundColor White
    }
    Write-Host "`n=== END SUMMARY ===" -ForegroundColor Green
    
} catch {
    Write-Log "Deployment failed: $($_.Exception.Message)" "ERROR"
    Write-Log "Stack trace: $($_.ScriptStackTrace)" "ERROR"
    throw
} finally {
    Write-Log "Deployment script completed" "INFO"
}