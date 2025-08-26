# Secure Score Data Elements Quick Reference

## Overview
This is a quick reference table mapping each visible data element on the secure-score page to its corresponding Microsoft Graph API field.

## Quick Reference Table

| UI Element | Display Location | Graph API Endpoint | Graph API Field | Data Type | Example Value |
|------------|------------------|-------------------|-----------------|-----------|---------------|
| **Page Header** |
| Page Title | Header | N/A | Static text | String | "Microsoft Secure Score" |
| Page Description | Header | N/A | Static text | String | "Monitor and improve..." |
| Time Range Selector | Header | N/A | User input | Integer | 30 |
| **Dashboard Header** |
| Dashboard Title | Dashboard header | N/A | Static text | String | "Microsoft Secure Score Dashboard" |
| Last Updated | Dashboard header | `/v1.0/security/secureScores` | `value[0].createdDateTime` | DateTime | "1/15/2024, 10:30:00 AM" |
| Sync Button | Dashboard header | N/A | Action trigger | Button | "Sync Now" |
| **Overview Cards** |
| Current Score Value | Overview card | `/v1.0/security/secureScores` | `value[0].currentScore` | Integer | 245 |
| Maximum Score | Overview card | `/v1.0/security/secureScores` | `value[0].maxScore` | Integer | 400 |
| Score Percentage | Overview card | `/v1.0/security/secureScores` | Calculated: `(currentScore/maxScore)*100` | Integer | 61 |
| Risk Areas Count | Overview card | `/v1.0/security/secureScoreControlProfiles` | Calculated from categories <50% | Integer | 3 |
| Recommendations Count | Overview card | `/v1.0/security/secureScoreControlProfiles` | Count of non-implemented controls | Integer | 12 |
| **Secure Score Gauge** |
| Gauge Current Score | Gauge center | `/v1.0/security/secureScores` | `value[0].currentScore` | Integer | 245 |
| Gauge Max Score | Gauge center | `/v1.0/security/secureScores` | `value[0].maxScore` | Integer | 400 |
| Gauge Percentage | Gauge center | `/v1.0/security/secureScores` | Calculated percentage | Integer | 61 |
| **Trends Chart** |
| Chart Date Points | X-axis | `/v1.0/security/secureScores` | `value[].createdDateTime` | DateTime | "2024-01-15" |
| Chart Score Values | Y-axis | `/v1.0/security/secureScores` | `value[].currentScore` | Integer | 245 |
| Chart Percentage Line | Y-axis | `/v1.0/security/secureScores` | Calculated percentage | Integer | 61 |
| **Control Categories** |
| Category Name | Chart labels | `/v1.0/security/secureScoreControlProfiles` | `value[].controlCategory` | String | "Identity" |
| Implementation Rate | Chart bars | `/v1.0/security/secureScoreControlProfiles` | Calculated from `controlStateUpdates` | Integer | 85 |
| Total Controls | Chart data | `/v1.0/security/secureScoreControlProfiles` | Count per category | Integer | 20 |
| Implemented Controls | Chart data | `/v1.0/security/secureScoreControlProfiles` | Count where state="On"/"Reviewed" | Integer | 17 |
| **Recommendations** |
| Recommendation Title | Card header | `/v1.0/security/secureScoreControlProfiles` | `value[].title` | String | "Enable multi-factor authentication" |
| Recommendation Category | Card subtitle | `/v1.0/security/secureScoreControlProfiles` | `value[].controlCategory` | String | "Identity" |
| Priority Badge | Card badge | `/v1.0/security/secureScoreControlProfiles` | Derived from `implementationCost` | String | "high" |
| User Impact | Card detail | `/v1.0/security/secureScoreControlProfiles` | `value[].userImpact` | String | "Moderate" |
| Impact Score | Card detail | `/v1.0/security/secureScoreControlProfiles` | Calculated composite score | Integer | 65 |
| Implementation Cost | Card detail | `/v1.0/security/secureScoreControlProfiles` | `value[].implementationCost` | String | "Low" |
| **Risk Areas** |
| Risk Area Name | List item | `/v1.0/security/secureScoreControlProfiles` | `value[].controlCategory` | String | "Device Management" |
| Risk Level | Color indicator | `/v1.0/security/secureScoreControlProfiles` | Calculated from implementation rate | String | "high" |
| Implementation Rate | Percentage | `/v1.0/security/secureScoreControlProfiles` | Calculated percentage | Integer | 25 |
| Risk Recommendation | Description text | `/v1.0/security/secureScoreControlProfiles` | Generated text | String | "Improve Device Management controls" |
| **Compliance Impact** |
| Framework Name | List item header | `/v1.0/security/secureScoreControlProfiles` | `value[].complianceInformation[].certificationName` | String | "ISO 27001" |
| Controls Count | List item detail | `/v1.0/security/secureScoreControlProfiles` | Count of mapped controls | String | "15/20 controls" |
| Compliance Score | List item score | `/v1.0/security/secureScoreControlProfiles` | Calculated percentage | Integer | 75 |
| **Recommendation Modal** |
| Modal Title | Modal header | `/v1.0/security/secureScoreControlProfiles` | `value[].title` | String | "Enable multi-factor authentication" |
| Modal Description | Modal body | `/v1.0/security/secureScoreControlProfiles` | `value[].description` | String | "Require users to register for MFA" |
| Modal Priority | Modal detail | `/v1.0/security/secureScoreControlProfiles` | Derived from `implementationCost` | String | "high" |
| Modal Impact Score | Modal detail | `/v1.0/security/secureScoreControlProfiles` | Calculated composite score | Integer | 65 |
| Modal Cost | Modal detail | `/v1.0/security/secureScoreControlProfiles` | `value[].implementationCost` | String | "Low" |
| Modal User Impact | Modal detail | `/v1.0/security/secureScoreControlProfiles` | `value[].userImpact` | String | "Moderate" |
| Modal Frameworks | Modal tags | `/v1.0/security/secureScoreControlProfiles` | `value[].complianceInformation[].certificationName` | Array | ["ISO 27001", "SOC 2"] |
| Modal Action | Modal text | `/v1.0/security/secureScoreControlProfiles` | Generated from `controlName` | String | "Implement MfaRegistration" |

