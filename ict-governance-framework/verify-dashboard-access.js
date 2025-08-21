// File: ict-governance-framework/verify-dashboard-access.js
// Script to verify dashboard access permissions for users

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ict_governance'
});

async function verifyDashboardAccess() {
  console.log('🔍 Verifying Dashboard Access Permissions');
  console.log('==========================================\n');
  
  try {
    // Get all users with their dashboard permissions
    const query = `
      SELECT 
        u.user_id,
        u.username,
        u.email,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        u.department,
        u.job_title,
        u.status,
        array_agg(DISTINCT r.role_name ORDER BY r.role_name) as roles,
        array_agg(DISTINCT p.permission_name ORDER BY p.permission_name) FILTER (WHERE p.resource = 'dashboards') as dashboard_permissions,
        bool_or(p.permission_name = 'dashboard.executive') as has_executive,
        bool_or(p.permission_name = 'dashboard.operational') as has_operational,
        bool_or(p.permission_name = 'dashboard.compliance') as has_compliance,
        bool_or(p.permission_name = 'dashboard.analytics') as has_analytics,
        bool_or(p.permission_name = 'dashboard.export') as has_export,
        bool_or(p.permission_name = 'dashboard.admin') as has_admin
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = true
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id AND rp.is_active = true
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = true
      WHERE u.status = 'Active'
      GROUP BY u.user_id, u.username, u.email, u.first_name, u.last_name, u.department, u.job_title, u.status
      ORDER BY u.last_name, u.first_name
    `;
    
    const result = await pool.query(query);
    
    console.log('📊 User Dashboard Access Report:');
    console.log('=================================\n');
    
    let usersWithAccess = 0;
    let usersWithoutAccess = 0;
    
    for (const user of result.rows) {
      const dashboardPermissions = user.dashboard_permissions || [];
      const hasAnyDashboardAccess = dashboardPermissions.length > 0;
      
      if (hasAnyDashboardAccess) {
        usersWithAccess++;
        console.log(`✅ ${user.username} (${user.full_name})`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🏢 Department: ${user.department} - ${user.job_title}`);
        console.log(`   🎭 Roles: ${user.roles.join(', ')}`);
        
        const accessTypes = [];
        if (user.has_executive) accessTypes.push('📈 Executive');
        if (user.has_operational) accessTypes.push('⚙️  Operational');
        if (user.has_compliance) accessTypes.push('📋 Compliance');
        if (user.has_analytics) accessTypes.push('📊 Analytics');
        if (user.has_export) accessTypes.push('💾 Export');
        if (user.has_admin) accessTypes.push('🔧 Admin');
        
        console.log(`   📊 Dashboard Access: ${accessTypes.join(', ')}`);
        console.log('');
      } else {
        usersWithoutAccess++;
        console.log(`❌ ${user.username} (${user.full_name}) - NO DASHBOARD ACCESS`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🏢 Department: ${user.department} - ${user.job_title}`);
        console.log(`   🎭 Roles: ${user.roles.join(', ')}`);
        console.log('');
      }
    }
    
    console.log('📈 Summary:');
    console.log('===========');
    console.log(`👥 Total Active Users: ${result.rows.length}`);
    console.log(`✅ Users with Dashboard Access: ${usersWithAccess}`);
    console.log(`❌ Users without Dashboard Access: ${usersWithoutAccess}`);
    console.log('');
    
    // Check dashboard permissions distribution
    const permissionStats = await pool.query(`
      SELECT 
        p.permission_name,
        p.display_name,
        COUNT(DISTINCT u.user_id) as user_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.permission_id = rp.permission_id AND rp.is_active = true
      LEFT JOIN roles r ON rp.role_id = r.role_id AND r.is_active = true
      LEFT JOIN user_roles ur ON r.role_id = ur.role_id AND ur.is_active = true
      LEFT JOIN users u ON ur.user_id = u.user_id AND u.status = 'Active'
      WHERE p.resource = 'dashboards' AND p.is_active = true
      GROUP BY p.permission_id, p.permission_name, p.display_name
      ORDER BY user_count DESC, p.permission_name
    `);
    
    console.log('📊 Dashboard Permission Distribution:');
    console.log('====================================');
    for (const stat of permissionStats.rows) {
      const permissionType = stat.permission_name.replace('dashboard.', '');
      console.log(`${permissionType.padEnd(12)} | ${stat.user_count.toString().padStart(3)} users | ${stat.display_name}`);
    }
    console.log('');
    
    // Check for users who might need dashboard access
    const usersWithoutDashboardAccess = await pool.query(`
      SELECT 
        u.username,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        u.department,
        u.job_title,
        array_agg(DISTINCT r.role_name ORDER BY r.role_name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = true
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id AND rp.is_active = true
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = true AND p.resource = 'dashboards'
      WHERE u.status = 'Active'
      GROUP BY u.user_id, u.username, u.first_name, u.last_name, u.department, u.job_title
      HAVING NOT bool_or(p.permission_name LIKE 'dashboard.%')
      ORDER BY u.department, u.last_name, u.first_name
    `);
    
    if (usersWithoutDashboardAccess.rows.length > 0) {
      console.log('⚠️  Users without Dashboard Access:');
      console.log('===================================');
      for (const user of usersWithoutDashboardAccess.rows) {
        console.log(`👤 ${user.username} (${user.full_name})`);
        console.log(`   🏢 ${user.department} - ${user.job_title}`);
        console.log(`   🎭 Roles: ${user.roles.join(', ')}`);
        console.log('');
      }
      
      console.log('💡 Recommendations:');
      console.log('===================');
      console.log('Consider granting dashboard access to users based on their roles:');
      console.log('• Managers and above: Operational + Analytics dashboards');
      console.log('• Analysts: Analytics dashboard');
      console.log('• Compliance staff: Compliance dashboard');
      console.log('• Executives: Executive dashboard');
      console.log('');
    }
    
    // Test API endpoint accessibility
    console.log('🔗 API Endpoint Test:');
    console.log('=====================');
    console.log('Dashboard Access API endpoints:');
    console.log('• GET  /api/dashboard-access/permissions - Check user permissions');
    console.log('• POST /api/dashboard-access/grant - Grant dashboard access');
    console.log('• POST /api/dashboard-access/revoke - Revoke dashboard access');
    console.log('• GET  /api/dashboard-access/users - List users with access');
    console.log('• GET  /api/dashboard-access/audit - Access audit logs');
    console.log('');
    
    console.log('🌐 Frontend URLs:');
    console.log('=================');
    console.log('• Main Dashboard: http://localhost:3000/dashboard');
    console.log('• Admin Interface: http://localhost:3000/admin/dashboard-access');
    console.log('');
    
    console.log('🔑 Test Login Credentials:');
    console.log('==========================');
    console.log('Username: superadmin | Password: Admin123! | Access: All dashboards');
    console.log('Username: admin      | Password: Admin123! | Access: All dashboards (except admin)');
    console.log('Username: govmanager | Password: Admin123! | Access: Executive, Operational, Compliance, Analytics');
    console.log('Username: compliance | Password: Admin123! | Access: Operational, Compliance, Analytics');
    console.log('Username: itmanager  | Password: Admin123! | Access: Operational, Analytics');
    console.log('Username: security   | Password: Admin123! | Access: Operational, Compliance, Analytics');
    console.log('Username: auditor    | Password: Admin123! | Access: Compliance, Analytics');
    console.log('Username: employee   | Password: Admin123! | Access: Operational, Analytics (if custom role assigned)');
    console.log('Username: demo       | Password: Admin123! | Access: Operational, Analytics (if custom role assigned)');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error verifying dashboard access:', error);
    throw error;
  }
}

