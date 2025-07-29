
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiGateway } from '@/utils/apiGateway';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_code: string;
  user_type: 'super_admin' | 'faculty' | 'staff' | 'admin' | 'student' | 'parent' | 'alumni';
  college_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hierarchy_level: 'super_admin' | 'faculty' | 'admin' | 'student' | 'parent' | 'alumni' | 'staff';
}

export const useUserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      if (!user) {
        if (mounted) {
          setProfile(null);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        setError(null);
        const response = await apiGateway.select('user_profiles', {
          filters: { id: user.id },
          limit: 1
        });

        if (!mounted) return;

        if (response.success && response.data && response.data.length > 0) {
          const profileData = response.data[0] as UserProfile;
          setProfile({
            ...profileData,
            hierarchy_level: profileData.user_type === 'staff' ? 'admin' : profileData.user_type
          });
          setError(null);
        } else {
          setError('Profile not found');
          setProfile(null);
        }
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        if (mounted) {
          setError('Failed to fetch profile');
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
      fetchProfile();
    }

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return { error: 'No user or profile found' };

    try {
      const response = await apiGateway.update('user_profiles', updates, { id: user.id });

      if (response.success && response.data) {
        setProfile(response.data as UserProfile);
        return { data: response.data };
      } else {
        return { error: response.error || 'Failed to update profile' };
      }
    } catch (err) {
      return { error: 'Failed to update profile' };
    }
  };

  return {
    profile,
    loading: loading || authLoading,
    error,
    updateProfile,
  };
};
