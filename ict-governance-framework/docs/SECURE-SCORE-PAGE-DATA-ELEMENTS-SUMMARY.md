# Secure Score Page Data Elements Summary

## Overview

This document provides a comprehensive summary of all data elements available on the secure-score/page.js and their corresponding Microsoft Graph API secure score fields. Each element is mapped to specific API responses and includes detailed descriptions of how the data is processed and displayed.

## Page Structure and Data Elements

### 1. Page Header Elements

#### Page Title
- **Element**: "Microsoft Secure Score"
- **Description**: Static title indicating the page purpose
- **Data Source**: Static text

#### Page Description
- **Element**: "Monitor and improve your organization's security posture with Microsoft Graph API integration"
- **Description**: Static description explaining the page functionality
- **Data Source**: Static text

#### Time Range Selector
- **Element**: Dropdown with options (7, 30, 90, 365 days)
- **Description**: User-selectable time range for historical data analysis
- **Data Source**: User input
- **Impact**: Affects all time-based queries and trend calculations

### 2. Dashboard Tab - Overview Cards

#### Current Score Card
- **Display Element**: Large numeric display showing current secure score
- **Graph API Source**: `secureScores[0].currentScore`
- **API Endpoint**: `/v1.0/security/secureScores`
- **Field Path**: `value[0].currentScore`
- **Data Type**: Integer
- **Example**: 245
- **Description**: The current secure score value representing the organization's security posture
- **Calculation**: Direct value from Microsoft Graph API
- **Trend Indicator**: Shows improvement/decline arrow with percentage change

#### Score Percentage Card
- **Display Element**: Percentage representation of current vs maximum score
- **Graph API Source**: Calculated from `currentScore` and `maxScore`
- **API Endpoint**: `/v1.0/security/secureScores`
- **Field Path**: Calculated: `(currentScore / maxScore) * 100`
- **Data Type**: Integer (percentage)
- **Example**: 61%
- **Description**: Percentage representation showing how close the organization is to the maximum possible score
- **Color Coding**: 
  - Green (≥80%): Excellent security posture
  - Yellow (60-79%): Good security posture
  - Red (<60%): Needs improvement
- **Trend Indicator**: Shows percentage point change from previous measurement

#### Risk Areas Card
- **Display Element**: Count of categories with low implementation rates
- **Graph API Source**: Calculated from `secureScoreControlProfiles`
- **API Endpoint**: `/v1.0/security/secureScoreControlProfiles`
- **Field Path**: Aggregated from `controlCategory` where implementation rate < 50%
- **Data Type**: Integer
- **Example**: 3
- **Description**: Number of control categories that have implementation rates below 50%
- **Calculation**: Count categories where `(implementedControls / totalControls) < 0.5`

#### Top Recommendations Card
- **Display Element**: Count of high-priority actionable recommendations
- **Graph API Source**: Filtered from `secureScoreControlProfiles`
- **API Endpoint**: `/v1.0/security/secureScoreControlProfiles`
- **Field Path**: Count of profiles where `controlStateUpdates[latest].state` is "Default" or "Ignored"
- **Data Type**: Integer
- **Example**: 12
- **Description**: Number of security controls that can be implemented to improve the score
- **Filtering**: Top 5 recommendations based on impact score

### 3. Dashboard Tab - Main Content

#### Secure Score Gauge
- **Display Element**: Radial progress chart showing current score vs maximum
- **Graph API Source**: `currentScore` and `maxScore` from secure scores
- **API Endpoint**: `/v1.0/security/secureScores`
- **Field Paths**: 
  - Current: `value[0].currentScore`
  - Maximum: `value[0].maxScore`
- **Data Type**: Numeric values displayed as gauge
- **Example**: 245/400 (61%)
- **Description**: Visual representation of security score progress
- **Color Coding**: Same as percentage card (green/yellow/red)

#### Score Trends Chart
- **Display Element**: Line chart showing score progression over time
- **Graph API Source**: Historical `secureScores` data
- **API Endpoint**: `/v1.0/security/secureScores` (multiple entries)
- **Field Paths**:
  - X-axis: `value[].createdDateTime`
  - Y-axis: `value[].currentScore` and calculated percentage
- **Data Type**: Time series data
- **Example**: Daily/weekly score progression over selected time range
- **Description**: Historical trend analysis showing score improvements or declines
- **Chart Features**: 
  - Dual lines (absolute score and percentage)
  - Interactive tooltips with exact values
  - Responsive design for different screen sizes

