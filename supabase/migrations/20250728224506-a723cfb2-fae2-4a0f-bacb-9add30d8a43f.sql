
-- First, let's create the missing marketplace tables
CREATE TABLE public.marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  condition TEXT DEFAULT 'good',
  images TEXT[],
  seller_id UUID NOT NULL,
  college_id UUID NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.marketplace_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS on marketplace tables
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for marketplace_items
CREATE POLICY "College users can view marketplace items" 
  ON public.marketplace_items 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() AND up.college_id = marketplace_items.college_id
  ));

CREATE POLICY "Users can create marketplace items" 
  ON public.marketplace_items 
  FOR INSERT 
  WITH CHECK (
    seller_id = auth.uid() AND 
    college_id = (SELECT college_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Sellers can update their items" 
  ON public.marketplace_items 
  FOR UPDATE 
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can delete their items" 
  ON public.marketplace_items 
  FOR DELETE 
  USING (seller_id = auth.uid());

-- Create RLS policies for marketplace_transactions
CREATE POLICY "Users can view their transactions" 
  ON public.marketplace_transactions 
  FOR SELECT 
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create transactions" 
  ON public.marketplace_transactions 
  FOR INSERT 
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Users can update their transactions" 
  ON public.marketplace_transactions 
  FOR UPDATE 
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Enable RLS on user_profiles (CRITICAL FIX)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles in their college" 
  ON public.user_profiles 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM admin_roles ar 
    WHERE ar.user_id = auth.uid() 
    AND ar.college_id = user_profiles.college_id 
    AND ar.is_active = true
  ));

-- Fix the college validation function to work properly
CREATE OR REPLACE FUNCTION public.validate_college_code(college_code text)
RETURNS TABLE(
  college_id uuid,
  college_name text,
  college_logo text,
  primary_color text,
  secondary_color text,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.logo,
    c.primary_color,
    c.secondary_color,
    true as is_valid
  FROM public.colleges c
  WHERE c.code = college_code;
  
  -- If no results, return false
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      null::uuid,
      null::text,
      null::text,
      null::text,
      null::text,
      false as is_valid;
  END IF;
END;
$$;

-- Create a proper login validation function
CREATE OR REPLACE FUNCTION public.validate_login(
  p_college_code text,
  p_user_code text,
  p_password text
)
RETURNS TABLE(
  success boolean,
  user_id uuid,
  email text,
  user_type text,
  first_name text,
  last_name text,
  college_id uuid,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN up.password = p_password THEN true
      ELSE false
    END as success,
    up.id as user_id,
    up.email,
    up.user_type::text,
    up.first_name,
    up.last_name,
    up.college_id,
    CASE 
      WHEN up.id IS NULL THEN 'User not found'
      WHEN up.password != p_password THEN 'Invalid password'
      WHEN NOT up.is_active THEN 'User account is deactivated'
      ELSE null
    END as error_message
  FROM public.user_profiles up
  JOIN public.colleges c ON up.college_id = c.id
  WHERE c.code = p_college_code
    AND up.user_code = p_user_code
    AND up.is_active = true;
END;
$$;

-- Create missing RLS policies for channel_members
CREATE POLICY "Users can view channel memberships" 
  ON public.channel_members 
  FOR SELECT 
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM channel_members cm 
    WHERE cm.channel_id = channel_members.channel_id 
    AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Users can join channels" 
  ON public.channel_members 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave channels" 
  ON public.channel_members 
  FOR DELETE 
  USING (user_id = auth.uid());
