import { auditLogger } from './auditLogger';
import { RateLimiter } from './security';

export interface SecurityThreat {
  id: string;
  type: 'brute_force' | 'injection' | 'xss' | 'csrf' | 'privilege_escalation' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private threats: SecurityThreat[] = [];
  private suspiciousActivities: Map<string, number> = new Map();
  private rateLimiter: RateLimiter;
  private alertThresholds = {
    low: 10,
    medium: 5,
    high: 3,
    critical: 1,
  };

  private constructor() {
    this.rateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
    this.startPeriodicCleanup();
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  public async reportThreat(threat: Omit<SecurityThreat, 'id' | 'timestamp'>): Promise<void> {
    const fullThreat: SecurityThreat = {
      ...threat,
      id: this.generateThreatId(),
      timestamp: new Date(),
    };

    this.threats.push(fullThreat);

    // Log to audit system
    await auditLogger.logSecurityEvent(
      threat.type,
      threat.description,
      threat.severity
    );

    // Check if we need to trigger alerts
    await this.checkAlertThresholds(threat.severity);

    // Auto-response for critical threats
    if (threat.severity === 'critical') {
      await this.handleCriticalThreat(fullThreat);
    }

    console.warn(`Security Threat Detected:`, fullThreat);
  }

  public async monitorUserActivity(
    userId: string,
    activity: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const key = `${userId}:${activity}`;
    const count = this.suspiciousActivities.get(key) || 0;
    
    this.suspiciousActivities.set(key, count + 1);

    // Check for suspicious patterns
    if (count > 10) {
      await this.reportThreat({
        type: 'suspicious_activity',
        severity: 'medium',
        description: `User ${userId} performed ${activity} ${count + 1} times`,
        userId,
        metadata,
      });
    }
  }

  public async checkRateLimit(identifier: string): Promise<boolean> {
    const allowed = this.rateLimiter.isAllowed(identifier);
    
    if (!allowed) {
      await this.reportThreat({
        type: 'brute_force',
        severity: 'high',
        description: `Rate limit exceeded for ${identifier}`,
        metadata: { identifier },
      });
    }
    
    return allowed;
  }

  public async detectInjectionAttempt(
    input: string,
    context: string,
    userId?: string
  ): Promise<boolean> {
    const injectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /expression\s*\(/gi,
      /eval\s*\(/gi,
      /document\./gi,
      /window\./gi,
      /localStorage/gi,
      /sessionStorage/gi,
      /cookie/gi,
    ];

    const isInjection = injectionPatterns.some(pattern => pattern.test(input));
    
    if (isInjection) {
      await this.reportThreat({
        type: 'injection',
        severity: 'high',
        description: `Injection attempt detected in ${context}`,
        userId,
        metadata: { input: input.substring(0, 100), context },
      });
    }
    
    return isInjection;
  }

  public async detectPrivilegeEscalation(
    userId: string,
    attemptedAction: string,
    requiredRole: string,
    actualRole: string
  ): Promise<void> {
    await this.reportThreat({
      type: 'privilege_escalation',
      severity: 'critical',
      description: `User attempted ${attemptedAction} without proper permissions`,
      userId,
      metadata: {
        attemptedAction,
        requiredRole,
        actualRole,
      },
    });
  }

  public getRecentThreats(hours: number = 24): SecurityThreat[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.threats.filter(threat => threat.timestamp >= cutoff);
  }

  public getThreatsByType(type: SecurityThreat['type']): SecurityThreat[] {
    return this.threats.filter(threat => threat.type === type);
  }

  public getThreatsBySeverity(severity: SecurityThreat['severity']): SecurityThreat[] {
    return this.threats.filter(threat => threat.severity === severity);
  }

  private generateThreatId(): string {
    return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async checkAlertThresholds(severity: SecurityThreat['severity']): Promise<void> {
    const recentThreats = this.getRecentThreats(1); // Last hour
    const severityCount = recentThreats.filter(t => t.severity === severity).length;
    
    if (severityCount >= this.alertThresholds[severity]) {
      await this.triggerSecurityAlert(severity, severityCount);
    }
  }

  private async triggerSecurityAlert(
    severity: SecurityThreat['severity'],
    count: number
  ): Promise<void> {
    await auditLogger.logSecurityEvent(
      'security_alert',
      `Security alert triggered: ${count} ${severity} threats in the last hour`,
      'critical'
    );

    // In production, this would send notifications to security team
    console.error(`🚨 SECURITY ALERT: ${count} ${severity} threats detected in the last hour`);
  }

  private async handleCriticalThreat(threat: SecurityThreat): Promise<void> {
    // Implement immediate response actions
    if (threat.userId) {
      await auditLogger.logSecurityEvent(
        'critical_threat_response',
        `Critical threat detected for user ${threat.userId}`,
        'critical'
      );
    }

    // In production, this might:
    // - Temporarily disable user account
    // - Send immediate notifications
    // - Trigger additional monitoring
    // - Log to external security systems
  }

  private startPeriodicCleanup(): void {
    setInterval(() => {
      // Clean up old threats (keep last 7 days)
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      this.threats = this.threats.filter(threat => threat.timestamp >= cutoff);
      
      // Clean up suspicious activities
      this.suspiciousActivities.clear();
    }, 60 * 60 * 1000); // Run every hour
  }
}

export const securityMonitor = SecurityMonitor.getInstance();
