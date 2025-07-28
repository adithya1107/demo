
import { test, expect } from '@playwright/test';

test.describe('Student Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as student
    await page.goto('/');
    await page.fill('input[name="collegeCode"]', 'DEMO');
    await page.fill('input[name="userCode"]', 'STU001');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/student');
  });

  test('should display student dashboard with all sections', async ({ page }) => {
    await expect(page.locator('text=Student Dashboard')).toBeVisible();
    await expect(page.locator('text=My Courses')).toBeVisible();
    await expect(page.locator('text=Schedule & Timetable')).toBeVisible();
    await expect(page.locator('text=Attendance Overview')).toBeVisible();
    await expect(page.locator('text=Payments & Fees')).toBeVisible();
  });

  test('should navigate to courses section', async ({ page }) => {
    await page.click('text=My Courses');
    await expect(page.locator('text=Enrolled Courses')).toBeVisible();
  });

  test('should display course cards with proper information', async ({ page }) => {
    await page.click('text=My Courses');
    
    // Check if course cards are present
    await expect(page.locator('[data-testid="course-card"]').first()).toBeVisible();
    
    // Check course card content
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await expect(courseCard.locator('text=Course Code')).toBeVisible();
    await expect(courseCard.locator('text=Credits')).toBeVisible();
    await expect(courseCard.locator('text=Instructor')).toBeVisible();
  });

  test('should handle assignment submission', async ({ page }) => {
    await page.click('text=My Courses');
    await page.click('[data-testid="course-card"]', { force: true });
    
    // Check if assignments are visible
    await expect(page.locator('text=Assignments')).toBeVisible();
    
    // Submit assignment
    await page.fill('textarea[placeholder="Enter your submission..."]', 'This is my test submission');
    await page.click('button:has-text("Submit Assignment")');
    
    await expect(page.locator('text=Assignment submitted successfully')).toBeVisible();
  });

  test('should display attendance overview', async ({ page }) => {
    await page.click('text=Attendance Overview');
    await expect(page.locator('text=Attendance Statistics')).toBeVisible();
    await expect(page.locator('text=Overall Attendance')).toBeVisible();
  });

  test('should display schedule and timetable', async ({ page }) => {
    await page.click('text=Schedule & Timetable');
    await expect(page.locator('text=Weekly Timetable')).toBeVisible();
    await expect(page.locator('text=Today\'s Schedule')).toBeVisible();
  });
});
