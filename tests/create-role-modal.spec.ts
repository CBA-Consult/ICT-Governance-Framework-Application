import { test, expect } from '@playwright/test';

test.describe('Create Role Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the roles page (assuming authentication is handled)
    await page.goto('/admin/roles');
  });

  test('should display create role button for users with role.create permission', async ({ page }) => {
    // Check if the Create Role button is visible
    const createButton = page.locator('button:has-text("Create Role")');
    await expect(createButton).toBeVisible();
  });

  test('should open create role modal when button is clicked', async ({ page }) => {
    // Click the Create Role button
    await page.click('button:has-text("Create Role")');
    
    // Check if the modal is opened
    await expect(page.locator('text=Create New Role')).toBeVisible();
    
    // Check if form fields are present
    await expect(page.locator('input[name="roleName"]')).toBeVisible();
    await expect(page.locator('input[name="displayName"]')).toBeVisible();
    await expect(page.locator('select[name="roleType"]')).toBeVisible();
    await expect(page.locator('input[name="roleHierarchyLevel"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Open the modal
    await page.click('button:has-text("Create Role")');
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Create Role")');
    
    // Check for validation errors
    await expect(page.locator('text=Role name is required')).toBeVisible();
    await expect(page.locator('text=Display name is required')).toBeVisible();
  });

  test('should auto-generate role name from display name', async ({ page }) => {
    // Open the modal
    await page.click('button:has-text("Create Role")');
    
    // Fill display name
    await page.fill('input[name="displayName"]', 'Content Manager');
    
    // Check if role name is auto-generated
    const roleNameInput = page.locator('input[name="roleName"]');
    await expect(roleNameInput).toHaveValue('content_manager');
  });

  test('should validate role name format', async ({ page }) => {
    // Open the modal
    await page.click('button:has-text("Create Role")');
    
    // Fill invalid role name
    await page.fill('input[name="roleName"]', 'invalid role name!');
    await page.fill('input[name="displayName"]', 'Test Role');
    
    // Try to submit
    await page.click('button:has-text("Create Role")');
    
    // Check for validation error
    await expect(page.locator('text=Role name can only contain letters, numbers, underscores, and hyphens')).toBeVisible();
  });

  test('should allow permission selection', async ({ page }) => {
    // Open the modal
    await page.click('button:has-text("Create Role")');
    
    // Check if permissions section is visible
    await expect(page.locator('text=Permissions')).toBeVisible();
    
    // Check if permission checkboxes are present
    const permissionCheckboxes = page.locator('input[type="checkbox"]');
    await expect(permissionCheckboxes.first()).toBeVisible();
  });

  test('should close modal when cancel is clicked', async ({ page }) => {
    // Open the modal
    await page.click('button:has-text("Create Role")');
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    
    // Check if modal is closed
    await expect(page.locator('text=Create New Role')).not.toBeVisible();
  });

  test('should close modal when X button is clicked', async ({ page }) => {
    // Open the modal
    await page.click('button:has-text("Create Role")');
    
    // Click the X button
    await page.click('button[aria-label="Close"]');
    
    // Check if modal is closed
    await expect(page.locator('text=Create New Role')).not.toBeVisible();
  });
});