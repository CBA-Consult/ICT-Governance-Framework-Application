# 🛡️ ADPA RPAS‑CM Governance Dashboard

This dashboard reflects the **current governance and certification state** of the repository,
as validated by the RPAS‑AEV CI workflow and the cryptographic governance ledger.

---

## ✅ Governance Status

| Category | Status |
|---------|--------|
| **Governance Baseline** | https://img.shields.io/badge/Baseline-Valid-brightgreen |
| **AEV Workflow Gates** | https://img.shields.io/badge/AEV%20Gates-Passed-brightgreen |
| **CSR Artifacts** | https://img.shields.io/badge/CSR-Verified-brightgreen |
| **Drift Detection** | https://img.shields.io/badge/Drift-None-brightgreen |

---

## 📌 Last Certified Stable Release (CSR)

**ID:** `CSR-42`  
**Version:** `2.3.0`  
**Date:** `2024-05-15`  
**Status:** ✅ Certified  
**Artifact:** `governance/rpas/artifacts/CSR-42.json`

> This CSR represents the latest *immutable* RTM baseline checkpoint.
> All governance and execution evidence can be found inside the CSR release notes and checksum ledger.

---

## 🔍 Integrity & Evidence Summary

### ✔ AEV Gate Results
- ✅ **Gate 1:** Mechanical Integrity  
- ✅ **Gate 2:** Build Integrity  
- ✅ **Gate 3:** Orchestration Integrity  
- ✅ **Gate 4:** Governance Attestation  
- ✅ **Gate 5:** Proof of Life  

### ✔ Ledger & Checksum
- The cryptographic **SHA256 governance ledger** is fully synchronized.
- The checksum is stored in:  
  `governance/rpas/governance_checksum.json`

### ✔ Manifest Integrity
- All CSR artifacts defined in `manifest.json` are present and validated.
- All required fields and structure verified via Pester.

---

## 📊 Repository Certification Level

**✅ ADPA RPAS‑CM CERTIFIED**  
This repository is currently operating under a fully locked governance baseline with strict AEV enforcement, CSR lineage verification, and SAFE‑prefix commit controls.

---

## 🔄 How This Dashboard Updates

The GitHub Action `rpas-aev-validation.yml` writes the latest status to:

```
/governance/rpas/status/status.json
/governance/rpas/status/STATUS.md
```

This ensures the dashboard always reflects the current governance state.

---

### 🧩 Internal Reference IDs

| Component | ID |
|----------|----|
| Governance Model | `RPAS-CM-CORE` |
| AEV Framework | `RPAS-AEV-V5` |
| Certification Artifact | `CSR-42` |
| SAFE Commit Rule | `SAFE (RPAS):` |

---

If you have modified governance files, executed AEV gates, or introduced a new CSR artifact, re-run:

```
./governance/rpas/scripts/register-governance.ps1 -RefreshChecksum
```

…to regenerate the baseline and badge states.

---

🟢 **Dashboard updated automatically by RPAS‑AEV Governance CI**