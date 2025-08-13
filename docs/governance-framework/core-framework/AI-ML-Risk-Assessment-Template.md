# AI/ML Risk Assessment Template
## Comprehensive Risk Assessment for Artificial Intelligence and Machine Learning Systems

---

## Document Information
| Field | Value |
|-------|-------|
| **Template Owner** | AI Ethics Review Board |
| **Version** | 1.0 |
| **Last Updated** | [Current Date] |
| **Review Cycle** | Semi-Annual |
| **Classification** | Internal |

---

## Assessment Overview

### System Information
| Field | Value | Notes |
|-------|-------|-------|
| **System Name** | [AI/ML System Name] | |
| **System Type** | [Machine Learning / Deep Learning / NLP / Computer Vision / Other] | |
| **Development Stage** | [Concept / Development / Testing / Deployment / Production] | |
| **Business Owner** | [Name and Department] | |
| **Technical Owner** | [Name and Department] | |
| **Assessment Date** | [Date] | |
| **Assessor** | [Name and Role] | |
| **Assessment ID** | [Unique Identifier] | |

### System Classification
| Classification Level | Criteria Met | Justification |
|---------------------|--------------|---------------|
| **Prohibited AI** | [Yes/No] | [Explanation if Yes] |
| **High-Risk AI** | [Yes/No] | [Explanation if Yes] |
| **Limited Risk AI** | [Yes/No] | [Explanation if Yes] |
| **Minimal Risk AI** | [Yes/No] | [Explanation if Yes] |

---

## 1. Business Context and Use Case

### 1.1 Business Purpose
| Field | Description |
|-------|-------------|
| **Primary Business Objective** | [Describe the main business goal this AI system addresses] |
| **Target Users** | [Identify who will use or be affected by this system] |
| **Use Case Description** | [Detailed description of how the system will be used] |
| **Decision Impact** | [Describe the types of decisions the AI system will make or influence] |
| **Human Involvement** | [Describe the level of human oversight and intervention] |

### 1.2 Stakeholder Impact
| Stakeholder Group | Impact Level | Impact Description |
|-------------------|--------------|-------------------|
| **Internal Users** | [High/Medium/Low] | [Describe impact on employees and internal stakeholders] |
| **External Customers** | [High/Medium/Low] | [Describe impact on customers and clients] |
| **General Public** | [High/Medium/Low] | [Describe impact on broader society] |
| **Vulnerable Groups** | [High/Medium/Low] | [Describe impact on protected or vulnerable populations] |

---

## 2. Technical Risk Assessment

### 2.1 Data Risks

#### 2.1.1 Training Data Assessment
| Risk Factor | Risk Level | Assessment | Mitigation |
|-------------|------------|------------|------------|
| **Data Quality** | [1-5] | [Assessment of data completeness, accuracy, consistency] | [Mitigation strategies] |
| **Data Representativeness** | [1-5] | [Assessment of population coverage and diversity] | [Mitigation strategies] |
| **Data Bias** | [1-5] | [Assessment of historical, selection, and confirmation bias] | [Mitigation strategies] |
| **Data Privacy** | [1-5] | [Assessment of personal data exposure and protection] | [Mitigation strategies] |
| **Data Lineage** | [1-5] | [Assessment of data source tracking and provenance] | [Mitigation strategies] |

#### 2.1.2 Data Governance Compliance
| Requirement | Compliant | Evidence | Notes |
|-------------|-----------|----------|-------|
| **Data Minimization** | [Yes/No/Partial] | [Evidence of compliance] | [Additional notes] |
| **Purpose Limitation** | [Yes/No/Partial] | [Evidence of compliance] | [Additional notes] |
| **Consent Management** | [Yes/No/Partial] | [Evidence of compliance] | [Additional notes] |
| **Data Subject Rights** | [Yes/No/Partial] | [Evidence of compliance] | [Additional notes] |
| **Cross-Border Transfer** | [Yes/No/Partial] | [Evidence of compliance] | [Additional notes] |

