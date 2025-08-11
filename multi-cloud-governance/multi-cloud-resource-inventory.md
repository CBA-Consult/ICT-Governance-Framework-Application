# Multi-Cloud Resource Inventory Framework

## Executive Summary

This framework establishes a comprehensive approach to discovering, cataloging, and managing resources across Azure, AWS, and Google Cloud Platform (GCP) environments. It addresses the critical governance blind spots identified in non-Azure cloud resources and provides the foundation for unified multi-cloud governance.

## Purpose

The Multi-Cloud Resource Inventory Framework serves to:
- **Eliminate Governance Blind Spots**: Provide complete visibility into all cloud resources across platforms
- **Enable Unified Governance**: Create a single source of truth for multi-cloud resource management
- **Support Compliance Monitoring**: Ensure all cloud resources are tracked and compliant with organizational policies
- **Facilitate Cost Management**: Enable accurate cost allocation and optimization across cloud platforms
- **Risk Management**: Identify and assess security and compliance risks across all cloud environments

## Scope

This framework covers:
- **Azure Resources**: All Azure subscriptions and resource groups
- **AWS Resources**: All AWS accounts and regions
- **GCP Resources**: All GCP projects and organizations
- **Resource Types**: Compute, storage, networking, databases, security services, and applications
- **Metadata Collection**: Tags, configurations, compliance status, and cost information

---

## 1. Multi-Cloud Discovery Architecture

### 1.1 Discovery Components

#### Azure Discovery
- **Azure Resource Graph**: Primary discovery mechanism for Azure resources
- **Azure Policy**: Compliance and configuration assessment
- **Azure Cost Management**: Cost and usage data collection
- **Azure Security Center**: Security posture assessment

#### AWS Discovery
- **AWS Config**: Resource configuration and compliance tracking
- **AWS CloudTrail**: Activity and change tracking
- **AWS Cost Explorer**: Cost and usage analysis
- **AWS Security Hub**: Security findings aggregation
- **AWS Systems Manager**: Inventory and patch compliance

#### GCP Discovery
- **Cloud Asset Inventory**: Comprehensive resource discovery
- **Cloud Security Command Center**: Security findings and compliance
- **Cloud Billing**: Cost and usage tracking
- **Cloud Monitoring**: Performance and availability metrics

### 1.2 Unified Data Model

```json
{
  "resourceInventory": {
    "resourceId": "unique-cross-cloud-identifier",
    "cloudProvider": "Azure|AWS|GCP",
    "resourceType": "compute|storage|network|database|security|application",
    "resourceName": "resource-display-name",
    "region": "deployment-region",
    "environment": "dev|test|prod",
    "owner": "resource-owner",
    "costCenter": "billing-allocation",
    "tags": {
      "governance": "compliance-tags",
      "business": "business-tags",
      "technical": "technical-tags"
    },
    "compliance": {
      "status": "compliant|non-compliant|unknown",
      "policies": ["policy-list"],
      "lastAssessed": "timestamp",
      "findings": ["compliance-findings"]
    },
    "security": {
      "riskLevel": "low|medium|high|critical",
      "vulnerabilities": ["security-findings"],
      "lastScanned": "timestamp"
    },
    "cost": {
      "monthlySpend": "amount",
      "currency": "USD",
      "trend": "increasing|decreasing|stable"
    },
    "metadata": {
      "createdDate": "timestamp",
      "lastModified": "timestamp",
      "discoveredDate": "timestamp",
      "lastInventoried": "timestamp"
    }
  }
}
```

---

## 2. Implementation Strategy

### 2.1 Phase 1: Foundation Setup (Weeks 1-4)

#### Week 1-2: Infrastructure Preparation
1. **Deploy Discovery Infrastructure**
   - Set up centralized inventory database (Azure SQL Database or Cosmos DB)
   - Configure cross-cloud authentication and permissions
   - Deploy monitoring and logging infrastructure

