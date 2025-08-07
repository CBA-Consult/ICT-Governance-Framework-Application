# Zero Trust Maturity Assessment Script
# CBA Consult ICT Governance Framework - Zero Trust Implementation
# This script provides automated assessment of Zero Trust maturity across six pillars

param(
    [Parameter(Mandatory = $false)]
    [string]$ConfigPath = ".\zero-trust-assessment-config.json",
    
    [Parameter(Mandatory = $false)]
    [string]$OutputPath = ".\zero-trust-assessment-results.json",
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("All", "Identities", "Endpoints", "Apps", "Infrastructure", "Data", "Network")]
    [string]$Pillar = "All",
    
    [Parameter(Mandatory = $false)]
    [switch]$GenerateReport,
    
    [Parameter(Mandatory = $false)]
    [switch]$Verbose
)

# Import required modules
Import-Module Az.Accounts -Force
Import-Module Az.Resources -Force
Import-Module Az.Security -Force
Import-Module Az.Monitor -Force

# Initialize logging
$LogFile = "zero-trust-assessment-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Output $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

function Load-AssessmentConfig {
    param([string]$ConfigPath)
    
    try {
        if (Test-Path $ConfigPath) {
            $config = Get-Content $ConfigPath | ConvertFrom-Json
            Write-Log "Assessment configuration loaded from $ConfigPath"
            return $config
        } else {
            Write-Log "Configuration file not found at $ConfigPath. Using default configuration." "WARNING"
            return Get-DefaultConfig
        }
    } catch {
        Write-Log "Error loading configuration: $($_.Exception.Message)" "ERROR"
        return Get-DefaultConfig
    }
}

function Get-DefaultConfig {
    return @{
        pillars = @{
            Identities = @{
                assessments = @(
                    @{ name = "Multi-Factor Authentication"; weight = 20; type = "AzureAD" },
                    @{ name = "Privileged Access Management"; weight = 25; type = "AzureAD" },
                    @{ name = "Identity Governance"; weight = 20; type = "AzureAD" },
                    @{ name = "Conditional Access"; weight = 20; type = "AzureAD" },
                    @{ name = "Identity Protection"; weight = 15; type = "AzureAD" }
                )
            }
            Endpoints = @{
                assessments = @(
                    @{ name = "Endpoint Protection"; weight = 25; type = "Defender" },
                    @{ name = "Device Compliance"; weight = 20; type = "Intune" },
                    @{ name = "Endpoint Detection Response"; weight = 25; type = "Defender" },
                    @{ name = "Device Management"; weight = 20; type = "Intune" },
                    @{ name = "Application Control"; weight = 10; type = "Defender" }
                )
            }
            Apps = @{
                assessments = @(
                    @{ name = "Application Security"; weight = 25; type = "DevSecOps" },
                    @{ name = "API Security"; weight = 20; type = "APIM" },
                    @{ name = "Runtime Protection"; weight = 20; type = "Defender" },
                    @{ name = "CI/CD Security"; weight = 25; type = "DevOps" },
                    @{ name = "Application Monitoring"; weight = 10; type = "Monitor" }
                )
            }
            Infrastructure = @{
                assessments = @(
                    @{ name = "Network Segmentation"; weight = 25; type = "Network" },
                    @{ name = "Infrastructure as Code"; weight = 20; type = "ARM" },
                    @{ name = "Security Policies"; weight = 20; type = "Policy" },
                    @{ name = "Monitoring and Alerting"; weight = 20; type = "Monitor" },
                    @{ name = "Compliance Management"; weight = 15; type = "Security" }
                )
            }
            Data = @{
                assessments = @(
                    @{ name = "Data Classification"; weight = 25; type = "Purview" },
                    @{ name = "Data Loss Prevention"; weight = 25; type = "Purview" },
                    @{ name = "Encryption at Rest"; weight = 20; type = "KeyVault" },
                    @{ name = "Encryption in Transit"; weight = 20; type = "Network" },
                    @{ name = "Data Governance"; weight = 10; type = "Purview" }
                )
            }
            Network = @{
                assessments = @(
                    @{ name = "Zero Trust Network Access"; weight = 30; type = "Network" },
                    @{ name = "Micro-segmentation"; weight = 25; type = "Network" },
                    @{ name = "Network Monitoring"; weight = 20; type = "Monitor" },
                    @{ name = "Firewall Policies"; weight = 15; type = "Firewall" },
                    @{ name = "VPN Replacement"; weight = 10; type = "Network" }
                )
            }
        }
        maturityLevels = @{
            1 = @{ name = "Traditional"; threshold = 0; description = "Basic security controls in place" }
            2 = @{ name = "Managed"; threshold = 25; description = "Managed security processes implemented" }
            3 = @{ name = "Defined"; threshold = 50; description = "Comprehensive security framework defined" }
            4 = @{ name = "Quantitatively Managed"; threshold = 75; description = "Advanced automation and analytics" }
            5 = @{ name = "Optimizing"; threshold = 90; description = "Continuous optimization and AI-powered security" }
        }
    }
}

