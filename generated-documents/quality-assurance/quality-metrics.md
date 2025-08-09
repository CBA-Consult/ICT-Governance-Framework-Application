# Quality Metrics Definition

Version: 0.1 (Draft)
Date: 2025-08-08
Owner: QA & Engineering

## Objectives
Define leading and lagging indicators for product and delivery quality, set targets, and reporting cadence.

## Product Quality Metrics
- Defect Density: defects per KLOC (target: < 0.5)
- Escape Rate: % defects found in prod (target: < 5%)
- Mean Time to Detect (MTTD): < 1 hour (P0/P1)
- Mean Time to Recover (MTTR): < 1 hour (P0)
- Test Coverage: unit > 80%, integration > 60%
- Performance SLO adherence: per Performance Requirements
- Security Findings: zero criticals, highs remediated < 7 days

## Delivery Metrics (DORA)
- Deployment Frequency: daily or multiple times per week
- Lead Time for Changes: < 24 hours (code→prod)
- Change Failure Rate: < 15%
- MTTR: < 1 hour

## Process Metrics
- PR Review Time: median < 4 hours
- Flaky Test Rate: < 2%
- CI Success Rate: > 95%

## Reporting
- Weekly dashboards; monthly review; trend analysis and actions

## Data Sources
- CI/CD systems, issue trackers, monitoring/observability, security scanners
