# Secure Score Page Data Element Definitions

## Overview

This document provides detailed definitions for each data element displayed on the secure-score/page.js, mapping every UI component to its corresponding Microsoft Graph API secure score fields. Each element shows exactly which Graph API endpoints and fields are used to produce the data visible to users.

## Microsoft Graph API Endpoints

### Primary Endpoints Used
- **Secure Scores**: `GET /v1.0/security/secureScores`
- **Control Profiles**: `GET /v1.0/security/secureScoreControlProfiles`

### Authentication Requirements
- **Permissions**: `SecurityEvents.Read.All`, `SecurityActions.Read.All`, `Directory.Read.All`
- **Grant Type**: Client Credentials Flow with Azure AD

## Page Structure and Data Elements

### 1. Page Header Section

#### Page Title
- **Display Element**: "Microsoft Secure Score"
- **Data Source**: Static text
- **Graph API Field**: N/A (Static content)

#### Page Description
- **Display Element**: "Monitor and improve your organization's security posture with Microsoft Graph API integration"
- **Data Source**: Static text
- **Graph API Field**: N/A (Static content)

#### Time Range Selector
- **Display Element**: Dropdown with options (7, 30, 90, 365 days)
- **Data Source**: User input
- **Graph API Field**: Used as filter parameter in API queries
- **Impact**: Affects `$filter` parameter in secure scores queries

### 2. Dashboard Header Section

#### Dashboard Title
- **Display Element**: "Microsoft Secure Score Dashboard"
- **Data Source**: Static text
- **Graph API Field**: N/A (Static content)

#### Last Updated Timestamp
- **Display Element**: "Last updated: [timestamp]"
- **Data Source**: `overview.lastUpdated`
- **Graph API Field**: `secureScores[0].createdDateTime`
- **API Endpoint**: `/v1.0/security/secureScores`
- **Field Path**: `value[0].createdDateTime`
- **Data Type**: ISO 8601 DateTime string
- **Example**: "Last updated: 1/15/2024, 10:30:00 AM"
- **Processing**: Converted to localized date/time string using `new Date().toLocaleString()`

#### Sync Now Button
- **Display Element**: Button labeled "Sync Now"
- **Action**: Triggers POST to `/api/secure-scores/sync`
- **Graph API Field**: N/A (Action trigger)
- **Functionality**: Initiates fresh data retrieval from Microsoft Graph API

### 3. Overview Cards Section

#### Current Score Card
- **Display Element**: Large numeric display with trend indicator
- **Title**: "Current Score"
- **Value**: `overview.currentScore`
- **Unit**: `/${overview.maxScore}`
- **Graph API Source**: 
  - Current: `secureScores[0].currentScore`
  - Maximum: `secureScores[0].maxScore`
- **API Endpoint**: `/v1.0/security/secureScores`
- **Field Paths**: 
  - `value[0].currentScore` (Integer)
  - `value[0].maxScore` (Integer)
- **Example**: "245/400"
- **Description**: Current secure score value out of maximum possible score
- **Trend Calculation**: Compares current vs previous score from historical data

#### Score Percentage Card
- **Display Element**: Percentage with color-coded background
- **Title**: "Score Percentage"
- **Value**: `overview.percentage`
- **Unit**: "%"
- **Graph API Source**: Calculated from `currentScore` and `maxScore`
- **API Endpoint**: `/v1.0/security/secureScores`
- **Calculation**: `Math.round((currentScore / maxScore) * 100)`
- **Example**: "61%"
- **Color Coding**:
  - Green (≥80%): Excellent security posture
  - Yellow (60-79%): Good security posture
  - Red (<60%): Needs improvement
- **Trend Indicator**: Shows percentage point change from previous measurement

#### Risk Areas Card
- **Display Element**: Count with red warning icon
- **Title**: "Risk Areas"
- **Value**: `riskAreas.length`
- **Graph API Source**: Calculated from `secureScoreControlProfiles`
- **API Endpoint**: `/v1.0/security/secureScoreControlProfiles`
- **Field Processing**: 
  - Groups by `value[].controlCategory`
  - Calculates implementation rate per category
  - Counts categories with <50% implementation
- **Example**: "3"
- **Description**: Number of control categories with low implementation rates
- **Risk Threshold**: Categories with implementation rate below 50%

#### Top Recommendations Card
- **Display Element**: Count with clock icon
- **Title**: "Top Recommendations"
- **Value**: `topRecommendations.length`
- **Graph API Source**: Filtered from `secureScoreControlProfiles`
- **API Endpoint**: `/v1.0/security/secureScoreControlProfiles`
- **Field Processing**:
  - Filters where `value[].controlStateUpdates[latest].state` is "Default" or "Ignored"
  - Sorts by calculated impact score
  - Takes top 5 recommendations
- **Example**: "12"
- **Description**: Number of high-priority actionable security recommendations

### 4. Main Dashboard Content

#### Secure Score Gauge
- **Display Element**: Radial progress chart
- **Title**: "Current Secure Score"
- **Data Sources**:
  - Current Score: `overview.currentScore`
  - Maximum Score: `overview.maxScore`
