/**
 * Compliance Validation Service
 * Integrates with Microsoft Defender Cloud App Security to validate application compliance
 */

class ComplianceValidationService {
  constructor() {
    this.cloudAppSecurityEndpoint = process.env.CLOUD_APP_SECURITY_API_ENDPOINT;
    this.apiKey = process.env.CLOUD_APP_SECURITY_API_KEY;
    this.tenantId = process.env.AZURE_TENANT_ID;
    
    // Minimum compliance thresholds based on company requirements
    this.complianceThresholds = {
      minimumOverallScore: 80,
      requiredCertifications: ['soc2', 'gdpr'],
      requiredSecurityFeatures: ['dataEncryption', 'mfa', 'auditTrail'],
      riskLevelMapping: {
        'Low': { minScore: 90, maxRisk: 3 },
        'Medium': { minScore: 75, maxRisk: 6 },
        'High': { minScore: 60, maxRisk: 10 }
      }
    };
  }

  /**
   * Validate application against Cloud App Security compliance scores
   * @param {Object} applicationData - Application data to validate
   * @returns {Object} Validation result with compliance status and recommendations
   */
  async validateApplicationCompliance(applicationData) {
    try {
      // Get Cloud App Security data for the application
      const cloudAppData = await this.getCloudAppSecurityData(applicationData);
      
      // Perform compliance validation
      const validationResult = this.performComplianceValidation(cloudAppData);
      
      // Generate recommendations
      const recommendations = this.generateComplianceRecommendations(validationResult);
      
      return {
        applicationId: applicationData.id,
        applicationName: applicationData.name,
        isCompliant: validationResult.isCompliant,
        complianceScore: validationResult.overallScore,
        validationTimestamp: new Date().toISOString(),
        validationDetails: validationResult,
        recommendations: recommendations,
        approvalRequired: !validationResult.isCompliant || validationResult.riskLevel === 'High',
        dataClassification: this.determineDataClassification(cloudAppData),
        riskAssessment: this.performRiskAssessment(cloudAppData)
      };
    } catch (error) {
      console.error('Error validating application compliance:', error);
      return {
        applicationId: applicationData.id,
        applicationName: applicationData.name,
        isCompliant: false,
        complianceScore: 0,
        validationTimestamp: new Date().toISOString(),
        error: error.message,
        approvalRequired: true,
        riskAssessment: { level: 'High', reason: 'Validation failed' }
      };
    }
  }

  /**
   * Get application data from Microsoft Defender Cloud App Security
   * @param {Object} applicationData - Application metadata
   * @returns {Object} Cloud App Security data
   */
  async getCloudAppSecurityData(applicationData) {
    // Mock implementation - In production, this would call the actual Cloud App Security API
    const mockCloudAppData = {
      appId: applicationData.id,
      name: applicationData.name,
      publisher: applicationData.publisher,
      category: applicationData.category,
      
      // Cloud App Security Compliance Scores
      complianceScore: {
        overall: this.calculateMockComplianceScore(applicationData),
        dataGovernance: 85,
        dataRetention: 90,
        dataLocation: 88,
        accessControl: 92,
        encryption: 95
      },
      
      // Security Features Assessment
      securityFeatures: {
        dataEncryption: true,
        dataEncryptionAtRest: true,
        dataEncryptionInTransit: true,
        multiFactorAuthentication: true,
        singleSignOn: true,
        auditTrail: true,
        accessControl: true,
        ipRestrictions: false,
        sessionControl: true,
        dlpSupport: true
      },
      
      // Compliance Certifications
      certifications: {
        soc2: true,
        iso27001: applicationData.name !== 'Zoom', // Mock: Zoom doesn't have ISO27001
        gdpr: true,
        hipaa: applicationData.category !== 'Communication' || applicationData.name === 'Microsoft Office 365',
        pciDss: false,
        fedramp: applicationData.publisher === 'Microsoft Corporation'
      },
      
      // Risk Assessment
      riskFactors: {
        dataExfiltrationRisk: this.calculateRiskScore(applicationData, 'dataExfiltration'),
        malwareRisk: this.calculateRiskScore(applicationData, 'malware'),
        phishingRisk: this.calculateRiskScore(applicationData, 'phishing'),
        unauthorizedAccessRisk: this.calculateRiskScore(applicationData, 'unauthorizedAccess'),
        dataLossRisk: this.calculateRiskScore(applicationData, 'dataLoss')
      },
      
      // Usage and Popularity
      usage: {
        totalUsers: Math.floor(Math.random() * 10000) + 1000,
        activeUsers: Math.floor(Math.random() * 5000) + 500,
        dataVolume: Math.floor(Math.random() * 1000) + 100, // GB
        transactionVolume: Math.floor(Math.random() * 100000) + 10000
      },
      
      // Legal and Regulatory
      legal: {
        dataRetentionPolicy: true,
        privacyPolicy: true,
        termsOfService: true,
        dataProcessingAgreement: true,
        rightToBeDeleted: true,
        dataPortability: true
      },
      
      // Vendor Assessment
      vendor: {
        securityRating: this.calculateVendorSecurityRating(applicationData.publisher),
        financialStability: 'High',
        supportQuality: 'High',
        incidentHistory: this.getVendorIncidentHistory(applicationData.publisher)
      }
    };

    return mockCloudAppData;
  }

