# Template Validation Script
# CBA Consult IT Management Framework - Task 3 Implementation
# This script validates blueprint and policy templates for compliance and best practices

param(
    [Parameter(Mandatory=$true)]
    [string]$TemplatePath,
    
    [Parameter(Mandatory=$false)]
    [string]$TemplateType = "auto", # auto, blueprint, policy
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFormat = "console", # console, json, xml
    
    [Parameter(Mandatory=$false)]
    [switch]$Detailed,
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "validation-config.json"
)

# Script metadata
$ScriptInfo = @{
    Name = "Template Validator"
    Version = "1.0.0"
    Author = "CBA Consult ICT Governance Team"
    Framework = "ICT Governance Framework v3.2.0"
    LastUpdated = "2025-08-07"
}

# Validation results structure
$ValidationResults = @{
    TemplatePath = $TemplatePath
    TemplateType = $TemplateType
    ValidationTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    OverallStatus = "Unknown"
    Score = 0
    MaxScore = 0
    Checks = @()
    Errors = @()
    Warnings = @()
    Recommendations = @()
}

# Validation configuration
$ValidationConfig = @{
    Blueprint = @{
        RequiredMetadata = @("name", "version", "description", "author", "framework", "compliance", "lastUpdated")
        RequiredSections = @("parameters", "variables", "resources", "outputs")
        ComplianceFrameworks = @("ISO 27001", "NIST", "COBIT", "GDPR", "SOC 2")
        NamingConventions = @{
            Resources = "^[a-z][a-z0-9-]*[a-z0-9]$"
            Parameters = "^[a-z][a-zA-Z0-9]*$"
            Variables = "^[a-z][a-zA-Z0-9]*$"
        }
    }
    Policy = @{
        RequiredSections = @("Purpose", "Scope", "Policy Statement", "Roles and Responsibilities")
        RequiredMetadata = @("Policy Name", "Policy ID", "Version", "Effective Date", "Owner")
        ComplianceFrameworks = @("GDPR", "ISO 27001", "NIST", "SOC 2", "HIPAA", "PCI DSS")
        DocumentStructure = @{
            MinSections = 8
            MaxSectionDepth = 4
        }
    }
    General = @{
        MaxFileSize = 10MB
        AllowedExtensions = @(".bicep", ".json", ".md", ".yaml", ".yml")
        EncodingRequirement = "UTF-8"
    }
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        default { Write-Host $logMessage }
    }
}

function Test-FileExists {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        $ValidationResults.Errors += "Template file not found: $Path"
        return $false
    }
    return $true
}

function Get-TemplateType {
    param([string]$Path)
    
    $extension = [System.IO.Path]::GetExtension($Path).ToLower()
    $fileName = [System.IO.Path]::GetFileName($Path).ToLower()
    
    if ($extension -eq ".bicep" -or $extension -eq ".json") {
        return "blueprint"
    } elseif ($extension -eq ".md") {
        return "policy"
    } else {
        return "unknown"
    }
}

