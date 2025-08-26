// File: ict-governance-framework/test-profile-endpoints.js
// Quick validation script for profile management endpoints

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Test configuration
const testConfig = {
  // You'll need to replace this with a valid JWT token
  accessToken: 'YOUR_ACCESS_TOKEN_HERE',
  baseURL: BASE_URL
};

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${testConfig.baseURL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${testConfig.accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

// Test functions
async function testGetProfile() {
  console.log('\n🔍 Testing GET /api/profile...');
  const result = await makeRequest('GET', '/api/profile');
  
  if (result.success) {
    console.log('✅ Profile retrieved successfully');
    console.log(`   User: ${result.data.profile.first_name} ${result.data.profile.last_name}`);
    console.log(`   Email: ${result.data.profile.email}`);
    console.log(`   Active Sessions: ${result.data.profile.activeSessions}`);
  } else {
    console.log('❌ Failed to retrieve profile');
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
  }
  
  return result;
}

async function testUpdateProfile() {
  console.log('\n✏️ Testing PUT /api/profile...');
  
  const updateData = {
    displayName: `Test User - ${new Date().toISOString()}`
  };
  
  const result = await makeRequest('PUT', '/api/profile', updateData);
  
  if (result.success) {
    console.log('✅ Profile updated successfully');
    console.log(`   Updated display name: ${result.data.profile.display_name}`);
  } else {
    console.log('❌ Failed to update profile');
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
  }
  
  return result;
}

async function testUpdatePreferences() {
  console.log('\n⚙️ Testing PUT /api/profile/preferences...');
  
  const preferencesData = {
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        push: false
      },
      testTimestamp: new Date().toISOString()
    }
  };
  
  const result = await makeRequest('PUT', '/api/profile/preferences', preferencesData);
  
  if (result.success) {
    console.log('✅ Preferences updated successfully');
    console.log(`   Theme: ${result.data.preferences.theme}`);
    console.log(`   Language: ${result.data.preferences.language}`);
  } else {
    console.log('❌ Failed to update preferences');
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
  }
  
  return result;
}

async function testGetActivity() {
  console.log('\n📊 Testing GET /api/profile/activity...');
  const result = await makeRequest('GET', '/api/profile/activity?page=1&limit=5');
  
  if (result.success) {
    console.log('✅ Activity retrieved successfully');
    console.log(`   Total activities: ${result.data.pagination.total}`);
    console.log(`   Recent activities: ${result.data.activities.length}`);
    if (result.data.activities.length > 0) {
      console.log(`   Latest: ${result.data.activities[0].activity_type} - ${result.data.activities[0].activity_description}`);
    }
  } else {
    console.log('❌ Failed to retrieve activity');
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
  }
  
  return result;
}

async function testGetSessions() {
  console.log('\n🔐 Testing GET /api/profile/sessions...');
  const result = await makeRequest('GET', '/api/profile/sessions');
  
  if (result.success) {
    console.log('✅ Sessions retrieved successfully');
    console.log(`   Active sessions: ${result.data.sessions.length}`);
    const currentSession = result.data.sessions.find(s => s.isCurrent);
    if (currentSession) {
      console.log(`   Current session: ${currentSession.sessionId}`);
      console.log(`   Device: ${currentSession.deviceInfo?.platform || 'Unknown'}`);
    }
  } else {
    console.log('❌ Failed to retrieve sessions');
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
  }
  
  return result;
}

async function testPasswordValidation() {
  console.log('\n🔒 Testing PUT /api/profile/password (validation only)...');
  
  // Test with invalid data to check validation
  const invalidPasswordData = {
    currentPassword: 'test',
    newPassword: 'weak',
    confirmPassword: 'different'
  };
  
  const result = await makeRequest('PUT', '/api/profile/password', invalidPasswordData);
  
  if (!result.success && result.status === 400) {
    console.log('✅ Password validation working correctly');
    console.log(`   Validation errors detected: ${result.error.details?.length || 'Yes'}`);
  } else {
    console.log('❌ Password validation not working as expected');
    console.log(`   Result: ${JSON.stringify(result, null, 2)}`);
  }
  
  return result;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Profile API Endpoint Tests');
  console.log('=====================================');
  
  if (testConfig.accessToken === 'YOUR_ACCESS_TOKEN_HERE') {
    console.log('❌ Please update the accessToken in testConfig before running tests');
    console.log('   You can get a token by logging in via POST /api/auth/login');
    return;
  }
  
  const tests = [
    testGetProfile,
    testUpdateProfile,
    testUpdatePreferences,
    testGetActivity,
    testGetSessions,
    testPasswordValidation
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result.success || (test === testPasswordValidation && result.status === 400)) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test failed with exception: ${error.message}`);
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Profile API endpoints are working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the server logs and endpoint implementations.');
  }
}

// Instructions for running the tests
if (require.main === module) {
  console.log('Profile API Endpoint Test Script');
  console.log('================================');
  console.log('');
  console.log('Before running this script:');
  console.log('1. Start the server: npm run server');
  console.log('2. Get an access token by logging in via POST /api/auth/login');
  console.log('3. Update the accessToken in testConfig at the top of this file');
  console.log('4. Run this script: node test-profile-endpoints.js');
  console.log('');
  
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testGetProfile,
  testUpdateProfile,
  testUpdatePreferences,
  testGetActivity,
  testGetSessions,
  testPasswordValidation
};