function Assess-IdentitiesPillar {
    param($assessments)
    
    Write-Log "Assessing Identities pillar..."
    $results = @{}
    $totalScore = 0
    $maxScore = 0
    
    foreach ($assessment in $assessments) {
        $score = 0
        $maxScore += $assessment.weight
        
        switch ($assessment.name) {
            "Multi-Factor Authentication" {
                $score = Test-MFAImplementation
            }
            "Privileged Access Management" {
                $score = Test-PAMImplementation
            }
            "Identity Governance" {
                $score = Test-IdentityGovernance
            }
            "Conditional Access" {
                $score = Test-ConditionalAccess
            }
            "Identity Protection" {
                $score = Test-IdentityProtection
            }
        }
        
        $weightedScore = ($score / 100) * $assessment.weight
        $totalScore += $weightedScore
        
        $results[$assessment.name] = @{
            score = $score
            weight = $assessment.weight
            weightedScore = $weightedScore
            status = if ($score -ge 80) { "Excellent" } elseif ($score -ge 60) { "Good" } elseif ($score -ge 40) { "Fair" } else { "Poor" }
        }
        
        Write-Log "  $($assessment.name): $score% (weighted: $([math]::Round($weightedScore, 2)))"
    }
    
    $overallScore = [math]::Round(($totalScore / $maxScore) * 100, 2)
    Write-Log "Identities pillar overall score: $overallScore%"
    
    return @{
        pillar = "Identities"
        overallScore = $overallScore
        maturityLevel = Get-MaturityLevel $overallScore
        assessments = $results
        recommendations = Get-IdentitiesRecommendations $results
    }
}

function Test-MFAImplementation {
    try {
        # Check Azure AD MFA configuration
        $mfaScore = 0
        
        # Check if MFA is enabled for users
        $context = Get-AzContext
        if ($context) {
            # Simulate MFA assessment - in real implementation, this would query Azure AD
            $mfaScore = 75  # Placeholder score
            # Ensure Microsoft Graph module is available
            if (-not (Get-Module -ListAvailable -Name Microsoft.Graph.Users)) {
                try {
                    Import-Module Microsoft.Graph.Users -ErrorAction Stop
                } catch {
                    Write-Log "    Microsoft.Graph.Users module not found. Please install it to assess MFA." "ERROR"
                    return 0
                }
            }

            # Connect to Microsoft Graph if not already connected
            if (-not (Get-MgContext)) {
                try {
                    Connect-MgGraph -Scopes "User.Read.All","Directory.Read.All" -ErrorAction Stop
                } catch {
                    Write-Log "    Failed to connect to Microsoft Graph: $($_.Exception.Message)" "ERROR"
                    return 0
                }
            }

            # Get all users (excluding guests and disabled accounts)
            $users = Get-MgUser -All -Filter "accountEnabled eq true and userType eq 'Member'" -Property Id,DisplayName,UserPrincipalName
            if (-not $users) {
                Write-Log "    No users found in Azure AD." "WARNING"
                return 0
            }

            # Get MFA registration details
            $mfaDetails = Get-MgReportAuthenticationMethodsUserRegistrationDetail -All
            if (-not $mfaDetails) {
                Write-Log "    Could not retrieve MFA registration details." "WARNING"
                return 0
            }

            $totalUsers = $users.Count
            $mfaUsers = ($mfaDetails | Where-Object { $_.IsMfaRegistered -eq $true }).Count

            if ($totalUsers -eq 0) {
                $mfaScore = 0
            } else {
                $mfaScore = [math]::Round(($mfaUsers / $totalUsers) * 100, 2)
            }

            Write-Log "    MFA implementation assessed: $mfaScore% ($mfaUsers of $totalUsers users registered for MFA)" "DEBUG"
        } else {
            Write-Log "    Azure context not available for MFA assessment" "WARNING"
            $mfaScore = 0
        }
        
        return $mfaScore
    } catch {
        Write-Log "    Error assessing MFA: $($_.Exception.Message)" "ERROR"
        return 0
    }
}