function Test-BlueprintTemplate {
    param([string]$Path)
    
    Write-Log "Validating Blueprint template: $Path"
    $score = 0
    $maxScore = 0
    
    try {
        $content = Get-Content $Path -Raw -Encoding UTF8
        
        # Test 1: Metadata validation
        $maxScore += 10
        $metadataCheck = Test-BlueprintMetadata -Content $content
        if ($metadataCheck.Passed) {
            $score += 10
            $ValidationResults.Checks += $metadataCheck
        } else {
            $ValidationResults.Errors += $metadataCheck.Message
        }
        
        # Test 2: Parameter validation
        $maxScore += 15
        $parameterCheck = Test-BlueprintParameters -Content $content
        if ($parameterCheck.Passed) {
            $score += 15
            $ValidationResults.Checks += $parameterCheck
        } else {
            $ValidationResults.Warnings += $parameterCheck.Message
            $score += [math]::Floor($parameterCheck.PartialScore * 15)
        }
        
        # Test 3: Resource validation
        $maxScore += 20
        $resourceCheck = Test-BlueprintResources -Content $content
        if ($resourceCheck.Passed) {
            $score += 20
            $ValidationResults.Checks += $resourceCheck
        } else {
            $ValidationResults.Warnings += $resourceCheck.Message
            $score += [math]::Floor($resourceCheck.PartialScore * 20)
        }
        
        # Test 4: Governance tags validation
        $maxScore += 15
        $tagsCheck = Test-GovernanceTags -Content $content
        if ($tagsCheck.Passed) {
            $score += 15
            $ValidationResults.Checks += $tagsCheck
        } else {
            $ValidationResults.Warnings += $tagsCheck.Message
            $score += [math]::Floor($tagsCheck.PartialScore * 15)
        }
        
        # Test 5: Security best practices
        $maxScore += 20
        $securityCheck = Test-SecurityBestPractices -Content $content
        if ($securityCheck.Passed) {
            $score += 20
            $ValidationResults.Checks += $securityCheck
        } else {
            $ValidationResults.Warnings += $securityCheck.Message
            $score += [math]::Floor((if ($null -ne $securityCheck.PartialScore) { $securityCheck.PartialScore } elseif ($null -ne $securityCheck.Score) { $securityCheck.Score } else { 0 }) * 20)
        }
        
        # Test 6: Compliance framework alignment
        $maxScore += 10
        $complianceCheck = Test-ComplianceAlignment -Content $content -Type "blueprint"
        if ($complianceCheck.Passed) {
            $score += 10
            $ValidationResults.Checks += $complianceCheck
        } else {
            $ValidationResults.Warnings += $complianceCheck.Message
            $score += [math]::Floor($complianceCheck.PartialScore * 10)
        }
        
        # Test 7: Output validation
        $maxScore += 10
        $outputCheck = Test-BlueprintOutputs -Content $content
        if ($outputCheck.Passed) {
            $score += 10
            $ValidationResults.Checks += $outputCheck
        } else {
            $ValidationResults.Warnings += $outputCheck.Message
            $score += [math]::Floor($outputCheck.PartialScore * 10)
        }
        
    } catch {
        $ValidationResults.Errors += "Error parsing blueprint template: $($_.Exception.Message)"
        return @{ Score = 0; MaxScore = $maxScore }
    }
    
    return @{ Score = $score; MaxScore = $maxScore }
}

function Test-PolicyTemplate {
    param([string]$Path)
    
    Write-Log "Validating Policy template: $Path"
    $score = 0
    $maxScore = 0
    
    try {
        $content = Get-Content $Path -Raw -Encoding UTF8
        
        # Test 1: Document structure validation
        $maxScore += 20
        $structureCheck = Test-PolicyStructure -Content $content
        if ($structureCheck.Passed) {
            $score += 20
            $ValidationResults.Checks += $structureCheck
        } else {
            $ValidationResults.Errors += $structureCheck.Message
            $score += [math]::Floor($structureCheck.PartialScore * 20)
        }
        
        # Test 2: Required sections validation
        $maxScore += 25
        $sectionsCheck = Test-PolicySections -Content $content
        if ($sectionsCheck.Passed) {
            $score += 25
            $ValidationResults.Checks += $sectionsCheck
        } else {
            $ValidationResults.Warnings += $sectionsCheck.Message
            $score += [math]::Floor($sectionsCheck.PartialScore * 25)
        }
        
        # Test 3: Metadata validation
        $maxScore += 15
        $metadataCheck = Test-PolicyMetadata -Content $content
        if ($metadataCheck.Passed) {
            $score += 15
            $ValidationResults.Checks += $metadataCheck
        } else {
            $ValidationResults.Warnings += $metadataCheck.Message
            $score += [math]::Floor($metadataCheck.PartialScore * 15)
        }
        
        # Test 4: Compliance framework references
        $maxScore += 15
        $complianceCheck = Test-ComplianceAlignment -Content $content -Type "policy"
        if ($complianceCheck.Passed) {
            $score += 15
            $ValidationResults.Checks += $complianceCheck
        } else {
            $ValidationResults.Warnings += $complianceCheck.Message
            $score += [math]::Floor($complianceCheck.PartialScore * 15)
        }
        
        # Test 5: Roles and responsibilities clarity
        $maxScore += 15
        $rolesCheck = Test-RolesAndResponsibilities -Content $content
        if ($rolesCheck.Passed) {
            $score += 15
            $ValidationResults.Checks += $rolesCheck
        } else {
            $ValidationResults.Warnings += $rolesCheck.Message
            $score += [math]::Floor($rolesCheck.PartialScore * 15)
        }
        
        # Test 6: Document formatting and readability
        $maxScore += 10
        $formatCheck = Test-DocumentFormatting -Content $content
        if ($formatCheck.Passed) {
            $score += 10
            $ValidationResults.Checks += $formatCheck
        } else {
            $ValidationResults.Recommendations += $formatCheck.Message
            $score += [math]::Floor($formatCheck.PartialScore * 10)
        }
        
    } catch {
        $ValidationResults.Errors += "Error parsing policy template: $($_.Exception.Message)"
        return @{ Score = 0; MaxScore = $maxScore }
    }
    
    return @{ Score = $score; MaxScore = $maxScore }
}

