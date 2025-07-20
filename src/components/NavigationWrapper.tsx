
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
  'faculty': '/teacher',
  'teacher': '/teacher',
  'admin': '/admin',
  'super_admin': '/admin',
  'parent': '/parent',
  'alumni': '/alumni'
} as const;

const NavigationWrapper = ({ children }: NavigationWrapperProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (session: Session | null) => {
      if (!mounted) return;

      // Handle unauthenticated users
      if (!session) {
        localStorage.removeItem('colcord_user');
        setLoading(false);
        
        if (currentPath !== '/') {
          navigate('/', { replace: true });
        }
        return;
      }

      // Handle authenticated users
      try {
        // Get user profile to determine their type and route
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
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

        // Store user profile in localStorage for component access
        localStorage.setItem('colcord_user', JSON.stringify(profile));

        const correctRoute = USER_ROUTE_MAP[profile.user_type as keyof typeof USER_ROUTE_MAP];
        
        if (!correctRoute) {
          console.error('Invalid user type:', profile.user_type);
          await supabase.auth.signOut();
          navigate('/', { replace: true });
          setLoading(false);
          return;
        }

        // Redirect from login page to user's dashboard
        if (currentPath === '/') {
          navigate(correctRoute, { replace: true });
        } else if (currentPath !== correctRoute) {
          // Redirect if user is on wrong route
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
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        handleAuthStateChange(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
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
