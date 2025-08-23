# User Management End-to-End Test Documentation

## Overview

This document describes the comprehensive end-to-end testing suite for the 'New User' button and user creation workflow in the ICT Governance Framework application.

## Test Objectives

The primary objectives of these tests are to verify:

1. **Admin users can add new users without issues**
2. **The 'New User' button is responsive**

## Test Structure

### Test Files

- `tests/user-management.spec.ts` - Main test suite
- `tests/helpers/user-management-helpers.ts` - Reusable helper functions
- `tests/run-user-management-tests.sh` - Test runner script

### Test Categories

#### 1. New User Button Visibility and Responsiveness

**Purpose**: Verify that the New User button is properly displayed and responsive for admin users.

**Test Cases**:
- ✅ Display New User button for admin users
- ✅ Responsive design across different screen sizes (Desktop, Tablet, Mobile)
- ✅ Hover effects and visual feedback
- ✅ Button clickability and modal opening

**Acceptance Criteria Covered**:
- The 'New User' button is responsive ✅

#### 2. User Creation Modal Functionality

**Purpose**: Ensure the user creation modal displays correctly with all required components.

**Test Cases**:
- ✅ Display all required form fields
- ✅ Password visibility toggle functionality
- ✅ Role selection checkboxes
- ✅ Cancel and Create User buttons

#### 3. Form Validation

**Purpose**: Verify comprehensive form validation for user input.

**Test Cases**:
- ✅ Required field validation
- ✅ Email format validation
- ✅ Password length validation (minimum 8 characters)
- ✅ Password confirmation matching
- ✅ Unique username and email validation

#### 4. Successful User Creation

**Purpose**: Test the complete user creation workflow from start to finish.

**Test Cases**:
- ✅ Create user with complete data
- ✅ Create user with minimal required data
- ✅ Form reset after successful creation
- ✅ Success message display
- ✅ User appears in user table

**Acceptance Criteria Covered**:
- Admin users can add new users without issues ✅

#### 5. Modal Interaction

**Purpose**: Verify proper modal behavior and user interaction.

**Test Cases**:
- ✅ Close modal via Cancel button
- ✅ Close modal via X button
- ✅ Close modal by clicking outside
- ✅ Form data clearing when modal is closed and reopened

#### 6. Loading States and Error Handling

**Purpose**: Test application behavior during loading and error conditions.

**Test Cases**:
- ✅ Loading state display during user creation
- ✅ Network error handling
- ✅ Graceful error message display

#### 7. Permission-based Access Control

**Purpose**: Verify that access controls work correctly for different user roles.

**Test Cases**:
- ✅ Hide New User button for users without create permission
- ✅ Permission validation before user creation

#### 8. Accessibility

**Purpose**: Ensure the interface is accessible to all users.

**Test Cases**:
- ✅ Keyboard navigation support
- ✅ Proper ARIA labels and roles
- ✅ Screen reader compatibility

#### 9. Integration Tests

**Purpose**: Test the complete workflow integration with backend systems.

**Test Cases**:
- ✅ User list refresh after creation
- ✅ Database integration
- ✅ API endpoint integration

## Test Data

### Test Users

```typescript
TEST_USERS = {
  BASIC: {
    username: 'testuser123',
    email: 'testuser123@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'SecurePassword123!',
    department: 'IT',
    jobTitle: 'Software Engineer'
  },
  MINIMAL: {
    username: 'minimal_user',
    email: 'minimal@example.com',
    firstName: 'Min',
    lastName: 'User',
    password: 'MinimalPass123!'
  }
}
```

### Admin User

```typescript
DEFAULT_ADMIN_USER = {
  username: 'admin',
  password: 'admin123',
  email: 'admin@example.com'
}
```

## Helper Functions

The test suite includes comprehensive helper functions for:

- **Authentication**: `loginAsAdmin()`
- **Navigation**: `navigateToUserManagement()`, `openAddUserModal()`
- **Form Interaction**: `fillUserForm()`, `submitUserForm()`
- **Validation**: `expectValidationError()`, `verifyUserInTable()`
- **Utilities**: `createUniqueTestUser()`, `cleanupTestUsers()`
- **Accessibility**: `testKeyboardNavigation()`, `verifyNewUserButtonAccessibility()`
- **Responsiveness**: `testButtonResponsiveness()`

## Running the Tests

### Prerequisites

1. Node.js and npm installed
2. Playwright installed (`npx playwright install`)
3. ICT Governance Framework application running on `http://localhost:3000`

### Execution Methods

#### Method 1: Using the Test Runner Script

```bash
./tests/run-user-management-tests.sh
```

#### Method 2: Direct Playwright Command

```bash
npx playwright test tests/user-management.spec.ts --reporter=html
```

#### Method 3: Specific Test Categories

