# ADPA entity catalog

Per-tenant, workload, subscription, application, and identity entities are stored here as JSON files conforming to `adpa/schemas/telemetry-entity.schema.json`.

Entities are hydrated from:

- Microsoft Sentinel (`ict-governance-framework` connector)
- Microsoft Defender for Cloud Apps
- Azure Policy compliance scans
- Manual governance registration

## File naming

`{entityType}-{entityId}.json` — example: `tenant-contoso-health.json`

## Generation

Telemetry events can be prioritized into ADPA templates:

```bash
npm run adpa:prioritize -- adpa/entities/sample-events/policy-violation.json
npm run adpa:generate -- generate policy-alignment --var entityId=tenant-contoso
```

Do not commit secrets or live PII in entity files.
