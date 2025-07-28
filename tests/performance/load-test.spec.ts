
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    await expect(page.locator('input[name="collegeCode"]')).toBeVisible();
  });

  test('should handle concurrent user interactions', async ({ page }) => {
    await page.goto('/');
    
    // Simulate multiple rapid interactions
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        page.fill('input[name="collegeCode"]', `TEST${i}`)
      );
    }
    
    await Promise.all(promises);
    
    // Should not crash or become unresponsive
    await expect(page.locator('input[name="collegeCode"]')).toHaveValue('TEST9');
  });

  test('should handle large data sets efficiently', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'STU001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/student');
    
    // Navigate to data-heavy section
    await page.click('text=My Courses');
    
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="course-card"]');
    const renderTime = Date.now() - startTime;
    
    expect(renderTime).toBeLessThan(2000); // Should render within 2 seconds
  });
});