function Test-BlueprintMetadata {
    param([string]$Content)
    
    $requiredFields = $ValidationConfig.Blueprint.RequiredMetadata
    $foundFields = @()
    $missingFields = @()
    
    # Check for metadata section
    if ($Content -match "metadata\s+templateInfo\s*=\s*\{([^}]+)\}") {
        $metadataContent = $matches[1]
        
        foreach ($field in $requiredFields) {
            if ($metadataContent -match "$field\s*:") {
                $foundFields += $field
            } else {
                $missingFields += $field
            }
        }
    } else {
        return @{
            Passed = $false
            Message = "Blueprint template missing required metadata section"
            PartialScore = 0
        }
    }
    
    $score = $foundFields.Count / $requiredFields.Count
    
    if ($missingFields.Count -eq 0) {
        return @{
            Passed = $true
            Message = "All required metadata fields present"
            Score = 1.0
        }
    } else {
        return @{
            Passed = $false
            Message = "Missing metadata fields: $($missingFields -join ', ')"
            PartialScore = $score
        }
    }
}

function Test-BlueprintParameters {
    param([string]$Content)
    
    $parameterPattern = "@description\([^)]+\)\s*param\s+(\w+)\s+"
    $parameters = [regex]::Matches($Content, $parameterPattern)
    
    $governanceParams = @("environmentName", "organizationCode", "costCenter", "dataClassification")
    $foundGovParams = @()
    
    foreach ($param in $parameters) {
        $paramName = $param.Groups[1].Value
        if ($paramName -in $governanceParams) {
            $foundGovParams += $paramName
        }
    }
    
    $score = $foundGovParams.Count / $governanceParams.Count
    
    if ($foundGovParams.Count -eq $governanceParams.Count) {
        return @{
            Passed = $true
            Message = "All governance parameters present"
            Score = 1.0
        }
    } else {
        $missing = $governanceParams | Where-Object { $_ -notin $foundGovParams }
        return @{
            Passed = $false
            Message = "Missing governance parameters: $($missing -join ', ')"
            PartialScore = $score
        }
    }
}

