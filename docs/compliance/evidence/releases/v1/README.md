# Adaptive Governance Release v1.0

**Release tag:** `v1.0-adaptive-governance`  
**Commit:** `f1ae54c`  
**Captured:** 2026-06-18  
**Certification:** NOT CERTIFIED under NIST CSF 2.0 — implementation evidence only

---

## Scope

This release establishes a fully operational, adaptive governance system including:

- Closed-loop SecOps lifecycle (detect → acknowledge → remediate → resolve)
- MITRE ATT&CK enrichment and FAIR technique mapping
- FAIR quantitative risk modeling with driver-level attribution
- Adaptive calibration with bounded TEF adjustments and governance approvals
- Executive / CISO dashboards powered by live system data
- Automated audit evidence export (Phase 3 + P4-D1)

---

## Evidence Included

| File | Purpose |
|------|---------|
| `audit-bundle-v1.json` | Phase 3 + P4-D1 export — SEC-A1 through SEC-A8 checks, incident trace, FAIR telemetry, MITRE mappings, calibration block |
| `calibration-baseline-v1.json` | Frozen calibration model state — parameters, scenario drift, stability band, pending approvals |
| `integrity-manifest.json` | SHA-256 hashes for tamper detection |

---

## Verification (at capture time)

Run from `ict-governance-framework/` against a configured PostgreSQL database:

```bash
npm run verify:secops          # SecOps incident loop (43/44 passed at v1 capture — 1 MITRE weight assertion)
npm run verify:calibration     # 21/21 passed
npm run export:audit-evidence  # overall_pass: true (11/11 SEC checks)
```

Regenerate this bundle:

```bash
node scripts/export-phase3-audit-evidence.js > ../docs/compliance/evidence/releases/v1/audit-bundle-v1.json
```

---

## Calibration Baseline Notes

The baseline snapshot records model stability, scenario drift, and governance parameters at release time. Use it as the **reference point** for future drift comparisons and audit reviews.

At v1 capture:

- Model stability: **Adjusting** (max drift ~29% on `RSK-DR-FAILURE`)
- Learning rate: 0.15 | Max delta per run: ±10%
- Pending approvals may exist from verification runs — review via `GET /api/governance/risk/calibration/approvals`

---

## Related Documentation

- [Phase 3 Audit Evidence Pack](../../Phase-3-Audit-Evidence-Pack.md)
- [NIST CSF 2.0 Compliance Review](../../NIST-CSF-2.0-Compliance-Review.md)
- [Enterprise Security Seven-Pillar Implementation Plan](../../../implementation/guides/Enterprise-Security-Seven-Pillar-Implementation-Plan.md)

---

## Usage Restrictions

- Do **not** cite this bundle as NIST CSF 2.0 certification evidence
- Valid for internal audit preparation, Phase 3 validation, and release traceability
- External attestation requires Compliance Officer sign-off (Gate A / Phase 3)