#### Control Categories Implementation Chart
- **Display Element**: Horizontal bar chart showing implementation rates by category
- **Graph API Source**: Aggregated `secureScoreControlProfiles` by category
- **API Endpoint**: `/v1.0/security/secureScoreControlProfiles`
- **Field Paths**:
  - Categories: `value[].controlCategory`
  - Implementation status: `value[].controlStateUpdates[latest].state`
- **Data Type**: Categorical data with percentages
- **Example**: Identity (85%), Data Protection (72%), Device Management (45%)
- **Description**: Shows implementation progress across different security control categories
- **Calculation**: For each category, `(implemented controls / total controls) * 100`

#### Top Recommendations List
- **Display Element**: Cards showing actionable security recommendations
- **Graph API Source**: Processed `secureScoreControlProfiles`
- **API Endpoint**: `/v1.0/security/secureScoreControlProfiles`
- **Field Paths**:
  - Title: `value[].title`
  - Category: `value[].controlCategory`
  - Priority: Derived from `value[].implementationCost`
  - Impact Score: Calculated from multiple fields
  - User Impact: `value[].userImpact`
  - Implementation Cost: `value[].implementationCost`
- **Data Type**: Array of recommendation objects
- **Example**: "Enable multi-factor authentication for all users" (High priority, Low cost, Moderate impact)
- **Description**: Prioritized list of security improvements that can be implemented
- **Sorting**: By impact score (highest first)
- **Filtering**: Only shows controls not currently implemented

#### Risk Areas Section
- **Display Element**: List of security categories requiring attention
- **Graph API Source**: Categories with low implementation rates
- **API Endpoint**: `/v1.0/security/secureScoreControlProfiles`
- **Field Paths**: Aggregated by `controlCategory`
- **Data Type**: Array of risk area objects
- **Example**: "Device Management" (25% implementation rate, High risk)
- **Description**: Categories where implementation rates are below acceptable thresholds
- **Risk Levels**:
  - High risk: <25% implementation
  - Medium risk: 25-49% implementation
- **Recommendations**: Generated suggestions for each risk area

#### Compliance Framework Impact
- **Display Element**: List showing compliance framework implementation status
- **Graph API Source**: `complianceInformation` from control profiles
- **API Endpoint**: `/v1.0/security/secureScoreControlProfiles`
- **Field Paths**:
  - Framework name: `value[].complianceInformation[].certificationName`
  - Control mapping: Cross-reference with implementation status
- **Data Type**: Array of compliance framework objects
- **Example**: "ISO 27001" (78% compliance), "SOC 2" (65% compliance)
- **Description**: Shows how secure score improvements impact various compliance frameworks
- **Calculation**: Percentage of framework-related controls that are implemented

### 4. Recommendation Details Modal

#### Detailed Recommendation Information
- **Display Element**: Modal popup with comprehensive recommendation details
- **Graph API Source**: Individual `secureScoreControlProfile` object
- **API Endpoint**: `/v1.0/security/secureScoreControlProfiles`
- **Field Paths**:
  - Title: `value[].title`
  - Description: `value[].description`
  - Category: `value[].controlCategory`
  - Priority: Calculated from `implementationCost`
  - Impact Score: Calculated composite score
  - Implementation Cost: `value[].implementationCost`
  - User Impact: `value[].userImpact`
  - Compliance Frameworks: `value[].complianceInformation[].certificationName`
  - Action: Generated recommendation text
- **Data Type**: Detailed object with all recommendation metadata
- **Description**: Comprehensive view of a specific security recommendation
- **Interactive Elements**: Close button, framework tags, action descriptions

### 5. Sync and Update Features

#### Last Updated Timestamp
- **Display Element**: Text showing when data was last refreshed
- **Graph API Source**: `createdDateTime` from latest secure score
- **API Endpoint**: `/v1.0/security/secureScores`
- **Field Path**: `value[0].createdDateTime`
- **Data Type**: ISO 8601 DateTime string
- **Example**: "Last updated: 1/15/2024, 10:30:00 AM"
- **Description**: Indicates freshness of the displayed data
- **Format**: Localized date and time string