function Test-BlueprintResources {
    param([string]$Content)
    
    $resourcePattern = "resource\s+(\w+)\s+'([^']+)'"
    $resources = [regex]::Matches($Content, $resourcePattern)
    
    if ($resources.Count -eq 0) {
        return @{
            Passed = $false
            Message = "No resources defined in blueprint"
            PartialScore = 0
        }
    }
    
    $securityResources = @("Microsoft.KeyVault", "Microsoft.Security", "Microsoft.OperationalInsights")
    $foundSecurityResources = @()
    
    foreach ($resource in $resources) {
        $resourceType = $resource.Groups[2].Value
        foreach ($secType in $securityResources) {
            if ($resourceType -like "$secType*") {
                $foundSecurityResources += $secType
                break
            }
        }
    }
    
    $score = [math]::Min(1.0, $foundSecurityResources.Count / 2)
    
    if ($foundSecurityResources.Count -ge 2) {
        return @{
            Passed = $true
            Message = "Security resources properly defined"
            Score = 1.0
        }
    } else {
        return @{
            Passed = $false
            Message = "Insufficient security resources defined"
            PartialScore = $score
        }
    }
}

function Test-GovernanceTags {
    param([string]$Content)
    
    $requiredTags = @("Environment", "Organization", "CostCenter", "Owner", "DataClassification", "Framework")
    $foundTags = @()
    
    if ($Content -match "var\s+governanceTags\s*=\s*\{([^}]+)\}") {
        $tagsContent = $matches[1]
        
        foreach ($tag in $requiredTags) {
            if ($tagsContent -match "$tag\s*:") {
                $foundTags += $tag
            }
        }
    }
    
    $score = $foundTags.Count / $requiredTags.Count
    
    if ($foundTags.Count -eq $requiredTags.Count) {
        return @{
            Passed = $true
            Message = "All governance tags present"
            Score = 1.0
        }
    } else {
        $missing = $requiredTags | Where-Object { $_ -notin $foundTags }
        return @{
            Passed = $false
            Message = "Missing governance tags: $($missing -join ', ')"
            PartialScore = $score
        }
    }
}

function Test-SecurityBestPractices {
    param([string]$Content)
    
    $securityChecks = @{
        "Encryption" = "encryption|encrypt"
        "HTTPS" = "https|tls|ssl"
        "Authentication" = "authentication|auth"
        "Monitoring" = "monitoring|diagnostic|log"
        "AccessControl" = "rbac|access|permission"
    }
    
    $passedChecks = 0
    $totalChecks = $securityChecks.Count
    
    foreach ($check in $securityChecks.GetEnumerator()) {
        if ($Content -match $check.Value) {
            $passedChecks++
        }
    }
    
    $score = $passedChecks / $totalChecks
    
    if ($score -ge $Threshold) {
        return @{
            Passed = $true
            Message = "Security best practices implemented"
            Score = 1.0
        }
    } else {
        return @{
            Passed = $false
            Message = "Some security best practices missing"
            PartialScore = $score
        }
    }
}

function Test-ComplianceAlignment {
    param([string]$Content, [string]$Type)
    
    $frameworks = $ValidationConfig.$Type.ComplianceFrameworks
    $foundFrameworks = @()
    
    foreach ($framework in $frameworks) {
        if ($Content -match $framework) {
            $foundFrameworks += $framework
        }
    }
    
    $score = [math]::Min(1.0, $foundFrameworks.Count / 3)
    
    if ($foundFrameworks.Count -ge 3) {
        return @{
            Passed = $true
            Message = "Compliance frameworks properly referenced"
            Score = 1.0
        }
    } else {
        return @{
            Passed = $false
            Message = "Insufficient compliance framework references"
            PartialScore = $score
        }
    }
}

function Test-BlueprintOutputs {
    param([string]$Content)
    
    $outputPattern = "output\s+(\w+)\s+\w+\s*="
    $outputs = [regex]::Matches($Content, $outputPattern)
    
    $requiredOutputs = @("Compliance", "Endpoints")
    $foundOutputs = @()
    
    foreach ($output in $outputs) {
        $outputName = $output.Groups[1].Value
        foreach ($required in $requiredOutputs) {
            if ($outputName -like "*$required*") {
                $foundOutputs += $required
                break
            }
        }
    }
    
    $score = $foundOutputs.Count / $requiredOutputs.Count
    
    if ($foundOutputs.Count -eq $requiredOutputs.Count) {
        return @{
            Passed = $true
            Message = "Required outputs present"
            Score = 1.0
        }
    } else {
        return @{
            Passed = $false
            Message = "Missing required outputs"
            PartialScore = $score
        }
    }
}

