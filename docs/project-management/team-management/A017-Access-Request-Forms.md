# A017 - Access Request Forms and Procedures

**Project:** ICT Governance Framework Application  
**Document Type:** Supporting Templates - Access Management  
**Version:** 1.0  
**Date:** 2025-01-27  
**Owner:** IT Security, Project Manager  

---

## Access Management Overview

### Purpose
This document provides standardized forms and procedures for requesting, approving, and provisioning system access for ICT Governance Framework project team members.

### Scope
- Core team member access provisioning
- Extended team and contractor access
- Temporary and emergency access procedures
- Access modification and termination processes

### Security Principles
- **Least Privilege:** Users receive minimum access required for their role
- **Need-to-Know:** Access is granted based on business need and role requirements
- **Segregation of Duties:** Conflicting access rights are identified and managed
- **Regular Review:** Access rights are reviewed and validated regularly

---

## 1. Standard Access Request Form

### ICT Governance Framework Project - Access Request Form

#### **Section A: Requestor Information**
- **Employee ID:** _______________
- **Full Name:** _______________
- **Department:** _______________
- **Manager:** _______________
- **Email Address:** _______________
- **Phone Number:** _______________
- **Start Date:** _______________
- **End Date (if temporary):** _______________

#### **Section B: Role and Project Information**
- **Project Role:** _______________
- **FTE Allocation:** _______________
- **Project Duration:** _______________
- **Reporting Manager:** _______________
- **Business Justification:** _______________
- **Security Clearance Level:** _______________

#### **Section C: System Access Requirements**

| **System/Application** | **Access Level** | **Business Justification** | **Data Classification** |
|----------------------|------------------|---------------------------|------------------------|
| Azure DevOps | [ ] Read [ ] Contribute [ ] Admin | | [ ] Public [ ] Internal [ ] Confidential [ ] Restricted |
| Microsoft 365 | [ ] Standard [ ] Advanced [ ] Admin | | [ ] Public [ ] Internal [ ] Confidential [ ] Restricted |
| SharePoint Sites | [ ] Read [ ] Contribute [ ] Admin | | [ ] Public [ ] Internal [ ] Confidential [ ] Restricted |
| Power BI | [ ] Viewer [ ] Creator [ ] Admin | | [ ] Public [ ] Internal [ ] Confidential [ ] Restricted |
| Azure Portal | [ ] Reader [ ] Contributor [ ] Owner | | [ ] Public [ ] Internal [ ] Confidential [ ] Restricted |
| SQL Databases | [ ] Read [ ] Write [ ] Admin | | [ ] Public [ ] Internal [ ] Confidential [ ] Restricted |
| Governance Platform | [ ] User [ ] Power User [ ] Admin | | [ ] Public [ ] Internal [ ] Confidential [ ] Restricted |
| Compliance Systems | [ ] Read [ ] Write [ ] Admin | | [ ] Public [ ] Internal [ ] Confidential [ ] Restricted |
| Other (specify): | [ ] Read [ ] Write [ ] Admin | | [ ] Public [ ] Internal [ ] Confidential [ ] Restricted |

#### **Section D: Special Access Requirements**
- **Privileged Access Required:** [ ] Yes [ ] No
- **Administrative Rights:** [ ] Yes [ ] No
- **External System Access:** [ ] Yes [ ] No
- **VPN Access Required:** [ ] Yes [ ] No
- **Mobile Device Access:** [ ] Yes [ ] No
- **After-Hours Access:** [ ] Yes [ ] No

#### **Section E: Approval Workflow**

| **Approval Level** | **Name** | **Title** | **Signature** | **Date** |
|-------------------|----------|-----------|---------------|----------|
| **Direct Manager** | | | | |
| **Project Manager** | | | | |
| **Resource Manager** | | | | |
| **IT Security** | | | | |
| **Data Owner** (if applicable) | | | | |
| **Executive Sponsor** (if required) | | | | |

#### **Section F: IT Administration**
- **Request ID:** _______________
- **Received Date:** _______________
- **Processed By:** _______________
- **Completion Date:** _______________
- **Account Details:** _______________
- **Notes:** _______________

