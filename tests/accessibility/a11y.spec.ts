
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should pass accessibility audit on homepage', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility audit on student dashboard', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'STU001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/student');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="collegeCode"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="userCode"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for ARIA labels on form elements
    await expect(page.locator('input[name="collegeCode"]')).toHaveAttribute('aria-label');
    await expect(page.locator('input[name="userCode"]')).toHaveAttribute('aria-label');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('aria-label');
    await expect(page.locator('button[type="submit"]')).toHaveAttribute('aria-label');
  });
});