function Test-PolicyStructure {
    param([string]$Content)
    
    $sections = ($Content -split '^#+ ' | Where-Object { $_.Trim() -ne "" }).Count
    $minSections = $ValidationConfig.Policy.DocumentStructure.MinSections
    
    if ($sections -ge $minSections) {
        return @{
            Passed = $true
            Message = "Document structure meets requirements"
            Score = 1.0
        }
    } else {
        return @{
            Passed = $false
            Message = "Document has insufficient sections ($sections/$minSections)"
            PartialScore = $sections / $minSections
        }
    }
}

function Test-PolicySections {
    param([string]$Content)
    
    $requiredSections = $ValidationConfig.Policy.RequiredSections
    $foundSections = @()
    
    foreach ($section in $requiredSections) {
        if ($Content -match "#+\s*$section") {
            $foundSections += $section
        }
    }
    
    $score = $foundSections.Count / $requiredSections.Count
    
    if ($foundSections.Count -eq $requiredSections.Count) {
        return @{
            Passed = $true
            Message = "All required sections present"
            Score = 1.0
        }
    } else {
        $missing = $requiredSections | Where-Object { $_ -notin $foundSections }
        return @{
            Passed = $false
            Message = "Missing sections: $($missing -join ', ')"
            PartialScore = $score
        }
    }
}

function Test-PolicyMetadata {
    param([string]$Content)
    
    $requiredMetadata = $ValidationConfig.Policy.RequiredMetadata
    $foundMetadata = @()
    
    foreach ($metadata in $requiredMetadata) {
        if ($Content -match "\*\*$metadata:\*\*") {
            $foundMetadata += $metadata
        }
    }
    
    $score = $foundMetadata.Count / $requiredMetadata.Count
    
    if ($foundMetadata.Count -eq $requiredMetadata.Count) {
        return @{
            Passed = $true
            Message = "All required metadata present"
            Score = 1.0
        }
    } else {
        $missing = $requiredMetadata | Where-Object { $_ -notin $foundMetadata }
        return @{
            Passed = $false
            Message = "Missing metadata: $($missing -join ', ')"
            PartialScore = $score
        }
    }
}

function Test-RolesAndResponsibilities {
    param([string]$Content)
    
    $rolesPattern = "#+\s*Roles and Responsibilities"
    $hasRolesSection = $Content -match $rolesPattern
    
    if ($hasRolesSection) {
        # Count role definitions
        $roleDefinitions = ($Content -split $rolesPattern)[1] -split "###" | Where-Object { $_.Trim() -ne "" }
        
        if ($roleDefinitions.Count -ge 3) {
            return @{
                Passed = $true
                Message = "Roles and responsibilities clearly defined"
                Score = 1.0
            }
        } else {
            return @{
                Passed = $false
                Message = "Insufficient role definitions"
                PartialScore = 0.5
            }
        }
    } else {
        return @{
            Passed = $false
            Message = "Roles and responsibilities section missing"
            PartialScore = 0
        }
    }
}

function Test-DocumentFormatting {
    param([string]$Content)
    
    $formatChecks = @{
        "Headers" = ($Content -split '^#+ ').Count -gt 5
        "Lists" = ($Content -split '^- ').Count -gt 10
        "Tables" = ($Content -split '\|').Count -gt 10
        "Links" = ($Content -split '\[.*\]\(.*\)').Count -gt 1
    }
    
    $passedChecks = ($formatChecks.Values | Where-Object { $_ }).Count
    $totalChecks = $formatChecks.Count
    
    $score = $passedChecks / $totalChecks
    
    if ($score -ge 0.75) {
        return @{
            Passed = $true
            Message = "Document formatting is good"
            Score = 1.0
        }
    } else {
        return @{
            Passed = $false
            Message = "Document formatting could be improved"
            PartialScore = $score
        }
    }
}

