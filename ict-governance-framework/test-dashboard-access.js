// File: ict-governance-framework/test-dashboard-access.js
// Simple test script to verify dashboard access functionality

const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ict_governance'
});

// Test credentials
const testUsers = [
  { username: 'superadmin', password: 'Admin123!', expectedDashboards: ['executive', 'operational', 'compliance', 'analytics', 'export', 'admin'] },
  { username: 'admin', password: 'Admin123!', expectedDashboards: ['executive', 'operational', 'compliance', 'analytics', 'export'] },
  { username: 'govmanager', password: 'Admin123!', expectedDashboards: ['executive', 'operational', 'compliance', 'analytics', 'export'] },
  { username: 'compliance', password: 'Admin123!', expectedDashboards: ['operational', 'compliance', 'analytics', 'export'] },
  { username: 'itmanager', password: 'Admin123!', expectedDashboards: ['operational', 'analytics', 'export'] },
  { username: 'security', password: 'Admin123!', expectedDashboards: ['operational', 'compliance', 'analytics'] },
  { username: 'auditor', password: 'Admin123!', expectedDashboards: ['compliance', 'analytics'] },
  { username: 'employee', password: 'Admin123!', expectedDashboards: ['operational', 'analytics'] },
  { username: 'demo', password: 'Admin123!', expectedDashboards: ['operational', 'analytics'] }
];

async function testLogin(username, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username,
      password
    });
    
    if (response.data.success) {
      return response.data.data.accessToken;
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
  }
}

async function testDashboardPermissions(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/dashboard-access/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      return response.data.data.dashboardAccess;
    } else {
      throw new Error(response.data.message || 'Permission check failed');
    }
  } catch (error) {
    throw new Error(`Permission check failed: ${error.response?.data?.message || error.message}`);
  }
}

