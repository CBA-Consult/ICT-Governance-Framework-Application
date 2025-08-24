import { Page, expect } from '@playwright/test';

export interface TestUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  department?: string;
  jobTitle?: string;
  roles?: string[];
  status?: string;
}

export const DEFAULT_ADMIN_USER = {
  username: 'admin',
  password: 'admin123',
  email: 'admin@example.com'
};

export const TEST_USERS = {
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
};

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page, adminUser = DEFAULT_ADMIN_USER) {
  await page.goto('/auth');
  await page.fill('[name="username"]', adminUser.username);
  await page.fill('[name="password"]', adminUser.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Navigate to user management page
 */
export async function navigateToUserManagement(page: Page) {
  await page.goto('/admin/users');
  await page.waitForLoadState('networkidle');
  
  // Wait for the page to fully load
  await page.waitForSelector('h1:has-text("User Management")', { timeout: 10000 });
}

/**
 * Open the Add User modal
 */
export async function openAddUserModal(page: Page) {
  const newUserButton = page.locator('button:has-text("New User")');
  await expect(newUserButton).toBeVisible();
  await newUserButton.click();
  
  // Wait for modal to open
  await page.waitForSelector('h2:has-text("Add New User")', { timeout: 5000 });
}

/**
 * Fill the user creation form
 */
export async function fillUserForm(page: Page, userData: TestUser) {
  await page.fill('[name="username"]', userData.username);
  await page.fill('[name="email"]', userData.email);
  await page.fill('[name="firstName"]', userData.firstName);
  await page.fill('[name="lastName"]', userData.lastName);
  await page.fill('[name="password"]', userData.password);
  await page.fill('[name="confirmPassword"]', userData.password);
  
  if (userData.department) {
    await page.fill('[name="department"]', userData.department);
  }
  
  if (userData.jobTitle) {
    await page.fill('[name="jobTitle"]', userData.jobTitle);
  }
  
  if (userData.status) {
    await page.selectOption('[name="status"]', userData.status);
  }
  
  if (userData.roles && userData.roles.length > 0) {
    for (const role of userData.roles) {
      const roleCheckbox = page.locator(`input[type="checkbox"][value="${role}"]`);
      if (await roleCheckbox.isVisible()) {
        await roleCheckbox.check();
      }
    }
  }
}

/**
 * Submit the user creation form
 */
export async function submitUserForm(page: Page) {
  const createButton = page.locator('button:has-text("Create User")');
  await createButton.click();
}

/**
 * Wait for user creation success
 */
export async function waitForUserCreationSuccess(page: Page) {
  // Wait for modal to close
  await page.waitForSelector('h2:has-text("Add New User")', { state: 'hidden', timeout: 10000 });
  
  // Wait for success message
  const successMessage = page.locator('.bg-green-50, .text-green-800');
  await expect(successMessage).toBeVisible({ timeout: 5000 });
  await expect(successMessage).toContainText('created successfully');
}

/**
 * Check if user appears in the user table
 */
export async function verifyUserInTable(page: Page, username: string) {
  // Wait for table to refresh
  await page.waitForTimeout(1000);
  
  const userRow = page.locator(`tr:has-text("${username}")`);
  await expect(userRow).toBeVisible({ timeout: 5000 });
  
  return userRow;
}

/**
 * Create a unique test user with timestamp
 */
export function createUniqueTestUser(baseUser: TestUser): TestUser {
  const timestamp = Date.now();
  return {
    ...baseUser,
    username: `${baseUser.username}_${timestamp}`,
    email: `${baseUser.username}_${timestamp}@example.com`
  };
}

/**
 * Close the Add User modal
 */
export async function closeAddUserModal(page: Page, method: 'cancel' | 'x-button' | 'outside-click' = 'cancel') {
  switch (method) {
    case 'cancel':
      await page.click('button:has-text("Cancel")');
      break;
    case 'x-button':
      const closeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      await closeButton.click();
      break;
    case 'outside-click':
      await page.click('.fixed.inset-0', { position: { x: 10, y: 10 } });
      break;
  }
  
  // Wait for modal to close
  await page.waitForSelector('h2:has-text("Add New User")', { state: 'hidden', timeout: 5000 });
}

/**
 * Check for validation error message
 */
export async function expectValidationError(page: Page, expectedMessage?: string) {
  const errorMessage = page.locator('.bg-red-50, .text-red-800');
  await expect(errorMessage).toBeVisible({ timeout: 5000 });
  
  if (expectedMessage) {
    await expect(errorMessage).toContainText(expectedMessage);
  }
  
  return errorMessage;
}

/**
 * Check if New User button is visible and accessible
 */
export async function verifyNewUserButtonAccessibility(page: Page) {
  const newUserButton = page.locator('button:has-text("New User")');
  
  // Check visibility
  await expect(newUserButton).toBeVisible();
  
  // Check styling
  await expect(newUserButton).toHaveClass(/bg-blue-600/);
  
  // Check icon presence
  const plusIcon = newUserButton.locator('svg');
  await expect(plusIcon).toBeVisible();
  
  // Check if button is enabled
  await expect(newUserButton).toBeEnabled();
  
  return newUserButton;
}

/**
 * Test button responsiveness across different screen sizes
 */
export async function testButtonResponsiveness(page: Page) {
  const newUserButton = page.locator('button:has-text("New User")');
  
  // Test desktop view
  await page.setViewportSize({ width: 1200, height: 800 });
  await expect(newUserButton).toBeVisible();
  
  // Test tablet view
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(newUserButton).toBeVisible();
  
  // Test mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(newUserButton).toBeVisible();
  
  // Reset to desktop
  await page.setViewportSize({ width: 1200, height: 800 });
}

/**
 * Simulate network delay for testing loading states
 */
export async function simulateNetworkDelay(page: Page, delayMs: number = 2000) {
  await page.route('/api/users', async route => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    route.continue();
  });
}

/**
 * Simulate network error for testing error handling
 */
export async function simulateNetworkError(page: Page) {
  await page.route('/api/users', route => {
    route.abort('failed');
  });
}

/**
 * Get the current user count from the table
 */
export async function getUserCount(page: Page): Promise<number> {
  await page.waitForSelector('tbody tr', { timeout: 5000 });
  return await page.locator('tbody tr').count();
}

/**
 * Wait for loading state to complete
 */
export async function waitForLoadingComplete(page: Page) {
  // Wait for any loading spinners to disappear
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
}

/**
 * Check if form fields are properly reset
 */
export async function verifyFormReset(page: Page) {
  const fields = [
    '[name="username"]',
    '[name="email"]',
    '[name="firstName"]',
    '[name="lastName"]',
    '[name="password"]',
    '[name="confirmPassword"]',
    '[name="department"]',
    '[name="jobTitle"]'
  ];
  
  for (const field of fields) {
    await expect(page.locator(field)).toHaveValue('');
  }
  
  // Check that status is reset to default
  await expect(page.locator('[name="status"]')).toHaveValue('Active');
  
  // Check that no roles are selected
  const checkedRoles = page.locator('input[type="checkbox"]:checked');
  await expect(checkedRoles).toHaveCount(0);
}

/**
 * Test keyboard navigation
 */
export async function testKeyboardNavigation(page: Page) {
  // Tab to the New User button
  await page.keyboard.press('Tab');
  
  const newUserButton = page.locator('button:has-text("New User")');
  await expect(newUserButton).toBeFocused();
  
  // Press Enter to open modal
  await page.keyboard.press('Enter');
  
  const modal = page.locator('h2:has-text("Add New User")');
  await expect(modal).toBeVisible();
}

/**
 * Cleanup test data - remove created test users
 */
export async function cleanupTestUsers(page: Page, usernames: string[]) {
  for (const username of usernames) {
    try {
      const userRow = page.locator(`tr:has-text("${username}")`);
      if (await userRow.isVisible()) {
        const deleteButton = userRow.locator('button[title="Delete user"]');
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          
          // Confirm deletion if dialog appears
          page.on('dialog', dialog => dialog.accept());
          
          // Wait for user to be removed
          await page.waitForSelector(`tr:has-text("${username}")`, { state: 'hidden', timeout: 5000 });
        }
      }
    } catch (error) {
      console.warn(`Failed to cleanup user ${username}:`, error);
    }
  }
}