- **Graph API Fields**:
  - `secureScores[0].currentScore`
  - `secureScores[0].maxScore`
- **API Endpoint**: `/v1.0/security/secureScores`
- **Visual Elements**:
  - Center Display: "245/400"
  - Percentage: "61%"
  - Color: Based on percentage (green/yellow/red)
- **Description**: Visual representation of current security posture

#### Score Trends Chart
- **Display Element**: Line chart with dual lines
- **Title**: "Score Trends ([timeRange] days)"
- **Data Source**: `trends` array
- **Graph API Source**: Historical `secureScores` data
- **API Endpoint**: `/v1.0/security/secureScores` (multiple entries)
- **Field Mappings**:
  - X-axis (date): `value[].createdDateTime`
  - Y-axis (score): `value[].currentScore`
  - Y-axis (percentage): Calculated `(currentScore/maxScore)*100`
- **Chart Lines**:
  - Blue Line: "Score Percentage" 
  - Green Line: "Current Score"
- **Data Processing**: `processTrendData()` function reverses chronological order for chart display
- **Example Data Point**:
```json
{
  "date": "2024-01-15T10:30:00Z",
  "score": 245,
  "maxScore": 400,
  "percentage": 61
}
```

### 5. Control Categories Implementation

#### Control Categories Chart
- **Display Element**: Horizontal bar chart
- **Title**: "Control Categories Implementation"
- **Data Source**: `controlCategories` array
- **Graph API Source**: Aggregated `secureScoreControlProfiles`
- **API Endpoint**: `/v1.0/security/secureScoreControlProfiles`
- **Field Processing**:
  - Groups by: `value[].controlCategory`
  - Implementation status: `value[].controlStateUpdates[latest].state`
  - Implemented states: "On", "Reviewed"
  - Non-implemented states: "Default", "Ignored", "Off"
- **Chart Data**:
  - Category Name: `controlCategory`
  - Implementation Rate: `(implementedControls / totalControls) * 100`
- **Example Categories**: "Identity", "Data Protection", "Device Management"
- **Processing Function**: `processControlCategories()`

### 6. Top Recommendations Section

#### Recommendation Cards
- **Display Element**: Scrollable list of recommendation cards
- **Title**: "Top Recommendations"
- **Data Source**: `topRecommendations` array
- **Graph API Source**: Processed `secureScoreControlProfiles`
- **API Endpoint**: `/v1.0/security/secureScoreControlProfiles`

##### Individual Recommendation Card Fields:

###### Recommendation Title
- **Display Element**: Card header text
- **Graph API Field**: `value[].title`
- **Example**: "Enable multi-factor authentication for all users"

###### Category
- **Display Element**: Subtitle text
- **Graph API Field**: `value[].controlCategory`
- **Example**: "Identity"

###### Priority Badge
- **Display Element**: Colored badge (critical/high/medium/low)
- **Graph API Source**: Derived from `value[].implementationCost`
- **Mapping Logic**:
  - "Low" cost → "high" priority
  - "Moderate" cost → "medium" priority
  - "High" cost → "low" priority
- **Processing Function**: `mapImplementationCostToPriority()`

###### User Impact
- **Display Element**: Impact level with icon
- **Graph API Field**: `value[].userImpact`
- **Possible Values**: "Low", "Moderate", "High"
- **Icon Mapping**:
  - Low: CheckCircleIcon
  - Moderate: InformationCircleIcon
  - High: ExclamationTriangleIcon

###### Impact Score
- **Display Element**: Numeric score
- **Graph API Source**: Calculated from multiple fields
- **Calculation Logic**:
  - Base score: `maxScore * 0.4`
  - Cost factor: Low(+30), Moderate(+20), High(+10)
  - Impact factor: Low(+25), Moderate(+15), High(+5)
- **Processing Function**: `calculateImpactScore()`

###### Implementation Cost
- **Display Element**: Cost level text
- **Graph API Field**: `value[].implementationCost`
- **Possible Values**: "Low", "Moderate", "High"

### 7. Risk Areas Section

#### Risk Area Items
- **Display Element**: List of risk area cards
- **Title**: "Risk Areas"
- **Data Source**: `riskAreas` array
- **Graph API Source**: Categories with low implementation rates
- **Processing**: Derived from control categories analysis

##### Risk Area Fields:

###### Area Name
- **Display Element**: Bold category name
- **Graph API Source**: `controlCategory` from control profiles
- **Example**: "Device Management"

###### Risk Level Indicator
- **Display Element**: Colored dot (red/yellow)
- **Calculation**:
  - High risk (red): <25% implementation
  - Medium risk (yellow): 25-49% implementation

###### Implementation Rate
- **Display Element**: Percentage value
- **Calculation**: `(implementedControls / totalControls) * 100`
- **Example**: "25%"

###### Recommendation Text
- **Display Element**: Descriptive text
- **Generation**: "Improve [category] controls implementation"
- **Example**: "Improve Device Management controls implementation"

### 8. Compliance Framework Impact

