
import { supabase } from '@/integrations/supabase/client';

// Session security utilities
export class SessionManager {
  private static instance: SessionManager;
  private sessionTimeout: number = 30 * 60 * 1000; // 30 minutes
  private warningTimeout: number = 5 * 60 * 1000; // 5 minutes before expiry
  private activityTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private onWarning?: () => void;
  private onTimeout?: () => void;

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public startSession(onWarning?: () => void, onTimeout?: () => void): void {
    this.onWarning = onWarning;
    this.onTimeout = onTimeout;
    this.resetTimer();
    this.setupActivityListeners();
  }

  public endSession(): void {
    this.clearTimers();
    this.removeActivityListeners();
  }

  private resetTimer(): void {
    this.clearTimers();
    
    // Set warning timer
    this.warningTimer = setTimeout(() => {
      this.onWarning?.();
    }, this.sessionTimeout - this.warningTimeout);
    
    // Set timeout timer
    this.activityTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.sessionTimeout);
  }

  private clearTimers(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private handleSessionTimeout(): void {
    this.endSession();
    this.signOut();
    this.onTimeout?.();
  }

  private async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, this.handleUserActivity, true);
    });
  }

  private removeActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity, true);
    });
  }

  private handleUserActivity = (): void => {
    this.resetTimer();
  };

  public extendSession(): void {
    this.resetTimer();
  }
}

export const validateSessionIntegrity = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }

    // Check if session is expired
    const now = new Date().getTime();
    const expiresAt = new Date(session.expires_at || 0).getTime();
    
    if (now >= expiresAt) {
      await supabase.auth.signOut();
      return false;
    }

    // Validate session with server
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      await supabase.auth.signOut();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

export const refreshSession = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      await supabase.auth.signOut();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Session refresh error:', error);
    return false;
  }
};
