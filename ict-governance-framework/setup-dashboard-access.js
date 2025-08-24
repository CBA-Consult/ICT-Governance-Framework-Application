// File: ict-governance-framework/setup-dashboard-access.js
// Node.js script to set up default users with dashboard access rights

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ict_governance'
});

const DEFAULT_PASSWORD = 'Admin123!'; // Change this in production

const defaultUsers = [
  {
    user_id: 'USR-SUPERADMIN-001',
    username: 'superadmin',
    email: 'superadmin@company.com',
    first_name: 'Super',
    last_name: 'Administrator',
    department: 'IT',
    job_title: 'Super Administrator',
    roles: ['ROLE_SUPER_ADMIN']
  },
  {
    user_id: 'USR-ADMIN-001',
    username: 'admin',
    email: 'admin@company.com',
    first_name: 'System',
    last_name: 'Administrator',
    department: 'IT',
    job_title: 'System Administrator',
    roles: ['ROLE_ADMIN']
  },
  {
    user_id: 'USR-GOVMGR-001',
    username: 'govmanager',
    email: 'governance.manager@company.com',
    first_name: 'Jane',
    last_name: 'Smith',
    department: 'Governance',
    job_title: 'Governance Manager',
    roles: ['ROLE_GOVERNANCE_MANAGER']
  },
  {
    user_id: 'USR-COMPLIANCE-001',
    username: 'compliance',
    email: 'compliance.officer@company.com',
    first_name: 'John',
    last_name: 'Doe',
    department: 'Legal',
    job_title: 'Compliance Officer',
    roles: ['ROLE_COMPLIANCE_OFFICER']
  },
  {
    user_id: 'USR-ITMGR-001',
    username: 'itmanager',
    email: 'it.manager@company.com',
    first_name: 'Mike',
    last_name: 'Johnson',
    department: 'IT',
    job_title: 'IT Manager',
    roles: ['ROLE_IT_MANAGER']
  },
  {
    user_id: 'USR-SECURITY-001',
    username: 'security',
    email: 'security.analyst@company.com',
    first_name: 'Sarah',
    last_name: 'Wilson',
    department: 'Security',
    job_title: 'Security Analyst',
    roles: ['ROLE_SECURITY_ANALYST']
  },
  {
    user_id: 'USR-AUDITOR-001',
    username: 'auditor',
    email: 'auditor@company.com',
    first_name: 'David',
    last_name: 'Brown',
    department: 'Audit',
    job_title: 'Internal Auditor',
    roles: ['ROLE_AUDITOR']
  },
  {
    user_id: 'USR-EMPLOYEE-001',
    username: 'employee',
    email: 'employee@company.com',
    first_name: 'Alice',
    last_name: 'Davis',
    department: 'Operations',
    job_title: 'Business Analyst',
    roles: ['ROLE_EMPLOYEE']
  },
  {
    user_id: 'USR-DEMO-001',
    username: 'demo',
    email: 'demo@company.com',
    first_name: 'Demo',
    last_name: 'User',
    department: 'Demo',
    job_title: 'Demo User',
    roles: ['ROLE_EMPLOYEE']
  },
  {
    user_id: 'USR-EXECUTIVE-001',
    username: 'executive',
    email: 'executive@company.com',
    first_name: 'Robert',
    last_name: 'Executive',
    department: 'Executive',
    job_title: 'Chief Executive Officer',
    roles: ['ROLE_GOVERNANCE_MANAGER'] // Give executive access through governance manager role
  },
  {
    user_id: 'USR-MANAGER-001',
    username: 'manager',
    email: 'manager@company.com',
    first_name: 'Lisa',
    last_name: 'Manager',
    department: 'Operations',
    job_title: 'Department Manager',
    roles: ['ROLE_EMPLOYEE']
  }
];

