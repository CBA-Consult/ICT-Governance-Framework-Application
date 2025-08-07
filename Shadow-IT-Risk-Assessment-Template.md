# Shadow IT Risk Assessment Template

This template provides a structured framework for evaluating the risk of shadow IT applications discovered through SIEM, Cloud App Security, or other detection mechanisms. It helps governance teams make consistent decisions about application approval, remediation, or rejection by leveraging both Microsoft Cloud App Security catalog data and organizational assessment.

## Application Information

| Field | Description |
|-------|-------------|
| **Application Name** | [Full name of the application] |
| **Application Type** | [SaaS / Desktop / Mobile / Browser Extension / Other] |
| **Vendor/Provider** | [Company providing the application] |
| **Discovery Date** | [Date when the application was discovered] |
| **Discovery Method** | [SIEM / Cloud App Security / Device Inventory / User Report / Other] |
| **Discovery Context** | [Brief description of how the application was being used] |
| **Affected Users/Devices** | [Number and types of users/devices using the application] |
| **Business Unit** | [Department or business unit where usage was detected] |

## Business Justification

| Field | Value | Notes |
|-------|-------|-------|
| **Business Purpose** | [Describe the business need this application addresses] | |
| **User Justification** | [Summary of user explanation for using this application] | |
| **Existing Alternatives** | [List approved applications that provide similar functionality] | |
| **Gap Analysis** | [Explanation of why approved alternatives do not meet the need] | |
| **Business Impact if Denied** | [Low / Medium / High] | [Describe the business impact if use is not permitted] |
| **User Productivity Impact** | [Low / Medium / High] | [Describe how this impacts user productivity] |

## Security Risk Assessment

### Cloud App Security Catalog Data

| CAS Data Point | Value | Source | Notes |
|----------------|-------|--------|-------|
| **CAS Risk Score** | [0-10] | [Cloud App Security Catalog] | [Overall risk score from Microsoft Cloud App Security] |
| **General Risk Factor** | [0-10] | [Cloud App Security Catalog] | [General risk assessment from CAS] |
| **Data Risk Factor** | [0-10] | [Cloud App Security Catalog] | [Data security risk from CAS] |
| **Security Risk Factor** | [0-10] | [Cloud App Security Catalog] | [Security controls risk from CAS] |
| **Compliance Risk Factor** | [0-10] | [Cloud App Security Catalog] | [Regulatory compliance risk from CAS] |
| **CAS App Category** | [Category name] | [Cloud App Security Catalog] | [Application category as defined in CAS] |
| **Industry Recognition** | [Yes/No/Limited] | [Cloud App Security Catalog] | [Whether the app is widely recognized in the industry] |
| **Last Updated** | [Date] | [Cloud App Security Catalog] | [When the CAS data was last updated] |

### Organizational Security Assessment

| Security Dimension | Rating | Weight | Score | Notes |
|--------------------|--------|--------|-------|-------|
| **Data Sensitivity** | [1-5] | 4 | [Rating × Weight] | [Types of data accessed by the application] |
| **Authentication Mechanism** | [1-5] | 4 | [Rating × Weight] | [How users authenticate to the application] |
| **Authorization Controls** | [1-5] | 3 | [Rating × Weight] | [Role-based access, privilege management] |
| **Data Storage Location** | [1-5] | 4 | [Rating × Weight] | [Where data is stored, geographic considerations] |
| **Data Encryption** | [1-5] | 4 | [Rating × Weight] | [Transport and at-rest encryption] |
| **Vendor Security Posture** | [1-5] | 3 | [Rating × Weight] | [Vendor security certifications, practices] |
| **Update/Patch Management** | [1-5] | 2 | [Rating × Weight] | [How updates are managed and deployed] |
| **Attack Surface** | [1-5] | 3 | [Rating × Weight] | [API access, plugins, extensions, etc.] |
| **Known Vulnerabilities** | [1-5] | 5 | [Rating × Weight] | [Documented CVEs or security issues] |
| **Supply Chain Risk** | [1-5] | 3 | [Rating × Weight] | [Vendor country of origin, supply chain security] |
| **TOTAL SECURITY RISK SCORE** | | | [Sum of all scores] | |

_Rating Scale: 1 = Very Low Risk, 2 = Low Risk, 3 = Medium Risk, 4 = High Risk, 5 = Very High Risk_

## Compliance Assessment

### Cloud App Security Compliance Data

