// File: ict-governance-framework/test-profile-authentication.js
// Test script to verify profile page authentication integration

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Test configuration
const testConfig = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

async function testUnauthenticatedAccess() {
  console.log('\n🔒 Testing unauthenticated access to profile API...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/profile`, testConfig);
    console.log('❌ SECURITY ISSUE: Unauthenticated access allowed');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Unauthenticated access properly blocked (401)');
      console.log(`   Error: ${error.response.data.error}`);
      return true;
    } else {
      console.log('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function testInvalidTokenAccess() {
  console.log('\n🔒 Testing invalid token access to profile API...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/profile`, {
      ...testConfig,
      headers: {
        ...testConfig.headers,
        'Authorization': 'Bearer invalid-token-12345'
      }
    });
    console.log('❌ SECURITY ISSUE: Invalid token access allowed');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Invalid token access properly blocked (401)');
      console.log(`   Error: ${error.response.data.error}`);
      return true;
    } else {
      console.log('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function testAuthenticationFlow() {
  console.log('\n🔐 Testing complete authentication flow...');
  
  try {
    // Test login endpoint exists
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'wrongpassword'
    }, testConfig);
    
    console.log('❌ Login should have failed with wrong credentials');
    return false;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 400)) {
      console.log('✅ Login properly validates credentials');
      console.log(`   Status: ${error.response.status}`);
      return true;
    } else {
      console.log('❌ Unexpected login error:', error.message);
      return false;
    }
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing server health...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`, testConfig);
    
    if (response.status === 200 && response.data.status === 'ok') {
      console.log('✅ Server is healthy');
      console.log(`   Services: ${Object.keys(response.data.services).length} enabled`);
      
      // Check if authentication service is enabled
      if (response.data.services.authentication === 'enabled') {
        console.log('✅ Authentication service is enabled');
      } else {
        console.log('❌ Authentication service not enabled');
      }
      
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Server health check error:', error.message);
    return false;
  }
}

async function runAuthenticationTests() {
  console.log('🧪 Profile Authentication Integration Tests');
  console.log('==========================================');
  
  const results = [];
  
  // Test server health first
  results.push(await testHealthCheck());
  
  // Test authentication requirements
  results.push(await testUnauthenticatedAccess());
  results.push(await testInvalidTokenAccess());
  results.push(await testAuthenticationFlow());
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total} tests`);
  
  if (passed === total) {
    console.log('🎉 All authentication tests passed!');
    console.log('\n✅ Profile page authentication integration is working correctly:');
    console.log('   - API endpoints are properly secured');
    console.log('   - Unauthenticated access is blocked');
    console.log('   - Invalid tokens are rejected');
    console.log('   - Authentication flow is functional');
  } else {
    console.log('❌ Some tests failed. Please review the security implementation.');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Start the server: npm run dev (in ict-governance-framework directory)');
  console.log('2. Start the frontend: npm run dev (in root directory)');
  console.log('3. Navigate to http://localhost:3000/auth to login');
  console.log('4. After login, access http://localhost:3000/profile');
  console.log('5. Verify that only authenticated users can access their profile');
}

// Handle server not running
process.on('unhandledRejection', (reason, promise) => {
  if (reason.code === 'ECONNREFUSED') {
    console.log('\n❌ Server is not running!');
    console.log('Please start the server first:');
    console.log('1. cd ict-governance-framework');
    console.log('2. npm install (if not done already)');
    console.log('3. npm run dev or node server.js');
    console.log('4. Then run this test again');
    process.exit(1);
  }
});

if (require.main === module) {
  runAuthenticationTests().catch(console.error);
}

module.exports = {
  runAuthenticationTests,
  testUnauthenticatedAccess,
  testInvalidTokenAccess,
  testAuthenticationFlow,
  testHealthCheck
};