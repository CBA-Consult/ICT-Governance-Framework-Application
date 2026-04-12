# RPAS Governance Integration

This directory anchors the RPAS governance baseline inside this repository.

The current implementation is a `vendor-scaffold` integration. It gives the project:

- committed RPAS binding metadata
- ADPA, ARM, and AEV control placeholders with traceability fields
- checksum-based drift detection
- a local pre-commit hook template
- CI validation through GitHub Actions

## Layout

```text
governance/rpas/
|- artifacts/                  RPAS control metadata committed with the project
|- hooks/                      Versioned local hook templates
|- scripts/                    Registration and validation tooling
|- templates/                  Evidence metadata templates
|- governance_checksum.json    Committed checksum for drift detection
|- manifest.json               Governance manifest and required file list
`- project.binding.json        Project-specific RPAS binding settings
```

## Commands

```powershell
npm run governance:register
npm run governance:validate
npm run governance:checksum
```

## Upgrading To A Canonical Source

When the authoritative RPAS repository URL is available, replace this scaffold with either:

- `git submodule add <url> governance/rpas`
- `git subtree add --prefix governance/rpas <url> <branch> --squash`

After switching, update `project.binding.json.authoritativeSource` and refresh the checksum:

```powershell
./governance/rpas/scripts/validate-aev.ps1 -RefreshChecksum
```
