# RPAS Governance Integration Guide

## Overview

This repository includes an RPAS governance baseline under `governance/rpas`.

The current integration mode is `vendor-scaffold`. That means the repository already contains:

- RPAS binding metadata for this project
- ADPA, ARM, and AEV governance artifacts
- checksum-based drift detection
- a versioned pre-commit hook template
- CI validation through GitHub Actions

The scaffold is designed so the repository can switch to a canonical RPAS source later without reworking the enforcement model.

## Repository Paths

| Path | Purpose |
| --- | --- |
| `governance/rpas/manifest.json` | Defines the RPAS baseline and required files |
| `governance/rpas/project.binding.json` | Binds the RPAS baseline to this repository |
| `governance/rpas/artifacts/` | ADPA, ARM, and AEV control metadata |
| `governance/rpas/scripts/register-governance.ps1` | Installs local governance registration state and hook wiring |
| `governance/rpas/scripts/validate-aev.ps1` | Validates the baseline and checksum |
| `governance/rpas/governance_checksum.json` | Committed checksum used for drift detection |
| `.github/workflows/rpas-governance.yml` | CI enforcement for RPAS governance |

## Local Commands

Run these from the repository root:

```bash
npm run governance:register
npm run governance:validate
npm run governance:checksum
```

## Enforcement Model

### Local registration

The registration step writes local state to `governance/rpas/.state/registration.json` and installs the pre-commit hook template into the repository hook directory.

### AEV validation

`validate-aev.ps1` enforces:

- presence of all required RPAS files
- validity of the project binding configuration
- presence and structure of ADPA, ARM, and AEV artifacts
- checksum integrity across the committed RPAS baseline

### CI validation

The `RPAS Governance Validation` workflow:

1. checks out the repository
2. registers the RPAS bindings in CI mode
3. validates the baseline
4. runs focused Pester tests for governance integration

## Updating The Baseline

When you intentionally change the RPAS baseline, refresh the checksum:

```bash
npm run governance:checksum
```

If the checksum is stale, `npm run governance:validate` and the CI workflow will fail until the committed checksum matches the baseline.

## Moving To A Canonical RPAS Source

When the authoritative RPAS repository becomes available, replace the scaffold with either:

```bash
git submodule add <authoritative-rpas-url> governance/rpas
```

or:

```bash
git subtree add --prefix governance/rpas <authoritative-rpas-url> <branch> --squash
```

After switching:

1. update `governance/rpas/project.binding.json`
2. update `governance/rpas/manifest.json`
3. run `npm run governance:checksum`
4. commit the refreshed checksum and binding metadata

## Notes

- The current baseline uses placeholder `SET_ME` source references until the canonical RPAS source is known.
- The checksum file intentionally excludes itself from the hash set to avoid self-referential drift.
- The npm governance commands use a small Node launcher so they work on systems that have either `pwsh` or Windows PowerShell available.
