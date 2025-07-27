
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

export interface UserPermissions {
  // Dashboard & Profile
  view_personal_dashboard: boolean;
  view_college_branding: boolean;
  
  // Academic
  view_submit_assignments: boolean;
  review_assignments: boolean;
  view_grades: boolean;
  assign_grades: boolean;
  view_child_grades: boolean;
  mark_attendance: boolean;
  view_attendance: boolean;
  view_child_attendance: boolean;
  upload_materials: boolean;
  
  // Communication
  join_forums: boolean;
  
  // Financial
  view_fees: boolean;
  review_fees: boolean;
  view_child_fees: boolean;
  make_payments: boolean;
  make_child_payments: boolean;
  
  // Services
  request_certificates: boolean;
  apply_hostel: boolean;
  facility_requests: boolean;
  support_tickets: boolean;
  
  // Alumni specific
  alumni_contributions: boolean;
  alumni_events: boolean;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  view_personal_dashboard: false,
  view_college_branding: false,
  view_submit_assignments: false,
  review_assignments: false,
  view_grades: false,
  assign_grades: false,
  view_child_grades: false,
  mark_attendance: false,
  view_attendance: false,
  view_child_attendance: false,
  upload_materials: false,
  join_forums: false,
  view_fees: false,
  review_fees: false,
  view_child_fees: false,
  make_payments: false,
  make_child_payments: false,
  request_certificates: false,
  apply_hostel: false,
  facility_requests: false,
  support_tickets: false,
  alumni_contributions: false,
  alumni_events: false,
};

// Permission sets for different user types
const PERMISSION_SETS = {
  student: {
    view_personal_dashboard: true,
    view_college_branding: true,
    view_submit_assignments: true,
    view_grades: true,
    view_attendance: true,
    join_forums: true,
    view_fees: true,
    make_payments: true,
    request_certificates: true,
    apply_hostel: true,
    facility_requests: true,
    support_tickets: true,
  },
  faculty: {
    view_personal_dashboard: true,
    view_college_branding: true,
    view_submit_assignments: true,
    review_assignments: true,
    view_grades: true,
    assign_grades: true,
    mark_attendance: true,
    view_attendance: true,
    upload_materials: true,
    join_forums: true,
    view_fees: true,
    review_fees: true,
    request_certificates: true,
    facility_requests: true,
    support_tickets: true,
  },
  parent: {
    view_personal_dashboard: true,
    view_college_branding: true,
    view_child_grades: true,
    view_child_attendance: true,
    view_child_fees: true,
    make_child_payments: true,
    support_tickets: true,
  },
  alumni: {
    view_personal_dashboard: true,
    view_college_branding: true,
    join_forums: true,
    request_certificates: true,
    alumni_contributions: true,
    alumni_events: true,
    support_tickets: true,
  },
  admin: {
    view_personal_dashboard: true,
    view_college_branding: true,
    view_submit_assignments: true,
    review_assignments: true,
    view_grades: true,
    assign_grades: true,
    view_child_grades: true,
    mark_attendance: true,
    view_attendance: true,
    view_child_attendance: true,
    upload_materials: true,
    join_forums: true,
    view_fees: true,
    review_fees: true,
    view_child_fees: true,
    make_payments: true,
    make_child_payments: true,
    request_certificates: true,
    apply_hostel: true,
    facility_requests: true,
    support_tickets: true,
    alumni_contributions: true,
    alumni_events: true,
  },
};

export const usePermissions = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserPermissions = async () => {
      if (!user || !profile) {
        setPermissions(DEFAULT_PERMISSIONS);
        setLoading(false);
        return;
      }

      try {
        // Verify user is active
        if (!profile.is_active) {
          console.error('User account is inactive');
          setPermissions(DEFAULT_PERMISSIONS);
          setLoading(false);
          return;
        }

        const userTypeKey = profile.user_type === 'faculty' ? 'faculty' : profile.user_type;
        
        // Get permissions for user type
        const userPermissions = PERMISSION_SETS[userTypeKey as keyof typeof PERMISSION_SETS];
        
        if (userPermissions) {
          // For admin users, get additional permissions from database
          if (profile.user_type === 'admin') {
            try {
              const { data: adminRoles, error: rolesError } = await supabase
                .from('admin_roles')
                .select('admin_role_type, permissions, is_active')
                .eq('user_id', user.id)
                .eq('college_id', profile.college_id)
                .eq('is_active', true);

              if (!rolesError && adminRoles && adminRoles.length > 0) {
                // Merge admin permissions with base permissions
                const enhancedPermissions = { ...DEFAULT_PERMISSIONS, ...userPermissions };
                
                // Add admin-specific permissions based on roles
                adminRoles.forEach(role => {
                  if (role.admin_role_type === 'super_admin') {
                    // Super admin gets all permissions
                    Object.keys(enhancedPermissions).forEach(key => {
                      enhancedPermissions[key as keyof UserPermissions] = true;
                    });
                  } else if (role.permissions && typeof role.permissions === 'object') {
                    // Apply role-specific permissions
                    Object.keys(role.permissions).forEach(key => {
                      if (key in enhancedPermissions) {
                        enhancedPermissions[key as keyof UserPermissions] = Boolean(role.permissions[key]);
                      }
                    });
                  }
                });
                
                setPermissions(enhancedPermissions);
              } else {
                // No admin roles found, use base permissions
                setPermissions({ ...DEFAULT_PERMISSIONS, ...userPermissions });
              }
            } catch (error) {
              console.error('Error loading admin roles:', error);
              // Fallback to base permissions if admin role check fails
              setPermissions({ ...DEFAULT_PERMISSIONS, ...userPermissions });
            }
          } else {
            // Regular user, use base permissions
            setPermissions({ ...DEFAULT_PERMISSIONS, ...userPermissions });
          }
        } else {
          console.warn('Unknown user type:', userTypeKey);
          setPermissions(DEFAULT_PERMISSIONS);
        }
      } catch (error) {
        console.error('Error loading user permissions:', error);
        setPermissions(DEFAULT_PERMISSIONS);
      } finally {
        setLoading(false);
      }
    };

    if (!profileLoading) {
      loadUserPermissions();
    }
  }, [user, profile, profileLoading]);

  return { 
    permissions, 
    userType: profile?.user_type, 
    loading: loading || profileLoading,
    userId: user?.id,
    profile
  };
};
