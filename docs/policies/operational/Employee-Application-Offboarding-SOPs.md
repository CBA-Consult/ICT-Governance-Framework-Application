# Employee Application Offboarding Standard Operating Procedures

## Document Information
- **Document Title:** Employee Application Offboarding Standard Operating Procedures
- **Document Version:** 1.0
- **Document Owner:** ICT Governance Council
- **Last Updated:** [Current Date]
- **Review Frequency:** Quarterly
- **Distribution:** HR, ICT, Security, Legal Teams

## Executive Summary

This document provides comprehensive Standard Operating Procedures (SOPs) for managing application access and data during employee offboarding, with specific focus on individually registered applications that are not centrally managed through Entra ID or Active Directory. These procedures ensure business continuity, data security, and compliance with industry standards while preventing ransomware and data lockout scenarios.

## Table of Contents
1. [Introduction](#introduction)
2. [Scope and Applicability](#scope-and-applicability)
3. [Roles and Responsibilities](#roles-and-responsibilities)
4. [Pre-Departure Application Discovery](#pre-departure-application-discovery)
5. [Application Registry Creation](#application-registry-creation)
6. [Application Handover Procedures](#application-handover-procedures)
7. [Data Recovery and Migration](#data-recovery-and-migration)
8. [Vendor Coordination](#vendor-coordination)
9. [Compliance Verification](#compliance-verification)
10. [Extended Notice Period Framework](#extended-notice-period-framework)
11. [Risk Mitigation Strategies](#risk-mitigation-strategies)
12. [Templates and Checklists](#templates-and-checklists)

## Introduction

### Purpose
These SOPs address the critical risks associated with employee offboarding when applications are individually registered and not centrally managed. The procedures ensure:
- Complete inventory and documentation of all business applications
- Secure transfer of application access and data to successors
- Compliance with industry standards and regulatory requirements
- Prevention of data loss and business disruption
- Mitigation of security risks including ransomware and unauthorized access

### Key Challenges Addressed
- Applications registered individually by employees outside central procurement
- Lack of integration with corporate identity management systems
- Vendor-provided applications with separate user management
- Risk of data lockout when employees retain access post-termination
- Compliance gaps with industry standards and regulations

## Scope and Applicability

### In Scope
- All applications used for business purposes by departing employees
- Applications with individual employee registrations
- Vendor-provided documentation and support applications
- Cloud services with employee-specific accounts
- Applications containing company data or intellectual property
- Third-party tools used for role-specific functions

### Out of Scope
- Personal applications with no business data
- Applications already integrated with Entra ID/Active Directory (covered by standard offboarding)
- Hardware and device management (covered by separate procedures)

## Roles and Responsibilities

### Human Resources Department
**Primary Responsibilities:**
- Initiate offboarding process upon receipt of resignation or termination notice
- Coordinate with ICT Department for application discovery and handover
- Ensure compliance with employment law and notice period requirements
- Facilitate extended notice periods for critical application handover

**Key Activities:**
- Notify ICT Department within 24 hours of departure notice
- Coordinate with departing employee for application disclosure
- Approve extended notice periods for critical applications
- Ensure legal compliance throughout offboarding process

### ICT Department
**Primary Responsibilities:**
- Lead application discovery and inventory process
- Coordinate technical aspects of application handover
- Ensure security and compliance requirements are met
- Maintain application registry and documentation

**Key Activities:**
- Conduct comprehensive application discovery scan
- Create and maintain application registry
- Coordinate with vendors for account transfers
- Verify technical compliance and security requirements

### Department Head/Manager
**Primary Responsibilities:**
- Identify critical applications and business impact
- Approve application handover plans
- Designate successors for application ownership
- Ensure business continuity during transition

**Key Activities:**
- Review and approve application registry
- Identify critical applications requiring extended handover
- Designate application successors
- Validate business continuity plans

### Security Team
**Primary Responsibilities:**
- Assess security risks of individual applications
- Verify compliance with security standards
- Monitor for unauthorized access during transition
- Validate data protection measures

**Key Activities:**
- Conduct security assessment of discovered applications
- Verify compliance with security policies
- Monitor application access during handover period
- Validate data encryption and protection measures

### Legal/Compliance Team
**Primary Responsibilities:**
- Ensure compliance with regulatory requirements
- Review vendor agreements and terms of service
- Validate data protection and privacy compliance
- Approve account transfer procedures

**Key Activities:**
- Review application compliance with industry standards
- Validate vendor agreement compliance
- Ensure data protection regulation compliance
- Approve legal aspects of account transfers

### Departing Employee
**Primary Responsibilities:**
- Disclose all business applications used during employment
- Cooperate with application discovery and handover process
- Provide access credentials and documentation
- Complete knowledge transfer for critical applications

**Key Activities:**
- Complete comprehensive application disclosure form
- Provide access to applications for inventory and handover
- Document critical processes and procedures
- Transfer knowledge to designated successors

## Pre-Departure Application Discovery

### Discovery Timeline
**Initiation:** Within 24 hours of departure notice
**Completion:** Within 1 week of departure notice
**Documentation:** Within 2 weeks of departure notice

### Discovery Methods

#### 1. Employee Self-Disclosure
**Process:**
1. Provide departing employee with comprehensive application disclosure form
2. Schedule discovery interview with ICT and department head
3. Review employee's role and responsibilities to identify potential applications
4. Document all disclosed applications with detailed information

**Required Information:**
- Application name and vendor
- Purpose and business function
- Account details and access credentials
- Data stored and business criticality
- Integration with other systems
- Vendor contact information

#### 2. Technical Discovery Scan
**SIEM and Cloud App Security Scan:**
1. Execute comprehensive scan of employee's device and network activity
2. Analyze cloud application usage patterns
3. Identify unauthorized or undocumented applications
4. Cross-reference with Employee App Store approved applications

**Network Analysis:**
1. Review network traffic logs for external application connections
2. Identify data transfer patterns to cloud services
3. Analyze authentication logs for external services
4. Document unusual or high-volume data transfers

#### 3. Department and Team Review
**Collaborative Discovery:**
1. Interview team members and colleagues
2. Review project documentation and collaboration tools
3. Identify shared applications and accounts
4. Document team-specific tools and processes

### Discovery Documentation
**Application Discovery Report:**
- Complete list of discovered applications
- Risk assessment for each application
- Business criticality rating
- Data sensitivity classification
- Compliance status evaluation

## Application Registry Creation

### Registry Components

#### 1. Application Metadata
**Required Fields:**
- Application Name
- Vendor/Provider
- Application Category (Productivity, Analytics, Communication, etc.)
- Business Purpose and Function
- Department/Team Usage
- Business Criticality Level (Critical, Important, Standard)
- Data Sensitivity Level (Confidential, Internal, Public)

#### 2. Technical Information
**Required Fields:**
- Application URL/Access Method
- Authentication Method
- Integration Points
- Data Storage Locations
- Backup and Recovery Procedures
- Security Controls and Encryption

#### 3. Account Information
**Required Fields:**
- Account Owner/Administrator
- User Account Details
- Access Credentials (stored securely)
- License Information
- Billing and Payment Details
- Vendor Contact Information

#### 4. Compliance Information
**Required Fields:**
- Industry Standard Compliance (ISO 27001, SOC 2, etc.)
- Regulatory Compliance (GDPR, HIPAA, etc.)
- Data Protection Measures
- Audit and Certification Status
- Terms of Service Compliance
- Data Residency Requirements

### Registry Creation Process

#### Step 1: Initial Documentation
1. Create registry entry for each discovered application
2. Populate all available information from discovery process
3. Identify information gaps requiring additional research
4. Assign priority based on business criticality

#### Step 2: Information Gathering
1. Contact vendors for compliance and security information
2. Review application documentation and terms of service
3. Conduct security assessment if required
4. Validate compliance with organizational standards

#### Step 3: Risk Assessment
1. Evaluate security risks and vulnerabilities
2. Assess compliance gaps and requirements
3. Determine data protection adequacy
4. Identify remediation requirements

#### Step 4: Approval and Validation
1. Department head approval for business criticality
2. Security team approval for security compliance
3. Legal team approval for regulatory compliance
4. ICT approval for technical standards

## Application Handover Procedures

### Handover Planning

#### 1. Successor Identification
**Process:**
1. Department head identifies designated successor
2. Validate successor's role and responsibilities
3. Confirm successor's technical competency
4. Obtain successor's agreement to assume application ownership

**Documentation:**
- Successor designation form
- Role and responsibility transfer agreement
- Technical competency validation
- Training and support requirements

#### 2. Handover Timeline
**Standard Applications:** 1-2 weeks before departure
**Critical Applications:** 2-6 weeks before departure
**Complex Applications:** Up to 6 months before departure (extended notice period)

#### 3. Handover Plan Creation
**Components:**
- Application-specific handover procedures
- Knowledge transfer requirements
- Training and documentation needs
- Risk mitigation measures
- Rollback procedures if needed

### Account Transfer Procedures

#### 1. Vendor Coordination
**Pre-Transfer Activities:**
1. Contact vendor to understand account transfer procedures
2. Review terms of service for account transfer requirements
3. Identify any restrictions or limitations
4. Obtain vendor approval for account transfer

**Transfer Process:**
1. Initiate account transfer request with vendor
2. Update account contact information
3. Transfer billing and payment responsibilities
4. Update administrative access and permissions
5. Verify successful transfer completion

#### 2. Data Migration
**Data Assessment:**
1. Inventory all company data in the application
2. Identify critical data requiring preservation
3. Determine data export/migration procedures
4. Plan for data backup and archival

**Migration Process:**
1. Export critical data from departing employee's account
2. Import data into successor's account or shared location
3. Verify data integrity and completeness
4. Update data access permissions and sharing settings
5. Archive original data according to retention policies

#### 3. Access Credential Management
**Credential Transfer:**
1. Generate new access credentials for successor
2. Securely transfer credentials using approved methods
3. Update password management systems
4. Revoke departing employee's access credentials
5. Document credential transfer in security logs

### Knowledge Transfer

#### 1. Documentation Creation
**Standard Operating Procedures:**
- Step-by-step application usage procedures
- Administrative tasks and responsibilities
- Troubleshooting and support procedures
- Vendor contact information and escalation procedures
- Integration points with other systems

**Process Documentation:**
- Business processes supported by the application
- Workflow and approval procedures
- Reporting and analytics procedures
- Data management and backup procedures
- Compliance and audit requirements

#### 2. Training and Handover Sessions
**Knowledge Transfer Sessions:**
1. Schedule comprehensive handover meetings
2. Demonstrate critical application functions
3. Review administrative procedures and responsibilities
4. Provide hands-on training for complex tasks
5. Document any questions or concerns

**Ongoing Support:**
1. Establish support contact for post-handover questions
2. Schedule follow-up sessions if needed
3. Provide access to vendor support resources
4. Document lessons learned for future handovers

## Data Recovery and Migration

### Data Assessment and Planning

#### 1. Data Inventory
**Company Data Identification:**
- Customer and client information
- Financial and business records
- Intellectual property and proprietary information
- Project documentation and deliverables
- Communication records and correspondence

**Data Classification:**
- Confidential: Highly sensitive company information
- Internal: Company information for internal use
- Public: Information approved for external sharing
- Personal: Employee personal information (to be excluded)

#### 2. Recovery Planning
**Recovery Priorities:**
1. Critical business data required for operations
2. Customer-facing information and records
3. Project documentation and deliverables
4. Historical records and archives
5. Reference materials and documentation

**Recovery Methods:**
- Direct data export from applications
- API-based data extraction
- Screen scraping for non-exportable data
- Manual documentation of critical information
- Vendor-assisted data recovery

### Data Migration Process

#### 1. Pre-Migration Activities
**Preparation:**
1. Identify target storage locations for migrated data
2. Prepare data import procedures and tools
3. Validate data format compatibility
4. Plan for data transformation if required
5. Establish data validation procedures

#### 2. Migration Execution
**Data Export:**
1. Execute data export procedures from source applications
2. Verify export completeness and integrity
3. Document any export limitations or issues
4. Secure exported data during transfer process
5. Maintain audit trail of export activities

**Data Import:**
1. Import data into target systems or storage locations
2. Validate data integrity and completeness
3. Update data access permissions and security settings
4. Test data accessibility and functionality
5. Document import results and any issues

#### 3. Post-Migration Validation
**Data Verification:**
1. Compare source and target data for completeness
2. Validate data format and structure integrity
3. Test data accessibility by authorized users
4. Verify data security and access controls
5. Document validation results and sign-off

### Data Retention and Archival

#### 1. Retention Policy Application
**Retention Requirements:**
- Legal and regulatory retention requirements
- Business operational requirements
- Audit and compliance requirements
- Historical reference requirements

**Retention Procedures:**
1. Apply appropriate retention policies to migrated data
2. Establish archival procedures for long-term storage
3. Implement secure deletion procedures for expired data
4. Document retention decisions and justifications
5. Schedule periodic retention policy reviews

## Vendor Coordination

### Vendor Communication

#### 1. Initial Contact
**Vendor Notification:**
1. Identify appropriate vendor contact (account manager, support, legal)
2. Notify vendor of employee departure and account transfer requirements
3. Request information about account transfer procedures
4. Obtain vendor cooperation agreement for transfer process
5. Document vendor response and cooperation level

#### 2. Account Transfer Coordination
**Transfer Process:**
1. Follow vendor-specific account transfer procedures
2. Provide required documentation and authorizations
3. Coordinate timing of transfer activities
4. Monitor transfer progress and resolve issues
5. Obtain vendor confirmation of successful transfer

### Vendor Relationship Management

#### 1. Ongoing Relationship
**Relationship Continuity:**
1. Update vendor contact information with new account owner
2. Transfer vendor relationship management responsibilities
3. Ensure continued access to vendor support and services
4. Update billing and payment arrangements
5. Maintain vendor partnership agreements and contracts

#### 2. Support and Service Continuity
**Service Continuity:**
1. Verify continued access to vendor support services
2. Transfer support case history and documentation
3. Update support contact information and escalation procedures
4. Ensure continued access to vendor training and resources
5. Validate service level agreement compliance

### Vendor Compliance Verification

#### 1. Compliance Assessment
**Vendor Compliance Review:**
1. Verify vendor compliance with industry standards
2. Review vendor security and data protection measures
3. Validate vendor audit and certification status
4. Assess vendor data residency and sovereignty compliance
5. Document compliance verification results

#### 2. Ongoing Monitoring
**Compliance Monitoring:**
1. Establish ongoing vendor compliance monitoring procedures
2. Schedule periodic compliance reviews and assessments
3. Monitor vendor security incident notifications
4. Track vendor certification renewals and updates
5. Maintain vendor compliance documentation

## Compliance Verification

### Industry Standards Compliance

#### 1. Standards Assessment
**Compliance Framework:**
- ISO/IEC 27001: Information Security Management
- SOC 2: Security, Availability, and Confidentiality
- ISO/IEC 27017: Cloud Security
- ISO/IEC 27018: Cloud Privacy
- NIST Cybersecurity Framework

**Assessment Process:**
1. Review application compliance documentation
2. Verify vendor certifications and audit reports
3. Assess application security controls and measures
4. Validate data protection and privacy controls
5. Document compliance status and gaps

#### 2. Regulatory Compliance
**Regulatory Framework:**
- GDPR: General Data Protection Regulation
- CCPA: California Consumer Privacy Act
- HIPAA: Health Insurance Portability and Accountability Act
- SOX: Sarbanes-Oxley Act
- Industry-specific regulations

**Compliance Verification:**
1. Review regulatory requirements applicable to application
2. Assess application compliance with regulatory requirements
3. Verify data protection and privacy compliance measures
4. Validate audit trail and reporting capabilities
5. Document regulatory compliance status

### Compliance Documentation

#### 1. Compliance Records
**Documentation Requirements:**
- Compliance assessment reports
- Vendor certification documentation
- Audit reports and findings
- Risk assessment and mitigation plans
- Compliance monitoring reports

#### 2. Audit Trail
**Audit Documentation:**
1. Maintain comprehensive audit trail of all offboarding activities
2. Document compliance verification procedures and results
3. Record vendor communications and agreements
4. Track data transfer and migration activities
5. Preserve evidence for compliance audits

## Extended Notice Period Framework

### Extended Notice Period Criteria

#### 1. Application Criticality Assessment
**Critical Application Indicators:**
- Business-critical functions with no alternatives
- Customer-facing applications with service dependencies
- Applications with complex data structures or integrations
- Applications requiring specialized knowledge or training
- Applications with significant compliance or regulatory requirements

#### 2. Handover Complexity Assessment
**Complexity Factors:**
- Number of integrated systems and dependencies
- Volume and complexity of data to be transferred
- Specialized knowledge and training requirements
- Vendor cooperation and transfer procedure complexity
- Regulatory and compliance requirements

### Extended Notice Period Process

#### 1. Assessment and Approval
**Process Steps:**
1. Conduct initial application criticality assessment
2. Evaluate handover complexity and requirements
3. Estimate required handover timeline
4. Prepare business case for extended notice period
5. Obtain approval from department head and HR

#### 2. Extended Notice Period Implementation
**Implementation Framework:**
- **1-3 Months:** Standard complex applications
- **3-6 Months:** Business-critical applications with high complexity
- **6+ Months:** Mission-critical applications with regulatory requirements

**Extended Period Activities:**
1. Detailed application documentation and knowledge transfer
2. Comprehensive successor training and certification
3. Gradual transition of responsibilities and access
4. Parallel operation period with oversight
5. Final validation and sign-off procedures

### Legal and Employment Considerations

#### 1. Employment Law Compliance
**Legal Requirements:**
1. Ensure compliance with employment law notice requirements
2. Obtain legal approval for extended notice periods
3. Document business justification for extended periods
4. Ensure fair and consistent application of policies
5. Maintain employee rights and protections

#### 2. Contractual Arrangements
**Contract Modifications:**
1. Update employment contracts to include extended notice provisions
2. Define circumstances requiring extended notice periods
3. Establish compensation and benefit arrangements for extended periods
4. Include application handover requirements in job descriptions
5. Obtain employee agreement to extended notice provisions

## Risk Mitigation Strategies

### Security Risk Mitigation

#### 1. Access Control Risks
**Risk:** Unauthorized access to applications post-departure
**Mitigation Strategies:**
- Immediate access revocation upon departure
- Multi-factor authentication for critical applications
- Regular access reviews and audits
- Automated access monitoring and alerting
- Secure credential management and rotation

#### 2. Data Loss Risks
**Risk:** Loss of company data in individual applications
**Mitigation Strategies:**
- Comprehensive data backup before account transfer
- Multiple data export methods and formats
- Data validation and integrity checks
- Secure data storage and archival procedures
- Regular data recovery testing and validation

### Business Continuity Risks

#### 1. Service Disruption Risks
**Risk:** Business disruption during application handover
**Mitigation Strategies:**
- Parallel operation during transition period
- Backup procedures and alternative solutions
- Comprehensive testing before final cutover
- Rollback procedures if issues arise
- 24/7 support during critical transition periods

#### 2. Knowledge Loss Risks
**Risk:** Loss of critical knowledge and expertise
**Mitigation Strategies:**
- Comprehensive documentation of procedures and processes
- Multiple knowledge transfer sessions and training
- Video recording of critical procedures
- Mentoring and shadowing programs
- Knowledge base creation and maintenance

### Compliance Risks

#### 1. Regulatory Compliance Risks
**Risk:** Non-compliance with regulatory requirements
**Mitigation Strategies:**
- Comprehensive compliance assessment and verification
- Legal review of all transfer procedures
- Audit trail maintenance and documentation
- Regular compliance monitoring and reporting
- Incident response procedures for compliance issues

#### 2. Vendor Compliance Risks
**Risk:** Vendor non-compliance with security and privacy requirements
**Mitigation Strategies:**
- Vendor compliance verification and monitoring
- Regular vendor security assessments
- Contractual compliance requirements and penalties
- Alternative vendor identification and evaluation
- Vendor relationship management and oversight

## Templates and Checklists

### Application Discovery Template

#### Employee Application Disclosure Form
```
Employee Information:
- Name: _______________
- Department: _______________
- Role: _______________
- Departure Date: _______________

Application Information:
For each application used for business purposes:

1. Application Name: _______________
2. Vendor/Provider: _______________
3. Application URL: _______________
4. Business Purpose: _______________
5. Account Type: [Individual/Shared/Administrative]
6. Data Stored: _______________
7. Business Criticality: [Critical/Important/Standard]
8. Integration Points: _______________
9. Vendor Contact: _______________
10. Notes: _______________

Employee Certification:
I certify that I have disclosed all applications used for business purposes during my employment and will cooperate fully with the handover process.

Employee Signature: _______________ Date: _______________
```

### Application Registry Template

#### Application Registry Entry
```
Application Metadata:
- Application ID: _______________
- Application Name: _______________
- Vendor/Provider: _______________
- Category: _______________
- Business Purpose: _______________
- Department: _______________
- Business Criticality: [Critical/Important/Standard]
- Data Sensitivity: [Confidential/Internal/Public]

Technical Information:
- Application URL: _______________
- Authentication Method: _______________
- Integration Points: _______________
- Data Storage Location: _______________
- Backup Procedures: _______________
- Security Controls: _______________

Account Information:
- Account Owner: _______________
- Account Type: _______________
- Access Credentials: [Stored Securely]
- License Information: _______________
- Billing Details: _______________
- Vendor Contact: _______________

Compliance Information:
- Industry Standards: _______________
- Regulatory Compliance: _______________
- Data Protection: _______________
- Audit Status: _______________
- Terms of Service: _______________
- Data Residency: _______________

Handover Information:
- Designated Successor: _______________
- Handover Date: _______________
- Transfer Status: _______________
- Documentation Status: _______________
- Training Status: _______________
- Verification Status: _______________
```

### Handover Checklist Template

#### Application Handover Checklist
```
Pre-Handover Preparation:
□ Application discovery completed
□ Application registry created
□ Successor identified and approved
□ Vendor contacted and procedures confirmed
□ Handover plan created and approved
□ Extended notice period approved (if required)

Account Transfer:
□ Vendor account transfer initiated
□ Contact information updated
□ Billing information transferred
□ Administrative access transferred
□ Access credentials updated
□ Transfer completion verified

Data Migration:
□ Company data identified and inventoried
□ Data export procedures executed
□ Data integrity verified
□ Data imported to target location
□ Data access permissions updated
□ Data validation completed

Knowledge Transfer:
□ Standard Operating Procedures documented
□ Process documentation created
□ Training sessions completed
□ Hands-on demonstration provided
□ Questions and concerns addressed
□ Ongoing support arrangements established

Compliance Verification:
□ Industry standards compliance verified
□ Regulatory compliance confirmed
□ Security controls validated
□ Data protection measures confirmed
□ Audit trail documented
□ Legal review completed

Post-Handover Validation:
□ Application access verified
□ Data accessibility confirmed
□ Successor competency validated
□ Vendor relationship transferred
□ Support continuity confirmed
□ Final sign-off obtained

Handover Completion:
□ All checklist items completed
□ Documentation archived
□ Lessons learned documented
□ Process improvements identified
□ Final approval obtained
□ Handover certified complete
```

### Risk Assessment Template

#### Application Risk Assessment
```
Application Information:
- Application Name: _______________
- Business Criticality: [Critical/Important/Standard]
- Data Sensitivity: [Confidential/Internal/Public]

Security Risk Assessment:
- Authentication Security: [High/Medium/Low]
- Data Encryption: [High/Medium/Low]
- Access Controls: [High/Medium/Low]
- Vendor Security: [High/Medium/Low]
- Overall Security Risk: [High/Medium/Low]

Compliance Risk Assessment:
- Industry Standards: [Compliant/Partial/Non-Compliant]
- Regulatory Requirements: [Compliant/Partial/Non-Compliant]
- Data Protection: [Compliant/Partial/Non-Compliant]
- Overall Compliance Risk: [High/Medium/Low]

Business Risk Assessment:
- Service Availability: [High/Medium/Low]
- Data Recovery: [High/Medium/Low]
- Knowledge Transfer: [High/Medium/Low]
- Vendor Cooperation: [High/Medium/Low]
- Overall Business Risk: [High/Medium/Low]

Risk Mitigation Plan:
- Identified Risks: _______________
- Mitigation Strategies: _______________
- Contingency Plans: _______________
- Monitoring Procedures: _______________
- Escalation Procedures: _______________

Risk Assessment Approval:
- Security Team: _______________ Date: _______________
- Legal Team: _______________ Date: _______________
- Department Head: _______________ Date: _______________
```

## Conclusion

These Standard Operating Procedures provide a comprehensive framework for managing application offboarding risks and ensuring business continuity during employee departures. By following these procedures, organizations can:

- Prevent data loss and business disruption
- Ensure compliance with industry standards and regulations
- Mitigate security risks including ransomware and unauthorized access
- Maintain vendor relationships and service continuity
- Establish clear accountability and documentation

Regular review and continuous improvement of these procedures will ensure they remain effective and aligned with changing business needs, regulatory requirements, and industry best practices.

---

**Document Control**

| Version | Date | Author/Owner | Description/Change Summary |
|---------|------|--------------|---------------------------|
| 1.0 | [Current Date] | ICT Governance Council | Initial version - Comprehensive employee application offboarding SOPs |

**Document Owner:** ICT Governance Council  
**Next Review Date:** [Quarterly Review Date]  
**Distribution:** Internal Use - HR, ICT, Security, Legal Teams