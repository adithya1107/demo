
import { supabase } from '@/integrations/supabase/client';
import { auditLogger } from './auditLogger';

// Session security utilities
export const validateSessionIntegrity = async (): Promise<boolean> => {
  try {
    // Check if we have a valid session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session validation error:', error);
      return false;
    }

    if (!session) {
      return false;
    }

    // Check if session is expired
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      console.warn('Session expired');
      return false;
    }

    // Verify with server
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User validation error:', userError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Session integrity check failed:', error);
    return false;
  }
};

export const secureLogout = async (): Promise<void> => {
  try {
    // Log the logout event
    await auditLogger.logUserAction(
      'user_logout',
      'User initiated logout',
      'authentication'
    );

    // Clear Supabase session
    await supabase.auth.signOut();
    
    // Clear all local storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cookies if needed
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    // Force clear even on error
    localStorage.clear();
    sessionStorage.clear();
  }
};

export const refreshSessionIfNeeded = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }

    // Check if session expires within 5 minutes
    const expiresAt = session.expires_at * 1000;
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    
    if (expiresAt < fiveMinutesFromNow) {
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !newSession) {
        console.error('Session refresh failed:', refreshError);
        return false;
      }
      
      console.log('Session refreshed successfully');
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Session refresh check failed:', error);
    return false;
  }
};