### 2.2 Model Risks

#### 2.2.1 Model Performance and Reliability
| Risk Factor | Risk Level | Assessment | Mitigation |
|-------------|------------|------------|------------|
| **Model Accuracy** | [1-5] | [Overall model performance assessment] | [Mitigation strategies] |
| **Model Robustness** | [1-5] | [Performance under adversarial conditions] | [Mitigation strategies] |
| **Model Generalization** | [1-5] | [Performance on unseen data] | [Mitigation strategies] |
| **Model Drift** | [1-5] | [Susceptibility to performance degradation over time] | [Mitigation strategies] |
| **Model Interpretability** | [1-5] | [Ability to explain model decisions] | [Mitigation strategies] |

#### 2.2.2 Algorithmic Fairness
| Fairness Metric | Target Value | Actual Value | Assessment | Mitigation |
|-----------------|--------------|--------------|------------|------------|
| **Demographic Parity** | [Target] | [Measured] | [Pass/Fail] | [Actions if needed] |
| **Equalized Odds** | [Target] | [Measured] | [Pass/Fail] | [Actions if needed] |
| **Calibration** | [Target] | [Measured] | [Pass/Fail] | [Actions if needed] |
| **Individual Fairness** | [Target] | [Measured] | [Pass/Fail] | [Actions if needed] |

#### 2.2.3 Protected Characteristics Analysis
| Protected Characteristic | Data Available | Bias Testing Conducted | Results | Mitigation |
|-------------------------|----------------|------------------------|---------|------------|
| **Race/Ethnicity** | [Yes/No] | [Yes/No] | [Results summary] | [Mitigation plan] |
| **Gender** | [Yes/No] | [Yes/No] | [Results summary] | [Mitigation plan] |
| **Age** | [Yes/No] | [Yes/No] | [Results summary] | [Mitigation plan] |
| **Disability** | [Yes/No] | [Yes/No] | [Results summary] | [Mitigation plan] |
| **Religion** | [Yes/No] | [Yes/No] | [Results summary] | [Mitigation plan] |
| **Sexual Orientation** | [Yes/No] | [Yes/No] | [Results summary] | [Mitigation plan] |

### 2.3 Security Risks

#### 2.3.1 AI-Specific Security Threats
| Threat Type | Likelihood | Impact | Risk Score | Mitigation |
|-------------|------------|--------|------------|------------|
| **Adversarial Attacks** | [1-5] | [1-5] | [Calculated] | [Security controls] |
| **Model Inversion** | [1-5] | [1-5] | [Calculated] | [Security controls] |
| **Membership Inference** | [1-5] | [1-5] | [Calculated] | [Security controls] |
| **Model Extraction** | [1-5] | [1-5] | [Calculated] | [Security controls] |
| **Data Poisoning** | [1-5] | [1-5] | [Calculated] | [Security controls] |
| **Prompt Injection** | [1-5] | [1-5] | [Calculated] | [Security controls] |

#### 2.3.2 Traditional Security Risks
| Security Domain | Risk Level | Assessment | Controls |
|-----------------|------------|------------|----------|
| **Access Control** | [1-5] | [Assessment of authentication and authorization] | [Implemented controls] |
| **Data Encryption** | [1-5] | [Assessment of data protection in transit and at rest] | [Implemented controls] |
| **Network Security** | [1-5] | [Assessment of network-level protections] | [Implemented controls] |
| **Audit Logging** | [1-5] | [Assessment of logging and monitoring capabilities] | [Implemented controls] |
| **Incident Response** | [1-5] | [Assessment of incident detection and response] | [Implemented controls] |

---

## 3. Ethical Risk Assessment

