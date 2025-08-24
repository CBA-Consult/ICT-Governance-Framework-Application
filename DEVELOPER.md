DEVELOPER GUIDE

This file contains quick notes for contributors and maintainers working on the ICT Governance Framework project.

1) Run tests locally

- Install Pester v5 for your user (one-time):

```powershell
Install-Module -Name Pester -RequiredVersion 5 -Force -Scope CurrentUser -AllowClobber -SkipPublisherCheck
```

- Run the full test suite from the repository root:

```powershell
Invoke-Pester -Script .\tests\ -OutputFormat NUnitXml -OutputFile pester-results.xml -PassThru
```

2) Smoke test the module (no Azure credentials required to validate failure handling)

```powershell
Set-Location .\azure-automation
Import-Module .\ICT-Governance-Framework.psd1 -Force
# This may fail if you are not logged into Azure; that's expected for the no-login smoke path
New-GovDashboardReport -OutputPath .\governance-reports\smoke-dashboard-test.html -ErrorAction Stop
```

3) Developer workflow notes

- Configuration template: `azure-automation\governance-config.json` (used by FromConfig path)
- Logs are written under `azure-automation\governance-logs` by `Write-GovLog`
- Use the interactive launcher: `azure-automation\ICT-Governance-Framework-Menu.ps1`
- Avoid mutating module manifest objects at runtime; use the module's `$CONFIG` instead.

4) CI notes

- CI uses the workflow `.github/workflows/pester.yml` which installs Pester v5 and runs the `tests` folder.
- Push to `main` or open a PR to run CI.

5) Common commands

- Stage & commit local changes (example):

```powershell
git add -A
git commit -m "chore: small updates / docs"
```

That's it — keep changes small and unit-tested; update `DEVELOPER.md` as the project evolves.