function Format-ValidationResults {
    param([string]$Format)
    
    switch ($Format.ToLower()) {
        "json" {
            return $ValidationResults | ConvertTo-Json -Depth 10
        }
        "xml" {
            return $ValidationResults | ConvertTo-Xml -NoTypeInformation
        }
        default {
            $output = @"
=== Template Validation Results ===
Template: $($ValidationResults.TemplatePath)
Type: $($ValidationResults.TemplateType)
Timestamp: $($ValidationResults.ValidationTimestamp)
Overall Status: $($ValidationResults.OverallStatus)
Score: $($ValidationResults.Score)/$($ValidationResults.MaxScore) ($([math]::Round(($ValidationResults.Score / $ValidationResults.MaxScore) * 100, 1))%)

"@
            
            if ($ValidationResults.Errors.Count -gt 0) {
                $output += "`nERRORS:`n"
                $ValidationResults.Errors | ForEach-Object { $output += "  - $_`n" }
            }
            
            if ($ValidationResults.Warnings.Count -gt 0) {
                $output += "`nWARNINGS:`n"
                $ValidationResults.Warnings | ForEach-Object { $output += "  - $_`n" }
            }
            
            if ($ValidationResults.Recommendations.Count -gt 0) {
                $output += "`nRECOMMENDATIONS:`n"
                $ValidationResults.Recommendations | ForEach-Object { $output += "  - $_`n" }
            }
            
            return $output
        }
    }
}

# Main execution
try {
    Write-Log "Starting template validation..." "INFO"
    Write-Log "Script: $($ScriptInfo.Name) v$($ScriptInfo.Version)" "INFO"
    
    # Validate input file
    if (-not (Test-FileExists -Path $TemplatePath)) {
        throw "Template file not found: $TemplatePath"
    }
    
    # Determine template type if auto-detection requested
    if ($TemplateType -eq "auto") {
        $TemplateType = Get-TemplateType -Path $TemplatePath
        Write-Log "Auto-detected template type: $TemplateType" "INFO"
    }
    
    $ValidationResults.TemplateType = $TemplateType
    
    # Perform validation based on template type
    switch ($TemplateType.ToLower()) {
        "blueprint" {
            $result = Test-BlueprintTemplate -Path $TemplatePath
        }
        "policy" {
            $result = Test-PolicyTemplate -Path $TemplatePath
        }
        default {
            throw "Unsupported template type: $TemplateType"
        }
    }
    
    # Update validation results
    $ValidationResults.Score = $result.Score
    $ValidationResults.MaxScore = $result.MaxScore
    
    # Determine overall status
    $percentage = ($ValidationResults.Score / $ValidationResults.MaxScore) * 100
    if ($percentage -ge 90) {
        $ValidationResults.OverallStatus = "EXCELLENT"
    } elseif ($percentage -ge 80) {
        $ValidationResults.OverallStatus = "GOOD"
    } elseif ($percentage -ge 70) {
        $ValidationResults.OverallStatus = "ACCEPTABLE"
    } elseif ($percentage -ge 60) {
        $ValidationResults.OverallStatus = "NEEDS_IMPROVEMENT"
    } else {
        $ValidationResults.OverallStatus = "POOR"
    }
    
    # Output results
    $output = Format-ValidationResults -Format $OutputFormat
    Write-Output $output
    
    # Log completion
    Write-Log "Validation completed successfully" "SUCCESS"
    Write-Log "Overall Status: $($ValidationResults.OverallStatus)" "INFO"
    Write-Log "Score: $($ValidationResults.Score)/$($ValidationResults.MaxScore)" "INFO"
    
} catch {
    Write-Log "Validation failed: $($_.Exception.Message)" "ERROR"
    $ValidationResults.OverallStatus = "ERROR"
    $ValidationResults.Errors += $_.Exception.Message
    
    $output = Format-ValidationResults -Format $OutputFormat
    Write-Output $output
    
    exit 1
}