-- CRITICAL SECURITY FIX: Enable RLS on all tables that have it disabled
-- This is urgent as it prevents unauthorized data access

-- Enable RLS on all tables that currently have policies but RLS disabled
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gradebook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_room_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

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

CREATE OR REPLACE FUNCTION public.get_student_academic_summary(student_uuid uuid, parent_uuid uuid)
RETURNS TABLE(course_name text, instructor_name text, current_grade text, attendance_percentage numeric, total_assignments integer, submitted_assignments integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$BEGIN
  -- Verify parent-student relationship
  IF NOT EXISTS (
    SELECT 1 FROM public.parent_student_links 
    WHERE parent_id = parent_uuid AND student_id = student_uuid
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to student data';
  END IF;

  RETURN QUERY
  SELECT 
    c.course_name,
    CONCAT(up.first_name, ' ', up.last_name) as instructor_name,
    e.grade as current_grade,
    COALESCE(
      (SELECT ROUND(
        (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
         NULLIF(COUNT(*), 0)), 2
      ) FROM public.attendance a WHERE a.student_id = student_uuid AND a.course_id = c.id),
      0
    ) as attendance_percentage,
    (SELECT COUNT(*) FROM public.assignments ass WHERE ass.course_id = c.id) as total_assignments,
    (SELECT COUNT(*) FROM public.assignment_submissions asub 
     JOIN public.assignments ass ON ass.id = asub.assignment_id 
     WHERE asub.student_id = student_uuid AND ass.course_id = c.id) as submitted_assignments
  FROM public.enrollments e
  JOIN public.courses c ON c.id = e.course_id
  LEFT JOIN public.user_profiles up ON up.id = c.instructor_id
  WHERE e.student_id = student_uuid
  AND e.status = 'enrolled';
END;$function$;

CREATE OR REPLACE FUNCTION public.has_resource_permission(user_uuid uuid, college_uuid uuid, resource resource_type, action permission_action)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_roles ar
        JOIN public.role_permissions rp ON rp.role_type = ar.admin_role_type
        WHERE ar.user_id = user_uuid 
        AND ar.college_id = college_uuid
        AND ar.is_active = true
        AND rp.resource_type = resource
        AND rp.action = action
        AND rp.is_allowed = true
    );
END;$function$;

CREATE OR REPLACE FUNCTION public.validate_user_login(p_college_code text, p_user_code text, p_user_password text)
RETURNS TABLE(login_success boolean, user_id uuid, user_type text, first_name text, last_name text, email text, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN up.password = p_user_password THEN true
      ELSE false
    END as login_success,
    up.id as user_id,
    up.user_type::TEXT,
    up.first_name,
    up.last_name,
    up.email,
    CASE 
      WHEN up.id IS NULL THEN 'User not found'
      WHEN up.password != p_user_password THEN 'Invalid password'
      ELSE NULL
    END as error_message
  FROM public.user_profiles up
  JOIN public.colleges c ON up.college_id = c.id
  WHERE c.code = p_college_code
    AND up.user_code = p_user_code
    AND up.is_active = true;
END;$function$;

CREATE OR REPLACE FUNCTION public.get_alumni_stats(college_uuid uuid)
RETURNS TABLE(total_alumni integer, active_contributors integer, total_donations numeric, upcoming_events integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.user_profiles WHERE college_id = college_uuid AND user_type = 'alumni'),
    (SELECT COUNT(DISTINCT alumnus_id)::INTEGER FROM public.alumni_contributions WHERE college_id = college_uuid AND status = 'completed'),
    (SELECT COALESCE(SUM(amount), 0) FROM public.alumni_contributions WHERE college_id = college_uuid AND status = 'completed' AND contribution_type = 'donation'),
    (SELECT COUNT(*)::INTEGER FROM public.events WHERE college_id = college_uuid AND start_date > CURRENT_DATE AND is_active = true);
END;$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$BEGIN
  -- Insert into user_profiles table when a new user is created in auth.users
  INSERT INTO public.user_profiles (
    id,
    college_id,
    user_code,
    user_type,
    first_name,
    last_name,
    email,
    is_active,
    created_at,
    updated_at,
    hierarchy_level
  )
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'college_id')::uuid,
    NEW.raw_user_meta_data->>'user_code',
    (NEW.raw_user_meta_data->>'user_type')::public.user_type,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email,
    true,
    NOW(),
    NOW(),
    (NEW.raw_user_meta_data->>'hierarchy_level')::public.user_hierarchy_level
  );
  
  RETURN NEW;
END;$function$;