  /**
   * Perform comprehensive compliance validation
   * @param {Object} cloudAppData - Cloud App Security data
   * @returns {Object} Validation results
   */
  performComplianceValidation(cloudAppData) {
    const results = {
      overallScore: cloudAppData.complianceScore.overall,
      isCompliant: true,
      failedChecks: [],
      passedChecks: [],
      riskLevel: 'Low'
    };

    // Check minimum overall score
    if (cloudAppData.complianceScore.overall < this.complianceThresholds.minimumOverallScore) {
      results.isCompliant = false;
      results.failedChecks.push({
        check: 'Minimum Overall Score',
        required: this.complianceThresholds.minimumOverallScore,
        actual: cloudAppData.complianceScore.overall,
        severity: 'High'
      });
    } else {
      results.passedChecks.push('Minimum Overall Score');
    }

    // Check required certifications
    this.complianceThresholds.requiredCertifications.forEach(cert => {
      if (!cloudAppData.certifications[cert]) {
        results.isCompliant = false;
        results.failedChecks.push({
          check: `Required Certification: ${cert.toUpperCase()}`,
          required: true,
          actual: false,
          severity: 'High'
        });
      } else {
        results.passedChecks.push(`Certification: ${cert.toUpperCase()}`);
      }
    });

    // Check required security features
    this.complianceThresholds.requiredSecurityFeatures.forEach(feature => {
      if (!cloudAppData.securityFeatures[feature]) {
        results.isCompliant = false;
        results.failedChecks.push({
          check: `Required Security Feature: ${feature}`,
          required: true,
          actual: false,
          severity: 'Medium'
        });
      } else {
        results.passedChecks.push(`Security Feature: ${feature}`);
      }
    });

    // Calculate risk level
    results.riskLevel = this.calculateRiskLevel(cloudAppData);

    // Additional compliance checks
    this.performAdditionalComplianceChecks(cloudAppData, results);

    return results;
  }

  /**
   * Perform additional compliance checks based on data classification and usage
   * @param {Object} cloudAppData - Cloud App Security data
   * @param {Object} results - Current validation results
   */
  performAdditionalComplianceChecks(cloudAppData, results) {
    // Check for high-risk factors
    const highRiskFactors = Object.entries(cloudAppData.riskFactors)
      .filter(([factor, score]) => score > 7);

    if (highRiskFactors.length > 0) {
      results.riskLevel = 'High';
      highRiskFactors.forEach(([factor, score]) => {
        results.failedChecks.push({
          check: `Risk Factor: ${factor}`,
          required: '≤ 7',
          actual: score,
          severity: 'High'
        });
      });
    }

    // Check vendor security rating
    if (cloudAppData.vendor.securityRating < 8) {
      results.failedChecks.push({
        check: 'Vendor Security Rating',
        required: '≥ 8',
        actual: cloudAppData.vendor.securityRating,
        severity: 'Medium'
      });
    }

    // Check for recent security incidents
    if (cloudAppData.vendor.incidentHistory.recentIncidents > 0) {
      results.failedChecks.push({
        check: 'Recent Security Incidents',
        required: '0',
        actual: cloudAppData.vendor.incidentHistory.recentIncidents,
        severity: 'High'
      });
    }
  }

  /**
   * Generate compliance recommendations based on validation results
   * @param {Object} validationResult - Validation results
   * @returns {Array} Array of recommendations
   */
  generateComplianceRecommendations(validationResult) {
    const recommendations = [];

    if (!validationResult.isCompliant) {
      recommendations.push({
        type: 'Critical',
        title: 'Application Not Compliant',
        description: 'This application does not meet the minimum compliance requirements.',
        action: 'Review failed compliance checks and work with vendor to address issues before approval.'
      });
    }

    validationResult.failedChecks.forEach(check => {
      switch (check.severity) {
        case 'High':
          recommendations.push({
            type: 'High Priority',
            title: `Address ${check.check}`,
            description: `Required: ${check.required}, Current: ${check.actual}`,
            action: 'This must be resolved before application can be approved for use.'
          });
          break;
        case 'Medium':
          recommendations.push({
            type: 'Medium Priority',
            title: `Improve ${check.check}`,
            description: `Required: ${check.required}, Current: ${check.actual}`,
            action: 'Consider addressing this issue to improve security posture.'
          });
          break;
      }
    });

    if (validationResult.riskLevel === 'High') {
      recommendations.push({
        type: 'Risk Management',
        title: 'High Risk Application',
        description: 'This application has been classified as high risk.',
        action: 'Implement additional monitoring and access controls. Consider alternative solutions.'
      });
    }

    // Add positive recommendations for compliant applications
    if (validationResult.isCompliant && validationResult.overallScore >= 90) {
      recommendations.push({
        type: 'Approved',
        title: 'Excellent Compliance Score',
        description: 'This application meets all compliance requirements with an excellent score.',
        action: 'Application is approved for immediate deployment.'
      });
    }

    return recommendations;
  }