### 3.1 Human Rights Impact
| Human Right | Impact Level | Assessment | Mitigation |
|-------------|--------------|------------|------------|
| **Right to Privacy** | [1-5] | [Assessment of privacy implications] | [Privacy protection measures] |
| **Right to Non-Discrimination** | [1-5] | [Assessment of discriminatory potential] | [Anti-discrimination measures] |
| **Right to Due Process** | [1-5] | [Assessment of procedural fairness] | [Due process protections] |
| **Right to Human Dignity** | [1-5] | [Assessment of dignity implications] | [Dignity protection measures] |
| **Right to Autonomy** | [1-5] | [Assessment of decision-making freedom] | [Autonomy preservation measures] |

### 3.2 Transparency and Explainability
| Requirement | Implementation | Assessment | Notes |
|-------------|----------------|------------|-------|
| **System Transparency** | [Describe implementation] | [Adequate/Inadequate] | [Additional notes] |
| **Decision Explainability** | [Describe implementation] | [Adequate/Inadequate] | [Additional notes] |
| **User Notification** | [Describe implementation] | [Adequate/Inadequate] | [Additional notes] |
| **Documentation** | [Describe implementation] | [Adequate/Inadequate] | [Additional notes] |

### 3.3 Accountability and Oversight
| Aspect | Implementation | Responsible Party | Assessment |
|--------|----------------|-------------------|------------|
| **Human Oversight** | [Describe oversight mechanisms] | [Name/Role] | [Adequate/Inadequate] |
| **Decision Review** | [Describe review processes] | [Name/Role] | [Adequate/Inadequate] |
| **Appeal Mechanisms** | [Describe appeal processes] | [Name/Role] | [Adequate/Inadequate] |
| **Audit Procedures** | [Describe audit processes] | [Name/Role] | [Adequate/Inadequate] |

---

## 4. Regulatory and Compliance Risk

### 4.1 Regulatory Compliance
| Regulation | Applicable | Compliance Status | Gap Analysis | Remediation Plan |
|------------|------------|-------------------|--------------|------------------|
| **EU AI Act** | [Yes/No] | [Compliant/Non-Compliant/Partial] | [Identified gaps] | [Remediation actions] |
| **GDPR** | [Yes/No] | [Compliant/Non-Compliant/Partial] | [Identified gaps] | [Remediation actions] |
| **CCPA** | [Yes/No] | [Compliant/Non-Compliant/Partial] | [Identified gaps] | [Remediation actions] |
| **HIPAA** | [Yes/No] | [Compliant/Non-Compliant/Partial] | [Identified gaps] | [Remediation actions] |
| **Industry Regulations** | [Yes/No] | [Compliant/Non-Compliant/Partial] | [Identified gaps] | [Remediation actions] |

### 4.2 Standards Compliance
| Standard | Applicable | Compliance Status | Assessment | Actions Required |
|----------|------------|-------------------|------------|------------------|
| **ISO/IEC 23053** | [Yes/No] | [Compliant/Non-Compliant/Partial] | [Assessment notes] | [Required actions] |
| **ISO/IEC 23894** | [Yes/No] | [Compliant/Non-Compliant/Partial] | [Assessment notes] | [Required actions] |
| **IEEE 2859** | [Yes/No] | [Compliant/Non-Compliant/Partial] | [Assessment notes] | [Required actions] |
| **NIST AI RMF** | [Yes/No] | [Compliant/Non-Compliant/Partial] | [Assessment notes] | [Required actions] |

---

## 5. Operational Risk Assessment

### 5.1 Deployment and Integration Risks
| Risk Factor | Risk Level | Assessment | Mitigation |
|-------------|------------|------------|------------|
| **System Integration** | [1-5] | [Assessment of integration complexity and risks] | [Integration safeguards] |
| **Performance Scalability** | [1-5] | [Assessment of system scalability] | [Scalability measures] |
| **Operational Monitoring** | [1-5] | [Assessment of monitoring capabilities] | [Monitoring enhancements] |
| **Maintenance Requirements** | [1-5] | [Assessment of ongoing maintenance needs] | [Maintenance planning] |
| **User Training** | [1-5] | [Assessment of user training requirements] | [Training programs] |