#### Compliance Framework Items
- **Display Element**: List of compliance framework cards
- **Title**: "Compliance Framework Impact"
- **Data Source**: `complianceImpact` array
- **Graph API Source**: `complianceInformation` from control profiles
- **API Endpoint**: `/v1.0/security/secureScoreControlProfiles`

##### Compliance Framework Fields:

###### Framework Name
- **Display Element**: Bold framework name
- **Graph API Field**: `value[].complianceInformation[].certificationName`
- **Example**: "ISO 27001", "SOC 2", "NIST"

###### Control Count
- **Display Element**: "X/Y controls" format
- **Calculation**:
  - Total: Count of controls mapped to framework
  - Implemented: Count where `controlStateUpdates[latest].state` is "On" or "Reviewed"
- **Example**: "15/20 controls"

###### Compliance Score
- **Display Element**: Large percentage with color coding
- **Calculation**: `(implementedControls / totalControls) * 100`
- **Color Coding**:
  - Green (≥80%): Good compliance
  - Yellow (60-79%): Moderate compliance
  - Red (<60%): Poor compliance
- **Example**: "75%"

### 9. Recommendation Details Modal

#### Modal Content (Displayed when recommendation card is clicked)

##### Recommendation Title
- **Display Element**: Modal header
- **Graph API Field**: `value[].title`

##### Description
- **Display Element**: Detailed description text
- **Graph API Field**: `value[].description`

##### Priority
- **Display Element**: Priority badge
- **Graph API Source**: Calculated from `implementationCost`

##### Impact Score
- **Display Element**: Numeric score
- **Graph API Source**: Calculated composite score

##### Implementation Cost
- **Display Element**: Cost level
- **Graph API Field**: `value[].implementationCost`

##### User Impact
- **Display Element**: Impact level
- **Graph API Field**: `value[].userImpact`

##### Compliance Frameworks
- **Display Element**: List of framework tags
- **Graph API Field**: `value[].complianceInformation[].certificationName`

##### Recommended Action
- **Display Element**: Action description
- **Generation**: "Implement [controlName] to improve security posture"
- **Graph API Source**: `value[].controlName`

## Data Processing Functions

### Key Processing Functions and Their Graph API Dependencies

#### `calculateTrend(historicalData)`
- **Input**: Historical secure scores from database
- **Graph API Source**: Multiple `/v1.0/security/secureScores` entries
- **Output**: `{ direction: 'improving'|'declining'|'stable', change: number }`

#### `processControlCategories(controlProfiles)`
- **Input**: Control profiles array
- **Graph API Source**: `/v1.0/security/secureScoreControlProfiles`
- **Key Fields Used**:
  - `controlCategory`
  - `controlStateUpdates[].state`
  - `maxScore`
- **Output**: Array of category objects with implementation rates

#### `generateDetailedRecommendations(controlProfiles)`
- **Input**: Control profiles array
- **Graph API Source**: `/v1.0/security/secureScoreControlProfiles`
- **Filtering**: Only controls with state "Default" or "Ignored"
- **Output**: Array of actionable recommendations

#### `calculateComplianceImpact(currentScore, controlProfiles)`
- **Input**: Current score and control profiles
- **Graph API Sources**:
  - Current score: `/v1.0/security/secureScores`
  - Compliance info: `/v1.0/security/secureScoreControlProfiles`
- **Key Field**: `complianceInformation[].certificationName`
- **Output**: Array of compliance framework status

## API Response Examples

### Secure Score Response Structure
```json
{
  "value": [
    {
      "id": "12345",
      "currentScore": 245,
      "maxScore": 400,
      "createdDateTime": "2024-01-15T10:30:00Z",
      "activeUserCount": 150,
      "licensedUserCount": 200,
      "enabledServices": ["Exchange", "SharePoint", "Teams"]
    }
  ]
}
```

### Control Profile Response Structure
```json
{
  "value": [
    {
      "id": "control-123",
      "controlName": "MfaRegistration",
      "title": "Enable multi-factor authentication for all users",
      "controlCategory": "Identity",
      "implementationCost": "Low",
      "userImpact": "Moderate",
      "maxScore": 10,
      "description": "Require users to register for multi-factor authentication",
      "complianceInformation": [
        {
          "certificationName": "ISO 27001",
          "certificationControls": ["A.9.4.2"]
        }
      ],
      "controlStateUpdates": [
        {
          "state": "Default",
          "updatedDateTime": "2024-01-01T00:00:00Z",
          "updatedBy": "system"
        }
      ]
    }
  ]
}
```

## Data Flow Summary

1. **API Calls**: Frontend requests dashboard data from `/api/secure-scores/dashboard`
2. **Graph API Queries**: Backend fetches data from Microsoft Graph API endpoints
3. **Data Processing**: Raw API responses processed through calculation functions
4. **Database Storage**: Processed data stored for historical tracking
5. **Response Formation**: Dashboard data structure created and returned
6. **UI Rendering**: Frontend components display processed data elements

Each data element on the secure-score page is directly traceable to specific Microsoft Graph API fields, ensuring complete transparency in data sourcing and processing.