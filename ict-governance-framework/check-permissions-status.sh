#!/bin/bash

# Script to check the current status of permissions and roles for notification system
# This script helps verify what's currently in the database vs what needs to be applied

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found. Please create it with your database configuration."
    exit 1
fi

# Load environment variables
source .env

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not set in .env file"
    exit 1
fi

print_status "Checking current permissions and roles status..."

# Test database connection
if ! psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
    print_error "Cannot connect to database. Please check your DATABASE_URL."
    exit 1
fi

print_success "Database connection successful"

echo ""
echo "=== CURRENT DATABASE STATUS ==="

# Check existing permissions
print_status "Checking existing permissions..."
TOTAL_PERMISSIONS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM permissions;" | tr -d ' ')
print_status "Total permissions in database: $TOTAL_PERMISSIONS"

# Check for notification-specific permissions
NOTIFICATION_PERMISSIONS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM permissions WHERE permission_name LIKE 'notification.%' OR permission_name LIKE 'alert.%' OR permission_name LIKE 'escalation.%' OR permission_name LIKE 'communication.%' OR permission_name LIKE 'realtime.%';" | tr -d ' ')

if [ "$NOTIFICATION_PERMISSIONS" -eq 0 ]; then
    print_warning "❌ NO notification-specific permissions found"
    print_warning "   Need to apply: db-permissions-update.sql"
else
    print_success "✅ Found $NOTIFICATION_PERMISSIONS notification-related permissions"
fi

# List current permissions
echo ""
print_status "Current permissions in database:"
psql "$DATABASE_URL" -c "SELECT permission_name, display_name, resource, action FROM permissions ORDER BY resource, action;" 2>/dev/null || print_error "Failed to query permissions"

echo ""
print_status "Checking existing roles..."
TOTAL_ROLES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM roles;" | tr -d ' ')
print_status "Total roles in database: $TOTAL_ROLES"

# Check for new system roles
NEW_ROLES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM roles WHERE role_name IN ('system_administrator', 'it_support', 'notification_admin');" | tr -d ' ')

if [ "$NEW_ROLES" -eq 0 ]; then
    print_warning "❌ NO new system roles found"
    print_warning "   Need to apply: db-permissions-update.sql"
else
    print_success "✅ Found $NEW_ROLES new system roles"
fi

# List current roles
echo ""
print_status "Current roles in database:"
psql "$DATABASE_URL" -c "SELECT role_name, display_name, role_hierarchy_level, is_system_role FROM roles ORDER BY role_hierarchy_level DESC;" 2>/dev/null || print_error "Failed to query roles"

echo ""
print_status "Checking role-permission assignments..."
ROLE_PERMISSION_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM role_permissions;" | tr -d ' ')
print_status "Total role-permission assignments: $ROLE_PERMISSION_COUNT"

# Check notification-specific assignments
NOTIFICATION_ASSIGNMENTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.permission_id WHERE p.permission_name LIKE 'notification.%' OR p.permission_name LIKE 'alert.%' OR p.permission_name LIKE 'escalation.%' OR p.permission_name LIKE 'communication.%';" | tr -d ' ')

if [ "$NOTIFICATION_ASSIGNMENTS" -eq 0 ]; then
    print_warning "❌ NO notification permission assignments found"
    print_warning "   Need to apply: db-permissions-update.sql"
else
    print_success "✅ Found $NOTIFICATION_ASSIGNMENTS notification permission assignments"
fi

echo ""
print_status "Checking notification system tables..."

# Check if notification tables exist
NOTIFICATION_TABLES=("notification_types" "notifications" "user_notification_preferences" "alerts" "alert_rules" "communication_channels" "escalation_policies")
EXISTING_TABLES=0

for table in "${NOTIFICATION_TABLES[@]}"; do
    if psql "$DATABASE_URL" -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';" | grep -q 1; then
        print_success "✅ Table '$table' exists"
        ((EXISTING_TABLES++))
    else
        print_warning "❌ Table '$table' does not exist"
    fi
done

if [ "$EXISTING_TABLES" -eq 0 ]; then
    print_warning "❌ NO notification system tables found"
    print_warning "   Need to apply: db-notifications-schema.sql"
elif [ "$EXISTING_TABLES" -eq ${#NOTIFICATION_TABLES[@]} ]; then
    print_success "✅ All notification system tables exist"
else
    print_warning "⚠️  Only $EXISTING_TABLES of ${#NOTIFICATION_TABLES[@]} notification tables exist"
fi

echo ""
print_status "Checking user assignments..."
USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
USER_ROLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM user_roles WHERE is_active = TRUE;" | tr -d ' ')

print_status "Total users: $USER_COUNT"
print_status "Active user-role assignments: $USER_ROLE_COUNT"

if [ "$USER_ROLE_COUNT" -gt 0 ]; then
    echo ""
    print_status "Current user-role assignments:"
    psql "$DATABASE_URL" -c "SELECT u.username, r.role_name, ur.assigned_at FROM user_roles ur JOIN users u ON ur.user_id = u.user_id JOIN roles r ON ur.role_id = r.role_id WHERE ur.is_active = TRUE ORDER BY ur.assigned_at DESC LIMIT 10;" 2>/dev/null || print_warning "Could not query user assignments"
fi

echo ""
echo "=== STATUS SUMMARY ==="

# Determine overall status
SCHEMA_READY=false
PERMISSIONS_READY=false
ASSIGNMENTS_READY=false

if [ "$EXISTING_TABLES" -eq ${#NOTIFICATION_TABLES[@]} ]; then
    SCHEMA_READY=true
    print_success "✅ Notification Schema: READY"
else
    print_warning "❌ Notification Schema: NOT READY"
fi

if [ "$NOTIFICATION_PERMISSIONS" -gt 0 ] && [ "$NEW_ROLES" -gt 0 ]; then
    PERMISSIONS_READY=true
    print_success "✅ Permissions & Roles: READY"
else
    print_warning "❌ Permissions & Roles: NOT READY"
fi

if [ "$NOTIFICATION_ASSIGNMENTS" -gt 0 ]; then
    ASSIGNMENTS_READY=true
    print_success "✅ Permission Assignments: READY"
else
    print_warning "❌ Permission Assignments: NOT READY"
fi

echo ""
echo "=== NEXT STEPS ==="

if [ "$SCHEMA_READY" = false ]; then
    echo "1. Apply notification schema:"
    echo "   psql \$DATABASE_URL -f db-notifications-schema.sql"
fi

if [ "$PERMISSIONS_READY" = false ]; then
    echo "2. Apply permissions update:"
    echo "   psql \$DATABASE_URL -f db-permissions-update.sql"
fi

if [ "$SCHEMA_READY" = false ] || [ "$PERMISSIONS_READY" = false ]; then
    echo "3. OR run the automated script:"
    echo "   ./apply-permissions-update.sh"
fi

if [ "$USER_ROLE_COUNT" -eq 0 ]; then
    echo "4. Assign roles to users:"
    echo "   INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ('USER123', 'ROLE_IT_MANAGER', 'ADMIN');"
fi

echo "5. Restart application to load new API routes"
echo "6. Test notification system functionality"

echo ""
if [ "$SCHEMA_READY" = true ] && [ "$PERMISSIONS_READY" = true ] && [ "$ASSIGNMENTS_READY" = true ]; then
    print_success "🎉 NOTIFICATION SYSTEM IS READY TO USE!"
else
    print_warning "⚠️  NOTIFICATION SYSTEM REQUIRES SETUP - See steps above"
fi

echo ""
print_status "For detailed information, see: NOTIFICATION-PERMISSIONS-STATUS-REPORT.md"