# Microsoft Secure Score Data Elements Definition

## Overview

This document provides comprehensive definitions for each data element displayed on the secure-score/page.js and its corresponding Microsoft Graph API secure score fields. Each element is mapped to specific API responses from the Microsoft Graph Security API endpoints.

## Microsoft Graph API Endpoints Used

### Primary Endpoints
- **Secure Scores**: `/v1.0/security/secureScores`
- **Control Profiles**: `/v1.0/security/secureScoreControlProfiles`

### Authentication
- **Required Permissions**: `SecurityEvents.Read.All`, `SecurityActions.Read.All`, `Directory.Read.All`
- **Authentication Method**: Azure AD Application Credentials (Client Credentials Flow)

## Data Elements and API Field Mappings

### 1. Overview Cards (Dashboard Header)

#### Current Score
- **Display Element**: `overview.currentScore`
- **Graph API Source**: `secureScores[0].currentScore`
- **Data Type**: Integer
- **Description**: The current secure score value representing the organization's security posture
- **API Field Path**: `/v1.0/security/secureScores` → `value[0].currentScore`
- **Example Value**: 245
- **Calculation**: Direct value from Microsoft Graph API

#### Maximum Score
- **Display Element**: `overview.maxScore`
- **Graph API Source**: `secureScores[0].maxScore`
- **Data Type**: Integer
- **Description**: The maximum possible secure score based on available controls
- **API Field Path**: `/v1.0/security/secureScores` → `value[0].maxScore`
- **Example Value**: 400
- **Calculation**: Direct value from Microsoft Graph API

#### Score Percentage
- **Display Element**: `overview.percentage`
- **Graph API Source**: Calculated from `currentScore` and `maxScore`
- **Data Type**: Integer (percentage)
- **Description**: Percentage representation of current score vs maximum score
- **API Field Path**: Calculated: `Math.round((currentScore / maxScore) * 100)`
- **Example Value**: 61
- **Calculation**: `(245 / 400) * 100 = 61%`

#### Last Updated
- **Display Element**: `overview.lastUpdated`
- **Graph API Source**: `secureScores[0].createdDateTime`
- **Data Type**: ISO 8601 DateTime string
- **Description**: Timestamp when the secure score was last calculated by Microsoft
- **API Field Path**: `/v1.0/security/secureScores` → `value[0].createdDateTime`
- **Example Value**: "2024-01-15T10:30:00Z"
- **Calculation**: Direct value from Microsoft Graph API

### 2. Trend Analysis

#### Trend Direction
- **Display Element**: `overview.trend.direction`
- **Graph API Source**: Calculated from historical `secureScores` data
- **Data Type**: String (enum: 'improving', 'declining', 'stable')
- **Description**: Direction of score change compared to previous measurement
- **API Field Path**: Calculated from multiple `/v1.0/security/secureScores` entries
- **Example Value**: "improving"
- **Calculation**: Compare current vs previous score percentage

#### Trend Change
- **Display Element**: `overview.trend.change`
- **Graph API Source**: Calculated from historical score percentages
- **Data Type**: Number (decimal)
- **Description**: Percentage point change in score
- **API Field Path**: Calculated from historical data
- **Example Value**: +2.5
- **Calculation**: `currentPercentage - previousPercentage`

### 3. Historical Trends Chart

#### Trend Data Points
- **Display Element**: `trends[]`
- **Graph API Source**: Historical `secureScores` entries
- **Data Type**: Array of objects
- **Description**: Time series data for score progression
- **API Field Mapping**:
  - `date`: `secureScores[].createdDateTime`
  - `score`: `secureScores[].currentScore`
  - `maxScore`: `secureScores[].maxScore`
  - `percentage`: Calculated percentage
- **Example Structure**:
```json
{
  "date": "2024-01-15T10:30:00Z",
  "score": 245,
  "maxScore": 400,
  "percentage": 61
}
```

### 4. Control Categories

#### Control Category Data
- **Display Element**: `controlCategories[]`
- **Graph API Source**: `secureScoreControlProfiles`
- **Data Type**: Array of category objects
- **Description**: Aggregated control implementation by category
- **API Field Mapping**:
  - `name`: `controlProfiles[].controlCategory`
  - `totalControls`: Count of controls in category
  - `implementedControls`: Count where `controlStateUpdates[latest].state` is "On" or "Reviewed"
  - `implementationRate`: Calculated percentage
