# AI Prompt Engineering Framework for PMBOK Document Generation

**Document Type:** Implementation Guide  
**Version:** 1.0  
**Date:** 2025-01-15  
**Prepared by:** AI Engineering Team  

---

## Executive Summary

This framework provides specialized AI prompt engineering guidelines for generating high-quality, PMBOK-compliant project management documentation. It includes document-specific prompts, few-shot learning examples, and quality validation criteria to ensure consistent, professional output aligned with PMI standards.

---

## Table of Contents

1. [Framework Overview](#framework-overview)
2. [Document-Specific Prompts](#document-specific-prompts)
3. [Few-Shot Learning Examples](#few-shot-learning-examples)
4. [Quality Validation Criteria](#quality-validation-criteria)
5. [Adaptive Scope Control](#adaptive-scope-control)
6. [Implementation Guidelines](#implementation-guidelines)

---

## Framework Overview

### Core Principles

1. **PMBOK Alignment**: All prompts ensure strict adherence to PMI standards
2. **Document Specificity**: Tailored prompts for each document type
3. **Quality Consistency**: Standardized output quality across all documents
4. **Contextual Awareness**: Prompts consider project context and stakeholder needs
5. **Iterative Improvement**: Continuous refinement based on feedback

### Prompt Engineering Methodology

```
Base Prompt Structure:
[ROLE] + [CONTEXT] + [TASK] + [FORMAT] + [QUALITY_CRITERIA] + [EXAMPLES]

Where:
- ROLE: Define the AI's expertise (e.g., "You are a certified PMP with 15 years experience")
- CONTEXT: Project-specific information and constraints
- TASK: Specific document generation requirements
- FORMAT: Required structure and formatting guidelines
- QUALITY_CRITERIA: PMBOK compliance and quality standards
- EXAMPLES: Few-shot learning examples for reference
```

---

## Document-Specific Prompts

### Project Charter Prompt

```
ROLE: You are a certified Project Management Professional (PMP) with 15 years of experience in enterprise project management and PMBOK methodology.

CONTEXT: You are creating a Project Charter for an ICT Governance Framework implementation project with the following parameters:
- Budget: $1.275M over 15 months
- Expected ROI: $2.3M annually
- Stakeholders: Executive leadership, IT teams, compliance officers
- Regulatory requirements: SOX, GDPR, industry standards

TASK: Generate a comprehensive Project Charter that includes:
1. Executive Summary with clear value proposition
2. Project Purpose and Business Justification
3. High-level Requirements and Deliverables
4. Success Criteria with measurable KPIs
5. Key Stakeholders and their roles
6. High-level Timeline and Milestones
7. Budget Summary with phase breakdown
8. Assumptions Log with validation methods
9. Risk Assessment with mitigation strategies
10. Approval signatures section

FORMAT: Use professional business document formatting with:
- Clear section headers and numbering
- Tables for structured data
- Bullet points for lists
- Executive summary at the beginning
- Document control information

QUALITY_CRITERIA:
- Align with PMBOK 7th Edition standards
- Include specific, measurable success criteria
- Ensure business value is clearly articulated
- Use professional project management terminology
- Include all required PMI charter elements
- Maintain consistency with organizational standards

EXAMPLES: [Include 2-3 high-quality charter examples here]
```

### Requirements Specification Prompt

```
ROLE: You are a senior Business Analyst and Requirements Engineer with expertise in PMBOK requirements management processes and BABOK methodology.

CONTEXT: You are documenting requirements for an ICT Governance Framework with:
- 180+ detailed requirements across 12 functional domains
- Multiple stakeholder groups with varying needs
- Complex integration requirements
- Regulatory compliance obligations

TASK: Generate a comprehensive Requirements Specification including:
1. Requirements Management Framework
2. Functional Requirements by domain
3. Non-functional Requirements (performance, security, usability)
4. Interface Requirements for integrations
5. Compliance Requirements mapping
6. Requirements Traceability Matrix
7. Acceptance Criteria for each requirement
8. Priority classification (MoSCoW)
9. Risk assessment for requirements
10. Validation and verification procedures

FORMAT: Structure as:
- Executive Summary
- Requirements methodology section
- Detailed requirements by category
- Traceability matrices
- Appendices with supporting information

QUALITY_CRITERIA:
- Each requirement must be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Include clear acceptance criteria
- Maintain traceability to business objectives
- Use consistent requirement numbering
- Include priority and complexity ratings
- Ensure testability of all requirements

EXAMPLES: [Include requirement specification examples]
```

### Risk Management Plan Prompt

```
ROLE: You are a certified Risk Management Professional (PMI-RMP) with expertise in FAIR methodology and enterprise risk management.

CONTEXT: You are developing a Risk Management Plan for an ICT Governance Framework project with:
- Complex technology integrations
- Multiple stakeholder dependencies
- Regulatory compliance requirements
- $1.275M budget at risk

TASK: Create a comprehensive Risk Management Plan including:
1. Risk Management Methodology (FAIR-based)
2. Risk Categories and Breakdown Structure
3. Risk Identification Processes
4. Qualitative and Quantitative Risk Analysis
5. Risk Response Planning
6. Risk Monitoring and Control
7. Risk Register template
8. Escalation procedures
9. Risk reporting framework
10. Lessons learned integration

FORMAT: Follow PMBOK risk management structure with:
- Clear process flows
- Risk assessment matrices
- Template forms and checklists
- Roles and responsibilities
- Communication procedures

QUALITY_CRITERIA:
- Align with PMBOK risk management processes
- Include quantitative FAIR methodology
- Provide clear escalation criteria
- Ensure actionable risk responses
- Include monitoring and control procedures
- Maintain consistency with organizational risk appetite

EXAMPLES: [Include risk management plan examples]
```

### Work Breakdown Structure Prompt

```
ROLE: You are an experienced Project Manager and WBS expert with deep knowledge of PMBOK work breakdown structure principles.

CONTEXT: You are creating a WBS for an ICT Governance Framework project with:
- 15-month timeline
- 5 major phases
- Multiple work packages and activities
- Cross-functional team dependencies

TASK: Develop a comprehensive Work Breakdown Structure including:
1. Hierarchical project decomposition (5 levels)
2. WBS Dictionary with detailed descriptions
3. Work package definitions
4. Deliverable-oriented structure
5. Resource requirements by work package
6. Duration estimates
7. Dependencies and relationships
8. Acceptance criteria
9. Risk considerations
10. Quality requirements

FORMAT: Present as:
- Visual WBS hierarchy
- Detailed WBS Dictionary
- Summary tables and matrices
- Cross-reference to other project documents

QUALITY_CRITERIA:
- Follow 100% rule (complete scope coverage)
- Ensure mutually exclusive work packages
- Maintain deliverable orientation
- Include appropriate level of detail
- Align with project scope statement
- Support accurate estimation and control

EXAMPLES: [Include WBS examples]
```

---

## Few-Shot Learning Examples

### High-Quality Project Charter Example

```
# Project Charter: Enterprise Data Governance Platform

## Executive Summary
The Enterprise Data Governance Platform project will establish a comprehensive data governance framework to ensure data quality, compliance, and strategic value realization across the organization. With an investment of $2.1M over 18 months, this initiative will deliver $4.2M in annual value through improved data quality, regulatory compliance, and enhanced decision-making capabilities.

## Project Purpose and Business Justification
**Business Need:** The organization faces increasing regulatory scrutiny, data quality issues, and missed opportunities for data-driven insights due to lack of centralized data governance.

**Business Case:** 
- Regulatory Compliance: Avoid $5M in potential fines
- Data Quality Improvement: Reduce data-related errors by 85%
- Decision Making: Improve analytics accuracy by 90%
- Operational Efficiency: Reduce data preparation time by 60%

[Continue with full charter structure...]
```

### High-Quality Requirements Example

```
**Requirement ID:** REQ-DG-001
**Title:** Data Classification Engine
**Description:** The system shall provide an automated data classification engine that categorizes data based on sensitivity, regulatory requirements, and business criticality.

**Acceptance Criteria:**
1. Classify 95% of data elements within 24 hours of ingestion
2. Support 15+ classification categories (Public, Internal, Confidential, Restricted)
3. Integrate with 10+ data sources (databases, file systems, cloud storage)
4. Provide confidence scores for automated classifications
5. Allow manual override with audit trail

**Priority:** Must Have (9/10)
**Complexity:** High
**Business Value:** $150,000 annually through compliance automation
**Dependencies:** Data Discovery Engine (REQ-DG-002)
**Risks:** Data source connectivity issues, classification accuracy
```

---

## Quality Validation Criteria

### PMBOK Compliance Checklist

#### Project Charter Validation
- [ ] Includes project purpose and justification
- [ ] Documents high-level requirements
- [ ] Identifies key stakeholders
- [ ] Establishes success criteria
- [ ] Includes assumptions and constraints
- [ ] Provides high-level timeline
- [ ] Includes budget summary
- [ ] Has approval signatures section

#### Requirements Specification Validation
- [ ] Requirements are SMART formatted
- [ ] Includes functional and non-functional requirements
- [ ] Provides clear acceptance criteria
- [ ] Maintains traceability to business objectives
- [ ] Includes priority classification
- [ ] Documents assumptions and dependencies
- [ ] Specifies validation methods

#### Risk Management Plan Validation
- [ ] Follows PMBOK risk processes
- [ ] Includes risk identification methodology
- [ ] Provides qualitative and quantitative analysis
- [ ] Documents risk response strategies
- [ ] Establishes monitoring procedures
- [ ] Includes escalation criteria

### Quality Metrics

| Document Type | Quality Metric | Target | Measurement Method |
|---------------|----------------|--------|-------------------|
| **Project Charter** | Stakeholder Approval Rate | >95% | Stakeholder sign-off tracking |
| **Requirements** | Requirement Clarity Score | >4.5/5 | Stakeholder review ratings |
| **Risk Plan** | Risk Coverage Completeness | 100% | Risk category coverage analysis |
| **WBS** | Decomposition Accuracy | >90% | Expert review validation |

---

## Adaptive Scope Control

### Scope Creep Detection Prompts

```
SCOPE_VALIDATION_PROMPT = """
You are a scope management expert. Analyze the following project request against the original scope:

ORIGINAL_SCOPE: {original_scope}
NEW_REQUEST: {new_request}

Evaluate:
1. Is this request within the original scope boundaries?
2. What is the impact on timeline, budget, and resources?
3. Does this align with project objectives?
4. What are the risks of including/excluding this request?
5. Recommend: Approve, Reject, or Escalate with justification

Provide a structured analysis with clear recommendations.
"""
```

### Scope Change Impact Assessment

```
IMPACT_ASSESSMENT_PROMPT = """
You are a change control expert. Assess the impact of this scope change:

CHANGE_REQUEST: {change_description}
PROJECT_CONTEXT: {project_details}

Analyze impact on:
1. Schedule (timeline changes, critical path impact)
2. Budget (cost implications, resource needs)
3. Quality (quality standards, deliverable impact)
4. Risk (new risks, risk mitigation needs)
5. Stakeholders (affected parties, communication needs)

Provide quantified impact assessment with recommendations.
"""
```

---

## Implementation Guidelines

### Prompt Configuration Management

#### 1. Version Control
```json
{
  "prompt_version": "1.0",
  "document_type": "project_charter",
  "last_updated": "2025-01-15",
  "approved_by": "PMO Director",
  "change_log": [
    {
      "version": "1.0",
      "date": "2025-01-15",
      "changes": "Initial prompt creation",
      "author": "AI Engineering Team"
    }
  ]
}
```

#### 2. A/B Testing Framework
```python
def test_prompt_effectiveness(prompt_a, prompt_b, test_cases):
    """
    Test two prompt versions against quality criteria
    """
    results_a = evaluate_prompt(prompt_a, test_cases)
    results_b = evaluate_prompt(prompt_b, test_cases)
    
    return {
        "winner": "A" if results_a.score > results_b.score else "B",
        "improvement": abs(results_a.score - results_b.score),
        "metrics": {
            "clarity": (results_a.clarity, results_b.clarity),
            "completeness": (results_a.completeness, results_b.completeness),
            "pmbok_compliance": (results_a.pmbok, results_b.pmbok)
        }
    }
```

### Continuous Improvement Process

#### 1. Feedback Collection
- Stakeholder ratings on document quality
- Expert review scores
- Usage analytics and success metrics
- Error pattern analysis

#### 2. Prompt Optimization
- Regular review of prompt effectiveness
- Integration of new PMBOK updates
- Incorporation of lessons learned
- Performance metric tracking

#### 3. Quality Assurance
- Automated quality checks
- Expert validation processes
- Compliance verification
- Continuous monitoring

### Integration with Development Workflow

```yaml
# AI Prompt Engineering Pipeline
stages:
  - prompt_development:
      - Create initial prompt
      - Define quality criteria
      - Develop test cases
  
  - validation:
      - A/B testing
      - Expert review
      - Stakeholder feedback
  
  - deployment:
      - Version control
      - Configuration management
      - Monitoring setup
  
  - optimization:
      - Performance analysis
      - Feedback integration
      - Continuous improvement
```

---

## Support and Resources

### Training Materials
- PMBOK 7th Edition alignment guide
- AI prompt engineering best practices
- Quality assessment methodologies
- Stakeholder feedback collection

### Tools and Templates
- Prompt template library
- Quality validation checklists
- A/B testing frameworks
- Performance monitoring dashboards

---

**Document Control:**
- **Version:** 1.0
- **Last Updated:** 2025-01-15
- **Next Review:** 2025-04-15
- **Owner:** AI Engineering Team