2. **Establish Connectivity**
   - Configure Azure service principals for AWS and GCP access
   - Set up cross-cloud networking if required
   - Implement secure credential management

#### Week 3-4: Basic Discovery Implementation
1. **Azure Discovery Setup**
   - Configure Azure Resource Graph queries
   - Implement Azure Policy compliance scanning
   - Set up cost data collection

2. **AWS Discovery Setup**
   - Deploy AWS Config across all accounts and regions
   - Configure CloudTrail for activity tracking
   - Set up Security Hub for security findings

3. **GCP Discovery Setup**
   - Enable Cloud Asset Inventory APIs
   - Configure Security Command Center
   - Set up billing data export

### 2.2 Phase 2: Comprehensive Discovery (Weeks 5-8)

#### Advanced Discovery Features
1. **Resource Relationship Mapping**
   - Identify dependencies between resources
   - Map network connectivity and data flows
   - Document application architectures

2. **Configuration Drift Detection**
   - Implement baseline configuration tracking
   - Set up automated drift detection
   - Configure remediation workflows

3. **Shadow IT Discovery**
   - Integrate with existing Cloud App Security
   - Implement unauthorized resource detection
   - Set up approval workflows for discovered resources

### 2.3 Phase 3: Governance Integration (Weeks 9-12)

#### Policy and Compliance Integration
1. **Unified Policy Framework**
   - Extend existing Azure policies to AWS and GCP
   - Implement Open Policy Agent for cross-cloud policies
   - Set up automated compliance assessment

2. **Cost Governance**
   - Implement unified cost allocation
   - Set up budget alerts across all clouds
   - Deploy cost optimization recommendations

3. **Security Integration**
   - Integrate with existing SIEM solutions
   - Implement unified security monitoring
   - Set up incident response workflows

---

## 3. Discovery Automation Scripts

### 3.1 Azure Resource Discovery

```powershell
# Azure Resource Discovery Script
param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$true)]
    [string]$InventoryDatabase
)

# Connect to Azure
Connect-AzAccount
Set-AzContext -SubscriptionId $SubscriptionId

# Query all resources using Resource Graph
$query = @"
Resources
| extend resourceType = type
| extend location = location
| extend resourceGroup = resourceGroup
| extend tags = tags
| extend properties = properties
| project id, name, type, resourceType, location, resourceGroup, tags, properties
"@

$resources = Search-AzGraph -Query $query

# Process and store in inventory database
foreach ($resource in $resources) {
    $inventoryRecord = @{
        resourceId = $resource.id
        cloudProvider = "Azure"
        resourceType = Get-ResourceCategory -Type $resource.type
        resourceName = $resource.name
        region = $resource.location
        environment = Get-EnvironmentFromTags -Tags $resource.tags
        owner = Get-OwnerFromTags -Tags $resource.tags
        costCenter = Get-CostCenterFromTags -Tags $resource.tags
        tags = $resource.tags
        discoveredDate = Get-Date
        lastInventoried = Get-Date
    }
    
    # Store in inventory database
    Add-InventoryRecord -Database $InventoryDatabase -Record $inventoryRecord
}
```

### 3.2 AWS Resource Discovery

