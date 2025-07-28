
import { test, expect } from '@playwright/test';

test.describe('Teacher Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as teacher
    await page.goto('/');
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'FAC001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/faculty');
  });

  test('should display teacher dashboard with all sections', async ({ page }) => {
    await expect(page.locator('text=Teacher Dashboard')).toBeVisible();
    await expect(page.locator('text=My Courses')).toBeVisible();
    await expect(page.locator('text=Schedule & Calendar')).toBeVisible();
    await expect(page.locator('text=Gradebook')).toBeVisible();
    await expect(page.locator('text=Attendance Management')).toBeVisible();
  });

  test('should navigate to courses and manage assignments', async ({ page }) => {
    await page.click('text=My Courses');
    await expect(page.locator('text=Teaching Courses')).toBeVisible();
    
    // Create new assignment
    await page.click('button:has-text("Create Assignment")');
    await page.fill('input[placeholder="Assignment title"]', 'Test Assignment');
    await page.fill('textarea[placeholder="Assignment description"]', 'This is a test assignment');
    await page.click('button:has-text("Create")');
    
    await expect(page.locator('text=Assignment created successfully')).toBeVisible();
  });

  test('should manage attendance', async ({ page }) => {
    await page.click('text=Attendance Management');
    await expect(page.locator('text=Mark Attendance')).toBeVisible();
    await expect(page.locator('text=Attendance Records')).toBeVisible();
  });

  test('should access gradebook functionality', async ({ page }) => {
    await page.click('text=Gradebook');
    await expect(page.locator('text=Student Grades')).toBeVisible();
    await expect(page.locator('text=Grade Distribution')).toBeVisible();
  });
});
