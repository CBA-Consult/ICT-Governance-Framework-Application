// File: ict-governance-framework/examples/user-permissions-example.js
// Example usage of the User Permissions Management API

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:4000/api/user-permissions';
const AUTH_TOKEN = 'your-jwt-token-here'; // Replace with actual token

// Create axios instance with default headers
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Example: Get all available permissions
 */
async function getAllPermissions() {
  try {
    console.log('🔍 Fetching all permissions...');
    
    const response = await api.get('/permissions', {
      params: {
        page: 1,
        limit: 20,
        resource: 'users' // Filter by resource
      }
    });

    console.log('✅ Permissions fetched successfully:');
    console.log(`Total permissions: ${response.data.data.totalPermissions}`);
    console.log('Grouped by resource:', Object.keys(response.data.data.groupedPermissions));
    
    return response.data.data.permissions;
  } catch (error) {
    console.error('❌ Error fetching permissions:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example: Get user's effective permissions
 */
async function getUserPermissions(userId) {
  try {
    console.log(`🔍 Fetching permissions for user: ${userId}`);
    
    const response = await api.get(`/users/${userId}/permissions`);

    console.log('✅ User permissions fetched successfully:');
    console.log(`User: ${response.data.data.user.username}`);
    console.log(`Total permissions: ${response.data.data.totalPermissions}`);
    
    // Show permissions by resource
    Object.entries(response.data.data.groupedPermissions).forEach(([resource, permissions]) => {
      console.log(`  ${resource}: ${permissions.length} permissions`);
    });
    
    return response.data.data.permissions;
  } catch (error) {
    console.error('❌ Error fetching user permissions:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example: Get user's roles
 */
async function getUserRoles(userId) {
  try {
    console.log(`🔍 Fetching roles for user: ${userId}`);
    
    const response = await api.get(`/users/${userId}/roles`);

    console.log('✅ User roles fetched successfully:');
    console.log(`User: ${response.data.data.user.username}`);
    console.log(`Total roles: ${response.data.data.totalRoles}`);
    
    response.data.data.roles.forEach(role => {
      console.log(`  - ${role.display_name} (${role.role_name})`);
      console.log(`    Assigned: ${new Date(role.assigned_at).toLocaleDateString()}`);
      console.log(`    Expires: ${role.expires_at ? new Date(role.expires_at).toLocaleDateString() : 'Never'}`);
    });
    
    return response.data.data.roles;
  } catch (error) {
    console.error('❌ Error fetching user roles:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example: Assign roles to a user
 */
async function assignRolesToUser(userId, roleIds, reason = 'API example assignment') {
  try {
    console.log(`🔧 Assigning roles to user: ${userId}`);
    console.log(`Roles to assign: ${roleIds.join(', ')}`);
    
    const response = await api.post(`/users/${userId}/roles`, {
      roleIds,
      reason,
      expiresAt: null // No expiration
    });

    console.log('✅ Roles assigned successfully:');
    console.log(`Total assigned: ${response.data.data.totalAssigned}`);
    
    response.data.data.assignedRoles.forEach(role => {
      if (role.assignment) {
        console.log(`  ✓ ${role.display_name} assigned`);
      } else {
        console.log(`  ⚠️ ${role.display_name} - ${role.message}`);
      }
    });
    
    return response.data.data.assignedRoles;
  } catch (error) {
    console.error('❌ Error assigning roles:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example: Remove a role from a user
 */
async function removeRoleFromUser(userId, roleId, reason = 'API example removal') {
  try {
    console.log(`🗑️ Removing role ${roleId} from user: ${userId}`);
    
    const response = await api.delete(`/users/${userId}/roles/${roleId}`, {
      data: { reason }
    });

    console.log('✅ Role removed successfully:');
    console.log(`Removed: ${response.data.data.removedAssignment.displayName}`);
    console.log(`Reason: ${response.data.data.removedAssignment.reason}`);
    
    return response.data.data.removedAssignment;
  } catch (error) {
    console.error('❌ Error removing role:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example: Update user's role assignments (replace all)
 */
async function updateUserRoles(userId, newRoleIds, reason = 'API example update') {
  try {
    console.log(`🔄 Updating roles for user: ${userId}`);
    console.log(`New roles: ${newRoleIds.join(', ')}`);
    
    const response = await api.put(`/users/${userId}/roles`, {
      roleIds: newRoleIds,
      reason
    });

    console.log('✅ User roles updated successfully:');
    console.log(`Added: ${response.data.data.changes.totalAdded} roles`);
    console.log(`Removed: ${response.data.data.changes.totalRemoved} roles`);
    
    if (response.data.data.changes.added.length > 0) {
      console.log(`  Added roles: ${response.data.data.changes.added.join(', ')}`);
    }
    
    if (response.data.data.changes.removed.length > 0) {
      console.log(`  Removed roles: ${response.data.data.changes.removed.join(', ')}`);
    }
    
    return response.data.data.changes;
  } catch (error) {
    console.error('❌ Error updating user roles:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Complete example workflow
 */
async function runCompleteExample() {
  const userId = 'USR-EXAMPLE-123'; // Replace with actual user ID
  
  try {
    console.log('🚀 Starting User Permissions Management Example\n');
    
    // 1. Get all available permissions
    console.log('='.repeat(50));
    await getAllPermissions();
    
    // 2. Get user's current permissions
    console.log('\n' + '='.repeat(50));
    await getUserPermissions(userId);
    
    // 3. Get user's current roles
    console.log('\n' + '='.repeat(50));
    await getUserRoles(userId);
    
    // 4. Assign new roles
    console.log('\n' + '='.repeat(50));
    await assignRolesToUser(userId, ['ROLE_EMPLOYEE', 'ROLE_AUDITOR'], 'Example assignment');
    
    // 5. Check permissions after role assignment
    console.log('\n' + '='.repeat(50));
    await getUserPermissions(userId);
    
    // 6. Remove a specific role
    console.log('\n' + '='.repeat(50));
    await removeRoleFromUser(userId, 'ROLE_AUDITOR', 'No longer needed for example');
    
    // 7. Update all roles at once
    console.log('\n' + '='.repeat(50));
    await updateUserRoles(userId, ['ROLE_EMPLOYEE'], 'Simplifying role assignments');
    
    // 8. Final check
    console.log('\n' + '='.repeat(50));
    await getUserRoles(userId);
    
    console.log('\n✅ Example completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
  }
}

/**
 * Search and filter examples
 */
async function searchAndFilterExamples() {
  try {
    console.log('🔍 Search and Filter Examples\n');
    
    // Search permissions by keyword
    console.log('1. Searching permissions with keyword "user":');
    const userPermissions = await api.get('/permissions', {
      params: { search: 'user', limit: 5 }
    });
    console.log(`Found ${userPermissions.data.data.permissions.length} permissions`);
    
    // Filter by resource
    console.log('\n2. Filtering permissions by resource "roles":');
    const rolePermissions = await api.get('/permissions', {
      params: { resource: 'roles' }
    });
    console.log(`Found ${rolePermissions.data.data.permissions.length} role permissions`);
    
    // Filter by action
    console.log('\n3. Filtering permissions by action "read":');
    const readPermissions = await api.get('/permissions', {
      params: { action: 'read' }
    });
    console.log(`Found ${readPermissions.data.data.permissions.length} read permissions`);
    
  } catch (error) {
    console.error('❌ Search examples failed:', error.response?.data || error.message);
  }
}

// Export functions for use in other modules
module.exports = {
  getAllPermissions,
  getUserPermissions,
  getUserRoles,
  assignRolesToUser,
  removeRoleFromUser,
  updateUserRoles,
  runCompleteExample,
  searchAndFilterExamples
};

// Run example if this file is executed directly
if (require.main === module) {
  console.log('📝 User Permissions API Examples');
  console.log('Please update the AUTH_TOKEN and userId variables before running.');
  console.log('Uncomment one of the following lines to run an example:\n');
  
  // Uncomment to run examples:
  // runCompleteExample();
  // searchAndFilterExamples();
}