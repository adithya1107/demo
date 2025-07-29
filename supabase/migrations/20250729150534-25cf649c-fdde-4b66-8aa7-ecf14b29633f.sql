-- Fix critical RLS security issues

-- Enable RLS on tables where it's disabled but policies exist
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create missing RLS policies for notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can mark their notifications as read" ON public.notifications
FOR UPDATE USING (recipient_id = auth.uid());

-- Create missing RLS policies for system_settings table  
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system settings" ON public.system_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    JOIN public.user_profiles up ON ar.user_id = up.id
    WHERE up.id = auth.uid() 
    AND ar.is_active = true
    AND (ar.admin_role_type = 'super_admin' OR ar.admin_role_type = 'it_admin')
  )
);

-- Create missing RLS policies for fee_transactions table
ALTER TABLE public.fee_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own fee transactions" ON public.fee_transactions
FOR SELECT USING (
  student_id = auth.uid()
);

CREATE POLICY "Parents can view their children's fee transactions" ON public.fee_transactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    WHERE psl.parent_id = auth.uid() 
    AND psl.student_id = fee_transactions.student_id
  )
);

CREATE POLICY "Admins can manage fee transactions" ON public.fee_transactions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    JOIN public.user_profiles up ON ar.user_id = up.id
    WHERE up.id = auth.uid() 
    AND ar.is_active = true
    AND (ar.admin_role_type = 'super_admin' OR ar.admin_role_type = 'finance_admin')
  )
);

-- Fix user_profiles RLS policies for proper college isolation
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.user_profiles  
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view users in their college" ON public.user_profiles
FOR SELECT USING (
  college_id = (
    SELECT up.college_id FROM public.user_profiles up 
    WHERE up.id = auth.uid()
  ) AND EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() 
    AND ar.college_id = user_profiles.college_id
    AND ar.is_active = true
  )
);

CREATE POLICY "Admins can manage users in their college" ON public.user_profiles
FOR ALL USING (
  college_id = (
    SELECT up.college_id FROM public.user_profiles up 
    WHERE up.id = auth.uid()
  ) AND EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() 
    AND ar.college_id = user_profiles.college_id
    AND ar.is_active = true
    AND (ar.admin_role_type = 'super_admin' OR ar.admin_role_type = 'user_admin')
  )
);