### 5.2 Business Continuity Risks
| Risk Factor | Risk Level | Assessment | Mitigation |
|-------------|------------|------------|------------|
| **System Availability** | [1-5] | [Assessment of uptime requirements and risks] | [Availability measures] |
| **Disaster Recovery** | [1-5] | [Assessment of recovery capabilities] | [Recovery procedures] |
| **Vendor Dependency** | [1-5] | [Assessment of third-party dependencies] | [Dependency management] |
| **Data Backup** | [1-5] | [Assessment of data protection and recovery] | [Backup procedures] |

---

## 6. Risk Quantification (FAIR Methodology)

### 6.1 Loss Event Frequency (LEF)
| Component | Value | Confidence | Justification |
|-----------|-------|------------|---------------|
| **Threat Event Frequency (TEF)** | [Annual frequency] | [High/Medium/Low] | [Basis for estimate] |
| **Vulnerability (V)** | [Probability 0-1] | [High/Medium/Low] | [Basis for estimate] |
| **Loss Event Frequency (LEF)** | [TEF × V] | [High/Medium/Low] | [Calculated value] |

### 6.2 Loss Magnitude (LM)
| Loss Type | Value | Confidence | Justification |
|-----------|-------|------------|---------------|
| **Primary Loss (PL)** | [$ Amount] | [High/Medium/Low] | [Direct financial impact] |
| **Secondary Loss (SL)** | [$ Amount] | [High/Medium/Low] | [Consequential impacts] |
| **Total Loss Magnitude (LM)** | [PL + SL] | [High/Medium/Low] | [Total potential loss] |

### 6.3 Risk Exposure Calculation
| Metric | Value | Confidence | Notes |
|--------|-------|------------|-------|
| **Annual Risk Exposure** | [LEF × LM] | [High/Medium/Low] | [Expected annual loss] |
| **Risk Tolerance Threshold** | [$ Amount] | [High/Medium/Low] | [Organizational threshold] |
| **Risk Tolerance Status** | [Above/Below Threshold] | [High/Medium/Low] | [Risk acceptance status] |

---

## 7. Risk Treatment Plan

### 7.1 Risk Mitigation Strategies
| Risk Category | Priority | Mitigation Strategy | Owner | Timeline | Cost |
|---------------|----------|-------------------|-------|----------|------|
| [Risk 1] | [High/Medium/Low] | [Detailed mitigation approach] | [Responsible person] | [Completion date] | [Estimated cost] |
| [Risk 2] | [High/Medium/Low] | [Detailed mitigation approach] | [Responsible person] | [Completion date] | [Estimated cost] |
| [Risk 3] | [High/Medium/Low] | [Detailed mitigation approach] | [Responsible person] | [Completion date] | [Estimated cost] |

### 7.2 Monitoring and Control Measures
| Control Type | Description | Frequency | Responsible Party | Success Criteria |
|--------------|-------------|-----------|-------------------|------------------|
| **Technical Controls** | [Automated monitoring and controls] | [Continuous/Daily/Weekly] | [Technical team] | [Measurable criteria] |
| **Process Controls** | [Procedural safeguards and reviews] | [Weekly/Monthly/Quarterly] | [Process owner] | [Measurable criteria] |
| **Governance Controls** | [Oversight and review mechanisms] | [Monthly/Quarterly/Annual] | [Governance body] | [Measurable criteria] |

### 7.3 Contingency Planning
| Scenario | Trigger Conditions | Response Actions | Responsible Party | Recovery Time |
|----------|-------------------|------------------|-------------------|---------------|
| **Model Performance Degradation** | [Specific performance thresholds] | [Detailed response plan] | [Response team] | [Target recovery time] |
| **Bias Detection** | [Bias detection criteria] | [Bias remediation plan] | [Response team] | [Target recovery time] |
| **Security Incident** | [Security event indicators] | [Incident response plan] | [Security team] | [Target recovery time] |
| **Regulatory Non-Compliance** | [Compliance violation indicators] | [Compliance remediation plan] | [Compliance team] | [Target recovery time] |

---

## 8. Approval and Sign-off

