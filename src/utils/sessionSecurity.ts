
import { supabase } from '@/integrations/supabase/client';

export interface SessionInfo {
  sessionId: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
  isValid: boolean;
}

export const validateSessionIntegrity = async (sessionId?: string): Promise<boolean> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      return false;
    }

    // Check if session is still valid
    const { data: user } = await supabase.auth.getUser();
    return !!user?.user && user.user.id === session.session.user.id;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

export const getSessionInfo = async (): Promise<SessionInfo | null> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      return null;
    }

    return {
      sessionId: session.session.access_token,
      userId: session.session.user.id,
      ipAddress: 'unknown', // Would need server-side implementation
      userAgent: navigator.userAgent,
      lastActivity: new Date(),
      isValid: true
    };
  } catch (error) {
    console.error('Error getting session info:', error);
    return null;
  }
};

export const invalidateSession = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error invalidating session:', error);
  }
};

// Session Manager class
export class SessionManager {
  private sessions: Map<string, { expiresAt: number; userId: string }> = new Map();
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly WARNING_TIME = 5 * 60 * 1000; // 5 minutes

  createSession(userId: string): string {
    const sessionId = crypto.randomUUID();
    const expiresAt = Date.now() + this.SESSION_DURATION;
    
    this.sessions.set(sessionId, { expiresAt, userId });
    return sessionId;
  }

  validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return false;
    }
    
    return true;
  }

  extendSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.expiresAt = Date.now() + this.SESSION_DURATION;
    this.sessions.set(sessionId, session);
    return true;
  }

  getTimeUntilExpiry(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;
    
    return Math.max(0, session.expiresAt - Date.now());
  }

  shouldShowWarning(sessionId: string): boolean {
    const timeLeft = this.getTimeUntilExpiry(sessionId);
    return timeLeft > 0 && timeLeft <= this.WARNING_TIME;
  }

  invalidateSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getAllSessions(): Map<string, { expiresAt: number; userId: string }> {
    return new Map(this.sessions);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  sessionManager.cleanup();
}, 5 * 60 * 1000);
