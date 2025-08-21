import { test, expect, type Page } from '@playwright/test';
import {
  loginAsAdmin,
  navigateToUserManagement,
  openAddUserModal,
  fillUserForm,
  submitUserForm,
  waitForUserCreationSuccess,
  verifyUserInTable,
  createUniqueTestUser,
  closeAddUserModal,
  expectValidationError,
  verifyNewUserButtonAccessibility,
  testButtonResponsiveness,
  simulateNetworkDelay,
  simulateNetworkError,
  getUserCount,
  waitForLoadingComplete,
  verifyFormReset,
  testKeyboardNavigation,
  cleanupTestUsers,
  TEST_USERS,
  type TestUser
} from './helpers/user-management-helpers';

test.describe('User Management - New User Button and Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication state for admin user
    await loginAsAdmin(page);
  });

  test.describe('New User Button Visibility and Responsiveness', () => {
    test('should display New User button for admin users', async ({ page }) => {
      await navigateToUserManagement(page);
      await verifyNewUserButtonAccessibility(page);
    });

    test('should be responsive on different screen sizes', async ({ page }) => {
      await navigateToUserManagement(page);
      await testButtonResponsiveness(page);
    });

    test('should have hover effects', async ({ page }) => {
      await navigateToUserManagement(page);
      
      const newUserButton = page.locator('button:has-text("New User")');
      
      // Hover over the button
      await newUserButton.hover();
      
      // Check if hover class is applied
      await expect(newUserButton).toHaveClass(/hover:bg-blue-700/);
    });

    test('should be clickable and open modal', async ({ page }) => {
      await navigateToUserManagement(page);
      await openAddUserModal(page);
    });
  });

  test.describe('User Creation Modal Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToUserManagement(page);
      await openAddUserModal(page);
    });

    test('should display all required form fields', async ({ page }) => {
      // Check all required fields are present
      await expect(page.locator('[name="username"]')).toBeVisible();
      await expect(page.locator('[name="email"]')).toBeVisible();
      await expect(page.locator('[name="firstName"]')).toBeVisible();
      await expect(page.locator('[name="lastName"]')).toBeVisible();
      await expect(page.locator('[name="password"]')).toBeVisible();
      await expect(page.locator('[name="confirmPassword"]')).toBeVisible();
      await expect(page.locator('[name="department"]')).toBeVisible();
      await expect(page.locator('[name="jobTitle"]')).toBeVisible();
      await expect(page.locator('[name="status"]')).toBeVisible();
      
      // Check required field indicators
      const requiredLabels = page.locator('label:has-text("*")');
      await expect(requiredLabels).toHaveCount(5); // username, email, firstName, lastName, password
    });

    test('should have password visibility toggle', async ({ page }) => {
      const passwordField = page.locator('[name="password"]');
      const confirmPasswordField = page.locator('[name="confirmPassword"]');
      const passwordToggle = page.locator('button').filter({ has: page.locator('svg') }).first();
      const confirmPasswordToggle = page.locator('button').filter({ has: page.locator('svg') }).last();
      
      // Initially password should be hidden
      await expect(passwordField).toHaveAttribute('type', 'password');
      await expect(confirmPasswordField).toHaveAttribute('type', 'password');
      
      // Click toggle to show password
      await passwordToggle.click();
      await expect(passwordField).toHaveAttribute('type', 'text');
      
      // Click toggle to hide password again
      await passwordToggle.click();
      await expect(passwordField).toHaveAttribute('type', 'password');
    });

    test('should display available roles as checkboxes', async ({ page }) => {
      // Wait for roles to load
      await page.waitForTimeout(1000);
      
      const rolesSection = page.locator('text=Roles').locator('..');
      await expect(rolesSection).toBeVisible();
      
      // Check if role checkboxes are present
      const roleCheckboxes = page.locator('input[type="checkbox"]');
      await expect(roleCheckboxes).toHaveCount.greaterThan(0);
    });

    test('should have Cancel and Create User buttons', async ({ page }) => {
      const cancelButton = page.locator('button:has-text("Cancel")');
      const createButton = page.locator('button:has-text("Create User")');
      
      await expect(cancelButton).toBeVisible();
      await expect(createButton).toBeVisible();
      await expect(createButton).toHaveAttribute('type', 'submit');
    });
  });

  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToUserManagement(page);
      await openAddUserModal(page);
    });

    test('should validate required fields', async ({ page }) => {
      await submitUserForm(page);
      await expectValidationError(page, 'required');
    });

    test('should validate email format', async ({ page }) => {
      const invalidUser = { ...TEST_USERS.BASIC, email: 'invalid-email' };
      await fillUserForm(page, invalidUser);
      await submitUserForm(page);
      await expectValidationError(page, 'valid email');
    });

    test('should validate password length', async ({ page }) => {
      const shortPasswordUser = { ...TEST_USERS.BASIC, password: '123' };
      await fillUserForm(page, shortPasswordUser);
      await submitUserForm(page);
      await expectValidationError(page, '8 characters');
    });

    test('should validate password confirmation', async ({ page }) => {
      await page.fill('[name="username"]', TEST_USERS.BASIC.username);
      await page.fill('[name="email"]', TEST_USERS.BASIC.email);
      await page.fill('[name="firstName"]', TEST_USERS.BASIC.firstName);
      await page.fill('[name="lastName"]', TEST_USERS.BASIC.lastName);
      await page.fill('[name="password"]', TEST_USERS.BASIC.password);
      await page.fill('[name="confirmPassword"]', 'DifferentPassword123!');
      
      await submitUserForm(page);
      await expectValidationError(page, 'do not match');
    });

    test('should validate unique username and email', async ({ page }) => {
      // First, create a user
      const uniqueUser = createUniqueTestUser(TEST_USERS.BASIC);
      await fillUserForm(page, uniqueUser);
      await submitUserForm(page);
      await waitForUserCreationSuccess(page);
      
      // Try to create another user with same username/email
      await openAddUserModal(page);
      await fillUserForm(page, uniqueUser); // Same data
      await submitUserForm(page);
      await expectValidationError(page, /already exists|already taken/);
    });
  });

  test.describe('Successful User Creation', () => {
    test('should create user with valid data', async ({ page }) => {
      await navigateToUserManagement(page);
      await page.click('button:has-text("New User")');
      await page.waitForSelector('h2:has-text("Add New User")');
      
      // Fill form with unique data
      const uniqueUser = {
        ...TEST_USER_DATA,
        username: `testuser_${Date.now()}`,
        email: `testuser_${Date.now()}@example.com`
      };
      
      await fillUserForm(page, uniqueUser);
      
      // Select a role
      const firstRoleCheckbox = page.locator('input[type="checkbox"]').first();
      await firstRoleCheckbox.check();
      
      // Submit form
      await page.click('button:has-text("Create User")');
      
      // Wait for modal to close
      await page.waitForSelector('h2:has-text("Add New User")', { state: 'hidden' });
      
      // Check for success message
      const successMessage = page.locator('.bg-green-50, .text-green-800');
      await expect(successMessage).toBeVisible();
      await expect(successMessage).toContainText('created successfully');
      
      // Verify user appears in the table
      await page.waitForTimeout(1000); // Wait for table refresh
      const userRow = page.locator(`tr:has-text("${uniqueUser.username}")`);
      await expect(userRow).toBeVisible();
    });

    test('should create user with minimal required data', async ({ page }) => {
      await navigateToUserManagement(page);
      await page.click('button:has-text("New User")');
      await page.waitForSelector('h2:has-text("Add New User")');
      
      const minimalUser = {
        username: `minimal_${Date.now()}`,
        email: `minimal_${Date.now()}@example.com`,
        firstName: 'Min',
        lastName: 'User',
        password: 'MinimalPass123!'
      };
      
      await page.fill('[name="username"]', minimalUser.username);
      await page.fill('[name="email"]', minimalUser.email);
      await page.fill('[name="firstName"]', minimalUser.firstName);
      await page.fill('[name="lastName"]', minimalUser.lastName);
      await page.fill('[name="password"]', minimalUser.password);
      await page.fill('[name="confirmPassword"]', minimalUser.password);
      
      await page.click('button:has-text("Create User")');
      
      // Wait for success
      await page.waitForSelector('h2:has-text("Add New User")', { state: 'hidden' });
      const successMessage = page.locator('.bg-green-50, .text-green-800');
      await expect(successMessage).toBeVisible();
    });

    test('should reset form after successful creation', async ({ page }) => {
      await navigateToUserManagement(page);
      await page.click('button:has-text("New User")');
      await page.waitForSelector('h2:has-text("Add New User")');
      
      const uniqueUser = {
        ...TEST_USER_DATA,
        username: `reset_test_${Date.now()}`,
        email: `reset_test_${Date.now()}@example.com`
      };
      
      await fillUserForm(page, uniqueUser);
      await page.click('button:has-text("Create User")');
      
      // Wait for modal to close and reopen
      await page.waitForSelector('h2:has-text("Add New User")', { state: 'hidden' });
      await page.click('button:has-text("New User")');
      await page.waitForSelector('h2:has-text("Add New User")');
      
      // Check that form is reset
      await expect(page.locator('[name="username"]')).toHaveValue('');
      await expect(page.locator('[name="email"]')).toHaveValue('');
      await expect(page.locator('[name="firstName"]')).toHaveValue('');
      await expect(page.locator('[name="lastName"]')).toHaveValue('');
    });
  });

  test.describe('Modal Interaction', () => {
    test('should close modal when Cancel button is clicked', async ({ page }) => {
      await navigateToUserManagement(page);
      await page.click('button:has-text("New User")');
      await page.waitForSelector('h2:has-text("Add New User")');
      
      await page.click('button:has-text("Cancel")');
      
      await page.waitForSelector('h2:has-text("Add New User")', { state: 'hidden' });
      const modal = page.locator('[role="dialog"], .fixed.inset-0');
      await expect(modal).not.toBeVisible();
    });

    test('should close modal when X button is clicked', async ({ page }) => {
      await navigateToUserManagement(page);
      await page.click('button:has-text("New User")');
      await page.waitForSelector('h2:has-text("Add New User")');
      
      const closeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      await closeButton.click();
      
      await page.waitForSelector('h2:has-text("Add New User")', { state: 'hidden' });
    });

    test('should close modal when clicking outside', async ({ page }) => {
      await navigateToUserManagement(page);
      await page.click('button:has-text("New User")');
      await page.waitForSelector('h2:has-text("Add New User")');
      
      // Click outside the modal
      await page.click('.fixed.inset-0', { position: { x: 10, y: 10 } });
      
      await page.waitForSelector('h2:has-text("Add New User")', { state: 'hidden' });
    });

    test('should clear form data when modal is closed and reopened', async ({ page }) => {
      await navigateToUserManagement(page);
      await page.click('button:has-text("New User")');
      await page.waitForSelector('h2:has-text("Add New User")');
      
      // Fill some data
      await page.fill('[name="username"]', 'testdata');
      await page.fill('[name="email"]', 'test@example.com');
      
      // Close modal
      await page.click('button:has-text("Cancel")');
      await page.waitForSelector('h2:has-text("Add New User")', { state: 'hidden' });
      
      // Reopen modal
      await page.click('button:has-text("New User")');
      await page.waitForSelector('h2:has-text("Add New User")');
      
      // Check that form is cleared
      await expect(page.locator('[name="username"]')).toHaveValue('');
      await expect(page.locator('[name="email"]')).toHaveValue('');
    });
  });

  test.describe('Loading States and Error Handling', () => {
    test('should show loading state during user creation', async ({ page }) => {
      await navigateToUserManagement(page);
      await page.click('button:has-text("New User")');
      await page.waitForSelector('h2:has-text("Add New User")');
      
      const uniqueUser = {
        ...TEST_USER_DATA,
        username: `loading_test_${Date.now()}`,
        email: `loading_test_${Date.now()}@example.com`
      };
      
      await fillUserForm(page, uniqueUser);
      
      // Intercept the API call to add delay
      await page.route('/api/users', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      });
      
      await page.click('button:has-text("Create User")');
      
      // Check for loading state
      const loadingButton = page.locator('button:has-text("Creating...")');
      await expect(loadingButton).toBeVisible();
      await expect(loadingButton).toBeDisabled();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      await navigateToUserManagement(page);
      await page.click('button:has-text("New User")');
      await page.waitForSelector('h2:has-text("Add New User")');
      
      // Intercept API call to simulate network error
      await page.route('/api/users', route => {
        route.abort('failed');
      });
      
      await fillUserForm(page);
      await page.click('button:has-text("Create User")');
      
      // Check for error message
      const errorMessage = page.locator('.bg-red-50, .text-red-800');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/Failed to create user|Network error/);
    });
  });

  test.describe('Permission-based Access Control', () => {
    test('should hide New User button for users without create permission', async ({ page }) => {
      // This test would require setting up a user without create permissions
      // For now, we'll test the permission check logic
      
      await navigateToUserManagement(page);
      
      // Simulate removing create permission by modifying the page context
      await page.evaluate(() => {
        // This would simulate a user without create permissions
        window.localStorage.setItem('userPermissions', JSON.stringify(['user.read']));
      });
      
      await page.reload();
      
      // The button should not be visible
      const newUserButton = page.locator('button:has-text("New User")');
      await expect(newUserButton).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await navigateToUserManagement(page);
      
      // Tab to the New User button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const newUserButton = page.locator('button:has-text("New User")');
      await expect(newUserButton).toBeFocused();
      
      // Press Enter to open modal
      await page.keyboard.press('Enter');
      
      const modal = page.locator('h2:has-text("Add New User")');
      await expect(modal).toBeVisible();
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await navigateToUserManagement(page);
      await page.click('button:has-text("New User")');
      
      // Check modal has proper role
      const modal = page.locator('[role="dialog"], .fixed.inset-0');
      await expect(modal).toBeVisible();
      
      // Check form has proper labels
      const usernameField = page.locator('[name="username"]');
      const usernameLabel = page.locator('label:has-text("Username")');
      await expect(usernameLabel).toBeVisible();
    });
  });
});

test.describe('User Management - Integration Tests', () => {
  test('should integrate with user list refresh after creation', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToUserManagement(page);
    
    // Get initial user count
    const initialRows = await page.locator('tbody tr').count();
    
    // Create new user
    await page.click('button:has-text("New User")');
    await page.waitForSelector('h2:has-text("Add New User")');
    
    const uniqueUser = {
      ...TEST_USER_DATA,
      username: `integration_${Date.now()}`,
      email: `integration_${Date.now()}@example.com`
    };
    
    await fillUserForm(page, uniqueUser);
    await page.click('button:has-text("Create User")');
    
    // Wait for modal to close and table to refresh
    await page.waitForSelector('h2:has-text("Add New User")', { state: 'hidden' });
    await page.waitForTimeout(2000);
    
    // Check that user count increased
    const newRows = await page.locator('tbody tr').count();
    expect(newRows).toBe(initialRows + 1);
    
    // Verify the new user appears in the table
    const userRow = page.locator(`tr:has-text("${uniqueUser.username}")`);
    await expect(userRow).toBeVisible();
  });
});