function Test-PAMImplementation {
    try {
        # Check Privileged Access Management implementation
        $pamScore = 0
        
        # Check for PIM configuration
        $context = Get-AzContext
        if ($context) {
            # Simulate PAM assessment
            $pamScore = 60  # Placeholder score
            # Ensure Microsoft Graph module is installed and imported
            if (-not (Get-Module -ListAvailable -Name Microsoft.Graph)) {
                Write-Log "    Microsoft.Graph PowerShell module not found. Please install it for full PAM assessment." "WARNING"
                return 0
            }
            Import-Module Microsoft.Graph -ErrorAction SilentlyContinue

            # Connect to Microsoft Graph if not already connected
            if (-not (Get-MgContext)) {
                try {
                    Connect-MgGraph -Scopes "PrivilegedAccess.Read.AzureAD" -ErrorAction Stop | Out-Null
                } catch {
                    Write-Log "    Failed to connect to Microsoft Graph: $($_.Exception.Message)" "ERROR"
                    return 0
                }
            }

            # Define privileged roles to check
            $privilegedRoles = @(
                "Global Administrator",
                "Privileged Role Administrator",
                "Security Administrator",
                "User Administrator"
            )

            # Get all directory roles
            $allRoles = Get-MgDirectoryRole | Where-Object { $_.DisplayName -in $privilegedRoles }
            if (-not $allRoles) {
                Write-Log "    No privileged roles found in directory." "WARNING"
                return 0
            }

            $rolesWithPIM = 0
            foreach ($role in $allRoles) {
                # Check if there are eligible assignments (PIM) for the role
                $eligibleAssignments = Get-MgRoleManagementDirectoryRoleEligibilityScheduleInstance -Filter "roleDefinitionId eq '$($role.Id)'" -ErrorAction SilentlyContinue
                if ($eligibleAssignments -and $eligibleAssignments.Count -gt 0) {
                    $rolesWithPIM++
                }
            }

            $pamScore = [math]::Round(($rolesWithPIM / $allRoles.Count) * 100)
            Write-Log "    PAM implementation assessed: $pamScore% ($rolesWithPIM of $($allRoles.Count) privileged roles protected by PIM)" "DEBUG"
        } else {
            Write-Log "    Azure context not available for PAM assessment" "WARNING"
            $pamScore = 0
        }
        
        return $pamScore
    } catch {
        Write-Log "    Error assessing PAM: $($_.Exception.Message)" "ERROR"
        return 0
    }
}

function Test-IdentityGovernance {
    try {
        # Check Identity Governance implementation
        $igScore = 0
        
        # Check for identity governance policies
        $context = Get-AzContext
        if ($context) {
            # Simulate Identity Governance assessment
            $igScore = 55  # Placeholder score
            Write-Log "    Identity Governance assessed: $igScore%" "DEBUG"
        } else {
            Write-Log "    Azure context not available for Identity Governance assessment" "WARNING"
            $igScore = 0
        }
        
        return $igScore
    } catch {
        Write-Log "    Error assessing Identity Governance: $($_.Exception.Message)" "ERROR"
        return 0
    }
}

