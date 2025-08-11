/**
 * Employee App Store API Implementation
 * Integrates with Microsoft Defender Cloud App Security for compliance validation
 */

const ComplianceValidationService = require('../services/compliance-validation-service');

class EmployeeAppStoreAPI {
  constructor() {
    this.complianceService = new ComplianceValidationService();
    this.applicationCatalog = new Map();
    this.userInstallations = new Map();
    this.procurementRequests = new Map();
    
    // Initialize with predefined applications
    this.initializePredefinedApplications();
  }

  /**
   * Initialize predefined procured applications with compliance data
   */
  initializePredefinedApplications() {
    const predefinedApps = [
      {
        id: 'app-001',
        name: 'Microsoft Office 365',
        description: 'Complete productivity suite with Word, Excel, PowerPoint, and Teams',
        category: 'Productivity',
        publisher: 'Microsoft Corporation',
        version: '2024.1',
        isApproved: true,
        requiresApproval: false,
        complianceValidated: true,
        cloudAppSecurityScore: {
          overall: 95,
          compliance: { soc2: true, iso27001: true, gdpr: true, hipaa: true },
          security: { dataEncryption: true, mfa: true, auditTrail: true, accessControl: true },
          legal: { dataRetention: true, privacyPolicy: true, termsOfService: true }
        },
        riskLevel: 'Low',
        dataClassification: 'Business',
        installationType: 'Cloud Service',
        businessJustification: 'Essential productivity tools for all employees',
        procurementDate: '2024-01-01',
        lastComplianceReview: '2024-01-15'
      },
      {
        id: 'app-002',
        name: 'Slack',
        description: 'Team collaboration and communication platform',
        category: 'Communication',
        publisher: 'Slack Technologies',
        version: '4.35.0',
        isApproved: true,
        requiresApproval: true,
        complianceValidated: true,
        cloudAppSecurityScore: {
          overall: 88,
          compliance: { soc2: true, iso27001: true, gdpr: true, hipaa: false },
          security: { dataEncryption: true, mfa: true, auditTrail: true, accessControl: true },
          legal: { dataRetention: true, privacyPolicy: true, termsOfService: true }
        },
        riskLevel: 'Medium',
        dataClassification: 'Business',
        installationType: 'Cloud Service',
        businessJustification: 'Team communication and collaboration',
        procurementDate: '2024-01-05',
        lastComplianceReview: '2024-01-20'
      }
    ];

    predefinedApps.forEach(app => {
      this.applicationCatalog.set(app.id, app);
    });
  }

