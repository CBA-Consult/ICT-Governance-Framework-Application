#!/bin/bash

# Script to apply notification system permissions update
# This script applies the comprehensive permissions for the notification system

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

print_status "Starting notification system permissions update..."

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    print_error "psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Test database connection
print_status "Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
    print_error "Cannot connect to database. Please check your DATABASE_URL."
    exit 1
fi

print_success "Database connection successful"

# Apply the main notification schema
print_status "Applying notification system database schema..."
if psql "$DATABASE_URL" -f db-notifications-schema.sql; then
    print_success "Notification system schema applied successfully"
else
    print_error "Failed to apply notification system schema"
    exit 1
fi

# Apply permissions update
print_status "Applying permissions update..."
if psql "$DATABASE_URL" -f db-permissions-update.sql; then
    print_success "Permissions update applied successfully"
else
    print_error "Failed to apply permissions update"
    exit 1
fi

# Verify the update
print_status "Verifying permissions update..."

# Check if new permissions exist
PERMISSION_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM permissions WHERE permission_name LIKE 'notification.%' OR permission_name LIKE 'alert.%' OR permission_name LIKE 'escalation.%' OR permission_name LIKE 'communication.%';" | tr -d ' ')

if [ "$PERMISSION_COUNT" -gt 0 ]; then
    print_success "Found $PERMISSION_COUNT notification-related permissions"
else
    print_warning "No notification-related permissions found. This might indicate an issue."
fi

# Check if new roles exist
ROLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM roles WHERE role_name IN ('system_administrator', 'it_support', 'notification_admin');" | tr -d ' ')

if [ "$ROLE_COUNT" -gt 0 ]; then
    print_success "Found $ROLE_COUNT new system roles"
else
    print_warning "No new system roles found."
fi

# Check role-permission assignments
ASSIGNMENT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.permission_id WHERE p.permission_name LIKE 'notification.%' OR p.permission_name LIKE 'alert.%';" | tr -d ' ')

if [ "$ASSIGNMENT_COUNT" -gt 0 ]; then
    print_success "Found $ASSIGNMENT_COUNT role-permission assignments for notification system"
else
    print_warning "No role-permission assignments found for notification system."
fi

print_status "Permissions update verification complete"

# Display summary
echo ""
echo "=== PERMISSIONS UPDATE SUMMARY ==="
echo "✓ Notification system schema applied"
echo "✓ Permissions update applied"
echo "✓ $PERMISSION_COUNT notification-related permissions created"
echo "✓ $ROLE_COUNT new system roles created"
echo "✓ $ASSIGNMENT_COUNT role-permission assignments created"
echo ""

print_success "Notification system permissions update completed successfully!"

# Provide next steps
echo ""
echo "=== NEXT STEPS ==="
echo "1. Restart your application server to load the new API routes"
echo "2. Assign appropriate roles to users using the user management interface"
echo "3. Test the notification system functionality"
echo "4. Review the NOTIFICATION-PERMISSIONS-GUIDE.md for detailed information"
echo ""

# Optional: Show available roles
print_status "Available roles for notification system:"
psql "$DATABASE_URL" -c "SELECT role_name, display_name, description FROM roles WHERE is_active = TRUE ORDER BY role_hierarchy_level DESC;"

echo ""
print_status "For detailed permission information, see: NOTIFICATION-PERMISSIONS-GUIDE.md"