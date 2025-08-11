# Risk Register

## Metadata
| Field | Value |
|---|---|
| Owner | Risk Manager / PM |
| Version | 1.0 |
| Status | Draft |
| Last Updated | 2025-08-08 |

## Purpose
Central record of all identified risks across ICT domains using FAIR-based quantitative risk assessment, providing comprehensive risk tracking, ownership, and treatment monitoring.

## Structure (FAIR-Enhanced Fields)

### Risk Identification
- **Risk ID:** Unique identifier with domain prefix (INF-, SEC-, APP-, DAT-, EUC-, INT-)
- **Risk Title:** Descriptive name of the risk scenario
- **Risk Description:** Detailed description of the risk scenario and potential impacts
- **ICT Domain:** Primary domain (Infrastructure, Security, Applications, Data, End-user Computing, Integration)
- **Risk Category:** Sub-category within domain (e.g., Cloud Outage, Data Breach, Application Vulnerability)
- **Risk Owner:** Domain Owner accountable for risk management
- **Business Stakeholder:** Business representative affected by the risk

### FAIR Risk Assessment
- **Threat Event Frequency (TEF):** Annual frequency of threat events (quantified)
- **Vulnerability (V):** Probability (0-1) that threat event results in loss event
- **Loss Event Frequency (LEF):** Calculated as TEF × V
- **Primary Loss (PL):** Direct financial impact ($ amount)
- **Secondary Loss (SL):** Consequential impacts ($ amount)
- **Loss Magnitude (LM):** Calculated as PL + SL
- **Risk Exposure:** Calculated as LEF × LM (annual $ exposure)
- **Risk Confidence Level:** Confidence in risk assessment (High/Medium/Low)
- **Assessment Date:** Date of last FAIR assessment
- **Assessment Validity:** Assessment expiration date (typically 12 months)

### Risk Treatment
- **Risk Tolerance Status:** Above/Below organizational risk appetite
- **Treatment Strategy:** Avoid/Transfer/Mitigate/Accept/Monitor
- **Treatment Actions:** Specific mitigation measures and controls
- **Treatment Owner:** Person responsible for implementing treatment
- **Treatment Due Date:** Target completion date for treatment actions
- **Treatment Cost:** Investment required for risk treatment
- **Residual Risk Exposure:** Expected risk exposure after treatment
- **Treatment Effectiveness:** Actual vs. expected risk reduction

### Risk Monitoring
- **Risk Status:** Open/In Treatment/Monitoring/Closed
- **Last Reviewed:** Date of last risk review
- **Next Review Date:** Scheduled date for next assessment
- **Risk Trend:** Increasing/Stable/Decreasing
- **Key Risk Indicators (KRIs):** Metrics for monitoring risk levels
- **Escalation Triggers:** Conditions requiring escalation to ICT Governance Council

## FAIR-Based Risk Management Process

### 1. Risk Identification and Registration
- **Domain-Specific Risk Workshops:** Conduct workshops for each ICT domain
- **Threat Modeling Sessions:** Identify threats specific to technology assets
- **Historical Incident Analysis:** Review past incidents and near-misses
- **Industry Intelligence Integration:** Incorporate external threat intelligence
- **Stakeholder Input:** Gather risk scenarios from business stakeholders
- **Risk Registration:** Document risks in standardized FAIR format

### 2. FAIR Quantitative Risk Assessment
- **Threat Event Frequency Analysis:** Quantify likelihood of threat events
- **Vulnerability Assessment:** Evaluate probability of successful exploitation
- **Loss Event Frequency Calculation:** Calculate LEF = TEF × V
- **Primary Loss Assessment:** Quantify direct financial and operational impacts
- **Secondary Loss Assessment:** Quantify consequential impacts
- **Risk Exposure Calculation:** Calculate Risk = LEF × LM
- **Sensitivity Analysis:** Test assumptions and assess uncertainty ranges

### 3. Risk Evaluation and Treatment Planning
- **Risk Tolerance Assessment:** Compare risk exposure to organizational appetite
- **Risk Prioritization:** Rank risks by exposure and business criticality
- **Treatment Strategy Selection:** Choose appropriate risk treatment approach
- **Treatment Action Planning:** Define specific mitigation measures
- **Cost-Benefit Analysis:** Evaluate treatment options for cost-effectiveness
- **Treatment Assignment:** Assign ownership and timelines for implementation

### 4. Risk Monitoring and Control
- **Continuous Risk Monitoring:** Track key risk indicators and exposure trends
- **Treatment Progress Tracking:** Monitor implementation of risk treatments
- **Control Effectiveness Assessment:** Measure performance of implemented controls
- **Risk Model Updates:** Calibrate models based on new data and incidents
- **Quarterly Risk Reviews:** Conduct regular risk posture assessments
- **Escalation Management:** Escalate high-risk scenarios to governance council

## Views & Reporting

### Executive Dashboard Views
- **Enterprise Risk Exposure:** Total quantified risk across all domains
- **Top Risks by Exposure:** Highest risk scenarios requiring attention
- **Risk Trend Analysis:** Risk exposure trends over time
- **Domain Risk Distribution:** Risk breakdown by ICT domain
- **Treatment Effectiveness:** Progress on risk mitigation initiatives

### Operational Views
- **Domain Risk Registers:** Domain-specific risk inventories
- **Risk Treatment Pipeline:** Status of risk mitigation projects
- **Overdue Risk Assessments:** Risks requiring updated FAIR assessments
- **Escalation Queue:** Risks exceeding tolerance thresholds
- **Control Effectiveness Metrics:** Performance of risk controls

## Standards Crosswalk
| Standard | Mapping |
|---|---|
| FAIR | Factor Analysis of Information Risk - Primary methodology |
| PMBOK | Plan/Identify/Monitor Risks |
| ISO 31000 | Risk management principles |
| NIST 800-30 | Risk assessment |
| COBIT 2019 | Risk management and governance alignment |
| ISO/IEC 27001 | Information security risk management |
| COSO | Enterprise risk management framework |

## Compliance Checklist
- [x] FAIR methodology fields defined and standardized
- [x] Domain-specific risk categories established
- [x] Quantitative risk assessment process documented
- [x] Risk tolerance thresholds defined
- [x] Review cadence established (quarterly minimum)
- [x] Escalation procedures documented
- [x] Reporting views and dashboards described
- [x] Integration with business value quantification established
- [x] Risk treatment effectiveness measurement defined

## References
- Risk Management Plan; Security Testing Guidelines

## Version History
| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2025-08-08 | Risk Manager | Initial draft aligned to style guide |
