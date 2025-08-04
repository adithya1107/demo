import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NavigationWrapperProps {
  children: React.ReactNode;
}

// Define user type to route mapping
const USER_ROUTE_MAP = {
  'student': '/student',
  'faculty': '/teacher', 
  'admin': '/admin',
  'super_admin': '/admin',
  'parent': '/parent',
  'alumni': '/alumni'
} as const;

const NavigationWrapper = ({ children }: NavigationWrapperProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session, loading: authLoading, isAuthenticated } = useAuth();
  const currentPath = location.pathname;
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Use ref to prevent multiple simultaneous navigation attempts
  const isNavigatingRef = useRef(false);

  // Fetch user profile when user changes
  const fetchProfile = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    // Prevent duplicate fetches
    if (profileLoading) return;

    // Check if we already have profile in localStorage
    const cachedProfile = localStorage.getItem('colcord_user');
    if (cachedProfile) {
      try {
        const parsedProfile = JSON.parse(cachedProfile);
        if (parsedProfile.id === user.id) {
          setProfile(parsedProfile);
          setProfileLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing cached profile:', error);
        localStorage.removeItem('colcord_user');
      }
    }

    setProfileLoading(true);
    
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setProfile(null);
        localStorage.removeItem('colcord_user');
        setProfileLoading(false);
        return;
      }

      if (!userProfile) {
        console.error('No user profile found');
        setProfile(null);
        localStorage.removeItem('colcord_user');
        setProfileLoading(false);
        return;
      }

      // Validate user is active
      if (!userProfile.is_active) {
        console.error('User account is inactive');
        setProfile(null);
        localStorage.removeItem('colcord_user');
        setProfileLoading(false);
        return;
      }

      // Store profile
      setProfile(userProfile);
      localStorage.setItem('colcord_user', JSON.stringify(userProfile));
      setProfileLoading(false);

    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
      setProfileLoading(false);
    }
  }, [user, isAuthenticated, profileLoading]);

  // Fetch profile when user changes
  useEffect(() => {
    fetchProfile();
  }, [user?.id, isAuthenticated]); // Only depend on user.id, not the entire user object

  // Handle navigation based on auth state and profile
  useEffect(() => {
    // Don't navigate while loading or if already navigating
    if (authLoading || profileLoading || isNavigatingRef.current) return;

    console.log('NavigationWrapper: Checking navigation', {
      isAuthenticated,
      currentPath,
      profileUserType: profile?.user_type,
      initialLoadComplete
    });

    const performNavigation = async () => {
      isNavigatingRef.current = true;

      try {
        // Handle unauthenticated users
        if (!isAuthenticated) {
          localStorage.removeItem('colcord_user');
          sessionStorage.clear();
          
          if (currentPath !== '/') {
            console.log('NavigationWrapper: Redirecting unauthenticated user to login');
            navigate('/', { replace: true });
          }
          setInitialLoadComplete(true);
          return;
        }

        // Handle authenticated users without profile
        if (isAuthenticated && !profile) {
          console.log('NavigationWrapper: Authenticated user without valid profile');
          // Don't navigate here, let useAuth handle the signout
          setInitialLoadComplete(true);
          return;
        }

        // Handle authenticated users with profile
        if (isAuthenticated && profile) {
          const correctRoute = USER_ROUTE_MAP[profile.user_type as keyof typeof USER_ROUTE_MAP];
          
          if (!correctRoute) {
            console.error('NavigationWrapper: Invalid user type:', profile.user_type);
            setInitialLoadComplete(true);
            return;
          }

          // If on login page, redirect to correct route
          if (currentPath === '/') {
            console.log('NavigationWrapper: Redirecting authenticated user to', correctRoute);
            navigate(correctRoute, { replace: true });
            setInitialLoadComplete(true);
            return;
          }

          // Check if user is on wrong section (only on initial load)
          if (!initialLoadComplete) {
            const currentSection = '/' + currentPath.split('/')[1];
            const correctSection = '/' + correctRoute.split('/')[1];
            
            if (currentSection !== correctSection) {
              console.log('NavigationWrapper: User on wrong section, redirecting from', currentSection, 'to', correctRoute);
              navigate(correctRoute, { replace: true });
              setInitialLoadComplete(true);
              return;
            }
          }
          
          setInitialLoadComplete(true);
        }
      } finally {
        isNavigatingRef.current = false;
      }
    };

    performNavigation();
  }, [authLoading, profileLoading, isAuthenticated, profile, currentPath, navigate, initialLoadComplete]);

  // Show loading while auth is initializing or profile is loading
  if (authLoading || profileLoading || !initialLoadComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default NavigationWrapper;