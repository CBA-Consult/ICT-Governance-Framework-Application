// Test script to verify Super Admin dashboard permissions
const { Pool } = require('pg');
const { getUserDashboardPermissions } = require('./middleware/dashboardAuth');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testSuperAdminPermissions() {
  try {
    console.log('Testing Super Admin dashboard permissions...\n');
    
    // Test the Super Admin user
    const superAdminUserId = 'USR-SUPERADMIN-001';
    
    console.log(`Checking permissions for user: ${superAdminUserId}`);
    
    // Check user exists and is active
    const userQuery = 'SELECT user_id, username, status FROM users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [superAdminUserId]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Super Admin user not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ User found: ${user.username} (Status: ${user.status})`);
    
    // Check user roles
    const roleQuery = `
      SELECT r.role_name, r.role_type, r.role_hierarchy_level, ur.is_active
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1
    `;
    const roleResult = await pool.query(roleQuery, [superAdminUserId]);
    
    console.log('\n📋 User Roles:');
    roleResult.rows.forEach(role => {
      console.log(`  - ${role.role_name} (Level: ${role.role_hierarchy_level}, Active: ${role.is_active})`);
    });
    
    // Check dashboard permissions using the function
    const dashboardPermissions = await getUserDashboardPermissions(superAdminUserId);
    
    console.log('\n🎛️ Dashboard Permissions:');
    console.log('  Executive:', dashboardPermissions.executive);
    console.log('  Operational:', dashboardPermissions.operational);
    console.log('  Compliance:', dashboardPermissions.compliance);
    console.log('  Analytics:', dashboardPermissions.analytics);
    console.log('  Export:', dashboardPermissions.export);
    console.log('  Admin:', dashboardPermissions.admin);
    console.log('  Super Admin:', dashboardPermissions.super_admin);
    console.log('  Administrator:', dashboardPermissions.administrator);
    console.log('  High Level Access:', dashboardPermissions.hasHighLevelAccess);
    
    console.log('\n🔑 Roles Array:', dashboardPermissions.roles);
    
    // Check if user should have dashboard access
    const hasAccess = dashboardPermissions.super_admin || 
                     dashboardPermissions.administrator || 
                     dashboardPermissions.hasHighLevelAccess ||
                     dashboardPermissions.executive ||
                     dashboardPermissions.operational ||
                     dashboardPermissions.compliance ||
                     dashboardPermissions.analytics;
    
    console.log('\n🚪 Should have dashboard access:', hasAccess ? '✅ YES' : '❌ NO');
    
    if (!hasAccess) {
      console.log('\n🔍 Debugging: Checking raw permissions...');
      
      const rawPermQuery = `
        SELECT DISTINCT p.permission_name, p.display_name, r.role_name
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        JOIN role_permissions rp ON r.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE u.user_id = $1 
          AND u.status = 'Active'
          AND ur.is_active = true
          AND r.is_active = true
          AND rp.is_active = true
          AND p.is_active = true
          AND p.resource = 'dashboards'
      `;
      
      const rawPermResult = await pool.query(rawPermQuery, [superAdminUserId]);
      console.log('Raw dashboard permissions:');
      rawPermResult.rows.forEach(perm => {
        console.log(`  - ${perm.permission_name} (via ${perm.role_name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing permissions:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testSuperAdminPermissions();