
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Code Quality Audit', () => {
  test('should have proper error handling', async ({ page }) => {
    await page.goto('/');
    
    // Test network error handling
    await page.route('**/api/**', route => route.abort());
    
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'STU001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show error message instead of crashing
    await expect(page.locator('text=Network error')).toBeVisible();
  });

  test('should handle loading states properly', async ({ page }) => {
    await page.goto('/');
    
    // Mock slow API response
    await page.route('**/api/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'STU001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show loading indicator
    await expect(page.locator('text=Loading...')).toBeVisible();
  });

  test('should validate form inputs properly', async ({ page }) => {
    await page.goto('/');
    
    // Test empty form submission
    await page.click('button[type="submit"]');
    await expect(page.locator('text=College code is required')).toBeVisible();
    
    // Test invalid email format
    await page.fill('input[name="collegeCode"]', 'TEST');
    await page.fill('input[name="userCode"]', 'invalid-email');
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Invalid format')).toBeVisible();
  });

  test('should have consistent UI patterns', async ({ page }) => {
    await TestHelpers.login(page, 'student');
    
    // Check button styling consistency
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const classes = await button.getAttribute('class');
      
      // Should have consistent button classes
      expect(classes).toContain('btn');
    }
  });
});