| CAS Compliance Data | Status | Source | Notes |
|---------------------|--------|--------|-------|
| **GDPR Ready** | [Yes/No/Partial] | [Cloud App Security Catalog] | [GDPR readiness as reported in CAS] |
| **HIPAA Ready** | [Yes/No/Partial] | [Cloud App Security Catalog] | [HIPAA readiness as reported in CAS] |
| **ISO 27001 Certified** | [Yes/No/Partial] | [Cloud App Security Catalog] | [ISO 27001 certification status as reported in CAS] |
| **ISO 27018 Certified** | [Yes/No/Partial] | [Cloud App Security Catalog] | [ISO 27018 certification status as reported in CAS] |
| **PCI DSS Certified** | [Yes/No/Partial] | [Cloud App Security Catalog] | [PCI DSS certification status as reported in CAS] |
| **SOC 1 Compliance** | [Yes/No/Partial] | [Cloud App Security Catalog] | [SOC 1 compliance status as reported in CAS] |
| **SOC 2 Compliance** | [Yes/No/Partial] | [Cloud App Security Catalog] | [SOC 2 compliance status as reported in CAS] |
| **SOC 3 Compliance** | [Yes/No/Partial] | [Cloud App Security Catalog] | [SOC 3 compliance status as reported in CAS] |
| **FERPA Ready** | [Yes/No/Partial] | [Cloud App Security Catalog] | [FERPA readiness as reported in CAS] |
| **Privacy Shield Framework** | [Yes/No/Partial] | [Cloud App Security Catalog] | [Privacy Shield status as reported in CAS] |
| **CSA STAR Certified** | [Yes/No/Partial] | [Cloud App Security Catalog] | [CSA STAR certification status as reported in CAS] |
| **Data Residency Options** | [List of regions] | [Cloud App Security Catalog] | [Available data residency options as reported in CAS] |

### Organizational Compliance Assessment

| Compliance Dimension | Applicable | Compliant | Notes |
|----------------------|------------|-----------|-------|
| **Data Protection/Privacy** | [Yes/No] | [Yes/No/Partial] | [GDPR, CCPA, etc. considerations] |
| **Industry Regulations** | [Yes/No] | [Yes/No/Partial] | [HIPAA, PCI-DSS, etc. considerations] |
| **Data Sovereignty** | [Yes/No] | [Yes/No/Partial] | [Cross-border data transfer considerations] |
| **Retention Requirements** | [Yes/No] | [Yes/No/Partial] | [Data retention capability and compliance] |
| **Audit Capability** | [Yes/No] | [Yes/No/Partial] | [Logging and auditability features] |
| **Access Controls** | [Yes/No] | [Yes/No/Partial] | [Compliance with access control requirements] |
| **Vendor Agreements** | [Yes/No] | [Yes/No/Partial] | [DPA, SLA, and other required agreements] |
| **Internal Policies** | [Yes/No] | [Yes/No/Partial] | [Compliance with organizational policies] |
| **COMPLIANCE RISK LEVEL** | | [Low/Medium/High] | [Overall compliance risk assessment] |

## Legal Assessment

### Cloud App Security Legal Data

| CAS Legal Data | Status | Source | Notes |
|----------------|--------|--------|-------|
| **Terms of Service Available** | [Yes/No] | [Cloud App Security Catalog] | [Availability of Terms of Service as reported in CAS] |
| **Terms Can Change Without Notice** | [Yes/No] | [Cloud App Security Catalog] | [Whether terms can change without notice as reported in CAS] |
| **Data Ownership** | [Customer/Provider/Shared] | [Cloud App Security Catalog] | [Data ownership status as reported in CAS] |
| **Data Deletion Upon Termination** | [Yes/No/Partial] | [Cloud App Security Catalog] | [Data deletion policy upon service termination as reported in CAS] |
| **Data Breach Notification** | [Yes/No/Partial] | [Cloud App Security Catalog] | [Data breach notification policy as reported in CAS] |
| **DMCA Policy** | [Yes/No] | [Cloud App Security Catalog] | [Digital Millennium Copyright Act policy as reported in CAS] |
| **Provider Litigation History** | [None/Limited/Significant] | [Cloud App Security Catalog] | [History of legal actions against the provider as reported in CAS] |
| **Forced Arbitration** | [Yes/No] | [Cloud App Security Catalog] | [Whether terms include forced arbitration clauses as reported in CAS] |

## Operational Assessment

