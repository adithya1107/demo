
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (session: Session | null) => {
      if (!mounted) return;

      // Handle unauthenticated users
      if (!session) {
        // Clear all client-side authentication data
        localStorage.removeItem('colcord_user');
        sessionStorage.clear();
        setLoading(false);
        
        if (currentPath !== '/') {
          navigate('/', { replace: true });
        }
        return;
      }

      // Handle authenticated users with server-side validation
      try {
        console.log('Validating session server-side...');
        
        // Validate session with server - this prevents client-side manipulation
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();
        
        if (sessionError || !user) {
          console.error('Session validation failed:', sessionError);
          await supabase.auth.signOut();
          navigate('/', { replace: true });
          setLoading(false);
          return;
        }

        // Get user profile with proper server-side validation
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

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

        // Get and validate admin roles from database (server-side)
        let adminRoles = [];
        if (profile.user_type === 'admin' || profile.user_type === 'super_admin') {
          const { data: roles, error: rolesError } = await supabase
            .from('admin_roles')
            .select('*')
            .eq('user_id', user.id)
            .eq('college_id', profile.college_id)
            .eq('is_active', true);

          if (rolesError) {
            console.error('Error fetching admin roles:', rolesError);
            // If admin role validation fails, treat as regular user
            adminRoles = [];
          } else {
            adminRoles = roles || [];
          }
        }

        // Enhanced profile with validated admin roles
        const enhancedProfile = {
          ...profile,
          admin_roles: adminRoles,
          // Only set hierarchy_level based on actual validated roles
          hierarchy_level: adminRoles.find(r => r.admin_role_type === 'super_admin') 
            ? 'super_admin' 
            : adminRoles.length > 0 
              ? 'admin' 
              : profile.user_type
        };

        // Store validated profile in localStorage (but rely on server validation)
        localStorage.setItem('colcord_user', JSON.stringify(enhancedProfile));

        // Determine correct route based on actual user type
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
          // Check if user is trying to access admin route
          if (currentPath === '/admin' && profile.user_type !== 'admin' && profile.user_type !== 'super_admin') {
            console.warn('Unauthorized access attempt to admin route');
            navigate(correctRoute, { replace: true });
          } else if (currentPath !== correctRoute) {
            // Redirect if user is on wrong route for their type
            navigate(correctRoute, { replace: true });
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error handling auth state change:', error);
        await supabase.auth.signOut();
        navigate('/', { replace: true });
        setLoading(false);
      }
    };

    // Set up auth state listener with enhanced security
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Log security events for monitoring
        if (event === 'SIGNED_OUT') {
          console.log('User signed out - clearing all client data');
          localStorage.clear();
          sessionStorage.clear();
        }
        
        setSession(session);
        await handleAuthStateChange(session);
      }
    );

    // Check for existing session with server validation
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }
      
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