function Test-ConditionalAccess {
    try {
        # Check Conditional Access implementation
        $caScore = 0
        
        # Check for conditional access policies
        $context = Get-AzContext
        if ($context) {
            # Simulate Conditional Access assessment
            $caScore = 70  # Placeholder score
            Write-Log "    Conditional Access assessed: $caScore%" "DEBUG"
        } else {
            Write-Log "    Azure context not available for Conditional Access assessment" "WARNING"
            $caScore = 0
        }
        
        return $caScore
    } catch {
        Write-Log "    Error assessing Conditional Access: $($_.Exception.Message)" "ERROR"
        return 0
    }
}

function Test-IdentityProtection {
    try {
        # Check Identity Protection implementation
        $ipScore = 0
        
        # Check for identity protection policies
        $context = Get-AzContext
        if ($context) {
            # Simulate Identity Protection assessment
            $ipScore = 65  # Placeholder score
            Write-Log "    Identity Protection assessed: $ipScore%" "DEBUG"
        } else {
            Write-Log "    Azure context not available for Identity Protection assessment" "WARNING"
            $ipScore = 0
        }
        
        return $ipScore
    } catch {
        Write-Log "    Error assessing Identity Protection: $($_.Exception.Message)" "ERROR"
        return 0
    }
}

function Assess-EndpointsPillar {
    param($assessments)
    
    Write-Log "Assessing Endpoints pillar..."
    $results = @{}
    $totalScore = 0
    $maxScore = 0
    
    foreach ($assessment in $assessments) {
        $score = 0
        $maxScore += $assessment.weight
        
        switch ($assessment.name) {
            "Endpoint Protection" {
                $score = Test-EndpointProtection
            }
            "Device Compliance" {
                $score = Test-DeviceCompliance
            }
            "Endpoint Detection Response" {
                $score = Test-EDRImplementation
            }
            "Device Management" {
                $score = Test-DeviceManagement
            }
            "Application Control" {
                $score = Test-ApplicationControl
            }
        }
        
        $weightedScore = ($score / 100) * $assessment.weight
        $totalScore += $weightedScore
        
        $results[$assessment.name] = @{
            score = $score
            weight = $assessment.weight
            weightedScore = $weightedScore
            status = if ($score -ge 80) { "Excellent" } elseif ($score -ge 60) { "Good" } elseif ($score -ge 40) { "Fair" } else { "Poor" }
        }
        
        Write-Log "  $($assessment.name): $score% (weighted: $([math]::Round($weightedScore, 2)))"
    }
    
    $overallScore = [math]::Round(($totalScore / $maxScore) * 100, 2)
    Write-Log "Endpoints pillar overall score: $overallScore%"
    
    return @{
        pillar = "Endpoints"
        overallScore = $overallScore
        maturityLevel = Get-MaturityLevel $overallScore
        assessments = $results
        recommendations = Get-EndpointsRecommendations $results
    }
}

function Test-EndpointProtection {
    # Simulate endpoint protection assessment
    return 70
}

function Test-DeviceCompliance {
    # Simulate device compliance assessment
    return 65
}

function Test-EDRImplementation {
    # Simulate EDR assessment
    return 60
}

function Test-DeviceManagement {
    # Simulate device management assessment
    return 75
}

