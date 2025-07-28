
import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('should prevent XSS attacks', async ({ page }) => {
    await page.goto('/');
    
    const xssPayload = '<script>alert("XSS")</script>';
    
    await page.fill('input[name="collegeCode"]', xssPayload);
    await page.fill('input[name="userCode"]', xssPayload);
    await page.fill('input[name="password"]', xssPayload);
    
    await page.click('button[type="submit"]');
    
    // Should not execute the script
    const alerts = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });
    
    await page.waitForTimeout(1000);
    expect(alerts).toEqual([]);
  });

  test('should implement rate limiting', async ({ page }) => {
    await page.goto('/');
    
    // Attempt multiple rapid login attempts
    for (let i = 0; i < 10; i++) {
      await page.fill('input[name="collegeCode"]', 'INVALID');
      await page.fill('input[name="userCode"]', 'INVALID');
      await page.fill('input[name="password"]', 'invalid');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);
    }
    
    // Should show rate limiting message
    await expect(page.locator('text=Too many attempts')).toBeVisible();
  });

  test('should sanitize user inputs', async ({ page }) => {
    await page.goto('/');
    
    // Test various injection attempts
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '"; DROP TABLE users; --',
      '<img src="x" onerror="alert(1)">',
      'javascript:alert("xss")',
    ];
    
    for (const input of maliciousInputs) {
      await page.fill('input[name="collegeCode"]', input);
      await page.fill('input[name="userCode"]', input);
      await page.fill('input[name="password"]', input);
      await page.click('button[type="submit"]');
      
      // Should handle gracefully without executing malicious code
      await expect(page.locator('text=Invalid credentials')).toBeVisible();
      await page.reload();
    }
  });

  test('should enforce proper session management', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'STU001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/student');
    
    // Clear session storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Should redirect to login
    await page.reload();
    await expect(page).toHaveURL('/');
  });
});
