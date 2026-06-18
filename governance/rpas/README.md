# RPAS Governance Integration

This directory anchors the RPAS governance baseline inside the ICT Governance Framework product repository.

**Integration mode:** `in-repo` — ADPA systematics live in `adpa/`; TAR control manifests are **Production-Attested** at baseline `2.3.0`.

## Layout

```text
governance/rpas/
├── artifacts/                  ADPA, ARM, AEV, CSR control metadata
├── hooks/                      Pre-commit hook templates
├── scripts/                    Registration and validation tooling
├── templates/                  Evidence metadata templates
├── governance_checksum.json    Committed checksum for drift detection
├── manifest.json               Governance manifest and required file list
└── project.binding.json        Project-specific RPAS + ADPA binding
```

ADPA module: [`adpa/README.md`](../../adpa/README.md)

## Commands

```bash
npm run governance:register
npm run governance:validate
npm run governance:checksum
npm run adpa:validate
```

## Control artifacts

| ID | File | TAR ID | sourceOfTruth |
|----|------|--------|---------------|
| ADPA | `artifacts/ADPA.control.json` | TAR-ADPA-001 | `adpa/` |
| ARM | `artifacts/ARM.control.json` | TAR-ARM-002 | `blueprint-templates/` |
| AEV | `artifacts/AEV.control.json` | TAR-AEV-003 | `governance/rpas/scripts/` |
| CSR-42 | `artifacts/CSR-42.json` | — | Certified baseline |

## Documentation

- [ADPA integration guide](../../docs/implementation/guides/ADPA-ICT-Governance-Integration-Guide.md)
- [RPAS integration guide](../../docs/implementation/guides/RPAS-Governance-Integration-Guide.md)