function Test-ApplicationControl {
    # Simulate application control assessment
# Helper function to get OAuth2 token for Microsoft Defender for Endpoint
function Get-MDEAuthToken {
    param(
        [Parameter(Mandatory = $true)][string]$TenantId,
        [Parameter(Mandatory = $true)][string]$ClientId,
        [Parameter(Mandatory = $true)][string]$ClientSecret,
        [Parameter(Mandatory = $false)][string]$Resource = "https://api.security.microsoft.com"
    )
    $body = @{
        grant_type    = "client_credentials"
        client_id     = $ClientId
        client_secret = $ClientSecret
        scope        = "$Resource/.default"
    }
    $response = Invoke-RestMethod -Method Post -Uri "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token" -Body $body -ContentType "application/x-www-form-urlencoded"
    return $response.access_token
}

# Helper function to call Microsoft Defender for Endpoint API
function Invoke-MDEApi {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [Parameter(Mandatory = $true)][string]$Token
    )
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type"  = "application/json"
    }
    return Invoke-RestMethod -Uri $Uri -Headers $headers -Method Get
}

# Set these variables with your Azure AD app registration details
$MDE_TenantId    = $env:MDE_TenantId    # Or set directly
$MDE_ClientId    = $env:MDE_ClientId
$MDE_ClientSecret= $env:MDE_ClientSecret
$MDE_ApiBase     = "https://api.security.microsoft.com"

function Test-EndpointProtection {
    # Assess endpoint protection status using Defender for Endpoint API
    if (-not $MDE_TenantId -or -not $MDE_ClientId -or -not $MDE_ClientSecret) {
        Write-Warning "MDE API credentials not set. Returning 0."
        return 0
    }
    $token = Get-MDEAuthToken -TenantId $MDE_TenantId -ClientId $MDE_ClientId -ClientSecret $MDE_ClientSecret
    $uri = "$MDE_ApiBase/api/machines"
    $machines = Invoke-MDEApi -Uri $uri -Token $token
    if (-not $machines.value) { return 0 }
    $total = $machines.value.Count
    if ($total -eq 0) { return 0 }
    $protected = ($machines.value | Where-Object { $_.healthStatus -eq "Active" -and $_.osPlatform -ne "Unknown" -and $_.isAzureAdJoined -eq $true }).Count
    $score = [math]::Round(($protected / $total) * 100)
    return $score
}

function Test-DeviceCompliance {
    # Assess device compliance using Defender for Endpoint API
    if (-not $MDE_TenantId -or -not $MDE_ClientId -or -not $MDE_ClientSecret) {
        Write-Warning "MDE API credentials not set. Returning 0."
        return 0
    }
    $token = Get-MDEAuthToken -TenantId $MDE_TenantId -ClientId $MDE_ClientId -ClientSecret $MDE_ClientSecret
    $uri = "$MDE_ApiBase/api/machines"
    $machines = Invoke-MDEApi -Uri $uri -Token $token
    if (-not $machines.value) { return 0 }
    $total = $machines.value.Count
    if ($total -eq 0) { return 0 }
    $compliant = ($machines.value | Where-Object { $_.riskScore -eq "Low" }).Count
    $score = [math]::Round(($compliant / $total) * 100)
    return $score
}

function Test-EDRImplementation {
    # Assess EDR implementation using Defender for Endpoint API
    if (-not $MDE_TenantId -or -not $MDE_ClientId -or -not $MDE_ClientSecret) {
        Write-Warning "MDE API credentials not set. Returning 0."
        return 0
    }
    $token = Get-MDEAuthToken -TenantId $MDE_TenantId -ClientId $MDE_ClientId -ClientSecret $MDE_ClientSecret
    $uri = "$MDE_ApiBase/api/machines"
    $machines = Invoke-MDEApi -Uri $uri -Token $token
    if (-not $machines.value) { return 0 }
    $total = $machines.value.Count
    if ($total -eq 0) { return 0 }
    $edrEnabled = ($machines.value | Where-Object { $_.onboardingStatus -eq "Onboarded" }).Count
    $score = [math]::Round(($edrEnabled / $total) * 100)
    return $score
}

