
import { auditLogger } from './auditLogger';

interface ThreatReport {
  type: 'brute_force' | 'suspicious_activity' | 'privilege_escalation' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

class SecurityMonitor {
  private rateLimits: Map<string, number[]> = new Map();
  private suspiciousPatterns: RegExp[] = [
    /(<script[^>]*>.*?<\/script>)/gi,
    /(javascript:\s*[^;]*)/gi,
    /(on\w+\s*=\s*["'][^"']*["'])/gi,
    /(eval\s*\([^)]*\))/gi,
    /(document\.write)/gi,
    /(window\.location)/gi,
    /(cookie)/gi,
    /(localStorage)/gi,
    /(sessionStorage)/gi,
    /(innerHTML)/gi,
    /(outerHTML)/gi
  ];

  private defaultRateLimit: RateLimitConfig = {
    maxAttempts: 10,
    windowMs: 60 * 1000 // 1 minute
  };

  async checkRateLimit(
    identifier: string, 
    config: RateLimitConfig = this.defaultRateLimit
  ): Promise<boolean> {
    try {
      const now = Date.now();
      const attempts = this.rateLimits.get(identifier) || [];
      
      // Remove old attempts outside the window
      const validAttempts = attempts.filter(time => now - time < config.windowMs);
      
      if (validAttempts.length >= config.maxAttempts) {
        await this.reportThreat({
          type: 'brute_force',
          severity: 'high',
          description: `Rate limit exceeded for identifier: ${identifier}`,
          metadata: {
            attempts: validAttempts.length,
            maxAttempts: config.maxAttempts,
            windowMs: config.windowMs
          }
        });
        return false;
      }
      
      // Add current attempt
      validAttempts.push(now);
      this.rateLimits.set(identifier, validAttempts);
      
      return true;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow on error to prevent blocking legitimate users
    }
  }

  async detectInjectionAttempt(input: string, context: string): Promise<boolean> {
    try {
      const hasSuspiciousPattern = this.suspiciousPatterns.some(pattern => 
        pattern.test(input)
      );

      if (hasSuspiciousPattern) {
        await this.reportThreat({
          type: 'suspicious_activity',
          severity: 'medium',
          description: `Potential injection attempt detected in ${context}`,
          metadata: {
            input: input.substring(0, 100), // Truncate for logging
            context
          }
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Injection detection error:', error);
      return false;
    }
  }

  async reportThreat(threat: ThreatReport): Promise<void> {
    try {
      console.warn('Security threat detected:', threat);
      
      // Log to audit system
      await auditLogger.logSecurityEvent(
        threat.type,
        threat.description,
        threat.severity,
        threat.userId,
        threat.metadata
      );

      // In a production environment, you might want to:
      // 1. Send to external security monitoring service
      // 2. Alert administrators
      // 3. Implement automatic blocking
      // 4. Update WAF rules
      
      // For now, we'll just log to console and audit
      if (threat.severity === 'critical' || threat.severity === 'high') {
        console.error('HIGH SEVERITY THREAT:', threat);
      }
    } catch (error) {
      console.error('Failed to report threat:', error);
    }
  }

  async validateUserAction(
    userId: string,
    action: string,
    resource: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Basic validation - can be extended with more complex rules
      if (!userId || !action || !resource) {
        await this.reportThreat({
          type: 'suspicious_activity',
          severity: 'medium',
          description: 'Invalid user action parameters',
          userId,
          metadata: { action, resource, ...metadata }
        });
        return false;
      }

      // Log valid actions for audit trail
      await auditLogger.logUserAction(action, `User action on ${resource}`, 'user_action', userId);
      
      return true;
    } catch (error) {
      console.error('User action validation error:', error);
      return false;
    }
  }

  clearRateLimit(identifier: string): void {
    this.rateLimits.delete(identifier);
  }

  getRateLimitStatus(identifier: string): {
    attempts: number;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const attempts = this.rateLimits.get(identifier) || [];
    const validAttempts = attempts.filter(time => now - time < this.defaultRateLimit.windowMs);
    
    return {
      attempts: validAttempts.length,
      remaining: Math.max(0, this.defaultRateLimit.maxAttempts - validAttempts.length),
      resetTime: validAttempts.length > 0 ? Math.max(...validAttempts) + this.defaultRateLimit.windowMs : now
    };
  }
}

export const securityMonitor = new SecurityMonitor();