- **API Field Path**: `/v1.0/security/secureScoreControlProfiles` → aggregated by `controlCategory`

#### Control Category Fields
- **Category Name**: `controlProfiles[].controlCategory`
- **Total Controls**: Count of profiles per category
- **Implemented Controls**: Count where latest state is active
- **Implementation Rate**: `(implementedControls / totalControls) * 100`

### 5. Recommendations

#### Recommendation Data
- **Display Element**: `topRecommendations[]`
- **Graph API Source**: `secureScoreControlProfiles` (filtered and processed)
- **Data Type**: Array of recommendation objects
- **Description**: Actionable security recommendations based on control profiles
- **API Field Mapping**:

##### Recommendation Title
- **Display Element**: `recommendation.title`
- **Graph API Source**: `controlProfile.title`
- **API Field Path**: `/v1.0/security/secureScoreControlProfiles` → `value[].title`
- **Example**: "Enable multi-factor authentication for all users"

##### Recommendation Category
- **Display Element**: `recommendation.category`
- **Graph API Source**: `controlProfile.controlCategory`
- **API Field Path**: `/v1.0/security/secureScoreControlProfiles` → `value[].controlCategory`
- **Example**: "Identity"

##### Priority Level
- **Display Element**: `recommendation.priority`
- **Graph API Source**: Calculated from `controlProfile.implementationCost`
- **Mapping Logic**:
  - "Low" cost → "high" priority
  - "Moderate" cost → "medium" priority
  - "High" cost → "low" priority
- **API Field Path**: Derived from `value[].implementationCost`

##### Implementation Cost
- **Display Element**: `recommendation.implementationCost`
- **Graph API Source**: `controlProfile.implementationCost`
- **API Field Path**: `/v1.0/security/secureScoreControlProfiles` → `value[].implementationCost`
- **Possible Values**: "Low", "Moderate", "High"

##### User Impact
- **Display Element**: `recommendation.userImpact`
- **Graph API Source**: `controlProfile.userImpact`
- **API Field Path**: `/v1.0/security/secureScoreControlProfiles` → `value[].userImpact`
- **Possible Values**: "Low", "Moderate", "High"

##### Impact Score
- **Display Element**: `recommendation.impactScore`
- **Graph API Source**: Calculated from multiple control profile fields
- **Calculation Logic**:
  - Base score from `maxScore * 0.4`
  - Implementation cost factor (Low: +30, Moderate: +20, High: +10)
  - User impact factor (Low: +25, Moderate: +15, High: +5)
- **API Field Path**: Calculated from `value[].maxScore`, `implementationCost`, `userImpact`

##### Compliance Frameworks
- **Display Element**: `recommendation.complianceFrameworks[]`
- **Graph API Source**: `controlProfile.complianceInformation[].certificationName`
- **API Field Path**: `/v1.0/security/secureScoreControlProfiles` → `value[].complianceInformation[].certificationName`
- **Example**: ["ISO 27001", "SOC 2", "NIST"]

### 6. Risk Areas

#### Risk Area Data
- **Display Element**: `riskAreas[]`
- **Graph API Source**: Calculated from control categories with low implementation rates
- **Data Type**: Array of risk area objects
- **Description**: Categories with implementation rates below 50%
- **API Field Mapping**:
  - `area`: Category name from `controlCategory`
  - `riskLevel`: "high" if <25%, "medium" if <50%
  - `implementationRate`: Calculated percentage
  - `recommendation`: Generated text based on category

### 7. Compliance Impact

#### Compliance Framework Data
- **Display Element**: `complianceImpact[]`
- **Graph API Source**: `controlProfile.complianceInformation`
- **Data Type**: Array of compliance framework objects
- **Description**: Implementation status by compliance framework
- **API Field Mapping**:

##### Framework Name
- **Display Element**: `framework.name`
- **Graph API Source**: `complianceInformation[].certificationName`
- **API Field Path**: `/v1.0/security/secureScoreControlProfiles` → `value[].complianceInformation[].certificationName`

