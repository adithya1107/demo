
import { supabase } from '@/integrations/supabase/client';

export interface SessionInfo {
  sessionId: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
  isValid: boolean;
}

export const validateSessionIntegrity = async (sessionId: string): Promise<boolean> => {
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
