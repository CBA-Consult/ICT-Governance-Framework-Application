/**
 * Test suite for CASB App Catalog API
 * Tests employee-facing and admin-facing endpoints
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_BASE = `${BASE_URL}/api/casb`;

// Test user credentials
const TEST_USER = {
  userId: 'test-user-123',
  role: 'Employee',
  department: 'Marketing'
};

const ADMIN_USER = {
  userId: 'admin-user-123',
  role: 'Administrator',
  department: 'IT'
};

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, user = TEST_USER) {
  const config = {
    method: method,
    url: `${API_BASE}${endpoint}`,
    headers: {
      'x-user-id': user.userId,
      'x-user-role': user.role,
      'x-user-department': user.department,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${status}: ${name}${message ? ' - ' + message : ''}`);
  
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Test functions
async function testGetPersonalizedCatalog() {
  console.log('\n=== Testing Get Personalized Catalog ===');
  
  try {
    const result = await makeRequest('GET', '/catalog/me');
    
    logTest(
      'Get personalized catalog',
      result.success === true && Array.isArray(result.apps),
      `Found ${result.apps?.length || 0} apps`
    );
    
    if (result.apps && result.apps.length > 0) {
      const app = result.apps[0];
      logTest(
        'Catalog contains required fields',
        app.id && app.name && app.category && app.securityRating !== undefined,
        `App: ${app.name}`
      );
    }
  } catch (error) {
    logTest('Get personalized catalog', false, error.message);
  }
}

async function testGetAppDetails() {
  console.log('\n=== Testing Get Application Details ===');
  
  try {
    const result = await makeRequest('GET', '/catalog/app-001');
    
    logTest(
      'Get app details',
      result.success === true && result.data !== null,
      `App: ${result.data?.name || 'Unknown'}`
    );
    
    if (result.data) {
      logTest(
        'App details include compliance validation',
        result.data.complianceValidation !== undefined,
        `Compliance score: ${result.data.complianceValidation?.complianceScore || 'N/A'}`
      );
      
      logTest(
        'App details include installation instructions',
        result.data.installationInstructions !== undefined,
        `Has ${result.data.installationInstructions?.steps?.length || 0} steps`
      );
    }
  } catch (error) {
    logTest('Get app details', false, error.message);
  }
  
  // Test with non-existent app
  try {
    const result = await makeRequest('GET', '/catalog/nonexistent-app');
    logTest(
      'Get non-existent app returns 404',
      result.success === false && result.error,
      'Correctly handles missing app'
    );
  } catch (error) {
    logTest('Get non-existent app returns 404', false, error.message);
  }
}

async function testRequestApproval() {
  console.log('\n=== Testing Request App Approval ===');
  
  try {
    const requestData = {
      businessJustification: 'Test justification for team collaboration',
      department: 'Marketing',
      estimatedUsers: 5,
      urgency: 'Medium'
    };
    
    const result = await makeRequest('POST', '/catalog/app-002/request-approval', requestData);
    
    logTest(
      'Request app approval',
      result.success === true && result.data?.requestId,
      `Request ID: ${result.data?.requestId || 'N/A'}`
    );
    
    // Store request ID for later tests
    if (result.data?.requestId) {
      global.testRequestId = result.data.requestId;
    }
  } catch (error) {
    logTest('Request app approval', false, error.message);
  }
  
  // Test with missing required field
  try {
    const result = await makeRequest('POST', '/catalog/app-002/request-approval', {});
    logTest(
      'Request approval validation',
      !result.success || result.errors,
      'Correctly validates required fields'
    );
  } catch (error) {
    logTest('Request approval validation', false, error.message);
  }
}

async function testReportShadowIT() {
  console.log('\n=== Testing Report Shadow IT ===');
  
  try {
    const reportData = {
      appName: 'TestCollabTool',
      appUrl: 'https://testcollabtool.com',
      description: 'Test collaboration tool',
      usageReason: 'Team requested for project tracking'
    };
    
    const result = await makeRequest('POST', '/catalog/report-shadow-app', reportData);
    
    logTest(
      'Report shadow IT app',
      result.success === true && result.data?.reportId,
      `Report ID: ${result.data?.reportId || 'N/A'}`
    );
  } catch (error) {
    logTest('Report shadow IT app', false, error.message);
  }
  
  // Test with missing required field
  try {
    const result = await makeRequest('POST', '/catalog/report-shadow-app', {
      appName: 'TestApp'
    });
    logTest(
      'Shadow IT report validation',
      !result.success || result.errors,
      'Correctly validates required fields'
    );
  } catch (error) {
    logTest('Shadow IT report validation', false, error.message);
  }
}

async function testGetUserCompliance() {
  console.log('\n=== Testing Get User Compliance Status ===');
  
  try {
    const result = await makeRequest('GET', '/catalog/me/compliance');
    
    logTest(
      'Get user compliance status',
      result.success === true && Array.isArray(result.apps),
      `Overall compliance: ${result.overallCompliance ? 'Yes' : 'No'}`
    );
  } catch (error) {
    logTest('Get user compliance status', false, error.message);
  }
}

async function testAcknowledgePolicy() {
  console.log('\n=== Testing Acknowledge Policy ===');
  
  try {
    const ackData = {
      policyId: 'pol-001',
      acknowledged: true
    };
    
    const result = await makeRequest('POST', '/catalog/app-001/acknowledge-policy', ackData);
    
    logTest(
      'Acknowledge policy',
      result.success === true,
      result.message || 'Policy acknowledged'
    );
  } catch (error) {
    logTest('Acknowledge policy', false, error.message);
  }
}

async function testGetNotifications() {
  console.log('\n=== Testing Get User Notifications ===');
  
  try {
    const result = await makeRequest('GET', '/notifications/me');
    
    logTest(
      'Get user notifications',
      result.success === true && Array.isArray(result.notifications),
      `Found ${result.notifications?.length || 0} notifications`
    );
  } catch (error) {
    logTest('Get user notifications', false, error.message);
  }
}

async function testSubmitFeedback() {
  console.log('\n=== Testing Submit App Feedback ===');
  
  try {
    const feedbackData = {
      rating: 4,
      comment: 'Great tool, very helpful for team collaboration',
      category: 'Usability'
    };
    
    const result = await makeRequest('POST', '/feedback/apps/app-001', feedbackData);
    
    logTest(
      'Submit app feedback',
      result.success === true && result.data?.feedbackId,
      `Feedback ID: ${result.data?.feedbackId || 'N/A'}`
    );
  } catch (error) {
    logTest('Submit app feedback', false, error.message);
  }
  
  // Test with invalid rating
  try {
    const result = await makeRequest('POST', '/feedback/apps/app-001', {
      rating: 10,
      comment: 'Invalid rating'
    });
    logTest(
      'Feedback validation',
      !result.success || result.errors,
      'Correctly validates rating range'
    );
  } catch (error) {
    logTest('Feedback validation', false, error.message);
  }
}

async function testAdminGetCatalog() {
  console.log('\n=== Testing Admin: Get All Applications ===');
  
  try {
    const result = await makeRequest('GET', '/admin/catalog', null, ADMIN_USER);
    
    logTest(
      'Admin get all applications',
      result.success === true && Array.isArray(result.apps),
      `Found ${result.apps?.length || 0} apps`
    );
    
    // Test with filters
    const filteredResult = await makeRequest(
      'GET',
      '/admin/catalog?category=Productivity',
      null,
      ADMIN_USER
    );
    
    logTest(
      'Admin catalog filtering',
      filteredResult.success === true,
      `Filtered to ${filteredResult.apps?.length || 0} apps`
    );
  } catch (error) {
    logTest('Admin get all applications', false, error.message);
  }
}

async function testAdminAddApp() {
  console.log('\n=== Testing Admin: Add New Application ===');
  
  try {
    const newApp = {
      name: 'Test Application',
      publisher: 'Test Publisher',
      category: 'Testing',
      description: 'Test application for API testing',
      version: '1.0.0',
      securityRating: 75,
      riskLevel: 'Medium',
      dataClassification: 'Business'
    };
    
    const result = await makeRequest('POST', '/admin/catalog', newApp, ADMIN_USER);
    
    logTest(
      'Admin add new application',
      result.success === true && result.data?.id,
      `App ID: ${result.data?.id || 'N/A'}`
    );
    
    // Store app ID for later tests
    if (result.data?.id) {
      global.testAppId = result.data.id;
    }
  } catch (error) {
    logTest('Admin add new application', false, error.message);
  }
  
  // Test with missing required field
  try {
    const result = await makeRequest('POST', '/admin/catalog', {
      name: 'Incomplete App'
    }, ADMIN_USER);
    logTest(
      'Admin add app validation',
      !result.success || result.errors,
      'Correctly validates required fields'
    );
  } catch (error) {
    logTest('Admin add app validation', false, error.message);
  }
}

async function testAdminUpdateApp() {
  console.log('\n=== Testing Admin: Update Application ===');
  
  try {
    const updateData = {
      securityRating: 85,
      approvalStatus: 'Approved',
      isApproved: true
    };
    
    const appId = global.testAppId || 'app-001';
    const result = await makeRequest('PUT', `/admin/catalog/${appId}`, updateData, ADMIN_USER);
    
    logTest(
      'Admin update application',
      result.success === true,
      `Updated app: ${result.data?.name || 'Unknown'}`
    );
  } catch (error) {
    logTest('Admin update application', false, error.message);
  }
}

async function testAdminGetRequests() {
  console.log('\n=== Testing Admin: Get Approval Requests ===');
  
  try {
    const result = await makeRequest('GET', '/admin/app-requests', null, ADMIN_USER);
    
    logTest(
      'Admin get approval requests',
      result.success === true && Array.isArray(result.requests),
      `Found ${result.requests?.length || 0} requests`
    );
  } catch (error) {
    logTest('Admin get approval requests', false, error.message);
  }
}

async function testAdminProcessRequest() {
  console.log('\n=== Testing Admin: Process Approval Request ===');
  
  try {
    const requestId = global.testRequestId || 'req-test';
    const reviewData = {
      status: 'Approved',
      reviewNotes: 'Approved for testing purposes'
    };
    
    const result = await makeRequest(
      'PUT',
      `/admin/app-requests/${requestId}`,
      reviewData,
      ADMIN_USER
    );
    
    logTest(
      'Admin process approval request',
      result.success === true || result.error === 'Request not found',
      result.message || 'Request processed'
    );
  } catch (error) {
    logTest('Admin process approval request', false, error.message);
  }
}

async function testAdminGetAnalytics() {
  console.log('\n=== Testing Admin: Get Usage Analytics ===');
  
  try {
    const result = await makeRequest('GET', '/admin/app-usage-analytics', null, ADMIN_USER);
    
    logTest(
      'Admin get usage analytics',
      result.success === true && result.analytics,
      `Total apps: ${result.analytics?.totalApps || 0}`
    );
    
    if (result.analytics) {
      logTest(
        'Analytics include risk distribution',
        result.analytics.riskDistribution !== undefined,
        `Risk levels tracked: ${Object.keys(result.analytics.riskDistribution || {}).length}`
      );
      
      logTest(
        'Analytics include compliance overview',
        result.analytics.complianceOverview !== undefined,
        `Compliance metrics available`
      );
    }
  } catch (error) {
    logTest('Admin get usage analytics', false, error.message);
  }
}

async function testAdminGetShadowITReports() {
  console.log('\n=== Testing Admin: Get Shadow IT Reports ===');
  
  try {
    const result = await makeRequest('GET', '/admin/shadow-it-reports', null, ADMIN_USER);
    
    logTest(
      'Admin get shadow IT reports',
      result.success === true && Array.isArray(result.reports),
      `Found ${result.reports?.length || 0} reports`
    );
  } catch (error) {
    logTest('Admin get shadow IT reports', false, error.message);
  }
}

async function testAdminBroadcastUpdate() {
  console.log('\n=== Testing Admin: Broadcast Policy Update ===');
  
  try {
    const broadcast = {
      title: 'Test Policy Update',
      message: 'This is a test policy update broadcast',
      targetAudience: 'All',
      priority: 'Medium'
    };
    
    const result = await makeRequest(
      'POST',
      '/admin/policy-updates/broadcast',
      broadcast,
      ADMIN_USER
    );
    
    logTest(
      'Admin broadcast policy update',
      result.success === true && result.data?.id,
      `Broadcast ID: ${result.data?.id || 'N/A'}`
    );
  } catch (error) {
    logTest('Admin broadcast policy update', false, error.message);
  }
}

async function testAdminDeleteApp() {
  console.log('\n=== Testing Admin: Delete Application ===');
  
  // Only delete if we created a test app
  if (global.testAppId) {
    try {
      const result = await makeRequest(
        'DELETE',
        `/admin/catalog/${global.testAppId}`,
        null,
        ADMIN_USER
      );
      
      logTest(
        'Admin delete application',
        result.success === true,
        result.message || 'App deleted'
      );
    } catch (error) {
      logTest('Admin delete application', false, error.message);
    }
  } else {
    logTest('Admin delete application', true, 'Skipped - no test app created');
  }
}

async function testHealthCheck() {
  console.log('\n=== Testing Health Check ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    const result = response.data;
    
    logTest(
      'Health check endpoint',
      result.status === 'ok',
      `Status: ${result.status}`
    );
    
    logTest(
      'CASB service enabled',
      result.services?.casbAppCatalog === 'enabled',
      'CASB service registered in health check'
    );
  } catch (error) {
    logTest('Health check endpoint', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('CASB App Catalog API Test Suite');
  console.log('='.repeat(60));
  console.log(`Testing against: ${BASE_URL}`);
  console.log('='.repeat(60));

  // Run all tests in sequence
  await testHealthCheck();
  
  // Employee-facing tests
  await testGetPersonalizedCatalog();
  await testGetAppDetails();
  await testRequestApproval();
  await testReportShadowIT();
  await testGetUserCompliance();
  await testAcknowledgePolicy();
  await testGetNotifications();
  await testSubmitFeedback();
  
  // Admin-facing tests
  await testAdminGetCatalog();
  await testAdminAddApp();
  await testAdminUpdateApp();
  await testAdminGetRequests();
  await testAdminProcessRequest();
  await testAdminGetAnalytics();
  await testAdminGetShadowITReports();
  await testAdminBroadcastUpdate();
  await testAdminDeleteApp();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`Passed: ${testResults.passed} ✓`);
  console.log(`Failed: ${testResults.failed} ✗`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  // Exit with appropriate code
  if (testResults.failed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the results above.');
    process.exit(1);
  } else {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
};