### 8.1 Risk Assessment Review
| Reviewer | Role | Review Date | Approval Status | Comments |
|----------|------|-------------|-----------------|----------|
| [Name] | Technical Lead | [Date] | [Approved/Rejected/Conditional] | [Review comments] |
| [Name] | Security Officer | [Date] | [Approved/Rejected/Conditional] | [Review comments] |
| [Name] | Ethics Officer | [Date] | [Approved/Rejected/Conditional] | [Review comments] |
| [Name] | Legal Counsel | [Date] | [Approved/Rejected/Conditional] | [Review comments] |
| [Name] | Business Owner | [Date] | [Approved/Rejected/Conditional] | [Review comments] |

### 8.2 Final Approval
| Field | Value |
|-------|-------|
| **Overall Risk Rating** | [Low/Medium/High/Critical] |
| **Recommendation** | [Approve/Approve with Conditions/Reject] |
| **Conditions** | [List any approval conditions] |
| **Final Approver** | [Name and Title] |
| **Approval Date** | [Date] |
| **Review Date** | [Next review date] |

---

## 9. Monitoring and Review Schedule

### 9.1 Ongoing Monitoring
| Monitoring Activity | Frequency | Responsible Party | Reporting |
|-------------------|-----------|-------------------|-----------|
| **Performance Monitoring** | [Continuous/Daily/Weekly] | [Technical team] | [Dashboard/Report] |
| **Bias Monitoring** | [Weekly/Monthly] | [Data science team] | [Bias report] |
| **Security Monitoring** | [Continuous] | [Security team] | [Security dashboard] |
| **Compliance Monitoring** | [Monthly/Quarterly] | [Compliance team] | [Compliance report] |

### 9.2 Review Schedule
| Review Type | Frequency | Participants | Deliverables |
|-------------|-----------|--------------|--------------|
| **Technical Review** | [Monthly] | [Technical stakeholders] | [Technical assessment update] |
| **Risk Review** | [Quarterly] | [Risk committee] | [Risk assessment update] |
| **Governance Review** | [Semi-Annual] | [Governance board] | [Governance compliance report] |
| **Comprehensive Review** | [Annual] | [All stakeholders] | [Complete risk reassessment] |

---

## 10. Documentation and Records

### 10.1 Required Documentation
- [ ] System design and architecture documentation
- [ ] Data governance and lineage documentation
- [ ] Model development and validation documentation
- [ ] Security assessment and controls documentation
- [ ] Ethics impact assessment documentation
- [ ] Compliance assessment and evidence
- [ ] Testing and validation results
- [ ] Monitoring and audit procedures

### 10.2 Record Retention
| Document Type | Retention Period | Storage Location | Access Controls |
|---------------|------------------|------------------|-----------------|
| **Risk Assessments** | [7 years] | [Secure repository] | [Access control list] |
| **Audit Records** | [7 years] | [Secure repository] | [Access control list] |
| **Incident Reports** | [7 years] | [Secure repository] | [Access control list] |
| **Compliance Evidence** | [7 years] | [Secure repository] | [Access control list] |

---

## Risk Assessment Scoring Guide

### Risk Level Scale (1-5)
- **1 - Very Low:** Minimal risk with negligible impact
- **2 - Low:** Limited risk with minor impact
- **3 - Medium:** Moderate risk requiring attention
- **4 - High:** Significant risk requiring immediate action
- **5 - Critical:** Severe risk requiring urgent intervention

### Confidence Level Definitions
- **High:** Based on extensive data and analysis
- **Medium:** Based on reasonable data and expert judgment
- **Low:** Based on limited data and assumptions

---

**Template Control:**
- **Created:** [Current Date]
- **Last Modified:** [Current Date]
- **Next Review:** [Current Date + 6 Months]
- **Template Owner:** AI Ethics Review Board
- **Version:** 1.0

*This AI/ML Risk Assessment Template provides a comprehensive framework for evaluating and managing risks associated with artificial intelligence and machine learning systems throughout their lifecycle.*