```python
import boto3
import json
from datetime import datetime

def discover_aws_resources(account_id, regions, inventory_database):
    """
    Discover AWS resources across specified regions
    """
    
    # Initialize AWS clients
    config_client = boto3.client('config')
    cost_client = boto3.client('ce')
    
    discovered_resources = []
    
    for region in regions:
        # Configure regional clients
        regional_config = boto3.client('config', region_name=region)
        
        # Discover resources using AWS Config
        paginator = regional_config.get_paginator('list_discovered_resources')
        
        for page in paginator.paginate():
            for resource in page['resourceIdentifiers']:
                # Get detailed resource information
                resource_detail = regional_config.get_resource_config_history(
                    resourceType=resource['resourceType'],
                    resourceId=resource['resourceId']
                )
                
                # Extract resource metadata
                config_item = resource_detail['configurationItems'][0]
                
                inventory_record = {
                    'resourceId': f"aws:{account_id}:{region}:{resource['resourceId']}",
                    'cloudProvider': 'AWS',
                    'resourceType': categorize_aws_resource(resource['resourceType']),
                    'resourceName': resource['resourceName'],
                    'region': region,
                    'environment': extract_environment_from_tags(config_item.get('tags', {})),
                    'owner': extract_owner_from_tags(config_item.get('tags', {})),
                    'costCenter': extract_cost_center_from_tags(config_item.get('tags', {})),
                    'tags': config_item.get('tags', {}),
                    'compliance': get_compliance_status(resource),
                    'discoveredDate': datetime.utcnow().isoformat(),
                    'lastInventoried': datetime.utcnow().isoformat()
                }
                
                discovered_resources.append(inventory_record)
                
                # Store in inventory database
                store_inventory_record(inventory_database, inventory_record)
    
    return discovered_resources

def categorize_aws_resource(resource_type):
    """
    Categorize AWS resource types into standard categories
    """
    compute_types = ['AWS::EC2::Instance', 'AWS::Lambda::Function', 'AWS::ECS::Service']
    storage_types = ['AWS::S3::Bucket', 'AWS::EBS::Volume', 'AWS::EFS::FileSystem']
    network_types = ['AWS::EC2::VPC', 'AWS::EC2::Subnet', 'AWS::EC2::SecurityGroup']
    database_types = ['AWS::RDS::DBInstance', 'AWS::DynamoDB::Table']
    
    if resource_type in compute_types:
        return 'compute'
    elif resource_type in storage_types:
        return 'storage'
    elif resource_type in network_types:
        return 'network'
    elif resource_type in database_types:
        return 'database'
    else:
        return 'other'
```

### 3.3 GCP Resource Discovery

```python
from google.cloud import asset_v1
from google.cloud import billing_v1
from google.cloud import securitycenter
import json
from datetime import datetime

def discover_gcp_resources(project_id, organization_id, inventory_database):
    """
    Discover GCP resources using Cloud Asset Inventory
    """
    
    # Initialize GCP clients
    asset_client = asset_v1.AssetServiceClient()
    billing_client = billing_v1.CloudBillingClient()
    security_client = securitycenter.SecurityCenterClient()
    
    # Set up the request for asset discovery
    parent = f"projects/{project_id}"
    
    # List all assets in the project
    assets = asset_client.list_assets(request={"parent": parent})
    
    discovered_resources = []
    
    for asset in assets:
        # Extract resource information
        resource = asset.resource
        
        inventory_record = {
            'resourceId': f"gcp:{project_id}:{asset.name}",
            'cloudProvider': 'GCP',
            'resourceType': categorize_gcp_resource(resource.resource_type),
            'resourceName': resource.display_name or asset.name.split('/')[-1],
            'region': extract_region_from_location(resource.location),
            'environment': extract_environment_from_labels(resource.labels),
            'owner': extract_owner_from_labels(resource.labels),
            'costCenter': extract_cost_center_from_labels(resource.labels),
            'tags': dict(resource.labels) if resource.labels else {},
            'compliance': get_gcp_compliance_status(asset),
            'security': get_gcp_security_findings(asset, security_client),
            'discoveredDate': datetime.utcnow().isoformat(),
            'lastInventoried': datetime.utcnow().isoformat()
        }
        
        discovered_resources.append(inventory_record)
        
        # Store in inventory database
        store_inventory_record(inventory_database, inventory_record)
    
    return discovered_resources

def categorize_gcp_resource(resource_type):
    """
    Categorize GCP resource types into standard categories
    """
    compute_types = ['compute.googleapis.com/Instance', 'cloudfunctions.googleapis.com/CloudFunction']
    storage_types = ['storage.googleapis.com/Bucket', 'compute.googleapis.com/Disk']
    network_types = ['compute.googleapis.com/Network', 'compute.googleapis.com/Subnetwork']
    database_types = ['sqladmin.googleapis.com/Instance', 'firestore.googleapis.com/Database']
    
    if any(ct in resource_type for ct in compute_types):
        return 'compute'
    elif any(st in resource_type for st in storage_types):
        return 'storage'
    elif any(nt in resource_type for nt in network_types):
        return 'network'
    elif any(dt in resource_type for dt in database_types):
        return 'database'
    else:
        return 'other'
```