CREATE OR REPLACE FUNCTION public.get_user_email(college_code text, user_code text)
RETURNS TABLE(user_exists boolean, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN up.id IS NOT NULL THEN true
      ELSE false
    END as user_exists,
    up.email
  FROM public.user_profiles up
  JOIN public.colleges c ON up.college_id = c.id
  WHERE c.code = college_code
    AND up.user_code = get_user_email.user_code
    AND up.is_active = true;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.has_permission(user_uuid uuid, permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.get_user_permissions(user_uuid) gup
        WHERE (gup.permissions -> permission_name)::BOOLEAN = true
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_admin_roles(user_uuid uuid, college_uuid uuid)
RETURNS TABLE(role_type admin_role_type, permissions jsonb, assigned_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        ar.admin_role_type,
        ar.permissions,
        ar.assigned_at
    FROM public.admin_roles ar
    WHERE ar.user_id = user_uuid 
    AND ar.college_id = college_uuid
    AND ar.is_active = true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_college_user(college_code text, user_code text)
RETURNS TABLE(college_id uuid, college_name text, college_logo text, primary_color text, secondary_color text, user_exists boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.logo,
        c.primary_color,
        c.secondary_color,
        EXISTS(
            SELECT 1 FROM public.user_profiles up 
            WHERE up.college_id = c.id 
            AND up.user_code = validate_college_user.user_code
            AND up.is_active = true
        ) as user_exists
    FROM public.colleges c
    WHERE c.code = college_code;
END;$function$;

CREATE OR REPLACE FUNCTION public.has_admin_permission(user_uuid uuid, college_uuid uuid, required_role admin_role_type)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_roles ar
        WHERE ar.user_id = user_uuid 
        AND ar.college_id = college_uuid
        AND ar.admin_role_type = required_role
        AND ar.is_active = true
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_college_by_code(college_code text)
RETURNS TABLE(id uuid, code text, name text, logo text, primary_color text, secondary_color text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$BEGIN
    RETURN QUERY
    SELECT c.id, c.code, c.name, c.logo, c.primary_color, c.secondary_color
    FROM public.colleges c
    WHERE c.code = college_code;
END;$function$;

CREATE OR REPLACE FUNCTION public.log_admin_action(college_uuid uuid, admin_uuid uuid, target_uuid uuid, action_type_param text, action_desc text, module_param text, old_vals jsonb DEFAULT NULL::jsonb, new_vals jsonb DEFAULT NULL::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        college_id,
        admin_user_id,
        target_user_id,
        action_type,
        action_description,
        module,
        old_values,
        new_values
    ) VALUES (
        college_uuid,
        admin_uuid,
        target_uuid,
        action_type_param,
        action_desc,
        module_param,
        old_vals,
        new_vals
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;$function$;

CREATE OR REPLACE FUNCTION public.generate_temp_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$BEGIN
    -- Generate a random 8-character password with mixed case and numbers
    RETURN array_to_string(
        ARRAY(
            SELECT chr(
                CASE 
                    WHEN random() < 0.33 THEN 48 + floor(random() * 10)::int -- 0-9
                    WHEN random() < 0.66 THEN 65 + floor(random() * 26)::int -- A-Z
                    ELSE 97 + floor(random() * 26)::int -- a-z
                END
            )
            FROM generate_series(1, 8)
        ), 
        ''
    );
END;$function$;

CREATE OR REPLACE FUNCTION public.generate_user_code(college_code text, user_type_param text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$DECLARE
    year_suffix TEXT;
    type_prefix TEXT;
    sequence_num INTEGER;
    user_code TEXT;
BEGIN
    -- Get current year suffix (last 2 digits)
    year_suffix := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);
    
    -- Set type prefix based on user type
    type_prefix := CASE 
        WHEN user_type_param = 'student' THEN 'S'
        WHEN user_type_param = 'faculty' THEN 'F'
        WHEN user_type_param = 'staff' THEN 'T'
        WHEN user_type_param = 'admin' THEN 'A'
        WHEN user_type_param = 'parent' THEN 'P'
        WHEN user_type_param = 'alumni' THEN 'L'
        ELSE 'U'
    END;
    
    -- Get next sequence number for this college and type
    SELECT COALESCE(MAX(
        CAST(RIGHT(user_code, 4) AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM public.user_profiles up
    JOIN public.colleges c ON c.id = up.college_id
    WHERE c.code = college_code
    AND up.user_type = user_type_param::public.user_type_enum;
    
    -- Format: COLLEGE_CODE + TYPE_PREFIX + YEAR + SEQUENCE (4 digits)
    user_code := college_code || type_prefix || year_suffix || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN user_code;
END;$function$;