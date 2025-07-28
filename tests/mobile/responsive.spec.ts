
import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness Tests', () => {
  test('should display correctly on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    
    // Check mobile layout
    await expect(page.locator('input[name="collegeCode"]')).toBeVisible();
    await expect(page.locator('input[name="userCode"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check that elements are properly sized for mobile
    const submitButton = page.locator('button[type="submit"]');
    const buttonBox = await submitButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThan(40); // Minimum touch target
  });

  test('should handle touch interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Test touch interactions
    await page.tap('input[name="collegeCode"]');
    await page.fill('input[name="collegeCode"]', 'DEMO');
    
    await page.tap('input[name="userCode"]');
    await page.fill('input[name="userCode"]', 'STU001');
    
    await page.tap('input[name="password"]');
    await page.fill('input[name="password"]', 'password123');
    
    await page.tap('button[type="submit"]');
    
    // Should work properly with touch
    await expect(page).toHaveURL('/student');
  });

  test('should display navigation properly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login first
    await page.goto('/');
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'STU001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/student');
    
    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // Test navigation functionality
    await page.click('[data-testid="nav-courses"]');
    await expect(page.locator('text=My Courses')).toBeVisible();
  });
});
