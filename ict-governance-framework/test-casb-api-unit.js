/**
 * Simple unit tests for CASB App Catalog API
 * Tests the API endpoints without requiring full server startup
 */

const express = require('express');
const request = require('supertest');

// Create a minimal Express app with just the CASB API
function createTestApp() {
  const app = express();
  app.use(express.json());
  
  // Mount the CASB API routes
  const casbRouter = require('./api/casb-app-catalog');
  app.use('/api/casb', casbRouter);
  
  return app;
}

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;

function logTest(name, passed, message = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${status}: ${name}${message ? ' - ' + message : ''}`);
  
  if (passed) {
    testsPassed++;
  } else {
    testsFailed++;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('CASB App Catalog API Unit Tests');
  console.log('='.repeat(60));
  
  const app = createTestApp();
  
  try {
    // Test 1: Get personalized catalog
    console.log('\n=== Testing Employee-Facing Endpoints ===');
    
    const catalogRes = await request(app)
      .get('/api/casb/catalog/me')
      .set('x-user-id', 'test-user-123')
      .set('x-user-role', 'Employee');
    
    logTest(
      'GET /catalog/me',
      catalogRes.status === 200 && catalogRes.body.success,
      `Found ${catalogRes.body.apps?.length || 0} apps`
    );
    
    // Test 2: Get app details
    const appDetailsRes = await request(app)
      .get('/api/casb/catalog/app-001')
      .set('x-user-id', 'test-user-123');
    
    logTest(
      'GET /catalog/:appId',
      appDetailsRes.status === 200 && appDetailsRes.body.success,
      `App: ${appDetailsRes.body.data?.name || 'Unknown'}`
    );
    
    // Test 3: Get non-existent app
    const notFoundRes = await request(app)
      .get('/api/casb/catalog/nonexistent')
      .set('x-user-id', 'test-user-123');
    
    logTest(
      'GET /catalog/:appId (not found)',
      notFoundRes.status === 404 && !notFoundRes.body.success,
      'Correctly returns 404'
    );
    
    // Test 4: Request approval
    const approvalRes = await request(app)
      .post('/api/casb/catalog/app-002/request-approval')
      .set('x-user-id', 'test-user-123')
      .send({
        businessJustification: 'Test justification',
        department: 'Marketing',
        estimatedUsers: 5,
        urgency: 'Medium'
      });
    
    logTest(
      'POST /catalog/:appId/request-approval',
      approvalRes.status === 201 && approvalRes.body.success,
      `Request ID: ${approvalRes.body.data?.requestId || 'N/A'}`
    );
    
    // Test 5: Request approval validation
    const validationRes = await request(app)
      .post('/api/casb/catalog/app-002/request-approval')
      .set('x-user-id', 'test-user-123')
      .send({});
    
    logTest(
      'POST /catalog/:appId/request-approval (validation)',
      validationRes.status === 400,
      'Correctly validates required fields'
    );
    
    // Test 6: Report shadow IT
    const shadowRes = await request(app)
      .post('/api/casb/catalog/report-shadow-app')
      .set('x-user-id', 'test-user-123')
      .send({
        appName: 'TestApp',
        appUrl: 'https://testapp.com',
        description: 'Test app',
        usageReason: 'Testing'
      });
    
    logTest(
      'POST /catalog/report-shadow-app',
      shadowRes.status === 201 && shadowRes.body.success,
      `Report ID: ${shadowRes.body.data?.reportId || 'N/A'}`
    );
    
    // Test 7: Get compliance status
    const complianceRes = await request(app)
      .get('/api/casb/catalog/me/compliance')
      .set('x-user-id', 'test-user-123');
    
    logTest(
      'GET /catalog/me/compliance',
      complianceRes.status === 200 && complianceRes.body.success,
      `Compliance: ${complianceRes.body.overallCompliance ? 'Yes' : 'No'}`
    );
    
    // Test 8: Acknowledge policy
    const ackRes = await request(app)
      .post('/api/casb/catalog/app-001/acknowledge-policy')
      .set('x-user-id', 'test-user-123')
      .send({
        policyId: 'pol-001',
        acknowledged: true
      });
    
    logTest(
      'POST /catalog/:appId/acknowledge-policy',
      ackRes.status === 200 && ackRes.body.success,
      'Policy acknowledged'
    );
    
    // Test 9: Get notifications
    const notifRes = await request(app)
      .get('/api/casb/notifications/me')
      .set('x-user-id', 'test-user-123');
    
    logTest(
      'GET /notifications/me',
      notifRes.status === 200 && notifRes.body.success,
      `Found ${notifRes.body.notifications?.length || 0} notifications`
    );
    
    // Test 10: Submit feedback
    const feedbackRes = await request(app)
      .post('/api/casb/feedback/apps/app-001')
      .set('x-user-id', 'test-user-123')
      .send({
        rating: 4,
        comment: 'Great app',
        category: 'Usability'
      });
    
    logTest(
      'POST /feedback/apps/:appId',
      feedbackRes.status === 201 && feedbackRes.body.success,
      `Feedback ID: ${feedbackRes.body.data?.feedbackId || 'N/A'}`
    );
    
    // Test 11: Admin - Get catalog
    console.log('\n=== Testing Admin-Facing Endpoints ===');
    
    const adminCatalogRes = await request(app)
      .get('/api/casb/admin/catalog')
      .set('x-user-id', 'admin-123')
      .set('x-user-role', 'Administrator');
    
    logTest(
      'GET /admin/catalog',
      adminCatalogRes.status === 200 && adminCatalogRes.body.success,
      `Found ${adminCatalogRes.body.apps?.length || 0} apps`
    );
    
    // Test 12: Admin - Add app
    const addAppRes = await request(app)
      .post('/api/casb/admin/catalog')
      .set('x-user-id', 'admin-123')
      .send({
        name: 'Test App',
        publisher: 'Test Publisher',
        category: 'Testing',
        securityRating: 75
      });
    
    logTest(
      'POST /admin/catalog',
      addAppRes.status === 201 && addAppRes.body.success,
      `App ID: ${addAppRes.body.data?.id || 'N/A'}`
    );
    
    const testAppId = addAppRes.body.data?.id;
    
    // Test 13: Admin - Update app
    if (testAppId) {
      const updateAppRes = await request(app)
        .put(`/api/casb/admin/catalog/${testAppId}`)
        .set('x-user-id', 'admin-123')
        .send({
          securityRating: 85,
          isApproved: true
        });
      
      logTest(
        'PUT /admin/catalog/:appId',
        updateAppRes.status === 200 && updateAppRes.body.success,
        'App updated'
      );
    }
    
    // Test 14: Admin - Get requests
    const requestsRes = await request(app)
      .get('/api/casb/admin/app-requests')
      .set('x-user-id', 'admin-123');
    
    logTest(
      'GET /admin/app-requests',
      requestsRes.status === 200 && requestsRes.body.success,
      `Found ${requestsRes.body.requests?.length || 0} requests`
    );
    
    // Test 15: Admin - Get analytics
    const analyticsRes = await request(app)
      .get('/api/casb/admin/app-usage-analytics')
      .set('x-user-id', 'admin-123');
    
    logTest(
      'GET /admin/app-usage-analytics',
      analyticsRes.status === 200 && analyticsRes.body.success,
      `Total apps: ${analyticsRes.body.analytics?.totalApps || 0}`
    );
    
    // Test 16: Admin - Get shadow IT reports
    const shadowReportsRes = await request(app)
      .get('/api/casb/admin/shadow-it-reports')
      .set('x-user-id', 'admin-123');
    
    logTest(
      'GET /admin/shadow-it-reports',
      shadowReportsRes.status === 200 && shadowReportsRes.body.success,
      `Found ${shadowReportsRes.body.reports?.length || 0} reports`
    );
    
    // Test 17: Admin - Broadcast update
    const broadcastRes = await request(app)
      .post('/api/casb/admin/policy-updates/broadcast')
      .set('x-user-id', 'admin-123')
      .send({
        title: 'Test Broadcast',
        message: 'Test message',
        targetAudience: 'All',
        priority: 'Medium'
      });
    
    logTest(
      'POST /admin/policy-updates/broadcast',
      broadcastRes.status === 201 && broadcastRes.body.success,
      `Broadcast ID: ${broadcastRes.body.data?.id || 'N/A'}`
    );
    
    // Test 18: Admin - Delete app
    if (testAppId) {
      const deleteAppRes = await request(app)
        .delete(`/api/casb/admin/catalog/${testAppId}`)
        .set('x-user-id', 'admin-123');
      
      logTest(
        'DELETE /admin/catalog/:appId',
        deleteAppRes.status === 200 && deleteAppRes.body.success,
        'App deleted'
      );
    }
    
  } catch (error) {
    console.error('Error running tests:', error);
    testsFailed++;
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`Passed: ${testsPassed} ✓`);
  console.log(`Failed: ${testsFailed} ✗`);
  console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (testsFailed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the results above.');
    process.exit(1);
  } else {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