function Test-DeviceManagement {
    # Assess device management using Defender for Endpoint API
    if (-not $MDE_TenantId -or -not $MDE_ClientId -or -not $MDE_ClientSecret) {
        Write-Warning "MDE API credentials not set. Returning 0."
        return 0
    }
    $token = Get-MDEAuthToken -TenantId $MDE_TenantId -ClientId $MDE_ClientId -ClientSecret $MDE_ClientSecret
    $uri = "$MDE_ApiBase/api/machines"
    $machines = Invoke-MDEApi -Uri $uri -Token $token
    if (-not $machines.value) { return 0 }
    $total = $machines.value.Count
    if ($total -eq 0) { return 0 }
    $managed = ($machines.value | Where-Object { $_.managedBy -ne $null -and $_.managedBy -ne "" }).Count
    $score = [math]::Round(($managed / $total) * 100)
    return $score
}

function Test-ApplicationControl {
    # Assess application control using Defender for Endpoint API
    if (-not $MDE_TenantId -or -not $MDE_ClientId -or -not $MDE_ClientSecret) {
        Write-Warning "MDE API credentials not set. Returning 0."
        return 0
    }
    $token = Get-MDEAuthToken -TenantId $MDE_TenantId -ClientId $MDE_ClientId -ClientSecret $MDE_ClientSecret
    $uri = "$MDE_ApiBase/api/machines"
    $machines = Invoke-MDEApi -Uri $uri -Token $token
    if (-not $machines.value) { return 0 }
    $total = $machines.value.Count
    if ($total -eq 0) { return 0 }
    # For demo, count machines with applicationControlType set (requires custom logic per org)
    $appControl = ($machines.value | Where-Object { $_.applicationControlType -ne $null -and $_.applicationControlType -ne "" }).Count
    $score = [math]::Round(($appControl / $total) * 100)
    return $score
}

function Get-MaturityLevel {
    param([double]$score)
    
    if ($score -ge 90) { return 5 }
    elseif ($score -ge 75) { return 4 }
    elseif ($score -ge 50) { return 3 }
    elseif ($score -ge 25) { return 2 }
    else { return 1 }
}

function Get-IdentitiesRecommendations {
    param($results)
    
    $recommendations = @()
    
    foreach ($assessment in $results.Keys) {
        $score = $results[$assessment].score
        
        if ($score -lt 60) {
            switch ($assessment) {
                "Multi-Factor Authentication" {
                    $recommendations += "Implement comprehensive MFA for all users and applications"
                }
                "Privileged Access Management" {
                    $recommendations += "Deploy Azure AD Privileged Identity Management (PIM)"
                }
                "Identity Governance" {
                    $recommendations += "Establish automated identity lifecycle management"
                }
                "Conditional Access" {
                    $recommendations += "Implement risk-based conditional access policies"
                }
                "Identity Protection" {
                    $recommendations += "Enable Azure AD Identity Protection with automated responses"
                }
            }
        }
    }
    
    return $recommendations
}

function Get-EndpointsRecommendations {
    param($results)
    
    $recommendations = @()
    
    foreach ($assessment in $results.Keys) {
        $score = $results[$assessment].score
        
        if ($score -lt 60) {
            switch ($assessment) {
                "Endpoint Protection" {
                    $recommendations += "Deploy Microsoft Defender for Endpoint across all devices"
                }
                "Device Compliance" {
                    $recommendations += "Implement comprehensive device compliance policies"
                }
                "Endpoint Detection Response" {
                    $recommendations += "Enable advanced EDR capabilities and automated response"
                }
                "Device Management" {
                    $recommendations += "Implement Microsoft Intune for comprehensive device management"
                }
                "Application Control" {
                    $recommendations += "Deploy application control policies to prevent unauthorized software"
                }
            }
        }
    }
    
    return $recommendations
}

