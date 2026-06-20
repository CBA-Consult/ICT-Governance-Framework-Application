# Cloud translators (future phase)

Placeholder modules referenced by governance artifact templates. Each translator accepts a **generated artifact** JSON specification and emits cloud-specific IaC or Compliance-as-Code files.

```text
translators/
├── azure/     Bicep, ARM, Azure Policy
├── aws/       Terraform, CloudFormation, AWS Config
└── gcp/       Terraform, Deployment Manager, Org Policy
```

Implement translators when the LLM generation pipeline is connected to `adpa/config/processor-config.json`.