| Operational Dimension | Rating | Notes |
|-----------------------|--------|-------|
| **Integration Capability** | [1-5] | [Ability to integrate with existing systems] |
| **Manageability** | [1-5] | [Ease of central management and configuration] |
| **Supportability** | [1-5] | [Vendor support quality and availability] |
| **Scalability** | [1-5] | [Ability to scale with organizational needs] |
| **Monitoring Capability** | [1-5] | [Ability to monitor usage and performance] |
| **License Compliance** | [1-5] | [Compliance with licensing requirements] |
| **Data Portability** | [1-5] | [Ability to export/migrate data] |
| **Business Continuity** | [1-5] | [Disaster recovery, backup capabilities] |
| **OPERATIONAL RISK LEVEL** | [Low/Medium/High] | [Overall operational risk assessment] |

_Rating Scale: 1 = Very Low Risk, 2 = Low Risk, 3 = Medium Risk, 4 = High Risk, 5 = Very High Risk_

## Cost Assessment

| Cost Dimension | Value | Notes |
|----------------|-------|-------|
| **Licensing Costs** | [$/user/month or annual cost] | [Licensing model and costs] |
| **Implementation Costs** | [$] | [One-time implementation/setup costs] |
| **Integration Costs** | [$] | [Costs for integrating with existing systems] |
| **Training Costs** | [$] | [User and admin training requirements] |
| **Support Costs** | [$] | [Ongoing support and maintenance costs] |
| **Infrastructure Costs** | [$] | [Additional infrastructure required] |
| **Exit Costs** | [$] | [Costs associated with future migration] |
| **TOTAL COST ESTIMATE** | [$] | [Total cost of ownership estimate] |

## Risk Mitigation

| Risk | Mitigation Strategy | Responsibility | Timeline |
|------|---------------------|----------------|----------|
| [Identified risk 1] | [Strategy to mitigate risk] | [Person/team responsible] | [Implementation timeline] |
| [Identified risk 2] | [Strategy to mitigate risk] | [Person/team responsible] | [Implementation timeline] |
| [Identified risk 3] | [Strategy to mitigate risk] | [Person/team responsible] | [Implementation timeline] |

## Decision and Approval

| Field | Value | Notes |
|-------|-------|-------|
| **Cloud App Security Risk Score** | [0-10] | [CAS aggregate risk score] |
| **Organizational Risk Assessment** | [Low/Medium/High] | [Combined risk assessment from all categories] |
| **Final Risk Level** | [Low/Medium/High] | [Final risk determination considering both CAS and organizational assessment] |
| **Recommendation** | [Approve / Approve with Conditions / Remediate / Reject] | [Recommendation based on assessment] |
| **Conditions for Approval** | [List any conditions that must be met for approval] | |
| **Remediation Requirements** | [Requirements if remediation is needed] | |
| **Alternative Solutions** | [Recommended alternatives if rejected] | |
| **Decision** | [Approved / Conditionally Approved / Remediation Required / Rejected] | |
| **Approver(s)** | [Name and role of approver(s)] | |
| **Approval Date** | [Date of decision] | |
| **Review Date** | [Date for reassessment] | |

## Implementation Plan (if approved)

| Action Item | Responsibility | Deadline | Status |
|-------------|----------------|----------|--------|
| [Required action 1] | [Person/team responsible] | [Completion date] | [Not Started/In Progress/Complete] |
| [Required action 2] | [Person/team responsible] | [Completion date] | [Not Started/In Progress/Complete] |
| [Required action 3] | [Person/team responsible] | [Completion date] | [Not Started/In Progress/Complete] |

## Remediation Plan (if remediation required)

| Action Item | Responsibility | Deadline | Status |
|-------------|----------------|----------|--------|
| [Required action 1] | [Person/team responsible] | [Completion date] | [Not Started/In Progress/Complete] |
| [Required action 2] | [Person/team responsible] | [Completion date] | [Not Started/In Progress/Complete] |
| [Required action 3] | [Person/team responsible] | [Completion date] | [Not Started/In Progress/Complete] |

## Retirement Plan (if rejected)

| Action Item | Responsibility | Deadline | Status |
|-------------|----------------|----------|--------|
| [Required action 1] | [Person/team responsible] | [Completion date] | [Not Started/In Progress/Complete] |
| [Required action 2] | [Person/team responsible] | [Completion date] | [Not Started/In Progress/Complete] |
| [Required action 3] | [Person/team responsible] | [Completion date] | [Not Started/In Progress/Complete] |

