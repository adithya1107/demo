
import { auditLogger } from './auditLogger';

export interface SecurityThreat {
  id: string;
  type: 'brute_force' | 'xss_attempt' | 'sql_injection' | 'csrf' | 'suspicious_activity' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  blocked: boolean;
  metadata?: any;
}

export interface SecurityMetrics {
  totalThreats: number;
  blockedThreats: number;
  criticalThreats: number;
  lastThreatTime?: Date;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private threats: SecurityThreat[] = [];
  private maxThreats = 1000;

  private constructor() {}

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  public reportThreat(threat: Omit<SecurityThreat, 'id' | 'timestamp'>): void {
    const newThreat: SecurityThreat = {
      ...threat,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    this.threats.unshift(newThreat);
    
    if (this.threats.length > this.maxThreats) {
      this.threats = this.threats.slice(0, this.maxThreats);
    }

    auditLogger.logSecurityEvent(
      threat.type,
      threat.description,
      threat.severity
    );

    console.warn('Security threat detected:', newThreat);
  }

  public logThreat(threat: Omit<SecurityThreat, 'id' | 'timestamp'>): void {
    this.reportThreat(threat);
  }

  public checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const key = `rate_limit_${identifier}`;
    
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    const validAttempts = attempts.filter((timestamp: number) => now - timestamp < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      this.reportThreat({
        type: 'brute_force',
        severity: 'high',
        description: `Rate limit exceeded for ${identifier}`,
        blocked: true
      });
      return false;
    }
    
    validAttempts.push(now);
    localStorage.setItem(key, JSON.stringify(validAttempts));
    return true;
  }

  public getRecentThreats(limit: number = 10): SecurityThreat[] {
    return this.threats.slice(0, limit);
  }

  public getMetrics(): SecurityMetrics {
    const criticalThreats = this.threats.filter(t => t.severity === 'critical').length;
    const blockedThreats = this.threats.filter(t => t.blocked).length;
    const lastThreat = this.threats[0];

    return {
      totalThreats: this.threats.length,
      blockedThreats,
      criticalThreats,
      lastThreatTime: lastThreat?.timestamp
    };
  }

  public clearThreats(): void {
    this.threats = [];
  }

  public detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(--|#|\/\*|\*\/)/,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT|ONLOAD|ONERROR)\b)/i
    ];

    const hasSQLPattern = sqlPatterns.some(pattern => pattern.test(input));
    
    if (hasSQLPattern) {
      this.reportThreat({
        type: 'sql_injection',
        severity: 'high',
        description: `SQL injection attempt detected in input: ${input.substring(0, 100)}...`,
        blocked: true
      });
    }

    return hasSQLPattern;
  }

  public detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src\s*=\s*["']javascript:/gi
    ];

    const hasXSSPattern = xssPatterns.some(pattern => pattern.test(input));
    
    if (hasXSSPattern) {
      this.reportThreat({
        type: 'xss_attempt',
        severity: 'high',
        description: `XSS attempt detected in input: ${input.substring(0, 100)}...`,
        blocked: true
      });
    }

    return hasXSSPattern;
  }

  public validateInput(input: string): boolean {
    return !this.detectSQLInjection(input) && !this.detectXSS(input);
  }
}

export const securityMonitor = SecurityMonitor.getInstance();
