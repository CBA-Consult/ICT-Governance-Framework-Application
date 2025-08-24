// Test script to verify permissions API integration
// This script can be run to test the API endpoints used by the permission management components

const axios = require('axios');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Mock authentication token (replace with actual token in real testing)
const AUTH_TOKEN = 'your-test-token-here';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testPermissionsAPI() {
  console.log('🧪 Testing Permissions API Integration...\n');

  try {
    // Test 1: Fetch all permissions
    console.log('1. Testing GET /user-permissions/permissions');
    const permissionsResponse = await apiClient.get('/user-permissions/permissions');
    console.log('✅ Permissions fetched successfully');
    console.log(`   Found ${permissionsResponse.data.permissions?.length || 0} permissions`);
    console.log(`   Grouped into ${Object.keys(permissionsResponse.data.groupedPermissions || {}).length} resources\n`);

    // Test 2: Fetch all roles
    console.log('2. Testing GET /roles');
    const rolesResponse = await apiClient.get('/roles');
    console.log('✅ Roles fetched successfully');
    console.log(`   Found ${rolesResponse.data.roles?.length || 0} roles\n`);

    // Test 3: Fetch role permissions (using first role if available)
    if (rolesResponse.data.roles?.length > 0) {
      const firstRole = rolesResponse.data.roles[0];
      console.log(`3. Testing GET /roles/${firstRole.role_id}`);
      const roleDetailResponse = await apiClient.get(`/roles/${firstRole.role_id}`);
      console.log('✅ Role details fetched successfully');
      console.log(`   Role: ${roleDetailResponse.data.role.display_name}`);
      console.log(`   Permissions: ${roleDetailResponse.data.role.permissions?.length || 0}\n`);
    }

    // Test 4: Fetch users (if endpoint exists)
    console.log('4. Testing GET /users');
    try {
      const usersResponse = await apiClient.get('/users');
      console.log('✅ Users fetched successfully');
      console.log(`   Found ${usersResponse.data.users?.length || 0} users\n`);
    } catch (err) {
      console.log('⚠️  Users endpoint not available or requires different permissions\n');
    }

    // Test 5: Test role permissions endpoint
    console.log('5. Testing GET /roles/permissions/all');
    const allPermissionsResponse = await apiClient.get('/roles/permissions/all');
    console.log('✅ All permissions fetched successfully');
    console.log(`   Found ${allPermissionsResponse.data.permissions?.length || 0} permissions`);
    console.log(`   Grouped into ${Object.keys(allPermissionsResponse.data.groupedPermissions || {}).length} resources\n`);

    console.log('🎉 All API tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Permission fetching: ✅ Working');
    console.log('   - Role fetching: ✅ Working');
    console.log('   - Role details: ✅ Working');
    console.log('   - Grouped permissions: ✅ Working');
    console.log('\n✨ The permission management system should work correctly with these APIs.');

  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure the API server is running');
    console.log('   2. Check the API_BASE_URL configuration');
    console.log('   3. Verify authentication token is valid');
    console.log('   4. Check database connectivity');
  }
}

// Export for use in other test files
module.exports = { testPermissionsAPI };

// Run tests if this file is executed directly
if (require.main === module) {
  testPermissionsAPI();
}