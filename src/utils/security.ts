
// Security utilities for input sanitization and validation
import DOMPurify from 'dompurify';

// XSS Prevention utilities
export const sanitizeHtml = (dirty: string): string => {
  if (typeof window !== 'undefined' && DOMPurify) {
    return DOMPurify.sanitize(dirty);
  }
  // Server-side fallback - basic HTML entity encoding
  return dirty
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// CSS sanitization for dynamic styles
export const sanitizeCSS = (cssValue: string): string => {
  // Remove potentially dangerous CSS functions and properties
  const dangerousPatterns = [
    /javascript:/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /@import/gi,
    /behavior\s*:/gi,
    /binding\s*:/gi,
    /-moz-binding/gi,
    /data:/gi,
    /vbscript:/gi,
    /mocha:/gi,
    /livescript:/gi,
    /eval\s*\(/gi,
    /script/gi,
    /onload/gi,
    /onerror/gi,
    /onclick/gi,
    /onmouseover/gi,
    /style\s*=/gi
  ];

  let sanitized = cssValue;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Only allow hex colors, rgb/rgba, and named colors
  const colorPattern = /^(#([0-9a-f]{3}|[0-9a-f]{6})|rgb\((\d{1,3},\s*){2}\d{1,3}\)|rgba\((\d{1,3},\s*){3}[01]?\.?\d*\)|[a-z]+)$/i;
  
  if (!colorPattern.test(sanitized.trim())) {
    return '#000000'; // Default to black if invalid
  }

  return sanitized;
};

// Input validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 320; // RFC 5321 limit
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUserCode = (userCode: string): boolean => {
  // User code should be alphanumeric and 6-12 characters
  const userCodeRegex = /^[a-zA-Z0-9]{6,12}$/;
  return userCodeRegex.test(userCode);
};

export const validateCollegeCode = (collegeCode: string): boolean => {
  // College code should be alphanumeric and 3-8 characters
  const collegeCodeRegex = /^[a-zA-Z0-9]{3,8}$/;
  return collegeCodeRegex.test(collegeCode);
};

export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

// Rate limiting utilities
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }

  getRemainingAttempts(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxAttempts - validAttempts.length);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const CSP_NONCE = 'csp-nonce-' + Math.random().toString(36).substr(2, 9);
