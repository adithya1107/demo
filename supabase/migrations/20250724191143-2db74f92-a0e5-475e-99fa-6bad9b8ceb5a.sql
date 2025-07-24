-- CRITICAL SECURITY FIX: Enable RLS on existing tables only
-- Fix the most critical RLS issues first

-- Enable RLS on tables that exist and have policies but RLS disabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Fix database functions security by setting proper search_path
-- This prevents SQL injection attacks via search path manipulation

CREATE OR REPLACE FUNCTION public.get_parent_children(parent_uuid uuid)
RETURNS TABLE(student_id uuid, student_name text, user_code text, relationship_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$BEGIN
  RETURN QUERY
  SELECT 
    psl.student_id,
    CONCAT(up.first_name, ' ', up.last_name) as student_name,
    up.user_code,
    psl.relationship_type
  FROM public.parent_student_links psl
  JOIN public.user_profiles up ON up.id = psl.student_id
  WHERE psl.parent_id = parent_uuid
  AND up.is_active = true;
END;$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid, college_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_roles 
        WHERE user_id = user_uuid 
        AND college_id = college_uuid
        AND admin_role_type = 'super_admin'
        AND is_active = true
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(user_uuid uuid)
RETURNS TABLE(user_type text, college_id uuid, permissions jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_type::TEXT,
        up.college_id,
        CASE up.user_type
            WHEN 'student' THEN '{"dashboard": true, "assignments": true, "grades_view": true, "attendance_view": true, "forums": true, "fees_view": true, "fees_pay": true, "certificates": true, "hostel": true, "facility_requests": true, "support": true}'::JSONB
            WHEN 'faculty' THEN '{"dashboard": true, "assignments": true, "grades_manage": true, "attendance_mark": true, "attendance_view": true, "materials_upload": true, "forums": true, "fees_review": true, "certificates": true, "facility_requests": true, "support": true}'::JSONB
            WHEN 'parent' THEN '{"dashboard": true, "grades_view_child": true, "attendance_view_child": true, "fees_view_child": true, "fees_pay_child": true, "support": true}'::JSONB
            WHEN 'alumni' THEN '{"dashboard": true, "forums": true, "certificates": true, "contributions": true, "alumni_events": true, "support": true}'::JSONB
            ELSE '{}'::JSONB
        END as permissions
    FROM public.user_profiles up
    WHERE up.id = user_uuid;
END;
$function$;

-- Add proper RLS policies for user_profiles to prevent unauthorized access
CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.user_profiles  
FOR UPDATE USING (id = auth.uid());

-- Super admins can manage all profiles in their college
CREATE POLICY "Super admins can manage profiles" ON public.user_profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar 
    WHERE ar.user_id = auth.uid() 
    AND ar.college_id = user_profiles.college_id
    AND ar.admin_role_type = 'super_admin'
    AND ar.is_active = true
  )
);

-- Add proper RLS policies for parent_student_links
CREATE POLICY "Parents can view their student links" ON public.parent_student_links
FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Admins can manage parent student links" ON public.parent_student_links
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.admin_roles ar ON ar.user_id = up.id
    WHERE up.id = auth.uid() 
    AND ar.college_id = up.college_id
    AND ar.admin_role_type IN ('super_admin', 'user_admin')
    AND ar.is_active = true
  )
);