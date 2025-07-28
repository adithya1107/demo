
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form on homepage', async ({ page }) => {
    await expect(page.locator('input[name="collegeCode"]')).toBeVisible();
    await expect(page.locator('input[name="userCode"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('text=College code is required')).toBeVisible();
    await expect(page.locator('text=User code is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.fill('input[name="collegeCode"]', 'INVALID');
    await page.fill('input[name="userCode"]', 'INVALID');
    await page.fill('input[name="password"]', 'invalid');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should redirect to appropriate dashboard on successful login', async ({ page }) => {
    // Test student login
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'STU001');
    await page.fill('input[name="password"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/student');
    await expect(page.locator('text=Student Dashboard')).toBeVisible();
  });

  test('should maintain session across page reloads', async ({ page }) => {
    // Login first
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'STU001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/student');
    
    // Reload page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL('/student');
  });

  test('should handle logout properly', async ({ page }) => {
    // Login first
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'STU001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/student');
    
    // Logout
    await page.click('button:has-text("Logout")');
    
    await expect(page).toHaveURL('/');
  });
});