## Documentation

| Document | Status | Location | Owner |
|----------|--------|----------|-------|
| [Required document 1] | [Not Started/In Progress/Complete] | [Document location] | [Document owner] |
| [Required document 2] | [Not Started/In Progress/Complete] | [Document location] | [Document owner] |
| [Required document 3] | [Not Started/In Progress/Complete] | [Document location] | [Document owner] |

## Lessons Learned

| Area | Observations | Recommendations |
|------|--------------|-----------------|
| [Area of learning 1] | [What was observed] | [Recommendations for future] |
| [Area of learning 2] | [What was observed] | [Recommendations for future] |
| [Area of learning 3] | [What was observed] | [Recommendations for future] |

## Cloud App Security Data Collection Process

### Manual Data Collection

1. **Accessing Cloud App Security Catalog**:
   - Navigate to the Microsoft Defender for Cloud Apps portal (formerly Microsoft Cloud App Security)
   - Go to the "App Catalog" section
   - Search for the application by name
   - Document all available risk scores, compliance data, and legal information

### Automated Data Collection via API

1. **API Access Setup**:
   - Obtain API access to Microsoft Defender for Cloud Apps
   - Configure authentication using Azure Active Directory app registration
   - Ensure proper permissions are granted for reading app catalog data
   - Store API credentials securely in key vault or secure configuration

2. **API Endpoints for App Catalog Data**:
   ```
   GET /api/v1/apps/{appId}/catalog_info/
   GET /api/v1/apps/catalog/
   ```

3. **Automated Data Retrieval Process**:
   - Query the app catalog API to search for applications by name or ID
   - Extract risk scores, compliance certifications, and legal data
   - Parse JSON response to populate assessment template fields automatically
   - Store retrieved data in governance database or assessment management system

4. **API Data Mapping**:
   - **Risk Scores**: Map API fields like `riskScore`, `generalRisk`, `dataRisk`, `securityRisk`, `complianceRisk`
   - **Compliance Data**: Extract certification status for GDPR, HIPAA, SOC, ISO standards
   - **Legal Information**: Parse terms of service, data ownership, and legal framework data
   - **Application Metadata**: Category, industry recognition, last update timestamps

5. **Integration with Shadow IT Detection**:
   - Automatically trigger API calls when new applications are discovered via SIEM
   - Populate risk assessment templates with API data as starting point
   - Flag applications not found in Microsoft catalog for manual research
   - Generate automated risk reports combining detection and catalog data

6. **API Data Refresh Strategy**:
   - Schedule periodic API calls to update existing application assessments
   - Monitor for changes in risk scores or compliance status
   - Alert governance team when significant changes are detected
   - Maintain audit trail of all API data retrievals and updates

### Data Verification

1. **Automated Verification**:
   - Compare API response timestamps with current date to ensure data freshness
   - Validate API response completeness (check for missing fields)
   - Cross-reference multiple API endpoints for consistency
   - Implement data quality checks and exception handling

2. **Manual Verification**:
   - Verify the CAS data is current (check "Last Updated" date)
   - If CAS data is older than 6 months, conduct additional research to verify current status
   - Document any discrepancies found between CAS data and vendor's current statements
   - For high-risk applications, independently verify critical compliance certifications

### Data Interpretation Guidelines

1. **CAS Risk Scores (0-10 scale)**:
   - 0-3: Low risk
   - 4-7: Medium risk
   - 8-10: High risk

2. **Compliance Certifications**:
   - Should be independently verified when possible
   - API data provides baseline, manual verification required for critical applications
   - Legal team review required for high-risk applications

3. **API Response Handling**:
   - Applications not found in catalog require manual research
   - Partial API responses should trigger manual data collection
   - API rate limits and error handling must be implemented

### Implementation Considerations for API Automation

1. **Prerequisites**:
   - Microsoft Defender for Cloud Apps license with API access
   - Azure AD app registration with appropriate permissions
   - Secure credential storage (Azure Key Vault recommended)
   - API rate limit management and error handling

2. **Integration Points**:
   - SIEM/SOAR platforms for automated shadow IT processing
   - Governance platforms for risk assessment workflow
   - IT Service Management tools for approval tracking
   - Reporting tools for compliance and risk dashboards

3. **Data Governance**:
   - Maintain audit trail of all API calls and data retrievals
   - Implement data retention policies for historical assessments
   - Ensure GDPR compliance for any personal data in assessments
   - Regular API credential rotation and access reviews