async function testUserPermissions(username) {
  console.log(`🧪 Testing permissions for user: ${username}`);
  console.log('='.repeat(50));
  
  try {
    const userQuery = `
      SELECT 
        u.user_id,
        u.username,
        u.email,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        u.status,
        array_agg(DISTINCT r.role_name ORDER BY r.role_name) as roles,
        array_agg(DISTINCT p.permission_name ORDER BY p.permission_name) FILTER (WHERE p.resource = 'dashboards') as dashboard_permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = true
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id AND rp.is_active = true
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = true
      WHERE u.username = $1
      GROUP BY u.user_id, u.username, u.email, u.first_name, u.last_name, u.status
    `;
    
    const result = await pool.query(userQuery, [username]);
    
    if (result.rows.length === 0) {
      console.log(`❌ User '${username}' not found`);
      return;
    }
    
    const user = result.rows[0];
    console.log(`👤 User: ${user.full_name} (${user.username})`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`📊 Status: ${user.status}`);
    console.log(`🎭 Roles: ${user.roles.join(', ')}`);
    
    const dashboardPermissions = user.dashboard_permissions || [];
    if (dashboardPermissions.length > 0) {
      console.log(`✅ Dashboard Permissions: ${dashboardPermissions.map(p => p.replace('dashboard.', '')).join(', ')}`);
      
      console.log('\n🚪 Dashboard Access:');
      const dashboards = [
        { name: 'Executive', permission: 'dashboard.executive' },
        { name: 'Operational', permission: 'dashboard.operational' },
        { name: 'Compliance', permission: 'dashboard.compliance' },
        { name: 'Analytics', permission: 'dashboard.analytics' },
        { name: 'Export', permission: 'dashboard.export' },
        { name: 'Admin', permission: 'dashboard.admin' }
      ];
      
      for (const dashboard of dashboards) {
        const hasAccess = dashboardPermissions.includes(dashboard.permission);
        console.log(`   ${hasAccess ? '✅' : '❌'} ${dashboard.name} Dashboard`);
      }
    } else {
      console.log('❌ No dashboard permissions found');
    }
    
  } catch (error) {
    console.error('❌ Error testing user permissions:', error);
  }
}

// Main execution
async function main() {
  try {
    await verifyDashboardAccess();
    
    // Test specific users if provided as command line arguments
    const testUsers = process.argv.slice(2);
    if (testUsers.length > 0) {
      console.log('\n🧪 Testing Specific Users:');
      console.log('==========================\n');
      for (const username of testUsers) {
        await testUserPermissions(username);
        console.log('');
      }
    }
    
    console.log('✅ Verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the verification if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { verifyDashboardAccess, testUserPermissions };