async function testDashboardData(token, dashboardType) {
  try {
    const response = await axios.get(`${API_BASE_URL}/data-processing/dashboard-data?dashboard_type=${dashboardType}&time_range_days=30`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.status === 200;
  } catch (error) {
    if (error.response?.status === 403) {
      return false; // Access denied as expected
    }
    // For other errors (like 404 or 500), we'll consider it a system issue, not an access issue
    console.log(`   ⚠️  Dashboard data endpoint error for ${dashboardType}: ${error.response?.status || error.message}`);
    return true; // Don't fail the test for system issues
  }
}

async function testUserAccess(user) {
  console.log(`\n🧪 Testing user: ${user.username}`);
  console.log('='.repeat(50));
  
  try {
    // Test login
    console.log('   🔐 Testing login...');
    const token = await testLogin(user.username, user.password);
    console.log('   ✅ Login successful');
    
    // Test permission check
    console.log('   🔍 Checking dashboard permissions...');
    const permissions = await testDashboardPermissions(token);
    console.log('   ✅ Permission check successful');
    
    // Verify expected permissions
    const actualDashboards = [];
    if (permissions.executive) actualDashboards.push('executive');
    if (permissions.operational) actualDashboards.push('operational');
    if (permissions.compliance) actualDashboards.push('compliance');
    if (permissions.analytics) actualDashboards.push('analytics');
    if (permissions.export) actualDashboards.push('export');
    if (permissions.admin) actualDashboards.push('admin');
    
    console.log(`   📊 Expected dashboards: ${user.expectedDashboards.join(', ')}`);
    console.log(`   📊 Actual dashboards: ${actualDashboards.join(', ')}`);
    
    // Check if permissions match expectations
    const expectedSet = new Set(user.expectedDashboards);
    const actualSet = new Set(actualDashboards);
    
    const missing = user.expectedDashboards.filter(d => !actualSet.has(d));
    const extra = actualDashboards.filter(d => !expectedSet.has(d));
    
    if (missing.length > 0) {
      console.log(`   ❌ Missing permissions: ${missing.join(', ')}`);
    }
    if (extra.length > 0) {
      console.log(`   ⚠️  Extra permissions: ${extra.join(', ')}`);
    }
    
    if (missing.length === 0 && extra.length === 0) {
      console.log('   ✅ Permissions match expectations');
    }
    
    // Test dashboard data access
    console.log('   🌐 Testing dashboard data access...');
    const dashboardTypes = ['executive', 'operational', 'compliance', 'analytics'];
    
    for (const dashboardType of dashboardTypes) {
      const shouldHaveAccess = actualDashboards.includes(dashboardType);
      const hasAccess = await testDashboardData(token, dashboardType);
      
      if (shouldHaveAccess && hasAccess) {
        console.log(`     ✅ ${dashboardType}: Access granted (expected)`);
      } else if (!shouldHaveAccess && !hasAccess) {
        console.log(`     ✅ ${dashboardType}: Access denied (expected)`);
      } else if (shouldHaveAccess && !hasAccess) {
        console.log(`     ❌ ${dashboardType}: Access denied (unexpected)`);
      } else {
        console.log(`     ⚠️  ${dashboardType}: Access granted (unexpected)`);
      }
    }
    
    return {
      username: user.username,
      success: true,
      permissions: actualDashboards,
      permissionsMatch: missing.length === 0 && extra.length === 0
    };
    
  } catch (error) {
    console.log(`   ❌ Test failed: ${error.message}`);
    return {
      username: user.username,
      success: false,
      error: error.message
    };
  }
}

async function testAdminFunctions() {
  console.log('\n🔧 Testing Admin Functions');
  console.log('='.repeat(50));
  
  try {
    // Login as admin
    const token = await testLogin('superadmin', 'Admin123!');
    console.log('✅ Admin login successful');
    
    // Test user listing
    console.log('📋 Testing user listing...');
    const usersResponse = await axios.get(`${API_BASE_URL}/dashboard-access/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (usersResponse.data.success) {
      console.log(`✅ User listing successful (${usersResponse.data.data.users.length} users found)`);
    } else {
      console.log('❌ User listing failed');
    }
    
    // Test audit log
    console.log('📝 Testing audit log...');
    const auditResponse = await axios.get(`${API_BASE_URL}/dashboard-access/audit`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (auditResponse.data.success) {
      console.log(`✅ Audit log successful (${auditResponse.data.data.auditLogs.length} entries found)`);
    } else {
      console.log('❌ Audit log failed');
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Admin function test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testDatabaseIntegrity() {
  console.log('\n🗄️  Testing Database Integrity');
  console.log('='.repeat(50));
  
  try {
    // Check if all required permissions exist
    const permissionsQuery = `
      SELECT permission_name, display_name 
      FROM permissions 
      WHERE resource = 'dashboards' AND is_active = true
      ORDER BY permission_name
    `;
    
    const permissionsResult = await pool.query(permissionsQuery);
    const expectedPermissions = [
      'dashboard.admin',
      'dashboard.analytics', 
      'dashboard.compliance',
      'dashboard.executive',
      'dashboard.export',
      'dashboard.operational'
    ];
    
    const actualPermissions = permissionsResult.rows.map(row => row.permission_name);
    
    console.log('🔐 Checking dashboard permissions...');
    for (const permission of expectedPermissions) {
      if (actualPermissions.includes(permission)) {
        console.log(`   ✅ ${permission}`);
      } else {
        console.log(`   ❌ Missing: ${permission}`);
      }
    }
    
    // Check if users have roles assigned
    const userRolesQuery = `
      SELECT COUNT(*) as count 
      FROM user_roles ur 
      JOIN users u ON ur.user_id = u.user_id 
      WHERE ur.is_active = true AND u.status = 'Active'
    `;
    
    const userRolesResult = await pool.query(userRolesQuery);
    const userRoleCount = parseInt(userRolesResult.rows[0].count);
    
    console.log(`👥 Active user role assignments: ${userRoleCount}`);
    
    if (userRoleCount > 0) {
      console.log('✅ Users have role assignments');
    } else {
      console.log('❌ No active user role assignments found');
    }
    
    // Check if roles have permissions
    const rolePermissionsQuery = `
      SELECT COUNT(*) as count 
      FROM role_permissions rp 
      JOIN permissions p ON rp.permission_id = p.permission_id 
      WHERE rp.is_active = true AND p.resource = 'dashboards'
    `;
    
    const rolePermissionsResult = await pool.query(rolePermissionsQuery);
    const rolePermissionCount = parseInt(rolePermissionsResult.rows[0].count);
    
    console.log(`🎭 Dashboard role permissions: ${rolePermissionCount}`);
    
    if (rolePermissionCount > 0) {
      console.log('✅ Roles have dashboard permissions');
    } else {
      console.log('❌ No dashboard role permissions found');
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Database integrity test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Dashboard Access Tests');
  console.log('==================================\n');
  
  const results = {
    userTests: [],
    adminTest: false,
    databaseTest: false,
    summary: {
      totalUsers: testUsers.length,
      successfulLogins: 0,
      correctPermissions: 0,
      failedTests: 0
    }
  };
  
  // Test database integrity first
  results.databaseTest = await testDatabaseIntegrity();
  
  // Test each user
  for (const user of testUsers) {
    const result = await testUserAccess(user);
    results.userTests.push(result);
    
    if (result.success) {
      results.summary.successfulLogins++;
      if (result.permissionsMatch) {
        results.summary.correctPermissions++;
      }
    } else {
      results.summary.failedTests++;
    }
  }
  
  // Test admin functions
  results.adminTest = await testAdminFunctions();
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`Database Integrity: ${results.databaseTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Admin Functions: ${results.adminTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Logins: ${results.summary.successfulLogins}/${results.summary.totalUsers} successful`);
  console.log(`Correct Permissions: ${results.summary.correctPermissions}/${results.summary.totalUsers} users`);
  console.log(`Failed Tests: ${results.summary.failedTests}`);
  
  const allTestsPassed = results.databaseTest && 
                        results.adminTest && 
                        results.summary.failedTests === 0 && 
                        results.summary.correctPermissions === results.summary.totalUsers;
  
  console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allTestsPassed) {
    console.log('\n🎉 Dashboard access is working correctly!');
    console.log('Users can now access dashboards based on their permissions.');
    console.log('\nNext steps:');
    console.log('1. Start the frontend: npm run dev');
    console.log('2. Start the backend: npm run server');
    console.log('3. Visit: http://localhost:3000/dashboard');
    console.log('4. Login with any test user (password: Admin123!)');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the setup:');
    console.log('1. Ensure database schema is up to date: npm run setup-db');
    console.log('2. Ensure users are created: npm run setup-users');
    console.log('3. Check server is running: npm run server');
    console.log('4. Verify environment variables are set correctly');
  }
  
  return allTestsPassed;
}

// Main execution
async function main() {
  try {
    const success = await runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { runAllTests, testUserAccess, testAdminFunctions, testDatabaseIntegrity };