
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface NavigationWrapperProps {
  children: React.ReactNode;
}

// Define user type to route mapping
const USER_ROUTE_MAP = {
  'student': '/student',
  'faculty': '/faculty', 
  'admin': '/admin',
  'super_admin': '/admin',
  'parent': '/parent',
  'alumni': '/alumni'
} as const;

const NavigationWrapper = ({ children }: NavigationWrapperProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (session: Session | null) => {
      if (!mounted) return;

      try {
        // Handle unauthenticated users
        if (!session) {
          localStorage.removeItem('colcord_user');
          sessionStorage.clear();
          
          if (currentPath !== '/') {
            navigate('/', { replace: true });
          }
          setLoading(false);
          return;
        }

        // Validate session server-side
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();
        
        if (sessionError || !user) {
          console.error('Session validation failed:', sessionError);
          await supabase.auth.signOut();
          navigate('/', { replace: true });
          setLoading(false);
          return;
        }

        // Get user profile with error handling
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          await supabase.auth.signOut();
          navigate('/', { replace: true });
          setLoading(false);
          return;
        }

        if (!profile) {
          console.error('No user profile found');
          await supabase.auth.signOut();
          navigate('/', { replace: true });
          setLoading(false);
          return;
        }

        // Validate user is active
        if (!profile.is_active) {
          console.error('User account is inactive');
          await supabase.auth.signOut();
          navigate('/', { replace: true });
          setLoading(false);
          return;
        }

        // Store profile in localStorage for quick access
        localStorage.setItem('colcord_user', JSON.stringify(profile));

        // Determine correct route
        const correctRoute = USER_ROUTE_MAP[profile.user_type as keyof typeof USER_ROUTE_MAP];
        
        if (!correctRoute) {
          console.error('Invalid user type:', profile.user_type);
          await supabase.auth.signOut();
          navigate('/', { replace: true });
          setLoading(false);
          return;
        }

        // Handle route navigation
        if (currentPath === '/') {
          navigate(correctRoute, { replace: true });
        } else if (!currentPath.startsWith(correctRoute.split('/')[1])) {
          // Only redirect if user is on completely wrong section
          navigate(correctRoute, { replace: true });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error handling auth state change:', error);
        await supabase.auth.signOut();
        navigate('/', { replace: true });
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        await handleAuthStateChange(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }
      
      handleAuthStateChange(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [currentPath, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default NavigationWrapper;
