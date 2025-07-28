
import { securityMonitor } from './securityMonitor';

export interface SessionConfig {
  timeout: number;
  warningTime: number;
  maxConcurrentSessions: number;
  requireReauth: boolean;
}

export interface SessionData {
  userId: string;
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export class SessionManager {
  private static instance: SessionManager;
  private sessions: Map<string, SessionData> = new Map();
  private config: SessionConfig = {
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000, // 5 minutes
    maxConcurrentSessions: 3,
    requireReauth: false
  };

  private constructor() {
    this.startCleanupInterval();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public createSession(userId: string, ipAddress: string, userAgent: string): string {
    const sessionId = crypto.randomUUID();
    const now = new Date();

    // Check for existing sessions
    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.isActive);

    if (userSessions.length >= this.config.maxConcurrentSessions) {
      // Remove oldest session
      const oldestSession = userSessions.sort((a, b) => 
        a.lastActivity.getTime() - b.lastActivity.getTime()
      )[0];
      this.invalidateSession(oldestSession.sessionId);
    }

    const sessionData: SessionData = {
      userId,
      sessionId,
      createdAt: now,
      lastActivity: now,
      ipAddress,
      userAgent,
      isActive: true
    };

    this.sessions.set(sessionId, sessionData);
    
    console.log(`Session created for user ${userId}: ${sessionId}`);
    return sessionId;
  }

  public validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return false;
    }

    const now = new Date();
    const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();

    if (timeSinceLastActivity > this.config.timeout) {
      this.invalidateSession(sessionId);
      return false;
    }

    // Update last activity
    session.lastActivity = now;
    this.sessions.set(sessionId, session);

    return true;
  }

  public invalidateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.set(sessionId, session);
      console.log(`Session invalidated: ${sessionId}`);
    }
  }

  public getTimeUntilExpiry(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return 0;
    }

    const now = new Date();
    const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
    return Math.max(0, this.config.timeout - timeSinceLastActivity);
  }

  public shouldShowWarning(sessionId: string): boolean {
    const timeLeft = this.getTimeUntilExpiry(sessionId);
    return timeLeft > 0 && timeLeft <= this.config.warningTime;
  }

  public extendSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    session.lastActivity = new Date();
    this.sessions.set(sessionId, session);
    return true;
  }

  public getUserSessions(userId: string): SessionData[] {
    return Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.isActive);
  }

  public invalidateAllUserSessions(userId: string): void {
    Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.isActive)
      .forEach(s => this.invalidateSession(s.sessionId));
  }

  public getSessionData(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  public updateConfig(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000); // Check every minute
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    this.sessions.forEach((session, sessionId) => {
      if (session.isActive) {
        const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
        if (timeSinceLastActivity > this.config.timeout) {
          expiredSessions.push(sessionId);
        }
      }
    });

    expiredSessions.forEach(sessionId => {
      this.invalidateSession(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }
}

export const sessionManager = SessionManager.getInstance();