  /**
   * Get all available applications with compliance filtering
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered applications
   */
  async getApplications(filters = {}) {
    try {
      let applications = Array.from(this.applicationCatalog.values());

      // Apply filters
      if (filters.category) {
        applications = applications.filter(app => app.category === filters.category);
      }

      if (filters.platform) {
        applications = applications.filter(app => app.installationType === filters.platform);
      }

      if (filters.complianceScore) {
        applications = applications.filter(app => 
          app.cloudAppSecurityScore.overall >= filters.complianceScore
        );
      }

      if (filters.riskLevel) {
        applications = applications.filter(app => app.riskLevel === filters.riskLevel);
      }

      // Sort by compliance score (highest first)
      applications.sort((a, b) => 
        b.cloudAppSecurityScore.overall - a.cloudAppSecurityScore.overall
      );

      return {
        success: true,
        data: applications,
        total: applications.length,
        filters: filters
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get application details with compliance information
   * @param {string} appId - Application ID
   * @returns {Object} Application details
   */
  async getApplicationDetails(appId) {
    try {
      const application = this.applicationCatalog.get(appId);
      
      if (!application) {
        return {
          success: false,
          error: 'Application not found',
          data: null
        };
      }

      // Get latest compliance validation
      const complianceValidation = await this.complianceService.validateApplicationCompliance(application);

      return {
        success: true,
        data: {
          ...application,
          complianceValidation: complianceValidation,
          installationInstructions: this.getInstallationInstructions(application),
          supportInformation: this.getSupportInformation(application)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Request application installation
   * @param {string} appId - Application ID
   * @param {string} userId - User ID
   * @param {Object} requestData - Installation request data
   * @returns {Object} Installation result
   */
  async requestApplicationInstallation(appId, userId, requestData = {}) {
    try {
      const application = this.applicationCatalog.get(appId);
      
      if (!application) {
        return {
          success: false,
          error: 'Application not found'
        };
      }

      // Check if application requires approval
      if (application.requiresApproval) {
        return await this.createApprovalRequest(appId, userId, requestData);
      }

      // Direct installation for pre-approved applications
      return await this.installApplication(appId, userId);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create approval request for application installation
   * @param {string} appId - Application ID
   * @param {string} userId - User ID
   * @param {Object} requestData - Request data
   * @returns {Object} Approval request result
   */
  async createApprovalRequest(appId, userId, requestData) {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const application = this.applicationCatalog.get(appId);

    const approvalRequest = {
      id: requestId,
      applicationId: appId,
      applicationName: application.name,
      userId: userId,
      requestDate: new Date().toISOString(),
      status: 'Pending Manager Approval',
      businessJustification: requestData.businessJustification || 'Standard business use',
      estimatedUsers: requestData.estimatedUsers || 1,
      department: requestData.department || 'Unknown',
      urgency: requestData.urgency || 'Medium',
      complianceScore: application.cloudAppSecurityScore.overall,
      riskLevel: application.riskLevel,
      approvalWorkflow: [
        { step: 'Submitted', status: 'Completed', date: new Date().toISOString(), approver: 'System' },
        { step: 'Manager Approval', status: 'Pending', date: null, approver: 'Manager' },
        { step: 'Compliance Review', status: 'Pending', date: null, approver: 'Compliance Team' },
        { step: 'Security Review', status: 'Pending', date: null, approver: 'Security Team' },
        { step: 'Final Approval', status: 'Pending', date: null, approver: 'ICT Governance Council' }
      ]
    };

    this.procurementRequests.set(requestId, approvalRequest);

    // Trigger notification workflow (mock)
    await this.sendApprovalNotification(approvalRequest);

    return {
      success: true,
      data: {
        requestId: requestId,
        status: 'Approval request submitted',
        estimatedApprovalTime: this.calculateEstimatedApprovalTime(application),
        nextSteps: 'Your manager will be notified for approval'
      }
    };
  }

  /**
   * Install application directly (for pre-approved apps)
   * @param {string} appId - Application ID
   * @param {string} userId - User ID
   * @returns {Object} Installation result
   */
  async installApplication(appId, userId) {
    const application = this.applicationCatalog.get(appId);
    const installationId = `inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Record user installation
    if (!this.userInstallations.has(userId)) {
      this.userInstallations.set(userId, []);
    }
    
    const userApps = this.userInstallations.get(userId);
    userApps.push({
      installationId: installationId,
      applicationId: appId,
      applicationName: application.name,
      installDate: new Date().toISOString(),
      status: 'Installing',
      version: application.version
    });

    // Simulate installation process
    setTimeout(() => {
      const installation = userApps.find(app => app.installationId === installationId);
      if (installation) {
        installation.status = 'Installed';
      }
    }, 5000);

    return {
      success: true,
      data: {
        installationId: installationId,
        status: 'Installation initiated',
        estimatedTime: '5-10 minutes',
        instructions: this.getInstallationInstructions(application)
      }
    };
  }

  /**
   * Submit new application for procurement
   * @param {Object} applicationData - New application data
   * @param {string} requesterId - Requester user ID
   * @returns {Object} Procurement result
   */
  async submitApplicationProcurement(applicationData, requesterId) {
    try {
      // Validate application data
      const validation = await this.validateNewApplication(applicationData);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Application validation failed',
          validationErrors: validation.errors
        };
      }

      // Perform compliance validation
      const complianceValidation = await this.complianceService.validateApplicationCompliance(applicationData);

      const requestId = `proc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const procurementRequest = {
        id: requestId,
        applicationName: applicationData.applicationName,
        vendor: applicationData.vendor,
        requestedBy: requesterId,
        department: applicationData.department,
        businessJustification: applicationData.businessJustification,
        estimatedUsers: applicationData.estimatedUsers,
        estimatedCost: applicationData.estimatedCost,
        urgency: applicationData.urgency,
        dataClassification: applicationData.dataClassification,
        complianceRequirements: applicationData.complianceRequirements,
        submissionDate: new Date().toISOString(),
        status: 'Pending Compliance Review',
        complianceValidation: complianceValidation,
        approvalWorkflow: [
          { step: 'Submitted', status: 'Completed', date: new Date().toISOString(), approver: 'System' },
          { step: 'Manager Approval', status: 'Pending', date: null, approver: 'Manager' },
          { step: 'Compliance Review', status: 'Pending', date: null, approver: 'Compliance Team' },
          { step: 'Security Review', status: 'Pending', date: null, approver: 'Security Team' },
          { step: 'Final Approval', status: 'Pending', date: null, approver: 'ICT Governance Council' }
        ]
      };

      this.procurementRequests.set(requestId, procurementRequest);

      // Trigger procurement workflow
      await this.initiateProcurementWorkflow(procurementRequest);

      return {
        success: true,
        data: {
          requestId: requestId,
          status: 'Procurement request submitted',
          complianceScore: complianceValidation.complianceScore,
          estimatedProcessingTime: this.calculateProcurementTime(complianceValidation),
          nextSteps: 'Request will undergo compliance and security review'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's installed applications
   * @param {string} userId - User ID
   * @returns {Object} User applications
   */
  async getUserApplications(userId) {
    try {
      const userApps = this.userInstallations.get(userId) || [];
      
      return {
        success: true,
        data: userApps,
        total: userApps.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get procurement requests
   * @param {Object} filters - Filter criteria
   * @returns {Object} Procurement requests
   */
  async getProcurementRequests(filters = {}) {
    try {
      let requests = Array.from(this.procurementRequests.values());

      // Apply filters
      if (filters.status) {
        requests = requests.filter(req => req.status === filters.status);
      }

      if (filters.requesterId) {
        requests = requests.filter(req => req.requestedBy === filters.requesterId);
      }

      if (filters.department) {
        requests = requests.filter(req => req.department === filters.department);
      }

      // Sort by submission date (newest first)
      requests.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));

      return {
        success: true,
        data: requests,
        total: requests.length,
        filters: filters
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Helper methods

  getInstallationInstructions(application) {
    const instructions = {
      'Cloud Service': [
        'Click the installation link provided',
        'Sign in with your corporate credentials',
        'Accept the terms and conditions',
        'The service will be available immediately'
      ],
      'Desktop Application': [
        'Download the installer from the provided link',
        'Run the installer as administrator',
        'Follow the installation wizard',
        'Restart your computer if required'
      ],
      'Desktop/Mobile Application': [
        'Download from the corporate app store',
        'Install on your approved devices',
        'Sign in with corporate credentials',
        'Configure according to company policies'
      ]
    };

    return instructions[application.installationType] || [
      'Contact IT support for installation assistance'
    ];
  }

  getSupportInformation(application) {
    return {
      vendor: application.publisher,
      internalSupport: 'IT Help Desk - ext. 1234',
      documentation: `https://docs.company.com/apps/${application.id}`,
      trainingResources: `https://training.company.com/apps/${application.id}`,
      escalationProcess: 'Contact your manager or IT governance team'
    };
  }

  calculateEstimatedApprovalTime(application) {
    const baseTime = 2; // days
    const riskMultiplier = {
      'Low': 1,
      'Medium': 1.5,
      'High': 2
    };
    
    return Math.ceil(baseTime * (riskMultiplier[application.riskLevel] || 1));
  }

  calculateProcurementTime(complianceValidation) {
    const baseTime = 5; // days
    const complianceMultiplier = complianceValidation.isCompliant ? 1 : 2;
    
    return Math.ceil(baseTime * complianceMultiplier);
  }

  async validateNewApplication(applicationData) {
    const errors = [];
    
    if (!applicationData.applicationName) {
      errors.push('Application name is required');
    }
    
    if (!applicationData.vendor) {
      errors.push('Vendor is required');
    }
    
    if (!applicationData.businessJustification) {
      errors.push('Business justification is required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  async sendApprovalNotification(approvalRequest) {
    // Mock notification service
    console.log(`Approval notification sent for request ${approvalRequest.id}`);
  }

  async initiateProcurementWorkflow(procurementRequest) {
    // Mock workflow initiation
    console.log(`Procurement workflow initiated for request ${procurementRequest.id}`);
  }
}

module.exports = EmployeeAppStoreAPI;