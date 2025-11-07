/**
 * CASB App Catalog API
 * Comprehensive API for Cloud App Security (CASB) App Catalog
 * Enables dynamic, interactive employee engagement with application governance
 */

const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const ComplianceValidationService = require('../services/compliance-validation-service');

// Initialize compliance validation service
const complianceService = new ComplianceValidationService();

// In-memory storage (replace with database in production)
let appCatalog = new Map();
let userAppUsage = new Map();
let appRequests = new Map();
let shadowITReports = new Map();
let policyAcknowledgments = new Map();
let appFeedback = new Map();

// Initialize with sample data
initializeSampleData();

function initializeSampleData() {
  const sampleApps = [
    {
      id: 'app-001',
      name: 'Microsoft Office 365',
      description: 'Complete productivity suite with Word, Excel, PowerPoint, and Teams',
      category: 'Productivity',
      publisher: 'Microsoft Corporation',
      version: '2024.1',
      isApproved: true,
      approvalStatus: 'Approved',
      securityRating: 95,
      complianceStatus: {
        soc2: true,
        iso27001: true,
        gdpr: true,
        hipaa: true,
        pciDss: false
      },
      vulnerabilities: [],
      riskLevel: 'Low',
      dataClassification: 'Business',
      usageGuidelines: [
        'Use corporate credentials for authentication',
        'Follow data retention policies',
        'Do not share sensitive data externally without approval'
      ],
      policies: [
        { id: 'pol-001', name: 'Data Retention Policy', url: '/policies/data-retention' },
        { id: 'pol-002', name: 'Information Security Policy', url: '/policies/info-security' }
      ],
      lastSecurityUpdate: '2024-01-15',
      lastComplianceReview: '2024-01-20'
    },
    {
      id: 'app-002',
      name: 'Slack',
      description: 'Team collaboration and communication platform',
      category: 'Communication',
      publisher: 'Slack Technologies',
      version: '4.35.0',
      isApproved: true,
      approvalStatus: 'Approved with Restrictions',
      securityRating: 88,
      complianceStatus: {
        soc2: true,
        iso27001: true,
        gdpr: true,
        hipaa: false,
        pciDss: false
      },
      vulnerabilities: [
        { severity: 'Low', description: 'Update to latest version recommended', cve: 'CVE-2023-12345' }
      ],
      riskLevel: 'Medium',
      dataClassification: 'Business',
      usageGuidelines: [
        'Approved for internal collaboration only',
        'Do not share customer data without encryption',
        'Review channel permissions regularly'
      ],
      policies: [
        { id: 'pol-003', name: 'Communication Policy', url: '/policies/communication' },
        { id: 'pol-004', name: 'Data Classification Policy', url: '/policies/data-classification' }
      ],
      lastSecurityUpdate: '2024-01-10',
      lastComplianceReview: '2024-01-18'
    },
    {
      id: 'app-003',
      name: 'Zoom',
      description: 'Video conferencing and online meetings',
      category: 'Communication',
      publisher: 'Zoom Video Communications',
      version: '5.16.0',
      isApproved: true,
      approvalStatus: 'Approved',
      securityRating: 85,
      complianceStatus: {
        soc2: true,
        iso27001: true,
        gdpr: true,
        hipaa: true,
        pciDss: false
      },
      vulnerabilities: [],
      riskLevel: 'Medium',
      dataClassification: 'Business',
      usageGuidelines: [
        'Enable waiting room for external meetings',
        'Use password protection for sensitive meetings',
        'Record meetings only with participant consent'
      ],
      policies: [
        { id: 'pol-005', name: 'Video Conference Policy', url: '/policies/video-conference' }
      ],
      lastSecurityUpdate: '2024-01-12',
      lastComplianceReview: '2024-01-16'
    }
  ];

  sampleApps.forEach(app => appCatalog.set(app.id, app));
}

// ========================================
// EMPLOYEE-FACING API ENDPOINTS
// ========================================

/**
 * GET /api/casb/catalog/me
 * Returns a personalized list of approved apps relevant to the logged-in employee
 */
