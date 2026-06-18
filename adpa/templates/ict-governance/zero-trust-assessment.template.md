# ADPA template: Zero Trust Assessment

---
adpa:
  templateId: zero-trust-assessment
  version: 1.0.0
  frameworkSource: docs/architecture/target-state/Zero-Trust-Maturity-Model.md
---

## Entity assessment

| Field | Value |
|-------|-------|
| Entity | {{entityId}} |
| Assessment date | {{assessmentDate}} |
| Trigger | {{telemetryTrigger}} |

## Six pillars

| Pillar | Current level | Target | Gap actions |
|--------|---------------|--------|-------------|
| Identity | | | |
| Devices | | | |
| Networks | | | |
| Applications | | | |
| Data | | | |
| Infrastructure | | | |

## Sentinel / SIEM evidence

| Incident / alert ID | Severity | Correlated control |
|---------------------|----------|-------------------|
| {{telemetryEventId}} | {{severity}} | |

## Remediation priorities

{{remediationPriorities}}