## API Endpoints Summary

### Primary Endpoints
1. **`/v1.0/security/secureScores`**
   - Provides current and historical secure score data
   - Fields: `currentScore`, `maxScore`, `createdDateTime`, `activeUserCount`, `licensedUserCount`

2. **`/v1.0/security/secureScoreControlProfiles`**
   - Provides security control details and recommendations
   - Fields: `title`, `controlCategory`, `implementationCost`, `userImpact`, `controlStateUpdates`, `complianceInformation`

### Data Processing Functions
- **`calculateTrend()`**: Compares current vs previous scores
- **`processControlCategories()`**: Aggregates controls by category
- **`generateDetailedRecommendations()`**: Creates actionable recommendations
- **`calculateComplianceImpact()`**: Maps controls to compliance frameworks
- **`identifyRiskAreas()`**: Finds categories with low implementation rates

### Calculated Fields
- **Score Percentage**: `(currentScore / maxScore) * 100`
- **Implementation Rate**: `(implementedControls / totalControls) * 100`
- **Impact Score**: Weighted calculation based on `maxScore`, `implementationCost`, `userImpact`
- **Priority**: Inverse mapping of `implementationCost` (Low cost = High priority)
- **Risk Level**: Based on implementation rate thresholds (<25% = high, <50% = medium)

## Control State Mapping
- **"Default"**: Control not configured (shows in recommendations)
- **"Ignored"**: Control explicitly ignored (shows in recommendations)
- **"On"**: Control implemented and active (counts as implemented)
- **"Reviewed"**: Control reviewed and approved (counts as implemented)
- **"Off"**: Control disabled (does not count as implemented)

## Color Coding Standards
- **Score Percentage**: Green (≥80%), Yellow (60-79%), Red (<60%)
- **Risk Level**: Red (high risk), Yellow (medium risk)
- **Compliance Score**: Green (≥80%), Yellow (60-79%), Red (<60%)
- **Priority**: Red (critical), Orange (high), Blue (medium), Green (low)

This quick reference provides immediate lookup for any data element visible on the secure-score page and its corresponding Microsoft Graph API source.