router.get('/catalog/me', [
  query('role').optional().isString(),
  query('department').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.headers['x-user-id'] || 'anonymous';
    const userRole = req.query.role || req.headers['x-user-role'] || 'Employee';
    const userDepartment = req.query.department || req.headers['x-user-department'] || 'General';

    // Get all approved apps
    let apps = Array.from(appCatalog.values()).filter(app => app.isApproved);

    // Personalize based on role and department (simplified logic)
    const personalizedApps = apps.map(app => ({
      ...app,
      recommendedForYou: determineRecommendation(app, userRole, userDepartment),
      personalizedNotes: getPersonalizedNotes(app, userRole, userDepartment)
    }));

    // Sort by recommendation and security rating
    personalizedApps.sort((a, b) => {
      if (a.recommendedForYou !== b.recommendedForYou) {
        return b.recommendedForYou - a.recommendedForYou;
      }
      return b.securityRating - a.securityRating;
    });

    res.json({
      success: true,
      userId: userId,
      userRole: userRole,
      userDepartment: userDepartment,
      apps: personalizedApps,
      total: personalizedApps.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/casb/catalog/:appId
 * Returns detailed information about a specific app
 */
router.get('/catalog/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const app = appCatalog.get(appId);

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Get real-time compliance validation
    const complianceValidation = await complianceService.validateApplicationCompliance(app);

    res.json({
      success: true,
      data: {
        ...app,
        complianceValidation: complianceValidation,
        installationInstructions: getInstallationInstructions(app),
        supportInformation: getSupportInformation(app),
        usageStats: getAppUsageStats(appId)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/casb/catalog/:appId/request-approval
 * Endpoint for employees to request approval for a new app
 */
router.post('/catalog/:appId/request-approval', [
  body('businessJustification').notEmpty().withMessage('Business justification is required'),
  body('department').optional().isString(),
  body('estimatedUsers').optional().isInt({ min: 1 }),
  body('urgency').optional().isIn(['Low', 'Medium', 'High'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { appId } = req.params;
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { businessJustification, department, estimatedUsers, urgency } = req.body;

    const app = appCatalog.get(appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Create approval request
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const approvalRequest = {
      id: requestId,
      appId: appId,
      appName: app.name,
      userId: userId,
      department: department || 'Unknown',
      businessJustification: businessJustification,
      estimatedUsers: estimatedUsers || 1,
      urgency: urgency || 'Medium',
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      workflow: [
        { step: 'Submitted', status: 'Completed', completedAt: new Date().toISOString() },
        { step: 'Manager Approval', status: 'Pending', completedAt: null },
        { step: 'Security Review', status: 'Pending', completedAt: null },
        { step: 'Final Approval', status: 'Pending', completedAt: null }
      ]
    };

    appRequests.set(requestId, approvalRequest);

    res.status(201).json({
      success: true,
      data: {
        requestId: requestId,
        status: 'Approval request submitted',
        estimatedApprovalTime: calculateEstimatedApprovalTime(app),
        nextSteps: 'Your manager will be notified for approval'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/casb/catalog/report-shadow-app
 * Endpoint for employees to report usage of an uncataloged app
 */
router.post('/catalog/report-shadow-app', [
  body('appName').notEmpty().withMessage('Application name is required'),
  body('appUrl').optional().isURL(),
  body('description').optional().isString(),
  body('usageReason').notEmpty().withMessage('Usage reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.headers['x-user-id'] || 'anonymous';
    const { appName, appUrl, description, usageReason } = req.body;

    const reportId = `shadow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const shadowReport = {
      id: reportId,
      appName: appName,
      appUrl: appUrl,
      description: description,
      usageReason: usageReason,
      reportedBy: userId,
      reportedAt: new Date().toISOString(),
      status: 'Under Review',
      riskAssessment: 'Pending'
    };

    shadowITReports.set(reportId, shadowReport);

    res.status(201).json({
      success: true,
      data: {
        reportId: reportId,
        status: 'Shadow IT report submitted',
        message: 'Thank you for reporting. The security team will review this application.',
        nextSteps: 'You will be notified once the review is complete'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/casb/catalog/me/compliance
 * Returns the employee's current compliance status for approved apps
 */
router.get('/catalog/me/compliance', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    
    // Get user's app usage
    const userApps = userAppUsage.get(userId) || [];
    
    // Check compliance status for each app
    const complianceStatus = await Promise.all(
      userApps.map(async (usage) => {
        const app = appCatalog.get(usage.appId);
        if (!app) return null;

        const hasAcknowledgedPolicies = checkPolicyAcknowledgment(userId, usage.appId);
        
        return {
          appId: usage.appId,
          appName: app.name,
          isCompliant: hasAcknowledgedPolicies && app.isApproved,
          policiesAcknowledged: hasAcknowledgedPolicies,
          requiredActions: getRequiredActions(userId, usage.appId, app)
        };
      })
    );

    const filteredStatus = complianceStatus.filter(status => status !== null);
    const overallCompliance = filteredStatus.every(status => status.isCompliant);

    res.json({
      success: true,
      userId: userId,
      overallCompliance: overallCompliance,
      apps: filteredStatus,
      totalApps: filteredStatus.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/casb/catalog/:appId/acknowledge-policy
 * Endpoint for employees to acknowledge policy compliance
 */
router.post('/catalog/:appId/acknowledge-policy', [
  body('policyId').notEmpty().withMessage('Policy ID is required'),
  body('acknowledged').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { appId } = req.params;
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { policyId, acknowledged } = req.body;

    const app = appCatalog.get(appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Record acknowledgment
    const ackKey = `${userId}-${appId}-${policyId}`;
    policyAcknowledgments.set(ackKey, {
      userId: userId,
      appId: appId,
      policyId: policyId,
      acknowledged: acknowledged,
      acknowledgedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Policy acknowledgment recorded',
      data: {
        userId: userId,
        appId: appId,
        policyId: policyId,
        status: acknowledged ? 'Acknowledged' : 'Not Acknowledged'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/casb/notifications/me
 * Returns personalized notifications and alerts related to app usage
 */
router.get('/notifications/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const notifications = generateUserNotifications(userId);

    res.json({
      success: true,
      userId: userId,
      notifications: notifications,
      total: notifications.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/casb/feedback/apps/:appId
 * Endpoint for employees to submit feedback and ratings for apps
 */
router.post('/feedback/apps/:appId', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString(),
  body('category').optional().isIn(['Performance', 'Security', 'Usability', 'Support', 'Other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { appId } = req.params;
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { rating, comment, category } = req.body;

    const app = appCatalog.get(appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const feedback = {
      id: feedbackId,
      appId: appId,
      appName: app.name,
      userId: userId,
      rating: rating,
      comment: comment || '',
      category: category || 'Other',
      submittedAt: new Date().toISOString()
    };

    appFeedback.set(feedbackId, feedback);

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback',
      data: {
        feedbackId: feedbackId,
        appId: appId,
        rating: rating
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// ADMIN/IT-FACING API ENDPOINTS
// ========================================

/**
 * GET /api/casb/admin/catalog
 * Admin endpoint to manage the app catalog
 */
router.get('/admin/catalog', [
  query('category').optional().isString(),
  query('status').optional().isIn(['Approved', 'Pending', 'Rejected']),
  query('riskLevel').optional().isIn(['Low', 'Medium', 'High'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let apps = Array.from(appCatalog.values());

    // Apply filters
    if (req.query.category) {
      apps = apps.filter(app => app.category === req.query.category);
    }
    if (req.query.status) {
      apps = apps.filter(app => app.approvalStatus.includes(req.query.status));
    }
    if (req.query.riskLevel) {
      apps = apps.filter(app => app.riskLevel === req.query.riskLevel);
    }

    res.json({
      success: true,
      apps: apps,
      total: apps.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/casb/admin/catalog
 * Add a new app to the catalog
 */
router.post('/admin/catalog', [
  body('name').notEmpty().withMessage('Application name is required'),
  body('publisher').notEmpty().withMessage('Publisher is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('securityRating').isInt({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newApp = {
      id: appId,
      ...req.body,
      isApproved: false,
      approvalStatus: 'Pending Review',
      lastSecurityUpdate: new Date().toISOString(),
      lastComplianceReview: new Date().toISOString()
    };

    appCatalog.set(appId, newApp);

    res.status(201).json({
      success: true,
      message: 'Application added to catalog',
      data: newApp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/casb/admin/catalog/:appId
 * Update an existing app in the catalog
 */
router.put('/admin/catalog/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const app = appCatalog.get(appId);

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const updatedApp = {
      ...app,
      ...req.body,
      id: appId, // Ensure ID doesn't change
      lastSecurityUpdate: new Date().toISOString()
    };

    appCatalog.set(appId, updatedApp);

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: updatedApp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/casb/admin/catalog/:appId
 * Remove an app from the catalog
 */
router.delete('/admin/catalog/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    
    if (!appCatalog.has(appId)) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    appCatalog.delete(appId);

    res.json({
      success: true,
      message: 'Application removed from catalog'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/casb/admin/app-requests
 * Admin endpoint to manage app approval requests
 */
router.get('/admin/app-requests', [
  query('status').optional().isIn(['Pending', 'Approved', 'Rejected']),
  query('department').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let requests = Array.from(appRequests.values());

    // Apply filters
    if (req.query.status) {
      requests = requests.filter(req => req.status === req.query.status);
    }
    if (req.query.department) {
      requests = requests.filter(req => req.department === req.query.department);
    }

    // Sort by submission date (newest first)
    requests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json({
      success: true,
      requests: requests,
      total: requests.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/casb/admin/app-requests/:requestId
 * Approve or reject an app request
 */
router.put('/admin/app-requests/:requestId', [
  body('status').isIn(['Approved', 'Rejected']).withMessage('Invalid status'),
  body('reviewNotes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId } = req.params;
    const { status, reviewNotes } = req.body;

    const request = appRequests.get(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    request.status = status;
    request.reviewNotes = reviewNotes;
    request.reviewedAt = new Date().toISOString();

    appRequests.set(requestId, request);

    res.json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/casb/admin/app-usage-analytics
 * Admin endpoint to retrieve analytics and reports on app usage
 */
router.get('/admin/app-usage-analytics', async (req, res) => {
  try {
    const analytics = {
      totalApps: appCatalog.size,
      approvedApps: Array.from(appCatalog.values()).filter(app => app.isApproved).length,
      pendingRequests: Array.from(appRequests.values()).filter(req => req.status === 'Pending').length,
      shadowITReports: shadowITReports.size,
      topApps: getTopApps(),
      riskDistribution: getRiskDistribution(),
      complianceOverview: getComplianceOverview(),
      userEngagement: getUserEngagementMetrics()
    };

    res.json({
      success: true,
      analytics: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/casb/admin/shadow-it-reports
 * View shadow IT reports
 */
router.get('/admin/shadow-it-reports', async (req, res) => {
  try {
    const reports = Array.from(shadowITReports.values());
    
    // Sort by report date (newest first)
    reports.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));

    res.json({
      success: true,
      reports: reports,
      total: reports.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/casb/admin/policy-updates/broadcast
 * Admin endpoint to broadcast policy updates and notifications
 */
router.post('/admin/policy-updates/broadcast', [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('targetAudience').optional().isIn(['All', 'Department', 'Role', 'Specific']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message, targetAudience, priority } = req.body;

    const broadcastId = `broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const broadcast = {
      id: broadcastId,
      title: title,
      message: message,
      targetAudience: targetAudience || 'All',
      priority: priority || 'Medium',
      broadcastAt: new Date().toISOString(),
      status: 'Sent'
    };

    // In production, this would trigger actual notifications
    console.log('Broadcasting policy update:', broadcast);

    res.status(201).json({
      success: true,
      message: 'Policy update broadcast successfully',
      data: broadcast
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

function determineRecommendation(app, userRole, userDepartment) {
  // Simplified recommendation logic
  if (app.category === 'Productivity' && userRole === 'Employee') return 5;
  if (app.category === 'Communication') return 4;
  if (app.securityRating > 90) return 5;
  if (app.riskLevel === 'Low') return 4;
  return 3;
}

function getPersonalizedNotes(app, userRole, userDepartment) {
  const notes = [];
  
  if (app.riskLevel === 'High') {
    notes.push('Requires additional approval due to high risk level');
  }
  
  if (app.category === 'Productivity' && userRole === 'Employee') {
    notes.push('Recommended for your role');
  }
  
  if (app.vulnerabilities && app.vulnerabilities.length > 0) {
    notes.push(`${app.vulnerabilities.length} known vulnerability(ies) - review before use`);
  }

  return notes;
}

function getInstallationInstructions(app) {
  return {
    steps: [
      'Review usage guidelines and policies',
      'Click the installation link or download button',
      'Sign in with your corporate credentials',
      'Follow the on-screen setup wizard',
      'Acknowledge the data handling policies'
    ],
    prerequisites: [
      'Active corporate account',
      'VPN connection if working remotely',
      'Manager approval (if required)'
    ],
    supportContact: 'IT Help Desk - ext. 1234'
  };
}

function getSupportInformation(app) {
  return {
    vendor: app.publisher,
    vendorSupport: `${app.publisher} Support Portal`,
    internalSupport: 'IT Help Desk - ext. 1234',
    documentation: `/docs/apps/${app.id}`,
    trainingResources: `/training/apps/${app.id}`,
    faq: `/faq/apps/${app.id}`
  };
}

function getAppUsageStats(appId) {
  // Mock usage statistics
  return {
    totalUsers: Math.floor(Math.random() * 500) + 50,
    activeUsers: Math.floor(Math.random() * 300) + 20,
    avgSatisfactionRating: (Math.random() * 2 + 3).toFixed(1),
    totalFeedback: Math.floor(Math.random() * 100)
  };
}

function calculateEstimatedApprovalTime(app) {
  const baseTime = 2; // days
  const riskMultiplier = {
    'Low': 1,
    'Medium': 1.5,
    'High': 2
  };
  
  return `${Math.ceil(baseTime * (riskMultiplier[app.riskLevel] || 1))} business days`;
}

function checkPolicyAcknowledgment(userId, appId) {
  const app = appCatalog.get(appId);
  if (!app || !app.policies) return true;

  // Check if all policies are acknowledged
  return app.policies.every(policy => {
    const ackKey = `${userId}-${appId}-${policy.id}`;
    const ack = policyAcknowledgments.get(ackKey);
    return ack && ack.acknowledged;
  });
}

function getRequiredActions(userId, appId, app) {
  const actions = [];
  
  if (!checkPolicyAcknowledgment(userId, appId)) {
    actions.push({
      action: 'Acknowledge Policies',
      description: 'Review and acknowledge all required policies',
      priority: 'High'
    });
  }

  if (app.vulnerabilities && app.vulnerabilities.length > 0) {
    actions.push({
      action: 'Review Security Alerts',
      description: 'Check latest security advisories for this application',
      priority: 'Medium'
    });
  }

  return actions;
}

function generateUserNotifications(userId) {
  const notifications = [];

  // Check for pending approvals
  const userRequests = Array.from(appRequests.values()).filter(req => req.userId === userId);
  userRequests.forEach(req => {
    if (req.status === 'Pending') {
      notifications.push({
        type: 'info',
        title: 'Approval Pending',
        message: `Your request for ${req.appName} is pending approval`,
        timestamp: req.submittedAt
      });
    }
  });

  // Check for policy acknowledgments needed
  const userApps = userAppUsage.get(userId) || [];
  userApps.forEach(usage => {
    const app = appCatalog.get(usage.appId);
    if (app && !checkPolicyAcknowledgment(userId, usage.appId)) {
      notifications.push({
        type: 'warning',
        title: 'Action Required',
        message: `Please acknowledge policies for ${app.name}`,
        timestamp: new Date().toISOString()
      });
    }
  });

  return notifications;
}

function getTopApps() {
  const apps = Array.from(appCatalog.values());
  return apps
    .sort((a, b) => b.securityRating - a.securityRating)
    .slice(0, 5)
    .map(app => ({
      id: app.id,
      name: app.name,
      securityRating: app.securityRating,
      category: app.category
    }));
}

function getRiskDistribution() {
  const apps = Array.from(appCatalog.values());
  return {
    Low: apps.filter(app => app.riskLevel === 'Low').length,
    Medium: apps.filter(app => app.riskLevel === 'Medium').length,
    High: apps.filter(app => app.riskLevel === 'High').length
  };
}

function getComplianceOverview() {
  const apps = Array.from(appCatalog.values());
  const totalApps = apps.length;
  
  return {
    soc2Compliant: apps.filter(app => app.complianceStatus?.soc2).length,
    iso27001Compliant: apps.filter(app => app.complianceStatus?.iso27001).length,
    gdprCompliant: apps.filter(app => app.complianceStatus?.gdpr).length,
    hipaaCompliant: apps.filter(app => app.complianceStatus?.hipaa).length,
    totalApps: totalApps
  };
}

function getUserEngagementMetrics() {
  return {
    totalUsers: userAppUsage.size,
    totalFeedback: appFeedback.size,
    totalShadowITReports: shadowITReports.size,
    totalRequests: appRequests.size,
    avgComplianceRate: 0.85 // Mock value
  };
}

module.exports = router;