---

## 4. Inventory Database Schema

### 4.1 Core Tables

```sql
-- Multi-Cloud Resource Inventory Database Schema

-- Main resource inventory table
CREATE TABLE ResourceInventory (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ResourceId NVARCHAR(500) NOT NULL UNIQUE,
    CloudProvider NVARCHAR(50) NOT NULL,
    ResourceType NVARCHAR(100) NOT NULL,
    ResourceName NVARCHAR(255) NOT NULL,
    Region NVARCHAR(100),
    Environment NVARCHAR(50),
    Owner NVARCHAR(255),
    CostCenter NVARCHAR(100),
    CreatedDate DATETIME2,
    LastModified DATETIME2,
    DiscoveredDate DATETIME2 NOT NULL,
    LastInventoried DATETIME2 NOT NULL,
    IsActive BIT DEFAULT 1,
    INDEX IX_CloudProvider (CloudProvider),
    INDEX IX_ResourceType (ResourceType),
    INDEX IX_Environment (Environment),
    INDEX IX_Owner (Owner)
);

-- Resource tags table
CREATE TABLE ResourceTags (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ResourceInventoryId UNIQUEIDENTIFIER NOT NULL,
    TagKey NVARCHAR(255) NOT NULL,
    TagValue NVARCHAR(1000),
    TagCategory NVARCHAR(50), -- governance, business, technical
    FOREIGN KEY (ResourceInventoryId) REFERENCES ResourceInventory(Id),
    INDEX IX_TagKey (TagKey),
    INDEX IX_TagCategory (TagCategory)
);

-- Compliance status table
CREATE TABLE ResourceCompliance (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ResourceInventoryId UNIQUEIDENTIFIER NOT NULL,
    PolicyName NVARCHAR(255) NOT NULL,
    ComplianceStatus NVARCHAR(50) NOT NULL, -- compliant, non-compliant, unknown
    LastAssessed DATETIME2 NOT NULL,
    Findings NVARCHAR(MAX), -- JSON format
    Severity NVARCHAR(20), -- low, medium, high, critical
    FOREIGN KEY (ResourceInventoryId) REFERENCES ResourceInventory(Id),
    INDEX IX_ComplianceStatus (ComplianceStatus),
    INDEX IX_Severity (Severity)
);

-- Security findings table
CREATE TABLE ResourceSecurity (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ResourceInventoryId UNIQUEIDENTIFIER NOT NULL,
    FindingType NVARCHAR(100) NOT NULL,
    RiskLevel NVARCHAR(20) NOT NULL, -- low, medium, high, critical
    Description NVARCHAR(1000),
    Recommendation NVARCHAR(1000),
    LastScanned DATETIME2 NOT NULL,
    Status NVARCHAR(50) DEFAULT 'open', -- open, resolved, suppressed
    FOREIGN KEY (ResourceInventoryId) REFERENCES ResourceInventory(Id),
    INDEX IX_RiskLevel (RiskLevel),
    INDEX IX_Status (Status)
);

-- Cost tracking table
CREATE TABLE ResourceCosts (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ResourceInventoryId UNIQUEIDENTIFIER NOT NULL,
    BillingPeriod DATE NOT NULL,
    Cost DECIMAL(18,4) NOT NULL,
    Currency NVARCHAR(3) DEFAULT 'USD',
    CostCategory NVARCHAR(100), -- compute, storage, network, etc.
    FOREIGN KEY (ResourceInventoryId) REFERENCES ResourceInventory(Id),
    INDEX IX_BillingPeriod (BillingPeriod),
    INDEX IX_CostCategory (CostCategory)
);

-- Resource relationships table
CREATE TABLE ResourceRelationships (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ParentResourceId UNIQUEIDENTIFIER NOT NULL,
    ChildResourceId UNIQUEIDENTIFIER NOT NULL,
    RelationshipType NVARCHAR(100) NOT NULL, -- contains, depends_on, connects_to
    Description NVARCHAR(500),
    FOREIGN KEY (ParentResourceId) REFERENCES ResourceInventory(Id),
    FOREIGN KEY (ChildResourceId) REFERENCES ResourceInventory(Id),
    INDEX IX_RelationshipType (RelationshipType)
);
```