---

## 2. Role-Based Access Templates

### 2.1 Project Manager Access Template

#### **Standard Access Package**
- **Azure DevOps:** Project Administrator
- **Microsoft 365:** Advanced User (Teams, SharePoint, Power BI)
- **SharePoint:** Site Collection Administrator
- **Power BI:** Workspace Administrator
- **Azure Portal:** Contributor (Resource Groups)
- **Governance Platform:** System Administrator
- **Project Management Tools:** Administrator
- **Budget/Financial Systems:** Read Access

#### **Security Requirements**
- **Multi-Factor Authentication:** Required
- **Conditional Access:** Standard Business Policy
- **Data Classification:** Up to Confidential
- **Audit Logging:** Full Activity Logging
- **Session Timeout:** 8 hours

### 2.2 Technical Lead Access Template

#### **Standard Access Package**
- **Azure DevOps:** Project Administrator
- **Azure Portal:** Owner (Development/Test), Contributor (Production)
- **SQL Databases:** db_owner (Dev/Test), db_datareader (Production)
- **Governance Platform:** Technical Administrator
- **Development Tools:** Full Access
- **Monitoring Systems:** Administrator
- **Infrastructure Tools:** Administrator

#### **Security Requirements**
- **Multi-Factor Authentication:** Required
- **Conditional Access:** Privileged User Policy
- **Data Classification:** Up to Confidential
- **Privileged Access Management:** Required for Production
- **Session Timeout:** 4 hours

### 2.3 Business Analyst Lead Access Template

#### **Standard Access Package**
- **Microsoft 365:** Advanced User
- **SharePoint:** Site Owner (Requirements Sites)
- **Power BI:** Content Creator
- **Governance Platform:** Business Administrator
- **Requirements Tools:** Administrator
- **Stakeholder Systems:** Read Access
- **Documentation Systems:** Contributor

#### **Security Requirements**
- **Multi-Factor Authentication:** Required
- **Conditional Access:** Standard Business Policy
- **Data Classification:** Up to Confidential
- **Audit Logging:** Standard Activity Logging
- **Session Timeout:** 8 hours

### 2.4 Security Architect Access Template

#### **Standard Access Package**
- **Azure Portal:** Security Reader (All), Contributor (Security Resources)
- **Security Center:** Administrator
- **Azure Sentinel:** Contributor
- **Key Vault:** Administrator
- **Identity Management:** Administrator
- **Compliance Systems:** Administrator
- **Security Tools:** Administrator

#### **Security Requirements**
- **Multi-Factor Authentication:** Required
- **Conditional Access:** Privileged User Policy
- **Data Classification:** Up to Restricted
- **Privileged Access Management:** Required
- **Session Timeout:** 2 hours
- **Additional Monitoring:** Enhanced Security Monitoring

---

## 3. Access Approval Matrix

### 3.1 Approval Requirements by Access Level

| **Access Level** | **Manager** | **Project Manager** | **Resource Manager** | **IT Security** | **Data Owner** | **Executive Sponsor** |
|------------------|-------------|-------------------|-------------------|----------------|---------------|---------------------|
| **Standard User** | Required | Required | - | Review | - | - |
| **Power User** | Required | Required | Required | Required | - | - |
| **Administrator** | Required | Required | Required | Required | Required | - |
| **Privileged** | Required | Required | Required | Required | Required | Required |

### 3.2 Approval Requirements by Data Classification

| **Data Classification** | **Manager** | **Project Manager** | **IT Security** | **Data Owner** | **Executive Sponsor** |
|------------------------|-------------|-------------------|----------------|---------------|---------------------|
| **Public** | Required | - | - | - | - |
| **Internal** | Required | Required | - | - | - |
| **Confidential** | Required | Required | Required | Required | - |
| **Restricted** | Required | Required | Required | Required | Required |

### 3.3 Special Approval Requirements

#### **Privileged Access**
- **Business Justification:** Detailed justification required
- **Time Limitation:** Maximum 90 days, renewable
- **Additional Monitoring:** Enhanced logging and monitoring
- **Regular Review:** Monthly access review required

