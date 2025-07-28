
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'ADM001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');
  });

  test('should display admin dashboard with all management sections', async ({ page }) => {
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Course Management')).toBeVisible();
    await expect(page.locator('text=System Settings')).toBeVisible();
    await expect(page.locator('text=Reports & Analytics')).toBeVisible();
  });

  test('should manage users', async ({ page }) => {
    await page.click('text=User Management');
    await expect(page.locator('text=User Profiles')).toBeVisible();
    await expect(page.locator('text=Role Management')).toBeVisible();
    
    // Test user creation
    await page.click('button:has-text("Add User")');
    await page.fill('input[placeholder="First Name"]', 'John');
    await page.fill('input[placeholder="Last Name"]', 'Doe');
    await page.fill('input[placeholder="Email"]', 'john.doe@example.com');
    await page.selectOption('select[name="userType"]', 'student');
    await page.click('button:has-text("Create User")');
    
    await expect(page.locator('text=User created successfully')).toBeVisible();
  });

  test('should manage courses', async ({ page }) => {
    await page.click('text=Course Management');
    await expect(page.locator('text=Course Catalog')).toBeVisible();
    await expect(page.locator('text=Course Creation')).toBeVisible();
  });

  test('should access system settings', async ({ page }) => {
    await page.click('text=System Settings');
    await expect(page.locator('text=College Configuration')).toBeVisible();
    await expect(page.locator('text=Security Settings')).toBeVisible();
  });

  test('should view reports and analytics', async ({ page }) => {
    await page.click('text=Reports & Analytics');
    await expect(page.locator('text=User Statistics')).toBeVisible();
    await expect(page.locator('text=Course Analytics')).toBeVisible();
    await expect(page.locator('text=System Performance')).toBeVisible();
  });
});
