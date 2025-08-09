# Azure Infrastructure as Code Governance

This folder contains implementation guidance for integrating Azure governance best practices with the ICT Governance Framework using Infrastructure as Code (IaC) principles.

## Contents

- [Implementation Guide](Implementation-Guide.md) - Comprehensive guide for implementing Azure IaC governance
- [Azure Policy as Code](Azure-Policy-as-Code.md) - Guide for implementing Azure Policy definitions as code
- [CI-CD Integration](CI-CD-Integration.md) - Pipeline templates and guidance for CI/CD integration
- [Drift Detection](Drift-Detection.md) - Approach for detecting and remediating configuration drift
- [Repository Structure](Repository-Structure.md) - Recommended repository structure for Azure IaC
- [Defender AppCatalog Integration](Defender-AppCatalog.md) - Implementing Microsoft Defender Application Control with AppCatalog
- [Employee App Store API](Employee-AppStore-API.md) - API integration for an enterprise employee app store

## Purpose

This guidance aligns Azure-specific governance practices with the broader ICT Governance Framework to ensure consistent governance across all technology platforms while leveraging Azure's native capabilities for infrastructure governance.

## Integration Points

These documents integrate with the existing ICT Governance Framework components:

- **ICT Governance Framework** - Overall governance structure and principles
- **ICT Governance Policies** - Specific policies for technology management
- **ICT Governance IaC Integration** - Broader IaC approach and principles
- **ICT Governance Metrics** - KPIs and reporting framework
- **Security and Mobile App Integration** - Application security and distribution governance

## Key Capabilities

- Infrastructure deployment automation with governance guardrails
- Policy-based compliance enforcement and monitoring
- Automated drift detection and remediation
- Secure application catalog management and distribution
- Enterprise API integration for employee self-service
- SIEM and Cloud App Security integration for comprehensive application tracking
- Employee validation workflow for applications discovered by security monitoring tools
- Complete tracking of all applications used on company devices

## Security and Compliance Integration

The Defender AppCatalog and Employee App Store API implementations provide:

1. **Comprehensive Application Governance** - Track, validate, and manage all applications used within the organization
2. **Security Integration** - Automatic discovery of applications via SIEM and Cloud App Security
3. **Employee Self-Service** - Streamlined approval and validation processes
4. **Compliance Reporting** - Detailed metrics on application usage and compliance status
5. **Full Lifecycle Management** - From discovery through validation, approval, deployment, and retirement

These components extend the ICT Governance Framework to application management while maintaining alignment with overall governance principles and leveraging Infrastructure as Code for deployment and management.

## Last Updated

August 7, 2023