#### **External System Access**
- **Vendor Approval:** Vendor security approval required
- **Legal Review:** Contract and legal review required
- **Additional Controls:** VPN, additional MFA requirements
- **Audit Requirements:** Enhanced audit logging

#### **Emergency Access**
- **Executive Approval:** Executive sponsor approval required
- **Time Limitation:** Maximum 24 hours
- **Monitoring:** Real-time monitoring required
- **Documentation:** Detailed justification and activity log

---

## 4. Access Provisioning Procedures

### 4.1 Standard Provisioning Workflow

#### **Step 1: Request Submission**
1. Complete access request form
2. Obtain required approvals
3. Submit to IT Service Desk
4. Receive request confirmation and tracking number

#### **Step 2: Security Review**
1. IT Security reviews request
2. Validates business justification
3. Confirms appropriate access level
4. Approves or requests modifications

#### **Step 3: Account Provisioning**
1. Create user accounts and groups
2. Assign appropriate permissions
3. Configure security settings
4. Test access functionality

#### **Step 4: Validation and Delivery**
1. Validate access works correctly
2. Document account details
3. Notify user of account creation
4. Provide access instructions and training

### 4.2 Expedited Provisioning (Critical Roles)

#### **Eligibility Criteria**
- Core team leadership roles
- Critical project timeline dependencies
- Executive sponsor approval

#### **Expedited Process**
1. **Immediate Review:** Security review within 4 hours
2. **Priority Provisioning:** Account creation within 8 hours
3. **Temporary Access:** Interim access while full provisioning completes
4. **Follow-up Validation:** Complete validation within 24 hours

### 4.3 Emergency Access Procedures

#### **Emergency Criteria**
- Critical system outage affecting project
- Security incident requiring immediate response
- Executive directive for urgent access

#### **Emergency Process**
1. **Verbal Approval:** Executive sponsor verbal approval
2. **Immediate Provisioning:** Access granted within 2 hours
3. **Documentation:** Complete documentation within 24 hours
4. **Review and Validation:** Emergency access review within 48 hours

---

## 5. Access Monitoring and Compliance

### 5.1 Ongoing Access Management

#### **Regular Access Reviews**
- **Monthly Reviews:** Privileged and administrative access
- **Quarterly Reviews:** All project team access
- **Annual Reviews:** Comprehensive access certification
- **Event-Driven Reviews:** Role changes, project phase transitions

#### **Access Monitoring**
- **Login Monitoring:** Track login patterns and anomalies
- **Activity Monitoring:** Monitor user activity and data access
- **Privilege Monitoring:** Monitor use of privileged access
- **Compliance Monitoring:** Ensure ongoing compliance with policies

### 5.2 Access Modification Procedures

#### **Role Change Process**
1. **Change Request:** Submit role change request form
2. **Impact Assessment:** Assess access impact of role change
3. **Approval Workflow:** Follow standard approval process
4. **Access Adjustment:** Modify access rights accordingly
5. **Validation:** Validate new access is appropriate

#### **Temporary Access Modification**
1. **Temporary Request:** Submit temporary access request
2. **Time-Limited Approval:** Approve with specific end date
3. **Automated Removal:** System automatically removes access
4. **Extension Process:** Formal process for access extension

### 5.3 Access Termination Procedures

#### **Standard Termination Process**
1. **Termination Notice:** HR provides termination notice
2. **Access Inventory:** Identify all access rights
3. **Immediate Revocation:** Revoke access immediately
4. **Account Cleanup:** Clean up accounts and data
5. **Audit Trail:** Document termination activities

#### **Emergency Termination Process**
1. **Immediate Suspension:** Suspend all access immediately
2. **Security Review:** Conduct security impact assessment
3. **Investigation:** Investigate any security concerns
4. **Final Cleanup:** Complete account cleanup and documentation

---

## 6. Security Training and Awareness

### 6.1 Mandatory Training Requirements

#### **General Security Awareness**
- **Duration:** 2 hours online training
- **Content:** Security policies, data classification, incident reporting
- **Frequency:** Annual with quarterly updates
- **Completion:** Required before access provisioning