```bash
# Run only button responsiveness tests
npx playwright test tests/user-management.spec.ts -g "New User Button Visibility and Responsiveness"

# Run only form validation tests
npx playwright test tests/user-management.spec.ts -g "Form Validation"

# Run only successful creation tests
npx playwright test tests/user-management.spec.ts -g "Successful User Creation"
```

### Test Configuration

The tests are configured to:
- Run against `http://localhost:3000`
- Take screenshots on failure
- Record videos on failure
- Generate HTML reports
- Support multiple browsers (Chromium, Firefox, WebKit)

## Expected Results

### Success Criteria

When all tests pass, you should see:

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

### Test Reports

After running tests, view the detailed HTML report:

```bash
npx playwright show-report
```

## Troubleshooting

### Common Issues

1. **Application not running**: Ensure the ICT Governance Framework is running on port 3000
2. **Authentication failures**: Verify admin user credentials are correct
3. **Database issues**: Ensure test database is properly configured
4. **Network timeouts**: Check network connectivity and increase timeout values if needed

### Debug Mode

Run tests in debug mode for step-by-step execution:

```bash
npx playwright test tests/user-management.spec.ts --debug
```

### Headed Mode

Run tests with visible browser for debugging:

```bash
npx playwright test tests/user-management.spec.ts --headed
```

## Maintenance

### Updating Tests

When updating the user management functionality:

1. Update test data in `user-management-helpers.ts`
2. Add new test cases to `user-management.spec.ts`
3. Update helper functions as needed
4. Update this documentation

### Test Data Cleanup

The test suite includes automatic cleanup functions to remove test data after execution. If manual cleanup is needed:

```typescript
await cleanupTestUsers(page, ['testuser1', 'testuser2']);
```

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run User Management Tests
  run: |
    npm install
    npx playwright install
    npx playwright test tests/user-management.spec.ts
```

## Security Considerations

- Test data uses non-production credentials
- Sensitive information is not logged
- Test users are automatically cleaned up
- Tests run in isolated environment

## Performance Considerations

- Tests include network delay simulation
- Loading state verification
- Timeout configurations for slow networks
- Parallel execution support

## Accessibility Compliance

The tests verify compliance with:
- WCAG 2.1 guidelines
- Keyboard navigation standards
- Screen reader compatibility
- ARIA label requirements

## Browser Compatibility

Tests are configured to run on:
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile viewports

## Conclusion

This comprehensive test suite ensures that both the 'New User' button and user creation workflow, as well as the 'Edit User' functionality, meet all acceptance criteria and provide a robust, accessible, and user-friendly experience for admin users in the ICT Governance Framework application.

## Edit User Functionality Tests

### Test Objectives for Edit User

The edit user tests verify:

1. **Admin users can edit existing user details without issues**
2. **The 'Edit User' button is responsive and accessible**
3. **Form validation works correctly for user updates**
4. **User data is properly populated and updated**
5. **Error handling works for various scenarios**
6. **Security measures are in place (username immutability, status change confirmations)**

### Edit User Test Categories

#### 1. Edit Button Visibility and Access
- ✅ Display edit button for users with proper permissions
- ✅ Edit button has proper accessibility attributes
- ✅ Edit button opens modal when clicked

#### 2. Form Population and Validation
- ✅ Form fields are populated with existing user data
- ✅ Username field is read-only (cannot be changed)
- ✅ Required field validation works correctly
- ✅ Email format validation
- ✅ Name format validation (letters, spaces, hyphens, apostrophes only)

#### 3. User Data Updates
- ✅ Successfully update user details (department, job title, etc.)
- ✅ Update user status with confirmation for access-affecting changes
- ✅ Update user roles
- ✅ Changes are reflected immediately after update

#### 4. Modal Behavior
- ✅ Modal closes when cancel button is clicked
- ✅ Modal closes when X button is clicked
- ✅ Form resets to original data when modal is closed
- ✅ Loading state is displayed during updates

#### 5. Error Handling
- ✅ Handle validation errors gracefully
- ✅ Display appropriate error messages for different scenarios:
  - Email already in use (409 error)
  - Invalid data (400 error)
  - Permission denied (403 error)
  - User not found (404 error)
  - Network errors
- ✅ Modal stays open when errors occur

#### 6. Security and Permissions
- ✅ Username cannot be modified (read-only field)
- ✅ Confirmation required for status changes that affect access
- ✅ Proper permission checks for edit functionality

### Key Features Implemented

1. **Enhanced Validation**: Client-side validation for email format and name fields
2. **Error Handling**: Comprehensive error handling for various API response codes
3. **User Experience**: Loading states, confirmation dialogs, and form reset functionality
4. **Security**: Username immutability and status change confirmations
5. **Accessibility**: Proper ARIA labels and keyboard navigation support