##### Total Controls
- **Display Element**: `framework.totalControls`
- **Graph API Source**: Count of controls mapped to framework
- **Calculation**: Count of profiles containing the framework in `complianceInformation`

##### Implemented Controls
- **Display Element**: `framework.implementedControls`
- **Graph API Source**: Count of implemented controls for framework
- **Calculation**: Count where `controlStateUpdates[latest].state` is "On" or "Reviewed"

##### Compliance Score
- **Display Element**: `framework.score`
- **Graph API Source**: Calculated percentage
- **Calculation**: `(implementedControls / totalControls) * 100`

### 8. Control State Information

#### Control State Updates
- **Display Element**: Used for determining implementation status
- **Graph API Source**: `controlProfile.controlStateUpdates[]`
- **Data Type**: Array of state change objects
- **Description**: History of control state changes
- **API Field Path**: `/v1.0/security/secureScoreControlProfiles` → `value[].controlStateUpdates[]`

##### State Values
- **"Default"**: Control not configured
- **"Ignored"**: Control explicitly ignored
- **"On"**: Control implemented and active
- **"Reviewed"**: Control reviewed and approved
- **"Off"**: Control disabled

##### State Update Fields
- **State**: `controlStateUpdates[].state`
- **Updated By**: `controlStateUpdates[].updatedBy`
- **Updated Date**: `controlStateUpdates[].updatedDateTime`
- **Reason**: `controlStateUpdates[].reason`

### 9. Additional Metadata

#### Active User Count
- **Display Element**: Used in calculations (not directly displayed)
- **Graph API Source**: `secureScore.activeUserCount`
- **API Field Path**: `/v1.0/security/secureScores` → `value[].activeUserCount`
- **Description**: Number of active users in the organization

#### Licensed User Count
- **Display Element**: Used in calculations (not directly displayed)
- **Graph API Source**: `secureScore.licensedUserCount`
- **API Field Path**: `/v1.0/security/secureScores` → `value[].licensedUserCount`
- **Description**: Number of licensed users in the organization

#### Enabled Services
- **Display Element**: Used in calculations (not directly displayed)
- **Graph API Source**: `secureScore.enabledServices[]`
- **API Field Path**: `/v1.0/security/secureScores` → `value[].enabledServices[]`
- **Description**: List of enabled Microsoft services contributing to the score

## Data Processing Flow

### 1. API Data Retrieval
```javascript
// Fetch secure scores
GET /v1.0/security/secureScores?$top=50&$orderby=createdDateTime desc

// Fetch control profiles
GET /v1.0/security/secureScoreControlProfiles?$top=100
```

### 2. Data Transformation
- Raw API responses are processed and stored in database
- Calculations are performed for derived metrics
- Historical data is aggregated for trend analysis

### 3. Dashboard Rendering
- Processed data is formatted for UI components
- Real-time calculations for percentages and trends
- Interactive elements for drill-down capabilities

## Error Handling and Data Quality

### Missing Data Scenarios
- **No Secure Score Data**: Display sync prompt
- **Incomplete Control Profiles**: Show available data with warnings
- **API Rate Limiting**: Implement retry logic with exponential backoff

### Data Validation
- Verify score values are within expected ranges
- Validate timestamp formats and chronological order
- Check for required fields in API responses

### Fallback Values
- Default to 0 for missing scores
- Use "Unknown" for missing categories
- Provide generic recommendations when specific data unavailable

## Performance Considerations

### Caching Strategy
- Cache API responses for 1 hour (configurable)
- Store processed dashboard data for quick retrieval
- Implement incremental updates for large datasets

### Optimization Techniques
- Paginate large control profile datasets
- Use database indexes for historical queries
- Implement client-side caching for static data

## Security and Privacy

### Data Protection
- Secure score data contains sensitive security information
- Implement proper access controls based on user permissions
- Audit access to secure score data

### API Security
- Secure storage of Azure AD credentials
- Use managed identities where possible
- Monitor API usage for anomalies

---

This documentation provides a complete mapping between the UI elements displayed on the secure-score page and the underlying Microsoft Graph API fields, enabling developers and administrators to understand the data flow and make informed decisions about security posture management.