#### **Role-Specific Security Training**
- **Duration:** 1-4 hours based on access level
- **Content:** Role-specific security requirements and procedures
- **Frequency:** Annual or upon role change
- **Completion:** Required for privileged access roles

#### **Data Classification Training**
- **Duration:** 1 hour specialized training
- **Content:** Data classification, handling, and protection requirements
- **Frequency:** Annual
- **Completion:** Required for confidential data access

### 6.2 Ongoing Security Awareness

#### **Security Communications**
- **Monthly Security Tips:** Email communications on security topics
- **Quarterly Security Updates:** Updates on new threats and procedures
- **Incident Notifications:** Communications about security incidents
- **Policy Updates:** Notifications of policy and procedure changes

#### **Security Assessments**
- **Phishing Simulations:** Quarterly phishing simulation exercises
- **Security Surveys:** Annual security awareness surveys
- **Compliance Assessments:** Regular compliance knowledge assessments
- **Incident Response Drills:** Annual incident response exercises

---

## 7. Audit and Compliance Documentation

### 7.1 Required Documentation

#### **Access Request Documentation**
- **Original Request Forms:** Complete access request forms with approvals
- **Approval Workflow:** Documentation of approval process and decisions
- **Provisioning Records:** Technical records of account creation and configuration
- **Validation Results:** Evidence of access testing and validation

#### **Ongoing Management Documentation**
- **Access Review Reports:** Regular access review results and actions
- **Monitoring Reports:** Access monitoring and compliance reports
- **Incident Reports:** Security incident reports and remediation actions
- **Training Records:** Security training completion and assessment results

### 7.2 Audit Requirements

#### **Internal Audits**
- **Quarterly Access Audits:** Review access rights and compliance
- **Annual Security Audits:** Comprehensive security and access audit
- **Event-Driven Audits:** Audits triggered by security incidents
- **Compliance Audits:** Audits for regulatory compliance requirements

#### **External Audits**
- **Regulatory Audits:** Support for regulatory compliance audits
- **Third-Party Audits:** Support for vendor and partner audits
- **Certification Audits:** Support for security certification audits
- **Customer Audits:** Support for customer security assessments

### 7.3 Compliance Reporting

#### **Regular Reports**
- **Monthly Access Reports:** Summary of access provisioning and changes
- **Quarterly Compliance Reports:** Compliance status and metrics
- **Annual Security Reports:** Comprehensive security and access summary
- **Exception Reports:** Reports of policy exceptions and violations

#### **Ad-Hoc Reports**
- **Incident Reports:** Security incident impact and remediation
- **Audit Response Reports:** Responses to audit findings and recommendations
- **Executive Briefings:** Executive summaries of security and access status
- **Regulatory Submissions:** Reports required for regulatory compliance

---

## 8. Forms and Templates

### 8.1 Access Request Forms
- **Standard Access Request Form:** [Section 1 above]
- **Emergency Access Request Form:** [Simplified version for emergencies]
- **Access Modification Form:** [For role changes and modifications]
- **Access Termination Form:** [For access removal and cleanup]

### 8.2 Approval Templates
- **Manager Approval Template:** [Standard approval format for managers]
- **Security Approval Template:** [Security review and approval format]
- **Executive Approval Template:** [Executive approval for privileged access]
- **Emergency Approval Template:** [Emergency approval documentation]

### 8.3 Monitoring and Review Templates
- **Access Review Template:** [Regular access review documentation]
- **Compliance Assessment Template:** [Compliance evaluation format]
- **Incident Report Template:** [Security incident documentation]
- **Audit Response Template:** [Audit finding response format]

---

**Document Control:**
- **Version:** 1.0
- **Prepared by:** IT Security Manager
- **Reviewed by:** Project Manager, Compliance Officer
- **Approved by:** CISO, Executive Sponsor
- **Next Review:** Quarterly

---

*These access request forms and procedures ensure secure, compliant, and efficient provisioning of system access for ICT Governance Framework project team members while maintaining appropriate security controls and audit trails.*