async function setupDashboardAccess() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting dashboard access setup...');
    
    await client.query('BEGIN');
    
    // Hash the default password
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    console.log('🔐 Password hashed successfully');
    
    // Create users
    console.log('👥 Creating default users...');
    for (const user of defaultUsers) {
      try {
        // Check if user already exists
        const existingUser = await client.query(
          'SELECT user_id FROM users WHERE user_id = $1 OR username = $2 OR email = $3',
          [user.user_id, user.username, user.email]
        );
        
        if (existingUser.rows.length > 0) {
          console.log(`   ⚠️  User ${user.username} already exists, skipping...`);
          continue;
        }
        
        // Create user
        await client.query(`
          INSERT INTO users (
            user_id, username, email, password_hash, first_name, last_name,
            display_name, department, job_title, status, email_verified,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          user.user_id,
          user.username,
          user.email,
          passwordHash,
          user.first_name,
          user.last_name,
          `${user.first_name} ${user.last_name}`,
          user.department,
          user.job_title,
          'Active',
          true,
          new Date(),
          new Date()
        ]);
        
        // Add password to history
        await client.query(`
          INSERT INTO password_history (user_id, password_hash, created_at)
          VALUES ($1, $2, $3)
        `, [user.user_id, passwordHash, new Date()]);
        
        console.log(`   ✅ Created user: ${user.username} (${user.first_name} ${user.last_name})`);
        
        // Assign roles
        for (const roleId of user.roles) {
          try {
            await client.query(`
              INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active, assignment_reason)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (user_id, role_id) DO NOTHING
            `, [
              user.user_id,
              roleId,
              'USR-SUPERADMIN-001',
              new Date(),
              true,
              'Initial system setup'
            ]);
            console.log(`     🔑 Assigned role: ${roleId}`);
          } catch (roleError) {
            console.log(`     ⚠️  Role assignment failed for ${roleId}: ${roleError.message}`);
          }
        }
        
      } catch (userError) {
        console.error(`   ❌ Failed to create user ${user.username}:`, userError.message);
      }
    }
    
    // Create custom dashboard roles for employees
    console.log('🎭 Creating custom dashboard roles...');
    
    const customRoles = [
      {
        role_id: 'ROLE_EMPLOYEE_DASHBOARD',
        role_name: 'employee_dashboard',
        display_name: 'Employee Dashboard Access',
        description: 'Employee role with operational dashboard access',
        permissions: ['PERM_DASHBOARD_OPERATIONAL', 'PERM_DASHBOARD_ANALYTICS']
      },
      {
        role_id: 'ROLE_EXECUTIVE_DASHBOARD',
        role_name: 'executive_dashboard',
        display_name: 'Executive Dashboard Only',
        description: 'Executive role with only executive dashboard access',
        permissions: ['PERM_DASHBOARD_EXECUTIVE', 'PERM_DASHBOARD_EXPORT']
      },
      {
        role_id: 'ROLE_MANAGER_DASHBOARD',
        role_name: 'manager_dashboard',
        display_name: 'Manager Dashboard Access',
        description: 'Manager role with operational and compliance dashboard access',
        permissions: ['PERM_DASHBOARD_OPERATIONAL', 'PERM_DASHBOARD_COMPLIANCE', 'PERM_DASHBOARD_ANALYTICS', 'PERM_DASHBOARD_EXPORT']
      }
    ];
    
    for (const role of customRoles) {
      try {
        // Check if role exists
        const existingRole = await client.query(
          'SELECT role_id FROM roles WHERE role_id = $1',
          [role.role_id]
        );
        
        if (existingRole.rows.length === 0) {
          // Create role
          await client.query(`
            INSERT INTO roles (role_id, role_name, display_name, description, role_type, is_system_role, role_hierarchy_level, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            role.role_id,
            role.role_name,
            role.display_name,
            role.description,
            'Custom',
            false,
            15,
            'USR-SUPERADMIN-001'
          ]);
          console.log(`   ✅ Created role: ${role.role_name}`);
        } else {
          console.log(`   ⚠️  Role ${role.role_name} already exists, skipping creation...`);
        }
        
        // Assign permissions to role
        for (const permissionId of role.permissions) {
          try {
            await client.query(`
              INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at, is_active)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (role_id, permission_id) DO NOTHING
            `, [
              role.role_id,
              permissionId,
              'USR-SUPERADMIN-001',
              new Date(),
              true
            ]);
            console.log(`     🔐 Assigned permission: ${permissionId}`);
          } catch (permError) {
            console.log(`     ⚠️  Permission assignment failed for ${permissionId}: ${permError.message}`);
          }
        }
        
      } catch (roleError) {
        console.error(`   ❌ Failed to create role ${role.role_name}:`, roleError.message);
      }
    }
    
    // Assign additional dashboard roles to specific users
    console.log('🎯 Assigning additional dashboard access...');
    
    const additionalAssignments = [
      { user_id: 'USR-EMPLOYEE-001', role_id: 'ROLE_EMPLOYEE_DASHBOARD', reason: 'Dashboard access for business analysis' },
      { user_id: 'USR-DEMO-001', role_id: 'ROLE_EMPLOYEE_DASHBOARD', reason: 'Demo dashboard access' },
      { user_id: 'USR-MANAGER-001', role_id: 'ROLE_MANAGER_DASHBOARD', reason: 'Manager dashboard access' }
    ];
    
    for (const assignment of additionalAssignments) {
      try {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active, assignment_reason)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id, role_id) DO NOTHING
        `, [
          assignment.user_id,
          assignment.role_id,
          'USR-SUPERADMIN-001',
          new Date(),
          true,
          assignment.reason
        ]);
        console.log(`   ✅ Assigned ${assignment.role_id} to ${assignment.user_id}`);
      } catch (assignError) {
        console.log(`   ⚠️  Assignment failed: ${assignError.message}`);
      }
    }
    
    // Create activity logs
    console.log('📝 Creating activity logs...');
    const logEntries = [
      {
        log_id: `LOG-SETUP-${Date.now()}-001`,
        user_id: 'USR-SUPERADMIN-001',
        activity_type: 'user_creation',
        activity_description: 'Initial system setup - created default users with dashboard access',
        resource: 'users',
        action: 'create'
      },
      {
        log_id: `LOG-SETUP-${Date.now()}-002`,
        user_id: 'USR-SUPERADMIN-001',
        activity_type: 'role_assignment',
        activity_description: 'Initial system setup - assigned dashboard roles to users',
        resource: 'roles',
        action: 'assign'
      },
      {
        log_id: `LOG-SETUP-${Date.now()}-003`,
        user_id: 'USR-SUPERADMIN-001',
        activity_type: 'dashboard_access',
        activity_description: 'Initial system setup - configured dashboard permissions',
        resource: 'dashboards',
        action: 'setup'
      }
    ];
    
    for (const log of logEntries) {
      try {
        await client.query(`
          INSERT INTO user_activity_log (
            log_id, user_id, activity_type, activity_description,
            resource, action, success, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          log.log_id,
          log.user_id,
          log.activity_type,
          log.activity_description,
          log.resource,
          log.action,
          true,
          new Date()
        ]);
      } catch (logError) {
        console.log(`   ⚠️  Log entry failed: ${logError.message}`);
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ Dashboard access setup completed successfully!');
    
    // Display summary
    console.log('\n📊 User Dashboard Access Summary:');
    console.log('=====================================');
    
    const summary = await client.query(`
      SELECT 
        u.username,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        u.department,
        u.job_title,
        array_agg(DISTINCT r.role_name ORDER BY r.role_name) as roles,
        array_agg(DISTINCT p.permission_name ORDER BY p.permission_name) FILTER (WHERE p.resource = 'dashboards') as dashboard_permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = true
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id AND rp.is_active = true
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = true
      WHERE u.status = 'Active'
      GROUP BY u.user_id, u.username, u.first_name, u.last_name, u.department, u.job_title
      ORDER BY u.last_name, u.first_name
    `);
    
    for (const user of summary.rows) {
      const dashboardAccess = user.dashboard_permissions || [];
      const accessTypes = dashboardAccess.map(p => p.replace('dashboard.', '')).join(', ') || 'None';
      console.log(`👤 ${user.username} (${user.full_name})`);
      console.log(`   📍 ${user.department} - ${user.job_title}`);
      console.log(`   🎭 Roles: ${user.roles.join(', ')}`);
      console.log(`   📊 Dashboard Access: ${accessTypes}`);
      console.log('');
    }
    
    console.log('\n🔑 Login Credentials:');
    console.log('=====================');
    console.log('All users have the same password for demo purposes:');
    console.log(`Password: ${DEFAULT_PASSWORD}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change these passwords in production!');
    console.log('');
    console.log('🌐 Dashboard URLs:');
    console.log('==================');
    console.log('Main Dashboard: http://localhost:3000/dashboard');
    console.log('Admin Interface: http://localhost:3000/admin/dashboard-access');
    console.log('');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying setup...');
  
  try {
    // Check if users can access dashboards
    const verificationQuery = `
      SELECT 
        u.username,
        u.email,
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
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = true AND p.resource = 'dashboards'
      WHERE u.status = 'Active'
      GROUP BY u.user_id, u.username, u.email
      HAVING bool_or(p.permission_name LIKE 'dashboard.%')
      ORDER BY u.username
    `;
    
    const result = await pool.query(verificationQuery);
    
    console.log('✅ Users with dashboard access:');
    for (const user of result.rows) {
      const access = [];
      if (user.has_executive) access.push('Executive');
      if (user.has_operational) access.push('Operational');
      if (user.has_compliance) access.push('Compliance');
      if (user.has_analytics) access.push('Analytics');
      if (user.has_export) access.push('Export');
      if (user.has_admin) access.push('Admin');
      
      console.log(`   👤 ${user.username}: ${access.join(', ')}`);
    }
    
    console.log(`\n📈 Total users with dashboard access: ${result.rows.length}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Main execution
async function main() {
  try {
    await setupDashboardAccess();
    await verifySetup();
    console.log('\n🎉 Setup completed successfully!');
    console.log('You can now log in with any of the created users and access the dashboards.');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { setupDashboardAccess, verifySetup };