---

## 5. Reporting and Analytics

### 5.1 Executive Dashboard Metrics

1. **Resource Distribution**
   - Total resources by cloud provider
   - Resource types distribution
   - Regional distribution

2. **Compliance Overview**
   - Overall compliance percentage
   - Non-compliant resources by severity
   - Compliance trends over time

3. **Cost Analytics**
   - Total multi-cloud spend
   - Cost by cloud provider
   - Cost optimization opportunities

4. **Security Posture**
   - Security findings by risk level
   - Unresolved security issues
   - Security trends

### 5.2 Operational Reports

1. **Daily Inventory Report**
   - New resources discovered
   - Resources removed
   - Configuration changes

2. **Weekly Compliance Report**
   - Compliance status changes
   - New policy violations
   - Remediation progress

3. **Monthly Cost Report**
   - Cost trends by cloud provider
   - Budget variance analysis
   - Cost optimization recommendations

---

## 6. Integration Points

### 6.1 Existing Framework Integration

- **ICT Governance Framework**: Aligns with existing governance structure
- **Policy Management**: Integrates with current policy enforcement
- **Security Monitoring**: Extends existing SIEM and security tools
- **Cost Management**: Enhances current cost governance processes

### 6.2 Tool Integration

- **Azure Monitor**: Centralized logging and monitoring
- **Microsoft Sentinel**: Security information and event management
- **Power BI**: Reporting and analytics dashboards
- **Azure DevOps**: Automation and deployment pipelines

---

## 7. Success Metrics

### 7.1 Coverage Metrics
- **Resource Discovery Rate**: Percentage of resources discovered vs. actual
- **Platform Coverage**: Percentage of cloud platforms with complete inventory
- **Update Frequency**: Time between resource changes and inventory updates

### 7.2 Governance Metrics
- **Compliance Coverage**: Percentage of resources with compliance assessment
- **Policy Enforcement**: Percentage of resources under policy management
- **Risk Reduction**: Reduction in unmanaged resource risks

### 7.3 Operational Metrics
- **Discovery Performance**: Time to complete full inventory scan
- **Data Quality**: Accuracy of inventory data
- **Integration Success**: Successful integration with existing tools

---

## 8. Next Steps

1. **Immediate Actions (Week 1)**
   - Review and approve framework design
   - Allocate resources and assign responsibilities
   - Begin infrastructure setup

2. **Short-term Goals (Weeks 2-4)**
   - Deploy discovery infrastructure
   - Implement basic resource discovery
   - Establish inventory database

3. **Medium-term Goals (Weeks 5-12)**
   - Complete comprehensive discovery implementation
   - Integrate with existing governance tools
   - Deploy reporting and analytics

4. **Long-term Goals (Months 4-6)**
   - Optimize discovery performance
   - Enhance automation capabilities
   - Expand to additional cloud platforms

---

*This framework provides the foundation for comprehensive multi-cloud resource inventory and addresses the critical governance blind spots in AWS and GCP environments. It integrates with the existing ICT Governance Framework while extending capabilities to support true multi-cloud governance.*