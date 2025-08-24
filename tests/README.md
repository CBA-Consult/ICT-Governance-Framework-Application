# User Management End-to-End Tests

## Overview

This directory contains comprehensive end-to-end tests for the 'New User' button and user creation workflow in the ICT Governance Framework application.

## 🎯 Test Objectives

The tests verify the following acceptance criteria:

1. ✅ **Admin users can add new users without issues**
2. ✅ **The 'New User' button is responsive**

## 📁 File Structure

```
tests/
├── user-management.spec.ts              # Main test suite
├── helpers/
│   └── user-management-helpers.ts       # Reusable helper functions
├── run-user-management-tests.sh         # Test runner script
├── validate-test-environment.js         # Environment validation
├── USER-MANAGEMENT-TEST-DOCUMENTATION.md # Detailed documentation
└── README.md                            # This file
```

## 🚀 Quick Start

### 1. Validate Environment

```bash
npm run test:validate-env
```

### 2. Run Tests

```bash
# Using npm scripts
npm run test:user-management

# Using the test runner script
./tests/run-user-management-tests.sh

# Using Playwright directly
npx playwright test tests/user-management.spec.ts
```

### 3. View Results

```bash
npm run test:report
```

## 🧪 Test Categories

### ✅ Button Responsiveness Tests
- Display verification for admin users
- Responsive design across screen sizes
- Hover effects and visual feedback
- Click functionality and modal opening

### ✅ User Creation Workflow Tests
- Complete user creation with all fields
- Minimal user creation with required fields only
- Form validation (required fields, email format, password rules)
- Success message display and user table updates

### ✅ Error Handling Tests
- Network error simulation
- Loading state verification
- Validation error messages
- Graceful failure handling

### ✅ Accessibility Tests
- Keyboard navigation
- ARIA labels and roles
- Screen reader compatibility

### ✅ Integration Tests
- Database integration
- API endpoint testing
- User list refresh after creation

## 🛠 Development Commands

```bash
# Run tests with visible browser
npm run test:user-management:headed

# Run tests in debug mode
npm run test:user-management:debug

# Run all tests
npm test

# Generate and view test report
npm run test:report
```

## 📋 Prerequisites

- Node.js 16+ and npm
- Playwright installed (`npx playwright install`)
- ICT Governance Framework running on `http://localhost:3000`

## 🔧 Configuration

The tests are configured in `playwright.config.ts` with:
- Base URL: `http://localhost:3000`
- Multiple browser support (Chromium, Firefox, WebKit)
- Screenshot and video capture on failure
- HTML reporting

## 📊 Test Coverage

The test suite provides comprehensive coverage of:

- **Functional Testing**: All user creation workflow steps
- **UI Testing**: Button responsiveness and modal behavior
- **Validation Testing**: Form validation rules and error handling
- **Integration Testing**: End-to-end workflow with backend
- **Accessibility Testing**: Keyboard navigation and ARIA compliance
- **Error Handling**: Network failures and edge cases

## 🐛 Troubleshooting

### Common Issues

1. **Tests fail with "Application not running"**
   ```bash
   cd ict-governance-framework
   npm run dev
   ```

2. **Playwright not installed**
   ```bash
   npx playwright install
   ```

3. **Permission errors on scripts**
   ```bash
   chmod +x tests/run-user-management-tests.sh
   chmod +x tests/validate-test-environment.js
   ```

### Debug Mode

For step-by-step debugging:
```bash
npm run test:user-management:debug
```

### Headed Mode

To see tests running in browser:
```bash
npm run test:user-management:headed
```

## 📈 Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run User Management Tests
  run: |
    npm install
    npx playwright install
    npm run test:user-management
```

## 📚 Documentation

For detailed documentation, see:
- [USER-MANAGEMENT-TEST-DOCUMENTATION.md](./USER-MANAGEMENT-TEST-DOCUMENTATION.md)

## 🤝 Contributing

When adding new tests:

1. Use the helper functions in `helpers/user-management-helpers.ts`
2. Follow the existing test structure and naming conventions
3. Add appropriate documentation
4. Ensure tests are independent and can run in any order
5. Include cleanup for any test data created

## 📝 Test Results

After running tests, you'll see a summary like:

```
✅ All User Management Tests Passed!

📊 Test Coverage Summary:
   ✓ New User Button Visibility and Responsiveness
   ✓ User Creation Modal Functionality
   ✓ Form Validation
   ✓ Successful User Creation Workflow
   ✓ Modal Interaction
   ✓ Loading States and Error Handling
   ✓ Permission-based Access Control
   ✓ Accessibility
   ✓ Integration Tests

🎯 Acceptance Criteria Verified:
   ✅ Admin users can add new users without issues
   ✅ The 'New User' button is responsive
```

## 🔒 Security

- Tests use non-production test data
- Automatic cleanup of test users
- No sensitive information in logs
- Isolated test environment

---

For questions or issues, please refer to the detailed documentation or create an issue in the project repository.