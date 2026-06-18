# ADPA template: Compliance as Code Map

---
adpa:
  templateId: compliance-as-code-map
  version: 1.0.0
  projectId: ADPA-ICT-GOV
  frameworkSource: docs/architecture/integration/ICT-Governance-IaC-Integration.md
  tarCol:
    artifactId: RPAS-CM-ADPA-002
    origin: Human
    csrVersion: v2.3.0+CSR-42
---

## Document control

| Field | Value |
|-------|-------|
| Title | Compliance-as-Code Map — {{entityId}} |
| Workload | {{workloadName}} |
| Subscription | {{subscriptionId}} |

## Governance policy to implementation map

| Governance policy | IaC implementation | Automation approach | RPAS drift class |
|-------------------|--------------------|-----------------------|------------------|
| Technology standards | `blueprint-templates/` | Pipeline module validation | architectural |
| Security requirements | Azure Policy / Bicep | Policy compliance scan | security |
| Architecture standards | Reference architecture templates | CI architecture gate | architectural |
| Change management | PR + AEV gates | `npm run governance:validate` | process |
| Configuration standards | M365DSC / parameter files | Config drift monitor | configuration |

## Entity baseline

| Attribute | Certified value | Live value | Drift |
|-----------|-----------------|------------|-------|
| | | | |

## Remediation plan

1. ADPA decision record reference: {{humanDecisionId}}
2. IaC change PR:
3. AEV gate evidence:
4. CSR / AMD update:

## Telemetry triggers

{{telemetrySummary}}
