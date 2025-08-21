#!/bin/bash

# User Management Test Runner Script
# This script runs the comprehensive end-to-end tests for the New User button and user creation workflow

echo "🚀 Starting User Management End-to-End Tests"
echo "=============================================="

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if Playwright is available
if ! npx playwright --version &> /dev/null; then
    echo "📦 Installing Playwright..."
    npx playwright install
fi

# Set environment variables for testing
export NODE_ENV=test
export CI=false

echo "🔧 Environment Setup:"
echo "   - NODE_ENV: $NODE_ENV"
echo "   - Base URL: http://localhost:3000"
echo "   - Test Directory: ./tests"

echo ""
echo "🧪 Running User Management Tests..."
echo "-----------------------------------"

# Run the specific user management tests
npx playwright test tests/user-management.spec.ts --reporter=html

# Check the exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All User Management Tests Passed!"
    echo ""
    echo "📊 Test Coverage Summary:"
    echo "   ✓ New User Button Visibility and Responsiveness"
    echo "   ✓ User Creation Modal Functionality"
    echo "   ✓ Form Validation (Required fields, Email format, Password validation)"
    echo "   ✓ Successful User Creation Workflow"
    echo "   ✓ Modal Interaction (Close, Cancel, Reset)"
    echo "   ✓ Loading States and Error Handling"
    echo "   ✓ Permission-based Access Control"
    echo "   ✓ Accessibility (Keyboard navigation, ARIA labels)"
    echo "   ✓ Integration Tests"
    echo ""
    echo "🎯 Acceptance Criteria Verified:"
    echo "   ✅ Admin users can add new users without issues"
    echo "   ✅ The 'New User' button is responsive"
    echo ""
    echo "📈 View detailed test report: npx playwright show-report"
else
    echo ""
    echo "❌ Some tests failed. Please check the output above for details."
    echo "📈 View detailed test report: npx playwright show-report"
    exit 1
fi