
import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  test('should handle API authentication', async ({ page }) => {
    await page.goto('/');
    
    // Mock API responses for testing
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: '1', name: 'Test User', type: 'student' },
          token: 'mock-jwt-token'
        })
      });
    });
    
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'STU001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should handle successful authentication
    await expect(page).toHaveURL('/student');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Mock API error
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      });
    });
    
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'STU001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should display error message
    await expect(page.locator('text=An error occurred')).toBeVisible();
  });

  test('should handle network failures', async ({ page }) => {
    await page.goto('/');
    
    // Mock network failure
    await page.route('**/api/auth/login', route => {
      route.abort();
    });
    
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'STU001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should handle network failure gracefully
    await expect(page.locator('text=Network error')).toBeVisible();
  });
});