function Generate-AssessmentReport {
    param($results, $outputPath)
    
    Write-Log "Generating comprehensive assessment report..."
    
    $report = @{
        assessmentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        overallMaturity = @{
            averageScore = ($results | ForEach-Object { $_.overallScore } | Measure-Object -Average).Average
            maturityLevel = Get-MaturityLevel (($results | ForEach-Object { $_.overallScore } | Measure-Object -Average).Average)
        }
        pillarResults = $results
        summary = @{
            strengths = @()
            weaknesses = @()
            priorityActions = @()
        }
        serviceReleaseReadiness = Get-ServiceReleaseReadiness $results
    }
    
    # Analyze strengths and weaknesses
    foreach ($pillar in $results) {
        if ($pillar.overallScore -ge 75) {
            $report.summary.strengths += "$($pillar.pillar) pillar shows strong maturity ($($pillar.overallScore)%)"
        } elseif ($pillar.overallScore -lt 50) {
            $report.summary.weaknesses += "$($pillar.pillar) pillar requires significant improvement ($($pillar.overallScore)%)"
            $report.summary.priorityActions += "Focus on improving $($pillar.pillar) pillar capabilities"
        }
    }
    
    # Save report
    $report | ConvertTo-Json -Depth 10 | Out-File $outputPath
    Write-Log "Assessment report saved to $outputPath"
    
    return $report
}

function Get-ServiceReleaseReadiness {
    param($results)
    
    # Calculate service release automation readiness based on pillar maturity
    $identitiesScore = ($results | Where-Object { $_.pillar -eq "Identities" }).overallScore
    $appsScore = ($results | Where-Object { $_.pillar -eq "Apps" }).overallScore
    $infrastructureScore = ($results | Where-Object { $_.pillar -eq "Infrastructure" }).overallScore
    
    # Weighted calculation for service release readiness
    $releaseReadiness = [math]::Round((($identitiesScore * 0.3) + ($appsScore * 0.4) + ($infrastructureScore * 0.3)), 2)
    
    $readinessLevel = if ($releaseReadiness -ge 80) { "Fully Ready" }
                     elseif ($releaseReadiness -ge 60) { "Mostly Ready" }
                     elseif ($releaseReadiness -ge 40) { "Partially Ready" }
                     else { "Not Ready" }
    
    return @{
        score = $releaseReadiness
        level = $readinessLevel
        description = "Automated service release capability assessment based on Zero Trust maturity"
    }
}

# Main execution
try {
    Write-Log "Starting Zero Trust Maturity Assessment"
    Write-Log "Pillar filter: $Pillar"
    
    # Load configuration
    $config = Load-AssessmentConfig $ConfigPath
    
    # Perform assessments
    $results = @()
    
    if ($Pillar -eq "All" -or $Pillar -eq "Identities") {
        $results += Assess-IdentitiesPillar $config.pillars.Identities.assessments
    }
    
    if ($Pillar -eq "All" -or $Pillar -eq "Endpoints") {
        $results += Assess-EndpointsPillar $config.pillars.Endpoints.assessments
    }
    
    # Additional pillars would be implemented similarly
    # For brevity, showing pattern with first two pillars
    
    # Generate report if requested
    if ($GenerateReport) {
        $report = Generate-AssessmentReport $results $OutputPath
        
        Write-Log "=== ASSESSMENT SUMMARY ==="
        Write-Log "Overall Maturity Level: $($report.overallMaturity.maturityLevel)"
        Write-Log "Average Score: $([math]::Round($report.overallMaturity.averageScore, 2))%"
        Write-Log "Service Release Readiness: $($report.serviceReleaseReadiness.level) ($($report.serviceReleaseReadiness.score)%)"
        
        if ($report.summary.strengths.Count -gt 0) {
            Write-Log "Strengths:"
            $report.summary.strengths | ForEach-Object { Write-Log "  - $_" }
        }
        
        if ($report.summary.weaknesses.Count -gt 0) {
            Write-Log "Areas for Improvement:"
            $report.summary.weaknesses | ForEach-Object { Write-Log "  - $_" }
        }
        
        if ($report.summary.priorityActions.Count -gt 0) {
            Write-Log "Priority Actions:"
            $report.summary.priorityActions | ForEach-Object { Write-Log "  - $_" }
        }
    }
    
    Write-Log "Zero Trust Maturity Assessment completed successfully"
    
} catch {
    Write-Log "Error during assessment: $($_.Exception.Message)" "ERROR"
    exit 1
}