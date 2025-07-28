
import { Page } from '@playwright/test';

export class TestHelpers {
  static async login(page: Page, userType: 'student' | 'faculty' | 'admin' = 'student') {
    const credentials = {
      student: { collegeCode: 'DEMO', userCode: 'STU001', password: 'password123' },
      faculty: { collegeCode: 'DEMO', userCode: 'FAC001', password: 'password123' },
      admin: { collegeCode: 'DEMO', userCode: 'ADM001', password: 'password123' }
    };
    
    const creds = credentials[userType];
    
    await page.goto('/');
    await page.fill('input[name="collegeCode"]', creds.collegeCode);
    await page.fill('input[name="userCode"]', creds.userCode);
    await page.fill('input[name="password"]', creds.password);
    await page.click('button[type="submit"]');
  }
  
  static async waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Additional buffer
  }
  
  static async mockApiResponse(page: Page, endpoint: string, response: any) {
    await page.route(endpoint, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }
  
  static async checkAccessibility(page: Page) {
    // This would integrate with axe-core for accessibility testing
    const violations = await page.evaluate(() => {
      // Basic accessibility checks
      const issues = [];
      
      // Check for images without alt text
      const images = document.querySelectorAll('img:not([alt])');
      if (images.length > 0) {
        issues.push(`Found ${images.length} images without alt text`);
      }
      
      // Check for form inputs without labels
      const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
      if (inputs.length > 0) {
        issues.push(`Found ${inputs.length} inputs without labels`);
      }
      
      // Check for missing heading structure
      const h1s = document.querySelectorAll('h1');
      if (h1s.length === 0) {
        issues.push('No H1 heading found');
      }
      if (h1s.length > 1) {
        issues.push('Multiple H1 headings found');
      }
      
      return issues;
    });
    
    return violations;
  }
}