  /**
   * Calculate risk level based on various factors
   * @param {Object} cloudAppData - Cloud App Security data
   * @returns {string} Risk level (Low, Medium, High)
   */
  calculateRiskLevel(cloudAppData) {
    const overallScore = cloudAppData.complianceScore.overall;
    const avgRiskScore = Object.values(cloudAppData.riskFactors)
      .reduce((sum, score) => sum + score, 0) / Object.values(cloudAppData.riskFactors).length;

    if (overallScore >= 90 && avgRiskScore <= 3) return 'Low';
    if (overallScore >= 75 && avgRiskScore <= 6) return 'Medium';
    return 'High';
  }

  /**
   * Determine data classification based on application characteristics
   * @param {Object} cloudAppData - Cloud App Security data
   * @returns {string} Data classification
   */
  determineDataClassification(cloudAppData) {
    if (cloudAppData.certifications.hipaa || cloudAppData.category === 'Healthcare') {
      return 'Confidential';
    }
    if (cloudAppData.certifications.pciDss || cloudAppData.category === 'Financial') {
      return 'Restricted';
    }
    if (cloudAppData.usage.totalUsers > 1000) {
      return 'Business';
    }
    return 'Internal';
  }

  /**
   * Perform comprehensive risk assessment
   * @param {Object} cloudAppData - Cloud App Security data
   * @returns {Object} Risk assessment results
   */
  performRiskAssessment(cloudAppData) {
    const riskFactors = [];
    let overallRisk = 'Low';

    // Analyze individual risk factors
    Object.entries(cloudAppData.riskFactors).forEach(([factor, score]) => {
      if (score > 7) {
        riskFactors.push({ factor, score, level: 'High' });
        overallRisk = 'High';
      } else if (score > 4) {
        riskFactors.push({ factor, score, level: 'Medium' });
        if (overallRisk === 'Low') overallRisk = 'Medium';
      }
    });

    return {
      level: overallRisk,
      factors: riskFactors,
      score: Object.values(cloudAppData.riskFactors)
        .reduce((sum, score) => sum + score, 0) / Object.values(cloudAppData.riskFactors).length,
      recommendation: this.getRiskRecommendation(overallRisk)
    };
  }

  /**
   * Get risk-based recommendations
   * @param {string} riskLevel - Risk level
   * @returns {string} Risk recommendation
   */
  getRiskRecommendation(riskLevel) {
    switch (riskLevel) {
      case 'Low':
        return 'Application can be approved with standard monitoring.';
      case 'Medium':
        return 'Application requires enhanced monitoring and periodic review.';
      case 'High':
        return 'Application requires executive approval and continuous monitoring.';
      default:
        return 'Risk level unknown - manual review required.';
    }
  }

  // Helper methods for mock data generation
  calculateMockComplianceScore(applicationData) {
    const baseScore = 70;
    const publisherBonus = applicationData.publisher === 'Microsoft Corporation' ? 20 : 
                          applicationData.publisher === 'Adobe Inc.' ? 15 : 10;
    const categoryBonus = applicationData.category === 'Productivity' ? 10 : 5;
    return Math.min(100, baseScore + publisherBonus + categoryBonus + Math.floor(Math.random() * 10));
  }

  calculateRiskScore(applicationData, riskType) {
    const baseRisk = Math.floor(Math.random() * 5) + 1;
    const publisherModifier = applicationData.publisher === 'Microsoft Corporation' ? -2 : 0;
    return Math.max(1, Math.min(10, baseRisk + publisherModifier));
  }

  calculateVendorSecurityRating(publisher) {
    const ratings = {
      'Microsoft Corporation': 9.5,
      'Adobe Inc.': 8.8,
      'Salesforce.com': 9.2,
      'Slack Technologies': 8.5,
      'Zoom Video Communications': 7.8
    };
    return ratings[publisher] || 7.0;
  }

  getVendorIncidentHistory(publisher) {
    return {
      totalIncidents: Math.floor(Math.random() * 5),
      recentIncidents: Math.floor(Math.random() * 2),
      lastIncidentDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      severity: 'Low'
    };
  }
}

module.exports = ComplianceValidationService;