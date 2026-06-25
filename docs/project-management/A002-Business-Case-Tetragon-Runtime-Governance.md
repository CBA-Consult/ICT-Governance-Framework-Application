# A002: Business Case and Value Proposition

**Document Type:** A002 - Business Case and Value Proposition
**WBS Reference:** 1.1.1.1.2 - Develop Business Case and Value Proposition
**Project:** Tetragon Runtime Governance Integration
**Version:** 1.0
**Prepared by:** ICT Governance Project Team
**Date:** June 25, 2026

---

## Purpose
This business case explains the rationale, benefits, cost considerations, and expected value of integrating Tetragon runtime observability into the ICT Governance Framework.

## Background
Modern cloud-native workloads increasingly run in Linux and Kubernetes environments. Traditional governance controls and audit telemetry often miss runtime indicators of compromise and suspicious behavior that occur after containers are deployed.

Tetragon provides eBPF-based runtime visibility and enforcement that closes this gap by capturing process, network, file, and policy events at the host and container boundary.

## Problem Statement
- Governance coverage is incomplete for runtime behavior in Linux/Kubernetes workloads.
- Existing telemetry focuses on asset inventory and policy compliance, not active execution context.
- This creates blind spots for threats such as container breakout, unauthorized lateral movement, and runtime exploitation.

## Proposed Solution
Deploy a pilot integration of Tetragon to collect runtime events from Linux/Kubernetes workloads and feed those events into the ICT Governance Framework's incident and compliance workflows.

### Scope
- Pilot deployment in a representative Linux/Kubernetes environment
- Collection of Tetragon runtime events for process, network, and file behavior
- Mapping of runtime events to incident categories and governance dashboards
- Evaluation of detection and correlation value against existing governance sources

## Benefits

### Business benefits
- Improved detection of live attacks in runtime environments
- Faster incident investigation through richer runtime evidence
- Better operational confidence in the governance framework for cloud-native workloads
- Stronger compliance posture for runtime security controls

### Technical benefits
- Runtime telemetry complements existing policy and asset sources
- Provides additional evidence for incident correlation and audit trails
- Enables host/container-level enforcement and alerting

### Strategic benefits
- Positions the governance framework for modern cloud-native environments
- Demonstrates value of runtime governance as a formal capability
- Supports customer and stakeholder trust in secure workload operations

## Expected Value
- Reduced mean time to detect (MTTD) for runtime incidents in target environments
- Improved incident attribution by correlating runtime events with asset and policy data
- Increased coverage of governance controls across containerized infrastructure
- Pilot readiness for further automation and production rollout

## Costs and Investment

### Estimated effort
- Pilot design and engineering: 2-3 weeks
- Tetragon deployment and integration work: 1-2 weeks
- Validation, testing, and stakeholder review: 1 week

### Resource requirements
- Platform/security engineers for Linux/Kubernetes integration
- Governance analysts for event mapping and incident correlation
- Cloud or on-prem compute resources for pilot environment

### Risk and mitigation
- Risk: host instability due to kernel/eBPF incompatibility
  - Mitigation: test on a controlled pilot cluster and validate kernel support before deployment
- Risk: limited runtime event mapping capability
  - Mitigation: start with a narrow set of high-value event categories and expand iteratively
- Risk: stakeholder resistance to new runtime data source
  - Mitigation: focus pilot on demonstrable incident/response value and provide clear integration guidance

## Alternatives Considered
- Do nothing: continue without runtime visibility for container workloads
- Use existing host-based EDR only: may not provide the same Linux-native, Kubernetes-aware event context
- Build custom runtime telemetry: would require more engineering and time than using Tetragon

## Recommendation
Proceed with a pilot integration of Tetragon runtime observability into the ICT Governance Framework. The pilot should focus on validating the runtime event ingestion model, mapping a small set of high-value detection cases, and demonstrating operational benefit versus current governance telemetry.

## Key Metrics
- Pilot runtime event ingestion success rate
- Number of runtime incidents detected that were not visible in current governance telemetry
- Time savings in incident investigation for pilot cases
- Stakeholder acceptance and recommended rollout decision

## Approval
- Executive Sponsor: CIO / Security Executive
- Project Sponsor: ICT Governance Program Lead
- Approval Date: TBD
