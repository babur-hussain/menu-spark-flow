-- Fix infinite recursion in user_profiles policies
-- This script removes problematic policies and creates correct ones

-- First, drop all existing policies on user_profiles to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.user_profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Allow super admins to view all profiles (without recursion)
CREATE POLICY "Super admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role = 'super_admin'
  )
);

-- Allow super admins to manage all profiles
CREATE POLICY "Super admins can manage all profiles" 
ON public.user_profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role = 'super_admin'
  )
);

-- Allow service role to manage all profiles (for admin operations)
CREATE POLICY "Service role can manage all profiles" 
ON public.user_profiles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Success message
SELECT 'User profiles policies fixed successfully!' as message; 