#### Sync Now Button
- **Display Element**: Button to manually trigger data synchronization
- **Action**: Calls `/api/secure-scores/sync` endpoint
- **Description**: Allows users to refresh data from Microsoft Graph API
- **Functionality**: 
  - Triggers API calls to Microsoft Graph
  - Updates database with latest information
  - Refreshes dashboard display
  - Shows loading state during sync

### 6. Tab Navigation Elements

#### Dashboard Tab
- **Display Element**: Active tab showing overview and metrics
- **Description**: Main dashboard view with all key metrics and visualizations
- **Content**: All elements described above

#### Recommendations Tab
- **Display Element**: Placeholder for detailed recommendations view
- **Description**: Future implementation for comprehensive recommendation management
- **Status**: Currently shows placeholder content

#### Controls Tab
- **Display Element**: Placeholder for security controls management
- **Description**: Future implementation for detailed control profile management
- **Status**: Currently shows placeholder content

#### Reports Tab
- **Display Element**: Placeholder for detailed reporting features
- **Description**: Future implementation for compliance reports and executive summaries
- **Status**: Currently shows placeholder content

## Data Processing and Calculations

### Impact Score Calculation
```javascript
function calculateImpactScore(profile) {
  let score = 0;
  
  // Base score from max score (40% weight)
  if (profile.maxScore) {
    score += profile.maxScore * 0.4;
  }
  
  // Implementation cost factor (lower cost = higher priority)
  switch (profile.implementationCost) {
    case 'Low': score += 30; break;
    case 'Moderate': score += 20; break;
    case 'High': score += 10; break;
  }
  
  // User impact factor (lower impact = higher priority)
  switch (profile.userImpact) {
    case 'Low': score += 25; break;
    case 'Moderate': score += 15; break;
    case 'High': score += 5; break;
  }
  
  return Math.round(score);
}
```

### Priority Mapping
```javascript
function mapImplementationCostToPriority(cost) {
  switch (cost) {
    case 'Low': return 'high';      // Easy to implement = high priority
    case 'Moderate': return 'medium';
    case 'High': return 'low';      // Difficult to implement = low priority
    default: return 'medium';
  }
}
```

### Trend Calculation
```javascript
function calculateTrend(historicalData) {
  if (!historicalData || historicalData.length < 2) {
    return { direction: 'stable', change: 0 };
  }
  
  const recent = historicalData[0];
  const previous = historicalData[1];
  const change = recent.percentage - previous.percentage;
  
  return {
    direction: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable',
    change: Math.round(change * 10) / 10
  };
}
```

## API Response Examples

### Secure Score Response
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

### Control Profile Response
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

## Error Handling and Edge Cases

### No Data Available
- **Scenario**: No secure score data returned from API
- **Display**: "No secure score data available" message with sync button
- **User Action**: Click sync to fetch data

### API Rate Limiting
- **Scenario**: Microsoft Graph API rate limits exceeded
- **Handling**: Exponential backoff retry logic
- **User Experience**: Loading states and retry options

### Incomplete Data
- **Scenario**: Some control profiles missing required fields
- **Handling**: Display available data with appropriate fallbacks
- **Fallbacks**: Default values for missing fields, "Unknown" for categories

### Authentication Errors
- **Scenario**: Azure AD authentication fails
- **Display**: Error message with troubleshooting guidance
- **Resolution**: Check credentials and permissions

## Performance Considerations

### Data Caching
- **Strategy**: Cache API responses for 1 hour (configurable)
- **Implementation**: Database storage with timestamp tracking
- **Benefits**: Reduced API calls, faster page loads

### Lazy Loading
- **Implementation**: Load dashboard data on tab activation
- **Benefits**: Faster initial page load, reduced unnecessary API calls

### Responsive Design
- **Charts**: Automatically resize based on container width
- **Cards**: Stack vertically on mobile devices
- **Tables**: Horizontal scroll on small screens

## Security and Privacy

### Data Sensitivity
- **Content**: Secure score data contains sensitive security information
- **Access Control**: Requires `view_security_metrics` permission
- **Audit Trail**: All access logged for compliance

### API Security
- **Authentication**: Azure AD application credentials
- **Permissions**: Minimum required Graph API permissions
- **Transport**: HTTPS only for all communications

---

This comprehensive summary provides complete visibility into all data elements displayed on the secure-score page and their relationship to Microsoft Graph API secure score fields, enabling effective security posture monitoring and improvement.